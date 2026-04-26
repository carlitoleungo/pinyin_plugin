# 010b — Expose lookup/segment API in content-script scope

## Summary
Wires the committed `lib/cedict.js` (from ticket 010a) into the content script by
updating `manifest.json` to load it before `content.js`, then implements two functions
in `content.js` scope: `lookup(word)` (single exact-match) and `segment(text)` (longest-match
segmentation). No UI in this ticket — only the data API that tickets 011 and 012 consume.

## Acceptance criteria
- [ ] `lookup('中国')` returns an entry whose pinyin contains `Zhong` and whose gloss contains `China`
- [ ] `lookup('中国人')` returns the 3-character entry (gloss contains "Chinese person" or similar), not the 2-character 中国 entry
- [ ] `segment('我是中国人')` returns exactly 3 entries in order: 我, 是, 中国人 (longest-match, not character-by-character)
- [ ] `lookup('hello')` and `lookup('')` both return `null`
- [ ] `segment('中Zhōng国guó')` returns entries only for 中 and 国 — non-CJK characters between them are ignored, not treated as word boundaries that break multi-char lookups
- [ ] Zero network requests are made by the extension on any Chinese page (verify via DevTools Network tab)

## Files likely affected
- `manifest.json` (add `lib/cedict.js` to the content_scripts `js` array, loaded **before** `content.js`)
- `content_scripts/content.js` (implement `lookup` and `segment` inside the IIFE)

## Dependencies
- Requires ticket 010a (`lib/cedict.js` must be committed before this ticket is started)
- Requires ticket 009 (toggle is already in place; see load-order notes below)

## Notes for the engineer

**Load order is critical.** In `manifest.json`, put `lib/cedict.js` **before** `content.js` in the
`js` array:
```json
"content_scripts": [{
  "js": ["lib/cedict.js", "content_scripts/content.js"],
  ...
}]
```
Scripts run in declared order. This lets `content.js` reference `CEDICT` synchronously at IIFE entry.

**IIFE scope — do not re-wrap cedict.js.** `lib/cedict.js` exposes `var CEDICT` at the isolated-world
global (file top, no IIFE). `content.js` is wrapped in its own IIFE. Both share the same isolated-world
global scope, so `CEDICT` is accessible inside `content.js`'s IIFE. If anyone adds an IIFE to
`lib/cedict.js`, `CEDICT` will be undefined inside `content.js`. Do not do this.

**Dictionary load cost is NOT gated by the 009 toggle.** `lib/cedict.js` is declared as a content
script and will be parsed by the browser on every matching tab at `document_idle`, regardless of whether
the user has the extension enabled. The 009 toggle only gates the annotation and lookup features from
running — it does not prevent the dictionary from being loaded. Parsing a 3–5 MB JSON.parse() call costs
roughly 100–500 ms per tab cold. This is an accepted trade-off; do not add a lazy-load mechanism in
this ticket.

**Longest-match algorithm for `segment`:**
```
i = 0
while i < text.length:
  skip non-CJK characters (increment i, continue)
  for len in [MAX_WORD_LEN..1]:   // cap MAX_WORD_LEN at 8
    candidate = text.slice(i, i+len)
    if lookup(candidate) is not null:
      push entry; i += len; break
  else:
    emit bare entry { word: char, pinyin: '', gloss: '' } for the unknown CJK char
    i += 1
```
The non-CJK skip (first line inside the loop) handles mixed-input strings like `'中Zhōng国guó'`
produced when the user selects text on an already-annotated page. Non-CJK runs must be silently
consumed, not treated as word boundaries.

**Reuse the existing `CJK_RE` constant** from `content.js` for CJK detection — do not redefine
the regex in `lookup` or `segment`.

## Notes for QA
- Load the extension and open any Chinese page. Open the content-script console via
  `about:debugging` → Extensions → PinyinOverlay → Inspect.
- Run in console: `lookup('中国')`, `lookup('中国人')`, `segment('我是中国人')`, `lookup('xyz')`,
  `lookup('')`. Verify all acceptance criteria results.
- Run `segment('中Zhōng国guó')` — confirm returns only entries for 中 and 国 (or similar),
  not a failed result or unexpected 2-char word.
- Open the Network tab on a Chinese page — confirm zero requests from the extension.
- **Regression check:** existing ruby/rt pinyin annotation must still render on zhihu.com,
  baidu.com, and sina.com.cn. Confirm the added `lib/cedict.js` content script entry does not
  delay or break annotation.
- Confirm the extension still respects the enabled/disabled toggle (009 behaviour): `lookup` and
  `segment` functions exist but the annotation and any future feature gated by the toggle must
  still be suppressible via popup.
