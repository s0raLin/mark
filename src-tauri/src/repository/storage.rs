use crate::models::types::{
    CreateNodeResponse, GetFileContentResponse, MutateNodeResponse, SaveResponse,
    SearchResult, StorageAppConfig, StorageEditorConfig, StorageFileNode, StorageFileSystem,
    StorageUserSettings,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::{Arc, Mutex, OnceLock},
};

static GLOBAL_REPO: OnceLock<Arc<Mutex<StorageRepo>>> = OnceLock::new();
const META_FILE_NAME: &str = ".meta.json";

/// 返回全局共享的存储仓储。
///
/// 这里使用 `OnceLock + Arc<Mutex<_>>` 的组合：
/// - `OnceLock` 负责只初始化一次
/// - `Arc` 允许多个 command 共享实例
/// - `Mutex` 保证写入配置和文件树元数据时的并发安全
pub fn get_storage() -> Arc<Mutex<StorageRepo>> {
    GLOBAL_REPO
        .get_or_init(|| Arc::new(Mutex::new(StorageRepo::new())))
        .clone()
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DirMeta {
    pub order: Vec<String>,
    pub pinned: Vec<String>,
}

#[derive(Clone)]
struct NodeEntry {
    node: StorageFileNode,
    order: usize,
    pinned: bool,
}

pub struct StorageRepo {
    /// 仅保存应用级配置，不保存完整文件树。
    config: StorageAppConfig,
    /// 用户文件实际落盘的根目录。
    files_root: PathBuf,
    /// 用户配置 JSON 路径。
    config_path: PathBuf,
}

impl StorageRepo {
    /// 初始化仓储与默认配置。
    ///
    /// 目录结构：
    /// - `notemark/files`：真实文件树
    /// - `notemark/userdata.json`：应用配置
    fn new() -> Self {
        let app_data = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("notemark");
        let files_root = app_data.join("files");
        let config_path = app_data.join("userdata.json");

        let _ = fs::create_dir_all(&files_root);
        let _ = fs::create_dir_all(&app_data);

        let mut repo = Self {
            config: StorageAppConfig {
                user_id: "demo-user".into(),
                username: "Demo".into(),
                email: "demo@example.com".into(),
                editor_config: StorageEditorConfig::default(),
                updated_at: Utc::now(),
            },
            files_root,
            config_path,
        };
        repo.load_config();
        repo
    }

    fn load_config(&mut self) {
        if let Ok(data) = fs::read_to_string(&self.config_path) {
            if let Ok(config) = serde_json::from_str::<StorageAppConfig>(&data) {
                self.config = config;
                return;
            }
        }

        let _ = self.save_config();
    }

    fn save_config(&self) -> Result<(), String> {
        let parent = self
            .config_path
            .parent()
            .ok_or_else(|| "invalid config path".to_string())?;
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
        let data = serde_json::to_string_pretty(&self.config).map_err(|err| err.to_string())?;
        fs::write(&self.config_path, data).map_err(|err| err.to_string())
    }

    fn id_to_abs(&self, id: &str) -> PathBuf {
        if id.is_empty() {
            return self.files_root.clone();
        }
        self.files_root
            .join(id.replace('/', std::path::MAIN_SEPARATOR_STR))
    }

    fn abs_to_id(&self, abs: &Path) -> String {
        abs.strip_prefix(&self.files_root)
            .unwrap_or(abs)
            .to_string_lossy()
            .replace(std::path::MAIN_SEPARATOR_STR, "/")
    }

    fn parent_of_id(id: &str) -> String {
        match id.rsplit_once('/') {
            Some((parent, _)) => parent.to_string(),
            None => String::new(),
        }
    }

    fn last_segment(id: &str) -> String {
        id.rsplit('/').next().unwrap_or(id).to_string()
    }

    fn read_dir_meta(&self, dir_path: &Path) -> DirMeta {
        let meta_path = dir_path.join(META_FILE_NAME);
        match fs::read_to_string(meta_path) {
            Ok(data) => serde_json::from_str::<DirMeta>(&data).unwrap_or_default(),
            Err(_) => DirMeta::default(),
        }
    }

    fn write_dir_meta(&self, dir_path: &Path, meta: &DirMeta) -> Result<(), String> {
        fs::create_dir_all(dir_path).map_err(|err| err.to_string())?;
        let data = serde_json::to_string_pretty(meta).map_err(|err| err.to_string())?;
        fs::write(dir_path.join(META_FILE_NAME), data).map_err(|err| err.to_string())
    }

    fn scan_dir(&self, dir_path: &Path, parent_id: Option<&str>) -> Vec<NodeEntry> {
        // 每个目录都允许通过 `.meta.json` 单独维护排序与 pinned 状态。
        let meta = self.read_dir_meta(dir_path);
        let order_map: HashMap<String, usize> = meta
            .order
            .iter()
            .enumerate()
            .map(|(idx, name)| (name.clone(), idx))
            .collect();
        let pinned_map: HashMap<String, bool> =
            meta.pinned.iter().map(|name| (name.clone(), true)).collect();

        let mut current_level = Vec::new();
        let mut nested = Vec::new();

        if let Ok(entries) = fs::read_dir(dir_path) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with('.') {
                    continue;
                }

                let abs_path = entry.path();
                let id = self.abs_to_id(&abs_path);
                let info = match entry.metadata() {
                    Ok(info) => info,
                    Err(_) => continue,
                };
                let modified = info.modified().unwrap_or(std::time::SystemTime::now());
                let timestamp = chrono::DateTime::<Utc>::from(modified);
                let node = StorageFileNode {
                    id: id.clone(),
                    name: name.clone(),
                    kind: if info.is_dir() { "folder" } else { "file" }.into(),
                    parent_id: parent_id.map(|value| value.to_string()),
                    created_at: timestamp,
                    updated_at: timestamp,
                };
                let entry_record = NodeEntry {
                    node: node.clone(),
                    order: order_map.get(&name).copied().unwrap_or(9999),
                    pinned: pinned_map.get(&name).copied().unwrap_or(false),
                };

                current_level.push(entry_record);

                if info.is_dir() {
                    nested.extend(self.scan_dir(&abs_path, Some(&id)));
                }
            }
        }

        current_level.sort_by_key(|entry| (entry.order, entry.node.name.clone()));
        current_level.extend(nested);
        current_level
    }

    pub fn build_file_system(&self) -> StorageFileSystem {
        // 先做物理扫描，再按 parent_id 重新分组，最后按 BFS 顺序构造前端需要的树形快照。
        let entries = self.scan_dir(&self.files_root, None);
        let mut grouped: HashMap<String, Vec<NodeEntry>> = HashMap::new();

        for entry in entries {
            let parent = entry
                .node
                .parent_id
                .clone()
                .unwrap_or_default();
            grouped.entry(parent).or_default().push(entry);
        }

        for items in grouped.values_mut() {
            items.sort_by_key(|entry| (entry.order, entry.node.name.clone()));
        }

        let mut nodes = Vec::new();
        let mut pinned_ids = Vec::new();
        let mut explorer_order = Vec::new();
        let mut folder_order: HashMap<String, Vec<String>> = HashMap::new();

        fn bfs(
            parent_id: &str,
            grouped: &HashMap<String, Vec<NodeEntry>>,
            nodes: &mut Vec<StorageFileNode>,
            pinned_ids: &mut Vec<String>,
            explorer_order: &mut Vec<String>,
            folder_order: &mut HashMap<String, Vec<String>>,
        ) {
            if let Some(items) = grouped.get(parent_id) {
                for entry in items {
                    nodes.push(entry.node.clone());
                    if entry.pinned {
                        pinned_ids.push(entry.node.id.clone());
                    }

                    if parent_id.is_empty() {
                        if !entry.pinned {
                            explorer_order.push(entry.node.id.clone());
                        }
                    } else {
                        folder_order
                            .entry(parent_id.to_string())
                            .or_default()
                            .push(entry.node.id.clone());
                    }

                    if entry.node.kind == "folder" {
                        bfs(
                            &entry.node.id,
                            grouped,
                            nodes,
                            pinned_ids,
                            explorer_order,
                            folder_order,
                        );
                    }
                }
            }
        }

        bfs(
            "",
            &grouped,
            &mut nodes,
            &mut pinned_ids,
            &mut explorer_order,
            &mut folder_order,
        );

        StorageFileSystem {
            nodes,
            pinned_ids,
            explorer_order,
            folder_order,
            updated_at: Utc::now(),
        }
    }

    pub fn get_full_user_data(&self) -> StorageUserSettings {
        StorageUserSettings {
            user_id: self.config.user_id.clone(),
            username: self.config.username.clone(),
            email: self.config.email.clone(),
            file_system: self.build_file_system(),
            editor_config: self.config.editor_config.clone(),
            updated_at: self.config.updated_at,
        }
    }

    pub fn get_file_system(&self) -> StorageFileSystem {
        self.build_file_system()
    }

    /// 仅更新文件树的元数据，不负责改动具体文件内容。
    ///
    /// 这里更新的是：
    /// - 根级排序
    /// - 文件夹内部排序
    /// - pinned 状态
    pub fn save_file_system(&mut self, file_system: StorageFileSystem) -> Result<SaveResponse, String> {
        self.update_dir_metas(&file_system)?;
        self.config.updated_at = Utc::now();
        self.save_config()?;

        Ok(SaveResponse {
            success: true,
            updated_at: self.config.updated_at,
        })
    }

    pub fn get_editor_config(&self) -> StorageEditorConfig {
        self.config.editor_config.clone()
    }

    pub fn save_editor_config(&mut self, editor_config: StorageEditorConfig) -> Result<SaveResponse, String> {
        self.config.editor_config = editor_config;
        self.config.updated_at = Utc::now();
        self.save_config()?;

        Ok(SaveResponse {
            success: true,
            updated_at: self.config.updated_at,
        })
    }

    pub fn save_full_user_data(
        &mut self,
        file_system: StorageFileSystem,
        editor_config: StorageEditorConfig,
    ) -> Result<SaveResponse, String> {
        // 用户设置整体保存时，文件树与编辑器配置应视为一次逻辑操作。
        self.update_dir_metas(&file_system)?;
        self.config.editor_config = editor_config;
        self.config.updated_at = Utc::now();
        self.save_config()?;

        Ok(SaveResponse {
            success: true,
            updated_at: self.config.updated_at,
        })
    }

    fn update_dir_metas(&self, file_system: &StorageFileSystem) -> Result<(), String> {
        // `.meta.json` 是 Electron/Go 与 Tauri/Rust 共用的目录元数据格式。
        // 这样双运行时共存时仍能读取同一份本地数据。
        let pinned_lookup: HashMap<String, bool> = file_system
            .pinned_ids
            .iter()
            .map(|id| (id.clone(), true))
            .collect();

        let root_meta = DirMeta {
            order: file_system
                .explorer_order
                .iter()
                .map(|id| Self::last_segment(id))
                .collect(),
            pinned: file_system
                .pinned_ids
                .iter()
                .filter(|id| Self::parent_of_id(id).is_empty())
                .map(|id| Self::last_segment(id))
                .collect(),
        };
        self.write_dir_meta(&self.files_root, &root_meta)?;

        for (parent_id, children) in &file_system.folder_order {
            let meta = DirMeta {
                order: children.iter().map(|id| Self::last_segment(id)).collect(),
                pinned: children
                    .iter()
                    .filter(|id| pinned_lookup.get(*id).copied().unwrap_or(false))
                    .map(|id| Self::last_segment(id))
                    .collect(),
            };
            self.write_dir_meta(&self.id_to_abs(parent_id), &meta)?;
        }

        Ok(())
    }

    pub fn get_file_content(&self, id: &str) -> Result<GetFileContentResponse, String> {
        let content = fs::read_to_string(self.id_to_abs(id)).map_err(|err| err.to_string())?;
        Ok(GetFileContentResponse {
            id: id.to_string(),
            content,
        })
    }

    pub fn save_file_content(&self, id: &str, content: &str) -> Result<SaveResponse, String> {
        let file_path = self.id_to_abs(id);
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).map_err(|err| err.to_string())?;
        }
        fs::write(file_path, content).map_err(|err| err.to_string())?;
        Ok(SaveResponse {
            success: true,
            updated_at: Utc::now(),
        })
    }

    pub fn create_file(
        &self,
        parent_id: &str,
        name: &str,
        content: &str,
    ) -> Result<CreateNodeResponse, String> {
        // 创建后直接返回最新文件树快照，前端无需自行推导新结构。
        let dir = self.id_to_abs(parent_id);
        fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
        let file_path = dir.join(name);
        fs::write(&file_path, content).map_err(|err| err.to_string())?;
        Ok(CreateNodeResponse {
            id: self.abs_to_id(&file_path),
            name: name.to_string(),
            file_system: self.build_file_system(),
        })
    }

    pub fn create_folder(&self, parent_id: &str, name: &str) -> Result<CreateNodeResponse, String> {
        let dir = self.id_to_abs(parent_id).join(name);
        fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
        Ok(CreateNodeResponse {
            id: self.abs_to_id(&dir),
            name: name.to_string(),
            file_system: self.build_file_system(),
        })
    }

    pub fn move_node(&self, id: &str, new_parent_id: &str) -> Result<MutateNodeResponse, String> {
        let src = self.id_to_abs(id);
        let dst_dir = self.id_to_abs(new_parent_id);
        fs::create_dir_all(&dst_dir).map_err(|err| err.to_string())?;
        let file_name = src
            .file_name()
            .ok_or_else(|| "invalid source path".to_string())?;
        let dst = dst_dir.join(file_name);

        if src != dst {
            fs::rename(src, &dst).map_err(|err| err.to_string())?;
        }

        Ok(MutateNodeResponse {
            id: self.abs_to_id(&dst),
            file_system: self.build_file_system(),
        })
    }

    pub fn rename_node(&self, id: &str, new_name: &str) -> Result<MutateNodeResponse, String> {
        let src = self.id_to_abs(id);
        let dst = src
            .parent()
            .ok_or_else(|| "invalid source path".to_string())?
            .join(new_name);
        fs::rename(src, &dst).map_err(|err| err.to_string())?;

        Ok(MutateNodeResponse {
            id: self.abs_to_id(&dst),
            file_system: self.build_file_system(),
        })
    }

    pub fn delete_node(&self, id: &str) -> Result<StorageFileSystem, String> {
        let path = self.id_to_abs(id);
        if let Ok(meta) = fs::metadata(&path) {
            if meta.is_dir() {
                fs::remove_dir_all(path).map_err(|err| err.to_string())?;
            } else {
                fs::remove_file(path).map_err(|err| err.to_string())?;
            }
        }
        Ok(self.build_file_system())
    }

    pub fn search_files(&self, query: &str) -> Result<Vec<SearchResult>, String> {
        if query.trim().is_empty() {
            return Ok(Vec::new());
        }

        // 搜索策略：
        // - 先匹配文件名
        // - 名称未命中时再读文件正文做内容匹配
        let lower_query = query.to_lowercase();
        let mut results = Vec::new();
        self.search_dir(&self.files_root, &lower_query, query, &mut results)?;
        Ok(results)
    }

    fn search_dir(
        &self,
        dir: &Path,
        lower_query: &str,
        raw_query: &str,
        results: &mut Vec<SearchResult>,
    ) -> Result<(), String> {
        let entries = fs::read_dir(dir).map_err(|err| err.to_string())?;
        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }

            let metadata = match entry.metadata() {
                Ok(metadata) => metadata,
                Err(_) => continue,
            };

            if metadata.is_dir() {
                self.search_dir(&path, lower_query, raw_query, results)?;
                continue;
            }

            let id = self.abs_to_id(&path);

            if name.to_lowercase().contains(lower_query) {
                results.push(SearchResult {
                    id,
                    name,
                    snippet: String::new(),
                    match_type: "name".into(),
                });
                continue;
            }

            let body = match fs::read_to_string(&path) {
                Ok(body) => body,
                Err(_) => continue,
            };
            let lower_body = body.to_lowercase();
            if let Some(idx) = lower_body.find(lower_query) {
                let start = idx.saturating_sub(40);
                let end = (idx + raw_query.len() + 40).min(body.len());
                let mut snippet = body[start..end].replace('\n', " ");
                if start > 0 {
                    snippet = format!("…{snippet}");
                }
                if end < body.len() {
                    snippet.push('…');
                }
                results.push(SearchResult {
                    id,
                    name,
                    snippet,
                    match_type: "content".into(),
                });
            }
        }

        Ok(())
    }
}
