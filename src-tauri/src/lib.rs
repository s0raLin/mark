// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;
mod repository;
mod commands;

use tauri::{Builder, Manager};

fn main() {
    Builder::default()
        .plugin(tauri_plugin_fs::init())      // 如果需要前端也访问 fs（推荐只在 Rust 侧处理）
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_user_data,
            commands::save_user_data,
            // ... 其他 commands
        ])
        .setup(|app| {
            // 可在此初始化 repo 或创建必要目录
            let _ = repo::get_storage(); // 触发初始化
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}