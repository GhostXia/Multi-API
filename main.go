package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"multi-api/handlers"
	"multi-api/models"
)

func main() {
	// 加载环境变量
	_ = godotenv.Load()

	// 初始化数据库
	if err := models.InitDB(); err != nil {
		log.Fatalf("初始化数据库失败: %v", err)
	}

	// 设置端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// 创建Gin路由
	r := gin.Default()

	// 配置CORS
	r.Use(cors.Default())

	// 静态文件服务
	r.Static("/public", "./public")
	r.StaticFile("/", "./public/index.html")

	// API路由
	api := r.Group("/api")
	{
		api.GET("/configs", handlers.GetAllConfigs)
		api.GET("/configs/:id", handlers.GetConfig)
		api.POST("/configs", handlers.CreateConfig)
		api.PUT("/configs/:id", handlers.UpdateConfig)
		api.DELETE("/configs/:id", handlers.DeleteConfig)
		api.POST("/configs/:id/activate", handlers.ActivateConfig)
		api.GET("/active-config", handlers.GetActiveConfig)
		api.GET("/debug-mode", handlers.GetDebugMode)
		api.POST("/debug-mode", handlers.SetDebugMode)
		api.GET("/language", handlers.GetLanguage)
		api.POST("/language", handlers.SetLanguage)

		// 模型相关路由
		models := api.Group("/models")
		{
			models.GET("/:configId", handlers.GetModels)
		}
	}

	// 代理路由
	proxy := r.Group("/proxy")
	{
		proxy.Any("/*path", handlers.ProxyHandler)
	}

	// 启动服务器
	log.Printf("服务器运行在 http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}
