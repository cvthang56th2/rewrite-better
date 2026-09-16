# Rewrite Better for Chrome

Chrome extension with the same Rewrite / Format / Reply panel as the macOS app: two-column layout, writing assist, extra instructions, voice profile, rewrite variants with a diff, and multi-provider failover (Gemini → Groq → Cerebras → OpenAI).

## Install

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this `chrome/` folder
4. Pin the extension from the toolbar for quick access

If the extension was previously loaded from the repo root, remove it and load this folder instead.

## Setup

1. Add at least one API key: [Gemini](https://aistudio.google.com/apikey), [Groq](https://console.groq.com/keys), [Cerebras](https://cloud.cerebras.ai), or [OpenAI](https://platform.openai.com/api-keys)
2. Open extension options (toolbar icon → ⚙️ Settings, or right-click the icon → Options)
3. Paste key(s) and save. Multiple keys per provider: separate with comma or newline

Quota / auth failures rest that key until tomorrow and continue with the next. A previous Groq-only key is migrated automatically.

Privacy: keys stay in Chrome storage; text is sent only to the provider you configured. See [PRIVACY.md](../PRIVACY.md).
