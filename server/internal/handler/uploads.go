package handler

import (
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"server/internal/repository"
	"server/pkg/api"
)

type uploadedImageResponse struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

// UploadImage handles POST /api/uploads/images and the legacy /api/upload.
func UploadImage(c *gin.Context) {
	file, ok := uploadedFile(c, "image")
	if !ok {
		return
	}

	ext, ok := ensureAllowedExtension(c, file.Filename, map[string]struct{}{
		".jpg":  {},
		".jpeg": {},
		".png":  {},
		".gif":  {},
		".webp": {},
	}, "unsupported image type")
	if !ok {
		return
	}

	filename, ok := saveUpload(c, file, ext)
	if !ok {
		return
	}

	api.Success(c, uploadedImageResponse{
		Name: filename,
		URL:  "/uploads/" + url.PathEscape(filename),
	})
}

// UploadFont handles POST /api/uploads/fonts and the legacy /api/upload-font.
func UploadFont(c *gin.Context) {
	file, ok := uploadedFile(c, "font")
	if !ok {
		return
	}

	ext, ok := ensureAllowedExtension(c, file.Filename, map[string]struct{}{
		".ttf":   {},
		".woff":  {},
		".woff2": {},
		".otf":   {},
	}, "unsupported font type")
	if !ok {
		return
	}

	filename, ok := saveUpload(c, file, ext)
	if !ok {
		return
	}

	fontFamily := strings.TrimSuffix(file.Filename, filepath.Ext(file.Filename))

	api.Success(c, gin.H{
		"url":        "/uploads/" + url.PathEscape(filename),
		"fontFamily": fontFamily,
	})
}

// ListImages handles GET /api/uploads/images.
func ListImages(c *gin.Context) {
	entries, err := os.ReadDir(repository.UploadsDir)
	if err != nil {
		api.InternalError(c, err)
		return
	}

	type imageFile struct {
		uploadedImageResponse
		modified int64
	}

	var images []imageFile
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		switch strings.ToLower(filepath.Ext(name)) {
		case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		default:
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		images = append(images, imageFile{
			uploadedImageResponse: uploadedImageResponse{
				Name: name,
				URL:  "/uploads/" + url.PathEscape(name),
			},
			modified: info.ModTime().UnixMilli(),
		})
	}

	sort.Slice(images, func(i, j int) bool {
		return images[i].modified > images[j].modified
	})

	result := make([]uploadedImageResponse, 0, len(images))
	for _, image := range images {
		result = append(result, image.uploadedImageResponse)
	}

	api.Success(c, result)
}

// DeleteImage handles DELETE /api/uploads/images?name=...
func DeleteImage(c *gin.Context) {
	name, ok := requiredQuery(c, "name")
	if !ok {
		return
	}

	normalized, err := sanitizedUploadName(name, strings.ToLower(filepath.Ext(name)))
	if err != nil {
		api.BadRequest(c, err.Error())
		return
	}

	target := filepath.Join(repository.UploadsDir, normalized)
	if _, err := os.Stat(target); os.IsNotExist(err) {
		api.Success(c, false)
		return
	}

	if err := os.Remove(target); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, true)
}
