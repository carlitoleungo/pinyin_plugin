## Code Review — 004

**Files reviewed:**
- `content_scripts/content.js` — adds `processChunk`, `scheduleChunk`, and deferred entry point; `annotateTextNode` and `findChineseTextNodes` unchanged

### Scope: CLEAN

No changes beyond the ticket scope. No manifest changes, no new permissions, no unrelated refactors.

### Issues

- **Must fix:** None

- **Should fix:**
  - `CHUNK_SIZE` is declared inside the body of `processChunk` (`const CHUNK_SIZE = 100`), which means it is re-declared on every recursive call. Hoist it to the IIFE scope alongside `CJK_RE` and `SKIP_TAGS`. Functionally harmless — JS engines optimize this — but placing it inside the function implies it could vary per invocation, which it cannot.

- **Nit:**
  - No comment explaining why chunking exists. The reason (heavy Chinese pages block the main thread) is non-obvious to a reader unfamiliar with the ticket. A one-liner above `processChunk` would help future sessions.

### Correctness

Verified against the ticket's prescribed pattern and the Tech Lead's specific callouts:

| Check | Result |
|-------|--------|
| Stale node guard uses `continue`, not `break` | ✓ |
| Boundary arithmetic: `end = Math.min(index + CHUNK_SIZE, nodes.length)`; recursion passes `end` | ✓ |
| `requestIdleCallback` present with `setTimeout(..., 0)` fallback | ✓ |
| First chunk deferred through `scheduleChunk` — no synchronous annotation at entry | ✓ |
| No CSP violations (`eval`, `new Function`, inline handlers) | ✓ |
| No manifest changes, no new permissions | ✓ |
| No memory leak: no persistent references held after final chunk completes | ✓ |

### Verdict: APPROVED

Implementation matches the ticket pattern exactly. The `CHUNK_SIZE` placement is a should-fix but not a blocker.
