# 001 — Detect CJK text nodes

## Summary
Walk the page DOM using `TreeWalker` and count how many text nodes contain CJK Unified Ideograph characters (U+4E00–U+9FFF). Log the result to the console. This is the foundation for all annotation work — we need to prove we can reliably find the right nodes before we render anything on top of them.

## Acceptance criteria
- [ ] Opening baidu.com logs `"PinyinOverlay: found N Chinese text nodes"` (where N > 0) to the Firefox browser console
- [ ] Opening an English-only page (e.g. github.com) logs `"PinyinOverlay: found 0 Chinese text nodes"`
- [ ] Detection is implemented with a regex covering exactly U+4E00–U+9FFF (basic CJK block); extended Unicode ranges are out of scope for this ticket

## Files likely affected
- `content_scripts/content.js`

## Dependencies
- None

## Notes for the engineer
- Use `document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false)` to walk all text nodes.
- Filter with `/[\u4E00-\u9FFF]/` — do not use `\p{Script=Han}` (requires `u` flag and is broader than intended for this ticket).
- Collect matching nodes into an array (you will need this array in ticket 003). Keep the collection logic in a named function like `findChineseTextNodes()`.
- The IIFE wrapper is already in place — add the new code inside it.
- `document.body` may be `null` on non-HTML pages (e.g. XML feeds) — guard against it.

## Notes for QA
- Load the extension via `npm run dev`, then open baidu.com. Open the browser console (F12 → Console). Confirm the log message appears with a positive count.
- Repeat on github.com and confirm count is 0.
- Also test on zhihu.com (article page) — should show a positive count.
- Check that no other console errors or warnings are introduced by this change.

---

## Tech Lead Review

**Complexity: S** (< 15 min)

Feasible as written. No hidden dependencies.

- Make the `document.body` null guard a hard early return (`if (!document.body) return;`), not just a logged warning. The content script can be injected into XML feeds and PDF viewers where `body` is absent.
- Collect matching nodes into an array as instructed — ticket 003 will consume this array directly. Do not re-walk the DOM.
- The basic CJK block (U+4E00–U+9FFF) intentionally excludes extended ranges (rare surnames, classical characters). This is a documented known limitation — do not expand the range in this ticket.
