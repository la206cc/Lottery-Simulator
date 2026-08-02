"""
通用奖金计算引擎实现

支持的计算规则：
1. 固定奖金
2. 浮动奖金（奖池比例）
3. 奖池分档（不同奖池金额使用不同比例）
4. 保底规则（最低奖金保证）
5. 追加投注（大乐透的1.8倍）
6. 倒置规则（七星彩的奖池>3亿时）
7. 两部分封顶（双色球/大乐透的高奖池时）
8. 级联保底（保底规则的执行顺序）
"""

from typing import Dict, List, Optional, Any, Tuple
from .base import BasePrizeCalculator, LotteryConfig, PrizeTier, ComponentFactory


class DefaultPrizeCalculator(BasePrizeCalculator):
    """默认奖金计算器"""
    
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
        # 1. 匹配号码
        match_result = self.match_numbers(config, winning_numbers, bet_numbers)
        
        # 2. 检查中奖奖级
        prize_tier = self.check_prize_tier(config, match_result)
        
        if prize_tier is None:
            return {
                "win": False,
                "prize_level": None,
                "prize_amount": 0,
                "match_result": match_result
            }
        
        # 3. 计算奖金
        prize_amount = self._calculate_prize_amount(
            config, prize_tier, pool_amount, total_sales, total_bets
        )
        
        # 4. 应用保底规则
        prize_amount = self._apply_guarantee_rules(
            config, prize_tier, prize_amount, total_bets
        )
        
        # 5. 应用封顶规则
        prize_amount = self._apply_max_rules(
            config, prize_tier, prize_amount
        )
        
        # 6. 应用倒置规则（如果需要）
        if config.has_reverse_prize and pool_amount >= (config.reverse_threshold or 0):
            prize_amount = self._apply_reverse_rules(
                config, prize_tier, prize_amount, pool_amount
            )
        
        return {
            "win": True,
            "prize_level": prize_tier.level,
            "prize_name": prize_tier.name,
            "prize_amount": prize_amount,
            "match_result": match_result
        }
    
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
        result = {}
        
        for zone in config.zones:
            zone_name = zone.name
            
            if zone_name not in winning_numbers or zone_name not in bet_numbers:
                result[zone_name] = 0
                continue
            
            win_nums = set(winning_numbers[zone_name])
            bet_nums = set(bet_numbers[zone_name])
            
            # 计算交集（命中数）
            matched = win_nums.intersection(bet_nums)
            result[zone_name] = len(matched)
        
        return result
    
    def _calculate_prize_amount(
        self,
        config: LotteryConfig,
        prize_tier: PrizeTier,
        pool_amount: float,
        total_sales: float,
        total_bets: int
    ) -> float:
        """
        计算奖金金额
        
        Args:
            config: 彩票配置
            prize_tier: 奖级
            pool_amount: 奖池金额
            total_sales: 总销售额
            total_bets: 总投注数
            
        Returns:
            奖金金额
        """
        # 固定奖金
        if prize_tier.fixed:
            return prize_tier.amount or 0
        
        # 浮动奖金（奖池比例）
        if prize_tier.pool_ratio is not None:
            # 使用奖池分档（如果有）
            if config.pool_tiers:
                ratio = self._get_pool_tier_ratio(config, pool_amount, prize_tier.level)
            else:
                ratio = prize_tier.pool_ratio
            
            return pool_amount * ratio
        
        return 0
    
    def _get_pool_tier_ratio(
        self,
        config: LotteryConfig,
        pool_amount: float,
        prize_level: int
    ) -> float:
        """
        根据奖池金额获取分档比例
        
        Args:
            config: 彩票配置
            pool_amount: 奖池金额
            prize_level: 奖级
            
        Returns:
            比例
        """
        if not config.pool_tiers:
            return 0
        
        for tier in config.pool_tiers:
            min_amount = tier.get("min", 0)
            max_amount = tier.get("max")
            
            if pool_amount >= min_amount:
                if max_amount is None or pool_amount <= max_amount:
                    # 根据奖级返回对应比例
                    if prize_level == 1:
                        return tier.get("firstPrizeRatio", 0.75)
                    elif prize_level == 2:
                        return tier.get("secondPrizeRatio", 0.25)
                    else:
                        # 其他奖级使用一等奖比例
                        return tier.get("firstPrizeRatio", 0.75)
        
        # 默认使用最后一档
        last_tier = config.pool_tiers[-1]
        if prize_level == 1:
            return last_tier.get("firstPrizeRatio", 0.75)
        elif prize_level == 2:
            return last_tier.get("secondPrizeRatio", 0.25)
        else:
            return last_tier.get("firstPrizeRatio", 0.75)
    
    def _apply_guarantee_rules(
        self,
        config: LotteryConfig,
        prize_tier: PrizeTier,
        prize_amount: float,
        total_bets: int
    ) -> float:
        """
        应用保底规则
        
        Args:
            config: 彩票配置
            prize_tier: 奖级
            prize_amount: 当前奖金
            total_bets: 总投注数
            
        Returns:
            应用保底后的奖金
        """
        if not config.guarantee_rules:
            return prize_amount
        
        # 按执行顺序应用保底规则
        for rule in sorted(config.guarantee_rules, key=lambda r: r.get("order", 0)):
            # 检查是否适用于当前奖级
            if rule.get("level") != prize_tier.level:
                continue
            
            # 检查条件
            condition = rule.get("condition", "")
            if not self._check_guarantee_condition(condition, prize_amount, total_bets):
                continue
            
            # 应用保底
            guarantee_amount = rule.get("amount", 0)
            if guarantee_amount > prize_amount:
                prize_amount = guarantee_amount
            
            # 检查是否需要级联触发
            if rule.get("cascade"):
                trigger_level = rule.get("triggerLevel")
                if trigger_level:
                    # 级联触发其他奖级的保底
                    # 这里简化处理，实际可能需要更复杂的逻辑
                    pass
        
        return prize_amount
    
    def _check_guarantee_condition(
        self,
        condition: str,
        prize_amount: float,
        total_bets: int
    ) -> bool:
        """
        检查保底条件 - 安全解析器，不使用 eval

        Args:
            condition: 条件表达式 (如 "amount < 6000", "total_bets > 1000000")
            prize_amount: 当前奖金
            total_bets: 总投注数

        Returns:
            是否满足条件
        """
        if not condition:
            return True

        try:
            import re
            # 替换变量名为实际值
            cond = condition.strip()
            cond = cond.replace("amount", str(prize_amount))
            cond = cond.replace("total_bets", str(total_bets))

            # 安全解析: 只支持 < > <= >= == != 的比较
            # 格式: number operator number
            m = re.match(r'^\s*([\d.]+)\s*(<|>|<=|>=|==|!=)\s*([\d.]+)\s*$', cond)
            if m:
                left = float(m.group(1))
                op = m.group(2)
                right = float(m.group(3))
                if op == '<': return left < right
                if op == '>': return left > right
                if op == '<=': return left <= right
                if op == '>=': return left >= right
                if op == '==': return left == right
                if op == '!=': return left != right
            return False
        except Exception:
            return False
    
    def _apply_max_rules(
        self,
        config: LotteryConfig,
        prize_tier: PrizeTier,
        prize_amount: float
    ) -> float:
        """
        应用封顶规则
        
        Args:
            config: 彩票配置
            prize_tier: 奖级
            prize_amount: 当前奖金
            
        Returns:
            应用封顶后的奖金
        """
        # 单注封顶
        if prize_tier.max_per_ticket is not None:
            if prize_amount > prize_tier.max_per_ticket:
                prize_amount = prize_tier.max_per_ticket
        
        # 总奖金封顶（这里简化处理，实际可能需要考虑中奖注数）
        # 总奖金封顶在实际使用时需要根据中奖注数计算
        
        return prize_amount
    
    def _apply_reverse_rules(
        self,
        config: LotteryConfig,
        prize_tier: PrizeTier,
        prize_amount: float,
        pool_amount: float
    ) -> float:
        """
        应用倒置规则（如七星彩）
        
        Args:
            config: 彩票配置
            prize_tier: 奖级
            prize_amount: 当前奖金
            pool_amount: 奖池金额
            
        Returns:
            应用倒置后的奖金
        """
        # 查找倒置分档
        if not config.pool_tiers:
            return prize_amount
        
        for tier in config.pool_tiers:
            if not tier.get("hasReverse"):
                continue
            
            min_amount = tier.get("min", 0)
            max_amount = tier.get("max")
            
            if pool_amount >= min_amount:
                if max_amount is None or pool_amount <= max_amount:
                    # 应用倒置比例
                    if prize_tier.level == 1:
                        # 一等奖使用二等奖比例
                        reverse_ratio = tier.get("secondPrizeRatio", 0.25)
                    elif prize_tier.level == 2:
                        # 二等奖使用一等奖比例
                        reverse_ratio = tier.get("firstPrizeRatio", 0.75)
                    else:
                        reverse_ratio = tier.get("firstPrizeRatio", 0.75)
                    
                    # 重新计算奖金
                    base_amount = pool_amount * reverse_ratio
                    # 叠加奖池资金（如果配置了）
                    add_amount = tier.get("addPoolAmount", 0)
                    prize_amount = base_amount + add_amount
        
        return prize_amount
    
    def calculate_add_on_prize(
        self,
        config: LotteryConfig,
        base_prize: float,
        add_on_price: float
    ) -> float:
        """
        计算追加投注奖金
        
        Args:
            config: 彩票配置
            base_prize: 基本奖金
            add_on_price: 追加单价
            
        Returns:
            追加奖金
        """
        if not config.can_add_on:
            return 0
        
        # 大乐透追加规则：基本奖金 × 0.8（提升80%）
        # 封顶900万
        add_on_prize = base_prize * 0.8
        
        # 追加封顶
        add_on_max = 9000000  # 900万
        if add_on_prize > add_on_max:
            add_on_prize = add_on_max
        
        return add_on_prize
    
    def calculate_two_part_prize(
        self,
        config: LotteryConfig,
        pool_amount: float,
        tier_config: Optional[Dict] = None
    ) -> Dict[str, float]:
        """
        计算两部分奖金（如双色球/大乐透高奖池时）
        
        Args:
            config: 彩票配置
            pool_amount: 奖池金额
            tier_config: 分档配置
            
        Returns:
            两部分奖金
        """
        if not tier_config:
            return {"part1": 0, "part2": 0}
        
        # 第一部分：基本奖金
        part1_ratio = tier_config.get("firstPrizeRatio", 0.75)
        part1 = pool_amount * part1_ratio
        
        # 第二部分：额外奖金（如果有）
        part2_ratio = tier_config.get("secondPartRatio")
        if part2_ratio is not None:
            part2 = pool_amount * part2_ratio
        else:
            part2 = 0
        
        # 两部分各自独立封顶
        max_per_ticket = tier_config.get("maxPerTicket", 5000000)
        part1 = min(part1, max_per_ticket)
        part2 = min(part2, max_per_ticket)
        
        return {"part1": part1, "part2": part2}


