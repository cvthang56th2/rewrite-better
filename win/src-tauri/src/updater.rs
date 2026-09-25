use std::sync::atomic::{AtomicBool, Ordering};

use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_updater::UpdaterExt;

use crate::l10n;
use crate::store;

static CHECKING: AtomicBool = AtomicBool::new(false);

#[derive(Clone, Copy)]
pub enum CheckMode {
    #[allow(dead_code)]
    Launch,
    Manual,
}

pub fn normalize_version(version: &str) -> String {
    version.trim().trim_start_matches('v').trim().to_string()
}

pub fn should_prompt_on_launch(found_version: Option<&str>, dismissed_version: &str) -> bool {
    match found_version {
        Some(version) => {
            let version = normalize_version(version);
            let dismissed = normalize_version(dismissed_version);
            !version.is_empty() && version != dismissed
        }
        None => false,
    }
}

pub fn spawn_check(app: AppHandle, mode: CheckMode) {
    if CHECKING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return;
    }
    tauri::async_runtime::spawn(async move {
        if let Err(err) = run_check(app, mode).await {
            eprintln!("update check failed: {err}");
        }
        CHECKING.store(false, Ordering::SeqCst);
    });
}

async fn run_check(app: AppHandle, mode: CheckMode) -> Result<(), String> {
    let lang = store::load_prefs(&app).ui_language;
    let update = match app.updater().map_err(|err| err.to_string())?.check().await {
        Ok(update) => update,
        Err(err) => {
            if matches!(mode, CheckMode::Manual) {
                show_message(&app, &lang, &l10n::t("updater.failed", &lang, &[]));
            }
            return Err(err.to_string());
        }
    };

    let Some(update) = update else {
        if matches!(mode, CheckMode::Manual) {
            show_message(&app, &lang, &l10n::t("updater.upToDate", &lang, &[]));
        }
        return Ok(());
    };

    if matches!(mode, CheckMode::Launch)
        && !should_prompt_on_launch(Some(&update.version), &store::load_prefs(&app).dismissed_update_version)
    {
        return Ok(());
    }

    let mut body = l10n::t("updater.available", &lang, &[&update.version]);
    if let Some(notes) = update.body.as_deref().map(str::trim).filter(|notes| !notes.is_empty()) {
        body.push_str("\n\n");
        body.push_str(notes);
    }

    let install = app
        .dialog()
        .message(&body)
        .title(l10n::t("updater.title", &lang, &[]))
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::OkCancelCustom(
            l10n::t("updater.update", &lang, &[]),
            l10n::t("updater.later", &lang, &[]),
        ))
        .blocking_show();

    if !install {
        let mut prefs = store::load_prefs(&app);
        prefs.dismissed_update_version = normalize_version(&update.version);
        let _ = store::save_prefs(&app, &prefs);
        return Ok(());
    }

    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|err| err.to_string())?;
    app.restart();
}

fn show_message(app: &AppHandle, lang: &str, message: &str) {
    app.dialog()
        .message(message)
        .title(l10n::t("updater.title", lang, &[]))
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::Ok)
        .blocking_show();
}

#[cfg(test)]
mod tests {
    use super::{normalize_version, should_prompt_on_launch};

    #[test]
    fn launch_prompt_skips_when_no_update() {
        assert!(!should_prompt_on_launch(None, ""));
        assert!(!should_prompt_on_launch(None, "1.1.0"));
    }

    #[test]
    fn launch_prompt_asks_once_per_version() {
        assert!(should_prompt_on_launch(Some("1.2.0"), ""));
        assert!(should_prompt_on_launch(Some("v1.2.0"), "1.1.0"));
        assert!(!should_prompt_on_launch(Some("1.2.0"), "1.2.0"));
        assert!(!should_prompt_on_launch(Some("v1.2.0"), "1.2.0"));
        assert!(!should_prompt_on_launch(Some("1.2.0"), "v1.2.0"));
    }

    #[test]
    fn normalize_version_strips_v_prefix() {
        assert_eq!(normalize_version("v1.2.0"), "1.2.0");
        assert_eq!(normalize_version("1.2.0"), "1.2.0");
        assert_eq!(normalize_version("  v1.2.0 "), "1.2.0");
    }
}
