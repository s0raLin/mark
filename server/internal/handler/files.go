package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"server/internal/model"
	"server/internal/repository"
	"server/pkg/api"
)

// GetFileContent handles the legacy wildcard route GET /api/file/*fileId.
func GetFileContent(c *gin.Context) {
	fileID, ok := fileIDFromPath(c)
	if !ok {
		return
	}

	content, exists := storageRepo().GetFileContent(fileID)
	if !exists {
		api.NotFound(c, "file not found")
		return
	}

	api.Success(c, model.GetFileContentResponse{ID: fileID, Content: content})
}

// SaveFileContent handles the legacy wildcard route PUT /api/file/*fileId.
func SaveFileContent(c *gin.Context) {
	fileID, ok := fileIDFromPath(c)
	if !ok {
		return
	}

	var req saveFileContentRequest
	if !bindJSON(c, &req) {
		return
	}

	if err := storageRepo().SaveFileContent(fileID, req.Content); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, model.SaveFileContentResponse{Success: true, UpdatedAt: time.Now()})
}

// GetFileContentByQuery handles the REST route GET /api/files/content?id=...
func GetFileContentByQuery(c *gin.Context) {
	fileID, ok := requiredQuery(c, "id")
	if !ok {
		return
	}

	content, exists := storageRepo().GetFileContent(fileID)
	if !exists {
		api.NotFound(c, "file not found")
		return
	}

	api.Success(c, model.GetFileContentResponse{ID: fileID, Content: content})
}

// SaveFileContentByBody handles the REST route PUT /api/files/content.
func SaveFileContentByBody(c *gin.Context) {
	var req saveFileContentBodyRequest
	if !bindJSON(c, &req) {
		return
	}
	if req.ID == "" {
		api.BadRequest(c, "id is required")
		return
	}

	if err := storageRepo().SaveFileContent(req.ID, req.Content); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, model.SaveFileContentResponse{Success: true, UpdatedAt: time.Now()})
}

// CreateFile handles POST /api/files.
func CreateFile(c *gin.Context) {
	var req createFileRequest
	if !bindJSON(c, &req) {
		return
	}
	if req.Name == "" {
		api.BadRequest(c, "name is required")
		return
	}

	newID, err := storageRepo().CreateFile(req.ParentID, req.Name, req.Content)
	if err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, gin.H{"id": newID, "name": req.Name})
}

// CreateFolder handles POST /api/folders.
func CreateFolder(c *gin.Context) {
	var req createFolderRequest
	if !bindJSON(c, &req) {
		return
	}
	if req.Name == "" {
		api.BadRequest(c, "name is required")
		return
	}

	newID, err := storageRepo().CreateFolder(req.ParentID, req.Name)
	if err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, gin.H{"id": newID, "name": req.Name})
}

// MoveNode handles POST /api/files/move and PATCH /api/file-nodes/parent.
func MoveNode(c *gin.Context) {
	var req moveNodeRequest
	if !bindJSON(c, &req) {
		return
	}

	newID, err := storageRepo().MoveNode(req.ID, req.NewParentID)
	if err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, gin.H{"id": newID})
}

// RenameNode handles POST /api/files/rename and PATCH /api/file-nodes/name.
func RenameNode(c *gin.Context) {
	var req renameNodeRequest
	if !bindJSON(c, &req) {
		return
	}

	newID, err := storageRepo().RenameNode(req.ID, req.NewName)
	if err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, gin.H{"id": newID})
}

// DeleteNode handles the legacy wildcard route DELETE /api/file/*fileId.
func DeleteNode(c *gin.Context) {
	fileID, ok := fileIDFromPath(c)
	if !ok {
		return
	}

	if err := storageRepo().DeleteNode(fileID); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, gin.H{"success": true})
}

// DeleteFileNodeByQuery handles DELETE /api/file-nodes?id=...
func DeleteFileNodeByQuery(c *gin.Context) {
	fileID, ok := requiredQuery(c, "id")
	if !ok {
		return
	}

	if err := storageRepo().DeleteNode(fileID); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, gin.H{"success": true})
}

// SearchFiles handles GET /api/search/files and the legacy GET /api/files/search.
func SearchFiles(c *gin.Context) {
	query := c.Query("q")
	results := storageRepo().SearchFiles(query)
	if results == nil {
		results = []repository.SearchResult{}
	}

	api.Success(c, results)
}
