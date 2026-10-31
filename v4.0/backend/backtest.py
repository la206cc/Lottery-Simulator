"""Leakage-free walk-forward backtesting for counterfactual candidates."""

from __future__ import annotations

import math
from collections import Counter
from itertools import combinations
from typing import Any

from .engine import recommend
from .profile import build_profile
from .rules import LOTTERIES, fixed_prize_amount, prize_level


SCENARIOS: dict[str, dict[str, float]] = {
    "current": {},
    "neutral": {"history_influence": 0.0, "birthday_influence": 0.0, "lucky_influence": 0.0},
    "hot": {"history_influence": 0.95, "birthday_influence": 0.20, "lucky_influence": 0.25},
    "birthday": {"history_influence": 0.15, "birthday_influence": 0.95, "lucky_influence": 0.20},
    "lucky": {"history_influence": 0.30, "birthday_influence": 0.20, "lucky_influence": 0.95},
}

def _slips(main_add: int = 0, bonus_add: int = 0, count: int = 1) -> list[dict[str, int]]:
    return [
        {"main_add": main_add, "bonus_add": bonus_add}
        for _ in range(count)
    ][:count] or [{"main_add": 0, "bonus_add": 0}] * 5


WAGER_MODES: dict[str, list[dict[str, Any]]] = {
    "ssq": [
        {"id": "single", "name": "单式 6+1 ×5", "slips": _slips(count=5), "description": "五张单式票"},
        {
            "id": "mixed_3s_2c",
            "name": "混投 3单+2复式7+1",
            "slips": [
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
            ],
            "description": "三张单式，两张七码复式",
        },
        {
            "id": "mixed_2s_2c_1x",
            "name": "混投 2单+2张7+1+1张7+2",
            "slips": [
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 1},
            ],
            "description": "单式与小复式混合套票",
        },
        {
            "id": "mixed_1s_2c_2x",
            "name": "混投 1单+2张7+1+2张7+2",
            "slips": [
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 1},
                {"main_add": 1, "bonus_add": 1},
            ],
            "description": "一张单式带两张七码和两张七码双蓝",
        },
        {
            "id": "mixed_1s_1c_2x_1w",
            "name": "套票 1单+1张7+1+2张7+2+1张8+1",
            "slips": [
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 1},
                {"main_add": 1, "bonus_add": 1},
                {"main_add": 2, "bonus_add": 0},
            ],
            "description": "覆盖单式、七码和八码的小额混合套票",
        },
        {"id": "7+1", "name": "小复式 7+1 ×5", "slips": _slips(1, 0, 5), "description": "每张包含七注"},
        {"id": "7+2", "name": "小复式 7+2 ×5", "slips": _slips(1, 1, 5), "description": "每张包含十四注"},
        {"id": "8+1", "name": "小复式 8+1 ×5", "slips": _slips(2, 0, 5), "description": "每张包含二十八注"},
    ],
    "dlt": [
        {"id": "single", "name": "单式 5+2 ×5", "slips": _slips(count=5), "description": "五张单式票"},
        {
            "id": "mixed_3s_2c",
            "name": "混投 3单+2复式6+2",
            "slips": [
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
            ],
            "description": "三张单式，两张六码复式",
        },
        {
            "id": "mixed_2s_2c_1x",
            "name": "套票 2单+2张6+2+1张7+2",
            "slips": [
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 2, "bonus_add": 0},
            ],
            "description": "单式与两种小复式混合",
        },
        {
            "id": "mixed_1s_2c_2x",
            "name": "混投 1单+2张6+2+2张6+3",
            "slips": [
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 1},
                {"main_add": 1, "bonus_add": 1},
            ],
            "description": "单式与两种六码复式混合",
        },
        {
            "id": "mixed_1s_1c_2x_1w",
            "name": "套票 1单+1张6+2+2张7+2+1张6+3",
            "slips": [
                {"main_add": 0, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 0},
                {"main_add": 2, "bonus_add": 0},
                {"main_add": 2, "bonus_add": 0},
                {"main_add": 1, "bonus_add": 1},
            ],
            "description": "单式、六码和七码复式混合套票",
        },
        {"id": "6+2", "name": "小复式 6+2 ×5", "slips": _slips(1, 0, 5), "description": "每张包含六注"},
        {"id": "7+2", "name": "小复式 7+2 ×5", "slips": _slips(2, 0, 5), "description": "每张包含二十一注"},
        {"id": "6+3", "name": "小复式 6+3 ×5", "slips": _slips(1, 1, 5), "description": "每张包含十八注"},
    ],
}


