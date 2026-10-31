"""Counterfactual draw search and settlement engine."""

from __future__ import annotations

import math
import random
import statistics
from collections import Counter
from itertools import combinations
from typing import Any, Iterable

from .profile import build_profile, popularity_weights
from .rules import (
    LOTTERIES,
    fixed_prize_amount,
    max_prize_level,
    prize_hits,
    prize_level,
)


def _elementary_symmetric(weights: list[float], k: int) -> list[float]:
    coefficients = [0.0] * (k + 1)
    coefficients[0] = 1.0
    for weight in weights:
        for index in range(k, 0, -1):
            coefficients[index] += coefficients[index - 1] * weight
    return coefficients


def _set_probability(weights: list[float], probability_denominator: float, chosen: Iterable[int], minimum: int) -> float:
    if probability_denominator <= 0:
        return 0.0
    product = 1.0
    for number in chosen:
        product *= weights[number - minimum]
    return product / probability_denominator


def _exact_match_distribution(
    weights: list[float],
    minimum: int,
    chosen: list[int],
    ticket_count: int,
    denominator: float,
) -> list[float]:
    """Weighted-without-replacement probability of every exact hit count."""
    chosen_set = set(chosen)
    outside = [
        weight
        for number, weight in zip(range(minimum, minimum + len(weights)), weights)
        if number not in chosen_set
    ]
    outside_coefficients = _elementary_symmetric(outside, ticket_count)
    probabilities = []
    for hits in range(0, min(ticket_count, len(chosen)) + 1):
        outside_needed = ticket_count - hits
        outside_total = outside_coefficients[outside_needed] if outside_needed < len(outside_coefficients) else 0.0
        inside_total = 0.0
        for subset in combinations(chosen, hits):
            product = math.prod(weights[number - minimum] for number in subset)
            inside_total += product
        probabilities.append(inside_total * outside_total / denominator if denominator else 0.0)
    return probabilities


def _without_replacement(weights: list[float], count: int, rng: random.Random) -> list[int]:
    indexed = list(enumerate(weights))
    selected: list[int] = []
    for _ in range(count):
        total = sum(weight for _, weight in indexed)
        threshold = rng.random() * total
        running = 0.0
        pick = len(indexed) - 1
        for index, (number_index, weight) in enumerate(indexed):
            running += weight
            if running >= threshold:
                pick = index
                selected.append(number_index)
                break
        indexed.pop(pick)
    return [index + 1 for index in selected]


def _uniform_pick(size: int, count: int, rng: random.Random) -> list[int]:
    return sorted(rng.sample(range(1, size + 1), count))


def _candidate_pool(
    lottery_id: str,
    main_weights: list[float],
    bonus_weights: list[float],
    main_denominator: float,
    bonus_denominator: float,
    count: int,
    rng: random.Random,
) -> list[dict[str, Any]]:
    rule = LOTTERIES[lottery_id]
    candidates: dict[tuple[tuple[int, ...], tuple[int, ...]], dict[str, Any]] = {}
    secondary_weights = [1.0 / max(weight, 0.05) for weight in main_weights]
    secondary_denominator = _elementary_symmetric(secondary_weights, rule.main.count)[-1]

    for _ in range(count):
        mode = rng.random()
        if mode < 0.48:
            main = _uniform_pick(rule.main.size, rule.main.count, rng)
            main = sorted(number + rule.main.minimum - 1 for number in main)
        elif mode < 0.78:
            main = _without_replacement(main_weights, rule.main.count, rng)
            main = sorted(number + rule.main.minimum - 1 for number in main)
        elif mode < 0.93:
            main = _without_replacement(secondary_weights, rule.main.count, rng)
            main = sorted(number + rule.main.minimum - 1 for number in main)
        else:
            mixed = [max(0.18, math.sqrt(weight)) for weight in main_weights]
            main = _without_replacement(mixed, rule.main.count, rng)
            main = sorted(number + rule.main.minimum - 1 for number in main)

        bonus = _without_replacement(bonus_weights, rule.bonus.count, rng)
        bonus = sorted(number + rule.bonus.minimum - 1 for number in bonus)
        key = (tuple(main), tuple(bonus))
        if key in candidates:
            continue
        probability_main = _set_probability(main_weights, main_denominator, main, rule.main.minimum)
        probability_bonus = _set_probability(bonus_weights, bonus_denominator, bonus, rule.bonus.minimum)
        candidates[key] = {
            "numbers": {rule.main.name: main, rule.bonus.name: bonus},
            "p_main": probability_main,
            "p_bonus": probability_bonus,
            "p_first": probability_main * probability_bonus,
        }
    return list(candidates.values())


