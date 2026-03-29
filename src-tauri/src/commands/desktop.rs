use crate::commands::ok;
use crate::models::types::{ApiResponse, WindowPosition};
use std::process::Command;
use tauri::{PhysicalPosition, Position, WebviewWindow};

#[tauri::command]
pub fn desktop_get_window_position(
    window: WebviewWindow,
) -> Result<ApiResponse<WindowPosition>, String> {
    let position = window.outer_position().map_err(|err| err.to_string())?;
    Ok(ok(WindowPosition {
        x: position.x,
        y: position.y,
    }))
}

#[tauri::command]
pub fn desktop_set_window_position(
    x: i32,
    y: i32,
    window: WebviewWindow,
) -> Result<ApiResponse<bool>, String> {
    window
        .set_position(Position::Physical(PhysicalPosition::new(x, y)))
        .map_err(|err| err.to_string())?;
    Ok(ok(true))
}

#[tauri::command]
pub fn desktop_close_window(window: WebviewWindow) -> Result<ApiResponse<bool>, String> {
    window.close().map_err(|err| err.to_string())?;
    Ok(ok(true))
}

#[tauri::command]
pub fn desktop_open_external(url: String) -> Result<ApiResponse<bool>, String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("unsupported url".to_string());
    }

    open_external_url(&url)?;
    Ok(ok(true))
}

fn open_external_url(url: &str) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map_err(|err| err.to_string())?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(url)
            .spawn()
            .map_err(|err| err.to_string())?;
        return Ok(());
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", url])
            .spawn()
            .map_err(|err| err.to_string())?;
        return Ok(());
    }

    #[allow(unreachable_code)]
    Err("unsupported platform".to_string())
}
