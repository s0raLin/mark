package repository

import (
	"encoding/json"
	"os"
	"sync"
	"time"

	"server/internal/model"
)

type StorageRepo struct {
	mu          sync.RWMutex
	data        model.StorageUserSettings
	filepath    string // 可選：持久化路徑
	initialized bool
}

var (
	globalStorage *StorageRepo
	once          sync.Once
)

func GetStorage() *StorageRepo {
	once.Do(func() {
		globalStorage = &StorageRepo{
			filepath: "./data/userdata.json", // 實際專案請改用資料庫
		}
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

	data, err := os.ReadFile(r.filepath)
	if err == nil {
		_ = json.Unmarshal(data, &r.data)
	} else {
		// 初始預設值
		r.data = model.StorageUserSettings{
			UserID:   "demo-user",
			Username: "Demo",
			Email:    "demo@example.com",
			FileSystem: model.StorageFileSystem{
				Nodes:         []model.StorageFileNode{},
				FileContents:  make(map[string]string),
				PinnedIDs:     []string{},
				ExplorerOrder: []string{},
				FolderOrder:   make(map[string][]string),
				UpdatedAt:     time.Now(),
			},
			EditorConfig: model.StorageEditorConfig{
				EditorTheme:  "vs-dark",
				PreviewTheme: "github",
				FontSize:     14,
			},
			UpdatedAt: time.Now(),
		}
	}

	r.initialized = true
}

// saveAll 将数据写入文件，调用方必须已持有写锁
func (r *StorageRepo) saveAll() error {
	if err := os.MkdirAll("./data", 0755); err != nil {
		return err
	}
	bytes, _ := json.MarshalIndent(r.data, "", "  ")
	return os.WriteFile(r.filepath, bytes, 0644)
}

// ─── 以下為常用方法 ─────────────────────────────────────

func (r *StorageRepo) GetFullUserData() model.StorageUserSettings {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.data
}

func (r *StorageRepo) SaveFullUserData(fs model.StorageFileSystem, cfg model.StorageEditorConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.data.FileSystem = fs
	r.data.EditorConfig = cfg
	r.data.UpdatedAt = time.Now()

	return r.saveAll()
}

func (r *StorageRepo) GetFileContent(id string) (string, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	content, ok := r.data.FileSystem.FileContents[id]
	return content, ok
}

func (r *StorageRepo) SaveFileContent(id, content string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.data.FileSystem.FileContents[id] = content
	r.data.FileSystem.UpdatedAt = time.Now()
	r.data.UpdatedAt = time.Now()

	return r.saveAll()
}

// ... 其他方法：GetFileSystem、SaveFileSystem、GetEditorConfig、SaveEditorConfig 類似
