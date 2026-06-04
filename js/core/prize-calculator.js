/**
 * 彩票奖金计算器模块
 * 负责计算各类彩票的奖金金额，包括固定奖和浮动奖
 * 支持双色球、大乐透等多种彩票的奖金计算逻辑
 */

import { getLotteryConfig } from '../lottery-config.js';
import { checkPrize } from './lottery.js';

/**
 * 获取固定奖金额
 * 
 * @param {string} lotteryId - 彩票类型ID（如 'ssq', 'dlt'）
 * @param {number} prizeLevel - 奖级（1为一等奖，2为二等奖，以此类推）
 * @param {number} currentPrizePool - 当前奖池金额
 * @returns {number} 固定奖金额
 */
export function getFixedPrizeAmount(lotteryId, prizeLevel, currentPrizePool) {
  // 获取彩票配置
  const config = getLotteryConfig(lotteryId);
  // 查找对应奖级的配置
  const prizeConfig = config.prizes.find(p => p.level === prizeLevel);
  
  // 如果没有配置或不是固定奖，返回金额或0
  if (!prizeConfig || !prizeConfig.fixed) {
    return prizeConfig?.amount || 0;
  }
  
  // 检查是否满足奖池门槛（如福运奖需要奖池≥15亿）
  if (prizeConfig.bonusPoolThreshold && currentPrizePool < prizeConfig.bonusPoolThreshold) {
    return 0;
  }
  
  // 检查是否有高奖池金额（如大乐透奖池≥8亿时奖金提升）
  if (prizeConfig.highPoolAmount && config.poolTiers) {
    const totalPrizePool = currentPrizePool || 0;
    const highPoolTier = config.poolTiers.find(t => t.activateHighPoolBonus);
    
    if (highPoolTier && totalPrizePool >= highPoolTier.min) {
      return prizeConfig.highPoolAmount;
    }
  }
  
  // 返回常规固定奖金额
  return prizeConfig.amount;
}

/**
 * 双色球浮动奖金计算函数
 * 实现双色球特有的奖金计算逻辑，包括奖池分档、保底规则等
 * 
 * @param {object} config - 彩票配置对象
 * @param {number} floatingPool - 浮动奖金池金额
 * @param {array} prizeStats - 各奖级中奖注数统计
 * @param {number} currentPrizePool - 当前奖池金额
 * @param {boolean} addOnEnabled - 是否启用追加投注（双色球不支持追加）
 * @returns {object} 各奖级奖金总额
 */
