/*
 * V3.0 彩票模拟器 - 主控逻辑
 * 管理全局状态、彩种切换、Tab路由
 */

const API_BASE = '/api';

// 全局状态
const STATE = {
  currentLottery: 'ssq',
  currentTab: 'draw',
  drawData: {},        // { ssq: [...], ... }
  kl8Select: 10,
  multiplier: 1,
  selectedNumbers: null,
  simResults: null
};

// 工具函数
function fmtMoney(v) {
  if (v === null || v === undefined) return '¥0';
  const a = Math.abs(v);
  if (a >= 1e8) return '¥' + (v/1e8).toFixed(2) + '亿';
  if (a >= 1e4) return '¥' + (v/1e4).toFixed(2) + '万';
  return '¥' + v.toFixed(2);
}

function fmtDate(d) {
  if (!d) d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  const h = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return `${y}-${m}-${day} ${h}:${mi}`;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  try { loadState(); } catch(e) { console.error('loadState error:', e); }
  try { bindSidebar(); } catch(e) { console.error('bindSidebar error:', e); }
  try { bindNav(); } catch(e) { console.error('bindNav error:', e); }
  try { bindClearAll(); } catch(e) { console.error('bindClearAll error:', e); }
  try { switchLottery(STATE.currentLottery); } catch(e) { console.error('switchLottery error:', e); }
  try { switchTab(STATE.currentTab); } catch(e) { console.error('switchTab error:', e); }
});

// ====== 状态持久化 ======
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('lottery_v3_state') || '{}');
    if (saved.lottery && LOTTERY_PARAMS[saved.lottery]) STATE.currentLottery = saved.lottery;
    if (saved.tab) STATE.currentTab = saved.tab;
    if (saved.kl8Select) STATE.kl8Select = saved.kl8Select;
    if (saved.multiplier) STATE.multiplier = saved.multiplier;
    if (saved.drawData) STATE.drawData = saved.drawData;
  } catch(e) {}
}

function saveState() {
  localStorage.setItem('lottery_v3_state', JSON.stringify({
    lottery: STATE.currentLottery,
    tab: STATE.currentTab,
    kl8Select: STATE.kl8Select,
    multiplier: STATE.multiplier,
    drawData: STATE.drawData
  }));
}

// ====== 侧边栏 ======
function bindSidebar() {
  document.querySelectorAll('.lottery-tab').forEach(btn => {
    btn.addEventListener('click', () => switchLottery(btn.dataset.id));
  });
}

function switchLottery(id) {
  STATE.currentLottery = id;
  saveState();
  document.querySelectorAll('.lottery-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.id === id));
  document.getElementById('current-lottery-name').textContent = getLotteryMeta(id).name;

  // 通知各模块
  if (typeof DrawModule !== 'undefined') DrawModule.onLotteryChange(id);
  if (typeof BetSimModule !== 'undefined') BetSimModule.onLotteryChange(id);
  if (typeof AnalysisModule !== 'undefined') AnalysisModule.onLotteryChange(id);

  // 快乐8选号标签
  const kl8Tabs = document.getElementById('kl8-select-tabs');
  kl8Tabs.style.display = (id === 'kl8') ? 'flex' : 'none';
  if (id === 'kl8') {
    document.querySelectorAll('.kl8-select-btn').forEach(b =>
      b.classList.toggle('active', parseInt(b.dataset.select) === STATE.kl8Select));
  }

  // 确保开奖数据初始化
  if (!STATE.drawData[id]) STATE.drawData[id] = [];
}

// ====== 顶部导航 ======
function bindNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.page));
  });

  // 快乐8选号标签
  document.querySelectorAll('.kl8-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.kl8Select = parseInt(btn.dataset.select);
      document.querySelectorAll('.kl8-select-btn').forEach(b =>
        b.classList.toggle('active', parseInt(b.dataset.select) === STATE.kl8Select));
      saveState();
      if (typeof DrawModule !== 'undefined') DrawModule.onKL8SelectChange(STATE.kl8Select);
    });
  });
}

function switchTab(pageId) {
  STATE.currentTab = pageId;
  saveState();
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.page === pageId));
  document.querySelectorAll('.page').forEach(p =>
    p.classList.toggle('active', p.id === 'page-' + pageId));

  // Tab 激活后刷新内容
  if (pageId === 'analysis' && typeof AnalysisModule !== 'undefined') {
    AnalysisModule.refresh();
  }
  if (pageId === 'bet-sim' && typeof BetSimModule !== 'undefined') {
    BetSimModule.updateIssueSelector();
  }
}

// ====== 清空全部 ======
function bindClearAll() {
  const btn = document.getElementById('btn-clear-all');
  if (!btn) { console.error('btn-clear-all not found'); return; }
  btn.addEventListener('click', () => {
    if (!confirm('确定清空全部数据？此操作不可恢复！')) return;
    STATE.drawData = {};
    STATE.drawData[STATE.currentLottery] = [];
    STATE.simResults = null;
    try { saveState(); } catch(e) {}
    try { if (typeof DrawModule !== 'undefined') DrawModule.refreshAll(); } catch(e) {}
    try { if (typeof BetSimModule !== 'undefined') { BetSimModule.clearResults(); BetSimModule.updateIssueSelector(); } } catch(e) {}
    try { if (typeof AnalysisModule !== 'undefined') AnalysisModule.refresh(); } catch(e) {}
  });
}

// ====== 数字排序 ======
function sortNums(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => a - b);
}
