## Implementation complete — 009

**What I did:**
- Wrapped the annotation kickoff in a `browser.storage.local.get('enabled')` gate — content script exits early if disabled, so no DOM mutation happens on page load
- Added a `browser.runtime.onMessage` listener (always-active, outside the storage callback) that toggles `body.pinyin-hidden` class on `SET_ENABLED` messages
- Added `body.pinyin-hidden rt { display: none; }` to `content.css` for instant live hide/show
- Extended the popup toggle handler to send a `SET_ENABLED` message to the active tab via `browser.tabs.query` + `sendMessage`, with `.catch(() => {})` swallowing errors on about: pages

**Files changed:**
- `content_scripts/content.js` — replaced bare `findChineseTextNodes()` + `scheduleChunk()` calls with a storage-gated version; added message listener before it
- `content_scripts/content.css` — appended `body.pinyin-hidden rt { display: none; }`
- `popup/popup.js` — extended toggle `change` handler to dispatch `SET_ENABLED` message to active tab

**How to load and verify:**
1. Run `web-ext run` from the project root — confirm extension loads without errors
2. **Disabled on load:** Toggle off in popup. Open new tab → zhihu.com. DevTools → Elements → confirm zero `<ruby>` or `<rt>` in DOM.
3. **Live hide:** Toggle on, navigate to zhihu.com, wait for annotations. Open popup, toggle off → pinyin disappears instantly (no reload). Toggle back on → pinyin reappears.
4. **about: pages:** Open popup while on `about:newtab`, flip toggle — confirm no JS error in browser console.
5. **Persistence:** Toggle off on one tab, open a new Chinese page in another tab — confirm no annotations load.

**How to verify via automated tests (if applicable):**
- No automated tests exist for this ticket.

**Scope notes:**
- The ticket mentions optionally adding a "Reload page to annotate" label to the popup UI for the cold-disabled edge case. This is noted but not implemented — no acceptance criterion requires it. A follow-up ticket could address popup UX polish.

**Known limitations:**
- Re-enabling from a cold-disabled state (extension was off when the page loaded) removes `pinyin-hidden` but there are no `<rt>` elements to show — a manual page reload is required to annotate. This is correct behaviour per the ticket spec.
