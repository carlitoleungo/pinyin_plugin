## Implementation complete — 003

**What I did:**
- Added `SKIP_TAGS` set (`SCRIPT`, `STYLE`, `TEXTAREA`, `NOSCRIPT`, `RT`, `RUBY`) to guard against annotating inside those elements and against double-annotation on re-run
- Implemented `annotateTextNode(node)`: builds a `DocumentFragment` by iterating each character — CJK chars become `<ruby>char<rt>pīnyīn</rt></ruby>`, non-CJK chars accumulate in a plain-text buffer flushed before each ruby element and at the end
- Calls `pinyinPro.pinyin(char, { toneType: 'symbol' })` — returns a plain string for single-character input (confirmed against pinyin-pro API: single-char input returns string directly)
- Replaces each collected text node via `parent.replaceChild(fragment, node)` — no `innerHTML` touched
- Removed the `console.log` from ticket 001 (it would fire on every page load; no longer needed now that annotation is wired up)
- Called `chineseNodes.forEach(annotateTextNode)` synchronously (batching is ticket 004)

**Files changed:**
- `content_scripts/content.js` — added `SKIP_TAGS`, `annotateTextNode` function, wired forEach call; removed debug log

**How to load and verify:**
1. Run `npm run dev` from the project root
2. Navigate to `https://www.baidu.com`
3. CJK characters should have pinyin visible above them (tonal marks: ā á ǎ à)
4. Open DevTools → Inspector, find a `<ruby>` element — confirm structure: `<ruby>汉<rt>hàn</rt></ruby>`
5. Navigate to `https://github.com` — confirm page looks unchanged (no `<ruby>` elements)
6. Navigate to `https://www.zhihu.com` and open an article — confirm only Chinese characters are annotated; Latin text/numbers/punctuation are plain text
7. Check the Firefox console on all three sites — no errors expected

**How to verify via automated tests (if applicable):**
- No automated tests exist yet for DOM annotation (would require a browser environment)

**Scope notes:**
- The `console.log` in ticket 001 was removed as part of wiring up the forEach — it fired on every page load and is no longer useful. This is a minor change outside strict ticket scope but is clearly correct; flagging it here.
- Page layout may look rough (ruby elements affect line height) — addressed in ticket 005

**Known limitations:**
- Synchronous annotation will block the main thread on pages with many Chinese characters — ticket 004 will batch this with `requestIdleCallback`
- Only basic CJK block (`U+4E00–U+9FFF`) is annotated; extended ranges and classical characters are out of scope per ARCHITECTURE.md
- Cannot test Firefox load in this session — engineer must run `npm run dev` manually to confirm no syntax errors and visual result
