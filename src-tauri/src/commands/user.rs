use crate::models::*;
use crate::repository::get_storage;
use tauri::State;
use std::sync::Mutex;

// 建议把 repo 作为 State 注入
#[tauri::command]
pub fn get_user_data() -> Result<ApiResponse<StorageUserSettings>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|e| e.to_string())?;
    let data = guard.get_full_user_data();
    Ok(ApiResponse {
        code: 0,
        message: "".into(),
        data,
    })
}

#[tauri::command]
pub fn save_user_data(
    fs: StorageFileSystem,
    editor_config: StorageEditorConfig,
) -> Result<ApiResponse<SaveResponse>, String> {
    let repo = get_storage();
    let mut guard = repo.lock().map_err(|e| e.to_string())?;
    guard.save_full_user_data(fs, editor_config)
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse {
        code: 0,
        message: "".into(),
        data: SaveResponse {
            success: true,
            updated_at: Utc::now(),
        },
    })
}

// 其他命令：get_file_content、save_file_content、create_file、create_folder、move_node、rename_node、delete_node、search_files、upload_image、upload_font 等

// UploadImage / UploadFont 需要处理 multipart（tauri-plugin-upload 或手动处理），这里推荐使用 tauri::http::Request 处理上传。