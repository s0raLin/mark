// src/window_manager.rs
use tauri::{AppHandle, Listener, LogicalSize, Manager, Runtime, Size};

const DEFAULT_WINDOW_WIDTH: f64 = 1200.0;
const DEFAULT_WINDOW_HEIGHT: f64 = 800.0;

fn apply_startup_window_state<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unmaximize();
        let _ = window.set_fullscreen(false);
        let _ = window.set_size(Size::Logical(LogicalSize::new(
            DEFAULT_WINDOW_WIDTH,
            DEFAULT_WINDOW_HEIGHT,
        )));
        let _ = window.center();
    }
}

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
    apply_startup_window_state(app);
    setup_close_listener(app);
}
