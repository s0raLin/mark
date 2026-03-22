package model

import "time"

// ApiResponse 所有 API 回傳的統一格式
type ApiResponse[T any] struct {
	Code    int    `json:"code"`    // 0 = 成功
	Message string `json:"message"` // 成功時通常為 ""
	Data    T      `json:"data"`
}

// ApiError 用於錯誤回傳
type ApiError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// ──────────────────────────────────────────────

// StorageFileNode 文件/資料夾節點
type StorageFileNode struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // "file" | "folder"
	ParentID  *string   `json:"parentId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// FileFrontmatter 存储在 .md 文件头部的元数据（--- 块）
// 文件夹也用同名 .folder 文件存储其元数据
type FileFrontmatter struct {
	ID        string    `yaml:"id"`
	Name      string    `yaml:"name"`
	Type      string    `yaml:"type"` // "file" | "folder"
	ParentID  string    `yaml:"parentId,omitempty"`
	Pinned    bool      `yaml:"pinned,omitempty"`
	Order     int       `yaml:"order"`
	CreatedAt time.Time `yaml:"createdAt"`
	UpdatedAt time.Time `yaml:"updatedAt"`
}

// StorageFileSystem 文件系統結構（从磁盘文件重建，不持久化到 JSON）
type StorageFileSystem struct {
	Nodes         []StorageFileNode   `json:"nodes"`
	PinnedIDs     []string            `json:"pinnedIds"`
	ExplorerOrder []string            `json:"explorerOrder"`
	FolderOrder   map[string][]string `json:"folderOrder"`
	UpdatedAt     time.Time           `json:"updatedAt"`
}

// StorageEditorConfig 編輯器設定
type StorageEditorConfig struct {
	EditorTheme  string  `json:"editorTheme"`
	PreviewTheme string  `json:"previewTheme"`
	FontChoice   string  `json:"fontChoice"`
	EditorFont   string  `json:"editorFont"`
	FontSize     int     `json:"fontSize"`
	AccentColor  string  `json:"accentColor"`
	BlurAmount   float64 `json:"blurAmount"`
	BgImage      string  `json:"bgImage"`
	ParticlesOn  bool    `json:"particlesOn"`
	CustomFonts  []struct {
		Name string `json:"name"`
		URL  string `json:"url"`
	} `json:"customFonts"`
}

// StorageAppConfig 仅保存应用配置（持久化到 JSON，不含文件系统数据）
type StorageAppConfig struct {
	UserID       string              `json:"userId"`
	Username     string              `json:"username"`
	Email        string              `json:"email"`
	EditorConfig StorageEditorConfig `json:"editorConfig"`
	UpdatedAt    time.Time           `json:"updatedAt"`
}

// StorageUserSettings 完整使用者資料（含从磁盘重建的文件系统，用于 API 响应）
type StorageUserSettings struct {
	UserID       string              `json:"userId"`
	Username     string              `json:"username"`
	Email        string              `json:"email"`
	FileSystem   StorageFileSystem   `json:"fileSystem"`
	EditorConfig StorageEditorConfig `json:"editorConfig"`
	UpdatedAt    time.Time           `json:"updatedAt"`
}

// ──────────────────────────────────────────────

// 單檔內容相關
type GetFileContentResponse struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}

type SaveFileContentResponse struct {
	Success   bool      `json:"success"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// GetFilePathResponse 文件真实路径响应
type GetFilePathResponse struct {
	ID       string `json:"id"`
	FilePath string `json:"filePath"`
}

// GetFilesRootResponse 文件根目录响应
type GetFilesRootResponse struct {
	RootDir string `json:"rootDir"`
}

// 通用成功回應（save 操作）
type SaveResponse struct {
	Success   bool      `json:"success"`
	UpdatedAt time.Time `json:"updatedAt"`
}
