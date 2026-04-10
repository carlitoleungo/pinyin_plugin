# 002 — Bundle pinyin-pro into the extension

## Summary
Add `pinyin-pro` as a runtime dependency and `esbuild` as a dev dependency. Write a build script that bundles pinyin-pro into a single IIFE file at `vendor/pinyin-pro.js`. Declare that file in `manifest.json` so it loads before the content script. This makes pinyin-pro available as a global in `content.js` without requiring ESM imports, which content scripts do not support.

## Acceptance criteria
- [ ] `npm run build` completes without errors and produces `vendor/pinyin-pro.js`
- [ ] `manifest.json` content_scripts entry lists `vendor/pinyin-pro.js` **before** `content_scripts/content.js`
- [ ] After loading the extension via `npm run dev`, `console.log(pinyinPro.pinyin('汉'))` typed in the Firefox console on any page returns `'hàn'` (or the expected tonal string from pinyin-pro)

## Files likely affected
- `package.json`
- `manifest.json`
- `vendor/pinyin-pro.js` (generated — do not edit by hand)

## Dependencies
- None (can be done before or alongside 001, but 003 requires both)

## Notes for the engineer
- Install: `npm install pinyin-pro` and `npm install --save-dev esbuild`.
- Build script (add to `package.json` scripts): `esbuild node_modules/pinyin-pro/dist/index.js --bundle --global-name=pinyinPro --outfile=vendor/pinyin-pro.js --platform=browser`.
  - `--global-name=pinyinPro` exposes the library as `window.pinyinPro` in the content script context.
  - Double-check the actual entry point path after install — it may be `dist/index.esm.js` or similar. Run `ls node_modules/pinyin-pro/dist/` to confirm.
- Add `vendor/` to `.gitignore` (or add a note that it is a build artifact). Do not commit the generated file.
- Update `npm run dev` to run `build` first if convenient, but a separate `npm run build` is sufficient for this ticket.
- Check pinyin-pro's API: the main function is likely `pinyinPro.pinyin(str, options)`. Confirm in its README or type definitions before writing ticket 003.

## Notes for QA
- Run `npm run build` and verify `vendor/pinyin-pro.js` appears and is non-empty (should be several hundred KB).
- Load the extension with `npm run dev`. Open any page, open the console, and run `pinyinPro.pinyin('汉字')` — confirm it returns pinyin strings.
- Verify `manifest.json` lists `vendor/pinyin-pro.js` first in the `js` array.
- Confirm no CSP errors appear in the console (content scripts loading local files should be fine under MV2).

---

## Tech Lead Review

**Complexity: M** (15–30 min)

Feasible. The esbuild IIFE approach is correct for making a Node library available to a content script.

- **Entry point path (medium risk):** `node_modules/pinyin-pro/dist/index.js` may not exist. Run `ls node_modules/pinyin-pro/dist/` after install and confirm the actual filename before writing the build script. Common alternatives: `dist/index.esm.js`, `dist/index.umd.js`.
- **`vendor/` directory (low risk):** esbuild will fail if `vendor/` doesn't exist. Prepend `mkdir -p vendor &&` to the build script, or commit an empty `.gitkeep` in `vendor/`.
- **Add `vendor/` to `.gitignore` before running the build.** A several-hundred-KB generated file in the index is a painful thing to undo.
- **Chain the build into `npm run dev`:** Change `"dev"` to `"npm run build && web-ext run"`. Without this, a fresh checkout will silently fail — the extension loads but `pinyinPro` is undefined and nothing works.
- **Verify the global in the console** (the QA step above) before starting ticket 003 — confirm `pinyinPro.pinyin('汉')` returns `'hàn'`, not an object.
