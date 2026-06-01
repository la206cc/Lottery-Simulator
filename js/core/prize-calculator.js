import { getLotteryConfig } from '../data/lottery-config.js';

export function getFixedPrizeAmount(lotteryId, prizeLevel, currentPrizePool) {
  const config = getLotteryConfig(lotteryId);
  const prizeConfig = config.prizes.find(p => p.level === prizeLevel);
  
  if (!prizeConfig || !prizeConfig.fixed) {
    return prizeConfig?.amount || 0;
  }
  
  if (prizeConfig.bonusPoolThreshold && currentPrizePool < prizeConfig.bonusPoolThreshold) {
    return 0;
  }
  
  if (prizeConfig.highPoolAmount && config.poolTiers) {
    const totalPrizePool = currentPrizePool || 0;
    const highPoolTier = config.poolTiers.find(t => t.activateHighPoolBonus);
    
    if (highPoolTier && totalPrizePool >= highPoolTier.min) {
      return prizeConfig.highPoolAmount;
    }
  }
  
  return prizeConfig.amount;
}

export function calculateTieredPrize(lotteryId, prizePool, fixedPayout, prizeStats, currentPrizePool, addOnEnabled = false) {
  const config = getLotteryConfig(lotteryId);
  const floatingPool = prizePool - fixedPayout;
  
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
  if (firstPrizeStat && firstPrizeStat.count > 0) {
    let firstPrizeAmount = 0;
    
    if (currentTier.secondPartRatio !== undefined) {
      const part1 = Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool;
      const part2 = Math.floor(floatingPool * currentTier.secondPartRatio);
      
      const firstPrizeConfig = config.prizes.find(p => p.level === 1);
      const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
      const part1PerTicket = Math.min(Math.floor(part1 / firstPrizeStat.count), maxPerTicket);
      const part2PerTicket = Math.min(Math.floor(part2 / firstPrizeStat.count), maxPerTicket);
      
      let perTicket = part1PerTicket + part2PerTicket;
      
      if (addOnEnabled && config.canAddOn) {
        perTicket = Math.floor(perTicket * 1.8);
      }
      
      const maxAddOnPerTicket = firstPrizeConfig.maxAddOnPerTicket;
      if (addOnEnabled && maxAddOnPerTicket) {
        perTicket = Math.min(perTicket, maxAddOnPerTicket);
      }
      
      firstPrizeAmount = perTicket * firstPrizeStat.count;
      
      const maxTotal = firstPrizeConfig.maxTotal;
      if (maxTotal && firstPrizeAmount > maxTotal) {
        firstPrizeAmount = maxTotal;
      }
    } else {
      firstPrizeAmount = Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool;
      
      const firstPrizeConfig = config.prizes.find(p => p.level === 1);
      const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
      let perTicket = Math.min(Math.floor(firstPrizeAmount / firstPrizeStat.count), maxPerTicket);
      
      if (addOnEnabled && config.canAddOn) {
        perTicket = Math.floor(perTicket * 1.8);
      }
      
      const maxAddOnPerTicket = firstPrizeConfig.maxAddOnPerTicket;
      if (addOnEnabled && maxAddOnPerTicket) {
        perTicket = Math.min(perTicket, maxAddOnPerTicket);
      }
      
      firstPrizeAmount = perTicket * firstPrizeStat.count;
      
      const maxTotal = firstPrizeConfig.maxTotal;
      if (maxTotal && firstPrizeAmount > maxTotal) {
        firstPrizeAmount = maxTotal;
      }
    }
    
    result[1] = firstPrizeAmount;
  }
  
  const secondPrizeStat = prizeStats.find(s => s.level === 2);
  if (secondPrizeStat && secondPrizeStat.count > 0) {
    const firstPrizeAmount = result[1] || 0;
    const remainingPool = floatingPool - (firstPrizeAmount - currentPrizePool);
    
    if (remainingPool > 0) {
      const secondPrizeConfig = config.prizes.find(p => p.level === 2);
      let secondPrizeAmount = Math.floor(remainingPool * secondPrizeConfig.poolRatio);
      
      const maxPerTicket = secondPrizeConfig.maxPerTicket || 5000000;
      let perTicket = Math.min(Math.floor(secondPrizeAmount / secondPrizeStat.count), maxPerTicket);
      
      if (addOnEnabled && config.canAddOn) {
        perTicket = Math.floor(perTicket * 1.8);
      }
      
      const maxAddOnPerTicket = secondPrizeConfig.maxAddOnPerTicket;
      if (addOnEnabled && maxAddOnPerTicket) {
        perTicket = Math.min(perTicket, maxAddOnPerTicket);
      }
      
      secondPrizeAmount = perTicket * secondPrizeStat.count;
      
      const maxTotal = secondPrizeConfig.maxTotal;
      if (maxTotal && secondPrizeAmount > maxTotal) {
        secondPrizeAmount = maxTotal;
      }
      
      result[2] = secondPrizeAmount;
    }
  }
  
  return result;
}

export function calculatePrizeDetails(lotteryId, drawResult, tickets, currentPrizePool = 0, addOnEnabled = false) {
  const config = getLotteryConfig(lotteryId);
  const totalTickets = tickets.length;
  const basePrizePool = totalTickets * config.price * config.poolRatio;
  const totalPrizePool = currentPrizePool > 0 ? currentPrizePool + basePrizePool : basePrizePool;
  
  let fixedPayout = 0;
  const prizeStats = config.prizes.map(p => ({
    level: p.level,
    name: p.name,
    count: 0,
    percentage: '0.00'
  }));
  
  if (drawResult) {
    const { checkPrize } = require('./lottery.js');
    const levelCounts = new Array(config.prizes.length + 1).fill(0);
    
    for (const ticket of tickets) {
      const result = checkPrize(lotteryId, drawResult, ticket);
      levelCounts[result.prizeLevel]++;
    }
    
    for (const stat of prizeStats) {
      stat.count = levelCounts[stat.level];
      stat.percentage = totalTickets > 0 ? ((stat.count / totalTickets) * 100).toFixed(2) : '0.00';
      if (stat.level > 0) {
        const prizeConfig = config.prizes.find(p => p.level === stat.level);
        if (prizeConfig && prizeConfig.fixed) {
          const amount = getFixedPrizeAmount(lotteryId, stat.level, currentPrizePool);
          fixedPayout += amount * stat.count;
        }
      }
    }
  }
  
  prizeStats.push({ level: 0, name: '未中奖', count: totalTickets - prizeStats.reduce((sum, s) => sum + s.count, 0), percentage: '0.00' });
  
  const floatingPool = totalPrizePool - fixedPayout;
  const tieredPrizes = calculateTieredPrize(lotteryId, totalPrizePool, fixedPayout, prizeStats, currentPrizePool, addOnEnabled);
  
  let floatingPayout = 0;
  prizeStats.forEach(stat => {
    if (stat.level === 0) return;
    if (!config.prizes.find(p => p.level === stat.level)?.fixed && stat.count > 0) {
      stat.payout = tieredPrizes[stat.level] || 0;
      floatingPayout += stat.payout;
    }
  });
  
  const totalPayout = fixedPayout + floatingPayout;
  
  return {
    totalTickets,
    basePrizePool,
    totalPrizePool,
    fixedPayout,
    floatingPayout,
    totalPayout,
    prizeStats
  };
}
