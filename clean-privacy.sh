#!/bin/bash

# 设置Node.js环境变量
export NODE_ENV=production

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 切换到脚本所在目录
cd "$SCRIPT_DIR"

# 运行clean-privacy.js
node clean-privacy.js