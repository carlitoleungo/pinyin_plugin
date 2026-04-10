# 009 — Wire toggle to annotation behaviour (page-load gate + live hide/show)

## Summary
Connects the stored toggle preference to actual extension behaviour in two ways. First, the content script reads storage on every page load and exits immediately if the extension is disabled — no TreeWalker scan, no pinyin-pro calls, no DOM mutation. This handles the non-Chinese browsing use case. Second, when the user flips the toggle while already on a page, the popup sends a message to the active tab and the content script hides or shows existing `<rt>` elements instantly via a CSS class — no page reload needed. This handles the "test yourself" use case.

## Acceptance criteria
- [ ] With the extension toggled **off**: navigate to a Chinese page and confirm via DevTools Elements panel that no `<ruby>` or `<rt>` elements exist anywhere in the DOM
- [ ] With the extension toggled **on** on an annotated Chinese page: flip the toggle to off in the popup — all pinyin disappears immediately without a page reload. Flip back to on — pinyin reappears. No reload required for either direction.

## Files likely affected
- `content_scripts/content.js`
- `content_scripts/content.css`
- `popup/popup.js`

## Dependencies
- Requires ticket 008 (storage layer and popup toggle must exist)

## Notes for the engineer

**Page-load gate — `content.js`:**

Wrap the two lines at the bottom of the IIFE that kick off annotation in a storage read:

```js
browser.storage.local.get('enabled').then(({ enabled = true }) => {
  if (!enabled) return;
  const chineseNodes = findChineseTextNodes();
  scheduleChunk(chineseNodes, 0);
});
```

**Live hide/show — `content.css`:**

Add one rule:
```css
body.pinyin-hidden rt { display: none; }
```

**Live hide/show — `content.js`:**

Register a message listener at the top level of the IIFE (outside the storage callback, so it is always active regardless of enabled state):

```js
browser.runtime.onMessage.addListener(({ type, enabled }) => {
  if (type === 'SET_ENABLED') {
    document.body.classList.toggle('pinyin-hidden', !enabled);
  }
});
```

**Message dispatch — `popup.js`:**

On toggle change, in addition to writing storage, send a message to the active tab:

```js
browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  browser.tabs.sendMessage(tab.id, { type: 'SET_ENABLED', enabled: toggle.checked });
}).catch(() => {}); // silently ignore if no content script on the active tab (e.g. about: pages)
```

`browser.tabs.query` for the active tab without needing the URL field works under the `activeTab` permission (granted automatically when the user clicks the browser action) — no additional manifest change needed.

**Edge case to be aware of:** If the extension was disabled before the user loaded a page, re-enabling from the popup will remove the `pinyin-hidden` class but there are no `<rt>` elements to show (the page-load gate returned early). A page reload is required to annotate a previously-skipped page. This is correct behaviour — document it in the UI (e.g. popup label: "Reload page to annotate").

## Notes for QA
- **Disabled on load:** Toggle off in the popup. Open a new tab and navigate to baidu.com or zhihu.com. Open DevTools → Elements. Confirm zero `<ruby>` or `<rt>` elements in the DOM.
- **Live hide:** With the extension enabled, navigate to zhihu.com and wait for annotations to render. Open the popup and toggle off. Confirm pinyin disappears immediately (no reload). Toggle back on — confirm pinyin reappears.
- **about: pages:** With the popup open on `about:newtab`, flip the toggle. Confirm no JS error is thrown (the `catch` on `sendMessage` should swallow the expected "no receiving end" error).
- **Persistence across tabs:** Toggle off on one tab, open a new Chinese page in another tab — confirm it loads without annotations.
- **Re-enable from cold-disabled:** Toggle off, navigate to a Chinese page (no annotations load), then toggle on. Confirm a note or label indicates a reload is needed. After reload, confirm annotations appear.
