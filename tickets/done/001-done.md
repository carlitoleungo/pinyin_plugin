## Implementation complete — 001

**What I did:**
- Replaced the empty IIFE placeholder with `findChineseTextNodes()` — walks all text nodes via `TreeWalker`, filters for nodes containing characters in U+4E00–U+9FFF, and returns them as an array
- Added `document.body` null guard as a hard early return
- Logged the result with the exact format specified in the acceptance criteria

**Files changed:**
- `content_scripts/content.js` — added `CJK_RE` regex constant, `findChineseTextNodes()` function, invocation, and console log

**How to load and verify:**
1. Run `npm run dev` from the project root
2. Navigate to baidu.com — open browser console (F12 → Console), confirm: `PinyinOverlay: found N Chinese text nodes` where N > 0
3. Navigate to github.com — confirm: `PinyinOverlay: found 0 Chinese text nodes`
4. Navigate to an article page on zhihu.com — confirm positive count

**How to verify via automated tests (if applicable):**
- No automated tests in this ticket. Manual Firefox verification is the spec.

**Scope notes:**
- Extended CJK ranges (U+3400–U+4DBF, U+20000+) intentionally excluded per ticket and ARCHITECTURE.md decisions log. If needed, create a new ticket.

**Known limitations:**
- `chineseNodes` is assigned at module level inside the IIFE. Ticket 003 will need the array accessible — when that ticket lands, the call site may need to be restructured (e.g. exported via a shared module pattern or kept in the IIFE with the annotation logic co-located).
