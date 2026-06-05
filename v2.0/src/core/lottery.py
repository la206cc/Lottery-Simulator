import numpy as np
from typing import List, Tuple, Dict
from src.config.lottery_config import LotteryConfig, get_lottery_config

class LotterySimulator:
    def __init__(self, lottery_id: str):
        self.config = get_lottery_config(lottery_id)
        if not self.config:
            raise ValueError(f"Unknown lottery type: {lottery_id}")
    
    def draw_one(self) -> Dict[str, List[int]]:
        """生成一次开奖结果"""
        result = {}
        for zone in self.config.zones:
            numbers = self._generate_numbers(zone)
            result[zone.name] = sorted(numbers)
        return result
    
    def simulate_draws(self, count: int) -> List[Dict[str, List[int]]]:
        """模拟多次开奖"""
        return [self.draw_one() for _ in range(count)]
    
    def _generate_numbers(self, zone) -> List[int]:
        """生成指定区域的号码"""
        if zone.repeatable:
            return [np.random.randint(zone.min, zone.max + 1) for _ in range(zone.count)]
        else:
            pool = list(range(zone.min, zone.max + 1))
            np.random.shuffle(pool)
            return pool[:zone.count]

class PurchaseSimulator:
    def __init__(self, lottery_id: str):
        self.config = get_lottery_config(lottery_id)
        if not self.config:
            raise ValueError(f"Unknown lottery type: {lottery_id}")
    
    def generate_single_bet(self) -> Dict[str, List[int]]:
        """生成一注随机号码"""
        bet = {}
        for zone in self.config.zones:
            numbers = self._generate_numbers(zone)
            bet[zone.name] = sorted(numbers)
        return bet
    
    def generate_batch(self, count: int) -> List[Dict[str, List[int]]]:
        """批量生成投注"""
        return [self.generate_single_bet() for _ in range(count)]
    
    def _generate_numbers(self, zone) -> List[int]:
        if zone.repeatable:
            return [np.random.randint(zone.min, zone.max + 1) for _ in range(zone.count)]
        else:
            pool = list(range(zone.min, zone.max + 1))
            np.random.shuffle(pool)
            return pool[:zone.count]

class PrizeCalculator:
    @staticmethod
    def check_prize(lottery_id: str, draw_result: Dict[str, List[int]], 
                    ticket: Dict[str, List[int]]) -> Tuple[int, int]:
        """
        检查中奖情况
        :return: (奖级, 奖金)
        """
        config = get_lottery_config(lottery_id)
        if not config:
            return 0, 0
        
        # 计算每个区域的命中数
        match_counts = []
        for zone in config.zones:
            draw_nums = set(draw_result.get(zone.name, []))
            ticket_nums = set(ticket.get(zone.name, []))
            match_counts.append(len(draw_nums & ticket_nums))
        
        # 匹配奖级
        for prize in config.prizes:
            for pattern in prize.match_pattern:
                if match_counts == pattern:
                    amount = prize.amount if prize.fixed else 0
                    return prize.level, amount
        
        return 0, 0
    
    @staticmethod
    def calculate_batch(lottery_id: str, draw_result: Dict[str, List[int]],
                       tickets: List[Dict[str, List[int]]]) -> List[Tuple[int, int]]:
        """批量计算中奖结果"""
        results = []
        for ticket in tickets:
            level, amount = PrizeCalculator.check_prize(lottery_id, draw_result, ticket)
            results.append((level, amount))
        return results
