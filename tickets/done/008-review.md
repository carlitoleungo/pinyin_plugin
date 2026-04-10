## Code Review — 008

**Files reviewed:**
- `popup/popup.html` — replaced placeholder `<p>` with `.row` div, label, and checkbox toggle switch; added `<script src="popup.js">`
- `popup/popup.css` — appended `.row`, `.switch`, `.slider` styles for the CSS toggle switch
- `popup/popup.js` — new file; IIFE wrapping `DOMContentLoaded` listener, storage read on open, storage write on change

---

### Scope: CLEAN

Changes match the ticket exactly. The content script is untouched (ticket 009 deferred correctly). No message passing added. No bonus features.

---

### Issues

**Must fix:** none

**Should fix:**
- `popup.js:7` — `browser.storage.local.get('enabled').then(...)` has no `.catch()`. If storage access fails, the rejection is silently swallowed and the toggle stays unchecked (not the intended `true` default). In practice the `storage` permission is declared so failures are unlikely, but unhandled promise rejections are still bad practice. Add `.catch(e => console.error('PinyinOverlay: storage read failed', e))` as a minimum.

**Nit:**
- `popup.html:10–11` — Two `<label>` elements target the same `<input>`: the first via `for="toggle"`, the second by wrapping it. This is the standard CSS toggle-switch pattern and is valid HTML/accessible. No action needed — just noting it for any future reviewer who might question it.

---

### Verdict: APPROVED

The implementation is correct, minimal, and follows existing project conventions (IIFE wrapper, no `innerHTML`, no remote code, no excess permissions). The storage read/write logic matches the ticket spec exactly. The only actionable item is the missing `.catch()`, which is worth fixing but not a blocker.
