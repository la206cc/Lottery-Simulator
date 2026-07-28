"""
奖金计算详细测试

测试各种彩种的奖金计算逻辑，确保正确性
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.main import create_engine


def test_ssq_prize_calculation():
    """测试双色球奖金计算"""
    print("=== 测试双色球奖金计算 ===")
    
    engine = create_engine("ssq")
    
    # 测试一等奖（全部命中）
    winning = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
    bet = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
    
    result = engine.calculate_prize(
        winning, bet,
        pool_amount=100000000,
        total_sales=500000000,
        total_bets=250000000
    )
    
    print(f"一等奖测试: {result}")
    assert result["win"] == True, "应该中奖"
    assert result["prize_level"] == 1, "应该是一等奖"
    assert result["prize_amount"] > 0, "奖金应该大于0"
    
    # 测试二等奖（红球全中，蓝球不中）
    bet2 = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [2]}
    
    result2 = engine.calculate_prize(
        winning, bet2,
        pool_amount=100000000,
        total_sales=500000000,
        total_bets=250000000
    )
    
    print(f"二等奖测试: {result2}")
    assert result2["win"] == True, "应该中奖"
    assert result2["prize_level"] == 2, "应该是二等奖"
    assert result2["prize_amount"] >= 6000, "二等奖保底6000元"
    
    print("✓ 双色球奖金计算测试通过\n")
    return True


def test_dlt_prize_calculation():
    """测试大乐透奖金计算"""
    print("=== 测试大乐透奖金计算 ===")
    
    engine = create_engine("dlt")
    
    # 测试一等奖
    winning = {"前区": [1, 2, 3, 4, 5], "后区": [1, 2]}
    bet = {"前区": [1, 2, 3, 4, 5], "后区": [1, 2]}
    
    result = engine.calculate_prize(
        winning, bet,
        pool_amount=100000000,
        total_sales=500000000,
        total_bets=250000000
    )
    
    print(f"大乐透一等奖测试: {result}")
    assert result["win"] == True, "应该中奖"
    assert result["prize_level"] == 1, "应该是一等奖"
    assert result["prize_amount"] > 0, "奖金应该大于0"
    
    print("✓ 大乐透奖金计算测试通过\n")
    return True


def test_high_pool_prize():
    """测试高奖池奖金计算"""
    print("=== 测试高奖池奖金计算 ===")
    
    engine = create_engine("ssq")
    
    # 高奖池（2亿）
    winning = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
    bet = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
    
    result = engine.calculate_prize(
        winning, bet,
        pool_amount=200000000,  # 2亿
        total_sales=1000000000,
        total_bets=500000000
    )
    
    print(f"高奖池一等奖测试: {result}")
    assert result["win"] == True, "应该中奖"
    assert result["prize_level"] == 1, "应该是一等奖"
    # 高奖池时，一等奖分两部分，每部分封顶500万，最大1000万
    assert result["prize_amount"] <= 10000000, "高奖池一等奖封顶1000万"
    
    print("✓ 高奖池奖金计算测试通过\n")
    return True


def test_multiple_rounds_simulation():
    """测试多轮模拟"""
    print("=== 测试多轮模拟 ===")
    
    engine = create_engine("ssq")
    
    # 执行1000轮模拟
    result = engine.simulate(
        num_rounds=1000,
        initial_pool=100000000,
        initial_capital=10000
    )
    
    print(f"模拟轮次: {result['num_rounds']}")
    print(f"总投资: {result['summary']['total_investment']}")
    print(f"总回报: {result['summary']['total_return']}")
    print(f"净利润: {result['summary']['net_profit']}")
    print(f"回报率: {result['summary']['return_rate']:.2%}")
    print(f"中奖次数: {result['summary']['wins']}")
    print(f"中奖率: {result['summary']['win_rate']:.2%}")
    
    # 验证结果
    assert result['num_rounds'] == 1000, "模拟轮次应该为1000"
    assert result['summary']['total_investment'] == 2000, "总投资应该为2000（1000轮 × 2元）"
    assert result['summary']['total_return'] >= 0, "总回报应该大于等于0"
    assert result['summary']['win_rate'] >= 0, "中奖率应该大于等于0"
    assert result['summary']['win_rate'] <= 1, "中奖率应该小于等于1"
    
    print("✓ 多轮模拟测试通过\n")
    return True


def test_analysis_integration():
    """测试分析集成"""
    print("=== 测试分析集成 ===")
    
    engine = create_engine("ssq")
    
    # 执行模拟
    simulation_result = engine.simulate(
        num_rounds=100,
        initial_pool=100000000,
        initial_capital=1000
    )
    
    # 分析数据
    analysis = engine.analyze(
        simulation_result,
        analysis_types=["frequency", "missing", "trend", "prize_distribution"]
    )
    
    print(f"分析类型: {list(analysis.keys())}")
    
    # 验证分析结果
    assert "frequency" in analysis, "应该包含频率分析"
    assert "missing" in analysis, "应该包含遗漏分析"
    assert "trend" in analysis, "应该包含趋势分析"
    assert "prize_distribution" in analysis, "应该包含奖金分布分析"
    
    # 检查频率分析结构
    freq = analysis["frequency"]
    assert "红球" in freq, "频率分析应该包含红球"
    assert "蓝球" in freq, "频率分析应该包含蓝球"
    assert "frequency" in freq["红球"], "红球频率分析应该包含frequency"
    assert "hot_numbers" in freq["红球"], "红球频率分析应该包含hot_numbers"
    
    print("✓ 分析集成测试通过\n")
    return True


def main():
    """主测试函数"""
    print("开始奖金计算详细测试...\n")
    
    tests = [
        test_ssq_prize_calculation,
        test_dlt_prize_calculation,
        test_high_pool_prize,
        test_multiple_rounds_simulation,
        test_analysis_integration
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"测试 {test.__name__} 异常: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("=" * 50)
    print(f"测试结果: {passed} 通过, {failed} 失败")
    print("=" * 50)
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)