# 004 — Batch DOM annotation with `requestIdleCallback`

## Summary
Chinese news pages (sina.com.cn, people.com.cn) can contain thousands of text nodes. Annotating them all synchronously in one pass blocks the main thread and makes the page unresponsive for a noticeable moment. This ticket moves the annotation loop from ticket 003 into idle callbacks, processing a fixed chunk of nodes per callback until all nodes are annotated.

## Acceptance criteria
- [ ] The annotation loop uses `requestIdleCallback` (with a `setTimeout` fallback for environments that do not support it) rather than a synchronous `for` loop
- [ ] On sina.com.cn, the page is scrollable and interactive immediately after load while annotation completes progressively in the background
- [ ] All Chinese text nodes on the page are eventually annotated — no nodes are left unannotated after the callbacks finish

## Files likely affected
- `content_scripts/content.js`

## Dependencies
- Requires 003 (annotation logic must exist before batching it)

## Notes for the engineer
- Pattern: collect all matching text nodes into an array, then process in chunks:
  ```js
  function processChunk(nodes, index) {
    const CHUNK_SIZE = 100;
    const end = Math.min(index + CHUNK_SIZE, nodes.length);
    for (let i = index; i < end; i++) {
      annotateNode(nodes[i]);
    }
    if (end < nodes.length) {
      scheduleChunk(nodes, end);
    }
  }
  function scheduleChunk(nodes, index) {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => processChunk(nodes, index));
    } else {
      setTimeout(() => processChunk(nodes, index), 0);
    }
  }
  ```
- CHUNK_SIZE of 100 is a reasonable starting point — tune if needed.
- Extract the per-node annotation from ticket 003 into a standalone `annotateNode(node)` function before batching it.
- Nodes may be detached between when they are collected and when the idle callback fires (e.g. SPA navigation, lazy-loaded content). Guard with `if (!node.parentNode) continue;`.

## Notes for QA
- Load via `npm run dev`, open sina.com.cn. Observe that pinyin appears progressively — you should see it "fill in" across the page rather than all appearing at once.
- Try scrolling immediately after page load — the page should respond without freezing.
- Wait for annotation to complete (a few seconds on heavy pages) and confirm no Chinese characters remain unannotated.
- Repeat on baidu.com and zhihu.com to confirm annotation still completes correctly.
- Check the console for errors during the chunked processing.

---

## Tech Lead Review

**Complexity: M** (15–30 min) — clean refactor; the pattern in the ticket is production-quality.

Feasible. One nuance to understand:

- **CHUNK_SIZE is per text node, not per character (medium risk):** A single `<p>` with 500 characters is still processed in one synchronous burst within a single idle callback. On typical Chinese pages with many short nodes this is fine. If jank is reported on long-form article pages (zhihu.com, individual articles), reduce CHUNK_SIZE or split on character count — but do not pre-optimize.
- **Stale node guard:** Use `continue`, not `break`, when `!node.parentNode`. A `break` would abort annotation for all remaining nodes in the chunk.
- Do this ticket last — validate the synchronous version from 003 is correct before refactoring it.
