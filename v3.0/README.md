# 通用彩票模拟器 v3.0

完全配置化的彩票模拟平台，支持自定义彩票类型和精确的奖金计算。

## 🎯 特性

- **完全配置化**：通过配置文件定义彩票规则，无需修改代码
- **支持8种官方彩种**：双色球、超级大乐透、福彩3D、七星彩、排列三、排列五、七乐彩、快乐8
- **精确奖金计算**：支持复杂规则，包括保底、封顶、追加、倒置等
- **可扩展架构**：策略模式、工厂模式、插件系统，易于扩展
- **高性能**：每秒12万+轮模拟，满足大规模模拟需求

## 📦 安装

### 环境要求

- Python 3.8+
- 无需额外依赖（核心功能）

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>

# 进入项目目录
cd Lottery-Simulator/v3.0

# 安装可选依赖（用于数据分析）
pip install pandas pyarrow
```

## 🚀 快速开始

### 基本使用

```python
from src.core.main import create_engine

# 创建引擎（使用双色球配置）
engine = create_engine("ssq")

# 生成开奖号码
winning_numbers = engine.generate_numbers()
print(f"开奖号码: {winning_numbers}")

# 生成投注号码
bet_numbers = engine.generate_bet("single")
print(f"投注号码: {bet_numbers}")

# 计算奖金
prize_result = engine.calculate_prize(
    winning_numbers, bet_numbers,
    pool_amount=100000000,  # 奖池1亿
    total_sales=500000000,  # 总销售额5亿
    total_bets=250000000    # 总投注数2.5亿
)
print(f"中奖结果: {prize_result}")
```

### 执行模拟

```python
# 执行1000轮模拟
result = engine.simulate(
    num_rounds=1000,
    initial_pool=100000000,  # 初始奖池1亿
    initial_capital=10000    # 初始资金1万
)

# 查看结果
print(f"总轮次: {result['num_rounds']}")
print(f"总投资: {result['summary']['total_investment']}")
print(f"总回报: {result['summary']['total_return']}")
print(f"净利润: {result['summary']['net_profit']}")
print(f"回报率: {result['summary']['return_rate']:.2%}")
```

### 数据分析

```python
# 分析模拟结果
analysis = engine.analyze(
    result,
    analysis_types=["frequency", "missing", "trend"]
)

# 查看频率分析
freq = analysis["frequency"]
print(f"红球热门号码: {freq['红球']['hot_numbers']}")
print(f"蓝球热门号码: {freq['蓝球']['hot_numbers']}")
```

### 保存和加载

```python
# 保存结果
filepath = engine.save(result, "simulation_001")
print(f"结果已保存到: {filepath}")

