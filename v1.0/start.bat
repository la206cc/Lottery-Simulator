@echo off
chcp 65001 >nul
echo ==============================================
echo          彩票摇号模拟器 - 一键启动
echo ==============================================
echo.

set "NODE_MODULES_DIR=node_modules"
set "PACKAGE_JSON=package.json"

if not exist "%PACKAGE_JSON%" (
    echo 错误：未找到 package.json 文件
    echo 当前目录：%cd%
    pause
    exit /b 1
)

if not exist "%NODE_MODULES_DIR%" (
    echo [1/2] 正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo 依赖安装失败，请检查网络连接并重试
        pause
        exit /b 1
    )
    echo.
    echo 依赖安装成功！
) else (
    echo [1/2] 依赖已安装，跳过安装步骤
)

echo.
echo [2/2] 正在启动彩票摇号模拟器...
echo.
npm start

if %errorlevel% neq 0 (
    echo.
    echo 启动失败，请检查错误信息
    pause
    exit /b 1
)

exit /b 0