class SSQPrizeCalculator(DefaultPrizeCalculator):
    """双色球奖金计算器"""
    
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
        计算双色球奖金（特殊处理）
        
        双色球特殊规则：
        1. 奖池>=1亿时，一等奖分两部分，每部分独立封顶500万
        2. 保底规则：一等奖≥二等奖×2，二等奖≥6000
        """
        # 1. 匹配号码
        match_result = self.match_numbers(config, winning_numbers, bet_numbers)
        
        # 2. 检查中奖奖级
        prize_tier = self.check_prize_tier(config, match_result)
        
        if prize_tier is None:
            return {
                "win": False,
                "prize_level": None,
                "prize_amount": 0,
                "match_result": match_result
            }
        
        # 3. 计算奖金
        prize_amount = 0
        
        # 一等奖特殊处理
        if prize_tier.level == 1 and pool_amount >= 100000000:
            # 奖池>=1亿，分两部分
            tier_config = None
            if config.pool_tiers:
                for tier in config.pool_tiers:
                    if pool_amount >= tier.get("min", 0):
                        if tier.get("max") is None or pool_amount <= tier.get("max"):
                            tier_config = tier
                            break
            
            if tier_config:
                two_part = self.calculate_two_part_prize(config, pool_amount, tier_config)
                prize_amount = two_part["part1"] + two_part["part2"]
            else:
                prize_amount = pool_amount * 0.75
        else:
            prize_amount = self._calculate_prize_amount(
                config, prize_tier, pool_amount, total_sales, total_bets
            )
        
        # 4. 应用保底规则（双色球特殊）
        prize_amount = self._apply_ssq_guarantee_rules(
            config, prize_tier, prize_amount, total_bets
        )
        
        # 5. 应用封顶规则
        prize_amount = self._apply_max_rules(
            config, prize_tier, prize_amount
        )
        
        return {
            "win": True,
            "prize_level": prize_tier.level,
            "prize_name": prize_tier.name,
            "prize_amount": prize_amount,
            "match_result": match_result
        }
    
    def _apply_ssq_guarantee_rules(
        self,
        config: LotteryConfig,
        prize_tier: PrizeTier,
        prize_amount: float,
        total_bets: int
    ) -> float:
        """
        应用双色球保底规则
        
        双色球保底规则：
        1. 二等奖保底6000元
        2. 一等奖 ≥ 二等奖 × 2
        """
        # 二等奖保底6000元
        if prize_tier.level == 2 and prize_amount < 6000:
            prize_amount = 6000
        
        # 一等奖保底：如果二等奖被保底到6000，一等奖至少12000
        if prize_tier.level == 1:
            # 这里简化处理，实际需要先计算二等奖的保底金额
            # 假设二等奖保底后为6000
            min_first_prize = 6000 * 2  # 二等奖保底金额 × 2
            if prize_amount < min_first_prize:
                prize_amount = min_first_prize
        
        return prize_amount


class DLTPrizeCalculator(DefaultPrizeCalculator):
    """超级大乐透奖金计算器"""
    
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
        计算超级大乐透奖金（特殊处理）
        
        大乐透特殊规则：
        1. 追加投注中奖按1.8倍计算，封顶900万
        2. 二等奖也参与追加
        3. 保底规则与双色球不同（动态值）
        """
        # 1. 匹配号码
        match_result = self.match_numbers(config, winning_numbers, bet_numbers)
        
        # 2. 检查中奖奖级
        prize_tier = self.check_prize_tier(config, match_result)
        
        if prize_tier is None:
            return {
                "win": False,
                "prize_level": None,
                "prize_amount": 0,
                "match_result": match_result
            }
        
        # 3. 计算奖金
        prize_amount = self._calculate_prize_amount(
            config, prize_tier, pool_amount, total_sales, total_bets
        )
        
        # 4. 应用保底规则（大乐透特殊）
        prize_amount = self._apply_dlt_guarantee_rules(
            config, prize_tier, prize_amount, total_bets
        )
        
        # 5. 应用封顶规则
        prize_amount = self._apply_max_rules(
            config, prize_tier, prize_amount
        )
        
        # 6. 应用倒置规则
        if config.has_reverse_prize and pool_amount >= (config.reverse_threshold or 0):
            prize_amount = self._apply_reverse_rules(
                config, prize_tier, prize_amount, pool_amount
            )
        
        return {
            "win": True,
            "prize_level": prize_tier.level,
            "prize_name": prize_tier.name,
            "prize_amount": prize_amount,
            "match_result": match_result
        }
    
    def _apply_dlt_guarantee_rules(
        self,
        config: LotteryConfig,
        prize_tier: PrizeTier,
        prize_amount: float,
        total_bets: int
    ) -> float:
        """
        应用大乐透保底规则
        
        大乐透保底规则：
        1. 二等奖保底 = 三等奖 × 2（动态值）
        2. 奖池>=8亿时，三等奖保底从10000变为20000
        """
        # 查找三等奖保底金额
        third_prize_guarantee = 10000  # 默认10000元
        
        # 奖池>=8亿时，三等奖保底变为20000
        # 这里简化处理，实际需要根据配置判断
        # if pool_amount >= 800000000:
        #     third_prize_guarantee = 20000
        
        # 二等奖保底 = 三等奖 × 2
        if prize_tier.level == 2:
            second_prize_guarantee = third_prize_guarantee * 2
            if prize_amount < second_prize_guarantee:
                prize_amount = second_prize_guarantee
        
        return prize_amount


