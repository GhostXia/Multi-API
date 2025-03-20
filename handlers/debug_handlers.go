package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"multi-api/config"
	"multi-api/models"
)

// 当前debug会话的日志文件路径
var currentDebugLogFile string

// 当前debug会话的开始时间
var debugSessionStartTime time.Time

// SetDebugMode 设置Debug模式状态
func SetDebugMode(c *gin.Context) {
	var requestBody struct {
		Enabled bool `json:"enabled" binding:"required"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "参数错误，enabled必须为布尔值",
		})
		return
	}

	db := models.GetDB()

	if requestBody.Enabled {
		// 开启Debug模式时，创建新的会话日志文件
		cfg := config.GetConfig()
		debugDirectory := cfg.DebugLogsDir

		// 确保目录存在
		if err := os.MkdirAll(debugDirectory, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "创建调试日志目录失败: " + err.Error(),
			})
			return
		}

		// 设置会话开始时间
		debugSessionStartTime = time.Now()
		timestamp := debugSessionStartTime.Format("2006-01-02T15-04-05")

		// 创建会话日志文件
		currentDebugLogFile = filepath.Join(debugDirectory, fmt.Sprintf("debug_session_%s.json", timestamp))

		// 写入会话开始记录
		sessionStartData := map[string]interface{}{
			"session_start": timestamp,
			"type":          "session_start",
			"message":       "Debug模式已开启",
		}

		jsonData, err := json.MarshalIndent(sessionStartData, "", "  ")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "创建调试日志失败: " + err.Error(),
			})
			return
		}

		if err := os.WriteFile(currentDebugLogFile, append(jsonData, '\n'), 0644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "写入调试日志失败: " + err.Error(),
			})
			return
		}

		// 更新配置中的当前日志文件路径
		cfg.CurrentLogFile = currentDebugLogFile
	} else if currentDebugLogFile != "" {
		// 关闭Debug模式时，写入会话结束记录
		endTimestamp := time.Now().Format(time.RFC3339)
		sessionEndData := map[string]interface{}{
			"session_end": endTimestamp,
			"type":        "session_end",
			"message":     "Debug模式已关闭",
			"duration":    fmt.Sprintf("%d秒", int(time.Since(debugSessionStartTime).Seconds())),
		}

		jsonData, err := json.MarshalIndent(sessionEndData, "", "  ")
		if err == nil {
			// 追加到文件末尾
			f, err := os.OpenFile(currentDebugLogFile, os.O_APPEND|os.O_WRONLY, 0644)
			if err == nil {
				defer f.Close()
				f.Write(append(jsonData, '\n'))
			}
		}

		// 重置会话文件路径和开始时间
		currentDebugLogFile = ""
		debugSessionStartTime = time.Time{}

		// 更新配置中的当前日志文件路径
		config.GetConfig().CurrentLogFile = ""
	}

	// 保存Debug模式状态到数据库
	if err := db.SetDebugMode(requestBody.Enabled); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "设置Debug模式失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"enabled": requestBody.Enabled,
	})
}

// LogDebugInfo 记录调试信息
func LogDebugInfo(requestData, responseData map[string]interface{}, logType string) error {
	if currentDebugLogFile == "" {
		return nil
	}

	timestamp := time.Now().Format(time.RFC3339)
	logData := models.DebugLog{
		Timestamp: timestamp,
		Type:      logType,
		Request:   requestData,
		Response:  responseData,
	}

	// 将日志写入文件
	jsonData, err := json.MarshalIndent(logData, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化日志数据失败: %w", err)
	}

	f, err := os.OpenFile(currentDebugLogFile, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("打开日志文件失败: %w", err)
	}
	defer f.Close()

	if _, err := f.Write(append(jsonData, '\n')); err != nil {
		return fmt.Errorf("写入日志文件失败: %w", err)
	}

	// 同时添加到数据库
	db := models.GetDB()
	return db.AddDebugLog(logData)
}
