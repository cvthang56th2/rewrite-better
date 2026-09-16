mod capture;
mod chat;
mod store;

use std::collections::HashMap;

use serde::Serialize;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::chat::{ChatError, ChatRequest};
use crate::store::Prefs;

#[tauri::command]
fn get_api_keys() -> HashMap<String, String> {
    store::get_api_keys()
}

#[tauri::command]
fn save_api_keys(keys: HashMap<String, String>) -> Result<(), String> {
    store::save_api_keys(&keys)
}

#[tauri::command]
fn get_prefs(app: AppHandle) -> Prefs {
    store::load_prefs(&app)
}

#[tauri::command]
fn save_prefs(app: AppHandle, prefs: Prefs) -> Result<(), String> {
    let mut current = store::load_prefs(&app);
    current.ui_language = prefs.ui_language;
    current.extra_instructions = prefs.extra_instructions;
    current.voice_samples = prefs.voice_samples;
    store::save_prefs(&app, &current)
}

#[tauri::command]
fn paste_back(app: AppHandle, text: String) -> Result<(), String> {
    capture::copy_text(&text)?;
    if let Some(win) = app.get_webview_window("panel") {
        win.hide().map_err(|e| e.to_string())?;
    }
    std::thread::sleep(std::time::Duration::from_millis(120));
    capture::send_paste()
}

#[tauri::command]
fn hide_panel(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("panel") {
        win.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn open_settings(app: AppHandle) {
    show_settings(&app);
}

#[tauri::command]
async fn chat_completion(request: ChatRequest) -> Result<String, ChatError> {
    chat::chat_completion(request).await
}

#[tauri::command]
fn get_autostart(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_autostart(app: AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    let manager = app.autolaunch();
    if enabled {
        manager.enable().map_err(|e| e.to_string())
    } else {
        manager.disable().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn set_hotkey(app: AppHandle, shortcut: String) -> Result<(), String> {
    register_hotkey(&app, &shortcut)?;
    let mut prefs = store::load_prefs(&app);
    prefs.hotkey = shortcut;
    store::save_prefs(&app, &prefs)
}

fn register_hotkey(app: &AppHandle, shortcut: &str) -> Result<(), String> {
    let parsed = shortcut
        .parse::<Shortcut>()
        .map_err(|e| format!("{e}"))?;
    let shortcuts = app.global_shortcut();
    shortcuts.unregister_all().map_err(|e| e.to_string())?;
    shortcuts.register(parsed).map_err(|e| e.to_string())
}

fn show_settings(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PanelOpenPayload {
    text: String,
    had_selection: bool,
}

fn open_panel(app: &AppHandle, empty: bool) {
    let text = if empty {
        String::new()
    } else {
        capture::capture_selected_text()
    };
    let had_selection = !empty && !text.trim().is_empty();
    if let Some(win) = app.get_webview_window("panel") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
        let _ = win.emit(
            "panel-open",
            PanelOpenPayload {
                text,
                had_selection,
            },
        );
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        open_panel(app, false);
                    }
                })
                .build(),
        )
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let handle = app.handle();
            let prefs = store::load_prefs(handle);
            if let Err(err) = register_hotkey(handle, &prefs.hotkey) {
                eprintln!("failed to register hotkey {}: {err}", prefs.hotkey);
                let fallback = store::default_hotkey();
                let _ = register_hotkey(handle, &fallback);
            }

            let open = MenuItem::with_id(app, "open", "Open Panel", true, None::<&str>)?;
            let empty = MenuItem::with_id(app, "empty", "Open Empty Panel", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Rewrite Better", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &empty, &settings, &quit])?;

            let mut tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .tooltip("Rewrite Better")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => open_panel(app, false),
                    "empty" => open_panel(app, true),
                    "settings" => show_settings(app),
                    "quit" => app.exit(0),
                    _ => {}
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_api_keys,
            save_api_keys,
            get_prefs,
            save_prefs,
            copy_text,
            paste_back,
            hide_panel,
            open_settings,
            chat_completion,
            get_autostart,
            set_autostart,
            set_hotkey
        ])
        .run(tauri::generate_context!())
        .expect("error while running Rewrite Better");
}
