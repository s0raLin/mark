package handler

import (
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"server/pkg/api"
)

const uploadDir = "./public/uploads"

// UploadImage 处理图片上传，返回可访问的 URL
func UploadImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		api.BadRequest(c, "image field is required")
		return
	}

	// 只允许图片类型
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowed[ext] {
		api.BadRequest(c, "unsupported image type")
		return
	}

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		api.InternalError(c, err)
		return
	}

	filename := fmt.Sprintf("%d-%d%s", time.Now().UnixMilli(), rand.Intn(1_000_000_000), ext)
	dst := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		api.InternalError(c, err)
		return
	}

	api.Success(c, gin.H{"url": "/uploads/" + filename})
}

// UploadFont 处理字体文件上传，返回可访问的 URL 和字体名
func UploadFont(c *gin.Context) {
	file, err := c.FormFile("font")
	if err != nil {
		api.BadRequest(c, "font field is required")
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".ttf": true, ".woff": true, ".woff2": true, ".otf": true}
	if !allowed[ext] {
		api.BadRequest(c, "unsupported font type")
		return
	}

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		api.InternalError(c, err)
		return
	}

	filename := fmt.Sprintf("%d-%d%s", time.Now().UnixMilli(), rand.Intn(1_000_000_000), ext)
	dst := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		api.InternalError(c, err)
		return
	}

	// 用原始文件名（去掉扩展名）作为字体族名
	fontFamily := strings.TrimSuffix(file.Filename, filepath.Ext(file.Filename))

	api.Success(c, gin.H{
		"url":        "/uploads/" + filename,
		"fontFamily": fontFamily,
	})
}
