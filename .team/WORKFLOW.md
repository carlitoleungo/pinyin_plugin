# Team Workflow — PinyinOverlay

This guide explains how to use the `.team/` persona files with Claude Code to build the PinyinOverlay Firefox extension with the structure and quality control of a full dev team.

---

## Setup

These persona files are designed to be used with **Claude Code** (the CLI tool). Each persona runs in its own session to keep context focused and costs low.

Install Claude Code if you haven't:
```bash
npm install -g @anthropic-ai/claude-code
```

Install web-ext (Mozilla's extension development CLI) — you'll need this for testing:
```bash
npm install -g web-ext
```

### How to invoke a persona

**Option A — pipe the persona file (recommended for interactive sessions):**
```bash
cat .team/pm.md | claude
```

**Option B — reference it in your prompt:**
```bash
claude "Read .team/pm.md and follow those instructions. Here's my request: [your idea]"
```

**Option C — one-shot with --print:**
```bash
claude --print "$(cat .team/pm.md)" -p "My feature idea: [idea]"
```

---

## Recommended first session: Tech Lead

Because this is greenfield, **start with the Tech Lead** — not the PM. The Tech Lead scaffolds the project before there's anything to write tickets for.

```bash
cat .team/tech-lead.md | claude
```

Then say:
> "This is a greenfield Firefox extension project. Scaffold the project: create the directory structure, manifest.json, a minimal content script, and ARCHITECTURE.md. Use the recommended stack from your persona file. The extension should load in Firefox without errors — that's all we need for this session."

After this session you'll have:
- A working (though empty) Firefox extension you can load via `web-ext run`
- `ARCHITECTURE.md` that every future session will rely on

---

## The development flow

### Phase 1: Define (PM)
```bash
cat .team/pm.md | claude
```
Tell the PM your next feature idea. It will scope it into small tickets.

**Example prompt:**
> "I want to detect Chinese characters on a webpage and display their pinyin above them. Scope this into tickets — start with the smallest possible first step."

**Output:** Ticket files in `tickets/`, updated `backlog.md`

---

### Phase 2: Plan (Tech Lead)
```bash
cat .team/tech-lead.md | claude
```
The Tech Lead reviews tickets for feasibility, flags complexity, and sets the implementation order.

**Example prompt:**
> "Review the tickets in tickets/ that are ready for engineering. Add complexity estimates and give me an ordered list of what to implement first."

---

### Phase 3: Build (Engineer)
```bash
cat .team/engineer.md | claude
```
Give the Engineer **one ticket at a time.** This is the most important rule.

**Example prompt:**
> "Implement ticket 001. Read tickets/001-[name].md and ARCHITECTURE.md first. Don't start implementing until you've confirmed what the ticket is asking."

**Output:** Code changes + `tickets/001-done.md` handoff note

---

### Phase 4: Test (Test Engineer)
```bash
cat .team/test-engineer.md | claude
```
The Test Engineer independently verifies — it does not trust the engineer's self-report.

**Example prompt:**
> "QA ticket 001. Read tickets/001-[name].md and tickets/001-done.md. Write your own test plan before reading the engineer's 'how to verify' section. Run web-ext lint, load the extension in Firefox, and verify all acceptance criteria."

**If issues found:** Back to Engineer with the QA report.
**If approved:** Proceed to review (optional for small tickets).

---

### Phase 5: Review (Code Reviewer) — optional for S-sized tickets
```bash
cat .team/reviewer.md | claude
```

**Example prompt:**
> "Review the changes for ticket 001. Read the ticket, the QA report at tickets/001-qa.md, and the changed files."

---

### Phase 6: Product review (PM)
After all tickets for a feature are approved:
```bash
cat .team/pm.md | claude
```

**Example prompt:**
> "All tickets for the Chinese character detection feature are complete and tested. Do a final product review — does what was built match what I originally asked for? Are there any gaps?"

---

## Tips specific to this project

1. **Load the extension in Firefox before each QA session.** `web-ext run` from the project root. If it doesn't load clean, nothing else matters.

2. **Keep a local test HTML file.** Create a simple `test.html` with known Chinese characters and their expected pinyin. This gives QA a deterministic baseline instead of relying on live Chinese websites that change.

3. **One ticket per Engineer session — non-negotiable.** Browser extension code is especially susceptible to subtle bugs introduced by "while I'm at it" changes. Don't combine.

4. **The PM will push back on scope.** That's its job. "Add pinyin support" is not a ticket — the PM will decompose it into 4-6 smaller ones. Trust this process.

5. **If QA fails, read the console.** The Browser Console (`Ctrl+Shift+J` in Firefox) and the page DevTools Console are both relevant for extension debugging. Always check both.

6. **ARCHITECTURE.md is the single source of truth.** Every persona reads it. Keep it accurate — update it via the Tech Lead persona whenever an architectural decision changes.

---

## Quick reference

| Phase | Persona | Input | Output |
|-------|---------|-------|--------|
| Scaffold (once) | Tech Lead | Empty repo | Extension scaffold + ARCHITECTURE.md |
| Define | PM | Your feature idea | Ticket files + backlog.md |
| Plan | Tech Lead | Tickets | Ordered list + complexity estimates |
| Build | Engineer | **One ticket** | Code + handoff note (`*-done.md`) |
| Test | Test Engineer | Ticket + handoff | QA report (`*-qa.md`) |
| Review | Reviewer | Ticket + code + QA | Review verdict (`*-review.md`) |
| Sign-off | PM | All approved tickets | Product review |

---

## File structure

```
.team/
  pm.md               ← Product Manager persona
  tech-lead.md        ← Tech Lead persona
  engineer.md         ← Engineer persona
  test-engineer.md    ← Test Engineer persona (be ruthless)
  reviewer.md         ← Code Reviewer persona
  WORKFLOW.md         ← This file
  backlog.md          ← Deferred features (PM maintains this)
  tickets/            ← All ticket files live here
    001-[name].md
    001-done.md       ← Engineer handoff
    001-qa.md         ← QA report
    001-review.md     ← Code review (optional)
```
