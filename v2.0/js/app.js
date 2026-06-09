const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ============ 彩票配置 ============ */
const LOTTERY_CONFIG = {
  ssq: {
    name: '双色球',
    price: 2,
    maxAmount: 20000,
    rules: '红球 1-33 选 6（不重复） + 蓝球 1-16 选 1。每周二、四、日开奖。\n\n单注价格：2元 | 返奖率：51%\n\n中奖规则：\n• 一等奖：6+1（浮动奖金，封顶500万-1000万）\n• 二等奖：6+0（浮动奖金，封顶500万）\n• 三等奖：5+1 → 3000元\n• 四等奖：5+0或4+1 → 200元\n• 五等奖：4+0或3+1 → 10元\n• 六等奖：2+1或1+1或0+1 → 5元\n• 福运奖：奖池≥15亿时，3红即中5元\n\n复式：红球 7-20 个 或 蓝球 2-16 个。\n胆拖：红球 1-5 个胆码 + 拖码（胆+拖 ≥ 7）。',
    zones: [
      { name: '红球', min: 1, max: 33, count: 6, compoundMin: 7, compoundMax: 20, color: '#e74c3c', colorClass: 'red' },
      { name: '蓝球', min: 1, max: 16, count: 1, compoundMin: 2, compoundMax: 16, color: '#3498db', colorClass: 'blue' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 0, fixed: false, matchPattern: [[6, 1]], maxPerTicket: 5000000, poolRatio: 0.75 },
      { level: 2, name: '二等奖', amount: 0, fixed: false, matchPattern: [[6, 0]], maxPerTicket: 5000000, poolRatio: 0.25 },
      { level: 3, name: '三等奖', amount: 3000, fixed: true, matchPattern: [[5, 1]] },
      { level: 4, name: '四等奖', amount: 200, fixed: true, matchPattern: [[5, 0], [4, 1]] },
      { level: 5, name: '五等奖', amount: 10, fixed: true, matchPattern: [[4, 0], [3, 1]] },
      { level: 6, name: '六等奖', amount: 5, fixed: true, matchPattern: [[2, 1], [1, 1], [0, 1]] }
    ],
    poolRatio: 0.51,
    poolTiers: [
      { min: 0, max: 100000000, firstPrizeRatio: 0.75, secondPrizeRatio: 0.25 },
      { min: 100000000, max: Infinity, firstPrizeRatio: 0.55, secondPrizeRatio: 0.20, secondPartRatio: 0.20 }
    ],
    description: '<b>双色球</b><br><br><b>选号规则：</b>红球1-33选6个，蓝球1-16选1个<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>51%<br><br><b>中奖规则：</b><br>• 一等奖：6+1（浮动奖金）<br>• 二等奖：6+0（浮动奖金）<br>• 三等奖：5+1 → 3000元<br>• 四等奖：5+0或4+1 → 200元<br>• 五等奖：4+0或3+1 → 10元<br>• 六等奖：2+1或1+1或0+1 → 5元>'
  },
  dlt: {
    name: '超级大乐透',
    price: 2,
    maxAmount: 30000,
    rules: '前区 1-35 选 5（不重复） + 后区 1-12 选 2（不重复）。每周一、三、六开奖。\n\n单注价格：2元（可追加1元） | 返奖率：51%\n\n中奖规则：\n• 一等奖：5+2（浮动奖金，封顶1000万）\n• 二等奖：5+1（浮动奖金，封顶500万）\n• 三等奖：5+0或4+2 → 5000元\n• 四等奖：4+1 → 300元\n• 五等奖：4+0或3+2 → 150元\n• 六等奖：3+1或2+2 → 15元\n• 七等奖：3+0或2+1或1+2或0+2 → 5元\n\n追加投注：每注加 1 元，浮动奖奖金提升80%。\n奖池≥8亿时，固定奖奖金提档。\n\n复式：前区 6 个以上 或 后区 3 个以上。\n胆拖：前区 1-4 个胆码 + 拖码（胆+拖 ≥ 6）。',
    zones: [
      { name: '前区', min: 1, max: 35, count: 5, compoundMin: 6, compoundMax: 35, color: '#e74c3c', colorClass: 'red' },
      { name: '后区', min: 1, max: 12, count: 2, compoundMin: 3, compoundMax: 12, color: '#3498db', colorClass: 'blue' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 0, fixed: false, matchPattern: [[5, 2]], maxPerTicket: 5000000, poolRatio: 0.75, maxAddOnPerTicket: 9000000 },
      { level: 2, name: '二等奖', amount: 0, fixed: false, matchPattern: [[5, 1]], maxPerTicket: 5000000, poolRatio: 0.25 },
      { level: 3, name: '三等奖', amount: 5000, fixed: true, matchPattern: [[5, 0], [4, 2]] },
      { level: 4, name: '四等奖', amount: 300, fixed: true, matchPattern: [[4, 1]] },
      { level: 5, name: '五等奖', amount: 150, fixed: true, matchPattern: [[4, 0], [3, 2]] },
      { level: 6, name: '六等奖', amount: 15, fixed: true, matchPattern: [[3, 1], [2, 2]] },
      { level: 7, name: '七等奖', amount: 5, fixed: true, matchPattern: [[3, 0], [2, 1], [1, 2], [0, 2]] }
    ],
    poolRatio: 0.51,
    canAddOn: true,
    addOnPrice: 1,
    poolTiers: [
      { min: 0, max: 100000000, firstPrizeRatio: 0.75, secondPrizeRatio: 0.25 },
      { min: 100000000, max: Infinity, firstPrizeRatio: 0.55, secondPrizeRatio: 0.20, secondPartRatio: 0.20 }
    ],
    description: '<b>大乐透</b><br><br><b>选号规则：</b>前区1-35选5个，后区1-12选2个<br><br><b>单注价格：</b>2元（可追加1元） | <b>返奖率：</b>51%<br><br><b>中奖规则：</b><br>• 一等奖：5+2（浮动奖金）<br>• 二等奖：5+1（浮动奖金）<br>• 三等奖：5+0或4+2 → 5000元<br>• 四等奖：4+1 → 300元<br>• 五等奖：4+0或3+2 → 150元<br>• 六等奖：3+1或2+2 → 15元<br>• 七等奖：3+0或2+1或1+2或0+2 → 5元>'
  },
  fc3d: {
    name: '福彩3D',
    price: 2,
    maxAmount: 20000,
    rules: '从 0-9 中选 3 个数字。每天开奖。\n\n单注价格：2元 | 返奖率：53%\n\n中奖规则：\n• 单选：位置与数字全对 → 1040元\n• 组选3：开出对子号（如112） → 346元\n• 组选6：开出3个不同号（如123） → 173元\n\n定位复式：每位可选多个号码。',
    zones: [
      { name: '百位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' },
      { name: '十位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' },
      { name: '个位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' }
    ],
    prizes: [
      { level: 1, name: '直选', amount: 1040, fixed: true, matchPattern: [[1, 1, 1]] },
      { level: 2, name: '组三', amount: 346, fixed: true, matchPattern: [[2]] },
      { level: 3, name: '组六', amount: 173, fixed: true, matchPattern: [[3]] }
    ],
    poolRatio: 0.53,
    description: '<b>福彩3D</b><br><br><b>选号规则：</b>百位、十位、个位各选0-9一个数字<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>53%<br><br><b>中奖规则：</b><br>• 直选：定位全中 → 1040元<br>• 组三：含对子不限位 → 346元<br>• 组六：不含对子不限位 → 173元>'
  },
  qxc: {
    name: '七星彩',
    price: 2,
    maxAmount: 20000,
    rules: '前区选6位数字(0-9可重复) + 后区选1位数字(0-14)\n每周二、五、日开奖，按位匹配\n\n单注价格：2元 | 返奖率：50%\n\n中奖规则：\n• 一等奖：6+1（浮动奖金，封顶500万）\n• 二等奖：6+0（浮动奖金）\n• 三等奖：5+1 → 3000元\n• 四等奖：5+0或4+1 → 500元\n• 五等奖：4+0或3+1 → 30元\n• 六等奖：3+0或2+1或1+1或0+1 → 5元\n\n奖池≤3亿：一等奖=浮动90%+池\n奖池>3亿（倒置）：一等奖=浮动10%+池，二等奖=浮动90%',
    zones: [
      { name: '第1位', min: 0, max: 9, count: 1, color: '#e74c3c', colorClass: 'red' },
      { name: '第2位', min: 0, max: 9, count: 1, color: '#e74c3c', colorClass: 'red' },
      { name: '第3位', min: 0, max: 9, count: 1, color: '#e74c3c', colorClass: 'red' },
      { name: '第4位', min: 0, max: 9, count: 1, color: '#e74c3c', colorClass: 'red' },
      { name: '第5位', min: 0, max: 9, count: 1, color: '#e74c3c', colorClass: 'red' },
      { name: '第6位', min: 0, max: 9, count: 1, color: '#e74c3c', colorClass: 'red' },
      { name: '后区', min: 0, max: 14, count: 1, color: '#3498db', colorClass: 'blue' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 0, fixed: false, matchPattern: [[6, 1]], maxPerTicket: 5000000, poolRatio: 0.90 },
      { level: 2, name: '二等奖', amount: 0, fixed: false, matchPattern: [[6, 0]], maxPerTicket: 5000000, poolRatio: 0.10 },
      { level: 3, name: '三等奖', amount: 3000, fixed: true, matchPattern: [[5, 1]] },
      { level: 4, name: '四等奖', amount: 500, fixed: true, matchPattern: [[5, 0], [4, 1]] },
      { level: 5, name: '五等奖', amount: 30, fixed: true, matchPattern: [[4, 0], [3, 1]] },
      { level: 6, name: '六等奖', amount: 5, fixed: true, matchPattern: [[3, 0], [2, 1], [1, 1], [0, 1]] }
    ],
    poolRatio: 0.50,
    description: '<b>七星彩</b><br><br><b>选号规则：</b>前区6位（0-9）+ 后区1位（0-14）<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%<br><br><b>中奖规则：</b><br>• 一等奖：6+1（浮动奖金）<br>• 二等奖：6+0（浮动奖金）<br>• 三等奖：5+1 → 3000元<br>• 四等奖：5+0或4+1 → 500元<br>• 五等奖：4+0或3+1 → 30元<br>• 六等奖：3+0或2+1或1+1或0+1 → 5元>'
  },
  pls: {
    name: '排列三',
    price: 2,
    maxAmount: 20000,
    rules: '从0-9中选3个数字（可重复）\n每天开奖\n\n单注价格：2元 | 返奖率：53%\n\n中奖规则：\n• 直选：定位全中 → 1040元\n• 组三：含对子不限位 → 346元\n• 组六：不含对子不限位 → 173元\n\n定位复式：每位可选多个号码。',
    zones: [
      { name: '百位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' },
      { name: '十位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' },
      { name: '个位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' }
    ],
    prizes: [
      { level: 1, name: '直选', amount: 1040, fixed: true, matchPattern: [[1, 1, 1]] },
      { level: 2, name: '组三', amount: 346, fixed: true, matchPattern: [[2]] },
      { level: 3, name: '组六', amount: 173, fixed: true, matchPattern: [[3]] }
    ],
    poolRatio: 0.53,
    description: '<b>排列三</b><br><br><b>选号规则：</b>百位、十位、个位各选0-9一个数字<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>53%<br><br><b>中奖规则：</b><br>• 直选：定位全中 → 1040元<br>• 组三：含对子不限位 → 346元<br>• 组六：不含对子不限位 → 173元>'
  },
  plw: {
    name: '排列五',
    price: 2,
    maxAmount: 20000,
    rules: '从0-9中选5个数字（可重复）\n每天开奖\n\n单注价格：2元 | 返奖率：50%\n\n中奖规则：\n• 一等奖：5个号码全中且顺序一致 → 100000元\n\n定位复式：每位可选多个号码。',
    zones: [
      { name: '万位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' },
      { name: '千位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' },
      { name: '百位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' },
      { name: '十位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' },
      { name: '个位', min: 0, max: 9, count: 1, color: '#f39c12', colorClass: 'orange' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 100000, fixed: true, matchPattern: [[1, 1, 1, 1, 1]] }
    ],
    poolRatio: 0.50,
    description: '<b>排列五</b><br><br><b>选号规则：</b>万位、千位、百位、十位、个位各选0-9一个数字<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%<br><br><b>中奖规则：</b><br>• 一等奖：5个号码全中且顺序一致 → 100000元>'
  },
  qlc: {
    name: '七乐彩',
    price: 2,
    maxAmount: 20000,
    rules: '从1-30中选7个号码(不重复)，开奖另摇1个特别号\n每周一、三、五开奖\n\n单注价格：2元 | 返奖率：50%\n\n中奖规则：\n• 一等奖：7个基本号全中（浮动奖金，封顶500万）\n• 二等奖：6基本+特别号（浮动奖金）\n• 三等奖：6基本号（浮动奖金）\n• 四等奖：5基本+特别号 → 200元\n• 五等奖：5基本号 → 60元\n• 六等奖：4基本+特别号 → 12元\n• 七等奖：4基本号 → 10元\n\n复式：7-30个号码。\n胆拖：1-6个胆码 + 拖码（胆+拖 ≥ 7）。',
    zones: [
      { name: '基本号', min: 1, max: 30, count: 7, compoundMin: 8, compoundMax: 30, color: '#e74c3c', colorClass: 'red' }
    ],
    drawZones: [
      { name: '特别号', color: '#3498db', colorClass: 'blue' }
    ],
    prizes: [
      { level: 1, name: '一等奖', amount: 0, fixed: false, matchPattern: [[7]], maxPerTicket: 5000000, poolRatio: 0.70 },
      { level: 2, name: '二等奖', amount: 0, fixed: false, matchPattern: [[6, 1]], maxPerTicket: 5000000, poolRatio: 0.10 },
      { level: 3, name: '三等奖', amount: 0, fixed: false, matchPattern: [[6, 0]], maxPerTicket: 5000000, poolRatio: 0.20 },
      { level: 4, name: '四等奖', amount: 200, fixed: true, matchPattern: [[5, 1]] },
      { level: 5, name: '五等奖', amount: 60, fixed: true, matchPattern: [[5, 0]] },
      { level: 6, name: '六等奖', amount: 12, fixed: true, matchPattern: [[4, 1]] },
      { level: 7, name: '七等奖', amount: 10, fixed: true, matchPattern: [[4, 0]] }
    ],
    poolRatio: 0.50,
    description: '<b>七乐彩</b><br><br><b>选号规则：</b>从1-30中选7个基本号码<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>50%<br><br><b>中奖规则：</b><br>• 一等奖：7个基本号全中（浮动奖金）<br>• 二等奖：6个基本号+特别号（浮动奖金）<br>• 三等奖：6个基本号（浮动奖金）<br>• 四等奖：5个基本号+特别号 → 200元<br>• 五等奖：5个基本号 → 60元<br>• 六等奖：4个基本号+特别号 → 12元<br>• 七等奖：4个基本号 → 10元>'
  },
  kl8: {
    name: '快乐8',
    price: 2,
    maxAmount: 20000,
    rules: '从1-80中选10个号码，开奖摇出20个号码\n每天开奖\n\n单注价格：2元 | 返奖率：58%\n\n选十玩法中奖规则：\n• 选十中十（浮动奖金，封顶500万）\n• 选十中九 → 8000元\n• 选十中八 → 720元\n• 选十中七 → 80元\n• 选十中六 → 5元\n• 选十中五 → 3元\n• 选十中零 → 2元\n\n选九中九封顶25万，保底4000元\n浮奖单期总封顶1亿\n\n切换选号类型查看不同玩法规则。',
    zones: [
      { name: '选号', min: 1, max: 80, count: 10, compoundMin: 10, compoundMax: 80, color: '#e67e22', colorClass: 'orange' }
    ],
    prizes: [
      { level: 1, name: '选十中十', amount: 0, fixed: false, matchPattern: [[10]], maxPerTicket: 5000000, poolRatio: 0.60 },
      { level: 2, name: '选十中九', amount: 8000, fixed: true, matchPattern: [[9]] },
      { level: 3, name: '选十中八', amount: 720, fixed: true, matchPattern: [[8]] },
      { level: 4, name: '选十中七', amount: 80, fixed: true, matchPattern: [[7]] },
      { level: 5, name: '选十中六', amount: 5, fixed: true, matchPattern: [[6]] },
      { level: 6, name: '选十中五', amount: 3, fixed: true, matchPattern: [[5]] },
      { level: 7, name: '选十中零', amount: 2, fixed: true, matchPattern: [[0]] }
    ],
    poolRatio: 0.58,
    description: '<b>快乐8</b><br><br><b>选号规则：</b>从1-80中选10个号码<br><br><b>单注价格：</b>2元 | <b>返奖率：</b>58%<br><br><b>中奖规则：</b><br>• 选十中十（浮动奖金，封顶500万）<br>• 选十中九 → 8000元<br>• 选十中八 → 720元<br>• 选十中七 → 80元<br>• 选十中六 → 5元<br>• 选十中五 → 3元<br>• 选十中零 → 2元>'
  }
};

/* ============ 全局状态 ============ */
let currentLottery = 'ssq';
let selectedNumbers = {};    // 复式模式: {zoneIdx: [...]} / 胆拖模式: {dan: [...], tuo: [...]} / 3D: {posIdx: [...]}
let requiredCounts = [];     // 目标数量，复式模式下可调整
let randomCountMode = {};    // 随机数量开关
let multiplier = 1;          // 倍投 1-99
let extraBetRatio = 40;      // 大乐透追加投注占比（0-100）
let betMode = 'compound';    // compound (复式) / dantuo (胆拖)
let playType3D = 'direct';   // direct / group3 / group6
let kl8SelectNum = 10;       // 快乐8选号类型（选几）

let savedSelections = { ssq: null, dlt: null, fc3d: null, qxc: null, pls: null, plw: null, qlc: null, kl8: null };
let savedRequiredCounts = { ssq: null, dlt: null, fc3d: null, qxc: null, pls: null, plw: null, qlc: null, kl8: null };
let savedRandomCountMode = { ssq: null, dlt: null, fc3d: null, qxc: null, pls: null, plw: null, qlc: null, kl8: null };

/* ============ 初始化 ============ */
function init() {
  bindLotteryTabs();
  bindPageNavigation();
  bindRulesCollapse();
  bindResetButton();
  bindSelectionButtons();
  bindBetModeToggle();
  bindPlayTypeToggle();
  bindExtraBetSlider();
  bindMultiplierControls();
  bindKl8SelectTabs();
  renderNumberPanel();
  updateRulesDisplay();
}

/* ============ 彩票类型切换 ============ */
function bindLotteryTabs() {
  $('#lottery-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.lottery-tab');
    if (!btn) return;
    const newLottery = btn.dataset.id;
    if (newLottery === currentLottery) return;

    savedSelections[currentLottery] = JSON.parse(JSON.stringify(selectedNumbers));
    savedRequiredCounts[currentLottery] = [...requiredCounts];
    savedRandomCountMode[currentLottery] = { ...randomCountMode };
    currentLottery = newLottery;
    $$('.lottery-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderNumberPanel(true);
    updateRulesDisplay();
    // 切换彩票类型后刷新开奖显示区
    if (typeof renderAllDrawUIs === 'function') renderAllDrawUIs();
  });
}

