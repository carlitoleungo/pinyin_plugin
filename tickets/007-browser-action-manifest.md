# 007 — Add browser_action and storage permission to manifest

## Summary
This ticket adds the two manifest declarations needed before any toggle UI can exist: a `browser_action` entry (which creates the toolbar button and ties it to a popup HTML file) and the `storage` permission (needed by ticket 008 to persist the on/off state via `browser.storage.local`). After this ticket the toolbar icon appears and clicking it opens a blank popup panel — no functionality yet. Keeping this as a standalone manifest ticket makes the permission diff reviewable on its own before UI and logic are layered on top.

## Acceptance criteria
- [ ] `npm run lint` exits with 0 errors and 0 warnings after the manifest change
- [ ] Loading the unpacked extension in Firefox shows a toolbar button; clicking it opens a popup panel (even if blank)
- [ ] Pinyin annotations still appear on Chinese pages — no regression from the manifest change

## Files likely affected
- `manifest.json`
- `popup/popup.html` (new file — required by `default_popup`; Firefox errors on load if missing)
- `popup/popup.css` (new file — stub, prevents the popup from being completely unstyled)

## Dependencies
- Requires ticket 006 to be merged first (both touch `manifest.json`; this ticket adds on top of 006's `browser_specific_settings` block)

## Notes for the engineer
Add to `manifest.json`:
```json
"browser_action": {
  "default_popup": "popup/popup.html",
  "default_title": "PinyinOverlay"
},
"permissions": ["storage"]
```

`popup/popup.html` needs only a valid HTML skeleton — a `<head>` and a `<body>` with placeholder content. Firefox requires the file to exist and parse; it does not need to be functional yet.

No icon asset is needed at this stage — Firefox will show a grey puzzle piece. Icon work is backlogged.

## Notes for QA
- Run `npm run lint` and confirm 0 warnings, 0 errors.
- Load the extension in Firefox via `about:debugging` → Load Temporary Add-on → select `manifest.json`.
- Click the toolbar button and confirm a popup panel opens (even if empty/blank).
- Navigate to zhihu.com or baidu.com and confirm pinyin ruby annotations still appear — the manifest change must not break existing behaviour.
