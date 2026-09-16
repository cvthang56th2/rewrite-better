# Rewrite Better for Windows

Tauri 2 system-tray app with the same Rewrite / Format / Reply features as the Chrome extension and macOS menu bar app.

## Requirements

- Windows 10+ (WebView2 is installed automatically if missing)
- A Groq / Gemini / Cerebras / OpenAI API key
- To build: Node.js 18+, Rust 1.77+

## Usage

1. Install the NSIS installer from a Windows build
2. The app lives in the system tray (no taskbar window while idle)
3. Open **Settings** and paste at least one API key
4. Select text in any app → press **Ctrl+Shift+E** (or use the tray menu)
5. Choose mode/options → run → the result is copied to the clipboard

Selected text is captured with a `Ctrl+C` probe, then the previous clipboard is restored. Elevated windows (apps run as Administrator) cannot be captured unless Rewrite Better is also elevated.

## Develop (macOS or Windows)

```bash
cd win
npm install
npm test
npm run icon          # generates src-tauri/icons from ui/icon.png
npm run dev           # runs the tray app locally
```

On macOS the default shortcut is **⌘⇧E** so you can try the UI; the Windows build uses **Ctrl+Shift+E**.

## Release for Windows friends

Build on a Windows machine (or CI):

```bash
cd win
npm install
npm run icon
npm run build
```

Installer: `src-tauri/target/release/bundle/nsis/Rewrite Better_1.0.0_x64-setup.exe`

SmartScreen may warn on unsigned builds — choose **More info → Run anyway**.
