# -*- coding: utf-8 -*-
"""
投注模拟器 - 根据文档参数优化版
支持多彩种的真实投注行为模拟
"""
import random
import math
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from src.config.lottery_config import get_lottery_config, LotteryConfig, NumberZone


@dataclass
class BetTypeConfig:
    """投注类型配置"""
    single_ratio: float = 0.60      # 单式占比
    complex_ratio: float = 0.30     # 复式占比
    dan_tuo_ratio: float = 0.10     # 胆拖占比
    # 复式内部结构
    complex_red7_ratio: float = 0.50
    complex_red8_9_ratio: float = 0.35
    complex_red10_plus_ratio: float = 0.15
    # 胆拖内部结构
    dan1_tuo5_ratio: float = 0.70
    dan2_tuo4_ratio: float = 0.25
    dan3_tuo3_ratio: float = 0.05


@dataclass
class MultiplierConfig:
    """倍投配置"""
    ratio_1x: float = 0.75
    ratio_2_5x: float = 0.20
    ratio_6_20x: float = 0.045
    ratio_20x_plus: float = 0.005


@dataclass
class AddOnConfig:
    """追加配置（仅大乐透）"""
    enabled: bool = False
    ratio: float = 0.40  # 追加占比（40%注数选追加）


@dataclass
class UserBehaviorConfig:
    """用户行为配置"""
    high_freq_ratio: float = 0.12   # 高频用户占比
    mid_freq_ratio: float = 0.38    # 中频用户占比
    low_freq_ratio: float = 0.50    # 低频用户占比
    
    random_select_ratio: float = 0.30  # 机选比例
    birthday_select_ratio: float = 0.35  # 生日号选择比例
    trend_select_ratio: float = 0.25    # 走势分析比例
    fixed_select_ratio: float = 0.10    # 守号比例


@dataclass
class NumberFeatureConfig:
    """号码特征配置"""
    # 热门号码
    hot_numbers: List[int] = field(default_factory=list)
    cold_numbers: List[int] = field(default_factory=list)
    hot_bonus: float = 0.10       # 热门号码概率上浮
    cold_penalty: float = 0.08    # 冷门号码概率下调
    birthday_range: Tuple[int, int] = (1, 31)
    
    # 三区分布概率（适用于双色球、大乐透）
    zone_dist_even: float = 0.50   # 均匀分布概率
    zone_dist_mild: float = 0.30   # 轻度偏态概率
    zone_dist_severe: float = 0.18 # 重度偏态概率
    zone_dist_empty: float = 0.02  # 断区概率
    
    # 奇偶比
    odd_even_balanced: float = 0.70  # 均衡奇偶比概率
    odd_even_skewed: float = 0.25    # 偏态奇偶比概率
    odd_even_extreme: float = 0.05   # 极端奇偶比概率
    
    # 和值区间
    sum_middle_ratio: float = 0.70   # 中间和值概率
    sum_low_ratio: float = 0.15      # 小和值概率
    sum_high_ratio: float = 0.15     # 大和值概率


@dataclass
class LotteryPurchaseConfig:
    """各彩种投注配置"""
    lottery_id: str
    bet_type: BetTypeConfig = field(default_factory=BetTypeConfig)
    multiplier: MultiplierConfig = field(default_factory=MultiplierConfig)
    addon: AddOnConfig = field(default_factory=AddOnConfig)
    user_behavior: UserBehaviorConfig = field(default_factory=UserBehaviorConfig)
    number_feature: NumberFeatureConfig = field(default_factory=NumberFeatureConfig)


