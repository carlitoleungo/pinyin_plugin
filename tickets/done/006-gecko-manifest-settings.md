# 006 — Add gecko browser_specific_settings to manifest

## Summary
`web-ext lint` emits two warnings on every run — `MISSING_ADDON_ID` and `MISSING_DATA_COLLECTION_PERMISSIONS` — because `manifest.json` has no `browser_specific_settings.gecko` block. Both warnings are AMO submission blockers: Firefox requires an explicit extension ID for persistent storage and update-key association, and AMO policy requires an explicit data-collection declaration. This ticket resolves both in a single manifest-only change with no new permissions and no logic touched.

## Acceptance criteria
- [ ] `npm run lint` (or `web-ext lint`) completes with 0 errors and 0 warnings
- [ ] Extension loads in Firefox and pinyin annotations still appear on Chinese text after the change
- [ ] No new entries appear in the `permissions` array of `manifest.json`

## Files likely affected
- `manifest.json`

## Dependencies
- None

## Notes for the engineer
Add the following block to `manifest.json` at the top level (alongside `"manifest_version"`, `"name"`, etc.):

```json
"browser_specific_settings": {
  "gecko": {
    "id": "pinyin-overlay@your-domain.com",
    "strict_min_version": "109.0",
    "data_collection_permissions": {
      "required": [],
      "optional": []
    }
  }
}
```

- The `id` value must be a unique reverse-DNS-style string. For personal use any value works (`pinyin-overlay@localhost` is fine). For AMO submission it should use a domain you own.
- The empty `required`/`optional` arrays are the correct declaration for an extension that collects no user data — do not add anything to them.
- `strict_min_version: "109.0"` matches the minimum version already implied by Manifest V3 support in Firefox.

## Notes for QA
- Run `npm run lint` and confirm the output shows **0 warnings, 0 errors**.
- Load the unpacked extension in Firefox (`about:debugging` → Load Temporary Add-on → select `manifest.json`) and navigate to a page with Chinese text (e.g. zhihu.com or baidu.com). Confirm pinyin ruby annotations appear above characters.
- Open `manifest.json` and confirm the `permissions` array is unchanged from before this ticket.
