# -*- coding: utf-8 -*-
"""
彩票配置验证器
验证用户输入的配置是否符合Schema定义
"""
import json
import os
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass


@dataclass
class ValidationError:
    """验证错误信息"""
    path: str          # 错误路径
    message: str       # 错误信息
    severity: str      # 严重程度：error, warning
    code: str          # 错误代码


class LotteryConfigValidator:
    """彩票配置验证器"""
    
    def __init__(self):
        self.schema = self._load_schema()
        self.errors: List[ValidationError] = []
    
    def _load_schema(self) -> Dict:
        """加载JSON Schema"""
        schema_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'data', 'lottery_schema.json'
        )
        try:
            with open(schema_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # 如果找不到schema文件，返回空字典
            return {}
    
    def validate(self, config: Dict) -> Tuple[bool, List[ValidationError]]:
        """
        验证配置是否合法
        
        Args:
            config: 彩票配置字典
            
        Returns:
            (是否合法, 错误列表)
        """
        self.errors = []
        
        # 基础字段验证
        self._validate_required_fields(config)
        self._validate_id(config)
        self._validate_name(config)
        self._validate_price(config)
        self._validate_zones(config)
        self._validate_prizes(config)
        self._validate_pool_tiers(config)
        self._validate_guarantee_rules(config)
        self._validate_bet_type(config)
        self._validate_multiplier(config)
        self._validate_user_behavior(config)
        
        # 业务逻辑验证
        self._validate_prize_levels(config)
        self._validate_match_patterns(config)
        self._validate_pool_tiers_logic(config)
        self._validate_guarantee_cascade(config)
        
        return len(self.errors) == 0, self.errors
    
    def _add_error(self, path: str, message: str, code: str = "INVALID", severity: str = "error"):
        """添加验证错误"""
        self.errors.append(ValidationError(
            path=path,
            message=message,
            severity=severity,
            code=code
        ))
    
    def _validate_required_fields(self, config: Dict):
        """验证必填字段"""
        required_fields = ['id', 'name', 'pricePerBet', 'zones', 'prizes']
        for field in required_fields:
            if field not in config:
                self._add_error(
                    path=f"$.{field}",
                    message=f"缺少必填字段: {field}",
                    code="REQUIRED_FIELD_MISSING"
                )
    
    def _validate_id(self, config: Dict):
        """验证ID格式"""
        if 'id' in config:
            lottery_id = config['id']
            if not isinstance(lottery_id, str):
                self._add_error("$.id", "ID必须是字符串", "INVALID_TYPE")
            elif len(lottery_id) == 0:
                self._add_error("$.id", "ID不能为空", "EMPTY_VALUE")
            elif len(lottery_id) > 32:
                self._add_error("$.id", "ID长度不能超过32个字符", "TOO_LONG")
            elif not lottery_id.isalnum() and '_' not in lottery_id:
                self._add_error("$.id", "ID只能包含字母、数字和下划线", "INVALID_FORMAT")
    
    def _validate_name(self, config: Dict):
        """验证名称"""
        if 'name' in config:
            name = config['name']
            if not isinstance(name, str):
                self._add_error("$.name", "名称必须是字符串", "INVALID_TYPE")
            elif len(name) == 0:
                self._add_error("$.name", "名称不能为空", "EMPTY_VALUE")
            elif len(name) > 50:
                self._add_error("$.name", "名称长度不能超过50个字符", "TOO_LONG")
    
    def _validate_price(self, config: Dict):
        """验证价格"""
        if 'pricePerBet' in config:
            price = config['pricePerBet']
            if not isinstance(price, (int, float)):
                self._add_error("$.pricePerBet", "价格必须是数字", "INVALID_TYPE")
            elif price <= 0:
                self._add_error("$.pricePerBet", "价格必须大于0", "INVALID_VALUE")
            elif price > 10000:
                self._add_error("$.pricePerBet", "价格不能超过10000元", "TOO_LARGE", "warning")
    
    def _validate_zones(self, config: Dict):
        """验证号码区域配置"""
        if 'zones' not in config:
            return
        
        zones = config['zones']
        if not isinstance(zones, list):
            self._add_error("$.zones", "zones必须是数组", "INVALID_TYPE")
            return
        
        if len(zones) == 0:
            self._add_error("$.zones", "至少需要一个号码区域", "EMPTY_ARRAY")
            return
        
        if len(zones) > 5:
            self._add_error("$.zones", "最多支持5个号码区域", "TOO_MANY")
            return
        
        for i, zone in enumerate(zones):
            self._validate_zone(zone, i)
    
    def _validate_zone(self, zone: Dict, index: int):
        """验证单个号码区域"""
        path = f"$.zones[{index}]"
        
        # 必填字段
        required = ['name', 'min', 'max', 'count']
        for field in required:
            if field not in zone:
                self._add_error(f"{path}.{field}", f"缺少必填字段: {field}", "REQUIRED_FIELD_MISSING")
        
        # 名称
        if 'name' in zone:
            if not isinstance(zone['name'], str) or len(zone['name']) == 0:
                self._add_error(f"{path}.name", "区域名称不能为空", "EMPTY_VALUE")
        
        # min/max
        if 'min' in zone and 'max' in zone:
            if not isinstance(zone['min'], int) or not isinstance(zone['max'], int):
                self._add_error(f"{path}.min/max", "min和max必须是整数", "INVALID_TYPE")
            elif zone['min'] >= zone['max']:
                self._add_error(f"{path}.min/max", "min必须小于max", "INVALID_RANGE")
        
        # count
        if 'count' in zone:
            if not isinstance(zone['count'], int) or zone['count'] <= 0:
                self._add_error(f"{path}.count", "count必须是正整数", "INVALID_VALUE")
            elif 'min' in zone and 'max' in zone:
                if zone['count'] > (zone['max'] - zone['min'] + 1):
                    self._add_error(
                        f"{path}.count", 
                        "count不能大于号码范围", 
                        "COUNT_EXCEEDS_RANGE"
                    )
        
        # maxExtra
        if 'maxExtra' in zone and 'count' in zone:
            if isinstance(zone['maxExtra'], int) and zone['maxExtra'] < zone.get('count', 0):
                self._add_error(f"{path}.maxExtra", "maxExtra不能小于count", "INVALID_RANGE")
    
    def _validate_prizes(self, config: Dict):
        """验证奖级配置"""
        if 'prizes' not in config:
            return
        
        prizes = config['prizes']
        if not isinstance(prizes, list):
            self._add_error("$.prizes", "prizes必须是数组", "INVALID_TYPE")
            return
        
        if len(prizes) == 0:
            self._add_error("$.prizes", "至少需要一个奖级", "EMPTY_ARRAY")
            return
        
        for i, prize in enumerate(prizes):
            self._validate_prize(prize, i)
    
    def _validate_prize(self, prize: Dict, index: int):
        """验证单个奖级"""
        path = f"$.prizes[{index}]"
        
        # 必填字段
        required = ['level', 'name', 'matchPattern', 'fixed']
        for field in required:
            if field not in prize:
                self._add_error(f"{path}.{field}", f"缺少必填字段: {field}", "REQUIRED_FIELD_MISSING")
        
        # level
        if 'level' in prize:
            if not isinstance(prize['level'], int) or prize['level'] < 0:
                self._add_error(f"{path}.level", "level必须是非负整数", "INVALID_VALUE")
        
        # fixed奖金配置
        if 'fixed' in prize:
            if prize['fixed']:
                if 'amount' not in prize:
                    self._add_error(f"{path}.amount", "固定奖必须配置amount", "REQUIRED_FIELD_MISSING")
                elif not isinstance(prize.get('amount', 0), (int, float)) or prize.get('amount', 0) <= 0:
                    self._add_error(f"{path}.amount", "固定奖金必须大于0", "INVALID_VALUE")
            else:
                if 'poolRatio' not in prize:
                    self._add_error(f"{path}.poolRatio", "浮动奖必须配置poolRatio", "REQUIRED_FIELD_MISSING")
                elif not isinstance(prize.get('poolRatio', 0), (int, float)):
                    self._add_error(f"{path}.poolRatio", "poolRatio必须是数字", "INVALID_TYPE")
                elif prize.get('poolRatio', 0) <= 0 or prize.get('poolRatio', 0) > 1:
                    self._add_error(f"{path}.poolRatio", "poolRatio必须在(0, 1]范围内", "INVALID_RANGE")
        
        # matchPattern
        if 'matchPattern' in prize:
            patterns = prize['matchPattern']
            if not isinstance(patterns, list) or len(patterns) == 0:
                self._add_error(f"{path}.matchPattern", "matchPattern不能为空", "EMPTY_ARRAY")
            else:
                for j, pattern in enumerate(patterns):
                    if not isinstance(pattern, list):
                        self._add_error(f"{path}.matchPattern[{j}]", "matchPattern的元素必须是数组", "INVALID_TYPE")
    
    def _validate_pool_tiers(self, config: Dict):
        """验证奖池分档配置"""
        if 'poolTiers' not in config:
            return
        
        tiers = config['poolTiers']
        if not isinstance(tiers, list):
            self._add_error("$.poolTiers", "poolTiers必须是数组", "INVALID_TYPE")
            return
        
        for i, tier in enumerate(tiers):
            self._validate_pool_tier(tier, i)
    
    def _validate_pool_tier(self, tier: Dict, index: int):
        """验证单个奖池分档"""
        path = f"$.poolTiers[{index}]"
        
        if 'min' not in tier:
            self._add_error(f"{path}.min", "缺少必填字段: min", "REQUIRED_FIELD_MISSING")
        
        if 'firstPrizeRatio' not in tier:
            self._add_error(f"{path}.firstPrizeRatio", "缺少必填字段: firstPrizeRatio", "REQUIRED_FIELD_MISSING")
        elif not isinstance(tier.get('firstPrizeRatio', 0), (int, float)):
            self._add_error(f"{path}.firstPrizeRatio", "firstPrizeRatio必须是数字", "INVALID_TYPE")
        elif tier.get('firstPrizeRatio', 0) <= 0 or tier.get('firstPrizeRatio', 0) > 1:
            self._add_error(f"{path}.firstPrizeRatio", "firstPrizeRatio必须在(0, 1]范围内", "INVALID_RANGE")
    
    def _validate_guarantee_rules(self, config: Dict):
        """验证保底规则配置"""
        if 'guaranteeRules' not in config:
            return
        
        rules = config['guaranteeRules']
        if not isinstance(rules, list):
            self._add_error("$.guaranteeRules", "guaranteeRules必须是数组", "INVALID_TYPE")
            return
        
        for i, rule in enumerate(rules):
            if 'level' not in rule or 'condition' not in rule:
                self._add_error(f"$.guaranteeRules[{i}]", "缺少必填字段: level和condition", "REQUIRED_FIELD_MISSING")
    
    def _validate_bet_type(self, config: Dict):
        """验证投注类型配置"""
        if 'betType' not in config:
            return
        
        bet_type = config['betType']
        if not isinstance(bet_type, dict):
            self._add_error("$.betType", "betType必须是对象", "INVALID_TYPE")
            return
        
        # 验证占比之和是否为1（允许小误差）
        ratios = ['singleRatio', 'complexRatio', 'danTuoRatio']
        total = sum(bet_type.get(r, 0) for r in ratios)
        
        if abs(total - 1.0) > 0.01:
            self._add_error(
                "$.betType", 
                f"投注类型占比之和应为1.0，当前为{total:.3f}", 
                "RATIO_SUM_INVALID",
                "warning"
            )
    
    def _validate_multiplier(self, config: Dict):
        """验证倍投配置"""
        if 'multiplier' not in config:
            return
        
        multiplier = config['multiplier']
        if not isinstance(multiplier, dict):
            self._add_error("$.multiplier", "multiplier必须是对象", "INVALID_TYPE")
            return
        
        # 验证占比之和
        ratios = ['ratio1x', 'ratio2_5x', 'ratio6_20x', 'ratio20xPlus']
        total = sum(multiplier.get(r, 0) for r in ratios)
        
        if abs(total - 1.0) > 0.01:
            self._add_error(
                "$.multiplier", 
                f"倍投占比之和应为1.0，当前为{total:.3f}", 
                "RATIO_SUM_INVALID",
                "warning"
            )
    
    def _validate_user_behavior(self, config: Dict):
        """验证用户行为配置"""
        if 'userBehavior' not in config:
            return
        
        behavior = config['userBehavior']
        if not isinstance(behavior, dict):
            self._add_error("$.userBehavior", "userBehavior必须是对象", "INVALID_TYPE")
            return
        
        # 验证频率占比
        freq_ratios = ['highFreqRatio', 'midFreqRatio', 'lowFreqRatio']
        total = sum(behavior.get(r, 0) for r in freq_ratios)
        
        if abs(total - 1.0) > 0.01:
            self._add_error(
                "$.userBehavior", 
                f"用户频率占比之和应为1.0，当前为{total:.3f}", 
                "RATIO_SUM_INVALID",
                "warning"
            )
        
        # 验证选号策略占比
        select_ratios = ['randomSelectRatio', 'birthdaySelectRatio', 'trendSelectRatio', 'fixedSelectRatio']
        total_select = sum(behavior.get(r, 0) for r in select_ratios)
        
        if abs(total_select - 1.0) > 0.01:
            self._add_error(
                "$.userBehavior", 
                f"选号策略占比之和应为1.0，当前为{total_select:.3f}", 
                "RATIO_SUM_INVALID",
                "warning"
            )
    
    def _validate_prize_levels(self, config: Dict):
        """验证奖级连续性"""
        if 'prizes' not in config:
            return
        
        prizes = config['prizes']
        levels = sorted([p['level'] for p in prizes if 'level' in p and p['level'] > 0])
        
        # 检查奖级是否从1开始连续
        if levels and levels[0] != 1:
            self._add_error("$.prizes", "奖级必须从1开始", "INVALID_LEVEL_START")
        
        # 检查是否有重复的奖级
        if len(levels) != len(set(levels)):
            self._add_error("$.prizes", "存在重复的奖级", "DUPLICATE_LEVELS")
    
    def _validate_match_patterns(self, config: Dict):
        """验证中奖条件与区域配置的一致性"""
        if 'prizes' not in config or 'zones' not in config:
            return
        
        zones = config['zones']
        zone_count = len(zones)
        
        for i, prize in enumerate(config['prizes']):
            if 'matchPattern' not in prize:
                continue
            
            for j, pattern in enumerate(prize['matchPattern']):
                if isinstance(pattern, list) and len(pattern) != zone_count:
                    self._add_error(
                        f"$.prizes[{i}].matchPattern[{j}]",
                        f"matchPattern维度({len(pattern)})与区域数量({zone_count})不匹配",
                        "PATTERN_DIMENSION_MISMATCH",
                        "warning"
                    )
    
    def _validate_pool_tiers_logic(self, config: Dict):
        """验证奖池分档逻辑"""
        if 'poolTiers' not in config or len(config['poolTiers']) < 2:
            return
        
        tiers = config['poolTiers']
        
        # 检查分档是否有重叠
        for i in range(len(tiers) - 1):
            tier1_max = tiers[i].get('max')
            tier2_min = tiers[i + 1].get('min')
            
            if tier1_max is not None and tier2_min is not None:
                if tier1_max >= tier2_min:
                    self._add_error(
                        f"$.poolTiers[{i}]和[{i+1}]",
                        "奖池分档存在重叠",
                        "TIER_OVERLAP",
                        "warning"
                    )
    
    def _validate_guarantee_cascade(self, config: Dict):
        """验证保底规则的级联关系"""
        if 'guaranteeRules' not in config:
            return
        
        rules = config['guaranteeRules']
        levels_involved = set()
        
        for rule in rules:
            level = rule.get('level')
            if level:
                if level in levels_involved:
                    self._add_error(
                        f"$.guaranteeRules",
                        f"奖级{level}存在多个保底规则，可能导致冲突",
                        "DUPLICATE_GUARANTEE_LEVEL",
                        "warning"
                    )
                levels_involved.add(level)


def validate_lottery_config(config: Dict) -> Tuple[bool, List[ValidationError]]:
    """
    便捷函数：验证彩票配置
    
    Args:
        config: 彩票配置字典
        
    Returns:
        (是否合法, 错误列表)
    """
    validator = LotteryConfigValidator()
    return validator.validate(config)


def format_validation_errors(errors: List[ValidationError]) -> str:
    """
    格式化验证错误为可读字符串
    
    Args:
        errors: 错误列表
        
    Returns:
        格式化后的错误字符串
    """
    if not errors:
        return "配置验证通过"
    
    lines = []
    for error in errors:
        prefix = "❌" if error.severity == "error" else "⚠️"
        lines.append(f"{prefix} [{error.path}] {error.message}")
    
    return "\n".join(lines)
