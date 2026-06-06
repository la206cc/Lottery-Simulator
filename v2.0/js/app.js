const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ============ 彩票配置 ============ */
const LOTTERY_CONFIG = {
  ssq: {
    name: '双色球',
    price: 2,
    maxAmount: 20000,
    rules: '红球 1-33 选 6（不重复） + 蓝球 1-16 选 1。每周二、四、日开奖。\n\n复式：红球 7-20 个 或 蓝球 2-16 个。\n胆拖：红球 1-5 个胆码 + 拖码（胆+拖 ≥ 7）。',
    zones: [
      { name: '红球', min: 1, max: 33, count: 6, compoundMin: 7, compoundMax: 20, colorClass: 'red' },
      { name: '蓝球', min: 1, max: 16, count: 1, compoundMin: 2, compoundMax: 16, colorClass: 'blue' }
    ]
  },
  dlt: {
    name: '超级大乐透',
    price: 2,
    maxAmount: 30000,
    rules: '前区 1-35 选 5（不重复） + 后区 1-12 选 2（不重复）。每周一、三、六开奖。\n\n复式：前区 6 个以上 或 后区 3 个以上。\n胆拖：前区 1-4 个胆码 + 拖码（胆+拖 ≥ 6）。\n追加投注：每注加 1 元，高级奖奖金提升。',
    zones: [
      { name: '前区', min: 1, max: 35, count: 5, compoundMin: 6, compoundMax: 35, colorClass: 'red' },
      { name: '后区', min: 1, max: 12, count: 2, compoundMin: 3, compoundMax: 12, colorClass: 'blue' }
    ]
  },
  fc3d: {
    name: '福彩3D',
    price: 2,
    maxAmount: 20000,
    rules: '从 0-9 中选 3 个数字。每天开奖。\n\n单选：位置与数字全对，奖金 1040 元。\n组选3：开出对子号，奖金 346 元。\n组选6：开出 3 个不同号，奖金 173 元。\n定位复式：每位可选多个号码。',
    zones: [
      { name: '百位', min: 0, max: 9, count: 1, colorClass: 'orange' },
      { name: '十位', min: 0, max: 9, count: 1, colorClass: 'orange' },
      { name: '个位', min: 0, max: 9, count: 1, colorClass: 'orange' }
    ]
  }
};

/* ============ 全局状态 ============ */
let currentLottery = 'ssq';
let selectedNumbers = {};    // 复式模式: {zoneIdx: [...]} / 胆拖模式: {dan: [...], tuo: [...]} / 3D: {posIdx: [...]}
let requiredCounts = [];     // 目标数量，复式模式下可调整
let randomCountMode = {};    // 随机数量开关
let multiplier = 1;          // 倍投 1-99
let extraBet = false;        // 大乐透追加投注
let betMode = 'compound';    // compound (复式) / dantuo (胆拖)
let playType3D = 'direct';   // direct / group3 / group6

let savedSelections = { ssq: null, dlt: null, fc3d: null };
let savedRequiredCounts = { ssq: null, dlt: null, fc3d: null };
let savedRandomCountMode = { ssq: null, dlt: null, fc3d: null };

/* ============ 初始化 ============ */
function init() {
  bindLotteryTabs();
  bindPageNavigation();
  bindRulesCollapse();
  bindResetButton();
  bindSelectionButtons();
  bindBetModeToggle();
  bindPlayTypeToggle();
  bindExtraBetToggle();
  bindMultiplierControls();
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
  body.innerHTML = config.rules.split('\n').map(line => `<div style="padding:3px 0;">${line}</div>`).join('');
  if (body.classList.contains('open')) {
    body.style.maxHeight = body.scrollHeight + 40 + 'px';
  }
}

