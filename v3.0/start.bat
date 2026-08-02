@echo off
echo ========================================
echo 彩票模拟器启动脚本
echo ========================================
echo.

echo 启动 API 服务器 (端口 5000)...
start "API Server" python api.py

echo 启动静态文件服务器 (端口 8080)...
start "Static Server" python server.py

echo.
echo ========================================
echo 服务器已启动！
echo.
echo 静态文件服务器: http://localhost:8080
echo API 服务器: http://localhost:5000
echo.
echo 模拟器页面: http://localhost:8080/ui/html/simulator.html
echo ========================================
echo.
echo 按任意键退出此窗口...
pause > nul
