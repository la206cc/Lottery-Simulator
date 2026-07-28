"""
核心引擎基类和接口定义

设计原则：
1. 策略模式：支持不同的生成规则和计算逻辑
2. 工厂模式：创建不同类型的组件
3. 依赖注入：解耦组件之间的依赖
4. 配置驱动：动态选择计算逻辑
5. 插件式扩展：支持自定义扩展
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
import json


@dataclass
class NumberZone:
    """号码区域配置"""
    name: str
    min_value: int
    max_value: int
    count: int
    repeatable: bool = False
    sorted: bool = True
    allow_extra: bool = False
    max_extra: Optional[int] = None
    allow_dan_tuo: bool = False
    color: Optional[str] = None


@dataclass
class PrizeTier:
    """奖级配置"""
    level: int
    name: str
    match_pattern: List[List[int]]
    fixed: bool
    amount: Optional[float] = None
    pool_ratio: Optional[float] = None
    max_per_ticket: Optional[float] = None
    max_total: Optional[float] = None


@dataclass
class LotteryConfig:
    """彩票配置"""
    id: str
    name: str
    full_name: Optional[str] = None
    category: str = "乐透型"
    issue_interval: str = "weekly"
    price_per_bet: float = 2.0
    currency: str = "CNY"
    zones: List[NumberZone] = field(default_factory=list)
    prizes: List[PrizeTier] = field(default_factory=list)
    pool_tiers: Optional[List[Dict]] = None
    guarantee_rules: Optional[List[Dict]] = None
    can_add_on: bool = False
    add_on_price: float = 1.0
    has_special_number: bool = False
    special_number_zone: Optional[str] = None
    has_reverse_prize: bool = False
    reverse_threshold: Optional[float] = None
    bet_type: Optional[Dict] = None
    multiplier: Optional[Dict] = None
    play_types: Optional[List[Dict]] = None


# 抽象基类：号码生成器
class BaseNumberGenerator(ABC):
    """号码生成器抽象基类"""
    
    @abstractmethod
    def generate(self, config: LotteryConfig) -> Dict[str, List[int]]:
        """
        生成开奖号码
        
        Args:
            config: 彩票配置
            
        Returns:
            字典，键为区域名称，值为生成的号码列表
        """
        pass
    
    @abstractmethod
    def generate_bet(self, config: LotteryConfig, bet_type: str = "single") -> Dict[str, List[int]]:
        """
        生成投注号码
        
        Args:
            config: 彩票配置
            bet_type: 投注类型 (single/complex/dan_tuo)
            
        Returns:
            字典，键为区域名称，值为投注号码列表
        """
        pass
    
    def validate_numbers(self, config: LotteryConfig, numbers: Dict[str, List[int]]) -> bool:
        """
        验证号码是否有效
        
        Args:
            config: 彩票配置
            numbers: 要验证的号码
            
        Returns:
            是否有效
        """
        for zone_config in config.zones:
            zone_name = zone_config.name
            if zone_name not in numbers:
                return False
            
            zone_numbers = numbers[zone_name]
            
            # 检查数量
            if len(zone_numbers) != zone_config.count:
                if not (zone_config.allow_extra and len(zone_numbers) <= zone_config.max_extra):
                    return False
            
            # 检查范围
            for num in zone_numbers:
                if num < zone_config.min_value or num > zone_config.max_value:
                    return False
            
            # 检查重复
            if not zone_config.repeatable:
                if len(zone_numbers) != len(set(zone_numbers)):
                    return False
        
        return True


# 抽象基类：奖金计算器
class BasePrizeCalculator(ABC):
    """奖金计算器抽象基类"""
    
    @abstractmethod
    def calculate_prize(
        self,
        config: LotteryConfig,
        winning_numbers: Dict[str, List[int]],
        bet_numbers: Dict[str, List[int]],
        pool_amount: float,
        total_sales: float,
        total_bets: int
    ) -> Dict[str, Any]:
        """
        计算奖金
        
        Args:
            config: 彩票配置
            winning_numbers: 开奖号码
            bet_numbers: 投注号码
            pool_amount: 奖池金额
            total_sales: 总销售额
            total_bets: 总投注数
            
        Returns:
            奖金计算结果
        """
        pass
    
    @abstractmethod
    def match_numbers(
        self,
        config: LotteryConfig,
        winning_numbers: Dict[str, List[int]],
        bet_numbers: Dict[str, List[int]]
    ) -> Dict[str, int]:
        """
        匹配号码，返回各区域命中数
        
        Args:
            config: 彩票配置
            winning_numbers: 开奖号码
            bet_numbers: 投注号码
            
        Returns:
            字典，键为区域名称，值为命中数量
        """
        pass
    
    def check_prize_tier(
        self,
        config: LotteryConfig,
        match_result: Dict[str, int]
    ) -> Optional[PrizeTier]:
        """
        检查中奖奖级
        
        Args:
            config: 彩票配置
            match_result: 匹配结果
            
        Returns:
            中奖的奖级，未中奖返回None
        """
        for prize in sorted(config.prizes, key=lambda p: p.level):
            if self._check_match_pattern(prize.match_pattern, match_result):
                return prize
        return None
    
    def _check_match_pattern(
        self,
        pattern: List[List[int]],
        match_result: Dict[str, int]
    ) -> bool:
        """
        检查匹配模式
        
        Args:
            pattern: 匹配模式，如 [[6, 1]] 表示红球6+蓝球1
            match_result: 匹配结果
            
        Returns:
            是否匹配
        """
        if not pattern:
            return False
        
        for pattern_item in pattern:
            if len(pattern_item) != len(match_result):
                continue
            
            match = True
            for i, (zone_name, expected_count) in enumerate(match_result.items()):
                if pattern_item[i] != expected_count:
                    match = False
                    break
            
            if match:
                return True
        
        return False


# 抽象基类：投注模拟器
class BaseBetSimulator(ABC):
    """投注模拟器抽象基类"""
    
    @abstractmethod
    def simulate(
        self,
        config: LotteryConfig,
        num_rounds: int,
        initial_pool: float,
        initial_capital: float,
        strategy: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        执行模拟
        
        Args:
            config: 彩票配置
            num_rounds: 模拟轮次
            initial_pool: 初始奖池
            initial_capital: 初始资金
            strategy: 投注策略
            
        Returns:
            模拟结果
        """
        pass
    
    @abstractmethod
    def create_bet(
        self,
        config: LotteryConfig,
        bet_type: str = "single",
        multiplier: int = 1,
        add_on: bool = False
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
        pass


# 抽象基类：数据分析器
class BaseDataAnalyzer(ABC):
    """数据分析器抽象基类"""
    
    @abstractmethod
    def analyze_frequency(
        self,
        data: List[Dict[str, List[int]]],
        config: LotteryConfig
    ) -> Dict[str, Any]:
        """
        分析号码频率
        
        Args:
            data: 历史开奖数据
            config: 彩票配置
            
        Returns:
            频率分析结果
        """
        pass
    
    @abstractmethod
    def analyze_missing(
        self,
        data: List[Dict[str, List[int]]],
        config: LotteryConfig
    ) -> Dict[str, Any]:
        """
        分析遗漏值
        
        Args:
            data: 历史开奖数据
            config: 彩票配置
            
        Returns:
            遗漏分析结果
        """
        pass
    
    @abstractmethod
    def analyze_trend(
        self,
        data: List[Dict[str, List[int]]],
        config: LotteryConfig
    ) -> Dict[str, Any]:
        """
        分析趋势
        
        Args:
            data: 历史开奖数据
            config: 彩票配置
            
        Returns:
            趋势分析结果
        """
        pass


# 抽象基类：数据存储器
class BaseDataStorage(ABC):
    """数据存储器抽象基类"""
    
    @abstractmethod
    def save_simulation_data(
        self,
        data: Dict[str, Any],
        config: LotteryConfig,
        filename: str
    ) -> str:
        """
        保存模拟数据
        
        Args:
            data: 模拟数据
            config: 彩票配置
            filename: 文件名
            
        Returns:
            保存的文件路径
        """
        pass
    
    @abstractmethod
    def load_simulation_data(
        self,
        filename: str
    ) -> Dict[str, Any]:
        """
        加载模拟数据
        
        Args:
            filename: 文件名
            
        Returns:
            模拟数据
        """
        pass
    
    @abstractmethod
    def export_data(
        self,
        data: Dict[str, Any],
        format: str = "json"
    ) -> str:
        """
        导出数据
        
        Args:
            data: 数据
            format: 导出格式
            
        Returns:
            导出的数据
        """
        pass


# 工厂模式：组件工厂
class ComponentFactory:
    """组件工厂，用于创建各种组件"""
    
    _generators = {}
    _calculators = {}
    _simulators = {}
    _analyzers = {}
    _storages = {}
    
    @classmethod
    def register_generator(cls, name: str, generator_class: type):
        """注册号码生成器"""
        cls._generators[name] = generator_class
    
    @classmethod
    def register_calculator(cls, name: str, calculator_class: type):
        """注册奖金计算器"""
        cls._calculators[name] = calculator_class
    
    @classmethod
    def register_simulator(cls, name: str, simulator_class: type):
        """注册投注模拟器"""
        cls._simulators[name] = simulator_class
    
    @classmethod
    def register_analyzer(cls, name: str, analyzer_class: type):
        """注册数据分析器"""
        cls._analyzers[name] = analyzer_class
    
    @classmethod
    def register_storage(cls, name: str, storage_class: type):
        """注册数据存储器"""
        cls._storages[name] = storage_class
    
    @classmethod
    def create_generator(cls, name: str = "default") -> BaseNumberGenerator:
        """创建号码生成器"""
        if name not in cls._generators:
            raise ValueError(f"未找到生成器: {name}")
        return cls._generators[name]()
    
    @classmethod
    def create_calculator(cls, name: str = "default") -> BasePrizeCalculator:
        """创建奖金计算器"""
        if name not in cls._calculators:
            raise ValueError(f"未找到计算器: {name}")
        return cls._calculators[name]()
    
    @classmethod
    def create_simulator(cls, name: str = "default") -> BaseBetSimulator:
        """创建投注模拟器"""
        if name not in cls._simulators:
            raise ValueError(f"未找到模拟器: {name}")
        return cls._simulators[name]()
    
    @classmethod
    def create_analyzer(cls, name: str = "default") -> BaseDataAnalyzer:
        """创建数据分析器"""
        if name not in cls._analyzers:
            raise ValueError(f"未找到分析器: {name}")
        return cls._analyzers[name]()
    
    @classmethod
    def create_storage(cls, name: str = "default") -> BaseDataStorage:
        """创建数据存储器"""
        if name not in cls._storages:
            raise ValueError(f"未找到存储器: {name}")
        return cls._storages[name]()


# 配置加载器
class ConfigLoader:
    """配置加载器，支持从JSON加载配置"""
    
    @staticmethod
    def from_json(json_data: Union[str, Dict]) -> LotteryConfig:
        """
        从JSON加载配置
        
        Args:
            json_data: JSON数据或JSON字符串
            
        Returns:
            彩票配置
        """
        if isinstance(json_data, str):
            data = json.loads(json_data)
        else:
            data = json_data
        
        # 转换zones
        zones = []
        for zone_data in data.get("zones", []):
            zone = NumberZone(
                name=zone_data["name"],
                min_value=zone_data.get("min", 1),
                max_value=zone_data.get("max", 33),
                count=zone_data.get("count", 6),
                repeatable=zone_data.get("repeatable", False),
                sorted=zone_data.get("sorted", True),
                allow_extra=zone_data.get("allowExtra", False),
                max_extra=zone_data.get("maxExtra"),
                allow_dan_tuo=zone_data.get("allowDanTuo", False),
                color=zone_data.get("color")
            )
            zones.append(zone)
        
        # 转换prizes
        prizes = []
        for prize_data in data.get("prizes", []):
            prize = PrizeTier(
                level=prize_data["level"],
                name=prize_data["name"],
                match_pattern=prize_data.get("matchPattern", []),
                fixed=prize_data.get("fixed", True),
                amount=prize_data.get("amount"),
                pool_ratio=prize_data.get("poolRatio"),
                max_per_ticket=prize_data.get("maxPerTicket"),
                max_total=prize_data.get("maxTotal")
            )
            prizes.append(prize)
        
        # 创建配置
        config = LotteryConfig(
            id=data["id"],
            name=data["name"],
            full_name=data.get("fullName"),
            category=data.get("category", "乐透型"),
            issue_interval=data.get("issueInterval", "weekly"),
            price_per_bet=data.get("pricePerBet", 2.0),
            currency=data.get("currency", "CNY"),
            zones=zones,
            prizes=prizes,
            pool_tiers=data.get("poolTiers"),
            guarantee_rules=data.get("guaranteeRules"),
            can_add_on=data.get("canAddOn", False),
            add_on_price=data.get("addOnPrice", 1.0),
            has_special_number=data.get("hasSpecialNumber", False),
            special_number_zone=data.get("specialNumberZone"),
            has_reverse_prize=data.get("hasReversePrize", False),
            reverse_threshold=data.get("reverseThreshold"),
            bet_type=data.get("betType"),
            multiplier=data.get("multiplier"),
            play_types=data.get("playTypes")
        )
        
        return config
    
    @staticmethod
    def to_json(config: LotteryConfig) -> Dict:
        """
        将配置转换为JSON
        
        Args:
            config: 彩票配置
            
        Returns:
            JSON字典
        """
        return {
            "id": config.id,
            "name": config.name,
            "fullName": config.full_name,
            "category": config.category,
            "issueInterval": config.issue_interval,
            "pricePerBet": config.price_per_bet,
            "currency": config.currency,
            "zones": [
                {
                    "name": z.name,
                    "min": z.min_value,
                    "max": z.max_value,
                    "count": z.count,
                    "repeatable": z.repeatable,
                    "sorted": z.sorted,
                    "allowExtra": z.allow_extra,
                    "maxExtra": z.max_extra,
                    "allowDanTuo": z.allow_dan_tuo,
                    "color": z.color
                }
                for z in config.zones
            ],
            "prizes": [
                {
                    "level": p.level,
                    "name": p.name,
                    "matchPattern": p.match_pattern,
                    "fixed": p.fixed,
                    "amount": p.amount,
                    "poolRatio": p.pool_ratio,
                    "maxPerTicket": p.max_per_ticket,
                    "maxTotal": p.max_total
                }
                for p in config.prizes
            ],
            "poolTiers": config.pool_tiers,
            "guaranteeRules": config.guarantee_rules,
            "canAddOn": config.can_add_on,
            "addOnPrice": config.add_on_price,
            "hasSpecialNumber": config.has_special_number,
            "specialNumberZone": config.special_number_zone,
            "hasReversePrize": config.has_reverse_prize,
            "reverseThreshold": config.reverse_threshold,
            "betType": config.bet_type,
            "multiplier": config.multiplier,
            "playTypes": config.play_types
        }


# 插件管理器
class PluginManager:
    """插件管理器，支持动态加载插件"""
    
    def __init__(self):
        self.plugins = {}
    
    def register_plugin(self, name: str, plugin: Any):
        """注册插件"""
        self.plugins[name] = plugin
    
    def get_plugin(self, name: str) -> Any:
        """获取插件"""
        return self.plugins.get(name)
    
    def list_plugins(self) -> List[str]:
        """列出所有插件"""
        return list(self.plugins.keys())