"""
核心引擎集成测试

测试各组件协同工作，验证完整的工作流程
"""

import sys
import os
import json
import time

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.main import LotteryEngine, create_engine, load_preset_config, list_presets


def test_basic_workflow():
    """测试基本工作流程"""
    print("=== 测试基本工作流程 ===")
    
    # 1. 创建引擎
    print("1. 创建引擎...")
    engine = create_engine("ssq")
    print(f"   ✓ 引擎创建成功，配置: {engine.get_config().name}")
    
    # 2. 生成开奖号码
    print("2. 生成开奖号码...")
    winning_numbers = engine.generate_numbers()
    print(f"   ✓ 开奖号码: {winning_numbers}")
    
    # 3. 生成投注号码
    print("3. 生成投注号码...")
    bet_numbers = engine.generate_bet("single")
    print(f"   ✓ 投注号码: {bet_numbers}")
    
    # 4. 计算奖金
    print("4. 计算奖金...")
    prize_result = engine.calculate_prize(
        winning_numbers, bet_numbers,
        pool_amount=100000000,
        total_sales=500000000,
        total_bets=250000000
    )
    print(f"   ✓ 奖金计算结果: {prize_result}")
    
    # 5. 执行模拟
    print("5. 执行模拟...")
    simulation_result = engine.simulate(
        num_rounds=100,
        initial_pool=100000000,
        initial_capital=10000
    )
    print(f"   ✓ 模拟完成，总轮次: {simulation_result['num_rounds']}")
    print(f"   ✓ 总投资: {simulation_result['summary']['total_investment']}")
    print(f"   ✓ 总回报: {simulation_result['summary']['total_return']}")
    print(f"   ✓ 净利润: {simulation_result['summary']['net_profit']}")
    print(f"   ✓ 回报率: {simulation_result['summary']['return_rate']:.2%}")
    
    # 6. 分析数据
    print("6. 分析数据...")
    analysis = engine.analyze(
        simulation_result,
        analysis_types=["frequency", "missing", "trend"]
    )
    print(f"   ✓ 分析完成，分析类型: {list(analysis.keys())}")
    
    # 7. 保存结果
    print("7. 保存结果...")
    filepath = engine.save(simulation_result, "integration_test_result")
    print(f"   ✓ 结果已保存到: {filepath}")
    
    # 8. 加载结果
    print("8. 加载结果...")
    loaded_data = engine.load(filepath)
    print(f"   ✓ 加载成功，数据大小: {len(str(loaded_data))} 字符")
    
    # 清理测试文件
    if os.path.exists(filepath):
        os.remove(filepath)
    
    print("✓ 基本工作流程测试通过！\n")
    return True


def test_different_lotteries():
    """测试不同彩种"""
    print("=== 测试不同彩种 ===")
    
    # 列出所有预设
    presets = list_presets()
    print(f"可用预设: {[p['name'] for p in presets]}")
    
    # 测试每个预设
    for preset in presets:
        try:
            print(f"\n测试 {preset['name']} ({preset['id']})...")
            
            # 创建引擎
            engine = create_engine(preset['id'])
            
            # 生成号码
            winning_numbers = engine.generate_numbers()
            bet_numbers = engine.generate_bet("single")
            
            # 计算奖金
            prize_result = engine.calculate_prize(
                winning_numbers, bet_numbers,
                pool_amount=100000000,
                total_sales=500000000,
                total_bets=250000000
            )
            
            # 执行模拟（小规模）
            simulation_result = engine.simulate(
                num_rounds=10,
                initial_pool=100000000,
                initial_capital=1000
            )
            
            print(f"   ✓ {preset['name']} 测试通过")
            
        except Exception as e:
            print(f"   ✗ {preset['name']} 测试失败: {e}")
            return False
    
    print("✓ 不同彩种测试通过！\n")
    return True


def test_strategies():
    """测试不同策略"""
    print("=== 测试不同策略 ===")
    
    engine = create_engine("ssq")
    
    strategies = [
        {"name": "random", "params": {}},
        {"name": "hot_numbers", "params": {"hot_numbers": {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}}},
        {"name": "cold_numbers", "params": {"cold_numbers": {"红球": [28, 29, 30, 31, 32, 33], "蓝球": [16]}}},
        {"name": "birthday", "params": {"birthday": "1990-01-15"}},
        {"name": "consecutive", "params": {"start": 1}},
    ]
    
    for strategy in strategies:
        try:
            print(f"测试策略: {strategy['name']}...")
            
            # 执行模拟
            result = engine.simulate(
                num_rounds=10,
                initial_pool=100000000,
                initial_capital=1000,
                strategy={"name": strategy["name"], "params": strategy["params"]}
            )
            
            print(f"   ✓ 策略 {strategy['name']} 测试通过")
            
        except Exception as e:
            print(f"   ✗ 策略 {strategy['name']} 测试失败: {e}")
            return False
    
    print("✓ 不同策略测试通过！\n")
    return True


