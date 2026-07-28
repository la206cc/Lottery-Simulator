/**
 * 投注模拟配置编辑器 - 前端逻辑
 */

// 全局状态
let currentLotteryConfig = null;
let currentBetConfig = null;
let userBetConfigs = {};

// DOM元素缓存
const elements = {};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    bindEvents();
    loadLotteryConfig();
});

// 初始化DOM元素引用
function initElements() {
    elements.lotteryName = document.getElementById('current-lottery-name');
    elements.configInfo = document.getElementById('current-config-info');
    elements.stats = {
        totalBets: document.getElementById('stat-total-bets'),
        totalCost: document.getElementById('stat-total-cost'),
        avgMultiplier: document.getElementById('stat-avg-multiplier'),
        complexRatio: document.getElementById('stat-complex-ratio')
    };
}

// 绑定事件
function bindEvents() {
    // 选项卡切换
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // 保存按钮
    document.getElementById('btn-save-bet-config').addEventListener('click', saveBetConfig);

    // 表单变化监听
    document.querySelectorAll('input[type="number"], select').forEach(input => {
        input.addEventListener('change', updatePreview);
        input.addEventListener('input', updatePreview);
    });
}

// 加载彩票配置
async function loadLotteryConfig() {
    try {
        // 从URL参数获取配置ID，如果没有则从localStorage获取
        const urlParams = new URLSearchParams(window.location.search);
        let configId = urlParams.get('config');
        
        if (!configId) {
            configId = localStorage.getItem('current_lottery_config_id');
        }
        
        if (!configId) {
            configId = 'ssq'; // 默认加载双色球
        }

        let config = null;
        let isPreset = false;

        // 尝试从预设加载
        try {
            const response = await fetch(`../../data/presets/${configId}.json`);
            if (response.ok) {
                config = await response.json();
                isPreset = true;
            }
        } catch (e) {
            // 预设不存在，继续尝试用户配置
        }

        // 尝试从用户配置加载
        if (!config) {
            const savedUserConfigs = JSON.parse(localStorage.getItem('lottery_user_configs') || '{}');
            if (savedUserConfigs[configId]) {
                config = savedUserConfigs[configId];
                isPreset = false;
            }
        }

        if (!config) {
            throw new Error('未找到配置');
        }

        currentLotteryConfig = config;

        // 更新界面显示
        elements.lotteryName.textContent = currentLotteryConfig.name || '未知彩票';
        const configType = isPreset ? '预设' : '自定义';
        elements.configInfo.textContent = `配置ID: ${currentLotteryConfig.id} | 类型: ${configType} | 单价: ¥${currentLotteryConfig.pricePerBet}`;

        // 加载投注配置
        loadBetConfig(currentLotteryConfig);

    } catch (error) {
        console.error('加载配置失败:', error);
        elements.lotteryName.textContent = '加载失败';
        elements.configInfo.textContent = error.message;
    }
}

// 加载投注配置
function loadBetConfig(lotteryConfig) {
    // 如果配置中有betType字段，则使用它
    if (lotteryConfig.betType) {
        currentBetConfig = {
            betType: lotteryConfig.betType,
            multiplier: lotteryConfig.multiplier || {},
            userBehavior: lotteryConfig.userBehavior || {},
            numberFeature: lotteryConfig.numberFeature || {},
            sales: lotteryConfig.sales || {},
            limits: lotteryConfig.limits || {}
        };
    } else {
        // 使用默认配置
        currentBetConfig = getDefaultBetConfig();
    }

    // 填充表单
    populateForm(currentBetConfig);
    updatePreview();
}

// 获取默认投注配置
function getDefaultBetConfig() {
    return {
        betType: {
            singleRatio: 0.60,
            complexRatio: 0.30,
            danTuoRatio: 0.10,
            complexRed7Ratio: 0.50,
            complexRed8Ratio: 0.25,
            complexRed9Ratio: 0.15,
            complexRed10PlusRatio: 0.10,
            dan1Tuo5Ratio: 0.70,
            dan2Tuo4Ratio: 0.25,
            dan3Tuo3Ratio: 0.05
        },
        multiplier: {
            ratio1x: 0.75,
            ratio2_5x: 0.20,
            ratio6_20x: 0.045,
            ratio20xPlus: 0.005,
            maxMultiplier: 100
        },
        userBehavior: {
            highFreqRatio: 0.12,
            midFreqRatio: 0.38,
            lowFreqRatio: 0.50,
            randomSelectRatio: 0.30,
            birthdaySelectRatio: 0.35,
            trendSelectRatio: 0.25,
            fixedSelectRatio: 0.10
        },
        numberFeature: {
            hotNumbers: [1, 5, 6, 8, 9],
            coldNumbers: [3, 4, 7, 13],
            hotBonus: 0.10,
            coldPenalty: 0.08,
            birthdayRange: [1, 31],
            zoneDistEven: 0.50,
            zoneDistMild: 0.30,
            zoneDistSevere: 0.18,
            zoneDistEmpty: 0.02,
            oddEvenBalanced: 0.70,
            oddEvenSkewed: 0.25,
            oddEvenExtreme: 0.05,
            sumMiddleRatio: 0.70,
            sumLowRatio: 0.15,
            sumHighRatio: 0.15
        },
        sales: {
            baseSales: 10000,
            fluctuation: 0.10,
            trend: 'stable',
            trendRate: 0
        },
        limits: {
            maxBetsPerIssue: 10000,
            maxAmountPerBet: 10000,
            maxAmountPerIssue: 10000
        }
    };
}

