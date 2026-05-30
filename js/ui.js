import { LOTTERY_CONFIG, getLotteryConfig } from './lottery-config.js';
import { draw, simulate, startWorkerSimulation, generatePurchases, generatePurchasesWithMultiplier, checkPrize, analyzePurchaseResults, generateManualTicket, generateMultipleTickets, calcBetCount } from './simulator.js';
import {
  analyzeFrequency, analyzeMissing,
  analyzeOddEven, analyzeSum, analyzeConsecutive, analyzeRangeDistribution,
  analyzeBigSmall, analyze012Road, analyzeSpan, analyzeRepeat, analyzeNeighbor
} from './analyzer.js';
import { drawBarChart, drawLineChart, drawPieChart, drawHeatmap } from './charts.js';

const $ = (sel) => {
  const el = document.querySelector(sel);
  if (!el) {
    console.warn(`Element not found: ${sel}`);
  }
  return el;
};
const $$ = (sel) => document.querySelectorAll(sel);

function showErrorAlert(message) {
  console.error(`⚠️ 错误: ${message}`);
}

function safeExecute(fn, errorMessage = '操作失败') {
  try {
    return fn();
  } catch (error) {
    console.error(errorMessage, error);
    showErrorAlert(`${errorMessage}: ${error.message}`);
    return null;
  }
}

let currentLottery = 'ssq';
let currentPrizePool = 0;
let bulletinPage = 1;
const ITEMS_PER_PAGE = 10;

function updatePrizePoolDisplay() {
  const poolValueEl = $('#current-pool-value');
  if (poolValueEl) {
    poolValueEl.textContent = formatMoney(currentPrizePool);
  }
}

function getPrizePool() {
  const input = $('#prize-pool-input');
  if (input) {
    return parseInt(input.value) || 0;
  }
  return 0;
}

function resizeAllCharts() {
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    if (canvas._lastData && canvas._lastOptions && canvas._resizeObserver) {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const newWidth = rect.width;
        if (newWidth > 0 && canvas._lastWidth !== newWidth) {
          canvas._lastWidth = newWidth;
          // 根据canvas的类型重新绘制对应的图表
          const parentSection = canvas.closest('.analysis-section');
          if (parentSection) {
            if (canvas._lastOptions && canvas._lastOptions.title) {
              if (canvas._lastOptions.title.includes('频率') || 
                  canvas._lastOptions.title.includes('遗漏') || 
                  canvas._lastOptions.title.includes('偏差') ||
                  canvas._lastOptions.title.includes('连号') ||
                  canvas._lastOptions.title.includes('区间')) {
                drawBarChart(canvas, canvas._lastData, canvas._lastOptions);
              } else if (canvas._lastOptions.title.includes('和值') ||
                         canvas._lastOptions.title.includes('分布')) {
                drawLineChart(canvas, canvas._lastData, canvas._lastOptions);
              } else if (canvas._lastOptions.title.includes('占比')) {
                drawPieChart(canvas, canvas._lastData, canvas._lastOptions);
              } else if (canvas._lastOptions.title.includes('热力')) {
                drawHeatmap(canvas, canvas._lastData, canvas._lastOptions);
              }
            }
          }
        }
      }
    }
  });
}

function getCurrency() {
  const config = getLotteryConfig(currentLottery);
  return config ? config.currency : '¥';
}

function formatMoney(amount) {
  const c = getCurrency();
  if (amount >= 100000000 && c === '¥') {
    return `${c}${(amount / 100000000).toFixed(2)}亿`;
  } else if (amount >= 10000 && c === '¥') {
    return `${c}${(amount / 10000).toFixed(amount % 10000 ? 1 : 0)}万`;
  }
  return `${c}${amount.toLocaleString()}`;
}

function calculateTieredPrize(lotteryId, prizePool, fixedPayout, prizeStats, currentPrizePool, addOnEnabled = false) {
  const config = getLotteryConfig(lotteryId);
  const floatingPool = prizePool - fixedPayout;
  
  // 如果没有poolTiers配置，使用旧的简单算法
  if (!config.poolTiers) {
    const result = {};
    prizeStats.forEach(stat => {
      if (stat.level === 0) return;
      const prizeConfig = config.prizes.find(p => p.level === stat.level);
      if (!prizeConfig.fixed && stat.count > 0) {
        result[stat.level] = Math.floor(floatingPool * prizeConfig.poolRatio);
      }
    });
    return result;
  }
  
  // 使用奖池分档算法
  const result = {};
  const totalPrizePool = currentPrizePool > 0 ? currentPrizePool + floatingPool : floatingPool;
  
  // 确定当前奖池档位
  let currentTier = config.poolTiers[0];
  for (const tier of config.poolTiers) {
    if (totalPrizePool >= tier.min && totalPrizePool <= tier.max) {
      currentTier = tier;
      break;
    }
  }
  
  // 计算一等奖奖金
  const firstPrizeStat = prizeStats.find(s => s.level === 1);
  if (firstPrizeStat && firstPrizeStat.count > 0) {
    let firstPrizeAmount = 0;
    
    if (currentTier.secondPartRatio !== undefined) {
      // 分两部分分配
      const part1 = Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool;
      const part2 = Math.floor(floatingPool * currentTier.secondPartRatio);
      
      // 应用单注封顶
      const firstPrizeConfig = config.prizes.find(p => p.level === 1);
      const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
      const part1PerTicket = Math.min(Math.floor(part1 / firstPrizeStat.count), maxPerTicket);
      const part2PerTicket = Math.min(Math.floor(part2 / firstPrizeStat.count), maxPerTicket);
      
      let perTicket = part1PerTicket + part2PerTicket;
      
      // 如果启用追加投注，增加奖金（追加奖金 = 基本奖金 × 80%）
      if (addOnEnabled && config.canAddOn) {
        perTicket = Math.floor(perTicket * 1.8); // 基本100% + 追加80% = 180%
      }
      
      // 应用追加后的单注封顶
      const maxAddOnPerTicket = firstPrizeConfig.maxAddOnPerTicket;
      if (addOnEnabled && maxAddOnPerTicket) {
        perTicket = Math.min(perTicket, maxAddOnPerTicket);
      }
      
      firstPrizeAmount = perTicket * firstPrizeStat.count;
      
      // 应用总额封顶
      const maxTotal = firstPrizeConfig.maxTotal;
      if (maxTotal && firstPrizeAmount > maxTotal) {
        firstPrizeAmount = maxTotal;
      }
    } else {
      // 单一部分分配
      firstPrizeAmount = Math.floor(floatingPool * currentTier.firstPrizeRatio) + currentPrizePool;
      
      // 应用单注封顶
      const firstPrizeConfig = config.prizes.find(p => p.level === 1);
      const maxPerTicket = firstPrizeConfig.maxPerTicket || 5000000;
      let perTicket = Math.min(Math.floor(firstPrizeAmount / firstPrizeStat.count), maxPerTicket);
      
      // 如果启用追加投注，增加奖金
      if (addOnEnabled && config.canAddOn) {
        perTicket = Math.floor(perTicket * 1.8); // 基本100% + 追加80% = 180%
      }
      
      // 应用追加后的单注封顶
      const maxAddOnPerTicket = firstPrizeConfig.maxAddOnPerTicket;
      if (addOnEnabled && maxAddOnPerTicket) {
        perTicket = Math.min(perTicket, maxAddOnPerTicket);
      }
      
      firstPrizeAmount = perTicket * firstPrizeStat.count;
      
      // 应用总额封顶
      const maxTotal = firstPrizeConfig.maxTotal;
      if (maxTotal && firstPrizeAmount > maxTotal) {
        firstPrizeAmount = maxTotal;
      }
    }
    
    result[1] = firstPrizeAmount;
  }
  
  // 计算二等奖奖金（剩余部分）
  const secondPrizeStat = prizeStats.find(s => s.level === 2);
  if (secondPrizeStat && secondPrizeStat.count > 0) {
    const firstPrizeAmount = result[1] || 0;
    const remainingPool = floatingPool - (firstPrizeAmount - currentPrizePool);
    
    if (remainingPool > 0) {
      const secondPrizeConfig = config.prizes.find(p => p.level === 2);
      let secondPrizeAmount = Math.floor(remainingPool * secondPrizeConfig.poolRatio);
      
      // 应用单注封顶
      const maxPerTicket = secondPrizeConfig.maxPerTicket || 5000000;
      let perTicket = Math.min(Math.floor(secondPrizeAmount / secondPrizeStat.count), maxPerTicket);
      
      // 如果启用追加投注，增加奖金
      if (addOnEnabled && config.canAddOn) {
        perTicket = Math.floor(perTicket * 1.8); // 基本100% + 追加80% = 180%
      }
      
      // 应用追加后的单注封顶
      const maxAddOnPerTicket = secondPrizeConfig.maxAddOnPerTicket;
      if (addOnEnabled && maxAddOnPerTicket) {
        perTicket = Math.min(perTicket, maxAddOnPerTicket);
      }
      
      secondPrizeAmount = perTicket * secondPrizeStat.count;
      
      result[2] = secondPrizeAmount;
    }
  }
  
  return result;
}

function getFixedPrizeAmount(lotteryId, prizeLevel, currentPrizePool) {
  const config = getLotteryConfig(lotteryId);
  const prizeConfig = config.prizes.find(p => p.level === prizeLevel);
  
  if (!prizeConfig || !prizeConfig.fixed) {
    return prizeConfig?.amount || 0;
  }
  
  // 检查是否有高奖池金额（大乐透专用）
  if (prizeConfig.highPoolAmount && config.poolTiers) {
    const totalPrizePool = currentPrizePool || 0;
    const highPoolTier = config.poolTiers.find(t => t.min >= 800000000); // 奖池≥8亿
    
    if (highPoolTier && totalPrizePool >= highPoolTier.min) {
      return prizeConfig.highPoolAmount;
    }
  }
  
  return prizeConfig.amount;
}
let simulationResults = [];
let workerHandle = null;
let isSimulating = false;
let currentPage = 1;
const pageSize = 20;
let purchaseWorkerHandle = null;
let isPurchasing = false;
let lastPurchaseData = null;
let lastPurchaseTickets = null;
let lastPurchaseCount = null;
let betMode = 'random';
let betType = 'single';
let selectedNumbers = [];
let betMultiplier = 1;
let addOnEnabled = false;

const MAX_PURCHASE_HISTORY = 10;
let purchaseHistoryMap = {};
let currentHistoryIndex = -1;

function getCurrentHistory() {
  return purchaseHistoryMap[currentLottery] || [];
}

function setCurrentHistory(history) {
  purchaseHistoryMap[currentLottery] = history;
}

function getCurrentHistoryIndex() {
  const history = getCurrentHistory();
  return currentHistoryIndex >= history.length ? history.length - 1 : currentHistoryIndex;
}

export function init() {
  try {
    console.log('Initializing lottery simulator...');
    
    renderLotteryTabs();
    bindEvents();
    bindPageNavigation();
    updateLotteryDisplay();
    updateHistoryNavButtons();
    
    console.log('Initialization complete');
  } catch (error) {
    console.error('Critical initialization error:', error);
    showErrorAlert(`初始化失败: ${error.message || '未知错误'}`);
  }
}

function bindPageNavigation() {
  const navButtons = $$('.nav-analysis-btn');
  navButtons.forEach(btn => {
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
      
      const targetPageId = pageMap[targetPage];
      if (targetPageId) {
        const pageEl = $(`#${targetPageId}`);
        if (pageEl) {
          pageEl.classList.add('active');
        }
      }
    });
  });
  
  const defaultBtn = $('[data-page="simulation"]');
  if (defaultBtn) {
    defaultBtn.classList.add('active');
  }
  
  const defaultPage = $('#page-simulation');
  if (defaultPage) {
    defaultPage.classList.add('active');
  }
}

function renderLotteryTabs() {
  const tabContainer = $('#lottery-tabs');
  tabContainer.innerHTML = LOTTERY_CONFIG.map(l =>
    `<button class="lottery-tab${l.id === currentLottery ? ' active' : ''}" data-id="${l.id}">${l.name}</button>`
  ).join('');
}

