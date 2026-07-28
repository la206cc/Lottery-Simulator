"""
性能优化测试

测试不同场景下的性能，找出瓶颈并优化
"""

import sys
import os
import time
import cProfile
import pstats
from io import StringIO

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.main import create_engine


def test_basic_performance():
    """测试基本性能"""
    print("=== 测试基本性能 ===")
    
    engine = create_engine("ssq")
    
    # 测试不同规模的模拟
    test_cases = [
        (100, "小规模"),
        (1000, "中等规模"),
        (10000, "大规模"),
        (100000, "超大规模")
    ]
    
    for num_rounds, desc in test_cases:
        start_time = time.time()
        
        result = engine.simulate(
            num_rounds=num_rounds,
            initial_pool=100000000,
            initial_capital=num_rounds * 2
        )
        
        end_time = time.time()
        duration = end_time - start_time
        rounds_per_second = num_rounds / duration if duration > 0 else 0
        
        print(f"{desc} ({num_rounds}轮): {duration:.3f}秒, {rounds_per_second:.0f}轮/秒")
    
    print("✓ 基本性能测试完成\n")
    return True


def test_generator_performance():
    """测试生成器性能"""
    print("=== 测试生成器性能 ===")
    
    engine = create_engine("ssq")
    
    # 测试号码生成性能
    start_time = time.time()
    for _ in range(10000):
        engine.generate_numbers()
    end_time = time.time()
    
    duration = end_time - start_time
    print(f"号码生成: 10000次耗时 {duration:.3f}秒, {10000/duration:.0f}次/秒")
    
    # 测试投注生成性能
    start_time = time.time()
    for _ in range(10000):
        engine.generate_bet("single")
    end_time = time.time()
    
    duration = end_time - start_time
    print(f"投注生成: 10000次耗时 {duration:.3f}秒, {10000/duration:.0f}次/秒")
    
    print("✓ 生成器性能测试完成\n")
    return True


def test_calculator_performance():
    """测试计算器性能"""
    print("=== 测试计算器性能 ===")
    
    engine = create_engine("ssq")
    
    # 准备测试数据
    winning = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
    bet = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
    
    # 测试奖金计算性能
    start_time = time.time()
    for _ in range(10000):
        engine.calculate_prize(
            winning, bet,
            pool_amount=100000000,
            total_sales=500000000,
            total_bets=250000000
        )
    end_time = time.time()
    
    duration = end_time - start_time
    print(f"奖金计算: 10000次耗时 {duration:.3f}秒, {10000/duration:.0f}次/秒")
    
    print("✓ 计算器性能测试完成\n")
    return True


def test_analyzer_performance():
    """测试分析器性能"""
    print("=== 测试分析器性能 ===")
    
    engine = create_engine("ssq")
    
    # 生成测试数据
    data = []
    for _ in range(1000):
        data.append(engine.generate_numbers())
    
    # 测试频率分析性能
    start_time = time.time()
    engine.analyze({"rounds": [{"winning_numbers": d} for d in data]}, ["frequency"])
    end_time = time.time()
    
    duration = end_time - start_time
    print(f"频率分析: 1000条数据耗时 {duration:.3f}秒")
    
    # 测试遗漏分析性能
    start_time = time.time()
    engine.analyze({"rounds": [{"winning_numbers": d} for d in data]}, ["missing"])
    end_time = time.time()
    
    duration = end_time - start_time
    print(f"遗漏分析: 1000条数据耗时 {duration:.3f}秒")
    
    # 测试趋势分析性能
    start_time = time.time()
    engine.analyze({"rounds": [{"winning_numbers": d} for d in data]}, ["trend"])
    end_time = time.time()
    
    duration = end_time - start_time
    print(f"趋势分析: 1000条数据耗时 {duration:.3f}秒")
    
    print("✓ 分析器性能测试完成\n")
    return True


def test_memory_usage():
    """测试内存使用"""
    print("=== 测试内存使用 ===")
    
    try:
        import psutil
        process = psutil.Process(os.getpid())
        
        engine = create_engine("ssq")
        
        # 测试前内存
        mem_before = process.memory_info().rss / 1024 / 1024  # MB
        
        # 执行大规模模拟
        result = engine.simulate(
            num_rounds=100000,
            initial_pool=100000000,
            initial_capital=200000
        )
        
        # 测试后内存
        mem_after = process.memory_info().rss / 1024 / 1024  # MB
        
        print(f"模拟前内存: {mem_before:.2f} MB")
        print(f"模拟后内存: {mem_after:.2f} MB")
        print(f"内存增长: {mem_after - mem_before:.2f} MB")
        
        # 清理
        del result
        
    except ImportError:
        print("psutil未安装，跳过内存测试")
    
    print("✓ 内存使用测试完成\n")
    return True


def test_concurrent_performance():
    """测试并发性能"""
    print("=== 测试并发性能 ===")
    
    import concurrent.futures
    
    engine = create_engine("ssq")
    
    def simulate_batch(batch_id, num_rounds):
        """批量模拟"""
        result = engine.simulate(
            num_rounds=num_rounds,
            initial_pool=100000000,
            initial_capital=num_rounds * 2
        )
        return batch_id, result['summary']['total_rounds']
    
    # 测试单线程
    start_time = time.time()
    for i in range(10):
        simulate_batch(i, 1000)
    single_thread_time = time.time() - start_time
    
    # 测试多线程
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(simulate_batch, i, 1000) for i in range(10)]
        concurrent.futures.wait(futures)
    multi_thread_time = time.time() - start_time
    
    print(f"单线程: {single_thread_time:.3f}秒")
    print(f"多线程(4线程): {multi_thread_time:.3f}秒")
    print(f"加速比: {single_thread_time/multi_thread_time:.2f}x")
    
    print("✓ 并发性能测试完成\n")
    return True


def profile_simulation():
    """性能分析"""
    print("=== 性能分析 ===")
    
    engine = create_engine("ssq")
    
    # 性能分析
    pr = cProfile.Profile()
    pr.enable()
    
    # 执行模拟
    result = engine.simulate(
        num_rounds=10000,
        initial_pool=100000000,
        initial_capital=20000
    )
    
    pr.disable()
    
    # 输出分析结果
    s = StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
    ps.print_stats(20)  # 显示前20个最耗时的函数
    
    print(s.getvalue())
    
    print("✓ 性能分析完成\n")
    return True


def main():
    """主测试函数"""
    print("开始性能优化测试...\n")
    
    tests = [
        test_basic_performance,
        test_generator_performance,
        test_calculator_performance,
        test_analyzer_performance,
        test_memory_usage,
        test_concurrent_performance,
        profile_simulation
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