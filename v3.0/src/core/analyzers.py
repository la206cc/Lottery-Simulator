"""
通用数据分析模块实现

支持的分析功能：
1. 号码频率统计
2. 遗漏值分析
3. 趋势分析
4. 奖金分布统计
5. 投注策略分析
6. 号码组合分析
"""

from typing import Dict, List, Optional, Any, Tuple
from collections import Counter, defaultdict
from .base import BaseDataAnalyzer, LotteryConfig, ComponentFactory


class DefaultDataAnalyzer(BaseDataAnalyzer):
    """默认数据分析器"""
    
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
        result = {}
        
        for zone in config.zones:
            zone_name = zone.name
            zone_data = [d.get(zone_name, []) for d in data if zone_name in d]
            
            if not zone_data:
                result[zone_name] = {"frequency": {}, "hot_numbers": [], "cold_numbers": []}
                continue
            
            # 统计频率
            frequency = Counter()
            for numbers in zone_data:
                frequency.update(numbers)
            
            # 计算概率
            total_numbers = sum(frequency.values())
            probability = {
                num: count / total_numbers 
                for num, count in frequency.items()
            }
            
            # 排序
            sorted_freq = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
            
            # 热门号码（前20%）
            hot_count = max(1, len(sorted_freq) // 5)
            hot_numbers = [num for num, _ in sorted_freq[:hot_count]]
            
            # 冷门号码（后20%）
            cold_numbers = [num for num, _ in sorted_freq[-hot_count:]]
            
            result[zone_name] = {
                "frequency": dict(frequency),
                "probability": probability,
                "hot_numbers": hot_numbers,
                "cold_numbers": cold_numbers,
                "total_numbers": total_numbers,
                "unique_numbers": len(frequency)
            }
        
        return result
    
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
        result = {}
        
        for zone in config.zones:
            zone_name = zone.name
            zone_data = [d.get(zone_name, []) for d in data if zone_name in d]
            
            if not zone_data:
                result[zone_name] = {"missing": {}, "max_missing": 0, "avg_missing": 0}
                continue
            
            # 计算遗漏值
            missing = {}
            for num in range(zone.min_value, zone.max_value + 1):
                last_seen = -1
                for i, numbers in enumerate(zone_data):
                    if num in numbers:
                        last_seen = i
                        break
                
                if last_seen == -1:
                    missing[num] = len(zone_data)  # 从未出现
                else:
                    missing[num] = last_seen
            
            # 统计
            missing_values = list(missing.values())
            max_missing = max(missing_values) if missing_values else 0
            avg_missing = sum(missing_values) / len(missing_values) if missing_values else 0
            
            # 遗漏值分布
            missing_distribution = Counter(missing_values)
            
            result[zone_name] = {
                "missing": missing,
                "max_missing": max_missing,
                "avg_missing": avg_missing,
                "missing_distribution": dict(missing_distribution),
                "total_periods": len(zone_data)
            }
        
        return result
    
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
        result = {}
        
        for zone in config.zones:
            zone_name = zone.name
            zone_data = [d.get(zone_name, []) for d in data if zone_name in d]
            
            if not zone_data:
                result[zone_name] = {"trend": "stable", "changes": []}
                continue
            
            # 计算奇偶比趋势
            odd_even_trend = []
            for numbers in zone_data:
                odd_count = sum(1 for n in numbers if n % 2 == 1)
                even_count = len(numbers) - odd_count
                odd_even_trend.append({"odd": odd_count, "even": even_count})
            
            # 计算大小比趋势（以中间值为界）
            mid_value = (zone.min_value + zone.max_value) / 2
            big_small_trend = []
            for numbers in zone_data:
                big_count = sum(1 for n in numbers if n > mid_value)
                small_count = len(numbers) - big_count
                big_small_trend.append({"big": big_count, "small": small_count})
            
            # 计算和值趋势
            sum_trend = [sum(numbers) for numbers in zone_data]
            
            # 计算趋势方向
            trend_direction = self._calculate_trend_direction(sum_trend)
            
            result[zone_name] = {
                "odd_even_trend": odd_even_trend,
                "big_small_trend": big_small_trend,
                "sum_trend": sum_trend,
                "trend_direction": trend_direction,
                "avg_sum": sum(sum_trend) / len(sum_trend) if sum_trend else 0,
                "max_sum": max(sum_trend) if sum_trend else 0,
                "min_sum": min(sum_trend) if sum_trend else 0
            }
        
        return result
    
    def _calculate_trend_direction(self, data: List[float]) -> str:
        """
        计算趋势方向
        
        Args:
            data: 数据列表
            
        Returns:
            趋势方向 (up/down/stable)
        """
        if len(data) < 2:
            return "stable"
        
        # 计算最近几期的平均值
        recent = data[-5:] if len(data) >= 5 else data
        earlier = data[:-5] if len(data) >= 5 else data[:1]
        
        recent_avg = sum(recent) / len(recent)
        earlier_avg = sum(earlier) / len(earlier) if earlier else recent_avg
        
        # 计算变化率
        change_rate = (recent_avg - earlier_avg) / earlier_avg if earlier_avg != 0 else 0
        
        if change_rate > 0.1:
            return "up"
        elif change_rate < -0.1:
            return "down"
        else:
            return "stable"
    
    def analyze_prize_distribution(
        self,
        simulation_results: List[Dict[str, Any]],
        config: LotteryConfig
    ) -> Dict[str, Any]:
        """
        分析奖金分布
        
        Args:
            simulation_results: 模拟结果列表
            config: 彩票配置
            
        Returns:
            奖金分布分析结果
        """
        prize_amounts = []
        prize_levels = []
        total_investment = 0
        total_return = 0
        
        for result in simulation_results:
            if result.get("win"):
                prize_amounts.append(result.get("prize_amount", 0))
                prize_levels.append(result.get("prize_level", 0))
            
            total_investment += result.get("bet_cost", 0)
            total_return += result.get("prize_amount", 0)
        
        # 统计
        prize_counter = Counter(prize_levels)
        
        # 计算期望值
        expected_value = total_return / len(simulation_results) if simulation_results else 0
        
        # 计算回报率
        return_rate = total_return / total_investment if total_investment > 0 else 0
        
        # 计算中奖率
        win_count = len(prize_amounts)
        total_count = len(simulation_results)
        win_rate = win_count / total_count if total_count > 0 else 0
        
        # 奖金分布
        if prize_amounts:
            avg_prize = sum(prize_amounts) / len(prize_amounts)
            max_prize = max(prize_amounts)
            min_prize = min(prize_amounts)
        else:
            avg_prize = 0
            max_prize = 0
            min_prize = 0
        
        return {
            "prize_distribution": dict(prize_counter),
            "expected_value": expected_value,
            "return_rate": return_rate,
            "win_rate": win_rate,
            "avg_prize": avg_prize,
            "max_prize": max_prize,
            "min_prize": min_prize,
            "total_investment": total_investment,
            "total_return": total_return,
            "net_profit": total_return - total_investment
        }
    
    def analyze_number_combinations(
        self,
        data: List[Dict[str, List[int]]],
        config: LotteryConfig,
        combination_size: int = 2
    ) -> Dict[str, Any]:
        """
        分析号码组合
        
        Args:
            data: 历史开奖数据
            config: 彩票配置
            combination_size: 组合大小
            
        Returns:
            组合分析结果
        """
        result = {}
        
        for zone in config.zones:
            zone_name = zone.name
            zone_data = [d.get(zone_name, []) for d in data if zone_name in d]
            
            if not zone_data:
                result[zone_name] = {"combinations": {}}
                continue
            
            # 统计组合频率
            combination_counter = Counter()
            for numbers in zone_data:
                if len(numbers) >= combination_size:
                    # 生成组合
                    from itertools import combinations
                    for combo in combinations(sorted(numbers), combination_size):
                        combination_counter[combo] += 1
            
            # 排序
            sorted_combinations = sorted(
                combination_counter.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            
            # 热门组合
            hot_combinations = [
                {"combination": list(combo), "count": count}
                for combo, count in sorted_combinations[:10]
            ]
            
            result[zone_name] = {
                "combinations": dict(combination_counter),
                "hot_combinations": hot_combinations,
                "total_combinations": len(combination_counter)
            }
        
        return result
    
    def analyze_consecutive_numbers(
        self,
        data: List[Dict[str, List[int]]],
        config: LotteryConfig
    ) -> Dict[str, Any]:
        """
        分析连号
        
        Args:
            data: 历史开奖数据
            config: 彩票配置
            
        Returns:
            连号分析结果
        """
        result = {}
        
        for zone in config.zones:
            zone_name = zone.name
            zone_data = [d.get(zone_name, []) for d in data if zone_name in d]
            
            if not zone_data:
                result[zone_name] = {"consecutive_count": 0, "consecutive_ratio": 0}
                continue
            
            # 统计连号
            consecutive_count = 0
            for numbers in zone_data:
                sorted_nums = sorted(numbers)
                has_consecutive = False
                for i in range(len(sorted_nums) - 1):
                    if sorted_nums[i + 1] - sorted_nums[i] == 1:
                        has_consecutive = True
                        break
                if has_consecutive:
                    consecutive_count += 1
            
            # 计算连号比例
            consecutive_ratio = consecutive_count / len(zone_data) if zone_data else 0
            
            result[zone_name] = {
                "consecutive_count": consecutive_count,
                "consecutive_ratio": consecutive_ratio,
                "total_periods": len(zone_data)
            }
        
        return result
    
    def generate_recommendations(
        self,
        frequency_data: Dict[str, Any],
        missing_data: Dict[str, Any],
        trend_data: Dict[str, Any],
        config: LotteryConfig
    ) -> Dict[str, Any]:
        """
        生成推荐号码
        
        Args:
            frequency_data: 频率分析数据
            missing_data: 遗漏分析数据
            trend_data: 趋势分析数据
            config: 彩票配置
            
        Returns:
            推荐号码
        """
        recommendations = {}
        
        for zone in config.zones:
            zone_name = zone.name
            
            # 获取各种分析数据
            freq_info = frequency_data.get(zone_name, {})
            missing_info = missing_data.get(zone_name, {})
            trend_info = trend_data.get(zone_name, {})
            
            # 热门号码
            hot_numbers = freq_info.get("hot_numbers", [])
            
            # 遗漏号码（遗漏值较大的）
            missing = missing_info.get("missing", {})
            cold_numbers = sorted(
                missing.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:zone.count]
            cold_numbers = [num for num, _ in cold_numbers]
            
            # 趋势号码
            trend_direction = trend_info.get("trend_direction", "stable")
            
            # 生成推荐
            recommended = []
            
            # 1. 选择热门号码（30%）
            hot_count = max(1, int(zone.count * 0.3))
            if hot_numbers:
                recommended.extend(hot_numbers[:hot_count])
            
            # 2. 选择遗漏号码（30%）
            cold_count = max(1, int(zone.count * 0.3))
            recommended.extend(cold_numbers[:cold_count])
            
            # 3. 补充随机号码（40%）
            remaining = zone.count - len(recommended)
            if remaining > 0:
                all_numbers = list(range(zone.min_value, zone.max_value + 1))
                available = [n for n in all_numbers if n not in recommended]
                if available:
                    supplement = random.sample(available, min(remaining, len(available)))
                    recommended.extend(supplement)
            
            # 排序
            recommended = sorted(recommended[:zone.count])
            
            recommendations[zone_name] = {
                "hot_numbers": hot_numbers[:zone.count],
                "cold_numbers": cold_numbers[:zone.count],
                "recommended": recommended,
                "trend_direction": trend_direction
            }
        
        return recommendations


# 注册默认组件
ComponentFactory.register_analyzer("default", DefaultDataAnalyzer)