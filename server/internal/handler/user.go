package handler

import (
	//"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/internal/model"
	"server/internal/repository"
	"server/pkg/api"
)

func GetUserData(c *gin.Context) {
	repo := repository.GetStorage()
	data := repo.GetFullUserData()
	api.Success(c, data)
}

func SaveUserData(c *gin.Context) {
	var req struct {
		FileSystem   model.StorageFileSystem   `json:"fileSystem"`
		EditorConfig model.StorageEditorConfig `json:"editorConfig"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		api.BadRequest(c, err.Error())
		return
	}

	repo := repository.GetStorage()
	if err := repo.SaveFullUserData(req.FileSystem, req.EditorConfig); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, model.SaveResponse{
		Success:   true,
		UpdatedAt: time.Now(),
	})
}