function calculateSSQTieredPrize(config, floatingPool, prizeStats, currentPrizePool, addOnEnabled) {
  const result = {};
  // 计算总奖池（当前奖池 + 本期浮动奖池）
  const totalPrizePool = currentPrizePool > 0 ? currentPrizePool + floatingPool : floatingPool;
  
  // 确定当前奖池档位
  let currentTier = config.poolTiers[0];
  for (const tier of config.poolTiers) {
    if (totalPrizePool >= tier.min && totalPrizePool <= tier.max) {
      currentTier = tier;
      break;
    }
  }
  
  // 获取一等奖统计和配置
  const firstPrizeStat = prizeStats.find(s => s.level === 1);
  const firstPrizeConfig = config.prizes.find(p => p.level === 1);
  let firstPrizePerTicket = 0;
  
  // 计算一等奖奖金
  if (firstPrizeStat && firstPrizeStat.count > 0) {
    let firstPrizeAmount = 0;
    
    // 双色球奖池≥1亿时采用两部分分配
    if (currentTier.secondPartRatio !== undefined) {
      // 第一部分：当期浮动奖比例 + 奖池（特别期时firstPrizeRatio=0，仅奖池）
      const part1 = currentTier.firstPrizeRatio > 0
        ? Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool
        : currentPrizePool;
      // 第二部分：当期浮动奖的20%
      const part2 = Math.floor(floatingPool * currentTier.secondPartRatio);
      
      const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
      const part1PerTicket = Math.min(Math.floor(part1 / firstPrizeStat.count), maxPerTicket);
      const part2PerTicket = Math.min(Math.floor(part2 / firstPrizeStat.count), maxPerTicket);
      
      // 单注一等奖 = 两部分之和
      firstPrizePerTicket = part1PerTicket + part2PerTicket;
      firstPrizeAmount = firstPrizePerTicket * firstPrizeStat.count;
      
      // 一等奖总额封顶检查
      const maxTotal = firstPrizeConfig.maxTotal;
      if (maxTotal && firstPrizeAmount > maxTotal) {
        firstPrizeAmount = maxTotal;
        firstPrizePerTicket = Math.floor(firstPrizeAmount / firstPrizeStat.count);
      }
    } else {
      // 单部分分配（奖池<1亿时）
      firstPrizeAmount = Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool;
      
      const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
      firstPrizePerTicket = Math.min(Math.floor(firstPrizeAmount / firstPrizeStat.count), maxPerTicket);
      firstPrizeAmount = firstPrizePerTicket * firstPrizeStat.count;
      
      // 一等奖总额封顶检查
      const maxTotal = firstPrizeConfig.maxTotal;
      if (maxTotal && firstPrizeAmount > maxTotal) {
        firstPrizeAmount = maxTotal;
        firstPrizePerTicket = Math.floor(firstPrizeAmount / firstPrizeStat.count);
      }
    }
    
    result[1] = firstPrizeAmount;
  }
  
  // 获取二等奖统计和配置
  const secondPrizeStat = prizeStats.find(s => s.level === 2);
  const secondPrizeConfig = config.prizes.find(p => p.level === 2);
  
  // 计算二等奖奖金
  if (secondPrizeStat && secondPrizeStat.count > 0) {
    // 获取二等奖分配比例（优先使用奖池档位配置，否则使用默认配置）
    let secondPrizeRatio = currentTier.secondPrizeRatio !== undefined
      ? currentTier.secondPrizeRatio
      : secondPrizeConfig.poolRatio;
    
    let secondPrizeAmount = Math.floor(floatingPool * secondPrizeRatio);
    const maxPerTicket = secondPrizeConfig.maxPerTicket || 5000000;
    let secondPrizePerTicket = Math.min(Math.floor(secondPrizeAmount / secondPrizeStat.count), maxPerTicket);
    secondPrizeAmount = secondPrizePerTicket * secondPrizeStat.count;
    
    // 二等奖总额封顶检查
    const maxTotal = secondPrizeConfig.maxTotal;
    if (maxTotal && secondPrizeAmount > maxTotal) {
      secondPrizeAmount = maxTotal;
      secondPrizePerTicket = Math.floor(secondPrizeAmount / secondPrizeStat.count);
    }
    
    result[2] = secondPrizeAmount;
    
    // 双色球保底规则1：一等奖 ≥ 二等奖 × 2
    if (firstPrizeStat && firstPrizeStat.count > 0 && firstPrizePerTicket > 0) {
      if (firstPrizePerTicket < secondPrizePerTicket * 2 && firstPrizePerTicket < 5000000) {
        const guaranteedFirstPerTicket = Math.min(secondPrizePerTicket * 2, 5000000);
        let guaranteedFirstTotal = guaranteedFirstPerTicket * firstPrizeStat.count;
        
        const maxTotal = firstPrizeConfig.maxTotal;
        if (maxTotal && guaranteedFirstTotal > maxTotal) {
          guaranteedFirstTotal = maxTotal;
        }
        
        result[1] = guaranteedFirstTotal;
      }
    }
    
    // 双色球保底规则2：二等奖 ≥ 6000元
    if (secondPrizePerTicket < 6000) {
      secondPrizePerTicket = 6000;
      secondPrizeAmount = secondPrizePerTicket * secondPrizeStat.count;
      result[2] = secondPrizeAmount;
      
      // 联动保底：一等奖 ≥ 12000元
      if (firstPrizeStat && firstPrizeStat.count > 0 && firstPrizePerTicket > 0) {
        if (firstPrizePerTicket < 12000) {
          firstPrizePerTicket = 12000;
          let guaranteedFirstTotal = firstPrizePerTicket * firstPrizeStat.count;
          const maxTotal = firstPrizeConfig.maxTotal;
          if (maxTotal && guaranteedFirstTotal > maxTotal) {
            guaranteedFirstTotal = maxTotal;
          }
          result[1] = guaranteedFirstTotal;
        }
      }
    }
  }
  
  return result;
}

