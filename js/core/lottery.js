/**
 * 彩票核心逻辑模块
 * 负责彩票号码生成、中奖检查、购买分析等核心功能
 */

import { getLotteryConfig } from '../lottery-config.js';
import { fisherYatesPick, randomPick } from './random-engine.js';

/**
 * 生成一组彩票号码（可用于购买或开奖）
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {boolean} forPurchase - 是否用于购买（true为购买，false为开奖）
 * @returns {array} 彩票号码数组，每个元素包含zoneName、numbers、color
 */
export function drawOne(lotteryId, forPurchase) {
  const config = getLotteryConfig(lotteryId);
  if (!config) return null;
  
  const results = [];
  
  // 购买模式或无开奖专用区配置时，使用普通号码区
  if (forPurchase || !config.drawZones) {
    config.zones.forEach(zone => {
      // 获取排除号码（如快乐8开奖号不能包含选号）
      let excluded = [];
      if (zone.excludeZone !== undefined && results[zone.excludeZone]) {
        excluded = results[zone.excludeZone].numbers;
      }
      
      let numbers;
      if (zone.repeatable) {
        // 可重复号码（如3D、排列三）
        numbers = randomPick(zone.min, zone.max, zone.count);
      } else {
        // 不可重复号码（如双色球、大乐透）
        const pool = [];
        for (let i = zone.min; i <= zone.max; i++) {
          if (!excluded.includes(i)) pool.push(i);
        }
        // Fisher-Yates 洗牌算法
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        numbers = pool.slice(0, zone.count).sort((a, b) => a - b);
      }
      
      results.push({ zoneName: zone.name, numbers, color: zone.color });
    });
  }
  
  // 开奖模式且有开奖专用区配置时，追加开奖号码
  if (!forPurchase && config.drawZones) {
    config.drawZones.forEach(zone => {
      let excluded = [];
      if (zone.excludeZone !== undefined && results[zone.excludeZone]) {
        excluded = results[zone.excludeZone].numbers;
      }
      
      const pool = [];
      for (let i = zone.min; i <= zone.max; i++) {
        if (!excluded.includes(i)) pool.push(i);
      }
      
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      
      const numbers = pool.slice(0, zone.count).sort((a, b) => a - b);
      results.push({ zoneName: zone.name, numbers, color: zone.color });
    });
  }
  
  return results;
}

/**
 * 检查单张彩票的中奖情况
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {array} drawResult - 开奖结果
 * @param {array} ticketResult - 彩票号码
 * @returns {object} 包含prizeLevel（奖级）和matchCounts（匹配数量）
 */
