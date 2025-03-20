package config

import (
	"os"
	"path/filepath"
)

// Config 存储应用程序配置
type Config struct {
	Port           string
	DataDir        string
	DBPath         string
	DebugLogsDir   string
	CurrentLogFile string
}

// 全局配置实例
var AppConfig *Config

// InitConfig 初始化应用程序配置
func InitConfig() *Config {
	// 确保数据目录存在
	dataDir := filepath.Join(".", "data")
	debugLogsDir := filepath.Join(dataDir, "debug_logs")

	// 创建配置实例
	AppConfig = &Config{
		Port:         os.Getenv("PORT"),
		DataDir:      dataDir,
		DBPath:       filepath.Join(dataDir, "db.json"),
		DebugLogsDir: debugLogsDir,
	}

	// 如果未设置端口，使用默认值
	if AppConfig.Port == "" {
		AppConfig.Port = "3000"
	}

	// 确保目录存在
	os.MkdirAll(dataDir, 0755)
	os.MkdirAll(debugLogsDir, 0755)

	return AppConfig
}

// GetConfig 返回应用程序配置
func GetConfig() *Config {
	if AppConfig == nil {
		return InitConfig()
	}
	return AppConfig
}