/**
 * 大乐透浮动奖金计算函数
 * 实现大乐透特有的奖金计算逻辑，包括追加投注、奖池分档、保底规则等
 * 
 * @param {object} config - 彩票配置对象
 * @param {number} floatingPool - 浮动奖金池金额
 * @param {array} prizeStats - 各奖级中奖注数统计
 * @param {number} currentPrizePool - 当前奖池金额
 * @param {boolean} addOnEnabled - 是否启用追加投注
 * @returns {object} 各奖级奖金总额
 */
function calculateDLTTieredPrize(config, floatingPool, prizeStats, currentPrizePool, addOnEnabled) {
  const result = {};
  // 计算总奖池（当前奖池 + 本期浮动奖池）
  const totalPrizePool = currentPrizePool > 0 ? currentPrizePool + floatingPool : floatingPool;
  
  // 确定当前奖池档位
  let currentTier = config.poolTiers[0];
  for (const tier of config.poolTiers) {
    if (totalPrizePool >= tier.min && totalPrizePool <= tier.max) {
      currentTier = tier;
      break;
    }
  }
  
  // 获取一等奖统计和配置
  const firstPrizeStat = prizeStats.find(s => s.level === 1);
  const firstPrizeConfig = config.prizes.find(p => p.level === 1);
  let firstPrizePerTicket = 0;
  
  // 计算一等奖奖金
  if (firstPrizeStat && firstPrizeStat.count > 0) {
    let firstPrizeAmount = 0;
    
    // 大乐透奖池≥1亿时采用两部分分配
    if (currentTier.secondPartRatio !== undefined) {
      // 第一部分：当期浮动奖比例 + 奖池
      const part1 = Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool;
      // 第二部分：当期浮动奖的一定比例（随奖池档位变化）
      const part2 = Math.floor(floatingPool * currentTier.secondPartRatio);
      
      const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
      const part1PerTicket = Math.floor(part1 / firstPrizeStat.count);
      const part2PerTicket = Math.floor(part2 / firstPrizeStat.count);
      
      // 单注一等奖 = 两部分之和，但不超过单注封顶
      firstPrizePerTicket = Math.min(part1PerTicket + part2PerTicket, maxPerTicket);
      
      // 追加投注计算：一等奖奖金 × 1.8
      // 追加投注中浮动奖可获得基本奖金的80%额外奖金
      if (addOnEnabled && config.canAddOn) {
        firstPrizePerTicket = Math.floor(firstPrizePerTicket * 1.8);
      }
      
      // 追加投注单注封顶检查
      const maxAddOnPerTicket = firstPrizeConfig.maxAddOnPerTicket;
      if (addOnEnabled && maxAddOnPerTicket) {
        firstPrizePerTicket = Math.min(firstPrizePerTicket, maxAddOnPerTicket);
      }
      
      firstPrizeAmount = firstPrizePerTicket * firstPrizeStat.count;
      
      // 一等奖总额封顶检查
      const maxTotal = firstPrizeConfig.maxTotal;
      if (maxTotal && firstPrizeAmount > maxTotal) {
        firstPrizeAmount = maxTotal;
        firstPrizePerTicket = Math.floor(firstPrizeAmount / firstPrizeStat.count);
      }
    } else {
      // 单部分分配（奖池<1亿时）
      firstPrizeAmount = Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool;
      
      const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
      firstPrizePerTicket = Math.min(Math.floor(firstPrizeAmount / firstPrizeStat.count), maxPerTicket);
      
      // 追加投注计算
      if (addOnEnabled && config.canAddOn) {
        firstPrizePerTicket = Math.floor(firstPrizePerTicket * 1.8);
      }
      
      // 追加投注单注封顶检查
      const maxAddOnPerTicket = firstPrizeConfig.maxAddOnPerTicket;
      if (addOnEnabled && maxAddOnPerTicket) {
        firstPrizePerTicket = Math.min(firstPrizePerTicket, maxAddOnPerTicket);
      }
      
      firstPrizeAmount = firstPrizePerTicket * firstPrizeStat.count;
      
      // 一等奖总额封顶检查
      const maxTotal = firstPrizeConfig.maxTotal;
      if (maxTotal && firstPrizeAmount > maxTotal) {
        firstPrizeAmount = maxTotal;
        firstPrizePerTicket = Math.floor(firstPrizeAmount / firstPrizeStat.count);
      }
    }
    
    result[1] = firstPrizeAmount;
  }
  
  // 获取二等奖统计和配置
  const secondPrizeStat = prizeStats.find(s => s.level === 2);
  const secondPrizeConfig = config.prizes.find(p => p.level === 2);
  
  // 计算二等奖奖金
  if (secondPrizeStat && secondPrizeStat.count > 0) {
    // 获取二等奖分配比例（高奖池时使用特殊比例）
    let secondPrizeRatio = currentTier.secondPrizeRatio !== undefined
      ? currentTier.secondPrizeRatio
      : secondPrizeConfig.poolRatio;
    
    let secondPrizeAmount = Math.floor(floatingPool * secondPrizeRatio);
    const maxPerTicket = secondPrizeConfig.maxPerTicket || 5000000;
    let secondPrizePerTicket = Math.min(Math.floor(secondPrizeAmount / secondPrizeStat.count), maxPerTicket);
    
    // 追加投注计算：二等奖奖金 × 1.8
    if (addOnEnabled && config.canAddOn) {
      secondPrizePerTicket = Math.floor(secondPrizePerTicket * 1.8);
    }
    
    // 追加投注单注封顶检查
    const maxAddOnPerTicket = secondPrizeConfig.maxAddOnPerTicket;
    if (addOnEnabled && maxAddOnPerTicket) {
      secondPrizePerTicket = Math.min(secondPrizePerTicket, maxAddOnPerTicket);
    }
    
    secondPrizeAmount = secondPrizePerTicket * secondPrizeStat.count;
    
    // 二等奖总额封顶检查
    const maxTotal = secondPrizeConfig.maxTotal;
    if (maxTotal && secondPrizeAmount > maxTotal) {
      secondPrizeAmount = maxTotal;
      secondPrizePerTicket = Math.floor(secondPrizeAmount / secondPrizeStat.count);
    }
    
    result[2] = secondPrizeAmount;
    
    // 大乐透保底规则1：一等奖 ≥ 二等奖 × 2
    if (firstPrizeStat && firstPrizeStat.count > 0 && firstPrizePerTicket > 0) {
      if (firstPrizePerTicket < secondPrizePerTicket * 2 && firstPrizePerTicket < 5000000) {
        const guaranteedFirstPerTicket = Math.min(secondPrizePerTicket * 2, 5000000);
        let guaranteedFirstTotal = guaranteedFirstPerTicket * firstPrizeStat.count;
        
        const maxTotal = firstPrizeConfig.maxTotal;
        if (maxTotal && guaranteedFirstTotal > maxTotal) {
          guaranteedFirstTotal = maxTotal;
        }
        
        result[1] = guaranteedFirstTotal;
      }
    }
    
    // 大乐透保底规则2：二等奖 ≥ 三等奖 × 2
    const thirdPrizeConfig = config.prizes.find(p => p.level === 3);
    const thirdPrizeAmount = thirdPrizeConfig.highPoolAmount && currentPrizePool >= 800000000
      ? thirdPrizeConfig.highPoolAmount
      : thirdPrizeConfig.amount;
    if (secondPrizePerTicket < thirdPrizeAmount * 2 && secondPrizePerTicket < 5000000) {
      secondPrizePerTicket = thirdPrizeAmount * 2;
      secondPrizeAmount = secondPrizePerTicket * secondPrizeStat.count;
      result[2] = secondPrizeAmount;
    }
  }
  
  return result;
}