export function checkPrize(lotteryId, drawResult, ticketResult) {
  // 福彩3D/排列三特殊处理（直选/组选）
  const groupLotteries = ['fc3d', 'pls'];
  if (groupLotteries.includes(lotteryId)) {
    const drawNums = drawResult[0].numbers;
    const ticketNums = ticketResult[0].numbers;
    
    // 计算位置匹配数（直选）
    let posMatch = 0;
    for (let i = 0; i < drawNums.length; i++) {
      if (drawNums[i] === ticketNums[i]) posMatch++;
    }
    
    // 直选一等奖
    if (posMatch === drawNums.length) return { prizeLevel: 1, matchCounts: [posMatch] };
    
    // 组选判断
    const drawSorted = [...drawNums].sort().join('');
    const ticketSorted = [...ticketNums].sort().join('');
    
    if (drawSorted === ticketSorted) {
      const uniqueDraw = new Set(drawNums);
      // 组三（两个相同数字）或组六（三个不同数字）
      return { prizeLevel: uniqueDraw.size === 2 ? 2 : 3, matchCounts: [posMatch] };
    }
    
    return { prizeLevel: 0, matchCounts: [posMatch] };
  }
  
  // 排列五特殊处理（只有直选）
  const posLotteries = ['plw'];
  if (posLotteries.includes(lotteryId)) {
    let matchCount = 0;
    const zone = drawResult[0];
    const ticketZone = ticketResult[0];
    
    for (let i = 0; i < zone.numbers.length; i++) {
      if (zone.numbers[i] === ticketZone.numbers[i]) matchCount++;
    }
    
    const totalPositions = zone.numbers.length;
    return {
      prizeLevel: matchCount === totalPositions ? 1 : 0,
      matchCounts: [matchCount]
    };
  }
  
  // 快乐8特殊处理
  if (lotteryId === 'kl8') {
    const ticketSet = new Set(ticketResult[0].numbers);
    const drawSet = new Set(drawResult[0].numbers);
    
    // 计算匹配数量
    let hits = 0;
    for (const n of ticketSet) {
      if (drawSet.has(n)) hits++;
    }
    
    // 根据匹配数量确定奖级
    let prizeLevel = 0;
    if (hits === 10) prizeLevel = 1;
    else if (hits === 9) prizeLevel = 2;
    else if (hits === 8) prizeLevel = 3;
    else if (hits === 7) prizeLevel = 4;
    else if (hits === 6) prizeLevel = 5;
    else if (hits === 5) prizeLevel = 6;
    else if (hits === 0) prizeLevel = 7;
    
    return { prizeLevel, matchCounts: [hits] };
  }
  
  // 七星彩特殊处理（按位匹配）
  if (lotteryId === 'qxc') {
    let frontMatch = 0;
    // 前区按位匹配
    for (let i = 0; i < drawResult[0].numbers.length; i++) {
      if (drawResult[0].numbers[i] === ticketResult[0].numbers[i]) frontMatch++;
    }
    // 后区匹配
    const backMatch = drawResult[1].numbers[0] === ticketResult[1].numbers[0] ? 1 : 0;
    
    // 根据匹配情况确定奖级
    let prizeLevel = 0;
    if (frontMatch === 6 && backMatch === 1) prizeLevel = 1;
    else if (frontMatch === 6 && backMatch === 0) prizeLevel = 2;
    else if (frontMatch === 5 && backMatch === 1) prizeLevel = 3;
    else if ((frontMatch === 5 && backMatch === 0) || (frontMatch === 4 && backMatch === 1)) prizeLevel = 4;
    else if ((frontMatch === 4 && backMatch === 0) || (frontMatch === 3 && backMatch === 1)) prizeLevel = 5;
    else if ((frontMatch === 3 && backMatch === 0) || (frontMatch === 2 && backMatch === 1) || (frontMatch === 1 && backMatch === 1) || (frontMatch === 0 && backMatch === 1)) prizeLevel = 6;
    
    return { prizeLevel, matchCounts: [frontMatch, backMatch] };
  }
  
  // 七乐彩特殊处理（含特别号）
  if (lotteryId === 'qlc') {
    const mainDrawSet = new Set(drawResult[0].numbers);
    const specialNum = drawResult[1].numbers[0];
    
    let mainMatch = 0;
    let specialMatch = false;
    
    for (const n of ticketResult[0].numbers) {
      if (mainDrawSet.has(n)) mainMatch++;
      if (n === specialNum) specialMatch = true;
    }
    
    // 根据匹配情况确定奖级
    let prizeLevel = 0;
    if (mainMatch === 7) prizeLevel = 1;
    else if (mainMatch === 6 && specialMatch) prizeLevel = 2;
    else if (mainMatch === 6 && !specialMatch) prizeLevel = 3;
    else if (mainMatch === 5 && specialMatch) prizeLevel = 4;
    else if (mainMatch === 5 && !specialMatch) prizeLevel = 5;
    else if (mainMatch === 4 && specialMatch) prizeLevel = 6;
    else if (mainMatch === 4 && !specialMatch) prizeLevel = 7;
    
    return { prizeLevel, matchCounts: [mainMatch, specialMatch ? 1 : 0] };
  }
  
  // 英国乐透特殊处理（含Bonus球）
  if (lotteryId === 'uklotto') {
    const mainDrawSet = new Set(drawResult[0].numbers);
    const bonusNum = drawResult[1].numbers[0];
    
    let mainMatch = 0;
    let bonusMatch = false;
    
    for (const n of ticketResult[0].numbers) {
      if (mainDrawSet.has(n)) mainMatch++;
      if (n === bonusNum) bonusMatch = true;
    }
    
    let prizeLevel = 0;
    if (mainMatch === 6) prizeLevel = 1;
    else if (mainMatch === 5 && bonusMatch) prizeLevel = 2;
    else if (mainMatch === 5) prizeLevel = 3;
    else if (mainMatch === 4) prizeLevel = 4;
    else if (mainMatch === 3) prizeLevel = 5;
    else if (mainMatch === 2) prizeLevel = 6;
    
    return { prizeLevel, matchCounts: [mainMatch, bonusMatch ? 1 : 0] };
  }
  
  // 通用匹配逻辑（双色球、大乐透、Powerball、Mega Millions、EuroMillions）
  const matchCounts = drawResult.map((zone, idx) => {
    const drawSet = new Set(zone.numbers);
    let count = 0;
    for (const n of ticketResult[idx].numbers) {
      if (drawSet.has(n)) count++;
    }
    return count;
  });
  
  let prizeLevel = 0;
  
  // 双色球规则
  if (lotteryId === 'ssq') {
    const [r, b] = matchCounts;
    if (r === 6 && b === 1) prizeLevel = 1;
    else if (r === 6 && b === 0) prizeLevel = 2;
    else if (r === 5 && b === 1) prizeLevel = 3;
    else if ((r === 5 && b === 0) || (r === 4 && b === 1)) prizeLevel = 4;
    else if ((r === 4 && b === 0) || (r === 3 && b === 1)) prizeLevel = 5;
    else if ((r === 2 && b === 1) || (r === 1 && b === 1) || (r === 0 && b === 1)) prizeLevel = 6;
  }
  
  // 大乐透规则
  else if (lotteryId === 'dlt') {
    const [f, b] = matchCounts;
    if (f === 5 && b === 2) prizeLevel = 1;
    else if (f === 5 && b === 1) prizeLevel = 2;
    else if ((f === 5 && b === 0) || (f === 4 && b === 2)) prizeLevel = 3;
    else if (f === 4 && b === 1) prizeLevel = 4;
    else if ((f === 4 && b === 0) || (f === 3 && b === 2)) prizeLevel = 5;
    else if ((f === 3 && b === 1) || (f === 2 && b === 2)) prizeLevel = 6;
    else if ((f === 3 && b === 0) || (f === 2 && b === 1) || (f === 1 && b === 2) || (f === 0 && b === 2)) prizeLevel = 7;
  }
  
  // Powerball规则
  else if (lotteryId === 'powerball') {
    const [w, p] = matchCounts;
    if (w === 5 && p === 1) prizeLevel = 1;
    else if (w === 5 && p === 0) prizeLevel = 2;
    else if (w === 4 && p === 1) prizeLevel = 3;
    else if (w === 4 && p === 0) prizeLevel = 4;
    else if (w === 3 && p === 1) prizeLevel = 5;
    else if (w === 3 && p === 0) prizeLevel = 6;
    else if (w === 2 && p === 1) prizeLevel = 7;
    else if (w === 1 && p === 1) prizeLevel = 8;
    else if (w === 0 && p === 1) prizeLevel = 9;
  }
  
  // Mega Millions规则
  else if (lotteryId === 'megamillions') {
    const [w, m] = matchCounts;
    if (w === 5 && m === 1) prizeLevel = 1;
    else if (w === 5 && m === 0) prizeLevel = 2;
    else if (w === 4 && m === 1) prizeLevel = 3;
    else if (w === 4 && m === 0) prizeLevel = 4;
    else if (w === 3 && m === 1) prizeLevel = 5;
    else if (w === 3 && m === 0) prizeLevel = 6;
    else if (w === 2 && m === 1) prizeLevel = 7;
    else if (w === 1 && m === 1) prizeLevel = 8;
    else if (w === 0 && m === 1) prizeLevel = 9;
  }
  
  // EuroMillions规则
  else if (lotteryId === 'euromillions') {
    const [m, s] = matchCounts;
    if (m === 5 && s === 2) prizeLevel = 1;
    else if (m === 5 && s === 1) prizeLevel = 2;
    else if (m === 5 && s === 0) prizeLevel = 3;
    else if (m === 4 && s === 2) prizeLevel = 4;
    else if (m === 4 && s === 1) prizeLevel = 5;
    else if (m === 3 && s === 2) prizeLevel = 6;
    else if (m === 4 && s === 0) prizeLevel = 7;
    else if (m === 2 && s === 2) prizeLevel = 8;
    else if (m === 3 && s === 1) prizeLevel = 9;
    else if (m === 3 && s === 0) prizeLevel = 10;
    else if (m === 1 && s === 2) prizeLevel = 11;
    else if (m === 2 && s === 1) prizeLevel = 12;
    else if (m === 2 && s === 0) prizeLevel = 13;
  }
  
  return { prizeLevel, matchCounts };
}

