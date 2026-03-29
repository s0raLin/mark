package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"server/internal/model"
	"server/pkg/api"
)

func GetUserData(c *gin.Context) {
	api.Success(c, storageRepo().GetFullUserData())
}

func SaveUserData(c *gin.Context) {
	var req updateUserSettingsRequest
	if !bindJSON(c, &req) {
		return
	}

	if err := storageRepo().SaveFullUserData(req.FileSystem, req.EditorConfig); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, model.SaveResponse{
		Success:   true,
		UpdatedAt: time.Now(),
	})
}

func GetEditorConfig(c *gin.Context) {
	api.Success(c, storageRepo().GetEditorConfig())
}

func UpdateEditorConfig(c *gin.Context) {
	var req updateEditorConfigRequest
	if !bindJSON(c, &req) {
		return
	}

	if err := storageRepo().SaveEditorConfig(req.EditorConfig); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, model.SaveResponse{
		Success:   true,
		UpdatedAt: storageRepo().GetFullUserData().UpdatedAt,
	})
}

func GetFileSystemTree(c *gin.Context) {
	api.Success(c, storageRepo().GetFileSystem())
}

func UpdateFileSystemTree(c *gin.Context) {
	var req updateFileSystemRequest
	if !bindJSON(c, &req) {
		return
	}

	if err := storageRepo().SaveFileSystem(req.FileSystem); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, model.SaveResponse{
		Success:   true,
		UpdatedAt: storageRepo().GetFullUserData().UpdatedAt,
	})
}
