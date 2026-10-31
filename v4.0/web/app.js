"use strict";

const state = {
  lottery: "ssq",
  dashboard: null,
  result: null,
  backtest: null,
  portfolio: [],
  wagerTypes: [],
  wagerPresets: [],
  strategy: "combined",
  strategies: [],
  history: [],
  activeRecommendation: 0,
  loading: false,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const PRIZE_NAMES = {
  ssq: ["一等奖", "二等奖", "三等奖", "四等奖", "五等奖", "六等奖"],
  dlt: ["一等奖", "二等奖", "三等奖", "四等奖", "五等奖", "六等奖", "七等奖", "八等奖", "九等奖"],
};

const PRIZE_RULES = {
  ssq: ["6 + 1", "6 + 0", "5 + 1", "5 + 0 / 4 + 1", "4 + 0 / 3 + 1", "蓝球 / 2 + 1 / 1 + 1"],
  dlt: ["5 + 2", "5 + 1", "5 + 0", "4 + 2", "4 + 1", "3 + 2", "4 + 0", "3 + 1 / 2 + 2", "3 + 0 / 2 + 1 / 1 + 2 / 0 + 2"],
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  syncRangeVisuals();
  loadLottery("ssq");
});

function bindEvents() {
  $$('input[name="lottery"]').forEach((input) => {
    input.addEventListener("change", () => loadLottery(input.value));
  });
  $("#run-simulation").addEventListener("click", runSimulation);
  $("#new-seed").addEventListener("click", () => {
    $("#seed").value = String(Math.floor(10000000 + Math.random() * 89999999));
  });
  $("#refresh-data").addEventListener("click", refreshData);
  $("#run-backtest").addEventListener("click", runBacktest);
  $("#portfolio-slots").addEventListener("change", (event) => {
    const select = event.target.closest("select[data-slot]");
    if (!select) return;
    state.portfolio[Number(select.dataset.slot)] = select.value;
    renderPortfolio();
  });
  $("#portfolio-slots").addEventListener("click", (event) => {
    const button = event.target.closest(".portfolio-remove");
    if (!button) return;
    state.portfolio.splice(Number(button.dataset.slot), 1);
    renderPortfolio();
  });
  $("#portfolio-presets").addEventListener("click", (event) => {
    const button = event.target.closest(".portfolio-preset");
    if (!button) return;
    const preset = state.wagerPresets.find((item) => item.id === button.dataset.preset);
    if (!preset) return;
    state.portfolio = [...preset.types];
    renderPortfolio();
  });
  $("#add-portfolio-slot").addEventListener("click", () => {
    if (state.portfolio.length >= 10) {
      showToast("一次回测最多组合 10 组预测");
      return;
    }
    state.portfolio.push($("#portfolio-add-type").value);
    renderPortfolio();
  });
  $("#reset-portfolio").addEventListener("click", () => {
    const single = state.wagerTypes.find((item) => item.is_single);
    if (!single) return;
    state.portfolio = Array(5).fill(single.id);
    renderPortfolio();
  });
  $("#strategy-select").addEventListener("change", (event) => {
    state.strategy = event.target.value;
    updateStrategyDescription();
  });
  $("#recommendation-list").addEventListener("click", (event) => {
    const row = event.target.closest(".recommendation-row");
    if (!row) return;
    activateRecommendation(Number(row.dataset.index));
  });
  $$(".range").forEach((input) => {
    input.addEventListener("input", () => {
      syncRangeVisuals();
      updateRangeOutputs();
    });
  });
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `请求失败 (${response.status})`);
  }
  return payload;
}