function bindEvents() {
  $('#lottery-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.lottery-tab');
    if (!btn) return;
    currentLottery = btn.dataset.id;
    simulationResults = [];
    currentPage = 1;
    bulletinPage = 1;
    $$('.lottery-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateLotteryDisplay();
    clearResults();
    selectedNumbers = [];
    if (betMode === 'manual') renderNumberPanel();
    
    const history = getCurrentHistory();
    if (history.length > 0) {
      currentHistoryIndex = history.length - 1;
      const lastItem = history[currentHistoryIndex];
      betMode = lastItem.betMode;
      betType = lastItem.betType;
      renderPurchaseResult(lastItem.drawResult, lastItem.results, true);
    } else {
      currentHistoryIndex = -1;
      const section = $('#purchase-result-section');
      section.style.display = 'none';
      clearFinanceSummary();
    }
    updateHistoryNavButtons();
  });

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

  $('#btn-draw').addEventListener('click', () => {
    const result = draw(currentLottery);
    simulationResults.push(result);
    animateDraw(result, () => {
      renderSingleResult(result);
      updatePurchaseWithNewDraw();
    });
  });

  $('#btn-reset').addEventListener('click', () => {
    if (isSimulating) stopSimulation();
    if (isPurchasing) stopPurchaseSimulation();
    clearResults();
    $('#sim-info').textContent = '';
    updateLotteryDisplay();
    currentPrizePool = 0;
    const poolInput = $('#prize-pool-input');
    if (poolInput) poolInput.value = '0';
    updatePrizePoolDisplay();
  });

  $('#btn-simulate').addEventListener('click', () => {
    if (isSimulating) {
      stopSimulation();
      return;
    }
    const count = parseInt($('#sim-count').value) || 1000;
    if (count <= 10000) {
      const results = simulate(currentLottery, count);
      simulationResults = results;
      currentPage = 1;
      renderBatchResults();
      runAnalysis();
      updatePurchaseWithNewDraw();
    } else {
      startLargeSimulation(count);
    }
  });

  $('#sim-count').addEventListener('change', (e) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) e.target.value = 100;
    if (val > 500) e.target.value = 500;
  });

  $$('.preset-btn:not([data-target])').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#sim-count').value = btn.dataset.count;
    });
  });

  $('#analysis-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.analysis-tab');
    if (!tab) return;
    $$('.analysis-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderAnalysisTab(tab.dataset.tab);
  });

  $$('.bet-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.bet-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      betMode = btn.dataset.mode;
      $('#manual-select-area').style.display = betMode === 'manual' ? 'block' : 'none';
      $('#random-multiple-area').style.display = (betMode === 'random' && betType === 'multiple') ? 'block' : 'none';
      if (betMode === 'manual') renderNumberPanel();
      if (betMode === 'random' && betType === 'multiple') renderRandomMultiplePanel();
    });
  });

  $$('.bet-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.bet-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      betType = btn.dataset.type;
      $('#manual-select-area').style.display = betMode === 'manual' ? 'block' : 'none';
      $('#random-multiple-area').style.display = (betMode === 'random' && betType === 'multiple') ? 'block' : 'none';
      if (betMode === 'manual') renderNumberPanel();
      if (betMode === 'random' && betType === 'multiple') renderRandomMultiplePanel();
    });
  });

  $('#btn-random-fill').addEventListener('click', () => {
    randomFillNumbers();
  });

  $('#btn-clear-select').addEventListener('click', () => {
    selectedNumbers = [];
    renderNumberPanel();
  });

  $('#btn-purchase').addEventListener('click', () => {
    if (isPurchasing) {
      stopPurchaseSimulation();
      return;
    }
    const count = parseInt($('#purchase-count').value) || 10000;
    if (betMode === 'manual' && betType === 'single') {
      if (!validateManualSelection()) return;
      runManualSinglePurchase(count);
    } else if (betMode === 'manual' && betType === 'multiple') {
      if (!validateManualSelection()) return;
      runManualMultiplePurchase(count);
    } else if (betMode === 'random' && betType === 'multiple') {
      runRandomMultiplePurchase(count);
    } else {
      if (count > 10000) {
        startLargePurchaseSimulation(count);
      } else {
        runPurchaseSimulation(count);
      }
    }
  });

  $$('.preset-btn[data-target="purchase-count"]').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#purchase-count').value = btn.dataset.count;
    });
  });

  // 倍数按钮事件
  $$('.multiplier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.multiplier-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      betMultiplier = parseInt(btn.dataset.multiplier) || 1;
    });
  });

  // 追加按钮事件
  $$('.add-on-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.add-on-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      addOnEnabled = parseInt(btn.dataset.addon) === 1;
    });
  });

  $('#btn-export').addEventListener('click', exportCSV);

  $('#draw-stats-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.draw-stats-tab');
    if (!tab) return;
    $$('.draw-stats-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderDrawStatsTab(tab.dataset.tab);
  });

  $('#history-pagination').addEventListener('click', (e) => {
    const btn = e.target.closest('.page-btn');
    if (!btn) return;
    const action = btn.dataset.action;
    const totalPages = Math.ceil(simulationResults.length / pageSize);
    if (action === 'prev' && currentPage > 1) currentPage--;
    else if (action === 'next' && currentPage < totalPages) currentPage++;
    else if (action === 'page') currentPage = parseInt(btn.dataset.page);
    renderHistoryPage();
  });

  $('#prize-pool-input').addEventListener('input', () => {
    currentPrizePool = getPrizePool();
    updatePrizePoolDisplay();
  });

  $$('.pool-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      const input = $('#prize-pool-input');
      if (input) {
        input.value = amount.toString();
        currentPrizePool = amount;
        updatePrizePoolDisplay();
      }
    });
  });

  $('#history-prev-btn').addEventListener('click', () => {
    if (currentHistoryIndex > 0) {
      loadPurchaseFromHistory(currentHistoryIndex - 1);
    }
  });

  $('#history-next-btn').addEventListener('click', () => {
    const history = getCurrentHistory();
    if (currentHistoryIndex < history.length - 1) {
      loadPurchaseFromHistory(currentHistoryIndex + 1);
    }
  });

  $('#history-clear-btn').addEventListener('click', () => {
    console.log('清空所有购买记录');
    clearPurchaseHistory();
  });

  $('#purchase-history-prev-btn').addEventListener('click', () => {
    if (currentHistoryIndex > 0) {
      loadPurchaseFromHistory(currentHistoryIndex - 1);
    }
  });

  $('#purchase-history-next-btn').addEventListener('click', () => {
    const history = getCurrentHistory();
    if (currentHistoryIndex < history.length - 1) {
      loadPurchaseFromHistory(currentHistoryIndex + 1);
    }
  });

  $('#purchase-history-clear-btn').addEventListener('click', () => {
    console.log('清空所有购买记录');
    clearPurchaseHistory();
  });

  $('#reset-all-btn').addEventListener('click', () => {
    console.log('清空所有数据');
    resetAllData();
  });
}

function resetAllData() {
  Object.keys(purchaseHistoryMap).forEach(lotteryId => {
    purchaseHistoryMap[lotteryId] = [];
  });
  currentHistoryIndex = -1;
  simulationResults = [];
  currentPage = 1;
  bulletinPage = 1;
  
  const section = $('#purchase-result-section');
  section.style.display = 'none';
  clearFinanceSummary();
  clearResults();
  updateHistoryNavButtons();
  
  updateLotteryDisplay();
}

function generatePrizeIllustration(config) {
  const zones = [...config.zones];
  if (config.drawZones) {
    config.drawZones.forEach(dz => {
      if (!zones.some(z => z.name === dz.name)) zones.push(dz);
    });
  }
  const prizes = config.prizes;
  if (!prizes.some(p => p.matchPattern)) return '';

  let html = '<div class="pi"><b style="margin-bottom:2px;display:block">中奖条件：</b>';
  for (const prize of prizes) {
    if (!prize.matchPattern) continue;
    const patterns = prize.matchPattern;
    const typeNote = prize.prizeType === 'straight' ? '按位全同' :
                     prize.prizeType === 'group3' ? '2同1异·不限位' :
                     prize.prizeType === 'group6' ? '3异·不限位' : '';
    const descParts = patterns.map(pattern => {
      return pattern.map((hits, zi) => `${hits}${zones[zi].name}`).join('+');
    });
    const desc = descParts.join(' / ');
    let amountStr = '';
    if (prize.fixed) {
      amountStr = formatMoney(prize.amount);
    } else {
      amountStr = '浮动';
    }
    const rows = patterns.map(pattern => {
      let ballsHtml = '';
      pattern.forEach((hits, zi) => {
        if (zi > 0) ballsHtml += '<span class="ps">+</span>';
        const zone = zones[zi];
        const misses = zone.count - hits;
        for (let i = 0; i < hits; i++) {
          ballsHtml += `<i class="ph" style="background:${zone.color}"></i>`;
        }
        for (let i = 0; i < misses; i++) {
          ballsHtml += '<i class="pm"></i>';
        }
      });
      return ballsHtml;
    });
    html += `<div class="pr"><span class="pn">${prize.name}</span>${rows.join('<span class="po">/</span>')}`;
    html += `<span class="pr-info"><span class="pd">${desc}`;
    if (typeNote) html += `（${typeNote}）`;
    html += `</span><span class="pa">${amountStr}</span></span></div>`;
  }
  html += '</div>';
  return html;
}

function updateLotteryDisplay() {
  const config = getLotteryConfig(currentLottery);
  $('#lottery-rules').textContent = config.rules;
  const collapseBody = $('#rules-collapse-body');
  const wasOpen = collapseBody.classList.contains('open');
  collapseBody.innerHTML = (config.description || '') + generatePrizeIllustration(config);
  if (wasOpen) {
    requestAnimationFrame(() => {
      collapseBody.style.maxHeight = collapseBody.scrollHeight + 40 + 'px';
    });
  } else {
    collapseBody.style.maxHeight = '0';
  }
  $('#result-balls').innerHTML = '';
  const displayZones = config.drawZones ? [...config.drawZones] : [...config.zones];
  displayZones.forEach(zone => {
    const container = document.createElement('div');
    container.className = 'ball-zone';
    container.innerHTML = `<span class="zone-label" style="color:${zone.color}">${zone.name}:</span>`;
    for (let i = 0; i < zone.count; i++) {
      const ball = document.createElement('span');
      ball.className = 'ball';
      ball.style.background = `linear-gradient(135deg, ${zone.color}, ${zone.color}cc)`;
      ball.style.boxShadow = `0 2px 8px ${zone.color}66`;
      ball.textContent = '?';
      container.appendChild(ball);
    }
    $('#result-balls').appendChild(container);
  });

  // 显示/隐藏追加投注行
  const addOnRow = $('#add-on-row');
  if (config.canAddOn) {
    addOnRow.style.display = 'flex';
    // 重置追加按钮状态
    $$('.add-on-btn').forEach(b => b.classList.remove('active'));
    const noAddOnBtn = document.querySelector('.add-on-btn[data-addon="0"]');
    if (noAddOnBtn) noAddOnBtn.classList.add('active');
    addOnEnabled = false;
  } else {
    addOnRow.style.display = 'none';
    addOnEnabled = false;
  }
}

function animateDraw(result, callback) {
  const balls = $$('#result-balls .ball');
  let zoneOffset = 0;
  let ballIndex = 0;

  result.forEach((zone, zi) => {
    zone.numbers.forEach((num, ni) => {
      const ball = balls[zoneOffset + ni];
      ball.classList.add('rolling');
      setTimeout(() => {
        ball.classList.remove('rolling');
        ball.classList.add('revealed');
        ball.textContent = num.toString().padStart(2, '0');
        ballIndex++;
        if (ballIndex === balls.length && callback) callback();
      }, (zoneOffset + ni) * 300 + 500);
    });
    zoneOffset += zone.numbers.length;
  });
}

function renderSingleResult(result) {
  renderHistoryPage();
  runAnalysis();
}