// 填充表单
function populateForm(config) {
    // 投注类型
    if (config.betType) {
        setInputValue('bet-single-ratio', config.betType.singleRatio);
        setInputValue('bet-complex-ratio', config.betType.complexRatio);
        setInputValue('bet-dantuo-ratio', config.betType.danTuoRatio);
        setInputValue('complex-red7-ratio', config.betType.complexRed7Ratio);
        setInputValue('complex-red8-ratio', config.betType.complexRed8Ratio);
        setInputValue('complex-red9-ratio', config.betType.complexRed9Ratio);
        setInputValue('complex-red10plus-ratio', config.betType.complexRed10PlusRatio);
        setInputValue('dan1-tuo5-ratio', config.betType.dan1Tuo5Ratio);
        setInputValue('dan2-tuo4-ratio', config.betType.dan2Tuo4Ratio);
        setInputValue('dan3-tuo3-ratio', config.betType.dan3Tuo3Ratio);
    }

    // 倍数配置
    if (config.multiplier) {
        setInputValue('mult-1x-ratio', config.multiplier.ratio1x);
        setInputValue('mult-2-5x-ratio', config.multiplier.ratio2_5x);
        setInputValue('mult-6-20x-ratio', config.multiplier.ratio6_20x);
        setInputValue('mult-20x-plus-ratio', config.multiplier.ratio20xPlus);
        setInputValue('max-multiplier', config.multiplier.maxMultiplier);
    }

    // 用户行为
    if (config.userBehavior) {
        setInputValue('high-freq-ratio', config.userBehavior.highFreqRatio);
        setInputValue('mid-freq-ratio', config.userBehavior.midFreqRatio);
        setInputValue('low-freq-ratio', config.userBehavior.lowFreqRatio);
        setInputValue('random-select-ratio', config.userBehavior.randomSelectRatio);
        setInputValue('birthday-select-ratio', config.userBehavior.birthdaySelectRatio);
        setInputValue('trend-select-ratio', config.userBehavior.trendSelectRatio);
        setInputValue('fixed-select-ratio', config.userBehavior.fixedSelectRatio);
    }

    // 号码特征
    if (config.numberFeature) {
        document.getElementById('hot-numbers').value = (config.numberFeature.hotNumbers || []).join(',');
        document.getElementById('cold-numbers').value = (config.numberFeature.coldNumbers || []).join(',');
        setInputValue('hot-bonus', config.numberFeature.hotBonus);
        setInputValue('cold-penalty', config.numberFeature.coldPenalty);
        setInputValue('birthday-min', config.numberFeature.birthdayRange ? config.numberFeature.birthdayRange[0] : 1);
        setInputValue('birthday-max', config.numberFeature.birthdayRange ? config.numberFeature.birthdayRange[1] : 31);
        setInputValue('zone-dist-even', config.numberFeature.zoneDistEven);
        setInputValue('zone-dist-mild', config.numberFeature.zoneDistMild);
        setInputValue('zone-dist-severe', config.numberFeature.zoneDistSevere);
        setInputValue('zone-dist-empty', config.numberFeature.zoneDistEmpty);
        setInputValue('odd-even-balanced', config.numberFeature.oddEvenBalanced);
        setInputValue('odd-even-skewed', config.numberFeature.oddEvenSkewed);
        setInputValue('odd-even-extreme', config.numberFeature.oddEvenExtreme);
        setInputValue('sum-middle-ratio', config.numberFeature.sumMiddleRatio);
        setInputValue('sum-low-ratio', config.numberFeature.sumLowRatio);
        setInputValue('sum-high-ratio', config.numberFeature.sumHighRatio);
    }

    // 销量配置
    if (config.sales) {
        setInputValue('base-sales', config.sales.baseSales);
        setInputValue('sales-fluctuation', config.sales.fluctuation);
        document.getElementById('sales-trend').value = config.sales.trend || 'stable';
        setInputValue('trend-rate', config.sales.trendRate);
    }

    // 限制配置
    if (config.limits) {
        setInputValue('max-bets-per-issue', config.limits.maxBetsPerIssue);
        setInputValue('max-amount-per-bet', config.limits.maxAmountPerBet);
        setInputValue('max-amount-per-issue', config.limits.maxAmountPerIssue);
    }
}

