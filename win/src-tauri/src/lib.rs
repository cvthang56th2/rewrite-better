mod capture;
mod chat;
mod l10n;
mod store;
mod updater;

use std::collections::HashMap;

use serde::Serialize;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, Wry};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::chat::{ChatError, ChatRequest, ProbeRequest};
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
    current.enabled_providers = prefs.enabled_providers;
    store::save_prefs(&app, &current)?;
    if let Some(items) = app.try_state::<TrayMenuItems>() {
        apply_tray_language(items.inner(), &current.ui_language);
    }
    Ok(())
}

#[tauri::command]
fn check_for_updates(app: AppHandle) {
    #[cfg(windows)]
    updater::spawn_check(app, updater::CheckMode::Manual);
    #[cfg(not(windows))]
    let _ = app;
}

#[tauri::command]
fn copy_text(text: String) -> Result<(), String> {
    capture::copy_text(&text)
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
async fn probe_api_key(request: ProbeRequest) -> Result<(), ChatError> {
    chat::probe_api_key(request).await
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
    if let Some(win) = app.get_webview_window("panel") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
        let _ = win.emit("panel-show-settings", ());
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

struct TrayMenuItems {
    open: MenuItem<Wry>,
    empty: MenuItem<Wry>,
    updates: Option<MenuItem<Wry>>,
    settings: MenuItem<Wry>,
    quit: MenuItem<Wry>,
}

fn apply_tray_language(items: &TrayMenuItems, lang: &str) {
    let _ = items
        .open
        .set_text(l10n::t("menu.openPanel", lang, &[]));
    let _ = items
        .empty
        .set_text(l10n::t("menu.openEmptyPanel", lang, &[]));
    if let Some(updates) = &items.updates {
        let _ = updates.set_text(l10n::t("menu.checkForUpdates", lang, &[]));
    }
    let _ = items
        .settings
        .set_text(l10n::t("menu.settings", lang, &[]));
    let _ = items.quit.set_text(l10n::t("menu.quit", lang, &[]));
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    // Capture on Released so Ctrl/Shift from the hotkey are up
                    // before we synthesize Ctrl+C for the selection probe.
                    if event.state() == ShortcutState::Released {
                        open_panel(app, false);
                    }
                })
                .build(),
        )
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let handle = app.handle().clone();
            let prefs = store::load_prefs(&handle);
            if let Err(err) = register_hotkey(&handle, &prefs.hotkey) {
                eprintln!("failed to register hotkey {}: {err}", prefs.hotkey);
                let fallback = store::default_hotkey();
                let _ = register_hotkey(&handle, &fallback);
            }

            let lang = prefs.ui_language.as_str();
            let open = MenuItem::with_id(
                app,
                "open",
                l10n::t("menu.openPanel", lang, &[]),
                true,
                None::<&str>,
            )?;
            let empty = MenuItem::with_id(
                app,
                "empty",
                l10n::t("menu.openEmptyPanel", lang, &[]),
                true,
                None::<&str>,
            )?;
            let updates = if cfg!(windows) {
                Some(MenuItem::with_id(
                    app,
                    "updates",
                    l10n::t("menu.checkForUpdates", lang, &[]),
                    true,
                    None::<&str>,
                )?)
            } else {
                None
            };
            let settings = MenuItem::with_id(
                app,
                "settings",
                l10n::t("menu.settings", lang, &[]),
                true,
                None::<&str>,
            )?;
            let quit = MenuItem::with_id(
                app,
                "quit",
                l10n::t("menu.quit", lang, &[]),
                true,
                None::<&str>,
            )?;
            let menu = if let Some(updates_item) = updates.as_ref() {
                Menu::with_items(app, &[&open, &empty, updates_item, &settings, &quit])?
            } else {
                Menu::with_items(app, &[&open, &empty, &settings, &quit])?
            };

            let mut tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .tooltip("Rewrite Better")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => open_panel(app, false),
                    "empty" => open_panel(app, true),
                    "updates" => updater::spawn_check(app.clone(), updater::CheckMode::Manual),
                    "settings" => show_settings(app),
                    "quit" => app.exit(0),
                    _ => {}
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;
            app.manage(TrayMenuItems {
                open,
                empty,
                updates,
                settings,
                quit,
            });
            #[cfg(windows)]
            {
                let delayed = handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(3));
                    updater::spawn_check(delayed, updater::CheckMode::Launch);
                });
            }
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
            probe_api_key,
            get_autostart,
            set_autostart,
            set_hotkey,
            check_for_updates
        ])
        .run(tauri::generate_context!())
        .expect("error while running Rewrite Better");
}
