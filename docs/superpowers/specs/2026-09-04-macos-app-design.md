# Rewrite Better — macOS App Design

**Date:** 2026-09-04  
**Approach:** Native SwiftUI menu bar app (Approach 1)

## Goals

Port Chrome extension Rewrite Better to a Mac menu bar app with full feature parity (Rewrite / Format / Reply), Groq API, personal use + shareable DMG/zip.

## UX

- Menu bar icon + global hotkey `⌘⇧E`
- Input: selected text (Accessibility / Cmd+C probe) → fallback clipboard
- Output: copy result to clipboard (manual paste)
- Floating panel with modes matching extension panel
- Settings for Groq API key (Keychain)

## Architecture

```
mac/RewriteBetter/
  App (MenuBarExtra + floating NSPanel)
  HotkeyService          — Carbon global hotkey
  TextCaptureService     — selection → clipboard fallback
  SettingsStore          — Keychain API key
  GroqClient             — chat completions
  PromptBuilder          — port of shared/prompts.js
  Options                — port of shared/options.js
  PanelView / SettingsView
```

## Constraints

- macOS 13+ (MenuBarExtra)
- No App Sandbox in v1 (Accessibility + global hotkey simpler)
- Same model: `openai/gpt-oss-20b`
- Lives in `mac/` alongside the Chrome extension

## Out of scope (v1)

- Auto-replace selected text
- App Store / notarization pipeline
- Sync settings with Chrome extension
