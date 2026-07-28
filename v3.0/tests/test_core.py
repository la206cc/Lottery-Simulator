"""
核心引擎单元测试

测试各个组件的独立功能
"""

import sys
import os
import json
import unittest

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.base import (
    LotteryConfig, NumberZone, PrizeTier, ConfigLoader, ComponentFactory
)
from src.core.generators import DefaultNumberGenerator, StrategyNumberGenerator
from src.core.calculators import DefaultPrizeCalculator, SSQPrizeCalculator
from src.core.simulators import DefaultBetSimulator, StrategyBetSimulator
from src.core.analyzers import DefaultDataAnalyzer
from src.core.storages import DefaultDataStorage


class TestNumberZone(unittest.TestCase):
    """测试号码区域配置"""
    
    def test_create_zone(self):
        """测试创建号码区域"""
        zone = NumberZone(
            name="红球",
            min_value=1,
            max_value=33,
            count=6
        )
        
        self.assertEqual(zone.name, "红球")
        self.assertEqual(zone.min_value, 1)
        self.assertEqual(zone.max_value, 33)
        self.assertEqual(zone.count, 6)
        self.assertFalse(zone.repeatable)
        self.assertTrue(zone.sorted)
    
    def test_create_zone_with_options(self):
        """测试创建带选项的号码区域"""
        zone = NumberZone(
            name="蓝球",
            min_value=1,
            max_value=16,
            count=1,
            repeatable=True,
            sorted=False
        )
        
        self.assertEqual(zone.name, "蓝球")
        self.assertTrue(zone.repeatable)
        self.assertFalse(zone.sorted)


class TestPrizeTier(unittest.TestCase):
    """测试奖级配置"""
    
    def test_create_prize_tier(self):
        """测试创建奖级"""
        prize = PrizeTier(
            level=1,
            name="一等奖",
            match_pattern=[[6, 1]],
            fixed=False,
            pool_ratio=0.75,
            max_per_ticket=5000000
        )
        
        self.assertEqual(prize.level, 1)
        self.assertEqual(prize.name, "一等奖")
        self.assertEqual(prize.match_pattern, [[6, 1]])
        self.assertFalse(prize.fixed)
        self.assertEqual(prize.pool_ratio, 0.75)
        self.assertEqual(prize.max_per_ticket, 5000000)
    
    def test_create_fixed_prize(self):
        """测试创建固定奖金奖级"""
        prize = PrizeTier(
            level=5,
            name="五等奖",
            match_pattern=[[4, 0]],
            fixed=True,
            amount=10
        )
        
        self.assertEqual(prize.level, 5)
        self.assertTrue(prize.fixed)
        self.assertEqual(prize.amount, 10)


class TestLotteryConfig(unittest.TestCase):
    """测试彩票配置"""
    
    def test_create_config(self):
        """测试创建彩票配置"""
        config = LotteryConfig(
            id="test",
            name="测试彩票",
            price_per_bet=2.0
        )
        
        self.assertEqual(config.id, "test")
        self.assertEqual(config.name, "测试彩票")
        self.assertEqual(config.price_per_bet, 2.0)
    
    def test_create_config_with_zones(self):
        """测试创建带区域的配置"""
        zone1 = NumberZone(name="红球", min_value=1, max_value=33, count=6)
        zone2 = NumberZone(name="蓝球", min_value=1, max_value=16, count=1)
        
        config = LotteryConfig(
            id="ssq",
            name="双色球",
            zones=[zone1, zone2]
        )
        
        self.assertEqual(len(config.zones), 2)
        self.assertEqual(config.zones[0].name, "红球")
        self.assertEqual(config.zones[1].name, "蓝球")