/**
 * 计算浮动奖金的入口函数
 * 根据彩票类型分发到对应的计算函数
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {number} prizePool - 总奖池金额
 * @param {number} fixedPayout - 固定奖总支出
 * @param {array} prizeStats - 各奖级中奖注数统计
 * @param {number} currentPrizePool - 当前奖池金额
 * @param {boolean} addOnEnabled - 是否启用追加投注（默认false）
 * @returns {object} 各奖级奖金总额
 */
export function calculateTieredPrize(lotteryId, prizePool, fixedPayout, prizeStats, currentPrizePool, addOnEnabled = false) {
  const config = getLotteryConfig(lotteryId);
  // 计算浮动奖金池（总奖池 - 固定奖支出）
  const floatingPool = prizePool - fixedPayout;
  
  // 如果没有奖池分档配置，使用简单计算方式
  if (!config.poolTiers) {
    const result = {};
    prizeStats.forEach(stat => {
      if (stat.level === 0) return;
      const prizeConfig = config.prizes.find(p => p.level === stat.level);
      if (!prizeConfig.fixed && stat.count > 0) {
        result[stat.level] = Math.floor(floatingPool * prizeConfig.poolRatio);
      }
    });
    return result;
  }
  
  // 根据彩票类型分发到对应计算函数
  if (lotteryId === 'ssq') {
    return calculateSSQTieredPrize(config, floatingPool, prizeStats, currentPrizePool, addOnEnabled);
  }
  
  if (lotteryId === 'dlt') {
    return calculateDLTTieredPrize(config, floatingPool, prizeStats, currentPrizePool, addOnEnabled);
  }
  
  // 其他彩票的默认计算逻辑
  const result = {};
  const totalPrizePool = currentPrizePool > 0 ? currentPrizePool + floatingPool : floatingPool;
  
  let currentTier = config.poolTiers[0];
  for (const tier of config.poolTiers) {
    if (totalPrizePool >= tier.min && totalPrizePool <= tier.max) {
      currentTier = tier;
      break;
    }
  }
  
  const firstPrizeStat = prizeStats.find(s => s.level === 1);
  const firstPrizeConfig = config.prizes.find(p => p.level === 1);
  
  // 计算一等奖
  if (firstPrizeStat && firstPrizeStat.count > 0) {
    let firstPrizeAmount = Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool;
    const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
    const firstPrizePerTicket = Math.min(Math.floor(firstPrizeAmount / firstPrizeStat.count), maxPerTicket);
    firstPrizeAmount = firstPrizePerTicket * firstPrizeStat.count;
    
    const maxTotal = firstPrizeConfig.maxTotal;
    if (maxTotal && firstPrizeAmount > maxTotal) {
      firstPrizeAmount = maxTotal;
    }
    
    result[1] = firstPrizeAmount;
  }
  
  // 计算二等奖
  const secondPrizeStat = prizeStats.find(s => s.level === 2);
  const secondPrizeConfig = config.prizes.find(p => p.level === 2);
  
  if (secondPrizeStat && secondPrizeStat.count > 0) {
    const secondPrizeRatio = currentTier.secondPrizeRatio !== undefined
      ? currentTier.secondPrizeRatio
      : secondPrizeConfig.poolRatio;
    
    let secondPrizeAmount = Math.floor(floatingPool * secondPrizeRatio);
    const maxPerTicket = secondPrizeConfig.maxPerTicket || 5000000;
    const secondPrizePerTicket = Math.min(Math.floor(secondPrizeAmount / secondPrizeStat.count), maxPerTicket);
    secondPrizeAmount = secondPrizePerTicket * secondPrizeStat.count;
    
    const maxTotal = secondPrizeConfig.maxTotal;
    if (maxTotal && secondPrizeAmount > maxTotal) {
      secondPrizeAmount = maxTotal;
    }
    
    result[2] = secondPrizeAmount;
  }
  
  return result;
}

