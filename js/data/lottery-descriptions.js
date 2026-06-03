export const LOTTERY_DESCRIPTIONS = {
  ssq: '<b>双色球</b><br><br><b>选号规则：</b>红球1-33选6个，蓝球1-16选1个<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>51%<br><br><b>中奖规则：</b><br>• 一等奖：6+1（浮动奖金）<br>• 二等奖：6+0（浮动奖金）<br>• 三等奖：5+1 → 3000元<br>• 四等奖：5+0或4+1 → 200元<br>• 五等奖：4+0或3+1 → 10元<br>• 六等奖：2+1或1+1或0+1 → 5元',
  
  dlt: '<b>大乐透</b><br><br><b>选号规则：</b>前区1-35选5个，后区1-12选2个<br><br><b>单注价格：</b>2元（可追加1元） | <b>返奖率：</b>51%<br><br><b>中奖规则：</b><br>• 一等奖：5+2（浮动奖金）<br>• 二等奖：5+1（浮动奖金）<br>• 三等奖：5+0或4+2 → 5000元<br>• 四等奖：4+1 → 300元<br>• 五等奖：4+0或3+2 → 150元<br>• 六等奖：3+1或2+2 → 15元<br>• 七等奖：3+0或2+1或1+2或0+2 → 5元',
  
  fc3d: '<b>福彩3D</b><br><br><b>选号规则：</b>百位、十位、个位各选0-9一个数字<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>53%<br><br><b>中奖规则：</b><br>• 直选：定位全中 → 1040元<br>• 组三：含对子不限位 → 346元<br>• 组六：不含对子不限位 → 173元',
  
  qxc: '<b>七星彩</b><br><br><b>选号规则：</b>前区6位（0-9）+ 后区1位（0-14）<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%<br><br><b>中奖规则：</b><br>• 一等奖：6+1（浮动奖金）<br>• 二等奖：6+0（浮动奖金）<br>• 三等奖：5+1 → 3000元<br>• 四等奖：5+0或4+1 → 500元<br>• 五等奖：4+0或3+1 → 30元<br>• 六等奖：3+0或2+1或1+1或0+1 → 5元',
  
  pls: '<b>排列三</b><br><br><b>选号规则：</b>百位、十位、个位各选0-9一个数字<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>53%<br><br><b>中奖规则：</b><br>• 直选：定位全中 → 1040元<br>• 组三：含对子不限位 → 346元<br>• 组六：不含对子不限位 → 173元',
  
  plw: '<b>排列五</b><br><br><b>选号规则：</b>万位、千位、百位、十位、个位各选0-9一个数字<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%<br><br><b>中奖规则：</b><br>• 一等奖：5个号码全中且顺序一致 → 100000元',
  
  qlc: '<b>七乐彩</b><br><br><b>选号规则：</b>从1-30中选7个基本号码<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%<br><br><b>中奖规则：</b><br>• 一等奖：7个基本号全中（浮动奖金）<br>• 二等奖：6个基本号+特别号（浮动奖金）<br>• 三等奖：6个基本号（浮动奖金）<br>• 四等奖：5个基本号+特别号 → 200元<br>• 五等奖：5个基本号 → 50元<br>• 六等奖：4个基本号+特别号 → 10元<br>• 七等奖：4个基本号 → 5元',
  
  kl8: '<b>快乐8</b><br><br><b>选号规则：</b>从1-80中选择号码，支持选一到选十共10种玩法<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>58%<br><br><b>奖池规则：</b><br>• 选九中九封顶25万，选十中十封顶500万<br>• 浮动奖奖池超2亿元时转入调节基金'
};

export const KL8_SELECT_RULES = {
  1: {
    name: '选一',
    description: '从1-80中选1个号码',
    prizes: [
      { match: '中1', prize: '4.5元' },
      { match: '中0', prize: '0元' }
    ]
  },
  2: {
    name: '选二',
    description: '从1-80中选2个号码',
    prizes: [
      { match: '中2', prize: '19元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '0元' }
    ]
  },
  3: {
    name: '选三',
    description: '从1-80中选3个号码',
    prizes: [
      { match: '中3', prize: '52元' },
      { match: '中2', prize: '3元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '0元' }
    ]
  },
  4: {
    name: '选四',
    description: '从1-80中选4个号码',
    prizes: [
      { match: '中4', prize: '93元' },
      { match: '中3', prize: '5元' },
      { match: '中2', prize: '3元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '0元' }
    ]
  },
  5: {
    name: '选五',
    description: '从1-80中选5个号码',
    prizes: [
      { match: '中5', prize: '1000元' },
      { match: '中4', prize: '20元' },
      { match: '中3', prize: '3元' },
      { match: '中2', prize: '0元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '0元' }
    ]
  },
  6: {
    name: '选六',
    description: '从1-80中选6个号码',
    prizes: [
      { match: '中6', prize: '2880元' },
      { match: '中5', prize: '30元' },
      { match: '中4', prize: '10元' },
      { match: '中3', prize: '3元' },
      { match: '中2', prize: '0元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '0元' }
    ]
  },
  7: {
    name: '选七',
    description: '从1-80中选7个号码',
    prizes: [
      { match: '中7', prize: '8500元' },
      { match: '中6', prize: '300元' },
      { match: '中5', prize: '30元' },
      { match: '中4', prize: '4元' },
      { match: '中3', prize: '0元' },
      { match: '中2', prize: '0元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '2元' }
    ]
  },
  8: {
    name: '选八',
    description: '从1-80中选8个号码',
    prizes: [
      { match: '中8', prize: '50000元' },
      { match: '中7', prize: '800元' },
      { match: '中6', prize: '80元' },
      { match: '中5', prize: '10元' },
      { match: '中4', prize: '3元' },
      { match: '中3', prize: '0元' },
      { match: '中2', prize: '0元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '2元' }
    ]
  },
  9: {
    name: '选九',
    description: '从1-80中选9个号码',
    prizes: [
      { match: '中9', prize: '浮动奖金（封顶25万）' },
      { match: '中8', prize: '2000元' },
      { match: '中7', prize: '225元' },
      { match: '中6', prize: '22元' },
      { match: '中5', prize: '5元' },
      { match: '中4', prize: '3元' },
      { match: '中3', prize: '0元' },
      { match: '中2', prize: '0元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '2元' }
    ]
  },
  10: {
    name: '选十',
    description: '从1-80中选10个号码',
    prizes: [
      { match: '中10', prize: '浮动奖金（封顶500万）' },
      { match: '中9', prize: '8000元' },
      { match: '中8', prize: '720元' },
      { match: '中7', prize: '80元' },
      { match: '中6', prize: '5元' },
      { match: '中5', prize: '3元' },
      { match: '中4', prize: '0元' },
      { match: '中3', prize: '0元' },
      { match: '中2', prize: '0元' },
      { match: '中1', prize: '0元' },
      { match: '中0', prize: '2元' }
    ]
  }
};

export function getLotteryDescription(lotteryId) {
  return LOTTERY_DESCRIPTIONS[lotteryId] || '';
}

export function getKl8SelectRule(selectNum) {
  return KL8_SELECT_RULES[selectNum] || KL8_SELECT_RULES[10];
}

export function getAllKl8SelectRules() {
  return KL8_SELECT_RULES;
}