/* ============ 页面导航切换 ============ */
function bindPageNavigation() {
  $$('.nav-analysis-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = btn.dataset.page;
      $$('.nav-analysis-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.page').forEach(page => page.classList.remove('active'));
      const pageMap = {
        'simulation': 'page-simulation',
        'draw-analysis': 'page-draw-analysis',
        'purchase-analysis': 'page-purchase-analysis'
      };
      const targetEl = $(`#${pageMap[targetPage]}`);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

/* ============ 玩法详情折叠 ============ */
function bindRulesCollapse() {
  $('#rules-collapse-toggle').addEventListener('click', () => {
    const body = $('#rules-collapse-body');
    const arrow = $('.rules-collapse-arrow');
    const isOpen = body.classList.contains('open');
    if (isOpen) {
      body.style.maxHeight = '0';
      body.classList.remove('open');
      arrow.style.transform = '';
    } else {
      body.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 40 + 'px';
      arrow.style.transform = 'rotate(90deg)';
    }
  });
}

/* ============ 更新玩法详情显示 ============ */
function updateRulesDisplay() {
  const body = $('#rules-collapse-body');
  const config = LOTTERY_CONFIG[currentLottery];
  const kl8Tabs = $('#kl8-select-tabs');

  if (currentLottery === 'kl8') {
    body.innerHTML = generateKl8PrizeTable(kl8SelectNum);
    kl8Tabs.style.display = 'flex';
    $$('.kl8-select-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.select) === kl8SelectNum);
    });
  } else {
    body.innerHTML = generatePrizeIllustration(config);
    kl8Tabs.style.display = 'none';
  }

  if (body.classList.contains('open')) {
    body.style.maxHeight = body.scrollHeight + 40 + 'px';
  }
}

/* ============ 生成奖级表（带球可视化） ============ */
function generatePrizeIllustration(config) {
  const zones = [...config.zones];
  if (config.drawZones) {
    config.drawZones.forEach(dz => {
      if (!zones.some(z => z.name === dz.name)) zones.push(dz);
    });
  }
  const prizes = config.prizes;
  if (!prizes || !prizes.some(p => p.matchPattern)) return '';

  const TH = 'padding:5px 7px;text-align:left;color:#9ca3af;font-size:11px;font-weight:600;';
  const TD = 'padding:5px 7px;font-size:11px;border-bottom:1px solid #2a2f3a;';
  const hasFloat = prizes.some(p => !p.fixed);

  let html = '<div style="width:100%;max-width:100%;">';

  // ===== 1. 奖级表 =====
  html += '<b style="margin-bottom:6px;display:block;font-size:13px;color:var(--text-primary);">奖级表</b>';
  html += `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;table-layout:auto;">`;
  html += `<thead><tr style="border-bottom:2px solid #374151;">`;
  html += `<th style="${TH}">奖级</th><th style="${TH}">中奖条件</th><th style="${TH}text-align:center;">类型</th><th style="${TH}text-align:right;">奖金</th>`;
  html += '</tr></thead><tbody>';

  for (const prize of prizes) {
    if (!prize.matchPattern) continue;
    const patterns = prize.matchPattern;

    // 中奖条件：球可视化
    const ballsHtmls = patterns.map(pattern => {
      let s = '';
      pattern.forEach((hits, zi) => {
        if (zi > 0) s += '<span style="color:#6b7280;margin:0 2px;">+</span>';
        const zone = zones[zi];
        for (let i = 0; i < hits; i++) {
          s += `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${zone.color};margin:0 1px;"></span>`;
        }
      });
      return s;
    });
    const conditionHtml = ballsHtmls.join('<span style="color:#6b7280;margin:0 4px;">/</span>');

    // 类型
    const typeStr = prize.fixed ? '固定' : '浮动';
    const typeColor = prize.fixed ? '#22c55e' : '#e8c547';

    // 奖金
    let amountHtml = '';
    if (prize.fixed) {
      amountHtml = `<span style="color:#e8c547;font-weight:600;">${prize.amount.toLocaleString()}元</span>`;
      if (prize.highPoolAmount) {
        amountHtml += `<br><span style="font-size:10px;color:#888;">奖池≥8亿时: ${prize.highPoolAmount.toLocaleString()}元</span>`;
      }
      if (prize.bonusPoolThreshold) {
        amountHtml += `<br><span style="font-size:10px;color:#888;">奖池≥${(prize.bonusPoolThreshold / 100000000).toFixed(0)}亿触发</span>`;
      }
    } else {
      amountHtml = '<span style="color:#e8c547;font-weight:600;">浮动</span>';
    }

    html += `<tr style="border-bottom:1px solid #2a2f3a;">`;
    html += `<td style="${TD}white-space:nowrap;font-weight:600;color:var(--text-primary);">${prize.name}</td>`;
    html += `<td style="${TD}white-space:nowrap;">${conditionHtml}</td>`;
    html += `<td style="${TD}text-align:center;color:${typeColor};white-space:nowrap;">${typeStr}</td>`;
    html += `<td style="${TD}text-align:right;white-space:nowrap;">${amountHtml}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table>';

  // ===== 2. 封顶规则 =====
  const hasCaps = prizes.some(p => p.maxPerTicket || p.maxTotal || p.maxAddOnPerTicket);
  if (hasCaps || config.maxJackpotPerTicket) {
    html += '<b style="display:block;font-size:13px;color:var(--text-primary);margin:6px 0;">封顶规则</b>';
    html += '<div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">';
    const caps = [];
    if (config.maxJackpotPerTicket && !prizes.some(p => p.maxPerTicket)) {
      caps.push(`单注封顶${config.maxJackpotPerTicket.toLocaleString()}元`);
    }
    for (const p of prizes) {
      if (!p.maxPerTicket && !p.maxTotal && !p.maxAddOnPerTicket) continue;
      let capText = `${p.name}:`;
      if (p.maxPerTicket) capText += `单注${p.maxPerTicket.toLocaleString()}元`;
      if (p.maxAddOnPerTicket) capText += `追加${p.maxAddOnPerTicket.toLocaleString()}元`;
      if (p.maxTotal) capText += `总额${p.maxTotal.toLocaleString()}元`;
      caps.push(capText);
    }
    html += caps.join(' | ');
    html += '</div>';
  }

  // ===== 3. 特别规则 =====
  const specialRules = {
    ssq: '奖池≥15亿元时触发福运奖(3红即中5元) | 一等奖:奖池<1亿单注封顶500万,≥1亿合计封顶1000万 | 二等奖封顶500万',
    dlt: '奖池≥8亿元时固定奖奖金提档 | 一等奖:奖池<1亿单注封顶500万,≥1亿合计封顶1000万 | 追加投注浮动奖可获基本奖金80%加成',
    qxc: '奖池≤3亿元(正常期):一等奖=浮动90%+奖池,二等奖=浮动10% | 奖池>3亿元(倒置期):一等奖=浮动10%+奖池,二等奖=浮动90%'
  };
  if (specialRules[config.id || currentLottery]) {
    html += '<b style="display:block;font-size:13px;color:var(--text-primary);margin:6px 0;">特别规则</b>';
    html += `<div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${specialRules[config.id || currentLottery]}</div>`;
  }

  html += '</div>';
  return html;
}

/* ============ 快乐8奖级表生成 ============ */
const KL8_PRIZE_RULES = {
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

function generateKl8PrizeTable(selectNum) {
  const rule = KL8_PRIZE_RULES[selectNum];
  if (!rule) return '';

  const TH = 'padding:8px 12px;text-align:left;color:#9ca3af;font-size:11px;font-weight:600;';
  const TD = 'padding:8px 12px;font-size:12px;border-bottom:1px solid #2a2f3a;';

  let html = '<div style="width:100%;max-width:100%;">';

  html += '<b style="margin-bottom:6px;display:block;font-size:13px;color:var(--text-primary);">奖级表</b>';
  html += `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">`;
  html += `<thead><tr style="border-bottom:2px solid #374151;">`;
  html += `<th style="${TH}">奖级</th><th style="${TH}">中奖条件</th><th style="${TH}text-align:center;">类型</th><th style="${TH}text-align:right;">奖金</th>`;
  html += '</tr></thead><tbody>';

  rule.prizes.forEach((prize, index) => {
    const isWinning = prize.prize !== '0元';
    if (!isWinning) return;

    const prizeName = `${rule.name}${prize.match.replace('中', '')}`;
    const typeStr = prize.prize.includes('浮动') ? '浮动' : '固定';
    const typeColor = prize.prize.includes('浮动') ? '#e8c547' : '#22c55e';

    html += `<tr>`;
    html += `<td style="${TD}white-space:nowrap;font-weight:600;color:var(--text-primary);">${prizeName}</td>`;
    html += `<td style="${TD}white-space:nowrap;">`;

    const matchNum = parseInt(prize.match.replace('中', ''));
    for (let i = 0; i < selectNum; i++) {
      if (i < matchNum) {
        html += `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#e94560;margin:0 1px;"></span>`;
      } else {
        html += `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#4b5563;margin:0 1px;"></span>`;
      }
    }
    html += `</td>`;
    html += `<td style="${TD}text-align:center;color:${typeColor};white-space:nowrap;">${typeStr}</td>`;
    html += `<td style="${TD}text-align:right;white-space:nowrap;color:#e8c547;font-weight:600;">${prize.prize}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';

  if (selectNum === 9) {
    html += '<div style="margin-bottom:12px;">';
    html += `<b style="display:block;font-size:13px;color:var(--text-primary);margin-bottom:6px;">封顶规则</b>`;
    html += `<div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">选九中九 单注25万</div>`;
    html += '</div>';
    html += '<div>';
    html += `<b style="display:block;font-size:13px;color:var(--text-primary);margin-bottom:6px;">特别规则</b>`;
    html += `<div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">浮动奖奖池超1亿元</div>`;
    html += '</div>';
  } else if (selectNum === 10) {
    html += '<div style="margin-bottom:12px;">';
    html += `<b style="display:block;font-size:13px;color:var(--text-primary);margin-bottom:6px;">封顶规则</b>`;
    html += `<div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">选十中十 单注500万</div>`;
    html += '</div>';
    html += '<div>';
    html += `<b style="display:block;font-size:13px;color:var(--text-primary);margin-bottom:6px;">特别规则</b>`;
    html += `<div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">选十中九派1.6万元 | 选九中九派4千元 | 浮动奖奖池超1亿元</div>`;
    html += '</div>';
  }

  html += '</div>';
  return html;
}

/* ============ 快乐8选号类型切换 ============ */
function bindKl8SelectTabs() {
  const kl8Tabs = $('#kl8-select-tabs');
  if (kl8Tabs) {
    kl8Tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.kl8-select-btn');
      if (!btn) return;

      $$('.kl8-select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      kl8SelectNum = parseInt(btn.dataset.select);

      // 更新快乐8选号区的目标数量及复式范围
      const config = LOTTERY_CONFIG['kl8'];
      config.zones[0].count = kl8SelectNum;
      config.zones[0].compoundMin = kl8SelectNum;
      config.zones[0].compoundMax = 80;

      // 重新渲染选号面板和规则
      renderNumberPanel();
      updateRulesDisplay();
    });
  }
}

/* ============ 清空全部 ============ */
function bindResetButton() {
  $('#reset-all-btn').addEventListener('click', () => {
    resetAll();
  });
}

function resetAll() {
  // 清空所有彩票类型的缓存选号
  Object.keys(savedSelections).forEach(key => savedSelections[key] = null);
  Object.keys(savedRequiredCounts).forEach(key => savedRequiredCounts[key] = null);
  Object.keys(savedRandomCountMode).forEach(key => savedRandomCountMode[key] = null);

  // 重置全局状态
  multiplier = 1;
  extraBet = false;
  betMode = 'compound';
  playType3D = 'direct';
  kl8SelectNum = 10;

  // 重置倍投显示
  updateMultiplierDisplay();

  // 重置追加投注滑块
  const extraBetSlider = $('#extra-bet-slider');
  const extraBetValue = $('#extra-bet-value');
  if (extraBetSlider) extraBetSlider.value = 40;
  if (extraBetValue) extraBetValue.textContent = '40';
  extraBetRatio = 40;

  // 重置投注方式按钮
  $$('#bet-mode-toggle .bet-mode-btn').forEach(b => b.classList.remove('active'));
  const compoundBtn = document.querySelector('#bet-mode-toggle .bet-mode-btn[data-mode="compound"]');
  if (compoundBtn) compoundBtn.classList.add('active');

  // 重置玩法类型按钮
  $$('#play-type-toggle .bet-mode-btn').forEach(b => b.classList.remove('active'));
  const directBtn = document.querySelector('#play-type-toggle .bet-mode-btn[data-play="direct"]');
  if (directBtn) directBtn.classList.add('active');

  // 重置快乐8选号类型
  const kl8Tabs = $$('#kl8-select-tabs .kl8-select-btn');
  kl8Tabs.forEach(b => b.classList.remove('active'));
  const kl8Btn10 = document.querySelector('#kl8-select-tabs .kl8-select-btn[data-select="10"]');
  if (kl8Btn10) kl8Btn10.classList.add('active');
  const kl8Config = LOTTERY_CONFIG['kl8'];
  if (kl8Config) kl8Config.zones[0].count = 10;

  // 清空当前选号并重新渲染
  clearSelection();
  renderNumberPanel();
  updateBetSettingsVisibility();
  updateBetInfo();
}

/* ============ 投注方式切换（复式/胆拖） ============ */
function bindBetModeToggle() {
  $('#bet-mode-toggle').addEventListener('click', (e) => {
    const btn = e.target.closest('.bet-mode-btn');
    if (!btn) return;
    const mode = btn.dataset.mode;
    if (mode === betMode) return;
    betMode = mode;
    $$('#bet-mode-toggle .bet-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderNumberPanel();
    updateBetInfo();
  });
}

/* ============ 3D 玩法类型切换 ============ */
function bindPlayTypeToggle() {
  $('#play-type-toggle').addEventListener('click', (e) => {
    const btn = e.target.closest('.bet-mode-btn');
    if (!btn) return;
    const play = btn.dataset.play;
    if (play === playType3D) return;
    playType3D = play;
    $$('#play-type-toggle .bet-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderNumberPanel();
    updateBetInfo();
  });
}

/* ============ 大乐透追加投注占比滑块 ============ */
function bindExtraBetSlider() {
  const slider = $('#extra-bet-slider');
  const valueEl = $('#extra-bet-value');
  
  if (slider) {
    slider.addEventListener('input', (e) => {
      extraBetRatio = parseInt(e.target.value);
      if (valueEl) {
        valueEl.textContent = extraBetRatio;
      }
      updateBetInfo();
    });
  }
}

/* ============ 倍投控制 ============ */
function bindMultiplierControls() {
  $('#multiplier-dec').addEventListener('click', () => {
    if (multiplier > 1) {
      multiplier--;
      updateMultiplierDisplay();
      updateBetInfo();
    }
  });
  $('#multiplier-inc').addEventListener('click', () => {
    if (multiplier < 99) {
      multiplier++;
      // 如果倍投后超限，自动缩减
      if (isOverLimit()) {
        const config = LOTTERY_CONFIG[currentLottery];
        while (isOverLimit()) {
          shrinkSelection(config);
        }
      }
      updateMultiplierDisplay();
      updateBetInfo();
    }
  });
  $('#multiplier-quick').addEventListener('change', (e) => {
    multiplier = parseInt(e.target.value);
    // 如果倍投后超限，自动缩减
    if (isOverLimit()) {
      const config = LOTTERY_CONFIG[currentLottery];
      while (isOverLimit()) {
        shrinkSelection(config);
      }
    }
    updateMultiplierDisplay();
    updateBetInfo();
  });
}

function updateMultiplierDisplay() {
  $('#multiplier-value').textContent = multiplier;
  $('#multiplier-quick').value = multiplier <= 99 ? multiplier : '';
}

/* ============ 更新投注设置区可见性 ============ */
function updateBetSettingsVisibility() {
  const config = LOTTERY_CONFIG[currentLottery];
  const betModeGroup = $('#bet-mode-toggle').parentElement;
  const extraBetGroup = $('#extra-bet-group');
  const playTypeGroup = $('#play-type-group');

  if (['fc3d', 'pls'].includes(currentLottery)) {
    // 福彩3D、排列三：复式/胆拖 + 玩法类型（单选/组选3/组选6）
    betModeGroup.parentElement.style.display = '';
    playTypeGroup.style.display = '';
    extraBetGroup.style.display = 'none';
  } else if (['qxc', 'plw'].includes(currentLottery)) {
    // 七星彩、排列五：纯定位选号，无复式/胆拖
    betModeGroup.parentElement.style.display = 'none';
    playTypeGroup.style.display = 'none';
    extraBetGroup.style.display = 'none';
  } else if (['qlc', 'kl8'].includes(currentLottery)) {
    // 七乐彩、快乐8：单区复式/胆拖
    betModeGroup.parentElement.style.display = '';
    playTypeGroup.style.display = 'none';
    extraBetGroup.style.display = 'none';
  } else {
    // 双色球、大乐透等：复式/胆拖 + 大乐透追加
    betModeGroup.parentElement.style.display = '';
    playTypeGroup.style.display = 'none';
    extraBetGroup.style.display = currentLottery === 'dlt' ? '' : 'none';
  }
}

/* ============ 选号区渲染 ============ */
function renderNumberPanel(restoreFromOther = false) {
  const panel = $('#number-panel');
  const config = LOTTERY_CONFIG[currentLottery];

  // 初始化数量目标
  if (restoreFromOther && savedRequiredCounts[currentLottery]) {
    requiredCounts = [...savedRequiredCounts[currentLottery]];
  } else {
    if (['fc3d', 'pls'].includes(currentLottery) && (playType3D === 'group3' || playType3D === 'group6')) {
      // 组选模式：初始数量按玩法要求
      requiredCounts = [playType3D === 'group3' ? 2 : 3];
    } else {
      requiredCounts = config.zones.map(z => z.count);
    }
  }

  // 初始化随机模式
  if (restoreFromOther && savedRandomCountMode[currentLottery]) {
    randomCountMode = { ...savedRandomCountMode[currentLottery] };
  } else {
    randomCountMode = {};
    if (['fc3d', 'pls'].includes(currentLottery) && (playType3D === 'group3' || playType3D === 'group6')) {
      randomCountMode[0] = false;
    } else {
      config.zones.forEach((_, idx) => { randomCountMode[idx] = false; });
    }
  }

  // 隐藏/显示投注设置
  updateBetSettingsVisibility();

  // 清空并渲染号码区
  selectedNumbers = {};

  const positionalLotteries = ['fc3d', 'pls'];  // 有玩法切换的定位选号
  const purePositionalLotteries = ['qxc', 'plw'];  // 纯定位选号

  if (['fc3d', 'pls'].includes(currentLottery)) {
    if (betMode === 'dantuo') {
      panel.innerHTML = render3DDantuoPanel(config);
      bind3DDantuoBallClicks();
    } else {
      panel.innerHTML = render3DPanel(config);
      bind3DBallClicks();
    }
  } else if (['qxc', 'plw'].includes(currentLottery)) {
    panel.innerHTML = renderPositionalPanel(config);
    bindPositionalBallClicks();
  } else if (currentLottery === 'kl8') {
    if (betMode === 'dantuo') {
      panel.innerHTML = renderDantuoPanel(config);
      bindDantuoBallClicks();
    } else {
      panel.innerHTML = renderCompoundPanel(config);
      bindCompoundBallClicks();
    }
  } else if (betMode === 'dantuo') {
    panel.innerHTML = renderDantuoPanel(config);
    bindDantuoBallClicks();
  } else {
    panel.innerHTML = renderCompoundPanel(config);
    bindCompoundBallClicks();
  }

  // 渲染区域数量增减控件（只在复式模式下显示）
  renderZoneCountControls();

  if (restoreFromOther && savedSelections[currentLottery]) {
    restoreSelections(savedSelections[currentLottery]);
  }

  updateZoneModeDisplay();
  updateBetInfo();
}

/* ============ 复式面板渲染 ============ */
function renderCompoundPanel(config) {
  return config.zones.map((zone, zoneIdx) => {
    selectedNumbers[zoneIdx] = [];
    let balls = '';
    for (let n = zone.min; n <= zone.max; n++) {
      const numStr = String(n).padStart(2, '0');
      balls += `<button class="number-ball zone-${zone.colorClass}" data-zone="${zoneIdx}" data-num="${n}">${numStr}</button>`;
    }

    const minSelect = zone.compoundMin !== undefined ? zone.compoundMin : zone.count;
    const maxSelect = zone.compoundMax !== undefined ? zone.compoundMax : (zone.max - zone.min + 1);
    const hintText = (minSelect === maxSelect)
      ? `（选 ${minSelect} 个）`
      : `（选 ${minSelect} ~ ${maxSelect} 个）`;

    return `
      <div class="number-zone" id="number-zone-${zoneIdx}">
        <div class="zone-label">
          <span>${zone.name}</span>
          <span class="zone-count-info">
            <span class="filled" id="zone-count-${zoneIdx}">0</span>
            <span class="separator">/</span>
            <span class="required">${zone.count}</span>
            <span class="count-hint" id="zone-count-hint-${zoneIdx}">${hintText}</span>
          </span>
        </div>
        <div class="number-grid">${balls}</div>
      </div>
    `;
  }).join('');
}

/* ============ 胆拖面板渲染 ============ */
function renderDantuoPanel(config) {
  const mainZone = config.zones[0];
  const isSingleZone = config.zones.length === 1;

  selectedNumbers = isSingleZone
    ? { dan: [], tuo: [] }
    : { dan: [], tuo: [], secondary: [] };

  // 主区胆码
  let danBalls = '';
  for (let n = mainZone.min; n <= mainZone.max; n++) {
    const numStr = String(n).padStart(2, '0');
    danBalls += `<button class="number-ball zone-${mainZone.colorClass}" data-area="dan" data-num="${n}">${numStr}</button>`;
  }

  // 主区拖码
  let tuoBalls = '';
  for (let n = mainZone.min; n <= mainZone.max; n++) {
    const numStr = String(n).padStart(2, '0');
    tuoBalls += `<button class="number-ball zone-${mainZone.colorClass}" data-area="tuo" data-num="${n}">${numStr}</button>`;
  }

  const mainMaxDan = mainZone.count - 1;

  let html = `
    <!-- 主区胆码 -->
    <div class="number-zone dan-zone" id="dan-zone">
      <div class="zone-label">
        <span class="dan-label">胆码</span>
        <span class="zone-count-info">
          <span class="filled" id="dan-count">0</span>
          <span class="separator">/</span>
          <span class="required">${mainMaxDan}</span>
          <span class="count-hint">（最多 ${mainMaxDan} 个）</span>
        </span>
      </div>
      <div class="number-grid">${danBalls}</div>
    </div>

    <!-- 主区拖码 -->
    <div class="number-zone tuo-zone" id="tuo-zone">
      <div class="zone-label">
        <span class="tuo-label">拖码</span>
        <span class="zone-count-info">
          <span class="filled" id="tuo-count">0</span>
          <span class="count-hint">（拖码与胆码不可重复，胆+拖 ≥ ${mainZone.count}）</span>
        </span>
      </div>
      <div class="number-grid">${tuoBalls}</div>
    </div>
  `;

  // 双区彩票（双色球、大乐透）渲染次区
  if (!isSingleZone) {
    const secondZone = config.zones[1];
    let secondBalls = '';
    for (let n = secondZone.min; n <= secondZone.max; n++) {
      const numStr = String(n).padStart(2, '0');
      secondBalls += `<button class="number-ball zone-${secondZone.colorClass}" data-area="secondary" data-num="${n}">${numStr}</button>`;
    }

    html += `
      <!-- 次区 -->
      <div class="number-zone" id="secondary-zone">
        <div class="zone-label">
          <span>${secondZone.name}</span>
          <span class="zone-count-info">
            <span class="filled" id="secondary-count">0</span>
            <span class="separator">/</span>
            <span class="required">${secondZone.count}+</span>
            <span class="count-hint">（至少 ${secondZone.count} 个）</span>
          </span>
        </div>
        <div class="number-grid">${secondBalls}</div>
      </div>
    `;
  }

  return html;
}

/* ============ 3D 面板渲染（定位复式） ============ */
function render3DPanel(config) {
  const posLabel = ['百位', '十位', '个位'];
  selectedNumbers = { positions: [[], [], []] };  // 每位可多选

  // 组选模式：单排号码池
  if (playType3D === 'group3' || playType3D === 'group6') {
    let poolBalls = '';
    for (let n = 0; n <= 9; n++) {
      const numStr = String(n).padStart(2, '0');
      poolBalls += `<button class="number-ball zone-orange" data-area="pool" data-num="${n}">${numStr}</button>`;
    }

    const minCount = playType3D === 'group3' ? 2 : 3;
    const hintText = playType3D === 'group3'
      ? `（选 2 个号 = 对子，选 3+ 个号 = 复式组三，组合数 = n × (n-1)）`
      : `（选 3 个号 = 单注，选 4+ 个号 = 复式组六，组合数 = C(n,3)）`;

    return `
      <div class="number-zone" id="pool-zone">
        <div class="zone-label">
          <span>${playType3D === 'group3' ? '组选3号码池' : '组选6号码池'}</span>
          <span class="zone-count-info">
            <span class="filled" id="pool-count">0</span>
            <span class="count-hint">${hintText}</span>
          </span>
        </div>
        <div class="number-grid">${poolBalls}</div>
      </div>
    `;
  }

  // 单选/定位复式模式：三位独立
  let html = '';
  for (let pos = 0; pos < 3; pos++) {
    let balls = '';
    for (let n = 0; n <= 9; n++) {
      const numStr = String(n).padStart(2, '0');
      balls += `<button class="number-ball zone-orange" data-area="pos" data-pos="${pos}" data-num="${n}">${numStr}</button>`;
    }

    html += `
      <div class="number-zone" id="pos-zone-${pos}">
        <div class="zone-label">
          <span>${posLabel[pos]}</span>
          <span class="zone-count-info">
            <span class="filled" id="pos-count-${pos}">0</span>
            <span class="separator">/</span>
            <span class="required">1+</span>
            <span class="count-hint">（可选多个 - 定位复式）</span>
          </span>
        </div>
        <div class="number-grid">${balls}</div>
      </div>
    `;
  }
  return html;
}

/* ============ 定位面板渲染（七星彩、排列五） ============ */
function renderPositionalPanel(config) {
  const posCount = config.zones.length;
  selectedNumbers = { positions: Array.from({ length: posCount }, () => []) };

  let html = '';
  for (let pos = 0; pos < posCount; pos++) {
    const zone = config.zones[pos];
    let balls = '';
    for (let n = zone.min; n <= zone.max; n++) {
      const numStr = String(n).padStart(2, '0');
      balls += `<button class="number-ball zone-${zone.colorClass}" data-area="pos" data-pos="${pos}" data-num="${n}">${numStr}</button>`;
    }

    html += `
      <div class="number-zone" id="pos-zone-${pos}">
        <div class="zone-label">
          <span>${zone.name}</span>
          <span class="zone-count-info">
            <span class="filled" id="pos-count-${pos}">0</span>
            <span class="separator">/</span>
            <span class="required">1+</span>
            <span class="count-hint">（可选多个 - 定位复式）</span>
          </span>
        </div>
        <div class="number-grid">${balls}</div>
      </div>
    `;
  }
  return html;
}

/* ============ 复式号码球点击事件 ============ */
function bindCompoundBallClicks() {
  $$('.number-ball[data-zone]').forEach(ball => {
    ball.addEventListener('click', () => {
      const zoneIdx = parseInt(ball.dataset.zone);
      const num = parseInt(ball.dataset.num);
      const pool = selectedNumbers[zoneIdx];
      const numIndex = pool.indexOf(num);

      if (numIndex > -1) {
        pool.splice(numIndex, 1);
        ball.classList.remove('selected');
      } else {
        // 先临时加上，检查是否超限
        pool.push(num);
        if (isOverLimit()) {
          pool.pop(); // 超限则撤销
          return;
        }
        ball.classList.add('selected');
      }

      pool.sort((a, b) => a - b);
      updateCompoundCount(zoneIdx);
      updateZoneModeDisplay();
      updateBetInfo();
    });
  });
}

/* ============ 胆拖号码球点击事件 ============ */
function bindDantuoBallClicks() {
  // 胆码点击
  $$('.number-ball[data-area="dan"]').forEach(ball => {
    ball.addEventListener('click', () => {
      const num = parseInt(ball.dataset.num);
      const pool = selectedNumbers.dan;
      const config = LOTTERY_CONFIG[currentLottery];
      const mainMaxDan = config.zones[0].count - 1;
      const numIndex = pool.indexOf(num);

      if (numIndex > -1) {
        pool.splice(numIndex, 1);
        ball.classList.remove('selected');
      } else {
        if (pool.length >= mainMaxDan) return;
        // 如果拖码中有这个号，自动从拖码移除
        const tuoIndex = selectedNumbers.tuo.indexOf(num);
        if (tuoIndex > -1) {
          selectedNumbers.tuo.splice(tuoIndex, 1);
          const tuoBall = $(`.number-ball[data-area="tuo"][data-num="${num}"]`);
          if (tuoBall) tuoBall.classList.remove('selected');
          updateDantuoCount('tuo');
        }
        pool.push(num);
        if (isOverLimit()) {
          pool.pop();
          // 恢复拖码
          return;
        }
        ball.classList.add('selected');
      }
      pool.sort((a, b) => a - b);
      updateDantuoCount('dan');
      updateBetInfo();
    });
  });

  // 拖码点击
  $$('.number-ball[data-area="tuo"]').forEach(ball => {
    ball.addEventListener('click', () => {
      const num = parseInt(ball.dataset.num);
      const pool = selectedNumbers.tuo;
      const numIndex = pool.indexOf(num);

      if (numIndex > -1) {
        pool.splice(numIndex, 1);
        ball.classList.remove('selected');
      } else {
        // 如果胆码中有这个号，自动从胆码移除
        const danIndex = selectedNumbers.dan.indexOf(num);
        if (danIndex > -1) {
          selectedNumbers.dan.splice(danIndex, 1);
          const danBall = $(`.number-ball[data-area="dan"][data-num="${num}"]`);
          if (danBall) danBall.classList.remove('selected');
          updateDantuoCount('dan');
        }
        pool.push(num);
        if (isOverLimit()) {
          pool.pop();
          return;
        }
        ball.classList.add('selected');
      }
      pool.sort((a, b) => a - b);
      updateDantuoCount('tuo');
      updateBetInfo();
    });
  });

  // 次区点击（仅双区彩票）
  if (config.zones.length > 1) {
    $$('.number-ball[data-area="secondary"]').forEach(ball => {
      ball.addEventListener('click', () => {
        const num = parseInt(ball.dataset.num);
        const pool = selectedNumbers.secondary;
        const numIndex = pool.indexOf(num);

        if (numIndex > -1) {
          pool.splice(numIndex, 1);
          ball.classList.remove('selected');
        } else {
          pool.push(num);
          if (isOverLimit()) {
            pool.pop();
            return;
          }
          ball.classList.add('selected');
        }
        pool.sort((a, b) => a - b);
        updateDantuoCount('secondary');
        updateBetInfo();
      });
    });
  }
}

/* ============ 3D 胆拖面板渲染 ============ */
function render3DDantuoPanel(config) {
  selectedNumbers = { dan: [], tuo: [] };

  // 胆码区（0-9）
  let danBalls = '';
  for (let n = 0; n <= 9; n++) {
    const numStr = String(n).padStart(2, '0');
    danBalls += `<button class="number-ball zone-orange" data-area="dan3d" data-num="${n}">${numStr}</button>`;
  }

  // 拖码区（0-9）
  let tuoBalls = '';
  for (let n = 0; n <= 9; n++) {
    const numStr = String(n).padStart(2, '0');
    tuoBalls += `<button class="number-ball zone-orange" data-area="tuo3d" data-num="${n}">${numStr}</button>`;
  }

  // 根据玩法类型显示提示信息
  let hintText = '';
  if (playType3D === 'group6') {
    hintText = '组选6胆拖：从拖码中选(3-胆码数)个补足3位，胆码必须全中';
  } else if (playType3D === 'group3') {
    hintText = '组选3胆拖：从拖码中选号码组成对子+胆码组合，胆码必须出现';
  } else {
    hintText = '单选胆拖：每位可重复，号码来自(胆码∪拖码)且至少含1个胆码';
  }

  return `
    <div class="number-zone dan-zone" id="dan3d-zone">
      <div class="zone-label">
        <span class="dan-label">胆码</span>
        <span class="zone-count-info">
          <span class="filled" id="dan3d-count">0</span>
          <span class="count-hint">（${hintText}）</span>
        </span>
      </div>
      <div class="number-grid">${danBalls}</div>
    </div>

    <div class="number-zone tuo-zone" id="tuo3d-zone">
      <div class="zone-label">
        <span class="tuo-label">拖码</span>
        <span class="zone-count-info">
          <span class="filled" id="tuo3d-count">0</span>
          <span class="count-hint">（与胆码不可重复）</span>
        </span>
      </div>
      <div class="number-grid">${tuoBalls}</div>
    </div>
  `;
}

/* ============ 3D 胆拖号码球点击事件 ============ */
function bind3DDantuoBallClicks() {
  // 胆码点击
  $$('.number-ball[data-area="dan3d"]').forEach(ball => {
    ball.addEventListener('click', () => {
      const num = parseInt(ball.dataset.num);
      const pool = selectedNumbers.dan;
      const numIndex = pool.indexOf(num);

      if (numIndex > -1) {
        pool.splice(numIndex, 1);
        ball.classList.remove('selected');
      } else {
        // 如果拖码中有这个号，自动从拖码移除
        const tuoIndex = selectedNumbers.tuo.indexOf(num);
        if (tuoIndex > -1) {
          selectedNumbers.tuo.splice(tuoIndex, 1);
          const tuoBall = $(`.number-ball[data-area="tuo3d"][data-num="${num}"]`);
          if (tuoBall) tuoBall.classList.remove('selected');
          const tuoCountEl = $('#tuo3d-count');
          if (tuoCountEl) tuoCountEl.textContent = selectedNumbers.tuo.length;
        }
        pool.push(num);
        if (isOverLimit()) {
          pool.pop();
          return;
        }
        ball.classList.add('selected');
      }
      pool.sort((a, b) => a - b);
      const danCountEl = $('#dan3d-count');
      if (danCountEl) danCountEl.textContent = pool.length;
      updateBetInfo();
    });
  });

  // 拖码点击
  $$('.number-ball[data-area="tuo3d"]').forEach(ball => {
    ball.addEventListener('click', () => {
      const num = parseInt(ball.dataset.num);
      const pool = selectedNumbers.tuo;
      const numIndex = pool.indexOf(num);

      if (numIndex > -1) {
        pool.splice(numIndex, 1);
        ball.classList.remove('selected');
      } else {
        // 如果胆码中有这个号，自动从胆码移除
        const danIndex = selectedNumbers.dan.indexOf(num);
        if (danIndex > -1) {
          selectedNumbers.dan.splice(danIndex, 1);
          const danBall = $(`.number-ball[data-area="dan3d"][data-num="${num}"]`);
          if (danBall) danBall.classList.remove('selected');
          const danCountEl = $('#dan3d-count');
          if (danCountEl) danCountEl.textContent = selectedNumbers.dan.length;
        }
        pool.push(num);
        if (isOverLimit()) {
          pool.pop();
          return;
        }
        ball.classList.add('selected');
      }
      pool.sort((a, b) => a - b);
      const tuoCountEl = $('#tuo3d-count');
      if (tuoCountEl) tuoCountEl.textContent = pool.length;
      updateBetInfo();
    });
  });
}

/* ============ 3D 号码球点击事件 ============ */
function bind3DBallClicks() {
  if (playType3D === 'group3' || playType3D === 'group6') {
    // 组选模式 - 单池选号
    $$('.number-ball[data-area="pool"]').forEach(ball => {
      ball.addEventListener('click', () => {
        const num = parseInt(ball.dataset.num);
        const pool = selectedNumbers.positions;
        if (!pool.selectedPool) pool.selectedPool = [];
        const idx = pool.selectedPool.indexOf(num);

        if (idx > -1) {
          pool.selectedPool.splice(idx, 1);
          ball.classList.remove('selected');
        } else {
          pool.selectedPool.push(num);
          if (isOverLimit()) {
            pool.selectedPool.pop();
            return;
          }
          ball.classList.add('selected');
        }
        pool.selectedPool.sort((a, b) => a - b);
        const countEl = $('#pool-count');
        if (countEl) countEl.textContent = pool.selectedPool.length;
        updateBetInfo();
      });
    });
  } else {
    // 单选/定位复式模式
    $$('.number-ball[data-area="pos"]').forEach(ball => {
      ball.addEventListener('click', () => {
        const pos = parseInt(ball.dataset.pos);
        const num = parseInt(ball.dataset.num);
        const pool = selectedNumbers.positions[pos];
        const idx = pool.indexOf(num);

        if (idx > -1) {
          pool.splice(idx, 1);
          ball.classList.remove('selected');
        } else {
          pool.push(num);
          if (isOverLimit()) {
            pool.pop();
            return;
          }
          ball.classList.add('selected');
        }
        pool.sort((a, b) => a - b);
        const countEl = $(`#pos-count-${pos}`);
        if (countEl) countEl.textContent = pool.length;
        updateBetInfo();
      });
    });
  }
}

/* ============ 定位面板号码球点击事件（七星彩、排列五） ============ */
function bindPositionalBallClicks() {
  $$('.number-ball[data-area="pos"]').forEach(ball => {
    ball.addEventListener('click', () => {
      const pos = parseInt(ball.dataset.pos);
      const num = parseInt(ball.dataset.num);
      const pool = selectedNumbers.positions[pos];
      const idx = pool.indexOf(num);

      if (idx > -1) {
        pool.splice(idx, 1);
        ball.classList.remove('selected');
      } else {
        pool.push(num);
        if (isOverLimit()) {
          pool.pop();
          return;
        }
        ball.classList.add('selected');
      }
      pool.sort((a, b) => a - b);
      const countEl = $(`#pos-count-${pos}`);
      if (countEl) countEl.textContent = pool.length;
      updateBetInfo();
    });
  });
}

/* ============ 更新复式计数显示 ============ */
function updateCompoundCount(zoneIdx) {
  const countEl = $(`#zone-count-${zoneIdx}`);
  if (countEl) countEl.textContent = selectedNumbers[zoneIdx].length;
}

/* ============ 更新胆拖计数显示 ============ */
function updateDantuoCount(area) {
  let countEl;
  if (area === 'dan') countEl = $('#dan-count');
  else if (area === 'tuo') countEl = $('#tuo-count');
  else countEl = $('#secondary-count');
  if (countEl) countEl.textContent = selectedNumbers[area].length;
}

/* ============ 渲染区域数量增减控件 ============ */
function renderZoneCountControls() {
  const container = $('#zone-count-controls');
  const config = LOTTERY_CONFIG[currentLottery];

  // 胆拖模式不显示计数器（胆码/拖码数量由选号决定）
  if (betMode === 'dantuo') {
    container.innerHTML = '';
    return;
  }

  // 组选模式：单号码池
  if (['fc3d', 'pls'].includes(currentLottery) && (playType3D === 'group3' || playType3D === 'group6')) {
    const minCount = playType3D === 'group3' ? 2 : 3;
    const maxCount = 10;
    const isRandom = randomCountMode[0] === true;
    const html = `
      <div class="zone-count-control zone-orange" data-zone="0">
        <span class="zone-count-label">号码池</span>
        <button class="zone-count-btn zone-count-dec" data-zone="0" data-action="dec" ${requiredCounts[0] <= minCount ? 'disabled' : ''}>−</button>
        <span class="zone-count-value" id="zone-count-value-0">${requiredCounts[0]}</span>
        <button class="zone-count-btn zone-count-inc" data-zone="0" data-action="inc" ${requiredCounts[0] >= maxCount ? 'disabled' : ''}>+</button>
        <span class="zone-count-max">/ ${maxCount}</span>
        <button class="zone-count-btn zone-count-random ${isRandom ? 'active' : ''}" data-zone="0" data-action="random" title="开启后机选填号时数量随机">随机</button>
      </div>
    `;
    container.innerHTML = html;

    container.querySelectorAll('.zone-count-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const zoneIdx = parseInt(btn.dataset.zone);
        const action = btn.dataset.action;

        if (action === 'inc') {
          if (requiredCounts[zoneIdx] < maxCount) requiredCounts[zoneIdx]++;
          const valueEl = $(`#zone-count-value-${zoneIdx}`);
          if (valueEl) valueEl.textContent = requiredCounts[zoneIdx];
          const incBtn = container.querySelector(`.zone-count-inc[data-zone="${zoneIdx}"]`);
          const decBtn = container.querySelector(`.zone-count-dec[data-zone="${zoneIdx}"]`);
          if (incBtn) incBtn.disabled = requiredCounts[zoneIdx] >= maxCount;
          if (decBtn) decBtn.disabled = requiredCounts[zoneIdx] <= minCount;
          updateBetInfo();
        } else if (action === 'dec') {
          if (requiredCounts[zoneIdx] > minCount) requiredCounts[zoneIdx]--;
          const valueEl = $(`#zone-count-value-${zoneIdx}`);
          if (valueEl) valueEl.textContent = requiredCounts[zoneIdx];
          const incBtn = container.querySelector(`.zone-count-inc[data-zone="${zoneIdx}"]`);
          const decBtn = container.querySelector(`.zone-count-dec[data-zone="${zoneIdx}"]`);
          if (incBtn) incBtn.disabled = requiredCounts[zoneIdx] >= maxCount;
          if (decBtn) decBtn.disabled = requiredCounts[zoneIdx] <= minCount;
          updateBetInfo();
        } else if (action === 'random') {
          randomCountMode[zoneIdx] = !randomCountMode[zoneIdx];
          btn.classList.toggle('active', randomCountMode[zoneIdx]);
        }
      });
    });
    return;
  }

  const html = config.zones.map((zone, zoneIdx) => {
    const maxCount = zone.compoundMax || (zone.max - zone.min + 1);
    const colorClass = zone.colorClass;
    const isRandom = randomCountMode[zoneIdx] === true;
    return `
      <div class="zone-count-control zone-${colorClass}" data-zone="${zoneIdx}">
        <span class="zone-count-label">${zone.name}</span>
        <button class="zone-count-btn zone-count-dec" data-zone="${zoneIdx}" data-action="dec" ${requiredCounts[zoneIdx] <= zone.count ? 'disabled' : ''}>−</button>
        <span class="zone-count-value" id="zone-count-value-${zoneIdx}">${requiredCounts[zoneIdx]}</span>
        <button class="zone-count-btn zone-count-inc" data-zone="${zoneIdx}" data-action="inc" ${requiredCounts[zoneIdx] >= maxCount ? 'disabled' : ''}>+</button>
        <span class="zone-count-max">/ ${maxCount}</span>
        <button class="zone-count-btn zone-count-random ${isRandom ? 'active' : ''}" data-zone="${zoneIdx}" data-action="random" title="开启后机选填号时数量随机">随机</button>
      </div>
    `;
  }).join('');

  container.innerHTML = html;

  // 绑定事件
  container.querySelectorAll('.zone-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const zoneIdx = parseInt(btn.dataset.zone);
      const action = btn.dataset.action;
      const config = LOTTERY_CONFIG[currentLottery];
      const zone = config.zones[zoneIdx];
      const maxCount = zone.compoundMax || (zone.max - zone.min + 1);

      if (action === 'inc') {
        if (requiredCounts[zoneIdx] < maxCount) requiredCounts[zoneIdx]++;
        const valueEl = $(`#zone-count-value-${zoneIdx}`);
        if (valueEl) valueEl.textContent = requiredCounts[zoneIdx];
        const incBtn = container.querySelector(`.zone-count-inc[data-zone="${zoneIdx}"]`);
        const decBtn = container.querySelector(`.zone-count-dec[data-zone="${zoneIdx}"]`);
        if (incBtn) incBtn.disabled = requiredCounts[zoneIdx] >= maxCount;
        if (decBtn) decBtn.disabled = requiredCounts[zoneIdx] <= zone.count;
        updateBetInfo();
      } else if (action === 'dec') {
        if (requiredCounts[zoneIdx] > zone.count) requiredCounts[zoneIdx]--;
        const valueEl = $(`#zone-count-value-${zoneIdx}`);
        if (valueEl) valueEl.textContent = requiredCounts[zoneIdx];
        const incBtn = container.querySelector(`.zone-count-inc[data-zone="${zoneIdx}"]`);
        const decBtn = container.querySelector(`.zone-count-dec[data-zone="${zoneIdx}"]`);
        if (incBtn) incBtn.disabled = requiredCounts[zoneIdx] >= maxCount;
        if (decBtn) decBtn.disabled = requiredCounts[zoneIdx] <= zone.count;
        updateBetInfo();
      } else if (action === 'random') {
        randomCountMode[zoneIdx] = !randomCountMode[zoneIdx];
        btn.classList.toggle('active', randomCountMode[zoneIdx]);
      }
    });
  });
}