/**
 * 分析购买结果统计
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {array} drawResult - 开奖结果
 * @param {array} tickets - 购买的彩票列表
 * @returns {object} 包含totalTickets、prizeStats、numberFrequency、hasDraw
 */
export function analyzePurchaseResults(lotteryId, drawResult, tickets) {
  const config = getLotteryConfig(lotteryId);
  const totalTickets = tickets.length;
  const maxLevel = config.prizes.length;
  const hasDraw = !!drawResult;
  
  // 初始化奖级统计
  const prizeStats = config.prizes.map(p => ({
    level: p.level,
    name: p.name,
    count: 0,
    percentage: '0.00'
  }));
  prizeStats.push({ level: 0, name: '未中奖', count: 0, percentage: '0.00' });
  
  // 如果有开奖结果，计算各奖级中奖注数
  if (hasDraw) {
    const levelCounts = new Array(maxLevel + 1).fill(0);
    
    for (const ticket of tickets) {
      const result = checkPrize(lotteryId, drawResult, ticket);
      levelCounts[result.prizeLevel]++;
    }
    
    for (const stat of prizeStats) {
      stat.count = levelCounts[stat.level];
      stat.percentage = totalTickets > 0 ? ((stat.count / totalTickets) * 100).toFixed(2) : '0.00';
    }
  }
  
  // 计算号码频率统计
  const numberFrequency = config.zones.map((zone, zoneIdx) => {
    const freq = {};
    // 初始化所有号码频率为0
    for (let n = zone.min; n <= zone.max; n++) freq[n] = 0;
    
    // 统计每张彩票中各号码出现次数
    for (const ticket of tickets) {
      for (const num of ticket[zoneIdx].numbers) {
        freq[num]++;
      }
    }
    
    // 转换为数组格式
    const entries = [];
    for (let n = zone.min; n <= zone.max; n++) {
      entries.push({
        number: n,
        count: freq[n],
        percentage: totalTickets > 0 ? ((freq[n] / totalTickets) * 100).toFixed(2) : '0.00'
      });
    }
    
    return { zoneName: zone.name, color: zone.color, entries };
  });
  
  return { totalTickets, prizeStats, numberFrequency, hasDraw };
}

