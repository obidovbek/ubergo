---
description: End the work day — update all memory files, journal, commit message
---

Close the work session:

1. docs/PLAN.md — update checkboxes, add a Session note line, and rewrite
   "Resume point" so a brand-new chat could continue using only that file.
2. docs/TODO.md — move finished tasks to Done with today's date. A card MOVES, never copies.
   Then run `node scripts/check-board.mjs` — it must print ✓ before the commit is proposed.
3. docs/JOURNAL.md — add today's entry ON TOP using the template
   (Task / Done / Decisions / Problems / Next / Commit).
4. If the project structure changed today, also update docs/ARCHITECTURE.md
   (diagram, status colors, component table).
5. Run the lint command from CLAUDE.md for the app you changed; tell me the result.
   Also run `npm test` in every project you changed (CLAUDE.md §1 and §6 — API, user app,
   driver app; the admin panel has none).
6. Propose a git commit message (short, imperative, e.g. "feat: add login form").
   Do not commit without my approval.
