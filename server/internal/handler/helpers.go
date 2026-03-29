package handler

import (
	"fmt"
	"math/rand"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"server/internal/model"
	"server/internal/repository"
	"server/pkg/api"
)

// bindJSON keeps request parsing consistent across the Electron compatibility
// backend and centralizes bad-request responses.
func bindJSON(c *gin.Context, target any) bool {
	if err := c.ShouldBindJSON(target); err != nil {
		api.BadRequest(c, err.Error())
		return false
	}
	return true
}

// fileIDFromPath normalizes the wildcard route param used by legacy file APIs.
func fileIDFromPath(c *gin.Context) (string, bool) {
	raw := strings.TrimPrefix(c.Param("fileId"), "/")
	fileID := strings.TrimSuffix(raw, "/content")
	if fileID == "" {
		api.BadRequest(c, "fileId is required")
		return "", false
	}
	return fileID, true
}

func requiredQuery(c *gin.Context, key string) (string, bool) {
	value := strings.TrimSpace(c.Query(key))
	if value == "" {
		api.BadRequest(c, key+" is required")
		return "", false
	}
	return value, true
}

func storageRepo() *repository.StorageRepo {
	return repository.GetStorage()
}

func uploadedFile(c *gin.Context, field string) (*multipart.FileHeader, bool) {
	file, err := c.FormFile(field)
	if err != nil {
		api.BadRequest(c, field+" field is required")
		return nil, false
	}
	return file, true
}

func ensureAllowedExtension(c *gin.Context, filename string, allowed map[string]struct{}, message string) (string, bool) {
	ext := strings.ToLower(filepath.Ext(filename))
	if _, ok := allowed[ext]; !ok {
		api.BadRequest(c, message)
		return "", false
	}
	return ext, true
}

func saveUpload(c *gin.Context, file *multipart.FileHeader, ext string) (string, bool) {
	if err := os.MkdirAll(repository.UploadsDir, 0755); err != nil {
		api.InternalError(c, err)
		return "", false
	}

	filename := fmt.Sprintf("%d-%d%s", time.Now().UnixMilli(), rand.Intn(1_000_000_000), ext)
	dst := filepath.Join(repository.UploadsDir, filename)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		api.InternalError(c, err)
		return "", false
	}

	return filename, true
}

type updateUserSettingsRequest struct {
	FileSystem   model.StorageFileSystem   `json:"fileSystem"`
	EditorConfig model.StorageEditorConfig `json:"editorConfig"`
}

type updateEditorConfigRequest struct {
	EditorConfig model.StorageEditorConfig `json:"editorConfig"`
}

type updateFileSystemRequest struct {
	FileSystem model.StorageFileSystem `json:"fileSystem"`
}

type createFileRequest struct {
	ParentID string `json:"parentId"`
	Name     string `json:"name"`
	Content  string `json:"content"`
}

type createFolderRequest struct {
	ParentID string `json:"parentId"`
	Name     string `json:"name"`
}

type saveFileContentRequest struct {
	Content string `json:"content"`
}

type saveFileContentBodyRequest struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}

type moveNodeRequest struct {
	ID          string `json:"id"`
	NewParentID string `json:"newParentId"`
}

type renameNodeRequest struct {
	ID      string `json:"id"`
	NewName string `json:"newName"`
}
