# Rewrite Better

A Chrome extension that rewrites, formats, translates, and drafts message/email replies using [Groq AI](https://groq.com) — **free to use** with a Groq account. Works on any webpage via a context menu, keyboard shortcut, or toolbar popup.

Also available as a **native macOS menu bar app** (English / Tiếng Việt) — see [`mac/README.md`](mac/README.md) — and a **Windows tray app** — see [`win/README.md`](win/README.md).

Public download site: [`web/`](web/) (deploy to Vercel).

## Features

- **Shared panel** — Toolbar popup and inline popup use the same UI and options
- **Inline popup** — Select text on any page, right-click, and choose **Rewrite with Rewrite Better**
- **Keyboard shortcut** — `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)
- **Toolbar popup** — Click the extension icon for the full panel
- **Rewrite** — Tone control + optional translation (visible chip selectors)
- **Format Document** — Markdown, HTML, bullets, tables, outlines, FAQ, and more
- **Reply / Compose** — Draft a chat message or email reply from a received message and/or your notes (intent, length, language)
- **Copy to clipboard** — One-click copy of output

Powered by Groq's `openai/gpt-oss-20b` model. Groq currently offers free API access — no paid plan required to get started.

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `chrome/` folder
5. Pin the extension from the toolbar for quick access

If you previously loaded the extension from the repo root, remove it and load `chrome/` instead.

## Setup

You need a Groq API key before rewriting text. Groq is free — sign up and create a key at no cost.

1. Sign up at [console.groq.com](https://console.groq.com) and create a free API key (starts with `gsk_`)
2. Open the extension options:
   - Click the extension icon → ⚙️ **Settings**, or
   - Right-click the extension icon → **Options**
3. Paste your API key and save

The toolbar popup shows whether your key is configured and valid.

## Usage

### On any webpage

| Action | How |
|--------|-----|
| Context menu | Select text → right-click → **Rewrite with Rewrite Better** |
| Keyboard | Select text (optional) → `Ctrl+Shift+E` / `Cmd+Shift+E` |
| Close popup | `Esc` or click outside |
| Submit in popup | `Ctrl+Enter` / `Cmd+Enter` in the text area |

The inline popup appears near your cursor and pre-fills the selected text.

### Modes

- **Rewrite** — Choose tone; optionally enable translation with From/To language chips
- **Format** — Convert to Markdown, HTML, bullet points, numbered list, table, outline, summary, or FAQ
- **Reply** — Choose Message or Email, intent, tone, length, and output language. Paste a received message to reply, and/or add notes to guide (or compose) the draft

## Supported languages

Auto-detect (rewrite From), English, Vietnamese, Chinese, Japanese, Korean, French, German, Spanish, Italian, Portuguese, Russian, Arabic, Hindi, Thai

## Project structure

```
rewrite-better/
├── web/                    # Public download site (Vercel)
├── chrome/                 # Chrome extension (Load unpacked here)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js          # Inline shell
│   ├── popup.html/js       # Toolbar shell
│   ├── options.html/js
│   ├── styles.css
│   ├── shared/
│   │   ├── options.js      # Tone, format, intent, languages…
│   │   ├── prompts.js      # Prompt builders
│   │   ├── api.js          # Groq API helpers
│   │   └── panel.js        # Shared panel UI
│   └── icon.png
├── mac/                    # Native macOS menu bar app
├── scripts/                # Zip extension / build Mac DMG
├── win/                    # Tauri Windows tray app
└── docs/
```

## Website (Vercel)

The download landing lives in `web/`. From the repo root:

1. Import the GitHub repo in [Vercel](https://vercel.com)
2. Leave the Root Directory empty (the root `vercel.json` already points at `web/`)
3. Deploy

Each deploy zips `chrome/` into `web/downloads/rewrite-better-chrome.zip`. Desktop installers are not built on Vercel. Either:

- Copy built binaries into `web/downloads/` (`RewriteBetter.dmg`, `RewriteBetter-setup.exe`) then deploy, or
- Attach release assets named `RewriteBetter-1.0.dmg` and `RewriteBetter-1.0.0-x64-setup.exe`. The site falls back to those GitHub Release URLs when local files are missing.

Mac packaging: `./scripts/package-mac-dmg.sh`  
Windows packaging (on a Windows machine): `cd win && npm run build`, then rename/copy the NSIS installer to `web/downloads/RewriteBetter-setup.exe` or upload it as the release asset above.

Preview the site locally:

```bash
./scripts/package-extension.sh
python3 -m http.server 4173 --directory web
```

## Privacy

See [PRIVACY.md](PRIVACY.md). Short version:

- **We never see or store your API key.** There is no Rewrite Better backend
- macOS: keys stay in Keychain. Chrome: keys stay in `chrome.storage.sync`
- Text is sent directly from your device to the AI provider you configured
- The macOS app uses Accessibility only to read selected text and to Replace it back

## License

MIT
