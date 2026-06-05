# 重构任务清单

## 阶段一：核心代码提取与去重

### 任务1：提取公共随机数引擎
- [ ] 创建 `js/core/random-engine.js`
  - 抽取 fisherYatesPick 函数
  - 抽取 randomPick 函数
  - 统一随机数生成算法
- [ ] 验证：与原代码随机结果一致

### 任务2：创建核心彩票逻辑模块
- [ ] 创建 `js/core/lottery.js`
  - 抽取 drawOne 函数（从 simulator.js 和 worker.js 去重）
  - 抽取 checkPrize 函数（从 simulator.js 和 worker.js 去重）
  - 抽取 combinations 和 cartesianProduct 函数
- [ ] 验证：中奖判断逻辑与原代码完全一致

### 任务3：创建奖金计算模块
- [ ] 创建 `js/core/prize-calculator.js`
  - 计算固定奖金
  - 计算浮动奖金（支持分档算法）
  - 支持追加投注计算
  - 支持奖池封顶计算
- [ ] 验证：各种奖池档位的奖金计算正确

## 阶段二：配置数据分离

### 任务4：分离玩法说明HTML
- [ ] 创建 `js/data/lottery-descriptions.js`
  - 从 lottery-config.js 抽取所有 description HTML字符串
  - 使用独立模块导出
- [ ] 修改 `js/data/lottery-config.js`
  - 移除 description 字段
  - 保留纯结构化配置
- [ ] 验证：玩法说明显示正常

### 任务5：分离奖金规则
- [ ] 创建 `js/data/prize-rules.js`
  - 从 lottery-config.js 抽取所有 prizes 配置
  - 奖金档位规则独立配置
- [ ] 验证：奖金计算结果不变

## 阶段三：状态管理重构

### 任务6：创建状态管理器
- [ ] 创建 `js/state/state-manager.js`
  - 管理当前彩票类型
  - 管理模拟结果数据 (simulationResults)
  - 管理购买记录历史 (purchaseHistoryMap)
  - 管理用户设置 (betMode, betType, betMultiplier, addOnEnabled)
  - 管理UI状态 (currentPage, bulletinPage等)
  - 提供事件通知机制
- [ ] 验证：所有状态读写正常

### 任务7：创建DOM操作工具
- [ ] 创建 `js/utils/dom-helper.js`
  - 封装 querySelector/querySelectorAll
  - 封装事件绑定
  - 封装元素创建
- [ ] 验证：UI交互正常

### 任务8：创建格式化工具
- [ ] 创建 `js/utils/formatters.js`
  - formatMoney 函数
  - formatNumber 函数
  - formatPercentage 函数
- [ ] 验证：数字显示格式正确

## 阶段四：图表模块重构

### 任务9：创建图表基类
- [ ] 创建 `js/charts/base-chart.js`
  - ResizeObserver 逻辑抽取
  - Canvas setup/teardown 方法
  - Tooltip 统一处理
  - debounce 函数
- [ ] 验证：图表响应式正常

### 任务10：重构柱状图
- [ ] 创建 `js/charts/bar-chart.js`
  - 继承 BaseChart
  - 实现柱状图特有逻辑
- [ ] 验证：频率、遗漏等柱状图显示正常

### 任务11：重构折线图
- [ ] 创建 `js/charts/line-chart.js`
  - 继承 BaseChart
  - 实现折线图特有逻辑
- [ ] 验证：和值分布等折线图显示正常

### 任务12：重构饼图和热力图
- [ ] 创建 `js/charts/pie-chart.js`
- [ ] 创建 `js/charts/heatmap.js`
- [ ] 验证：奇偶比、号码热度饼图和热力图显示正常

### 任务13：删除旧的 charts.js
- [ ] 确认所有图表功能已迁移
- [ ] 删除原 `js/charts.js`
- [ ] 更新所有导入引用

## 阶段五：UI模块拆分

### 任务14：拆分页面初始化
- [ ] 创建 `js/ui/page-init.js`
  - 标签页渲染
  - 规则显示
  - 初始状态设置
- [ ] 验证：页面加载正常

### 任务15：拆分摇奖面板
- [ ] 创建 `js/ui/draw-panel.js`
  - 单次摇奖逻辑
  - 批量模拟逻辑
  - 结果动画
  - 进度条
- [ ] 验证：摇奖功能正常

### 任务16：拆分购买面板
- [ ] 创建 `js/ui/purchase-panel.js`
  - 机选/手选切换
  - 单注/复式切换
  - 号码选择面板
  - 倍数/追加设置
  - 购买历史导航
- [ ] 验证：购买功能正常

### 任务17：拆分分析面板
- [ ] 创建 `js/ui/analysis-panel.js`
  - 分析标签页切换
  - 各种分析图表渲染
  - 统计数据展示
- [ ] 验证：所有11种分析正常

### 任务18：拆分历史面板
- [ ] 创建 `js/ui/history-panel.js`
  - 历史记录表格
  - 分页导航
  - CSV导出
- [ ] 验证：历史记录功能正常

### 任务19：拆分奖池面板
- [ ] 创建 `js/ui/prize-pool-panel.js`
  - 奖池金额输入
  - 预设按钮
  - 奖池显示
- [ ] 验证：奖池功能正常

### 任务20：拆分结果渲染
- [ ] 创建 `js/ui/result-renderer.js`
  - 开奖结果渲染
  - 中奖结果显示
  - 财务概览渲染
  - 号码热度渲染
- [ ] 验证：结果展示正常

## 阶段六：主UI文件重构

### 任务21：重构主UI文件
- [ ] 重写 `js/ui.js`
  - 导入所有新模块
  - 协调各UI组件
  - 处理模块间通信
  - 移除所有已迁移的函数
- [ ] 验证：整个应用运行正常

### 任务22：重构Worker文件
- [ ] 重写 `js/worker.js`
  - 使用 core/lottery.js 的公共函数
  - 保持批量处理逻辑
  - 支持取消操作
- [ ] 验证：大批量模拟正常

## 阶段七：清理与优化

### 任务23：清理旧文件
- [ ] 删除重复代码后的 `js/simulator.js`
  - 只保留导出接口
  - 调用 core/lottery.js
- [ ] 删除 `js/analyzer.js` 已迁移的分析函数
  - 更新导入引用

### 任务24：性能优化
- [ ] 检查并优化大数据量处理
- [ ] 检查内存泄漏风险
- [ ] 验证批量模拟性能

### 任务25：全面测试
- [ ] 测试所有12种彩票类型
- [ ] 测试所有分析图表
- [ ] 测试购买和中奖逻辑
- [ ] 测试历史记录
- [ ] 测试CSV导出
- [ ] 测试Electron桌面应用

## 任务依赖关系

```
阶段一（任务1-3）→ 阶段二（任务4-5）→ 阶段三（任务6-8）→ 阶段四（任务9-13）→ 阶段五（任务14-20）→ 阶段六（任务21-22）→ 阶段七（任务23-25）
```

## 验证策略

每完成一个任务，必须进行以下验证：
1. 代码无语法错误
2. 相关功能可正常运行
3. 控制台无错误输出
4. UI显示符合预期