class TestConfigLoader(unittest.TestCase):
    """测试配置加载器"""
    
    def test_load_from_dict(self):
        """测试从字典加载配置"""
        config_dict = {
            "id": "test",
            "name": "测试彩票",
            "pricePerBet": 2.0,
            "zones": [
                {"name": "红球", "min": 1, "max": 33, "count": 6}
            ],
            "prizes": [
                {"level": 1, "name": "一等奖", "matchPattern": [[6]], "fixed": True, "amount": 1000}
            ]
        }
        
        config = ConfigLoader.from_json(config_dict)
        
        self.assertEqual(config.id, "test")
        self.assertEqual(config.name, "测试彩票")
        self.assertEqual(len(config.zones), 1)
        self.assertEqual(len(config.prizes), 1)
    
    def test_convert_to_dict(self):
        """测试转换为字典"""
        config = LotteryConfig(
            id="test",
            name="测试彩票",
            price_per_bet=2.0
        )
        
        config_dict = ConfigLoader.to_json(config)
        
        self.assertEqual(config_dict["id"], "test")
        self.assertEqual(config_dict["name"], "测试彩票")
        self.assertEqual(config_dict["pricePerBet"], 2.0)


class TestDefaultNumberGenerator(unittest.TestCase):
    """测试默认号码生成器"""
    
    def setUp(self):
        """测试前准备"""
        self.generator = DefaultNumberGenerator()
        self.config = LotteryConfig(
            id="test",
            name="测试彩票",
            zones=[
                NumberZone(name="红球", min_value=1, max_value=10, count=3),
                NumberZone(name="蓝球", min_value=1, max_value=5, count=1)
            ]
        )
    
    def test_generate_numbers(self):
        """测试生成号码"""
        numbers = self.generator.generate(self.config)
        
        self.assertIn("红球", numbers)
        self.assertIn("蓝球", numbers)
        self.assertEqual(len(numbers["红球"]), 3)
        self.assertEqual(len(numbers["蓝球"]), 1)
        
        # 检查号码范围
        for num in numbers["红球"]:
            self.assertGreaterEqual(num, 1)
            self.assertLessEqual(num, 10)
        
        for num in numbers["蓝球"]:
            self.assertGreaterEqual(num, 1)
            self.assertLessEqual(num, 5)
    
    def test_generate_bet_single(self):
        """测试生成单式投注"""
        bet = self.generator.generate_bet(self.config, "single")
        
        self.assertEqual(len(bet["红球"]), 3)
        self.assertEqual(len(bet["蓝球"]), 1)
    
    def test_generate_bet_complex(self):
        """测试生成复式投注"""
        # 创建允许复式的配置
        config = LotteryConfig(
            id="test",
            name="测试彩票",
            zones=[
                NumberZone(name="红球", min_value=1, max_value=10, count=3, allow_extra=True, max_extra=5),
                NumberZone(name="蓝球", min_value=1, max_value=5, count=1)
            ]
        )
        
        bet = self.generator.generate_bet(config, "complex")
        
        # 复式投注的号码数应该大于基本数量
        self.assertGreaterEqual(len(bet["红球"]), 3)


class TestDefaultPrizeCalculator(unittest.TestCase):
    """测试默认奖金计算器"""
    
    def setUp(self):
        """测试前准备"""
        self.calculator = DefaultPrizeCalculator()
        self.config = LotteryConfig(
            id="test",
            name="测试彩票",
            zones=[
                NumberZone(name="红球", min_value=1, max_value=10, count=3),
                NumberZone(name="蓝球", min_value=1, max_value=5, count=1)
            ],
            prizes=[
                PrizeTier(level=1, name="一等奖", match_pattern=[[3, 1]], fixed=True, amount=1000),
                PrizeTier(level=2, name="二等奖", match_pattern=[[3, 0]], fixed=True, amount=100),
                PrizeTier(level=3, name="三等奖", match_pattern=[[2, 1]], fixed=True, amount=10)
            ]
        )
    
    def test_match_numbers(self):
        """测试号码匹配"""
        winning = {"红球": [1, 2, 3], "蓝球": [1]}
        bet = {"红球": [1, 2, 4], "蓝球": [1]}
        
        match_result = self.calculator.match_numbers(self.config, winning, bet)
        
        self.assertEqual(match_result["红球"], 2)  # 1,2 命中
        self.assertEqual(match_result["蓝球"], 1)  # 1 命中
    
    def test_calculate_prize_win(self):
        """测试计算奖金（中奖）"""
        winning = {"红球": [1, 2, 3], "蓝球": [1]}
        bet = {"红球": [1, 2, 3], "蓝球": [1]}
        
        result = self.calculator.calculate_prize(
            self.config, winning, bet,
            pool_amount=1000000,
            total_sales=5000000,
            total_bets=2500000
        )
        
        self.assertTrue(result["win"])
        self.assertEqual(result["prize_level"], 1)
        self.assertEqual(result["prize_amount"], 1000)
    
    def test_calculate_prize_lose(self):
        """测试计算奖金（未中奖）"""
        winning = {"红球": [1, 2, 3], "蓝球": [1]}
        bet = {"红球": [4, 5, 6], "蓝球": [2]}
        
        result = self.calculator.calculate_prize(
            self.config, winning, bet,
            pool_amount=1000000,
            total_sales=5000000,
            total_bets=2500000
        )
        
        self.assertFalse(result["win"])


