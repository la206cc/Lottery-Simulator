export const LOTTERY_CONFIG = [
  {
    id: 'ssq',
    name: '双色球',
    currency: '¥',
    rules: '从1-33中选6个红球(不重复) + 从1-16中选1个蓝球',
    price: 2,
    zones: [
      { name: '红球', min: 1, max: 33, count: 6, repeatable: false, color: '#e74c3c' },
      { name: '蓝球', min: 1, max: 16, count: 1, repeatable: false, color: '#3498db' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 5000000, fixed: false, poolRatio: 0.75, matchPattern: [[6,1]], maxPerTicket: 5000000, maxTotal: 100000000 },
      { level: 2, name: '二等奖', amount: 0, fixed: false, poolRatio: 0.25, matchPattern: [[6,0]], maxPerTicket: 5000000, maxTotal: 7000000 },
      { level: 3, name: '三等奖', amount: 3000, fixed: true, matchPattern: [[5,1]] },
      { level: 4, name: '四等奖', amount: 200, fixed: true, matchPattern: [[5,0],[4,1]] },
      { level: 5, name: '五等奖', amount: 10, fixed: true, matchPattern: [[4,0],[3,1]] },
      { level: 6, name: '六等奖', amount: 5, fixed: true, matchPattern: [[2,1],[1,1],[0,1]] },
      { level: 7, name: '福运奖', amount: 5, fixed: true, matchPattern: [[3,0]], bonusPoolThreshold: 1500000000 }
    ],
    poolRatio: 0.51,
    poolTiers: [
      { min: 0, max: 99999999, name: '低奖池', firstPrizeRatio: 0.75 },
      { min: 100000000, max: 1499999999, name: '中奖池', firstPrizeRatio: 0.55, secondPartRatio: 0.20 },
      { min: 1500000000, max: Infinity, name: '高奖池', firstPrizeRatio: 0.55, secondPartRatio: 0.20, activateBonusPrize: true }
    ],
    bonusPrizeLevel: 7
  },
  {
    id: 'dlt',
    name: '大乐透',
    currency: '¥',
    rules: '从1-35中选5个前区号(不重复) + 从1-12中选2个后区号(不重复)',
    price: 2,
    canAddOn: true,
    addOnPrice: 1,
    zones: [
      { name: '前区', min: 1, max: 35, count: 5, repeatable: false, color: '#e74c3c' },
      { name: '后区', min: 1, max: 12, count: 2, repeatable: false, color: '#3498db' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 5000000, fixed: false, poolRatio: 0.78, matchPattern: [[5,2]], maxPerTicket: 10000000, maxAddOnPerTicket: 18000000, maxTotal: 10000000 },
      { level: 2, name: '二等奖', amount: 0, fixed: false, poolRatio: 0.22, matchPattern: [[5,1]], maxPerTicket: 5000000, maxAddOnPerTicket: 9000000, maxTotal: 10000000 },
      { level: 3, name: '三等奖', amount: 5000, fixed: true, matchPattern: [[5,0],[4,2]], highPoolAmount: 6666 },
      { level: 4, name: '四等奖', amount: 300, fixed: true, matchPattern: [[4,1]], highPoolAmount: 380 },
      { level: 5, name: '五等奖', amount: 150, fixed: true, matchPattern: [[4,0],[3,2]], highPoolAmount: 200 },
      { level: 6, name: '六等奖', amount: 15, fixed: true, matchPattern: [[3,1],[2,2]], highPoolAmount: 18 },
      { level: 7, name: '七等奖', amount: 5, fixed: true, matchPattern: [[3,0],[2,1],[1,2],[0,2]], highPoolAmount: 7 }
    ],
    poolRatio: 0.51,
    poolTiers: [
      { min: 0, max: 99999999, name: '低奖池', firstPrizeRatio: 0.78 },
      { min: 100000000, max: 799999999, name: '中奖池', firstPrizeRatio: 0.58, secondPartRatio: 0.20 },
      { min: 800000000, max: Infinity, name: '高奖池', firstPrizeRatio: 0.20, secondPartRatio: 0.50, activateHighPoolBonus: true }
    ]
  },
  {
    id: 'fc3d',
    name: '福彩3D',
    currency: '¥',
    rules: '从0-9中选3个数字（可重复）',
    price: 2,
    zones: [
      { name: '号码', min: 0, max: 9, count: 3, repeatable: true, color: '#f39c12' }
    ],
    prizes: [
      { level: 1, name: '直选', amount: 1040, fixed: true, matchPattern: [[3]], prizeType: 'straight' },
      { level: 2, name: '组三', amount: 346, fixed: true, matchPattern: [[3]], prizeType: 'group3' },
      { level: 3, name: '组六', amount: 173, fixed: true, matchPattern: [[3]], prizeType: 'group6' }
    ],
    poolRatio: 0.53
  },
  {
    id: 'qxc',
    name: '七星彩',
    currency: '¥',
    rules: '前区选6位数字(0-9可重复) + 后区选1位数字(0-14)',
    price: 2,
    zones: [
      { name: '前区', min: 0, max: 9, count: 6, repeatable: true, color: '#e74c3c' },
      { name: '后区', min: 0, max: 14, count: 1, repeatable: true, color: '#3498db' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 5000000, fixed: false, poolRatio: 0.90, matchPattern: [[6,1]] },
      { level: 2, name: '二等奖', amount: 0, fixed: false, poolRatio: 0.10, matchPattern: [[6,0]] },
      { level: 3, name: '三等奖', amount: 3000, fixed: true, matchPattern: [[5,1]] },
      { level: 4, name: '四等奖', amount: 500, fixed: true, matchPattern: [[5,0],[4,1]] },
      { level: 5, name: '五等奖', amount: 30, fixed: true, matchPattern: [[4,0],[3,1]] },
      { level: 6, name: '六等奖', amount: 5, fixed: true, matchPattern: [[3,0],[2,1],[1,1],[0,1]] }
    ],
    poolRatio: 0.50
  },
  {
    id: 'pls',
    name: '排列三',
    currency: '¥',
    rules: '从0-9中选3个数字（可重复）',
    price: 2,
    zones: [
      { name: '号码', min: 0, max: 9, count: 3, repeatable: true, color: '#f39c12' }
    ],
    prizes: [
      { level: 1, name: '直选', amount: 1040, fixed: true, matchPattern: [[3]], prizeType: 'straight' },
      { level: 2, name: '组三', amount: 346, fixed: true, matchPattern: [[3]], prizeType: 'group3' },
      { level: 3, name: '组六', amount: 173, fixed: true, matchPattern: [[3]], prizeType: 'group6' }
    ],
    poolRatio: 0.53
  },
  {
    id: 'plw',
    name: '排列五',
    currency: '¥',
    rules: '从0-9中选5个数字（可重复）',
    price: 2,
    zones: [
      { name: '号码', min: 0, max: 9, count: 5, repeatable: true, color: '#f39c12' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 100000, fixed: true, matchPattern: [[5]] }
    ],
    poolRatio: 0.50
  },
  {
    id: 'qlc',
    name: '七乐彩',
    currency: '¥',
    rules: '从1-30中选7个号码(不重复)，开奖另摇1个特别号',
    price: 2,
    zones: [
      { name: '基本号', min: 1, max: 30, count: 7, repeatable: false, color: '#e74c3c' }
    ],
    drawZones: [
      { name: '基本号', min: 1, max: 30, count: 7, repeatable: false, color: '#e74c3c' },
      { name: '特别号', min: 1, max: 30, count: 1, repeatable: false, color: '#9b59b6', excludeZone: 0 }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 5000000, fixed: false, poolRatio: 0.70, matchPattern: [[7]] },
      { level: 2, name: '二等奖', amount: 0, fixed: false, poolRatio: 0.10, matchPattern: [[6,1]] },
      { level: 3, name: '三等奖', amount: 0, fixed: false, poolRatio: 0.20, matchPattern: [[6,0]] },
      { level: 4, name: '四等奖', amount: 200, fixed: true, matchPattern: [[5,1]] },
      { level: 5, name: '五等奖', amount: 50, fixed: true, matchPattern: [[5,0]] },
      { level: 6, name: '六等奖', amount: 10, fixed: true, matchPattern: [[4,1]] },
      { level: 7, name: '七等奖', amount: 5, fixed: true, matchPattern: [[4,0]] }
    ],
    poolRatio: 0.50
  },
  {
    id: 'kl8',
    name: '快乐8',
    currency: '¥',
    rules: '从1-80中选10个号码，开奖从1-80中摇出20个号码',
    price: 2,
    zones: [
      { name: '选号', min: 1, max: 80, count: 10, repeatable: false, color: '#e67e22' }
    ],
    drawZones: [
      { name: '开奖号', min: 1, max: 80, count: 20, repeatable: false, color: '#2ecc71' }
    ],
    prizes: [
      { level: 1, name: '选十中十', amount: 5000000, fixed: false, poolRatio: 0.60, matchPattern: [[10]], maxPerTicket: 5000000 },
      { level: 2, name: '选十中九', amount: 8000, fixed: true, matchPattern: [[9]] },
      { level: 3, name: '选十中八', amount: 720, fixed: true, matchPattern: [[8]] },
      { level: 4, name: '选十中七', amount: 80, fixed: true, matchPattern: [[7]] },
      { level: 5, name: '选十中六', amount: 5, fixed: true, matchPattern: [[6]] },
      { level: 6, name: '选十中五', amount: 3, fixed: true, matchPattern: [[5]] },
      { level: 7, name: '选十中零', amount: 2, fixed: true, matchPattern: [[0]] }
    ],
    poolRatio: 0.58,
    maxJackpotPerTicket: 5000000
  }
];

export function getLotteryConfig(id) {
  return LOTTERY_CONFIG.find(c => c.id === id);
}
