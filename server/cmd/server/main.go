package main

import (
	"log"

	"server/internal/handler"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.New()

	r.Use(gin.Logger())

	// 建議加上 recovery 中間件（gin 內建）
	r.Use(gin.Recovery())

	// CORS 配置
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")

	// 使用者完整資料
	api.GET("/user/data", handler.GetUserData)
	api.POST("/user/data", handler.SaveUserData)

	// 文件系統（可選分開）
	// api.GET("/user/filesystem", ...)
	// api.PUT("/user/filesystem", ...)

	// 編輯器設定（可選分開）
	// api.GET("/user/config", ...)
	// api.PUT("/user/config", ...)

	// 单档内容
	api.GET("/files/:fileId/content", handler.GetFileContent)
	api.PUT("/files/:fileId/content", handler.SaveFileContent)

	// 上传
	api.POST("/upload", handler.UploadImage)
	api.POST("/upload-font", handler.UploadFont)

	// 静态文件服务（上传的图片/字体）
	r.Static("/uploads", "./public/uploads")

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
