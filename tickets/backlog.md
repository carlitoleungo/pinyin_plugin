# Backlog

| Source | Item | Notes |
|--------|------|-------|
| 004-review | Hoist `CHUNK_SIZE` to IIFE scope in `content.js` | Currently declared inside `processChunk` body; re-declared on every recursive call. Move next to `CJK_RE` and `SKIP_TAGS`. |
