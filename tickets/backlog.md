# Backlog

| Source | Item | Notes |
|--------|------|-------|
| 004-review | Hoist `CHUNK_SIZE` to IIFE scope in `content.js` | Currently declared inside `processChunk` body; re-declared on every recursive call. Move next to `CJK_RE` and `SKIP_TAGS`. |
| toggle-feature | Toolbar icon reflects enabled/disabled state (greyed icon or "OFF" badge) | Requires a background script in MV2 (`browserAction.setBadgeText` isn't reliable from popup JS alone across tab switches). Adding a background script is a meaningful architectural addition — design the message topology before starting. Estimated complexity: Medium. |
| toggle-feature | Per-site toggle (remember enabled/disabled per hostname) | Global toggle covers MVP. Per-site would use `browser.storage.local` keyed by hostname. Estimated complexity: Medium. |

## Flashcard review system
**Original request:** When the translation tooltip is shown, let the user save highlighted words into a flashcard deck, and provide a review surface to study them later.

**What was included:** Tickets 010–012 deliver the translation tooltip feature (dictionary bundle, Option-gated selection handler, tooltip UI) — the prerequisite for saving from a tooltip.

**What was deferred:**
- "Save to flashcards" button per row in the tooltip
- Persistent deck storage (`browser.storage.local`, keyed schema for word + pinyin + gloss + timestamp + review metadata)
- A review UI (likely a new extension page — `review.html` + `review.js` + `review.css`) launched from a new popup button or a browser action context menu
- Optional SRS (spaced repetition) scheduling; simplest v1 is flip-card random order

**Context for later:**
- Ticket 012 explicitly leaves right-side padding in each tooltip row and makes no other scope decisions that block adding a save button
- The toggle/storage pattern established in tickets 008/009 (`browser.storage.local.get/set` + `onMessage`) is the right blueprint for deck persistence
- Review UI needs a decision: standalone HTML page (`review.html` opened via `browser.runtime.openOptionsPage` or a new browser_action popup route) vs inline overlay on a Chinese page. Standalone page is cleaner and matches typical flashcard app UX — recommended default when scoped.
- Deck export/import (JSON download/upload) is probably a third milestone after save + review work.
- Scope estimate: 3–5 tickets. Save button + storage schema is 1. Review UI scaffolding is 1–2. SRS scheduling / export is 1–2 more.

**Estimated complexity:** Medium (for MVP save + review; Large if SRS and export are in scope)
