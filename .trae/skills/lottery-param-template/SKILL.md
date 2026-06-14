---
name: "lottery-param-template"
description: "投注模拟参数面板标准化规范。当用户需要创建新彩种的参数模板HTML、修改现有参数面板、统一参数面板UI/数据处理/导出导入逻辑时调用。覆盖快乐8、双色球、大乐透、七星彩等所有彩种的参数面板开发。"
---

# 投注模拟参数面板标准化规范

## 概述

本skill定义了「投注模拟参数面板」HTML页面的标准化架构，基于 `docs/玩法规则/投注模拟参数/快乐8 参数模板.html` 的设计模式。所有彩种的参数面板页面必须遵循此规范。

参考模板：
- [快乐8 参数模板.html](file:///c:/Users/45000/Desktop/彩票模拟/Lottery-Simulator/docs/玩法规则/投注模拟参数/快乐8 参数模板.html) — 核心参考
- [双色球 参数模板.html](file:///c:/Users/45000/Desktop/彩票模拟/Lottery-Simulator/docs/玩法规则/投注模拟参数/双色球 参数模板.html)
- [大乐透 参数模板.html](file:///c:/Users/45000/Desktop/彩票模拟/Lottery-Simulator/docs/玩法规则/投注模拟参数/大乐透 参数模板.html)
- [七星彩 参数模板.html](file:///c:/Users/45000/Desktop/彩票模拟/Lottery-Simulator/docs/玩法规则/投注模拟参数/七星彩 参数模板.html)

---

## 一、UI规范（统一视觉效果）

### 1.1 CSS变量系统（必须使用）

所有参数面板必须使用统一的CSS变量，不可自定义颜色值：

```css
:root {
    --bg-main: #0b0f1a;        /* 页面背景 */
    --card-bg: #141a28;        /* 卡片背景 */
    --card-border: #253044;    /* 卡片边框 */
    --primary: #ff4c4c;        /* 主色调（高亮数值、标题） */
    --primary-light: #ff6666;  /* 主色调浅色（hover、渐变） */
    --text-main: #e0e6f0;      /* 主文字色 */
    --text-sub: #8892b0;       /* 次要文字色 */
    --warning: #ffcc00;        /* 警告色 */
    --radius: 10px;            /* 圆角 */
    --shadow: 0 4px 20px rgba(0,0,0,0.4); /* 卡片阴影 */
}
```

### 1.2 基础样式（必须使用）

```css
* {
    margin: 0; padding: 0; box-sizing: border-box;
    font-family: "Microsoft YaHei", Arial, sans-serif;
}
body {
    background-color: var(--bg-main);
    color: var(--text-main);
    padding: 24px;
    line-height: 1.5;
}
.container { max-width: 1200px; margin: 0 auto; }
```

### 1.3 卡片组件

```css
.card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: var(--shadow);
}
.card-title {
    font-size: 16px;
    color: var(--primary);
    margin-bottom: 18px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--card-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
```

### 1.4 按钮样式

```css
.btn-reset {
    background: var(--primary);
    border: none; color: #fff;
    padding: 6px 12px; border-radius: 6px;
    cursor: pointer; font-size: 13px;
}
.btn-reset:hover { background: #ff6666; }

.btn-export, .btn-import {
    background: #253044;
    border: 1px solid var(--card-border);
    color: var(--text-main);
    padding: 6px 12px; border-radius: 6px;
    cursor: pointer; font-size: 13px;
    transition: all 0.2s ease;
}
.btn-export:hover, .btn-import:hover {
    background: #2d3a52;
    border-color: var(--primary);
}
```

### 1.5 滑块组件

```css
.slider-wrap { margin-bottom: 16px; }
.slider-top {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 6px; font-size: 14px;
}
.slider-name  { color: var(--text-sub); flex: 1; }
.slider-value { font-size: 16px; font-weight: bold; color: var(--primary); width: 70px; text-align: center; }
.slider-default { font-size: 12px; color: #667292; width: 70px; text-align: center; }

input[type="range"] {
    width: 100%; height: 6px;
    background: var(--card-border); border-radius: 3px;
    outline: none; -webkit-appearance: none;
}
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px; border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    cursor: pointer;
    box-shadow: 0 0 8px rgba(255,76,76,0.5);
    transition: transform 0.15s ease;
}
input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); }
```

### 1.6 结果展示网格

根据结果列数选择合适网格，单位数字 `result-num` 颜色统一使用 `var(--primary)`：

```css
.result-item {
    background: #181f2f;
    border-radius: 6px; padding: 12px 8px; text-align: center;
}
.result-desc { font-size: 12px; color: var(--text-sub); margin-bottom: 4px; }
.result-num  { font-size: 18px; font-weight: bold; color: var(--primary); }
```

可用网格类：
- `result-grid-3` → `repeat(3, 1fr)`
- `result-grid-4` → `repeat(4, 1fr)`
- `result-grid-5` → `repeat(5, 1fr)`
- `result-grid-6` → `repeat(6, 1fr)`

### 1.7 分组标题

```css
.group-title {
    color: #8892b0;
    font-size: 14px;
    margin: 6px 0 12px;
}
```

### 1.8 响应式断点

```css
@media (max-width: 992px) {
    .grid-row { grid-template-columns: 1fr; }
    .result-grid-5, .result-grid-6 { grid-template-columns: repeat(3, 1fr); }
    .result-grid-3, .result-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
```

---

## 二、页面结构规范（Card布局顺序）

每个彩种的参数面板必须按以下顺序组织Card：

```
Card 1: 全局随机波动控制 + 导出/导入/重置按钮
Card 2: 彩民人群结构占比（3组滑块，和=100%）
Card 3: 分人群投注行为模板（低频/中频/高频，每组独立滑块，和=100%）
Card 4: 全局汇总 — 投注形式分布（含真实波动）
Card 5: 全局汇总 — 倍投分布（含真实波动）
[Card 6+: 彩种特有细分（如快乐8选一~选十、大乐透复式结构明细等）]
```

---

## 三、数据结构与处理管线（核心）

### 3.1 默认值配置 `defaults`

所有滑块必须有默认值，集中声明在 `defaults` 对象中。键名即滑块元素的 `id`：

```js
const defaults = {
    // 人群占比（和为100%）
    pop_low: 50.00, pop_mid: 35.00, pop_high: 15.00,
    // 低频投注形式（和为100%）
    low_s: 90.00, low_d: 8.00, low_dt: 2.00,
    // 低频倍投（和为100%）
    low_m1: 98.00, low_m2: 2.00, low_m6: 0.00,
    // ... 中频、高频同理
    noise_range: 0.00
};
```

**命名规范**：
- 人群占比：`pop_low`, `pop_mid`, `pop_high`
- 分人群行为：`{人群前缀}_{参数后缀}`，如 `low_s`（低频单式）、`mid_m2`（中频2-5倍）
- 全局波动：`noise_range`

### 3.2 滑块组绑定 `sliders`

所有滑块按"和为100%的组"分类，存储在 `sliders` 对象中：

```js
const sliders = {
    pop: [pop_low元素, pop_mid元素, pop_high元素],
    low_sdt: [low_s元素, low_d元素, low_dt元素],
    low_mul: [low_m1元素, low_m2元素, low_m6元素],
    // ...
};
```

### 3.3 数值联动 `syncGroup` — 维持和为100%

当用户拖动滑块时，自动按比例调整同组其他滑块，始终保持组内总和=100%。

**通用syncGroup（均分差额法）**：
```js
function syncGroup(sList, changedIdx) {
    let vals = sList.map(s => parseFloat(s.value));
    let sum = vals.reduce((a,b) => a+b, 0);
    if (Math.abs(sum - 100) < 0.001) return;
    
    let diff = 100 - sum;
    let otherSum = 0;
    for(let i=0; i<sList.length; i++){
        if(i !== changedIdx) otherSum += vals[i];
    }
    
    if(otherSum > 0.001) {
        for(let i=0; i<sList.length; i++){
            if(i !== changedIdx) {
                let ratio = vals[i] / otherSum;
                let newVal = vals[i] + diff * ratio;
                sList[i].value = Math.max(parseFloat(sList[i].min), Math.min(parseFloat(sList[i].max), newVal));
            }
        }
    }
}
```

**注意**：每组滑块的绑定方式必须一致：
```js
function bindGroup(sList) {
    sList.forEach((s, idx) => {
        s.addEventListener("input", () => {
            cachedNoiseValues = null;  // 清除波动缓存
            syncGroup(sList, idx);     // 联动调整
            refreshAll();              // 刷新全部显示
            saveToLocalStorage();      // 自动保存
        });
    });
}
```

---

## 四、波动控制核心算法（关键）

### 4.1 算法原理

`getAdaptiveWeightNoise(values, K)` 实现**权重自适应零和波动**：

- **权重自适应**：大占比承载主要波动（`delta = val × K / 100`），小占比自动收窄波动
- **零和保证**：最后一项 `= -Σ(前N-1项)`，确保总波动为0，总和恒为100%
- **边界保护**：波动后值不超出 `[0, 100]`，越界偏移重分配到合法项

### 4.2 标准实现（必须使用）

```js
function getAdaptiveWeightNoise(values, K) {
    if (K <= 0.001) return new Array(values.length).fill(0);
    
    const len = values.length;
    const noise = [];
    let totalDelta = 0;
    
    // 前N-1项：按权重生成随机波动
    for (let i = 0; i < len - 1; i++) {
        const val = values[i];
        const weightDelta = val * K / 100;          // 波动幅度 = 值 × K%
        const deltaLower = Math.max(-val, -weightDelta);
        const deltaUpper = Math.min(100 - val, weightDelta);
        const delta = deltaLower + (deltaUpper - deltaLower) * Math.random();
        noise.push(delta);
        totalDelta += delta;
    }
    
    // 最后一项：零和补偿
    noise.push(-totalDelta);
    
    // 边界校验 + 偏移重平衡
    let offsetSum = 0;
    const validIndexList = [];
    for (let i = 0; i < len; i++) {
        const current = values[i] + noise[i];
        if (current < 0) {
            offsetSum += current;
            noise[i] = -values[i];
        } else if (current > 100) {
            offsetSum += current - 100;
            noise[i] = 100 - values[i];
        } else {
            validIndexList.push(i);
        }
    }
    
    if (validIndexList.length > 0 && Math.abs(offsetSum) > 1e-9) {
        const avgOffset = offsetSum / validIndexList.length;
        validIndexList.forEach(idx => { noise[idx] -= avgOffset; });
    }
    
    return noise;
}

// 应用波动 + 边界兜底
function applyFinalNoise(baseVals, noiseArr) {
    return baseVals.map((v, i) => Math.max(0, Math.min(100, v + noiseArr[i])));
}
```

### 4.3 波动应用范围

波动应用于两个层级：

1. **分人群层级**：每个分人群的投注形式组和倍投组各自独立应用波动（使用该组原始值为base）
2. **全局汇总层级**：如选一~选十等彩种特有分布，直接对加权汇总结果应用波动

全局汇总的投注形式和倍投分布**不再额外叠**加波动，因其已经通过分人群波动的加权汇总间接产生波动效果。

### 4.4 波动范围控制

`noise_range` 滑块范围固定为 `0 ~ 2`（代表0%~2%），step=0.01：

```html
<input type="range" id="noise_range" min="0" max="2" step="0.01" value="0">
```

- K=0：无波动，显示原始计算值
- K=0.3~0.5：轻微波动，模拟真实市场微小偏差
- K=1.0~2.0：明显波动，模拟极端市场偏差

---

## 五、计算管线 `calcResult`（标准流程）

### 5.1 标准计算步骤

```js
function calcResult() {
    // Step 0: 读取波动强度
    let noise = parseFloat(noise_range.value);
    showValue("noise", noise);

    // Step 1: 获取人群占比（转为小数）
    let pLow  = parseFloat(pop_low.value)/100;
    let pMid  = parseFloat(pop_mid.value)/100;
    let pHigh = parseFloat(pop_high.value)/100;

    // Step 2: 提取分人群原始参数
    let lowBetRaw  = [parseFloat(low_s.value), ...];
    let lowMulRaw  = [parseFloat(low_m1.value), ...];
    let midBetRaw  = [parseFloat(mid_s.value), ...];
    let midMulRaw  = [parseFloat(mid_m1.value), ...];
    let highBetRaw = [parseFloat(high_s.value), ...];
    let highMulRaw = [parseFloat(high_m1.value), ...];

    // Step 3: 对分人群参数应用波动
    let nLowBet  = getAdaptiveWeightNoise(lowBetRaw, noise);
    let nLowMul  = getAdaptiveWeightNoise(lowMulRaw, noise);
    // ... 同理mid、high

    // Step 4: 获取波动后的值
    let lowBet  = applyFinalNoise(lowBetRaw, nLowBet);
    let lowMul  = applyFinalNoise(lowMulRaw, nLowMul);
    // ... 同理mid、high

    // Step 5: 在UI上显示波动后的分人群参数值（重要！）
    // 波动后显示的值覆盖滑块原始值显示
    document.getElementById("v_low_s").innerText  = lowBet[0].toFixed(2);
    // ... 所有分人群参数逐一更新

    // Step 6: 加权汇总 = Σ(人群占比 × 波动后参数)
    let s  = pLow*lowBet[0]  + pMid*midBet[0]  + pHigh*highBet[0];
    // ...

    // Step 7: 显示全局汇总结果（不再额外叠加波动）
    document.getElementById("res_s").innerText  = s.toFixed(2)+"%";
    // ...

    // Step 8: 缓存所有波动后的值（用于导出/导入/刷新）
    cachedNoiseValues = {
        // 分人群波动后参数
        low_s: lowBet[0], low_d: lowBet[1], ...
        // 全局汇总结果
        res_s: s, res_d: d, ...
    };
}
```

### 5.2 显示更新规范

- **分人群参数显示**：在 `calcResult()` 中必须使用波动后的值覆盖显示（而非滑块原始值）
- **`refreshAll()` 行为**：优先使用 `cachedNoiseValues` 缓存直接渲染；无缓存时调用 `calcResult()` 重新计算
- **`showValue(id, val)` 辅助函数**：仅用于非波动值（如人群占比、波动强度），`.toFixed(2)` 保留两位小数

---

## 六、导出与自动保存（必须包含波动后最终数值）

### 6.1 缓存结构 `cachedNoiseValues`

`calcResult()` 执行后必须将波动后的所有计算值存入 `cachedNoiseValues`：

```js
let cachedNoiseValues = null;

// 在 calcResult() 末尾：
cachedNoiseValues = {
    // 分人群波动后参数（覆盖滑块显示的值）
    low_s: lowBet[0], low_d: lowBet[1], low_dt: lowBet[2],
    low_m1: lowMul[0], low_m2: lowMul[1], low_m6: lowMul[2],
    mid_s: midBet[0], mid_d: midBet[1], mid_dt: midBet[2],
    mid_m1: midMul[0], mid_m2: midMul[1], mid_m6: midMul[2],
    high_s: highBet[0], high_d: highBet[1], high_dt: highBet[2],
    high_m1: highMul[0], high_m2: highMul[1], high_m6: highMul[2],
    // 全局汇总结果
    res_s: s, res_d: d, res_dt: dt,
    res_m1: m1, res_m2: m2, res_m6: m6,
    // ... 彩种特有细分结果
};
```

### 6.2 导出JSON格式

```js
function exportConfig() {
    const config = {
        version: "1.0",
        game: "彩种名称",
        exportTime: new Date().toISOString(),
        sliderValues: {},      // 滑块原始值
        noiseValues: null      // 波动后的完整数值
    };
    
    // 导出所有滑块原始值
    for (let key in defaults) {
        const el = document.getElementById(key);
        if (el) config.sliderValues[key] = parseFloat(el.value);
    }
    
    // 导出波动后的数值（CRITICAL：保证还原后结果一致）
    config.noiseValues = cachedNoiseValues;
    
    // 触发下载
    const blob = new Blob([JSON.stringify(config, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `彩种名参数配置_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
```

### 6.3 导入JSON格式

```js
function importConfig() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const config = JSON.parse(event.target.result);
                if (config.sliderValues) {
                    // 恢复滑块原始值
                    for (let key in config.sliderValues) {
                        const el = document.getElementById(key);
                        if (el) el.value = config.sliderValues[key];
                    }
                    // 恢复波动后数值缓存（精准还原）
                    cachedNoiseValues = config.noiseValues;
                    refreshAll();
                    alert("配置导入成功！");
                }
            } catch (error) {
                alert("配置文件解析失败！");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
```

### 6.4 localStorage自动保存/加载

**保存**（每次滑块变化时调用）：

```js
function saveToLocalStorage() {
    const data = {};
    for (let key in defaults) {
        const el = document.getElementById(key);
        if (el) data[key] = parseFloat(el.value);
    }
    data.cachedNoiseValues = cachedNoiseValues; // 必须包含波动后数值
    localStorage.setItem("游戏名_params", JSON.stringify(data));
}
```

**加载**（页面初始化时调用）：

```js
function loadFromLocalStorage() {
    const saved = localStorage.getItem("游戏名_params");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            for (let key in defaults) {
                if (data[key] !== undefined) {
                    const el = document.getElementById(key);
                    if (el) el.value = data[key];
                }
            }
            if (data.cachedNoiseValues) {
                cachedNoiseValues = data.cachedNoiseValues;
            }
            return true;
        } catch (e) { return false; }
    }
    return false;
}
```

### 6.5 页面初始化

```js
window.onload = function() {
    if (!loadFromLocalStorage()) {
        resetAll();  // 无本地数据时使用默认值
    } else {
        refreshAll(); // 有数据时直接刷新显示
    }
};
```

**localStorage key命名规范**：使用英文下划线格式，如 `happy8_params`、`double_color_params`、`super_lotto_params`。

---

## 七、人群分段模型（标准三层结构）

### 7.1 人群占比

始终使用三层结构，滑块ID固定为 `pop_low`、`pop_mid`、`pop_high`：

| 人群 | ID | 默认范围 | 含义 |
|------|-----|---------|------|
| 低频彩民 | `pop_low` | 30~90 | 偶尔购买，小额机选为主 |
| 中频彩民 | `pop_mid` | 5~50 | 每周1-2次，单式+小复式 |
| 高频彩民 | `pop_high` | 0~30 | 每日投注，多复式/胆拖/倍投 |

**默认值必须从对应 `.md` 文档中获取**，确保与实际市场数据一致。

### 7.2 分人群行为参数

每个分人群必须包含：

1. **投注形式组**（和为100%）：彩种特有的投注方式占比
2. **倍投组**（和为100%）：1倍 / 2-5倍 / 6倍+ 等倍投层级占比
3. **可选：追加率**（如大乐透，独立滑块，不参与联动）

---

## 八、全局汇总数值结构

### 8.1 投注形式汇总

全局投注形式 = `Σ(人群占比 × 该人群波动后投注形式参数)`

结果以百分比展示，汇总后不再叠加额外波动。各类投注形式之和理论上接近100%（微小偏差来自分人群各组「和为100%」的精度）。

### 8.2 倍投汇总

全局倍投 = `Σ(人群占比 × 该人群波动后倍投参数)`

算法同上。

### 8.3 彩种特有细分

如快乐8的选一~选十、大乐透/双色球的复式结构明细、胆拖结构明细等，属于彩种特有维度。这些细分使用**固定比例拆分规则**，比例数据来源于对应的 `.md` 文档。

---

## 九、彩种特有规则处理

### 9.1 快乐8特殊规则

- **选一~选十分布**：使用 `selectRule` 固定规则表，按人群拆分
- 对分人群加权汇总后的10个值，再应用一次 `getAdaptiveWeightNoise` 波动
- 界面显示：`result-grid-5 × 2` 展示10个选号

### 9.2 大乐透特殊规则

- **投注形式5种**：单式、前区复式、后区复式、双区复式、胆拖
- **追加率**：独立参数，不受联动约束，仅用于全局追加率加权汇总
- **复式结构明细**：前区复式（6红/7红/8-10红）、后区复式（3蓝/4蓝/5-6蓝）、胆拖（1胆+4拖/2胆+3拖/3胆+2拖）
- 明细使用固定比例拆分：`全局复式值 × 固定比例`

### 9.3 双色球特殊规则

- **投注形式5种**：单式、红球复式、蓝球复式、红蓝复式、胆拖
- **倍投4档**：1倍、2-5倍、6-20倍、20倍+
- **复式结构明细**：红球复式（7红/8-9红/10-12红）、胆拖（1胆+5拖/2胆+4拖/3胆+3拖）

### 9.4 七星彩特殊规则

- **投注形式4种**：单式、前区复式、后区复式、全复式
- **倍投4档**：1倍、2-5倍、6-20倍、20倍+

---

## 十、操作按钮规范

每个参数面板必须包含以下按钮，位于第一张Card（波动控制Card）的标题行右侧：

| 按钮 | 函数 | 功能 |
|------|------|------|
| 📥 导出配置 | `exportConfig()` | 导出JSON配置文件 |
| 📤 导入配置 | `importConfig()` | 导入JSON配置文件 |
| 🔄 一键重置 | `resetAll()` | 恢复所有滑块为默认值 |

---

## 十一、检查清单

创建/修改参数面板时应逐项检查：

- [ ] CSS变量是否使用 `:root` 中的统一值，没有硬编码颜色
- [ ] Card布局顺序：波动控制 → 人群占比 → 分人群模板 → 投注形式汇总 → 倍投汇总
- [ ] 所有和为100%的滑块组正确绑定了 `syncGroup` 联动
- [ ] `calcResult()` 中分人群参数显示使用了波动后的值
- [ ] `cachedNoiseValues` 在 `calcResult()` 末尾被正确填充
- [ ] `exportConfig()` 包含 `sliderValues` 和 `noiseValues`（波动后最终数值）
- [ ] `saveToLocalStorage()` 包含 `cachedNoiseValues`
- [ ] `loadFromLocalStorage()` 恢复 `cachedNoiseValues`
- [ ] `refreshAll()` 优先使用 `cachedNoiseValues` 缓存
- [ ] `resetAll()` 清除 `cachedNoiseValues = null`
- [ ] 滑块事件绑定中同时调用 `refreshAll()` 和 `saveToLocalStorage()`
- [ ] `getAdaptiveWeightNoise` 和 `applyFinalNoise` 使用标准实现
- [ ] JSON导出包含 `version`、`game`、`exportTime` 元数据
- [ ] 响应式断点在992px以下正确适配
- [ ] 默认值数据来源于对应 `.md` 文档