export const LOTTERY_CONFIG = [
  {
    id: 'ssq',
    name: '双色球',
    currency: '¥',
    rules: '从1-33中选6个红球(不重复) + 从1-16中选1个蓝球',
    description: '<b>双色球</b>是中国福利彩票的经典玩法，每周二、四、日开奖。<br><br><b>选号规则：</b>从1-33中选取6个不重复的红球号码，从1-16中选取1个蓝球号码，组成一注彩票。<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>51%<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 51%（基础奖池）+ 用户追加奖池<br>2. 先扣除三至六等奖的固定奖金总额<br>3. 剩余奖池按比例分配：一等奖占75%，二等奖占25%<br>4. 若当期一等奖无人中奖，奖金滚入下期奖池',
    price: 2,
    zones: [
      { name: '红球', min: 1, max: 33, count: 6, repeatable: false, color: '#e74c3c' },
      { name: '蓝球', min: 1, max: 16, count: 1, repeatable: false, color: '#3498db' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 5000000, fixed: false, poolRatio: 0.75, matchPattern: [[6,1]] },
      { level: 2, name: '二等奖', amount: 0, fixed: false, poolRatio: 0.25, matchPattern: [[6,0]] },
      { level: 3, name: '三等奖', amount: 3000, fixed: true, matchPattern: [[5,1]] },
      { level: 4, name: '四等奖', amount: 200, fixed: true, matchPattern: [[5,0],[4,1]] },
      { level: 5, name: '五等奖', amount: 10, fixed: true, matchPattern: [[4,0],[3,1]] },
      { level: 6, name: '六等奖', amount: 5, fixed: true, matchPattern: [[2,1],[1,1],[0,1]] }
    ],
    poolRatio: 0.51
  },
  {
    id: 'dlt',
    name: '大乐透',
    currency: '¥',
    rules: '从1-35中选5个前区号(不重复) + 从1-12中选2个后区号(不重复)',
    description: '<b>大乐透</b>是中国体育彩票的旗舰玩法，每周一、三、六开奖。<br><br><b>选号规则：</b>从1-35中选取5个不重复的前区号码，从1-12中选取2个不重复的后区号码，组成一注彩票。<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>51%<br><br><b>2026年新规：</b>奖级由9个精简为7个，中奖门槛降低，中小固定奖提升。<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 51%（基础奖池）+ 用户追加奖池<br>2. 先扣除三至七等奖的固定奖金总额<br>3. 剩余奖池按比例分配：一等奖占78%，二等奖占22%<br>4. 若当期一等奖无人中奖，奖金滚入下期奖池',
    price: 2,
    zones: [
      { name: '前区', min: 1, max: 35, count: 5, repeatable: false, color: '#e74c3c' },
      { name: '后区', min: 1, max: 12, count: 2, repeatable: false, color: '#3498db' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 5000000, fixed: false, poolRatio: 0.78, matchPattern: [[5,2]] },
      { level: 2, name: '二等奖', amount: 0, fixed: false, poolRatio: 0.22, matchPattern: [[5,1]] },
      { level: 3, name: '三等奖', amount: 5000, fixed: true, matchPattern: [[5,0],[4,2]] },
      { level: 4, name: '四等奖', amount: 300, fixed: true, matchPattern: [[4,1]] },
      { level: 5, name: '五等奖', amount: 150, fixed: true, matchPattern: [[4,0],[3,2]] },
      { level: 6, name: '六等奖', amount: 15, fixed: true, matchPattern: [[3,1],[2,2]] },
      { level: 7, name: '七等奖', amount: 5, fixed: true, matchPattern: [[3,0],[2,1],[1,2],[0,2]] }
    ],
    poolRatio: 0.51
  },
  {
    id: 'fc3d',
    name: '福彩3D',
    currency: '¥',
    rules: '从0-9中选3个数字（可重复）',
    description: '<b>福彩3D</b>是中国福利彩票的数字型玩法，每日开奖。<br><br><b>选号规则：</b>从0-9中选取3个数字（百位、十位、个位），每个位置可重复。<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>53%',
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
    description: '<b>七星彩</b>是中国体育彩票的数字型玩法，每周二、五、日开奖。<br><br><b>选号规则：</b>前区从0-9中选取6位数字（每位独立，可重复），后区从0-14中选取1位数字，组成一注彩票。<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 50%（基础奖池）+ 用户追加奖池<br>2. 先扣除三至六等奖的固定奖金总额<br>3. 剩余奖池按比例分配：一等奖占90%，二等奖占10%<br>4. 若当期一等奖无人中奖，奖金滚入下期奖池',
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
    description: '<b>排列三</b>是中国体育彩票的数字型玩法，每日开奖。<br><br><b>选号规则：</b>从0-9中选取3个数字（百位、十位、个位），每个位置可重复。<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>53%',
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
    description: '<b>排列五</b>是中国体育彩票的数字型玩法，每日开奖。<br><br><b>选号规则：</b>从0-9中选取5个数字（万位、千位、百位、十位、个位），每个位置独立选取，可重复。<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%',
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
    description: '<b>七乐彩</b>是中国福利彩票的乐透型玩法，每周一、三、五开奖。<br><br><b>选号规则：</b>从1-30中选取7个不重复的基本号码。开奖时先摇出7个基本号码，再摇出1个特别号码（与基本号不重复）。<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 50%（基础奖池）+ 用户追加奖池<br>2. 先扣除四至七等奖的固定奖金总额<br>3. 剩余奖池按比例分配：一等奖占70%，二等奖占10%，三等奖占20%<br>4. 若当期一等奖无人中奖，奖金滚入下期奖池',
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
    description: '<b>快乐8</b>是中国福利彩票的基诺型玩法，每日开奖。<br><br><b>选号规则：</b>从1-80中选取10个不重复的号码。开奖时从1-80中摇出20个号码作为开奖号码。<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>58%<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 58%（基础奖池）+ 用户追加奖池<br>2. 先扣除二至七等奖的固定奖金总额<br>3. 剩余奖池全部计入一等奖（选十中十）<br>4. 若当期一等奖无人中奖，奖金滚入下期奖池',
    price: 2,
    zones: [
      { name: '选号', min: 1, max: 80, count: 10, repeatable: false, color: '#e67e22' }
    ],
    drawZones: [
      { name: '开奖号', min: 1, max: 80, count: 20, repeatable: false, color: '#2ecc71' }
    ],
    prizes: [
      { level: 1, name: '选十中十', amount: 5000000, fixed: false, poolRatio: 0.60, matchPattern: [[10]] },
      { level: 2, name: '选十中九', amount: 8000, fixed: true, matchPattern: [[9]] },
      { level: 3, name: '选十中八', amount: 720, fixed: true, matchPattern: [[8]] },
      { level: 4, name: '选十中七', amount: 80, fixed: true, matchPattern: [[7]] },
      { level: 5, name: '选十中六', amount: 5, fixed: true, matchPattern: [[6]] },
      { level: 6, name: '选十中五', amount: 3, fixed: true, matchPattern: [[5]] },
      { level: 7, name: '选十中零', amount: 2, fixed: true, matchPattern: [[0]] }
    ],
    poolRatio: 0.58
  },
  {
    id: 'powerball',
    name: 'Powerball',
    currency: '$',
    rules: 'Pick 5 from 1-69 (white balls) + 1 from 1-26 (Powerball)',
    description: '<b>Powerball</b>（强力球）是美国最大的跨州乐透游戏之一，每周一、三、六开奖（美东时间）。<br><br><b>选号规则：</b>从1-69中选取5个不重复的白球号码，从1-26中选取1个红球（Powerball）。<br><br><b>单注价格：</b>$2 | <b>返奖率：</b>50% | <b>起始头奖：</b>$150,000,000<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 50%（基础奖池）+ 用户追加奖池<br>2. 先扣除二至九等奖的固定奖金总额<br>3. 剩余奖池的68%计入头奖（Jackpot）<br>4. 头奖采用累进式，无人中奖则奖金累加至下期',
    price: 2,
    zones: [
      { name: 'White', min: 1, max: 69, count: 5, repeatable: false, color: '#ecf0f1' },
      { name: 'Powerball', min: 1, max: 26, count: 1, repeatable: false, color: '#e74c3c' }
    ],
    prizes: [
      { level: 1, name: 'Jackpot', amount: 150000000, fixed: false, poolRatio: 0.68, matchPattern: [[5,1]] },
      { level: 2, name: '5+0', amount: 1000000, fixed: true, matchPattern: [[5,0]] },
      { level: 3, name: '4+1', amount: 50000, fixed: true, matchPattern: [[4,1]] },
      { level: 4, name: '4+0', amount: 100, fixed: true, matchPattern: [[4,0]] },
      { level: 5, name: '3+1', amount: 100, fixed: true, matchPattern: [[3,1]] },
      { level: 6, name: '3+0', amount: 7, fixed: true, matchPattern: [[3,0]] },
      { level: 7, name: '2+1', amount: 7, fixed: true, matchPattern: [[2,1]] },
      { level: 8, name: '1+1', amount: 4, fixed: true, matchPattern: [[1,1]] },
      { level: 9, name: '0+1', amount: 4, fixed: true, matchPattern: [[0,1]] }
    ],
    poolRatio: 0.50
  },
  {
    id: 'megamillions',
    name: 'Mega Millions',
    currency: '$',
    rules: 'Pick 5 from 1-70 (white balls) + 1 from 1-24 (Mega Ball)',
    description: '<b>Mega Millions</b>（超级百万）是美国最大的跨州乐透游戏之一，每周二、五开奖（美东时间）。<br><br><b>选号规则：</b>从1-70中选取5个不重复的白球号码，从1-24中选取1个金球（Mega Ball）。<br><br><b>单注价格：</b>$5（含内置倍数） | <b>返奖率：</b>50% | <b>起始头奖：</b>$50,000,000<br><br><b>2025年4月新规：</b>Mega Ball从1-25缩减为1-24，票价从$2调整为$5（含内置2X-10X倍数），起始头奖从$20M提升至$50M。<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 50%（基础奖池）+ 用户追加奖池<br>2. 先扣除二至九等奖的固定奖金总额<br>3. 剩余奖池的75%计入头奖（Jackpot）<br>4. 头奖采用累进式，无人中奖则奖金累加至下期',
    price: 5,
    zones: [
      { name: 'White', min: 1, max: 70, count: 5, repeatable: false, color: '#ecf0f1' },
      { name: 'Mega Ball', min: 1, max: 24, count: 1, repeatable: false, color: '#f39c12' }
    ],
    prizes: [
      { level: 1, name: 'Jackpot', amount: 50000000, fixed: false, poolRatio: 0.75, matchPattern: [[5,1]] },
      { level: 2, name: '5+0', amount: 1000000, fixed: true, matchPattern: [[5,0]] },
      { level: 3, name: '4+1', amount: 10000, fixed: true, matchPattern: [[4,1]] },
      { level: 4, name: '4+0', amount: 500, fixed: true, matchPattern: [[4,0]] },
      { level: 5, name: '3+1', amount: 200, fixed: true, matchPattern: [[3,1]] },
      { level: 6, name: '3+0', amount: 10, fixed: true, matchPattern: [[3,0]] },
      { level: 7, name: '2+1', amount: 10, fixed: true, matchPattern: [[2,1]] },
      { level: 8, name: '1+1', amount: 7, fixed: true, matchPattern: [[1,1]] },
      { level: 9, name: '0+1', amount: 5, fixed: true, matchPattern: [[0,1]] }
    ],
    poolRatio: 0.50
  },
  {
    id: 'euromillions',
    name: 'EuroMillions',
    currency: '€',
    rules: 'Pick 5 from 1-50 (main) + 2 from 1-12 (Lucky Stars)',
    description: '<b>EuroMillions</b>（欧洲百万）是欧洲最大的跨国乐透游戏，由英国、法国、西班牙等9国联合发行，每周二、五开奖。<br><br><b>选号规则：</b>从1-50中选取5个不重复的主号码，从1-12中选取2个不重复的幸运星号码。<br><br><b>单注价格：</b>€2.50 | <b>返奖率：</b>50% | <b>起始头奖：</b>€17,000,000<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 50%（基础奖池）+ 用户追加奖池<br>2. 先扣除四至十三等奖的固定奖金总额<br>3. 剩余奖池按比例分配：一等奖占94%，二等奖占5%，三等奖占1%<br>4. 头奖采用累进式，无人中奖则奖金累加至下期（封顶€240M）',
    price: 2.5,
    zones: [
      { name: 'Main', min: 1, max: 50, count: 5, repeatable: false, color: '#2ecc71' },
      { name: 'Lucky Stars', min: 1, max: 12, count: 2, repeatable: false, color: '#f1c40f' }
    ],
    prizes: [
      { level: 1, name: 'Jackpot', amount: 17000000, fixed: false, poolRatio: 0.94, matchPattern: [[5,2]] },
      { level: 2, name: '5+1', amount: 0, fixed: false, poolRatio: 0.05, matchPattern: [[5,1]] },
      { level: 3, name: '5+0', amount: 0, fixed: false, poolRatio: 0.01, matchPattern: [[5,0]] },
      { level: 4, name: '4+2', amount: 3000, fixed: true, matchPattern: [[4,2]] },
      { level: 5, name: '4+1', amount: 160, fixed: true, matchPattern: [[4,1]] },
      { level: 6, name: '3+2', amount: 100, fixed: true, matchPattern: [[3,2]] },
      { level: 7, name: '4+0', amount: 55, fixed: true, matchPattern: [[4,0]] },
      { level: 8, name: '2+2', amount: 18, fixed: true, matchPattern: [[2,2]] },
      { level: 9, name: '3+1', amount: 14, fixed: true, matchPattern: [[3,1]] },
      { level: 10, name: '3+0', amount: 11, fixed: true, matchPattern: [[3,0]] },
      { level: 11, name: '1+2', amount: 10, fixed: true, matchPattern: [[1,2]] },
      { level: 12, name: '2+1', amount: 7, fixed: true, matchPattern: [[2,1]] },
      { level: 13, name: '2+0', amount: 4, fixed: true, matchPattern: [[2,0]] }
    ],
    poolRatio: 0.50
  },
  {
    id: 'uklotto',
    name: 'UK Lotto',
    currency: '£',
    rules: 'Pick 6 from 1-59 (main), draw includes 1 Bonus Ball',
    description: '<b>UK Lotto</b>（英国国家彩票）是英国最流行的乐透游戏，每周三、六开奖。<br><br><b>选号规则：</b>从1-59中选取6个不重复的主号码。开奖时摇出6个主号 + 1个附加号（Bonus Ball，与主号不重复）。<br><br><b>单注价格：</b>£2 | <b>返奖率：</b>47%<br><br><b>浮动奖金算法：</b><br>1. 总奖池 = 当期销售额 × 47%（基础奖池）+ 用户追加奖池<br>2. 先扣除二至六等奖的固定奖金总额<br>3. 剩余奖池全部计入头奖（Jackpot）<br>4. 头奖采用累进式，无人中奖则奖金累加至下期',
    price: 2,
    zones: [
      { name: 'Main', min: 1, max: 59, count: 6, repeatable: false, color: '#e74c3c' }
    ],
    drawZones: [
      { name: 'Main', min: 1, max: 59, count: 6, repeatable: false, color: '#e74c3c' },
      { name: 'Bonus', min: 1, max: 59, count: 1, repeatable: false, color: '#3498db', excludeZone: 0 }
    ],
    prizes: [
      { level: 1, name: 'Jackpot', amount: 2000000, fixed: false, poolRatio: 1.0, matchPattern: [[6,0]] },
      { level: 2, name: '5+Bonus', amount: 1000000, fixed: true, matchPattern: [[5,1]] },
      { level: 3, name: '5+0', amount: 1750, fixed: true, matchPattern: [[5,0]] },
      { level: 4, name: '4+0', amount: 140, fixed: true, matchPattern: [[4,0]] },
      { level: 5, name: '3+0', amount: 30, fixed: true, matchPattern: [[3,0]] },
      { level: 6, name: '2+0 (Lucky Dip)', amount: 0, fixed: true, matchPattern: [[2,0]] }
    ],
    poolRatio: 0.47
  }
];

export function getLotteryConfig(id) {
  return LOTTERY_CONFIG.find(c => c.id === id);
}
