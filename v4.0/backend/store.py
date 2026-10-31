"""JSON-backed storage for real draw data and generated experiments."""

from __future__ import annotations

import json
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from .sources import SourceError, fetch_dlt, fetch_ssq, source_metadata


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"


class DrawStore:
    def __init__(self, data_dir: Path = DATA_DIR) -> None:
        self.data_dir = data_dir
        self.raw_dir = data_dir / "raw"
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self._cache: dict[str, list[dict[str, Any]]] = {}
        self._lock = threading.RLock()

    def path_for(self, lottery_id: str) -> Path:
        return self.raw_dir / f"{lottery_id}.json"

    def load(self, lottery_id: str) -> list[dict[str, Any]]:
        with self._lock:
            if lottery_id in self._cache:
                return self._cache[lottery_id]
            path = self.path_for(lottery_id)
            if not path.exists():
                self._cache[lottery_id] = []
                return []
            payload = json.loads(path.read_text(encoding="utf-8"))
            records = payload.get("draws", []) if isinstance(payload, dict) else payload
            records.sort(key=lambda record: (record.get("date", ""), record.get("draw_no", "")))
            self._cache[lottery_id] = records
            return records

    def save(self, lottery_id: str, draws: list[dict[str, Any]], extra: dict[str, Any] | None = None) -> Path:
        with self._lock:
            unique = {draw["id"]: draw for draw in draws if draw.get("id")}
            records = sorted(unique.values(), key=lambda record: (record.get("date", ""), record.get("draw_no", "")))
            payload = {
                "lottery": lottery_id,
                "updated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
                "source": source_metadata(lottery_id, len(records)),
                "draws": records,
                **(extra or {}),
            }
            path = self.path_for(lottery_id)
            temp = path.with_suffix(".tmp")
            temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            temp.replace(path)
            self._cache[lottery_id] = records
            return path

    def refresh(self, lottery_id: str, limit: int = 1000) -> dict[str, Any]:
        try:
            incoming = fetch_ssq(limit) if lottery_id == "ssq" else fetch_dlt(limit)
        except SourceError:
            raise
        if not incoming:
            raise SourceError("官方接口没有返回可用的已开奖记录")
        existing = self.load(lottery_id)
        merged = {record["id"]: record for record in existing}
        merged.update({record["id"]: record for record in incoming})
        added = len(set(merged) - {record["id"] for record in existing})
        self.save(lottery_id, list(merged.values()), {"refresh_added": added})
        records = self.load(lottery_id)
        return {
            "lottery": lottery_id,
            "count": len(records),
            "added": added,
            "latest": records[-1]["draw_no"] if records else None,
            "source": source_metadata(lottery_id, len(records)),
        }

    def manifest(self) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for lottery_id in ("ssq", "dlt"):
            path = self.path_for(lottery_id)
            records = self.load(lottery_id)
            payload = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
            result[lottery_id] = {
                "count": len(records),
                "latest": records[-1] if records else None,
                "source": payload.get("source") or source_metadata(lottery_id, len(records)),
                "updated_at": payload.get("updated_at"),
            }
        return result
