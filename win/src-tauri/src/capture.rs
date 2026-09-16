use std::time::Duration;

use arboard::Clipboard;
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};

pub fn copy_text(text: &str) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text.to_string()).map_err(|e| e.to_string())
}

/// Probe the current selection by synthesizing a copy shortcut, then restore
/// the previous clipboard. Returns empty string if nothing new was copied.
pub fn capture_selected_text() -> String {
    let mut clipboard = match Clipboard::new() {
        Ok(c) => c,
        Err(_) => return String::new(),
    };
    let previous = clipboard.get_text().ok();
    if send_copy().is_err() {
        return String::new();
    }

    let mut copied = None;
    for _ in 0..15 {
        std::thread::sleep(Duration::from_millis(20));
        if let Ok(text) = clipboard.get_text() {
            if previous.as_ref() != Some(&text) {
                copied = Some(text);
                break;
            }
        }
    }

    if let Some(prev) = previous {
        let _ = clipboard.set_text(prev);
    }

    copied.unwrap_or_default().trim().to_string()
}

fn send_copy() -> Result<(), String> {
    send_shortcut('c')
}

pub fn send_paste() -> Result<(), String> {
    send_shortcut('v')
}

fn send_shortcut(letter: char) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let modifier = if cfg!(target_os = "macos") {
        Key::Meta
    } else {
        Key::Control
    };
    enigo.key(modifier, Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode(letter), Click).map_err(|e| e.to_string())?;
    enigo.key(modifier, Release).map_err(|e| e.to_string())?;
    Ok(())
}
