"""
通用号码生成器实现

支持的生成策略：
1. 随机生成（默认）
2. 按位匹配（直选）
3. 不按位匹配（组选）
4. 允许重复/不允许重复
5. 排序/不排序
"""

import random
from typing import Dict, List, Optional, Tuple
from .base import BaseNumberGenerator, LotteryConfig, NumberZone, ComponentFactory


class DefaultNumberGenerator(BaseNumberGenerator):
    """默认号码生成器"""
    
    def generate(self, config: LotteryConfig) -> Dict[str, List[int]]:
        """
        生成开奖号码
        
        Args:
            config: 彩票配置
            
        Returns:
            字典，键为区域名称，值为生成的号码列表
        """
        result = {}
        
        for zone in config.zones:
            numbers = self._generate_zone_numbers(zone)
            result[zone.name] = numbers
        
        return result
    
    def generate_bet(
        self,
        config: LotteryConfig,
        bet_type: str = "single"
    ) -> Dict[str, List[int]]:
        """
        生成投注号码
        
        Args:
            config: 彩票配置
            bet_type: 投注类型 (single/complex/dan_tuo)
            
        Returns:
            字典，键为区域名称，值为投注号码列表
        """
        result = {}
        
        for zone in config.zones:
            if bet_type == "single":
                numbers = self._generate_zone_numbers(zone)
            elif bet_type == "complex":
                numbers = self._generate_complex_numbers(zone)
            elif bet_type == "dan_tuo":
                numbers = self._generate_dan_tuo_numbers(zone)
            else:
                numbers = self._generate_zone_numbers(zone)
            
            result[zone.name] = numbers
        
        return result
    
    def _generate_zone_numbers(self, zone: NumberZone) -> List[int]:
        """
        生成单个区域的号码
        
        Args:
            zone: 区域配置
            
        Returns:
            号码列表
        """
        if zone.repeatable:
            # 允许重复
            numbers = [random.randint(zone.min_value, zone.max_value) for _ in range(zone.count)]
        else:
            # 不允许重复
            numbers = random.sample(range(zone.min_value, zone.max_value + 1), zone.count)
        
        if zone.sorted:
            numbers.sort()
        
        return numbers
    
    def _generate_complex_numbers(self, zone: NumberZone) -> List[int]:
        """
        生成复式号码（多选几个号码）
        
        Args:
            zone: 区域配置
            
        Returns:
            号码列表
        """
        if not zone.allow_extra:
            return self._generate_zone_numbers(zone)
        
        # 复式：多选1-5个额外号码
        extra_count = random.randint(1, min(5, zone.max_extra or 5))
        total_count = zone.count + extra_count
        
        if zone.repeatable:
            numbers = [random.randint(zone.min_value, zone.max_value) for _ in range(total_count)]
        else:
            numbers = random.sample(range(zone.min_value, zone.max_value + 1), total_count)
        
        if zone.sorted:
            numbers.sort()
        
        return numbers
    
    def _generate_dan_tuo_numbers(self, zone: NumberZone) -> List[int]:
        """
        生成胆拖号码（胆码+拖码）
        
        Args:
            zone: 区域配置
            
        Returns:
            号码列表（胆码在前，拖码在后）
        """
        if not zone.allow_dan_tuo:
            return self._generate_zone_numbers(zone)
        
        # 胆码：1-4个
        dan_count = random.randint(1, min(4, zone.count - 1))
        # 拖码：确保总数至少为zone.count
        tuo_count = max(zone.count - dan_count, 2)
        
        all_numbers = list(range(zone.min_value, zone.max_value + 1))
        
        # 选择胆码
        dan_numbers = random.sample(all_numbers, dan_count)
        
        # 从剩余号码中选择拖码
        remaining = [n for n in all_numbers if n not in dan_numbers]
        tuo_numbers = random.sample(remaining, tuo_count)
        
        # 胆码在前，拖码在后
        numbers = dan_numbers + tuo_numbers
        
        if zone.sorted:
            numbers.sort()
        
        return numbers
    
    def generate_with_strategy(
        self,
        config: LotteryConfig,
        strategy: str = "random",
        **kwargs
    ) -> Dict[str, List[int]]:
        """
        使用指定策略生成号码
        
        Args:
            config: 彩票配置
            strategy: 策略名称
            **kwargs: 策略参数
            
        Returns:
            字典，键为区域名称，值为生成的号码列表
        """
        if strategy == "random":
            return self.generate(config)
        elif strategy == "hot_numbers":
            return self._generate_hot_numbers(config, **kwargs)
        elif strategy == "cold_numbers":
            return self._generate_cold_numbers(config, **kwargs)
        elif strategy == "birthday":
            return self._generate_birthday_numbers(config, **kwargs)
        elif strategy == "consecutive":
            return self._generate_consecutive_numbers(config, **kwargs)
        else:
            return self.generate(config)
    
    def _generate_hot_numbers(
        self,
        config: LotteryConfig,
        hot_numbers: Optional[Dict[str, List[int]]] = None,
        **kwargs
    ) -> Dict[str, List[int]]:
        """
        生成热门号码（基于历史频率）
        
        Args:
            config: 彩票配置
            hot_numbers: 热门号码字典
            
        Returns:
            号码列表
        """
        if not hot_numbers:
            return self.generate(config)
        
        result = {}
        
        for zone in config.zones:
            zone_hot = hot_numbers.get(zone.name, [])
            if not zone_hot or len(zone_hot) < zone.count:
                result[zone.name] = self._generate_zone_numbers(zone)
            else:
                # 从热门号码中随机选择
                numbers = random.sample(zone_hot, zone.count)
                if zone.sorted:
                    numbers.sort()
                result[zone.name] = numbers
        
        return result
    
    def _generate_cold_numbers(
        self,
        config: LotteryConfig,
        cold_numbers: Optional[Dict[str, List[int]]] = None,
        **kwargs
    ) -> Dict[str, List[int]]:
        """
        生成冷门号码（基于遗漏值）
        
        Args:
            config: 彩票配置
            cold_numbers: 冷门号码字典
            
        Returns:
            号码列表
        """
        if not cold_numbers:
            return self.generate(config)
        
        result = {}
        
        for zone in config.zones:
            zone_cold = cold_numbers.get(zone.name, [])
            if not zone_cold or len(zone_cold) < zone.count:
                result[zone.name] = self._generate_zone_numbers(zone)
            else:
                # 从冷门号码中随机选择
                numbers = random.sample(zone_cold, zone.count)
                if zone.sorted:
                    numbers.sort()
                result[zone.name] = numbers
        
        return result
    
    def _generate_birthday_numbers(
        self,
        config: LotteryConfig,
        birthday: Optional[str] = None,
        **kwargs
    ) -> Dict[str, List[int]]:
        """
        生成生日号码
        
        Args:
            config: 彩票配置
            birthday: 生日字符串 (YYYY-MM-DD)
            
        Returns:
            号码列表
        """
        if not birthday:
            return self.generate(config)
        
        # 解析生日
        try:
            year, month, day = map(int, birthday.split("-"))
        except:
            return self.generate(config)
        
        result = {}
        
        for zone in config.zones:
            # 从生日数字中提取
            birthday_digits = []
            for digit in str(year) + str(month) + str(day):
                num = int(digit)
                if zone.min_value <= num <= zone.max_value:
                    birthday_digits.append(num)
            
            # 去重
            birthday_digits = list(set(birthday_digits))
            
            if len(birthday_digits) >= zone.count:
                numbers = random.sample(birthday_digits, zone.count)
            else:
                # 补充随机号码
                remaining = [
                    n for n in range(zone.min_value, zone.max_value + 1)
                    if n not in birthday_digits
                ]
                supplement = random.sample(remaining, zone.count - len(birthday_digits))
                numbers = birthday_digits + supplement
            
            if zone.sorted:
                numbers.sort()
            
            result[zone.name] = numbers
        
        return result
    
    def _generate_consecutive_numbers(
        self,
        config: LotteryConfig,
        start: Optional[int] = None,
        **kwargs
    ) -> Dict[str, List[int]]:
        """
        生成连号
        
        Args:
            config: 彩票配置
            start: 起始号码
            
        Returns:
            号码列表
        """
        result = {}
        
        for zone in config.zones:
            if start is None:
                # 随机选择起始号码
                max_start = zone.max_value - zone.count + 1
                if max_start < zone.min_value:
                    start_num = zone.min_value
                else:
                    start_num = random.randint(zone.min_value, max_start)
            else:
                start_num = max(zone.min_value, min(start, zone.max_value - zone.count + 1))
            
            numbers = list(range(start_num, start_num + zone.count))
            
            if zone.sorted:
                numbers.sort()
            
            result[zone.name] = numbers
        
        return result


