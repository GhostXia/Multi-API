# Multi-API 应用

## 功能特点

- 多API端点管理和切换
- API密钥安全存储
- 多语言界面（中文和英文）
- Debug模式用于API交互日志记录
- 轻量级且资源占用少

## 使用说明

1. 在Linux/macOS系统上，执行 ./start.sh 启动Multi-API服务；在Windows系统上，双击 start.bat 或执行 start.bat
2. 打开浏览器访问 http://localhost:3000 使用应用
3. 如需清理隐私数据，在Linux/macOS系统上执行 ./clean-privacy.sh；在Windows系统上，双击 clean-privacy.bat 或执行 clean-privacy.bat
4. 在界面右上角可以切换语言（中文/英文）
5. 在代理信息卡片中可以开启/关闭Debug模式，记录API交互日志

## 文件说明

- Multi-API.exe: 主程序
- Clean-Privacy.exe: 隐私数据清理工具
- start.sh: 启动脚本
- start.bat: Windows启动脚本
- clean-privacy.sh: 隐私数据清理脚本
- clean-privacy.bat: Windows隐私数据清理脚本
- data/db.json: 数据库文件
- backups/: 备份目录
- public/: 静态资源目录
- src/: 源代码目录