/**
 * 计算组合数（从arr中选k个的组合）
 * 
 * @param {array} arr - 数组
 * @param {number} k - 选取数量
 * @returns {array} 所有组合的数组
 */
export function combinations(arr, k) {
  const result = [];
  
  function backtrack(start, current) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return result;
}

/**
 * 计算笛卡尔积
 * 
 * @param {array} arrays - 数组的数组
 * @returns {array} 笛卡尔积结果
 */
export function cartesianProduct(arrays) {
  return arrays.reduce((acc, arr) => {
    const result = [];
    for (const a of acc) {
      for (const v of arr) {
        result.push([...a, v]);
      }
    }
    return result;
  }, [[]]);
}

/**
 * 生成单张手动选择的彩票
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {array} selectedNumbers - 用户选择的号码
 * @returns {array} 彩票号码数组
 */
export function generateManualTicket(lotteryId, selectedNumbers) {
  const config = getLotteryConfig(lotteryId);
  
  return config.zones.map((zone, zi) => {
    const nums = selectedNumbers[zi] || [];
    let numbers;
    
    if (zone.repeatable) {
      // 可重复号码（如3D）
      if (Array.isArray(nums[0])) {
        numbers = nums.map(arr => arr[0]);
      } else {
        numbers = [...nums];
      }
    } else {
      // 不可重复号码，排序
      numbers = [...nums].sort((a, b) => a - b);
    }
    
    return { zoneName: zone.name, numbers, color: zone.color };
  });
}

