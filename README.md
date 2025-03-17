# Multi-API

English | [简体中文](README_ZH.md)

## Introduction

Multi-API is a backend service that allows users to save and switch between multiple API endpoints and keys. Through a simple interface, you can easily manage and switch between different API configurations.

## Features

- Multiple API endpoint management
- Secure API key storage
- Quick API configuration switching
- Clean web interface
- Data backup support

## Installation

1. Download the latest version of Multi-API application
2. Extract the downloaded files to a local directory

## Usage

1. On Linux/macOS, run `./start.sh` to start the Multi-API service; on Windows, double-click `start.bat` or run `start.bat`
2. Open your browser and visit http://localhost:3000 to use the application
3. To clean privacy data, on Linux/macOS run `./clean-privacy.sh`; on Windows, double-click `clean-privacy.bat` or run `clean-privacy.bat`

## File Description

- `Multi-API.exe`: Main program
- `Clean-Privacy.exe`: Privacy data cleaning tool
- `start.sh`: Startup script
- `clean-privacy.sh`: Privacy data cleaning script
- `data/db.json`: Database file
- `backups/`: Backup directory

## Privacy & Security

- All API keys are stored with encryption
- Privacy data cleaning tool provided
- Local storage, no data uploaded to cloud