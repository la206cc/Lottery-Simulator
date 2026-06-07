# -*- coding: utf-8 -*-
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import time, math, random, gc, ctypes
import numpy as np
import tracemalloc
from dataclasses import dataclass, field
from typing import List, Dict, Optional

from src.config.lottery_config import get_lottery_config

def get_mem_mb():
    try:
        class PMC(ctypes.Structure):
            _fields_ = [("cb", ctypes.c_ulong),
                       ("PageFaultCount", ctypes.c_ulong),
                       ("PeakWorkingSetSize", ctypes.c_size_t),
                       ("WorkingSetSize", ctypes.c_size_t),
                       ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
                       ("QuotaPagedPoolUsage", ctypes.c_size_t),
                       ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                       ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                       ("PagefileUsage", ctypes.c_size_t),
                       ("PeakPagefileUsage", ctypes.c_size_t)]
        pmc = PMC()
        pmc.cb = ctypes.sizeof(PMC)
        k = ctypes.windll.kernel32
        k.GetProcessMemoryInfo(k.GetCurrentProcess(), ctypes.byref(pmc), ctypes.sizeof(pmc))
        return pmc.WorkingSetSize / 1048576
    except Exception:
        return 0.0

def hs(s):
    if s < 0.001: return f"{s*1e6:.1f}微秒"
    if s < 1: return f"{s*1000:.2f}毫秒"
    if s < 60: return f"{s:.2f}秒"
    m, s = divmod(s, 60)
    return f"{int(m)}分{s:.1f}秒"

def C(n, k):
    if k < 0 or k > n: return 0
    return math.comb(n, k)

@dataclass
class BetPackage:
    red_count: int
    blue_count: int
    multiplier: int
    ticket_count: int
    amount: float
    raw_tickets: int = 0

@dataclass
class SalesDistribution:
    total_amount: float
    total_bets: int
    packages: List[BetPackage] = field(default_factory=list)

