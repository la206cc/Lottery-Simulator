/**
 * 投注模拟参数配置 - 核心逻辑
 */

// 全局状态
let currentConfig = null;
let currentLottery = 'ssq';

// 默认配置
const defaultConfig = {
    population: {
        lowFreq: 50,
        midFreq: 38,
        highFreq: 12
    },
    betType: {
        low: { single: 82, complex: 8, dantuo: 4 },
        mid: { single: 56, complex: 24, dantuo: 8 },
        high: { single: 18, complex: 32, dantuo: 25 }
    },
    multiplier: {
        low: { x1: 98, x2_5: 2, x6_20: 0, x20plus: 0 },
        mid: { x1: 70, x2_5: 25, x6_20: 4.5, x20plus: 0.5 },
        high: { x1: 42, x2_5: 32, x6_20: 18, x20plus: 8 }
    },
    numberSelection: {
        random: 30,
        selfSelect: 35,
        trendAnalysis: 25,
        fixedNumber: 10
    },
    complexStructure: {
        scaleA: 50,
        scaleB: 30,
        scaleC: 20
    },
    dantuoStructure: {
        comboA: 70,
        comboB: 25,
        comboC: 5
    },
    lotterySpecific: {
        dlt: { addon: 40, noAddon: 60 },
        fc3d: { direct: 55, group6: 30, group3: 8, other: 7 },
        pls: { direct: 55, group6: 30, group3: 8, other: 7 },
        kl8: { low: 25, mid: 60, high: 15 }
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initSliders();
    loadConfig('balanced');
});

// 初始化所有滑块
function initSliders() {
    // 人群结构滑块
    const popSliders = ['pop_low', 'pop_mid', 'pop_high'];
    popSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(popSliders, 'v_');
                updateResults();
            });
        }
    });

    // 低频投注形式滑块
    const lowBetSliders = ['low_s', 'low_r', 'low_dt'];
    lowBetSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(lowBetSliders, 'v_');
                updateResults();
            });
        }
    });

    // 中频投注形式滑块
    const midBetSliders = ['mid_s', 'mid_r', 'mid_dt'];
    midBetSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(midBetSliders, 'v_');
                updateResults();
            });
        }
    });

    // 高频投注形式滑块
    const highBetSliders = ['high_s', 'high_r', 'high_dt'];
    highBetSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(highBetSliders, 'v_');
                updateResults();
            });
        }
    });

    // 低频倍投滑块
    const lowMulSliders = ['low_m1', 'low_m2', 'low_m6'];
    lowMulSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(lowMulSliders, 'v_');
                updateResults();
            });
        }
    });

    // 中频倍投滑块
    const midMulSliders = ['mid_m1', 'mid_m2', 'mid_m6'];
    midMulSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(midMulSliders, 'v_');
                updateResults();
            });
        }
    });

    // 高频倍投滑块
    const highMulSliders = ['high_m1', 'high_m2', 'high_m6'];
    highMulSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(highMulSliders, 'v_');
                updateResults();
            });
        }
    });

    // 选号特征滑块
    const nsSliders = ['ns_random', 'ns_self', 'ns_trend', 'ns_fixed'];
    nsSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(nsSliders, 'v_');
                updateResults();
            });
        }
    });

    // 复式规模滑块
    const csSliders = ['cs_a', 'cs_b', 'cs_c'];
    csSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(csSliders, 'v_');
            });
        }
    });

    // 胆拖组合滑块
    const dcSliders = ['dc_a', 'dc_b', 'dc_c'];
    dcSliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                syncGroup(dcSliders, 'v_');
            });
        }
    });

    // 选项卡切换
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

// 同步组内滑块，保持总和为100
function syncGroup(sliderIds, prefix) {
    let values = sliderIds.map(id => parseFloat(document.getElementById(id).value));
    let sum = values.reduce((a, b) => a + b, 0);

    if (Math.abs(sum - 100) < 0.001) return;

    let diff = 100 - sum;
    let adjustable = values.map((v, i) => ({ index: i, value: v }))
                        .filter(item => item.value > 0)
                        .sort((a, b) => b.value - a.value);

    if (adjustable.length === 0) return;

    let perAdjust = diff / adjustable.length;
    adjustable.forEach(item => {
        let newValue = item.value + perAdjust;
        newValue = Math.max(0, Math.min(100, newValue));
        document.getElementById(sliderIds[item.index]).value = newValue;
    });

    // 显示值
    sliderIds.forEach(id => {
        const value = parseFloat(document.getElementById(id).value);
        document.getElementById(prefix + id).textContent = value.toFixed(2);
    });

    // 更新总和显示
    if (prefix === 'v_') {
        if (sliderIds[0] === 'pop_low') {
            document.getElementById('pop-total').textContent = sum.toFixed(2);
        } else if (sliderIds[0] === 'ns_random') {
            document.getElementById('ns-total').textContent = sum.toFixed(2);
        }
    }
}

