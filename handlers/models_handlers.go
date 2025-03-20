package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"

	"multi-api/models"
)

// GetModels 获取指定API端点支持的模型列表
func GetModels(c *gin.Context) {
	configId := c.Param("configId")
	db := models.GetDB()

	// 获取配置信息
	config, found := db.GetConfig(configId)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "未找到配置",
		})
		return
	}

	// 构建请求URL
	url := fmt.Sprintf("%s/models", config.Endpoint)

	// 创建HTTP客户端
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "创建请求失败: " + err.Error(),
		})
		return
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.APIKey)

	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取模型列表失败: " + err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "读取响应失败: " + err.Error(),
		})
		return
	}

	// 如果响应状态码不是200，返回错误
	if resp.StatusCode != http.StatusOK {
		var errorResponse map[string]interface{}
		if err := json.Unmarshal(body, &errorResponse); err != nil {
			c.JSON(resp.StatusCode, gin.H{
				"success": false,
				"message": fmt.Sprintf("API返回错误: %s", string(body)),
			})
		} else {
			c.JSON(resp.StatusCode, gin.H{
				"success": false,
				"message": "获取模型列表失败",
				"error":   errorResponse,
			})
		}
		return
	}

	// 解析响应数据
	var response struct {
		Object string `json:"object"`
		Data   []struct {
			ID string `json:"id"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "解析响应失败: " + err.Error(),
		})
		return
	}

	// 提取模型ID列表
	models := make([]gin.H, 0, len(response.Data))
	for _, model := range response.Data {
		models = append(models, gin.H{
			"id":   model.ID,
			"name": model.ID,
		})
	}

	// 返回模型列表
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    models,
	})
}