/**
 * 计算完整的奖金详情
 * 包括固定奖、浮动奖、总支出等
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {array} drawResult - 开奖结果
 * @param {array} tickets - 购买的彩票列表
 * @param {number} currentPrizePool - 当前奖池金额（默认0）
 * @param {boolean} addOnEnabled - 是否启用追加投注（默认false）
 * @returns {object} 奖金计算详情
 */
export function calculatePrizeDetails(lotteryId, drawResult, tickets, currentPrizePool = 0, addOnEnabled = false) {
  const config = getLotteryConfig(lotteryId);
  const totalTickets = tickets.length;
  
  // 计算本期基础奖池（销售额 × 奖池比例）
  const basePrizePool = totalTickets * config.price * config.poolRatio;
  // 计算总奖池（当前奖池 + 本期基础奖池）
  const totalPrizePool = currentPrizePool > 0 ? currentPrizePool + basePrizePool : basePrizePool;
  
  // 初始化固定奖支出和奖级统计
  let fixedPayout = 0;
  const prizeStats = config.prizes.map(p => ({
    level: p.level,
    name: p.name,
    count: 0,
    percentage: '0.00'
  }));
  
  // 如果有开奖结果，计算各奖级中奖注数
  if (drawResult) {
    const levelCounts = new Array(config.prizes.length + 1).fill(0);
    
    // 遍历所有彩票计算中奖情况
    for (const ticket of tickets) {
      const result = checkPrize(lotteryId, drawResult, ticket);
      levelCounts[result.prizeLevel]++;
    }
    
    // 更新各奖级统计
    for (const stat of prizeStats) {
      stat.count = levelCounts[stat.level];
      stat.percentage = totalTickets > 0 ? ((stat.count / totalTickets) * 100).toFixed(2) : '0.00';
      // 计算固定奖总支出
      if (stat.level > 0) {
        const prizeConfig = config.prizes.find(p => p.level === stat.level);
        if (prizeConfig && prizeConfig.fixed) {
          const amount = getFixedPrizeAmount(lotteryId, stat.level, currentPrizePool);
          fixedPayout += amount * stat.count;
        }
      }
    }
  }
  
  // 添加未中奖统计
  prizeStats.push({ level: 0, name: '未中奖', count: totalTickets - prizeStats.reduce((sum, s) => sum + s.count, 0), percentage: '0.00' });
  
  // 计算浮动奖金池和各奖级浮动奖金额
  const floatingPool = totalPrizePool - fixedPayout;
  const tieredPrizes = calculateTieredPrize(lotteryId, totalPrizePool, fixedPayout, prizeStats, currentPrizePool, addOnEnabled);
  
  // 汇总浮动奖支出
  let floatingPayout = 0;
  prizeStats.forEach(stat => {
    if (stat.level === 0) return;
    if (!config.prizes.find(p => p.level === stat.level)?.fixed && stat.count > 0) {
      stat.payout = tieredPrizes[stat.level] || 0;
      floatingPayout += stat.payout;
    }
  });
  
  // 计算总支出
  const totalPayout = fixedPayout + floatingPayout;
  
  return {
    totalTickets,           // 总票数
    basePrizePool,          // 本期基础奖池
    totalPrizePool,         // 总奖池
    fixedPayout,            // 固定奖总支出
    floatingPayout,         // 浮动奖总支出
    totalPayout,            // 总支出
    prizeStats              // 各奖级统计详情
  };
}