function renderBatchResults() {
  const ballsContainer = $('#result-balls');
  const config = getLotteryConfig(currentLottery);
  ballsContainer.innerHTML = '';

  if (simulationResults.length > 0) {
    const last = simulationResults[simulationResults.length - 1];
    const displayZones = config.drawZones ? [...config.drawZones] : [...config.zones];
    displayZones.forEach((zone, zi) => {
      const container = document.createElement('div');
      container.className = 'ball-zone';
      container.innerHTML = `<span class="zone-label" style="color:${zone.color}">${zone.name}:</span>`;
      last[zi].numbers.forEach(num => {
        const ball = document.createElement('span');
        ball.className = 'ball revealed';
        ball.style.background = `linear-gradient(135deg, ${zone.color}, ${zone.color}cc)`;
        ball.style.boxShadow = `0 2px 8px ${zone.color}66`;
        ball.textContent = num.toString().padStart(2, '0');
        container.appendChild(ball);
      });
      ballsContainer.appendChild(container);
    });
  }

  $('#sim-info').textContent = `已模拟 ${simulationResults.length} 期`;
  $('#sim-info-bottom').textContent = `共 ${simulationResults.length} 期模拟结果`;
  renderHistoryPage();
}

function startLargeSimulation(count) {
  isSimulating = true;
  $('#btn-simulate').textContent = '停止';
  $('#btn-simulate').classList.add('btn-danger');
  $('#progress-container').style.display = 'block';
  $('#progress-bar').style.width = '0%';
  $('#progress-text').textContent = '0%';

  workerHandle = startWorkerSimulation(
    currentLottery,
    count,
    (current, total) => {
      const pct = (current / total * 100).toFixed(1);
      $('#progress-bar').style.width = pct + '%';
      $('#progress-text').textContent = `${pct}% (${current.toLocaleString()}/${total.toLocaleString()})`;
    },
    (results) => {
      simulationResults = results;
      currentPage = 1;
      isSimulating = false;
      $('#btn-simulate').textContent = '开始模拟';
      $('#btn-simulate').classList.remove('btn-danger');
      $('#progress-container').style.display = 'none';
      renderBatchResults();
      runAnalysis();
      updatePurchaseWithNewDraw();
    }
  );
}

function stopSimulation() {
  if (workerHandle) {
    workerHandle.cancel();
    workerHandle = null;
  }
  isSimulating = false;
  $('#btn-simulate').textContent = '开始模拟';
  $('#btn-simulate').classList.remove('btn-danger');
  $('#progress-container').style.display = 'none';
}

function clearResults() {
  simulationResults = [];
  currentPage = 1;
  $('#sim-info').textContent = '';
  $('#history-body').innerHTML = '';
  $('#history-pagination').innerHTML = '';
  $('#analysis-content').innerHTML = '<p class="placeholder-text">请先进行模拟</p>';
  $('#draw-stats-content').innerHTML = '<p class="placeholder-text">请先进行模拟</p>';
  $('#purchase-result-section').style.display = 'none';
  $('#purchase-result-content').innerHTML = '';
  lastPurchaseData = null;
  lastPurchaseTickets = null;
  lastPurchaseCount = null;
  betMode = 'random';
  betType = 'single';
  betMultiplier = 1;
  addOnEnabled = false;
  clearFinanceSummary();
  selectedNumbers = [];
  $$('.bet-mode-btn').forEach(b => b.classList.remove('active'));
  $$('.bet-type-btn').forEach(b => b.classList.remove('active'));
  $$('.multiplier-btn').forEach(b => b.classList.remove('active'));
  $$('.add-on-btn').forEach(b => b.classList.remove('active'));
  const randomBtn = document.querySelector('.bet-mode-btn[data-mode="random"]');
  const singleBtn = document.querySelector('.bet-type-btn[data-type="single"]');
  const multiplier1Btn = document.querySelector('.multiplier-btn[data-multiplier="1"]');
  const noAddOnBtn = document.querySelector('.add-on-btn[data-addon="0"]');
  if (randomBtn) randomBtn.classList.add('active');
  if (singleBtn) singleBtn.classList.add('active');
  if (multiplier1Btn) multiplier1Btn.classList.add('active');
  if (noAddOnBtn) noAddOnBtn.classList.add('active');
  const manualArea = $('#manual-select-area');
  if (manualArea) manualArea.style.display = 'none';
  const randomMultipleArea = $('#random-multiple-area');
  if (randomMultipleArea) randomMultipleArea.style.display = 'none';
  updateLotteryDisplay();
}

function renderHistoryPage() {
  const config = getLotteryConfig(currentLottery);
  const tbody = $('#history-body');
  const totalPages = Math.ceil(simulationResults.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, simulationResults.length);

  let html = '';
  for (let i = start; i < end; i++) {
    const r = simulationResults[i];
    const allNums = r.map(z => z.numbers.map(n => n.toString().padStart(2, '0')).join(' ')).join(' | ');
    const sum = r.reduce((s, z) => s + z.numbers.reduce((a, b) => a + b, 0), 0);
    const allNumsFlat = r.flatMap(z => z.numbers);
    const odd = allNumsFlat.filter(n => n % 2 !== 0).length;
    const even = allNumsFlat.length - odd;
    html += `<tr><td>${i + 1}</td><td>${allNums}</td><td>${sum}</td><td>${odd}:${even}</td></tr>`;
  }
  tbody.innerHTML = html;

  let paginationHtml = '';
  paginationHtml += `<button class="page-btn" data-action="prev" ${currentPage <= 1 ? 'disabled' : ''}>上一页</button>`;
  const startPage = Math.max(1, currentPage - 3);
  const endPage = Math.min(totalPages, currentPage + 3);
  for (let p = startPage; p <= endPage; p++) {
    paginationHtml += `<button class="page-btn${p === currentPage ? ' active' : ''}" data-action="page" data-page="${p}">${p}</button>`;
  }
  paginationHtml += `<button class="page-btn" data-action="next" ${currentPage >= totalPages ? 'disabled' : ''}>下一页</button>`;
  $('#history-pagination').innerHTML = paginationHtml;
  $('#sim-info').textContent = `已模拟 ${simulationResults.length} 期`;
  $('#sim-info-bottom').textContent = `共 ${simulationResults.length} 期模拟结果`;
}

function runAnalysis() {
  if (simulationResults.length === 0) return;
  const activeTab = document.querySelector('.analysis-tab.active');
  if (activeTab) {
    renderAnalysisTab(activeTab.dataset.tab);
  } else {
    renderAnalysisTab('frequency');
  }
  const activeStatsTab = document.querySelector('.draw-stats-tab.active');
  if (activeStatsTab) {
    renderDrawStatsTab(activeStatsTab.dataset.tab);
  } else {
    renderDrawStatsTab('bulletin');
  }
}

function renderAnalysisTab(tabName) {
  const container = $('#analysis-content');
  container.innerHTML = '';

  switch (tabName) {
    case 'frequency': renderFrequencyAnalysis(container); break;
    case 'missing': renderMissingAnalysis(container); break;
    
    case 'oddeven': renderOddEvenAnalysis(container); break;
    case 'sum': renderSumAnalysis(container); break;
    case 'consecutive': renderConsecutiveAnalysis(container); break;
    case 'range': renderRangeAnalysis(container); break;
    case 'bigsmall': renderBigSmallAnalysis(container); break;
    case 'road012': render012RoadAnalysis(container); break;
    case 'span': renderSpanAnalysis(container); break;
    case 'repeat': renderRepeatAnalysis(container); break;
    case 'neighbor': renderNeighborAnalysis(container); break;
  }
}

function renderFrequencyAnalysis(container) {
  const data = analyzeFrequency(simulationResults, currentLottery);
  data.forEach(zone => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const toggleBar = document.createElement('div');
    toggleBar.className = 'freq-toggle-bar';
    toggleBar.innerHTML = `
      <button class="freq-toggle-btn active" data-mode="absolute">绝对频率</button>
      <button class="freq-toggle-btn" data-mode="deviation">偏差分析</button>
    `;
    section.appendChild(toggleBar);

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const deviationCanvas = document.createElement('canvas');
    deviationCanvas.style.display = 'none';
    section.appendChild(deviationCanvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper horizontal-table';
    
    const totalNumbers = zone.entries.length;
    const maxPerRow = 20;
    const numRows = Math.ceil(totalNumbers / maxPerRow);
    const numbersPerRow = Math.ceil(totalNumbers / numRows);
    
    let tableHtml = '<div class="horizontal-table-grid">';
    for (let row = 0; row < numRows; row++) {
      const startIdx = row * numbersPerRow;
      const endIdx = Math.min(startIdx + numbersPerRow, totalNumbers);
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">号码</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        tableHtml += `<div class="horizontal-table-cell-number" style="color:${zone.color}">${e.number}</div>`;
      }
      tableHtml += '</div>';
      
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">出现次数</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        tableHtml += `<div class="horizontal-table-cell">${e.count}</div>`;
      }
      tableHtml += '</div>';
      
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">实际频率</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        tableHtml += `<div class="horizontal-table-cell">${e.percentage}%</div>`;
      }
      tableHtml += '</div>';
      
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">理论频率</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        tableHtml += `<div class="horizontal-table-cell">${e.theoreticalPercentage}%</div>`;
      }
      tableHtml += '</div>';
      
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">偏差</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        const diff = (parseFloat(e.percentage) - parseFloat(e.theoreticalPercentage)).toFixed(2);
        const diffColor = diff > 0 ? '#e74c3c' : diff < 0 ? '#3498db' : '#8892b0';
        tableHtml += `<div class="horizontal-table-cell" style="color:${diffColor}">${diff > 0 ? '+' : ''}${diff}%</div>`;
      }
      tableHtml += '</div>';
    }
    tableHtml += '</div>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    const avgCount = zone.entries.reduce((s, e) => s + e.count, 0) / zone.entries.length;

    toggleBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.freq-toggle-btn');
      if (!btn) return;
      toggleBar.querySelectorAll('.freq-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.mode === 'absolute') {
        canvas.style.display = 'block';
        deviationCanvas.style.display = 'none';
      } else {
        canvas.style.display = 'none';
        deviationCanvas.style.display = 'block';
      }
    });

    requestAnimationFrame(() => {
      drawBarChart(canvas, zone.entries.map(e => ({ label: e.number.toString(), value: e.count })), {
        color: zone.color,
        title: `${zone.zoneName} - 号码频率`,
        referenceLine: avgCount,
        deviationColors: true
      });

      drawBarChart(deviationCanvas, zone.entries.map(e => ({
        label: e.number.toString(),
        value: parseFloat(e.percentage) - parseFloat(e.theoreticalPercentage)
      })), {
        color: zone.color,
        title: `${zone.zoneName} - 频率偏差 (实际-理论)`
      });
    });
  });
}

function renderMissingAnalysis(container) {
  const data = analyzeMissing(simulationResults, currentLottery);
  data.forEach(zone => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper horizontal-table';
    
    const totalNumbers = zone.entries.length;
    const maxPerRow = 20;
    const numRows = Math.ceil(totalNumbers / maxPerRow);
    const numbersPerRow = Math.ceil(totalNumbers / numRows);
    
    let tableHtml = '<div class="horizontal-table-grid">';
    for (let row = 0; row < numRows; row++) {
      const startIdx = row * numbersPerRow;
      const endIdx = Math.min(startIdx + numbersPerRow, totalNumbers);
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">号码</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        tableHtml += `<div class="horizontal-table-cell-number" style="color:${zone.color}">${e.number}</div>`;
      }
      tableHtml += '</div>';
      
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">当前遗漏</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        let missColor = 'var(--text-secondary)';
        if (e.currentMissing >= 10) missColor = '#e74c3c';
        else if (e.currentMissing >= 5) missColor = '#f39c12';
        tableHtml += `<div class="horizontal-table-cell" style="color:${missColor}">${e.currentMissing}</div>`;
      }
      tableHtml += '</div>';
      
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">最大遗漏</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        tableHtml += `<div class="horizontal-table-cell">${e.maxMissing}</div>`;
      }
      tableHtml += '</div>';
      
      tableHtml += '<div class="horizontal-table-row">';
      tableHtml += '<div class="horizontal-table-cell-header">平均遗漏</div>';
      for (let i = startIdx; i < endIdx; i++) {
        const e = zone.entries[i];
        tableHtml += `<div class="horizontal-table-cell">${e.avgMissing}</div>`;
      }
      tableHtml += '</div>';
    }
    tableHtml += '</div>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    requestAnimationFrame(() => {
      drawBarChart(canvas, zone.entries.map(e => ({ label: e.number.toString(), value: e.currentMissing })), {
        color: zone.color,
        title: `${zone.zoneName} - 当前遗漏值`
      });
    });
  });
}