def _population(
    lottery_id: str,
    main_weights: list[float],
    bonus_weights: list[float],
    count: int,
    rng: random.Random,
) -> list[dict[str, list[int]]]:
    rule = LOTTERIES[lottery_id]
    tickets: list[dict[str, list[int]]] = []
    for _ in range(count):
        profile = rng.random()
        if profile < 0.42:
            main = _uniform_pick(rule.main.size, rule.main.count, rng)
            main = sorted(value + rule.main.minimum - 1 for value in main)
            bonus = _uniform_pick(rule.bonus.size, rule.bonus.count, rng)
            bonus = sorted(value + rule.bonus.minimum - 1 for value in bonus)
        elif profile < 0.82:
            main = sorted(value + rule.main.minimum - 1 for value in _without_replacement(main_weights, rule.main.count, rng))
            bonus = sorted(value + rule.bonus.minimum - 1 for value in _without_replacement(bonus_weights, rule.bonus.count, rng))
        elif profile < 0.95:
            birthday_weights = [
                weight * (1.8 if number <= 31 else 0.45)
                for number, weight in zip(range(rule.main.minimum, rule.main.maximum + 1), main_weights)
            ]
            main = sorted(value + rule.main.minimum - 1 for value in _without_replacement(birthday_weights, rule.main.count, rng))
            bonus = sorted(value + rule.bonus.minimum - 1 for value in _without_replacement(bonus_weights, rule.bonus.count, rng))
        else:
            # A small fixed-pattern population represents people who reuse old tickets.
            anchor = rng.randint(rule.main.minimum, max(rule.main.minimum, rule.main.maximum - rule.main.count))
            main = [((anchor - rule.main.minimum + offset) % rule.main.size) + rule.main.minimum for offset in range(rule.main.count)]
            main = sorted(main)
            bonus = sorted(rng.sample(range(rule.bonus.minimum, rule.bonus.maximum + 1), rule.bonus.count))
        tickets.append({rule.main.name: main, rule.bonus.name: bonus})
    return tickets


def _historical_plausibility(lottery_id: str, candidate: dict[str, Any], profile: dict[str, Any]) -> float:
    rule = LOTTERIES[lottery_id]
    main = candidate["numbers"][rule.main.name]
    shape = profile["shape"]
    total = sum(main)
    center = shape["sum_median"]
    p10 = shape["sum_p10"]
    p90 = shape["sum_p90"]
    spread = max(1.0, (p90 - p10) / 2.56)
    sum_score = math.exp(-0.5 * ((total - center) / spread) ** 2)
    odd = sum(value % 2 for value in main)
    expected_odd = shape["odd_distribution"].get(str(round(rule.main.count / 2)), 0.20)
    actual_odd = shape["odd_distribution"].get(str(odd), 0.0)
    odd_score = min(1.0, 0.62 + actual_odd / max(0.15, expected_odd) * 0.18)
    span = max(main) - min(main)
    span_score = math.exp(-abs(span - shape["main_span_median"]) / max(8.0, shape["main_span_median"] * 0.9))
    return round(0.58 * sum_score + 0.24 * odd_score + 0.18 * span_score, 6)


def _settle(
    lottery_id: str,
    candidate: dict[str, Any],
    tickets: list[dict[str, list[int]]],
    actual_entries: int,
    variable_amounts: tuple[float, float],
) -> dict[str, Any]:
    rule = LOTTERIES[lottery_id]
    levels = max_prize_level(lottery_id)
    observed = Counter()
    for ticket in tickets:
        main_hits, bonus_hits = prize_hits(lottery_id, candidate["numbers"], ticket)
        level = prize_level(lottery_id, main_hits, bonus_hits)
        if level:
            observed[level] += 1

    expected = Counter()
    for main_hits, main_probability in enumerate(candidate["main_hit_probabilities"]):
        for bonus_hits, bonus_probability in enumerate(candidate["bonus_hit_probabilities"]):
            level = prize_level(lottery_id, main_hits, bonus_hits)
            if level:
                expected[level] += actual_entries * main_probability * bonus_probability
    counts = {str(level): round(expected[level], 3) for level in range(1, levels + 1)}

    payout = sqrt_payout = 0.0
    for level in range(1, levels + 1):
        if level == 1:
            amount = variable_amounts[0]
        elif level == 2:
            amount = variable_amounts[1]
        else:
            amount = fixed_prize_amount(lottery_id, level)
        payout += counts[str(level)] * amount
        if count := counts[str(level)]:
            sqrt_payout += math.sqrt(count) * amount

    total_winners = sum(counts.values())
    return {
        "counts": counts,
        "total_winners": total_winners,
        "total_payout": round(payout, 2),
        "payout_ratio": round(payout / max(1.0, rule.price * actual_entries), 6),
        "payout_volatility": round(sqrt_payout, 2),
        "sample_win_rate": round(sum(observed.values()) / max(1, len(tickets)), 6),
    }


