use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse<T> {
    pub code: i32,
    pub message: String,
    pub data: T,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StorageFileNode {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub parent_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct StorageFileSystem {
    pub nodes: Vec<StorageFileNode>,
    pub pinned_ids: Vec<String>,
    pub explorer_order: Vec<String>,
    pub folder_order: HashMap<String, Vec<String>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CustomFont {
    pub name: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
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

impl Default for StorageEditorConfig {
    fn default() -> Self {
        Self {
            editor_theme: "oneDark".into(),
            preview_theme: "theme-heart-classic".into(),
            font_choice: "Quicksand".into(),
            editor_font: "Quicksand".into(),
            font_size: 16,
            editor_font_size: 14,
            preview_font_size: 16,
            accent_color: "#ff9a9e".into(),
            blur_amount: 0.0,
            bg_image: String::new(),
            particles_on: false,
            lang: "zh".into(),
            custom_fonts: Vec::new(),
            dark_mode: false,
            auto_save: true,
            auto_save_interval: 1000,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StorageAppConfig {
    pub user_id: String,
    pub username: String,
    pub email: String,
    pub editor_config: StorageEditorConfig,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StorageUserSettings {
    pub user_id: String,
    pub username: String,
    pub email: String,
    pub file_system: StorageFileSystem,
    pub editor_config: StorageEditorConfig,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GetFileContentResponse {
    pub id: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SaveResponse {
    pub success: bool,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreateNodeResponse {
    pub id: String,
    pub name: String,
    pub file_system: StorageFileSystem,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MutateNodeResponse {
    pub id: String,
    pub file_system: StorageFileSystem,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub id: String,
    pub name: String,
    pub snippet: String,
    pub match_type: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StoredUploadResponse {
    pub file_path: String,
    pub font_family: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
}
