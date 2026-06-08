---
name: "ui-visual-polish"
description: "优化UI视觉效果、CSS动画、Canvas图表渲染、交互体验。当用户需要美化界面、添加动画、优化图表、改进布局、或修改style.css/charts.js/ui.js时调用。"
---

# UI与视觉优化助手

## 项目背景
这是一个 Electron + Vanilla JS 的彩票模拟器，使用原生CSS和Canvas API绘制图表。UI文件为 `js/ui.js`，样式为 `css/style.css`，图表逻辑在 `js/charts.js` 和 `js/charts/` 目录。

## UI架构

### 页面结构
```
index.html
├── .sidebar (左侧导航)
│   ├── h1 (标题)
│   ├── #lottery-tabs (彩票类型标签)
│   └── #reset-all-btn (清空按钮)
├── .main-wrapper
│   ├── .rules-section (玩法详情区)
│   │   ├── .analysis-nav-buttons (模拟/开奖/购买导航)
│   │   ├── #kl8-select-tabs (快乐8选号标签)
│   │   └── .rules-collapse (玩法详情折叠)
│   ├── .page-container
│   │   ├── #page-simulation (模拟摇号页)
│   │   ├── #page-draw-analysis (开奖数据分析页)
│   │   └── #page-purchase-analysis (购买数据分析页)
│   └── .history-section (历史记录)
```

### 显示/隐藏切换
- 页面切换: `.page.active` 控制显示
- 手选模式: `#draw-manual-select-area`, `#manual-select-area`
- 复式面板: `#random-multiple-area`
- 追加投注: `#add-on-row` (大乐透专属)
- 快乐8选号: `#kl8-select-tabs` (快乐8专属)

### 关键文件
| 文件 | 作用 |
|------|------|
| `css/style.css` | 全局样式 |
| `js/ui.js` | 主UI逻辑（DOM操作、事件绑定、渲染） |
| `js/charts.js` | Canvas图表绘制（bar/line/pie/heatmap） |
| `js/charts/base-chart.js` | 图表基类 |
| `js/charts/chart-functions.js` | 图表函数封装 |
| `js/utils/dom-helper.js` | DOM操作工具 |
| `js/utils/formatters.js` | 格式化工具（金额、百分比等） |
| `index.html` | 页面结构 |

## 设计规范

### CSS变量 (来自 style.css)
```css
--bg-primary, --bg-secondary, --bg-card
--text-primary, --text-secondary, --text-muted
--accent-primary, --accent-hover
--border-color
--radius-sm, --radius-md
```

### 颜色约定
- 红球/前区: `#e74c3c`
- 蓝球/后区: `#3498db`
- 收入: `#2ecc71`
- 支出: `#e74c3c`
- 模拟摇号按钮: `.btn-primary`
- 购买模拟按钮: `.btn-primary`

### Canvas图表
- 使用DPR适配高清屏
- 图表类型: 柱状图、折线图、饼图、热力图
- 支持Canvas动画过渡

## 美化指南

### CSS动画
- 号码球出场动画: `@keyframes ballAppear`
- 进度条过渡: `transition: width 0.3s`
- 面板切换: `opacity` + `transform` 过渡
- 避免使用 `left/top` 动画（性能差），使用 `transform`

### 交互优化
- 按钮hover/active状态
- 输入框focus样式
- 加载状态指示器
- 空状态占位符
- 错误状态提示

### 图表优化
- 颜色渐变
- 动画过渡
- 响应式尺寸
- 数据标签显示
- 坐标轴格式化

### 布局优化
- Flexbox布局为主
- 响应式断点考虑
- 滚动区域优化
- 间距一致性

## 操作指南

### 美化号码球
修改 `style.css` 中 `.ball` 相关样式，添加渐变、阴影、动画效果。

### 优化图表
在 `charts.js` 或 `charts/chart-functions.js` 中修改图表绘制逻辑，添加颜色渐变、动画、数据标签。

### 添加动画
1. 在 `style.css` 中定义 `@keyframes`
2. 在 `ui.js` 中通过添加/移除CSS类触发动画
3. 使用 `requestAnimationFrame` 实现Canvas动画

### 改进布局
1. 修改 `index.html` 结构
2. 调整 `style.css` 中的Flexbox/Grid布局
3. 在 `ui.js` 中更新动态渲染逻辑