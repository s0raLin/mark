package handler

import (
	"net/http"
	"strings"
	"time"

	"server/internal/model"
	"server/internal/repository"
	"server/pkg/api"

	"github.com/gin-gonic/gin"
)

// GetFileContent GET /api/files/*fileId  (path ends with /content)
func GetFileContent(c *gin.Context) {
	raw := strings.TrimPrefix(c.Param("fileId"), "/")
	// 支持两种格式：
	// - /api/files/note.md/content  → fileId = "note.md"
	// - /api/files/h1/note.md/content → fileId = "h1/note.md"
	fileID := strings.TrimSuffix(raw, "/content")
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
	api.Success(c, model.GetFileContentResponse{ID: fileID, Content: content})
}

// SaveFileContent PUT /api/files/*fileId  (path ends with /content)
func SaveFileContent(c *gin.Context) {
	raw := strings.TrimPrefix(c.Param("fileId"), "/")
	fileID := strings.TrimSuffix(raw, "/content")
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
	api.Success(c, model.SaveFileContentResponse{Success: true, UpdatedAt: time.Now()})
}

// CreateFile POST /api/files/create
func CreateFile(c *gin.Context) {
	var req struct {
		ParentID string `json:"parentId"`
		Name     string `json:"name"`
		Content  string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.BadRequest(c, err.Error())
		return
	}
	if req.Name == "" {
		api.BadRequest(c, "name is required")
		return
	}
	repo := repository.GetStorage()
	newID, err := repo.CreateFile(req.ParentID, req.Name, req.Content)
	if err != nil {
		api.InternalError(c, err)
		return
	}
	api.Success(c, gin.H{"id": newID, "name": req.Name})
}

// CreateFolder POST /api/files/mkdir
func CreateFolder(c *gin.Context) {
	var req struct {
		ParentID string `json:"parentId"`
		Name     string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.BadRequest(c, err.Error())
		return
	}
	if req.Name == "" {
		api.BadRequest(c, "name is required")
		return
	}
	repo := repository.GetStorage()
	newID, err := repo.CreateFolder(req.ParentID, req.Name)
	if err != nil {
		api.InternalError(c, err)
		return
	}
	api.Success(c, gin.H{"id": newID, "name": req.Name})
}

// MoveNode POST /api/files/move
func MoveNode(c *gin.Context) {
	var req struct {
		ID          string `json:"id"`
		NewParentID string `json:"newParentId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.BadRequest(c, err.Error())
		return
	}
	repo := repository.GetStorage()
	newID, err := repo.MoveNode(req.ID, req.NewParentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	api.Success(c, gin.H{"id": newID})
}

// RenameNode POST /api/files/rename
func RenameNode(c *gin.Context) {
	var req struct {
		ID      string `json:"id"`
		NewName string `json:"newName"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.BadRequest(c, err.Error())
		return
	}
	repo := repository.GetStorage()
	newID, err := repo.RenameNode(req.ID, req.NewName)
	if err != nil {
		api.InternalError(c, err)
		return
	}
	api.Success(c, gin.H{"id": newID})
}

// DeleteNode DELETE /api/files/*fileId
func DeleteNode(c *gin.Context) {
	fileID := strings.TrimPrefix(c.Param("fileId"), "/")
	// 去掉可能的 /content 后缀（防止误删）
	fileID = strings.TrimSuffix(fileID, "/content")
	if fileID == "" {
		api.BadRequest(c, "fileId is required")
		return
	}
	repo := repository.GetStorage()
	if err := repo.DeleteNode(fileID); err != nil {
		api.InternalError(c, err)
		return
	}
	api.Success(c, gin.H{"success": true})
}

// SearchFiles GET /api/files/search?q=xxx
func SearchFiles(c *gin.Context) {
	query := c.Query("q")
	repo := repository.GetStorage()
	results := repo.SearchFiles(query)
	if results == nil {
		results = []repository.SearchResult{}
	}
	api.Success(c, results)
}
