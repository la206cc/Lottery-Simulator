"""Historical profiling and synthetic crowd popularity weights."""

from __future__ import annotations

import math
import statistics
from collections import Counter
from typing import Any

from .rules import LOTTERIES


LUCKY_NUMBERS = {6: 0.22, 8: 0.30, 9: 0.24, 16: 0.15, 18: 0.20, 28: 0.18, 32: 0.08}
AVOIDED_NUMBERS = {4: -0.26, 13: -0.30, 14: -0.24, 34: -0.12}


def _median(values: list[float], default: float = 0.0) -> float:
    return float(statistics.median(values)) if values else default


def _frequency(records: list[dict[str, Any]], zone_name: str, minimum: int, maximum: int) -> dict[int, int]:
    counts = Counter()
    for record in records:
        counts.update(record["numbers"].get(zone_name, []))
    return {number: counts[number] for number in range(minimum, maximum + 1)}


def _missing(records: list[dict[str, Any]], zone_name: str, minimum: int, maximum: int) -> dict[int, int]:
    missing = {number: len(records) for number in range(minimum, maximum + 1)}
    for index, record in enumerate(reversed(records)):
        for number in record["numbers"].get(zone_name, []):
            if number in missing and missing[number] == len(records):
                missing[number] = index
        if all(value != len(records) for value in missing.values()):
            break
    return missing


def _target_defaults(records: list[dict[str, Any]]) -> tuple[int, int]:
    recent = records[-80:]
    values = []
    for record in recent:
        count = record.get("prize_counts", {}).get("1")
        if count is not None:
            values.append(int(count))
    center = round(_median([float(v) for v in values], 6.0))
    return max(0, center - 1), max(1, center + 1)


def build_profile(lottery_id: str, records: list[dict[str, Any]]) -> dict[str, Any]:
    rule = LOTTERIES[lottery_id]
    if not records:
        return {
            "lottery": lottery_id,
            "count": 0,
            "ready": False,
            "message": "尚未下载真实开奖数据",
        }

    recent = records[-300:]
    main_records = records[-100:]
    main_freq = _frequency(recent, rule.main.name, rule.main.minimum, rule.main.maximum)
    bonus_freq = _frequency(recent, rule.bonus.name, rule.bonus.minimum, rule.bonus.maximum)
    main_missing = _missing(main_records, rule.main.name, rule.main.minimum, rule.main.maximum)
    bonus_missing = _missing(main_records, rule.bonus.name, rule.bonus.minimum, rule.bonus.maximum)
    sums = [sum(record["numbers"][rule.main.name]) for record in recent]
    odd_counts = [sum(number % 2 for number in record["numbers"][rule.main.name]) for record in recent]
    top_counts = [
        int(record.get("prize_counts", {}).get("1", 0))
        for record in recent
        if "1" in record.get("prize_counts", {})
    ]
    sales = [record["sales"] for record in records[-40:] if record.get("sales", 0) > 0]
    target_min, target_max = _target_defaults(records)
    latest = records[-1]

    return {
        "lottery": lottery_id,
        "name": rule.name,
        "ready": True,
        "count": len(records),
        "window": len(recent),
        "latest": {
            "draw_no": latest["draw_no"],
            "date": latest["date"],
            "numbers": latest["numbers"],
            "sales": latest.get("sales", 0),
            "pool": latest.get("pool", 0),
        },
        "frequency": {
            rule.main.name: sorted(main_freq.items(), key=lambda item: (-item[1], item[0])),
            rule.bonus.name: sorted(bonus_freq.items(), key=lambda item: (-item[1], item[0])),
        },
        "missing": {
            rule.main.name: sorted(main_missing.items(), key=lambda item: (-item[1], item[0])),
            rule.bonus.name: sorted(bonus_missing.items(), key=lambda item: (-item[1], item[0])),
        },
        "shape": {
            "sum_mean": round(statistics.mean(sums), 1),
            "sum_median": round(_median([float(v) for v in sums]), 1),
            "sum_p10": round(_percentile(sums, 0.10), 1),
            "sum_p90": round(_percentile(sums, 0.90), 1),
            "odd_distribution": {
                str(odd_count): round(count / len(recent), 4) for odd_count, count in sorted(Counter(odd_counts).items())
            },
            "main_span_median": round(_median([max(rec["numbers"][rule.main.name]) - min(rec["numbers"][rule.main.name]) for rec in recent]), 1),
        },
        "payout_history": {
            "top_winner_median": round(_median([float(v) for v in top_counts], 0.0), 1),
            "top_winner_mean": round(statistics.mean(top_counts), 1) if top_counts else 0,
            "top_winner_range": [min(top_counts), max(top_counts)] if top_counts else [0, 0],
            "sales_median": round(_median(sales, 200_000_000.0)),
            "observations": len(top_counts),
        },
        "target_defaults": {"min": target_min, "max": target_max, "center": round((target_min + target_max) / 2)},
        "source": {
            "name": "官方公开开奖数据",
            "draws": len(records),
            "first_date": records[0]["date"],
            "last_date": latest["date"],
        },
    }


def _percentile(values: list[int], fraction: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    position = (len(ordered) - 1) * fraction
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return float(ordered[lower])
    return ordered[lower] * (upper - position) + ordered[upper] * (position - lower)


def popularity_weights(
    lottery_id: str,
    records: list[dict[str, Any]],
    history_influence: float = 0.45,
    birthday_influence: float = 0.35,
    lucky_influence: float = 0.35,
) -> tuple[list[float], list[float]]:
    """Build crowd-selection weights from visible signals, not hidden sales.

    These weights intentionally model common human behavior. They are a stated
    simulation prior and must not be presented as actual per-number sales.
    """
    rule = LOTTERIES[lottery_id]
    recent = records[-160:]
    main_freq = _frequency(recent, rule.main.name, rule.main.minimum, rule.main.maximum)
    bonus_freq = _frequency(recent, rule.bonus.name, rule.bonus.minimum, rule.bonus.maximum)
    main_avg = statistics.mean(main_freq.values()) if main_freq else 1.0
    bonus_avg = statistics.mean(bonus_freq.values()) if bonus_freq else 1.0

    main_weights: list[float] = []
    for number in range(rule.main.minimum, rule.main.maximum + 1):
        history_signal = (main_freq[number] / main_avg - 1.0) if main_avg else 0.0
        weight = 1.0 + 0.72 * history_influence * history_signal
        if number <= 31:
            weight += birthday_influence * (0.34 if number <= 12 else 0.15)
        weight += lucky_influence * (LUCKY_NUMBERS.get(number, 0.0) + AVOIDED_NUMBERS.get(number, 0.0))
        main_weights.append(max(0.20, min(2.70, weight)))

    bonus_weights: list[float] = []
    for number in range(rule.bonus.minimum, rule.bonus.maximum + 1):
        history_signal = (bonus_freq[number] / bonus_avg - 1.0) if bonus_avg else 0.0
        weight = 1.0 + 0.80 * history_influence * history_signal
        if number <= 12:
            weight += birthday_influence * 0.12
        weight += lucky_influence * (LUCKY_NUMBERS.get(number, 0.0) + AVOIDED_NUMBERS.get(number, 0.0))
        bonus_weights.append(max(0.20, min(2.60, weight)))
    return main_weights, bonus_weights