async function loadLottery(lottery) {
  state.lottery = lottery;
  state.result = null;
  state.backtest = null;
  state.activeRecommendation = 0;
  clearResultDisplay();
  clearBacktestDisplay();
  setRunState("loading", "读取数据");
  try {
    const [dashboard, history] = await Promise.all([
      api(`/api/dashboard?lottery=${lottery}`),
      api(`/api/history?lottery=${lottery}&page=1&page_size=40`),
    ]);
    state.dashboard = dashboard;
    state.history = history.records;
    initializeStrategies(dashboard.strategies);
    hydrateProfile(dashboard);
    initializePortfolio(dashboard.wager_options);
    renderHistory();
    renderWinnerChart();
    setRunState("idle", "待运行");
    $("#server-light").textContent = "本地";
    $("#export-data").href = `/api/export?lottery=${lottery}`;
  } catch (error) {
    showToast(error.message);
    setRunState("idle", "数据异常");
    $("#server-light").textContent = "离线";
  }
}

function hydrateProfile(dashboard) {
  const profile = dashboard.profile;
  if (!profile.ready) {
    $("#data-count").textContent = "0 期";
    $("#board-headline").textContent = "先刷新真实开奖数据";
    $("#data-latest").textContent = "无数据";
    return;
  }
  $("#data-count").textContent = `${formatInteger(profile.count)} 期`;
  $("#data-latest").textContent = `${profile.latest.draw_no} · ${profile.latest.date}`;
  $("#median-winners").textContent = `${profile.payout_history.top_winner_median} 注`;
  $("#data-source").textContent = profile.source.name;
  $("#source-line").textContent = `${profile.source.name} · ${profile.source.first_date} 至 ${profile.source.last_date}`;
  $("#footer-source").textContent = `数据覆盖 ${profile.source.first_date} 至 ${profile.source.last_date}，共 ${profile.count} 期。`;
  $("#latest-balls").innerHTML = numberBalls(profile.latest.numbers);
  $("#shape-sum").textContent = profile.shape.sum_median;
  $("#shape-range").textContent = `${profile.shape.sum_p10}–${profile.shape.sum_p90}`;
  $("#shape-span").textContent = profile.shape.main_span_median;
  $("#shape-window").textContent = `近 ${profile.window} 期`;
  $("#shape-source").textContent = `${profile.count} 期`;

  const salesMedian = profile.payout_history.sales_median;
  const entriesMillions = Math.max(10, Math.round(salesMedian / dashboard.rules.price / 1_000_000));
  const entriesRange = $("#entries-million");
  entriesRange.max = String(Math.max(300, Math.ceil(entriesMillions * 1.65)));
  entriesRange.value = String(entriesMillions);
  $("#target-min").value = profile.target_defaults.min;
  $("#target-max").value = profile.target_defaults.max;
  updateRangeOutputs();
  syncRangeVisuals();
  renderFrequencyHeat(dashboard.profile.frequency[dashboard.rules.zones[0].name]);
  $("#freq-zone-label").textContent = dashboard.rules.zones[0].name;
  $("#board-headline").textContent = `寻找 ${profile.target_defaults.min}–${profile.target_defaults.max} 注一等奖的下一组号码`;
  $("#board-note").textContent = "已载入真实历史与合成投注人群。搜索只检验操控假设下的可满足性，不代表真实开奖预测。";
  $("#constraint-max").textContent = `${Math.max(20, profile.target_defaults.max + 8)}+`;
  updateConstraintBand();
}

function initializeStrategies(strategies = []) {
  state.strategies = strategies;
  if (strategies.length && !strategies.some((item) => item.id === state.strategy)) {
    state.strategy = strategies[0].id;
  }
  $("#strategy-select").innerHTML = strategies
    .map(
      (strategy) => `
        <option value="${escapeHTML(strategy.id)}" ${strategy.id === state.strategy ? "selected" : ""}>
          ${escapeHTML(strategy.name)}
        </option>`
    )
    .join("");
  updateStrategyDescription();
}

function updateStrategyDescription() {
  const strategy = state.strategies.find((item) => item.id === state.strategy);
  $("#strategy-description").textContent =
    strategy?.short || "返奖控制、反热门、双层稳健与走势状态联合排序。";
}

