# -*- coding: utf-8 -*-
"""
测试优化后的投注模拟器
验证文档参数是否正确应用
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.core.purchase_simulator import EnhancedPurchaseSimulator, DEFAULT_CONFIGS

def test_dlt_addon_ratio():
    """测试大乐透追加占比是否为40%"""
    print("=" * 60)
    print("测试大乐透追加占比（预期40%）")
    print("=" * 60)
    
    simulator = EnhancedPurchaseSimulator('dlt')
    config = simulator.get_config()
    
    print(f"追加功能启用: {config.addon.enabled}")
    print(f"追加占比配置: {config.addon.ratio * 100:.1f}%")
    
    # 模拟大量投注统计追加比例
    test_count = 10000
    addon_count = 0
    total_cost = 0.0
    
    for i in range(test_count):
        bet = simulator.generate_full_bet()
        if bet['addon']:
            addon_count += 1
        total_cost += bet['cost']
    
    actual_ratio = addon_count / test_count * 100
    print(f"\n模拟 {test_count} 注:")
    print(f"  追加注数: {addon_count}")
    print(f"  实际追加比例: {actual_ratio:.2f}%")
    print(f"  与预期(40%)偏差: {(actual_ratio - 40):+.2f}个百分点")
    
    if abs(actual_ratio - 40) < 2:
        print("  OK 追加占比测试通过")
    else:
        print("  FAIL 追加占比测试未通过")
    
    print(f"\n平均每注成本: CNY {total_cost / test_count:.2f}")
    print(f"预期平均成本(含追加): CNY {2 * 1 + 0.4 * 1:.2f} (基础2元 + 追加0.4元)")

def test_bet_type_distribution(lottery_id, expected_dist):
    """测试投注类型分布"""
    print(f"\n{'=' * 60}")
    print(f"测试{DEFAULT_CONFIGS[lottery_id].lottery_id}投注类型分布")
    print(f"{'=' * 60}")
    
    simulator = EnhancedPurchaseSimulator(lottery_id)
    test_count = 10000
    counts = {'single': 0, 'complex': 0, 'dan_tuo': 0}
    
    for _ in range(test_count):
        bet = simulator.generate_full_bet()
        counts[bet['bet_type']] += 1
    
    print("实际分布:")
    for bet_type, cnt in counts.items():
        ratio = cnt / test_count * 100
        expected = expected_dist.get(bet_type, 0) * 100
        print(f"  {bet_type}: {cnt} 注 ({ratio:.1f}%)  预期: {expected:.1f}%")
    
    print("\nOK 投注类型分布测试完成")

def test_multiplier_distribution():
    """测试倍投分布"""
    print(f"\n{'=' * 60}")
    print("测试倍投分布")
    print(f"{'=' * 60}")
    
    simulator = EnhancedPurchaseSimulator('ssq')
    test_count = 10000
    buckets = {'1x': 0, '2-5x': 0, '6-20x': 0, '20x+': 0}
    
    for _ in range(test_count):
        mult = simulator.generate_multiplier()
        if mult == 1:
            buckets['1x'] += 1
        elif 2 <= mult <= 5:
            buckets['2-5x'] += 1
        elif 6 <= mult <= 20:
            buckets['6-20x'] += 1
        else:
            buckets['20x+'] += 1
    
    print("实际倍投分布:")
    for bucket, cnt in buckets.items():
        ratio = cnt / test_count * 100
        print(f"  {bucket}: {cnt} 注 ({ratio:.1f}%)")
    
    print("\nOK 倍投分布测试完成")

def test_number_features():
    """测试号码特征（热门/冷门号码）"""
    print(f"\n{'=' * 60}")
    print("测试号码特征（热门/冷门号码权重）")
    print(f"{'=' * 60}")
    
    simulator = EnhancedPurchaseSimulator('ssq')
    config = simulator.get_config()
    
    print(f"热门号码: {config.number_feature.hot_numbers}")
    print(f"冷门号码: {config.number_feature.cold_numbers}")
    print(f"热门概率上浮: {config.number_feature.hot_bonus * 100:.0f}%")
    print(f"冷门概率下调: {config.number_feature.cold_penalty * 100:.0f}%")
    
    # 统计号码出现频率
    test_count = 10000
    number_counts = {}
    
    for _ in range(test_count):
        bet = simulator.generate_single_bet()
        for num in bet['红球']:
            number_counts[num] = number_counts.get(num, 0) + 1
    
    # 计算热门和冷门号码的平均频率
    hot_avg = sum(number_counts.get(n, 0) for n in config.number_feature.hot_numbers) / len(config.number_feature.hot_numbers)
    cold_avg = sum(number_counts.get(n, 0) for n in config.number_feature.cold_numbers) / len(config.number_feature.cold_numbers)
    overall_avg = sum(number_counts.values()) / 33
    
    print(f"\n{test_count} 注统计:")
    print(f"  热门号码平均出现: {hot_avg:.1f} 次")
    print(f"  冷门号码平均出现: {cold_avg:.1f} 次")
    print(f"  所有号码平均出现: {overall_avg:.1f} 次")
    print(f"  热门/整体比值: {hot_avg / overall_avg:.2f} (预期 > 1.1)")
    print(f"  冷门/整体比值: {cold_avg / overall_avg:.2f} (预期 < 0.92)")
    
    if hot_avg / overall_avg > 1.1 and cold_avg / overall_avg < 0.92:
        print("  OK 号码特征测试通过")
    else:
        print("  FAIL 号码特征测试未通过")

def main():
    # 测试大乐透追加占比（重点验证）
    test_dlt_addon_ratio()
    
    # 测试双色球投注类型分布
    test_bet_type_distribution('ssq', {
        'single': 0.60,
        'complex': 0.30,
        'dan_tuo': 0.10
    })
    
    # 测试大乐透投注类型分布
    test_bet_type_distribution('dlt', {
        'single': 0.55,
        'complex': 0.35,
        'dan_tuo': 0.10
    })
    
    # 测试倍投分布
    test_multiplier_distribution()
    
    # 测试号码特征
    test_number_features()
    
    print(f"\n{'=' * 60}")
    print("所有测试完成！")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    main()