# 加载结果
loaded_data = engine.load(filepath)
```

## 📚 API 文档

### 核心类

#### `LotteryEngine`

彩票模拟器引擎主类。

**构造函数**

```python
LotteryEngine(
    config: Union[str, LotteryConfig, Dict],  # 彩票配置
    generator_name: str = "default",          # 号码生成器名称
    calculator_name: str = "default",         # 奖金计算器名称
    simulator_name: str = "default",          # 投注模拟器名称
    analyzer_name: str = "default",           # 数据分析器名称
    storage_name: str = "default",            # 数据存储器名称
    storage_dir: str = "data"                 # 存储目录
)
```

**主要方法**

- `generate_numbers(**kwargs)` - 生成开奖号码
- `generate_bet(bet_type="single", **kwargs)` - 生成投注号码
- `calculate_prize(winning_numbers, bet_numbers, pool_amount, total_sales, total_bets)` - 计算奖金
- `simulate(num_rounds, initial_pool, initial_capital, strategy=None)` - 执行模拟
- `analyze(data, analysis_types=None)` - 分析数据
- `save(data, filename, format="json")` - 保存数据
- `load(filename)` - 加载数据
- `export(data, format="json")` - 导出数据

### 快捷函数

- `create_engine(config, **kwargs)` - 创建引擎
- `load_preset_config(preset_id)` - 加载预设配置
- `list_presets()` - 列出所有预设

### 配置类

#### `LotteryConfig`

彩票配置数据类。

**属性**

- `id: str` - 彩票ID
- `name: str` - 彩票名称
- `full_name: Optional[str]` - 完整名称
- `category: str` - 彩票类别
- `issue_interval: str` - 开奖周期
- `price_per_bet: float` - 单注价格
- `currency: str` - 货币
- `zones: List[NumberZone]` - 号码区域列表
- `prizes: List[PrizeTier]` - 奖级列表
- `pool_tiers: Optional[List[Dict]]` - 奖池分档
- `guarantee_rules: Optional[List[Dict]]` - 保底规则
- `can_add_on: bool` - 支持追加投注
- `add_on_price: float` - 追加单价
- `has_special_number: bool` - 有特别号码
- `has_reverse_prize: bool` - 有倒置规则

#### `NumberZone`

号码区域配置。

**属性**

- `name: str` - 区域名称
- `min_value: int` - 最小号码
- `max_value: int` - 最大号码
- `count: int` - 选取数量
- `repeatable: bool` - 允许重复
- `sorted: bool` - 排序
- `allow_extra: bool` - 支持复式
- `allow_dan_tuo: bool` - 支持胆拖

#### `PrizeTier`

奖级配置。

**属性**

- `level: int` - 奖级
- `name: str` - 奖级名称
- `match_pattern: List[List[int]]` - 中奖条件
- `fixed: bool` - 固定奖金
- `amount: Optional[float]` - 固定金额
- `pool_ratio: Optional[float]` - 奖池占比
- `max_per_ticket: Optional[float]` - 单注封顶
- `max_total: Optional[float]` - 总奖金封顶

### 组件工厂

#### `ComponentFactory`

组件工厂，用于创建各种组件。

**方法**

- `register_generator(name, generator_class)` - 注册号码生成器
- `register_calculator(name, calculator_class)` - 注册奖金计算器
- `register_simulator(name, simulator_class)` - 注册投注模拟器
- `register_analyzer(name, analyzer_class)` - 注册数据分析器
- `register_storage(name, storage_class)` - 注册数据存储器
- `create_generator(name="default")` - 创建号码生成器
- `create_calculator(name="default")` - 创建奖金计算器
- `create_simulator(name="default")` - 创建投注模拟器
- `create_analyzer(name="default")` - 创建数据分析器
- `create_storage(name="default")` - 创建数据存储器

## 🔧 配置文件格式

### 基本结构

```json
{
  "id": "my_lottery",
  "name": "我的彩票",
  "fullName": "我的自定义彩票",
  "category": "乐透型",
  "issueInterval": "weekly",
  "pricePerBet": 2,
  "currency": "CNY",
  
  "zones": [
    {
      "name": "前区",
      "min": 1,
      "max": 35,
      "count": 5,
      "repeatable": false,
      "sorted": true,
      "allowExtra": true,
      "maxExtra": 20,
      "allowDanTuo": true
    },
    {
      "name": "后区",
      "min": 1,
      "max": 12,
      "count": 2,
      "repeatable": false,
      "sorted": true,
      "allowExtra": true,
      "maxExtra": 12,
      "allowDanTuo": true
    }
  ],
  
  "prizes": [
    {
      "level": 1,
      "name": "一等奖",
      "matchPattern": [[5, 2]],
      "fixed": false,
      "poolRatio": 0.75,
      "maxPerTicket": 5000000
    },
    {
      "level": 2,
      "name": "二等奖",
      "matchPattern": [[5, 1]],
      "fixed": true,
      "amount": 5000
    }
  ],
  
  "poolTiers": [
    {
      "min": 0,
      "max": 100000000,
      "firstPrizeRatio": 0.75,
      "secondPrizeRatio": 0.25
    },
    {
      "min": 100000000,
      "max": null,
      "firstPrizeRatio": 0.75,
      "secondPrizeRatio": 0.25,
      "secondPartRatio": 0.25
    }
  ],
  
  "guaranteeRules": [
    {
      "level": 2,
      "condition": "amount < 6000",
      "amount": 6000,
      "description": "二等奖保底6000元"
    }
  ],
  
  "canAddOn": false,
  "addOnPrice": 1,
  "hasSpecialNumber": false,
  "hasReversePrize": false,
  
  "betType": {
    "singleRatio": 0.60,
    "complexRatio": 0.30,
    "danTuoRatio": 0.10
  },
  
  "multiplier": {
    "ratio1x": 0.75,
    "ratio2_5x": 0.20,
    "ratio6_20x": 0.045,
    "ratio20xPlus": 0.005,
    "maxMultiplier": 100
  }
}
```

## 🎮 使用示例

### 示例1：自定义彩票

```python
from src.core.main import LotteryEngine

# 自定义配置
config = {
    "id": "my_lottery",
    "name": "我的彩票",
    "pricePerBet": 2,
    "zones": [
        {"name": "前区", "min": 1, "max": 40, "count": 6},
        {"name": "后区", "min": 1, "max": 10, "count": 1}
    ],
    "prizes": [
        {"level": 1, "name": "一等奖", "matchPattern": [[6, 1]], "fixed": True, "amount": 1000000}
    ]
}

