use crate::commands::ok;
use crate::models::types::{ApiResponse, SaveResponse, StorageEditorConfig};
use crate::repository::storage::get_storage;

#[tauri::command]
pub fn editor_config_get() -> Result<ApiResponse<StorageEditorConfig>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.get_editor_config()))
}

#[tauri::command]
pub fn editor_config_update(
    editor_config: StorageEditorConfig,
) -> Result<ApiResponse<SaveResponse>, String> {
    let repo = get_storage();
    let mut guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.save_editor_config(editor_config)?))
}
