#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod repository;

/// Tauri 桌面端入口。
///
/// 设计目标：
/// - 在应用启动时预热全局仓储，确保本地目录和配置文件已经初始化。
/// - 注册所有资源化 command，供前端通过 `invoke` 调用。
/// - 保持 `run()` 本身足够薄，业务逻辑下沉到 `commands/` 与 `repository/`。
pub fn run() {
    // 预初始化本地仓储，避免第一次 command 调用时再懒加载目录结构。
    let _ = repository::storage::get_storage();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // users
            commands::users_get_settings,
            commands::users_update_settings,
            // editor config
            commands::editor_config_get,
            commands::editor_config_update,
            // file system
            commands::file_system_get_tree,
            commands::file_system_update_tree,
            // files and folders
            commands::files_get_content,
            commands::files_update_content,
            commands::files_create,
            commands::folders_create,
            commands::file_nodes_move,
            commands::file_nodes_rename,
            commands::file_nodes_delete,
            // uploads
            commands::uploads_store_image,
            commands::uploads_store_font,
            commands::uploads_list_images,
            commands::uploads_delete_image,
            // desktop helpers
            commands::desktop_open_external,
            commands::desktop_close_window,
            commands::desktop_get_window_position,
            commands::desktop_set_window_position,
            commands::desktop_list_system_fonts,
            // search
            commands::search_query_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
