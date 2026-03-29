use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ApiResponse<T> {
    pub code: i32,      // 0 = 成功
    pub message: String,
    pub data: T,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ApiError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

// ──────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StorageFileNode {
    pub id: String,
    pub name: String,
    pub r#type: String, // "file" | "folder"
    pub parent_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileFrontmatter {
    pub id: String,
    pub name: String,
    pub r#type: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub parent_id: String,
    #[serde(skip_serializing_if = "is_false")]
    pub pinned: bool,
    pub order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn is_false(b: &bool) -> bool { !*b }

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct StorageFileSystem {
    pub nodes: Vec<StorageFileNode>,
    pub pinned_ids: Vec<String>,
    pub explorer_order: Vec<String>,
    pub folder_order: HashMap<String, Vec<String>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StorageEditorConfig {
    pub editor_theme: String,
    pub preview_theme: String,
    pub font_choice: String,
    pub editor_font: String,
    pub font_size: i32,
    pub editor_font_size: i32,
    pub preview_font_size: i32,
    pub accent_color: String,
    pub blur_amount: f64,
    pub bg_image: String,
    pub particles_on: bool,
    pub lang: String,
    pub custom_fonts: Vec<CustomFont>,
    pub dark_mode: bool,
    pub auto_save: bool,
    pub auto_save_interval: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomFont {
    pub name: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StorageAppConfig {
    pub user_id: String,
    pub username: String,
    pub email: String,
    pub editor_config: StorageEditorConfig,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StorageUserSettings {
    pub user_id: String,
    pub username: String,
    pub email: String,
    pub file_system: StorageFileSystem,
    pub editor_config: StorageEditorConfig,
    pub updated_at: DateTime<Utc>,
}

// 其他响应结构
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetFileContentResponse {
    pub id: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SaveFileContentResponse {
    pub success: bool,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SaveResponse {
    pub success: bool,
    pub updated_at: DateTime<Utc>,
}

// Search
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SearchResult {
    pub id: String,
    pub name: String,
    pub snippet: Option<String>,
    pub match_type: String, // "name" | "content"
}