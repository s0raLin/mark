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

	registerRestRoutes(api)
	registerLegacyRoutes(api)

	r.Static("/uploads", repository.UploadsDir)

	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func registerRestRoutes(api *gin.RouterGroup) {
	users := api.Group("/users")
	users.GET("/me/settings", handler.GetUserData)
	users.PUT("/me/settings", handler.SaveUserData)

	api.GET("/editor-config", handler.GetEditorConfig)
	api.PUT("/editor-config", handler.UpdateEditorConfig)

	api.GET("/file-system", handler.GetFileSystemTree)
	api.PUT("/file-system", handler.UpdateFileSystemTree)

	api.GET("/files/content", handler.GetFileContentByQuery)
	api.PUT("/files/content", handler.SaveFileContentByBody)
	api.POST("/files", handler.CreateFile)

	api.POST("/folders", handler.CreateFolder)

	fileNodes := api.Group("/file-nodes")
	fileNodes.PATCH("/parent", handler.MoveNode)
	fileNodes.PATCH("/name", handler.RenameNode)
	fileNodes.DELETE("", handler.DeleteFileNodeByQuery)

	search := api.Group("/search")
	search.GET("/files", handler.SearchFiles)

	uploads := api.Group("/uploads")
	uploads.POST("/images", handler.UploadImage)
	uploads.POST("/fonts", handler.UploadFont)
}

func registerLegacyRoutes(api *gin.RouterGroup) {
	api.GET("/user/data", handler.GetUserData)
	api.POST("/user/data", handler.SaveUserData)

	api.GET("/files/search", handler.SearchFiles)
	api.POST("/files/create", handler.CreateFile)
	api.POST("/files/mkdir", handler.CreateFolder)
	api.POST("/files/move", handler.MoveNode)
	api.POST("/files/rename", handler.RenameNode)

	legacyFiles := api.Group("/file")
	legacyFiles.GET("/*fileId", handler.GetFileContent)
	legacyFiles.PUT("/*fileId", handler.SaveFileContent)
	legacyFiles.DELETE("/*fileId", handler.DeleteNode)

	api.POST("/upload", handler.UploadImage)
	api.POST("/upload-font", handler.UploadFont)
}
