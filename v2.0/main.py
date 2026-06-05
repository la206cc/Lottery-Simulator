from src.core.lottery import LotterySimulator, PurchaseSimulator, PrizeCalculator
from src.storage.data_store import DataStore
from src.analysis.analyzer import LotteryAnalyzer
from src.config.lottery_config import list_lottery_types

def main():
    print("=== 彩票模拟器 v2.0 ===")
    print(f"支持的彩票类型: {list_lottery_types()}")
    
    lottery_id = 'ssq'
    print(f"\n正在测试: {lottery_id}")
    
    # 1. 模拟开奖
    print("\n1. 模拟开奖...")
    draw_sim = LotterySimulator(lottery_id)
    draw_result = draw_sim.draw_one()
    print(f"开奖结果: {draw_result}")
    
    # 2. 生成购买记录
    print("\n2. 生成购买记录...")
    purchase_sim = PurchaseSimulator(lottery_id)
    purchases = purchase_sim.generate_batch(100)
    print(f"生成了 {len(purchases)} 注")
    
    # 3. 保存数据
    print("\n3. 保存数据...")
    store = DataStore()
    store.save_draws(lottery_id, [draw_result])
    store.save_purchases(lottery_id, purchases)
    
    # 4. 计算中奖
    print("\n4. 计算中奖...")
    results = PrizeCalculator.calculate_batch(lottery_id, draw_result, purchases)
    prize_counts = {}
    for level, amount in results:
        if level > 0:
            prize_counts[level] = prize_counts.get(level, 0) + 1
    
    if prize_counts:
        print(f"中奖统计: {prize_counts}")
    else:
        print("暂无中奖")
    
    # 5. 数据分析
    print("\n5. 数据分析...")
    analyzer = LotteryAnalyzer(lottery_id)
    draws_df = store.load_draws(lottery_id)
    if not draws_df.empty:
        freq = analyzer.analyze_frequency(draws_df)
        print(f"号码频率分析完成")
    
    print("\n=== 测试完成 ===")

if __name__ == '__main__':
    main()