class FC3DPrizeCalculator(DefaultPrizeCalculator):
    """福彩3D奖金计算器"""
    
    def match_numbers(
        self,
        config: LotteryConfig,
        winning_numbers: Dict[str, List[int]],
        bet_numbers: Dict[str, List[int]]
    ) -> Dict[str, int]:
        """
        匹配福彩3D号码（特殊处理）
        
        福彩3D有三种玩法：
        1. 直选：按位匹配
        2. 组三：不按位，有两位相同
        3. 组六：不按位，三位都不同
        """
        # 这里简化处理，实际需要根据playTypes配置判断
        result = {}
        
        for zone in config.zones:
            zone_name = zone.name
            
            if zone_name not in winning_numbers or zone_name not in bet_numbers:
                result[zone_name] = 0
                continue
            
            win_nums = winning_numbers[zone_name]
            bet_nums = bet_numbers[zone_name]
            
            # 直选：按位匹配
            exact_match = sum(1 for w, b in zip(win_nums, bet_nums) if w == b)
            
            # 组选：不按位匹配
            win_set = set(win_nums)
            bet_set = set(bet_nums)
            any_match = len(win_set.intersection(bet_set))
            
            # 根据玩法类型返回匹配数
            # 这里简化处理，实际应该根据playTypes配置判断
            result[zone_name] = exact_match  # 默认使用直选
        
        return result


