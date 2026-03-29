use crate::commands::ok;
use crate::models::types::{ApiResponse, SaveResponse, StorageFileSystem};
use crate::repository::storage::get_storage;

#[tauri::command]
pub fn file_system_get_tree() -> Result<ApiResponse<StorageFileSystem>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.get_file_system()))
}

#[tauri::command]
pub fn file_system_update_tree(
    file_system: StorageFileSystem,
) -> Result<ApiResponse<SaveResponse>, String> {
    let repo = get_storage();
    let mut guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.save_file_system(file_system)?))
}
