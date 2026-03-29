package repository

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"server/internal/model"
)

// appDataDir 返回平台对应的应用数据目录
// Linux:   ~/.config/notemark
// Windows: %APPDATA%\notemark
// macOS:   ~/Library/Application Support/notemark
func appDataDir() string {
	base, err := os.UserConfigDir()
	if err != nil {
		// 降级到当前目录
		base = "."
	}
	return filepath.Join(base, "notemark")
}

// FilesRootDir 文件存储根目录
var FilesRootDir = filepath.Join(appDataDir(), "files")

// configPath 应用配置文件路径
var configPath = filepath.Join(appDataDir(), "userdata.json")

// uploadsDir 上传文件目录
var UploadsDir = filepath.Join(appDataDir(), "uploads")

// metaFileName 每个目录下存储排序/置顶信息的元数据文件
const metaFileName = ".meta.json"

// DirMeta 目录元数据
type DirMeta struct {
	Order  []string `json:"order"`  // 该目录下节点的显示顺序（名称列表）
	Pinned []string `json:"pinned"` // 已置顶的节点名称列表
}

type StorageRepo struct {
	mu          sync.RWMutex
	config      model.StorageAppConfig
	initialized bool
}

var (
	globalStorage *StorageRepo
	once          sync.Once
)

func GetStorage() *StorageRepo {
	once.Do(func() {
		globalStorage = &StorageRepo{}
		globalStorage.load()
	})
	return globalStorage
}

func (r *StorageRepo) load() {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.initialized {
		return
	}
	os.MkdirAll(FilesRootDir, 0755)
	os.MkdirAll(UploadsDir, 0755)
	os.MkdirAll(filepath.Dir(configPath), 0755)

	data, err := os.ReadFile(configPath)
	if err == nil {
		_ = json.Unmarshal(data, &r.config)
	} else {
		r.config = model.StorageAppConfig{
			UserID:    "demo-user",
			Username:  "Demo",
			Email:     "demo@example.com",
			UpdatedAt: time.Now(),
			EditorConfig: model.StorageEditorConfig{
				EditorTheme:  "vs-dark",
				PreviewTheme: "github",
				FontSize:     14,
			},
		}
		r.saveConfig()
	}
	r.initialized = true
}

// ─── 路径 ↔ ID 转换 ────────────────────────────────────
// ID 格式：相对于 FilesRootDir 的 Unix 路径，如 "note.md" 或 "h1/note.md"

func idToAbsPath(id string) string {
	return filepath.Join(FilesRootDir, filepath.FromSlash(id))
}

func absPathToID(absPath string) string {
	rel, err := filepath.Rel(FilesRootDir, absPath)
	if err != nil {
		return absPath
	}
	return filepath.ToSlash(rel)
}

func parentOfID(id string) string {
	parts := strings.Split(id, "/")
	if len(parts) <= 1 {
		return ""
	}
	return strings.Join(parts[:len(parts)-1], "/")
}

// ─── 目录元数据 ────────────────────────────────────────

func readDirMeta(dirPath string) DirMeta {
	data, err := os.ReadFile(filepath.Join(dirPath, metaFileName))
	if err != nil {
		return DirMeta{}
	}
	var m DirMeta
	_ = json.Unmarshal(data, &m)
	return m
}

func writeDirMeta(dirPath string, m DirMeta) error {
	os.MkdirAll(dirPath, 0755)
	data, _ := json.MarshalIndent(m, "", "  ")
	return os.WriteFile(filepath.Join(dirPath, metaFileName), data, 0644)
}

// ─── 文件系统扫描 ──────────────────────────────────────

type nodeEntry struct {
	node   model.StorageFileNode
	order  int
	pinned bool
}

func scanDir(dirPath string, parentID string) []nodeEntry {
	meta := readDirMeta(dirPath)

	orderMap := map[string]int{}
	for i, name := range meta.Order {
		orderMap[name] = i
	}
	pinnedSet := map[string]bool{}
	for _, name := range meta.Pinned {
		pinnedSet[name] = true
	}

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil
	}

	var result []nodeEntry
	for _, entry := range entries {
		name := entry.Name()
		if strings.HasPrefix(name, ".") {
			continue // 跳过隐藏文件和 .meta.json
		}

		absPath := filepath.Join(dirPath, name)
		id := absPathToID(absPath)
		info, err := entry.Info()
		if err != nil {
			continue
		}

		order, ok := orderMap[name]
		if !ok {
			order = 9999
		}

		node := model.StorageFileNode{
			ID:        id,
			Name:      name,
			CreatedAt: info.ModTime(),
			UpdatedAt: info.ModTime(),
		}
		if parentID != "" {
			p := parentID
			node.ParentID = &p
		}

		if entry.IsDir() {
			node.Type = "folder"
			result = append(result, nodeEntry{node: node, order: order, pinned: pinnedSet[name]})
			// 递归扫描子目录
			children := scanDir(absPath, id)
			result = append(result, children...)
		} else {
			node.Type = "file"
			result = append(result, nodeEntry{node: node, order: order, pinned: pinnedSet[name]})
		}
	}

	// 按 order 排序（同层级）
	sort.SliceStable(result, func(i, j int) bool {
		// 只对同一父目录的节点排序
		pi := parentOfID(result[i].node.ID)
		pj := parentOfID(result[j].node.ID)
		if pi == pj {
			return result[i].order < result[j].order
		}
		return false
	})

	return result
}

