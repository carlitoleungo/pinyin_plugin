# 012b — Tooltip dismiss, viewport-edge flip, and row cap

## Summary
Adds the interactive and defensive behaviours to the tooltip from ticket 012a: dismisses on
click-outside, Escape, or new selection; flips above the selection when near the viewport
bottom edge (using post-render measurement); and caps displayed rows at 15 with vertical
scrolling for longer selections.

## Acceptance criteria
- [ ] Tooltip dismisses when the user clicks anywhere outside the tooltip element
- [ ] Tooltip dismisses when the user presses **Escape**
- [ ] Tooltip is replaced with a fresh one when the user starts a new text selection (not stacked on top of the old one)
- [ ] When the selection bounding rect bottom is within the tooltip's rendered height of the viewport bottom edge, the tooltip renders **above** the selection instead of below
- [ ] For selections that produce more than 15 rows, the tooltip caps at a max-height and scrolls vertically inside — it does not grow to exceed viewport height
- [ ] The Escape key listener is registered **once** at IIFE entry (not on each show call) — confirm no duplicate listeners after multiple selections

## Files likely affected
- `content_scripts/content.js`
- `content_scripts/content.css`

## Dependencies
- Requires ticket 012a (tooltip element, render function, and base positioning must be complete)

## Notes for the engineer

**Flip-above requires post-render measurement.** The tooltip's height is unknown until it has
rows appended and is laid out by the browser. Do NOT guess a height. Pattern:
```js
tooltip.style.visibility = 'hidden';
tooltip.style.top = '0px';  // offscreen-enough to avoid flash, but still laid out
renderRows(segments);       // populate rows so the browser can measure
tooltip.style.visibility = '';

const ttHeight = tooltip.offsetHeight;
const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
if (rect.bottom + ttHeight + 6 > window.innerHeight) {
  tooltip.style.top = (rect.top - ttHeight - 6) + 'px';  // flip above
} else {
  tooltip.style.top = (rect.bottom + 6) + 'px';          // default below
}
tooltip.style.left = Math.max(0, Math.min(rect.left, window.innerWidth - tooltip.offsetWidth)) + 'px';
```
This also adds left-edge clamping (keep tooltip in viewport on right-side selections).

**Dismiss — attach to `document`, not to the tooltip element:**
```js
document.addEventListener('mousedown', e => {
  if (tooltip && !tooltip.contains(e.target)) hide();
});
```
The `mousedown` fires before `mouseup`. The sequence for a new selection is:
`mousedown` → (dismiss current) → drag → `mouseup` → (011 handler shows new tooltip).
This is correct behaviour. If attached to the tooltip element instead of document,
outside clicks won't dismiss — attach to document with the `contains` guard.

**Escape listener — register once at IIFE entry:**
```js
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && tooltipVisible()) hide();
});
```
Do NOT register this inside the show function — repeated shows would stack listeners.
The `tooltipVisible()` guard (check a `.pinyin-tooltip--visible` class or similar) prevents
the listener from triggering when the tooltip is already hidden.

**Row cap — 15 rows max-height + scroll:**
In CSS:
```css
.pinyin-tooltip { max-height: 320px; overflow-y: auto; }
```
Optionally add a "+N more" row when truncating (document the choice in the handoff). The
point is that a 500-character paragraph selection must not produce a tooltip taller than the
viewport.

**`selectionchange` for "new selection" dismiss:** The `mouseup` handler in ticket 011 already
replaces the tooltip on a new selection (clear → repopulate). The `mousedown` dismiss handles
the "clicked away without selecting new text" case. Together, these cover all dismiss paths —
no additional `selectionchange` listener is needed.

## Notes for QA
- **Dismiss tests:**
  - (a) Show tooltip → click elsewhere on page → tooltip disappears
  - (b) Show tooltip → press Escape → tooltip disappears
  - (c) Show tooltip → start a new text selection → tooltip is replaced by the new result
- **Viewport edge — flip above:** select text near the very bottom of the page. Tooltip must
  appear above the selection, not overflow below the viewport.
- **Viewport edge — right side:** select text near the right edge of the viewport. Tooltip
  must not overflow the right side of the browser window.
- **Row cap:** copy a long Chinese paragraph (~20+ words), Option+select it. Confirm the
  tooltip does not grow taller than the viewport; confirm it is scrollable inside.
- **Escape listener count:** open the content-script console, make 5 selections in a row,
  then check if pressing Escape fires the handler multiple times (it should not). If you can
  instrument `hide()` to log, confirm it fires exactly once per Escape press.
- **Disabled-extension test:** toggle extension off → Option+select → confirm no tooltip
  appears and no dismiss listeners fire on click/Escape.
- **Regression:** ruby/rt annotation still renders; 012a tooltip render still works; 011 QA
  cases still pass.
- Test on baidu.com, zhihu.com, sina.com.cn, and a local HTML fixture.
