# 003 — Annotate CJK characters with `<ruby>`/`<rt>`

## Summary
For each text node found by `findChineseTextNodes()` (from ticket 001), split the text into CJK characters and non-CJK runs, then replace the text node in the DOM with a `DocumentFragment` containing `<ruby>char<rt>pīnyīn</rt></ruby>` elements for each CJK character and plain `Text` nodes for everything else. This is the first ticket that produces a visible result in the browser.

## Acceptance criteria
- [ ] On baidu.com, CJK characters in the page body are visibly annotated with pinyin above them using `<ruby>`/`<rt>` elements (verifiable by inspecting the DOM)
- [ ] Non-Chinese content (Latin text, numbers, punctuation) within the same text nodes is preserved as plain text and not wrapped in `<ruby>` elements
- [ ] No JavaScript errors appear in the Firefox console when the page loads

## Files likely affected
- `content_scripts/content.js`

## Dependencies
- Requires 001 (findChineseTextNodes function)
- Requires 002 (pinyinPro global available)

## Notes for the engineer
- Build a `DocumentFragment` per text node. For each character in the text:
  - If it matches `/[\u4E00-\u9FFF]/`, create `<ruby>char<rt>pinyin</rt></ruby>`
  - Otherwise, append to a running plain-text buffer (flush buffer as a `Text` node before each ruby element, and at the end)
- Call `pinyinPro.pinyin(char, { toneType: 'symbol' })` for tonal marks (ā á ǎ à). Check the pinyin-pro API — it may return the string directly or wrap it in an object.
- Use `node.parentNode.replaceChild(fragment, node)` to swap the text node for the fragment. **Do not use `innerHTML`** — it breaks page event listeners.
- Iterate the node list collected in ticket 001 in reverse if needed to avoid invalidating the TreeWalker mid-walk (but since you collected into an array first, order doesn't matter).
- Synchronous annotation for now — batching is ticket 004.
- Skip nodes whose `parentNode` is `null` (already detached) or whose parent tag is `SCRIPT`, `STYLE`, `TEXTAREA`, or `NOSCRIPT`.

## Notes for QA
- Load via `npm run dev`, open baidu.com. Visually confirm pinyin appears above characters on the page.
- Open DevTools → Inspector, find a `<ruby>` element, confirm its structure: `<ruby>汉<rt>hàn</rt></ruby>`.
- Open github.com and confirm the page looks unchanged (no `<ruby>` elements injected).
- Test on zhihu.com (longer article text) — confirm mixed Chinese/English sentences annotate only the Chinese characters.
- Check the console for errors on both sites.
- Note: page layout may look rough at this stage — that is expected and addressed in ticket 005.

---

## Tech Lead Review

**Complexity: M** (15–30 min) — most fiddly DOM work in the set.

Feasible. Two risks to address before starting:

- **pinyin-pro return type (medium risk):** `pinyinPro.pinyin(char, { toneType: 'symbol' })` returns a plain string for single-character input. Confirm against the pinyin-pro README before writing the annotation loop. Do not assume it returns an object.
- **Double-annotation guard (medium risk):** Add `RT` and `RUBY` to the skip-tag list. If the content script ever runs twice (dev reload, SPA navigation), the TreeWalker will find text nodes inside existing `<rt>` elements and annotate pinyin-of-pinyin. The expanded skip list: `SCRIPT`, `STYLE`, `TEXTAREA`, `NOSCRIPT`, `RT`, `RUBY`.
- Synchronous annotation is intentional for this ticket — do not add batching here. That is ticket 004's job.
