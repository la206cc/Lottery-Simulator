/**
 * 彩票模拟器 - 前端逻辑
 */

// API 基础地址
const API_BASE_URL = 'http://localhost:5000/api';

// 全局状态
let currentConfig = null;
let simulationResult = null;
let isSimulating = false;

// DOM 元素缓存
const elements = {};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    loadPresets();
});

// 初始化 DOM 元素引用
function initElements() {
    elements.lotterySelect = document.getElementById('lottery-select');
    elements.numRounds = document.getElementById('num-rounds');
    elements.initialCapital = document.getElementById('initial-capital');
    elements.initialPool = document.getElementById('initial-pool');
    elements.btnSimulate = document.getElementById('btn-start-simulate');
    elements.progressContainer = document.getElementById('progress-container');
    elements.progressFill = document.getElementById('progress-fill');
    elements.progressText = document.getElementById('progress-text');
    elements.resultsSection = document.getElementById('results-section');
    elements.summaryCards = document.getElementById('summary-cards');
    elements.resultTbody = document.getElementById('result-tbody');
}

// 加载预设配置列表
async function loadPresets() {
    try {
        const response = await fetch(`${API_BASE_URL}/presets`);
        const data = await response.json();

        if (data.success && data.data) {
            // 清空下拉框
            elements.lotterySelect.innerHTML = '<option value="">-- 请选择彩种 --</option>';

            // 添加预设选项
            data.data.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.id;
                option.textContent = `${preset.name} (${preset.id})`;
                elements.lotterySelect.appendChild(option);
            });

            // 尝试从 localStorage 恢复上次选择
            const lastConfigId = localStorage.getItem('current_lottery_config_id');
            if (lastConfigId) {
                elements.lotterySelect.value = lastConfigId;
                loadConfig(lastConfigId);
            }
        } else {
            console.error('加载预设失败:', data.error);
            // 使用默认列表
            loadDefaultPresets();
        }
    } catch (error) {
        console.error('API 请求失败:', error);
        // API 不可用时使用默认列表
        loadDefaultPresets();
    }
}

// 加载默认预设列表（API 不可用时）
function loadDefaultPresets() {
    const defaultPresets = [
        { id: 'ssq', name: '双色球' },
        { id: 'dlt', name: '超级大乐透' },
        { id: 'fc3d', name: '福彩3D' },
        { id: 'qxc', name: '七星彩' },
        { id: 'pls', name: '排列三' },
        { id: 'plw', name: '排列五' },
        { id: 'qlc', name: '七乐彩' },
        { id: 'kl8', name: '快乐8' }
    ];

    elements.lotterySelect.innerHTML = '<option value="">-- 请选择彩种 --</option>';
    defaultPresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = `${preset.name} (${preset.id})`;
        elements.lotterySelect.appendChild(option);
    });
}

// 加载配置
async function loadConfig(configId) {
    if (!configId) {
        currentConfig = null;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/config/${configId}`);
        const data = await response.json();

        if (data.success && data.data) {
            currentConfig = data.data;
            console.log('配置加载成功:', currentConfig.name);
        } else {
            console.error('加载配置失败:', data.error);
        }
    } catch (error) {
        console.error('加载配置失败:', error);
    }
}

// 开始模拟
async function startSimulation() {
    if (isSimulating) return;

    // 获取参数
    const configId = elements.lotterySelect.value;
    const numRounds = parseInt(elements.numRounds.value);
    const initialCapital = parseFloat(elements.initialCapital.value);
    const initialPool = parseFloat(elements.initialPool.value);
    const strategy = document.querySelector('input[name="strategy"]:checked')?.value || 'random';
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'single_draw';

    // 参数验证
    if (!configId) {
        alert('请选择彩种');
        return;
    }

    if (isNaN(numRounds) || numRounds < 1 || numRounds > 1000000) {
        alert('模拟轮次必须在 1 到 1,000,000 之间');
        return;
    }

    if (isNaN(initialCapital) || initialCapital < 0) {
        alert('初始资金不能为负数');
        return;
    }

    if (isNaN(initialPool) || initialPool < 0) {
        alert('初始奖池不能为负数');
        return;
    }

    // 保存选择
    localStorage.setItem('current_lottery_config_id', configId);

    // 开始模拟
    isSimulating = true;
    updateUIState(true);
    showProgress(true);
    updateProgress(0, '准备模拟...');

    try {
        // 构建策略对象
        let strategyObj = null;
        if (strategy === 'fixed') {
            // 固定号码策略：使用随机生成的一组号码
            strategyObj = {
                name: 'fixed',
                params: {}
            };
        } else if (strategy === 'hot_numbers') {
            strategyObj = {
                name: 'hot_numbers',
                params: {}
            };
        }

        updateProgress(20, '正在执行模拟...');

        // 调用 API
        const response = await fetch(`${API_BASE_URL}/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config_id: configId,
                num_rounds: numRounds,
                initial_pool: initialPool,
                initial_capital: initialCapital,
                strategy: strategyObj,
                mode: mode
            })
        });

        updateProgress(80, '正在处理结果...');

        const data = await response.json();

        if (data.success && data.data) {
            simulationResult = data.data.result;
            currentConfig = data.data.config;

            updateProgress(100, '模拟完成！');

            // 显示结果
            setTimeout(() => {
                showResults(simulationResult);
                showProgress(false);
            }, 500);
        } else {
            throw new Error(data.error || '模拟失败');
        }
    } catch (error) {
        console.error('模拟失败:', error);
        alert('模拟失败: ' + error.message);
        showProgress(false);
    } finally {
        isSimulating = false;
        updateUIState(false);
    }
}

