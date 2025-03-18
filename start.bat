@echo off
chcp 65001 > nul
setlocal

echo 正在检查Node.js环境...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo 正在安装依赖...
npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

echo 正在修复依赖安全漏洞...
npm audit fix
if %errorlevel% neq 0 (
    echo [警告] 部分依赖可能存在安全风险
    choice /C YN /M "是否继续启动服务器？"
    if %errorlevel% equ 2 (
        echo 已取消启动服务器
        pause
        exit /b 1
    )
)

:start_server
echo 正在启动服务器...
npm start
if %errorlevel% neq 0 (
    echo [错误] 服务器启动失败
    choice /C YN /M "是否重试启动服务器？"
    if %errorlevel% equ 1 (
        echo 正在重试启动服务器...
        goto start_server
    ) else (
        echo 已取消启动服务器
        pause
        exit /b 1
    )
)

pause