def test_analysis_types():
    """测试不同分析类型"""
    print("=== 测试不同分析类型 ===")
    
    engine = create_engine("ssq")
    
    # 先执行模拟获取数据
    simulation_result = engine.simulate(
        num_rounds=100,
        initial_pool=100000000,
        initial_capital=10000
    )
    
    analysis_types = [
        "frequency",
        "missing",
        "trend",
        "combination",
        "consecutive",
        "prize_distribution"
    ]
    
    for analysis_type in analysis_types:
        try:
            print(f"测试分析类型: {analysis_type}...")
            
            # 执行分析
            analysis = engine.analyze(
                simulation_result,
                analysis_types=[analysis_type]
            )
            
            if analysis_type in analysis:
                print(f"   ✓ 分析类型 {analysis_type} 测试通过")
            else:
                print(f"   ✗ 分析类型 {analysis_type} 未返回结果")
                return False
            
        except Exception as e:
            print(f"   ✗ 分析类型 {analysis_type} 测试失败: {e}")
            return False
    
    print("✓ 不同分析类型测试通过！\n")
    return True


def test_export_formats():
    """测试不同导出格式"""
    print("=== 测试不同导出格式 ===")
    
    engine = create_engine("ssq")
    
    # 先执行模拟获取数据
    simulation_result = engine.simulate(
        num_rounds=10,
        initial_pool=100000000,
        initial_capital=1000
    )
    
    formats = ["json", "csv"]
    
    for fmt in formats:
        try:
            print(f"测试导出格式: {fmt}...")
            
            # 导出数据
            exported = engine.export(simulation_result, fmt)
            
            if exported:
                print(f"   ✓ 导出格式 {fmt} 测试通过")
            else:
                print(f"   ✗ 导出格式 {fmt} 返回空")
                return False
            
        except Exception as e:
            print(f"   ✗ 导出格式 {fmt} 测试失败: {e}")
            return False
    
    print("✓ 不同导出格式测试通过！\n")
    return True


def test_performance():
    """测试性能"""
    print("=== 测试性能 ===")
    
    engine = create_engine("ssq")
    
    # 测试大量模拟
    print("测试大规模模拟...")
    start_time = time.time()
    
    result = engine.simulate(
        num_rounds=10000,
        initial_pool=100000000,
        initial_capital=100000
    )
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"   ✓ 10000轮模拟耗时: {duration:.2f}秒")
    print(f"   ✓ 平均每轮耗时: {duration/10000*1000:.2f}毫秒")
    print(f"   ✓ 每秒模拟轮数: {10000/duration:.0f}轮/秒")
    
    # 性能标准：每秒至少1000轮
    if 10000/duration >= 1000:
        print("✓ 性能测试通过！\n")
        return True
    else:
        print("✗ 性能测试未达标\n")
        return False


def test_error_handling():
    """测试错误处理"""
    print("=== 测试错误处理 ===")
    
    # 测试无效配置
    try:
        print("测试无效配置...")
        engine = create_engine("invalid_config")
        print("   ✗ 应该抛出异常")
        return False
    except Exception as e:
        print(f"   ✓ 无效配置正确抛出异常: {type(e).__name__}")
    
    # 测试无效文件
    try:
        print("测试无效文件...")
        engine = create_engine("ssq")
        engine.load("nonexistent_file.json")
        print("   ✗ 应该抛出异常")
        return False
    except Exception as e:
        print(f"   ✓ 无效文件正确抛出异常: {type(e).__name__}")
    
    print("✓ 错误处理测试通过！\n")
    return True


def main():
    """主测试函数"""
    print("开始核心引擎集成测试...\n")
    
    tests = [
        test_basic_workflow,
        test_different_lotteries,
        test_strategies,
        test_analysis_types,
        test_export_formats,
        test_performance,
        test_error_handling
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
            failed += 1
    
    print("=" * 50)
    print(f"测试结果: {passed} 通过, {failed} 失败")
    print("=" * 50)
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)