class TestDefaultBetSimulator(unittest.TestCase):
    """测试默认投注模拟器"""
    
    def setUp(self):
        """测试前准备"""
        self.simulator = DefaultBetSimulator()
        self.config = LotteryConfig(
            id="test",
            name="测试彩票",
            price_per_bet=2.0,
            zones=[
                NumberZone(name="红球", min_value=1, max_value=10, count=3),
                NumberZone(name="蓝球", min_value=1, max_value=5, count=1)
            ],
            prizes=[
                PrizeTier(level=1, name="一等奖", match_pattern=[[3, 1]], fixed=True, amount=1000)
            ]
        )
    
    def test_create_bet(self):
        """测试创建投注"""
        bet = self.simulator.create_bet(self.config, "single")
        
        self.assertEqual(bet["type"], "single")
        self.assertEqual(bet["multiplier"], 1)
        self.assertFalse(bet["add_on"])
        self.assertEqual(bet["combinations"], 1)
        self.assertEqual(bet["total_bets"], 1)
        self.assertEqual(bet["cost_per_bet"], 2.0)
        self.assertEqual(bet["total_cost"], 2.0)
    
    def test_simulate(self):
        """测试模拟"""
        result = self.simulator.simulate(
            self.config,
            num_rounds=10,
            initial_pool=100000,
            initial_capital=1000
        )
        
        self.assertEqual(result["config_id"], "test")
        self.assertEqual(result["num_rounds"], 10)
        self.assertEqual(len(result["rounds"]), 10)
        self.assertIn("summary", result)


class TestDefaultDataAnalyzer(unittest.TestCase):
    """测试默认数据分析器"""
    
    def setUp(self):
        """测试前准备"""
        self.analyzer = DefaultDataAnalyzer()
        self.config = LotteryConfig(
            id="test",
            name="测试彩票",
            zones=[
                NumberZone(name="红球", min_value=1, max_value=10, count=3)
            ]
        )
        
        # 测试数据
        self.data = [
            {"红球": [1, 2, 3]},
            {"红球": [2, 3, 4]},
            {"红球": [3, 4, 5]},
            {"红球": [4, 5, 6]},
            {"红球": [5, 6, 7]}
        ]
    
    def test_analyze_frequency(self):
        """测试频率分析"""
        result = self.analyzer.analyze_frequency(self.data, self.config)
        
        self.assertIn("红球", result)
        self.assertIn("frequency", result["红球"])
        self.assertIn("hot_numbers", result["红球"])
        self.assertIn("cold_numbers", result["红球"])
    
    def test_analyze_missing(self):
        """测试遗漏分析"""
        result = self.analyzer.analyze_missing(self.data, self.config)
        
        self.assertIn("红球", result)
        self.assertIn("missing", result["红球"])
        self.assertIn("max_missing", result["红球"])
        self.assertIn("avg_missing", result["红球"])
    
    def test_analyze_trend(self):
        """测试趋势分析"""
        result = self.analyzer.analyze_trend(self.data, self.config)
        
        self.assertIn("红球", result)
        self.assertIn("odd_even_trend", result["红球"])
        self.assertIn("big_small_trend", result["红球"])
        self.assertIn("sum_trend", result["红球"])