/* ============ 清空全部 ============ */
function bindResetButton() {
  $('#reset-all-btn').addEventListener('click', () => {
    clearSelection();
  });
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

/* ============ 大乐透追加投注开关 ============ */
function bindExtraBetToggle() {
  $('#extra-bet-toggle').addEventListener('change', (e) => {
    extraBet = e.target.checked;
    // 如果追加后超限，自动缩减
    if (isOverLimit()) {
      const config = LOTTERY_CONFIG[currentLottery];
      while (isOverLimit()) {
        shrinkSelection(config);
      }
    }
    updateBetInfo();
  });
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

  if (currentLottery === 'fc3d') {
    betModeGroup.parentElement.style.display = 'none';
    playTypeGroup.style.display = '';
    extraBetGroup.style.display = 'none';
  } else {
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
    requiredCounts = config.zones.map(z => z.count);
  }

  // 初始化随机模式
  if (restoreFromOther && savedRandomCountMode[currentLottery]) {
    randomCountMode = { ...savedRandomCountMode[currentLottery] };
  } else {
    randomCountMode = {};
    config.zones.forEach((_, idx) => { randomCountMode[idx] = false; });
  }

  // 隐藏/显示投注设置
  updateBetSettingsVisibility();

  // 清空并渲染号码区
  selectedNumbers = {};

  if (currentLottery === 'fc3d') {
    panel.innerHTML = render3DPanel(config);
    bind3DBallClicks();
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

    return `
      <div class="number-zone" id="number-zone-${zoneIdx}">
        <div class="zone-label">
          <span>${zone.name}</span>
          <span class="zone-count-info">
            <span class="filled" id="zone-count-${zoneIdx}">0</span>
            <span class="separator">/</span>
            <span class="required">${zone.count}</span>
            <span class="count-hint" id="zone-count-hint-${zoneIdx}"></span>
          </span>
        </div>
        <div class="number-grid">${balls}</div>
      </div>
    `;
  }).join('');
}

