package main

import (
	"log"
	"os"
	"strconv"

	"server/internal/handler"
	"server/internal/repository"

	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	portNum, err := strconv.Atoi(port)
	if err != nil || portNum < 1 || portNum > 65535 {
		log.Fatalf("Invalid port: %s", port)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
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

	// 用户数据
	api.GET("/user/data", handler.GetUserData)
	api.POST("/user/data", handler.SaveUserData)

	// 文件操作（固定路径，不与通配符冲突）
	api.GET("/files/search", handler.SearchFiles)
	api.POST("/files/create", handler.CreateFile)
	api.POST("/files/mkdir", handler.CreateFolder)
	api.POST("/files/move", handler.MoveNode)
	api.POST("/files/rename", handler.RenameNode)

	// 文件内容读写 + 删除：用 /file/* 前缀（与 /files/* 固定路由分开）
	fc := r.Group("/api/file")
	fc.GET("/*fileId", handler.GetFileContent)
	fc.PUT("/*fileId", handler.SaveFileContent)
	fc.DELETE("/*fileId", handler.DeleteNode)

	// 上传
	api.POST("/upload", handler.UploadImage)
	api.POST("/upload-font", handler.UploadFont)

	r.Static("/uploads", repository.UploadsDir)

	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