// 更新全局汇总结果
function updateResults() {
    // 人群占比
    const popLow = parseFloat(document.getElementById('pop_low').value) / 100;
    const popMid = parseFloat(document.getElementById('pop_mid').value) / 100;
    const popHigh = parseFloat(document.getElementById('pop_high').value) / 100;

    // 投注形式占比
    const lowS = parseFloat(document.getElementById('low_s').value) / 100;
    const lowR = parseFloat(document.getElementById('low_r').value) / 100;
    const lowDt = parseFloat(document.getElementById('low_dt').value) / 100;

    const midS = parseFloat(document.getElementById('mid_s').value) / 100;
    const midR = parseFloat(document.getElementById('mid_r').value) / 100;
    const midDt = parseFloat(document.getElementById('mid_dt').value) / 100;

    const highS = parseFloat(document.getElementById('high_s').value) / 100;
    const highR = parseFloat(document.getElementById('high_r').value) / 100;
    const highDt = parseFloat(document.getElementById('high_dt').value) / 100;

    // 计算全局占比
    const globalS = (popLow * lowS + popMid * midS + popHigh * highS) * 100;
    const globalR = (popLow * lowR + popMid * midR + popHigh * highR) * 100;
    const globalDt = (popLow * lowDt + popMid * midDt + popHigh * highDt) * 100;
    const globalTotal = globalS + globalR + globalDt;

    // 更新显示
    document.getElementById('res_s').textContent = globalS.toFixed(2) + '%';
    document.getElementById('res_r').textContent = globalR.toFixed(2) + '%';
    document.getElementById('res_dt').textContent = globalDt.toFixed(2) + '%';
    document.getElementById('res_total').textContent = globalTotal.toFixed(2) + '%';

    // 倍投分布
    const lowM1 = parseFloat(document.getElementById('low_m1').value) / 100;
    const lowM2 = parseFloat(document.getElementById('low_m2').value) / 100;
    const lowM6 = parseFloat(document.getElementById('low_m6').value) / 100;

    const midM1 = parseFloat(document.getElementById('mid_m1').value) / 100;
    const midM2 = parseFloat(document.getElementById('mid_m2').value) / 100;
    const midM6 = parseFloat(document.getElementById('mid_m6').value) / 100;

    const highM1 = parseFloat(document.getElementById('high_m1').value) / 100;
    const highM2 = parseFloat(document.getElementById('high_m2').value) / 100;
    const highM6 = parseFloat(document.getElementById('high_m6').value) / 100;

    const globalM1 = (popLow * lowM1 + popMid * midM1 + popHigh * highM1) * 100;
    const globalM2 = (popLow * lowM2 + popMid * midM2 + popHigh * highM2) * 100;
    const globalM6 = (popLow * lowM6 + popMid * midM6 + popHigh * highM6) * 100;
    const globalM20 = 100 - globalM1 - globalM2 - globalM6;

    document.getElementById('res_m1').textContent = globalM1.toFixed(2) + '%';
    document.getElementById('res_m2').textContent = globalM2.toFixed(2) + '%';
    document.getElementById('res_m6').textContent = globalM6.toFixed(2) + '%';
    document.getElementById('res_m20').textContent = globalM20.toFixed(2) + '%';

    // 验证配置
    validateConfig();
}

