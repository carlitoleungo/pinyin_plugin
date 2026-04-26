# 012 — Translation tooltip UI *(SUPERSEDED)*

> **Superseded by tech lead review.** This ticket was too large for a single session — positioning,
> dismiss logic, and viewport-edge behaviour are independent concerns that are easier to test separately.
> Replaced by:
> - **[012a — Tooltip DOM, CSS, and row rendering](012a-tooltip-dom-render.md)**
> - **[012b — Tooltip dismiss, viewport-edge flip, and row cap](012b-tooltip-dismiss-flip-cap.md)**
>
> Original ticket preserved below for reference.

---

## Summary
Renders the segmented lookup results from ticket 011 as a floating tooltip
positioned near the user's selection. One row per segmented entry, showing the
word, its pinyin, and its English gloss. Dismisses on click-outside, Escape,
or new selection. Replaces the console.log from ticket 011 with real UI.

## Acceptance criteria
- [ ] After Option+selecting Chinese text, a tooltip appears within ~10px of the selection's bounding rect
- [ ] Tooltip shows exactly one row per segment returned by `segment()`, each row containing: the Chinese word, its pinyin, and its gloss (English)
- [ ] Tooltip dismisses on: (a) click outside the tooltip, (b) Escape key, (c) starting a new text selection anywhere on the page
- [ ] When the selection is near the viewport bottom edge, the tooltip flips to render **above** the selection rather than overflowing below
- [ ] For selections longer than ~15 segments, the tooltip caps at a max height and scrolls vertically inside — it does not exceed viewport height
- [ ] Tooltip is readable on both light and dark host-page backgrounds (has its own background + sufficient contrast)

## Files likely affected
- `content_scripts/content.js`
- `content_scripts/content.css`

## Dependencies
- Requires ticket 011 (selection handler with segmented lookup output)

## Notes for the engineer

**Replace, don't duplicate.** The console.log added in 011 goes away — the new render call takes its place. Keep the enabled-flag gate and the Option-key gate exactly as 011 implemented them.

**Lazy creation:** Create the tooltip element once (first selection) and reuse it across selections. Don't add/remove from the DOM on every selection — toggle visibility via a class.

**Positioning:**
```js
const range = window.getSelection().getRangeAt(0);
const rect = range.getBoundingClientRect();
// default: position below selection
// if rect.bottom + tooltipHeight > innerHeight, flip above
// clamp left to [0, innerWidth - tooltipWidth]
```
All coordinates are viewport-relative, so use `position: fixed` in CSS.

**Class-scope every style:** Every DOM element we create must have a prefix class (`.pinyin-tooltip`, `.pinyin-tooltip-row`, etc.) and every CSS rule must be qualified by that prefix. Host pages have aggressive global resets — unqualified rules will get clobbered or clobber them. Use specificity rather than `!important` wherever possible; reserve `!important` for font-size, color, and background where host pages commonly override.

**z-index:** `2147483647` (max int). zhihu.com and others have sticky headers at 10000+.

**Do not use Shadow DOM.** Content scripts already have JS isolation; Shadow DOM complicates selection geometry and event handling for minimal benefit here.

**Dismiss wiring:**
- `document.addEventListener('mousedown', e => { if (!tooltip.contains(e.target)) hide(); })` — note this runs before `mouseup`, so the mouseup handler from 011 that shows a new tooltip will take over naturally for "new selection" dismiss
- `document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); })`

**Cap segments at 15** in the rendered list (show a "+N more" row if exceeded, or silently cap — your call, document in handoff). Tooltip for a highlighted 500-character paragraph must not become a wall of text.

**No flashcard button in this ticket.** That's a future ticket. Keep the tooltip layout simple enough that adding a "save" button per row later is trivial — leaving a bit of right-side padding is enough.

## Notes for QA
- Test selections: single char (中), word (中国), 3-char word (中国人), short sentence (我爱北京天安门), and a long paragraph (copy any from zhihu.com) — confirm row counts and the 15-cap behaviour.
- **Viewport edge tests:** select near the bottom edge — tooltip flips above. Select near the right edge — tooltip doesn't overflow right. Select near the top edge — tooltip renders below (default).
- **Dismiss tests:** (a) click elsewhere on the page → dismisses; (b) press Escape → dismisses; (c) start a new selection → replaces with new tooltip.
- **z-index test:** zhihu.com has a sticky header. Scroll such that the header is visible, then select Chinese text underneath it — confirm the tooltip renders above, not behind, the sticky header.
- **Contrast test:** load a light-theme page and a dark-theme page (e.g. a dark-mode GitHub gist with pasted Chinese). Tooltip must be legible in both.
- **Disabled-extension test:** toggle extension off in popup → Option+select → no tooltip appears.
- **Regression:** ruby/rt annotation still renders on Chinese pages; selecting annotated text (which contains ruby wrappers) still returns the correct underlying Chinese in `window.getSelection().toString()`.
- Test on baidu.com, zhihu.com, sina.com.cn, and a plain local HTML fixture.

---

## Tech Lead Review

**Complexity: L — recommend splitting**

Proposed split:
- **012a** (M): Tooltip DOM + CSS + render-rows-from-segments; show at selection rect; no flip, no dismiss. Replaces the 011 console.log.
- **012b** (M): Dismiss wiring (outside-click, Escape, new-selection), viewport-edge flip-above, 15-row cap + scroll.

**Hidden risks:**

1. **Flip-above requires post-render measurement.** Tooltip height is unknown until the DOM element has rows appended and is laid out. Render first with `visibility: hidden` or offscreen `left: -9999px`, measure `offsetHeight`, then set final position and reveal. Naïve "guess a height" will either over- or under-flip.

2. **`mousedown` dismiss can race with `mouseup` from 011.** Sequence on a new selection: `mousedown` (dismiss current tooltip) → drag → `mouseup` (011 shows new tooltip). This is correct — but if the engineer attaches the `mousedown` handler to the *tooltip* element instead of `document`, outside-clicks won't dismiss. Attach to `document` with `contains(e.target)` guard, as the ticket specifies. Flag in review.

3. **Annotated-text selection (same issue as 011).** If 011 landed with the raw-selection bug, tooltip rows will be wrong here too. Confirm 011's CJK-strip fix is in before starting 012 rather than discovering it during QA.

4. **Tooltip inside shadow-root hosts.** Some pages mount content inside their own shadow roots (rare on zhihu/baidu, common elsewhere). `position: fixed` + viewport-relative coords still work — no action needed, but don't be surprised if a host's container clip-paths the tooltip. `z-index: 2147483647` only helps against same-stacking-context siblings.

5. **Escape listener installed once.** Add the `keydown` listener at IIFE entry, not on show — otherwise repeated shows stack listeners. Guard the handler with "tooltip visible" check before hiding.

6. **QA note is wrong.** The ticket's QA says "selecting annotated text returns the correct underlying Chinese in `window.getSelection().toString()`." That is false for selections across `<ruby>` nodes — the string contains pinyin. Rewrite after 011's CJK-strip fix lands: "selecting annotated text produces a tooltip with rows for the Chinese words, pinyin text from `<rt>` is not surfaced as its own entry."

---