func (r *StorageRepo) buildFileSystem() model.StorageFileSystem {
	entries := scanDir(FilesRootDir, "")

	nodes := make([]model.StorageFileNode, 0, len(entries))
	pinnedIDs := []string{}
	explorerOrder := []string{}
	folderOrder := map[string][]string{}

	// 先按层级分组排序
	type group struct {
		parentID string
		items    []nodeEntry
	}
	groups := map[string][]nodeEntry{}
	for _, e := range entries {
		pid := ""
		if e.node.ParentID != nil {
			pid = *e.node.ParentID
		}
		groups[pid] = append(groups[pid], e)
	}
	// 对每组按 order 排序
	for pid := range groups {
		sort.SliceStable(groups[pid], func(i, j int) bool {
			return groups[pid][i].order < groups[pid][j].order
		})
	}

	// 按 BFS 顺序构建 nodes（保证父节点在子节点前）
	var bfs func(parentID string)
	bfs = func(parentID string) {
		for _, e := range groups[parentID] {
			nodes = append(nodes, e.node)
			if e.pinned {
				pinnedIDs = append(pinnedIDs, e.node.ID)
			}
			if parentID == "" {
				if !e.pinned {
					explorerOrder = append(explorerOrder, e.node.ID)
				}
			} else {
				folderOrder[parentID] = append(folderOrder[parentID], e.node.ID)
			}
			if e.node.Type == "folder" {
				bfs(e.node.ID)
			}
		}
	}
	bfs("")

	return model.StorageFileSystem{
		Nodes:         nodes,
		PinnedIDs:     pinnedIDs,
		ExplorerOrder: explorerOrder,
		FolderOrder:   folderOrder,
		UpdatedAt:     time.Now(),
	}
}

// ─── 配置持久化 ────────────────────────────────────────

func (r *StorageRepo) saveConfig() error {
	os.MkdirAll(filepath.Dir(configPath), 0755)
	data, _ := json.MarshalIndent(r.config, "", "  ")
	return os.WriteFile(configPath, data, 0644)
}

// ─── 公开方法 ──────────────────────────────────────────

func (r *StorageRepo) GetFullUserData() model.StorageUserSettings {
	r.mu.RLock()
	cfg := r.config
	r.mu.RUnlock()

	fs := r.buildFileSystem()
	return model.StorageUserSettings{
		UserID:       cfg.UserID,
		Username:     cfg.Username,
		Email:        cfg.Email,
		FileSystem:   fs,
		EditorConfig: cfg.EditorConfig,
		UpdatedAt:    cfg.UpdatedAt,
	}
}

func (r *StorageRepo) GetEditorConfig() model.StorageEditorConfig {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.config.EditorConfig
}

func (r *StorageRepo) SaveEditorConfig(cfg model.StorageEditorConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.config.EditorConfig = cfg
	r.config.UpdatedAt = time.Now()
	return r.saveConfig()
}

func (r *StorageRepo) GetFileSystem() model.StorageFileSystem {
	return r.buildFileSystem()
}

func (r *StorageRepo) SaveFileSystem(fs model.StorageFileSystem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.config.UpdatedAt = time.Now()
	if err := r.saveConfig(); err != nil {
		return err
	}

	r.updateDirMetas(fs)
	return nil
}

// SaveFullUserData 同步磁盘文件结构 + 保存编辑器配置
// 前端传来的 fileSystem 包含期望的节点树，我们据此更新 .meta.json（order/pinned）
// 实际的文件/目录移动由专用 API 完成，这里只更新元数据
func (r *StorageRepo) SaveFullUserData(fs model.StorageFileSystem, cfg model.StorageEditorConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.config.EditorConfig = cfg
	r.config.UpdatedAt = time.Now()
	if err := r.saveConfig(); err != nil {
		return err
	}

	// 更新每个目录的 .meta.json
	r.updateDirMetas(fs)
	return nil
}

