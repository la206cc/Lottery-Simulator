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
    def get_fixed_prize_amount(lottery_id: str, prize_level: int, current_prize_pool: int = 0) -> int:
        """获取固定奖金额"""
        config = get_lottery_config(lottery_id)
        if not config:
            return 0

        prize_config = next((p for p in config.prizes if p.level == prize_level), None)
        if not prize_config or not prize_config.fixed:
            return prize_config.amount if prize_config else 0

        # 检查奖池门槛
        if prize_config.bonus_pool_threshold and current_prize_pool < prize_config.bonus_pool_threshold:
            return 0

        # 检查高奖池金额
        if prize_config.high_pool_amount and config.pool_tiers:
            high_pool_tier = next((t for t in config.pool_tiers if t.min >= 800000000), None)
            if high_pool_tier and current_prize_pool >= high_pool_tier.min:
                return prize_config.high_pool_amount

        return prize_config.amount

    @staticmethod
    def calculate_ssq_tiered_prize(config, floating_pool: int, prize_stats: List[Dict],
                                    current_prize_pool: int, add_on_enabled: bool = False) -> Dict[int, int]:
        """双色球浮动奖金计算"""
        result = {}
        total_prize_pool = current_prize_pool + floating_pool if current_prize_pool > 0 else floating_pool

        # 确定奖池档位
        current_tier = config.pool_tiers[0] if config.pool_tiers else None
        if config.pool_tiers:
            for tier in config.pool_tiers:
                if tier.min <= total_prize_pool <= tier.max:
                    current_tier = tier
                    break

        # 一等奖
        first_prize_stat = next((s for s in prize_stats if s['level'] == 1), None)
        first_prize_config = next((p for p in config.prizes if p.level == 1), None)
        first_prize_per_ticket = 0

        if first_prize_stat and first_prize_stat['count'] > 0:
            first_prize_amount = 0

            if current_tier and current_tier.second_part_ratio is not None:
                # 高奖池两部分分配
                part1 = (int(floating_pool * current_tier.first_prize_ratio) + current_prize_pool
                         if current_tier.first_prize_ratio > 0 else current_prize_pool)
                part2 = int(floating_pool * current_tier.second_part_ratio)

                max_per_ticket = first_prize_config.max_per_ticket or 5000000
                part1_per_ticket = min(part1 // first_prize_stat['count'], max_per_ticket)
                part2_per_ticket = min(part2 // first_prize_stat['count'], max_per_ticket)

                first_prize_per_ticket = part1_per_ticket + part2_per_ticket
                first_prize_amount = first_prize_per_ticket * first_prize_stat['count']

                # 总额封顶
                if first_prize_config.max_total and first_prize_amount > first_prize_config.max_total:
                    first_prize_amount = first_prize_config.max_total
                    first_prize_per_ticket = first_prize_amount // first_prize_stat['count']
            else:
                # 单部分分配
                ratio = current_tier.first_prize_ratio if current_tier else 0.75
                first_prize_amount = int(floating_pool * ratio) + current_prize_pool

                max_per_ticket = first_prize_config.max_per_ticket or 5000000
                first_prize_per_ticket = min(first_prize_amount // first_prize_stat['count'], max_per_ticket)
                first_prize_amount = first_prize_per_ticket * first_prize_stat['count']

                if first_prize_config.max_total and first_prize_amount > first_prize_config.max_total:
                    first_prize_amount = first_prize_config.max_total
                    first_prize_per_ticket = first_prize_amount // first_prize_stat['count']

            result[1] = first_prize_amount

        # 二等奖
        second_prize_stat = next((s for s in prize_stats if s['level'] == 2), None)
        second_prize_config = next((p for p in config.prizes if p.level == 2), None)

        if second_prize_stat and second_prize_stat['count'] > 0:
            ratio = (current_tier.second_prize_ratio if current_tier and current_tier.second_prize_ratio is not None
                     else (second_prize_config.pool_ratio or 0.25))
            second_prize_amount = int(floating_pool * ratio)

            max_per_ticket = second_prize_config.max_per_ticket or 5000000
            second_prize_per_ticket = min(second_prize_amount // second_prize_stat['count'], max_per_ticket)
            second_prize_amount = second_prize_per_ticket * second_prize_stat['count']

            if second_prize_config.max_total and second_prize_amount > second_prize_config.max_total:
                second_prize_amount = second_prize_config.max_total
                second_prize_per_ticket = second_prize_amount // second_prize_stat['count']

            result[2] = second_prize_amount

            # 保底规则1：一等奖 >= 二等奖 * 2
            if first_prize_stat and first_prize_stat['count'] > 0 and first_prize_per_ticket > 0:
                if first_prize_per_ticket < second_prize_per_ticket * 2 and first_prize_per_ticket < 5000000:
                    guaranteed = min(second_prize_per_ticket * 2, 5000000)
                    guaranteed_total = guaranteed * first_prize_stat['count']
                    if first_prize_config.max_total:
                        guaranteed_total = min(guaranteed_total, first_prize_config.max_total)
                    result[1] = guaranteed_total

            # 保底规则2：二等奖 >= 6000
            if second_prize_per_ticket < 6000:
                second_prize_per_ticket = 6000
                second_prize_amount = second_prize_per_ticket * second_prize_stat['count']
                result[2] = second_prize_amount

                if first_prize_stat and first_prize_stat['count'] > 0 and first_prize_per_ticket > 0:
                    if first_prize_per_ticket < 12000:
                        first_prize_per_ticket = 12000
                        guaranteed_total = first_prize_per_ticket * first_prize_stat['count']
                        if first_prize_config.max_total:
                            guaranteed_total = min(guaranteed_total, first_prize_config.max_total)
                        result[1] = guaranteed_total

        return result

    @staticmethod
    def calculate_dlt_tiered_prize(config, floating_pool: int, prize_stats: List[Dict],
                                  current_prize_pool: int, add_on_enabled: bool = False) -> Dict[int, int]:
        """大乐透浮动奖金计算"""
        result = {}
        total_prize_pool = current_prize_pool + floating_pool if current_prize_pool > 0 else floating_pool

        # 确定奖池档位
        current_tier = config.pool_tiers[0] if config.pool_tiers else None
        if config.pool_tiers:
            for tier in config.pool_tiers:
                if tier.min <= total_prize_pool <= tier.max:
                    current_tier = tier
                    break

        # 一等奖
        first_prize_stat = next((s for s in prize_stats if s['level'] == 1), None)
        first_prize_config = next((p for p in config.prizes if p.level == 1), None)
        first_prize_per_ticket = 0

        if first_prize_stat and first_prize_stat['count'] > 0:
            first_prize_amount = 0

            if current_tier and current_tier.second_part_ratio is not None:
                # 高奖池两部分分配
                part1 = int(floating_pool * current_tier.first_prize_ratio) + current_prize_pool
                part2 = int(floating_pool * current_tier.second_part_ratio)

                max_per_ticket = first_prize_config.max_per_ticket or 5000000
                part1_per_ticket = part1 // first_prize_stat['count']
                part2_per_ticket = part2 // first_prize_stat['count']

                first_prize_per_ticket = min(part1_per_ticket + part2_per_ticket, max_per_ticket)

                # 追加投注计算
                if add_on_enabled and config.can_add_on:
                    first_prize_per_ticket = int(first_prize_per_ticket * 1.8)

                if add_on_enabled and first_prize_config.max_add_on_per_ticket:
                    first_prize_per_ticket = min(first_prize_per_ticket, first_prize_config.max_add_on_per_ticket)

                first_prize_amount = first_prize_per_ticket * first_prize_stat['count']

                if first_prize_config.max_total and first_prize_amount > first_prize_config.max_total:
                    first_prize_amount = first_prize_config.max_total
                    first_prize_per_ticket = first_prize_amount // first_prize_stat['count']
            else:
                # 单部分分配
                ratio = current_tier.first_prize_ratio if current_tier else 0.75
                first_prize_amount = int(floating_pool * ratio) + current_prize_pool

                max_per_ticket = first_prize_config.max_per_ticket or 5000000
                first_prize_per_ticket = min(first_prize_amount // first_prize_stat['count'], max_per_ticket)

                if add_on_enabled and config.can_add_on:
                    first_prize_per_ticket = int(first_prize_per_ticket * 1.8)

                if add_on_enabled and first_prize_config.max_add_on_per_ticket:
                    first_prize_per_ticket = min(first_prize_per_ticket, first_prize_config.max_add_on_per_ticket)

                first_prize_amount = first_prize_per_ticket * first_prize_stat['count']

                if first_prize_config.max_total and first_prize_amount > first_prize_config.max_total:
                    first_prize_amount = first_prize_config.max_total
                    first_prize_per_ticket = first_prize_amount // first_prize_stat['count']

            result[1] = first_prize_amount

        # 二等奖
        second_prize_stat = next((s for s in prize_stats if s['level'] == 2), None)
        second_prize_config = next((p for p in config.prizes if p.level == 2), None)

        if second_prize_stat and second_prize_stat['count'] > 0:
            ratio = (current_tier.second_prize_ratio if current_tier and current_tier.second_prize_ratio is not None
                     else (second_prize_config.pool_ratio or 0.25))
            second_prize_amount = int(floating_pool * ratio)

            max_per_ticket = second_prize_config.max_per_ticket or 5000000
            second_prize_per_ticket = min(second_prize_amount // second_prize_stat['count'], max_per_ticket)

            if add_on_enabled and config.can_add_on:
                second_prize_per_ticket = int(second_prize_per_ticket * 1.8)

            if add_on_enabled and second_prize_config.max_add_on_per_ticket:
                second_prize_per_ticket = min(second_prize_per_ticket, second_prize_config.max_add_on_per_ticket)

            second_prize_amount = second_prize_per_ticket * second_prize_stat['count']

            if second_prize_config.max_total and second_prize_amount > second_prize_config.max_total:
                second_prize_amount = second_prize_config.max_total
                second_prize_per_ticket = second_prize_amount // second_prize_stat['count']

            result[2] = second_prize_amount

            # 保底规则1：一等奖 >= 二等奖 * 2
            if first_prize_stat and first_prize_stat['count'] > 0 and first_prize_per_ticket > 0:
                if first_prize_per_ticket < second_prize_per_ticket * 2 and first_prize_per_ticket < 5000000:
                    guaranteed = min(second_prize_per_ticket * 2, 5000000)
                    guaranteed_total = guaranteed * first_prize_stat['count']
                    if first_prize_config.max_total:
                        guaranteed_total = min(guaranteed_total, first_prize_config.max_total)
                    result[1] = guaranteed_total

            # 保底规则2：二等奖 >= 三等奖 * 2
            third_prize_config = next((p for p in config.prizes if p.level == 3), None)
            third_amount = (third_prize_config.high_pool_amount if third_prize_config and third_prize_config.high_pool_amount and current_prize_pool >= 800000000
                           else (third_prize_config.amount if third_prize_config else 0))
            if second_prize_per_ticket < third_amount * 2 and second_prize_per_ticket < 5000000:
                second_prize_per_ticket = third_amount * 2
                second_prize_amount = second_prize_per_ticket * second_prize_stat['count']
                result[2] = second_prize_amount

        return result

    @staticmethod
    def calculate_tiered_prize(lottery_id: str, prize_pool: int, fixed_payout: int,
                              prize_stats: List[Dict], current_prize_pool: int = 0,
                              add_on_enabled: bool = False) -> Dict[int, int]:
        """计算浮动奖金入口函数"""
        config = get_lottery_config(lottery_id)
        if not config:
            return {}

        floating_pool = prize_pool - fixed_payout

        # 无奖池分档，使用简单计算
        if not config.pool_tiers:
            result = {}
            for stat in prize_stats:
                if stat['level'] == 0:
                    continue
                prize_config = next((p for p in config.prizes if p.level == stat['level']), None)
                if prize_config and not prize_config.fixed and stat['count'] > 0:
                    result[stat['level']] = int(floating_pool * (prize_config.pool_ratio or 0))
            return result

        # 分彩种计算
        if lottery_id == 'ssq':
            return PrizeCalculator.calculate_ssq_tiered_prize(config, floating_pool, prize_stats, current_prize_pool, add_on_enabled)
        if lottery_id == 'dlt':
            return PrizeCalculator.calculate_dlt_tiered_prize(config, floating_pool, prize_stats, current_prize_pool, add_on_enabled)

        # 其他彩种默认计算
        result = {}
        total_prize_pool = current_prize_pool + floating_pool if current_prize_pool > 0 else floating_pool

        current_tier = config.pool_tiers[0] if config.pool_tiers else None
        if config.pool_tiers:
            for tier in config.pool_tiers:
                if tier.min <= total_prize_pool <= tier.max:
                    current_tier = tier
                    break

        first_prize_stat = next((s for s in prize_stats if s['level'] == 1), None)
        first_prize_config = next((p for p in config.prizes if p.level == 1), None)

        if first_prize_stat and first_prize_stat['count'] > 0:
            ratio = current_tier.first_prize_ratio if current_tier else 0.75
            first_prize_amount = int(floating_pool * ratio) + current_prize_pool
            max_per_ticket = first_prize_config.max_per_ticket or 5000000 if first_prize_config else 5000000
            first_prize_per_ticket = min(first_prize_amount // first_prize_stat['count'], max_per_ticket)
            first_prize_amount = first_prize_per_ticket * first_prize_stat['count']
            result[1] = first_prize_amount

        second_prize_stat = next((s for s in prize_stats if s['level'] == 2), None)
        second_prize_config = next((p for p in config.prizes if p.level == 2), None)

        if second_prize_stat and second_prize_stat['count'] > 0:
            ratio = (current_tier.second_prize_ratio if current_tier and current_tier.second_prize_ratio is not None
                     else (second_prize_config.pool_ratio if second_prize_config else 0.25))
            second_prize_amount = int(floating_pool * ratio)
            max_per_ticket = second_prize_config.max_per_ticket or 5000000 if second_prize_config else 5000000
            second_prize_per_ticket = min(second_prize_amount // second_prize_stat['count'], max_per_ticket)
            second_prize_amount = second_prize_per_ticket * second_prize_stat['count']
            result[2] = second_prize_amount

        return result

    @staticmethod
    def calculate_prize_details(lottery_id: str, draw_result: Dict[str, List[int]],
                               tickets: List[Dict[str, List[int]]],
                               current_prize_pool: int = 0,
                               add_on_enabled: bool = False) -> Dict:
        """计算完整奖金详情"""
        config = get_lottery_config(lottery_id)
        if not config:
            return {}

        total_tickets = len(tickets)
        base_prize_pool = int(total_tickets * config.price_per_bet * config.pool_ratio)
        total_prize_pool = current_prize_pool + base_prize_pool if current_prize_pool > 0 else base_prize_pool

        # 初始化奖级统计
        fixed_payout = 0
        prize_stats = [{'level': p.level, 'name': p.name, 'count': 0, 'percentage': '0.00'}
                       for p in config.prizes]

        # 计算中奖
        if draw_result:
            level_counts = {p.level: 0 for p in config.prizes}
            level_counts[0] = 0

            for ticket in tickets:
                level, _ = PrizeCalculator.check_prize(lottery_id, draw_result, ticket)
                level_counts[level] = level_counts.get(level, 0) + 1

            for stat in prize_stats:
                stat['count'] = level_counts.get(stat['level'], 0)
                stat['percentage'] = f"{(stat['count'] / total_tickets * 100):.2f}" if total_tickets > 0 else "0.00"
                if stat['level'] > 0:
                    prize_config = next((p for p in config.prizes if p.level == stat['level']), None)
                    if prize_config and prize_config.fixed:
                        amount = PrizeCalculator.get_fixed_prize_amount(lottery_id, stat['level'], current_prize_pool)
                        fixed_payout += amount * stat['count']

        # 未中奖统计
        not_won_count = total_tickets - sum(s['count'] for s in prize_stats)
        prize_stats.append({'level': 0, 'name': '未中奖', 'count': not_won_count,
                           'percentage': f"{(not_won_count / total_tickets * 100):.2f}" if total_tickets > 0 else "0.00"})

        # 计算浮动奖
        floating_pool = total_prize_pool - fixed_payout
        tiered_prizes = PrizeCalculator.calculate_tiered_prize(
            lottery_id, total_prize_pool, fixed_payout, prize_stats, current_prize_pool, add_on_enabled)

        # 汇总浮动奖
        floating_payout = 0
        for stat in prize_stats:
            if stat['level'] == 0:
                continue
            prize_config = next((p for p in config.prizes if p.level == stat['level']), None)
            if prize_config and not prize_config.fixed and stat['count'] > 0:
                stat['payout'] = tiered_prizes.get(stat['level'], 0)
                floating_payout += stat['payout']

        total_payout = fixed_payout + floating_payout

        return {
            'total_tickets': total_tickets,
            'base_prize_pool': base_prize_pool,
            'total_prize_pool': total_prize_pool,
            'fixed_payout': fixed_payout,
            'floating_payout': floating_payout,
            'total_payout': total_payout,
            'prize_stats': prize_stats
        }

    @staticmethod
    def check_prize(lottery_id: str, draw_result: Dict[str, List[int]],
                    ticket: Dict[str, List[int]]) -> Tuple[int, int]:
        """检查中奖情况"""
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