function renderOddEvenAnalysis(container) {
  const data = analyzeOddEven(simulationResults, currentLottery);
  data.forEach(zone => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper';
    let tableHtml = `<table class="data-table"><thead><tr><th>奇偶比</th><th>期数</th><th>占比</th></tr></thead><tbody>`;
    zone.entries.forEach(e => {
      tableHtml += `<tr><td>${e.ratio}</td><td>${e.count}</td><td>${e.percentage}%</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    requestAnimationFrame(() => {
      drawPieChart(canvas, zone.entries.map(e => ({
        label: e.ratio,
        value: e.count
      })), { title: `${zone.zoneName} - 奇偶比分布` });
    });
  });
}

function renderSumAnalysis(container) {
  const data = analyzeSum(simulationResults, currentLottery);
  const config = getLotteryConfig(currentLottery);
  data.forEach((zone, zi) => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper';
    let tableHtml = `<table class="data-table"><thead><tr><th>和值</th><th>期数</th></tr></thead><tbody>`;
    zone.entries.forEach(e => {
      tableHtml += `<tr><td>${e.sum}</td><td>${e.count}</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    requestAnimationFrame(() => {
      const analysisZones = config.drawZones || config.zones;
      const z = analysisZones[zi];
      const N = z.max - z.min + 1;
      const k = z.count;
      const mean = k * (z.min + z.max) / 2;
      let variance;
      if (z.repeatable) {
        variance = k * (N * N - 1) / 12;
      } else {
        variance = k * (N - k) / (N - 1) * (N * N - 1) / 12;
      }
      const stdDev = Math.sqrt(variance);

      const overlayData = zone.entries.map(e => {
        const x = e.sum;
        const pdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        return { label: e.sum.toString(), value: pdf * simulationResults.length };
      });

      drawLineChart(canvas, zone.entries.map(e => ({ label: e.sum.toString(), value: e.count })), {
        color: zone.color,
        title: `${zone.zoneName} - 和值分布`,
        overlayData
      });
    });
  });
}

function renderConsecutiveAnalysis(container) {
  const data = analyzeConsecutive(simulationResults, currentLottery);
  const section = document.createElement('div');
  section.className = 'analysis-section';

  const info = document.createElement('div');
  info.className = 'consecutive-info';
  info.innerHTML = `<p>含连号期数占比：<strong>${data.hasConsecutivePercentage}%</strong></p>`;
  section.appendChild(info);

  const canvas = document.createElement('canvas');
  section.appendChild(canvas);

  const table = document.createElement('div');
  table.className = 'data-table-wrapper';
  let tableHtml = `<table class="data-table"><thead><tr><th>连号组数</th><th>期数</th><th>占比</th></tr></thead><tbody>`;
  data.groupDistribution.forEach(e => {
    tableHtml += `<tr><td>${e.groups}</td><td>${e.count}</td><td>${e.percentage}%</td></tr>`;
  });
  tableHtml += '</tbody></table>';
  table.innerHTML = tableHtml;
  section.appendChild(table);
  container.appendChild(section);

  requestAnimationFrame(() => {
    drawBarChart(canvas, data.groupDistribution.map(e => ({
      label: e.groups.toString(),
      value: e.count
    })), { title: '连号组数分布' });
  });
}

function renderRangeAnalysis(container) {
  const data = analyzeRangeDistribution(simulationResults, currentLottery);
  data.forEach(zone => {
    if (!zone.entries.length) return;
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper';
    let tableHtml = `<table class="data-table"><thead><tr><th>区间</th><th>出现次数</th><th>占比</th></tr></thead><tbody>`;
    zone.entries.forEach(e => {
      tableHtml += `<tr><td>${e.label}</td><td>${e.count}</td><td>${e.percentage}%</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    requestAnimationFrame(() => {
      drawBarChart(canvas, zone.entries.map(e => ({
        label: e.label,
        value: e.count
      })), { color: zone.color, title: `${zone.zoneName} - 区间分布` });
    });
  });
}

function renderBigSmallAnalysis(container) {
  const data = analyzeBigSmall(simulationResults, currentLottery);
  data.forEach(zone => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const info = document.createElement('div');
    info.innerHTML = `<p style="color:var(--text-muted);font-size:12px;margin-bottom:10px;">大小分界：${zone.mid}（大于${zone.mid}为大，小于等于${zone.mid}为小）</p>`;
    section.appendChild(info);

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper';
    let tableHtml = `<table class="data-table"><thead><tr><th>大小比</th><th>期数</th><th>占比</th></tr></thead><tbody>`;
    zone.entries.forEach(e => {
      tableHtml += `<tr><td>${e.ratio}</td><td>${e.count}</td><td>${e.percentage}%</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    requestAnimationFrame(() => {
      drawPieChart(canvas, zone.entries.map(e => ({
        label: e.ratio,
        value: e.count
      })), { title: `${zone.zoneName} - 大小比分布` });
    });
  });
}

function render012RoadAnalysis(container) {
  const data = analyze012Road(simulationResults, currentLottery);
  data.forEach(zone => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const toggleBar = document.createElement('div');
    toggleBar.className = 'freq-toggle-bar';
    toggleBar.innerHTML = `
      <button class="freq-toggle-btn active" data-mode="road">012路分布</button>
      <button class="freq-toggle-btn" data-mode="ratio">组合比例</button>
    `;
    section.appendChild(toggleBar);

    const canvasRoad = document.createElement('canvas');
    section.appendChild(canvasRoad);

    const canvasRatio = document.createElement('canvas');
    canvasRatio.style.display = 'none';
    section.appendChild(canvasRatio);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper';
    let tableHtml = `<table class="data-table"><thead><tr><th>类型</th><th>出现次数</th><th>实际频率</th><th>理论频率</th></tr></thead><tbody>`;
    zone.roadEntries.forEach(e => {
      const roadName = ['0路', '1路', '2路'][parseInt(e.road)];
      const diff = (parseFloat(e.percentage) - parseFloat(e.theoreticalPercentage)).toFixed(2);
      const diffColor = diff > 0 ? '#e74c3c' : diff < 0 ? '#3498db' : '#8892b0';
      tableHtml += `<tr><td>${roadName}</td><td>${e.count}</td><td>${e.percentage}%</td><td>${e.theoreticalPercentage}%</td><td style="color:${diffColor}">${diff > 0 ? '+' : ''}${diff}%</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    toggleBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.freq-toggle-btn');
      if (!btn) return;
      toggleBar.querySelectorAll('.freq-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.mode === 'road') {
        canvasRoad.style.display = 'block';
        canvasRatio.style.display = 'none';
      } else {
        canvasRoad.style.display = 'none';
        canvasRatio.style.display = 'block';
      }
    });

    requestAnimationFrame(() => {
      drawBarChart(canvasRoad, zone.roadEntries.map(e => ({
        label: ['0路', '1路', '2路'][parseInt(e.road)],
        value: e.count
      })), { color: zone.color, title: `${zone.zoneName} - 012路分布` });

      drawPieChart(canvasRatio, zone.ratioEntries.slice(0, 10).map(e => ({
        label: e.ratio,
        value: e.count
      })), { title: `${zone.zoneName} - 012路组合（前10）` });
    });
  });
}

function renderSpanAnalysis(container) {
  const data = analyzeSpan(simulationResults, currentLottery);
  data.forEach(zone => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper';
    let tableHtml = `<table class="data-table"><thead><tr><th>跨度</th><th>期数</th></tr></thead><tbody>`;
    zone.entries.forEach(e => {
      tableHtml += `<tr><td>${e.span}</td><td>${e.count}</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    requestAnimationFrame(() => {
      drawLineChart(canvas, zone.entries.map(e => ({ label: e.span.toString(), value: e.count })), {
        color: zone.color,
        title: `${zone.zoneName} - 跨度分布`
      });
    });
  });
}

function renderRepeatAnalysis(container) {
  const data = analyzeRepeat(simulationResults, currentLottery);
  if (!data.length) {
    container.innerHTML = '<p class="placeholder-text">请至少模拟2期数据</p>';
    return;
  }
  data.forEach(zone => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper';
    let tableHtml = `<table class="data-table"><thead><tr><th>重号个数</th><th>期数</th><th>占比</th></tr></thead><tbody>`;
    zone.entries.forEach(e => {
      tableHtml += `<tr><td>${e.repeats}</td><td>${e.count}</td><td>${e.percentage}%</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    requestAnimationFrame(() => {
      drawBarChart(canvas, zone.entries.map(e => ({
        label: e.repeats.toString(),
        value: e.count
      })), { color: zone.color, title: `${zone.zoneName} - 重号分布` });
    });
  });
}

function renderNeighborAnalysis(container) {
  const data = analyzeNeighbor(simulationResults, currentLottery);
  if (!data.length) {
    container.innerHTML = '<p class="placeholder-text">请至少模拟2期数据</p>';
    return;
  }
  data.forEach(zone => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const canvas = document.createElement('canvas');
    section.appendChild(canvas);

    const table = document.createElement('div');
    table.className = 'data-table-wrapper';
    let tableHtml = `<table class="data-table"><thead><tr><th>邻号个数</th><th>期数</th><th>占比</th></tr></thead><tbody>`;
    zone.entries.forEach(e => {
      tableHtml += `<tr><td>${e.neighbors}</td><td>${e.count}</td><td>${e.percentage}%</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    table.innerHTML = tableHtml;
    section.appendChild(table);
    container.appendChild(section);

    requestAnimationFrame(() => {
      drawBarChart(canvas, zone.entries.map(e => ({
        label: e.neighbors.toString(),
        value: e.count
      })), { color: zone.color, title: `${zone.zoneName} - 邻号分布` });
    });
  });
}

function renderDrawStatsTab(tabName) {
  const container = $('#draw-stats-content');
  container.innerHTML = '';
  if (simulationResults.length === 0) {
    container.innerHTML = '<p class="placeholder-text">请先进行模拟</p>';
    return;
  }
  switch (tabName) {
    case 'bulletin': renderBulletin(container); break;
    case 'trend': renderTrend(container); break;
  }
}

function renderBulletin(container) {
  const config = getLotteryConfig(currentLottery);
  const totalItems = simulationResults.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (bulletinPage > totalPages) bulletinPage = totalPages || 1;
  
  const startIdx = (bulletinPage - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, totalItems);

  container.innerHTML = '';

  const list = document.createElement('div');
  list.className = 'bulletin-list';

  for (let i = totalItems - 1 - startIdx; i >= totalItems - endIdx; i--) {
    const r = simulationResults[i];
    const item = document.createElement('div');
    item.className = 'bulletin-item';

    const period = document.createElement('span');
    period.className = 'bulletin-period';
    period.textContent = `第${i + 1}期`;
    item.appendChild(period);

    const ballsDiv = document.createElement('div');
    ballsDiv.className = 'bulletin-balls';

    r.forEach((zone, zi) => {
      if (zi > 0) {
        const sep = document.createElement('span');
        sep.className = 'bulletin-separator';
        sep.textContent = '|';
        ballsDiv.appendChild(sep);
      }
      const bulletinZones = config.drawZones || config.zones;
      const zoneColor = bulletinZones[zi] ? bulletinZones[zi].color : zone.color;
      zone.numbers.forEach(num => {
        const ball = document.createElement('span');
        ball.className = 'bulletin-ball';
        ball.style.background = `linear-gradient(135deg, ${zoneColor}, ${zoneColor}cc)`;
        ball.textContent = num.toString().padStart(2, '0');
        ballsDiv.appendChild(ball);
      });
    });
    item.appendChild(ballsDiv);

    const extra = document.createElement('div');
    extra.className = 'bulletin-extra';
    const allNums = r.flatMap(z => z.numbers);
    const sum = allNums.reduce((a, b) => a + b, 0);
    const odd = allNums.filter(n => n % 2 !== 0).length;
    const even = allNums.length - odd;
    extra.innerHTML = `<span>和值:${sum}</span><span>奇偶:${odd}:${even}</span>`;
    item.appendChild(extra);

    list.appendChild(item);
  }

  const pagination = document.createElement('div');
  pagination.className = 'bulletin-pagination';
  pagination.innerHTML = `
    <button class="bulletin-page-btn" data-action="prev" ${bulletinPage === 1 ? 'disabled' : ''}>上一页</button>
    <span class="bulletin-page-info">第${bulletinPage}/${totalPages}页，共${totalItems}期</span>
    <button class="bulletin-page-btn" data-action="next" ${bulletinPage === totalPages ? 'disabled' : ''}>下一页</button>
  `;
  
  pagination.querySelectorAll('.bulletin-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'prev' && bulletinPage > 1) {
        bulletinPage--;
      } else if (btn.dataset.action === 'next' && bulletinPage < totalPages) {
        bulletinPage++;
      }
      renderBulletin(container);
    });
  });

  container.appendChild(pagination);
  container.appendChild(list);
}

function renderTrend(container) {
  const config = getLotteryConfig(currentLottery);
  const trendCount = Math.min(50, simulationResults.length);
  const startIdx = simulationResults.length - trendCount;
  const freqData = analyzeFrequency(simulationResults, currentLottery);
  const missingData = analyzeMissing(simulationResults, currentLottery);

  // 总期数信息
  const header = document.createElement('div');
  header.className = 'overview-header';
  header.innerHTML = `<span>总期数: <strong>${simulationResults.length}</strong></span><span>彩票类型: <strong>${config.name}</strong></span>`;
  container.appendChild(header);

  config.zones.forEach((zone, zi) => {
    if (zone.repeatable) return;

    const section = document.createElement('div');
    section.className = 'analysis-section';

    const title = document.createElement('h3');
    title.style.cssText = `color:${zone.color};font-size:14px;margin-bottom:10px;font-weight:600;`;
    title.textContent = `${zone.name}号码走势`;
    section.appendChild(title);

    const wrapper = document.createElement('div');
    wrapper.className = 'trend-wrapper';

    const table = document.createElement('table');
    table.className = 'trend-table';

    const thead = document.createElement('thead');
    let headerRow = '<th>期号</th>';
    for (let n = zone.min; n <= zone.max; n++) {
      headerRow += `<th>${n}</th>`;
    }
    thead.innerHTML = headerRow;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const numberLastAppear = {};
    for (let n = zone.min; n <= zone.max; n++) numberLastAppear[n] = -1;

    for (let i = startIdx; i < simulationResults.length; i++) {
      const r = simulationResults[i];
      const nums = r[zi].numbers;
      const numSet = new Set(nums);
      let row = '<td>' + (i + 1) + '</td>';

      for (let n = zone.min; n <= zone.max; n++) {
        if (numSet.has(n)) {
          numberLastAppear[n] = i;
          row += '<td><span class="trend-hit" style="background:' + zone.color + '">' + n + '</span></td>';
        } else {
          const missCount = numberLastAppear[n] >= 0 ? i - numberLastAppear[n] : i - startIdx + 1;
          row += '<td><span class="trend-miss">' + missCount + '</span></td>';
        }
      }
      tbody.innerHTML += row;
    }
    
    // 添加统计信息到表格最下方
    const freqEntries = freqData[zi].entries;
    const missEntries = missingData[zi].entries;
    
    // 第一行：号码
    let numberRow = '<tr><td style="background:var(--bg-card);font-weight:700;color:var(--text-primary);"></td>';
    for (let n = zone.min; n <= zone.max; n++) {
      numberRow += '<td style="background:var(--bg-card);color:' + zone.color + ';font-weight:800;font-size:13px;">' + n + '</td>';
    }
    numberRow += '</tr>';
    tbody.innerHTML += numberRow;
    
    // 第二行：出现次数
    let countRow = '<tr><td style="background:var(--bg-card);font-weight:700;color:var(--text-primary);">次数</td>';
    for (let n = zone.min; n <= zone.max; n++) {
      const freqEntry = freqEntries.find(e => e.number === n);
      const pct = parseFloat(freqEntry.percentage);
      const theo = parseFloat(freqEntry.theoreticalPercentage);
      let bg = '';
      let textColor = 'var(--text-primary)';
      if (pct > theo * 1.2) {
        bg = 'background:rgba(231,76,60,0.12);';
        textColor = '#e74c3c';
      } else if (pct < theo * 0.8) {
        bg = 'background:rgba(52,152,219,0.12);';
        textColor = '#3498db';
      }
      countRow += '<td style="' + bg + 'color:' + textColor + ';font-weight:700;">' + freqEntry.count + '</td>';
    }
    countRow += '</tr>';
    tbody.innerHTML += countRow;

    // 第三行：遗漏
    let missRow = '<tr><td style="background:var(--bg-card);font-weight:700;color:var(--text-primary);">遗漏</td>';
    for (let n = zone.min; n <= zone.max; n++) {
      const missEntry = missEntries.find(e => e.number === n);
      let missColor = 'var(--text-secondary)';
      if (missEntry.currentMissing >= 10) missColor = '#e74c3c';
      else if (missEntry.currentMissing >= 5) missColor = '#f39c12';
      missRow += '<td style="color:' + missColor + ';font-weight:600;">' + missEntry.currentMissing + '</td>';
    }
    missRow += '</tr>';
    tbody.innerHTML += missRow;

    // 第四行：百分比
    let pctRow = '<tr><td style="background:var(--bg-card);font-weight:700;color:var(--text-primary);">概率</td>';
    for (let n = zone.min; n <= zone.max; n++) {
      const freqEntry = freqEntries.find(e => e.number === n);
      pctRow += '<td style="color:var(--text-muted);font-size:10px;font-weight:500;">' + freqEntry.percentage + '</td>';
    }
    pctRow += '</tr>';
    tbody.innerHTML += pctRow;
    
    table.appendChild(tbody);
    wrapper.appendChild(table);
    section.appendChild(wrapper);
    container.appendChild(section);
  });

  if (config.zones.some(z => z.repeatable)) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    const note = document.createElement('p');
    note.style.cssText = 'color:var(--text-muted);font-size:12px;text-align:center;padding:20px;';
    note.textContent = '可重复选号的彩票类型不适用号码走势图';
    section.appendChild(note);
    container.appendChild(section);
  }
}

