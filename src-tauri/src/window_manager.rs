// src/window_manager.rs
use tauri::{AppHandle, Listener, Manager, Runtime};


/// 设置窗口关闭事件监听器
pub fn setup_close_listener<R: Runtime>(app: &AppHandle<R>) {
    let app_handle = app.clone();
    app.listen_any("close_requested", move |_event| {
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.hide();
        }
    });
}



/// 设置所有窗口相关功能
pub fn setup_window_features<R: Runtime>(app: &AppHandle<R>) {
    setup_close_listener(app);
}