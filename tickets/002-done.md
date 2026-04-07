## Implementation complete — 002

**What I did:**
- Installed `pinyin-pro` as a runtime dependency and `esbuild` as a dev dependency
- Confirmed the dist entry point: `node_modules/pinyin-pro/dist/index.js`
- Added `vendor/` to `.gitignore` to exclude the generated bundle
- Added `"build"` script to `package.json` using esbuild IIFE mode with `--global-name=pinyinPro`
- Updated `"dev"` script to run `npm run build` first, then `web-ext run`
- Updated `manifest.json` to load `vendor/pinyin-pro.js` before `content_scripts/content.js`
- Ran `npm run build` — produced `vendor/pinyin-pro.js` at 514 KB in 24 ms

**Files changed:**
- `package.json` — added `build` and updated `dev` scripts; `pinyin-pro` and `esbuild` added by npm install
- `manifest.json` — `vendor/pinyin-pro.js` prepended to the `js` array in `content_scripts`
- `.gitignore` — added `vendor/` line

**How to load and verify:**
1. Run `npm run build` from the project root — confirm `vendor/pinyin-pro.js` is created (~514 KB)
2. Run `npm run dev` (which also builds) — extension loads in a temporary Firefox profile
3. Navigate to any page in that Firefox instance
4. Open the browser console and run: `pinyinPro.pinyin('汉')`
5. Expected output: `'hàn'` (tonal pinyin string)
6. Confirm no CSP errors appear in the console

**How to verify via automated tests (if applicable):**
- No automated tests for this ticket. Manual console verification is the acceptance check.

**Scope notes:**
- The `npm audit` output shows 3 moderate severity vulnerabilities in existing `web-ext` dependencies (pre-existing, not introduced by this ticket). Worth a separate cleanup ticket if desired.

**Known limitations:**
- The `pinyinPro` global is only verifiable at runtime in a browser — the Node.js `require()` check won't work because the bundle is an IIFE targeting `window`, not a CJS module. This is correct behavior for a content script vendor bundle.
- `npm run dev` uses shell `&&` chaining. On Windows this would need to be `npm run build & web-ext run` or a cross-env solution. Not a concern for this project's current scope.
