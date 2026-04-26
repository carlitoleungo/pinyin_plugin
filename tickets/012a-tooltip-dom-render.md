# 012a — Tooltip DOM, CSS, and row rendering

## Summary
Creates the floating tooltip element that displays segmented lookup results to the user.
Replaces the `console.log` from ticket 011 with real UI: a lazily-created fixed-position
`<div>` that renders one row per segment (Chinese word + pinyin + gloss) and positions
itself below the text selection. No dismiss logic or viewport-edge flip in this ticket —
those are ticket 012b.

## Acceptance criteria
- [ ] After Option+selecting Chinese text, a tooltip `<div>` appears below the selection bounding rect (within ~10px)
- [ ] Each row in the tooltip shows: the Chinese word, its pinyin, and its English gloss
- [ ] The tooltip renders one row per entry returned by `segment()`, in order
- [ ] All CSS class names are prefixed with `.pinyin-tooltip` (e.g. `.pinyin-tooltip`, `.pinyin-tooltip-row`) — no unqualified rules
- [ ] The tooltip has its own background and sufficient contrast to be readable on both light and dark host-page backgrounds
- [ ] The tooltip element is created once (lazy, on first selection) and reused across subsequent selections — not re-created on every show
- [ ] The `console.log` from ticket 011 is replaced by the tooltip render call (no console output on normal use)

## Files likely affected
- `content_scripts/content.js`
- `content_scripts/content.css`

## Dependencies
- Requires ticket 011 (Option+selection handler with `segment()` pipeline must be complete)
- Confirm ticket 011's CJK-strip fix is in before starting — tooltip rows will be wrong without it

## Notes for the engineer

**Lazy creation pattern:**
```js
let tooltip = null;
function getTooltip() {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'pinyin-tooltip';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}
```
Reuse across selections by clearing innerHTML and repopulating. Toggle visibility with a
`.pinyin-tooltip--visible` class rather than adding/removing from the DOM.

**Positioning (below selection, no flip in this ticket):**
```js
const range = window.getSelection().getRangeAt(0);
const rect = range.getBoundingClientRect();
tooltip.style.left = Math.max(0, rect.left) + 'px';
tooltip.style.top  = (rect.bottom + 6) + 'px';
```
Use `position: fixed` in CSS so coordinates are viewport-relative. Clamping and flip-above
logic is 012b's responsibility.

**CSS isolation — every rule must be qualified:**
Every selector must start with `.pinyin-tooltip`. Host pages have aggressive global resets;
unqualified `div`, `p`, `span` rules will be stomped or will stomp the page. Use specificity
rather than `!important` wherever possible — reserve `!important` for `font-size`, `color`,
and `background` where host pages routinely override. Set `z-index: 2147483647` (max int) —
zhihu.com and other sites have sticky headers at z-index 10000+.

**Do not use Shadow DOM.** Content-script JS isolation is already in place; Shadow DOM
complicates selection geometry and event forwarding for no benefit here.

**Row structure (simple):**
```html
<div class="pinyin-tooltip-row">
  <span class="pinyin-tooltip-word">中国</span>
  <span class="pinyin-tooltip-pinyin">Zhōng guó</span>
  <span class="pinyin-tooltip-gloss">China</span>
</div>
```
Leave right-side padding in the row layout — a "save" button will be added per row in a
future ticket. No button in this ticket.

## Notes for QA
- Test single char (中), two-char word (中国), sentence (我爱北京天安门). Confirm row count matches segment count.
- Confirm all CSS class names are prefixed: open DevTools Elements panel, inspect the tooltip — no bare `div` / `span` style rules in the extension's stylesheet.
- **Contrast check:** test on a light-theme page and a dark-mode page (e.g. dark-mode GitHub gist with pasted Chinese). Tooltip must be legible in both.
- **z-index check:** on zhihu.com, scroll to a section with a visible sticky header, then select text. Tooltip must render above the sticky header, not behind it.
- **Annotated-page test:** select Chinese text on an already-annotated page. Confirm the tooltip shows the correct words (not pinyin text from `<rt>` elements appearing as their own rows). This relies on 011's CJK-strip fix — flag if rows are wrong.
- **Reuse check:** select text twice in succession. Confirm the tooltip updates (does not stack duplicate elements in the DOM).
- Dismiss is not implemented in this ticket — tooltip can remain visible after the test, that is expected.
- **Regression:** ruby/rt annotation still renders on Chinese pages.
- Test on baidu.com, zhihu.com, sina.com.cn.
