---
name: "lottery-rule-config"
description: "管理彩票类型配置、奖级规则、奖金计算。当用户需要新增彩票类型、修改奖级规则、调整奖金计算逻辑、或修改lottery-config.js/config/lottery.js/prize-calculator.js时调用。"
---

# 彩票规则配置助手

## 项目背景
这是一个 Electron + Vanilla JS 的彩票模拟器，支持12+种彩票类型（双色球、大乐透、福彩3D、排列三/五、七星彩、七乐彩、快乐8、Powerball、Mega Millions、EuroMillions、UK Lotto）。

## 核心架构

### 配置驱动设计
所有彩票类型由 `js/lottery-config.js` 中的 `LOTTERY_CONFIG` 数组驱动。每个彩票配置包含：

```js
{
  id: 'ssq',              // 唯一标识
  name: '双色球',         // 显示名称
  currency: '¥',          // 货币符号
  rules: '...',           // 规则描述文本
  price: 2,               // 单注价格
  canAddOn: true,         // 是否支持追加
  addOnPrice: 1,          // 追加价格
  zones: [...],           // 号码区配置
  drawZones: [...],       // 开奖专用区（可选，如七星彩后区）
  prizes: [...],          // 奖级配置
  poolRatio: 0.51,        // 奖池比例
  poolTiers: [...]        // 奖池分档配置
}
```

### 号码区 (zones) 配置
```js
{ name: '红球', min: 1, max: 33, count: 6, repeatable: false, color: '#e74c3c' }
```
- `repeatable: false` → 不重复号码，Fisher-Yates洗牌
- `repeatable: true` → 可重复号码（3D/排列三）
- `excludeZone` → 排除其他区的号码（快乐8开奖号不能含选号）

### 奖级 (prizes) 配置
```js
{ level: 1, name: '一等奖', amount: 0, fixed: false, poolRatio: 0.78, matchPattern: [[5,2]], maxPerTicket: 10000000 }
```
- `fixed: false` → 浮动奖（一等奖/二等奖）
- `fixed: true` → 固定奖
- `highPoolAmount` → 高奖池时奖金提升
- `bonusPoolThreshold` → 触发门槛（如双色球福运奖需奖池≥15亿）
- `maxPerTicket` → 单注封顶
- `maxTotal` → 总额封顶
- `maxAddOnPerTicket` → 追加投注单注封顶

### 奖池分档 (poolTiers) 配置
```js
{ min: 0, max: 99999999, name: '低奖池', firstPrizeRatio: 0.78 }
{ min: 100000000, max: 799999999, name: '中奖池', firstPrizeRatio: 0.58, secondPartRatio: 0.20 }
{ min: 800000000, max: Infinity, name: '高奖池', firstPrizeRatio: 0.28, secondPartRatio: 0.50, activateHighPoolBonus: true }
```

## 关键文件

| 文件 | 作用 |
|------|------|
| `js/lottery-config.js` | 彩票类型配置（唯一配置源） |
| `js/core/lottery.js` | 核心逻辑：drawOne, checkPrize, analyzePurchaseResults |
| `js/core/prize-calculator.js` | 奖金计算：getFixedPrizeAmount, calculateTieredPrize |
| `js/core/random-engine.js` | 随机数引擎：fisherYatesPick, randomPick |
| `js/simulator.js` | 模拟器：包含drawOne/checkPrize的副本（需同步） |
| `js/worker.js` | Web Worker：包含drawOne/checkPrize的副本（需同步） |
| `js/analyzer.js` | 数据分析：频率、遗漏、奇偶、和值等 |
| `js/data/lottery-descriptions.js` | 玩法描述文本 |

## 重要规则

### 各彩票类型的checkPrize差异
- **fc3d/pls**: 直选+组选（组三/组六）
- **plw**: 纯位置匹配
- **kl8**: Set交集匹配，10个匹配等级
- **qxc**: 前区按位匹配+后区匹配
- **qlc**: 主号码+特别号匹配
- **uklotto**: 主号码+Bonus球匹配
- **ssq/dlt/powerball/megamillions/euromillions**: 通用多区匹配

### 奖金计算流程
1. `getFixedPrizeAmount()` → 固定奖金额
2. `calculateTieredPrize()` → 浮动奖分配
   - SSQ: `calculateSSQTieredPrize()` (保底：一等≥二等×2，二等≥6000)
   - DLT: `calculateDLTTieredPrize()` (保底：一等≥二等×2，二等≥三等×2，追加×1.8)
3. `calculatePrizeDetails()` → 完整奖金详情

### 代码重复警告
`drawOne()`, `checkPrize()`, `analyzePurchaseResults()` 在 `core/lottery.js`、`simulator.js`、`worker.js` 三处重复。修改核心逻辑时必须三处同步更新。

## 操作指南

### 新增彩票类型
1. 在 `lottery-config.js` 的 `LOTTERY_CONFIG` 数组末尾添加配置
2. 在 `lottery.js` 的 `checkPrize()` 中添加匹配逻辑（如有特殊规则）
3. 在 `prize-calculator.js` 的 `calculateTieredPrize()` 中添加计算逻辑（如有特殊规则）
4. 在 `simulator.js` 和 `worker.js` 中同步更新 checkPrize 逻辑
5. 在 `lottery-descriptions.js` 中添加玩法描述
6. 在 `玩法规则/` 目录下添加规则文档

### 修改奖级规则
1. 修改 `lottery-config.js` 中对应彩票的 `prizes` 数组
2. 如果是固定奖金额变更，同步更新 `prize-calculator.js` 中的保底逻辑
3. 如果是双色球/大乐透规则变更，检查 `calculateSSQTieredPrize()`/`calculateDLTTieredPrize()`