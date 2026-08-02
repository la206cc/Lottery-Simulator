/*
 * V3.0 彩票模拟器 - 数据分析模块
 */

const AnalysisModule = {
  charts: {},

  init() {
    // 延迟初始化，Tab激活时才渲染
  },

  onLotteryChange(id) {
    if (STATE.currentTab === 'analysis') this.refresh();
  },

  refresh() {
    this.destroyCharts();
    if (STATE.currentTab !== 'analysis') return;

    const records = STATE.drawData[STATE.currentLottery] || [];
    if (records.length === 0) {
      this.showEmpty();
      return;
    }
    this.renderFrequency(records);
    this.renderMissing(records);
    this.renderTrend(records);
    this.renderOddEven(records);
    this.renderPrizeDist(records);
  },

  destroyCharts() {
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    this.charts = {};
  },

  showEmpty() {
    ['freq-chart', 'missing-chart', 'trend-chart', 'odd-even-chart', 'prize-chart'].forEach(id => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#5a6380';
      ctx.textAlign = 'center';
      ctx.fillText('暂无开奖数据', canvas.width / 2, canvas.height / 2);
    });
  },

  // ====== 频率分析 ======
  renderFrequency(records) {
    const meta = getLotteryMeta(STATE.currentLottery);
    if (!meta) return;

    const zone = meta.zones[0];
    const freq = {};
    for (let n = zone.min; n <= zone.max; n++) freq[n] = 0;

    records.forEach(r => {
      const nums = r.winningNumbers[zone.name] || [];
      nums.forEach(n => { if (freq[n] !== undefined) freq[n]++; });
    });

    const labels = Object.keys(freq);
    const data = Object.values(freq);

    this.charts.freq = new Chart(document.getElementById('freq-chart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '出现次数',
          data,
          backgroundColor: data.map(v => {
            const max = Math.max(...data);
            return v >= max * 0.8 ? '#e94560' : v <= max * 0.3 ? '#3498db' : '#5a6380';
          })
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8892b0', font: { size: 10 } }, grid: { color: '#0f3460' } },
          y: { ticks: { color: '#8892b0' }, grid: { color: '#0f3460' } }
        }
      }
    });
  },

  // ====== 遗漏分析 ======
  renderMissing(records) {
    const meta = getLotteryMeta(STATE.currentLottery);
    if (!meta) return;

    const zone = meta.zones[0];
    const lastSeen = {};
    for (let n = zone.min; n <= zone.max; n++) lastSeen[n] = records.length;

    for (let i = records.length - 1; i >= 0; i--) {
      const nums = records[i].winningNumbers[zone.name] || [];
      nums.forEach(n => {
        if (lastSeen[n] === records.length) lastSeen[n] = records.length - 1 - i;
      });
    }

    const labels = Object.keys(lastSeen);
    const data = Object.values(lastSeen);

    this.charts.missing = new Chart(document.getElementById('missing-chart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '遗漏期数',
          data,
          backgroundColor: data.map(v => v > 10 ? '#e94560' : v > 5 ? '#f39c12' : '#2ecc71')
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8892b0', font: { size: 10 } }, grid: { color: '#0f3460' } },
          y: { ticks: { color: '#8892b0' }, grid: { color: '#0f3460' } }
        }
      }
    });
  },

  // ====== 趋势分析 (和值) ======
  renderTrend(records) {
    const meta = getLotteryMeta(STATE.currentLottery);
    if (!meta) return;

    const sums = records.map(r => {
      const zone = meta.zones[0];
      const nums = r.winningNumbers[zone.name] || [];
      return nums.reduce((a, b) => a + b, 0);
    });

    const labels = records.map((r, i) => r.issue || ('#' + (i + 1)));
    const display = labels.length > 30 ? labels.slice(-30) : labels;
    const displayData = sums.length > 30 ? sums.slice(-30) : sums;

    this.charts.trend = new Chart(document.getElementById('trend-chart'), {
      type: 'line',
      data: {
        labels: display,
        datasets: [{
          label: '和值',
          data: displayData,
          borderColor: '#e94560',
          backgroundColor: 'rgba(233,69,96,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8892b0', font: { size: 9 } }, grid: { color: '#0f3460' } },
          y: { ticks: { color: '#8892b0' }, grid: { color: '#0f3460' } }
        }
      }
    });
  },

  // ====== 奇偶分布 ======
  renderOddEven(records) {
    const meta = getLotteryMeta(STATE.currentLottery);
    if (!meta) return;

    let odd = 0, even = 0, big = 0, small = 0;
    records.forEach(r => {
      const zone = meta.zones[0];
      const nums = r.winningNumbers[zone.name] || [];
      const mid = Math.floor((zone.min + zone.max) / 2);
      nums.forEach(n => {
        if (n % 2 === 0) even++; else odd++;
        if (n > mid) big++; else small++;
      });
    });

    this.charts.oddEven = new Chart(document.getElementById('odd-even-chart'), {
      type: 'doughnut',
      data: {
        labels: ['奇数', '偶数'],
        datasets: [{
          data: [odd, even],
          backgroundColor: ['#e94560', '#3498db']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8892b0', font: { size: 11 } }
          }
        }
      }
    });
  },

  // ====== 中奖分布 ======
  renderPrizeDist(records) {
    if (!STATE.simResults || !STATE.simResults.summary) {
      const canvas = document.getElementById('prize-chart');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#5a6380';
      ctx.textAlign = 'center';
      ctx.fillText('请先在投注模拟中执行模拟', canvas.width / 2, canvas.height / 2);
      return;
    }

    const summary = STATE.simResults.summary;
    const dist = summary.prize_distribution || {};

    this.charts.prize = new Chart(document.getElementById('prize-chart'), {
      type: 'bar',
      data: {
        labels: Object.keys(dist).map(k => k + '等'),
        datasets: [{
          label: '中奖注数',
          data: Object.values(dist),
          backgroundColor: '#e94560'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8892b0' }, grid: { color: '#0f3460' } },
          y: { ticks: { color: '#8892b0' }, grid: { color: '#0f3460' } }
        }
      }
    });
  }
};

// 初始化
try { AnalysisModule.init(); } catch(e) { console.error('AnalysisModule init error:', e); }
