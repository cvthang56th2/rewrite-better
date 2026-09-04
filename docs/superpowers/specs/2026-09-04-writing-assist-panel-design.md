# Writing Assist (Panel) — Design

**Date:** 2026-09-04  
**Approach:** TextEditor + ghost overlay + Groq debounce (Approach 1)

## Scope (v1)

- **Where:** Rewrite Better macOS panel only (system-wide later)
- **Primary:** Cursor-like Tab autocomplete (ghost text)
- **Secondary:** Grammar / tone issues list with per-item Apply
- **Context:** Mid-sentence → finish sentence; after sentence end → 1–3 sentence continuation

## UX

1. User types in Input / Notes / or a dedicated “Write” area (v1: main input field when mode allows free writing — use main `inputText` and Reply `notes`)
2. After ~500ms pause, request continuation from Groq (cancel in-flight)
3. Show gray ghost suffix after caret; **Tab** accepts, **Esc** dismisses
4. Grammar: debounce ~1.5s or “Check writing” button → list of issues; Apply replaces span in text

## Architecture

- `WritingAssistService` — debounce, Groq prompts, parse JSON suggestions
- `GhostTextEditor` — SwiftUI wrapper (NSViewRepresentable NSTextView preferred for Tab + ghost draw; fallback TextEditor + overlay if needed)
- `WritingIssue` model — range, message, replacement, kind (grammar/tone/clarity)
- Wire into left column of `PanelView` for primary input

## API

- Same Groq model; short `max_tokens` for autocomplete (~60–120)
- Structured JSON for grammar issues

## Out of scope (v1)

- System-wide overlay in other apps
- Multiple alternate Tab candidates
- Inline underlines (list + Apply is enough for secondary)
