# Backlog

| Source | Item | Notes |
|--------|------|-------|
| 004-review | Hoist `CHUNK_SIZE` to IIFE scope in `content.js` | Currently declared inside `processChunk` body; re-declared on every recursive call. Move next to `CJK_RE` and `SKIP_TAGS`. |
| toggle-feature | Toolbar icon reflects enabled/disabled state (greyed icon or "OFF" badge) | Requires a background script in MV2 (`browserAction.setBadgeText` isn't reliable from popup JS alone across tab switches). Adding a background script is a meaningful architectural addition — design the message topology before starting. Estimated complexity: Medium. |
| toggle-feature | Per-site toggle (remember enabled/disabled per hostname) | Global toggle covers MVP. Per-site would use `browser.storage.local` keyed by hostname. Estimated complexity: Medium. |