# 各彩种默认配置（基于文档）
DEFAULT_CONFIGS: Dict[str, LotteryPurchaseConfig] = {
    'ssq': LotteryPurchaseConfig(
        lottery_id='ssq',
        bet_type=BetTypeConfig(
            single_ratio=0.60,
            complex_ratio=0.30,
            dan_tuo_ratio=0.10,
            complex_red7_ratio=0.50,
            complex_red8_9_ratio=0.35,
            complex_red10_plus_ratio=0.15,
            dan1_tuo5_ratio=0.70,
            dan2_tuo4_ratio=0.25,
            dan3_tuo3_ratio=0.05
        ),
        multiplier=MultiplierConfig(
            ratio_1x=0.75,
            ratio_2_5x=0.20,
            ratio_6_20x=0.045,
            ratio_20x_plus=0.005
        ),
        addon=AddOnConfig(enabled=False),
        user_behavior=UserBehaviorConfig(
            high_freq_ratio=0.12,
            mid_freq_ratio=0.38,
            low_freq_ratio=0.50,
            random_select_ratio=0.30,
            birthday_select_ratio=0.35,
            trend_select_ratio=0.25,
            fixed_select_ratio=0.10
        ),
        number_feature=NumberFeatureConfig(
            hot_numbers=[1, 5, 6, 8, 9, 11, 16, 19, 22, 28, 31],
            cold_numbers=[3, 4, 7, 13, 24, 32, 33],
            hot_bonus=0.10,
            cold_penalty=0.08,
            birthday_range=(1, 31),
            zone_dist_even=0.50,
            zone_dist_mild=0.30,
            zone_dist_severe=0.18,
            zone_dist_empty=0.02,
            odd_even_balanced=0.70,
            odd_even_skewed=0.25,
            odd_even_extreme=0.05,
            sum_middle_ratio=0.70,
            sum_low_ratio=0.15,
            sum_high_ratio=0.15
        )
    ),
    'dlt': LotteryPurchaseConfig(
        lottery_id='dlt',
        bet_type=BetTypeConfig(
            single_ratio=0.55,
            complex_ratio=0.35,
            dan_tuo_ratio=0.10,
            complex_red7_ratio=0.55,
            complex_red8_9_ratio=0.30,
            complex_red10_plus_ratio=0.15,
            dan1_tuo5_ratio=0.65,
            dan2_tuo4_ratio=0.30,
            dan3_tuo3_ratio=0.05
        ),
        multiplier=MultiplierConfig(
            ratio_1x=0.78,
            ratio_2_5x=0.18,
            ratio_6_20x=0.035,
            ratio_20x_plus=0.005
        ),
        addon=AddOnConfig(enabled=True, ratio=0.40),  # 重点修改：追加改为占比40%
        user_behavior=UserBehaviorConfig(
            high_freq_ratio=0.10,
            mid_freq_ratio=0.40,
            low_freq_ratio=0.50,
            random_select_ratio=0.35,
            birthday_select_ratio=0.30,
            trend_select_ratio=0.25,
            fixed_select_ratio=0.10
        ),
        number_feature=NumberFeatureConfig(
            hot_numbers=[1, 5, 6, 8, 9, 11, 16, 19, 22, 28, 31],
            cold_numbers=[3, 4, 7, 13, 24, 32, 33, 34, 35],
            hot_bonus=0.10,
            cold_penalty=0.08,
            birthday_range=(1, 31),
            zone_dist_even=0.50,
            zone_dist_mild=0.30,
            zone_dist_severe=0.18,
            zone_dist_empty=0.02,
            odd_even_balanced=0.70,
            odd_even_skewed=0.25,
            odd_even_extreme=0.05,
            sum_middle_ratio=0.72,
            sum_low_ratio=0.14,
            sum_high_ratio=0.14
        )
    ),
    'kl8': LotteryPurchaseConfig(
        lottery_id='kl8',
        bet_type=BetTypeConfig(
            single_ratio=0.70,
            complex_ratio=0.25,
            dan_tuo_ratio=0.05
        ),
        multiplier=MultiplierConfig(
            ratio_1x=0.75,
            ratio_2_5x=0.20,
            ratio_6_20x=0.04,
            ratio_20x_plus=0.01
        ),
        addon=AddOnConfig(enabled=False),
        user_behavior=UserBehaviorConfig(
            high_freq_ratio=0.15,
            mid_freq_ratio=0.35,
            low_freq_ratio=0.50,
            random_select_ratio=0.40,
            birthday_select_ratio=0.30,
            trend_select_ratio=0.25,
            fixed_select_ratio=0.05
        ),
        number_feature=NumberFeatureConfig(
            hot_numbers=[15, 23, 37, 48, 62, 71],
            cold_numbers=[3, 19, 55, 78],
            hot_bonus=0.15,
            cold_penalty=0.10,
            birthday_range=(1, 31)
        )
    ),
    'fc3d': LotteryPurchaseConfig(
        lottery_id='fc3d',
        bet_type=BetTypeConfig(
            single_ratio=0.40,
            complex_ratio=0.50,
            dan_tuo_ratio=0.10
        ),
        multiplier=MultiplierConfig(
            ratio_1x=0.75,
            ratio_2_5x=0.20,
            ratio_6_20x=0.045,
            ratio_20x_plus=0.005
        ),
        addon=AddOnConfig(enabled=False),
        user_behavior=UserBehaviorConfig(
            high_freq_ratio=0.15,
            mid_freq_ratio=0.35,
            low_freq_ratio=0.50
        )
    ),
    'pls': LotteryPurchaseConfig(
        lottery_id='pls',
        bet_type=BetTypeConfig(
            single_ratio=0.40,
            complex_ratio=0.50,
            dan_tuo_ratio=0.10
        ),
        multiplier=MultiplierConfig(
            ratio_1x=0.75,
            ratio_2_5x=0.20,
            ratio_6_20x=0.045,
            ratio_20x_plus=0.005
        ),
        addon=AddOnConfig(enabled=False),
        user_behavior=UserBehaviorConfig(
            high_freq_ratio=0.15,
            mid_freq_ratio=0.35,
            low_freq_ratio=0.50
        )
    ),
    'plw': LotteryPurchaseConfig(
        lottery_id='plw',
        bet_type=BetTypeConfig(
            single_ratio=0.95,
            complex_ratio=0.05,
            dan_tuo_ratio=0.00
        ),
        multiplier=MultiplierConfig(
            ratio_1x=0.80,
            ratio_2_5x=0.18,
            ratio_6_20x=0.015,
            ratio_20x_plus=0.005
        ),
        addon=AddOnConfig(enabled=False),
        user_behavior=UserBehaviorConfig(
            high_freq_ratio=0.10,
            mid_freq_ratio=0.40,
            low_freq_ratio=0.50
        )
    ),
    'qxc': LotteryPurchaseConfig(
        lottery_id='qxc',
        bet_type=BetTypeConfig(
            single_ratio=0.70,
            complex_ratio=0.30,
            dan_tuo_ratio=0.00
        ),
        multiplier=MultiplierConfig(
            ratio_1x=0.75,
            ratio_2_5x=0.20,
            ratio_6_20x=0.045,
            ratio_20x_plus=0.005
        ),
        addon=AddOnConfig(enabled=False),
        user_behavior=UserBehaviorConfig(
            high_freq_ratio=0.08,
            mid_freq_ratio=0.37,
            low_freq_ratio=0.55
        )
    ),
    'qlc': LotteryPurchaseConfig(
        lottery_id='qlc',
        bet_type=BetTypeConfig(
            single_ratio=0.60,
            complex_ratio=0.28,
            dan_tuo_ratio=0.12
        ),
        multiplier=MultiplierConfig(
            ratio_1x=0.75,
            ratio_2_5x=0.20,
            ratio_6_20x=0.045,
            ratio_20x_plus=0.005
        ),
        addon=AddOnConfig(enabled=False),
        user_behavior=UserBehaviorConfig(
            high_freq_ratio=0.07,
            mid_freq_ratio=0.38,
            low_freq_ratio=0.55
        )
    )
}