// 验证配置
function validateConfig() {
    const popSum = parseFloat(document.getElementById('pop_low').value) +
                   parseFloat(document.getElementById('pop_mid').value) +
                   parseFloat(document.getElementById('pop_high').value);

    const lowBetSum = parseFloat(document.getElementById('low_s').value) +
                      parseFloat(document.getElementById('low_r').value) +
                      parseFloat(document.getElementById('low_dt').value);

    const midBetSum = parseFloat(document.getElementById('mid_s').value) +
                      parseFloat(document.getElementById('mid_r').value) +
                      parseFloat(document.getElementById('mid_dt').value);

    const highBetSum = parseFloat(document.getElementById('high_s').value) +
                       parseFloat(document.getElementById('high_r').value) +
                       parseFloat(document.getElementById('high_dt').value);

    const nsSum = parseFloat(document.getElementById('ns_random').value) +
                  parseFloat(document.getElementById('ns_self').value) +
                  parseFloat(document.getElementById('ns_trend').value) +
                  parseFloat(document.getElementById('ns_fixed').value);

    const validationMsg = document.getElementById('validation-msg');
    const errors = [];

    if (Math.abs(popSum - 100) > 0.01) errors.push(`人群结构总和应为100%，当前为${popSum.toFixed(2)}%`);
    if (Math.abs(lowBetSum - 100) > 0.01) errors.push(`低频投注形式总和应为100%，当前为${lowBetSum.toFixed(2)}%`);
    if (Math.abs(midBetSum - 100) > 0.01) errors.push(`中频投注形式总和应为100%，当前为${midBetSum.toFixed(2)}%`);
    if (Math.abs(highBetSum - 100) > 0.01) errors.push(`高频投注形式总和应为100%，当前为${highBetSum.toFixed(2)}%`);
    if (Math.abs(nsSum - 100) > 0.01) errors.push(`选号特征总和应为100%，当前为${nsSum.toFixed(2)}%`);

    if (errors.length > 0) {
        validationMsg.className = 'validation-msg validation-error';
        validationMsg.innerHTML = '❌ ' + errors.join('<br>❌ ');
        return false;
    } else {
        validationMsg.className = 'validation-msg validation-success';
        validationMsg.innerHTML = '✓ 配置验证通过';
        return true;
    }
}

// 加载预设配置
function loadPreset(presetId) {
    const presets = {
        balanced: {
            population: { lowFreq: 50, midFreq: 38, highFreq: 12 },
            betType: {
                low: { single: 82, complex: 8, dantuo: 4 },
                mid: { single: 56, complex: 24, dantuo: 8 },
                high: { single: 18, complex: 32, dantuo: 25 }
            },
            multiplier: {
                low: { x1: 98, x2_5: 2, x6_20: 0, x20plus: 0 },
                mid: { x1: 70, x2_5: 25, x6_20: 4.5, x20plus: 0.5 },
                high: { x1: 42, x2_5: 32, x6_20: 18, x20plus: 8 }
            },
            numberSelection: { random: 30, selfSelect: 35, trendAnalysis: 25, fixedNumber: 10 }
        },
        conservative: {
            population: { lowFreq: 60, midFreq: 30, highFreq: 10 },
            betType: {
                low: { single: 85, complex: 10, dantuo: 5 },
                mid: { single: 65, complex: 20, dantuo: 15 },
                high: { single: 25, complex: 35, dantuo: 40 }
            },
            multiplier: {
                low: { x1: 95, x2_5: 4, x6_20: 1, x20plus: 0 },
                mid: { x1: 80, x2_5: 15, x6_20: 4, x20plus: 1 },
                high: { x1: 55, x2_5: 30, x6_20: 12, x20plus: 3 }
            },
            numberSelection: { random: 40, selfSelect: 30, trendAnalysis: 20, fixedNumber: 10 }
        },
        aggressive: {
            population: { lowFreq: 40, midFreq: 35, highFreq: 25 },
            betType: {
                low: { single: 70, complex: 15, dantuo: 15 },
                mid: { single: 45, complex: 30, dantuo: 25 },
                high: { single: 15, complex: 40, dantuo: 45 }
            },
            multiplier: {
                low: { x1: 90, x2_5: 8, x6_20: 2, x20plus: 0 },
                mid: { x1: 60, x2_5: 30, x6_20: 8, x20plus: 2 },
                high: { x1: 35, x2_5: 35, x6_20: 20, x20plus: 10 }
            },
            numberSelection: { random: 20, selfSelect: 40, trendAnalysis: 30, fixedNumber: 10 }
        },
        official: {
            population: { lowFreq: 50, midFreq: 38, highFreq: 12 },
            betType: {
                low: { single: 82, complex: 8, dantuo: 4 },
                mid: { single: 56, complex: 24, dantuo: 8 },
                high: { single: 18, complex: 32, dantuo: 25 }
            },
            multiplier: {
                low: { x1: 98, x2_5: 2, x6_20: 0, x20plus: 0 },
                mid: { x1: 70, x2_5: 25, x6_20: 4.5, x20plus: 0.5 },
                high: { x1: 42, x2_5: 32, x6_20: 18, x20plus: 8 }
            },
            numberSelection: { random: 30, selfSelect: 35, trendAnalysis: 25, fixedNumber: 10 }
        }
    };

    const config = presets[presetId];
    if (!config) return;

    currentConfig = config;

    // 更新人群结构
    document.getElementById('pop_low').value = config.population.lowFreq;
    document.getElementById('pop_mid').value = config.population.midFreq;
    document.getElementById('pop_high').value = config.population.highFreq;

    // 更新低频投注形式
    document.getElementById('low_s').value = config.betType.low.single;
    document.getElementById('low_r').value = config.betType.low.complex;
    document.getElementById('low_dt').value = config.betType.low.dantuo;

    // 更新中频投注形式
    document.getElementById('mid_s').value = config.betType.mid.single;
    document.getElementById('mid_r').value = config.betType.mid.complex;
    document.getElementById('mid_dt').value = config.betType.mid.dantuo;

    // 更新高频投注形式
    document.getElementById('high_s').value = config.betType.high.single;
    document.getElementById('high_r').value = config.betType.high.complex;
    document.getElementById('high_dt').value = config.betType.high.dantuo;

    // 更新倍投分布
    document.getElementById('low_m1').value = config.multiplier.low.x1;
    document.getElementById('low_m2').value = config.multiplier.low.x2_5;
    document.getElementById('low_m6').value = config.multiplier.low.x6_20;

    document.getElementById('mid_m1').value = config.multiplier.mid.x1;
    document.getElementById('mid_m2').value = config.multiplier.mid.x2_5;
    document.getElementById('mid_m6').value = config.multiplier.mid.x6_20;

    document.getElementById('high_m1').value = config.multiplier.high.x1;
    document.getElementById('high_m2').value = config.multiplier.high.x2_5;
    document.getElementById('high_m6').value = config.multiplier.high.x6_20;

    // 更新选号特征
    document.getElementById('ns_random').value = config.numberSelection.random;
    document.getElementById('ns_self').value = config.numberSelection.selfSelect;
    document.getElementById('ns_trend').value = config.numberSelection.trendAnalysis;
    document.getElementById('ns_fixed').value = config.numberSelection.fixedNumber;

    // 更新显示值
    updateDisplayValues();
    updateResults();

    // 更新按钮状态
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 更新配置名称
    const presetNames = {
        balanced: '均衡型方案（官方数据型）',
        conservative: '保守型方案',
        aggressive: '激进型方案',
        official: '官方数据型'
    };
    document.getElementById('current-config-name').textContent = presetNames[presetId];
}

