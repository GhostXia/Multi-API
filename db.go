package models

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// DB 结构体用于存储和管理数据
type DB struct {
	filePath string
	mutex    sync.RWMutex
	data     *DBData
}

// DBData 结构体定义了数据库的结构
type DBData struct {
	APIConfigs   []APIConfig `json:"apiConfigs"`
	ActiveConfig string      `json:"activeConfig"`
	DebugMode    bool        `json:"debugMode"`
	DebugLogs    []DebugLog  `json:"debugLogs"`
	Language     string      `json:"language"`
}

// APIConfig 结构体定义了API配置
type APIConfig struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Endpoint string `json:"endpoint"`
	APIKey   string `json:"apiKey"`
	Model    string `json:"model,omitempty"`
}

// DebugLog 结构体定义了调试日志
type DebugLog struct {
	Timestamp string                 `json:"timestamp"`
	Type      string                 `json:"type"`
	Request   map[string]interface{} `json:"request,omitempty"`
	Response  map[string]interface{} `json:"response,omitempty"`
}

// 全局数据库实例
var instance *DB
var once sync.Once

// InitDB 初始化数据库
func InitDB() error {
	var err error
	once.Do(func() {
		// 确保数据目录存在
		dbDirectory := filepath.Join(".", "data")
		if _, err = os.Stat(dbDirectory); os.IsNotExist(err) {
			err = os.MkdirAll(dbDirectory, 0755)
			if err != nil {
				return
			}
		}

		dbPath := filepath.Join(dbDirectory, "db.json")
		instance = &DB{
			filePath: dbPath,
			data: &DBData{
				APIConfigs:   []APIConfig{},
				ActiveConfig: "",
				DebugMode:    false,
				DebugLogs:    []DebugLog{},
				Language:     "zh", // 默认语言设置为中文
			},
		}

		// 如果文件存在，则加载数据
		if _, err = os.Stat(dbPath); !os.IsNotExist(err) {
			var file *os.File
			file, err = os.Open(dbPath)
			if err != nil {
				return
			}
			defer file.Close()

			decoder := json.NewDecoder(file)
			err = decoder.Decode(instance.data)
			if err != nil {
				return
			}
		} else {
			// 如果文件不存在，则创建并保存默认数据
			err = instance.Save()
		}
	})

	return err
}

// GetDB 返回数据库实例
func GetDB() *DB {
	return instance
}

// Save 保存数据到文件
func (db *DB) Save() error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	file, err := os.Create(db.filePath)
	if err != nil {
		return fmt.Errorf("创建数据库文件失败: %w", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(db.data); err != nil {
		return fmt.Errorf("编码数据失败: %w", err)
	}

	return nil
}

// GetAllConfigs 获取所有API配置
func (db *DB) GetAllConfigs() []APIConfig {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	configs := make([]APIConfig, len(db.data.APIConfigs))
	copy(configs, db.data.APIConfigs)
	return configs
}

// GetConfig 根据ID获取API配置
func (db *DB) GetConfig(id string) (APIConfig, bool) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	for _, config := range db.data.APIConfigs {
		if config.ID == id {
			return config, true
		}
	}

	return APIConfig{}, false
}

// AddConfig 添加新的API配置
func (db *DB) AddConfig(config APIConfig) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.data.APIConfigs = append(db.data.APIConfigs, config)

	// 如果是第一个配置，自动设为活跃配置
	if len(db.data.APIConfigs) == 1 {
		db.data.ActiveConfig = config.ID
	}

	return db.Save()
}

// UpdateConfig 更新API配置
func (db *DB) UpdateConfig(config APIConfig) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	for i, c := range db.data.APIConfigs {
		if c.ID == config.ID {
			db.data.APIConfigs[i] = config
			return db.Save()
		}
	}

	return fmt.Errorf("未找到配置: %s", config.ID)
}

// DeleteConfig 删除API配置
func (db *DB) DeleteConfig(id string) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	for i, config := range db.data.APIConfigs {
		if config.ID == id {
			// 从切片中删除该配置
			db.data.APIConfigs = append(db.data.APIConfigs[:i], db.data.APIConfigs[i+1:]...)

			// 如果删除的是当前活跃配置，重置活跃配置
			if db.data.ActiveConfig == id {
				if len(db.data.APIConfigs) > 0 {
					db.data.ActiveConfig = db.data.APIConfigs[0].ID
				} else {
					db.data.ActiveConfig = ""
				}
			}

			return db.Save()
		}
	}

	return fmt.Errorf("未找到配置: %s", id)
}

// SetActiveConfig 设置活跃配置
func (db *DB) SetActiveConfig(id string) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	// 验证配置是否存在
	var exists bool
	for _, config := range db.data.APIConfigs {
		if config.ID == id {
			exists = true
			break
		}
	}

	if !exists {
		return fmt.Errorf("未找到配置: %s", id)
	}

	db.data.ActiveConfig = id
	return db.Save()
}

// GetActiveConfig 获取当前活跃配置
func (db *DB) GetActiveConfig() (APIConfig, bool) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	if db.data.ActiveConfig == "" {
		return APIConfig{}, false
	}

	for _, config := range db.data.APIConfigs {
		if config.ID == db.data.ActiveConfig {
			return config, true
		}
	}

	return APIConfig{}, false
}

// GetDebugMode 获取Debug模式状态
func (db *DB) GetDebugMode() bool {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	return db.data.DebugMode
}

// SetDebugMode 设置Debug模式状态
func (db *DB) SetDebugMode(enabled bool) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.data.DebugMode = enabled
	return db.Save()
}

// AddDebugLog 添加调试日志
func (db *DB) AddDebugLog(log DebugLog) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.data.DebugLogs = append(db.data.DebugLogs, log)
	return db.Save()
}

// GetLanguage 获取当前语言设置
func (db *DB) GetLanguage() string {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	return db.data.Language
}

// SetLanguage 设置语言
func (db *DB) SetLanguage(lang string) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	db.data.Language = lang
	return db.Save()
}