def _pick_diverse(candidates: list[dict[str, Any]], lottery_id: str, count: int) -> list[dict[str, Any]]:
    rule = LOTTERIES[lottery_id]
    selected: list[dict[str, Any]] = []
    for candidate in candidates:
        main = set(candidate["numbers"][rule.main.name])
        duplicate_penalty = 0
        for other in selected:
            duplicate_penalty += len(main & set(other["numbers"][rule.main.name]))
        if selected and duplicate_penalty >= 8:
            continue
        selected.append(candidate)
        if len(selected) == count:
            break
    if len(selected) < count:
        selected_ids = {id(candidate) for candidate in selected}
        for candidate in candidates:
            if id(candidate) in selected_ids:
                continue
            selected.append(candidate)
            selected_ids.add(id(candidate))
            if len(selected) == count:
                break
    return selected


def recommend(
    lottery_id: str,
    records: list[dict[str, Any]],
    target_min: int | None = None,
    target_max: int | None = None,
    actual_entries: int | None = None,
    candidate_pool: int = 6000,
    ticket_sample: int = 30_000,
    history_influence: float = 0.45,
    birthday_influence: float = 0.35,
    lucky_influence: float = 0.35,
    seed: int = 20261031,
    include_profile: bool = True,
    recommendation_count: int = 5,
) -> dict[str, Any]:
    if lottery_id not in LOTTERIES:
        raise ValueError("不支持的彩种")
    if not records:
        raise ValueError("缺少真实开奖数据，请先刷新数据")
    rule = LOTTERIES[lottery_id]
    profile = build_profile(lottery_id, records)
    defaults = profile["target_defaults"]
    target_min = int(defaults["min"] if target_min is None else target_min)
    target_max = int(defaults["max"] if target_max is None else target_max)
    if target_min > target_max:
        target_min, target_max = target_max, target_min
    if target_min < 0:
        target_min = 0
    target_max = max(target_min, target_max)
    candidate_pool = max(500, min(30_000, int(candidate_pool)))
    ticket_sample = max(2_000, min(100_000, int(ticket_sample)))
    recommendation_count = max(1, min(10, int(recommendation_count)))

    sales = [record.get("sales", 0) for record in records[-40:] if record.get("sales", 0) > 0]
    default_entries = int(statistics.median(sales) / rule.price) if sales else 100_000_000
    actual_entries = int(actual_entries or default_entries)
    actual_entries = max(10_000, min(2_000_000_000, actual_entries))

    main_weights, bonus_weights = popularity_weights(
        lottery_id,
        records,
        history_influence=history_influence,
        birthday_influence=birthday_influence,
        lucky_influence=lucky_influence,
    )
    main_denominator = _elementary_symmetric(main_weights, rule.main.count)[-1]
    bonus_denominator = _elementary_symmetric(bonus_weights, rule.bonus.count)[-1]
    rng = random.Random(seed)
    pool = _candidate_pool(
        lottery_id,
        main_weights,
        bonus_weights,
        main_denominator,
        bonus_denominator,
        candidate_pool,
        rng,
    )
    uniform_probability = 1.0 / rule.total_combinations
    center = (target_min + target_max) / 2
    half_width = max(0.5, (target_max - target_min) / 2)

    for candidate in pool:
        expected = actual_entries * candidate["p_first"]
        candidate["expected_first"] = expected
        candidate["demand_ratio"] = candidate["p_first"] / uniform_probability
        candidate["target_delta"] = max(0.0, abs(expected - center) - half_width)
        candidate["plausibility"] = _historical_plausibility(lottery_id, candidate, profile)
        candidate["fit_score"] = (
            candidate["target_delta"] / max(1.0, center)
            + 0.22 * (1 - candidate["plausibility"])
            + 0.08 * max(0.0, candidate["demand_ratio"] - 1)
        )

    feasible = [candidate for candidate in pool if target_min <= candidate["expected_first"] <= target_max]
    source_pool = feasible or pool
    ranked_all = sorted(source_pool, key=lambda item: (item["fit_score"], -item["plausibility"]))
    ranked = ranked_all[: max(30, recommendation_count * 6)]
    support_pool = ranked_all[: min(600, len(ranked_all))]
    support_weights = [1.0 / math.sqrt(index + 1) for index in range(len(support_pool))]
    support_total = sum(support_weights)
    prediction_support: dict[str, list[float]] = {}
    for zone in (rule.main, rule.bonus):
        values = [0.0] * zone.size
        for weight, candidate in zip(support_weights, support_pool):
            for number in candidate["numbers"][zone.name]:
                values[number - zone.minimum] += weight
        maximum = max(values, default=1.0)
        prediction_support[zone.name] = [
            round(value / maximum, 6) if maximum else 0.0 for value in values
        ]

    tickets = _population(lottery_id, main_weights, bonus_weights, ticket_sample, rng)
    variable_amounts = _variable_amount_history(lottery_id, records)
    for candidate in ranked:
        candidate["main_hit_probabilities"] = _exact_match_distribution(
            main_weights,
            rule.main.minimum,
            candidate["numbers"][rule.main.name],
            rule.main.count,
            main_denominator,
        )
        candidate["bonus_hit_probabilities"] = _exact_match_distribution(
            bonus_weights,
            rule.bonus.minimum,
            candidate["numbers"][rule.bonus.name],
            rule.bonus.count,
            bonus_denominator,
        )
        candidate["settlement"] = _settle(
            lottery_id,
            candidate,
            tickets,
            actual_entries,
            variable_amounts,
        )
    recommendations = _pick_diverse(ranked, lottery_id, recommendation_count)

    result_recommendations = []
    for index, candidate in enumerate(recommendations, start=1):
        settlement = candidate["settlement"]
        model_score = max(
            0.0,
            min(
                100.0,
                100
                - 46 * min(1.0, abs(candidate["expected_first"] - center) / max(1.0, center))
                - 20 * abs(1 - candidate["demand_ratio"])
                - 18 * (1 - candidate["plausibility"]),
            ),
        )
        result_recommendations.append(
            {
                "rank": index,
                "numbers": candidate["numbers"],
                "expected_first_winners": round(candidate["expected_first"], 3),
                "expected_second_winners": settlement["counts"].get("2", 0),
                "expected_total_winners": settlement["total_winners"],
                "expected_payout": settlement["total_payout"],
                "payout_ratio": settlement["payout_ratio"],
                "prize_counts": settlement["counts"],
                "demand_ratio": round(candidate["demand_ratio"], 3),
                "plausibility": round(candidate["plausibility"] * 100, 1),
                "model_score": round(model_score, 1),
                "within_target": target_min <= candidate["expected_first"] <= target_max,
            }
        )

    actual_median = profile["payout_history"]["top_winner_median"]
    return {
        "lottery": lottery_id,
        "name": rule.name,
        "seed": seed,
        "assumptions": {
            "hypothesis": "开奖方可在合成投注分布中选择开奖组合",
            "crowd_data": "合成投注人群；非真实逐注销售数据",
            "ticket_sample": ticket_sample,
            "settlement_method": "加权精确概率；票样仅做交叉检查",
            "candidate_pool": candidate_pool,
            "actual_entries": actual_entries,
            "variable_prize_amounts": list(variable_amounts),
            "add_on_included": False,
        },
        "target": {
            "min": target_min,
            "max": target_max,
            "historical_median": actual_median,
            "feasible_candidates": len(feasible),
        },
        "recommendations": result_recommendations,
        "crowd_weights": {
            rule.main.name: [round(weight, 4) for weight in main_weights],
            rule.bonus.name: [round(weight, 4) for weight in bonus_weights],
        },
        "prediction_support": prediction_support,
        "support_finalists": len(support_pool),
        "support_total_weight": round(support_total, 6),
        "profile": profile if include_profile else None,
        "disclaimer": "这是反事实沙盘结果。真实开奖独立随机，模型分数不是中奖概率或收益保证。",
    }


def _variable_amount_history(lottery_id: str, records: list[dict[str, Any]]) -> tuple[float, float]:
    recent = records[-100:]
    first_amounts = []
    second_amounts = []
    for record in recent:
        amounts = record.get("prize_amounts", {})
        if amounts.get("1", 0) > 0:
            first_amounts.append(float(amounts["1"]))
        if amounts.get("2", 0) > 0:
            second_amounts.append(float(amounts["2"]))
    default_first, default_second = (6_500_000.0, 80_000.0) if lottery_id == "ssq" else (6_000_000.0, 70_000.0)
    return (
        float(statistics.median(first_amounts)) if first_amounts else default_first,
        float(statistics.median(second_amounts)) if second_amounts else default_second,
    )
