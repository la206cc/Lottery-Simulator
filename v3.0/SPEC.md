# V3.0 通用彩票模拟器 — 完整实现规格

> 本文档是 v3.0 重构的唯一技术规格来源。所有实现必须严格遵循此文档。
> 最后更新: 2026-08-02

---

## 目录

1. [交付物清单](#1-交付物清单)
2. [设计系统 (CSS)](#2-设计系统-css)
3. [HTML 架构](#3-html-架构)
4. [JavaScript 模块](#4-javascript-模块)
5. [API 契约](#5-api-契约)
6. [8种彩种参数预设](#6-8种彩种参数预设)
7. [组件规格](#7-组件规格)
8. [后端改造清单](#8-后端改造清单)

---

## 1. 交付物清单

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | `v3.0/index.html` | **新建** | 统一的 SPA 入口，整合所有功能 |
| 2 | `v3.0/css/style.css` | **新建** | 统一 CSS，合并 v2.0 风格 |
| 3 | `v3.0/css/variables.css` | **新建** | CSS 变量定义 |
| 4 | `v3.0/js/app.js` | **新建** | 主应用逻辑 (Tab切换、彩种切换) |
| 5 | `v3.0/js/draw.js` | **新建** | Tab1 开奖模拟模块 |
| 6 | `v3.0/js/bet-sim.js` | **新建** | Tab2 投注模拟 + 参数面板 |
| 7 | `v3.0/js/analysis.js` | **新建** | Tab3 数据分析模块 |
| 8 | `v3.0/js/config-editor.js` | **保留改造** | Tab4 规则配置 |
| 9 | `v3.0/js/params.js` | **新建** | 8彩种默认参数数据 |
| 10 | `v3.0/api.py` | **重构** | 合并静态服务，修复架构 |
| 11 | `v3.0/server.py` | **删除** | 功能合并到 api.py |
| 12 | `v3.0/src/core/simulators.py` | **重构** | 修复奖金计算调用 |
| 13 | `v3.0/src/core/calculators.py` | **修复** | eval 安全漏洞 |

**保留不动的文件**: `src/core/base.py`, `main.py`, `generators.py`, `analyzers.py`, `storages.py`, `src/config/`, `data/`, `ui/html/config-editor.html`, `ui/html/bet-config-editor.html`

**删除的文件**: `v3.0/ui/html/simulator.html`, `v3.0/ui/js/simulator.js`, `v3.0/ui/css/config-editor.css`, `v3.0/ui/css/bet-config-editor.css`, `v3.0/server.py`

---

## 2. 设计系统 (CSS)

### 2.1 CSS 变量

```css
:root {
  /* 背景 */
  --bg-primary: #0a0a1a;
  --bg-secondary: #111128;
  --bg-card: #16213e;
  --bg-card-hover: #1a2745;
  --bg-input: #0a0a1a;

  /* 边框 */
  --border: #0f3460;
  --border-light: #1a3a6a;

  /* 文字 */
  --text-primary: #e0e0e0;
  --text-secondary: #8892b0;
  --text-muted: #5a6380;

  /* 主题色 */
  --accent: #e94560;
  --accent-hover: #ff6b81;
  --red: #e74c3c;
  --blue: #3498db;
  --orange: #f39c12;
  --green: #2ecc71;

  /* 圆角 */
  --radius: 8px;
  --radius-lg: 12px;

  /* 阴影 */
  --shadow: 0 4px 20px rgba(0,0,0,0.3);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
}
```

### 2.2 全局样式

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  line-height: 1.6;
}

/* 滚动条 */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* 通用按钮 */
.btn {
  padding: 10px 20px; border: 1px solid var(--border);
  background: var(--bg-secondary); color: var(--text-secondary);
  border-radius: var(--radius); cursor: pointer;
  font-size: 13px; font-weight: 600; transition: all 0.2s;
}
.btn:hover { background: var(--bg-card-hover); color: var(--text-primary); }
.btn-primary {
  background: linear-gradient(135deg, var(--accent), #c0392b);
  border-color: var(--accent); color: #fff;
}
.btn-primary:hover { background: linear-gradient(135deg, var(--accent-hover), var(--accent)); }

/* 通用 input / select / range */
input, select {
  padding: 9px 12px; border: 1px solid var(--border);
  background: var(--bg-input); color: var(--text-primary);
  border-radius: var(--radius); font-size: 13px; outline: none;
}
input:focus, select:focus { border-color: var(--accent); }
```

### 2.3 布局

```css
.app-container {
  display: flex; gap: 0; min-height: 100vh;
}

/* 左侧栏 240px */
.sidebar {
  width: 240px; flex-shrink: 0;
  background: linear-gradient(180deg, #1a2745, #16213e 50%, #111633);
  border-right: 1px solid var(--border); padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
}

/* 主区域 */
.main-area {
  flex: 1; min-width: 0; display: flex; flex-direction: column;
}

/* 顶部导航栏 */
.top-nav {
  display: flex; gap: 8px; padding: 12px 20px;
  background: var(--bg-primary); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
}
.nav-btn {
  padding: 12px 24px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-secondary);
  border-radius: var(--radius); cursor: pointer;
  font-size: 14px; font-weight: 600; transition: all 0.2s;
}
.nav-btn:hover { border-color: var(--accent); color: var(--text-primary); }
.nav-btn.active {
  background: linear-gradient(135deg, var(--accent), #c0392b);
  color: #fff; border-color: var(--accent);
}

/* 页面容器 */
.page { display: none; padding: 20px; flex: 1; }
.page.active { display: block; }

/* 卡片 */
.card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 20px;
  box-shadow: var(--shadow);
}
.card-title {
  font-size: 16px; font-weight: 600; color: var(--text-primary);
  margin-bottom: 16px; padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
```

### 2.4 号码球

```css
.number-ball {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%;
  font-size: 14px; font-weight: 700; color: #fff;
  margin: 2px;
}
.number-ball.red    { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.number-ball.blue   { background: linear-gradient(135deg, #3498db, #2980b9); }
.number-ball.orange { background: linear-gradient(135deg, #f39c12, #d68910); }
.number-ball.green  { background: linear-gradient(135deg, #2ecc71, #27ae60); }

/* 小球变体 */
.number-ball.small { width: 26px; height: 26px; font-size: 11px; }
.number-ball.large { width: 48px; height: 48px; font-size: 20px; }
```

### 2.5 滑块

```css
.range-slider {
  width: 100%; height: 6px;
  -webkit-appearance: none; appearance: none;
  background: var(--bg-input); border-radius: 3px; outline: none;
}
.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px;
  background: linear-gradient(135deg, var(--accent), #c0392b);
  border-radius: 50%; cursor: pointer;
  border: 2px solid #fff; box-shadow: 0 2px 8px rgba(233,69,96,0.4);
}
.range-slider.locked { opacity: 0.5; pointer-events: none; }
```

### 2.6 工具类

```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.gap-16 { gap: 16px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.text-accent { color: var(--accent); }
.text-muted { color: var(--text-muted); }
.text-small { font-size: 12px; }
.mb-12 { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.mb-20 { margin-bottom: 20px; }
```

---

## 3. HTML 架构

### 3.1 整体结构

```
app-container
├── sidebar (240px, 粘性)
│   ├── .app-title "彩票模拟器 v3.0"
│   ├── .lottery-tabs (8个彩种按钮)
│   │   ├── button[data-id="ssq"] 双色球
│   │   ├── button[data-id="dlt"] 超级大乐透
│   │   ├── button[data-id="fc3d"] 福彩3D
│   │   ├── button[data-id="pls"] 排列三
│   │   ├── button[data-id="plw"] 排列五
│   │   ├── button[data-id="qxc"] 七星彩
│   │   ├── button[data-id="qlc"] 七乐彩
│   │   └── button[data-id="kl8"] 快乐8
│   └── .btn-reset 清空全部
│
└── .main-area
    ├── .top-nav (粘性)
    │   ├── button[data-page="draw"]     开奖模拟
    │   ├── button[data-page="bet-sim"]  投注模拟
    │   ├── button[data-page="analysis"] 数据分析
    │   ├── button[data-page="config"]   规则配置
    │   └── button[data-page="rules"]    玩法详情
    │
    ├── #page-draw (page)
    ├── #page-bet-sim (page)
    ├── #page-analysis (page)
    ├── #page-config (page)
    └── #page-rules (page)
```

### 3.2 Tab1: 开奖模拟 (#page-draw)

```
.page-draw > .draw-grid (grid-2)
├── .card.selection-card (左列: 选号区)
│   ├── .card-header
│   │   ├── .card-title "选号区"
│   │   └── button#btn-clear-select 清空重选
│   ├── .bet-settings-row
│   │   ├── .bet-mode-toggle [复式|胆拖] (仅支持区)
│   │   ├── .play-type-group (3D/排列三专用: 直选|组三|组六)
│   │   ├── .kl8-select-tabs (快乐8专用: 选一~选十)
│   │   ├── .extra-bet-toggle (大乐透专用: 追加开关)
│   │   └── .multiplier-control [- 1 +] + 快速选择
│   ├── #number-panel (动态生成号码球网格)
│   ├── .selection-actions
│   │   ├── button#btn-random-fill 机选填号
│   │   └── .bet-info 当前投注信息
│   └── .zone-count-controls (区域已选计数)
│
└── .card.draw-card (右列: 开奖)
    ├── .draw-main-section
    │   ├── .card-title "开奖模拟"
    │   ├── .draw-actions
    │   │   ├── button#btn-draw 开奖 (红色主按钮)
    │   │   ├── input#draw-count [期数 1-100]
    │   │   ├── .draw-presets [1] [5] [10]
    │   │   └── button#btn-draw-manual 使用手选号开奖
    │   └── #latest-draw (最新开奖结果)
    │       ├── .draw-latest-header (期号 + 日期)
    │       └── .draw-latest-numbers (号码球 × N)
    ├── .draw-data-section
    │   ├── .card-title "数据管理"
    │   └── .draw-actions-secondary
    │       ├── button 导出CSV
    │       ├── button 导入CSV(合并)
    │       ├── button 导入CSV(覆盖)
    │       ├── button 清空当前
    │       └── button 清空全部
    └── .draw-history-section
        ├── .card-title "开奖记录"
        └── .draw-history-block
            └── table.draw-history-table (动态行)
```

### 3.3 Tab2: 投注模拟 (#page-bet-sim)

```
.page-bet-sim
├── .card (全局控制)
│   ├── .card-title "全局控制"
│   └── .slider-group × 3 (横排)
│       ├── 总注数(万注) [range: 1-10000]
│       ├── 销量波动±% [range: 0-20]
│       └── 奖池金额(亿元) [range: 0-100] + input联动
│
├── .param-grid (grid-2)
│   ├── .card (购彩频次占比)
│   │   ├── .card-title "一、购彩频次占比"
│   │   └── .linked-sliders
│   │       ├── 低频彩民 [range + lock + default]
│   │       ├── 中频彩民 [range + lock + default]
│   │       └── 高频彩民 [range + lock + default]
│   │
│   ├── .card (投注形式占比)
│   │   ├── .card-title "二、投注形式占比"
│   │   └── .linked-sliders
│   │       └── 单式/红球复式/蓝球复式/红蓝复式/胆拖 (各5个range)
│   │
│   ├── .card (倍投分布)
│   │   ├── .card-title "三、倍投分布占比"
│   │   └── .linked-sliders
│   │       └── 1倍/2-5倍/6-20倍/20倍+ (各4个range)
│   │
│   └── .card (单期设定 & 附加选项)
│       ├── .card-title "四、单期设定与附加选项"
│       └── 单期注数分布 / 金额分布 / 选号思路 / 彩种特有参数
│
├── .card (全局汇总预览)
│   ├── .card-title "五、全局汇总（实时预览）"
│   └── .result-grid-5 / .result-grid-4
│       └── .result-item × N (label + value)
│
├── .card (操作)
│   ├── button#btn-start-sim 开始模拟 (大号红色)
│   ├── button#btn-reset-params 重置参数
│   ├── button#btn-export-config 导出配置
│   └── button#btn-import-config 导入配置
│       └── input[type=file] (隐藏)
│
└── .card (投注结果)
    ├── .card-title "投注结果列表"
    ├── .results-placeholder (空状态)
    └── table.result-table (动态行)
        └── thead: 期号 | 投注号码 | 方式 | 倍数 | 中奖 | 奖金 | 盈亏
```

### 3.4 Tab3: 数据分析 (#page-analysis)

```
.page-analysis > .analysis-grid (grid-2)
├── .card (号码频率分析)
│   ├── .card-title "号码频率统计"
│   ├── .frequency-chart-container (canvas #freq-chart)
│   └── .freq-table (热号/冷号列表)
│
├── .card (遗漏分析)
│   ├── .card-title "遗漏分析"
│   └── .missing-chart-container (canvas #missing-chart)
│
├── .card (趋势分析)
│   ├── .card-title "开奖趋势"
│   ├── .trend-stats (奇偶比/大小比/和值)
│   └── .trend-chart-container (canvas #trend-chart)
│
├── .card (中奖分布)
│   ├── .card-title "中奖分布"
│   └── .prize-chart-container (canvas #prize-chart)
│
└── .card.history-card (全宽: 策略对比)
    ├── .card-title "策略对比分析"
    └── table.comparison-table
```

### 3.5 Tab5: 玩法详情 (#page-rules)

```
.page-rules
└── .card
    ├── .card-title "玩法详情"
    ├── 展示规则名称、区域说明、奖级表
    └── 奖级图片 (从 docs/玩法规则/奖级图/ 加载)
```

---

## 4. JavaScript 模块

### 4.1 模块架构

```
app.js (主控)
├── STATE: currentLottery, currentTab, drawData, simParams, simResults
├── init() ─ 绑定事件、初始化 localStorage
├── switchLottery(id) ─ 切换彩种，通知各模块
├── switchTab(pageId) ─ 切换Tab
└── 全局工具: formatMoney(), formatDate(), debounce()

draw.js (开奖模拟)
├── 选号区: initNumberPanel(), toggleBall(), fillRandom()
├── 投注设置: switchBetMode(), updateMultiplier(), toggleAddOn()
├── 开奖: doDraw(), doManualDraw(), drawMultiple()
├── 记录: renderDrawHistory(), deleteDrawRecord()
├── 数据管理: exportCSV(), importCSV(), clearDrawData()
└── 快乐8: switchKL8Select(), updatePanelBySelect()

bet-sim.js (投注模拟)
├── 参数面板: initSliders(), syncLinkedSliders(), lockSlider()
├── 波动算法: adaptiveNoise() ─ 从 docs 参数模板移植
├── 汇总计算: calcSummary() ─ 加权汇总各人群参数
├── 模拟执行: startSimulation(), renderResults()
├── 配置管理: exportConfig(), importConfig(), resetParams()
└── 彩种切换: loadParamsForLottery() ─ 加载对应默认参数

analysis.js (数据分析)
├── 频率分析: renderFrequencyChart(), renderHotColdTable()
├── 遗漏分析: renderMissingChart()
├── 趋势分析: renderTrendChart(), calcTrendStats()
├── 中奖分布: renderPrizeChart()
└── 对比分析: renderComparisonTable()

params.js (参数数据)
├── LOTTERY_PARAMS = { ssq: {...}, dlt: {...}, ... }
├── getDefaultParams(id) ─ 返回某彩种默认参数
└── getLotteryMeta(id) ─ 返回彩种元信息
```

### 4.2 STATE 对象

```javascript
const STATE = {
  currentLottery: 'ssq',      // 当前选中的彩种ID
  currentTab: 'draw',         // 当前Tab
  drawData: {                 // 开奖数据
    ssq: [], dlt: [], fc3d: [], pls: [], plw: [], qxc: [], qlc: [], kl8: []
  },
  selectedNumbers: null,      // 当前选号
  betMode: 'compound',        // 投注方式: compound | dantuo
  playType: 'direct',         // 3D玩法: direct | group3 | group6
  kl8Select: 10,              // 快乐8玩法
  multiplier: 1,              // 倍投
  addOn: false,               // 追加

  // 投注模拟参数 (默认双色球值)
  simParams: { /* 见 params.js */ },
  simResults: null
};
```

### 4.3 app.js 核心逻辑

```javascript
// 初始化
function init() {
  loadState();                            // localStorage 恢复
  bindSidebarEvents();                    // 彩种切换
  bindNavEvents();                        // Tab切换
  switchLottery(STATE.currentLottery);    // 加载默认彩种
  switchTab(STATE.currentTab);            // 加载默认Tab
}

// 彩种切换
function switchLottery(id) {
  STATE.currentLottery = id;
  saveState();
  // 更新侧边栏高亮
  document.querySelectorAll('.lottery-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.id === id));
  // 通知各Tab模块
  DrawModule.onLotteryChange(id);
  BetSimModule.onLotteryChange(id);
  AnalysisModule.onLotteryChange(id);
}

// Tab切换
function switchTab(pageId) {
  STATE.currentTab = pageId;
  saveState();
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.page === pageId));
  document.querySelectorAll('.page').forEach(p =>
    p.classList.toggle('active', p.id === `page-${pageId}`));
}
```

### 4.4 bet-sim.js 滑块联动算法

```javascript
// 从 docs 参数模板移植的核心算法

// N组联动和为100
function syncLinkedSliders(sliderList) {
  let values = sliderList.map(s => parseFloat(s.value));
  let sum = values.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) < 0.001) return;

  let diff = 100 - sum;
  let addPerItem = diff / sliderList.length;

  sliderList.forEach((s, i) => {
    let newVal = values[i] + addPerItem;
    s.value = Math.max(parseFloat(s.min),
              Math.min(parseFloat(s.max), newVal));
  });
}

// 权重自适应零和波动
function adaptiveNoise(values, K) {
  if (K <= 0.001) return new Array(values.length).fill(0);
  const len = values.length;
  const noise = [];
  let totalDelta = 0;

  for (let i = 0; i < len - 1; i++) {
    const val = values[i];
    const weightDelta = val * K / 100;
    const deltaLower = Math.max(-val, -weightDelta);
    const deltaUpper = Math.min(100 - val, weightDelta);
    const delta = deltaLower + (deltaUpper - deltaLower) * Math.random();
    noise.push(delta);
    totalDelta += delta;
  }
  noise.push(-totalDelta);
  return noise;
}

// 汇总计算
function calcSummary() {
  let noise = parseFloat(noiseRange.value);
  let pLow = parseFloat(popLow.value) / 100;
  let pMid = parseFloat(popMid.value) / 100;
  let pHigh = parseFloat(popHigh.value) / 100;

  // 对分人群参数应用波动
  let lowBet = applyNoise(lowBetRaw, adaptiveNoise(lowBetRaw, noise));
  let midBet = applyNoise(midBetRaw, adaptiveNoise(midBetRaw, noise));
  let highBet = applyNoise(highBetRaw, adaptiveNoise(highBetRaw, noise));

  // 加权汇总
  let globalS  = pLow*lowBet[0] + pMid*midBet[0] + pHigh*highBet[0];  // 单式
  let globalR  = pLow*lowBet[1] + pMid*midBet[1] + pHigh*highBet[1];  // 复式
  // ... 其余类似

  updateResultDisplay({ globalS, globalR, ... });
}
```

### 4.5 draw.js 号码球渲染

```javascript
function renderNumberPanel(config) {
  const panel = document.getElementById('number-panel');
  panel.innerHTML = '';

  config.zones.forEach((zone, zi) => {
    const zoneEl = document.createElement('div');
    zoneEl.className = 'number-zone';
    if (STATE.betMode === 'dantuo') {
      zoneEl.classList.add(zi === 0 ? 'dan-zone' : 'tuo-zone');
    }

    const label = document.createElement('div');
    label.className = 'zone-label';
    label.innerHTML = `${zone.name}
      <span class="zone-count-info">
        <span class="filled">已选 0</span> / <span>${zone.count}</span>
      </span>`;
    zoneEl.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'number-grid';

    for (let n = zone.min; n <= zone.max; n++) {
      const ball = document.createElement('div');
      ball.className = `number-ball zone-${zone.color || 'red'}`;
      ball.textContent = String(n).padStart(2, '0');
      ball.dataset.zone = zi;
      ball.dataset.number = n;
      ball.dataset.area = STATE.betMode === 'dantuo' ?
        (zi === 0 ? 'dan' : 'tuo') : 'normal';
      ball.addEventListener('click', () => toggleBall(ball, zone));
      grid.appendChild(ball);
    }

    zoneEl.appendChild(grid);
    panel.appendChild(zoneEl);
  });
}
```

---

## 5. API 契约

### 5.1 统一服务器

Flask 同时提供 API 和静态文件服务，端口 5000。

```python
# api.py 路由表
@app.route('/')                      # 首页 → index.html
@app.route('/<path:path>')           # 静态文件
@app.route('/api/health', GET)       # 健康检查
@app.route('/api/presets', GET)      # 预设列表
@app.route('/api/config/<id>', GET)  # 配置详情
@app.route('/api/simulate', POST)    # 执行模拟
@app.route('/api/analyze', POST)     # 数据分析
```

### 5.2 接口规格

#### POST /api/simulate

```json
// Request
{
  "config_id": "ssq",
  "num_rounds": 1000,
  "initial_pool": 100000000,
  "initial_capital": 10000,
  "mode": "single_draw",
  "strategy": {
    "name": "random"
  },
  "params": {                          // 新增: 完整参数对象
    "betType": { "singleRatio": 0.60, "complexRatio": 0.30, "danTuoRatio": 0.10 },
    "multiplier": { "ratio1x": 0.75, "ratio2_5x": 0.20, "ratio6_20x": 0.045, "ratio20xPlus": 0.005 },
    "userBehavior": { "highFreqRatio": 0.12, "midFreqRatio": 0.38, "lowFreqRatio": 0.50 },
    "sales": { "baseSales": 50, "fluctuation": 0.05 }
  }
}

// Response
{
  "success": true,
  "data": {
    "result": {
      "mode": "single_draw",
      "winning_numbers": {"红球": [1,5,9,17,22,31], "蓝球": [8]},
      "num_rounds": 1000,
      "rounds": [                          // 最多返回 100 条明细
        {
          "round": 1,
          "bet_numbers": {...},
          "bet_type": "single",
          "bet_cost": 2.0,
          "prize_amount": 0,
          "prize_level": null
        }
      ],
      "summary": {
        "total_investment": 2000.0,
        "total_return": 350.0,
        "net_profit": -1650.0,
        "return_rate": 0.175,
        "wins": 15,
        "losses": 985,
        "win_rate": 0.015,
        "final_pool": 100001350.0,
        "final_capital": 8350.0,
        "prize_distribution": { "6": 10, "5": 5 }
      }
    }
  }
}
```

#### POST /api/analyze

```json
// Request
{ "config_id": "ssq", "result": {...}, "analysis_types": ["frequency", "missing", "trend"] }

// Response
{
  "success": true,
  "data": {
    "frequency": { "红球": { "1": 156, "2": 142, ... }, "蓝球": { ... } },
    "missing": { "红球": { "1": 3, ... } },
    "trend": { "odd_even_ratio": [...], "sum_trend": [...] }
  }
}
```

---

## 6. 8种彩种参数预设

### 6.1 params.js 数据结构

```javascript
const LOTTERY_PARAMS = {
  ssq: {
    meta: {
      id: 'ssq', name: '双色球', category: '乐透型',
      description: '从33个红球中选6个 + 16个蓝球中选1个',
      pricePerBet: 2, returnRate: 0.51
    },
    zones: [
      { name: '红球', min: 1, max: 33, count: 6, repeatable: false,
        sorted: true, color: 'red', allowExtra: true, maxExtra: 20, allowDanTuo: true },
      { name: '蓝球', min: 1, max: 16, count: 1, repeatable: false,
        sorted: false, color: 'blue', allowExtra: true, maxExtra: 16, allowDanTuo: false }
    ],
    // 投注模拟参数
    frequency:   { low: 50.00, mid: 38.00, high: 12.00 },  // 频次占比 %
    betType:     { single: 60, redComplex: 20, blueComplex: 5, redBlueComplex: 5, dantuo: 10 },
    multiplier:  { x1: 75, x2_5: 20, x6_20: 4.5, x20plus: 0.5 },
    // 分人群行为模板 (内部权重, 总和=100%)
    lowFreqBet:  { single: 82, redComplex: 8, blueComplex: 2, redBlueComplex: 4, dantuo: 4 },
    midFreqBet:  { single: 56, redComplex: 24, blueComplex: 5, redBlueComplex: 7, dantuo: 8 },
    highFreqBet: { single: 18, redComplex: 32, blueComplex: 10, redBlueComplex: 15, dantuo: 25 },
    lowFreqMul:  { x1: 98, x2_5: 2, x6_20: 0, x20plus: 0 },
    midFreqMul:  { x1: 70, x2_5: 25, x6_20: 4.5, x20plus: 0.5 },
    highFreqMul: { x1: 42, x2_5: 32, x6_20: 18, x20plus: 8 },
    // 其他
    betAmount:   { low: 48, mid: 38, high: 12, ultra: 2 },
    selectType:  { random: 30, birthday: 35, trend: 25, fixed: 10 },
    market:      { baseSales: 50, fluctuation: 5, poolSize: 10 }
  },
  // ... 其余7个彩种类似结构
};
```

### 6.2 各彩种独有参数

| 彩种 | 独有参数 |
|------|----------|
| 大乐透 | `addOn: { ratio: 40, price: 1, bonusRatio: 0.8 }` 追加投注占比 |
| 福彩3D | `playTypes: [direct, group3, group6]`, 玩法类型分布 |
| 排列三 | 同3D，剔除小众7%归一化 |
| 排列五 | `betType: { single: 100, complex: 0, dantuo: 0 }` 无复式/胆拖 |
| 快乐8 | `kl8Selects: { L: 25, M: 60, H: 15 }` + 内部权重拆10种玩法 |
| 七星彩 | `inversion: { threshold: 300000000 }` 倒置阈值 |
| 七乐彩 | `specialNumber: true`, 复式结构 (8码/9码/10-12码) |

### 6.3 快乐8玩法权重

```javascript
kl8Weights: {
  L: { k1: 8, k2: 16, k3: 28, k4: 48 },    // 总和=100
  M: { k5: 33, k6: 30, k7: 20, k8: 17 },     // 总和=100
  H: { k9: 33, k10: 67 }                      // 总和=100
},
kl8Default: { L: 25, M: 60, H: 15 }           // L+M+H=100
```

---

## 7. 组件规格

### 7.1 滑块组件

```html
<div class="slider-group linked-slider">
  <div class="slider-header">
    <span class="slider-label">低频彩民</span>
    <span class="slider-value" id="v-pop-low">50.00</span>
    <div class="slider-right">
      <span class="slider-default" id="lbl-default-low">默认:50.00</span>
      <button class="slider-lock-btn" data-lock="pop-low" title="锁定">🔒</button>
    </div>
  </div>
  <input type="range" id="pop-low" class="range-slider linked"
         min="30" max="80" value="50" step="0.01">
</div>
```

规则:
- `linked` 类标记该滑块属于一个联动组
- 拖动任意滑块 → syncLinkedSliders() 自动调整同组其他滑块
- 锁定按钮: 单击切换 locked 状态, locked 滑块值不变, 调整分配给未锁定的
- 显示值随滑块实时更新

### 7.2 联动滑块组配置

```javascript
const LINKED_GROUPS = {
  freq:     ['pop-low', 'pop-mid', 'pop-high'],
  betType:  ['bet-single', 'bet-red-c', 'bet-blue-c', 'bet-rb-c', 'bet-dantuo'],
  multi:    ['mul-x1', 'mul-x2_5', 'mul-x6_20', 'mul-x20plus'],
  lowBet:   ['low-s', 'low-r', 'low-b', 'low-rb', 'low-dt'],
  midBet:   ['mid-s', 'mid-r', 'mid-b', 'mid-rb', 'mid-dt'],
  highBet:  ['high-s', 'high-r', 'high-b', 'high-rb', 'high-dt'],
  lowMul:   ['low-m1', 'low-m2', 'low-m6', 'low-m20'],
  midMul:   ['mid-m1', 'mid-m2', 'mid-m6', 'mid-m20'],
  highMul:  ['high-m1', 'high-m2', 'high-m6', 'high-m20']
};
```

### 7.3 号码球点击状态机

```
未选中 ──click──> 选中 (zone.color 渐变背景)
已选中 ──click──> 未选中
已达count上限 ──click──> 忽略 (视觉闪烁提示)
```

胆拖模式:
```
胆码区 (dan): 选中数 < 胆码上限 → 正常选中
拖码区 (tuo): 选中数 ≤ 该区总数-胆码数 → 正常选中
```

### 7.4 开奖记录表

```html
<table class="draw-history-table">
  <thead>
    <tr>
      <th>期号</th>
      <th>开奖号码</th>
      <th>日期</th>
      <th>操作</th>
    </tr>
  </thead>
  <tbody>
    <!-- 最新在上 -->
    <tr>
      <td class="draw-td-period">2024001</td>
      <td>
        <span class="mini-ball zone-red">05</span>
        <span class="mini-ball zone-red">09</span>
        ...
        <span class="mini-ball zone-blue">08</span>
      </td>
      <td>2024-01-02</td>
      <td><button class="btn-draw-delete" data-id="xxx">删除</button></td>
    </tr>
  </tbody>
</table>
```

存储: localStorage `drawData_ssq`, `drawData_dlt`, ...

### 7.5 最新开奖展示

```html
<div class="draw-latest-block">
  <div class="draw-latest-header">
    <span class="draw-latest-title">最新开奖</span>
    <span class="draw-latest-meta">期号 2024001 | 2024-01-02</span>
  </div>
  <div class="draw-latest-numbers">
    <div class="draw-zone">
      <span class="draw-zone-label">红球</span>
      <div class="draw-balls">
        <span class="number-ball red large">05</span>
        ...
      </div>
    </div>
    <div class="draw-zone">
      <span class="draw-zone-label">蓝球</span>
      <div class="draw-balls">
        <span class="number-ball blue large">08</span>
      </div>
    </div>
  </div>
</div>
```

### 7.6 全局汇总结果网格

```html
<div class="result-grid-6">
  <div class="result-item">
    <div class="result-desc">全局单式</div>
    <div class="result-num" id="res-s">60.00%</div>
  </div>
  <!-- ... 红球复式/蓝球复式/红蓝复式/胆拖/合计 -->
</div>

<div class="result-grid-4">
  <div class="result-item">
    <div class="result-desc">全局1倍</div>
    <div class="result-num" id="res-m1">75.00%</div>
  </div>
  <!-- ... 2-5倍/6-20倍/20倍+ -->
</div>
```

### 7.7 数据分析图表

使用 Chart.js (CDN: cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js)

```javascript
// 频率柱状图
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['01','02',...],
    datasets: [{ label: '出现次数', data: [...], backgroundColor: '#e94560' }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#8892b0' }, grid: { color: '#0f3460' } },
      y: { ticks: { color: '#8892b0' }, grid: { color: '#0f3460' } }
    }
  }
});

// 遗漏折线图
new Chart(ctx, {
  type: 'line',
  data: { labels: [...], datasets: [{ data: [...], borderColor: '#3498db' }] }
});

// 奇偶比饼图 / 大小比 doughnut
new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['奇数', '偶数'],
    datasets: [{ data: [odd, even], backgroundColor: ['#e94560', '#3498db'] }]
  }
});
```

---

## 8. 后端改造清单

### 8.1 api.py 重构

```python
# 合并后的统一服务器
import os, sys
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.')
CORS(app)

# API 路由 (保持不变)
@app.route('/api/...')

# 静态文件 - 返回当前目录文件
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return app.send_static_file('index.html')

# 启动
if __name__ == '__main__':
    print("彩票模拟器 v3.0 | http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### 8.2 simulators.py 修复

核心修复: 将 `_calculate_simple_prize` 替换为调用 `calculators.py` 中的真实计算器。

```python
def simulate(self, config, num_rounds, initial_pool, initial_capital,
             strategy=None, mode="single_draw"):
    # 创建奖金计算器实例
    calc = ComponentFactory.create_calculator(config.id)

    for round_num in range(1, num_rounds + 1):
        # ... 生成投注号码 ...
        
        # 修复: 使用真实计算器
        try:
            prize_result = calc.calculate_prize(config, winning_numbers, bet["numbers"], 
                                                 pool=current_pool, add_on=bet.get("add_on", False))
            prize_amount = prize_result.get("total", 0)
        except Exception:
            prize_amount = 0
```

### 8.3 calculators.py 安全修复

```python
# 修复前 (第280行附近):
def _check_guarantee_condition(self, condition, context):
    return eval(condition, {"__builtins__": {}}, context)  # 危险!

# 修复后:
def _check_guarantee_condition(self, condition, context):
    # 只支持已知的安全表达式
    if condition.startswith("min("):
        return self._eval_min_condition(condition, context)
    raise ValueError(f"不支持的条件表达式: {condition}")

def _eval_min_condition(self, condition, context):
    # 安全解析 "min(6000)" 或 "min(prize2 * 2, 5000000)"
    import re
    inner = re.match(r'min\((.*)\)', condition).group(1)
    parts = [p.strip() for p in inner.split(',')]
    values = []
    for p in parts:
        if p.isdigit():
            values.append(int(p))
        elif p in context:
            values.append(context[p])
        elif '*' in p:
            a, b = p.split('*')
            values.append(context[a.strip()] * int(b.strip()))
    return min(values)
```

---

## 9. 实现顺序

| 阶段 | 文件 | 预估 |
|------|------|------|
| 1 | `css/variables.css`, `css/style.css` | CSS设计系统 |
| 2 | `index.html` (整体框架 + sidebar + nav) | HTML骨架 |
| 3 | `js/params.js` (8种彩种数据) | 数据层 |
| 4 | `js/app.js` (主控逻辑) | 路由 |
| 5 | `index.html` (Tab1 开奖模拟HTML) + `js/draw.js` | 开奖功能 |
| 6 | `index.html` (Tab2 投注模拟HTML) + `js/bet-sim.js` | 参数面板 |
| 7 | `index.html` (Tab3 数据分析HTML) + `js/analysis.js` | 图表可视 |
| 8 | `api.py` 重构 (合并静态服务) + `simulators.py` 修复 | 后端 |
| 9 | Tab4 规则配置 (保留现有) | 配置 |
| 10 | 联调测试 + 8彩种参数调优 | 收尾 |

---

*本文档完结。实现阶段严格按此规格执行，任何偏离需要更新此文档。*
