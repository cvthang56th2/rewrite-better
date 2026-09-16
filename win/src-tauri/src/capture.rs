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
    let seq_before = clipboard_sequence_number();

    if send_copy().is_err() {
        return String::new();
    }

    let mut copied = None;
    // ~600ms — some apps update the clipboard asynchronously.
    for _ in 0..30 {
        std::thread::sleep(Duration::from_millis(20));
        let seq_changed = clipboard_sequence_number()
            .zip(seq_before)
            .is_some_and(|(now, before)| now != before);
        if let Ok(text) = clipboard.get_text() {
            if seq_changed || previous.as_ref() != Some(&text) {
                copied = Some(text);
                break;
            }
        } else if seq_changed {
            break;
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
    // Hotkeys like Ctrl+Shift+E leave Shift held on Pressed. Clear sticky
    // modifiers so the probe is a plain Ctrl+C / Ctrl+V.
    release_sticky_modifiers(&mut enigo)?;

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

fn release_sticky_modifiers(enigo: &mut Enigo) -> Result<(), String> {
    for key in [
        Key::Shift,
        Key::LShift,
        Key::RShift,
        Key::Alt,
        Key::Meta,
        Key::Control,
        Key::LControl,
        Key::RControl,
    ] {
        let _ = enigo.key(key, Release);
    }
    // Brief settle so the target app sees modifiers up before Ctrl+C.
    std::thread::sleep(Duration::from_millis(30));
    Ok(())
}

fn clipboard_sequence_number() -> Option<u32> {
    #[cfg(windows)]
    {
        #[link(name = "user32")]
        extern "system" {
            fn GetClipboardSequenceNumber() -> u32;
        }
        // SAFETY: GetClipboardSequenceNumber has no preconditions.
        Some(unsafe { GetClipboardSequenceNumber() })
    }
    #[cfg(not(windows))]
    {
        None
    }
}
