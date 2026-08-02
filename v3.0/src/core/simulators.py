"""
通用投注模拟器实现

支持的模拟功能：
1. 单式投注
2. 复式投注
3. 胆拖投注
4. 倍投
5. 追加投注
6. 多轮次模拟
7. 策略模拟（机选、生日号、走势分析等）
"""

import random
from typing import Dict, List, Optional, Any, Tuple
from .base import BaseBetSimulator, LotteryConfig, ComponentFactory
from .generators import DefaultNumberGenerator


class DefaultBetSimulator(BaseBetSimulator):
    """默认投注模拟器"""
    
    def __init__(self):
        self.generator = DefaultNumberGenerator()
    
    def simulate(
        self,
        config: LotteryConfig,
        num_rounds: int,
        initial_pool: float,
        initial_capital: float,
        strategy: Optional[Dict] = None,
        mode: str = "single_draw"
    ) -> Dict[str, Any]:
        """
        执行模拟
        
        Args:
            config: 彩票配置
            num_rounds: 模拟轮次
            initial_pool: 初始奖池
            initial_capital: 初始资金
            strategy: 投注策略
            mode: 模拟模式
                - "single_draw": 单次开奖，所有投注基于同一个开奖号码（默认）
                - "multi_draw": 多次开奖，每轮生成新的开奖号码
            
        Returns:
            模拟结果
        """
        results = {
            "config_id": config.id,
            "config_name": config.name,
            "num_rounds": num_rounds,
            "initial_pool": initial_pool,
            "initial_capital": initial_capital,
            "mode": mode,
            "rounds": [],
            "summary": {}
        }
        
        current_pool = initial_pool
        current_capital = initial_capital
        total_investment = 0
        total_return = 0
        wins = 0
        losses = 0
        prize_distribution = {}
        
        # 单次开奖模式：只生成一个开奖号码
        if mode == "single_draw":
            winning_numbers = self.generator.generate(config)
            results["winning_numbers"] = winning_numbers
        
        for round_num in range(1, num_rounds + 1):
            # 1. 获取开奖号码
            if mode == "multi_draw":
                # 多次开奖模式：每轮生成新的开奖号码
                winning_numbers = self.generator.generate(config)
            # single_draw 模式使用预先生成的开奖号码
            
            # 2. 生成投注
            bet = self.create_bet(config, **(strategy or {}))
            
            # 3. 计算投注成本
            bet_cost = self._calculate_bet_cost(config, bet)
            
            # 4. 检查资金是否足够
            if current_capital < bet_cost:
                results["summary"]["insufficient_funds"] = True
                break
            
            # 5. 扣除资金
            current_capital -= bet_cost
            total_investment += bet_cost
            
            # 6. 计算奖金 (优先使用真实奖金计算器)
            try:
                from .calculators import ComponentFactory
                calc = ComponentFactory.create_calculator(config.id)
                prize_result = calc.calculate_prize(
                    config, winning_numbers, bet["numbers"],
                    pool=current_pool,
                    add_on=bet.get("add_on", False)
                )
                prize_amount = prize_result.get("total", 0)
            except Exception:
                prize_amount = self._calculate_simple_prize(
                    config, winning_numbers, bet["numbers"]
                )
            
            # 7. 更新奖池和资金
            current_pool += bet_cost - prize_amount
            if prize_amount > 0:
                current_capital += prize_amount
                total_return += prize_amount
                wins += 1
                
                # 记录奖金分布
                prize_level = self._get_prize_level(config, winning_numbers, bet["numbers"])
                if prize_level:
                    prize_distribution[prize_level] = prize_distribution.get(prize_level, 0) + 1
            else:
                losses += 1
            
            # 8. 记录本轮结果
            round_result = {
                "round": round_num,
                "winning_numbers": winning_numbers,
                "bet_numbers": bet["numbers"],
                "bet_type": bet["type"],
                "bet_cost": bet_cost,
                "prize_amount": prize_amount,
                "pool_after": current_pool,
                "capital_after": current_capital
            }
            results["rounds"].append(round_result)
        
        # 计算总结
        results["summary"] = {
            "total_rounds": round_num if 'round_num' in dir() else num_rounds,
            "total_investment": total_investment,
            "total_return": total_return,
            "net_profit": total_return - total_investment,
            "return_rate": total_return / total_investment if total_investment > 0 else 0,
            "wins": wins,
            "losses": losses,
            "win_rate": wins / (wins + losses) if (wins + losses) > 0 else 0,
            "final_pool": current_pool,
            "final_capital": current_capital,
            "prize_distribution": prize_distribution
        }
        
        return results
    
    def create_bet(
        self,
        config: LotteryConfig,
        bet_type: str = "single",
        multiplier: int = 1,
        add_on: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        创建投注
        
        Args:
            config: 彩票配置
            bet_type: 投注类型
            multiplier: 倍数
            add_on: 是否追加
            
        Returns:
            投注信息
        """
        # 生成投注号码
        numbers = self.generator.generate_bet(config, bet_type)
        
        # 计算组合数（复式/胆拖）
        combinations = self._calculate_combinations(config, numbers, bet_type)
        
        # 计算总注数
        total_bets = combinations * multiplier
        
        # 计算总成本
        cost_per_bet = config.price_per_bet
        if add_on and config.can_add_on:
            cost_per_bet += config.add_on_price
        
        total_cost = cost_per_bet * total_bets
        
        return {
            "type": bet_type,
            "numbers": numbers,
            "multiplier": multiplier,
            "add_on": add_on,
            "combinations": combinations,
            "total_bets": total_bets,
            "cost_per_bet": cost_per_bet,
            "total_cost": total_cost
        }
    
    def _calculate_bet_cost(self, config: LotteryConfig, bet: Dict[str, Any]) -> float:
        """
        计算投注成本
        
        Args:
            config: 彩票配置
            bet: 投注信息
            
        Returns:
            投注成本
        """
        return bet.get("total_cost", 0)
    
    def _calculate_combinations(
        self,
        config: LotteryConfig,
        numbers: Dict[str, List[int]],
        bet_type: str
    ) -> int:
        """
        计算组合数
        
        Args:
            config: 彩票配置
            numbers: 投注号码
            bet_type: 投注类型
            
        Returns:
            组合数
        """
        if bet_type == "single":
            return 1
        
        # 复式投注：各区域组合数相乘
        total_combinations = 1
        
        for zone in config.zones:
            zone_name = zone.name
            if zone_name not in numbers:
                continue
            
            zone_numbers = numbers[zone_name]
            zone_count = zone.count
            
            # 计算该区域的组合数：C(n, k)
            n = len(zone_numbers)
            k = zone_count
            
            if n < k:
                continue
            
            # 计算组合数 C(n, k) = n! / (k! * (n-k)!)
            combinations = 1
            for i in range(k):
                combinations = combinations * (n - i) // (i + 1)
            
            total_combinations *= combinations
        
        return total_combinations
    
    def _calculate_simple_prize(
        self,
        config: LotteryConfig,
        winning_numbers: Dict[str, List[int]],
        bet_numbers: Dict[str, List[int]]
    ) -> float:
        """
        计算简单奖金（简化版）
        
        Args:
            config: 彩票配置
            winning_numbers: 开奖号码
            bet_numbers: 投注号码
            
        Returns:
            奖金金额
        """
        # 简化处理：只计算一等奖
        # 实际应该调用奖金计算器
        
        match_count = 0
        total_count = 0
        
        for zone in config.zones:
            zone_name = zone.name
            if zone_name in winning_numbers and zone_name in bet_numbers:
                win_set = set(winning_numbers[zone_name])
                bet_set = set(bet_numbers[zone_name])
                matched = len(win_set.intersection(bet_set))
                match_count += matched
                total_count += zone.count
        
        # 简化判断：如果全部命中，中一等奖
        if match_count == total_count:
            # 查找一等奖配置
            for prize in config.prizes:
                if prize.level == 1:
                    if prize.fixed:
                        return prize.amount or 0
                    else:
                        # 浮动奖金，简化为固定金额
                        return 5000000  # 500万
        
        return 0
    
    def _get_prize_level(
        self,
        config: LotteryConfig,
        winning_numbers: Dict[str, List[int]],
        bet_numbers: Dict[str, List[int]]
    ) -> Optional[int]:
        """
        获取中奖奖级
        
        Args:
            config: 彩票配置
            winning_numbers: 开奖号码
            bet_numbers: 投注号码
            
        Returns:
            奖级
        """
        # 简化处理
        match_count = 0
        total_count = 0
        
        for zone in config.zones:
            zone_name = zone.name
            if zone_name in winning_numbers and zone_name in bet_numbers:
                win_set = set(winning_numbers[zone_name])
                bet_set = set(bet_numbers[zone_name])
                matched = len(win_set.intersection(bet_set))
                match_count += matched
                total_count += zone.count
        
        # 简化判断
        if match_count == total_count:
            return 1
        elif match_count >= total_count * 0.8:
            return 2
        elif match_count >= total_count * 0.6:
            return 3
        
        return None


class StrategyBetSimulator(DefaultBetSimulator):
    """策略投注模拟器"""
    
    def __init__(self):
        super().__init__()
        self.strategies = {
            "random": self._strategy_random,
            "hot_numbers": self._strategy_hot_numbers,
            "cold_numbers": self._strategy_cold_numbers,
            "birthday": self._strategy_birthday,
            "consecutive": self._strategy_consecutive,
            "fixed": self._strategy_fixed,
        }
    
    def register_strategy(self, name: str, strategy_func):
        """注册自定义策略"""
        self.strategies[name] = strategy_func
    
    def simulate_with_strategy(
        self,
        config: LotteryConfig,
        num_rounds: int,
        initial_pool: float,
        initial_capital: float,
        strategy_name: str = "random",
        strategy_params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        使用指定策略执行模拟
        
        Args:
            config: 彩票配置
            num_rounds: 模拟轮次
            initial_pool: 初始奖池
            initial_capital: 初始资金
            strategy_name: 策略名称
            strategy_params: 策略参数
            
        Returns:
            模拟结果
        """
        strategy_func = self.strategies.get(strategy_name, self._strategy_random)
        
        strategy = {
            "name": strategy_name,
            "params": strategy_params or {}
        }
        
        return self.simulate(config, num_rounds, initial_pool, initial_capital, strategy)
    
    def _strategy_random(self, config: LotteryConfig, **kwargs) -> Dict[str, Any]:
        """随机策略"""
        return self.create_bet(config, "single")
    
    def _strategy_hot_numbers(
        self,
        config: LotteryConfig,
        hot_numbers: Optional[Dict[str, List[int]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """热门号码策略"""
        if hot_numbers:
            numbers = {}
            for zone in config.zones:
                zone_hot = hot_numbers.get(zone.name, [])
                if zone_hot and len(zone_hot) >= zone.count:
                    numbers[zone.name] = random.sample(zone_hot, zone.count)
                else:
                    numbers[zone.name] = self.generator.generate_zone_numbers(zone)
            
            return {
                "type": "single",
                "numbers": numbers,
                "multiplier": 1,
                "add_on": False,
                "combinations": 1,
                "total_bets": 1,
                "cost_per_bet": config.price_per_bet,
                "total_cost": config.price_per_bet
            }
        else:
            return self.create_bet(config, "single")
    
    def _strategy_cold_numbers(
        self,
        config: LotteryConfig,
        cold_numbers: Optional[Dict[str, List[int]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """冷门号码策略"""
        if cold_numbers:
            numbers = {}
            for zone in config.zones:
                zone_cold = cold_numbers.get(zone.name, [])
                if zone_cold and len(zone_cold) >= zone.count:
                    numbers[zone.name] = random.sample(zone_cold, zone.count)
                else:
                    numbers[zone.name] = self.generator.generate_zone_numbers(zone)
            
            return {
                "type": "single",
                "numbers": numbers,
                "multiplier": 1,
                "add_on": False,
                "combinations": 1,
                "total_bets": 1,
                "cost_per_bet": config.price_per_bet,
                "total_cost": config.price_per_bet
            }
        else:
            return self.create_bet(config, "single")
    
    def _strategy_birthday(
        self,
        config: LotteryConfig,
        birthday: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """生日号码策略"""
        if birthday:
            numbers = self.generator.generate_with_strategy(
                config, "birthday", birthday=birthday
            )
            
            return {
                "type": "single",
                "numbers": numbers,
                "multiplier": 1,
                "add_on": False,
                "combinations": 1,
                "total_bets": 1,
                "cost_per_bet": config.price_per_bet,
                "total_cost": config.price_per_bet
            }
        else:
            return self.create_bet(config, "single")
    
    def _strategy_consecutive(
        self,
        config: LotteryConfig,
        start: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """连号策略"""
        numbers = self.generator.generate_with_strategy(
            config, "consecutive", start=start
        )
        
        return {
            "type": "single",
            "numbers": numbers,
            "multiplier": 1,
            "add_on": False,
            "combinations": 1,
            "total_bets": 1,
            "cost_per_bet": config.price_per_bet,
            "total_cost": config.price_per_bet
        }
    
    def _strategy_fixed(
        self,
        config: LotteryConfig,
        fixed_numbers: Optional[Dict[str, List[int]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """固定号码策略"""
        if fixed_numbers:
            return {
                "type": "single",
                "numbers": fixed_numbers,
                "multiplier": 1,
                "add_on": False,
                "combinations": 1,
                "total_bets": 1,
                "cost_per_bet": config.price_per_bet,
                "total_cost": config.price_per_bet
            }
        else:
            return self.create_bet(config, "single")


class BatchBetSimulator(DefaultBetSimulator):
    """批量投注模拟器"""
    
    def simulate_batch(
        self,
        config: LotteryConfig,
        num_rounds: int,
        initial_pool: float,
        initial_capital: float,
        batch_size: int = 100,
        strategy: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        批量模拟
        
        Args:
            config: 彩票配置
            num_rounds: 模拟轮次
            initial_pool: 初始奖池
            initial_capital: 初始资金
            batch_size: 批次大小
            strategy: 投注策略
            
        Returns:
            模拟结果
        """
        all_results = []
        current_pool = initial_pool
        current_capital = initial_capital
        
        # 分批模拟
        for batch_start in range(0, num_rounds, batch_size):
            batch_end = min(batch_start + batch_size, num_rounds)
            batch_num_rounds = batch_end - batch_start
            
            batch_result = self.simulate(
                config, batch_num_rounds, current_pool, current_capital, strategy
            )
            
            all_results.append(batch_result)
            
            # 更新当前状态
            current_pool = batch_result["summary"]["final_pool"]
            current_capital = batch_result["summary"]["final_capital"]
        
        # 合并结果
        merged_result = self._merge_batch_results(all_results, initial_pool, initial_capital)
        
        return merged_result
    
    def _merge_batch_results(
        self,
        batch_results: List[Dict[str, Any]],
        initial_pool: float,
        initial_capital: float
    ) -> Dict[str, Any]:
        """
        合并批次结果
        
        Args:
            batch_results: 批次结果列表
            initial_pool: 初始奖池
            initial_capital: 初始资金
            
        Returns:
            合并后的结果
        """
        merged = {
            "config_id": batch_results[0]["config_id"] if batch_results else "",
            "config_name": batch_results[0]["config_name"] if batch_results else "",
            "num_rounds": sum(r["summary"]["total_rounds"] for r in batch_results),
            "initial_pool": initial_pool,
            "initial_capital": initial_capital,
            "rounds": [],
            "summary": {}
        }
        
        total_investment = 0
        total_return = 0
        wins = 0
        losses = 0
        prize_distribution = {}
        
        for batch in batch_results:
            merged["rounds"].extend(batch["rounds"])
            total_investment += batch["summary"]["total_investment"]
            total_return += batch["summary"]["total_return"]
            wins += batch["summary"]["wins"]
            losses += batch["summary"]["losses"]
            
            for level, count in batch["summary"].get("prize_distribution", {}).items():
                prize_distribution[level] = prize_distribution.get(level, 0) + count
        
        merged["summary"] = {
            "total_rounds": merged["num_rounds"],
            "total_investment": total_investment,
            "total_return": total_return,
            "net_profit": total_return - total_investment,
            "return_rate": total_return / total_investment if total_investment > 0 else 0,
            "wins": wins,
            "losses": losses,
            "win_rate": wins / (wins + losses) if (wins + losses) > 0 else 0,
            "final_pool": batch_results[-1]["summary"]["final_pool"] if batch_results else initial_pool,
            "final_capital": batch_results[-1]["summary"]["final_capital"] if batch_results else initial_capital,
            "prize_distribution": prize_distribution
        }
        
        return merged


# 注册默认组件
ComponentFactory.register_simulator("default", DefaultBetSimulator)
ComponentFactory.register_simulator("strategy", StrategyBetSimulator)
ComponentFactory.register_simulator("batch", BatchBetSimulator)