/* ============ 胆拖面板渲染 ============ */
function renderDantuoPanel(config) {
  // 只有第一个区域（红球/前区）分胆拖，蓝球/后区正常选
  const mainZone = config.zones[0];
  const secondZone = config.zones[1];

  selectedNumbers = { dan: [], tuo: [], secondary: [] };

  // 主区胆拖
  let danBalls = '';
  for (let n = mainZone.min; n <= mainZone.max; n++) {
    const numStr = String(n).padStart(2, '0');
    danBalls += `<button class="number-ball zone-${mainZone.colorClass}" data-area="dan" data-num="${n}">${numStr}</button>`;
  }

  let tuoBalls = '';
  for (let n = mainZone.min; n <= mainZone.max; n++) {
    const numStr = String(n).padStart(2, '0');
    tuoBalls += `<button class="number-ball zone-${mainZone.colorClass}" data-area="tuo" data-num="${n}">${numStr}</button>`;
  }

  // 次区
  let secondBalls = '';
  for (let n = secondZone.min; n <= secondZone.max; n++) {
    const numStr = String(n).padStart(2, '0');
    secondBalls += `<button class="number-ball zone-${secondZone.colorClass}" data-area="secondary" data-num="${n}">${numStr}</button>`;
  }

  const mainMaxDan = mainZone.count - 1;  // 双色球:5, 大乐透:4

  return `
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
          <span class="count-hint">（拖码与胆码不可重复）</span>
        </span>
      </div>
      <div class="number-grid">${tuoBalls}</div>
    </div>

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

  // 次区点击
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

  // 3D 和胆拖模式不显示计数器
  if (currentLottery === 'fc3d' || betMode === 'dantuo') {
    container.innerHTML = '';
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

  if (currentLottery === 'fc3d') {
    if (saved.positions) {
      // 定位复式恢复
      for (let pos = 0; pos < 3; pos++) {
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
  } else if (betMode === 'dantuo' && saved.dan !== undefined) {
    // 胆拖恢复
    selectedNumbers.dan = [...saved.dan];
    selectedNumbers.tuo = [...saved.tuo];
    selectedNumbers.secondary = [...saved.secondary];
    selectedNumbers.dan.forEach(num => {
      const ball = $(`.number-ball[data-area="dan"][data-num="${num}"]`);
      if (ball) ball.classList.add('selected');
    });
    selectedNumbers.tuo.forEach(num => {
      const ball = $(`.number-ball[data-area="tuo"][data-num="${num}"]`);
      if (ball) ball.classList.add('selected');
    });
    selectedNumbers.secondary.forEach(num => {
      const ball = $(`.number-ball[data-area="secondary"][data-num="${num}"]`);
      if (ball) ball.classList.add('selected');
    });
    updateDantuoCount('dan');
    updateDantuoCount('tuo');
    updateDantuoCount('secondary');
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
  if (currentLottery === 'fc3d') return;
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
  if (currentLottery === 'dlt' && extraBet) unitPrice = 3;
  return totalBets * unitPrice * multiplier > config.maxAmount;
}

/* ============ 计算总注数 ============ */
function calcTotalBets() {
  const config = LOTTERY_CONFIG[currentLottery];

  // 福彩3D
  if (currentLottery === 'fc3d') {
    if (playType3D === 'group3') {
      const pool = selectedNumbers.positions.selectedPool || [];
      const n = pool.length;
      if (n < 2) return 0;
      // 组选3：n个数字中选对子 = n × (n-1) 种组合（每个对子算一种）
      // 实际：选出对子，剩余1位从n个数字中选（但对子需要相同数字）
      // 组选3复式：选n个号 = C(n,1) × C(n-1,1) = n×(n-1) 种（含对子）
      // 更准确：从n个号中选2个不同号，其中1个做对子，1个做单 = C(n,2) × 2 = n(n-1)
      return n * (n - 1);
    } else if (playType3D === 'group6') {
      const pool = selectedNumbers.positions.selectedPool || [];
      const n = pool.length;
      if (n < 3) return 0;
      return calcCombinations(n, 3);
    } else {
      // 单选/定位复式：每位数量相乘
      const [hundreds, tens, ones] = selectedNumbers.positions;
      if (!hundreds.length || !tens.length || !ones.length) return 0;
      return hundreds.length * tens.length * ones.length;
    }
  }

  // 胆拖模式
  if (betMode === 'dantuo') {
    const danCount = selectedNumbers.dan.length;
    const tuoCount = selectedNumbers.tuo.length;
    const secondaryCount = selectedNumbers.secondary.length;
    const mainZone = config.zones[0];
    const secondZone = config.zones[1];

    // 胆码 + 拖码 >= 基础数要求
    if (danCount === 0 && tuoCount < mainZone.count) return 0;
    if (danCount + tuoCount < mainZone.count) return 0;
    if (secondaryCount < secondZone.count) return 0;

    // 主区：从拖码中选 (基础数 - 胆码数) 个
    const needFromTuo = mainZone.count - danCount;
    const mainBets = calcCombinations(tuoCount, needFromTuo);

    // 次区：蓝球复式（大乐透后区需组合）
    const secondaryBets = calcCombinations(secondaryCount, secondZone.count);

    return mainBets * secondaryBets;
  }

  // 复式模式
  let total = 1;
  let allFilled = true;
  config.zones.forEach((zone, zoneIdx) => {
    const selected = selectedNumbers[zoneIdx] || [];
    const count = selected.length;
    if (count === 0) {
      allFilled = false;
    } else if (count < zone.count) {
      allFilled = false;
    } else {
      total *= calcCombinations(count, zone.count);
    }
  });
  return allFilled ? total : 0;
}

/* ============ 获取复式类型描述 ============ */
function getCompoundTypeLabel() {
  const config = LOTTERY_CONFIG[currentLottery];

  if (currentLottery === 'fc3d') {
    if (playType3D === 'group3') return '组选3';
    if (playType3D === 'group6') return '组选6';
    // 判断单选是否定位复式
    const [h, t, o] = selectedNumbers.positions;
    if ((h.length > 1 || t.length > 1 || o.length > 1) && h.length > 0 && t.length > 0 && o.length > 0) {
      return '定位复式';
    }
    return '单选';
  }

  if (betMode === 'dantuo') {
    const danCount = selectedNumbers.dan.length;
    const tuoCount = selectedNumbers.tuo.length;
    const secondaryCount = selectedNumbers.secondary.length;
    if (danCount > 0 && tuoCount > 0 && secondaryCount > 0) {
      return '胆拖';
    }
    return '胆拖';
  }

  // 复式判断
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
  if (currentLottery === 'fc3d') {
    if (playType3D === 'group3' || playType3D === 'group6') {
      const pickCount = Math.floor(Math.random() * 4) + 3;
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
      for (let pos = 0; pos < 3; pos++) {
        const pickCount = randomCountMode[pos] ? (Math.floor(Math.random() * 2) + 1) : 1;
        const pool = [];
        for (let n = 0; n <= 9; n++) pool.push(n);
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

  // 胆拖模式
  if (betMode === 'dantuo') {
    const mainZone = config.zones[0];
    const secondZone = config.zones[1];
    const mainMaxDan = mainZone.count - 1;

    const danCount = Math.floor(Math.random() * mainMaxDan) + 1;
    const tuoCount = Math.floor(Math.random() * 5) + (mainZone.count - danCount + 1);
    const secondCount = Math.floor(Math.random() * 3) + secondZone.count;

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

    const secondPool = [];
    for (let n = secondZone.min; n <= secondZone.max; n++) secondPool.push(n);
    const secondPicked = [];
    const actualSecond = Math.min(secondCount, secondPool.length);
    for (let i = 0; i < actualSecond; i++) {
      const idx = Math.floor(Math.random() * secondPool.length);
      secondPicked.push(secondPool.splice(idx, 1)[0]);
    }

    danPicked.sort((a, b) => a - b);
    tuoPicked.sort((a, b) => a - b);
    secondPicked.sort((a, b) => a - b);

    selectedNumbers.dan = danPicked;
    selectedNumbers.tuo = tuoPicked;
    selectedNumbers.secondary = secondPicked;

    $$('.number-ball[data-area="dan"]').forEach(ball => {
      ball.classList.toggle('selected', danPicked.includes(parseInt(ball.dataset.num)));
    });
    $$('.number-ball[data-area="tuo"]').forEach(ball => {
      ball.classList.toggle('selected', tuoPicked.includes(parseInt(ball.dataset.num)));
    });
    $$('.number-ball[data-area="secondary"]').forEach(ball => {
      ball.classList.toggle('selected', secondPicked.includes(parseInt(ball.dataset.num)));
    });
    updateDantuoCount('dan');
    updateDantuoCount('tuo');
    updateDantuoCount('secondary');
    return;
  }

  // 复式模式
  config.zones.forEach((zone, zoneIdx) => {
    const pool = [];
    for (let n = zone.min; n <= zone.max; n++) pool.push(n);
    let pickCount;
    if (randomCountMode && randomCountMode[zoneIdx]) {
      const maxCount = zone.compoundMax || (zone.max - zone.min + 1);
      pickCount = zone.count + Math.floor(Math.random() * Math.min(maxCount - zone.count + 1, 8));
      requiredCounts[zoneIdx] = pickCount;
    } else {
      pickCount = requiredCounts[zoneIdx];
    }
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
  if (currentLottery === 'fc3d') {
    if (playType3D === 'group3' || playType3D === 'group6') {
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
      for (let pos = 0; pos < 3; pos++) {
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
  } else if (betMode === 'dantuo') {
    // 优先缩减拖码
    if (selectedNumbers.tuo.length > 1) {
      const removed = selectedNumbers.tuo.pop();
      const ball = $(`.number-ball[data-area="tuo"][data-num="${removed}"]`);
      if (ball) ball.classList.remove('selected');
      updateDantuoCount('tuo');
    } else if (selectedNumbers.secondary.length > config.zones[1].count) {
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

  if (currentLottery === 'fc3d') {
    if (playType3D === 'group3' || playType3D === 'group6') {
      selectedNumbers.positions.selectedPool = [];
      $$('.number-ball[data-area="pool"]').forEach(ball => ball.classList.remove('selected'));
      const countEl = $('#pool-count');
      if (countEl) countEl.textContent = '0';
    } else {
      for (let pos = 0; pos < 3; pos++) {
        selectedNumbers.positions[pos] = [];
        $$(`.number-ball[data-area="pos"][data-pos="${pos}"]`).forEach(ball => ball.classList.remove('selected'));
        const countEl = $(`#pos-count-${pos}`);
        if (countEl) countEl.textContent = '0';
      }
    }
  } else if (betMode === 'dantuo') {
    selectedNumbers.dan = [];
    selectedNumbers.tuo = [];
    selectedNumbers.secondary = [];
    $$('.number-ball[data-area="dan"]').forEach(ball => ball.classList.remove('selected'));
    $$('.number-ball[data-area="tuo"]').forEach(ball => ball.classList.remove('selected'));
    $$('.number-ball[data-area="secondary"]').forEach(ball => ball.classList.remove('selected'));
    updateDantuoCount('dan');
    updateDantuoCount('tuo');
    updateDantuoCount('secondary');
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
    if (currentLottery === 'dlt' && extraBet) unitPrice = 3;

    const totalPrice = totalBets * unitPrice * multiplier;
    const overLimit = totalPrice > config.maxAmount;

    let infoText = '';
    if (currentLottery === 'fc3d') {
      const pool = selectedNumbers.positions.selectedPool || [];
      const [h, t, o] = selectedNumbers.positions;
      if (playType3D === 'group3' || playType3D === 'group6') {
        infoText = `<span>${playType3D === 'group3' ? '组选3' : '组选6'} | 号码 ${pool.length}个 | ${compoundType} | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}¥${totalPrice}</span>`;
      } else {
        const posText = `百位${h.length}个 十位${t.length}个 个位${o.length}个`;
        infoText = `<span>${compoundType} | ${posText} | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}¥${totalPrice}</span>`;
      }
    } else if (betMode === 'dantuo') {
      const danCount = selectedNumbers.dan.length;
      const tuoCount = selectedNumbers.tuo.length;
      const secondaryCount = selectedNumbers.secondary.length;
      const secondName = currentLottery === 'ssq' ? '蓝球' : '后区';
      infoText = `<span>胆拖 | 胆码${danCount}个 拖码${tuoCount}个 ${secondName}${secondaryCount}个 | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}${extraBet ? '追加 | ' : ''}¥${totalPrice}</span>`;
    } else {
      const zoneTexts = config.zones.map((zone, zoneIdx) => {
        const sel = selectedNumbers[zoneIdx] ? selectedNumbers[zoneIdx].length : 0;
        return `${zone.name}${sel}个`;
      }).join(' ');
      infoText = `<span>${compoundType} | ${zoneTexts} | ${totalBets}注 | ${multiplier > 1 ? `${multiplier}× | ` : ''}${extraBet ? '追加 | ' : ''}¥${totalPrice}</span>`;
    }

    betInfo.innerHTML = infoText;
  } else {
    let hint = '请完成选号';
    if (currentLottery === 'fc3d') {
      if (playType3D === 'group3') hint = '请选 2 个以上号码';
      else if (playType3D === 'group6') hint = '请选 3 个以上号码';
      else hint = '请在百位/十位/个位各选至少 1 个号码';
    } else if (betMode === 'dantuo') {
      hint = '请选胆码 + 拖码（共 ≥ 基础数）以及次区号码';
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

document.addEventListener('DOMContentLoaded', init);
