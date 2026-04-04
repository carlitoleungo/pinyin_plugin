# 005 — Basic pinyin CSS

## Summary
The raw `<ruby>`/`<rt>` output from ticket 003 relies entirely on browser defaults, which vary and often clip the `<rt>` text against the line above. This ticket adds a minimal stylesheet — declared in `manifest.json` — that gives the pinyin consistent sizing, color, and line spacing so annotations are legible without disrupting the host page's layout.

## Acceptance criteria
- [ ] `<rt>` text is visibly smaller than the base character (target: ~0.6em) on baidu.com and zhihu.com
- [ ] Lines containing `<ruby>` elements do not clip or overlap adjacent text lines — the `<rt>` text has room to breathe
- [ ] The stylesheet is declared in `manifest.json` under `content_scripts[].css`, not injected via JavaScript

## Files likely affected
- `content_scripts/content.css` (new file)
- `manifest.json`

## Dependencies
- Requires 003 (ruby elements must exist in the DOM before styling them)

## Notes for the engineer
- Minimal target CSS:
  ```css
  ruby {
    ruby-align: center;
  }
  rt {
    font-size: 0.6em;
    color: #e05;          /* visible on both light and dark pages */
    line-height: 1;
    user-select: none;    /* don't include pinyin when user copies text */
  }
  ```
- Add `line-height` to `ruby` only if needed — host pages set their own line-height and a global override will cause layout shifts. Test before adding it.
- Declare the CSS in `manifest.json`:
  ```json
  "content_scripts": [{
    "matches": ["*://*/*"],
    "css": ["content_scripts/content.css"],
    "js": ["vendor/pinyin-pro.js", "content_scripts/content.js"],
    "run_at": "document_idle"
  }]
  ```
- Keep the stylesheet small. Do not add font-family overrides or resets — the goal is to style `<ruby>`/`<rt>` only.

## Notes for QA
- Load via `npm run dev`, open baidu.com. Confirm pinyin text above characters is noticeably smaller and colored (reddish-pink at the suggested value).
- Inspect a `<ruby>` element in DevTools → check computed styles on `<rt>` to confirm `font-size` and `color` are applied from the extension stylesheet.
- Select and copy a paragraph of annotated text — confirm the pasted result contains only the base characters, not the pinyin (due to `user-select: none` on `<rt>`).
- Check zhihu.com article pages — confirm pinyin does not overlap the text line above it.
- Test on a dark-background Chinese site if available (e.g. certain sections of sspai.com) — confirm the pinyin color is still visible.

---

## Tech Lead Review

**Complexity: S** (< 15 min) — smallest ticket in the set.

Feasible. One known limitation to document:

- **Host-page `<ruby>` collision (low risk):** Sites already using `<ruby>` for Japanese furigana will have their existing annotations restyled by this CSS. Not a blocker for MVP — note it as a known limitation.
- Do not add `line-height` to `ruby` unless QA specifically reports clipping. Test first; add only if needed.
- No build step required — the CSS file is declared directly in `manifest.json`.
