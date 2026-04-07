## Code Review — 002

**Files reviewed:**
- `package.json` — added `build` script (esbuild IIFE), updated `dev` to chain build first; added `pinyin-pro` as runtime dep and `esbuild` as dev dep
- `manifest.json` — `vendor/pinyin-pro.js` prepended to `content_scripts[0].js` array
- `.gitignore` — `vendor/` added
- `content_scripts/content.js` — unchanged (smoke-test line added and removed per 002-fix.md; back to placeholder)

---

### Scope: CLEAN

All changes match the ticket and Tech Lead notes exactly. The `mkdir -p vendor &&` prefix, `dev` chaining, and `.gitignore` addition were all called for explicitly. Nothing extra was added.

---

### Issues

- **Must fix:** None.

- **Should fix:** None.

- **Nit:** `tickets/002-done.md` step 4 still says to run `pinyinPro.pinyin('汉')` in the browser console — the incorrect verification method that tripped QA in pass 1. The fix is documented in `002-fix.md` but the done doc was never updated. Not a code issue; just stale docs.

- **Nit:** The bundle is built without `--sourcemap`, which produces cosmetic `Source map error` noise in the Firefox console for the minified vendor file (noted in `002-fix.md`). Out of scope for this ticket, but worth a line in the build script comment or a follow-up if the console noise becomes distracting during ticket 003 development.

---

### Verdict: APPROVED

Build infrastructure is correct. Manifest change is minimal — no new permissions, load order is right. `.gitignore` is in place; generated file is untracked. QA pass 2 verified all three ACs. Ticket 003 is unblocked.
