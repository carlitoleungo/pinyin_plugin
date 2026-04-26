# 011 — Option-gated selection handler with dictionary lookup

## Summary
Wires up the user-facing trigger: when the user holds **Option (Alt)** and
selects Chinese text, the content script runs the selection through
`segment()` from ticket 010 and logs the structured result to the page
console. No tooltip yet — this ticket proves the trigger + lookup pipeline
works end-to-end before we build UI. Respects the existing enabled/disabled
toggle from ticket 009.

## Acceptance criteria
- [ ] Holding **Option** while selecting `中国` on a Chinese page logs a structured array like `[{word: '中国', pinyin: '...', gloss: '...'}]` to the page console
- [ ] Selecting `我是中国人` with Option held logs an array of **3** segmented entries (我, 是, 中国人) in order
- [ ] Selecting Chinese text **without** Option held produces **no** console output and **no** lookup call (verify by instrumenting `lookup` temporarily if needed)
- [ ] With the extension toggled **off** in the popup, Option+selection does nothing (no log, no lookup, even if the page reloaded while enabled)
- [ ] Selecting non-Chinese text with Option held produces no console output
- [ ] Option+selecting `中国` on an already-annotated page (where the DOM contains `<ruby>中<rt>Zhōng</rt></ruby><ruby>国<rt>guó</rt></ruby>`) logs the **2-char** `中国` entry — not two separate 中 and 国 entries

## Files likely affected
- `content_scripts/content.js`

## Dependencies
- Requires ticket 010 (`lookup` and `segment` must exist in content-script scope)

## Notes for the engineer

**Event choice:** Use `document.addEventListener('mouseup', handler)`. `selectionchange` does not carry modifier-key state and fires far too often. `mouseup` fires once at the end of the drag and has `e.altKey` set correctly on macOS (Option → Alt).

**Read the selection — strip pinyin contamination first.** On pages already annotated by the extension, `getSelection().toString()` returns a string like `"中Zhōng国guó"` because `<rt>` text is included in the selection. Passing that directly to `segment()` breaks longest-match on any multi-char word. Strip non-CJK characters before segmenting:
```js
const raw = window.getSelection().toString().trim();
const cjkOnly = raw.replace(/[^一-鿿]/g, '');
```
Bail early if `cjkOnly` is empty (handles Option+click with no drag, Option+selecting English text, etc.). Pass `cjkOnly` to `segment()`, not `raw`. Log the result directly — the log shape reflects what ticket 012 will render.

**Respect the enabled flag without re-reading storage on every mouseup.** The existing code in `content.js` reads `enabled` once at load. Promote that to a module-level `let enabled = <value>` inside the IIFE and have the existing `onMessage` listener update it on `SET_ENABLED`. The mouseup handler then just checks `if (!enabled) return;`. Cleanest pattern and avoids an async storage round-trip per selection. Keep the `body.classList` toggle and the `enabled` state update in the **same message-handler branch** — do not split them across two separate listeners, or they can fall out of sync.

**Register OUTSIDE the page-load storage gate.** The mouseup listener should be attached unconditionally at IIFE entry — then gated internally by the `enabled` flag. Otherwise a cold-disabled page that gets re-enabled via popup message wouldn't get the listener until reload, which is worse than the annotation case because the user has no visual cue that "you need to reload."

**Log shape:** The array shape from `segment()` is what we'll render in ticket 012. Log it directly — no restructuring. If `segment` emits bare entries for unknown characters (see 010 notes), those should still appear in the log so 012 can render them as "no definition".

**Do not add** a tooltip, DOM element, or CSS in this ticket. That is 012. Reviewers should reject scope creep.

## Notes for QA
- **Firefox on macOS**: Option = Alt. Confirm `e.altKey` fires on mouseup when Option is held during the drag.
- Test single character (中), two-character word (中国), three-character word (中国人), and a short sentence (我爱北京天安门).
- Test **without** Option — confirm zero console output (both in enabled and disabled extension states).
- Test with extension toggled **off** in popup, then select Chinese with Option held — confirm no output.
- Test on zhihu.com, baidu.com, and on a local HTML file with `<p lang="zh">` pasted Chinese to rule out site-specific event swallowing.
- **Annotated-page test (critical):** on a page where pinyin annotation has already run, use Option+select to select `中国` from an annotated paragraph. Confirm the console logs a **single** `中国` entry — not two separate 中 and 国 entries. This validates the CJK-strip fix.
- **Regression check:** existing ruby/rt annotation still works while the new handler is attached. Selection and pinyin hovering should not conflict.
- **Popup live toggle:** with a Chinese page open, toggle extension off via popup — confirm subsequent Option+selection produces no log without a page reload.

---

## Tech Lead Review

**Complexity: S**

Small glue ticket: one event listener, one pipe into `segment()`, one refactor to promote `enabled` to IIFE-scoped `let`. The notes are already precise enough.

**Hidden risks:**

1. **BLOCKER — selection text is polluted by existing `<rt>` annotations.** On a page already annotated by the existing pinyin feature, `<ruby>中<rt>Zhōng</rt></ruby><ruby>国<rt>guó</rt></ruby>` makes `getSelection().toString()` return `"中Zhōng国guó"` — not `"中国"`. If we feed that to `segment()` directly, the algorithm bails out on non-CJK chars between each CJK char and never finds multi-char words. Fix: strip non-CJK before segmenting, e.g. `const cjkOnly = raw.replace(/[^\u4E00-\u9FFF]/g, '')` then pass `cjkOnly` to `segment`. Add an acceptance criterion: "Option+selecting `中国` on an already-annotated page logs the 2-char `中国` entry, not two separate `中` and `国` entries."

2. **Firefox macOS Option+drag.** Firefox on macOS performs normal text selection with Option held (unlike Safari's rectangular selection). `e.altKey` is truthy. Verify on the actual OS before claiming done — this is the whole trigger.

3. **Ticket 009 refactor touches merged code.** Promoting `enabled` to a `let` and updating it in the `SET_ENABLED` listener is the right pattern but means ticket 009's body.classList toggle and the new `enabled` state must stay in sync. Keep both in the same message-handler branch; do not split across two listeners.

4. **`mouseup` fires for clicks too.** A plain Option+click with no drag produces an empty selection — the `.trim()` early bail handles this, but confirm no lookup is invoked (stated in AC but easy to regress).

---
