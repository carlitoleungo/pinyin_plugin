## Implementation complete — 007

**What I did:**
- Added `browser_action` block to `manifest.json` pointing to `popup/popup.html` with title "PinyinOverlay"
- Added `"permissions": ["storage"]` to `manifest.json`
- Created `popup/popup.html` — minimal valid HTML5 skeleton with a `<link>` to `popup.css`
- Created `popup/popup.css` — stub stylesheet setting a minimum panel size and system font

**Files changed:**
- `manifest.json` — Added `browser_action` and `permissions` keys between `browser_specific_settings` and `content_scripts`
- `popup/popup.html` — New file; required by `default_popup`; Firefox errors on load if missing
- `popup/popup.css` — New file; linked from `popup.html`; prevents a completely bare/0×0 panel

**How to load and verify:**
1. Run `npx web-ext run` (or `npm run dev`) from the project root
2. A grey puzzle-piece toolbar button should appear with tooltip "PinyinOverlay"
3. Click the toolbar button — a small popup panel should open showing "PinyinOverlay"
4. Navigate to zhihu.com or baidu.com and confirm pinyin ruby annotations still appear above Chinese characters (no regression)

**How to verify via automated tests (if applicable):**
- Run: `npx web-ext lint`
- Expected: `errors 0 / notices 0 / warnings 0`

**Scope notes:**
- `package.json` has no `npm run lint` script; the acceptance criteria references it but it doesn't exist. The underlying command is `npx web-ext lint`. This should become a separate ticket or be added alongside ticket 008's work on `package.json`.

**Known limitations:**
- The popup panel is intentionally blank — no toggle UI or functionality. That is ticket 008's scope.
- No extension icon is provided; Firefox shows a grey puzzle piece. Icon work is backlogged per the ticket notes.
- The `DeprecationWarning` about `url.parse()` printed by `npx web-ext lint` is from the `web-ext` tool itself, not the extension — not actionable here.
