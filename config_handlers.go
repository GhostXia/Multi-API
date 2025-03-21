package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"multi-api/models"
)

// GetAllConfigs 获取所有API配置
func GetAllConfigs(c *gin.Context) {
	db := models.GetDB()
	configs := db.GetAllConfigs()
	activeConfig := db.GetActiveConfig()

	responseConfigs := make([]gin.H, 0, len(configs))
	for _, config := range configs {
		isActive := false
		if activeConfig, found := activeConfig; found && activeConfig.ID == config.ID {
			isActive = true
		}

		responseConfigs = append(responseConfigs, gin.H{
			"id":       config.ID,
			"name":     config.Name,
			"endpoint": config.Endpoint,
			"isActive": isActive,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    responseConfigs,
	})
}

// GetConfig 获取单个API配置
func GetConfig(c *gin.Context) {
	id := c.Param("id")
	db := models.GetDB()

	config, found := db.GetConfig(id)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "未找到配置",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    config,
	})
}

// CreateConfig 创建新的API配置
func CreateConfig(c *gin.Context) {
	var requestBody struct {
		Name     string `json:"name" binding:"required"`
		Endpoint string `json:"endpoint" binding:"required"`
		APIKey   string `json:"apiKey" binding:"required"`
		Model    string `json:"model"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "名称、端点和API密钥为必填项",
		})
		return
	}

	id := strconv.FormatInt(time.Now().UnixNano(), 10)
	newConfig := models.APIConfig{
		ID:       id,
		Name:     requestBody.Name,
		Endpoint: requestBody.Endpoint,
		APIKey:   requestBody.APIKey,
		Model:    requestBody.Model,
	}

	db := models.GetDB()
	if err := db.AddConfig(newConfig); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "创建配置失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    newConfig,
	})
}

// UpdateConfig 更新API配置
func UpdateConfig(c *gin.Context) {
	id := c.Param("id")
	db := models.GetDB()

	// 检查配置是否存在
	_, found := db.GetConfig(id)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "未找到配置",
		})
		return
	}

	var requestBody struct {
		Name     string `json:"name"`
		Endpoint string `json:"endpoint"`
		APIKey   string `json:"apiKey"`
		Model    string `json:"model"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "请求格式错误",
		})
		return
	}

	updatedConfig := models.APIConfig{
		ID:       id,
		Name:     requestBody.Name,
		Endpoint: requestBody.Endpoint,
		APIKey:   requestBody.APIKey,
		Model:    requestBody.Model,
	}

	if err := db.UpdateConfig(updatedConfig); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "更新配置失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    updatedConfig,
	})
}

// DeleteConfig 删除API配置
func DeleteConfig(c *gin.Context) {
	id := c.Param("id")
	db := models.GetDB()

	// 检查配置是否存在
	_, found := db.GetConfig(id)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "未找到配置",
		})
		return
	}

	if err := db.DeleteConfig(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "删除配置失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "配置已删除",
	})
}

// ActivateConfig 激活API配置
func ActivateConfig(c *gin.Context) {
	id := c.Param("id")
	db := models.GetDB()

	// 检查配置是否存在
	config, found := db.GetConfig(id)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "未找到配置",
		})
		return
	}

	if err := db.SetActiveConfig(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "激活配置失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "配置已激活",
		"data":    config,
	})
}

// GetActiveConfig 获取当前活跃配置
func GetActiveConfig(c *gin.Context) {
	db := models.GetDB()
	config, found := db.GetActiveConfig()

	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "没有活跃配置",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    config,
	})
}

// GetDebugMode 获取Debug模式状态
func GetDebugMode(c *gin.Context) {
	db := models.GetDB()
	debugMode := db.GetDebugMode()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"enabled": debugMode,
	})
}

// GetLanguage 获取当前语言设置
func GetLanguage(c *gin.Context) {
	db := models.GetDB()
	language := db.GetLanguage()

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"language": language,
	})
}

// SetLanguage 设置语言
func SetLanguage(c *gin.Context) {
	var requestBody struct {
		Language string `json:"language" binding:"required"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "语言参数错误",
		})
		return
	}

	db := models.GetDB()
	if err := db.SetLanguage(requestBody.Language); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "设置语言失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"language": requestBody.Language,
	})
}