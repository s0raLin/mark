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

// StorageFileSystem 完整文件系統結構（不含內容）
type StorageFileSystem struct {
	Nodes         []StorageFileNode   `json:"nodes"`
	FileContents  map[string]string   `json:"fileContents"` // id → content
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

// StorageUserSettings 完整使用者資料
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

// 通用成功回應（save 操作）
type SaveResponse struct {
	Success   bool      `json:"success"`
	UpdatedAt time.Time `json:"updatedAt"`
}