// 更新 UI 状态
function updateUIState(simulating) {
    elements.btnSimulate.disabled = simulating;
    if (simulating) {
        elements.btnSimulate.classList.add('loading');
    } else {
        elements.btnSimulate.classList.remove('loading');
    }
}

// 显示/隐藏进度条
function showProgress(show) {
    if (show) {
        elements.progressContainer.classList.add('visible');
    } else {
        elements.progressContainer.classList.remove('visible');
    }
}

// 更新进度
function updateProgress(percent, text) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = text;
}

// 显示结果
function showResults(result) {
    if (!result || !result.summary) return;

    const summary = result.summary;
    const isSingleDraw = result.mode === 'single_draw';

    // 处理单次开奖模式的开奖号码显示
    const winningNumberDisplay = document.getElementById('winning-number-display');
    const winningNumbersContent = document.getElementById('winning-numbers-content');

    if (isSingleDraw && result.winning_numbers) {
        // 显示开奖号码区域
        winningNumberDisplay.style.display = 'block';
        winningNumbersContent.innerHTML = formatNumbersLarge(result.winning_numbers);
    } else {
        winningNumberDisplay.style.display = 'none';
    }

    // 更新摘要卡片
    elements.summaryCards.innerHTML = '';

    // 总轮次（投注次数）
    addSummaryCard('投注次数', result.num_rounds || 0, '次', 'neutral');

    // 总投资
    addSummaryCard('总投资', formatMoney(summary.total_investment), '', 'neutral');

    // 总回报
    addSummaryCard('总回报', formatMoney(summary.total_return), '', 'neutral');

    // 净利润
    const netProfit = summary.net_profit || 0;
    const profitClass = netProfit > 0 ? 'positive' : netProfit < 0 ? 'negative' : 'neutral';
    addSummaryCard('净利润', formatMoney(netProfit), '', profitClass);

    // 回报率
    const returnRate = summary.return_rate || 0;
    const rateClass = returnRate > 0 ? 'positive' : returnRate < 0 ? 'negative' : 'neutral';
    addSummaryCard('回报率', (returnRate * 100).toFixed(2), '%', rateClass);

    // 中奖次数
    addSummaryCard('中奖次数', summary.wins || 0, '次', 'neutral');

    // 更新结果表格
    elements.resultTbody.innerHTML = '';

    // 更新表头
    const thead = document.querySelector('#result-table thead tr');
    if (isSingleDraw) {
        thead.innerHTML = `
            <th>序号</th>
            <th>投注号码</th>
            <th>投注金额</th>
            <th>中奖等级</th>
            <th>奖金</th>
            <th>盈亏</th>
        `;
    } else {
        thead.innerHTML = `
            <th>轮次</th>
            <th>开奖号码</th>
            <th>投注号码</th>
            <th>投注金额</th>
            <th>中奖等级</th>
            <th>奖金</th>
            <th>盈亏</th>
        `;
    }

    if (result.rounds && result.rounds.length > 0) {
        // 只显示最近 100 轮
        const displayRounds = result.rounds.slice(-100);

        displayRounds.forEach((round, index) => {
            const tr = document.createElement('tr');
            const isWin = round.prize_amount > 0;
            const profit = (round.prize_amount || 0) - (round.bet_cost || 0);

            if (isSingleDraw) {
                tr.innerHTML = `
                    <td>${round.round || (result.rounds.length - displayRounds.length + index + 1)}</td>
                    <td>${formatNumbers(round.bet_numbers)}</td>
                    <td>¥${(round.bet_cost || 0).toFixed(2)}</td>
                    <td class="${isWin ? 'win' : 'lose'}">${isWin ? (round.prize_level || '中奖') : '未中奖'}</td>
                    <td class="${isWin ? 'win' : 'lose'}">¥${(round.prize_amount || 0).toFixed(2)}</td>
                    <td class="${profit > 0 ? 'win' : profit < 0 ? 'lose' : ''}">${profit > 0 ? '+' : ''}¥${profit.toFixed(2)}</td>
                `;
            } else {
                tr.innerHTML = `
                    <td>${round.round || (result.rounds.length - displayRounds.length + index + 1)}</td>
                    <td>${formatNumbers(round.winning_numbers)}</td>
                    <td>${formatNumbers(round.bet_numbers)}</td>
                    <td>¥${(round.bet_cost || 0).toFixed(2)}</td>
                    <td class="${isWin ? 'win' : 'lose'}">${isWin ? (round.prize_level || '中奖') : '未中奖'}</td>
                    <td class="${isWin ? 'win' : 'lose'}">¥${(round.prize_amount || 0).toFixed(2)}</td>
                    <td class="${profit > 0 ? 'win' : profit < 0 ? 'lose' : ''}">${profit > 0 ? '+' : ''}¥${profit.toFixed(2)}</td>
                `;
            }

            elements.resultTbody.appendChild(tr);
        });
    }

    // 显示结果区域
    elements.resultsSection.classList.add('visible');

    // 滚动到结果区域
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// 添加摘要卡片
function addSummaryCard(label, value, unit, className) {
    const card = document.createElement('div');
    card.className = `summary-card ${className}`;
    card.innerHTML = `
        <div class="card-label">${label}</div>
        <div class="card-value">${value}</div>
        ${unit ? `<div class="card-unit">${unit}</div>` : ''}
    `;
    elements.summaryCards.appendChild(card);
}

// 格式化金额
function formatMoney(amount) {
    if (amount === undefined || amount === null) return '¥0';

    const absAmount = Math.abs(amount);
    if (absAmount >= 100000000) {
        return `¥${(amount / 100000000).toFixed(2)}亿`;
    } else if (absAmount >= 10000) {
        return `¥${(amount / 10000).toFixed(2)}万`;
    } else {
        return `¥${amount.toFixed(2)}`;
    }
}

// 格式化号码显示（HTML）
function formatNumbers(numbersObj) {
    if (!numbersObj) return '--';

    let html = '<div class="number-display">';

    for (const [zoneName, numbers] of Object.entries(numbersObj)) {
        if (Array.isArray(numbers)) {
            numbers.forEach(num => {
                let colorClass = 'red';
                if (zoneName.includes('蓝') || zoneName.includes('后')) {
                    colorClass = 'blue';
                } else if (zoneName.includes('绿')) {
                    colorClass = 'green';
                }
                html += `<span class="number-ball ${colorClass}">${num}</span>`;
            });
        }
    }

    html += '</div>';
    return html;
}

// 格式化号码显示（纯文本）
function formatNumbersText(numbersObj) {
    if (!numbersObj) return '--';

    const parts = [];
    for (const [zoneName, numbers] of Object.entries(numbersObj)) {
        if (Array.isArray(numbers)) {
            parts.push(numbers.join(', '));
        }
    }
    return parts.join(' | ');
}

// 格式化号码显示（大号，用于开奖号码展示）
function formatNumbersLarge(numbersObj) {
    if (!numbersObj) return '';

    let html = '';
    const zones = Object.entries(numbersObj);

    zones.forEach(([zoneName, numbers], zoneIndex) => {
        if (Array.isArray(numbers)) {
            numbers.forEach(num => {
                let colorClass = 'red';
                if (zoneName.includes('蓝') || zoneName.includes('后')) {
                    colorClass = 'blue';
                } else if (zoneName.includes('绿')) {
                    colorClass = 'green';
                }
                html += `<span class="number-ball ${colorClass}">${num}</span>`;
            });

            // 在区域之间添加分隔符
            if (zoneIndex < zones.length - 1) {
                html += '<span class="zone-separator">+</span>';
            }
        }
    });

    return html;
}

// 导出结果
function exportResults() {
    if (!simulationResult) {
        alert('没有可导出的结果');
        return;
    }

    const dataStr = JSON.stringify(simulationResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `simulation_result_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

// 数据分析
function analyzeResults() {
    if (!simulationResult) {
        alert('没有可分析的结果');
        return;
    }

    // 跳转到分析页面（待实现）
    alert('数据分析功能开发中，敬请期待！');
}

// 监听彩种选择变化
document.getElementById('lottery-select').addEventListener('change', (e) => {
    loadConfig(e.target.value);
});
