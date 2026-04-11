## Code Review — 009

**Files reviewed:**
- `content_scripts/content.js` — added `onMessage` listener (always-active) + storage-gated annotation kickoff
- `content_scripts/content.css` — appended `body.pinyin-hidden rt { display: none; }`
- `popup/popup.js` — extended toggle `change` handler to dispatch `SET_ENABLED` to active tab

### Scope: CLEAN

Matches the ticket exactly. The popup "Reload page to annotate" label is noted in the ticket as optional and was explicitly deferred by the engineer — no acceptance criterion requires it.

### Issues

- **Must fix:** None

- **Should fix:** None

- **Nit 1 — `popup.js:13`:** `then(([tab]) => { browser.tabs.sendMessage(tab.id, ...) })` — if `tabs.query` somehow resolves with an empty array, `tab` is `undefined` and `tab.id` throws a TypeError that gets silently eaten by the `.catch`. In the real popup context this can't happen (a popup always opens in a window with an active tab), but the bug is a TypeError being swallowed rather than an intentional no-op. A one-line guard would make the intent explicit:
  ```js
  .then(([tab]) => {
    if (!tab) return;
    browser.tabs.sendMessage(tab.id, { type: 'SET_ENABLED', enabled: toggle.checked });
  })
  ```

- **Nit 2 — `content.js:80`:** The `onMessage` listener destructures `{ type, enabled }` directly at the argument level. If a non-object message arrives from another extension (rare but possible), the destructuring throws a TypeError. Low real-world risk in a MV2 content script, but `(message) => { if (message?.type === 'SET_ENABLED') ... }` would be more defensive.

### Verdict: APPROVED

Implementation is on-spec, clean, and follows all patterns in ARCHITECTURE.md. Both nits are take-it-or-leave-it — neither blocks merging.
