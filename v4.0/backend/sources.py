"""Official public draw-data adapters for 双色球 and 超级大乐透."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


SSQ_URL = (
    "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?"
    "name=ssq&issueCount=&issueStart=&issueEnd=&dayStart={start}&dayEnd={end}"
    "&pageNo={page}&pageSize={size}&week=&systemType=PC"
)
DLT_URL = (
    "https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?"
    "gameNo=85&provinceId=0&pageSize={size}&isVerify=1&pageNo={page}"
)


class SourceError(RuntimeError):
    pass


def _get_json(url: str, referer: str) -> dict[str, Any]:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LotteryReverseLab/4.0",
            "Accept": "application/json,text/plain,*/*",
            "Referer": referer,
        },
    )
    try:
        with urlopen(request, timeout=35) as response:
            payload = response.read().decode("utf-8")
    except Exception as exc:  # network errors are surfaced with the source URL
        raise SourceError(f"无法访问官方开奖数据：{exc}") from exc
    try:
        return json.loads(payload)
    except json.JSONDecodeError as exc:
        raise SourceError("数据源返回了非 JSON 内容，请稍后重试") from exc


def _int(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    text = re.sub(r"[^\d.-]", "", str(value))
    try:
        return int(float(text))
    except (ValueError, TypeError):
        return default


def _float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    text = re.sub(r"[^\d.-]", "", str(value))
    try:
        return float(text)
    except (ValueError, TypeError):
        return default


def parse_ssq_record(record: dict[str, Any]) -> dict[str, Any] | None:
    reds = [int(value) for value in str(record.get("red", "")).split(",") if value.strip()]
    blues = [int(value) for value in str(record.get("blue", "")).split(",") if value.strip()]
    if len(reds) != 6 or len(blues) != 1:
        return None
    prize_counts: dict[str, int] = {}
    prize_amounts: dict[str, float] = {}
    for grade in record.get("prizegrades", []):
        grade_type = _int(grade.get("type"))
        if 1 <= grade_type <= 6:
            prize_counts[str(grade_type)] = _int(grade.get("typenum"))
            prize_amounts[str(grade_type)] = _float(grade.get("typemoney"))
    return {
        "id": str(record.get("code", "")),
        "draw_no": str(record.get("code", "")),
        "date": str(record.get("date", "")).split("(")[0],
        "numbers": {"红球": sorted(reds), "蓝球": sorted(blues)},
        "sales": _float(record.get("sales")),
        "pool": _float(record.get("poolmoney")),
        "prize_counts": prize_counts,
        "prize_amounts": prize_amounts,
        "source_url": "https://www.cwl.gov.cn/",
        "verified": bool(str(record.get("code", "")) and reds and blues),
    }


def parse_dlt_record(record: dict[str, Any]) -> dict[str, Any] | None:
    values = [int(value) for value in re.split(r"[\s+]+", str(record.get("lotteryDrawResult", "")).strip()) if value]
    if len(values) != 7:
        return None
    prize_counts: dict[str, int] = {}
    prize_amounts: dict[str, float] = {}
    for grade in record.get("prizeLevelList", []):
        label = str(grade.get("prizeLevel", ""))
        if "追加" in label:
            continue
        match = re.search(r"([一二三四五六七八九])等奖", label)
        if match:
            china_number = "一二三四五六七八九"
            level = china_number.index(match.group(1)) + 1
            prize_counts[str(level)] = _int(grade.get("stakeCount"))
            prize_amounts[str(level)] = _float(grade.get("stakeAmount"))
    return {
        "id": str(record.get("lotteryDrawNum", "")),
        "draw_no": str(record.get("lotteryDrawNum", "")),
        "date": str(record.get("lotteryDrawTime", "")).split(" ")[0],
        "numbers": {"前区": sorted(values[:5]), "后区": sorted(values[5:])},
        "sales": _float(record.get("totalSaleAmount")),
        "pool": _float(record.get("poolBalanceAfterdraw")),
        "prize_counts": prize_counts,
        "prize_amounts": prize_amounts,
        "source_url": "https://static.sporttery.cn/",
        "verified": bool(record.get("prizeLevelList")) and bool(record.get("totalSaleAmount")),
    }


def fetch_ssq(limit: int = 1000) -> list[dict[str, Any]]:
    """Fetch recent SSQ draws from China Welfare Lottery's public endpoint."""
    page_size = 200
    page = 1
    records: list[dict[str, Any]] = []
    today = datetime.now(timezone.utc).date().isoformat()
    while len(records) < limit:
        url = SSQ_URL.format(start="2018-01-01", end=today, page=page, size=page_size)
        payload = _get_json(url, "https://www.cwl.gov.cn/")
        rows = payload.get("result") or []
        if not rows:
            break
        for row in rows:
            parsed = parse_ssq_record(row)
            if parsed and parsed["verified"]:
                records.append(parsed)
                if len(records) >= limit:
                    break
        total = _int(payload.get("total"))
        if page * page_size >= total:
            break
        page += 1
    return records


def fetch_dlt(limit: int = 1000) -> list[dict[str, Any]]:
    """Fetch recent DLT draws from China Sports Lottery's public endpoint."""
    page_size = 100
    page = 1
    records: list[dict[str, Any]] = []
    while len(records) < limit:
        url = DLT_URL.format(page=page, size=page_size)
        payload = _get_json(url, "https://static.sporttery.cn/")
        value = payload.get("value") or {}
        rows = value.get("list") or []
        if not rows:
            break
        for row in rows:
            parsed = parse_dlt_record(row)
            if parsed and parsed["verified"]:
                records.append(parsed)
                if len(records) >= limit:
                    break
        total = _int(value.get("total"))
        if page * page_size >= total:
            break
        page += 1
    return records


def source_metadata(lottery_id: str, count: int) -> dict[str, Any]:
    if lottery_id == "ssq":
        return {
            "name": "中国福利彩票发行管理中心",
            "url": "https://www.cwl.gov.cn/",
            "method": "官方开奖公告接口",
            "count": count,
        }
    return {
        "name": "中国体育彩票",
        "url": "https://static.sporttery.cn/",
        "method": "官方历史开奖接口",
        "count": count,
    }