# 创建引擎
engine = LotteryEngine(config)

# 执行模拟
result = engine.simulate(num_rounds=10000)
print(f"模拟完成: {result['summary']}")
```

### 示例2：策略模拟

```python
# 使用热门号码策略
strategy = {
    "name": "hot_numbers",
    "params": {
        "hot_numbers": {
            "红球": [1, 2, 3, 4, 5, 6],
            "蓝球": [1]
        }
    }
}

result = engine.simulate(
    num_rounds=1000,
    strategy=strategy
)
```

### 示例3：数据分析

```python
# 执行模拟
result = engine.simulate(num_rounds=10000)

# 全面分析
analysis = engine.analyze(
    result,
    analysis_types=["frequency", "missing", "trend", "combination", "consecutive"]
)

# 查看结果
print("频率分析:")
for zone, data in analysis["frequency"].items():
    print(f"  {zone}: 热门号码 {data['hot_numbers']}")

print("\n遗漏分析:")
for zone, data in analysis["missing"].items():
    print(f"  {zone}: 最大遗漏 {data['max_missing']}")
```

### 示例4：导出数据

```python
# 导出为JSON
json_data = engine.export(result, "json")

# 导出为CSV
csv_data = engine.export(result, "csv")

# 保存到文件
with open("result.json", "w", encoding="utf-8") as f:
    f.write(json_data)
```

## 🔌 扩展开发

### 自定义号码生成器

```python
from src.core.base import BaseNumberGenerator, ComponentFactory

class MyGenerator(BaseNumberGenerator):
    def generate(self, config):
        # 自定义生成逻辑
        numbers = {}
        for zone in config.zones:
            # 你的算法
            numbers[zone.name] = [1, 2, 3, 4, 5]
        return numbers
    
    def generate_bet(self, config, bet_type="single"):
        return self.generate(config)

# 注册自定义生成器
ComponentFactory.register_generator("my_generator", MyGenerator)

# 使用
engine = LotteryEngine("ssq", generator_name="my_generator")
```

### 自定义奖金计算器

```python
from src.core.base import BasePrizeCalculator, ComponentFactory

class MyCalculator(BasePrizeCalculator):
    def calculate_prize(self, config, winning_numbers, bet_numbers, pool_amount, total_sales, total_bets):
        # 自定义计算逻辑
        return {"win": True, "prize_amount": 1000}
    
    def match_numbers(self, config, winning_numbers, bet_numbers):
        # 自定义匹配逻辑
        return {"红球": 5, "蓝球": 1}

# 注册自定义计算器
ComponentFactory.register_calculator("my_calculator", MyCalculator)
```

### 自定义分析器

```python
from src.core.base import BaseDataAnalyzer, ComponentFactory

class MyAnalyzer(BaseDataAnalyzer):
    def analyze_frequency(self, data, config):
        # 自定义分析逻辑
        return {"frequency": {}}
    
    def analyze_missing(self, data, config):
        return {"missing": {}}
    
    def analyze_trend(self, data, config):
        return {"trend": {}}

# 注册自定义分析器
ComponentFactory.register_analyzer("my_analyzer", MyAnalyzer)
```

## 📊 性能指标

- **模拟速度**: 120,000+ 轮/秒
- **号码生成**: 370,000+ 次/秒
- **奖金计算**: 480,000+ 次/秒
- **内存使用**: 模拟100,000轮约增加10MB

## 🧪 测试

```bash
# 运行单元测试
python -m pytest tests/test_core.py -v

# 运行集成测试
python tests/integration_test.py

# 运行性能测试
python tests/performance_test.py

# 运行奖金计算测试
python tests/test_prize_calculation.py
```

## 📁 项目结构

```
v3.0/
├── src/
│   └── core/
│       ├── base.py          # 核心接口和抽象层
│       ├── generators.py    # 号码生成器
│       ├── calculators.py   # 奖金计算器
│       ├── simulators.py    # 投注模拟器
│       ├── analyzers.py     # 数据分析器
│       ├── storages.py      # 数据存储器
│       └── main.py          # 主模块（统一API）
├── ui/
│   ├── html/                # HTML页面
│   ├── css/                 # CSS样式
│   └── js/                  # JavaScript逻辑
├── data/
│   ├── presets/             # 预设配置
│   └── user/                # 用户配置
├── tests/                   # 测试文件
├── index.html               # 主页
└── README.md                # 本文档
```

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 许可证

MIT License