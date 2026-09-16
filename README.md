# Rewrite Better

A Chrome extension that rewrites, formats, translates, and drafts message/email replies using Gemini, Groq, Cerebras, or OpenAI. Works on any webpage via a context menu, keyboard shortcut, or toolbar popup.

Also available as a **native macOS menu bar app** (English / Tiếng Việt) — see [`mac/README.md`](mac/README.md) — and a **Windows tray app** — see [`win/README.md`](win/README.md).

Public download site: [`web/`](web/) (deploy to Vercel).

## Features

- **Shared panel** — Toolbar popup and inline popup use the same two-column UI as the macOS app
- **Writing assist** — Tab autocomplete plus Check writing suggestions
- **Inline popup** — Select text on any page, right-click, and choose **Rewrite with Rewrite Better**. **Replace** puts the result back into the field
- **Keyboard shortcut** — `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)
- **Toolbar popup** — Click the extension icon for the full panel
- **Rewrite** — Tone control + optional translation (visible chip selectors). Three variants plus a word-level diff of what changed
- **Voice profile** — Paste a few samples of how you write; Rewrite, Reply, and writing assist match that voice. Stays on the device
- **Format Document** — Markdown, HTML, bullets, tables, outlines, FAQ, and more
- **Reply / Compose** — Draft a chat message or email reply from a received message and/or your notes (intent, length, language)
- **Copy / Replace** — Copy the output, or replace the selection on the page
- **Multi-provider failover** — Gemini → Groq → Cerebras → OpenAI, with extra instructions per mode

Powered by Gemini, Groq, Cerebras, and OpenAI with quota failover. You need at least one API key.

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `chrome/` folder
5. Pin the extension from the toolbar for quick access

If you previously loaded the extension from the repo root, remove it and load `chrome/` instead.

## Setup

You need at least one API key before rewriting text (Gemini, Groq, Cerebras, or OpenAI).

1. Create a key at [Google AI Studio](https://aistudio.google.com/apikey), [Groq](https://console.groq.com/keys), [Cerebras](https://cloud.cerebras.ai), or [OpenAI](https://platform.openai.com/api-keys)
2. Open the extension options:
   - Click the extension icon → ⚙️ **Settings**, or
   - Right-click the extension icon → **Options**
3. Paste at least one API key and save

The toolbar popup shows whether a key is configured. Keys are tried in order: Gemini → Groq → Cerebras → OpenAI.

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
│   │   ├── options.js      # Tone, format, intent, languages, providers
│   │   ├── prompts.js      # Prompt builders
│   │   ├── llm-providers.js
│   │   ├── daily-skip.js
│   │   ├── api.js          # Multi-provider complete()
│   │   ├── writing-assist.js
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

Each deploy zips `chrome/` into `web/downloads/rewrite-better-chrome.zip`. Desktop installers are not built on Vercel. The site looks up the latest GitHub Release and uses whatever `.dmg` / Windows `.exe` assets are attached.

To publish Mac and Windows builds:

1. Push a tag (`git tag v1.0.0 && git push origin v1.0.0`), or
2. Run **Actions → Release desktop apps → Run workflow**

That workflow builds the Mac DMG and Windows NSIS installer and uploads them to the GitHub Release. After it finishes, the Download buttons on the site point at those files.

You can still copy local builds into `web/downloads/` (`RewriteBetter.dmg`, `RewriteBetter-setup.exe`) if you want the site to serve them directly; those files are gitignored.

Mac packaging: `./scripts/package-mac-dmg.sh`  
Windows packaging (on a Windows machine): `cd win && npm run build`

Preview the site locally:

```bash
./scripts/package-extension.sh
python3 -m http.server 4173 --directory web
```

## Privacy

See [PRIVACY.md](PRIVACY.md). Short version:

- **We never see or store your API key.** There is no Rewrite Better backend
- **Chrome:** keys stay in `chrome.storage.sync`. macOS: keys stay in Keychain. Windows: local app storage
- Text is sent directly from your device to the AI provider you configured
- The macOS app uses Accessibility only to read selected text and to Replace it back

## License

MIT