// 设置输入框值
function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
        element.value = value;
    }
}

// 获取输入框值
function getInputValue(id, defaultValue = 0) {
    const element = document.getElementById(id);
    return element ? parseFloat(element.value) || defaultValue : defaultValue;
}

// 更新预览
function updatePreview() {
    // 从表单收集数据
    const betType = {
        singleRatio: getInputValue('bet-single-ratio'),
        complexRatio: getInputValue('bet-complex-ratio'),
        danTuoRatio: getInputValue('bet-dantuo-ratio'),
        complexRed7Ratio: getInputValue('complex-red7-ratio'),
        complexRed8Ratio: getInputValue('complex-red8-ratio'),
        complexRed9Ratio: getInputValue('complex-red9-ratio'),
        complexRed10PlusRatio: getInputValue('complex-red10plus-ratio'),
        dan1Tuo5Ratio: getInputValue('dan1-tuo5-ratio'),
        dan2Tuo4Ratio: getInputValue('dan2-tuo4-ratio'),
        dan3Tuo3Ratio: getInputValue('dan3-tuo3-ratio')
    };

    const multiplier = {
        ratio1x: getInputValue('mult-1x-ratio'),
        ratio2_5x: getInputValue('mult-2-5x-ratio'),
        ratio6_20x: getInputValue('mult-6-20x-ratio'),
        ratio20xPlus: getInputValue('mult-20x-plus-ratio'),
        maxMultiplier: getInputValue('max-multiplier', 100)
    };

    const userBehavior = {
        highFreqRatio: getInputValue('high-freq-ratio'),
        midFreqRatio: getInputValue('mid-freq-ratio'),
        lowFreqRatio: getInputValue('low-freq-ratio'),
        randomSelectRatio: getInputValue('random-select-ratio'),
        birthdaySelectRatio: getInputValue('birthday-select-ratio'),
        trendSelectRatio: getInputValue('trend-select-ratio'),
        fixedSelectRatio: getInputValue('fixed-select-ratio')
    };

    const numberFeature = {
        hotNumbers: document.getElementById('hot-numbers').value.split(',').map(Number).filter(n => !isNaN(n)),
        coldNumbers: document.getElementById('cold-numbers').value.split(',').map(Number).filter(n => !isNaN(n)),
        hotBonus: getInputValue('hot-bonus'),
        coldPenalty: getInputValue('cold-penalty'),
        birthdayRange: [getInputValue('birthday-min', 1), getInputValue('birthday-max', 31)],
        zoneDistEven: getInputValue('zone-dist-even'),
        zoneDistMild: getInputValue('zone-dist-mild'),
        zoneDistSevere: getInputValue('zone-dist-severe'),
        zoneDistEmpty: getInputValue('zone-dist-empty'),
        oddEvenBalanced: getInputValue('odd-even-balanced'),
        oddEvenSkewed: getInputValue('odd-even-skewed'),
        oddEvenExtreme: getInputValue('odd-even-extreme'),
        sumMiddleRatio: getInputValue('sum-middle-ratio'),
        sumLowRatio: getInputValue('sum-low-ratio'),
        sumHighRatio: getInputValue('sum-high-ratio')
    };

    const sales = {
        baseSales: getInputValue('base-sales', 10000),
        fluctuation: getInputValue('sales-fluctuation'),
        trend: document.getElementById('sales-trend').value,
        trendRate: getInputValue('trend-rate')
    };

    const limits = {
        maxBetsPerIssue: getInputValue('max-bets-per-issue'),
        maxAmountPerBet: getInputValue('max-amount-per-bet'),
        maxAmountPerIssue: getInputValue('max-amount-per-issue')
    };

    // 更新当前配置
    currentBetConfig = { betType, multiplier, userBehavior, numberFeature, sales, limits };

    // 计算平均倍数
    const avgMultiplier = calculateAverageMultiplier(multiplier);
    document.getElementById('avg-multiplier').value = avgMultiplier.toFixed(1);

    // 更新统计信息
    updateStats(betType, multiplier);

    // 更新预览区域
    updatePreviewSection(betType, multiplier, avgMultiplier);
}

// 计算平均倍数
function calculateAverageMultiplier(multiplier) {
    const avg = (multiplier.ratio1x * 1) +
                (multiplier.ratio2_5x * 3.5) +
                (multiplier.ratio6_20x * 13) +
                (multiplier.ratio20xPlus * 30);
    return Math.min(avg, multiplier.maxMultiplier);
}