function updateRangeOutputs() {
  const entries = Number($("#entries-million").value);
  $("#entries-output").textContent = `${entries.toFixed(1)} 百万注`;
  $("#history-output").textContent = `${$("#history-influence").value}%`;
  $("#birthday-output").textContent = `${$("#birthday-influence").value}%`;
  $("#lucky-output").textContent = `${$("#lucky-influence").value}%`;
  $("#target-return-output").textContent = `${$("#target-return").value}%`;
}

function initializePortfolio(options = {}) {
  state.wagerTypes = options.types || [];
  state.wagerPresets = options.presets || [];
  const single = state.wagerTypes.find((item) => item.is_single);
  state.portfolio = single ? Array(5).fill(single.id) : [];
  $("#portfolio-presets").innerHTML = state.wagerPresets
    .map(
      (preset) => `
        <button class="portfolio-preset" data-preset="${escapeHTML(preset.id)}" type="button" title="${formatInteger(preset.cost_per_issue)} 元/期">
          ${escapeHTML(preset.name)} · ¥${formatInteger(preset.cost_per_issue)}
        </button>`
    )
    .join("");
  renderPortfolioAddSelect(single?.id);
  renderPortfolio();
}

function renderPortfolioAddSelect(selectedId) {
  $("#portfolio-add-type").innerHTML = state.wagerTypes
    .map(
      (type) => `
        <option value="${escapeHTML(type.id)}" ${type.id === selectedId ? "selected" : ""}>
          ${escapeHTML(type.name)} · ${type.bet_count} 注 · ¥${type.cost}/组
        </option>`
    )
    .join("");
}

function renderPortfolio() {
  const typeMap = new Map(state.wagerTypes.map((item) => [item.id, item]));
  $("#portfolio-slots").innerHTML = state.portfolio
    .map((typeId, index) => {
      const selected = typeMap.get(typeId) || state.wagerTypes[0];
      return `
        <div class="portfolio-slot">
          <span class="portfolio-slot-rank">${String(index + 1).padStart(2, "0")}</span>
          <select data-slot="${index}" aria-label="第 ${index + 1} 组预测类型">
            ${state.wagerTypes.map((type) => `
              <option value="${escapeHTML(type.id)}" ${type.id === selected?.id ? "selected" : ""}>
                ${escapeHTML(type.name)} · ${type.bet_count} 注
              </option>`).join("")}
          </select>
          <span class="portfolio-slot-cost">¥${formatInteger(selected?.cost || 0)}</span>
          <span class="portfolio-slot-bets">${formatInteger(selected?.bet_count || 0)} 注</span>
          <button class="portfolio-remove" data-slot="${index}" type="button" title="移除这一组" ${state.portfolio.length <= 1 ? "disabled" : ""}>×</button>
        </div>`;
    })
    .join("");
  const resolved = state.portfolio.map((typeId) => typeMap.get(typeId)).filter(Boolean);
  const cost = resolved.reduce((total, type) => total + type.cost, 0);
  const bets = resolved.reduce((total, type) => total + type.bet_count, 0);
  $("#portfolio-cost").textContent = `¥${formatInteger(cost)}`;
  $("#portfolio-bets").textContent = `${formatInteger(bets)} 注 · ${state.portfolio.length} 组预测`;
}

function syncRangeVisuals() {
  $$(".range").forEach((input) => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const current = Number(input.value);
    const progress = max > min ? ((current - min) / (max - min)) * 100 : 0;
    input.style.setProperty("--progress", `${progress}%`);
  });
}

