@echo off
chcp 65001 >nul
rem ==== 关卡花色统计 一键启动 ====
rem 双击本文件：若服务已在运行则直接打开页面，否则后台静默启动服务再打开。
cd /d "%~dp0"

rem 检测 8778 端口是否已在监听
netstat -ano | findstr ":8778 " | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
    echo 服务已在运行，正在打开页面...
    start "" "http://127.0.0.1:8778/"
    goto :eof
)

echo 正在后台启动本地服务...
rem pythonw 无黑窗后台运行；--no-browser 让本脚本统一控制开页，避免开两个标签
start "" pythonw "%~dp0server.py" --port 8778 --no-browser

rem 等待 2 秒让服务起好，再打开页面
timeout /t 2 >nul
start "" "http://127.0.0.1:8778/"
