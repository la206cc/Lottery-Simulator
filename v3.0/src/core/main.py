"""
彩票模拟器核心引擎 - 主模块

提供统一的API接口，整合所有核心组件：
1. 号码生成器
2. 奖金计算器
3. 投注模拟器
4. 数据分析器
5. 数据存储器

使用方式：
    from src.core.main import LotteryEngine
    
    # 创建引擎
    engine = LotteryEngine("ssq")
    
    # 执行模拟
    result = engine.simulate(num_rounds=1000)
    
    # 分析数据
    analysis = engine.analyze(result)
    
    # 保存结果
    engine.save(result, "simulation_001")
"""

from typing import Dict, List, Optional, Any, Union
import os
import json
from .base import (
    LotteryConfig, ConfigLoader, ComponentFactory, PluginManager,
    BaseNumberGenerator, BasePrizeCalculator, BaseBetSimulator, 
    BaseDataAnalyzer, BaseDataStorage
)

# 导入所有模块，确保组件被注册
from . import generators
from . import calculators
from . import simulators
from . import analyzers
from . import storages


class LotteryEngine:
    """彩票模拟器引擎"""
    
    def __init__(
        self,
        config: Union[str, LotteryConfig, Dict],
        generator_name: str = "default",
        calculator_name: str = "default",
        simulator_name: str = "default",
        analyzer_name: str = "default",
        storage_name: str = "default",
        storage_dir: str = "data"
    ):
        """
        初始化引擎
        
        Args:
            config: 彩票配置（配置ID、配置对象或配置字典）
            generator_name: 号码生成器名称
            calculator_name: 奖金计算器名称
            simulator_name: 投注模拟器名称
            analyzer_name: 数据分析器名称
            storage_name: 数据存储器名称
            storage_dir: 存储目录
        """
        # 加载配置
        self.config = self._load_config(config)
        
        # 根据配置ID自动选择计算器
        if calculator_name == "default":
            calculator_name = self._get_calculator_name_by_config(self.config.id)
        
        # 创建组件
        self.generator = ComponentFactory.create_generator(generator_name)
        self.calculator = ComponentFactory.create_calculator(calculator_name)
        self.simulator = ComponentFactory.create_simulator(simulator_name)
        self.analyzer = ComponentFactory.create_analyzer(analyzer_name)
        self.storage = ComponentFactory.create_storage(storage_name)
        
        # 设置存储目录
        if hasattr(self.storage, 'base_dir'):
            self.storage.base_dir = storage_dir
        
        # 插件管理器
        self.plugin_manager = PluginManager()
    
    def _load_config(self, config: Union[str, LotteryConfig, Dict]) -> LotteryConfig:
        """
        加载配置
        
        Args:
            config: 配置
            
        Returns:
            彩票配置
        """
        if isinstance(config, LotteryConfig):
            return config
        elif isinstance(config, str):
            # 尝试从预设加载
            # 获取当前文件所在目录
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # 项目根目录（v3.0）
            project_root = os.path.dirname(os.path.dirname(current_dir))
            preset_path = os.path.join(project_root, "data", "presets", f"{config}.json")
            
            try:
                with open(preset_path, 'r', encoding='utf-8') as f:
                    config_dict = json.load(f)
                return ConfigLoader.from_json(config_dict)
            except:
                # 尝试从文件加载
                try:
                    return self.storage.load_config(config)
                except:
                    raise ValueError(f"无法加载配置: {config}")
        elif isinstance(config, dict):
            return ConfigLoader.from_json(config)
        else:
            raise ValueError(f"不支持的配置类型: {type(config)}")
    
    def _get_calculator_name_by_config(self, config_id: str) -> str:
        """
        根据配置ID获取计算器名称
        
        Args:
            config_id: 配置ID
            
        Returns:
            计算器名称
        """
        # 映射配置ID到计算器名称
        calculator_mapping = {
            "ssq": "ssq",      # 双色球
            "dlt": "dlt",      # 超级大乐透
            "fc3d": "fc3d",    # 福彩3D
            "qxc": "qxc",      # 七星彩
            "pls": "default",  # 排列三
            "plw": "default",  # 排列五
            "qlc": "default",  # 七乐彩
            "kl8": "default",  # 快乐8
        }
        
        return calculator_mapping.get(config_id, "default")
    
    def generate_numbers(self, **kwargs) -> Dict[str, List[int]]:
        """
        生成开奖号码
        
        Args:
            **kwargs: 额外参数
            
        Returns:
            号码字典
        """
        return self.generator.generate(self.config, **kwargs)
    
    def generate_bet(self, bet_type: str = "single", **kwargs) -> Dict[str, List[int]]:
        """
        生成投注号码
        
        Args:
            bet_type: 投注类型
            **kwargs: 额外参数
            
        Returns:
            号码字典
        """
        return self.generator.generate_bet(self.config, bet_type, **kwargs)
    
    def calculate_prize(
        self,
        winning_numbers: Dict[str, List[int]],
        bet_numbers: Dict[str, List[int]],
        pool_amount: float,
        total_sales: float,
        total_bets: int
    ) -> Dict[str, Any]:
        """
        计算奖金
        
        Args:
            winning_numbers: 开奖号码
            bet_numbers: 投注号码
            pool_amount: 奖池金额
            total_sales: 总销售额
            total_bets: 总投注数
            
        Returns:
            奖金计算结果
        """
        return self.calculator.calculate_prize(
            self.config, winning_numbers, bet_numbers,
            pool_amount, total_sales, total_bets
        )
    
    def simulate(
        self,
        num_rounds: int = 1000,
        initial_pool: float = 100000000,
        initial_capital: float = 10000,
        strategy: Optional[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        执行模拟
        
        Args:
            num_rounds: 模拟轮次
            initial_pool: 初始奖池
            initial_capital: 初始资金
            strategy: 投注策略
            **kwargs: 额外参数
            
        Returns:
            模拟结果
        """
        return self.simulator.simulate(
            self.config, num_rounds, initial_pool, initial_capital,
            strategy, **kwargs
        )
    
    def analyze(
        self,
        data: Union[Dict[str, Any], List[Dict[str, Any]]],
        analysis_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        分析数据
        
        Args:
            data: 要分析的数据
            analysis_types: 分析类型列表
            
        Returns:
            分析结果
        """
        if analysis_types is None:
            analysis_types = ["frequency", "missing", "trend"]
        
        results = {}
        
        # 提取开奖数据
        if isinstance(data, dict) and "rounds" in data:
            draw_data = [r.get("winning_numbers", {}) for r in data["rounds"]]
        elif isinstance(data, list):
            draw_data = data
        else:
            draw_data = []
        
        if not draw_data:
            return results
        
        # 执行分析
        if "frequency" in analysis_types:
            results["frequency"] = self.analyzer.analyze_frequency(draw_data, self.config)
        
        if "missing" in analysis_types:
            results["missing"] = self.analyzer.analyze_missing(draw_data, self.config)
        
        if "trend" in analysis_types:
            results["trend"] = self.analyzer.analyze_trend(draw_data, self.config)
        
        if "combination" in analysis_types:
            results["combination"] = self.analyzer.analyze_number_combinations(
                draw_data, self.config
            )
        
        if "consecutive" in analysis_types:
            results["consecutive"] = self.analyzer.analyze_consecutive_numbers(
                draw_data, self.config
            )
        
        if "prize_distribution" in analysis_types:
            # 需要模拟结果
            if isinstance(data, dict) and "rounds" in data:
                prize_data = []
                for r in data["rounds"]:
                    prize_data.append({
                        "win": r.get("prize_amount", 0) > 0,
                        "prize_amount": r.get("prize_amount", 0),
                        "prize_level": r.get("prize_level"),
                        "bet_cost": r.get("bet_cost", 0)
                    })
                results["prize_distribution"] = self.analyzer.analyze_prize_distribution(
                    prize_data, self.config
                )
        
        return results
    
    def save(
        self,
        data: Dict[str, Any],
        filename: str,
        format: str = "json"
    ) -> str:
        """
        保存数据
        
        Args:
            data: 数据
            filename: 文件名
            format: 格式
            
        Returns:
            保存的文件路径
        """
        return self.storage.save_simulation_data(data, self.config, filename)
    
    def load(self, filename: str) -> Dict[str, Any]:
        """
        加载数据
        
        Args:
            filename: 文件名
            
        Returns:
            数据
        """
        return self.storage.load_simulation_data(filename)
    
    def export(
        self,
        data: Dict[str, Any],
        format: str = "json"
    ) -> str:
        """
        导出数据
        
        Args:
            data: 数据
            format: 格式
            
        Returns:
            导出的数据
        """
        return self.storage.export_data(data, format)
    
    def register_plugin(self, name: str, plugin: Any):
        """注册插件"""
        self.plugin_manager.register_plugin(name, plugin)
    
    def get_plugin(self, name: str) -> Any:
        """获取插件"""
        return self.plugin_manager.get_plugin(name)
    
    def get_config(self) -> LotteryConfig:
        """获取配置"""
        return self.config
    
    def get_config_dict(self) -> Dict:
        """获取配置字典"""
        return ConfigLoader.to_json(self.config)


# 快捷函数
def create_engine(
    config: Union[str, LotteryConfig, Dict],
    **kwargs
) -> LotteryEngine:
    """
    创建引擎的快捷函数
    
    Args:
        config: 彩票配置
        **kwargs: 额外参数
        
    Returns:
        彩票引擎
    """
    return LotteryEngine(config, **kwargs)


def load_preset_config(preset_id: str) -> LotteryConfig:
    """
    加载预设配置
    
    Args:
        preset_id: 预设ID
        
    Returns:
        彩票配置
    """
    import json
    
    preset_path = f"data/presets/{preset_id}.json"
    with open(preset_path, 'r', encoding='utf-8') as f:
        config_dict = json.load(f)
    
    return ConfigLoader.from_json(config_dict)


def list_presets() -> List[Dict[str, str]]:
    """
    列出所有预设
    
    Returns:
        预设列表
    """
    import os
    
    presets_dir = "data/presets"
    if not os.path.exists(presets_dir):
        return []
    
    presets = []
    for filename in os.listdir(presets_dir):
        if filename.endswith('.json'):
            preset_id = filename[:-5]  # 移除.json
            preset_path = os.path.join(presets_dir, filename)
            
            try:
                with open(preset_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                presets.append({
                    "id": preset_id,
                    "name": config.get("name", preset_id),
                    "category": config.get("category", "未知")
                })
            except:
                pass
    
    return presets