/*
 * V3.0 彩票模拟器 - 开奖模拟模块 (纯开奖, 无投注)
 */

const DrawModule = {
  selected: {},
  importFileInput: null,

  init() {
    this.bindEvents();
    this.onLotteryChange(STATE.currentLottery);
  },

  bindEvents() {
    document.getElementById('btn-random-fill').addEventListener('click', () => this.randomFill());
    document.getElementById('btn-clear-select').addEventListener('click', () => this.clearSelection());
    document.getElementById('btn-draw').addEventListener('click', () => this.doDraw());
    document.getElementById('btn-draw-manual').addEventListener('click', () => this.doManualDraw());

    document.querySelectorAll('#draw-presets .btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#draw-presets .btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        document.getElementById('draw-count').value = b.dataset.count;
      });
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-import-csv').addEventListener('click', () => this.importCSV());
    document.getElementById('btn-clear-current').addEventListener('click', () => this.clearCurrent());

    this.importFileInput = document.createElement('input');
    this.importFileInput.type = 'file';
    this.importFileInput.accept = '.csv';
    this.importFileInput.style.display = 'none';
    document.body.appendChild(this.importFileInput);
    this.importFileInput.addEventListener('change', (e) => this.handleImport(e));
  },

  onLotteryChange(id) {
    // 初始化数据
    if (!STATE.drawData[id]) STATE.drawData[id] = [];
    this.renderNumberPanel();
    this.renderHistory();
  },

  onKL8SelectChange(select) {
    if (STATE.currentLottery !== 'kl8') return;
    this.renderNumberPanel();
  },

  // ====== 选号面板 (用于手选开奖) ======
  renderNumberPanel() {
    const panel = document.getElementById('number-panel');
    panel.innerHTML = '';

    const meta = getLotteryMeta(STATE.currentLottery);
    if (!meta) return;

    this.selected = {};
    meta.zones.forEach((z, zi) => {
      const zoneDiv = document.createElement('div');
      zoneDiv.className = 'number-zone';

      let name = z.name;
      let count = z.count;
      if (STATE.currentLottery === 'kl8') { count = 20; name = '开奖号码(20个)'; }

      zoneDiv.innerHTML = `<div class="zone-label">${name}
        <span class="zone-count-info"><span class="filled" id="filled-zone-${zi}">已选 0</span>
        <span>/ ${count}</span>&nbsp;
        <span style="font-size:10px;color:var(--text-muted)">选满后可"手选号开奖"</span></span></div>`;

      const grid = document.createElement('div');
      grid.className = 'number-grid';
      for (let n = z.min; n <= z.max; n++) {
        const ball = document.createElement('div');
        ball.className = `number-panel-ball zone-${z.color}`;
        ball.textContent = n;
        ball.dataset.zone = zi;
        ball.dataset.number = n;
        ball.addEventListener('click', () => this.toggleBall(ball, zi, n, count, z));
        grid.appendChild(ball);
      }
      zoneDiv.appendChild(grid);
      panel.appendChild(zoneDiv);
      this.selected[zi] = [];
    });
  },

  toggleBall(ball, zoneIdx, num, maxCount, zone) {
    const idx = this.selected[zoneIdx].indexOf(num);
    if (idx >= 0) {
      this.selected[zoneIdx].splice(idx, 1);
      ball.classList.remove('selected', `zone-${zone.color}`);
    } else {
      if (this.selected[zoneIdx].length >= maxCount) {
        ball.style.transform = 'scale(1.15)';
        setTimeout(() => ball.style.transform = '', 200);
        return;
      }
      this.selected[zoneIdx].push(num);
      ball.classList.add('selected', `zone-${zone.color}`);
    }
    this.selected[zoneIdx] = sortNums(this.selected[zoneIdx]);
    const el = document.getElementById('filled-zone-' + zoneIdx);
    if (el) el.textContent = '已选 ' + this.selected[zoneIdx].length;

    const hasAll = Object.values(this.selected).every((arr, zi) => {
      const meta = getLotteryMeta(STATE.currentLottery);
      let target = meta.zones[zi].count;
      if (STATE.currentLottery === 'kl8') target = 20;
      return arr.length === target;
    });
    document.getElementById('bet-info').textContent = hasAll ? '已选满，可手选开奖' : '';
  },

  clearSelection() {
    document.querySelectorAll('.number-panel-ball').forEach(b => {
      b.classList.remove('selected', 'zone-red', 'zone-blue', 'zone-orange', 'zone-green');
    });
    const meta = getLotteryMeta(STATE.currentLottery);
    this.selected = {};
    meta.zones.forEach((z, zi) => { this.selected[zi] = []; });
    document.getElementById('bet-info').textContent = '';
  },

  randomFill() {
    this.clearSelection();
    const meta = getLotteryMeta(STATE.currentLottery);
    meta.zones.forEach((z, zi) => {
      let count = z.count;
      if (STATE.currentLottery === 'kl8') count = 20;
      let pool = [];
      for (let n = z.min; n <= z.max; n++) pool.push(n);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      this.selected[zi] = sortNums(pool.slice(0, count));
    });
    document.querySelectorAll('.number-panel-ball').forEach(ball => {
      const zi = parseInt(ball.dataset.zone);
      const num = parseInt(ball.dataset.number);
      if (this.selected[zi] && this.selected[zi].includes(num)) {
        const z = meta.zones[zi];
        ball.classList.add('selected', `zone-${z.color}`);
      }
    });
    meta.zones.forEach((z, zi) => {
      const el = document.getElementById('filled-zone-' + zi);
      if (el) el.textContent = '已选 ' + (this.selected[zi] || []).length;
    });
    document.getElementById('bet-info').textContent = '已选满，可手选开奖';
  },

  // ====== 开奖 ======
  generateWinningNumbers() {
    const meta = getLotteryMeta(STATE.currentLottery);
    const result = {};
    meta.zones.forEach(z => {
      let count = z.count;
      if (STATE.currentLottery === 'kl8') count = 20;
      if (z.repeatable) {
        const arr = [];
        for (let i = 0; i < count; i++)
          arr.push(z.min + Math.floor(Math.random() * (z.max - z.min + 1)));
        result[z.name] = arr;
      } else {
        const pool = [];
        for (let n = z.min; n <= z.max; n++) pool.push(n);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        result[z.name] = sortNums(pool.slice(0, count));
      }
    });
    return result;
  },

  doDraw() {
    const count = parseInt(document.getElementById('draw-count').value) || 1;
    for (let i = 0; i < count; i++) {
      const winning = this.generateWinningNumbers();
      const record = {
        issue: this.generateIssueNumber(),
        winningNumbers: winning,
        date: fmtDate()
      };
      STATE.drawData[STATE.currentLottery].push(record);
    }
    saveState();
    this.showLatestDraw();
    this.renderHistory();
  },

  doManualDraw() {
    const hasSelection = Object.values(this.selected).some(a => a.length > 0);
    if (!hasSelection) {
      alert('请先在选号区选择号码！');
      return;
    }
    const meta = getLotteryMeta(STATE.currentLottery);
    let allFull = true;
    meta.zones.forEach((z, zi) => {
      let target = z.count;
      if (STATE.currentLottery === 'kl8') target = 20;
      if ((this.selected[zi] || []).length !== target) allFull = false;
    });
    if (!allFull) {
      alert('请选满所有区域的号码！');
      return;
    }
    const manual = {};
    meta.zones.forEach((z, zi) => {
      manual[z.name] = sortNums(this.selected[zi].slice());
    });
    const record = { issue: this.generateIssueNumber(), winningNumbers: manual, date: fmtDate() };
    STATE.drawData[STATE.currentLottery].push(record);
    saveState();
    this.showLatestDraw();
    this.renderHistory();
  },

  generateIssueNumber() {
    const records = STATE.drawData[STATE.currentLottery] || [];
    return String(new Date().getFullYear()) + String(records.length + 1).padStart(4, '0');
  },

  showLatestDraw() {
    const records = STATE.drawData[STATE.currentLottery];
    const container = document.getElementById('latest-draw');
    if (!records || records.length === 0) {
      container.innerHTML = '<div class="placeholder-text">暂无开奖记录，点击上方按钮开始模拟</div>';
      return;
    }
    const last = records[records.length - 1];
    container.innerHTML = `
      <div class="draw-latest-header">
        <span class="draw-latest-title">最新开奖</span>
        <span class="draw-latest-meta">期号 ${last.issue} | ${last.date}</span>
      </div>
      <div class="draw-latest-numbers">${this.renderWinningHTML(last.winningNumbers)}</div>`;
  },

  renderWinningHTML(nums) {
    const meta = getLotteryMeta(STATE.currentLottery);
    let html = '';
    for (const [zoneName, numbers] of Object.entries(nums)) {
      const z = meta.zones.find(z => z.name === zoneName);
      const color = z ? z.color : 'red';
      html += `<div class="draw-zone">
        <span class="draw-zone-label">${zoneName}</span>
        <div class="draw-balls">
          ${numbers.map(n => `<span class="number-ball large ${color}">${String(n).padStart(2,'0')}</span>`).join('')}
        </div></div>`;
    }
    return html;
  },

  // ====== 历史记录 ======
  renderHistory() {
    const records = STATE.drawData[STATE.currentLottery] || [];
    const container = document.getElementById('draw-history');
    if (records.length === 0) {
      container.innerHTML = '<div class="placeholder-text">暂无历史开奖记录</div>';
      return;
    }
    const meta = getLotteryMeta(STATE.currentLottery);
    let html = '<table class="draw-history-table"><thead><tr><th>期号</th><th>开奖号码</th><th>日期</th><th>操作</th></tr></thead><tbody>';
    const show = records.slice().reverse();
    show.forEach((r, displayIdx) => {
      const actualIdx = records.length - 1 - displayIdx;
      let numsHTML = '';
      for (const [zoneName, numbers] of Object.entries(r.winningNumbers)) {
        const z = meta.zones.find(z => z.name === zoneName);
        const color = z ? z.color : 'red';
        numsHTML += numbers.map(n => `<span class="number-ball small ${color}">${n}</span>`).join('');
      }
      html += `<tr><td>${r.issue}</td><td>${numsHTML}</td><td>${r.date}</td>
        <td><button class="btn-row-delete" data-idx="${actualIdx}">删除</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    container.querySelectorAll('.btn-row-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.drawData[STATE.currentLottery].splice(parseInt(btn.dataset.idx), 1);
        saveState();
        this.showLatestDraw();
        this.renderHistory();
      });
    });
  },

  // ====== CSV ======
  exportCSV() {
    const records = STATE.drawData[STATE.currentLottery] || [];
    if (records.length === 0) { alert('没有数据可导出'); return; }
    const meta = getLotteryMeta(STATE.currentLottery);
    let csv = '期号,';
    meta.zones.forEach(z => csv += z.name + ',');
    csv += '日期\n';
    records.forEach(r => {
      csv += r.issue + ',';
      meta.zones.forEach(z => csv += (r.winningNumbers[z.name] || []).join(' ') + ',');
      csv += r.date + '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `draw_${STATE.currentLottery}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  importCSV() { this.importFileInput.click(); },

  handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
      if (lines.length < 2) { alert('文件格式错误'); return; }
      const meta = getLotteryMeta(STATE.currentLottery);
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const record = { issue: cols[0].trim(), winningNumbers: {}, date: cols[cols.length-1] ? cols[cols.length-1].trim() : fmtDate() };
        meta.zones.forEach((z, zi) => {
          const nums = (cols[1 + zi] || '').trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
          record.winningNumbers[z.name] = z.sorted ? sortNums(nums) : nums;
        });
        imported.push(record);
      }
      STATE.drawData[STATE.currentLottery] = STATE.drawData[STATE.currentLottery].concat(imported);
      saveState();
      this.showLatestDraw();
      this.renderHistory();
      alert(`成功导入 ${imported.length} 条记录`);
    };
    reader.readAsText(file);
    this.importFileInput.value = '';
  },

  clearCurrent() {
    if (!confirm(`确定清空 ${getLotteryMeta(STATE.currentLottery).name} 的全部开奖数据？`)) return;
    STATE.drawData[STATE.currentLottery] = [];
    saveState();
    this.showLatestDraw();
    this.renderHistory();
  },

  refreshAll() {
    this.showLatestDraw();
    this.renderHistory();
  }
};

try { DrawModule.init(); } catch(e) { console.error('DrawModule init error:', e); }