/* ============ 恢复已选号码 ============ */
function restoreSelections(saved) {
  if (!saved) return;

  if (['fc3d', 'pls'].includes(currentLottery)) {
    if (betMode === 'dantuo' && saved.dan !== undefined) {
      // 3D 胆拖恢复
      selectedNumbers.dan = [...saved.dan];
      selectedNumbers.tuo = [...saved.tuo];
      selectedNumbers.dan.forEach(num => {
        const ball = $(`.number-ball[data-area="dan3d"][data-num="${num}"]`);
        if (ball) ball.classList.add('selected');
      });
      selectedNumbers.tuo.forEach(num => {
        const ball = $(`.number-ball[data-area="tuo3d"][data-num="${num}"]`);
        if (ball) ball.classList.add('selected');
      });
      const danCountEl = $('#dan3d-count');
      if (danCountEl) danCountEl.textContent = selectedNumbers.dan.length;
      const tuoCountEl = $('#tuo3d-count');
      if (tuoCountEl) tuoCountEl.textContent = selectedNumbers.tuo.length;
    } else if (saved.positions) {
      // 定位复式恢复
      const posCount = currentLottery === 'fc3d' ? 3 : 3;
      for (let pos = 0; pos < posCount; pos++) {
        if (saved.positions[pos] && saved.positions[pos].length > 0) {
          selectedNumbers.positions[pos] = [...saved.positions[pos]];
          saved.positions[pos].forEach(num => {
            const ball = $(`.number-ball[data-area="pos"][data-pos="${pos}"][data-num="${num}"]`);
            if (ball) ball.classList.add('selected');
            const countEl = $(`#pos-count-${pos}`);
            if (countEl) countEl.textContent = selectedNumbers.positions[pos].length;
          });
        }
      }
      if (saved.positions.selectedPool) {
        selectedNumbers.positions.selectedPool = [...saved.positions.selectedPool];
        saved.positions.selectedPool.forEach(num => {
          const ball = $(`.number-ball[data-area="pool"][data-num="${num}"]`);
          if (ball) ball.classList.add('selected');
        });
        const countEl = $('#pool-count');
        if (countEl) countEl.textContent = saved.positions.selectedPool.length;
      }
    }
  } else if (['qxc', 'plw'].includes(currentLottery)) {
    // 定位面板恢复（七星彩、排列五）
    if (saved.positions) {
      const posCount = LOTTERY_CONFIG[currentLottery].zones.length;
      for (let pos = 0; pos < posCount; pos++) {
        if (saved.positions[pos] && saved.positions[pos].length > 0) {
          selectedNumbers.positions[pos] = [...saved.positions[pos]];
          saved.positions[pos].forEach(num => {
            const ball = $(`.number-ball[data-area="pos"][data-pos="${pos}"][data-num="${num}"]`);
            if (ball) ball.classList.add('selected');
            const countEl = $(`#pos-count-${pos}`);
            if (countEl) countEl.textContent = selectedNumbers.positions[pos].length;
          });
        }
      }
    }
  } else if (betMode === 'dantuo' && saved.dan !== undefined) {
    // 胆拖恢复
    const config = LOTTERY_CONFIG[currentLottery];
    selectedNumbers.dan = [...saved.dan];
    selectedNumbers.tuo = [...saved.tuo];
    if (saved.secondary) selectedNumbers.secondary = [...saved.secondary];
    selectedNumbers.dan.forEach(num => {
      const ball = $(`.number-ball[data-area="dan"][data-num="${num}"]`);
      if (ball) ball.classList.add('selected');
    });
    selectedNumbers.tuo.forEach(num => {
      const ball = $(`.number-ball[data-area="tuo"][data-num="${num}"]`);
      if (ball) ball.classList.add('selected');
    });
    if (config.zones.length > 1 && selectedNumbers.secondary) {
      selectedNumbers.secondary.forEach(num => {
        const ball = $(`.number-ball[data-area="secondary"][data-num="${num}"]`);
        if (ball) ball.classList.add('selected');
      });
      updateDantuoCount('secondary');
    }
    updateDantuoCount('dan');
    updateDantuoCount('tuo');
  } else {
    // 复式恢复
    const config = LOTTERY_CONFIG[currentLottery];
    config.zones.forEach((zone, zoneIdx) => {
      if (saved[zoneIdx]) {
        selectedNumbers[zoneIdx] = [...saved[zoneIdx]];
        selectedNumbers[zoneIdx].forEach(num => {
          const ball = $(`.number-ball[data-zone="${zoneIdx}"][data-num="${num}"]`);
          if (ball) ball.classList.add('selected');
        });
        updateCompoundCount(zoneIdx);
      }
    });
  }
}

