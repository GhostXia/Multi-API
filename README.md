# Multi-API

English | [简体中文](README_ZH.md)

## Introduction

Multi-API is a lightweight backend service that allows users to save and switch between multiple API endpoints and keys. Through a simple interface, you can easily manage and switch between different API configurations with minimal resource usage.

## Features

- Multiple API endpoint management
- Secure API key storage
- Quick API configuration switching
- Clean web interface
- Data backup support
- Lightweight and resource-efficient
- Cross-platform support (Windows, Linux, macOS)
- Multilingual interface (English and Chinese)
- Debug mode for API interaction logging

## System Requirements

- Operating System: Windows 7 or later, macOS 10.12 or later, Linux with glibc 2.17 or later
- Memory: 512MB RAM minimum
- Disk Space: 100MB free space
- Network: Active internet connection for API access

## Installation

1. Download the latest version of Multi-API application from the releases page
2. Extract the downloaded files to a local directory
3. (Optional) Copy `.env.example` to `.env` and customize the configuration
4. Ensure the executable files have proper permissions (Linux/macOS)

## Configuration

### Environment Variables

You can customize the following settings in the `.env` file:

- `PORT`: Server port number (default: 3000)
- `DATA_DIR`: Data storage directory (default: ./data)
- `BACKUP_DIR`: Backup storage directory (default: ./backups)
- `ENCRYPTION_KEY`: Custom encryption key for API credentials

### Advanced Settings

- Configure automatic backups in `data/config.json`
- Customize logging levels in `data/debug_logs/config.json`
- Set up proxy settings for API requests

## Usage

1. On Linux/macOS, run `./start.sh` to start the Multi-API service; on Windows, double-click `start.bat` or run `start.bat`
2. Open your browser and visit http://localhost:3000 to use the application
3. To clean privacy data, on Linux/macOS run `./clean-privacy.sh`; on Windows, double-click `clean-privacy.bat` or run `clean-privacy.bat`

### API Management

1. Add new API endpoints through the web interface
2. Configure multiple API keys for each endpoint
3. Test API connections directly from the interface
4. Switch between different API configurations instantly

### Backup and Recovery

1. Automatic backups are created daily
2. Access backup files in the `backups/` directory
3. Restore from backup through the web interface

## Directory Structure

```
Multi-API/
├── Multi-API.exe       # Main program
├── Clean-Privacy.exe   # Privacy data cleaning tool
├── start.bat          # Windows startup script
├── start.sh           # Linux/macOS startup script
├── clean-privacy.bat  # Windows privacy cleaning script
├── clean-privacy.sh   # Linux/macOS privacy cleaning script
├── .env.example       # Example environment configuration
├── data/              # Data directory
│   ├── db.json        # Database file
│   └── debug_logs/    # Debug log files
└── backups/           # Backup directory
```

## Privacy & Security

- All API keys are stored with industry-standard encryption
- Regular security updates and vulnerability patches
- Privacy data cleaning tool provided
- Local storage only, no data uploaded to cloud
- Optional data encryption at rest

## Troubleshooting

1. If the service fails to start:
   - Check if the port is already in use
   - Verify file permissions
   - Review debug logs in `data/debug_logs/`

2. If API connections fail:
   - Verify API endpoint URLs
   - Check network connectivity
   - Ensure API keys are valid

## Support

- Check debug logs for detailed error information
- Review common issues in the troubleshooting section
- Submit bug reports through the issue tracker