use crate::commands::ok;
use crate::models::types::{ApiResponse, StoredUploadResponse, UploadedImageAsset};
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

#[tauri::command]
pub fn uploads_list_images() -> Result<ApiResponse<Vec<UploadedImageAsset>>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.list_uploaded_images()?))
}

#[tauri::command]
pub fn uploads_delete_image(file_name: String) -> Result<ApiResponse<bool>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.delete_uploaded_image(&file_name)?))
}