/* ============ 更新复式类型显示 ============ */
function updateZoneModeDisplay() {
  if (['fc3d', 'pls', 'qxc', 'plw'].includes(currentLottery)) return;
  if (betMode === 'dantuo') return;

  const config = LOTTERY_CONFIG[currentLottery];
  config.zones.forEach((zone, zoneIdx) => {
    const zoneEl = $(`#number-zone-${zoneIdx}`);
    if (!zoneEl) return;
    const selectedCount = selectedNumbers[zoneIdx] ? selectedNumbers[zoneIdx].length : 0;
    const baseCount = zone.count;

    zoneEl.classList.remove('compound-mode', 'single-mode');
    if (selectedCount > baseCount) {
      zoneEl.classList.add('compound-mode');
    } else if (selectedCount === baseCount) {
      zoneEl.classList.add('single-mode');
    }
  });
}

/* ============ 组合数计算 ============ */
function calcCombinations(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k;
  let res = 1;
  for (let i = 0; i < k; i++) {
    res = res * (n - i) / (i + 1);
  }
  return Math.round(res);
}

/* ============ 检查当前选号是否超限 ============ */
function isOverLimit() {
  const config = LOTTERY_CONFIG[currentLottery];
  const totalBets = calcTotalBets();
  if (totalBets <= 0) return false;
  let unitPrice = config.price;
  if (currentLottery === 'dlt' && extraBetRatio > 0) unitPrice = 3;
  return totalBets * unitPrice * multiplier > config.maxAmount;
}

/* ============ 计算总注数 ============ */
function calcTotalBets() {
  const config = LOTTERY_CONFIG[currentLottery];

  // 福彩3D、排列三
  if (['fc3d', 'pls'].includes(currentLottery)) {
    // 胆拖模式
    if (betMode === 'dantuo') {
      const d = selectedNumbers.dan.length;
      const t = selectedNumbers.tuo.length;
      if (d === 0 || t === 0) return 0;

      if (playType3D === 'group6') {
        if (d > 3) return 0;
        const needFromTuo = 3 - d;
        if (t < needFromTuo) return 0;
        return calcCombinations(t, needFromTuo);
      } else if (playType3D === 'group3') {
        if (d + t < 2) return 0;
        let total = 2 * d * t;
        if (d >= 2) {
          total += d * (d - 1);
        }
        return total;
      } else {
        if (d + t < 1) return 0;
        const allCombinations = Math.pow(d + t, 3);
        const tuoOnlyCombinations = Math.pow(t, 3);
        return allCombinations - tuoOnlyCombinations;
      }
    }

    if (playType3D === 'group3') {
      const pool = selectedNumbers.positions.selectedPool || [];
      const n = pool.length;
      if (n < 2) return 0;
      return n * (n - 1);
    } else if (playType3D === 'group6') {
      const pool = selectedNumbers.positions.selectedPool || [];
      const n = pool.length;
      if (n < 3) return 0;
      return calcCombinations(n, 3);
    } else {
      const positions = selectedNumbers.positions;
      if (!positions || positions.some(p => !p || p.length === 0)) return 0;
      let total = 1;
      for (let p of positions) {
        total *= p.length;
        if (total > 10000000) return 10000000;
      }
      return total;
    }
  }

  // 七星彩、排列五：定位复式，每位数量相乘
  if (['qxc', 'plw'].includes(currentLottery)) {
    const positions = selectedNumbers.positions;
    if (!positions || positions.some(p => !p || p.length === 0)) return 0;
    let total = 1;
    for (let p of positions) {
      total *= p.length;
      if (total > 10000000) return 10000000;
    }
    return total;
  }

  // 胆拖模式
  if (betMode === 'dantuo') {
    const danCount = selectedNumbers.dan.length;
    const tuoCount = selectedNumbers.tuo.length;
    const mainZone = config.zones[0];
    const isSingleZone = config.zones.length === 1;

    if (danCount === 0) return 0;
    if (danCount + tuoCount < mainZone.count) return 0;

    const needFromTuo = mainZone.count - danCount;
    if (needFromTuo < 0) return 0;
    const mainBets = needFromTuo === 0 ? 1 : calcCombinations(tuoCount, needFromTuo);
    if (mainBets > 10000000) return 10000000;

    if (isSingleZone) {
      return mainBets;
    }

    const secondaryCount = selectedNumbers.secondary ? selectedNumbers.secondary.length : 0;
    const secondZone = config.zones[1];
    if (secondaryCount < secondZone.count) return 0;
    const secondaryBets = calcCombinations(secondaryCount, secondZone.count);
    
    const total = mainBets * secondaryBets;
    return total > 10000000 ? 10000000 : total;
  }

  // 复式模式
  let total = 1;
  let allFilled = true;
  for (let zoneIdx = 0; zoneIdx < config.zones.length; zoneIdx++) {
    const zone = config.zones[zoneIdx];
    const selected = selectedNumbers[zoneIdx] || [];
    const count = selected.length;
    if (count === 0) {
      allFilled = false;
    } else if (count < zone.count) {
      allFilled = false;
    } else {
      const zoneBets = calcCombinations(count, zone.count);
      total *= zoneBets;
      if (total > 10000000) {
        return 10000000;
      }
    }
  }
  return allFilled ? total : 0;
}

/* ============ 预估注数（用于随机选号时限制） ============ */
function estimateBets(config, testCounts, lotteryType = currentLottery) {
  const maxBetsForLimit = Math.floor(config.maxAmount / config.price / multiplier);
  
  if (['fc3d', 'pls'].includes(lotteryType)) {
    if (playType3D === 'group3') {
      const n = testCounts[0] || 0;
      if (n < 2) return 0;
      return Math.min(n * (n - 1), maxBetsForLimit + 1);
    } else if (playType3D === 'group6') {
      const n = testCounts[0] || 0;
      if (n < 3) return 0;
      return Math.min(calcCombinations(n, 3), maxBetsForLimit + 1);
    } else {
      let total = 1;
      for (let c of testCounts) {
        total *= c || 1;
        if (total > maxBetsForLimit) return maxBetsForLimit + 1;
      }
      return total;
    }
  }

  if (['qxc', 'plw'].includes(lotteryType)) {
    let total = 1;
    for (let c of testCounts) {
      total *= c || 1;
      if (total > maxBetsForLimit) return maxBetsForLimit + 1;
    }
    return total;
  }

  if (lotteryType === 'kl8') {
    const n = testCounts[0] || 0;
    if (n < config.zones[0].count) return 0;
    return Math.min(calcCombinations(n, config.zones[0].count), maxBetsForLimit + 1);
  }

  let total = 1;
  for (let i = 0; i < config.zones.length; i++) {
    const zone = config.zones[i];
    const count = testCounts[i] || 0;
    if (count < zone.count) return 0;
    total *= calcCombinations(count, zone.count);
    if (total > maxBetsForLimit) return maxBetsForLimit + 1;
  }
  return total;
}

/* ============ 获取复式类型描述 ============ */
function getCompoundTypeLabel() {
  const config = LOTTERY_CONFIG[currentLottery];

  if (['fc3d', 'pls'].includes(currentLottery)) {
    if (betMode === 'dantuo') {
      if (playType3D === 'group3') return '组选3胆拖';
      if (playType3D === 'group6') return '组选6胆拖';
      return '单选胆拖';
    }
    if (playType3D === 'group3') return '组选3';
    if (playType3D === 'group6') return '组选6';
    // 判断单选是否定位复式
    const positions = selectedNumbers.positions;
    const hasMultiple = positions.some(p => p.length > 1);
    const allFilled = positions.every(p => p.length > 0);
    if (hasMultiple && allFilled) return '定位复式';
    return '单选';
  }

  if (['qxc', 'plw'].includes(currentLottery)) {
    const positions = selectedNumbers.positions;
    const hasMultiple = positions.some(p => p.length > 1);
    const allFilled = positions.every(p => p.length > 0);
    if (hasMultiple && allFilled) return '定位复式';
    return '单选';
  }

  if (currentLottery === 'kl8') {
    if (betMode === 'dantuo') return '胆拖';
    const selected = selectedNumbers[0] || [];
    const base = config.zones[0].count;
    if (selected.length === base) return '单式';
    if (selected.length > base) return '复式';
    return '（不完整）';
  }

  if (betMode === 'dantuo') {
    const danCount = selectedNumbers.dan.length;
    const tuoCount = selectedNumbers.tuo.length;
    const secondaryCount = selectedNumbers.secondary;
    if (danCount > 0 && tuoCount > 0) {
      if (config.zones.length > 1 && secondaryCount && secondaryCount.length > 0) return '胆拖';
      else if (config.zones.length === 1) return '胆拖';
    }
    return '胆拖';
  }

  // 复式判断（双色球、大乐透、七乐彩）
  if (config.zones.length === 1) {
    // 单区彩票（七乐彩）
    const zone1Count = (selectedNumbers[0] || []).length;
    const base1 = config.zones[0].count;
    if (zone1Count === base1) return '单式';
    if (zone1Count > base1) return '复式';
    return '（不完整）';
  }

  const zone1Count = (selectedNumbers[0] || []).length;
  const zone2Count = (selectedNumbers[1] || []).length;
  const base1 = config.zones[0].count;
  const base2 = config.zones[1].count;

  if (zone1Count === base1 && zone2Count === base2) return '单式';
  if (zone1Count > base1 && zone2Count === base2) return currentLottery === 'ssq' ? '红球复式' : '前区复式';
  if (zone1Count === base1 && zone2Count > base2) return currentLottery === 'ssq' ? '蓝球复式' : '后区复式';
  if (zone1Count > base1 && zone2Count > base2) return currentLottery === 'ssq' ? '全复式' : '双区复式';
  if (zone1Count > base1) return '（不完整）';
  if (zone2Count > base2) return '（不完整）';
  return '单式';
}

/* ============ 选号按钮绑定 ============ */
function bindSelectionButtons() {
  $('#btn-random-fill').addEventListener('click', randomFill);
  $('#btn-clear-select').addEventListener('click', clearSelection);
}

/* ============ 机选填号 ============ */
function randomFill() {
  const config = LOTTERY_CONFIG[currentLottery];
  const maxRetries = 20;
  let retry = 0;

  do {
    retry++;
    doRandomFill(config);
  } while (isOverLimit() && retry < maxRetries);

  // 如果仍然超限，逐步减少号码直到不超限
  while (isOverLimit()) {
    shrinkSelection(config);
  }

  updateBetInfo();
}

/* ============ 执行随机选号 ============ */
function doRandomFill(config) {
  if (['fc3d', 'pls'].includes(currentLottery)) {
    if (betMode === 'dantuo') {
      // 3D 胆拖随机选号
      const danCount = Math.floor(Math.random() * 2) + 1;  // 1-2 个胆码
      const tuoCount = Math.floor(Math.random() * 4) + 2;  // 2-5 个拖码
      const pool = [];
      for (let n = 0; n <= 9; n++) pool.push(n);

      const danPicked = [];
      for (let i = 0; i < danCount && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        danPicked.push(pool.splice(idx, 1)[0]);
      }
      const tuoPicked = [];
      const actualTuo = Math.min(tuoCount, pool.length);
      for (let i = 0; i < actualTuo; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        tuoPicked.push(pool.splice(idx, 1)[0]);
      }
      danPicked.sort((a, b) => a - b);
      tuoPicked.sort((a, b) => a - b);
      selectedNumbers.dan = danPicked;
      selectedNumbers.tuo = tuoPicked;

      $$('.number-ball[data-area="dan3d"]').forEach(ball => {
        ball.classList.toggle('selected', danPicked.includes(parseInt(ball.dataset.num)));
      });
      $$('.number-ball[data-area="tuo3d"]').forEach(ball => {
        ball.classList.toggle('selected', tuoPicked.includes(parseInt(ball.dataset.num)));
      });
      const danCountEl = $('#dan3d-count');
      if (danCountEl) danCountEl.textContent = danPicked.length;
      const tuoCountEl = $('#tuo3d-count');
      if (tuoCountEl) tuoCountEl.textContent = tuoPicked.length;
      return;
    }

    if (playType3D === 'group3' || playType3D === 'group6') {
      const minCount = playType3D === 'group3' ? 2 : 3;
      const maxCount = 10;
      let pickCount;
      if (randomCountMode[0]) {
        const safeMax = Math.min(maxCount - 1, minCount + 5);
        pickCount = minCount + Math.floor(Math.random() * (safeMax - minCount + 1));
      } else {
        pickCount = requiredCounts[0];
      }
      pickCount = Math.max(minCount, Math.min(pickCount, maxCount - 1));
      const pool = [];
      for (let n = 0; n <= 9; n++) pool.push(n);
      const picked = [];
      const actualCount = Math.min(pickCount, 10);
      for (let i = 0; i < actualCount; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
      }
      picked.sort((a, b) => a - b);
      selectedNumbers.positions.selectedPool = picked;

      $$('.number-ball[data-area="pool"]').forEach(ball => {
        const num = parseInt(ball.dataset.num);
        if (picked.includes(num)) ball.classList.add('selected');
        else ball.classList.remove('selected');
      });
      const countEl = $('#pool-count');
      if (countEl) countEl.textContent = picked.length;
    } else {
      const posCount = config.zones.length;
      const testCounts = [];
      
      for (let pos = 0; pos < posCount; pos++) {
        const zone = config.zones[pos];
        const maxCount = zone.max - zone.min + 1;
        let pickCount;
        if (randomCountMode[pos]) {
          const safeMax = Math.min(maxCount - 1, 1 + 4);
          pickCount = 1 + Math.floor(Math.random() * (safeMax - 1 + 1));
        } else {
          pickCount = requiredCounts[pos];
        }
        pickCount = Math.max(1, Math.min(pickCount, maxCount - 1));
        testCounts[pos] = pickCount;
      }

      const estimated = estimateBets(config, testCounts);
      const maxBetsForLimit = Math.floor(config.maxAmount / config.price / multiplier);
      
      if (estimated > maxBetsForLimit && posCount > 1) {
        const avgCount = Math.pow(maxBetsForLimit, 1 / posCount);
        for (let pos = 0; pos < posCount; pos++) {
          testCounts[pos] = Math.max(1, Math.min(testCounts[pos], Math.floor(avgCount) + 1));
        }
      }

      for (let pos = 0; pos < posCount; pos++) {
        const zone = config.zones[pos];
        const pickCount = testCounts[pos];
        const pool = [];
        for (let n = zone.min; n <= zone.max; n++) pool.push(n);
        const picked = [];
        for (let i = 0; i < pickCount; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          picked.push(pool.splice(idx, 1)[0]);
        }
        picked.sort((a, b) => a - b);
        selectedNumbers.positions[pos] = picked;

        $$(`.number-ball[data-area="pos"][data-pos="${pos}"]`).forEach(ball => {
          const num = parseInt(ball.dataset.num);
          if (picked.includes(num)) ball.classList.add('selected');
          else ball.classList.remove('selected');
        });
        const countEl = $(`#pos-count-${pos}`);
        if (countEl) countEl.textContent = picked.length;
      }
    }
    return;
  }

  // 七星彩、排列五：定位随机
  if (['qxc', 'plw'].includes(currentLottery)) {
    const posCount = config.zones.length;
    const testCounts = [];
    
    for (let pos = 0; pos < posCount; pos++) {
      const zone = config.zones[pos];
      const maxCount = zone.max - zone.min + 1;
      let pickCount;
      if (randomCountMode[pos]) {
        const safeMax = Math.min(maxCount - 1, 1 + 3);
        pickCount = 1 + Math.floor(Math.random() * (safeMax - 1 + 1));
      } else {
        pickCount = requiredCounts[pos];
      }
      pickCount = Math.max(1, Math.min(pickCount, maxCount - 1));
      testCounts[pos] = pickCount;
    }

    const estimated = estimateBets(config, testCounts);
    const maxBetsForLimit = Math.floor(config.maxAmount / config.price / multiplier);
    
    if (estimated > maxBetsForLimit && posCount > 1) {
      const avgCount = Math.pow(maxBetsForLimit, 1 / posCount);
      for (let pos = 0; pos < posCount; pos++) {
        testCounts[pos] = Math.max(1, Math.min(testCounts[pos], Math.floor(avgCount) + 1));
      }
    }

    for (let pos = 0; pos < posCount; pos++) {
      const zone = config.zones[pos];
      const pickCount = testCounts[pos];
      const pool = [];
      for (let n = zone.min; n <= zone.max; n++) pool.push(n);
      const picked = [];
      for (let i = 0; i < pickCount; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
      }
      picked.sort((a, b) => a - b);
      selectedNumbers.positions[pos] = picked;

      $$(`.number-ball[data-area="pos"][data-pos="${pos}"]`).forEach(ball => {
        const num = parseInt(ball.dataset.num);
        if (picked.includes(num)) ball.classList.add('selected');
        else ball.classList.remove('selected');
      });
      const countEl = $(`#pos-count-${pos}`);
      if (countEl) countEl.textContent = picked.length;
    }
    return;
  }

  // 胆拖模式
  if (betMode === 'dantuo') {
    const mainZone = config.zones[0];
    const isSingleZone = config.zones.length === 1;
    const mainMaxDan = mainZone.count - 1;

    const danCount = Math.floor(Math.random() * mainMaxDan) + 1;
    const tuoCount = Math.floor(Math.random() * 5) + (mainZone.count - danCount + 1);

    const mainPool = [];
    for (let n = mainZone.min; n <= mainZone.max; n++) mainPool.push(n);
    const danPicked = [];
    for (let i = 0; i < danCount; i++) {
      const idx = Math.floor(Math.random() * mainPool.length);
      danPicked.push(mainPool.splice(idx, 1)[0]);
    }
    const tuoPicked = [];
    const actualTuo = Math.min(tuoCount, mainPool.length);
    for (let i = 0; i < actualTuo; i++) {
      const idx = Math.floor(Math.random() * mainPool.length);
      tuoPicked.push(mainPool.splice(idx, 1)[0]);
    }

    danPicked.sort((a, b) => a - b);
    tuoPicked.sort((a, b) => a - b);

    selectedNumbers.dan = danPicked;
    selectedNumbers.tuo = tuoPicked;

    $$('.number-ball[data-area="dan"]').forEach(ball => {
      ball.classList.toggle('selected', danPicked.includes(parseInt(ball.dataset.num)));
    });
    $$('.number-ball[data-area="tuo"]').forEach(ball => {
      ball.classList.toggle('selected', tuoPicked.includes(parseInt(ball.dataset.num)));
    });
    updateDantuoCount('dan');
    updateDantuoCount('tuo');

    // 双区彩票还需填充次区
    if (!isSingleZone) {
      const secondZone = config.zones[1];
      const secondCount = Math.floor(Math.random() * 3) + secondZone.count;
      const secondPool = [];
      for (let n = secondZone.min; n <= secondZone.max; n++) secondPool.push(n);
      const secondPicked = [];
      const actualSecond = Math.min(secondCount, secondPool.length);
      for (let i = 0; i < actualSecond; i++) {
        const idx = Math.floor(Math.random() * secondPool.length);
        secondPicked.push(secondPool.splice(idx, 1)[0]);
      }
      secondPicked.sort((a, b) => a - b);
      selectedNumbers.secondary = secondPicked;
      $$('.number-ball[data-area="secondary"]').forEach(ball => {
        ball.classList.toggle('selected', secondPicked.includes(parseInt(ball.dataset.num)));
      });
      updateDantuoCount('secondary');
    }
    return;
  }

  // 复式模式
  config.zones.forEach((zone, zoneIdx) => {
    const pool = [];
    for (let n = zone.min; n <= zone.max; n++) pool.push(n);
    let pickCount;
    const maxCount = zone.compoundMax || (zone.max - zone.min + 1);
    if (randomCountMode && randomCountMode[zoneIdx]) {
      let safeMin = zone.count;
      let safeMax;
      if (currentLottery === 'kl8') {
        safeMax = Math.min(maxCount - 1, zone.count + 7);
      } else if (['ssq', 'dlt'].includes(currentLottery) && zoneIdx === 0) {
        safeMax = Math.min(maxCount - 1, zone.count + 4);
      } else {
        safeMax = Math.min(maxCount - 1, zone.count + 2);
      }
      pickCount = safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1));
    } else {
      pickCount = requiredCounts[zoneIdx];
    }
    pickCount = Math.max(zone.count, Math.min(pickCount, maxCount - 1));
    const picked = [];
    for (let i = 0; i < pickCount; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    picked.sort((a, b) => a - b);
    selectedNumbers[zoneIdx] = picked;

    $$(`.number-ball[data-zone="${zoneIdx}"]`).forEach(ball => {
      const num = parseInt(ball.dataset.num);
      if (picked.includes(num)) ball.classList.add('selected');
      else ball.classList.remove('selected');
    });
    updateCompoundCount(zoneIdx);
  });

  // 更新计数器显示
  const container = $('#zone-count-controls');
  config.zones.forEach((zone, zoneIdx) => {
    const valueEl = $(`#zone-count-value-${zoneIdx}`);
    if (valueEl) valueEl.textContent = requiredCounts[zoneIdx];
    const maxCount = zone.compoundMax || (zone.max - zone.min + 1);
    const incBtn = container.querySelector(`.zone-count-inc[data-zone="${zoneIdx}"]`);
    const decBtn = container.querySelector(`.zone-count-dec[data-zone="${zoneIdx}"]`);
    if (incBtn) incBtn.disabled = requiredCounts[zoneIdx] >= maxCount;
    if (decBtn) decBtn.disabled = requiredCounts[zoneIdx] <= zone.count;
  });
  updateZoneModeDisplay();
}

