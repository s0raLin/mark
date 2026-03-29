use crate::commands::ok;
use crate::models::types::{ApiResponse, SaveResponse, StorageEditorConfig, StorageFileSystem, StorageUserSettings};
use crate::repository::storage::get_storage;

#[tauri::command]
pub fn users_get_settings() -> Result<ApiResponse<StorageUserSettings>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.get_full_user_data()))
}

#[tauri::command]
pub fn users_update_settings(
    file_system: StorageFileSystem,
    editor_config: StorageEditorConfig,
) -> Result<ApiResponse<SaveResponse>, String> {
    let repo = get_storage();
    let mut guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.save_full_user_data(file_system, editor_config)?))
}
