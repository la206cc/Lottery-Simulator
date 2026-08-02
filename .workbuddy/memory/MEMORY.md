# 彩票模拟器项目备忘

## 项目概述
- 通用彩票模拟器 v3.0
- 支持 8 种官方彩种：双色球、大乐透、福彩3D、七星彩、排列三、排列五、七乐彩、快乐8
- 完全配置化架构，支持自定义彩票类型

## 技术栈
- 前端：HTML/CSS/JavaScript（静态页面）
- 后端：Python（核心引擎 + Flask API）
- 存储：本地 JSON 文件 + localStorage

## 关键文件
- v3.0/api.py - 统一服务器 (Flask API + 静态文件) → 端口5000
- v3.0/src/core/ - 核心引擎 (main.py, calculators.py, simulators.py 等)
- v3.0/index.html - SPA 主页面 (sidebar + 4 Tab)
- v3.0/css/style.css - 统一 CSS (v2.0 深色主题)
- v3.0/js/app.js - 主控逻辑
- v3.0/js/draw.js - 开奖模拟模块
- v3.0/js/bet-sim.js - 投注模拟 + 参数面板
- v3.0/js/analysis.js - 数据分析模块
- v3.0/js/params.js - 8彩种参数预设数据
- v3.0/SPEC.md - 完整实现规格文档

## 启动方式
- 运行 `python api.py` 启动统一服务器
- 访问：http://localhost:5000

## 设计决策
- v2.0 深色主题 (#0a0a1a / #16213e / #e94560)
- 参数面板从 docs 双色球模板移植滑块联动算法
- server.py 已废弃，api.py 合并静态文件服务