/**
 * 生成多张复式彩票
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {array} selectedNumbers - 用户选择的号码数组
 * @returns {array} 所有组合的彩票数组
 */
export function generateMultipleTickets(lotteryId, selectedNumbers) {
  const config = getLotteryConfig(lotteryId);
  
  // 计算每个号码区的组合
  const zoneCombinations = config.zones.map((zone, zi) => {
    const nums = selectedNumbers[zi] || [];
    
    if (zone.repeatable) {
      // 可重复号码（如3D复式）
      if (Array.isArray(nums[0])) {
        const posArrays = nums.map(arr => arr);
        return cartesianProduct(posArrays).map(combo => ({ numbers: combo, zone }));
      } else {
        return [{ numbers: [...nums], zone }];
      }
    } else {
      // 不可重复号码的组合（如双色球复式）
      if (nums.length <= zone.count) {
        return [{ numbers: [...nums].sort((a, b) => a - b), zone }];
      }
      
      return combinations(nums, zone.count).map(combo => ({
        numbers: combo.sort((a, b) => a - b),
        zone
      }));
    }
  });
  
  // 计算所有号码区组合的笛卡尔积
  const ticketIndices = zoneCombinations.map(zc => zc.map((_, i) => i));
  const allIndexCombos = cartesianProduct(ticketIndices);
  
  // 生成最终的彩票数组
  return allIndexCombos.map(indices =>
    indices.map((idx, zi) => ({
      zoneName: zoneCombinations[zi][idx].zone.name,
      numbers: zoneCombinations[zi][idx].numbers,
      color: zoneCombinations[zi][idx].zone.color
    }))
  );
}

/**
 * 计算复式投注的注数
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {array} selectedCounts - 每个号码区选择的号码数量
 * @returns {number} 总注数
 */
export function calcBetCount(lotteryId, selectedCounts) {
  const config = getLotteryConfig(lotteryId);
  let total = 1;
  
  config.zones.forEach((zone, zi) => {
    const nums = selectedCounts[zi] || [];
    
    if (zone.repeatable) {
      // 可重复号码的组合数
      if (Array.isArray(nums[0])) {
        total *= nums.reduce((acc, arr) => acc * arr.length, 1);
      } else {
        total *= 1;
      }
    } else {
      // 不可重复号码的组合数 C(n,k)
      const n = nums.length;
      const k = zone.count;
      
      if (n < k) {
        total *= 0;
      } else {
        let c = 1;
        for (let i = 0; i < k; i++) {
          c = c * (n - i) / (i + 1);
        }
        total *= Math.round(c);
      }
    }
  });
  
  return total;
}

/**
 * 生成开奖号码（便捷函数）
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @returns {array} 开奖号码数组
 */
export function draw(lotteryId) {
  return drawOne(lotteryId);
}

/**
 * 模拟多次开奖
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {number} count - 模拟次数（最大10000次）
 * @returns {array|null} 开奖结果数组，超过10000次返回null
 */
export function simulate(lotteryId, count) {
  if (count <= 10000) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(drawOne(lotteryId));
    }
    return results;
  }
  return null;
}

/**
 * 生成购买彩票（随机）
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {number} count - 彩票数量
 * @returns {array} 彩票数组
 */
export function generatePurchases(lotteryId, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(drawOne(lotteryId, true));
  }
  return results;
}

/**
 * 生成带倍投的购买彩票
 * 
 * @param {string} lotteryId - 彩票类型ID
 * @param {number} count - 不同彩票数量
 * @param {number} multiplier - 倍投倍数（默认1）
 * @returns {array} 彩票数组（包含倍投）
 */
export function generatePurchasesWithMultiplier(lotteryId, count, multiplier = 1) {
  const results = [];
  
  // 先生成不重复的彩票
  const uniqueTickets = [];
  for (let i = 0; i < count; i++) {
    uniqueTickets.push(drawOne(lotteryId, true));
  }
  
  // 每个彩票重复multiplier次
  for (const ticket of uniqueTickets) {
    for (let i = 0; i < multiplier; i++) {
      results.push(ticket);
    }
  }
  
  return results;
}