use crate::commands::ok;
use crate::models::types::{
    ApiResponse, CreateNodeResponse, GetFileContentResponse, MutateNodeResponse, SaveResponse,
    StorageFileSystem,
};
use crate::repository::storage::get_storage;

#[tauri::command]
pub fn files_get_content(id: String) -> Result<ApiResponse<GetFileContentResponse>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.get_file_content(&id)?))
}

#[tauri::command]
pub fn files_update_content(
    id: String,
    content: String,
) -> Result<ApiResponse<SaveResponse>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.save_file_content(&id, &content)?))
}

#[tauri::command]
pub fn files_create(
    parent_id: String,
    name: String,
    content: String,
) -> Result<ApiResponse<CreateNodeResponse>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.create_file(&parent_id, &name, &content)?))
}

#[tauri::command]
pub fn folders_create(
    parent_id: String,
    name: String,
) -> Result<ApiResponse<CreateNodeResponse>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.create_folder(&parent_id, &name)?))
}

#[tauri::command]
pub fn file_nodes_move(
    id: String,
    new_parent_id: String,
) -> Result<ApiResponse<MutateNodeResponse>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.move_node(&id, &new_parent_id)?))
}

#[tauri::command]
pub fn file_nodes_rename(
    id: String,
    new_name: String,
) -> Result<ApiResponse<MutateNodeResponse>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.rename_node(&id, &new_name)?))
}

#[tauri::command]
pub fn file_nodes_delete(id: String) -> Result<ApiResponse<StorageFileSystem>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.delete_node(&id)?))
}
