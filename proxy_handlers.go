package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"multi-api/models"
)

// 检查是否为模型列表请求
func isModelsRequest(path string) bool {
	return strings.HasSuffix(path, "/models")
}

// ProxyHandler 代理所有OpenAI兼容的API请求
func ProxyHandler(c *gin.Context) {
	// 获取当前活跃配置
	db := models.GetDB()
	config, found := db.GetActiveConfig()
	if !found {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "没有活跃的API配置",
		})
		return
	}

	// 获取请求路径
	requestPath := c.Param("path")

	// 检查是否为模型列表请求
	if isModelsRequest(requestPath) {
		c.JSON(http.StatusOK, gin.H{
			"object": "list",
			"data": []gin.H{
				{
					"id":         "请在后端执行全部操作",
					"object":     "model",
					"created":    time.Now().Unix(),
					"owned_by":   "system",
					"permission": []string{},
					"root":       "请在后端执行全部操作",
					"parent":     nil,
				},
			},
		})
		return
	}

	// 构建目标URL
	targetURL := fmt.Sprintf("%s%s", config.Endpoint, requestPath)

	// 读取请求体
	var requestBody []byte
	var err error
	if c.Request.Body != nil {
		requestBody, err = io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "读取请求体失败: " + err.Error(),
			})
			return
		}
		// 重新设置请求体，以便后续使用
		c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
	}

	// 如果有请求体，检查并修改模型名称
	if len(requestBody) > 0 && config.Model != "" {
		var jsonBody map[string]interface{}
		if err := json.Unmarshal(requestBody, &jsonBody); err == nil {
			if _, exists := jsonBody["model"]; exists && config.Model != "" {
				jsonBody["model"] = config.Model
				// 重新编码请求体
				requestBody, _ = json.Marshal(jsonBody)
				// 更新请求体
				c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
				// 更新Content-Length
				c.Request.ContentLength = int64(len(requestBody))
			}
		}
	}

	// 创建新的HTTP请求
	req, err := http.NewRequest(c.Request.Method, targetURL, bytes.NewBuffer(requestBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "创建请求失败: " + err.Error(),
		})
		return
	}

	// 复制请求头
	for key, values := range c.Request.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// 设置API密钥
	req.Header.Set("Authorization", "Bearer "+config.APIKey)

	// 检查是否为流式请求
	isStreamRequest := c.GetHeader("Accept") == "text/event-stream"
	var jsonReqBody map[string]interface{}
	if len(requestBody) > 0 {
		if err := json.Unmarshal(requestBody, &jsonReqBody); err == nil {
			if streamValue, exists := jsonReqBody["stream"]; exists {
				if streamBool, ok := streamValue.(bool); ok && streamBool {
					isStreamRequest = true
				}
			}
		}
	}

	// 创建HTTP客户端
	client := &http.Client{}

	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "发送请求失败: " + err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	// 处理Debug模式日志记录
	debugMode := db.GetDebugMode()
	if debugMode {
		// 准备请求数据用于日志记录
		requestData := map[string]interface{}{
			"method":  c.Request.Method,
			"url":     targetURL,
			"headers": c.Request.Header,
		}

		if len(requestBody) > 0 {
			var reqBodyObj interface{}
			if err := json.Unmarshal(requestBody, &reqBodyObj); err == nil {
				requestData["body"] = reqBodyObj
			} else {
				requestData["body"] = string(requestBody)
			}
		}

		// 处理流式响应的Debug日志
		if isStreamRequest {
			// 设置流式响应头
			for key, values := range resp.Header {
				for _, value := range values {
					c.Writer.Header().Add(key, value)
				}
			}
			c.Writer.WriteHeader(resp.StatusCode)

			// 创建一个缓冲区来存储流式数据
			buffer := make([]byte, 4096)
			for {
				n, err := resp.Body.Read(buffer)
				if n > 0 {
					// 写入响应
					c.Writer.Write(buffer[:n])
					c.Writer.Flush()

					// 记录流式数据块
					chunkData := map[string]interface{}{
						"chunk": string(buffer[:n]),
					}
					LogDebugInfo(requestData, chunkData, "stream_chunk")
				}
				if err != nil {
					break
				}
			}
			return
		}

		// 处理普通响应的Debug日志
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "读取响应失败: " + err.Error(),
			})
			return
		}

		// 准备响应数据用于日志记录
		responseData := map[string]interface{}{
			"status":  resp.StatusCode,
			"headers": resp.Header,
		}

		if len(respBody) > 0 {
			var respBodyObj interface{}
			if err := json.Unmarshal(respBody, &respBodyObj); err == nil {
				responseData["body"] = respBodyObj
			} else {
				responseData["body"] = string(respBody)
			}
		}

		// 记录请求和响应
		LogDebugInfo(requestData, responseData, "request_response")

		// 重新设置响应体，以便后续使用
		resp.Body = io.NopCloser(bytes.NewBuffer(respBody))
	}

	// 复制响应头
	for key, values := range resp.Header {
		for _, value := range values {
			c.Writer.Header().Add(key, value)
		}
	}

	// 设置响应状态码
	c.Writer.WriteHeader(resp.StatusCode)

	// 复制响应体
	io.Copy(c.Writer, resp.Body)
}