/* ============ 缩减选号直到不超限 ============ */
function shrinkSelection(config) {
  if (['fc3d', 'pls'].includes(currentLottery)) {
    if (betMode === 'dantuo') {
      // 3D 胆拖优先缩减拖码
      if (selectedNumbers.tuo.length > 0) {
        const removed = selectedNumbers.tuo.pop();
        const ball = $(`.number-ball[data-area="tuo3d"][data-num="${removed}"]`);
        if (ball) ball.classList.remove('selected');
        const countEl = $('#tuo3d-count');
        if (countEl) countEl.textContent = selectedNumbers.tuo.length;
      } else if (selectedNumbers.dan.length > 1) {
        const removed = selectedNumbers.dan.pop();
        const ball = $(`.number-ball[data-area="dan3d"][data-num="${removed}"]`);
        if (ball) ball.classList.remove('selected');
        const countEl = $('#dan3d-count');
        if (countEl) countEl.textContent = selectedNumbers.dan.length;
      }
    } else if (playType3D === 'group3' || playType3D === 'group6') {
      const pool = selectedNumbers.positions.selectedPool;
      if (pool && pool.length > 0) {
        const removed = pool.pop();
        const ball = $(`.number-ball[data-area="pool"][data-num="${removed}"]`);
        if (ball) ball.classList.remove('selected');
        const countEl = $('#pool-count');
        if (countEl) countEl.textContent = pool.length;
      }
    } else {
      // 从最多号码的位移除一个
      let maxPos = -1, maxLen = 0;
      const posCount = selectedNumbers.positions.length;
      for (let pos = 0; pos < posCount; pos++) {
        if (selectedNumbers.positions[pos].length > maxLen) {
          maxLen = selectedNumbers.positions[pos].length;
          maxPos = pos;
        }
      }
      if (maxPos >= 0 && selectedNumbers.positions[maxPos].length > 1) {
        const removed = selectedNumbers.positions[maxPos].pop();
        const ball = $(`.number-ball[data-area="pos"][data-pos="${maxPos}"][data-num="${removed}"]`);
        if (ball) ball.classList.remove('selected');
        const countEl = $(`#pos-count-${maxPos}`);
        if (countEl) countEl.textContent = selectedNumbers.positions[maxPos].length;
      }
    }
  } else if (['qxc', 'plw'].includes(currentLottery)) {
    // 从最多号码的位移除一个
    let maxPos = -1, maxLen = 0;
    const posCount = selectedNumbers.positions.length;
    for (let pos = 0; pos < posCount; pos++) {
      if (selectedNumbers.positions[pos].length > maxLen) {
        maxLen = selectedNumbers.positions[pos].length;
        maxPos = pos;
      }
    }
    if (maxPos >= 0 && selectedNumbers.positions[maxPos].length > 1) {
      const removed = selectedNumbers.positions[maxPos].pop();
      const ball = $(`.number-ball[data-area="pos"][data-pos="${maxPos}"][data-num="${removed}"]`);
      if (ball) ball.classList.remove('selected');
      const countEl = $(`#pos-count-${maxPos}`);
      if (countEl) countEl.textContent = selectedNumbers.positions[maxPos].length;
    }
  } else if (betMode === 'dantuo') {
    // 优先缩减拖码
    if (selectedNumbers.tuo.length > 1) {
      const removed = selectedNumbers.tuo.pop();
      const ball = $(`.number-ball[data-area="tuo"][data-num="${removed}"]`);
      if (ball) ball.classList.remove('selected');
      updateDantuoCount('tuo');
    } else if (config.zones.length > 1 && selectedNumbers.secondary && selectedNumbers.secondary.length > config.zones[1].count) {
      const removed = selectedNumbers.secondary.pop();
      const ball = $(`.number-ball[data-area="secondary"][data-num="${removed}"]`);
      if (ball) ball.classList.remove('selected');
      updateDantuoCount('secondary');
    }
  } else {
    // 从号码最多的区域移除一个
    let maxZone = -1, maxLen = 0;
    config.zones.forEach((zone, zoneIdx) => {
      const len = selectedNumbers[zoneIdx] ? selectedNumbers[zoneIdx].length : 0;
      if (len > zone.count && len > maxLen) {
        maxLen = len;
        maxZone = zoneIdx;
      }
    });
    if (maxZone >= 0) {
      const removed = selectedNumbers[maxZone].pop();
      const ball = $(`.number-ball[data-zone="${maxZone}"][data-num="${removed}"]`);
      if (ball) ball.classList.remove('selected');
      updateCompoundCount(maxZone);
      updateZoneModeDisplay();
    }
  }
}

/* ============ 清空重选 ============ */
function clearSelection() {
  const config = LOTTERY_CONFIG[currentLottery];

  if (['fc3d', 'pls'].includes(currentLottery)) {
    if (betMode === 'dantuo') {
      // 3D 胆拖清空
      selectedNumbers.dan = [];
      selectedNumbers.tuo = [];
      $$('.number-ball[data-area="dan3d"]').forEach(ball => ball.classList.remove('selected'));
      $$('.number-ball[data-area="tuo3d"]').forEach(ball => ball.classList.remove('selected'));
      const danCountEl = $('#dan3d-count');
      if (danCountEl) danCountEl.textContent = '0';
      const tuoCountEl = $('#tuo3d-count');
      if (tuoCountEl) tuoCountEl.textContent = '0';
    } else if (playType3D === 'group3' || playType3D === 'group6') {
      selectedNumbers.positions.selectedPool = [];
      $$('.number-ball[data-area="pool"]').forEach(ball => ball.classList.remove('selected'));
      const countEl = $('#pool-count');
      if (countEl) countEl.textContent = '0';
    } else {
      const posCount = config.zones.length;
      for (let pos = 0; pos < posCount; pos++) {
        selectedNumbers.positions[pos] = [];
        $$(`.number-ball[data-area="pos"][data-pos="${pos}"]`).forEach(ball => ball.classList.remove('selected'));
        const countEl = $(`#pos-count-${pos}`);
        if (countEl) countEl.textContent = '0';
      }
    }
  } else if (['qxc', 'plw'].includes(currentLottery)) {
    const posCount = config.zones.length;
    for (let pos = 0; pos < posCount; pos++) {
      selectedNumbers.positions[pos] = [];
      $$(`.number-ball[data-area="pos"][data-pos="${pos}"]`).forEach(ball => ball.classList.remove('selected'));
      const countEl = $(`#pos-count-${pos}`);
      if (countEl) countEl.textContent = '0';
    }
  } else if (betMode === 'dantuo') {
    selectedNumbers.dan = [];
    selectedNumbers.tuo = [];
    if (selectedNumbers.secondary) selectedNumbers.secondary = [];
    $$('.number-ball[data-area="dan"]').forEach(ball => ball.classList.remove('selected'));
    $$('.number-ball[data-area="tuo"]').forEach(ball => ball.classList.remove('selected'));
    $$('.number-ball[data-area="secondary"]').forEach(ball => ball.classList.remove('selected'));
    updateDantuoCount('dan');
    updateDantuoCount('tuo');
    if (config.zones.length > 1) updateDantuoCount('secondary');
  } else {
    config.zones.forEach((zone, zoneIdx) => {
      selectedNumbers[zoneIdx] = [];
      $$(`.number-ball[data-zone="${zoneIdx}"]`).forEach(ball => ball.classList.remove('selected'));
      updateCompoundCount(zoneIdx);
    });
    updateZoneModeDisplay();
  }
  updateBetInfo();
}

/* ============ 更新投注信息显示 ============ */
function updateBetInfo() {
  const config = LOTTERY_CONFIG[currentLottery];
  const betInfo = $('#bet-info');
  const totalBets = calcTotalBets();

  const compoundType = getCompoundTypeLabel();

  if (totalBets > 0) {
    let unitPrice = config.price;
    if (currentLottery === 'dlt' && extraBetRatio > 0) unitPrice = 3;

    const totalPrice = totalBets * unitPrice * multiplier;
    const overLimit = totalPrice > config.maxAmount;

    let infoText = '';
    if (['fc3d', 'pls'].includes(currentLottery)) {
      if (betMode === 'dantuo') {
        const danCount = selectedNumbers.dan.length;
        const tuoCount = selectedNumbers.tuo.length;
        infoText = `<span>${compoundType} | 胆码${danCount}个 拖码${tuoCount}个 | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}¥${totalPrice}</span>`;
      } else if (playType3D === 'group3' || playType3D === 'group6') {
        const pool = selectedNumbers.positions.selectedPool || [];
        infoText = `<span>${playType3D === 'group3' ? '组选3' : '组选6'} | 号码 ${pool.length}个 | ${compoundType} | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}¥${totalPrice}</span>`;
      } else {
        const posTexts = config.zones.map((zone, pos) => `${zone.name}${selectedNumbers.positions[pos].length}个`).join(' ');
        infoText = `<span>${compoundType} | ${posTexts} | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}¥${totalPrice}</span>`;
      }
    } else if (['qxc', 'plw'].includes(currentLottery)) {
      const posTexts = config.zones.map((zone, pos) => `${zone.name}${selectedNumbers.positions[pos].length}个`).join(' ');
      infoText = `<span>${compoundType} | ${posTexts} | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}¥${totalPrice}</span>`;
    } else if (betMode === 'dantuo') {
      const danCount = selectedNumbers.dan.length;
      const tuoCount = selectedNumbers.tuo.length;
      const secondaryCount = selectedNumbers.secondary ? selectedNumbers.secondary.length : 0;
      const secondName = config.zones.length > 1 ? (currentLottery === 'ssq' ? '蓝球' : '后区') : '';
      infoText = `<span>胆拖 | 胆码${danCount}个 拖码${tuoCount}个 ${secondName ? secondName + secondaryCount + '个' : ''} | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}${extraBetRatio > 0 ? `追加${extraBetRatio}% | ` : ''}¥${totalPrice}</span>`;
    } else {
      const zoneTexts = config.zones.map((zone, zoneIdx) => {
        const sel = selectedNumbers[zoneIdx] ? selectedNumbers[zoneIdx].length : 0;
        return `${zone.name}${sel}个`;
      }).join(' ');
      infoText = `<span>${compoundType} | ${zoneTexts} | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}${extraBetRatio > 0 ? `追加${extraBetRatio}% | ` : ''}¥${totalPrice}</span>`;
    }

    betInfo.innerHTML = infoText;
  } else {
    let hint = '请完成选号';
    if (['fc3d', 'pls'].includes(currentLottery)) {
      if (betMode === 'dantuo') {
        hint = '请选胆码和拖码（胆码≥1，拖码≥1）';
      } else if (playType3D === 'group3') hint = '请选 2 个以上号码';
      else if (playType3D === 'group6') hint = '请选 3 个以上号码';
      else hint = '请在每位各选至少 1 个号码';
    } else if (['qxc', 'plw'].includes(currentLottery)) {
      hint = '请在每位各选至少 1 个号码';
    } else if (currentLottery === 'kl8') {
      if (betMode === 'dantuo') {
        hint = '请选胆码 + 拖码（胆+拖 ≥ ' + config.zones[0].count + '）';
      } else {
        hint = '请选择号码（至少 ' + config.zones[0].count + ' 个）';
      }
    } else if (betMode === 'dantuo') {
      if (config.zones.length === 1) {
        hint = '请选胆码 + 拖码（胆+拖 ≥ ' + config.zones[0].count + '）';
      } else {
        hint = '请选胆码 + 拖码（共 ≥ 基础数）以及次区号码';
      }
    } else {
      const hasPartial = config.zones.some((zone, zoneIdx) => {
        const sel = selectedNumbers[zoneIdx] || [];
        return sel.length > 0 && sel.length < zone.count;
      });
      if (hasPartial) hint = '请补全选号';
    }
    betInfo.innerHTML = `<span style="color:var(--text-muted);">${hint}</span>`;
  }
}

/* =====================================================================
   开奖模拟模块
   - 单期/多期随机开奖
   - 使用手选号开奖
   - 本地存储 / 载入 / 导入(Json) / 导出(Json) / 清空
   ===================================================================== */

const DRAW_STORAGE_KEY = 'lottery_simulator_draws_v2';

// ---------- 工具函数 ----------
function pad2(n) { return String(n).padStart(2, '0'); }

function formatTime(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

// 为一区生成随机号码（兼容可重复与不重复）
function generateZoneNumbers(zone, isPositional = false, overrideCount = null) {
  const min = zone.min;
  const max = zone.max;
  // 快乐8官方开奖固定开出20个号码，不受用户选号数量影响
  const count = overrideCount !== null ? overrideCount : zone.count;
  const range = max - min + 1;

  // 号码池够大并且该彩种不要求位置可重复 时，使用不重复抽取
  // 注意：福彩3D、排列三、排列五、七星彩 官方允许号码重复（同位不同位均可重号）
  // 根据现有配置中 zones 的设置，这里统一按"位置选号"的语义处理
  const allowRepeat = (currentLottery === 'fc3d' || currentLottery === 'pls' ||
                       currentLottery === 'plw' || currentLottery === 'qxc');

  if (allowRepeat || isPositional) {
    // 允许重复（3D / 排列 / 七星彩）：每位独立随机
    const nums = [];
    for (let i = 0; i < count; i++) {
      nums.push(min + Math.floor(Math.random() * range));
    }
    return nums;
  }

  // 不重复：洗牌后取前 count 个
  const pool = [];
  for (let n = min; n <= max; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, count);
  picked.sort((a, b) => a - b);
  return picked;
}

// 生成一次"官方开奖"号码
function generateDrawNumbers() {
  const config = LOTTERY_CONFIG[currentLottery];
  const result = {};

  // 位置型彩种（3D/排列三/五/七星彩）：每个位置独立随机1个数字
  const positionalLotteries = ['fc3d', 'pls', 'plw', 'qxc'];
  if (positionalLotteries.includes(currentLottery)) {
    config.zones.forEach(zone => {
      // 每个 zone.count 固定为1，每位独立随机（允许重复）
      const num = zone.min + Math.floor(Math.random() * (zone.max - zone.min + 1));
      result[zone.name] = [num];
    });
    return result;
  }

  // 快乐8：固定开20个号码，不重复
  if (currentLottery === 'kl8') {
    const zone = config.zones[0];
    const pool = [];
    for (let n = zone.min; n <= zone.max; n++) pool.push(n);
    // Fisher-Yates 洗牌
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, 20).sort((a, b) => a - b);
    result[zone.name] = picked;
    return result;
  }

  // 非位置型彩种（双色球/大乐透/七乐彩）：不重复抽取
  config.zones.forEach(zone => {
    const pool = [];
    for (let n = zone.min; n <= zone.max; n++) pool.push(n);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, zone.count);
    picked.sort((a, b) => a - b);
    result[zone.name] = picked;
  });
  return result;
}

// 从用户手选号码中提取"第一注"作为开奖号码（用于"使用手选号开奖"）
// 统一按 LOTTERY_CONFIG.zones 结构返回：{ zoneName: [number, ...] }
function extractManualDrawFromSelection() {
  const config = LOTTERY_CONFIG[currentLottery];
  const result = {};

  // === 位置型彩种（3D/排列三）：每位取第一个号码
  if (['fc3d', 'pls'].includes(currentLottery)) {
    if (betMode === 'dantuo') {
      return null;  // 3D 胆拖不适合手选开奖
    }
    // 组选3 / 组选6：从号码池中取前3个数字（组选3使用前2个重复一个）
    if (playType3D === 'group3' || playType3D === 'group6') {
      const pool = (selectedNumbers.positions && selectedNumbers.positions.selectedPool) || [];
      if (pool.length < (playType3D === 'group3' ? 2 : 3)) return null;
      // 统一按 3 个位置结构返回
      let a, b, c;
      if (playType3D === 'group3') {
        // 组选3：2个不同数字，其中1个重复 → 形式 aab
        a = pool[0]; b = pool[0]; c = pool[1];
      } else {
        // 组选6：3个不同数字
        a = pool[0]; b = pool[1]; c = pool[2];
      }
      return {
        [config.zones[0].name]: [a],
        [config.zones[1].name]: [b],
        [config.zones[2].name]: [c]
      };
    }

    // 单选 / 定位复式：每位取第一个号码
    const positions = selectedNumbers.positions || [];
    if (!positions || positions.length < config.zones.length) return null;
    for (let i = 0; i < config.zones.length; i++) {
      if (!positions[i] || positions[i].length === 0) return null;
    }
    config.zones.forEach((zone, idx) => {
      result[zone.name] = [positions[idx][0]];
    });
    return result;
  }

  // === 排列五：5个位置，每个位置第一个
  if (currentLottery === 'plw') {
    const positions = selectedNumbers.positions || [];
    if (!positions || positions.length < config.zones.length) return null;
    for (let i = 0; i < config.zones.length; i++) {
      if (!positions[i] || positions[i].length === 0) return null;
    }
    config.zones.forEach((zone, idx) => {
      result[zone.name] = [positions[idx][0]];
    });
    return result;
  }

  // === 七星彩：第1位 到 第6位 + 后区
  if (currentLottery === 'qxc') {
    const positions = selectedNumbers.positions || [];
    // 七星彩 zones[0..5]="第N位"(count=1)，zones[6]="后区"(count=1)
    if (!positions || positions.length < config.zones.length) return null;
    for (let i = 0; i < config.zones.length; i++) {
      if (!positions[i] || positions[i].length === 0) return null;
      result[config.zones[i].name] = [positions[i][0]];
    }
    return result;
  }

  // === 快乐8：用户选号 + 随机补足到20个
  if (currentLottery === 'kl8') {
    const zone = config.zones[0];
    const sel = selectedNumbers[0] || [];
    if (sel.length === 0) return null;
    const userNums = [...new Set(sel)];
    // 从1-80中扣除已选号码，随机补充到20个
    const remaining = [];
    const userSet = new Set(userNums);
    for (let n = zone.min; n <= zone.max; n++) {
      if (!userSet.has(n)) remaining.push(n);
    }
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    const need = Math.max(0, 20 - userNums.length);
    const picked = userNums.concat(remaining.slice(0, need)).sort((a, b) => a - b);
    result[zone.name] = picked;
    return result;
  }

  // === 胆拖模式（双色球/大乐透/七乐彩）
  if (betMode === 'dantuo') {
    const mainZone = config.zones[0];
    const dan = selectedNumbers.dan || [];
    const tuo = selectedNumbers.tuo || [];
    if (dan.length === 0 || dan.length + tuo.length < mainZone.count) return null;
    const needFromTuo = mainZone.count - dan.length;
    const mainNums = [...dan, ...tuo.slice(0, needFromTuo)].sort((a, b) => a - b);
    result[mainZone.name] = mainNums;
    if (config.zones.length > 1) {
      const second = config.zones[1];
      const secondary = selectedNumbers.secondary || [];
      if (secondary.length < second.count) return null;
      result[second.name] = secondary.slice(0, second.count).sort((a, b) => a - b);
    }
    return result;
  }

  // === 复式模式（默认）：每区取前 zone.count 个
  for (let zoneIdx = 0; zoneIdx < config.zones.length; zoneIdx++) {
    const zone = config.zones[zoneIdx];
    const sel = selectedNumbers[zoneIdx] || [];
    if (sel.length < zone.count) return null;
    result[zone.name] = sel.slice(0, zone.count).sort((a, b) => a - b);
  }
  return result;
}

