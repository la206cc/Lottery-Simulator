"""Quick terminal interface for counterfactual draw selection."""

from __future__ import annotations

import argparse

from .engine import recommend
from .rules import LOTTERIES
from .store import DrawStore


def main() -> None:
    parser = argparse.ArgumentParser(description="在本地生成反事实候选开奖号码")
    parser.add_argument("--lottery", choices=sorted(LOTTERIES), default="ssq")
    parser.add_argument("--min", dest="target_min", type=int)
    parser.add_argument("--max", dest="target_max", type=int)
    parser.add_argument("--candidates", type=int, default=6000)
    parser.add_argument("--samples", type=int, default=30_000)
    parser.add_argument("--seed", type=int, default=20261031)
    args = parser.parse_args()
    records = DrawStore().load(args.lottery)
    result = recommend(
        args.lottery,
        records,
        target_min=args.target_min,
        target_max=args.target_max,
        candidate_pool=args.candidates,
        ticket_sample=args.samples,
        seed=args.seed,
    )
    print(f"{result['name']} | 目标一等奖 {result['target']['min']}–{result['target']['max']} 注")
    for item in result["recommendations"]:
        zones = " / ".join(
            f"{name} " + " ".join(f"{number:02d}" for number in numbers)
            for name, numbers in item["numbers"].items()
        )
        print(
            f"{item['rank']}. {zones} | 预期头奖 {item['expected_first_winners']:.2f} 注"
            f" | 预期返奖 {item['expected_payout']:,.0f} 元"
            f" | 拟合 {item['model_score']:.1f}"
        )
    print(result["disclaimer"])


if __name__ == "__main__":
    main()
