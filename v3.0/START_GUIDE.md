# 彩票模拟器 v3.0 启动指南

## 快速启动

### 方法一：使用启动脚本（推荐）
双击运行 `start.bat`，会自动启动两个服务器。

### 方法二：手动启动
打开两个命令行窗口，分别运行：

**窗口 1 - API 服务器：**
```bash
cd v3.0
python api.py
```

**窗口 2 - 静态文件服务器：**
```bash
cd v3.0
python server.py
```

## 访问地址

- **主页**: http://localhost:8080
- **模拟器**: http://localhost:8080/ui/html/simulator.html
- **配置编辑器**: http://localhost:8080/ui/html/config-editor.html
- **投注配置**: http://localhost:8080/ui/html/bet-config-editor.html

## API 接口

- 健康检查: http://localhost:5000/api/health
- 预设列表: http://localhost:5000/api/presets
- 获取配置: http://localhost:5000/api/config/{id}
- 执行模拟: POST http://localhost:5000/api/simulate

## 使用步骤

1. 运行 `start.bat` 启动服务器
2. 打开浏览器访问 http://localhost:8080/ui/html/simulator.html
3. 选择彩种（如双色球）
4. 设置模拟参数（轮次、资金等）
5. 选择投注策略
6. 点击"开始模拟"
7. 查看模拟结果

## 注意事项

- 需要 Python 3.8+ 环境
- 需要安装 Flask：`pip install flask flask-cors`
- 首次运行可能需要安装依赖