// ---------- 存储管理 ----------
function loadAllDraws() {
  try {
    const raw = localStorage.getItem(DRAW_STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch (e) {
    console.warn('加载开奖记录失败：', e);
    return {};
  }
}

function saveAllDraws(all) {
  try {
    const jsonStr = JSON.stringify(all);
    // 检查数据大小，localStorage 通常限制 5MB
    if (jsonStr.length > 4 * 1024 * 1024) {
      alert('数据量过大（接近存储上限），建议先导出并清空部分历史记录。');
    }
    localStorage.setItem(DRAW_STORAGE_KEY, jsonStr);
  } catch (e) {
    console.warn('保存开奖记录失败（可能超出存储限制）：', e);
    alert('本地存储失败：数据量过大，请先导出并清空部分历史记录。');
  }
}

function getDrawsOfCurrentLottery() {
  const all = loadAllDraws();
  return Array.isArray(all[currentLottery]) ? all[currentLottery] : [];
}

function appendDraws(draws) {
  const all = loadAllDraws();
  if (!Array.isArray(all[currentLottery])) all[currentLottery] = [];
  // 使用 push 而非 concat，避免创建新数组
  const targetArr = all[currentLottery];
  for (let i = 0; i < draws.length; i++) {
    targetArr.push(draws[i]);
  }
  // 检查是否超过上限（每种彩种最多保留 2000 期）
  if (targetArr.length > 2000) {
    const excess = targetArr.length - 2000;
    targetArr.splice(0, excess);  // 删除最早的记录
    console.log(`已自动清理最早的 ${excess} 条记录，保持总数不超过 2000`);
  }
  saveAllDraws(all);
}

function deleteOneDraw(drawId) {
  const all = loadAllDraws();
  if (!Array.isArray(all[currentLottery])) return;
  all[currentLottery] = all[currentLottery].filter(d => d.id !== drawId);
  saveAllDraws(all);
}

function clearCurrentLotteryDraws() {
  const all = loadAllDraws();
  all[currentLottery] = [];
  saveAllDraws(all);
}

function clearAllLotteryDraws() {
  saveAllDraws({});
}

function makeDrawRecord(numbers, type = 'random') {
  return {
    id: 'draw_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    timestamp: Date.now(),
    type: type,  // 'random' | 'manual' | 'batch'
    numbers: numbers
  };
}

// ---------- 渲染 ----------
function renderDrawNumbersHTML(numbersObj) {
  const config = LOTTERY_CONFIG[currentLottery];
  const positionalLotteries = ['fc3d', 'pls', 'plw', 'qxc'];
  const isPositional = positionalLotteries.includes(currentLottery);

  let html = '';
  if (isPositional) {
    // 位置型彩种：紧凑横向排列，每个位置一个小竖块（名字在上，号码球在下）
    html += '<div class="positional-draw-row">';
    config.zones.forEach((zone, idx) => {
      const nums = numbersObj[zone.name] || [];
      const colorClass = zone.colorClass || getDefaultColorClass(idx);
      html += '<div class="positional-draw-cell">';
      html += `<span class="positional-draw-label">${zone.name}</span>`;
      html += '<span class="positional-draw-balls">';
      nums.forEach(num => {
        html += `<span class="number-ball zone-${colorClass} selected">${pad2(num)}</span>`;
      });
      html += '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  config.zones.forEach((zone, idx) => {
    const nums = numbersObj[zone.name] || [];
    html += '<div class="draw-zone">';
    html += `<span class="draw-zone-label">${zone.name}</span>`;
    html += '<span class="draw-balls">';
    nums.forEach(num => {
      html += `<span class="number-ball zone-${zone.colorClass || getDefaultColorClass(idx)} selected">${pad2(num)}</span>`;
    });
    html += '</span>';
    html += '</div>';
  });
  return html;
}

function getDefaultColorClass(zoneIdx) {
  return zoneIdx === 0 ? 'red' : 'blue';
}

function renderLatestDraw() {
  const draws = getDrawsOfCurrentLottery();
  const container = $('#latest-draw');
  if (!container) return;
  if (draws.length === 0) {
    container.innerHTML = '<div class="draw-placeholder-hint">暂无开奖记录，请点击上方按钮开始模拟开奖</div>';
    return;
  }
  const latest = draws[draws.length - 1];
  const typeLabel = { 'random': '随机开奖', 'manual': '使用手选号', 'batch': '多期批量' }[latest.type] || '开奖';
  container.innerHTML = `
    <div class="draw-latest-header">
      <span class="draw-latest-title">最近一期开奖</span>
      <span class="draw-latest-meta">时间：${formatTime(latest.timestamp)} · ${typeLabel}</span>
    </div>
    <div class="draw-latest-numbers">${renderDrawNumbersHTML(latest.numbers)}</div>
  `;
}

function renderDrawHistoryTable() {
  const container = $('#draw-history');
  if (!container) return;
  const draws = getDrawsOfCurrentLottery().slice().reverse();  // 最新在上
  const total = draws.length;

  if (total === 0) {
    container.innerHTML = '<div class="draw-placeholder-hint">暂无历史开奖记录</div>';
    return;
  }

  const config = LOTTERY_CONFIG[currentLottery];
  let headerRow = '<tr><th>#</th><th>期数</th>';
  config.zones.forEach(zone => { headerRow += `<th>${zone.name}</th>`; });
  headerRow += '<th>操作</th></tr>';

  // 根据号码数量动态调整显示上限，避免 DOM 过大
  // 快乐8每期20个号码，需要更少的显示行数
  const avgNumsPerZone = config.zones.reduce((sum, z) => sum + (currentLottery === 'kl8' ? 20 : z.count), 0);
  const maxShow = avgNumsPerZone > 10 ? 50 : 100;  // 快乐8显示50期，其他显示100期
  
  const displayDraws = draws.slice(0, maxShow);
  let bodyRows = displayDraws.map((d, i) => {
    const tds = config.zones.map(zone => {
      const nums = d.numbers[zone.name] || [];
      const colorClass = zone.colorClass || (zone === config.zones[0] ? 'red' : 'blue');
      // 对于号码较多的彩种（如快乐8），使用紧凑文本显示而非球样式
      if (nums.length > 10) {
        return `<td class="draw-nums-compact">${nums.map(n => pad2(n)).join(' ')}</td>`;
      }
      return `<td>${nums.map(n => `<span class="mini-ball zone-${colorClass}">${pad2(n)}</span>`).join(' ')}</td>`;
    }).join('');
    // 生成期号：年份 + 序号（如 2026001）
    const year = new Date(d.timestamp).getFullYear();
    const periodNum = `${year}${String(total - i).padStart(3, '0')}`;
    return `<tr data-id="${d.id}">
      <td>${total - i}</td>
      <td class="draw-td-period">${periodNum}</td>
      ${tds}
      <td><button class="btn btn-sm btn-draw-delete" data-id="${d.id}">删除</button></td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="draw-history-header-bar">
      <span>共 <strong>${total}</strong> 期${total > maxShow ? `，仅展示最近 ${maxShow} 期` : ''}</span>
    </div>
    <div class="draw-table-scroll">
      <table class="draw-history-table">
        <thead>${headerRow}</thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;

  // 绑定删除按钮（使用事件委托优化性能）
  const tbody = container.querySelector('.draw-history-table tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-draw-delete');
      if (!btn) return;
      if (!confirm('确认删除此条开奖记录？')) return;
      deleteOneDraw(btn.dataset.id);
      renderLatestDraw();
      renderDrawHistoryTable();
      renderAnalysisPage();
    });
  }
}

function renderAnalysisPage() {
  const analysisCard = document.querySelector('#page-draw-analysis .analysis-card');
  if (!analysisCard) return;
  const draws = getDrawsOfCurrentLottery();
  const total = draws.length;

  if (total === 0) {
    analysisCard.innerHTML = `
      <h2 class="card-title">开奖数据分析</h2>
      <div class="card-placeholder"><p class="placeholder-text">请先进行开奖模拟</p></div>
    `;
    return;
  }

  const config = LOTTERY_CONFIG[currentLottery];
  // 基础统计：每个 zone 每个号码出现次数
  const statsPerZone = config.zones.map(zone => {
    const counts = {};
    for (let n = zone.min; n <= zone.max; n++) counts[n] = 0;
    draws.forEach(d => {
      (d.numbers[zone.name] || []).forEach(num => {
        if (counts[num] !== undefined) counts[num]++;
      });
    });
    const entries = Object.entries(counts).map(([num, c]) => ({ num: parseInt(num), count: c }));
    entries.sort((a, b) => b.count - a.count);
    const topHot = entries.slice(0, Math.min(6, entries.length)).filter(e => e.count > 0);
    const topCold = entries.slice().reverse().slice(0, Math.min(6, entries.length)).filter(e => e.count > 0 && e.count < entries[0].count);
    return { zone, counts, topHot, topCold };
  });

  const statHTML = statsPerZone.map(s => `
    <div class="analysis-stat-block">
      <h3>${s.zone.name}</h3>
      <div><strong>热号：</strong>${s.topHot.length ? s.topHot.map(e => `<span class="mini-ball zone-red">${pad2(e.num)}</span><span class="mini-count">×${e.count}</span>`).join(' ') : '暂无数据'}</div>
      <div style="margin-top:6px;"><strong>冷号：</strong>${s.topCold.length ? s.topCold.map(e => `<span class="mini-ball zone-blue">${pad2(e.num)}</span><span class="mini-count">×${e.count}</span>`).join(' ') : '暂无数据'}</div>
    </div>
  `).join('');

  analysisCard.innerHTML = `
    <h2 class="card-title">开奖数据分析（${currentLottery === 'ssq' ? '双色球' : currentLottery === 'dlt' ? '超级大乐透' : currentLottery === 'fc3d' ? '福彩3D' : currentLottery === 'qxc' ? '七星彩' : currentLottery === 'pls' ? '排列三' : currentLottery === 'plw' ? '排列五' : currentLottery === 'qlc' ? '七乐彩' : '快乐8'} - 共 ${total} 期）</h2>
    ${statHTML}
  `;
}

function renderAllDrawUIs() {
  renderLatestDraw();
  renderDrawHistoryTable();
  renderAnalysisPage();
  updatePurchaseIssueSelect();
}

// ---------- 业务动作 ----------
function doDraw() {
  const input = $('#draw-count-input');
  const raw = parseInt(input.value, 10);
  if (!raw || raw < 1) { alert('请输入不小于 1 的期数'); return; }
  const count = Math.min(raw, 100);
  
  const btnMain = $('#btn-draw-main');
  const originalText = btnMain.textContent;
  btnMain.textContent = `生成中...`;
  btnMain.disabled = true;
  
  setTimeout(() => {
    try {
      const records = [];
      const baseTs = Date.now();
      for (let i = 0; i < count; i++) {
        const numbers = generateDrawNumbers();
        const rec = {
          id: 'draw_' + baseTs + '_' + i,
          timestamp: baseTs + i,
          type: count === 1 ? 'random' : 'batch',
          numbers: numbers
        };
        records.push(rec);
      }
      appendDraws(records);
      renderAllDrawUIs();
    } catch (e) {
      console.error('开奖失败：', e);
      alert('开奖生成失败：' + e.message);
    } finally {
      btnMain.textContent = originalText;
      btnMain.disabled = false;
    }
  }, 10);
}

function doManualDraw() {
  const numbers = extractManualDrawFromSelection();
  if (!numbers) {
    alert('请先在选号区完成有效选号（复式/胆拖/定位复式均可），再使用"使用手选号开奖"功能。');
    return;
  }
  const rec = makeDrawRecord(numbers, 'manual');
  appendDraws([rec]);
  renderAllDrawUIs();
}

// 导出当前彩种的开奖记录为 CSV 格式（简化版）
function doExportDraws() {
  const draws = getDrawsOfCurrentLottery();
  if (draws.length === 0) { alert('当前彩种暂无开奖记录可导出'); return; }

  const config = LOTTERY_CONFIG[currentLottery];
  const lotteryName = config.name;
  const zoneNames = config.zones.map(z => z.name);

  // 构建 CSV 内容
  let csvLines = [];
  // 表头：期数 + 各号码区
  csvLines.push(['期数', ...zoneNames].join(','));

  // 数据行
  draws.forEach((record, idx) => {
    const year = new Date(record.timestamp).getFullYear();
    const periodNum = `${year}${String(draws.length - idx).padStart(3, '0')}`;
    const rowParts = [periodNum];
    zoneNames.forEach(zoneName => {
      const nums = record.numbers[zoneName];
      if (nums && nums.length > 0) {
        rowParts.push(nums.map(n => pad2(n)).join(' '));
      } else {
        rowParts.push('');
      }
    });
    csvLines.push(rowParts.join(','));
  });

  const csvContent = csvLines.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${lotteryName}_draws_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 导入 CSV 格式开奖记录（匹配导出格式，仅导入当前彩种）
function doImportDraws(overwrite = false) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,text/csv';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) throw new Error('文件内容不足');

        const config = LOTTERY_CONFIG[currentLottery];
        const zoneNames = config.zones.map(z => z.name);

        // 解析表头：期数 + 各号码区
        const headers = lines[0].split(',');
        const periodIdx = headers.indexOf('期数');
        if (periodIdx < 0) throw new Error('缺少"期数"列');

        // 建立 zone 列索引映射（按当前彩种的 zone 顺序）
        const zoneColMap = {};
        zoneNames.forEach(zoneName => {
          const idx = headers.indexOf(zoneName);
          if (idx >= 0) zoneColMap[zoneName] = idx;
        });
        if (Object.keys(zoneColMap).length === 0) throw new Error('未找到匹配的号码区列');

        // 获取当前彩种数据
        const current = overwrite ? {} : loadAllDraws();
        if (!Array.isArray(current[currentLottery])) current[currentLottery] = [];
        let added = 0;

        // 解析每行数据
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length <= periodIdx) continue;

          const numbers = {};
          zoneNames.forEach(zoneName => {
            const colIdx = zoneColMap[zoneName];
            if (colIdx >= 0 && cols[colIdx]) {
              const nums = cols[colIdx].trim().split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
              numbers[zoneName] = nums;
            }
          });

          // 检查是否有有效号码
          const hasNumbers = Object.values(numbers).some(nums => nums && nums.length > 0);
          if (!hasNumbers) continue;

          const record = {
            id: 'import_' + Date.now() + '_' + added,
            timestamp: Date.now() - (lines.length - i) * 1000,
            type: 'import',
            numbers: numbers
          };

          current[currentLottery].push(record);
          added++;
        }

        saveAllDraws(current);
        alert(`导入完成，共新增 ${added} 条记录`);
        renderAllDrawUIs();
      } catch (err) {
        alert('导入失败：' + err.message);
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

function doClearCurrent() {
  const draws = getDrawsOfCurrentLottery();
  if (draws.length === 0) { alert('当前彩种没有开奖记录'); return; }
  if (!confirm(`确定清空当前彩种的 ${draws.length} 条开奖记录？此操作不可撤销。`)) return;
  clearCurrentLotteryDraws();
  renderAllDrawUIs();
}

function doClearAll() {
  const all = loadAllDraws();
  const total = Object.values(all).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0);
  if (total === 0) { alert('暂无任何开奖记录'); return; }
  if (!confirm(`确定清空全部 ${total} 条开奖记录？此操作不可撤销。`)) return;
  clearAllLotteryDraws();
  renderAllDrawUIs();
}

// ---------- 事件绑定 ----------
function bindDrawControls() {
  const btnMain = $('#btn-draw-main');
  if (btnMain) btnMain.addEventListener('click', doDraw);

  const presetButtons = document.querySelectorAll('.btn-preset');
  const drawInput = $('#draw-count-input');

  const setPresetHighlight = (value) => {
    presetButtons.forEach(b => b.classList.remove('active'));
    presetButtons.forEach(b => {
      if (b.dataset.count === String(value)) b.classList.add('active');
    });
  };

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const count = btn.dataset.count;
      if (drawInput) drawInput.value = count;
      localStorage.setItem('lottery_draw_count', count);
      setPresetHighlight(count);
    });
  });

  // 手动修改输入框时：保存到 localStorage 并清除预设高亮（不匹配预设时）
  if (drawInput) {
    drawInput.addEventListener('input', () => {
      const val = drawInput.value;
      localStorage.setItem('lottery_draw_count', val);
      setPresetHighlight(val);
    });
  }

  const btnManual = $('#btn-draw-manual');
  if (btnManual) btnManual.addEventListener('click', doManualDraw);

  const btnExport = $('#btn-draw-export');
  if (btnExport) btnExport.addEventListener('click', doExportDraws);

  const btnImport = $('#btn-draw-import');
  if (btnImport) btnImport.addEventListener('click', () => doImportDraws(false));

  const btnImportOverwrite = $('#btn-draw-import-overwrite');
  if (btnImportOverwrite) btnImportOverwrite.addEventListener('click', () => doImportDraws(true));

  const btnClearCurrent = $('#btn-draw-clear-current');
  if (btnClearCurrent) btnClearCurrent.addEventListener('click', doClearCurrent);

  const btnClearAll = $('#btn-draw-clear-all');
  if (btnClearAll) btnClearAll.addEventListener('click', doClearAll);
}

/* =====================================================================
   init 扩展：彩票类型切换后重新渲染开奖 UI
   ===================================================================== */
const originalBindLotteryTabs = bindLotteryTabs;
function extendInitWithDraws() {
  // 在彩票类型切换后刷新开奖面板
  const bindTabs = () => {
    originalBindLotteryTabs();
  };
  // 重新定义：在现有 bindLotteryTabs 中加一个刷新渲染步骤
  const lotteryTabsEl = $('#lottery-tabs');
  if (lotteryTabsEl) {
    lotteryTabsEl.addEventListener('click', () => {
      setTimeout(() => renderAllDrawUIs(), 0);
    });
  }
}

/* =====================================================================
   购买模拟模块
   ===================================================================== */

const PURCHASE_CONFIG = {
  ssq: { 
    hasExtraBet: false, 
    supportDantuo: true,
    defaultFreq: { high: 12, medium: 38, low: 50 },
    defaultBetType: { single: 60, compound: 30, dantuo: 10 },
    defaultMultiplier: { m1: 80, m25: 17, m6: 3 },
    salesFluctuation: 10
  },
  dlt: { 
    hasExtraBet: true, 
    supportDantuo: true,
    defaultFreq: { high: 10, medium: 40, low: 50 },
    defaultBetType: { single: 55, compound: 35, dantuo: 10 },
    defaultMultiplier: { m1: 80, m25: 17, m6: 3 },
    salesFluctuation: 10
  },
  fc3d: { 
    hasExtraBet: false, 
    supportDantuo: true,
    defaultFreq: { high: 15, medium: 35, low: 50 },
    defaultBetType: { single: 40, compound: 50, dantuo: 10 },
    defaultMultiplier: { m1: 82, m25: 15, m6: 3 },
    salesFluctuation: 8
  },
  qxc: { 
    hasExtraBet: false, 
    supportDantuo: false,
    defaultFreq: { high: 8, medium: 37, low: 55 },
    defaultBetType: { single: 70, compound: 30, dantuo: 0 },
    defaultMultiplier: { m1: 82, m25: 15, m6: 3 },
    salesFluctuation: 12
  },
  pls: { 
    hasExtraBet: false, 
    supportDantuo: true,
    defaultFreq: { high: 15, medium: 35, low: 50 },
    defaultBetType: { single: 40, compound: 50, dantuo: 10 },
    defaultMultiplier: { m1: 82, m25: 15, m6: 3 },
    salesFluctuation: 8
  },
  plw: { 
    hasExtraBet: false, 
    supportDantuo: false,
    defaultFreq: { high: 10, medium: 40, low: 50 },
    defaultBetType: { single: 95, compound: 5, dantuo: 0 },
    defaultMultiplier: { m1: 82, m25: 15, m6: 3 },
    salesFluctuation: 10
  },
  qlc: { 
    hasExtraBet: false, 
    supportDantuo: true,
    defaultFreq: { high: 7, medium: 38, low: 55 },
    defaultBetType: { single: 60, compound: 28, dantuo: 12 },
    defaultMultiplier: { m1: 80, m25: 17, m6: 3 },
    salesFluctuation: 15
  },
  kl8: { 
    hasExtraBet: false, 
    supportDantuo: true,
    defaultFreq: { high: 15, medium: 35, low: 50 },
    defaultBetType: { single: 70, compound: 25, dantuo: 5 },
    defaultMultiplier: { m1: 80, m25: 17, m6: 3 },
    salesFluctuation: 15
  }
};

const FREQ_MAPPING = {
  high: {
    betType: { single: 20, compound: 55, dantuo: 25 },
    multiplier: { m1: 40, m25: 45, m6: 15 }
  },
  medium: {
    betType: { single: 70, compound: 28, dantuo: 2 },
    multiplier: { m1: 80, m25: 18, m6: 2 }
  },
  low: {
    betType: { single: 98, compound: 2, dantuo: 0 },
    multiplier: { m1: 99, m25: 1, m6: 0 }
  }
};

function createSliderState(config) {
  return {
    freq: {
      high: { id: 'freq-high', value: config.defaultFreq.high, default: config.defaultFreq.high },
      medium: { id: 'freq-medium', value: config.defaultFreq.medium, default: config.defaultFreq.medium },
      low: { id: 'freq-low', value: config.defaultFreq.low, default: config.defaultFreq.low }
    },
    betType: {
      single: { id: 'bet-type-single', value: config.defaultBetType.single, default: config.defaultBetType.single },
      compound: { id: 'bet-type-compound', value: config.defaultBetType.compound, default: config.defaultBetType.compound },
      dantuo: { id: 'bet-type-dantuo', value: config.defaultBetType.dantuo, default: config.defaultBetType.dantuo }
    },
    multiplier: {
      m1: { id: 'multiplier-1', value: config.defaultMultiplier.m1, default: config.defaultMultiplier.m1 },
      m25: { id: 'multiplier-2-5', value: config.defaultMultiplier.m25, default: config.defaultMultiplier.m25 },
      m6: { id: 'multiplier-6', value: config.defaultMultiplier.m6, default: config.defaultMultiplier.m6 }
    },
    basic: {
      totalBets: 50,
      salesFluctuation: config.salesFluctuation,
      extraBetRatio: config.hasExtraBet ? 40 : 0,
      jackpotAmount: 10
    }
  };
}

let lotterySliderStates = {};
Object.keys(PURCHASE_CONFIG).forEach(lotteryId => {
  lotterySliderStates[lotteryId] = createSliderState(PURCHASE_CONFIG[lotteryId]);
});

let freqSliders = {
  high: { id: 'freq-high', value: 12, default: 12, locked: false },
  medium: { id: 'freq-medium', value: 38, default: 38, locked: false },
  low: { id: 'freq-low', value: 50, default: 50, locked: false }
};

let betTypeSliders = {
  single: { id: 'bet-type-single', value: 60, default: 60, locked: false },
  compound: { id: 'bet-type-compound', value: 30, default: 30, locked: false },
  dantuo: { id: 'bet-type-dantuo', value: 10, default: 10, locked: false }
};

let multiplierSliders = {
  m1: { id: 'multiplier-1', value: 80, default: 80, locked: false },
  m25: { id: 'multiplier-2-5', value: 17, default: 17, locked: false },
  m6: { id: 'multiplier-6', value: 3, default: 3, locked: false }
};

let currentBasicParams = {
  totalBets: 50,
  salesFluctuation: 10,
  extraBetRatio: 0,
  jackpotAmount: 10
};

function clampToDefaultRange(value, defaultValue) {
  const min = Math.max(0, Math.round(defaultValue * 0.8));
  const max = Math.min(100, Math.round(defaultValue * 1.2));
  return Math.max(min, Math.min(max, value));
}

// 频次滑块±20pp动态范围（绝对±20百分点）
function getFreqSliderRange(defaultVal) {
  return {
    min: Math.max(0, defaultVal - 20),
    max: Math.min(100, defaultVal + 20)
  };
}

// 格式化百分比显示：整数不带小数，非整数保留1位小数
function fmtPct(value) {
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}

// 通用三联滑块联动处理器工厂
// slidersObj: 滑块对象 { key: {id, value, default} }
// stateGroup: lotterySliderStates[currentLottery] 下的分组名 ('freq'|'betType'|'multiplier')
// isDisabled(key): 可选，返回 true 则该滑块不可操作（如不支持胆拖时 dantuo=0）
function makeLinkedSliderHandler(slidersObj, stateGroup, sliderKey, isDisabled) {
  return function(e) {
    const changedSlider = slidersObj[sliderKey];

    if (isDisabled && isDisabled(sliderKey)) {
      e.target.value = 0;
      slidersObj[sliderKey].value = 0;
      const st = lotterySliderStates[currentLottery];
      if (st && st[stateGroup]) st[stateGroup][sliderKey].value = 0;
      return;
    }

    const range = getFreqSliderRange(changedSlider.default);
    const rawValue = parseFloat(e.target.value);
    const newValue = Math.round(Math.max(range.min, Math.min(range.max, rawValue)) * 10) / 10;
    const oldValue = changedSlider.value;
    const delta = Math.round((newValue - oldValue) * 10) / 10;

    if (delta === 0) {
      e.target.value = newValue;
      $(`#${changedSlider.id}-value`).textContent = changedSlider.id.startsWith('multiplier') || changedSlider.id.startsWith('bet-type') || changedSlider.id.startsWith('freq') ? `${newValue}%` : fmtPct(newValue);
      return;
    }

    changedSlider.value = newValue;
    e.target.value = newValue;
    $(`#${changedSlider.id}-value`).textContent = changedSlider.id.startsWith('multiplier') || changedSlider.id.startsWith('bet-type') || changedSlider.id.startsWith('freq') ? `${newValue}%` : fmtPct(newValue);
    const st = lotterySliderStates[currentLottery];
    if (st && st[stateGroup]) st[stateGroup][sliderKey].value = newValue;

    // 过滤掉被锁定的滑块和禁用的滑块
    let otherKeys = Object.keys(slidersObj).filter(k => k !== sliderKey && !slidersObj[k].locked);
    if (isDisabled) otherKeys = otherKeys.filter(k => !isDisabled(k));

    // 如果所有其他滑块都被锁定，则不调整任何滑块
    if (otherKeys.length === 0) {
      return;
    }

    // 计算每个其他滑块的可用容量
    const capacities = {};
    let totalCapacity = 0;
    otherKeys.forEach(key => {
      const s = slidersObj[key];
      const r = getFreqSliderRange(s.default);
      if (delta > 0) {
        capacities[key] = Math.max(0, Math.round((s.value - r.min) * 10) / 10);
      } else {
        capacities[key] = Math.max(0, Math.round((r.max - s.value) * 10) / 10);
      }
      totalCapacity += capacities[key];
    });

    let remaining = Math.round(-delta * 10) / 10;

    for (let i = 0; i < otherKeys.length; i++) {
      const key = otherKeys[i];
      const s = slidersObj[key];
      const r = getFreqSliderRange(s.default);

      let adjustment;
      if (i === otherKeys.length - 1) {
        adjustment = remaining;
      } else if (totalCapacity > 0) {
        adjustment = Math.round((remaining * capacities[key] / totalCapacity) * 10) / 10;
      } else {
        adjustment = 0;
      }

      let newVal = Math.round((s.value + adjustment) * 10) / 10;
      newVal = Math.max(r.min, Math.min(r.max, newVal));

      const actualChange = Math.round((newVal - s.value) * 10) / 10;
      remaining = Math.round((remaining - actualChange) * 10) / 10;

      s.value = newVal;

      const sliderEl = $(`#${s.id}`);
      const valueEl = $(`#${s.id}-value`);
      if (sliderEl) sliderEl.value = newVal;
      if (valueEl) valueEl.textContent = s.id.startsWith('multiplier') || s.id.startsWith('bet-type') || s.id.startsWith('freq') ? `${newVal}%` : fmtPct(newVal);
      if (st && st[stateGroup]) st[stateGroup][key].value = newVal;
    }

    // 容量不足时回缩变动滑块
    if (remaining !== 0) {
      const adjustedVal = Math.round((changedSlider.value + remaining) * 10) / 10;
      const clamped = Math.max(range.min, Math.min(range.max, adjustedVal));
      changedSlider.value = clamped;
      e.target.value = clamped;
      $(`#${changedSlider.id}-value`).textContent = changedSlider.id.startsWith('multiplier') || changedSlider.id.startsWith('bet-type') || changedSlider.id.startsWith('freq') ? `${clamped}%` : fmtPct(clamped);
      if (st && st[stateGroup]) st[stateGroup][sliderKey].value = clamped;
    }
  };
}

function bindPurchaseControls() {
  bindBasicSliders();
  bindFreqSliders();
  bindBetTypeSliders();
  bindMultiplierSliders();
  bindSliderLocks();
  bindPurchaseActions();
  bindLotteryTypeForPurchase();
  bindPurchaseIssueSelect();
  updateExtraOptionsVisibility();
  updateDantuoVisibility(currentLottery);
  updatePurchaseLotteryInfo(currentLottery);
  // 初次加载时同步滑块值到 HTML（HTML默认值与配置默认值不同，需要此步骤统一）
  updatePurchaseParamsByLottery(currentLottery);
}

function bindSliderLocks() {
  const bindLockForSliders = (slidersObj, prefix) => {
    Object.keys(slidersObj).forEach(key => {
      const lockBtn = $(`#${slidersObj[key].id}-lock`);
      if (lockBtn) {
        lockBtn.addEventListener('click', () => {
          const slider = slidersObj[key];
          
          if (slider.locked) {
            slider.locked = false;
            lockBtn.classList.remove('locked');
            
            const sliderRow = lockBtn.parentElement;
            sliderRow.classList.remove('locked');
            
            const sliderEl = $(`#${slider.id}`);
            if (sliderEl) {
              sliderEl.disabled = false;
            }
          } else {
            const hasLockedSlider = Object.values(slidersObj).some(s => s.locked);
            if (hasLockedSlider) {
              return;
            }
            
            slider.locked = true;
            lockBtn.classList.add('locked');
            
            const sliderRow = lockBtn.parentElement;
            sliderRow.classList.add('locked');
            
            const sliderEl = $(`#${slider.id}`);
            if (sliderEl) {
              sliderEl.disabled = true;
            }
          }
        });
      }
    });
  };

  bindLockForSliders(freqSliders, 'freq');
  bindLockForSliders(betTypeSliders, 'bet-type');
  bindLockForSliders(multiplierSliders, 'multiplier');
}

function bindBasicSliders() {
  const totalBetsSlider = $('#total-bets');
  const totalBetsValue = $('#total-bets-value');
  if (totalBetsSlider && totalBetsValue) {
    totalBetsSlider.addEventListener('input', () => {
      totalBetsValue.textContent = totalBetsSlider.value;
      currentBasicParams.totalBets = parseInt(totalBetsSlider.value);
      if (lotterySliderStates[currentLottery]) {
        lotterySliderStates[currentLottery].basic.totalBets = currentBasicParams.totalBets;
      }
    });
  }

  const salesFluctuationSlider = $('#sales-fluctuation');
  const salesFluctuationValue = $('#sales-fluctuation-value');
  if (salesFluctuationSlider && salesFluctuationValue) {
    salesFluctuationSlider.addEventListener('input', () => {
      salesFluctuationValue.textContent = salesFluctuationSlider.value;
      currentBasicParams.salesFluctuation = parseInt(salesFluctuationSlider.value);
      if (lotterySliderStates[currentLottery]) {
        lotterySliderStates[currentLottery].basic.salesFluctuation = currentBasicParams.salesFluctuation;
      }
    });
  }

  const extraBetSlider = $('#extra-bet-slider');
  const extraBetValue = $('#extra-bet-value');
  if (extraBetSlider && extraBetValue) {
    extraBetSlider.addEventListener('input', () => {
      extraBetValue.textContent = `${extraBetSlider.value}%`;
      currentBasicParams.extraBetRatio = parseInt(extraBetSlider.value);
      if (lotterySliderStates[currentLottery]) {
        lotterySliderStates[currentLottery].basic.extraBetRatio = currentBasicParams.extraBetRatio;
      }
    });
  }

  const jackpotSlider = $('#jackpot-slider');
  const jackpotInput = $('#jackpot-input');
  
  if (jackpotSlider && jackpotInput) {
    jackpotSlider.addEventListener('input', () => {
      const value = parseFloat(jackpotSlider.value);
      jackpotInput.value = value;
      currentBasicParams.jackpotAmount = value;
      if (lotterySliderStates[currentLottery]) {
        lotterySliderStates[currentLottery].basic.jackpotAmount = currentBasicParams.jackpotAmount;
      }
    });

    jackpotInput.addEventListener('input', () => {
      let value = parseFloat(jackpotInput.value);
      if (isNaN(value)) value = 0;
      value = Math.max(0, Math.min(100, value));
      jackpotInput.value = value;
      jackpotSlider.value = value;
      currentBasicParams.jackpotAmount = value;
      if (lotterySliderStates[currentLottery]) {
        lotterySliderStates[currentLottery].basic.jackpotAmount = currentBasicParams.jackpotAmount;
      }
    });
  }
}

function bindFreqSliders() {
  Object.keys(freqSliders).forEach(key => {
    const slider = $(`#${freqSliders[key].id}`);
    if (slider) {
      slider.addEventListener('input', function(e) {
        // 频次滑块变动后需要同步更新投注形式和倍投分布
        makeLinkedSliderHandler(freqSliders, 'freq', key)(e);
        updateMappedValues();
      });
    }
  });
}

function bindBetTypeSliders() {
  Object.keys(betTypeSliders).forEach(key => {
    const slider = $(`#${betTypeSliders[key].id}`);
    if (slider) {
      const isDisabled = (k) => {
        if (k === 'dantuo') {
          const cfg = PURCHASE_CONFIG[currentLottery];
          return !cfg || !cfg.supportDantuo;
        }
        return false;
      };
      slider.addEventListener('input', makeLinkedSliderHandler(betTypeSliders, 'betType', key, isDisabled));
    }
  });
}

function bindMultiplierSliders() {
  Object.keys(multiplierSliders).forEach(key => {
    const slider = $(`#${multiplierSliders[key].id}`);
    if (slider) {
      slider.addEventListener('input', makeLinkedSliderHandler(multiplierSliders, 'multiplier', key));
    }
  });
}

function updateMappedValues() {
  const H = freqSliders.high.value;
  const M = freqSliders.medium.value;
  const L = freqSliders.low.value;
  const total = H + M + L;
  
  if (total === 0) return;

  let betSingle = Math.round((H * FREQ_MAPPING.high.betType.single + M * FREQ_MAPPING.medium.betType.single + L * FREQ_MAPPING.low.betType.single) / total);
  let betCompound = Math.round((H * FREQ_MAPPING.high.betType.compound + M * FREQ_MAPPING.medium.betType.compound + L * FREQ_MAPPING.low.betType.compound) / total);
  let betDantuo = Math.round((H * FREQ_MAPPING.high.betType.dantuo + M * FREQ_MAPPING.medium.betType.dantuo + L * FREQ_MAPPING.low.betType.dantuo) / total);

  let mult1 = Math.round((H * FREQ_MAPPING.high.multiplier.m1 + M * FREQ_MAPPING.medium.multiplier.m1 + L * FREQ_MAPPING.low.multiplier.m1) / total);
  let mult25 = Math.round((H * FREQ_MAPPING.high.multiplier.m25 + M * FREQ_MAPPING.medium.multiplier.m25 + L * FREQ_MAPPING.low.multiplier.m25) / total);
  let mult6 = Math.round((H * FREQ_MAPPING.high.multiplier.m6 + M * FREQ_MAPPING.medium.multiplier.m6 + L * FREQ_MAPPING.low.multiplier.m6) / total);

  // 用±20pp范围限制
  const bSingleR = getFreqSliderRange(betTypeSliders.single.default);
  const bCompoundR = getFreqSliderRange(betTypeSliders.compound.default);
  const bDantuoR = getFreqSliderRange(betTypeSliders.dantuo.default);
  const m1R = getFreqSliderRange(multiplierSliders.m1.default);
  const m25R = getFreqSliderRange(multiplierSliders.m25.default);
  const m6R = getFreqSliderRange(multiplierSliders.m6.default);

  betSingle = Math.max(bSingleR.min, Math.min(bSingleR.max, betSingle));
  betCompound = Math.max(bCompoundR.min, Math.min(bCompoundR.max, betCompound));
  betDantuo = Math.max(bDantuoR.min, Math.min(bDantuoR.max, betDantuo));
  mult1 = Math.max(m1R.min, Math.min(m1R.max, mult1));
  mult25 = Math.max(m25R.min, Math.min(m25R.max, mult25));
  mult6 = Math.max(m6R.min, Math.min(m6R.max, mult6));

  let betTotal = betSingle + betCompound + betDantuo;
  let betAdjust = betTotal - 100;
  let finalDantuo = betDantuo - betAdjust;
  finalDantuo = Math.max(bDantuoR.min, Math.min(bDantuoR.max, finalDantuo));
  
  betTotal = betSingle + betCompound + finalDantuo;
  betAdjust = betTotal - 100;
  
  if (betAdjust !== 0) {
    let finalCompound = betCompound - betAdjust;
    finalCompound = Math.max(bCompoundR.min, Math.min(bCompoundR.max, finalCompound));
    betCompound = finalCompound;
    
    betTotal = betSingle + betCompound + finalDantuo;
    betAdjust = betTotal - 100;
    
    if (betAdjust !== 0) {
      betSingle = 100 - betCompound - finalDantuo;
      betSingle = Math.max(0, Math.min(100, betSingle));
    }
  }

  let multTotal = mult1 + mult25 + mult6;
  let multAdjust = multTotal - 100;
  let finalMult6 = mult6 - multAdjust;
  finalMult6 = Math.max(m6R.min, Math.min(m6R.max, finalMult6));
  
  multTotal = mult1 + mult25 + finalMult6;
  multAdjust = multTotal - 100;
  
  if (multAdjust !== 0) {
    let finalMult25 = mult25 - multAdjust;
    finalMult25 = Math.max(m25R.min, Math.min(m25R.max, finalMult25));
    mult25 = finalMult25;
    
    multTotal = mult1 + mult25 + finalMult6;
    multAdjust = multTotal - 100;
    
    if (multAdjust !== 0) {
      mult1 = 100 - mult25 - finalMult6;
      mult1 = Math.max(0, Math.min(100, mult1));
    }
  }

  betTypeSliders.single.value = betSingle;
  betTypeSliders.compound.value = betCompound;
  betTypeSliders.dantuo.value = finalDantuo;
  
  multiplierSliders.m1.value = mult1;
  multiplierSliders.m25.value = mult25;
  multiplierSliders.m6.value = finalMult6;

  $(`#bet-type-single-value`).textContent = `${betSingle}%`;
  $(`#bet-type-compound-value`).textContent = `${betCompound}%`;
  $(`#bet-type-dantuo-value`).textContent = `${finalDantuo}%`;
  
  $(`#multiplier-1-value`).textContent = `${mult1}%`;
  $(`#multiplier-2-5-value`).textContent = `${mult25}%`;
  $(`#multiplier-6-value`).textContent = `${finalMult6}%`;

  $(`#bet-type-single`).value = betSingle;
  $(`#bet-type-compound`).value = betCompound;
  $(`#bet-type-dantuo`).value = finalDantuo;
  
  $(`#multiplier-1`).value = mult1;
  $(`#multiplier-2-5`).value = mult25;
  $(`#multiplier-6`).value = finalMult6;
}

function bindPurchaseActions() {
  const btnReset = $('#btn-reset-params');
  if (btnReset) {
    btnReset.addEventListener('click', resetPurchaseParams);
  }

  const btnClear = $('#btn-clear-results');
  if (btnClear) {
    btnClear.addEventListener('click', clearPurchaseResults);
  }

  const btnStart = $('#btn-start-simulation');
  if (btnStart) {
    btnStart.addEventListener('click', startPurchaseSimulation);
  }

  const btnExport = $('#btn-export-params');
  if (btnExport) {
    btnExport.addEventListener('click', exportPurchaseParams);
  }

  const btnImport = $('#btn-import-params');
  if (btnImport) {
    btnImport.addEventListener('click', () => {
      $('#import-file-input').click();
    });
  }

  const importInput = $('#import-file-input');
  if (importInput) {
    importInput.addEventListener('change', handleImportFile);
  }
}

function resetPurchaseParams() {
  const config = PURCHASE_CONFIG[currentLottery];
  
  $(`#total-bets`).value = 50;
  $(`#total-bets-value`).textContent = '50';
  
  $(`#sales-fluctuation`).value = config.salesFluctuation;
  $(`#sales-fluctuation-value`).textContent = config.salesFluctuation;

  $(`#freq-high`).value = config.defaultFreq.high;
  $(`#freq-high-value`).textContent = `${config.defaultFreq.high}%`;
  $(`#freq-high-default`).textContent = `默认${config.defaultFreq.high}`;
  freqSliders.high.value = config.defaultFreq.high;

  $(`#freq-medium`).value = config.defaultFreq.medium;
  $(`#freq-medium-value`).textContent = `${config.defaultFreq.medium}%`;
  $(`#freq-medium-default`).textContent = `默认${config.defaultFreq.medium}`;
  freqSliders.medium.value = config.defaultFreq.medium;

  $(`#freq-low`).value = config.defaultFreq.low;
  $(`#freq-low-value`).textContent = `${config.defaultFreq.low}%`;
  $(`#freq-low-default`).textContent = `默认${config.defaultFreq.low}`;
  freqSliders.low.value = config.defaultFreq.low;

  // 同步重置时也更新频次滑块HTML的min/max为动态范围，并重置锁止状态
  ['high', 'medium', 'low'].forEach(key => {
    const s = freqSliders[key];
    const r = getFreqSliderRange(s.default);
    const el = $(`#${s.id}`);
    if (el) {
      el.min = r.min;
      el.max = r.max;
      el.disabled = false;
    }
    s.locked = false;
    const lockBtn = $(`#${s.id}-lock`);
    if (lockBtn) {
      lockBtn.classList.remove('locked');
      lockBtn.parentElement.classList.remove('locked');
    }
  });

  $(`#bet-type-single`).value = config.defaultBetType.single;
  $(`#bet-type-single-value`).textContent = `${config.defaultBetType.single}%`;
  $(`#bet-type-single-default`).textContent = `默认${config.defaultBetType.single}`;
  betTypeSliders.single.value = config.defaultBetType.single;

  $(`#bet-type-compound`).value = config.defaultBetType.compound;
  $(`#bet-type-compound-value`).textContent = `${config.defaultBetType.compound}%`;
  $(`#bet-type-compound-default`).textContent = `默认${config.defaultBetType.compound}`;
  betTypeSliders.compound.value = config.defaultBetType.compound;

  $(`#bet-type-dantuo`).value = config.defaultBetType.dantuo;
  $(`#bet-type-dantuo-value`).textContent = `${config.defaultBetType.dantuo}%`;
  $(`#bet-type-dantuo-default`).textContent = `默认${config.defaultBetType.dantuo}`;
  betTypeSliders.dantuo.value = config.defaultBetType.dantuo;

  $(`#multiplier-1`).value = config.defaultMultiplier.m1;
  $(`#multiplier-1-value`).textContent = `${config.defaultMultiplier.m1}%`;
  $(`#multiplier-1-default`).textContent = `默认${config.defaultMultiplier.m1}`;
  multiplierSliders.m1.value = config.defaultMultiplier.m1;

  $(`#multiplier-2-5`).value = config.defaultMultiplier.m25;
  $(`#multiplier-2-5-value`).textContent = `${config.defaultMultiplier.m25}%`;
  $(`#multiplier-2-5-default`).textContent = `默认${config.defaultMultiplier.m25}`;
  multiplierSliders.m25.value = config.defaultMultiplier.m25;

  $(`#multiplier-6`).value = config.defaultMultiplier.m6;
  $(`#multiplier-6-value`).textContent = `${config.defaultMultiplier.m6}%`;
  $(`#multiplier-6-default`).textContent = `默认${config.defaultMultiplier.m6}`;
  multiplierSliders.m6.value = config.defaultMultiplier.m6;

  // 同步重置时也为 betType 和 multiplier 滑块设置动态 min/max，并重置锁止状态
  ['single', 'compound', 'dantuo'].forEach(key => {
    const s = betTypeSliders[key];
    const r = getFreqSliderRange(s.default);
    const el = $(`#${s.id}`);
    if (el) { 
      el.min = r.min; 
      el.max = r.max; 
      if (key !== 'dantuo' || (PURCHASE_CONFIG[currentLottery] && PURCHASE_CONFIG[currentLottery].supportDantuo)) {
        el.disabled = false;
      }
    }
    s.locked = false;
    const lockBtn = $(`#${s.id}-lock`);
    if (lockBtn) {
      lockBtn.classList.remove('locked');
      lockBtn.parentElement.classList.remove('locked');
    }
  });
  ['m1', 'm25', 'm6'].forEach(key => {
    const s = multiplierSliders[key];
    const r = getFreqSliderRange(s.default);
    const el = $(`#${s.id}`);
    if (el) { 
      el.min = r.min; 
      el.max = r.max; 
      el.disabled = false;
    }
    s.locked = false;
    const lockBtn = $(`#${s.id}-lock`);
    if (lockBtn) {
      lockBtn.classList.remove('locked');
      lockBtn.parentElement.classList.remove('locked');
    }
  });

  const slider = $('#extra-bet-slider');
  const valueEl = $('#extra-bet-value');
  if (slider) slider.value = 40;
  if (valueEl) valueEl.textContent = '40%';
  extraBetRatio = 40;

  updateDantuoVisibility(currentLottery);

  // 将重置值同步到 lotterySliderStates，防止切换彩种再切回时数据回退
  const st = lotterySliderStates[currentLottery];
  if (st) {
    st.basic.totalBets = 50;
    st.basic.salesFluctuation = config.salesFluctuation;
    st.basic.extraBetRatio = 40;
    ['high', 'medium', 'low'].forEach(key => {
      st.freq[key].value = freqSliders[key].value;
      st.freq[key].default = freqSliders[key].default;
    });
    ['single', 'compound', 'dantuo'].forEach(key => {
      st.betType[key].value = betTypeSliders[key].value;
      st.betType[key].default = betTypeSliders[key].default;
    });
    ['m1', 'm25', 'm6'].forEach(key => {
      st.multiplier[key].value = multiplierSliders[key].value;
      st.multiplier[key].default = multiplierSliders[key].default;
    });
  }

  // 持久化重置后的值，防止刷新页面后读取旧的 localStorage 数据
  savePurchaseParamsToLocalStorage();
}

function clearPurchaseResults() {
  const summaryValues = document.querySelectorAll('.purchase-summary .summary-value');
  summaryValues.forEach(el => el.textContent = '--');
}

function startPurchaseSimulation() {
  clearPurchaseResults();
}

function bindLotteryTypeForPurchase() {
  const tabs = $('#lottery-tabs');
  if (tabs) {
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.lottery-tab');
      if (btn) {
        const lotteryId = btn.dataset.id;
        updatePurchaseLotteryInfo(lotteryId);
        updateExtraOptionsVisibility(lotteryId);
        updateDantuoVisibility(lotteryId);
        updateUserFreqVisibility(lotteryId);
        updatePurchaseParamsByLottery(lotteryId);
      }
    });
  }
}

function updatePurchaseLotteryInfo(lotteryId) {
  const lotteryName = $('#purchase-lottery-name');
  if (lotteryName) {
    lotteryName.textContent = LOTTERY_CONFIG[lotteryId]?.name || '双色球';
  }
  updatePurchaseIssueSelect();
}

// 按彩种控制「高中低频」三联滑块的显示：仅快乐8显示，其余隐藏
function updateUserFreqVisibility(lotteryId = currentLottery) {
  const section = document.getElementById('user-freq-section');
  if (!section) return;
  section.style.display = (lotteryId === 'kl8') ? '' : 'none';
}

// 更新购买模拟的期号下拉菜单，与开奖板块数据同步
function updatePurchaseIssueSelect() {
  const select = $('#purchase-issue-select');
  if (!select) return;

  const draws = getDrawsOfCurrentLottery();
  const total = draws.length;
  const prevValue = select.value;

  // 清空选项
  select.innerHTML = '';

  if (total === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '暂无开奖数据';
    select.appendChild(opt);
    renderPurchaseDrawResult(null);
    return;
  }

  // 填充期号选项（最新在上）
  for (let i = total - 1; i >= 0; i--) {
    const d = draws[i];
    const year = new Date(d.timestamp).getFullYear();
    const periodNum = `${year}${String(i + 1).padStart(3, '0')}`;
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = periodNum;
    select.appendChild(opt);
  }

  // 尝试恢复之前选中的值，否则默认选最新一期
  if (prevValue && select.querySelector(`option[value="${prevValue}"]`)) {
    select.value = prevValue;
  } else {
    select.selectedIndex = 0; // 最新一期
  }

  renderPurchaseDrawResult(select.value);
}

// 根据选中的期号ID渲染开奖结果
function renderPurchaseDrawResult(drawId) {
  const container = $('#purchase-draw-result');
  const inner = $('#purchase-draw-result-inner');
  if (!container || !inner) return;

  if (!drawId) {
    container.style.display = 'none';
    inner.innerHTML = '';
    return;
  }

  const draws = getDrawsOfCurrentLottery();
  const draw = draws.find(d => d.id === drawId);
  if (!draw) {
    container.style.display = 'none';
    inner.innerHTML = '';
    return;
  }

  container.style.display = '';
  const config = LOTTERY_CONFIG[currentLottery];
  const positionalLotteries = ['fc3d', 'pls', 'plw', 'qxc'];
  const isPositional = positionalLotteries.includes(currentLottery);
  let numsHTML = '';

  if (isPositional) {
    numsHTML += '<div class="positional-draw-row">';
    config.zones.forEach((zone, idx) => {
      const nums = draw.numbers[zone.name] || [];
      const colorClass = zone.colorClass || (idx === 0 ? 'red' : 'blue');
      numsHTML += '<div class="positional-draw-cell">';
      numsHTML += `<span class="positional-draw-label">${zone.name}</span>`;
      numsHTML += '<span class="positional-draw-balls">';
      nums.forEach(num => {
        numsHTML += `<span class="number-ball zone-${colorClass} selected">${pad2(num)}</span>`;
      });
      numsHTML += '</span>';
      numsHTML += '</div>';
    });
    numsHTML += '</div>';
  } else {
    config.zones.forEach((zone, idx) => {
      const nums = draw.numbers[zone.name] || [];
      const colorClass = zone.colorClass || (idx === 0 ? 'red' : 'blue');
      numsHTML += `<span class="draw-zone-label">${zone.name}</span>`;
      if (nums.length > 10) {
        numsHTML += `<span class="draw-nums-compact">${nums.map(n => pad2(n)).join(' ')}</span>`;
      } else {
        numsHTML += `<span class="draw-balls">${nums.map(n => `<span class="mini-ball zone-${colorClass}">${pad2(n)}</span>`).join('')}</span>`;
      }
    });
  }

  inner.innerHTML = numsHTML;
}

// 绑定期号下拉菜单选择事件
function bindPurchaseIssueSelect() {
  const select = $('#purchase-issue-select');
  if (select) {
    select.addEventListener('change', () => {
      renderPurchaseDrawResult(select.value);
    });
  }
}

function updateExtraOptionsVisibility(lotteryId = currentLottery) {
  const section = $('#extra-options-section');
  if (section) {
    const config = PURCHASE_CONFIG[lotteryId];
    section.style.display = config?.hasExtraBet ? '' : 'none';
  }
}

function updateDantuoVisibility(lotteryId = currentLottery) {
  const config = PURCHASE_CONFIG[lotteryId];
  const dantuoSlider = $('#bet-type-dantuo');
  const dantuoValue = $('#bet-type-dantuo-value');
  const dantuoLabel = document.querySelector('#bet-type-dantuo-value').parentElement;
  
  if (config && !config.supportDantuo) {
    if (dantuoSlider) {
      dantuoSlider.value = 0;
      dantuoSlider.disabled = true;
      dantuoSlider.style.opacity = '0.5';
      dantuoSlider.style.cursor = 'not-allowed';
    }
    if (dantuoValue) {
      dantuoValue.textContent = '0';
    }
    betTypeSliders.dantuo.value = 0;
  } else {
    if (dantuoSlider) {
      dantuoSlider.disabled = false;
      dantuoSlider.style.opacity = '1';
      dantuoSlider.style.cursor = 'pointer';
    }
  }
}

function updatePurchaseParamsByLottery(lotteryId) {
  const config = PURCHASE_CONFIG[lotteryId];
  const savedState = lotterySliderStates[lotteryId];
  if (!config || !savedState) return;

  $(`#total-bets`).value = savedState.basic.totalBets;
  $(`#total-bets-value`).textContent = savedState.basic.totalBets;
  currentBasicParams.totalBets = savedState.basic.totalBets;

  $(`#sales-fluctuation`).value = savedState.basic.salesFluctuation;
  $(`#sales-fluctuation-value`).textContent = savedState.basic.salesFluctuation;
  currentBasicParams.salesFluctuation = savedState.basic.salesFluctuation;

  $(`#extra-bet-slider`).value = savedState.basic.extraBetRatio;
  $(`#extra-bet-value`).textContent = `${savedState.basic.extraBetRatio}%`;
  currentBasicParams.extraBetRatio = savedState.basic.extraBetRatio;

  $(`#jackpot-slider`).value = savedState.basic.jackpotAmount;
  $(`#jackpot-input`).value = savedState.basic.jackpotAmount;
  currentBasicParams.jackpotAmount = savedState.basic.jackpotAmount;

  // === 频次滑块：先设 default + min/max，再设 value（防止浏览器基于旧 range 截断值） ===
  freqSliders.high.default = savedState.freq.high.default;
  freqSliders.medium.default = savedState.freq.medium.default;
  freqSliders.low.default = savedState.freq.low.default;

  ['high', 'medium', 'low'].forEach(key => {
    const s = freqSliders[key];
    const r = getFreqSliderRange(s.default);
    const el = $(`#${s.id}`);
    if (el) {
      el.min = r.min;
      el.max = r.max;
      el.disabled = false;
    }
    s.locked = false;
    const lockBtn = $(`#${s.id}-lock`);
    if (lockBtn) {
      lockBtn.classList.remove('locked');
      lockBtn.parentElement.classList.remove('locked');
    }
  });

  $(`#freq-high`).value = savedState.freq.high.value;
  $(`#freq-high-value`).textContent = `${savedState.freq.high.value}%`;
  $(`#freq-high-default`).textContent = `默认${savedState.freq.high.default}`;
  freqSliders.high.value = savedState.freq.high.value;

  $(`#freq-medium`).value = savedState.freq.medium.value;
  $(`#freq-medium-value`).textContent = `${savedState.freq.medium.value}%`;
  $(`#freq-medium-default`).textContent = `默认${savedState.freq.medium.default}`;
  freqSliders.medium.value = savedState.freq.medium.value;

  $(`#freq-low`).value = savedState.freq.low.value;
  $(`#freq-low-value`).textContent = `${savedState.freq.low.value}%`;
  $(`#freq-low-default`).textContent = `默认${savedState.freq.low.default}`;
  freqSliders.low.value = savedState.freq.low.value;

  // === 投注形式滑块 ===
  betTypeSliders.single.default = savedState.betType.single.default;
  betTypeSliders.compound.default = savedState.betType.compound.default;
  betTypeSliders.dantuo.default = savedState.betType.dantuo.default;

  ['single', 'compound', 'dantuo'].forEach(key => {
    const s = betTypeSliders[key];
    const r = getFreqSliderRange(s.default);
    const el = $(`#${s.id}`);
    if (el) {
      el.min = r.min;
      el.max = r.max;
      if (key !== 'dantuo' || (config && config.supportDantuo)) {
        el.disabled = false;
      }
    }
    s.locked = false;
    const lockBtn = $(`#${s.id}-lock`);
    if (lockBtn) {
      lockBtn.classList.remove('locked');
      lockBtn.parentElement.classList.remove('locked');
    }
  });

  $(`#bet-type-single`).value = savedState.betType.single.value;
  $(`#bet-type-single-value`).textContent = `${savedState.betType.single.value}%`;
  $(`#bet-type-single-default`).textContent = `默认${savedState.betType.single.default}`;
  betTypeSliders.single.value = savedState.betType.single.value;

  $(`#bet-type-compound`).value = savedState.betType.compound.value;
  $(`#bet-type-compound-value`).textContent = `${savedState.betType.compound.value}%`;
  $(`#bet-type-compound-default`).textContent = `默认${savedState.betType.compound.default}`;
  betTypeSliders.compound.value = savedState.betType.compound.value;

  $(`#bet-type-dantuo`).value = savedState.betType.dantuo.value;
  $(`#bet-type-dantuo-value`).textContent = `${savedState.betType.dantuo.value}%`;
  $(`#bet-type-dantuo-default`).textContent = `默认${savedState.betType.dantuo.default}`;
  betTypeSliders.dantuo.value = savedState.betType.dantuo.value;

  // === 倍投分布滑块 ===
  multiplierSliders.m1.default = savedState.multiplier.m1.default;
  multiplierSliders.m25.default = savedState.multiplier.m25.default;
  multiplierSliders.m6.default = savedState.multiplier.m6.default;

  ['m1', 'm25', 'm6'].forEach(key => {
    const s = multiplierSliders[key];
    const r = getFreqSliderRange(s.default);
    const el = $(`#${s.id}`);
    if (el) {
      el.min = r.min;
      el.max = r.max;
      el.disabled = false;
    }
    s.locked = false;
    const lockBtn = $(`#${s.id}-lock`);
    if (lockBtn) {
      lockBtn.classList.remove('locked');
      lockBtn.parentElement.classList.remove('locked');
    }
  });

  $(`#multiplier-1`).value = savedState.multiplier.m1.value;
  $(`#multiplier-1-value`).textContent = `${savedState.multiplier.m1.value}%`;
  $(`#multiplier-1-default`).textContent = `默认${savedState.multiplier.m1.default}`;
  multiplierSliders.m1.value = savedState.multiplier.m1.value;

  $(`#multiplier-2-5`).value = savedState.multiplier.m25.value;
  $(`#multiplier-2-5-value`).textContent = `${savedState.multiplier.m25.value}%`;
  $(`#multiplier-2-5-default`).textContent = `默认${savedState.multiplier.m25.default}`;
  multiplierSliders.m25.value = savedState.multiplier.m25.value;

  $(`#multiplier-6`).value = savedState.multiplier.m6.value;
  $(`#multiplier-6-value`).textContent = `${savedState.multiplier.m6.value}%`;
  $(`#multiplier-6-default`).textContent = `默认${savedState.multiplier.m6.default}`;
  multiplierSliders.m6.value = savedState.multiplier.m6.value;
}

function savePurchaseParamsToLocalStorage() {
  const params = {
    currentBasicParams: currentBasicParams,
    savedAt: new Date().toISOString()
  };
  
  Object.keys(lotterySliderStates).forEach(lotteryId => {
    params[`lottery_${lotteryId}`] = lotterySliderStates[lotteryId];
  });
  
  try {
    localStorage.setItem('lottery-purchase-params', JSON.stringify(params));
  } catch (e) {
    console.error('保存参数失败:', e);
  }
}

function loadPurchaseParamsFromLocalStorage() {
  try {
    const saved = localStorage.getItem('lottery-purchase-params');
    if (!saved) return false;
    
    const params = JSON.parse(saved);
    
    if (params.currentBasicParams) {
      Object.assign(currentBasicParams, params.currentBasicParams);
    }
    
    Object.keys(lotterySliderStates).forEach(lotteryId => {
      const savedKey = `lottery_${lotteryId}`;
      if (params[savedKey]) {
        Object.assign(lotterySliderStates[lotteryId], params[savedKey]);
      }
    });
    
    return true;
  } catch (e) {
    console.error('加载参数失败:', e);
    return false;
  }
}

function exportPurchaseParams() {
  const exportData = [];
  
  exportData.push(['参数分类', '参数名称', '当前值', '默认值', '说明']);
  
  exportData.push(['基础设置', '总注数（万注）', currentBasicParams.totalBets, 50, '模拟投注的总注数']);
  exportData.push(['基础设置', '销量波动（%）', currentBasicParams.salesFluctuation, PURCHASE_CONFIG[currentLottery].salesFluctuation, '销量波动系数']);
  exportData.push(['基础设置', '追加投注占比（%）', currentBasicParams.extraBetRatio, PURCHASE_CONFIG[currentLottery].hasExtraBet ? 40 : 0, '大乐透追加投注占比']);
  exportData.push(['基础设置', '奖池金额（亿元）', currentBasicParams.jackpotAmount, 10, '初始奖池金额']);
  
  exportData.push(['用户频次占比', '高频用户（%）', freqSliders.high.value, freqSliders.high.default, '周购彩3-7次用户占比']);
  exportData.push(['用户频次占比', '中频用户（%）', freqSliders.medium.value, freqSliders.medium.default, '周购彩1-2次用户占比']);
  exportData.push(['用户频次占比', '低频用户（%）', freqSliders.low.value, freqSliders.low.default, '偶尔购彩用户占比']);
  
  exportData.push(['投注形式占比', '单式（%）', betTypeSliders.single.value, betTypeSliders.single.default, '单式投注占比']);
  exportData.push(['投注形式占比', '复式（%）', betTypeSliders.compound.value, betTypeSliders.compound.default, '复式投注占比']);
  exportData.push(['投注形式占比', '胆拖（%）', betTypeSliders.dantuo.value, betTypeSliders.dantuo.default, '胆拖投注占比']);
  
  exportData.push(['倍投分布占比', '1倍（%）', multiplierSliders.m1.value, multiplierSliders.m1.default, '1倍投注占比']);
  exportData.push(['倍投分布占比', '2-5倍（%）', multiplierSliders.m25.value, multiplierSliders.m25.default, '2-5倍投注占比']);
  exportData.push(['倍投分布占比', '6倍及以上（%）', multiplierSliders.m6.value, multiplierSliders.m6.default, '6倍及以上投注占比']);
  
  const csv = exportData.map(row => row.map(cell => {
    if (typeof cell === 'string' && cell.includes(',')) {
      return `"${cell}"`;
    }
    return cell;
  }).join(',')).join('\n');
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `彩票购买模拟参数_${currentLottery}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert('参数已导出成功！');
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    const csvText = event.target.result;
    importPurchaseParams(csvText);
  };
  reader.readAsText(file, 'UTF-8');
  
  e.target.value = '';
}

function importPurchaseParams(csvText) {
  try {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('无效的CSV文件，至少需要包含表头和一行数据');
      return;
    }
    
    const header = lines[0].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
    const paramIndex = header.indexOf('参数名称');
    const valueIndex = header.indexOf('当前值');
    
    if (paramIndex === -1 || valueIndex === -1) {
      alert('CSV文件格式不正确，缺少必要的列（参数名称、当前值）');
      return;
    }
    
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      const paramName = cells[paramIndex]?.trim();
      const value = parseFloat(cells[valueIndex]?.trim());
      
      if (isNaN(value)) continue;
      
      switch (paramName) {
        case '总注数（万注）':
          currentBasicParams.totalBets = value;
          $(`#total-bets`).value = value;
          $(`#total-bets-value`).textContent = value;
          break;
        case '销量波动（%）':
          currentBasicParams.salesFluctuation = value;
          $(`#sales-fluctuation`).value = value;
          $(`#sales-fluctuation-value`).textContent = value;
          break;
        case '追加投注占比（%）':
          currentBasicParams.extraBetRatio = value;
          $(`#extra-bet-slider`).value = value;
          $(`#extra-bet-value`).textContent = `${value}%`;
          break;
        case '奖池金额（亿元）':
          currentBasicParams.jackpotAmount = value;
          $(`#jackpot-slider`).value = value;
          $(`#jackpot-input`).value = value;
          break;
        case '高频用户（%）':
          freqSliders.high.value = value;
          $(`#freq-high`).value = value;
          $(`#freq-high-value`).textContent = value;
          break;
        case '中频用户（%）':
          freqSliders.medium.value = value;
          $(`#freq-medium`).value = value;
          $(`#freq-medium-value`).textContent = value;
          break;
        case '低频用户（%）':
          freqSliders.low.value = value;
          $(`#freq-low`).value = value;
          $(`#freq-low-value`).textContent = value;
          break;
        case '单式（%）':
          betTypeSliders.single.value = value;
          $(`#bet-type-single`).value = value;
          $(`#bet-type-single-value`).textContent = value;
          break;
        case '复式（%）':
          betTypeSliders.compound.value = value;
          $(`#bet-type-compound`).value = value;
          $(`#bet-type-compound-value`).textContent = value;
          break;
        case '胆拖（%）':
          betTypeSliders.dantuo.value = value;
          $(`#bet-type-dantuo`).value = value;
          $(`#bet-type-dantuo-value`).textContent = value;
          break;
        case '1倍（%）':
          multiplierSliders.m1.value = value;
          $(`#multiplier-1`).value = value;
          $(`#multiplier-1-value`).textContent = value;
          break;
        case '2-5倍（%）':
          multiplierSliders.m25.value = value;
          $(`#multiplier-2-5`).value = value;
          $(`#multiplier-2-5-value`).textContent = value;
          break;
        case '6倍及以上（%）':
          multiplierSliders.m6.value = value;
          $(`#multiplier-6`).value = value;
          $(`#multiplier-6-value`).textContent = value;
          break;
      }
    }
    
    savePurchaseParamsToLocalStorage();
    alert('参数导入成功！');
  } catch (e) {
    console.error('导入参数失败:', e);
    alert('导入失败：' + e.message);
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result.map(cell => cell.trim().replace(/^"|"$/g, ''));
}

function bindParamChangeHandlers() {
  const inputs = document.querySelectorAll('.purchase-section input, .purchase-section select');
  inputs.forEach(input => {
    input.addEventListener('change', savePurchaseParamsToLocalStorage);
    input.addEventListener('input', savePurchaseParamsToLocalStorage);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  bindDrawControls();
  renderAllDrawUIs();
  
  const loaded = loadPurchaseParamsFromLocalStorage();
  
  bindPurchaseControls();
  
  bindParamChangeHandlers();
  
  updateUserFreqVisibility(currentLottery);
  
  if (loaded) {
    updatePurchaseParamsByLottery(currentLottery);
  }
});

