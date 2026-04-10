## Implementation complete — 005

**What I did:**
- Created `content_scripts/content.css` with minimal `<ruby>`/`<rt>` styles
- Added `"css": ["content_scripts/content.css"]` to the `content_scripts` entry in `manifest.json`

**Files changed:**
- `content_scripts/content.css` — New file. Styles `ruby` with `ruby-align: center` and `rt` with `font-size: 0.6em`, `color: #e05`, `line-height: 1`, and `user-select: none`.
- `manifest.json` — Added `css` key to `content_scripts[0]` so the stylesheet is injected by the browser alongside the content script.

**How to load and verify:**
1. Run `npm run dev` from the project root (`web-ext run`)
2. Navigate to baidu.com
3. Pinyin above characters should be visibly smaller than the base characters and reddish-pink (`#e05`)
4. Open DevTools → inspect any `<rt>` element → computed styles should show `font-size: 0.6em` and `color: rgb(238, 0, 85)` (or similar) sourced from the extension stylesheet
5. Select and copy a block of annotated Chinese text → paste into a plain-text editor → confirm only the base characters appear (no pinyin), verifying `user-select: none` on `<rt>`
6. Check zhihu.com article pages — confirm pinyin does not overlap the text line above it

**Scope notes:**
- `line-height` was intentionally omitted from `ruby` per the ticket — add only if QA reports clipping on specific pages.

**Known limitations:**
- Host pages already using `<ruby>` for Japanese furigana (or other phonetic annotations) will have their existing `<rt>` elements restyled by this CSS. Low risk for MVP but worth a future ticket to scope the selector more narrowly if needed (e.g., `.pinyin-overlay ruby`).
