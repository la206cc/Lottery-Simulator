/**
 * 彩票配置模块
 * 包含所有支持的彩票类型配置信息，包括规则、奖级、奖池配置等
 */

/**
 * 彩票配置数组
 * 每个彩票类型包含以下字段：
 * - id: 彩票唯一标识
 * - name: 彩票名称
 * - currency: 货币符号
 * - rules: 玩法规则描述
 * - price: 单注价格（元）
 * - canAddOn: 是否支持追加投注
 * - addOnPrice: 追加投注价格（元）
 * - zones: 号码区配置（红球区、蓝球区等）
 * - prizes: 奖级配置（奖级、名称、金额、是否固定奖等）
 * - poolRatio: 奖池比例（销售额的百分比进入奖池）
 * - poolTiers: 奖池分档配置（不同奖池金额区间的分配比例）
 */
export const LOTTERY_CONFIG = [
  {
    id: 'ssq',
    name: '双色球',
    currency: '¥',
    rules: '从1-33中选6个红球(不重复) + 从1-16中选1个蓝球\n双色球每周二、四、日开奖\n彩票奖金：销售额×51%（49%当期奖金+2%调节基金）\n一等奖(浮动)：6红+1蓝全中，单注封顶500万-1000万\n二等奖(浮动)：6红全中，单注封顶500万\n三等奖(固定)：5红+1蓝，3000元\n四等奖(固定)：5红或4红+1蓝，200元\n五等奖(固定)：4红或3红+1蓝，10元\n六等奖(固定)：1蓝，5元\n福运奖(固定)：奖池≥15亿时，3红即中5元\n一等奖：奖池<1亿=浮动75%+奖池(封顶500万)；1-15亿=两部分(55%+池+20%)(合计封顶1000万)；≥15亿=两部分(池+20%)(合计封顶1000万)\n二等奖：常规期=浮动25%(封顶500万)；特别期(≥15亿)=浮动80%(封顶500万)\n一等奖总额封顶1亿，二等奖总额封顶7000万',
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
      { min: 1500000000, max: Infinity, name: '特别期', firstPrizeRatio: 0, secondPartRatio: 0.20, activateBonusPrize: true, secondPrizeRatio: 0.80 }
    ],
    bonusPrizeLevel: 7
  },
  {
    id: 'dlt',
    name: '大乐透',
    currency: '¥',
    rules: '从1-35中选5个前区号(不重复) + 从1-12中选2个后区号(不重复)\n每周一、三、六开奖，可追加投注(+1元)\n彩票奖金：销售额×51%（49%当期奖金+2%调节基金）\n一等奖(浮动)：5前+2后全中，基本单注封顶1000万(追加800万)，总额封顶1亿\n二等奖(浮动)：5前+1后，单注封顶500万，总额封顶1亿\n三等奖：5前或4前+2后，5000元(奖池≥8亿时6666元)\n四等奖：4前+1后，300元(奖池≥8亿时380元)\n五等奖：4前或3前+2后，150元(奖池≥8亿时200元)\n六等奖：3前+1后或2前+2后，15元(奖池≥8亿时18元)\n七等奖：3前或2前+1后或1前+2后或2后，5元(奖池≥8亿时7元)\n奖池<1亿：一等奖=浮动78%+池(封顶500万)；1-8亿：两部分(58%+池+20%)(封顶1000万)；≥8亿：两部分(28%+池+50%)(封顶1000万)\n追加投注中浮动奖额获基本奖金80%，按0.8注计算',
    price: 2,
    canAddOn: true,
    addOnPrice: 1,
    zones: [
      { name: '前区', min: 1, max: 35, count: 5, repeatable: false, color: '#e74c3c' },
      { name: '后区', min: 1, max: 12, count: 2, repeatable: false, color: '#3498db' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 0, fixed: false, poolRatio: 0.78, matchPattern: [[5,2]], maxPerTicket: 10000000, maxAddOnPerTicket: 18000000, maxTotal: 100000000 },
      { level: 2, name: '二等奖', amount: 0, fixed: false, poolRatio: 0.22, matchPattern: [[5,1]], maxPerTicket: 5000000, maxAddOnPerTicket: 9000000, maxTotal: 100000000 },
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
      { min: 800000000, max: Infinity, name: '高奖池', firstPrizeRatio: 0.28, secondPartRatio: 0.50, activateHighPoolBonus: true, secondPrizeRatio: 0.40 }
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
    rules: '前区选6位数字(0-9可重复) + 后区选1位数字(0-14)\n每周二、五、日开奖，按位匹配\n彩票奖金：销售额×50%（49%当期奖金+1%调节基金）\n一等奖(浮动)：7位全中，单注封顶500万\n二等奖(浮动)：前6位全中，单注封顶500万\n三等奖(固定)：前5位+后1位中，3000元\n四等奖(固定)：任意5位中，500元\n五等奖(固定)：任意4位中，30元\n六等奖(固定)：任意3位中或前1位+后1位中或仅后1位中，5元\n奖池≤3亿：一等奖=浮动90%+池；奖池>3亿（倒置）：一等奖=浮动10%+池，二等奖=浮动90%',
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
    poolRatio: 0.50,
    poolTiers: [
      { min: 0, max: 300000000, name: '正常期', firstPrizeRatio: 0.90 },
      { min: 300000001, max: Infinity, name: '倒置期', firstPrizeRatio: 0.10, secondPartRatio: 0.90 }
    ]
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
    rules: '从1-30中选7个号码(不重复)，开奖另摇1个特别号\n每周一、三、五开奖\n彩票奖金：销售额×50%（49%当期奖金+1%调节基金）\n一等奖(浮动)：7个基本号全中，高奖基数×70%，单注封顶500万\n二等奖(浮动)：6基本+特别号，高奖基数×10%\n三等奖(浮动)：6基本号，高奖基数×20%\n四等奖(固定)：5基本+特别号，200元\n五等奖(固定)：5基本号，60元\n六等奖(固定)：4基本+特别号，12元\n七等奖(固定)：4基本号，10元',
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
      { level: 5, name: '五等奖', amount: 60, fixed: true, matchPattern: [[5,0]] },
      { level: 6, name: '六等奖', amount: 12, fixed: true, matchPattern: [[4,1]] },
      { level: 7, name: '七等奖', amount: 10, fixed: true, matchPattern: [[4,0]] }
    ],
    poolRatio: 0.50
  },
  {
    id: 'kl8',
    name: '快乐8',
    currency: '¥',
    rules: '从1-80中选10个号码，开奖摇出20个号码\n每天开奖\n彩票奖金：销售额×58%（57%当期奖金+1%调节基金）\n选十中十(浮动)：封顶500万，保底16000元\n选九中九(浮动)：封顶25万，保底4000元\n选十中九(固定)：8000元\n选十中八(固定)：720元\n选十中七(固定)：80元\n选十中六(固定)：5元\n选十中五(固定)：3元\n选十中零(固定)：2元\n浮奖单期总封顶1亿',
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

/**
 * 根据彩票ID获取彩票配置
 * 
 * @param {string} id - 彩票ID
 * @returns {object|null} 彩票配置对象，未找到返回null
 */
export function getLotteryConfig(id) {
  return LOTTERY_CONFIG.find(c => c.id === id);
}