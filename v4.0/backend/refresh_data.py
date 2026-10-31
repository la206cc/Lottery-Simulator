"""Command-line data refresh."""

from __future__ import annotations

import argparse

from .store import DrawStore


def main() -> None:
    parser = argparse.ArgumentParser(description="下载双色球与超级大乐透真实开奖数据")
    parser.add_argument("--lottery", choices=["ssq", "dlt", "all"], default="all")
    parser.add_argument("--limit", type=int, default=1000)
    args = parser.parse_args()
    store = DrawStore()
    ids = ["ssq", "dlt"] if args.lottery == "all" else [args.lottery]
    for lottery_id in ids:
        result = store.refresh(lottery_id, args.limit)
        print(f"{lottery_id}: {result['count']} 期，新增 {result['added']}，最新 {result['latest']}")


if __name__ == "__main__":
    main()