// 更新所有显示值
function updateDisplayValues() {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const displayId = 'v_' + slider.id;
        const display = document.getElementById(displayId);
        if (display) {
            display.textContent = parseFloat(slider.value).toFixed(2);
        }
    });

    // 更新总和显示
    document.getElementById('pop-total').textContent = (
        parseFloat(document.getElementById('pop_low').value) +
        parseFloat(document.getElementById('pop_mid').value) +
        parseFloat(document.getElementById('pop_high').value)
    ).toFixed(2);

    document.getElementById('ns-total').textContent = (
        parseFloat(document.getElementById('ns_random').value) +
        parseFloat(document.getElementById('ns_self').value) +
        parseFloat(document.getElementById('ns_trend').value) +
        parseFloat(document.getElementById('ns_fixed').value)
    ).toFixed(2);
}

// 保存配置
function saveConfig() {
    if (!validateConfig()) {
        alert('配置验证失败，请检查参数');
        return;
    }

    const config = collectConfig();
    localStorage.setItem('bet_config', JSON.stringify(config));
    document.getElementById('current-status').textContent = '已保存';
    alert('配置保存成功！');
}

// 收集配置
function collectConfig() {
    return {
        population: {
            lowFreq: parseFloat(document.getElementById('pop_low').value),
            midFreq: parseFloat(document.getElementById('pop_mid').value),
            highFreq: parseFloat(document.getElementById('pop_high').value)
        },
        betType: {
            low: {
                single: parseFloat(document.getElementById('low_s').value),
                complex: parseFloat(document.getElementById('low_r').value),
                dantuo: parseFloat(document.getElementById('low_dt').value)
            },
            mid: {
                single: parseFloat(document.getElementById('mid_s').value),
                complex: parseFloat(document.getElementById('mid_r').value),
                dantuo: parseFloat(document.getElementById('mid_dt').value)
            },
            high: {
                single: parseFloat(document.getElementById('high_s').value),
                complex: parseFloat(document.getElementById('high_r').value),
                dantuo: parseFloat(document.getElementById('high_dt').value)
            }
        },
        multiplier: {
            low: {
                x1: parseFloat(document.getElementById('low_m1').value),
                x2_5: parseFloat(document.getElementById('low_m2').value),
                x6_20: parseFloat(document.getElementById('low_m6').value),
                x20plus: 100 - parseFloat(document.getElementById('low_m1').value) - parseFloat(document.getElementById('low_m2').value) - parseFloat(document.getElementById('low_m6').value)
            },
            mid: {
                x1: parseFloat(document.getElementById('mid_m1').value),
                x2_5: parseFloat(document.getElementById('mid_m2').value),
                x6_20: parseFloat(document.getElementById('mid_m6').value),
                x20plus: 100 - parseFloat(document.getElementById('mid_m1').value) - parseFloat(document.getElementById('mid_m2').value) - parseFloat(document.getElementById('mid_m6').value)
            },
            high: {
                x1: parseFloat(document.getElementById('high_m1').value),
                x2_5: parseFloat(document.getElementById('high_m2').value),
                x6_20: parseFloat(document.getElementById('high_m6').value),
                x20plus: 100 - parseFloat(document.getElementById('high_m1').value) - parseFloat(document.getElementById('high_m2').value) - parseFloat(document.getElementById('high_m6').value)
            }
        },
        numberSelection: {
            random: parseFloat(document.getElementById('ns_random').value),
            selfSelect: parseFloat(document.getElementById('ns_self').value),
            trendAnalysis: parseFloat(document.getElementById('ns_trend').value),
            fixedNumber: parseFloat(document.getElementById('ns_fixed').value)
        }
    };
}

