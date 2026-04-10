## Implementation complete — 006

**What I did:**
- Added `browser_specific_settings.gecko` block to `manifest.json` with an extension ID, minimum Firefox version, and data-collection declaration
- Used `"required": ["none"]` instead of the ticket's `"required": []` — the addons-linter schema (v7.20.0) requires at least one item and `"none"` is the correct value for extensions that collect no user data; empty array caused `JSON_INVALID` error

**Files changed:**
- `manifest.json` — added `browser_specific_settings` block at top level

**How to load and verify:**
1. Run `npx web-ext lint` from project root — should report 0 errors, 0 warnings
2. Load extension in Firefox (`about:debugging` → Load Temporary Add-on → select `manifest.json`)
3. Navigate to a page with Chinese text and confirm pinyin ruby annotations appear above characters

**How to verify via automated tests (if applicable):**
- Run: `npx web-ext lint`
- Expected: `errors: 0, notices: 0, warnings: 0`

**Scope notes:**
- The `npm run lint` script doesn't exist in `package.json`; only `npm run dev` is defined. Could be added as a new ticket.

**Known limitations:**
- `id` is set to `pinyin-overlay@localhost` — fine for dev/personal use, should be changed to a real domain before AMO submission.
- The Node.js `url.parse()` deprecation warning from `web-ext` itself is unrelated to this extension and outside our control.
