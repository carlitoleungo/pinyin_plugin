## Implementation complete — 008

**What I did:**
- Replaced the placeholder `<p>PinyinOverlay</p>` in the popup with a label + CSS toggle switch
- Added toggle-switch styles (pill shape, blue when on, animated thumb)
- Created `popup/popup.js` — reads `browser.storage.local` on open (defaults to `true`), writes on change

**Files changed:**
- `popup/popup.html` — replaced placeholder paragraph with `.row` div containing label and checkbox toggle; added `<script src="popup.js">`
- `popup/popup.css` — appended `.row`, `.switch`, `.slider` styles for the toggle switch UI
- `popup/popup.js` — new file; IIFE wrapping storage read/write logic as specified in ticket

**How to load and verify:**
1. Run `npm run dev` from the project root
2. Click the PinyinOverlay toolbar icon
3. Popup shows "PinyinOverlay" label with a toggle switch — should default to **on** (blue)
4. Toggle off → close popup → reopen → toggle is still **off**
5. With popup open, right-click → Inspect → console: `browser.storage.local.get('enabled')` returns `{ enabled: false }`
6. Navigate to a Chinese page (e.g. zhihu.com) — annotations still appear (content script untouched)

**How to verify via automated tests (if applicable):**
- No automated tests for this ticket. Verification is manual via Firefox popup DevTools.

**Scope notes:**
- Content script does not yet read `storage.local` — that is ticket 009.

**Known limitations:**
- `browser.storage.local` is a Firefox API; this popup will not work in Chrome without a polyfill (out of scope for MV2 Firefox-only target).
