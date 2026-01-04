#!/bin/bash

echo "正在启动Multi-API服务..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 根据操作系统类型执行不同的启动命令
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # macOS或Linux系统
  "$SCRIPT_DIR/Multi-API.exe"
else
  # Windows系统
  start "" "$SCRIPT_DIR\Multi-API.exe"
fi