class RandomNumberGenerator(DefaultNumberGenerator):
    """随机号码生成器（默认策略）"""
    pass


class StrategyNumberGenerator(DefaultNumberGenerator):
    """策略号码生成器（支持多种策略）"""
    
    def __init__(self):
        self.strategies = {
            "random": self.generate,
            "hot": lambda config: self.generate_with_strategy(config, "hot_numbers"),
            "cold": lambda config: self.generate_with_strategy(config, "cold_numbers"),
            "birthday": lambda config: self.generate_with_strategy(config, "birthday"),
            "consecutive": lambda config: self.generate_with_strategy(config, "consecutive"),
        }
    
    def register_strategy(self, name: str, strategy_func):
        """注册自定义策略"""
        self.strategies[name] = strategy_func
    
    def generate_with_strategy_name(
        self,
        config: LotteryConfig,
        strategy_name: str = "random",
        **kwargs
    ) -> Dict[str, List[int]]:
        """使用策略名称生成号码"""
        strategy_func = self.strategies.get(strategy_name, self.generate)
        return strategy_func(config)


# 注册默认组件
ComponentFactory.register_generator("default", DefaultNumberGenerator)
ComponentFactory.register_generator("random", RandomNumberGenerator)
ComponentFactory.register_generator("strategy", StrategyNumberGenerator)