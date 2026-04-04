# Backlog — PinyinOverlay

## Extended CJK Unicode ranges
**Original request:** Detect Chinese characters on any webpage
**What was included:** Basic CJK Unified Ideographs block U+4E00–U+9FFF (covers the vast majority of common characters)
**What was deferred:** CJK Extension A (U+3400–U+4DBF), Extension B (U+20000–U+2A6DF), CJK Compatibility Ideographs (U+F900–U+FAFF), and others
**Context for later:** Rare/archaic characters in extended blocks appear on classical literature sites and academic pages. Start by checking whether pinyin-pro handles them — if it does, extending the regex is a one-line change. If it doesn't, see the "Unknown character handling" item below.
**Estimated complexity:** Small

## Multi-character word segmentation
**Original request:** Display pinyin above Chinese characters
**What was included:** Single-character pinyin (one `<ruby>` per character)
**What was deferred:** Word-level segmentation (e.g. 北京 as one unit → "Běijīng" rather than "Běi" + "Jīng")
**Context for later:** pinyin-pro supports word segmentation via `{ mode: 'normal' }` and jieba-style tokenization. The tricky part is splitting a text node into word-granularity spans rather than character-granularity. Affects both the annotation logic in content.js and the ruby element structure (one `<ruby>` wrapping multiple characters with a single `<rt>`).
**Estimated complexity:** Medium

## Unknown/rare character handling
**Original request:** Display pinyin above Chinese characters
**What was included:** Characters that pinyin-pro knows about
**What was deferred:** Characters pinyin-pro cannot resolve (returns empty string or the raw character)
**Context for later:** When pinyin-pro returns an empty string, decide policy: skip the character (no ruby wrapper), show a placeholder, or show the character without annotation. This needs a product decision before implementation.
**Estimated complexity:** Small

## Enable/disable toggle via browser popup
**Original request:** (Not explicitly requested — anticipated need)
**What was included:** Extension always runs on every matching page
**What was deferred:** A popup UI with an on/off toggle, persisted via `browser.storage.local`
**Context for later:** Requires adding a `browser_action` to manifest.json, a popup HTML/JS file, and message passing between the popup and content script to trigger/stop annotation. This is its own milestone (manifest change + popup + storage + messaging = 4+ files).
**Estimated complexity:** Medium

## Site-specific allow/deny list
**Original request:** (Not explicitly requested — anticipated need)
**What was included:** Extension runs on `*://*/*` (all HTTP/HTTPS pages)
**What was deferred:** Per-site enable/disable, or a whitelist-only mode
**Context for later:** The manifest `matches` pattern can be locked down, or a runtime check can compare `window.location.hostname` against a stored list. Depends on the popup/storage work above.
**Estimated complexity:** Medium

## Performance tuning for very large pages
**Original request:** (Not explicitly requested — anticipated edge case)
**What was included:** Chunked processing via requestIdleCallback (ticket 004), CHUNK_SIZE=100
**What was deferred:** Profiling and tuning for pages with >5000 CJK characters; MutationObserver support for dynamically loaded content (infinite scroll, SPAs)
**Context for later:** MutationObserver is the right tool for SPA support — watch for DOM subtree additions and annotate newly inserted nodes. Be careful not to annotate nodes that are already wrapped in `<ruby>`.
**Estimated complexity:** Large

## Manifest V3 migration
**Original request:** (Not explicitly requested — future-proofing)
**What was included:** MV2 (stable Firefox support as of 2024)
**What was deferred:** MV3 migration
**Context for later:** Firefox MV3 support was incomplete at project start. Revisit when Firefox MV3 reaches feature parity with Chrome MV3. The content script approach is largely identical; the main change is background service workers replacing background pages.
**Estimated complexity:** Medium
