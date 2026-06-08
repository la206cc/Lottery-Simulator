# Tasks

- [ ] Task 1: 修正彩票配置文件 `js/lottery-config.js` 中的错误
  - [ ] 修正大乐透poolTiers：奖池≥8亿时一等奖第二部分从20%改为50%，二等奖从22%改为40%
  - [ ] 修正大乐透一等奖maxTotal从10000000改为100000000（1亿元封顶）
  - [ ] 为七星彩添加poolTiers配置（奖池≤3亿正常/＞3亿倒置）
  - [ ] 修正七乐彩固定奖：五等奖50→60元，六等奖10→12元，七等奖5→10元
  - [ ] 为双色球添加二等奖poolRatio配置（常规期25%，特别期80%）
  - [ ] 补充完整的规则描述文本（rules字段用详细的多行文本替换简短描述）

- [ ] Task 2: 优化奖金计算器 `js/core/prize-calculator.js`
  - [ ] 实现七星彩奖池倒置逻辑（基于poolTiers的第二部分）
  - [ ] 实现双色球特别期（奖池≥15亿）的二等奖80%分配
  - [ ] 实现保底规则（一等奖>=二等奖×2，二等奖>=6000元）
  - [ ] 修复二等奖计算逻辑：应从浮动奖基数按比例计算，而非简单的剩余部分
  - [ ] 实现大乐透追加投注的准确计算（按0.8注计算，而非简单乘1.8）

- [ ] Task 3: 消除代码重复，统一使用 `prize-calculator.js`
  - [ ] 删除 `js/ui.js` 中重复的 `calculateTieredPrize` 函数
  - [ ] 删除 `js/ui.js` 中重复的 `getFixedPrizeAmount` 函数
  - [ ] 在 `js/ui.js` 顶部添加从 `prize-calculator.js` 的导入语句
  - [ ] 验证所有调用处行为一致

- [ ] Task 4: 完善玩法详情展示
  - [ ] 重写 `generatePrizeIllustration` 函数，生成包含奖级表的HTML
  - [ ] 添加浮动奖金计算公式展示（按奖池分段显示公式）
  - [ ] 添加保底规则和封顶规则的文字说明
  - [ ] 确保折叠展开动画流畅

- [ ] Task 5: 优化购买数据分析展示
  - [ ] 在中奖明细表中增加当前奖池档位信息展示
  - [ ] 一等奖有命中时，显示第一部分/第二部分各自的奖金明细
  - [ ] 显示封顶规则是否触发及触发后单注奖金调整
  - [ ] 显示保底规则是否触发

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 and Task 5 can be done in parallel, both depend on Task 1