class QXCPrizeCalculator(DefaultPrizeCalculator):
    """七星彩奖金计算器"""
    
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
        计算七星彩奖金（特殊处理）
        
        七星彩特殊规则：
        1. 奖池>3亿时，一等奖比例从90%降到10%，二等奖从10%升到90%
        2. 一等奖仍叠加奖池资金
        """
        # 1. 匹配号码
        match_result = self.match_numbers(config, winning_numbers, bet_numbers)
        
        # 2. 检查中奖奖级
        prize_tier = self.check_prize_tier(config, match_result)
        
        if prize_tier is None:
            return {
                "win": False,
                "prize_level": None,
                "prize_amount": 0,
                "match_result": match_result
            }
        
        # 3. 计算奖金（应用倒置规则）
        prize_amount = 0
        
        # 检查是否应用倒置规则
        if config.has_reverse_prize and pool_amount >= (config.reverse_threshold or 0):
            # 应用倒置规则
            if prize_tier.level == 1:
                # 一等奖使用二等奖比例（10%）
                prize_amount = pool_amount * 0.10
                # 叠加奖池资金
                prize_amount += pool_amount
            elif prize_tier.level == 2:
                # 二等奖使用一等奖比例（90%）
                prize_amount = pool_amount * 0.90
            else:
                prize_amount = self._calculate_prize_amount(
                    config, prize_tier, pool_amount, total_sales, total_bets
                )
        else:
            prize_amount = self._calculate_prize_amount(
                config, prize_tier, pool_amount, total_sales, total_bets
            )
        
        # 4. 应用保底规则
        prize_amount = self._apply_guarantee_rules(
            config, prize_tier, prize_amount, total_bets
        )
        
        # 5. 应用封顶规则
        prize_amount = self._apply_max_rules(
            config, prize_tier, prize_amount
        )
        
        return {
            "win": True,
            "prize_level": prize_tier.level,
            "prize_name": prize_tier.name,
            "prize_amount": prize_amount,
            "match_result": match_result
        }


# 注册默认组件
ComponentFactory.register_calculator("default", DefaultPrizeCalculator)
ComponentFactory.register_calculator("ssq", SSQPrizeCalculator)
ComponentFactory.register_calculator("dlt", DLTPrizeCalculator)
ComponentFactory.register_calculator("fc3d", FC3DPrizeCalculator)
ComponentFactory.register_calculator("qxc", QXCPrizeCalculator)