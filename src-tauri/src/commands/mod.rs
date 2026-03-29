mod desktop;
mod editor_config;
mod file_system;
mod files;
mod search;
mod uploads;
mod users;

use crate::models::types::ApiResponse;

pub use desktop::*;
pub use editor_config::*;
pub use file_system::*;
pub use files::*;
pub use search::*;
pub use uploads::*;
pub use users::*;

fn ok<T>(data: T) -> ApiResponse<T> {
    ApiResponse {
        code: 0,
        message: String::new(),
        data,
    }
}
