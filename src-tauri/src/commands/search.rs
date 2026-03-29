use crate::commands::ok;
use crate::models::types::{ApiResponse, SearchResult};
use crate::repository::storage::get_storage;

#[tauri::command]
pub fn search_query_files(query: String) -> Result<ApiResponse<Vec<SearchResult>>, String> {
    let repo = get_storage();
    let guard = repo.lock().map_err(|err| err.to_string())?;
    Ok(ok(guard.search_files(&query)?))
}
