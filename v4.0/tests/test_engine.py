from __future__ import annotations

import unittest

from backend.backtest import available_wager_types, run_backtest
from backend.engine import _elementary_symmetric, _exact_match_distribution, recommend
from backend.profile import build_profile
from backend.rules import prize_level, validate_draw
from backend.sources import parse_dlt_record, parse_ssq_record
from backend.store import DrawStore


class SourceParsingTests(unittest.TestCase):
    def test_parse_ssq(self) -> None:
        record = parse_ssq_record(
            {
                "code": "2026001",
                "date": "2026-01-01(四)",
                "red": "03,11,17,22,23,29",
                "blue": "09",
                "sales": "346,568,144",
                "poolmoney": "1,075,698,427",
                "prizegrades": [{"type": 1, "typenum": "8", "typemoney": "6,656,899"}],
            }
        )
        self.assertIsNotNone(record)
        self.assertEqual(record["numbers"]["红球"], [3, 11, 17, 22, 23, 29])
        self.assertEqual(record["prize_counts"]["1"], 8)
        self.assertEqual(record["prize_amounts"]["1"], 6_656_899)

    def test_parse_dlt_nine_level_prices(self) -> None:
        record = parse_dlt_record(
            {
                "lotteryDrawNum": "26124",
                "lotteryDrawTime": "2026-10-31 21:25:00",
                "lotteryDrawResult": "12 14 18 22 27 01 09",
                "totalSaleAmount": "300,000,000",
                "poolBalanceAfterdraw": "700,000,000",
                "prizeLevelList": [
                    {"prizeLevel": "一等奖", "stakeCount": "5", "stakeAmount": "5,750,462"},
                    {"prizeLevel": "一等奖(追加)", "stakeCount": "2", "stakeAmount": "4,600,369"},
                    {"prizeLevel": "九等奖", "stakeCount": "1,234,567", "stakeAmount": "5"},
                ],
            }
        )
        self.assertIsNotNone(record)
        self.assertEqual(record["prize_counts"]["1"], 5)
        self.assertEqual(record["prize_counts"]["9"], 1_234_567)
        self.assertNotIn("追加", str(record["prize_amounts"]))


class PrizeRuleTests(unittest.TestCase):
    def test_ssq_top_levels(self) -> None:
        self.assertEqual(prize_level("ssq", 6, 1), 1)
        self.assertEqual(prize_level("ssq", 6, 0), 2)
        self.assertEqual(prize_level("ssq", 5, 1), 3)
        self.assertEqual(prize_level("ssq", 2, 1), 6)
        self.assertIsNone(prize_level("ssq", 2, 0))

    def test_dlt_current_nine_levels(self) -> None:
        expected = {
            (5, 2): 1,
            (5, 1): 2,
            (5, 0): 3,
            (4, 2): 4,
            (4, 1): 5,
            (3, 2): 6,
            (4, 0): 7,
            (3, 1): 8,
            (2, 2): 8,
            (3, 0): 9,
            (2, 1): 9,
            (1, 2): 9,
            (0, 2): 9,
        }
        for hits, level in expected.items():
            self.assertEqual(prize_level("dlt", *hits), level)
        self.assertIsNone(prize_level("dlt", 1, 0))

    def test_draw_validation(self) -> None:
        self.assertEqual(validate_draw("ssq", {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [8]}), [])
        self.assertTrue(validate_draw("ssq", {"红球": [1, 2, 3, 4, 5], "蓝球": [8]}))

    def test_weighted_exact_hit_probabilities_sum_to_one(self) -> None:
        weights = [0.8, 1.0, 1.2, 1.4, 0.9, 1.1]
        denominator = _elementary_symmetric(weights, 2)[-1]
        distribution = _exact_match_distribution(weights, 1, [2, 5], 2, denominator)
        self.assertAlmostEqual(sum(distribution), 1.0, places=10)


class EngineIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.store = DrawStore()
        cls.ssq = cls.store.load("ssq")
        cls.dlt = cls.store.load("dlt")

    def test_real_data_available(self) -> None:
        self.assertGreaterEqual(len(self.ssq), 1000)
        self.assertGreaterEqual(len(self.dlt), 1000)
        self.assertGreater(build_profile("ssq", self.ssq)["count"], 0)
        self.assertGreater(build_profile("dlt", self.dlt)["count"], 0)

    def test_recommendation_is_deterministic_and_complete(self) -> None:
        first = recommend("ssq", self.ssq, target_min=5, target_max=7, candidate_pool=1000, ticket_sample=3000, seed=99)
        second = recommend("ssq", self.ssq, target_min=5, target_max=7, candidate_pool=1000, ticket_sample=3000, seed=99)
        self.assertEqual(first["recommendations"], second["recommendations"])
        self.assertEqual(len(first["recommendations"]), 5)
        for candidate in first["recommendations"]:
            self.assertEqual(len(candidate["numbers"]["红球"]), 6)
            self.assertEqual(len(candidate["numbers"]["蓝球"]), 1)
            self.assertEqual(len(candidate["prize_counts"]), 6)
            self.assertGreaterEqual(candidate["expected_payout"], 0)

    def test_dlt_recommendation_has_nine_price_levels(self) -> None:
        result = recommend("dlt", self.dlt, target_min=4, target_max=6, candidate_pool=1000, ticket_sample=3000, seed=7)
        self.assertEqual(len(result["recommendations"][0]["prize_counts"]), 9)
        self.assertIn("反事实", result["disclaimer"])
        self.assertLess(result["recommendations"][0]["expected_second_winners"], 500)
        self.assertLess(result["recommendations"][0]["payout_ratio"], 1.0)

    def test_collective_strategy_outputs_driver_scores(self) -> None:
        result = recommend(
            "ssq",
            self.ssq,
            candidate_pool=500,
            ticket_sample=2000,
            recommendation_count=2,
            strategy="combined",
            target_return=0.45,
            seed=17,
        )
        self.assertEqual(result["strategy"]["id"], "combined")
        candidate = result["recommendations"][0]
        self.assertEqual(
            set(candidate["drivers"]),
            {"target", "payout", "anti_crowd", "robust", "state", "plausibility"},
        )
        self.assertLessEqual(candidate["robust_jackpot_range"][0], candidate["robust_jackpot_range"][1])
        self.assertIn("current", result["state_model"])

    def test_walk_forward_backtest_uses_only_history(self) -> None:
        first_index = len(self.ssq) - 3
        result = run_backtest(
            "ssq",
            self.ssq,
            test_count=3,
            candidate_pool=500,
            ticket_sample=2000,
            compare_neutral=False,
            seed=11,
        )
        self.assertEqual(len(result["rows"]), 3)
        for offset, row in enumerate(result["rows"]):
            target_index = first_index + offset
            self.assertEqual(row["draw_no"], self.ssq[target_index]["draw_no"])
            self.assertEqual(row["training_through"], self.ssq[target_index - 1]["draw_no"])
            self.assertEqual(len(row["candidates"]), 5)
        self.assertGreater(result["metrics"]["single_ticket_random_any_prize_probability"], 0)
        self.assertLess(result["metrics"]["single_ticket_random_any_prize_probability"], 1)
        self.assertEqual(result["method"], "walk_forward_no_lookahead")
        self.assertEqual([item["id"] for item in result["portfolio"]], ["6+1"] * 5)
        self.assertEqual(result["rows"][0]["cost"], 10)

    def test_custom_mixed_portfolio(self) -> None:
        types = available_wager_types("ssq")
        self.assertEqual(len(types), 12)
        self.assertIn("9+3", {item["id"] for item in types})
        result = run_backtest(
            "ssq",
            self.ssq,
            test_count=1,
            candidate_pool=500,
            ticket_sample=2000,
            compare_neutral=False,
            seed=11,
            portfolio=["6+1", "6+1", "7+1", "7+2", "8+1"],
        )
        self.assertEqual(result["rows"][0]["cost"], 102)
        self.assertEqual(result["settings"]["portfolio_cost_per_issue"], 102)
        self.assertEqual(len(result["rows"][0]["candidates"]), 5)
        expected_portfolio = ["6+1", "6+1", "7+1", "7+2", "8+1"]
        for candidate, type_id in zip(result["rows"][0]["candidates"], expected_portfolio):
            self.assertEqual(candidate["wager_type"]["id"], type_id)


if __name__ == "__main__":
    unittest.main()
