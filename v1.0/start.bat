@echo off
chcp 65001 >nul
echo ==============================================
echo          彩票摇号模拟器 - 一键启动
echo ==============================================
echo.

set "PACKAGE_JSON=package.json"
set "SCRIPT_DIR=%~dp0"
set "NODE_MODULES_DIR="

cd /d "%SCRIPT_DIR%"

if not exist "%PACKAGE_JSON%" (
    echo 错误：未找到 package.json 文件
    echo 当前目录：%cd%
    pause
    exit /b 1
)

if exist "node_modules" (
    set "NODE_MODULES_DIR=node_modules"
) else if exist "../node_modules" (
    set "NODE_MODULES_DIR=../node_modules"
    echo 提示：使用上级目录的 node_modules
)

if not defined NODE_MODULES_DIR (
    echo [1/2] 正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    call :run_npm install
    if %errorlevel% neq 0 (
        echo.
        echo 依赖安装失败，请检查网络连接并重试
        pause
        exit /b 1
    )
    echo.
    echo 依赖安装成功！
    set "NODE_MODULES_DIR=node_modules"
) else (
    echo [1/2] 依赖已安装，跳过安装步骤
)

echo.
echo [2/2] 正在启动彩票摇号模拟器...
echo.
call :run_npm start

if %errorlevel% neq 0 (
    echo.
    echo 启动失败，请检查错误信息
    pause
    exit /b 1
)

exit /b 0

:run_npm
if exist "node_modules\.bin\npm.cmd" (
    call "node_modules\.bin\npm.cmd" %*
) else if exist "../node_modules/.bin/npm.cmd" (
    call "../node_modules/.bin/npm.cmd" %*
) else (
    npm %*
)
exit /b %errorlevel%