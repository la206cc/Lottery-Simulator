import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from src.config.lottery_config import get_lottery_config

class LotteryAnalyzer:
    def __init__(self, lottery_id: str):
        self.config = get_lottery_config(lottery_id)
        if not self.config:
            raise ValueError(f"Unknown lottery type: {lottery_id}")
    
    def analyze_frequency(self, draws_df: pd.DataFrame) -> Dict[str, pd.Series]:
        """分析号码出现频率"""
        result = {}
        for zone in self.config.zones:
            col_prefix = zone.name.lower()
            cols = [f'{col_prefix}_{i}' for i in range(1, zone.count + 1)]
            all_numbers = draws_df[cols].values.flatten()
            freq = pd.Series(all_numbers).value_counts().sort_index()
            result[zone.name] = freq
        return result
    
    def analyze_gaps(self, draws_df: pd.DataFrame) -> Dict[str, pd.Series]:
        """分析号码遗漏值"""
        result = {}
        for zone in self.config.zones:
            col_prefix = zone.name.lower()
            cols = [f'{col_prefix}_{i}' for i in range(1, zone.count + 1)]
            all_draws = draws_df[cols].values
            
            gaps = {}
            for num in range(zone.min, zone.max + 1):
                last_seen = -1
                for idx, draw in enumerate(all_draws):
                    if num in draw:
                        if last_seen >= 0:
                            gap = idx - last_seen - 1
                            gaps.setdefault(num, []).append(gap)
                        last_seen = idx
            
            avg_gaps = {}
            for num, gap_list in gaps.items():
                avg_gaps[num] = np.mean(gap_list) if gap_list else 0
            
            result[zone.name] = pd.Series(avg_gaps).sort_index()
        return result
    
    def analyze_patterns(self, draws_df: pd.DataFrame) -> Dict:
        """分析号码模式"""
        result = {}
        
        for zone in self.config.zones:
            col_prefix = zone.name.lower()
            cols = [f'{col_prefix}_{i}' for i in range(1, zone.count + 1)]
            
            # 奇偶比
            odds_count = (draws_df[cols] % 2 == 1).sum(axis=1)
            evens_count = zone.count - odds_count
            odd_even_ratio = (odds_count / zone.count).value_counts().sort_index()
            
            # 大小比（以中间值为界）
            mid = (zone.min + zone.max) / 2
            big_count = (draws_df[cols] > mid).sum(axis=1)
            small_count = zone.count - big_count
            big_small_ratio = (big_count / zone.count).value_counts().sort_index()
            
            result[zone.name] = {
                'odd_even_ratio': odd_even_ratio,
                'big_small_ratio': big_small_ratio
            }
        
        return result
    
    def calculate_prize_distribution(self, tickets_df: pd.DataFrame, 
                                     draw_result: Dict[str, List[int]]) -> pd.DataFrame:
        """计算奖金分布"""
        results = []
        
        for _, ticket in tickets_df.iterrows():
            ticket_nums = {}
            for zone in self.config.zones:
                col_prefix = zone.name.lower()
                nums = [ticket[f'{col_prefix}_{i}'] for i in range(1, zone.count + 1)]
                ticket_nums[zone.name] = nums
            
            level, amount = self._check_prize(draw_result, ticket_nums)
            results.append({
                'ticket_id': ticket['ticket_id'],
                'prize_level': level,
                'prize_amount': amount
            })
        
        return pd.DataFrame(results)
    
    def _check_prize(self, draw_result: Dict[str, List[int]], 
                     ticket: Dict[str, List[int]]) -> Tuple[int, int]:
        """检查单注中奖情况"""
        match_counts = []
        for zone in self.config.zones:
            draw_nums = set(draw_result.get(zone.name, []))
            ticket_nums = set(ticket.get(zone.name, []))
            match_counts.append(len(draw_nums & ticket_nums))
        
        for prize in self.config.prizes:
            for pattern in prize.match_pattern:
                if match_counts == pattern:
                    amount = prize.amount if prize.fixed else 0
                    return prize.level, amount
        
        return 0, 0
