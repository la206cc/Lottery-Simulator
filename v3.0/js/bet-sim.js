/*
 * V3.0 彩票模拟器 - 投注模拟 + 参数调节面板
 */

const BetSimModule = {
  lockedSliders: new Set(),
  cachedNoise: null,
  isSimulating: false,

  init() {
    this.bindEvents();
    this.onLotteryChange(STATE.currentLottery);
  },

  bindEvents() {
    const safe = (id, evt, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(evt, fn); };

    ['total-bets', 'fluctuation', 'pool-size'].forEach(id => {
      safe(id, 'input', () => this.onGlobalSlider(id));
    });

    document.querySelectorAll('.range-slider.linked').forEach(slider => {
      slider.addEventListener('input', () => {
        this.syncLinkedGroup(slider.dataset.group);
        this.updateDisplay(slider.id);
      });
    });

    document.querySelectorAll('.slider-lock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.lock;
        if (this.lockedSliders.has(id)) {
          this.lockedSliders.delete(id); btn.classList.remove('locked');
          const el = document.getElementById(id); if (el) el.classList.remove('locked');
        } else {
          this.lockedSliders.add(id); btn.classList.add('locked');
          const el = document.getElementById(id); if (el) el.classList.add('locked');
        }
      });
    });

    safe('addon-ratio', 'input', () => {
      const el = document.getElementById('addon-ratio');
      const d = document.getElementById('v-addon-ratio');
      if (el && d) d.textContent = el.value;
    });
    safe('base-sales', 'input', () => {
      const el = document.getElementById('base-sales');
      const d = document.getElementById('v-base-sales');
      if (el && d) d.textContent = el.value;
    });

    // 期号选择器变化事件
    safe('bet-issue-select', 'change', () => this.onIssueChange());

    safe('btn-start-sim', 'click', () => this.startSimulation());
    safe('btn-reset-params', 'click', () => this.resetParams());
    safe('btn-export-config', 'click', () => this.exportConfig());
    safe('btn-import-config', 'click', () => this.importConfig());
    safe('import-config-file', 'change', (e) => this.handleImportConfig(e));
  },

  onLotteryChange(id) {
    const params = getDefaultParams(id);
    if (!params) return;

    this.setSlider('pop-low', params.frequency.low);
    this.setSlider('pop-mid', params.frequency.mid);
    this.setSlider('pop-high', params.frequency.high);
    this.setSlider('bet-single', params.betType.single);
    this.setSlider('bet-complex', params.betType.complex);
    this.setSlider('bet-dantuo', params.betType.dantuo);
    this.setSlider('mul-x1', params.multiplier.x1);
    this.setSlider('mul-x2_5', params.multiplier.x2_5);
    this.setSlider('mul-x6_20', params.multiplier.x6_20);
    this.setSlider('mul-x20plus', params.multiplier.x20plus);

    document.getElementById('dl-pop-low').textContent = '默认:' + params.frequency.low;
    document.getElementById('dl-pop-mid').textContent = '默认:' + params.frequency.mid;
    document.getElementById('dl-pop-high').textContent = '默认:' + params.frequency.high;
    document.getElementById('dl-bet-single').textContent = '默认:' + params.betType.single;
    document.getElementById('dl-bet-complex').textContent = '默认:' + params.betType.complex;
    document.getElementById('dl-bet-dantuo').textContent = '默认:' + params.betType.dantuo;
    document.getElementById('dl-mul-x1').textContent = '默认:' + params.multiplier.x1;
    document.getElementById('dl-mul-x2_5').textContent = '默认:' + params.multiplier.x2_5;
    document.getElementById('dl-mul-x6_20').textContent = '默认:' + params.multiplier.x6_20;
    document.getElementById('dl-mul-x20plus').textContent = '默认:' + params.multiplier.x20plus;

    document.getElementById('addon-group').style.display = params.meta.hasAddOn ? 'block' : 'none';
    document.getElementById('v-addon-ratio').textContent = params.addOn || 40;
    if (params.addOn) document.getElementById('addon-ratio').value = params.addOn;

    document.getElementById('base-sales').value = params.baseSales || 50;
    document.getElementById('v-base-sales').textContent = params.baseSales || 50;

    this.lockedSliders.clear();
    document.querySelectorAll('.slider-lock-btn').forEach(b => b.classList.remove('locked'));
    document.querySelectorAll('.range-slider.locked').forEach(s => s.classList.remove('locked'));
    this.cachedNoise = null;
    this.updateAllDisplay();
    this.calcSummary();
    this.updateIssueSelector();
  },

  setSlider(id, value) { const el = document.getElementById(id); if (el) el.value = value; },

  syncLinkedGroup(group) {
    const sliders = document.querySelectorAll(`.range-slider.linked[data-group="${group}"]`);
    if (sliders.length < 2) return;
    let values = [], lockedSum = 0, unlockedCount = 0;
    sliders.forEach(s => { const v = parseFloat(s.value); values.push(v); if (this.lockedSliders.has(s.id)) lockedSum += v; else unlockedCount++; });
    if (unlockedCount === 0) return;
    let sum = values.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) < 0.001) return;
    let remaining = 100 - lockedSum;
    let unlockedVals = [];
    sliders.forEach((s, i) => {
      if (this.lockedSliders.has(s.id)) unlockedVals.push(null);
      else {
        let r = remaining * (values[i] / (sum - lockedSum));
        unlockedVals.push(Math.max(parseFloat(s.min), Math.min(parseFloat(s.max), r)));
      }
    });
    let unlockedSum = unlockedVals.reduce((a, b) => (b !== null ? a + b : a), 0);
    if (unlockedSum > 0) {
      let scale = remaining / unlockedSum;
      sliders.forEach((s, i) => {
        if (!this.lockedSliders.has(s.id) && unlockedVals[i] !== null)
          s.value = Math.max(parseFloat(s.min), Math.min(parseFloat(s.max), unlockedVals[i] * scale));
      });
    }
  },

  onGlobalSlider(id) {
    this.updateDisplay(id);
    if (id === 'fluctuation' || id === 'pool-size') { this.cachedNoise = null; this.calcSummary(); }
  },

  updateDisplay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const d = document.getElementById('v-' + id);
    if (d) d.textContent = parseFloat(el.value).toFixed(2);
  },

  updateAllDisplay() {
    document.querySelectorAll('.range-slider').forEach(s => {
      const d = document.getElementById('v-' + s.id);
      if (d) d.textContent = parseFloat(s.value).toFixed(2);
    });
  },

  calcSummary() {
    const single = parseFloat(document.getElementById('bet-single').value);
    const complex = parseFloat(document.getElementById('bet-complex').value);
    const dantuo = parseFloat(document.getElementById('bet-dantuo').value);
    const x1 = parseFloat(document.getElementById('mul-x1').value);
    const x2_5 = parseFloat(document.getElementById('mul-x2_5').value);
    const x6_20 = parseFloat(document.getElementById('mul-x6_20').value);
    const x20plus = parseFloat(document.getElementById('mul-x20plus').value);
    document.getElementById('res-single').textContent = single.toFixed(2) + '%';
    document.getElementById('res-complex').textContent = complex.toFixed(2) + '%';
    document.getElementById('res-dantuo').textContent = dantuo.toFixed(2) + '%';
    document.getElementById('res-x1').textContent = x1.toFixed(2) + '%';
    document.getElementById('res-x2_5').textContent = x2_5.toFixed(2) + '%';
    document.getElementById('res-x6_20').textContent = x6_20.toFixed(2) + '%';
  },

  // ====== 期号选择器 ======
  updateIssueSelector() {
    const records = STATE.drawData[STATE.currentLottery] || [];
    const sel = document.getElementById('bet-issue-select');
    if (!sel) return;
    sel.innerHTML = records.length === 0
      ? '<option value="">-- 请先在"开奖模拟"中生成开奖数据 --</option>'
      : '<option value="">-- 请选择期号 --</option>' +
        records.slice().reverse().map((r, i) =>
          `<option value="${records.length - 1 - i}">${r.issue} - ${r.date}</option>`
        ).join('');
    this.updateWinningDisplay(null);
  },

  onIssueChange() {
    const winning = this.getSelectedWinningNumbers();
    this.updateWinningDisplay(winning);
  },

  updateWinningDisplay(winning) {
    const div = document.getElementById('bet-winning-display');
    if (!div) return;
    if (!winning) {
      div.style.display = 'none';
      div.innerHTML = '';
      return;
    }
    div.style.display = 'block';
    const meta = getLotteryMeta(STATE.currentLottery);
    let html = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">开奖号码</div><div style="display:flex;gap:2px;flex-wrap:wrap">';
    for (const [zoneName, numbers] of Object.entries(winning)) {
      const z = meta.zones.find(z => z.name === zoneName);
      const color = z ? z.color : 'red';
      html += numbers.map(n => `<span class="number-ball large ${color}">${String(n).padStart(2,'0')}</span>`).join('');
    }
    html += '</div>';
    div.innerHTML = html;
  },

  getSelectedWinningNumbers() {
    const sel = document.getElementById('bet-issue-select');
    if (!sel || sel.value === '') return null;
    const idx = parseInt(sel.value);
    const records = STATE.drawData[STATE.currentLottery] || [];
    return records[idx] ? records[idx].winningNumbers : null;
  },

  // ====== 模拟执行 ======
  async startSimulation() {
    if (this.isSimulating) return;
    const winningNumbers = this.getSelectedWinningNumbers();
    if (!winningNumbers) {
      alert('请先在"开奖模拟"Tab中生成开奖数据，然后选择期号！');
      return;
    }

    this.isSimulating = true;
    const btn = document.getElementById('btn-start-sim');
    btn.textContent = '模拟中...';
    btn.disabled = true;

    const params = this.getCurrentParams();

    let result = null;
    // 先尝试API，5秒超时后自动切换本地模拟
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(API_BASE + '/simulate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_id: STATE.currentLottery, num_rounds: Math.min(params.numRounds, 10000),
          initial_pool: params.poolSize, initial_capital: params.numRounds * 2,
          mode: 'single_draw' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && data.data) result = data.data.result;
    } catch (err) {
      console.warn('API模拟不可用，自动使用本地模拟:', err.message);
    }

    if (!result) {
      try { result = this.localSimulate(params, winningNumbers); } catch(e) {
        console.error('本地模拟失败:', e);
        alert('模拟出错，请刷新页面后重试');
        this.isSimulating = false;
        btn.textContent = '开始模拟';
        btn.disabled = false;
        return;
      }
    }

    STATE.simResults = result;
    try { this.showResults(result); } catch(e) { console.error('显示结果失败:', e); }

    this.isSimulating = false;
    btn.textContent = '开始模拟';
    btn.disabled = false;
  },

  getCurrentParams() {
    return {
      betType: {
        singleRatio: parseFloat(document.getElementById('bet-single').value) / 100,
        complexRatio: parseFloat(document.getElementById('bet-complex').value) / 100,
        danTuoRatio: parseFloat(document.getElementById('bet-dantuo').value) / 100
      },
      multiplier: {
        ratio1x: parseFloat(document.getElementById('mul-x1').value) / 100,
        ratio2_5x: parseFloat(document.getElementById('mul-x2_5').value) / 100,
        ratio6_20x: parseFloat(document.getElementById('mul-x6_20').value) / 100,
        ratio20xPlus: parseFloat(document.getElementById('mul-x20plus').value) / 100
      },
      frequency: {
        highFreqRatio: parseFloat(document.getElementById('pop-high').value) / 100,
        midFreqRatio: parseFloat(document.getElementById('pop-mid').value) / 100,
        lowFreqRatio: parseFloat(document.getElementById('pop-low').value) / 100
      },
      poolSize: parseFloat(document.getElementById('pool-size').value) * 1e8,
      numRounds: Math.round(parseFloat(document.getElementById('total-bets').value) * 10000),
      addOnRatio: parseInt(document.getElementById('addon-ratio').value) / 100 || 0
    };
  },

  // ====== 本地模拟 (使用开奖历史数据) ======
  localSimulate(params, winningNumbers) {
    const meta = getLotteryMeta(STATE.currentLottery);
    const rounds = [];
    let totalCost = 0, totalWin = 0, wins = 0;
    const prizeDist = {};

    for (let i = 1; i <= Math.min(params.numRounds, 10000); i++) {
      const bet = this.localGenerateBet(meta, params);
      const cost = bet.combos * meta.pricePerBet * bet.multiplier;
      if (params.addOnRatio > 0 && Math.random() < params.addOnRatio) cost += bet.combos;
      totalCost += cost;

      const { amount, level } = this.localCalculatePrize(meta, winningNumbers, bet);
      totalWin += amount;
      if (amount > 0) {
        wins++;
        const key = level || 6;
        prizeDist[key] = (prizeDist[key] || 0) + 1;
      }

      rounds.push({ round: i, bet_numbers: bet.numbers,
        bet_type: bet.type, bet_cost: cost,
        prize_amount: amount, prize_level: level });
    }

    return {
      mode: 'single_draw', winning_numbers: winningNumbers,
      num_rounds: rounds.length, rounds: rounds.slice(0, 100),
      summary: {
        total_investment: totalCost, total_return: totalWin,
        net_profit: totalWin - totalCost,
        return_rate: totalCost > 0 ? totalWin / totalCost : 0,
        wins, losses: rounds.length - wins,
        win_rate: rounds.length > 0 ? wins / rounds.length : 0,
        prize_distribution: prizeDist
      }
    };
  },

  localGenerateBet(meta, params) {
    const numbers = {};
    const r = Math.random();
    const singleChance = params.betType.singleRatio;
    const complexChance = singleChance + params.betType.complexRatio;

    let combos = 1;
    let betType = 'single';
    meta.zones.forEach(z => {
      let count = z.count;
      if (STATE.currentLottery === 'kl8') count = STATE.kl8Select;
      if (meta.noComplex) {
        numbers[z.name] = this.randomPick(z.min, z.max, count, z.repeatable);
        return;
      }
      if (r < singleChance) {
        numbers[z.name] = this.randomPick(z.min, z.max, count, z.repeatable);
      } else if (r < complexChance) {
        const extra = 1 + Math.floor(Math.random() * Math.min(3, z.max - z.min - count));
        numbers[z.name] = this.randomPick(z.min, z.max, count + extra, z.repeatable);
        if (count + extra > count) combos *= this.combinationCount(count + extra, count);
        betType = 'complex';
      } else {
        numbers[z.name] = this.randomPick(z.min, z.max, count, z.repeatable);
      }
    });

    const multDist = Math.random();
    let multiplier = 1;
    if (multDist > 1 - params.multiplier.ratio20xPlus) multiplier = 20 + Math.floor(Math.random() * 80);
    else if (multDist > 1 - params.multiplier.ratio20xPlus - params.multiplier.ratio6_20x) multiplier = 6 + Math.floor(Math.random() * 15);
    else if (multDist > 1 - params.multiplier.ratio20xPlus - params.multiplier.ratio6_20x - params.multiplier.ratio2_5x) multiplier = 2 + Math.floor(Math.random() * 4);

    return { numbers, combos, multiplier, type: betType };
  },

  randomPick(min, max, count, repeatable) {
    if (repeatable) {
      const arr = [];
      for (let i = 0; i < count; i++) arr.push(min + Math.floor(Math.random() * (max - min + 1)));
      return arr;
    }
    let pool = [];
    for (let n = min; n <= max; n++) pool.push(n);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return sortNums(pool.slice(0, count));
  },

  combinationCount(n, k) { if (k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; },

  // ====== 修复后的奖金计算 (按区域+按位置匹配) ======
  localCalculatePrize(meta, winning, bet) {
    // 统计各区域命中数
    const zoneHits = [];
    let totalZones = 0;
    let allZonesPerfect = true;

    meta.zones.forEach(z => {
      const wNums = winning[z.name] || [];
      const bNums = bet.numbers[z.name] || [];
      totalZones++;

      if (z.repeatable) {
        // 按位匹配 (3D / 排列 / 七星彩)
        let hits = 0;
        for (let i = 0; i < Math.min(wNums.length, bNums.length); i++) {
          if (wNums[i] === bNums[i]) hits++;
        }
        zoneHits.push({ hits, count: z.count, perfect: hits === z.count });
        if (hits < z.count) allZonesPerfect = false;
      } else {
        // 不按位匹配 (双色球 / 大乐透 / 七乐彩 / 快乐8)
        const winSet = new Set(wNums);
        const betArr = bNums;
        let hits = 0;
        for (const n of betArr) { if (winSet.has(n)) hits++; }
        zoneHits.push({ hits, count: z.count, perfect: hits === z.count });
        if (hits < z.count) allZonesPerfect = false;
      }
    });

    // 按彩种分类计算奖金
    if (STATE.currentLottery === 'plw') {
      return this.calcPlwPrize(zoneHits, bet);
    }
    if (STATE.currentLottery === 'fc3d' || STATE.currentLottery === 'pls') {
      return this.calc3dPrize(zoneHits, bet);
    }
    if (STATE.currentLottery === 'kl8') {
      return this.calcKl8Prize(zoneHits, bet);
    }

    // 通用乐透型计算 (SSQ / DLT / QLC / QXC)
    return this.calcLottoPrize(zoneHits, bet);
  },

  calcPlwPrize(zoneHits, bet) {
    let hitCount = 0;
    zoneHits.forEach(z => { hitCount += z.hits; });
    let amount = 0, level = null;
    const total = zoneHits.reduce((s, z) => s + z.count, 0);
    if (hitCount === total) { amount = 100000; level = 1; }
    return { amount: amount * bet.multiplier, level };
  },

  calc3dPrize(zoneHits, bet) {
    let hitCount = 0;
    zoneHits.forEach(z => { hitCount += z.hits; });
    let amount = 0, level = null;
    if (hitCount === 3) {
      // 直选
      amount = 1040; level = 1;
    } else {
      // 组选: 检查是否所有号码相同(组三)或全不同(组六)
      const meta = getLotteryMeta(STATE.currentLottery);
      const wNums = [];
      meta.zones.forEach(z => {
        const wn = bet.bet_type ? winning[z.name] : [];
        if (wn[0] !== undefined) wNums.push(wn[0]);
      });
      const uniqueWin = new Set(wNums);
      const bNums = [];
      meta.zones.forEach(z => { const bn = bet.numbers[z.name] || []; if (bn[0] !== undefined) bNums.push(bn[0]); });
      if (bNums.length >= 3) {
        const bUnique = new Set(bNums);
        const winSorted = [...uniqueWin].sort().join('');
        const betSorted = [...bUnique].sort().join('');
        if (winSorted.length === 2 && betSorted.length === 2 && winSorted === betSorted) {
          amount = 346; level = 2; // 组三
        } else if (winSorted.length >= 3 && betSorted.length >= 3 && winSorted === betSorted) {
          amount = 173; level = 3; // 组六
        }
      }
    }
    return { amount: amount * bet.multiplier, level };
  },

  calcKl8Prize(zoneHits, bet) {
    const hits = zoneHits[0] ? zoneHits[0].hits : 0;
    const k = parseInt(STATE.kl8Select) || 10;
    let amount = 0, level = null;

    if (k === 10) {
      if (hits === 10) { amount = 5000000; level = 1; }
      else if (hits === 9) { amount = 8000; level = 2; }
      else if (hits === 8) { amount = 800; level = 3; }
      else if (hits === 7) { amount = 80; level = 4; }
      else if (hits === 6) { amount = 5; level = 5; }
      else if (hits === 5) { amount = 3; level = 6; }
      else if (hits === 0) { amount = 2; level = 7; }
    } else if (k === 9 || k === 8 || k === 7 || k === 6 || k === 5) {
      const prizes = { 9: [300000,2000,200,20,5], 8: [50000,800,80,8], 7: [10000,160,16,4], 6: [3000,30,3], 5: [1000,20,2] };
      const p = prizes[k] || [];
      const idx = k - hits;
      if (idx >= 0 && idx < p.length) amount = p[idx];
      if (amount > 0) level = k;
    } else if (k <= 4) {
      const prizes4 = { 4: [100,3,2], 3: [40,3], 2: [8], 1: [4] };
      const p = prizes4[k] || [];
      const idx = k - hits;
      if (idx >= 0 && idx < p.length) amount = p[idx];
      if (amount > 0) level = k;
    }
    return { amount: amount * bet.multiplier, level };
  },

  calcLottoPrize(zoneHits, bet) {
    // SSQ: 红6+蓝1 → 6奖级
    // DLT: 前5+后2 → 8奖级
    // QLC: 基本7+特别1 → 7奖级
    // QXC: 7位 → 5奖级
    let amount = 0, level = null;

    if (STATE.currentLottery === 'ssq') {
      const rh = zoneHits[0].hits, bh = zoneHits[1].hits;
      if (rh === 6 && bh === 1) { amount = 5000000; level = 1; }
      else if (rh === 6 && bh === 0) { amount = 200000; level = 2; }
      else if (rh === 5 && bh === 1) { amount = 3000; level = 3; }
      else if ((rh === 5 && bh === 0) || (rh === 4 && bh === 1)) { amount = 200; level = 4; }
      else if ((rh === 4 && bh === 0) || (rh === 3 && bh === 1)) { amount = 10; level = 5; }
      else if (bh === 1 && rh <= 2) { amount = 5; level = 6; }
    } else if (STATE.currentLottery === 'dlt') {
      const fh = zoneHits[0].hits, bh = zoneHits[1].hits;
      if (fh === 5 && bh === 2) { amount = 5000000; level = 1; }
      else if (fh === 5 && bh === 1) { amount = 200000; level = 2; }
      else if (fh === 5 || (fh === 4 && bh === 2)) { amount = 10000; level = 3; }
      else if ((fh === 4 && bh === 1) || (fh === 3 && bh === 2)) { amount = 3000; level = 4; }
      else if (fh === 4 || fh === 3 && bh === 1 || (fh === 2 && bh === 2)) { amount = 300; level = 5; }
      else if (fh === 3 || (fh >= 1 && bh === 2)) { amount = 200; level = 6; }
      else if ((fh === 2 && bh >= 1) || bh === 1) { amount = 100; level = 7; }
      else if (fh >= 1 || bh >= 1) { amount = 15; level = 8; }
    } else if (STATE.currentLottery === 'qxc') {
      let hits = 0;
      for (let i = 0; i < zoneHits.length; i++) hits += zoneHits[i].hits;
      if (hits === 7) { amount = 5000000; level = 1; }
      else if (hits === 6) { amount = 20000; level = 2; }
      else if (hits === 5) { amount = 188; level = 3; }
      else if (hits === 4) { amount = 18; level = 4; }
      else if (hits === 3) { amount = 3; level = 5; }
    } else if (STATE.currentLottery === 'qlc') {
      const bh = zoneHits[0].hits;
      if (bh === 7) { amount = 2000000; level = 1; }
      else if (bh === 6 && zoneHits[1] && zoneHits[1].hits === 1) { amount = 2000; level = 2; }
      else if (bh === 6) { amount = 300; level = 3; }
      else if (bh === 5 && zoneHits[1] && zoneHits[1].hits === 1) { amount = 50; level = 4; }
      else if (bh === 5) { amount = 10; level = 5; }
      else if (bh === 4) { amount = 5; level = 6; }
      else if (bh === 3) { amount = 3; level = 7; }
    }

    return { amount: amount * bet.multiplier, level };
  },

  // ====== 显示结果 ======
  showResults(result) {
    const section = document.getElementById('sim-results-section');
    section.style.display = 'block';
    const summary = result.summary;

    document.getElementById('sim-summary-cards').innerHTML = `
      <div class="summary-card"><div class="card-label">投注次数</div><div class="card-value">${result.num_rounds}</div></div>
      <div class="summary-card"><div class="card-label">总投资</div><div class="card-value">${fmtMoney(summary.total_investment)}</div></div>
      <div class="summary-card"><div class="card-label">总回报</div><div class="card-value">${fmtMoney(summary.total_return)}</div></div>
      <div class="summary-card ${summary.net_profit > 0 ? 'positive' : 'negative'}">
        <div class="card-label">净利润</div><div class="card-value">${fmtMoney(summary.net_profit)}</div></div>
      <div class="summary-card"><div class="card-label">回报率</div><div class="card-value">${(summary.return_rate * 100).toFixed(2)}%</div></div>
      <div class="summary-card"><div class="card-label">中奖次数</div><div class="card-value">${summary.wins}</div></div>
      <div class="summary-card"><div class="card-label">胜率</div><div class="card-value">${(summary.win_rate * 100).toFixed(2)}%</div></div>
    `;

    const tbody = document.getElementById('sim-result-tbody');
    tbody.innerHTML = '';
    const data = result.rounds || [];
    data.forEach((r, i) => {
      const isWin = r.prize_amount > 0;
      const profit = (r.prize_amount || 0) - (r.bet_cost || 0);
      tbody.innerHTML += `<tr>
        <td>${r.round || i + 1}</td>
        <td>${this.formatBetNums(r.bet_numbers)}</td>
        <td>${r.bet_type || '单式'}</td><td>x1</td>
        <td class="${isWin ? 'win' : 'lose'}">${isWin ? ('L' + (r.prize_level || '□')) : '未中'}</td>
        <td class="${isWin ? 'win' : 'lose'}">${fmtMoney(r.prize_amount)}</td>
        <td class="${profit > 0 ? 'win' : 'lose'}">${profit >= 0 ? '+' : ''}${fmtMoney(profit)}</td>
      </tr>`;
    });

    if (result.winning_numbers) {
      document.getElementById('sim-summary-cards').innerHTML +=
        `<div class="summary-card" style="grid-column:1/-1;background:linear-gradient(135deg,#667eea,#764ba2)">
          <div class="card-label">本期开奖号码</div>
          <div class="card-value" style="font-size:14px">${this.formatBetNums(result.winning_numbers)}</div></div>`;
    }
    section.scrollIntoView({ behavior: 'smooth' });
  },

  formatBetNums(nums) {
    if (!nums) return '--';
    let html = '';
    for (const [name, arr] of Object.entries(nums)) {
      if (Array.isArray(arr)) arr.forEach(n => html += `<span class="number-ball small red">${n}</span>`);
    }
    return html || '--';
  },

  clearResults() {
    document.getElementById('sim-results-section').style.display = 'none';
    STATE.simResults = null;
  },

  resetParams() { this.onLotteryChange(STATE.currentLottery); },

  exportConfig() {
    const config = { lottery: STATE.currentLottery, date: new Date().toISOString(), values: {} };
    document.querySelectorAll('.range-slider').forEach(s => { config.values[s.id] = parseFloat(s.value); });
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bet_sim_${STATE.currentLottery}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  importConfig() { document.getElementById('import-config-file').click(); },

  handleImportConfig(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const config = JSON.parse(ev.target.result);
        if (config.values) {
          for (const [id, val] of Object.entries(config.values)) { const el = document.getElementById(id); if (el) el.value = val; }
        }
        this.updateAllDisplay();
        this.calcSummary();
      } catch (err) { alert('配置文件解析失败'); }
    };
    reader.readAsText(file);
    document.getElementById('import-config-file').value = '';
  }
};

try { BetSimModule.init(); } catch(e) { console.error('BetSimModule init error:', e); }
