package handler

import (
	//"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/internal/model"
	"server/internal/repository"
	"server/pkg/api"
)

func GetFileContent(c *gin.Context) {
	fileID := c.Param("fileId")
	if fileID == "" {
		api.BadRequest(c, "fileId is required")
		return
	}

	repo := repository.GetStorage()
	content, ok := repo.GetFileContent(fileID)
	if !ok {
		api.NotFound(c, "file not found")
		return
	}

	api.Success(c, model.GetFileContentResponse{
		ID:      fileID,
		Content: content,
	})
}

func SaveFileContent(c *gin.Context) {
	fileID := c.Param("fileId")
	if fileID == "" {
		api.BadRequest(c, "fileId is required")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.BadRequest(c, err.Error())
		return
	}

	repo := repository.GetStorage()
	if err := repo.SaveFileContent(fileID, req.Content); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, model.SaveFileContentResponse{
		Success:   true,
		UpdatedAt: time.Now(),
	})
}
