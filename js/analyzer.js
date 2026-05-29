import { getLotteryConfig } from './lottery-config.js';

function getAnalysisZones(config) {
  return config.drawZones || config.zones;
}

export function analyzeFrequency(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const freq = {};
    for (let n = zone.min; n <= zone.max; n++) freq[n] = 0;
    const totalSlots = results.length * zone.count;
    results.forEach(r => {
      r[zi].numbers.forEach(n => { freq[n]++; });
    });
    const entries = Object.entries(freq).map(([num, count]) => ({
      number: parseInt(num),
      count,
      percentage: (count / totalSlots * 100).toFixed(2),
      theoreticalPercentage: (1 / (zone.max - zone.min + 1) * 100).toFixed(2)
    }));
    return { zoneName: zone.name, color: zone.color, entries };
  });
}

export function analyzeMissing(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const missing = {};
    for (let n = zone.min; n <= zone.max; n++) {
      let currentMissing = 0;
      let maxMissing = 0;
      let tempMissing = 0;
      let appearCount = 0;
      let gaps = [];

      for (let i = 0; i < results.length; i++) {
        const nums = results[i][zi].numbers;
        if (nums.includes(n)) {
          if (appearCount > 0) gaps.push(tempMissing);
          if (i === 0) currentMissing = 0;
          tempMissing = 0;
          appearCount++;
        } else {
          tempMissing++;
          if (tempMissing > maxMissing) maxMissing = tempMissing;
        }
      }

      currentMissing = tempMissing;
      const avgMissing = gaps.length > 0 ? (gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;

      missing[n] = {
        number: n,
        currentMissing,
        maxMissing,
        avgMissing: parseFloat(avgMissing.toFixed(2))
      };
    }
    return { zoneName: zone.name, color: zone.color, entries: Object.values(missing) };
  });
}

export function analyzeOddEven(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const ratioCount = {};
    results.forEach(r => {
      const nums = r[zi].numbers;
      const odd = nums.filter(n => n % 2 !== 0).length;
      const even = nums.length - odd;
      const key = `${odd}:${even}`;
      ratioCount[key] = (ratioCount[key] || 0) + 1;
    });

    const entries = Object.entries(ratioCount)
      .map(([ratio, count]) => ({ ratio, count, percentage: (count / results.length * 100).toFixed(2) }))
      .sort((a, b) => b.count - a.count);

    return { zoneName: zone.name, color: zone.color, entries };
  });
}

export function analyzeSum(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const sumCount = {};
    results.forEach(r => {
      const sum = r[zi].numbers.reduce((a, b) => a + b, 0);
      sumCount[sum] = (sumCount[sum] || 0) + 1;
    });

    const entries = Object.entries(sumCount)
      .map(([sum, count]) => ({ sum: parseInt(sum), count }))
      .sort((a, b) => a.sum - b.sum);

    return { zoneName: zone.name, color: zone.color, entries };
  });
}

export function analyzeConsecutive(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return {};

  const hasConsecutiveCount = { total: 0 };
  const groupCountDist = {};

  results.forEach(r => {
    let totalGroups = 0;
    getAnalysisZones(config).forEach((zone, zi) => {
      if (zone.repeatable) return;
      const sorted = [...r[zi].numbers].sort((a, b) => a - b);
      let groups = 0;
      let inGroup = false;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === 1) {
          if (!inGroup) { groups++; inGroup = true; }
        } else {
          inGroup = false;
        }
      }
      totalGroups += groups;
    });

    if (totalGroups > 0) hasConsecutiveCount.total++;
    groupCountDist[totalGroups] = (groupCountDist[totalGroups] || 0) + 1;
  });

  const groupEntries = Object.entries(groupCountDist)
    .map(([groups, count]) => ({ groups: parseInt(groups), count, percentage: (count / results.length * 100).toFixed(2) }))
    .sort((a, b) => a.groups - b.groups);

  return {
    hasConsecutivePercentage: (hasConsecutiveCount.total / results.length * 100).toFixed(2),
    groupDistribution: groupEntries
  };
}

