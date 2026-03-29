use crate::models::{types::{StorageAppConfig, StorageEditorConfig, StorageUserSettings}, *};
use anyhow::{Context, Result};
use chrono::Utc;
use once_cell::sync::Lazy;
use serde_json;
use std::{
    collections::{HashMap, HashSet},
    fs, io,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};

static GLOBAL_REPO: Lazy<Arc<Mutex<StorageRepo>>> = Lazy::new(|| {
    Arc::new(Mutex::new(StorageRepo::new()))
});

pub fn get_storage() -> Arc<Mutex<StorageRepo>> {
    GLOBAL_REPO.clone()
}

#[derive(Debug)]
pub struct DirMeta {
    pub order: Vec<String>,
    pub pinned: Vec<String>,
}

pub struct StorageRepo {
    config: StorageAppConfig,
    app_data_dir: PathBuf,
    files_root: PathBuf,
    uploads_dir: PathBuf,
    config_path: PathBuf,
}

impl StorageRepo {
    fn new() -> Self {
        let app_data = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("notemark");

        let files_root = app_data.join("files");
        let uploads = app_data.join("uploads");
        let config_path = app_data.join("userdata.json");

        fs::create_dir_all(&files_root).ok();
        fs::create_dir_all(&uploads).ok();
        fs::create_dir_all(app_data.parent().unwrap()).ok();

        let mut repo = StorageRepo {
            config: StorageAppConfig {
                user_id: "demo-user".into(),
                username: "Demo".into(),
                email: "demo@example.com".into(),
                editor_config: StorageEditorConfig {
                    editor_theme: "vs-dark".into(),
                    preview_theme: "github".into(),
                    font_size: 14,
                    ..Default::default() // 你可以补全默认值
                },
                updated_at: Utc::now(),
            },
            app_data_dir: app_data,
            files_root,
            uploads_dir: uploads,
            config_path,
        };

        repo.load_config();
        repo
    }

    fn load_config(&mut self) {
        if let Ok(data) = fs::read_to_string(&self.config_path) {
            if let Ok(cfg) = serde_json::from_str(&data) {
                self.config = cfg;
                return;
            }
        }
        // 默认配置已在上方设置
        self.save_config().ok();
    }

    fn save_config(&self) -> Result<()> {
        let data = serde_json::to_string_pretty(&self.config)?;
        fs::write(&self.config_path, data)?;
        Ok(())
    }

    // ID ↔ 绝对路径转换
    fn id_to_abs(&self, id: &str) -> PathBuf {
        self.files_root.join(id.replace('/', std::path::MAIN_SEPARATOR_STR))
    }

    fn abs_to_id(&self, abs: &Path) -> String {
        abs.strip_prefix(&self.files_root)
            .unwrap_or(abs)
            .to_string_lossy()
            .replace(std::path::MAIN_SEPARATOR_STR, "/")
    }

    // 其他辅助函数：read_dir_meta、write_dir_meta、scan_dir、build_file_system 等
    // 由于篇幅较长，这里省略具体实现逻辑（与 Go 几乎一致，使用 std::fs::read_dir、walkdir 或递归实现）
    // 你可以参考原 Go 的 scanDir + updateDirMetas 逻辑翻译成 Rust。

    pub fn get_full_user_data(&self) -> StorageUserSettings {
        let fs = self.build_file_system();
        StorageUserSettings {
            user_id: self.config.user_id.clone(),
            username: self.config.username.clone(),
            email: self.config.email.clone(),
            file_system: fs,
            editor_config: self.config.editor_config.clone(),
            updated_at: self.config.updated_at,
        }
    }

    // SaveFullUserData、GetFileContent、SaveFileContent、CreateFile、CreateFolder、
    // MoveNode、RenameNode、DeleteNode、SearchFiles 等方法
    // 请按原 Go 逻辑逐一实现（我可以帮你继续补全具体函数）
}