function renderOverview(container) {
  const config = getLotteryConfig(currentLottery);
  const freqData = analyzeFrequency(simulationResults, currentLottery);
  const missingData = analyzeMissing(simulationResults, currentLottery);

  const header = document.createElement('div');
  header.className = 'overview-header';
  header.innerHTML = `<span>总期数: <strong>${simulationResults.length}</strong></span><span>彩票类型: <strong>${config.name}</strong></span>`;
  container.appendChild(header);

  config.zones.forEach((zone, zi) => {
    const section = document.createElement('div');
    section.className = 'analysis-section';

    const zoneTitle = document.createElement('h3');
    zoneTitle.style.cssText = `color:${zone.color};font-size:14px;margin-bottom:10px;font-weight:600;`;
    zoneTitle.textContent = `${zone.zoneName}号码统计`;
    section.appendChild(zoneTitle);

    const grid = document.createElement('div');
    grid.className = 'overview-grid';

    const freqEntries = freqData[zi].entries;
    const missEntries = missingData[zi].entries;

    freqEntries.forEach((e, idx) => {
      const cell = document.createElement('div');
      cell.className = 'overview-cell';

      const numSpan = document.createElement('span');
      numSpan.className = 'overview-num';
      numSpan.style.color = zone.color;
      numSpan.textContent = e.number;

      const countSpan = document.createElement('span');
      countSpan.className = 'overview-count';
      countSpan.textContent = `${e.count}次`;

      const missSpan = document.createElement('span');
      missSpan.className = 'overview-miss';
      missSpan.textContent = `遗漏${missEntries[idx].currentMissing}`;

      const pct = parseFloat(e.percentage);
      const theo = parseFloat(e.theoreticalPercentage);
      if (pct > theo * 1.2) {
        cell.style.borderColor = '#e74c3c44';
        cell.style.background = 'rgba(231,76,60,0.08)';
      } else if (pct < theo * 0.8) {
        cell.style.borderColor = '#3498db44';
        cell.style.background = 'rgba(52,152,219,0.08)';
      }

      cell.appendChild(numSpan);
      cell.appendChild(countSpan);
      cell.appendChild(missSpan);
      grid.appendChild(cell);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}

function renderRandomMultiplePanel() {
  const config = getLotteryConfig(currentLottery);
  const panel = $('#random-multiple-panel');
  panel.innerHTML = '';

  config.zones.forEach((zone, zi) => {
    const zoneDiv = document.createElement('div');
    zoneDiv.className = 'number-zone';

    const label = document.createElement('div');
    label.className = 'zone-label';
    const labelSpan = document.createElement('span');
    labelSpan.style.color = zone.color;
    labelSpan.textContent = zone.zoneName;
    label.appendChild(labelSpan);

    const info = document.createElement('span');
    info.className = 'zone-count-info';
    if (zone.repeatable) {
      info.textContent = `(标准${zone.count}位)`;
    } else {
      info.textContent = `(标准${zone.count}个)`;
    }
    label.appendChild(info);
    zoneDiv.appendChild(label);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'num-btn';
    minusBtn.style.cssText = 'width:28px;height:28px;font-size:16px;border-radius:6px;';
    minusBtn.textContent = '−';
    const countSpan = document.createElement('span');
    countSpan.className = 'random-multiple-count';
    countSpan.dataset.zone = zi;
    countSpan.style.cssText = 'font-size:16px;font-weight:700;color:var(--accent);min-width:24px;text-align:center;';
    countSpan.textContent = zone.count;
    const plusBtn = document.createElement('button');
    plusBtn.className = 'num-btn';
    plusBtn.style.cssText = 'width:28px;height:28px;font-size:16px;border-radius:6px;';
    plusBtn.textContent = '+';

    const maxNums = zone.repeatable ? zone.count * 3 : (zone.max - zone.min + 1);

    minusBtn.addEventListener('click', () => {
      let val = parseInt(countSpan.textContent);
      if (val > zone.count) {
        countSpan.textContent = val - 1;
        updateRandomMultipleInfo();
      }
    });
    plusBtn.addEventListener('click', () => {
      let val = parseInt(countSpan.textContent);
      if (val < maxNums) {
        countSpan.textContent = val + 1;
        updateRandomMultipleInfo();
      }
    });

    row.appendChild(minusBtn);
    row.appendChild(countSpan);
    row.appendChild(plusBtn);

    const desc = document.createElement('span');
    desc.style.cssText = 'font-size:11px;color:var(--text-muted);';
    if (zone.repeatable) {
      desc.textContent = `位`;
    } else {
      desc.textContent = `个号码`;
    }
    row.appendChild(desc);

    zoneDiv.appendChild(row);
    panel.appendChild(zoneDiv);
  });

  updateRandomMultipleInfo();
}

function updateRandomMultipleInfo() {
  const config = getLotteryConfig(currentLottery);
  const infoEl = $('#random-multiple-info');
  if (!infoEl) return;

  let totalBets = 1;
  const counts = document.querySelectorAll('.random-multiple-count');
  counts.forEach((span, zi) => {
    const zone = config.zones[zi];
    const val = parseInt(span.textContent);
    if (zone.repeatable) {
      totalBets *= Math.pow(val, zone.count);
    } else {
      totalBets *= comb(val, zone.count);
    }
  });

  const price = config.price * totalBets;
  infoEl.innerHTML = `每注展开 <span class="highlight">${totalBets}</span> 注，单张金额 <span class="highlight">${formatMoney(price)}</span>`;
}

function getRandomMultipleCounts() {
  const counts = [];
  document.querySelectorAll('.random-multiple-count').forEach(span => {
    counts.push(parseInt(span.textContent));
  });
  return counts;
}

function runRandomMultiplePurchase(count) {
  const drawResult = simulationResults.length > 0 ? simulationResults[simulationResults.length - 1] : null;
  const config = getLotteryConfig(currentLottery);
  const multipleCounts = getRandomMultipleCounts();

  const tickets = [];
  for (let i = 0; i < count; i++) {
    const selectedNums = config.zones.map((zone, zi) => {
      const numCount = multipleCounts[zi];
      if (zone.repeatable) {
        return Array.from({ length: zone.count }, () => {
          const options = [];
          for (let j = 0; j < numCount; j++) {
            options.push(Math.floor(Math.random() * (zone.max - zone.min + 1)) + zone.min);
          }
          return options;
        });
      }
      const pool = [];
      for (let n = zone.min; n <= zone.max; n++) pool.push(n);
      for (let p = pool.length - 1; p > 0; p--) {
        const j = Math.floor(Math.random() * (p + 1));
        [pool[p], pool[j]] = [pool[j], pool[p]];
      }
      return pool.slice(0, numCount).sort((a, b) => a - b);
    });
    const expanded = generateMultipleTickets(currentLottery, selectedNums);
    
    // 每个号码重复betMultiplier次
    for (const t of expanded) {
      for (let j = 0; j < betMultiplier; j++) {
        tickets.push(t);
      }
    }
  }

  const results = analyzePurchaseResults(currentLottery, drawResult, tickets);
  lastPurchaseData = { drawResult, results, betMultiplier, addOnEnabled };
  lastPurchaseTickets = tickets;
  renderPurchaseResult(drawResult, results);
  runAnalysis();
}

function renderNumberPanel() {
  const config = getLotteryConfig(currentLottery);
  const panel = $('#number-panel');
  panel.innerHTML = '';
  selectedNumbers = config.zones.map(() => []);

  config.zones.forEach((zone, zi) => {
    const zoneDiv = document.createElement('div');
    zoneDiv.className = 'number-zone';

    const label = document.createElement('div');
    label.className = 'zone-label';
    const labelSpan = document.createElement('span');
    labelSpan.style.color = zone.color;
    labelSpan.textContent = zone.zoneName;
    label.appendChild(labelSpan);

    const info = document.createElement('span');
    info.className = 'zone-count-info';
    if (betType === 'multiple' && !zone.repeatable) {
      info.textContent = `(选${zone.count}-${zone.max - zone.min + 1}个)`;
    } else if (betType === 'multiple' && zone.repeatable) {
      info.textContent = `(每位选1-${zone.max - zone.min + 1}个)`;
    } else {
      info.textContent = `(选${zone.count}个)`;
    }
    label.appendChild(info);
    zoneDiv.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'number-grid';

    if (zone.repeatable && betType === 'single') {
      for (let pos = 0; pos < zone.count; pos++) {
        const posGroup = document.createElement('div');
        posGroup.style.cssText = 'margin-bottom:4px;';
        const posLabel = document.createElement('span');
        posLabel.style.cssText = 'font-size:11px;color:var(--text-muted);margin-right:6px;';
        posLabel.textContent = `第${pos + 1}位:`;
        posGroup.appendChild(posLabel);
        const posGrid = document.createElement('span');
        posGrid.className = 'number-grid';
        posGrid.style.display = 'inline-flex';
        for (let n = zone.min; n <= zone.max; n++) {
          const btn = document.createElement('button');
          btn.className = 'num-btn';
          btn.textContent = n;
          btn.dataset.zone = zi;
          btn.dataset.pos = pos;
          btn.dataset.num = n;
          btn.addEventListener('click', () => toggleRepeatableNumber(zi, pos, n, btn));
          posGrid.appendChild(btn);
        }
        posGroup.appendChild(posGrid);
        grid.appendChild(posGroup);
      }
    } else {
      for (let n = zone.min; n <= zone.max; n++) {
        const btn = document.createElement('button');
        btn.className = 'num-btn';
        btn.textContent = n;
        btn.dataset.zone = zi;
        btn.dataset.num = n;
        btn.addEventListener('click', () => toggleNumber(zi, n, btn));
        grid.appendChild(btn);
      }
    }

    zoneDiv.appendChild(grid);
    panel.appendChild(zoneDiv);
  });

  updateBetInfo();
}

function toggleNumber(zoneIdx, num, btn) {
  const config = getLotteryConfig(currentLottery);
  const zone = config.zones[zoneIdx];
  const idx = selectedNumbers[zoneIdx].indexOf(num);

  if (idx >= 0) {
    selectedNumbers[zoneIdx].splice(idx, 1);
    btn.classList.remove('selected');
  } else {
    const maxSelect = betType === 'multiple' ? (zone.max - zone.min + 1) : zone.count;
    if (selectedNumbers[zoneIdx].length >= maxSelect) return;
    selectedNumbers[zoneIdx].push(num);
    btn.classList.add('selected');
  }
  updateBetInfo();
}

function toggleRepeatableNumber(zoneIdx, pos, num, btn) {
  const zone = getLotteryConfig(currentLottery).zones[zoneIdx];
  if (!selectedNumbers[zoneIdx]) selectedNumbers[zoneIdx] = [];
  if (selectedNumbers[zoneIdx].length <= pos) {
    while (selectedNumbers[zoneIdx].length <= pos) selectedNumbers[zoneIdx].push([]);
  }
  const posArr = selectedNumbers[zoneIdx][pos];
  const idx = posArr.indexOf(num);
  if (idx >= 0) {
    posArr.splice(idx, 1);
    btn.classList.remove('selected');
  } else {
    if (posArr.length >= 1 && betType === 'single') return;
    posArr.push(num);
    btn.classList.add('selected');
  }
  updateBetInfo();
}

function randomFillNumbers() {
  const config = getLotteryConfig(currentLottery);
  const newSelections = config.zones.map(zone => {
    if (zone.repeatable) {
      if (betType === 'multiple') {
        return Array.from({ length: zone.count }, () => {
          const count = Math.floor(Math.random() * 3) + 1;
          const nums = [];
          for (let i = 0; i < count; i++) {
            let n;
            do { n = Math.floor(Math.random() * (zone.max - zone.min + 1)) + zone.min; }
            while (nums.includes(n));
            nums.push(n);
          }
          return nums;
        });
      }
      return Array.from({ length: zone.count }, () =>
        Math.floor(Math.random() * (zone.max - zone.min + 1)) + zone.min
      );
    }
    const pool = [];
    for (let i = zone.min; i <= zone.max; i++) pool.push(i);
    const extra = betType === 'multiple' ? Math.floor(Math.random() * Math.min(5, pool.length - zone.count)) + 1 : 0;
    const target = zone.count + extra;
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, target).sort((a, b) => a - b);
  });
  selectedNumbers = newSelections;
  renderNumberPanel();
  selectedNumbers = newSelections;
  const config2 = getLotteryConfig(currentLottery);
  selectedNumbers.forEach((zoneNums, zi) => {
    const zone = config2.zones[zi];
    if (zone.repeatable && Array.isArray(zoneNums[0])) {
      zoneNums.forEach((posNums, pos) => {
        posNums.forEach(n => {
          const btn = document.querySelector(`.num-btn[data-zone="${zi}"][data-pos="${pos}"][data-num="${n}"]`);
          if (btn) btn.classList.add('selected');
        });
      });
    } else {
      zoneNums.forEach(n => {
        const btn = document.querySelector(`.num-btn[data-zone="${zi}"][data-num="${n}"]`);
        if (btn) btn.classList.add('selected');
      });
    }
  });
  updateBetInfo();
}

function updateBetInfo() {
  const config = getLotteryConfig(currentLottery);
  const infoEl = $('#bet-info');
  if (!infoEl) return;

  let totalBets = 1;
  let valid = true;
  config.zones.forEach((zone, zi) => {
    const nums = selectedNumbers[zi] || [];
    if (zone.repeatable && Array.isArray(nums[0])) {
      const posCounts = nums.map(arr => arr.length);
      if (posCounts.some(c => c === 0)) valid = false;
      totalBets *= posCounts.reduce((a, b) => a * b, 1);
    } else {
      const minCount = zone.count;
      if (nums.length < minCount) valid = false;
      if (!zone.repeatable && betType === 'multiple') {
        totalBets *= comb(nums.length, zone.count);
      }
    }
  });

  const price = config.price * totalBets;
  infoEl.innerHTML = valid
    ? `共 <span class="highlight">${totalBets}</span> 注，金额 <span class="highlight">${formatMoney(price)}</span>`
    : `请选择号码`;
}

function comb(n, k) {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

function validateManualSelection() {
  const config = getLotteryConfig(currentLottery);
  for (let zi = 0; zi < config.zones.length; zi++) {
    const zone = config.zones[zi];
    const nums = selectedNumbers[zi] || [];
    if (zone.repeatable && Array.isArray(nums[0])) {
      if (nums.some(arr => arr.length === 0)) {
        console.error(`请在${zone.name}的每个位置至少选择1个号码`);
        return false;
      }
    } else {
      if (nums.length < zone.count) {
        console.error(`${zone.name}至少需要选择${zone.count}个号码，当前选了${nums.length}个`);
        return false;
      }
    }
  }
  return true;
}

function runManualSinglePurchase(count) {
  const drawResult = simulationResults.length > 0 ? simulationResults[simulationResults.length - 1] : null;
  const template = generateManualTicket(currentLottery, selectedNumbers);
  const tickets = [];
  
  // 生成count个相同的号码，每个号码重复betMultiplier次
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < betMultiplier; j++) {
      tickets.push(template);
    }
  }
  
  const results = analyzePurchaseResults(currentLottery, drawResult, tickets);
  lastPurchaseData = { drawResult, results, betMultiplier, addOnEnabled };
  lastPurchaseTickets = tickets;
  renderPurchaseResult(drawResult, results);
  runAnalysis();
}

function runManualMultiplePurchase(count) {
  const drawResult = simulationResults.length > 0 ? simulationResults[simulationResults.length - 1] : null;
  const templateTickets = generateMultipleTickets(currentLottery, selectedNumbers);
  const tickets = [];
  
  // 生成count组号码，每组中的每个号码重复betMultiplier次
  for (let i = 0; i < count; i++) {
    for (const t of templateTickets) {
      for (let j = 0; j < betMultiplier; j++) {
        tickets.push(t);
      }
    }
  }
  
  const results = analyzePurchaseResults(currentLottery, drawResult, tickets);
  lastPurchaseData = { drawResult, results, betMultiplier, addOnEnabled };
  lastPurchaseTickets = tickets;
  renderPurchaseResult(drawResult, results);
  runAnalysis();
}

function runPurchaseSimulation(count) {
  const drawResult = simulationResults.length > 0 ? simulationResults[simulationResults.length - 1] : null;
  const tickets = generatePurchasesWithMultiplier(currentLottery, count, betMultiplier);
  const results = analyzePurchaseResults(currentLottery, drawResult, tickets);
  lastPurchaseData = { drawResult, results, betMultiplier, addOnEnabled };
  lastPurchaseTickets = tickets;
  renderPurchaseResult(drawResult, results);
  runAnalysis();
}

function calculateTotalSales(ticketCount) {
  const config = getLotteryConfig(currentLottery);
  let pricePerTicket = config.price;
  
  // 如果启用追加投注，增加价格
  if (addOnEnabled && config.canAddOn) {
    pricePerTicket += config.addOnPrice;
  }
  
  // ticketCount已经是总注数（包括倍数），所以不需要再乘以betMultiplier
  return pricePerTicket * ticketCount;
}

function startLargePurchaseSimulation(count) {
  isPurchasing = true;
  const drawResult = simulationResults.length > 0 ? simulationResults[simulationResults.length - 1] : null;
  lastPurchaseCount = count;
  lastPurchaseTickets = null;
  $('#btn-purchase').textContent = '停止';
  $('#btn-purchase').classList.add('btn-danger');
  $('#purchase-progress-container').style.display = 'block';
  $('#purchase-progress-bar').style.width = '0%';
  $('#purchase-progress-text').textContent = '0%';

  const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  let cancelled = false;

  worker.onmessage = function (e) {
    const msg = e.data;
    if (msg.type === 'purchase-progress') {
      const pct = (msg.current / count * 100).toFixed(1);
      $('#purchase-progress-bar').style.width = pct + '%';
      $('#purchase-progress-text').textContent = `${pct}% (${msg.current.toLocaleString()}/${count.toLocaleString()})`;
    } else if (msg.type === 'purchase-complete') {
      worker.terminate();
      isPurchasing = false;
      $('#btn-purchase').textContent = '购买模拟';
      $('#btn-purchase').classList.remove('btn-danger');
      $('#purchase-progress-container').style.display = 'none';
      lastPurchaseData = { drawResult, results: msg.results, betMultiplier, addOnEnabled };
      renderPurchaseResult(drawResult, msg.results);
      runAnalysis();
    } else if (msg.type === 'cancelled') {
      worker.terminate();
    }
  };

  worker.postMessage({ type: 'purchase', lotteryId: currentLottery, count, multiplier: betMultiplier, drawResult });

  purchaseWorkerHandle = {
    cancel() {
      cancelled = true;
      worker.postMessage({ type: 'cancel' });
    }
  };
}

function stopPurchaseSimulation() {
  if (purchaseWorkerHandle) {
    purchaseWorkerHandle.cancel();
    purchaseWorkerHandle = null;
  }
  isPurchasing = false;
  $('#btn-purchase').textContent = '购买模拟';
  $('#btn-purchase').classList.remove('btn-danger');
  $('#purchase-progress-container').style.display = 'none';
}

function updatePurchaseWithNewDraw() {
  if (!lastPurchaseData) return;
  const drawResult = simulationResults.length > 0 ? simulationResults[simulationResults.length - 1] : null;
  if (!drawResult) return;

  if (lastPurchaseTickets) {
    const results = analyzePurchaseResults(currentLottery, drawResult, lastPurchaseTickets);
    lastPurchaseData = { drawResult, results };
    renderPurchaseResult(drawResult, results);
  } else if (lastPurchaseCount) {
    startLargePurchaseSimulation(lastPurchaseCount);
  }
}

function updateFinanceSummary(expense, income, rate, winCount) {
  const summary = $('#finance-summary');
  if (!summary) return;
  
  const expenseEl = summary.querySelector('.finance-value.expense');
  const incomeEl = summary.querySelector('.finance-value.income');
  const rateEl = summary.querySelector('.finance-value.rate');
  const countEl = summary.querySelector('.finance-value.count');
  const totalEl = summary.querySelector('.finance-value.total-value');
  
  const c = getCurrency();
  
  if (expenseEl) expenseEl.textContent = `${c}${expense.toLocaleString()}`;
  if (incomeEl) incomeEl.textContent = `${c}${income.toLocaleString()}`;
  if (rateEl) rateEl.textContent = `${rate}%`;
  if (countEl) countEl.textContent = winCount.toLocaleString();
  
  const net = income - expense;
  if (totalEl) {
    totalEl.textContent = `${net >= 0 ? '+' : ''}${c}${net.toLocaleString()}`;
    totalEl.style.color = net >= 0 ? '#22c55e' : '#ef4444';
  }
}

function clearFinanceSummary() {
  const summary = $('#finance-summary');
  if (!summary) return;
  
  const values = summary.querySelectorAll('.finance-value');
  values.forEach(el => {
    el.textContent = '-';
    el.style.color = '';
  });
}

function savePurchaseToHistory(drawResult, results) {
  const historyItem = {
    id: Date.now(),
    timestamp: new Date().toLocaleString(),
    lottery: currentLottery,
    drawResult: drawResult ? JSON.parse(JSON.stringify(drawResult)) : null,
    results: JSON.parse(JSON.stringify(results)),
    betMode: betMode,
    betType: betType,
    betMultiplier: betMultiplier,
    addOnEnabled: addOnEnabled,
    purchaseCount: lastPurchaseCount || results.totalTickets
  };
  
  let history = getCurrentHistory();
  
  if (currentHistoryIndex < history.length - 1) {
    history = history.slice(0, currentHistoryIndex + 1);
  }
  
  history.push(historyItem);
  
  if (history.length > MAX_PURCHASE_HISTORY) {
    history.shift();
  }
  
  setCurrentHistory(history);
  currentHistoryIndex = history.length - 1;
  updateHistoryNavButtons();
}

function loadPurchaseFromHistory(index) {
  const history = getCurrentHistory();
  if (index < 0 || index >= history.length) return;
  
  currentHistoryIndex = index;
  const item = history[index];
  
  betMode = item.betMode;
  betType = item.betType;
  betMultiplier = item.betMultiplier || 1;
  addOnEnabled = item.addOnEnabled || false;
  
  // 更新按钮状态
  updateButtonStates();
  
  renderPurchaseResult(item.drawResult, item.results, true);
  updateHistoryNavButtons();
}

function updateButtonStates() {
  // 更新倍数按钮状态
  $$('.multiplier-btn').forEach(btn => {
    const multiplier = parseInt(btn.dataset.multiplier) || 1;
    if (multiplier === betMultiplier) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // 更新追加按钮状态
  $$('.add-on-btn').forEach(btn => {
    const addon = parseInt(btn.dataset.addon) || 0;
    if ((addon === 1 && addOnEnabled) || (addon === 0 && !addOnEnabled)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function clearPurchaseHistory() {
  setCurrentHistory([]);
  currentHistoryIndex = -1;
  updateHistoryNavButtons();
  
  const section = $('#purchase-result-section');
  section.style.display = 'none';
  clearFinanceSummary();
}

function updateHistoryNavButtons() {
  const history = getCurrentHistory();
  const prevBtn = $('#history-prev-btn');
  const nextBtn = $('#history-next-btn');
  const clearBtn = $('#history-clear-btn');
  const historyInfo = $('#history-info');
  
  const purchasePrevBtn = $('#purchase-history-prev-btn');
  const purchaseNextBtn = $('#purchase-history-next-btn');
  const purchaseClearBtn = $('#purchase-history-clear-btn');
  const purchaseHistoryInfo = $('#purchase-history-info');
  
  const isDisabledPrev = currentHistoryIndex <= 0 || history.length === 0;
  const isDisabledNext = currentHistoryIndex >= history.length - 1 || history.length === 0;
  const isDisabledClear = history.length === 0;
  const infoText = history.length > 0 ? `记录 ${currentHistoryIndex + 1} / ${history.length}` : '暂无记录';
  
  if (prevBtn) prevBtn.disabled = isDisabledPrev;
  if (nextBtn) nextBtn.disabled = isDisabledNext;
  if (clearBtn) clearBtn.disabled = isDisabledClear;
  if (historyInfo) historyInfo.textContent = infoText;
  
  if (purchasePrevBtn) purchasePrevBtn.disabled = isDisabledPrev;
  if (purchaseNextBtn) purchaseNextBtn.disabled = isDisabledNext;
  if (purchaseClearBtn) purchaseClearBtn.disabled = isDisabledClear;
  if (purchaseHistoryInfo) purchaseHistoryInfo.textContent = infoText;
}

function renderPurchaseResult(drawResult, results, fromHistory = false) {
  if (!fromHistory) {
    savePurchaseToHistory(drawResult, results);
  }
  
  const section = $('#purchase-result-section');
  section.style.display = 'block';
  const container = $('#purchase-result-content');
  container.innerHTML = '';
  
  // 触发图表重新绘制以适应新布局
  requestAnimationFrame(() => {
    resizeAllCharts();
  });

  const config = getLotteryConfig(currentLottery);
  const totalTickets = results.totalTickets;
  const totalSales = calculateTotalSales(totalTickets);
  const hasDraw = !!drawResult;

  const drawDiv = document.createElement('div');
  drawDiv.className = 'purchase-draw-result';
  const label = document.createElement('span');
  label.className = 'purchase-draw-label';
  label.textContent = '本期开奖：';
  drawDiv.appendChild(label);

  if (hasDraw) {
    const displayZones = config.drawZones ? [...config.drawZones] : [...config.zones];
    const ballsDiv = document.createElement('div');
    ballsDiv.className = 'ball-zone';
    drawResult.forEach((zone, zi) => {
      if (zi > 0) {
        const sep = document.createElement('span');
        sep.className = 'bulletin-separator';
        sep.textContent = '|';
        ballsDiv.appendChild(sep);
      }
      const zoneConfig = displayZones[zi] || zone;
      zone.numbers.forEach(num => {
        const ball = document.createElement('span');
        ball.className = 'ball revealed';
        ball.style.background = `linear-gradient(135deg, ${zoneConfig.color}, ${zoneConfig.color}cc)`;
        ball.style.boxShadow = `0 2px 8px ${zoneConfig.color}66`;
        ball.style.width = '36px';
        ball.style.height = '36px';
        ball.style.fontSize = '13px';
        ball.textContent = num.toString().padStart(2, '0');
        ballsDiv.appendChild(ball);
      });
    });
    drawDiv.appendChild(ballsDiv);
  } else {
    const noDrawSpan = document.createElement('span');
    noDrawSpan.style.cssText = 'color:var(--text-muted);font-size:13px;';
    noDrawSpan.textContent = '尚未开奖（先购买，后开奖）';
    drawDiv.appendChild(noDrawSpan);
  }

  const totalSpan = document.createElement('span');
  totalSpan.style.cssText = 'margin-left:auto;font-size:12px;color:var(--text-secondary);';
  totalSpan.textContent = `售出: ${totalTickets.toLocaleString()}注`;
  drawDiv.appendChild(totalSpan);
  container.appendChild(drawDiv);

  const freqTitle = document.createElement('h3');
  freqTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--text-primary);margin:16px 0 10px;';
  freqTitle.textContent = '号码选中次数';
  container.appendChild(freqTitle);

  results.numberFrequency.forEach((zone, zi) => {
    const zoneLabel = document.createElement('div');
    zoneLabel.style.cssText = 'font-size:12px;color:var(--text-secondary);margin:8px 0 4px;font-weight:600;';
    zoneLabel.textContent = zone.zoneName;
    container.appendChild(zoneLabel);

    const maxC = Math.max(...zone.entries.map(e => e.count));
    const minC = Math.min(...zone.entries.map(e => e.count));
    const total = zone.entries.length;
    const maxPerRow = 20;
    const numRows = Math.ceil(total / maxPerRow);
    const base = Math.floor(total / numRows);
    const remainder = total % numRows;

    let offset = 0;
    for (let r = 0; r < numRows; r++) {
      const rowLen = base + (r < remainder ? 1 : 0);
      const freqList = document.createElement('div');
      freqList.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;';
      for (let i = 0; i < rowLen; i++) {
        const e = zone.entries[offset + i];
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:4px 6px;border-radius:6px;min-width:36px;';
        const heatRatio = maxC > minC ? (e.count - minC) / (maxC - minC) : 0.5;
        const bgColor = heatRatio > 0.7 ? 'rgba(231,76,60,0.15)'
          : heatRatio > 0.3 ? 'rgba(241,196,15,0.12)'
          : 'rgba(52,152,219,0.1)';
        item.style.background = bgColor;
        const numSpan = document.createElement('span');
        numSpan.style.cssText = `font-size:13px;font-weight:700;color:${zone.color};`;
        numSpan.textContent = e.number.toString().padStart(2, '0');
        const countSpan = document.createElement('span');
        countSpan.style.cssText = 'font-size:10px;color:var(--text-secondary);margin-top:2px;';
        countSpan.textContent = e.count.toLocaleString();
        item.appendChild(numSpan);
        item.appendChild(countSpan);
        freqList.appendChild(item);
      }
      offset += rowLen;
      container.appendChild(freqList);
    }
  });

  if (hasDraw) {
    const basePrizePool = totalSales * config.poolRatio;
    const prizePool = currentPrizePool > 0 ? currentPrizePool + basePrizePool : basePrizePool;

    const financeTitle = document.createElement('h3');
    financeTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--text-primary);margin:16px 0 10px;';
    financeTitle.textContent = '财务概览';
    container.appendChild(financeTitle);

    // 显示投注信息（倍数和追加）
    const betInfoDiv = document.createElement('div');
    betInfoDiv.style.cssText = 'display:flex;gap:12px;margin-bottom:12px;font-size:12px;color:var(--text-secondary);';
    
    const multiplierInfo = document.createElement('span');
    multiplierInfo.textContent = `投注倍数：${betMultiplier}倍`;
    if (betMultiplier > 1) {
      multiplierInfo.style.color = '#e74c3c';
      multiplierInfo.style.fontWeight = '600';
    }
    betInfoDiv.appendChild(multiplierInfo);
    
    if (config.canAddOn) {
      const addOnInfo = document.createElement('span');
      addOnInfo.textContent = `追加投注：${addOnEnabled ? '已启用 (+1元/注)' : '未启用'}`;
      if (addOnEnabled) {
        addOnInfo.style.color = '#27ae60';
        addOnInfo.style.fontWeight = '600';
      }
      betInfoDiv.appendChild(addOnInfo);
    }
    
    container.appendChild(betInfoDiv);

    let fixedPayout = 0;
    const prizeDetails = results.prizeStats.map(stat => {
      if (stat.level === 0) return stat;
      const prizeConfig = config.prizes.find(p => p.level === stat.level);
      let payout = 0;
      if (prizeConfig.fixed) {
        const amount = getFixedPrizeAmount(currentLottery, stat.level, currentPrizePool);
        payout = amount * stat.count;
        fixedPayout += payout;
      }
      return { ...stat, payout, prizeConfig };
    });

    const floatingPool = prizePool - fixedPayout;
    let floatingPayout = 0;
    
    // 使用分档算法计算浮动奖金
    const tieredPrizes = calculateTieredPrize(currentLottery, prizePool, fixedPayout, results.prizeStats, currentPrizePool, addOnEnabled);
    
    prizeDetails.forEach(stat => {
      if (stat.level === 0) return;
      if (!stat.prizeConfig.fixed && stat.count > 0) {
        stat.payout = tieredPrizes[stat.level] || 0;
        floatingPayout += stat.payout;
      }
    });

    const totalPayout = fixedPayout + floatingPayout;
    const netIncome = totalSales - totalPayout;
    const returnRate = totalSales > 0 ? (totalPayout / totalSales * 100).toFixed(2) : '0.00';
    
    const winCount = results.prizeStats.reduce((sum, stat) => sum + (stat.level > 0 ? stat.count : 0), 0);
    updateFinanceSummary(totalSales, totalPayout, returnRate, winCount);

    const financeGrid = document.createElement('div');
    financeGrid.className = 'prize-stats-grid';
    const c = getCurrency();
    const financeItems = [
      { label: '总销售额', value: `${c}${totalSales.toLocaleString()}`, color: 'var(--accent)' },
      { label: '基础奖池', value: `${c}${basePrizePool.toLocaleString()}`, color: 'var(--blue)' },
      { label: '追加奖池', value: currentPrizePool > 0 ? `${c}${currentPrizePool.toLocaleString()}` : '-', color: '#8b5cf6' },
      { label: '总奖池', value: `${c}${prizePool.toLocaleString()}`, color: '#06b6d4' },
      { label: '固定奖金支出', value: `${c}${fixedPayout.toLocaleString()}`, color: '#e67e22' },
      { label: '浮动奖金支出', value: `${c}${floatingPayout.toLocaleString()}`, color: '#e74c3c' },
      { label: '总奖金支出', value: `${c}${totalPayout.toLocaleString()}`, color: '#e74c3c' },
      { label: '发行方净收益', value: `${c}${netIncome.toLocaleString()}`, color: netIncome >= 0 ? '#2ecc71' : '#e74c3c' },
      { label: '返奖率', value: `${returnRate}%`, color: 'var(--text-primary)' },
      { label: '发行费率', value: `${((1 - config.poolRatio) * 100).toFixed(0)}%`, color: 'var(--text-secondary)' }
    ];
    financeItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'prize-stat-card';
      const name = document.createElement('span');
      name.className = 'prize-level-name';
      name.textContent = item.label;
      const val = document.createElement('span');
      val.className = 'prize-level-count';
      val.style.color = item.color;
      val.style.fontSize = '15px';
      val.textContent = item.value;
      card.appendChild(name);
      card.appendChild(val);
      financeGrid.appendChild(card);
    });
    container.appendChild(financeGrid);

    const prizeTitle = document.createElement('h3');
    prizeTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--text-primary);margin:16px 0 10px;';
    prizeTitle.textContent = '中奖明细';
    container.appendChild(prizeTitle);

    const prizeTable = document.createElement('div');
    prizeTable.className = 'data-table-wrapper prize-table';
    let tableHtml = `<table class="data-table"><thead><tr><th>奖级</th><th>中奖注数</th><th>占比</th><th>单注奖金</th><th>本级总奖金</th></tr></thead><tbody>`;
    prizeDetails.forEach(stat => {
      if (stat.level === 0) {
        tableHtml += `<tr><td>${stat.name}</td><td>${stat.count.toLocaleString()}</td><td>${stat.percentage}%</td><td>-</td><td>-</td></tr>`;
        return;
      }
      const unitPrize = stat.prizeConfig.fixed
        ? `${c}${getFixedPrizeAmount(currentLottery, stat.level, currentPrizePool).toLocaleString()}`
        : (stat.count > 0 ? `${c}${Math.floor(stat.payout / stat.count).toLocaleString()}` : '—');
      const payoutStr = stat.payout > 0 ? `${c}${stat.payout.toLocaleString()}` : '—';
      tableHtml += `<tr><td>${stat.name}</td><td>${stat.count.toLocaleString()}</td><td>${stat.percentage}%</td><td>${unitPrize}</td><td>${payoutStr}</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    prizeTable.innerHTML = tableHtml;
    container.appendChild(prizeTable);

    const riskTitle = document.createElement('h3');
    riskTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--text-primary);margin:16px 0 10px;';
    riskTitle.textContent = '号码热度与赔付风险';
    container.appendChild(riskTitle);

    const riskDesc = document.createElement('p');
    riskDesc.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:10px;';
    riskDesc.textContent = '热门号码被更多买家选中，若开奖命中则赔付更高。红色=高风险（热门），蓝色=低风险（冷门）';
    container.appendChild(riskDesc);
  } else {
    const salesTitle = document.createElement('h3');
    salesTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--text-primary);margin:16px 0 10px;';
    salesTitle.textContent = '销售概览';
    container.appendChild(salesTitle);

    const salesGrid = document.createElement('div');
    salesGrid.className = 'prize-stats-grid';
    const sc = getCurrency();
    // 计算购买注数（不包括倍数）
    const purchaseCount = betMultiplier > 1 ? Math.floor(totalTickets / betMultiplier) : totalTickets;
    
    const salesItems = [
      { label: '总销售额', value: `${sc}${totalSales.toLocaleString()}`, color: 'var(--accent)' },
      { label: '购买注数', value: `${purchaseCount.toLocaleString()}注`, color: 'var(--blue)' },
      { label: '总注数', value: `${totalTickets.toLocaleString()}注`, color: betMultiplier > 1 ? '#e74c3c' : 'var(--blue)' },
      { label: '单注价格', value: `${sc}${config.price}${addOnEnabled && config.canAddOn ? ' (+1元追加)' : ''}`, color: 'var(--text-primary)' }
    ];
    salesItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'prize-stat-card';
      const name = document.createElement('span');
      name.className = 'prize-level-name';
      name.textContent = item.label;
      const val = document.createElement('span');
      val.className = 'prize-level-count';
      val.style.color = item.color;
      val.style.fontSize = '15px';
      val.textContent = item.value;
      card.appendChild(name);
      card.appendChild(val);
      salesGrid.appendChild(card);
    });
    container.appendChild(salesGrid);

    const heatTitle = document.createElement('h3');
    heatTitle.style.cssText = 'font-size:14px;font-weight:600;color:var(--text-primary);margin:16px 0 10px;';
    heatTitle.textContent = '号码热度';
    container.appendChild(heatTitle);
  }

  results.numberFrequency.forEach((zone, zi) => {
    const zoneSection = document.createElement('div');
    zoneSection.className = 'analysis-section';

    let drawNumSet = new Set();
    if (hasDraw) {
      if (currentLottery === 'kl8') {
        drawNumSet = new Set(drawResult[0].numbers);
      } else if (currentLottery === 'uklotto' || currentLottery === 'qlc') {
        drawNumSet = new Set(drawResult[0].numbers);
        drawNumSet.add(drawResult[1].numbers[0]);
      } else {
        drawNumSet = new Set(drawResult[zi].numbers);
      }
    }

    const canvas = document.createElement('canvas');
    zoneSection.appendChild(canvas);

    const maxCount = Math.max(...zone.entries.map(e => e.count));
    const minCount = Math.min(...zone.entries.map(e => e.count));

    const total = zone.entries.length;
    const maxPerRow = 20;
    const numRows = Math.ceil(total / maxPerRow);
    const base = Math.floor(total / numRows);
    const remainder = total % numRows;

    let offset = 0;
    for (let tr = 0; tr < numRows; tr++) {
      const rowLen = base + (tr < remainder ? 1 : 0);
      const riskTable = document.createElement('div');
      riskTable.className = 'data-table-wrapper';
      riskTable.style.overflowX = 'auto';
      const slice = zone.entries.slice(offset, offset + rowLen);

      let rHtml = `<table class="data-table heat-table"><thead><tr><th class="heat-row-label">指标</th>`;
      slice.forEach(e => { rHtml += `<th>${e.number}</th>`; });
      rHtml += '</tr></thead><tbody>';
      rHtml += '<tr><td class="heat-row-label">被选次数</td>';
      slice.forEach(e => { rHtml += `<td>${e.count.toLocaleString()}</td>`; });
      rHtml += '</tr><tr><td class="heat-row-label">选号占比</td>';
      slice.forEach(e => { rHtml += `<td>${e.percentage}%</td>`; });
      rHtml += '</tr>';

      if (hasDraw) {
        rHtml += '<tr><td class="heat-row-label">开奖命中</td>';
        slice.forEach(e => {
          const isHit = drawNumSet.has(e.number);
          rHtml += `<td>${isHit ? '⭐' : '-'}</td>`;
        });
        rHtml += '</tr><tr><td class="heat-row-label">风险等级</td>';
        slice.forEach(e => {
          const isHit = drawNumSet.has(e.number);
          const heatRatio = maxCount > minCount ? (e.count - minCount) / (maxCount - minCount) : 0.5;
          let riskLabel, riskColor;
          if (isHit) {
            if (heatRatio > 0.7) { riskLabel = '极高'; riskColor = '#e74c3c'; }
            else if (heatRatio > 0.3) { riskLabel = '高'; riskColor = '#e67e22'; }
            else { riskLabel = '中'; riskColor = '#f1c40f'; }
          } else {
            riskLabel = '无'; riskColor = 'var(--text-muted)';
          }
          rHtml += `<td style="color:${riskColor}">${riskLabel}</td>`;
        });
        rHtml += '</tr>';
      }

      rHtml += '</tbody></table>';
      riskTable.innerHTML = rHtml;
      zoneSection.appendChild(riskTable);
      offset += rowLen;
    }

    container.appendChild(zoneSection);

    requestAnimationFrame(() => {
      const avgCount = zone.entries.reduce((s, e) => s + e.count, 0) / zone.entries.length;
      drawBarChart(canvas, zone.entries.map(e => ({ label: e.number.toString(), value: e.count })), {
        color: zone.color,
        title: `${zone.zoneName} - 买家选号热度`,
        referenceLine: avgCount,
        deviationColors: true
      });
    });
  });
}

function exportCSV() {
  if (simulationResults.length === 0) return;
  const config = getLotteryConfig(currentLottery);

  let headers = ['期号'];
  const csvZones = config.drawZones ? [...config.drawZones] : [...config.zones];
  csvZones.forEach(z => {
    for (let i = 0; i < z.count; i++) {
      headers.push(`${z.name}${i + 1}`);
    }
  });
  headers.push('和值', '奇偶比');

  let rows = [headers.join(',')];
  simulationResults.forEach((r, idx) => {
    let row = [idx + 1];
    const allNums = [];
    r.forEach(z => {
      z.numbers.forEach(n => {
        row.push(n);
        allNums.push(n);
      });
    });
    const sum = allNums.reduce((a, b) => a + b, 0);
    const odd = allNums.filter(n => n % 2 !== 0).length;
    const even = allNums.length - odd;
    row.push(sum, `${odd}:${even}`);
    rows.push(row.join(','));
  });

  const csv = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.name}_模拟结果.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
