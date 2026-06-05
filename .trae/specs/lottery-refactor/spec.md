# 彩票模拟器重构规格文档

## 为什么

当前项目存在以下核心问题，严重影响代码的可维护性、可扩展性和运行稳定性：

1. **ui.js文件过大**（2855行）：所有UI逻辑集中在一个文件中，导致代码难以维护
2. **代码大量重复**：simulator.js和worker.js中重复实现了drawOne、checkPrize等核心函数
3. **状态管理混乱**：状态分散在多个全局变量中，无集中管理
4. **模块职责不清**：ui.js同时处理UI渲染、状态管理、数据处理等多种职责
5. **图表代码重复**：每个图表函数都重复实现了ResizeObserver逻辑
6. **配置与逻辑耦合**：lottery-config.js中包含大量HTML字符串

## 现状分析

### 当前项目结构
```
lottery-simulator/
├── js/
│   ├── app.js           - 应用入口，初始化 (10行)
│   ├── ui.js            - UI逻辑和事件绑定 (2855行，极大)
│   ├── simulator.js     - 核心摇号和中奖逻辑 (470行)
│   ├── lottery-config.js - 彩票配置 (280行)
│   ├── analyzer.js      - 数据分析 (310行)
│   ├── charts.js        - 图表绘制 (705行)
│   └── worker.js        - Web Worker (372行)
├── css/
│   └── style.css        - 样式
├── electron/
│   └── main.js          - Electron主进程
├── index.html           - 主页面
├── package.json         - 项目配置
└── server.js            - 本地服务器
```

### 支持的彩票类型（10种）
1. 双色球 (ssq)
2. 大乐透 (dlt)
3. 福彩3D (fc3d)
4. 七星彩 (qxc)
5. 排列三 (pls)
6. 排列五 (plw)
7. 七乐彩 (qlc)
8. 快乐8 (kl8)
9. Powerball (美国)
10. Mega Millions (美国)
11. EuroMillions (欧洲)
12. UK Lotto (英国)

### 功能模块（当前分散）
1. **模拟摇号模块** - 单次摇奖、批量模拟
2. **购买模拟模块** - 机选/手选、单注/复式、倍数/追加
3. **数据分析模块** - 频率/遗漏/奇偶/和值/连号/区间/大小/012路/跨度/重号/邻号
4. **图表展示模块** - 柱状图/折线图/饼图/热力图
5. **历史记录模块** - 开奖历史、购买历史
6. **奖池管理模块** - 奖池金额、奖金计算

## 目标结构

```
lottery-simulator/
├── js/
│   ├── app.js                 - 应用入口
│   ├── core/
│   │   ├── lottery.js         - 彩票核心逻辑（摇号/中奖判断）
│   │   ├── prize-calculator.js - 奖金计算
│   │   └── random-engine.js    - 随机数引擎
│   ├── data/
│   │   ├── lottery-config.js  - 彩票配置数据
│   │   ├── prize-rules.js      - 奖金规则数据
│   │   └── lottery-descriptions.js - 玩法说明HTML
│   ├── analysis/
│   │   ├── frequency.js       - 频率分析
│   │   ├── missing.js          - 遗漏分析
│   │   ├── odd-even.js         - 奇偶分析
│   │   ├── sum.js              - 和值分析
│   │   ├── consecutive.js      - 连号分析
│   │   ├── range.js            - 区间分析
│   │   ├── big-small.js        - 大小分析
│   │   ├── road012.js          - 012路分析
│   │   ├── span.js             - 跨度分析
│   │   ├── repeat.js           - 重号分析
│   │   └── neighbor.js         - 邻号分析
│   ├── charts/
│   │   ├── base-chart.js       - 图表基类（包含ResizeObserver）
│   │   ├── bar-chart.js         - 柱状图
│   │   ├── line-chart.js       - 折线图
│   │   ├── pie-chart.js        - 饼图
│   │   └── heatmap.js          - 热力图
│   ├── state/
│   │   └── state-manager.js    - 状态管理
│   ├── ui/
│   │   ├── page-init.js        - 页面初始化
│   │   ├── tabs-nav.js         - 标签页导航
│   │   ├── draw-panel.js       - 摇奖面板
│   │   ├── purchase-panel.js   - 购买面板
│   │   ├── analysis-panel.js   - 分析面板
│   │   ├── history-panel.js    - 历史面板
│   │   ├── prize-pool-panel.js - 奖池面板
│   │   └── result-renderer.js  - 结果渲染
│   ├── worker/
│   │   └── simulation-worker.js - Web Worker
│   └── utils/
│       ├── dom-helper.js       - DOM操作工具
│       ├── formatters.js        - 格式化工具
│       └── validators.js        - 验证工具
├── css/
│   └── style.css
├── electron/
│   └── main.js
├── index.html
├── package.json
└── server.js
```

## 优化方案

### 1. 代码去重
- 抽取simulator.js和worker.js中的公共函数到core/lottery.js
- 抽取到core/random-engine.js处理随机算法
- 确保所有模块使用统一的随机数种子

### 2. 状态集中管理
- 创建state-manager.js统一管理：
  - 当前彩票类型
  - 模拟结果数据
  - 购买记录历史
  - 用户设置
  - UI状态

### 3. 模块职责分离
- **core/** - 纯逻辑，不依赖DOM
- **data/** - 配置数据，无逻辑
- **analysis/** - 数据分析，输出统计结果
- **charts/** - 图表绘制，依赖canvas
- **ui/** - UI渲染，依赖DOM
- **state/** - 状态管理，连接各模块

### 4. 图表模块重构
- 创建base-chart.js实现公共的ResizeObserver逻辑
- 各图表类型继承基类，减少重复代码
- 统一tooltip、颜色等配置

### 5. 数据配置分离
- lottery-config.js只保留结构化配置
- 玩法说明HTML移到lottery-descriptions.js
- 奖金规则移到prize-rules.js

## 影响

### 影响的规格
- 所有现有功能需要重新验证
- UI交互逻辑需要保持一致

### 影响的代码
- **必须修改**：所有JS文件
- **保持不变**：index.html结构、style.css样式
- **可能调整**：electron/main.js（如果需要适配新模块结构）

## 重构原则

1. **保持UI不变**：不改变用户看到的界面和交互
2. **功能等价**：重构前后功能完全一致
3. **渐进式重构**：每次只重构一个模块，验证通过后再进行下一个
4. **向后兼容**：保持外部接口不变，内部实现优化
5. **性能优先**：优化数据结构和算法，提高运行效率

## 验收标准

1. 所有10+种彩票类型功能正常
2. 模拟摇奖结果正确
3. 购买模拟和中奖判断正确
4. 所有11种数据分析图表正常显示
5. 历史记录功能正常
6. 奖池计算正确
7. CSV导出功能正常
8. 批量模拟（10000+）不阻塞UI
9. 代码可读性显著提升
10. 新增功能模块时不需要修改现有稳定代码
