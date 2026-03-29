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

#[tauri::command]
pub fn desktop_list_system_fonts() -> Result<ApiResponse<Vec<String>>, String> {
    Ok(ok(list_system_fonts()?))
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

fn list_system_fonts() -> Result<Vec<String>, String> {
    #[cfg(target_os = "linux")]
    {
        return run_and_parse_fonts(Command::new("fc-list").args(["--format=%{family}\n"]));
    }

    #[cfg(target_os = "macos")]
    {
        let output = Command::new("system_profiler")
            .args(["SPFontsDataType", "-json"])
            .output()
            .map_err(|err| err.to_string())?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
        }
        let value: serde_json::Value =
            serde_json::from_slice(&output.stdout).map_err(|err| err.to_string())?;
        let mut fonts = Vec::new();
        if let Some(items) = value
            .get("SPFontsDataType")
            .and_then(|entry| entry.as_array())
        {
            for item in items {
                if let Some(family) = item.get("family").and_then(|entry| entry.as_str()) {
                    fonts.push(family.to_string());
                }
            }
        }
        fonts.sort();
        fonts.dedup();
        return Ok(fonts);
    }

    #[cfg(target_os = "windows")]
    {
        return run_and_parse_fonts(Command::new("powershell").args([
            "-NoProfile",
            "-Command",
            "Get-ChildItem \"$env:WINDIR\\Fonts\" | Select-Object -ExpandProperty BaseName",
        ]));
    }

    #[allow(unreachable_code)]
    Err("unsupported platform".to_string())
}

fn run_and_parse_fonts(command: &mut Command) -> Result<Vec<String>, String> {
    let output = command.output().map_err(|err| err.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let mut fonts = String::from_utf8_lossy(&output.stdout)
        .lines()
        .flat_map(|line| line.split(','))
        .map(|font| font.trim())
        .filter(|font| !font.is_empty())
        .map(str::to_string)
        .collect::<Vec<_>>();

    fonts.sort();
    fonts.dedup();
    Ok(fonts)
}
