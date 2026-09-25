# Rewrite Better

A writing panel on **Chrome**, **macOS 13+**, and **Windows 10+**. Rewrite, format, reply, and get writing assist without leaving the page or app. Bring your own Gemini, Groq, Cerebras, or OpenAI key — there is no Rewrite Better account or backend.

Public site: [rewrite-better-ai.vercel.app](https://rewrite-better-ai.vercel.app/) (source in [`web/`](web/)). Desktop installers come from [GitHub Releases](https://github.com/cvthang56th2/rewrite-better/releases/latest). Chrome is a zip until the extension is on the Chrome Web Store.

Platform details: [`chrome/README.md`](chrome/README.md) · [`mac/README.md`](mac/README.md) · [`win/README.md`](win/README.md)

## Features

- **Same panel everywhere** — Two-column UI on Chrome, Mac, and Windows. Interface language: English or Tiếng Việt
- **Rewrite** — Tone control plus optional translation. Three variants and a word-level diff of what changed
- **Format** — Markdown, HTML, bullets, numbered list, table, outline, summary, or FAQ
- **Reply / Compose** — Draft a chat message or email from a received message and/or your notes (intent, length, language)
- **Writing assist** — Tab autocomplete as you type, plus Check writing for grammar and wording
- **Voice profile** — Paste a few samples of how you write. Rewrite, Reply, and writing assist match that voice. Stays on the device
- **Extra instructions** — Optional per-mode notes in Settings, added on top of the built-in prompt
- **Replace** — Copy the output, or put it back into the field / app you came from
- **Multi-provider failover** — Gemini → Groq → Cerebras → OpenAI. Multiple keys per provider (comma or newline). Quota / auth failures rest that key until tomorrow

You need at least one API key. Requests go from your device to the provider you configured.

## Download

| Platform | How |
|----------|-----|
| **macOS** | [Latest Release](https://github.com/cvthang56th2/rewrite-better/releases/latest) `.dmg`. Menu bar app, no Dock icon. Grant Accessibility when asked. If Gatekeeper blocks the first open, right-click → **Open** |
| **Windows** | [Latest Release](https://github.com/cvthang56th2/rewrite-better/releases/latest) `.exe` (NSIS). Lives in the system tray. After this updater-enabled build is installed once, later versions prompt inside the app. SmartScreen may warn on unsigned builds: **More info → Run anyway** |
| **Chrome** | Download `rewrite-better-chrome.zip` from [the site](https://rewrite-better-ai.vercel.app/) (or zip `chrome/` yourself). Unzip → `chrome://extensions` → Developer mode → **Load unpacked** → select the folder that contains `manifest.json` |

Shortcut: `Cmd+Shift+E` (Mac) or `Ctrl+Shift+E` (Windows / Linux). Mac can change the hotkey in Settings.

## Setup

1. Create a key at [Google AI Studio](https://aistudio.google.com/apikey), [Groq](https://console.groq.com/keys), [Cerebras](https://cloud.cerebras.ai), or [OpenAI](https://platform.openai.com/api-keys)
2. Open **Settings** (toolbar icon → ⚙️, tray / menu bar → Settings, or Chrome **Options**)
3. Paste at least one key and save. Optionally **Test keys**

Keys are tried in order: Gemini → Groq → Cerebras → OpenAI.

## Usage

Select text, then open the panel with the shortcut (or Chrome context menu **Rewrite with Rewrite Better**). Close with `Esc`. Submit with `Ctrl+Enter` / `Cmd+Enter`. Replace with `Ctrl+Alt+Enter` / `⌥⌘↩` on the desktop apps.

Chrome: the inline popup appears near the cursor and can replace the selection in the field. Desktop: **Replace** pastes back into the app you came from.

## Languages

**UI:** English, Tiếng Việt.

**Rewrite / translate:** Auto-detect (From), English, Vietnamese, Chinese, Japanese, Korean, French, German, Spanish, Italian, Portuguese, Russian, Arabic, Hindi, Thai.

## Project structure

```
rewrite-better/
├── web/                      # Public download site (Vercel)
├── chrome/                   # Chrome extension (Load unpacked here)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js            # Inline shell
│   ├── popup.html / popup.js # Toolbar shell
│   ├── options.html / options.js
│   ├── styles.css
│   └── shared/
│       ├── i18n.js
│       ├── options.js        # Tone, format, intent, languages, providers
│       ├── prompts.js
│       ├── diff.js
│       ├── llm-providers.js
│       ├── daily-skip.js
│       ├── api.js
│       ├── writing-assist.js
│       └── panel.js
├── mac/                      # Native SwiftUI menu bar app
├── win/                      # Tauri 2 system-tray app
├── scripts/                  # Zip the extension; optional local Mac DMG copy
└── .github/workflows/        # Build Mac DMG + Windows installer, attach to Release
```

## Website (Vercel)

Live: [https://rewrite-better-ai.vercel.app/](https://rewrite-better-ai.vercel.app/)

The download landing lives in `web/`. From the repo root:

1. Import the GitHub repo in [Vercel](https://vercel.com)
2. Leave the Root Directory empty (the root `vercel.json` already points at `web/`)
3. Deploy

Each deploy zips `chrome/` into `web/downloads/rewrite-better-chrome.zip`. Desktop installers are **not** built on Vercel. The site looks up the latest GitHub Release and uses whatever `.dmg` / Windows `.exe` assets are attached.

To publish Mac and Windows builds:

1. Push a tag (`git tag v1.0.0 && git push origin v1.0.0`), or
2. Run **Actions → Release desktop apps → Run workflow**

That workflow builds the Mac DMG (`./mac/package.sh`) and the Windows NSIS installer, then uploads them to the GitHub Release. After it finishes, the Download buttons on the site point at those files.

You can still copy local builds into `web/downloads/` (`RewriteBetter.dmg`, `RewriteBetter-setup.exe`) if you want the site to serve them directly; those files are gitignored.

Mac packaging: `./mac/package.sh` (CI) or `./scripts/package-mac-dmg.sh` (also copies into `web/downloads/`)  
Windows packaging (on a Windows machine): `cd win && npm run build`

Preview the site locally:

```bash
./scripts/package-extension.sh
python3 -m http.server 4173 --directory web
```

## Develop

Chrome unit tests (Node):

```bash
node chrome/shared/llm-providers.test.js
node chrome/shared/prompts.test.js
node chrome/shared/diff.test.js
node chrome/shared/daily-skip.test.js
node chrome/shared/writing-assist.test.js
node chrome/shared/i18n.test.js
node chrome/shared/panel.test.js
```

Windows UI tests: `cd win && npm test`

macOS: open `mac/RewriteBetter/RewriteBetter.xcodeproj`, or `./mac/restart.sh` to rebuild and relaunch. See [`mac/README.md`](mac/README.md) and [`win/README.md`](win/README.md) for full build notes.

## Privacy

See [PRIVACY.md](PRIVACY.md). Short version:

- **We never see or store your API key.** There is no Rewrite Better backend
- **Chrome:** keys stay in `chrome.storage.sync`. **macOS:** Keychain. **Windows:** local app storage
- Text is sent directly from your device to the AI provider you configured
- Voice samples and extra instructions stay on the device; they are included in prompts you run
- The macOS app uses Accessibility only to read selected text and to Replace it back

## Feedback

Email [cvthang56th2@gmail.com](mailto:cvthang56th2@gmail.com), or open a [GitHub issue](https://github.com/cvthang56th2/rewrite-better/issues/new).

## License

MIT
