use crate::commands::ok;
use crate::models::types::{ApiResponse, StoredUploadResponse};
use crate::repository::storage::get_storage;

#[tauri::command]
pub fn uploads_store_image(
    file_name: String,
    bytes: Vec<u8>,
) -> Result<ApiResponse<StoredUploadResponse>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.store_uploaded_image(&file_name, &bytes)?))
}

#[tauri::command]
pub fn uploads_store_font(
    file_name: String,
    bytes: Vec<u8>,
) -> Result<ApiResponse<StoredUploadResponse>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.store_uploaded_font(&file_name, &bytes)?))
}