def build_distribution(total_amount=100_000_000.0, rng=None):
    if rng is None: rng = random.Random(42)
    cfg = get_lottery_config("ssq")
    price = cfg.price_per_bet
    dist = SalesDistribution(total_amount=total_amount, total_bets=0)
    pkgs = dist.packages

    single_amount = total_amount * 0.85
    for mult, ratio in [(1, 0.70), (2, 0.18), (3, 0.08), (5, 0.04)]:
        group = single_amount * ratio
        num = int(group // (price * mult))
        if num > 0:
            pkgs.append(BetPackage(6, 1, mult, num * mult, num * price * mult, num))
            dist.total_bets += num * mult

    small_amount = total_amount * 0.10
    for red_n, ratio in [(7, 0.45), (8, 0.30), (9, 0.15), (10, 0.10)]:
        group = small_amount * ratio
        bets_per = C(red_n, 6)
        cost_per = bets_per * price
        mult = rng.choice([1, 1, 1, 2, 2, 3])
        num = int(group // (cost_per * mult))
        if num > 0:
            pkgs.append(BetPackage(red_n, 1, mult, num * bets_per * mult, num * cost_per * mult, num))
            dist.total_bets += num * bets_per * mult

    mid_amount = total_amount * 0.03
    mid_specs = [(11, 1, 0.30), (12, 1, 0.25), (12, 2, 0.20), (14, 1, 0.15), (16, 2, 0.10)]
    for red_n, blue_n, ratio in mid_specs:
        group = mid_amount * ratio
        bets_per = C(red_n, 6) * blue_n
        num = max(1, int(group // (bets_per * price)))
        pkgs.append(BetPackage(red_n, blue_n, 1, num * bets_per, num * bets_per * price, num))
        dist.total_bets += num * bets_per

    big_amount = total_amount * 0.02
    big_specs = [(18, 3, 0.40), (20, 4, 0.35), (22, 5, 0.25)]
    for red_n, blue_n, ratio in big_specs:
        group = big_amount * ratio
        bets_per = C(red_n, 6) * blue_n
        num = max(1, int(group // (bets_per * price)))
        pkgs.append(BetPackage(red_n, blue_n, 1, num * bets_per, num * bets_per * price, num))
        dist.total_bets += num * bets_per

    return dist

def draw_ssq(rng=None):
    if rng is None: rng = random.Random()
    return sorted(rng.sample(range(1, 34), 6)), rng.randint(1, 16)

def match_level(k, b):
    if k == 6 and b == 1: return 1
    if k == 6 and b == 0: return 2
    if k == 5 and b == 1: return 3
    if (k == 5 and b == 0) or (k == 4 and b == 1): return 4
    if (k == 4 and b == 0) or (k == 3 and b == 1): return 5
    if b == 1: return 6
    return 0

def benchmark_classic(draw_reds, draw_blue, sizes):
    rng = random.Random(999)
    red_set = set(draw_reds)
    results = []
    for size in sizes:
        gc.collect()
        t0 = time.perf_counter()
        mem0 = get_mem_mb()
        counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}
        for _ in range(size):
            tr = set(rng.sample(range(1, 34), 6))
            tb = rng.randint(1, 16)
            hit = len(red_set & tr)
            hb = 1 if draw_blue == tb else 0
            lvl = match_level(hit, hb)
            if lvl > 0: counts[lvl] += 1
        elapsed = time.perf_counter() - t0
        mem1 = get_mem_mb()
        results.append({"size": size, "elapsed": elapsed, "wins": counts, "mem": mem1 - mem0})
    return results

def compute_wins_complex(draw_reds, draw_blue, package, rng=None):
    if rng is None: rng = random.Random(777)
    red_set = set(draw_reds)
    counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}
    for _ in range(package.raw_tickets):
        ticket_reds = set(rng.sample(range(1, 34), package.red_count))
        if package.blue_count > 1:
            ticket_blues = set(rng.sample(range(1, 17), package.blue_count))
        else:
            ticket_blues = {rng.randint(1, 16)}
        r = len(ticket_reds & red_set)
        has_blue = 1 if draw_blue in ticket_blues else 0
        for k in range(0, 7):
            ways = C(r, k) * C(package.red_count - r, 6 - k)
            if ways == 0: continue
            if has_blue:
                blue_hits = ways * package.multiplier
                blue_miss = ways * (package.blue_count - 1) * package.multiplier
            else:
                blue_hits = 0
                blue_miss = ways * package.blue_count * package.multiplier
            if blue_hits > 0:
                lvl = match_level(k, 1)
                if lvl > 0: counts[lvl] += blue_hits
            if blue_miss > 0:
                lvl = match_level(k, 0)
                if lvl > 0: counts[lvl] += blue_miss
    return counts

_SSQ_PROBS = None

def ssq_probs():
    global _SSQ_PROBS
    if _SSQ_PROBS is not None: return _SSQ_PROBS
    total = C(33, 6) * 16
    ways = lambda k: C(6, k) * C(27, 6 - k)
    probs = {
        1: ways(6) * 1 / total,
        2: ways(6) * 15 / total,
        3: ways(5) * 1 / total,
        4: (ways(5) * 15 + ways(4) * 1) / total,
        5: (ways(4) * 15 + ways(3) * 1) / total,
        6: (ways(2) + ways(1) + ways(0)) * 1 / total,
    }
    _SSQ_PROBS = probs
    return probs

def estimate_wins_by_probability(num_bets, rng=None):
    if rng is None: rng = np.random.default_rng(888)
    probs = ssq_probs()
    counts = {}
    for lvl, p in probs.items():
        lam = p * num_bets
        counts[lvl] = int(rng.poisson(lam))
    return counts

def run_efficient(dist, draw_reds, draw_blue):
    t0 = time.perf_counter()
    tracemalloc.start()
    mem_before = get_mem_mb()
    total_counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}
    breakdown = []
    np_rng = np.random.default_rng(2026)
    py_rng = random.Random(2026)

    for pkg in dist.packages:
        pkg_t0 = time.perf_counter()
        if pkg.red_count == 6 and pkg.blue_count == 1 and pkg.raw_tickets > 10000:
            wins = estimate_wins_by_probability(pkg.ticket_count, np_rng)
            method = "概率估算"
        else:
            wins = compute_wins_complex(draw_reds, draw_blue, pkg, py_rng)
            method = "组合展开"
        pkg_elapsed = time.perf_counter() - pkg_t0

        for lvl, c in wins.items():
            total_counts[lvl] += c
        breakdown.append({
            "type": f"{pkg.red_count}红+{pkg.blue_count}蓝×{pkg.multiplier}倍",
            "method": method,
            "tickets": pkg.raw_tickets,
            "bets": pkg.ticket_count,
            "amount": pkg.amount,
            "wins": dict(wins),
            "elapsed": pkg_elapsed,
        })

    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    mem_after = get_mem_mb()
    elapsed_total = time.perf_counter() - t0

    return {
        "elapsed_total": elapsed_total,
        "total_counts": total_counts,
        "breakdown": breakdown,
        "peak_mb": peak / 1048576,
        "mem_delta_mb": mem_after - mem_before,
    }

def compute_prize_pool(total_amount, counts):
    cfg = get_lottery_config("ssq")
    total_pool = total_amount * cfg.pool_ratio
    fixed_cost = 0
    fixed_detail = {}
    for tier in cfg.prizes:
        if tier.fixed:
            n = counts.get(tier.level, 0)
            cost = n * tier.amount
            fixed_cost += cost
            fixed_detail[tier.level] = {"name": tier.name, "count": n, "per": tier.amount, "total": cost}
    floating_pool = max(total_pool - fixed_cost, 0)
    l1 = counts.get(1, 0)
    l2 = counts.get(2, 0)
    l1_per = min(int((floating_pool * 0.75) / l1), 5000000) if l1 > 0 else 0
    l2_per = int((floating_pool * 0.25) / l2) if l2 > 0 else 0
    return {
        "total_sales": total_amount,
        "total_pool": total_pool,
        "fixed_cost": fixed_cost,
        "floating_pool": floating_pool,
        "fixed_detail": fixed_detail,
        "floating_detail": {
            1: {"name": "一等奖", "count": l1, "per": l1_per, "total": l1_per * l1},
            2: {"name": "二等奖", "count": l2, "per": l2_per, "total": l2_per * l2},
        },
    }

def main():
    print("=" * 70)
    print("  双色球一期模拟（销售额 1 亿元）")
    print("=" * 70)
    TOTAL = 100_000_000.0

    # 阶段1
    print("\n[阶段1] 按销售金额匹配投注方式与数量")
    t1 = time.perf_counter()
    dist = build_distribution(TOTAL, rng=random.Random(42))
    t1_elapsed = time.perf_counter() - t1
    print(f"  销售总额: ¥{dist.total_amount:,.0f}")
    print(f"  折合基本注数: {dist.total_bets:,} 注")
    print(f"  构建耗时: {hs(t1_elapsed)}")
    print()
    total_raw = 0
    for pkg in dist.packages:
        total_raw += pkg.raw_tickets
        print(f"    {pkg.red_count:>2}红+{pkg.blue_count}蓝 × {pkg.multiplier:>2}倍  票:{pkg.raw_tickets:>12,}  注:{pkg.ticket_count:>12,}  金额:¥{pkg.amount:>12,.0f}")
    print(f"  → 共 {total_raw:,} 张独立彩票")

    # 阶段2
    print("\n[阶段2] 生成开奖号码")
    draw_reds, draw_blue = draw_ssq(random.Random(20260607))
    print(f"  红球: {' '.join(f'{x:02d}' for x in draw_reds)}")
    print(f"  蓝球: {draw_blue:02d}")

    # 阶段3 - 方法A基准
    print("\n[阶段3] 方法A: 逐条生成+逐条比对（小规模基准）")
    classic = benchmark_classic(draw_reds, draw_blue, [10000, 100000, 1000000])
    for row in classic:
        rate = row["elapsed"] / row["size"]
        print(f"  {row['size']:>10,} 注 → {hs(row['elapsed']):>12}  (约 {rate*1e6:.2f} 微秒/注)")
    rate_per_bet = classic[-1]["elapsed"] / classic[-1]["size"]
    extrapolated = rate_per_bet * dist.total_bets
    print(f"\n  ★ 外推到 {dist.total_bets:,} 注: 约需 {hs(extrapolated)}")
    print(f"    内存: 100万注级约 {classic[-1]['mem']:.1f} MB (5000万注外推: 约 {classic[-1]['mem']*50:.0f} MB)")

    # 阶段4 - 高效方法
    print("\n" + "="*70)
    print("[阶段4] 方法B+C: 组合数学+概率估算（正式模拟）")
    print("  策略: 大规模单注→概率估算, 复式票→精确展开")
    gc.collect()
    mem0 = get_mem_mb()
    result = run_efficient(dist, draw_reds, draw_blue)
    print(f"\n  ✓ 模拟完成! 总耗时: {hs(result['elapsed_total'])}")
    print(f"  ✓ 峰值内存(Python对象): {result['peak_mb']:.2f} MB")
    print(f"  ✓ 进程内存增量: {result['mem_delta_mb']:.2f} MB")

    print("\n  各分包处理详情:")
    print(f"  {'投注类型':<15} {'方式':<8} {'独立票数':>14} {'基本注数':>14} {'金额':>14} {'耗时':>12}")
    print("  " + "-"*85)
    for row in result["breakdown"]:
        win_str = " ".join(f"{k}等:{v:,}" for k, v in row["wins"].items() if v > 0) or "(未中)"
        print(f"  {row['type']:<15} {row['method']:<8} {row['tickets']:>14,} {row['bets']:>14,} {row['amount']:>14,.0f} {hs(row['elapsed']):>12}")
        print(f"    → {win_str}")

    # 阶段5 - 中奖统计与派奖
    print("\n" + "="*70)
    print("[阶段5] 中奖统计与派奖")
    counts = result["total_counts"]
    print("\n  各奖级注数:")
    probs = ssq_probs()
    names = {1:"一等奖", 2:"二等奖", 3:"三等奖", 4:"四等奖", 5:"五等奖", 6:"六等奖"}
    for lvl in [1, 2, 3, 4, 5, 6]:
        c = counts.get(lvl, 0)
        expected = probs[lvl] * dist.total_bets
        print(f"    {names[lvl]}: 实际 {c:>10,} 注 | 期望 {expected:>12,.1f} 注 | 概率 1/{int(1/probs[lvl]):,}")

    payout = compute_prize_pool(TOTAL, counts)
    print(f"\n  销售总额: ¥{payout['total_sales']:,.0f}")
    print(f"  奖池(51%): ¥{payout['total_pool']:,.0f}")
    print(f"  固定奖支出: ¥{payout['fixed_cost']:,.0f}")
    print(f"  浮动奖池: ¥{payout['floating_pool']:,.0f}")
    print(f"\n  派奖明细:")
    all_detail = {**payout['floating_detail'], **payout['fixed_detail']}
    for lvl in sorted(all_detail.keys()):
        d = all_detail[lvl]
        print(f"    {d['name']}: {d['count']:,} 注 × ¥{d['per']:,} = ¥{d['total']:,.0f}")
    total_payout = sum(d['total'] for d in all_detail.values())
    print(f"\n  合计派奖: ¥{total_payout:,.0f}")
    print(f"  返奖率: {total_payout / TOTAL * 100:.2f}%")

    # 阶段6 - 效率对比
    print("\n" + "="*70)
    print("[效率对比总结]")
    print(f"  方法A(逐条比对) 外推到5000万注: 约 {hs(extrapolated)}")
    print(f"  方法B+C(组合+概率) 实际耗时: {hs(result['elapsed_total'])}")
    speedup = extrapolated / result['elapsed_total'] if result['elapsed_total'] > 0 else float('inf')
    print(f"  提速倍数: 约 {speedup:.1f}×")
    print("="*70)

if __name__ == '__main__':
    main()