// 更新统计信息
function updateStats(betType, multiplier) {
    if (!currentLotteryConfig) return;

    const baseSales = currentBetConfig.sales ? currentBetConfig.sales.baseSales : 10000;
    const avgMultiplier = calculateAverageMultiplier(multiplier);
    const pricePerBet = currentLotteryConfig.pricePerBet || 2;

    const totalBets = baseSales;
    const totalCost = totalBets * pricePerBet * avgMultiplier;
    const complexRatio = betType.complexRatio + betType.danTuoRatio;

    elements.stats.totalBets.textContent = totalBets.toLocaleString();
    elements.stats.totalCost.textContent = `¥${(totalCost / 10000).toFixed(1)}万`;
    elements.stats.avgMultiplier.textContent = `${avgMultiplier.toFixed(1)}x`;
    elements.stats.complexRatio.textContent = `${(complexRatio * 100).toFixed(0)}%`;
}

// 更新预览区域
function updatePreviewSection(betType, multiplier, avgMultiplier) {
    document.getElementById('preview-single').textContent = `${(betType.singleRatio * 100).toFixed(0)}%`;
    document.getElementById('preview-complex').textContent = `${(betType.complexRatio * 100).toFixed(0)}%`;
    document.getElementById('preview-dantuo').textContent = `${(betType.danTuoRatio * 100).toFixed(0)}%`;
    document.getElementById('preview-avg-mult').textContent = `${avgMultiplier.toFixed(1)}x`;

    // 生成投注示例
    generateBetExample(betType, multiplier);
}

// 生成投注示例
function generateBetExample(betType, multiplier) {
    const exampleDiv = document.getElementById('bet-example');

    if (!currentLotteryConfig) {
        exampleDiv.innerHTML = '<p>加载配置后将显示模拟投注示例</p>';
        return;
    }

    // 生成示例投注
    const betTypes = [];
    if (betType.singleRatio > 0) betTypes.push('单式');
    if (betType.complexRatio > 0) betTypes.push('复式');
    if (betType.danTuoRatio > 0) betTypes.push('胆拖');

    const betTypeStr = betTypes.join(' / ') || '无';

    // 生成示例号码
    const exampleNumbers = generateExampleNumbers();

    exampleDiv.innerHTML = `
        <p><strong>投注类型:</strong> ${betTypeStr}</p>
        <p><strong>示例号码:</strong> ${exampleNumbers}</p>
        <p><strong>倍数:</strong> ${Math.ceil(avgMultiplier)}x</p>
        <p><strong>单注金额:</strong> ¥${currentLotteryConfig.pricePerBet * Math.ceil(avgMultiplier)}</p>
    `;
}

// 生成示例号码
function generateExampleNumbers() {
    if (!currentLotteryConfig || !currentLotteryConfig.zones) {
        return '未配置';
    }

    const parts = [];
    for (const zone of currentLotteryConfig.zones) {
        const numbers = [];
        for (let i = 0; i < zone.count; i++) {
            numbers.push(Math.floor(Math.random() * (zone.max - zone.min + 1)) + zone.min);
        }
        parts.push(numbers.sort((a, b) => a - b).join(', '));
    }

    return parts.join(' | ');
}

// 保存投注配置
function saveBetConfig() {
    if (!currentLotteryConfig) {
        alert('请先加载彩票配置');
        return;
    }

    // 收集表单数据
    updatePreview();

    // 合并到彩票配置
    const lotteryConfig = { ...currentLotteryConfig };
    lotteryConfig.betType = currentBetConfig.betType;
    lotteryConfig.multiplier = currentBetConfig.multiplier;
    lotteryConfig.userBehavior = currentBetConfig.userBehavior;
    lotteryConfig.numberFeature = currentBetConfig.numberFeature;
    lotteryConfig.sales = currentBetConfig.sales;
    lotteryConfig.limits = currentBetConfig.limits;

    // 保存到localStorage
    const savedConfigs = JSON.parse(localStorage.getItem('lottery_user_configs') || '{}');
    savedConfigs[currentLotteryConfig.id] = lotteryConfig;
    localStorage.setItem('lottery_user_configs', JSON.stringify(savedConfigs));

    // 更新当前配置ID
    localStorage.setItem('current_lottery_config_id', currentLotteryConfig.id);

    alert('投注配置保存成功！');
    
    // 更新按钮状态
    const saveBtn = document.getElementById('btn-save-bet-config');
    saveBtn.textContent = '✓ 已保存';
    saveBtn.style.backgroundColor = '#4caf50';
    setTimeout(() => {
        saveBtn.textContent = '保存配置';
        saveBtn.style.backgroundColor = '';
    }, 2000);
}

// 页面加载时从URL参数获取配置
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const configId = urlParams.get('config');
    if (configId) {
        loadLotteryConfig();
    }
});
