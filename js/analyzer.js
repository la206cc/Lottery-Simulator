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

export function analyzeHotCold(results, lotteryId) {
  const config = getLotteryConfig(lotteryId);
  if (!config || !results.length) return [];

  const freqData = analyzeFrequency(results, lotteryId);

  return freqData.map(zone => {
    const entries = zone.entries.map(e => {
      const actual = parseFloat(e.percentage);
      const theoretical = parseFloat(e.theoreticalPercentage);
      let type;
      if (actual > theoretical * 1.2) type = 'hot';
      else if (actual < theoretical * 0.8) type = 'cold';
      else type = 'warm';
      return { ...e, type };
    });
    const hotCount = entries.filter(e => e.type === 'hot').length;
    const warmCount = entries.filter(e => e.type === 'warm').length;
    const coldCount = entries.filter(e => e.type === 'cold').length;
    return {
      zoneName: zone.zoneName,
      color: zone.color,
      entries,
      summary: { hot: hotCount, warm: warmCount, cold: coldCount }
    };
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
