# Rewrite Better

A Chrome extension that rewrites, formats, translates, and drafts message/email replies using [Groq AI](https://groq.com) — **free to use** with a Groq account. Works on any webpage via a context menu, keyboard shortcut, or toolbar popup.

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
4. Click **Load unpacked** and select the project folder
5. Pin the extension from the toolbar for quick access

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
├── manifest.json
├── background.js
├── content.js          # Inline shell
├── popup.html/js       # Toolbar shell
├── options.html/js
├── styles.css
├── shared/
│   ├── options.js      # Tone, format, intent, languages…
│   ├── prompts.js      # Prompt builders
│   ├── api.js          # Groq API helpers
│   └── panel.js        # Shared panel UI
└── icon.png
```

## Privacy

- **We never see or store your API key.** There is no backend — your key stays in your browser only (Chrome sync storage via `chrome.storage.sync`)
- Text is sent directly from your browser to Groq's API; nothing passes through our servers
- The extension requests access to all URLs so the content script and inline popup work on any site

## License

MIT
