# 008 — Popup toggle UI with persistent on/off state

## Summary
Builds the toggle button in the popup and wires it to `browser.storage.local`. After this ticket the user can open the popup, flip the extension on or off, close it, and reopen it to find the preference preserved. The content script does not yet read this preference — that is ticket 009 — so the toggle reflects intent but does not yet change annotation behaviour. This separation keeps the storage layer independently testable before any content script changes are made.

## Acceptance criteria
- [ ] Opening the popup shows a toggle that defaults to **enabled** on first install and correctly reflects whatever was last saved on subsequent opens (toggle off → close → reopen → toggle is still off)
- [ ] After toggling off, `browser.storage.local.get('enabled')` returns `{ enabled: false }`; after toggling on it returns `{ enabled: true }` — verifiable in the popup's DevTools console

## Files likely affected
- `popup/popup.html`
- `popup/popup.css`
- `popup/popup.js` (new file)

## Dependencies
- Requires ticket 007 (manifest + popup shell must exist first)

## Notes for the engineer
`popup.js` logic:

```js
document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get('enabled').then(({ enabled = true }) => {
    toggle.checked = enabled;
  });

  toggle.addEventListener('change', () => {
    browser.storage.local.set({ enabled: toggle.checked });
  });
});
```

The toggle can be `<input type="checkbox">` styled as a switch, or a `<button>` with `aria-pressed` — either works. Keep the CSS minimal; no frameworks. The popup should be narrow (around 200px wide) with just a label and the toggle control.

Do not add message passing in this ticket. The popup JS and content script remain completely decoupled here.

## Notes for QA
- Open the popup. Confirm the toggle appears and is **on** by default.
- Toggle off. Close the popup. Reopen it. Confirm the toggle is still **off**.
- With the popup open, open its DevTools (right-click popup → Inspect) and run `browser.storage.local.get('enabled')` in the console. Confirm it returns the expected value.
- Navigate to a Chinese page (e.g. zhihu.com) and confirm annotations still appear — this ticket does not change content script behaviour.
