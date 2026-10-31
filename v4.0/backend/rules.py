"""Lottery definitions and prize rules used by the v4.0 workbench."""

from __future__ import annotations

from dataclasses import dataclass
from math import comb
from typing import Iterable


@dataclass(frozen=True)
class ZoneRule:
    name: str
    minimum: int
    maximum: int
    count: int

    @property
    def size(self) -> int:
        return self.maximum - self.minimum + 1

    @property
    def combinations(self) -> int:
        return comb(self.size, self.count)


@dataclass(frozen=True)
class LotteryRule:
    lottery_id: str
    name: str
    main: ZoneRule
    bonus: ZoneRule
    price: int
    api_name: str

    @property
    def total_combinations(self) -> int:
        return self.main.combinations * self.bonus.combinations


LOTTERIES: dict[str, LotteryRule] = {
    "ssq": LotteryRule(
        lottery_id="ssq",
        name="双色球",
        main=ZoneRule("红球", 1, 33, 6),
        bonus=ZoneRule("蓝球", 1, 16, 1),
        price=2,
        api_name="双色球",
    ),
    "dlt": LotteryRule(
        lottery_id="dlt",
        name="超级大乐透",
        main=ZoneRule("前区", 1, 35, 5),
        bonus=ZoneRule("后区", 1, 12, 2),
        price=2,
        api_name="超级大乐透",
    ),
}


def normalize_numbers(lottery_id: str, numbers: dict[str, Iterable[int]]) -> dict[str, list[int]]:
    rule = LOTTERIES[lottery_id]
    main = sorted({int(value) for value in numbers.get(rule.main.name, [])})
    bonus = sorted({int(value) for value in numbers.get(rule.bonus.name, [])})
    return {rule.main.name: main, rule.bonus.name: bonus}


def validate_draw(lottery_id: str, numbers: dict[str, Iterable[int]]) -> list[int]:
    rule = LOTTERIES[lottery_id]
    normalized = normalize_numbers(lottery_id, numbers)
    main = normalized[rule.main.name]
    bonus = normalized[rule.bonus.name]
    if len(main) != rule.main.count:
        return [f"{rule.main.name}需要 {rule.main.count} 个不重复号码"]
    if len(bonus) != rule.bonus.count:
        return [f"{rule.bonus.name}需要 {rule.bonus.count} 个不重复号码"]
    if main[0] < rule.main.minimum or main[-1] > rule.main.maximum:
        return [f"{rule.main.name}号码超出范围"]
    if bonus[0] < rule.bonus.minimum or bonus[-1] > rule.bonus.maximum:
        return [f"{rule.bonus.name}号码超出范围"]
    return []


def prize_hits(lottery_id: str, winning: dict[str, list[int]], ticket: dict[str, list[int]]) -> tuple[int, int]:
    """Return (main hits, bonus hits) for a single synthetic ticket."""
    rule = LOTTERIES[lottery_id]
    main_hits = len(set(winning[rule.main.name]) & set(ticket[rule.main.name]))
    bonus_hits = len(set(winning[rule.bonus.name]) & set(ticket[rule.bonus.name]))
    return main_hits, bonus_hits


SSQ_FIXED_PRIZES = {3: 3_000, 4: 200, 5: 10, 6: 5}
DLT_FIXED_PRIZES = {3: 10_000, 4: 3_000, 5: 300, 6: 200, 7: 100, 8: 15, 9: 5}


def prize_level(lottery_id: str, main_hits: int, bonus_hits: int) -> int | None:
    if lottery_id == "ssq":
        if main_hits == 6 and bonus_hits == 1:
            return 1
        if main_hits == 6:
            return 2
        if main_hits == 5 and bonus_hits == 1:
            return 3
        if (main_hits == 5 and bonus_hits == 0) or (main_hits == 4 and bonus_hits == 1):
            return 4
        if (main_hits == 4 and bonus_hits == 0) or (main_hits == 3 and bonus_hits == 1):
            return 5
        if bonus_hits == 1 and main_hits <= 2:
            return 6
        return None

    if lottery_id == "dlt":
        if main_hits == 5 and bonus_hits == 2:
            return 1
        if main_hits == 5 and bonus_hits == 1:
            return 2
        if main_hits == 5 and bonus_hits == 0:
            return 3
        if main_hits == 4 and bonus_hits == 2:
            return 4
        if main_hits == 4 and bonus_hits == 1:
            return 5
        if main_hits == 3 and bonus_hits == 2:
            return 6
        if main_hits == 4 and bonus_hits == 0:
            return 7
        if (main_hits == 3 and bonus_hits == 1) or (main_hits == 2 and bonus_hits == 2):
            return 8
        if (main_hits == 3 and bonus_hits == 0) or (main_hits == 2 and bonus_hits == 1) or (
            main_hits == 1 and bonus_hits == 2
        ) or (main_hits == 0 and bonus_hits == 2):
            return 9
    return None


def fixed_prize_amount(lottery_id: str, level: int) -> float:
    table = SSQ_FIXED_PRIZES if lottery_id == "ssq" else DLT_FIXED_PRIZES
    return float(table.get(level, 0))


def variable_prize_levels(lottery_id: str) -> tuple[int, ...]:
    return (1, 2)


def max_prize_level(lottery_id: str) -> int:
    return 6 if lottery_id == "ssq" else 9