// 导出配置
function exportConfig() {
    const config = collectConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bet-config.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 导入配置
function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);
                applyConfig(config);
                alert('配置导入成功！');
            } catch (error) {
                alert('配置格式错误：' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 应用配置
function applyConfig(config) {
    // 人群结构
    if (config.population) {
        document.getElementById('pop_low').value = config.population.lowFreq || 50;
        document.getElementById('pop_mid').value = config.population.midFreq || 38;
        document.getElementById('pop_high').value = config.population.highFreq || 12;
    }

    // 投注形式
    if (config.betType) {
        if (config.betType.low) {
            document.getElementById('low_s').value = config.betType.low.single || 82;
            document.getElementById('low_r').value = config.betType.low.complex || 8;
            document.getElementById('low_dt').value = config.betType.low.dantuo || 4;
        }
        if (config.betType.mid) {
            document.getElementById('mid_s').value = config.betType.mid.single || 56;
            document.getElementById('mid_r').value = config.betType.mid.complex || 24;
            document.getElementById('mid_dt').value = config.betType.mid.dantuo || 8;
        }
        if (config.betType.high) {
            document.getElementById('high_s').value = config.betType.high.single || 18;
            document.getElementById('high_r').value = config.betType.high.complex || 32;
            document.getElementById('high_dt').value = config.betType.high.dantuo || 25;
        }
    }

    // 倍投分布
    if (config.multiplier) {
        if (config.multiplier.low) {
            document.getElementById('low_m1').value = config.multiplier.low.x1 || 98;
            document.getElementById('low_m2').value = config.multiplier.low.x2_5 || 2;
            document.getElementById('low_m6').value = config.multiplier.low.x6_20 || 0;
        }
        if (config.multiplier.mid) {
            document.getElementById('mid_m1').value = config.multiplier.mid.x1 || 70;
            document.getElementById('mid_m2').value = config.multiplier.mid.x2_5 || 25;
            document.getElementById('mid_m6').value = config.multiplier.mid.x6_20 || 4.5;
        }
        if (config.multiplier.high) {
            document.getElementById('high_m1').value = config.multiplier.high.x1 || 42;
            document.getElementById('high_m2').value = config.multiplier.high.x2_5 || 32;
            document.getElementById('high_m6').value = config.multiplier.high.x6_20 || 18;
        }
    }

    // 选号特征
    if (config.numberSelection) {
        document.getElementById('ns_random').value = config.numberSelection.random || 30;
        document.getElementById('ns_self').value = config.numberSelection.selfSelect || 35;
        document.getElementById('ns_trend').value = config.numberSelection.trendAnalysis || 25;
        document.getElementById('ns_fixed').value = config.numberSelection.fixedNumber || 10;
    }

    // 更新显示
    updateDisplayValues();
    updateResults();
}
