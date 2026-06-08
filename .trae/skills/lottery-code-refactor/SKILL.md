---
name: "lottery-code-refactor"
description: "重构彩票模拟器代码，消除重复、优化模块结构、提取公共逻辑。当用户需要重构代码、清理重复、优化架构、或修改多个模块的共享逻辑时调用。"
---

# 代码重构助手

## 项目背景
这是 Electron + Vanilla JS 的彩票模拟器，模块化程度中等，但存在明显的代码重复和架构问题。

## 已知问题

### 1. 核心逻辑重复（严重）
`drawOne()`, `checkPrize()`, `analyzePurchaseResults()`, `generatePurchasesWithMultiplier()` 在以下三处重复：
- `js/core/lottery.js` (主线程版本)
- `js/simulator.js` (模拟器版本，旧版)
- `js/worker.js` (Worker版本)

**影响**: 修改规则时需三处同步，容易遗漏。

### 2. 导入路径混乱
- `ui.js` 从 `simulator.js` 导入（旧版路径）
- `worker.js` 包含独立的 `drawOne` 等实现
- `core/lottery.js` 是重构后的正确版本，但未完全采用

### 3. 模块职责不清
- `simulator.js` 既是模拟器入口，又包含核心逻辑
- `ui.js` 非常庞大，包含UI渲染、事件绑定、业务逻辑
- 分析模块在 `analyzer.js`（单文件）和 `charts.js`（单文件）

### 4. 文件结构
```
js/
├── core/           # 核心逻辑（正确）
│   ├── lottery.js
│   ├── prize-calculator.js
│   └── random-engine.js
├── state/          # 状态管理（正确）
│   └── state-manager.js
├── utils/          # 工具函数（正确）
│   ├── dom-helper.js
│   └── formatters.js
├── charts/         # 图表模块（正确）
│   ├── base-chart.js
│   └── chart-functions.js
├── data/           # 数据模块（正确）
│   └── lottery-descriptions.js
├── simulator.js    # 应只负责Worker管理
├── worker.js       # 应只import核心逻辑
├── lottery-config.js  # 配置（正确）
├── analyzer.js     # 应移至 analysis/ 目录
├── charts.js       # 应移至 charts/ 目录
├── ui.js           # 应拆分
└── app.js          # 入口（正确）
```

## 重构目标

### 阶段1：消除代码重复
1. 确保 `worker.js` 从 `core/lottery.js` import，而非内联实现
2. 确保 `simulator.js` 从 `core/lottery.js` import，而非内联实现
3. 删除 `simulator.js` 和 `worker.js` 中的重复函数

### 阶段2：整理模块结构
1. 将 `analyzer.js` 移至 `js/analysis/analyzer.js`
2. 将 `charts.js` 移至 `js/charts/index.js`（或合并到chart-functions.js）
3. 拆分 `ui.js`：提取事件绑定、渲染函数、业务逻辑到独立模块

### 阶段3：统一导入路径
1. 所有模块统一从 `core/lottery.js` 导入核心逻辑
2. 所有模块统一从 `state/state-manager.js` 导入状态管理
3. 建立清晰的依赖关系图

## 重构原则

1. **保持消息协议不变**: Worker的消息协议不能变，否则破坏通信
2. **保持API签名不变**: 外部接口不变，内部实现可改
3. **逐步重构**: 一次改一个模块，测试通过后再改下一个
4. **不改变功能**: 重构只改结构，不改行为

## 模块依赖关系（目标状态）
```
app.js
  └── ui.js
        ├── core/lottery.js (drawOne, checkPrize, analyzePurchaseResults)
        ├── core/prize-calculator.js (getFixedPrizeAmount, calculateTieredPrize)
        ├── simulator.js (startWorkerSimulation)
        ├── analysis/analyzer.js (analyzeFrequency, etc.)
        ├── charts/chart-functions.js (drawBarChart, etc.)
        ├── state/state-manager.js (stateManager)
        ├── data/lottery-descriptions.js
        └── utils/formatters.js

simulator.js
  ├── worker.js (new Worker)
  └── core/lottery.js (备用同步逻辑)

worker.js
  └── core/lottery.js (drawOne, checkPrize, analyzePurchaseResults)
```

## 操作指南

### 消除Worker重复
```js
// worker.js 改为:
import { drawOne, checkPrize, analyzePurchaseResults } from './core/lottery.js';
// 删除本地 drawOne, checkPrize, analyzePurchaseResults 函数定义
```

### 拆分ui.js
1. 提取事件绑定 → `js/ui/events.js`
2. 提取渲染函数 → `js/ui/render.js`
3. 提取业务逻辑 → `js/ui/logic.js`
4. `js/ui.js` 保留为入口，组装各模块