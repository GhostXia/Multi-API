# Multi-API

[English](README.md) | 简体中文

## 项目简介

Multi-API 是一个允许用户保存和切换多个API端点和密钥的后端服务。通过简单的界面操作，您可以轻松管理和切换不同的API配置。

## 功能特点

- 多API端点管理
- API密钥安全存储
- 快速切换API配置
- 简洁的Web界面
- 支持数据备份

## 安装说明

1. 下载最新版本的Multi-API应用
2. 解压下载的文件到本地目录

## 使用方法

1. 在Linux/macOS系统上，执行 `./start.sh` 启动Multi-API服务；在Windows系统上，双击 `start.bat` 或执行 `start.bat`
2. 打开浏览器访问 http://localhost:3000 使用应用
3. 如需清理隐私数据，在Linux/macOS系统上执行 `./clean-privacy.sh`；在Windows系统上，双击 `clean-privacy.bat` 或执行 `clean-privacy.bat`

## 文件说明

- `Multi-API.exe`: 主程序
- `Clean-Privacy.exe`: 隐私数据清理工具
- `start.sh`: 启动脚本
- `clean-privacy.sh`: 隐私数据清理脚本
- `data/db.json`: 数据库文件
- `backups/`: 备份目录

## 隐私安全

- 所有API密钥都经过加密存储
- 提供隐私数据清理工具
- 本地存储，数据不会上传到云端