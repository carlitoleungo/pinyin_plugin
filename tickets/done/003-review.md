## Code Review — 003

**Files reviewed:**
- `content_scripts/content.js` — added `SKIP_TAGS`, `annotateTextNode`, wired `forEach`; removed debug `console.log` from ticket 001

---

### Scope: CLEAN

The `console.log` removal is outside strict ticket scope, but the engineer flagged it proactively and it's clearly correct — leaving a debug log firing on every page load would be a regression. No objection.

---

### Issues

- **Must fix:** none

- **Should fix:** none

- **Nit:**

  1. **No comment on `CJK_RE`.** Per `ARCHITECTURE.md`, unicode range decisions should always be commented. `\u4E00-\u9FFF` covers the Basic CJK Unified Ideographs block only — it intentionally excludes Extension A (`\u3400–\u4DBF`), Compatibility Ideographs (`\uF900–\uFAFF`), and the Extension B+ supplementary planes. A one-line comment would make this decision legible to the next developer:
     ```js
     // Basic CJK Unified Ideographs only; extended blocks are out of scope (see ARCHITECTURE.md)
     const CJK_RE = /[\u4E00-\u9FFF]/;
     ```

  2. **Obsolete 4th argument to `createTreeWalker`.** The `expandEntityReferences` parameter was removed from the DOM Living Standard. The call on line 13 passes `null, false` for the last two args — this is harmless in all current browsers, but the `false` is dead weight. Prefer the 3-argument form:
     ```js
     document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
     ```

  3. **`SKIP_TAGS` is not applied during collection.** `findChineseTextNodes` collects all text nodes with CJK characters regardless of their parent tag; `annotateTextNode` then silently skips the ones inside `SCRIPT`, `STYLE`, `RUBY`, etc. The guard is correct and the behavior is safe — but the two functions share responsibility for a single invariant without it being visible at the call site. Not worth changing now, but worth noting if `findChineseTextNodes` is ever reused elsewhere.

---

### Verdict: APPROVED

Core logic is correct. `replaceChild` over `innerHTML`, `DocumentFragment` per node, double-annotation guard via `SKIP_TAGS`, null-parent guard, tonal marks confirmed by QA — all in order. The nits above are genuinely minor and do not block merge.