class EnhancedPurchaseSimulator:
    """增强版投注模拟器"""
    
    def __init__(self, lottery_id: str):
        self.config = get_lottery_config(lottery_id)
        self.purchase_config = DEFAULT_CONFIGS.get(lottery_id)
        if not self.config:
            raise ValueError(f"Unknown lottery type: {lottery_id}")
        if not self.purchase_config:
            self.purchase_config = LotteryPurchaseConfig(lottery_id=lottery_id)
    
    def _generate_weighted_numbers(self, zone: NumberZone, count: int) -> List[int]:
        """生成考虑号码偏好的随机号码"""
        pool = list(range(zone.min, zone.max + 1))
        
        if self.purchase_config.number_feature.hot_numbers:
            weights = []
            for num in pool:
                if num in self.purchase_config.number_feature.hot_numbers:
                    weights.append(1.0 + self.purchase_config.number_feature.hot_bonus)
                elif num in self.purchase_config.number_feature.cold_numbers:
                    weights.append(1.0 - self.purchase_config.number_feature.cold_penalty)
                else:
                    weights.append(1.0)
            
            total_weight = sum(weights)
            probs = [w / total_weight for w in weights]
            selected = random.choices(pool, weights=probs, k=count)
        else:
            selected = random.sample(pool, count)
        
        return sorted(selected)
    
    def generate_single_bet(self) -> Dict[str, List[int]]:
        """生成一注基本单式投注"""
        bet = {}
        for zone in self.config.zones:
            numbers = self._generate_weighted_numbers(zone, zone.count)
            bet[zone.name] = numbers
        return bet
    
    def generate_complex_bet(self) -> Dict[str, List[int]]:
        """生成复式投注（红球或蓝球数量超过基本要求）"""
        bet = {}
        for zone in self.config.zones:
            base_count = zone.count
            if zone.name in ['红球', '前区']:
                rand = random.random()
                if rand < self.purchase_config.bet_type.complex_red7_ratio:
                    count = base_count + 1  # 7红/7前区
                elif rand < self.purchase_config.bet_type.complex_red7_ratio + self.purchase_config.bet_type.complex_red8_9_ratio:
                    count = base_count + random.randint(2, 3)  # 8-9红
                else:
                    count = base_count + random.randint(4, 6)  # 10-12红
                numbers = self._generate_weighted_numbers(zone, count)
            elif zone.name in ['蓝球', '后区']:
                if random.random() < 0.7:
                    count = base_count + 1  # 3蓝
                elif random.random() < 0.95:
                    count = base_count + 2  # 4蓝
                else:
                    count = base_count + random.randint(3, 4)  # 5-6蓝
                numbers = self._generate_weighted_numbers(zone, count)
            else:
                numbers = self._generate_weighted_numbers(zone, base_count)
            bet[zone.name] = numbers
        return bet
    
    def generate_dan_tuo_bet(self) -> Dict[str, List[int]]:
        """生成胆拖投注"""
        bet = {}
        for zone in self.config.zones:
            if zone.name in ['红球', '前区']:
                rand = random.random()
                if rand < self.purchase_config.bet_type.dan1_tuo5_ratio:
                    dan_count = 1
                    tuo_count = 5
                elif rand < self.purchase_config.bet_type.dan1_tuo5_ratio + self.purchase_config.bet_type.dan2_tuo4_ratio:
                    dan_count = 2
                    tuo_count = 4
                else:
                    dan_count = 3
                    tuo_count = 3
                
                all_numbers = self._generate_weighted_numbers(zone, dan_count + tuo_count)
                bet[f'{zone.name}_胆'] = sorted(all_numbers[:dan_count])
                bet[f'{zone.name}_拖'] = sorted(all_numbers[dan_count:])
            else:
                numbers = self._generate_weighted_numbers(zone, zone.count)
                bet[zone.name] = numbers
        return bet
    
    def generate_bet_type(self) -> Tuple[str, Dict[str, List[int]]]:
        """随机选择投注类型并生成投注"""
        rand = random.random()
        single_ratio = self.purchase_config.bet_type.single_ratio
        complex_ratio = self.purchase_config.bet_type.complex_ratio
        
        if rand < single_ratio:
            return 'single', self.generate_single_bet()
        elif rand < single_ratio + complex_ratio:
            return 'complex', self.generate_complex_bet()
        else:
            return 'dan_tuo', self.generate_dan_tuo_bet()
    
    def generate_multiplier(self) -> int:
        """根据倍投分布随机生成倍数"""
        rand = random.random()
        m = self.purchase_config.multiplier
        
        if rand < m.ratio_1x:
            return 1
        elif rand < m.ratio_1x + m.ratio_2_5x:
            return random.randint(2, 5)
        elif rand < m.ratio_1x + m.ratio_2_5x + m.ratio_6_20x:
            return random.randint(6, 20)
        else:
            return random.randint(21, 100)
    
    def generate_addon(self) -> bool:
        """根据追加占比决定是否追加（仅大乐透）"""
        if not self.purchase_config.addon.enabled:
            return False
        return random.random() < self.purchase_config.addon.ratio
    
    def generate_full_bet(self) -> Dict:
        """生成完整投注（包含类型、号码、倍数、追加）"""
        bet_type, numbers = self.generate_bet_type()
        multiplier = self.generate_multiplier()
        addon = self.generate_addon()
        
        return {
            'bet_type': bet_type,
            'numbers': numbers,
            'multiplier': multiplier,
            'addon': addon,
            'cost': self.calculate_cost(bet_type, numbers, multiplier, addon)
        }
    
    def calculate_cost(self, bet_type: str, numbers: Dict[str, List[int]], 
                       multiplier: int, addon: bool) -> float:
        """计算投注成本"""
        base_cost = self.config.price_per_bet
        
        if bet_type == 'single':
            bet_count = 1
        elif bet_type == 'complex':
            bet_count = 1
            for zone in self.config.zones:
                nums = numbers.get(zone.name, [])
                if len(nums) > zone.count:
                    bet_count *= math.comb(len(nums), zone.count)
        elif bet_type == 'dan_tuo':
            bet_count = 1
            for zone in self.config.zones:
                dan = numbers.get(f'{zone.name}_胆', [])
                tuo = numbers.get(f'{zone.name}_拖', [])
                if dan and tuo:
                    bet_count *= math.comb(len(tuo), zone.count - len(dan))
                else:
                    nums = numbers.get(zone.name, [])
                    if nums:
                        bet_count *= math.comb(len(nums), zone.count)
        else:
            bet_count = 1
        
        total_cost = bet_count * base_cost * multiplier
        if addon:
            total_cost += bet_count * multiplier  # 追加每注+1元
        
        return total_cost
    
    def generate_batch(self, count: int) -> List[Dict]:
        """批量生成投注"""
        return [self.generate_full_bet() for _ in range(count)]
    
    def generate_by_amount(self, total_amount: float) -> List[Dict]:
        """按总金额生成投注列表"""
        bets = []
        remaining = total_amount
        
        while remaining > self.config.price_per_bet:
            bet = self.generate_full_bet()
            if bet['cost'] <= remaining:
                bets.append(bet)
                remaining -= bet['cost']
            else:
                # 调整倍数使成本不超过剩余金额
                max_multiplier = int(remaining / (bet['cost'] / bet['multiplier']))
                if max_multiplier >= 1:
                    bet['multiplier'] = max_multiplier
                    bet['cost'] = self.calculate_cost(
                        bet['bet_type'], bet['numbers'], max_multiplier, bet['addon']
                    )
                    bets.append(bet)
                    remaining -= bet['cost']
                break
        
        return bets
    
    def get_config(self) -> LotteryPurchaseConfig:
        """获取当前投注配置"""
        return self.purchase_config
    
    def update_config(self, **kwargs):
        """更新配置参数"""
        for key, value in kwargs.items():
            if hasattr(self.purchase_config, key):
                setattr(self.purchase_config, key, value)
            elif hasattr(self.purchase_config.bet_type, key):
                setattr(self.purchase_config.bet_type, key, value)
            elif hasattr(self.purchase_config.multiplier, key):
                setattr(self.purchase_config.multiplier, key, value)
            elif hasattr(self.purchase_config.addon, key):
                setattr(self.purchase_config.addon, key, value)
            elif hasattr(self.purchase_config.user_behavior, key):
                setattr(self.purchase_config.user_behavior, key, value)
            elif hasattr(self.purchase_config.number_feature, key):
                setattr(self.purchase_config.number_feature, key, value)


def get_default_purchase_config(lottery_id: str) -> LotteryPurchaseConfig:
    """获取指定彩种的默认投注配置"""
    return DEFAULT_CONFIGS.get(lottery_id, LotteryPurchaseConfig(lottery_id=lottery_id))


def list_lottery_purchase_configs() -> List[str]:
    """列出支持的彩种"""
    return list(DEFAULT_CONFIGS.keys())