def available_wager_types(lottery_id: str) -> list[dict[str, Any]]:
    """All small compound structures exposed by the portfolio builder."""
    if lottery_id not in LOTTERIES:
        raise ValueError("不支持的彩种")
    rule = LOTTERIES[lottery_id]
    maximum_main = rule.main.count + (3 if lottery_id == "ssq" else 4)
    maximum_bonus = rule.bonus.count + (2 if lottery_id == "ssq" else 2)
    result = []
    for main_size in range(rule.main.count, maximum_main + 1):
        for bonus_size in range(rule.bonus.count, maximum_bonus + 1):
            bet_count = math.comb(main_size, rule.main.count) * math.comb(
                bonus_size, rule.bonus.count
            )
            result.append(
                {
                    "id": f"{main_size}+{bonus_size}",
                    "name": f"单式 {main_size}+{bonus_size}"
                    if main_size == rule.main.count and bonus_size == rule.bonus.count
                    else f"复式 {main_size}+{bonus_size}",
                    "main_size": main_size,
                    "bonus_size": bonus_size,
                    "main_add": main_size - rule.main.count,
                    "bonus_add": bonus_size - rule.bonus.count,
                    "bet_count": bet_count,
                    "cost": bet_count * rule.price,
                    "is_single": main_size == rule.main.count and bonus_size == rule.bonus.count,
                }
            )
    return result


def wager_presets(lottery_id: str) -> list[dict[str, Any]]:
    rule = LOTTERIES[lottery_id]
    type_by_shape = {
        (item["main_size"], item["bonus_size"]): item
        for item in available_wager_types(lottery_id)
    }
    presets = []
    for mode in WAGER_MODES[lottery_id]:
        types = [
            f"{rule.main.count + slip['main_add']}+{rule.bonus.count + slip['bonus_add']}"
            for slip in mode["slips"]
        ]
        presets.append(
            {
                "id": mode["id"],
                "name": mode["name"],
                "description": mode["description"],
                "types": types,
                "cost_per_issue": sum(
                    type_by_shape[
                        (
                            rule.main.count + slip["main_add"],
                            rule.bonus.count + slip["bonus_add"],
                        )
                    ]["cost"]
                    for slip in mode["slips"]
                ),
            }
        )
    return presets


def resolve_portfolio(lottery_id: str, type_ids: list[str] | None) -> list[dict[str, Any]]:
    rule = LOTTERIES[lottery_id]
    base_id = f"{rule.main.count}+{rule.bonus.count}"
    if not type_ids:
        type_ids = [base_id] * 5
    if not isinstance(type_ids, list) or not 1 <= len(type_ids) <= 10:
        raise ValueError("投注组合需要包含 1–10 组预测")
    options = {item["id"]: item for item in available_wager_types(lottery_id)}
    resolved = []
    for type_id in type_ids:
        if type_id not in options:
            raise ValueError(f"不支持的复式类型：{type_id}")
        resolved.append(options[type_id])
    return resolved


def _wilson_interval(successes: int, total: int, z: float = 1.96) -> list[float] | None:
    if total <= 0:
        return None
    p = successes / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    margin = z * math.sqrt((p * (1 - p) + z * z / (4 * total)) / total) / denominator
    return [round(max(0.0, center - margin), 6), round(min(1.0, center + margin), 6)]


