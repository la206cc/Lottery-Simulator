"""Zero-dependency HTTP server for the local v4.0 workbench."""

from __future__ import annotations

import argparse
import csv
import io
import json
import mimetypes
import threading
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .backtest import available_wager_types, run_backtest, wager_presets
from .engine import STRATEGIES, recommend
from .profile import build_profile
from .rules import LOTTERIES
from .snapshot_store import SnapshotStore
from .sources import SourceError
from .store import DATA_DIR, DrawStore


ROOT = Path(__file__).resolve().parents[1]
WEB_DIR = ROOT / "web"
store = DrawStore(DATA_DIR)
snapshot_store = SnapshotStore(DATA_DIR / "state" / "parameter_snapshots.json")
_recommendation_lock = threading.Lock()


class ApiError(RuntimeError):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


class Handler(BaseHTTPRequestHandler):
    server_version = "LotteryReverseLab/4.0"

    def log_message(self, format_string: str, *args: object) -> None:
        print(f"[v4.0] {self.address_string()} {format_string % args}")

    def _json(self, payload: object, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _error(self, message: str, status: int = 400) -> None:
        self._json({"error": message}, status)

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 2_000_000:
            raise ApiError("请求体过大", 413)
        try:
            return json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError as exc:
            raise ApiError("请求 JSON 格式错误") from exc

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/health":
                self._json({"ok": True, "version": "4.0"})
                return
            if parsed.path == "/api/dashboard":
                lottery_id = self._lottery_param(parsed.query)
                records = store.load(lottery_id)
                self._json(
                    {
                        "lottery": lottery_id,
                        "profile": build_profile(lottery_id, records),
                        "manifest": store.manifest(),
                        "rules": {
                            "price": LOTTERIES[lottery_id].price,
                            "total_combinations": LOTTERIES[lottery_id].total_combinations,
                            "zones": [
                                {
                                    "name": LOTTERIES[lottery_id].main.name,
                                    "min": LOTTERIES[lottery_id].main.minimum,
                                    "max": LOTTERIES[lottery_id].main.maximum,
                                    "count": LOTTERIES[lottery_id].main.count,
                                },
                                {
                                    "name": LOTTERIES[lottery_id].bonus.name,
                                    "min": LOTTERIES[lottery_id].bonus.minimum,
                                    "max": LOTTERIES[lottery_id].bonus.maximum,
                                    "count": LOTTERIES[lottery_id].bonus.count,
                                },
                            ],
                        },
                        "wager_options": {
                            "types": available_wager_types(lottery_id),
                            "presets": wager_presets(lottery_id),
                        },
                        "strategies": [
                            {"id": strategy_id, **definition}
                            for strategy_id, definition in STRATEGIES.items()
                        ],
                    }
                )
                return
            if parsed.path == "/api/history":
                lottery_id = self._lottery_param(parsed.query)
                query = parse_qs(parsed.query)
                page = max(1, int(query.get("page", ["1"])[0]))
                page_size = max(1, min(100, int(query.get("page_size", ["20"])[0])))
                records = list(reversed(store.load(lottery_id)))
                start = (page - 1) * page_size
                self._json(
                    {
                        "records": records[start : start + page_size],
                        "total": len(records),
                        "page": page,
                        "page_size": page_size,
                    }
                )
                return
            if parsed.path == "/api/export":
                self._export_csv(parsed.query)
                return
            if parsed.path == "/api/snapshots":
                query = parse_qs(parsed.query)
                lottery_id = query.get("lottery", [None])[0]
                if lottery_id is not None and lottery_id not in LOTTERIES:
                    raise ApiError("不支持的彩种")
                snapshots = snapshot_store.list(lottery_id)
                self._json(
                    {
                        "snapshots": snapshots,
                        "count": len(snapshots),
                        "limit_per_lottery": snapshot_store.per_lottery_limit,
                    }
                )
                return
            self._serve_static(parsed.path)
        except ApiError as exc:
            self._error(str(exc), exc.status)
        except Exception as exc:
            self._error(f"服务器处理失败：{exc}", 500)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/recommend":
                body = self._body()
                lottery_id = str(body.get("lottery", "ssq"))
                if lottery_id not in LOTTERIES:
                    raise ApiError("不支持的彩种")
                with _recommendation_lock:
                    result = recommend(
                        lottery_id,
                        store.load(lottery_id),
                        target_min=_optional_int(body.get("target_min")),
                        target_max=_optional_int(body.get("target_max")),
                        actual_entries=_optional_int(body.get("actual_entries")),
                        candidate_pool=_optional_int(body.get("candidate_pool")) or 6000,
                        ticket_sample=_optional_int(body.get("ticket_sample")) or 30_000,
                        history_influence=_optional_float(body.get("history_influence"), 0.45),
                        birthday_influence=_optional_float(body.get("birthday_influence"), 0.35),
                        lucky_influence=_optional_float(body.get("lucky_influence"), 0.35),
                        seed=_optional_int(body.get("seed")) or 20261031,
                        strategy=str(body.get("strategy", "combined")),
                        target_return=_optional_float(body.get("target_return"), 0.45),
                    )
                self._json(result)
                return
            if parsed.path == "/api/refresh":
                body = self._body()
                lottery_id = str(body.get("lottery", "ssq"))
                if lottery_id not in LOTTERIES:
                    raise ApiError("不支持的彩种")
                limit = max(100, min(2500, int(body.get("limit", 1000))))
                try:
                    result = store.refresh(lottery_id, limit)
                except SourceError as exc:
                    raise ApiError(str(exc), 502) from exc
                result["profile"] = build_profile(lottery_id, store.load(lottery_id))
                self._json(result)
                return
            if parsed.path == "/api/backtest":
                body = self._body()
                lottery_id = str(body.get("lottery", "ssq"))
                if lottery_id not in LOTTERIES:
                    raise ApiError("不支持的彩种")
                try:
                    result = run_backtest(
                        lottery_id,
                        store.load(lottery_id),
                        test_count=_optional_int(body.get("test_count")) or 30,
                        target_min=_optional_int(body.get("target_min")),
                        target_max=_optional_int(body.get("target_max")),
                        candidate_pool=_optional_int(body.get("candidate_pool")) or 800,
                        ticket_sample=_optional_int(body.get("ticket_sample")) or 2_000,
                        history_influence=_optional_float(body.get("history_influence"), 0.45),
                        birthday_influence=_optional_float(body.get("birthday_influence"), 0.35),
                        lucky_influence=_optional_float(body.get("lucky_influence"), 0.35),
                        seed=_optional_int(body.get("seed")) or 20261031,
                        compare_neutral=bool(body.get("compare_neutral", True)),
                        portfolio=body.get("portfolio"),
                        strategy=str(body.get("strategy", "combined")),
                        target_return=_optional_float(body.get("target_return"), 0.45),
                    )
                except ValueError as exc:
                    raise ApiError(str(exc)) from exc
                self._json(result)
                return
            if parsed.path == "/api/snapshots":
                body = self._body()
                action = str(body.get("action", "save"))
                if action == "migrate":
                    snapshots = body.get("snapshots", [])
                    if not isinstance(snapshots, list):
                        raise ApiError("迁移记录格式错误")
                    result = snapshot_store.migrate(snapshots)
                    self._json({"ok": True, **result})
                    return
                if action == "save":
                    snapshot = body.get("snapshot")
                    if not isinstance(snapshot, dict):
                        raise ApiError("缺少参数记录")
                    saved = snapshot_store.save(snapshot)
                    self._json(
                        {
                            "ok": True,
                            "snapshot": saved,
                            "snapshots": snapshot_store.list(saved["lottery"]),
                        }
                    )
                    return
                if action == "delete":
                    snapshot_id = str(body.get("id", ""))
                    self._json({"ok": True, "deleted": snapshot_store.delete(snapshot_id)})
                    return
                raise ApiError("不支持的参数记录操作")
            raise ApiError("接口不存在", 404)
        except ApiError as exc:
            self._error(str(exc), exc.status)
        except ValueError as exc:
            self._error(str(exc), 400)
        except Exception as exc:
            self._error(f"服务器处理失败：{exc}", 500)

    def _lottery_param(self, query: str) -> str:
        params = parse_qs(query)
        lottery_id = params.get("lottery", ["ssq"])[0]
        if lottery_id not in LOTTERIES:
            raise ApiError("不支持的彩种")
        return lottery_id

    def _export_csv(self, query: str) -> None:
        lottery_id = self._lottery_param(query)
        records = store.load(lottery_id)
        rule = LOTTERIES[lottery_id]
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["期号", "开奖日期", rule.main.name, rule.bonus.name, "销售额", "奖池", "一等奖注数"])
        for record in reversed(records):
            writer.writerow(
                [
                    record["draw_no"],
                    record["date"],
                    " ".join(f"{n:02d}" for n in record["numbers"][rule.main.name]),
                    " ".join(f"{n:02d}" for n in record["numbers"][rule.bonus.name]),
                    record.get("sales", 0),
                    record.get("pool", 0),
                    record.get("prize_counts", {}).get("1", ""),
                ]
            )
        body = ("\ufeff" + output.getvalue()).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{lottery_id}_draws.csv"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_static(self, request_path: str) -> None:
        relative = "index.html" if request_path in ("", "/") else request_path.lstrip("/")
        candidate = (WEB_DIR / relative).resolve()
        if WEB_DIR.resolve() not in candidate.parents and candidate != WEB_DIR.resolve():
            raise ApiError("路径无效", 403)
        if not candidate.is_file():
            raise ApiError("页面不存在", 404)
        body = candidate.read_bytes()
        content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
        if content_type.startswith("text/") or content_type in ("application/javascript", "application/json"):
            content_type += "; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)


def _optional_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    return int(value)


def _optional_float(value: object, default: float) -> float:
    if value is None or value == "":
        return default
    return float(value)


def main() -> None:
    parser = argparse.ArgumentParser(description="彩票反向开奖实验室 v4.0")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8400)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    url = f"http://{args.host}:{args.port}"
    print(f"彩票反向开奖实验室 v4.0 已启动：{url}")
    print("按 Ctrl+C 停止")
    if not args.no_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
