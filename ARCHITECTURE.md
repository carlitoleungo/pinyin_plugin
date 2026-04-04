# Architecture — PinyinOverlay

## Overview

PinyinOverlay is a Firefox WebExtension (Manifest V2) that injects a content script into
webpages, detects Chinese characters using Unicode range matching, and renders pinyin
annotations above characters using HTML `<ruby>`/`<rt>` elements. All DOM manipulation
happens in the content script running in the context of the host page. No background
script or popup exists in the current scaffold; they will be added only when specific
features require them.

## Tech stack

- **Language:** Vanilla JavaScript (ES2020+) — no framework, no TypeScript, no bundler. Extension development benefits from seeing the raw WebExtension API clearly; a build step would obscure it.
- **Manifest version:** MV2 — Firefox's MV3 support is incomplete as of 2024. Revisit when Firefox MV3 reaches feature parity.
- **Pinyin library:** Not yet added. Candidate: `pinyin-pro` (browser build). Will be added when the annotation feature is ticketed. If it requires ESM-only imports, add `esbuild` as a bundler at that point.
- **Dev tooling:** `web-ext` CLI — loads the extension into a temporary Firefox profile without requiring it to be signed.

## Extension architecture

- **`manifest.json`** — Declares the extension identity, content script injection rules, and permissions. The manifest is the ground truth for what the extension is allowed to do. Never add a permission before a feature requires it.
- **`content_scripts/content.js`** — Runs inside every matching webpage. Has access to the page DOM but runs in an isolated JavaScript context (cannot access page JS variables). This is where all pinyin detection and annotation logic lives.
- **Background script** — Not present. Add only if a feature requires cross-tab state, alarms, or message passing between content scripts.
- **Popup** — Not present. Add when settings or an enable/disable toggle is needed.

## Directory structure

```
pinyin_plugin/
├── content_scripts/
│   └── content.js        — Content script (the core of the extension)
├── .team/                — Dev team persona files (not extension code)
├── .web-ext-config.mjs   — web-ext run/lint configuration (ESM format required by web-ext 8.x)
├── ARCHITECTURE.md       — This document
├── manifest.json         — Extension manifest (MV2)
└── package.json          — devDependency: web-ext; npm run dev script
```

## Key patterns

1. **IIFE wrapper in content.js** — All content script code is wrapped in `(function() { 'use strict'; ... })()` to avoid leaking variables into the host page's global scope.
2. **TreeWalker for DOM traversal** — Never use `innerHTML` replacement to find or annotate text. Use `document.createTreeWalker` with `NodeFilter.SHOW_TEXT` to walk text nodes safely without breaking page event listeners.
3. **`<ruby>`/`<rt>` for annotations** — The semantically correct HTML5 element for phonetic annotations. Degrades gracefully in unsupported browsers (shows characters inline). Example: `<ruby>汉<rt>hàn</rt></ruby>`.
4. **No remote code** — Content scripts must never load remote scripts or use `eval()`. The pinyin library must be bundled locally.
5. **Batch processing** — Chinese pages can have thousands of characters. Never annotate the entire DOM synchronously at load. Use `requestIdleCallback` or chunked `setTimeout` processing to avoid jank.

## Data flow

*(Not yet implemented — will be documented when the annotation feature is ticketed.)*

Planned flow:
1. Content script fires at `document_idle`
2. `TreeWalker` iterates text nodes, identifies those containing CJK characters (Unicode range `U+4E00–U+9FFF` and extended ranges)
3. For each matching text node, call `pinyin-pro` to get pinyin for each character/word
4. Replace text node with a `<ruby>` element containing the original character(s) and `<rt>` pinyin
5. Batch this work across idle callbacks to avoid blocking the main thread

## Decisions log

| Date | Decision | Rationale | Alternatives considered |
|------|----------|-----------|------------------------|
| 2026-04-04 | Manifest V2 | Firefox MV3 support incomplete as of 2024; MV2 is stable and well-documented | MV3 (rejected: incomplete Firefox support) |
| 2026-04-04 | Vanilla JS, no bundler | Extension API is transparent without a build step; reduces onboarding friction | TypeScript + esbuild (deferred until first working version) |
| 2026-04-04 | `content_scripts/` directory | Mirrors the manifest field name — makes the file→manifest relationship visually obvious | `src/` (implies a build step), flat root |
| 2026-04-04 | No background script in scaffold | No feature yet requires it; adds complexity with no current benefit | Background script (deferred) |
| 2026-04-04 | No popup in scaffold | No settings/toggle feature yet; popup adds surface area with no current benefit | Popup (deferred) |
| 2026-04-04 | No `console.log` in content.js | A log on every page load is noise; IIFE + comment is cleaner | `"PinyinOverlay loaded"` log (rejected) |
| 2026-04-04 | `matches: *://*/*` | Avoids `file://` and `ftp://` scope included by `<all_urls>`; can be locked to specific domains later | `<all_urls>` (slightly broader scope) |
| 2026-04-04 | CJK detection limited to U+4E00–U+9FFF | Basic CJK block covers the vast majority of modern Chinese text; extended blocks (U+3400–U+4DBF, U+20000+) cover rare characters used in classical Chinese and uncommon surnames — out of scope for MVP | Full Han script via `\p{Script=Han}` (deferred: broader than intended, requires `u` flag) |
