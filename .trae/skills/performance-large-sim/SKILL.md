---
name: "performance-large-sim"
description: "优化大规模数据模拟性能，包括Web Worker、批量处理、内存管理、算法优化。当用户需要提升模拟速度、处理百万级数据、解决卡顿/内存问题、或优化simulator.js/worker.js时调用。"
---

# 性能与大数据模拟助手

## 项目背景
这是一个 Electron + Vanilla JS 的彩票模拟器，需要支持十万到百万级别的购买模拟和开奖模拟。当前使用 Web Worker 进行异步处理。

## 性能架构

### 当前瓶颈
1. **主线程限制**: 同步模拟上限10000次，超过需用Web Worker
2. **代码重复**: `drawOne()`, `checkPrize()`, `analyzePurchaseResults()` 在 `core/lottery.js`、`simulator.js`、`worker.js` 三处重复
3. **批量大小**: Worker中batchSize=10000，每批发送progress消息
4. **内存**: 大量结果数组存储在内存中（`simulationResults` 在 StateManager）
5. **UI阻塞**: `ui.js` 中的同步操作可能阻塞渲染

### 关键文件
| 文件 | 作用 |
|------|------|
| `js/worker.js` | Web Worker，处理大规模模拟和购买 |
| `js/simulator.js` | 模拟器入口，管理Worker生命周期 |
| `js/state/state-manager.js` | 状态管理，存储模拟结果 |
| `js/core/lottery.js` | 核心逻辑（主线程版本） |
| `js/core/random-engine.js` | 随机数引擎 |

### Worker 消息协议
```js
// 主线程 → Worker
{ type: 'start', lotteryId, count }           // 开始模拟
{ type: 'purchase', lotteryId, count, multiplier, drawResult, guaranteeWin }  // 购买模拟
{ type: 'cancel' }                             // 取消

// Worker → 主线程
{ type: 'progress', current, total }           // 进度更新
{ type: 'complete', results }                  // 模拟完成
{ type: 'purchase-progress', current, total }  // 购买进度
{ type: 'purchase-complete', results }         // 购买完成
{ type: 'cancelled' }                          // 已取消
```

## 性能优化策略

### 1. 消除代码重复
**当前问题**: 三处重复的 drawOne/checkPrize 逻辑
**方案**: 将共享逻辑提取到 `core/lottery.js`，Worker通过import引用
**注意**: Worker中 `import { xxx } from './core/lottery.js'` 需要确保路径正确

### 2. 批量处理优化
- 当前batchSize=10000，可根据数据量动态调整
- 对于千万级模拟，考虑分批次处理+流式传输结果
- 使用 `requestAnimationFrame` 或 `setTimeout` 让出主线程

### 3. 内存优化
- 模拟结果使用TypedArray（如Int32Array）存储号码，减少内存
- 对于仅需统计的场景（如频率分析），不存储完整结果，流式聚合
- 购买分析时，tickets数组是主要内存消耗点

### 4. 算法优化
- `checkPrize`: 使用Set而非数组遍历进行匹配
- `analyzePurchaseResults`: 已使用levelCounts数组，但可进一步优化
- Fisher-Yates洗牌是O(n)，已是最优
- 组合数计算 `calcBetCount` 使用迭代乘法，避免阶乘溢出

### 5. Worker池化
- 考虑使用多个Worker并行处理（如将100万次模拟拆分为4个Worker各25万）
- 当前架构只支持单个Worker

### 6. 虚拟滚动
- 历史记录表格使用虚拟滚动，避免渲染大量DOM
- 当前 `ITEMS_PER_PAGE = 10`，分页加载

## 操作指南

### 优化大规模模拟
1. 分析当前瓶颈：CPU还是内存？
2. 如果是CPU瓶颈 → 优化算法、增加Worker数量
3. 如果是内存瓶颈 → 流式处理、TypedArray、增量聚合
4. 如果是UI卡顿 → 减少progress消息频率、使用requestAnimationFrame

### 重构Worker代码
1. 将 `worker.js` 中的 `drawOne`, `checkPrize`, `analyzePurchaseResults` 替换为 `core/lottery.js` 的import
2. 保持消息协议不变
3. 测试：确保Worker结果与主线程一致

### 添加进度反馈
```js
// 每处理1%发送一次进度，而非每批
const progressInterval = Math.max(1, Math.floor(count / 100));
if (processed % progressInterval === 0) {
  self.postMessage({ type: 'progress', current: processed, total: count });
}
```