def _uniform_hit_probability(lottery_id: str) -> float:
    rule = LOTTERIES[lottery_id]
    probability = 0.0
    main_denominator = math.comb(rule.main.size, rule.main.count)
    bonus_denominator = math.comb(rule.bonus.size, rule.bonus.count)
    for main_hits in range(rule.main.count + 1):
        main_ways = math.comb(rule.main.count, main_hits) * math.comb(rule.main.size - rule.main.count, rule.main.count - main_hits)
        for bonus_hits in range(rule.bonus.count + 1):
            if prize_level(lottery_id, main_hits, bonus_hits) is None:
                continue
            bonus_ways = math.comb(rule.bonus.count, bonus_hits) * math.comb(
                rule.bonus.size - rule.bonus.count, rule.bonus.count - bonus_hits
            )
            probability += main_ways / main_denominator * bonus_ways / bonus_denominator
    return probability


def _prize_amount(lottery_id: str, level: int, actual: dict[str, Any]) -> float:
    if level in (1, 2):
        value = actual.get("prize_amounts", {}).get(str(level), 0)
        if value:
            return float(value)
        return 6_500_000.0 if lottery_id == "ssq" else (6_000_000.0 if level == 1 else 70_000.0)
    return fixed_prize_amount(lottery_id, level)


def _evaluate_candidates(
    lottery_id: str,
    actual: dict[str, Any],
    recommendations: list[dict[str, Any]],
    prediction_support: dict[str, list[float]],
    mode: dict[str, Any],
) -> dict[str, Any]:
    rule = LOTTERIES[lottery_id]
    candidate_results = []
    total_payout = 0.0
    used_main_extensions: Counter[int] = Counter()
    used_bonus_extensions: Counter[int] = Counter()
    for candidate, slip in zip(recommendations, mode["slips"]):
        main_core = candidate["numbers"][rule.main.name]
        bonus_core = candidate["numbers"][rule.bonus.name]
        main_candidates = [
            number
            for number in range(rule.main.minimum, rule.main.maximum + 1)
            if number not in main_core
        ]
        bonus_candidates = [
            number
            for number in range(rule.bonus.minimum, rule.bonus.maximum + 1)
            if number not in bonus_core
        ]
        main_order = sorted(
            main_candidates,
            key=lambda number: (
                -(
                    prediction_support[rule.main.name][number - rule.main.minimum]
                    - 0.65 * used_main_extensions[number]
                ),
                number,
            ),
        )
        bonus_order = sorted(
            bonus_candidates,
            key=lambda number: (
                -(
                    prediction_support[rule.bonus.name][number - rule.bonus.minimum]
                    - 0.65 * used_bonus_extensions[number]
                ),
                number,
            ),
        )
        main_supplement = main_order[: slip["main_add"]]
        bonus_supplement = bonus_order[: slip["bonus_add"]]
        used_main_extensions.update(main_supplement)
        used_bonus_extensions.update(bonus_supplement)
        main_pool = sorted([*main_core, *main_supplement])
        bonus_pool = sorted([*bonus_core, *bonus_supplement])
        bet_count = math.comb(len(main_pool), rule.main.count) * math.comb(
            len(bonus_pool), rule.bonus.count
        )
        prize_counts: Counter[int] = Counter()
        amount = 0.0
        best_level = None
        best_main_hits = 0
        best_bonus_hits = 0
        for main_ticket in combinations(main_pool, rule.main.count):
            main_hits = len(set(actual["numbers"][rule.main.name]) & set(main_ticket))
            for bonus_ticket in combinations(bonus_pool, rule.bonus.count):
                bonus_hits = len(set(actual["numbers"][rule.bonus.name]) & set(bonus_ticket))
                level = prize_level(lottery_id, main_hits, bonus_hits)
                if level:
                    prize_counts[level] += 1
                    amount += _prize_amount(lottery_id, level, actual)
                if level is not None and (best_level is None or level < best_level):
                    best_level = level
                if (main_hits, bonus_hits) > (best_main_hits, best_bonus_hits):
                    best_main_hits, best_bonus_hits = main_hits, bonus_hits
        winning_bets = sum(prize_counts.values())
        cost = bet_count * rule.price
        total_payout += amount
        candidate_results.append(
            {
                "rank": candidate["rank"],
                "wager_type": {
                    "id": slip["id"],
                    "name": slip["name"],
                    "bet_count": slip["bet_count"],
                    "cost": slip["cost"],
                },
                "numbers": {rule.main.name: main_core, rule.bonus.name: bonus_core},
                "expanded": {rule.main.name: main_pool, rule.bonus.name: bonus_pool},
                "supplement": {rule.main.name: main_supplement, rule.bonus.name: bonus_supplement},
                "supplement_support": {
                    rule.main.name: {
                        str(number): prediction_support[rule.main.name][number - rule.main.minimum]
                        for number in main_supplement
                    },
                    rule.bonus.name: {
                        str(number): prediction_support[rule.bonus.name][number - rule.bonus.minimum]
                        for number in bonus_supplement
                    },
                },
                "main_hits": best_main_hits,
                "bonus_hits": best_bonus_hits,
                "prize_level": best_level,
                "winning_bets": winning_bets,
                "bet_count": bet_count,
                "cost": cost,
                "prize_counts": {str(level): count for level, count in sorted(prize_counts.items())},
                "prize_amount": round(amount, 2),
            }
        )
    best = min(
        candidate_results,
        key=lambda item: (item["prize_level"] is None, item["prize_level"] or 99, -item["main_hits"], -item["bonus_hits"]),
    )
    return {
        "draw_no": actual["draw_no"],
        "date": actual["date"],
        "actual": actual["numbers"],
        "candidates": candidate_results,
        "best": best,
        "any_win": best["prize_level"] is not None,
        "cost": sum(candidate["cost"] for candidate in candidate_results),
        "payout": round(total_payout, 2),
        "profit": round(total_payout - sum(candidate["cost"] for candidate in candidate_results), 2),
        "wager_mode": mode["id"],
    }


