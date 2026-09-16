# Privacy

Rewrite Better has no account and no server of its own. There is no Rewrite Better backend that sees your text or API keys.

## What stays on your device

- **API keys** are stored only on your machine: Keychain in the macOS app, Chrome sync storage in the extension, and local app storage on Windows. The apps never upload them.
- **Settings** (language, hotkey, extra instructions) stay in local preferences.

## What is sent to AI providers

When you rewrite, format, or draft a reply, the selected text and the options you chose are sent **directly** to the AI provider whose key you configured:

- Google (Gemini)
- Groq
- Cerebras
- OpenAI

Nothing is sent to the Rewrite Better developer. Each provider’s own privacy policy applies to that request.

## Accessibility (macOS)

The macOS app asks for Accessibility permission only to:

1. Read the text you currently have selected in another app
2. Put the rewritten result back when you choose **Replace** / **Paste**

It does not record your screen or keystrokes.

## Windows capture

The Windows app captures selected text with a `Ctrl+C` probe, then restores the previous clipboard. It does not require a separate Accessibility toggle. Apps running elevated (as Administrator) may not be readable unless Rewrite Better is also elevated.

## What we do not collect

- No analytics
- No crash reporting
- No advertising
- No accounts

## Your responsibility

You are responsible for the API keys you paste and for the text you send to a provider. Do not paste secrets into the rewrite box if you would not send them to that provider.

## Questions

Open an issue on the project repository.
