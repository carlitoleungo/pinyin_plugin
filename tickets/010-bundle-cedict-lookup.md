# 010 — Bundle CC-CEDICT and expose lookup/segment API *(SUPERSEDED)*

> **Superseded by tech lead review.** This ticket was too large for a single session and had hidden dependencies.
> Replaced by:
> - **[010a — Build CC-CEDICT prep script and commit lib/cedict.js](010a-build-cedict-script.md)**
> - **[010b — Expose lookup/segment API in content-script scope](010b-cedict-lookup-segment-api.md)**
>
> Original ticket preserved below for reference.

---

## Summary
Ships the CC-CEDICT Chinese–English dictionary inside the extension so the content
script can resolve Chinese text to English definitions **offline**. Produces two
functions in content-script scope: `lookup(word)` returns the single dictionary
entry for an exact word (or null), and `segment(text)` returns an ordered array
of entries covering a string via longest-match. No UI in this ticket — only the
data layer. The tooltip ticket (012) will consume these.

## Acceptance criteria
- [ ] CC-CEDICT data is bundled in the extension package; no network calls at runtime (verify via DevTools → Network tab after load)
- [ ] `lookup('中国')` returns an entry whose pinyin contains `Zhong` and whose gloss contains `China`
- [ ] `lookup('中国人')` returns the 3-character entry (gloss contains "Chinese person" or similar), **not** the 2-character 中国 entry
- [ ] `segment('我是中国人')` returns exactly 3 entries in order: 我, 是, 中国人 (longest-match, not 我/是/中/国/人)
- [ ] `lookup('hello')` or `lookup('')` returns `null`

## Files likely affected
- `lib/cedict.js` (new — dictionary data, either as a JS object or loaded via a separate content_scripts entry)
- `content_scripts/content.js` (expose `lookup` and `segment`)
- `manifest.json` (add `lib/cedict.js` to the content_scripts `js` array, loaded **before** `content.js`)

## Dependencies
- Requires ticket 009 (toggle behaviour — ensures our dictionary load does not slow a disabled extension)

## Notes for the engineer

**Source:** https://www.mdbg.net/chinese/dictionary?page=cc-cedict — CC BY-SA 4.0. Raw format is one entry per line: `Traditional Simplified [pin1 yin1] /gloss 1/gloss 2/`. ~120K entries, ~9MB text.

**Bundle size matters.** Shipping the raw .txt doubles our extension size. Write a one-shot prep script `scripts/build-cedict.js` (committed to repo, run manually, not at install time) that:
1. Parses CC-CEDICT
2. Drops traditional-only entries (we only annotate simplified)
3. Emits a JS file `lib/cedict.js` that assigns to a closure-safe identifier the content script can read

Aim for 3–5MB for the final bundled file. Document final size in the handoff.

**Load order:** In `manifest.json`, put `lib/cedict.js` **before** `content_scripts/content.js` in the `js` array. Scripts run in declared order, so `content.js` can reference the dictionary synchronously at IIFE entry — no async load cost.

**Longest-match algorithm for `segment`:**
```
i = 0
while i < text.length:
  for len in [MAX_WORD_LEN..1]:        // cap MAX_WORD_LEN at 8
    candidate = text.slice(i, i+len)
    if lookup(candidate) is not null:
      push entry; i += len; break
  else:
    // single char with no dict entry — emit a bare entry {word: char, pinyin: '', gloss: ''} or skip
    i += 1
```
Skip non-CJK characters entirely (they shouldn't appear in a well-formed selection but be defensive).

**Do not bring in a third-party segmenter.** pinyin-pro has one but it uses its own vocabulary; we want CC-CEDICT-backed segmentation so segments always map to definitions we can show.

**Reuse the existing `CJK_RE` regex from `content.js`** rather than redefining — keeps detection consistent with the annotation path.

## Notes for QA
- Load the extension and open any Chinese page. Open the content-script console via `about:debugging` → Extensions → PinyinOverlay → Inspect.
- Run in console: `lookup('中国')`, `lookup('中国人')`, `segment('我是中国人')`, `lookup('xyz')`. Verify acceptance criteria results.
- Check `ls -lh lib/cedict.js` — confirm the bundled dictionary is 3–5MB (not 9MB+ raw, not suspiciously <1MB).
- **Regression check:** existing pinyin annotation must still work on zhihu.com, baidu.com, sina.com.cn. Specifically confirm that load order of `lib/cedict.js` before `content.js` does not delay or break annotation.
- Open Network tab on a Chinese page — confirm zero requests made by the extension for dictionary data.
- Confirm the extension still respects the enabled/disabled toggle (dictionary loading should not bypass ticket 009's gate).

---

## Tech Lead Review

**Complexity: L — recommend splitting**

Proposed split:
- **010a** (M): `scripts/build-cedict.js` + committed `lib/cedict.js`. Output only; no integration.
- **010b** (M): `lookup` + `segment` in content-script scope; manifest wiring; CJK-filter on input.

**Hidden dependencies / risks:**

1. **Dict load cost is NOT gated by ticket 009.** `lib/cedict.js` runs on every matching tab at `document_idle` regardless of the enabled flag — that gate only wraps the annotation kickoff. Parsing a 3–5MB object literal costs ~100–500ms per tab cold. Acceptance says "does not slow a disabled extension" but that is not achievable with the current load-order design without a second mechanism. Either (a) accept this and reword the criterion, or (b) lazy-load via `fetch(browser.runtime.getURL('lib/cedict.json'))` only when first needed — loses the "synchronous at IIFE entry" property but wins on disabled-tab cost.

2. **IIFE scope conflict.** `content.js` is wrapped in an IIFE — a `var CEDICT = {...}` at the top of `lib/cedict.js` lives in a sibling IIFE-free scope. Both files share the isolated-world global, so a bare `var`/`let`/`const` at file top DOES expose to `content.js`. Engineer must NOT wrap `lib/cedict.js` in its own IIFE or `content.js` will see `undefined`. Call this out in the handoff.

3. **Licence/attribution missing.** CC BY-SA 4.0 requires attribution — add `LICENSE-CEDICT` or a top-of-file header in `lib/cedict.js` crediting MDBG + CC-EDICT. No acceptance criterion covers this; add one.

4. **Format emission choice.** A JS object literal parses faster than `JSON.parse()` on small data but slower on multi-MB. For 3–5MB, emit as `JSON.parse('{"中国":...}')` — V8 optimises this path. Worth a one-line note.

5. **Segment on mixed input.** The algorithm assumes input is all CJK. Ticket 011 will pass raw selection strings containing pinyin annotations from existing `<rt>` elements (see ticket 011/012 review). `segment` must tolerate non-CJK runs — the `i += 1` fallback does this but the engineer should test explicitly with `segment('中Zhōng国guó')` → expect `[中, 国]` or similar, not a wrong 2-gram.

---
