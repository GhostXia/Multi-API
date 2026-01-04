#!/bin/bash

echo "正在启动隐私数据清理工具..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 执行清理工具
"$SCRIPT_DIR/Clean-Privacy.exe"
