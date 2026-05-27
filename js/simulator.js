import { getLotteryConfig } from './lottery-config.js';

function fisherYatesPick(min, max, count) {
  const pool = [];
  for (let i = min; i <= max; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

function randomPick(min, max, count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return result;
}

function drawOne(lotteryId, forPurchase) {
  const config = getLotteryConfig(lotteryId);
  if (!config) return null;
  const results = [];
  if (forPurchase || !config.drawZones) {
    config.zones.forEach(zone => {
      let excluded = [];
      if (zone.excludeZone !== undefined && results[zone.excludeZone]) {
        excluded = results[zone.excludeZone].numbers;
      }
      let numbers;
      if (zone.repeatable) {
        numbers = randomPick(zone.min, zone.max, zone.count);
      } else {
        const pool = [];
        for (let i = zone.min; i <= zone.max; i++) {
          if (!excluded.includes(i)) pool.push(i);
        }
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        numbers = pool.slice(0, zone.count).sort((a, b) => a - b);
      }
      results.push({ zoneName: zone.name, numbers, color: zone.color });
    });
  }
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

function simulateBatch(lotteryId, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(drawOne(lotteryId));
  }
  return results;
}

export function draw(lotteryId) {
  return drawOne(lotteryId);
}

export function simulate(lotteryId, count) {
  if (count <= 10000) {
    return simulateBatch(lotteryId, count);
  }
  return null;
}

export function startWorkerSimulation(lotteryId, count, onProgress, onComplete) {
  const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

  worker.onmessage = function (e) {
    const msg = e.data;
    if (msg.type === 'progress') {
      if (onProgress) onProgress(msg.current, msg.total);
    } else if (msg.type === 'complete') {
      worker.terminate();
      if (onComplete) onComplete(msg.results);
    } else if (msg.type === 'cancelled') {
      worker.terminate();
    }
  };

  worker.postMessage({ type: 'start', lotteryId, count });

  return {
    cancel() {
      worker.postMessage({ type: 'cancel' });
    }
  };
}

export function generatePurchases(lotteryId, count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(drawOne(lotteryId, true));
  }
  return results;
}

export function checkPrize(lotteryId, drawResult, ticketResult) {
  const groupLotteries = ['fc3d', 'pls'];
  if (groupLotteries.includes(lotteryId)) {
    const drawNums = drawResult[0].numbers;
    const ticketNums = ticketResult[0].numbers;
    let posMatch = 0;
    for (let i = 0; i < drawNums.length; i++) {
      if (drawNums[i] === ticketNums[i]) posMatch++;
    }
    if (posMatch === drawNums.length) return { prizeLevel: 1, matchCounts: [posMatch] };
    const drawSorted = [...drawNums].sort().join('');
    const ticketSorted = [...ticketNums].sort().join('');
    if (drawSorted === ticketSorted) {
      const uniqueDraw = new Set(drawNums);
      return { prizeLevel: uniqueDraw.size === 2 ? 2 : 3, matchCounts: [posMatch] };
    }
    return { prizeLevel: 0, matchCounts: [posMatch] };
  }

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

  if (lotteryId === 'kl8') {
    const ticketSet = new Set(ticketResult[0].numbers);
    const drawSet = new Set(drawResult[0].numbers);
    let hits = 0;
    for (const n of ticketSet) {
      if (drawSet.has(n)) hits++;
    }
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

  if (lotteryId === 'qxc') {
    let frontMatch = 0;
    for (let i = 0; i < drawResult[0].numbers.length; i++) {
      if (drawResult[0].numbers[i] === ticketResult[0].numbers[i]) frontMatch++;
    }
    const backMatch = drawResult[1].numbers[0] === ticketResult[1].numbers[0] ? 1 : 0;
    let prizeLevel = 0;
    if (frontMatch === 6 && backMatch === 1) prizeLevel = 1;
    else if (frontMatch === 6 && backMatch === 0) prizeLevel = 2;
    else if (frontMatch === 5 && backMatch === 1) prizeLevel = 3;
    else if ((frontMatch === 5 && backMatch === 0) || (frontMatch === 4 && backMatch === 1)) prizeLevel = 4;
    else if ((frontMatch === 4 && backMatch === 0) || (frontMatch === 3 && backMatch === 1)) prizeLevel = 5;
    else if ((frontMatch === 3 && backMatch === 0) || (frontMatch === 2 && backMatch === 1) || (frontMatch === 1 && backMatch === 1) || (frontMatch === 0 && backMatch === 1)) prizeLevel = 6;
    return { prizeLevel, matchCounts: [frontMatch, backMatch] };
  }

  if (lotteryId === 'qlc') {
    const mainDrawSet = new Set(drawResult[0].numbers);
    const specialNum = drawResult[1].numbers[0];
    let mainMatch = 0;
    let specialMatch = false;
    for (const n of ticketResult[0].numbers) {
      if (mainDrawSet.has(n)) mainMatch++;
      if (n === specialNum) specialMatch = true;
    }
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

  const matchCounts = drawResult.map((zone, idx) => {
    const drawSet = new Set(zone.numbers);
    let count = 0;
    for (const n of ticketResult[idx].numbers) {
      if (drawSet.has(n)) count++;
    }
    return count;
  });

  let prizeLevel = 0;
  if (lotteryId === 'ssq') {
    const [r, b] = matchCounts;
    if (r === 6 && b === 1) prizeLevel = 1;
    else if (r === 6 && b === 0) prizeLevel = 2;
    else if (r === 5 && b === 1) prizeLevel = 3;
    else if ((r === 5 && b === 0) || (r === 4 && b === 1)) prizeLevel = 4;
    else if ((r === 4 && b === 0) || (r === 3 && b === 1)) prizeLevel = 5;
    else if ((r === 2 && b === 1) || (r === 1 && b === 1) || (r === 0 && b === 1)) prizeLevel = 6;
  } else if (lotteryId === 'dlt') {
    const [f, b] = matchCounts;
    if (f === 5 && b === 2) prizeLevel = 1;
    else if (f === 5 && b === 1) prizeLevel = 2;
    else if ((f === 5 && b === 0) || (f === 4 && b === 2)) prizeLevel = 3;
    else if (f === 4 && b === 1) prizeLevel = 4;
    else if ((f === 4 && b === 0) || (f === 3 && b === 2)) prizeLevel = 5;
    else if ((f === 3 && b === 1) || (f === 2 && b === 2)) prizeLevel = 6;
    else if ((f === 3 && b === 0) || (f === 2 && b === 1) || (f === 1 && b === 2) || (f === 0 && b === 2)) prizeLevel = 7;
  } else if (lotteryId === 'powerball') {
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
  } else if (lotteryId === 'megamillions') {
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
  } else if (lotteryId === 'euromillions') {
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

export function analyzePurchaseResults(lotteryId, drawResult, tickets) {
  const config = getLotteryConfig(lotteryId);
  const totalTickets = tickets.length;
  const maxLevel = config.prizes.length;
  const hasDraw = !!drawResult;

  const prizeStats = config.prizes.map(p => ({
    level: p.level,
    name: p.name,
    count: 0,
    percentage: '0.00'
  }));
  prizeStats.push({ level: 0, name: '未中奖', count: 0, percentage: '0.00' });

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

  const numberFrequency = config.zones.map((zone, zoneIdx) => {
    const freq = {};
    for (let n = zone.min; n <= zone.max; n++) freq[n] = 0;
    for (const ticket of tickets) {
      for (const num of ticket[zoneIdx].numbers) {
        freq[num]++;
      }
    }
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

function combinations(arr, k) {
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

function cartesianProduct(arrays) {
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

export function generateManualTicket(lotteryId, selectedNumbers) {
  const config = getLotteryConfig(lotteryId);
  return config.zones.map((zone, zi) => {
    const nums = selectedNumbers[zi] || [];
    let numbers;
    if (zone.repeatable) {
      if (Array.isArray(nums[0])) {
        numbers = nums.map(arr => arr[0]);
      } else {
        numbers = [...nums];
      }
    } else {
      numbers = [...nums].sort((a, b) => a - b);
    }
    return { zoneName: zone.name, numbers, color: zone.color };
  });
}

export function generateMultipleTickets(lotteryId, selectedNumbers) {
  const config = getLotteryConfig(lotteryId);
  const zoneCombinations = config.zones.map((zone, zi) => {
    const nums = selectedNumbers[zi] || [];
    if (zone.repeatable) {
      if (Array.isArray(nums[0])) {
        const posArrays = nums.map(arr => arr);
        return cartesianProduct(posArrays).map(combo => ({ numbers: combo, zone }));
      } else {
        return [{ numbers: [...nums], zone }];
      }
    } else {
      if (nums.length <= zone.count) {
        return [{ numbers: [...nums].sort((a, b) => a - b), zone }];
      }
      return combinations(nums, zone.count).map(combo => ({
        numbers: combo.sort((a, b) => a - b),
        zone
      }));
    }
  });

  const ticketIndices = zoneCombinations.map(zc => zc.map((_, i) => i));
  const allIndexCombos = cartesianProduct(ticketIndices);

  return allIndexCombos.map(indices =>
    indices.map((idx, zi) => ({
      zoneName: zoneCombinations[zi][idx].zone.name,
      numbers: zoneCombinations[zi][idx].numbers,
      color: zoneCombinations[zi][idx].zone.color
    }))
  );
}

export function calcBetCount(lotteryId, selectedCounts) {
  const config = getLotteryConfig(lotteryId);
  let total = 1;
  config.zones.forEach((zone, zi) => {
    const nums = selectedCounts[zi] || [];
    if (zone.repeatable) {
      if (Array.isArray(nums[0])) {
        total *= nums.reduce((acc, arr) => acc * arr.length, 1);
      } else {
        total *= 1;
      }
    } else {
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
