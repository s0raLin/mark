package handler

import (
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"server/pkg/api"
)

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

	api.Success(c, gin.H{"url": "/uploads/" + filename})
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
		"url":        "/uploads/" + filename,
		"fontFamily": fontFamily,
	})
}
