# 010a — Build CC-CEDICT prep script and commit lib/cedict.js

## Summary
Writes and commits a one-shot Node.js script that downloads and parses the raw
CC-CEDICT dictionary, strips traditional-only entries, and emits a browser-ready
`lib/cedict.js` file that is also committed to the repo. No extension integration
in this ticket — only the data artefact. Ticket 010b consumes this output.

## Acceptance criteria
- [ ] `scripts/build-cedict.js` exists and runs to completion with `node scripts/build-cedict.js` (no errors)
- [ ] Running the script produces `lib/cedict.js` with a file size between 3 MB and 5 MB
- [ ] `lib/cedict.js` is committed to the repo (no `.gitignore` rule excludes it)
- [ ] `lib/cedict.js` contains a CC BY-SA 4.0 attribution header crediting MDBG and CC-CEDICT in its first 5 lines
- [ ] `lib/cedict.js` exposes the dictionary using the `JSON.parse('...')` pattern (not a raw JS object literal)

## Files likely affected
- `scripts/build-cedict.js` (new)
- `lib/cedict.js` (new, generated then committed)
- `LICENSE-CEDICT` (new — separate attribution file)

## Dependencies
- None — this ticket is self-contained data prep

## Notes for the engineer

**Source:** https://www.mdbg.net/chinese/dictionary?page=cc-cedict — CC BY-SA 4.0.
Raw format is one entry per line: `Traditional Simplified [pin1 yin1] /gloss 1/gloss 2/`. ~120K entries, ~9MB text.

**What the script must do:**
1. Parse CC-CEDICT line by line (skip `#` comment lines)
2. Drop entries where Traditional ≠ Simplified (traditional-only entries) — this is the main size reduction
3. Build a map of `{ [simplified]: { pinyin, gloss } }` (keep only first gloss for now)
4. Emit `lib/cedict.js` as: `var CEDICT = JSON.parse('{"中国":{"pinyin":"Zhōng guó","gloss":"China"},...}');`

**Why `JSON.parse()` over an object literal:** V8 has a fast path for `JSON.parse(string)` on
multi-MB inputs that is significantly faster than parsing an equivalent JS object literal at
parse time. Use this pattern.

**Do NOT wrap `lib/cedict.js` in an IIFE.** The file's `var CEDICT = ...` must live at the
isolated-world global scope so that `content.js` can reference `CEDICT` synchronously. An IIFE
wrapper would scope the variable away from `content.js` and break ticket 010b entirely.

**Attribution:** Create `LICENSE-CEDICT` in the repo root with the CC BY-SA 4.0 notice and a
link to https://www.mdbg.net/chinese/dictionary?page=cc-cedict. Also include a short header
comment in `lib/cedict.js` itself (within the first 5 lines).

**Target size:** 3–5 MB. Document the actual file size in the handoff note.

## Notes for QA
- Run `node scripts/build-cedict.js` from the repo root — should complete without errors and produce `lib/cedict.js`.
- Run `ls -lh lib/cedict.js` — confirm size is 3–5 MB (not 9 MB raw, not suspiciously under 1 MB).
- Open `lib/cedict.js` in an editor and confirm: (a) first lines contain attribution, (b) the file starts with `var CEDICT = JSON.parse(`, not with `var CEDICT = {`.
- Check `git status` — `lib/cedict.js` should appear as a tracked new file, not untracked or ignored.
- Confirm `LICENSE-CEDICT` exists in the repo root.
- **No extension loading required in this ticket** — the artefact is purely a data file.