def _summarize(lottery_id: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    rule = LOTTERIES[lottery_id]
    candidates = [candidate for row in rows for candidate in row["candidates"]]
    winning_candidates = [candidate for candidate in candidates if candidate["prize_level"] is not None]
    issue_wins = sum(1 for row in rows if row["any_win"])
    jackpot_hits = sum(candidate["prize_counts"].get("1", 0) for candidate in candidates)
    second_hits = sum(candidate["prize_counts"].get("2", 0) for candidate in candidates)
    total_cost = sum(row["cost"] for row in rows)
    total_payout = sum(row["payout"] for row in rows)
    total_wager_bets = sum(candidate["bet_count"] for candidate in candidates)
    winning_wager_bets = sum(candidate["winning_bets"] for candidate in candidates)
    levels = Counter(candidate["prize_level"] for candidate in winning_candidates)
    return {
        "tested_issues": len(rows),
        "candidate_tickets": len(candidates),
        "winning_candidates": len(winning_candidates),
        "wager_bets": total_wager_bets,
        "winning_wager_bets": winning_wager_bets,
        "issues_with_any_win": issue_wins,
        "issue_any_win_rate": round(issue_wins / len(rows), 6) if rows else 0.0,
        "issue_any_win_ci95": _wilson_interval(issue_wins, len(rows)),
        "candidate_any_win_rate": round(len(winning_candidates) / len(candidates), 6) if candidates else 0.0,
        "candidate_any_win_ci95": _wilson_interval(len(winning_candidates), len(candidates)),
        "jackpot_hits": jackpot_hits,
        "second_prize_hits": second_hits,
        "total_cost": total_cost,
        "total_payout": round(total_payout, 2),
        "net_profit": round(total_payout - total_cost, 2),
        "return_rate": round(total_payout / total_cost, 6) if total_cost else 0.0,
        "prize_level_distribution": {str(level): count for level, count in sorted(levels.items())},
        "single_ticket_random_any_prize_probability": round(_uniform_hit_probability(lottery_id), 8),
        "expected_winning_candidates_random": round(total_wager_bets * _uniform_hit_probability(lottery_id), 2),
        "price_per_ticket": rule.price,
    }


def run_backtest(
    lottery_id: str,
    records: list[dict[str, Any]],
    test_count: int = 30,
    target_min: int | None = None,
    target_max: int | None = None,
    candidate_pool: int = 800,
    ticket_sample: int = 2_000,
    history_influence: float = 0.45,
    birthday_influence: float = 0.35,
    lucky_influence: float = 0.35,
    seed: int = 20261031,
    compare_neutral: bool = True,
    portfolio: list[str] | None = None,
) -> dict[str, Any]:
    if lottery_id not in LOTTERIES:
        raise ValueError("不支持的彩种")
    if len(records) < 130:
        raise ValueError("历史数据不足，至少需要 130 期")
    test_count = max(1, min(200, int(test_count)))
    available = min(test_count, len(records) - 100)
    start_index = len(records) - available
    test_records = records[start_index:]
    candidate_pool = max(500, min(5000, int(candidate_pool)))
    ticket_sample = max(2_000, min(10_000, int(ticket_sample)))
    resolved_portfolio = resolve_portfolio(lottery_id, portfolio)
    recommendation_count = len(resolved_portfolio)
    mode = {"id": "custom", "name": "自定义组合", "slips": resolved_portfolio}

    def execute(influences: dict[str, float]) -> list[dict[str, Any]]:
        rows = []
        for offset, actual in enumerate(test_records):
            history = records[: start_index + offset]
            prior_target = build_profile(lottery_id, history)["target_defaults"]
            selected_target_min = int(prior_target["min"] if target_min is None else target_min)
            selected_target_max = int(prior_target["max"] if target_max is None else target_max)
            prediction = recommend(
                lottery_id,
                history,
                target_min=selected_target_min,
                target_max=selected_target_max,
                candidate_pool=candidate_pool,
                ticket_sample=ticket_sample,
                history_influence=influences["history_influence"],
                birthday_influence=influences["birthday_influence"],
                lucky_influence=influences["lucky_influence"],
                seed=seed + offset * 997,
                include_profile=False,
                recommendation_count=recommendation_count,
            )
            row = _evaluate_candidates(
                lottery_id,
                actual,
                prediction["recommendations"],
                prediction["prediction_support"],
                mode,
            )
            row["training_through"] = history[-1]["draw_no"]
            row["training_samples"] = len(history)
            row["target"] = {"min": selected_target_min, "max": selected_target_max}
            rows.append(row)
        return rows

    selected_influences = {
        "history_influence": max(0.0, min(1.0, float(history_influence))),
        "birthday_influence": max(0.0, min(1.0, float(birthday_influence))),
        "lucky_influence": max(0.0, min(1.0, float(lucky_influence))),
    }
    rows = execute(selected_influences)
    metrics = _summarize(lottery_id, rows)
    comparison = None
    if compare_neutral:
        neutral_rows = execute(SCENARIOS["neutral"])
        neutral_metrics = _summarize(lottery_id, neutral_rows)
        comparison = {
            "neutral": neutral_metrics,
            "issue_any_win_rate_delta": round(
                metrics["issue_any_win_rate"] - neutral_metrics["issue_any_win_rate"], 6
            ),
            "candidate_any_win_rate_delta": round(
                metrics["candidate_any_win_rate"] - neutral_metrics["candidate_any_win_rate"], 6
            ),
            "return_rate_delta": round(metrics["return_rate"] - neutral_metrics["return_rate"], 6),
        }

    return {
        "lottery": lottery_id,
        "name": LOTTERIES[lottery_id].name,
        "method": "walk_forward_no_lookahead",
        "seed": seed,
        "window": {
            "first_target": test_records[0]["draw_no"],
            "first_date": test_records[0]["date"],
            "last_target": test_records[-1]["draw_no"],
            "last_date": test_records[-1]["date"],
            "tested_issues": len(test_records),
        },
        "settings": {
            "candidate_pool": candidate_pool,
            "ticket_sample": ticket_sample,
            "target_min": target_min,
            "target_max": target_max,
            "influences": selected_influences,
            "portfolio": [item["id"] for item in resolved_portfolio],
            "portfolio_cost_per_issue": sum(item["cost"] for item in resolved_portfolio),
            "portfolio_bets_per_issue": sum(item["bet_count"] for item in resolved_portfolio),
        },
        "portfolio": resolved_portfolio,
        "metrics": metrics,
        "comparison": comparison,
        "rows": rows,
        "disclaimer": (
            "这是历史回测，不是未来中奖概率。每个候选号码面对真实随机开奖时概率相同；"
            "参数回测差异可能来自随机波动或过拟合。"
        ),
    }