class TestDefaultDataStorage(unittest.TestCase):
    """测试默认数据存储器"""
    
    def setUp(self):
        """测试前准备"""
        self.storage = DefaultDataStorage(base_dir="test_data")
        self.config = LotteryConfig(
            id="test",
            name="测试彩票"
        )
    
    def test_save_and_load(self):
        """测试保存和加载"""
        data = {"test": "data", "numbers": [1, 2, 3]}
        
        # 保存
        filepath = self.storage.save_simulation_data(data, self.config, "test_file")
        
        # 加载
        loaded_data = self.storage.load_simulation_data(filepath)
        
        self.assertEqual(loaded_data["data"]["test"], "data")
        self.assertEqual(loaded_data["data"]["numbers"], [1, 2, 3])
        
        # 清理
        os.remove(filepath)
    
    def test_export_json(self):
        """测试导出JSON"""
        data = {"test": "data"}
        
        json_str = self.storage.export_data(data, "json")
        
        self.assertIsInstance(json_str, str)
        loaded = json.loads(json_str)
        self.assertEqual(loaded["test"], "data")


class TestComponentFactory(unittest.TestCase):
    """测试组件工厂"""
    
    def test_create_generator(self):
        """测试创建生成器"""
        generator = ComponentFactory.create_generator("default")
        
        self.assertIsInstance(generator, DefaultNumberGenerator)
    
    def test_create_calculator(self):
        """测试创建计算器"""
        calculator = ComponentFactory.create_calculator("default")
        
        self.assertIsInstance(calculator, DefaultPrizeCalculator)
    
    def test_create_simulator(self):
        """测试创建模拟器"""
        simulator = ComponentFactory.create_simulator("default")
        
        self.assertIsInstance(simulator, DefaultBetSimulator)
    
    def test_create_analyzer(self):
        """测试创建分析器"""
        analyzer = ComponentFactory.create_analyzer("default")
        
        self.assertIsInstance(analyzer, DefaultDataAnalyzer)
    
    def test_create_storage(self):
        """测试创建存储器"""
        storage = ComponentFactory.create_storage("default")
        
        self.assertIsInstance(storage, DefaultDataStorage)


class TestSSQPrizeCalculator(unittest.TestCase):
    """测试双色球奖金计算器"""
    
    def setUp(self):
        """测试前准备"""
        self.calculator = SSQPrizeCalculator()
        self.config = LotteryConfig(
            id="ssq",
            name="双色球",
            zones=[
                NumberZone(name="红球", min_value=1, max_value=33, count=6),
                NumberZone(name="蓝球", min_value=1, max_value=16, count=1)
            ],
            prizes=[
                PrizeTier(level=1, name="一等奖", match_pattern=[[6, 1]], fixed=False, pool_ratio=0.75),
                PrizeTier(level=2, name="二等奖", match_pattern=[[6, 0]], fixed=True, amount=6000)
            ],
            pool_tiers=[
                {"min": 0, "max": 100000000, "firstPrizeRatio": 0.75, "secondPrizeRatio": 0.25},
                {"min": 100000000, "max": None, "firstPrizeRatio": 0.75, "secondPrizeRatio": 0.25, "secondPartRatio": 0.25}
            ]
        )
    
    def test_calculate_first_prize_high_pool(self):
        """测试高奖池一等奖计算"""
        winning = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
        bet = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
        
        result = self.calculator.calculate_prize(
            self.config, winning, bet,
            pool_amount=200000000,  # 2亿
            total_sales=1000000000,
            total_bets=500000000
        )
        
        self.assertTrue(result["win"])
        self.assertEqual(result["prize_level"], 1)
        # 高奖池时，一等奖分两部分，每部分封顶500万，最大1000万
        self.assertLessEqual(result["prize_amount"], 10000000)
    
    def test_calculate_second_prize_guarantee(self):
        """测试二等奖保底"""
        winning = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [1]}
        bet = {"红球": [1, 2, 3, 4, 5, 6], "蓝球": [2]}  # 蓝球不中
        
        result = self.calculator.calculate_prize(
            self.config, winning, bet,
            pool_amount=100000000,
            total_sales=500000000,
            total_bets=250000000
        )
        
        self.assertTrue(result["win"])
        self.assertEqual(result["prize_level"], 2)
        # 二等奖保底6000元
        self.assertGreaterEqual(result["prize_amount"], 6000)


if __name__ == "__main__":
    unittest.main()