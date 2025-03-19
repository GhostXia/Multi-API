# Multi-API

[English](README.md) | 简体中文

## 项目简介

Multi-API 是一个轻量级的后端服务，允许用户保存和切换多个API端点和密钥。通过简单的界面操作，您可以轻松管理和切换不同的API配置，且占用资源极少。

## 功能特点

- 多API端点管理
- API密钥安全存储
- 快速切换API配置
- 简洁的Web界面
- 支持数据备份
- 轻量级且资源占用少
- 跨平台支持（Windows、Linux、macOS）
- SillyTavern友好，无需在酒馆界面配置API
- 多语言界面（中文和英文）
- Debug模式用于API交互日志记录

## 系统要求

- 操作系统：Windows 7或更高版本、macOS 10.12或更高版本、Linux（需glibc 2.17或更高版本）
- 内存：最低512MB RAM
- 磁盘空间：100MB可用空间
- 网络：可用的互联网连接用于API访问

## 安装说明

1. 从发布页面下载最新版本的Multi-API应用
2. 解压下载的文件到本地目录
3. （可选）将 `.env.example` 复制为 `.env` 并自定义配置
4. 确保可执行文件具有适当的权限（Linux/macOS）

## 配置说明

### 环境变量

您可以在 `.env` 文件中自定义以下设置：

- `PORT`：服务器端口号（默认：3000）
- `DATA_DIR`：数据存储目录（默认：./data）
- `BACKUP_DIR`：备份存储目录（默认：./backups）
- `ENCRYPTION_KEY`：API凭证的自定义加密密钥

### 高级设置

- 在 `data/config.json` 中配置自动备份
- 在 `data/debug_logs/config.json` 中自定义日志级别
- 设置API请求的代理配置

## 使用方法

1. 在Linux/macOS系统上，执行 `./start.sh` 启动Multi-API服务；在Windows系统上，双击 `start.bat` 或执行 `start.bat`
2. 打开浏览器访问 http://localhost:3000 使用应用
3. 如需清理隐私数据，在Linux/macOS系统上执行 `./clean-privacy.sh`；在Windows系统上，双击 `clean-privacy.bat` 或执行 `clean-privacy.bat`

### API管理

1. 通过Web界面添加新的API端点
2. 为每个端点配置多个API密钥
3. 直接在界面中测试API连接
4. 即时切换不同的API配置

### SillyTavern集成

1. 完全兼容SillyTavern，无需在酒馆界面配置API
2. 在Multi-API后端配置好API后，酒馆可直接使用
3. 支持多个API端点的快速切换，无需重启酒馆
4. 自动同步API状态，确保酒馆使用最新配置

### 备份和恢复

1. 每日自动创建备份
2. 在 `backups/` 目录中访问备份文件
3. 通过Web界面从备份中恢复

## 目录结构

```
Multi-API/
├── Multi-API.exe       # 主程序
├── Clean-Privacy.exe   # 隐私数据清理工具
├── start.bat          # Windows启动脚本
├── start.sh           # Linux/macOS启动脚本
├── clean-privacy.bat  # Windows隐私数据清理脚本
├── clean-privacy.sh   # Linux/macOS隐私数据清理脚本
├── .env.example       # 环境配置示例
├── data/              # 数据目录
│   ├── db.json        # 数据库文件
│   └── debug_logs/    # 调试日志文件
└── backups/           # 备份目录
```

## 隐私安全

- 所有API密钥都使用行业标准加密存储
- 定期安全更新和漏洞修复
- 提供隐私数据清理工具
- 仅本地存储，数据不会上传到云端
- 可选的静态数据加密

## 故障排除

1. 如果服务无法启动：
   - 检查端口是否已被占用
   - 验证文件权限
   - 查看 `data/debug_logs/` 中的调试日志

2. 如果API连接失败：
   - 验证API端点URL
   - 检查网络连接
   - 确保API密钥有效

## 支持

- 查看调试日志获取详细错误信息
- 查看故障排除部分中的常见问题
- 通过问题追踪器提交错误报告