@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONUTF8=1
py -m backend.server --host 127.0.0.1 --port 8400