function renderFrequencyHeat(frequency) {
  const entries = Array.isArray(frequency) ? frequency : Object.entries(frequency || {}).map(([n, v]) => [Number(n), v]);
  if (!entries.length) {
    $("#frequency-heat").innerHTML = "";
    return;
  }
  const values = entries.map((entry) => Number(entry[1]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sorted = [...entries].sort((a, b) => b[1] - a[1]).slice(0, Math.ceil(entries.length / 4));
  const hotSet = new Set(sorted.map((entry) => Number(entry[0])));
  $("#frequency-heat").innerHTML = entries.map(([number, value]) => {
    const ratio = max === min ? 0.5 : (Number(value) - min) / (max - min);
    const mix = Math.round(243 - ratio * 55);
    const color = `rgb(${mix}, ${Math.round(241 - ratio * 148)}, ${Math.round(236 - ratio * 164)})`;
    return `<div class="heat-cell ${ratio > .72 ? "hot" : ""}" style="--heat:${color}" title="历史出现 ${value} 次">${String(number).padStart(2, "0")}</div>`;
  }).join("");
}

function renderWinnerChart() {
  const values = state.history.slice(0, 40).reverse().map((record) => Number(record.prize_counts?.["1"] || 0));
  const max = Math.max(1, ...values);
  const nonZero = values.filter((value) => value > 0).sort((a, b) => a - b);
  const p90 = nonZero.length ? nonZero[Math.min(nonZero.length - 1, Math.floor(nonZero.length * .9))] : max;
  $("#winner-chart").innerHTML = values.map((value) => {
    const height = Math.max(2, (value / max) * 138);
    return `<div class="winner-bar ${value > p90 ? "outlier" : ""}" style="--height:${height}px" data-value="${value}"></div>`;
  }).join("");
}

function renderHistory() {
  if (!state.history.length) {
    $("#history-body").innerHTML = '<tr><td colspan="5">暂无真实开奖记录</td></tr>';
    return;
  }
  $("#history-body").innerHTML = state.history.slice(0, 12).map((record) => `
    <tr>
      <td>${escapeHTML(record.draw_no)}</td>
      <td>${escapeHTML(record.date)}</td>
      <td><div class="ball-row history-numbers">${numberBalls(record.numbers, true)}</div></td>
      <td>${formatInteger(record.prize_counts?.["1"] || 0)} 注</td>
      <td>${formatMoney(record.sales || 0)}</td>
    </tr>
  `).join("");
}

async function runSimulation() {
  if (state.loading) return;
  if (!state.dashboard?.profile?.ready) {
    showToast("请先刷新真实开奖数据");
    return;
  }
  const targetMin = Number($("#target-min").value);
  const targetMax = Number($("#target-max").value);
  if (!Number.isFinite(targetMin) || !Number.isFinite(targetMax) || targetMin < 0 || targetMax < targetMin) {
    showToast("目标区间应为非负整数，且上限不小于下限");
    return;
  }

  state.loading = true;
  $("#run-simulation").disabled = true;
  setRunState("running", "逆向搜索中");
  $("#board-headline").textContent = "正在筛选满足返奖约束的开奖组合";
  const started = performance.now();
  try {
    const result = await api("/api/recommend", {
      method: "POST",
      body: JSON.stringify({
        lottery: state.lottery,
        target_min: targetMin,
        target_max: targetMax,
        actual_entries: Math.round(Number($("#entries-million").value) * 1_000_000),
        candidate_pool: Number($("#candidate-pool").value),
        ticket_sample: Number($("#ticket-sample").value),
        history_influence: Number($("#history-influence").value) / 100,
        birthday_influence: Number($("#birthday-influence").value) / 100,
        lucky_influence: Number($("#lucky-influence").value) / 100,
        seed: Number($("#seed").value) || 20261031,
        strategy: state.strategy,
        target_return: Number($("#target-return").value) / 100,
      }),
    });
    state.result = result;
    state.activeRecommendation = 0;
    renderResult();
    const elapsed = ((performance.now() - started) / 1000).toFixed(1);
    setRunState("done", `完成 · ${elapsed}s`);
  } catch (error) {
    showToast(error.message);
    setRunState("idle", "运行失败");
    $("#board-headline").textContent = "搜索未完成";
  } finally {
    state.loading = false;
    $("#run-simulation").disabled = false;
  }
}

function renderResult() {
  const result = state.result;
  if (!result?.recommendations?.length) {
    showToast("当前参数没有生成候选组合");
    return;
  }
  const primary = result.recommendations[0];
  const range = `${result.target.min}–${result.target.max}`;
  $("#board-headline").textContent = `${primary.expected_first_winners.toFixed(1)} 注头奖的候选组合`;
  $("#board-note").textContent =
    `在 ${formatInteger(result.assumptions.actual_entries)} 注合成投注、${formatInteger(result.assumptions.candidate_pool)} 组候选中找到 ` +
    `${formatInteger(result.target.feasible_candidates)} 组满足 ${range} 注约束。当前策略：${result.strategy.name}；` +
    `目标返奖率 ${(result.assumptions.target_return * 100).toFixed(0)}%。候选排序表示对假设的拟合度。`;
  renderFrequencyHeatFromWeights(result);
  renderRecommendations();
  updateConstraintBand();
}

function renderRecommendations() {
  const result = state.result;
  const rules = state.dashboard.rules.zones;
  $("#recommendation-list").innerHTML = result.recommendations.map((item, index) => `
    <button class="recommendation-row ${index === state.activeRecommendation ? "active" : ""}" data-index="${index}" type="button">
      <span class="rank-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="candidate-numbers">${numberBalls(item.numbers, false, rules)}</span>
      <span class="candidate-metric">
        <small>预期一等奖</small>
        <strong>${item.expected_first_winners.toFixed(2)} 注</strong>
      </span>
      <span class="candidate-metric secondary-metric">
        <small>策略得分</small>
        <strong>${item.model_score.toFixed(1)}</strong>
      </span>
      <span class="fit-meter" style="--score:${item.model_score}%">
        <span>${item.within_target ? "区间内" : "最近解"}</span>
        <i></i>
      </span>
    </button>
  `).join("");
  renderPrimaryDossier();
}

function activateRecommendation(index) {
  state.activeRecommendation = index;
  $$(".recommendation-row").forEach((row) => row.classList.toggle("active", Number(row.dataset.index) === index));
  renderPrimaryDossier();
}

function renderPrimaryDossier() {
  const item = state.result?.recommendations?.[state.activeRecommendation];
  if (!item) return;
  const rules = state.dashboard.rules.zones;
  const counts = item.prize_counts;
  const levels = PRIZE_NAMES[state.lottery];
  const maxCount = Math.max(1, ...levels.map((_, index) => Number(counts[String(index + 1)] || 0)));
  $("#primary-content").innerHTML = `
    <div class="dossier-code">
      <div class="candidate-numbers">${numberBalls(item.numbers, false, rules)}</div>
    </div>
    <dl class="dossier-stats">
      <div><dt>预期一等奖</dt><dd>${item.expected_first_winners.toFixed(2)}</dd></div>
      <div><dt>预期总中奖</dt><dd>${compactNumber(item.expected_total_winners)}</dd></div>
      <div><dt>预期返奖</dt><dd>${compactMoney(item.expected_payout)}</dd></div>
      <div><dt>销量消耗比</dt><dd>${(item.payout_ratio * 100).toFixed(1)}%</dd></div>
    </dl>
    <div class="strategy-breakdown">
      <h4>策略拆解</h4>
      ${strategyDriverBars(item.drivers)}
      <div class="strategy-note">
        多场景头奖：${item.robust_jackpot_range[0].toFixed(1)}–${item.robust_jackpot_range[1].toFixed(1)} 注
        · 走势状态：${escapeHTML(item.state)}
      </div>
    </div>
    <div class="prize-mini">
      <h4>完整奖级预估</h4>
      <div class="prize-bars">
        ${levels.map((level, index) => {
          const value = Number(counts[String(index + 1)] || 0);
          const width = 4 + Math.log1p(value) / Math.log1p(maxCount) * 96;
          return `<div class="prize-bar">
            <span>${level}</span><i style="--width:${width}%"></i><em>${compactNumber(value)}</em>
          </div>`;
        }).join("")}
      </div>
    </div>
  `;
}

async function runBacktest() {
  if (!state.dashboard?.profile?.ready) {
    showToast("请先载入真实开奖数据");
    return;
  }
  const button = $("#run-backtest");
  button.disabled = true;
  button.textContent = "正在逐期回测…";
  $("#backtest-empty").hidden = false;
  $("#backtest-empty").querySelector("p").textContent = "正在执行无穿越回测";
  $("#backtest-empty").querySelector("small").textContent =
    `每期都会重新使用此前数据生成 ${state.portfolio.length} 组候选，并同时计算中性参数对照组。`;
  $("#backtest-results").hidden = true;
  try {
    const payload = await api("/api/backtest", {
      method: "POST",
      body: JSON.stringify({
        lottery: state.lottery,
        test_count: Number($("#backtest-count").value),
        candidate_pool: Number($("#backtest-pool").value),
        target_min: Number($("#target-min").value),
        target_max: Number($("#target-max").value),
        history_influence: Number($("#history-influence").value) / 100,
        birthday_influence: Number($("#birthday-influence").value) / 100,
        lucky_influence: Number($("#lucky-influence").value) / 100,
        seed: Number($("#seed").value) || 20261031,
        compare_neutral: true,
        portfolio: [...state.portfolio],
        strategy: state.strategy,
        target_return: Number($("#target-return").value) / 100,
      }),
    });
    state.backtest = payload;
    renderBacktest(payload);
  } catch (error) {
    $("#backtest-empty").querySelector("p").textContent = "回测未完成";
    $("#backtest-empty").querySelector("small").textContent = error.message;
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "运行无穿越回测";
  }
}

function renderBacktest(data) {
  $("#backtest-empty").hidden = true;
  $("#backtest-results").hidden = false;
  const metrics = data.metrics;
  const comparison = data.comparison;
  $("#backtest-metrics").innerHTML = `
    <div class="backtest-metric">
      <span>回测期至少一注中奖</span>
      <strong>${(metrics.issue_any_win_rate * 100).toFixed(1)}%</strong>
      <small>${metrics.issues_with_any_win} / ${metrics.tested_issues} 期 · 95%CI ${formatCi(metrics.issue_any_win_ci95)}</small>
    </div>
    <div class="backtest-metric">
      <span>预测注单中奖率</span>
      <strong>${(metrics.candidate_any_win_rate * 100).toFixed(2)}%</strong>
      <small>${metrics.winning_candidates} / ${metrics.candidate_tickets} 张 · 95%CI ${formatCi(metrics.candidate_any_win_ci95)}</small>
    </div>
    <div class="backtest-metric">
      <span>历史一等 / 二等</span>
      <strong>${metrics.jackpot_hits} / ${metrics.second_prize_hits}</strong>
      <small>回测期内的实际命中注数</small>
    </div>
    <div class="backtest-metric">
      <span>投入回报率</span>
      <strong>${(metrics.return_rate * 100).toFixed(1)}%</strong>
      <small>${compactMoney(metrics.total_payout)} / ${compactMoney(metrics.total_cost)}</small>
    </div>
  `;

  const issueDelta = comparison ? comparison.issue_any_win_rate_delta * 100 : 0;
  const candidateDelta = comparison ? comparison.candidate_any_win_rate_delta * 100 : 0;
  const randomProbability = metrics.single_ticket_random_any_prize_probability;
  const randomOneIn = randomProbability > 0 ? 1 / randomProbability : 0;
  $("#comparison-strip").innerHTML = `
    <span>回测策略：<strong>${escapeHTML(data.strategy.name)}</strong></span>
    <span>对比中性参数：
      <strong class="${issueDelta >= 0 ? "profit-positive" : "profit-negative"}">${signed(issueDelta)} 个百分点</strong> 期命中率
    </span>
    <span>候选票命中率：
      <strong class="${candidateDelta >= 0 ? "profit-positive" : "profit-negative"}">${signed(candidateDelta)} 个百分点</strong>
    </span>
    <span>单注任意奖理论值：<strong>${formatRatio(randomOneIn)}</strong>（${(randomProbability * 100).toFixed(2)}%）</span>
    <span>展开后共 <strong>${formatInteger(metrics.wager_bets)} 注</strong>，随机期望中奖 <strong>${metrics.expected_winning_candidates_random.toFixed(1)} 注</strong></span>
    <span>实际中奖投注：<strong>${formatInteger(metrics.winning_wager_bets)} 注</strong></span>
    <span>短窗口差值不构成真实概率优势</span>
  `;

  const rules = state.dashboard.rules.zones;
  const rows = [...data.rows].reverse();
  $("#backtest-body").innerHTML = rows.map((row) => {
    const profitClass = row.profit > 0 ? "profit-positive" : "profit-negative";
    return `
      <tr>
        <td>${escapeHTML(row.draw_no)}<br><small>${escapeHTML(row.date)}</small></td>
        <td>${numberBalls(row.actual, true)}</td>
        <td>
          <div class="prediction-ledger">
            ${row.candidates.map((candidate) => {
              const resultText = candidate.prize_level
                ? `${prizeName(candidate.prize_level)} · ${candidate.winning_bets}注 · ${compactMoney(candidate.prize_amount)}`
                : "未中奖";
              return `<div class="ledger-row">
                <span class="ledger-rank">${String(candidate.rank).padStart(2, "0")}<small>${escapeHTML(candidate.wager_type?.id || "")}</small></span>
                <span class="ball-row">${wagerBalls(candidate, rules)}</span>
                <span class="ledger-result ${candidate.prize_level ? "win" : ""}">${resultText}</span>
              </div>`;
            }).join("")}
          </div>
        </td>
        <td>
          <div class="issue-accounting">
            <span>投入 ${compactMoney(row.cost)}</span>
            <strong class="${profitClass}">${signedMoney(row.profit)}</strong>
            <span>回报 ${compactMoney(row.payout)}</span>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function clearBacktestDisplay() {
  state.backtest = null;
  $("#backtest-results").hidden = true;
  $("#backtest-empty").hidden = false;
  $("#backtest-empty").querySelector("p").textContent = "还没有回测记录";
  $("#backtest-empty").querySelector("small").textContent =
    "运行后会逐一显示五组预测的实际中奖结果，并比较单式与小额复式的投入、奖金和回报。";
}

function renderFrequencyHeatFromWeights(result) {
  const mainZone = state.dashboard.rules.zones[0].name;
  const weights = result.crowd_weights[mainZone] || [];
  const first = state.dashboard.rules.zones[0].min;
  renderFrequencyHeat(weights.map((value, index) => [first + index, value]));
  $("#freq-zone-label").textContent = `${mainZone} · 本次参数`;
}

function updateConstraintBand() {
  if (!state.dashboard?.profile?.ready) return;
  const result = state.result;
  const targetMin = result?.target?.min ?? Number($("#target-min").value);
  const targetMax = result?.target?.max ?? Number($("#target-max").value);
  const values = result?.recommendations?.map((item) => item.expected_first_winners) || [];
  const scaleMax = Math.max(20, targetMax + 5, ...values.map((value) => value + 2));
  const left = Math.max(0, Math.min(100, targetMin / scaleMax * 100));
  const width = Math.max(1.2, Math.min(100 - left, (targetMax - targetMin + 1) / scaleMax * 100));
  $("#target-band").style.left = `${left}%`;
  $("#target-band").style.width = `${width}%`;
  $("#constraint-max").textContent = `${Math.ceil(scaleMax)}+`;
  $("#candidate-pins").innerHTML = values.map((value, index) => {
    const position = Math.max(0, Math.min(100, value / scaleMax * 100));
    return `<div class="candidate-pin ${index === 0 ? "primary" : ""}" style="left:${position}%" data-rank="${index + 1}" title="预期 ${value.toFixed(2)} 注"></div>`;
  }).join("");
}

function clearResultDisplay() {
  $("#recommendation-list").innerHTML = `
    <div class="empty-state">
      <span class="empty-cross" aria-hidden="true"></span>
      <p>尚未运行搜索</p>
      <small>左侧设定期望头奖人数，模拟器会从候选组合里寻找同时满足偏好和返奖约束的开奖号码。</small>
    </div>`;
  $("#primary-content").innerHTML = '<p class="dossier-placeholder">运行后显示完整奖级、预期返奖和人群暴露。</p>';
  $("#candidate-pins").innerHTML = "";
}

async function refreshData() {
  const button = $("#refresh-data");
  button.disabled = true;
  button.textContent = "正在下载…";
  try {
    const result = await api("/api/refresh", {
      method: "POST",
      body: JSON.stringify({ lottery: state.lottery, limit: 1000 }),
    });
    showToast(`已同步 ${result.count} 期，新增 ${result.added} 期`);
    await loadLottery(state.lottery);
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "刷新官方数据";
  }
}

function setRunState(kind, text) {
  const element = $("#run-state");
  element.className = `run-state ${kind === "idle" || kind === "loading" ? "" : kind}`;
  element.innerHTML = `<span></span>${escapeHTML(text)}`;
}

function numberBalls(numbers, tiny = false, rules = null) {
  const zones = rules || state.dashboard?.rules?.zones || [];
  const values = [];
  const orderedNames = zones.length
    ? zones.map((zone) => zone.name)
    : Object.keys(numbers || {});
  orderedNames.forEach((name, zoneIndex) => {
    (numbers?.[name] || []).forEach((number) => {
      values.push(`<span class="number-ball ${tiny ? "tiny" : ""} ${zoneIndex > 0 ? "bonus" : ""}">${String(number).padStart(2, "0")}</span>`);
    });
  });
  return values.join("");
}

function wagerBalls(candidate, rules) {
  const values = [];
  rules.forEach((zone, zoneIndex) => {
    const core = new Set(candidate.numbers?.[zone.name] || []);
    (candidate.expanded?.[zone.name] || []).forEach((number) => {
      const support = candidate.supplement_support?.[zone.name]?.[String(number)];
      const classes = ["number-ball", "tiny", zoneIndex > 0 ? "bonus" : "", core.has(number) ? "" : "supplement"]
        .filter(Boolean)
        .join(" ");
      const label = core.has(number)
        ? "预测核心号"
        : `预测支持度补位号${support == null ? "" : ` · ${(support * 100).toFixed(0)}%`}`;
      values.push(`<span class="${classes}" title="${label}">${String(number).padStart(2, "0")}</span>`);
    });
  });
  return values.join("");
}

function formatInteger(value) {
  return Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 0 });
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (number >= 1e8) return `${(number / 1e8).toFixed(2)} 亿`;
  if (number >= 1e4) return `${(number / 1e4).toFixed(1)} 万`;
  return `¥${formatInteger(number)}`;
}

function compactMoney(value) {
  return formatMoney(value);
}

function compactNumber(value) {
  const number = Number(value || 0);
  if (number >= 1e8) return `${(number / 1e8).toFixed(2)} 亿`;
  if (number >= 1e4) return `${(number / 1e4).toFixed(1)} 万`;
  return formatInteger(number);
}

function prizeName(level) {
  return PRIZE_NAMES[state.lottery]?.[level - 1] || `${level}等奖`;
}

function strategyDriverBars(drivers = {}) {
  const labels = {
    target: "头奖约束",
    payout: "返奖拟合",
    anti_crowd: "反热门",
    robust: "双层稳健",
    state: "状态转移",
    plausibility: "结构合理",
  };
  return `<div class="driver-grid">${Object.entries(labels).map(([key, label]) => `
    <div class="driver-bar">
      <span>${label}</span>
      <i><b style="width:${Math.max(0, Math.min(100, Number(drivers[key] || 0)))}%"></b></i>
      <em>${Number(drivers[key] || 0).toFixed(0)}</em>
    </div>`).join("")}</div>`;
}

function signed(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function signedMoney(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : "−"}${compactMoney(Math.abs(number))}`;
}

function formatRatio(oneIn) {
  if (!oneIn) return "—";
  return `1 / ${formatInteger(oneIn)}`;
}

function formatCi(interval) {
  if (!interval) return "—";
  return `${(interval[0] * 100).toFixed(1)}–${(interval[1] * 100).toFixed(1)}%`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3400);
}