// updateDirMetas 根据 fileSystem 更新所有目录的 .meta.json
func (r *StorageRepo) updateDirMetas(fs model.StorageFileSystem) {
	pinnedSet := map[string]bool{}
	for _, id := range fs.PinnedIDs {
		pinnedSet[id] = true
	}

	// 根目录
	rootMeta := DirMeta{}
	for _, id := range fs.ExplorerOrder {
		name := lastSegment(id)
		rootMeta.Order = append(rootMeta.Order, name)
	}
	for _, id := range fs.PinnedIDs {
		if parentOfID(id) == "" {
			rootMeta.Pinned = append(rootMeta.Pinned, lastSegment(id))
		}
	}
	writeDirMeta(FilesRootDir, rootMeta)

	// 子目录
	for parentID, children := range fs.FolderOrder {
		dirPath := idToAbsPath(parentID)
		meta := DirMeta{}
		for _, id := range children {
			name := lastSegment(id)
			meta.Order = append(meta.Order, name)
			if pinnedSet[id] {
				meta.Pinned = append(meta.Pinned, name)
			}
		}
		writeDirMeta(dirPath, meta)
	}
}

func lastSegment(id string) string {
	parts := strings.Split(id, "/")
	return parts[len(parts)-1]
}

// GetFileContent 读取文件内容
func (r *StorageRepo) GetFileContent(id string) (string, bool) {
	data, err := os.ReadFile(idToAbsPath(id))
	if err != nil {
		return "", false
	}
	return string(data), true
}

// SaveFileContent 保存文件内容
func (r *StorageRepo) SaveFileContent(id, content string) error {
	p := idToAbsPath(id)
	os.MkdirAll(filepath.Dir(p), 0755)
	return os.WriteFile(p, []byte(content), 0644)
}

// CreateFile 创建文件，返回新 ID
func (r *StorageRepo) CreateFile(parentID, name, content string) (string, error) {
	var dirPath string
	if parentID == "" {
		dirPath = FilesRootDir
	} else {
		dirPath = idToAbsPath(parentID)
	}
	os.MkdirAll(dirPath, 0755)
	filePath := filepath.Join(dirPath, name)
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return "", err
	}
	return absPathToID(filePath), nil
}

// CreateFolder 创建目录，返回新 ID
func (r *StorageRepo) CreateFolder(parentID, name string) (string, error) {
	var dirPath string
	if parentID == "" {
		dirPath = FilesRootDir
	} else {
		dirPath = idToAbsPath(parentID)
	}
	folderPath := filepath.Join(dirPath, name)
	if err := os.MkdirAll(folderPath, 0755); err != nil {
		return "", err
	}
	return absPathToID(folderPath), nil
}

// MoveNode 移动节点，返回新 ID
func (r *StorageRepo) MoveNode(id, newParentID string) (string, error) {
	srcPath := idToAbsPath(id)
	var dstDir string
	if newParentID == "" {
		dstDir = FilesRootDir
	} else {
		dstDir = idToAbsPath(newParentID)
	}
	name := filepath.Base(srcPath)
	dstPath := filepath.Join(dstDir, name)
	if srcPath == dstPath {
		return id, nil
	}
	os.MkdirAll(dstDir, 0755)
	if err := os.Rename(srcPath, dstPath); err != nil {
		return "", err
	}
	return absPathToID(dstPath), nil
}

// RenameNode 重命名节点，返回新 ID
func (r *StorageRepo) RenameNode(id, newName string) (string, error) {
	srcPath := idToAbsPath(id)
	dstPath := filepath.Join(filepath.Dir(srcPath), newName)
	if err := os.Rename(srcPath, dstPath); err != nil {
		return "", err
	}
	return absPathToID(dstPath), nil
}

// DeleteNode 删除节点
func (r *StorageRepo) DeleteNode(id string) error {
	p := idToAbsPath(id)
	info, err := os.Stat(p)
	if err != nil {
		return nil
	}
	if info.IsDir() {
		return os.RemoveAll(p)
	}
	return os.Remove(p)
}

// SearchResult 搜索结果
type SearchResult struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Snippet   string `json:"snippet"`
	MatchType string `json:"matchType"`
}

// SearchFiles 搜索文件名和内容
func (r *StorageRepo) SearchFiles(query string) []SearchResult {
	if query == "" {
		return []SearchResult{}
	}
	lowerQuery := strings.ToLower(query)
	var results []SearchResult

	filepath.Walk(FilesRootDir, func(p string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		name := filepath.Base(p)
		if strings.HasPrefix(name, ".") {
			return nil
		}
		id := absPathToID(p)

		if strings.Contains(strings.ToLower(name), lowerQuery) {
			results = append(results, SearchResult{ID: id, Name: name, MatchType: "name"})
			return nil
		}

		data, err := os.ReadFile(p)
		if err != nil {
			return nil
		}
		body := string(data)
		idx := strings.Index(strings.ToLower(body), lowerQuery)
		if idx >= 0 {
			start := idx - 40
			if start < 0 {
				start = 0
			}
			end := idx + len(query) + 40
			if end > len(body) {
				end = len(body)
			}
			snippet := strings.ReplaceAll(body[start:end], "\n", " ")
			if start > 0 {
				snippet = "…" + snippet
			}
			if end < len(body) {
				snippet += "…"
			}
			results = append(results, SearchResult{ID: id, Name: name, Snippet: snippet, MatchType: "content"})
		}
		return nil
	})

	return results
}
