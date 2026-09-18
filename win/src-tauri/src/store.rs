use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use keyring::Entry;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SERVICE: &str = "com.rewritebetter.windows";
const PROVIDERS: [&str; 4] = ["gemini", "groq", "cerebras", "openai"];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtraInstructions {
    #[serde(default)]
    pub rewrite: String,
    #[serde(default)]
    pub format: String,
    #[serde(default)]
    pub reply: String,
}

impl Default for ExtraInstructions {
    fn default() -> Self {
        Self {
            rewrite: String::new(),
            format: String::new(),
            reply: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Prefs {
    #[serde(default = "default_language")]
    pub ui_language: String,
    #[serde(default = "default_hotkey")]
    pub hotkey: String,
    #[serde(default)]
    pub extra_instructions: ExtraInstructions,
    #[serde(default)]
    pub voice_samples: String,
    #[serde(default)]
    pub enabled_providers: HashMap<String, bool>,
}

impl Default for Prefs {
    fn default() -> Self {
        Self {
            ui_language: default_language(),
            hotkey: default_hotkey(),
            extra_instructions: ExtraInstructions::default(),
            voice_samples: String::new(),
            enabled_providers: HashMap::new(),
        }
    }
}

fn default_language() -> String {
    "en".into()
}

pub fn default_hotkey() -> String {
    if cfg!(target_os = "macos") {
        "Command+Shift+E".into()
    } else {
        "Control+Shift+E".into()
    }
}

fn prefs_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("prefs.json"))
}

pub fn load_prefs(app: &AppHandle) -> Prefs {
    let Ok(path) = prefs_path(app) else {
        return Prefs::default();
    };
    let Ok(raw) = fs::read_to_string(path) else {
        return Prefs::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

pub fn save_prefs(app: &AppHandle, prefs: &Prefs) -> Result<(), String> {
    let path = prefs_path(app)?;
    let raw = serde_json::to_string_pretty(prefs).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())
}

fn key_entry(provider: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, &format!("{provider}ApiKeys")).map_err(|e| e.to_string())
}

pub fn get_api_keys() -> HashMap<String, String> {
    let mut keys = HashMap::new();
    for provider in PROVIDERS {
        let value = key_entry(provider)
            .ok()
            .and_then(|entry| entry.get_password().ok())
            .unwrap_or_default();
        keys.insert(provider.to_string(), value);
    }
    keys
}

pub fn save_api_keys(keys: &HashMap<String, String>) -> Result<(), String> {
    for provider in PROVIDERS {
        let value = keys
            .get(provider)
            .map(|s| s.trim().to_string())
            .unwrap_or_default();
        let entry = key_entry(provider)?;
        if value.is_empty() {
            let _ = entry.delete_credential();
        } else {
            entry.set_password(&value).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