export function analyzeRangeDistribution(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    if (zone.repeatable) {
      return { zoneName: zone.name, color: zone.color, ranges: [], entries: [] };
    }

    const rangeSize = Math.ceil((zone.max - zone.min + 1) / 3);
    const ranges = [];
    for (let i = 0; i < 3; i++) {
      const start = zone.min + i * rangeSize;
      const end = Math.min(zone.min + (i + 1) * rangeSize - 1, zone.max);
      ranges.push({ start, end, label: `${start}-${end}` });
    }

    const dist = ranges.map(r => ({ ...r, count: 0 }));
    results.forEach(r => {
      r[zi].numbers.forEach(n => {
        const idx = ranges.findIndex(rng => n >= rng.start && n <= rng.end);
        if (idx >= 0) dist[idx].count++;
      });
    });

    const entries = dist.map(d => ({
      label: d.label,
      count: d.count,
      percentage: (d.count / (results.length * zone.count / 3) * 100).toFixed(2)
    }));

    return { zoneName: zone.name, color: zone.color, ranges, entries };
  });
}

export function analyzeBigSmall(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const mid = Math.floor((zone.min + zone.max) / 2);
    const ratioCount = {};
    results.forEach(r => {
      const nums = r[zi].numbers;
      let big = 0, small = 0;
      nums.forEach(n => {
        if (n > mid) big++;
        else small++;
      });
      const key = `${big}:${small}`;
      ratioCount[key] = (ratioCount[key] || 0) + 1;
    });

    const entries = Object.entries(ratioCount)
      .map(([ratio, count]) => ({ ratio, count, percentage: (count / results.length * 100).toFixed(2) }))
      .sort((a, b) => b.count - a.count);

    return { zoneName: zone.name, color: zone.color, mid, entries };
  });
}

export function analyze012Road(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const roadCount = { 0: 0, 1: 0, 2: 0 };
    const ratioCount = {};
    results.forEach(r => {
      const nums = r[zi].numbers;
      const roads = nums.map(n => n % 3);
      roads.forEach(r => roadCount[r]++);
      const r0 = roads.filter(r => r === 0).length;
      const r1 = roads.filter(r => r === 1).length;
      const r2 = roads.filter(r => r === 2).length;
      const key = `${r0}:${r1}:${r2}`;
      ratioCount[key] = (ratioCount[key] || 0) + 1;
    });

    const total = results.length * zone.count;
    const roadEntries = Object.entries(roadCount)
      .map(([road, count]) => ({ 
        road, 
        count, 
        percentage: (count / total * 100).toFixed(2),
        theoreticalPercentage: (1 / 3 * 100).toFixed(2)
      }));

    const ratioEntries = Object.entries(ratioCount)
      .map(([ratio, count]) => ({ ratio, count, percentage: (count / results.length * 100).toFixed(2) }))
      .sort((a, b) => b.count - a.count);

    return { zoneName: zone.name, color: zone.color, roadEntries, ratioEntries };
  });
}

export function analyzeSpan(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const spanCount = {};
    results.forEach(r => {
      const nums = r[zi].numbers;
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const span = max - min;
      spanCount[span] = (spanCount[span] || 0) + 1;
    });

    const entries = Object.entries(spanCount)
      .map(([span, count]) => ({ span: parseInt(span), count }))
      .sort((a, b) => a.span - b.span);

    return { zoneName: zone.name, color: zone.color, entries };
  });
}

export function analyzeRepeat(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length || results.length < 2) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const repeatCount = {};
    for (let i = 1; i < results.length; i++) {
      const prev = new Set(results[i - 1][zi].numbers);
      const curr = results[i][zi].numbers;
      const repeats = curr.filter(n => prev.has(n)).length;
      repeatCount[repeats] = (repeatCount[repeats] || 0) + 1;
    }

    const entries = Object.entries(repeatCount)
      .map(([repeats, count]) => ({ repeats: parseInt(repeats), count, percentage: (count / (results.length - 1) * 100).toFixed(2) }))
      .sort((a, b) => a.repeats - b.repeats);

    return { zoneName: zone.name, color: zone.color, entries };
  });
}

export function analyzeNeighbor(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length || results.length < 2) return [];

  return getAnalysisZones(config).map((zone, zi) => {
    const neighborCount = {};
    for (let i = 1; i < results.length; i++) {
      const prev = new Set(results[i - 1][zi].numbers);
      const curr = results[i][zi].numbers;
      let neighbors = 0;
      curr.forEach(n => {
        if (prev.has(n - 1) || prev.has(n + 1)) {
          neighbors++;
        }
      });
      neighborCount[neighbors] = (neighborCount[neighbors] || 0) + 1;
    }

    const entries = Object.entries(neighborCount)
      .map(([neighbors, count]) => ({ neighbors: parseInt(neighbors), count, percentage: (count / (results.length - 1) * 100).toFixed(2) }))
      .sort((a, b) => a.neighbors - b.neighbors);

    return { zoneName: zone.name, color: zone.color, entries };
  });
}
