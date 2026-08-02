/*
 * V3.0 彩票模拟器 - 8种彩种参数预设数据
 * 数据来源: docs/玩法规则/投注模拟参数/ + 完整参数系统设计
 */

const LOTTERY_PARAMS = {

  ssq: {
    meta: {
      id: 'ssq', name: '双色球', pricePerBet: 2,
      zones: [
        { name: '红球', min: 1, max: 33, count: 6, repeatable: false, sorted: true, color: 'red', allowDanTuo: true },
        { name: '蓝球', min: 1, max: 16, count: 1, repeatable: false, sorted: false, color: 'blue', allowDanTuo: false }
      ],
      hasPlayTypes: false, hasAddOn: false, hasKL8: false
    },
    frequency:  { low: 50, mid: 38, high: 12 },
    betType:    { single: 60, complex: 30, dantuo: 10 },
    multiplier: { x1: 75, x2_5: 20, x6_20: 4.5, x20plus: 0.5 },
    baseSales: 50
  },

  dlt: {
    meta: {
      id: 'dlt', name: '超级大乐透', pricePerBet: 2,
      zones: [
        { name: '前区', min: 1, max: 35, count: 5, repeatable: false, sorted: true, color: 'red', allowDanTuo: true },
        { name: '后区', min: 1, max: 12, count: 2, repeatable: false, sorted: true, color: 'blue', allowDanTuo: true }
      ],
      hasPlayTypes: false, hasAddOn: true, hasKL8: false
    },
    frequency:  { low: 50, mid: 40, high: 10 },
    betType:    { single: 55, complex: 35, dantuo: 10 },
    multiplier: { x1: 78, x2_5: 18, x6_20: 3.5, x20plus: 0.5 },
    addOn: 40,
    baseSales: 60
  },

  fc3d: {
    meta: {
      id: 'fc3d', name: '福彩3D', pricePerBet: 2,
      zones: [
        { name: '百位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '十位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '个位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' }
      ],
      hasPlayTypes: true, hasAddOn: false, hasKL8: false,
      playTypes: ['direct', 'group3', 'group6']
    },
    frequency:  { low: 50, mid: 35, high: 15 },
    betType:    { single: 40, complex: 50, dantuo: 10 },
    multiplier: { x1: 70, x2_5: 25, x6_20: 4.5, x20plus: 0.5 },
    baseSales: 25
  },

  pls: {
    meta: {
      id: 'pls', name: '排列三', pricePerBet: 2,
      zones: [
        { name: '百位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '十位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '个位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' }
      ],
      hasPlayTypes: true, hasAddOn: false, hasKL8: false,
      playTypes: ['direct', 'group3', 'group6']
    },
    frequency:  { low: 50, mid: 35, high: 15 },
    betType:    { single: 40, complex: 50, dantuo: 10 },
    multiplier: { x1: 70, x2_5: 25, x6_20: 4.5, x20plus: 0.5 },
    baseSales: 25
  },

  plw: {
    meta: {
      id: 'plw', name: '排列五', pricePerBet: 2,
      zones: [
        { name: '万位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '千位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '百位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '十位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '个位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' }
      ],
      hasPlayTypes: false, hasAddOn: false, hasKL8: false,
      noComplex: true
    },
    frequency:  { low: 50, mid: 40, high: 10 },
    betType:    { single: 100, complex: 0, dantuo: 0 },
    multiplier: { x1: 80, x2_5: 17, x6_20: 2.5, x20plus: 0.5 },
    baseSales: 15
  },

  qxc: {
    meta: {
      id: 'qxc', name: '七星彩', pricePerBet: 2,
      zones: [
        { name: '第1位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '第2位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '第3位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '第4位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '第5位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '第6位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'red' },
        { name: '第7位', min: 0, max: 9, count: 1, repeatable: true, sorted: false, color: 'blue' }
      ],
      hasPlayTypes: false, hasAddOn: false, hasKL8: false
    },
    frequency:  { low: 55, mid: 37, high: 8 },
    betType:    { single: 70, complex: 25, dantuo: 5 },
    multiplier: { x1: 82, x2_5: 15, x6_20: 2.5, x20plus: 0.5 },
    baseSales: 20
  },

  qlc: {
    meta: {
      id: 'qlc', name: '七乐彩', pricePerBet: 2,
      zones: [
        { name: '基本号', min: 1, max: 30, count: 7, repeatable: false, sorted: true, color: 'red', allowDanTuo: true }
      ],
      hasPlayTypes: false, hasAddOn: false, hasKL8: false
    },
    frequency:  { low: 55, mid: 38, high: 7 },
    betType:    { single: 60, complex: 28, dantuo: 12 },
    multiplier: { x1: 85, x2_5: 13, x6_20: 1.8, x20plus: 0.2 },
    baseSales: 8
  },

  kl8: {
    meta: {
      id: 'kl8', name: '快乐8', pricePerBet: 2,
      zones: [
        { name: '选号', min: 1, max: 80, count: 10, repeatable: false, sorted: true, color: 'red', allowDanTuo: true }
      ],
      hasPlayTypes: false, hasAddOn: false, hasKL8: true,
      kl8Weights: {
        L: { k1: 8, k2: 16, k3: 28, k4: 48 },
        M: { k5: 33, k6: 30, k7: 20, k8: 17 },
        H: { k9: 33, k10: 67 }
      },
      kl8Default: { L: 25, M: 60, H: 15 }
    },
    frequency:  { low: 50, mid: 35, high: 15 },
    betType:    { single: 70, complex: 25, dantuo: 5 },
    multiplier: { x1: 75, x2_5: 20, x6_20: 4, x20plus: 1 },
    kl8Selects: { L: 25, M: 60, H: 15 },
    baseSales: 100
  }
};

// 获取彩种默认参数
function getDefaultParams(lotteryId) {
  const p = LOTTERY_PARAMS[lotteryId];
  if (!p) return null;
  return JSON.parse(JSON.stringify(p));
}

// 获取彩种元信息
function getLotteryMeta(lotteryId) {
  const p = LOTTERY_PARAMS[lotteryId];
  return p ? p.meta : null;
}

// 获取所有预设列表
function getPresetList() {
  return Object.values(LOTTERY_PARAMS).map(p => ({
    id: p.meta.id,
    name: p.meta.name
  }));
}
