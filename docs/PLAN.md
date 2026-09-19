# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-123 (timeout recognition) → `docs/PLAN-T123.md`, moved 2026-09-19 when T-122 took this
> file.** **DONE, committed as `fed25f9`.** One device check is owed (`docs/CHECKLIST.md` §2:
> airplane mode on mid-OTP-send, both apps).
> 📦 **T-121 (the utils test suites) → `docs/PLAN-T121.md`.** DONE, committed `2cd01c9`.
> 📦 **T-118 (the app test suites) → `docs/PLAN-T118.md`.** Done and committed (`7526742`) except
> **step 12's proof**: nobody has confirmed a green CI run on GitHub (needs the Actions tab).
> 📦 **T-101 (the design system) → `docs/PLAN-T101.md`.** Steps 2b and 19-26 are open; sub-plans
> `PLAN-T101-step14b/16/17/18/19.md` and `PLAN-T101-SCOPES.md`.
> 📦 **T-102 → `PLAN-T102.md`** (T-102i next, the read side) · **T-102c-3 → `PLAN-T102c3.md`**.
> 📦 **T-088 (Paynet) → `docs/PLAN-T088.md`.** One code step (`ChangePassword` persistence), the
> rest is T-100 and Paynet's credentials.
> 📦 **T-114 → `PLAN-T114.md`**, sub-step ① planned, not started.
> ✅ **T-092** → `PLAN-T092.md`. ✅ **T-091** → `PLAN-T091.md`. ✅ **T-087** → `PLAN-T087.md`.
> ✅ **T-081** → `PLAN-T081.md`. ✅ **T-078** → `PLAN-T078.md`. ✅ **T-077** → `PLAN-T077.md`.
> ✅ **T-065** → `PLAN-T065.md`. ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> 🔴 **T-047 PARKED** — its decision logic is pinned by T-121's `notificationRouting` tests, but
> closing it still needs a `logcat` line from a real killed app.
> 🛑 **T-031 — item 1 CLOSED by the owner, do NOT reopen** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

---

## 🔴 BOARD STATE 2026-09-19 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (via `tsc -b`) · user 5 · driver 28.** All four lint at
**0 errors**. **Lint WARNING baselines: user 208 · driver 275.** **Raw-colour ceilings: user 1 ·
driver 3.** 🔴 **Never rebaseline upward.**
**Suites (all `npm test`):** **API 357** · **user 255 Jest + 11 checkers** · **driver 281 + 11**
*(measured green at T-123's close; user 5 and driver 28 `tsc` re-measured 2026-09-19 before commit)*.
**This card touches no code**, so none of these may move. If one does, something outside the card
changed it.

---

## Task

- **ID / name:** T-122 — the task board contradicts itself: two *Now* sections and 22 duplicated
  cards
- **Why now:** the owner said *"any, you choose"* on 2026-09-19. Chosen because **every other card
  is read through this board**, and it is wrong in ways that have already cost sessions: the
  2026-09-18 *start-day* had to guess which of two *Now* sections was live. **It is also the second
  time this exact defect has been boarded:** T-097 (2026-08-15) describes it, was never done, and
  is itself a duplicate of T-122. *The board duplicated its own duplication card.*
- **What it costs today:** `docs/TODO.md` is **352 KB / 4 163 lines** — too big to Read in one call
  (256 KB limit), so every session reads it in slices and can land in either copy of a card. *Now*
  holds **23 distinct cards** against a rule of **2**.

### 🔴 What the measurement found (2026-09-19, a parser, not eyeballing)

1. **The two `## 🔥 Now` headers (L64, L663) are one paste accident, not two sections.**
   **L3-65 — the file's whole header** (the rules, the 2026-08-11 and 08-12 state notes, and the
   `## 🔥 Now` line) **reappears byte-identical at L602-664**. A **125-line block (L410-534: T-078
   twice, T-083, T-079+T-080) is byte-identical at L758-882.**
   ⚠️ T-097 warned the two header copies differ (*"ELEVEN"* vs *"TEN"*). **They no longer do** —
   both notes sit inside *each* copy. The card text is superseded by the measurement.
2. **150 card lines, 123 distinct ids** (+4 id-less legacy lines at the bottom of *Done*).
   **22 ids are duplicated.** The parser's count was right by accident: it wrongly merged
   **T-026 / T-026A** (two different cards — keep both) and missed **T-080**, whose unbuilt
   original (*"NOT STARTED"*, L883) sits under the built **T-079 + T-080** card. Three kinds:
   - **Ⓐ verbatim copies (3):** T-078 · T-083 · T-079+T-080. T-078's struck *"PLAN WRITTEN AND
     AWAITING APPROVAL"* leftover (about a plan approved in August) was copied with it — **×4**.
   - **Ⓑ in *Done*, but the long original was never removed (14):** T-024 · T-034 · T-043 · T-045
     · T-049 · T-050 · T-051 · T-052 · T-053 · T-091 (open or struck in *Now*/*Next*/*Later*);
     T-044 (struck, in *Now*); **T-038 · T-041 · T-042 kept in *Parked* under a
     `<details>… history kept` fold ON PURPOSE** (a 2026-08-10/11 decision to keep the history).
   - **Ⓒ newer copy on the board, the original boarding copy left behind (5):** T-063 (*Next*) ·
     T-087 and T-088 (*Later*) · T-076 (*Later*, struck) · T-080 (*Now*, L883).
3. ***Now* holds 23 distinct cards.** Most say *"code-complete and untested"* — which is word for
   word the definition of the **⏸️ Parked** section just below it: *"not counted against the
   2-task Now limit … they only need the owner to confirm on a phone."* The section exists; the
   cards were never moved into it.
4. **The header's dated notes are false:** *"No Claude work remains anywhere"* (2026-08-11), and
   two different counts of code-complete cards (*ELEVEN*, *TEN*) one screen apart.
5. ✅ **Nothing parses `TODO.md`.** Only slash-command prose and one comment in
   `check-geo-cache.mjs` mention it. Restructuring cannot break code or CI.

### Goal (definition of "done")

1. **One `## 🔥 Now`, holding at most 2 cards:** T-122 while it runs, plus the one the owner names.
2. **Every T-### id is a card exactly once on the board** (T-026 and T-026A are two ids).
3. **Nothing is lost, proven by a script, not by reading:** every line removed from the board is
   either an exact duplicate of a line that stays, or appears verbatim in `docs/TODO-ARCHIVE.md`.
   **The check is proven able to go red.**
4. **Every card moved out of *Now* lands in the section whose own definition fits it** (*Parked* /
   *Next* / *Done*), decided by **reading the card**, with every move recorded in a table here.
5. **The header says what is true on 2026-09-19.** The old dated notes move verbatim to the archive.
6. **T-097 closed as the same card**, superseded by T-122.
7. **No code, no migration, no dependency.** No card's wording is rewritten; cards move whole.

### Explicitly OUT of scope

- 🛑 **Rewriting cards.** A card moves whole or not at all. The only card text edited is T-122's,
  T-097's, and the file header.
- 🛑 **T-065…T-072**, whose write-ups sit at the bottom of *Later* by a deliberate 2026-08-12
  decision (*"one home per card"*). Each exists once — misplaced, not duplicated. Left alone.
- 🛑 **Shrinking *Later* (1 370 lines) or *Done*.** The file lands around **270 KB — still over the
  Read limit.** This card does not promise it fits.
- 🛑 **Wiring a board check into CI** (decision ③).

## Approach

- **A Node script makes the edits, not the Edit tool.** The duplicated blocks are byte-identical,
  so every text anchor matches twice — T-097 already hit exactly this. The script picks cards by
  **id and section**, never by line number, and writes **LF** back (the file is LF in the working
  tree; `core.autocrlf` is on).
- **One step = one kind of change**, measured before and after with the same parser, so the board
  is valid and readable after every step.
- **A conservation check after every step that removes anything:** removed lines ⊆ kept lines ∪
  archive lines, counted as multisets, against the committed original (`fed25f9:docs/TODO.md`).
  **Proven red once** before it is trusted.
- **Where two copies differ, read both before choosing.** T-122's own warning: *"the later one on
  the page is not reliably the newer one."* **Dated statuses decide, not position.** The losing
  copy is archived, not deleted, so a wrong pick is a move back, not a loss.
- **Revert from a scratchpad golden copy, never `git checkout`** (`core.autocrlf`).

## Steps

- [x] **0. Owner approval (rule 3), with the three decisions below.** ✅ *"ok"*, 2026-09-19 — all
  three recommendations: ① **T-101** shares *Now* with T-122 · ② **`docs/TODO-ARCHIVE.md`**,
  verbatim · ③ **`scripts/check-board.mjs`**, run by `/end-day`, not CI.
- [x] **1. Tools, read-only.** ✅ **DONE 2026-09-19.** `scripts/check-board.mjs` (committed:
  sections, *Now* ≤ 2, own ids once, pasted runs ≥ 8 lines; exports its parser) and a scratchpad
  conservation check (every original card's text AND every original line must survive in
  board ∪ archive, against `fed25f9`). **14 predictions, 14 matched:** checker fixtures clean 0 /
  T-080 re-carded 1 / third *Now* card 1 / header twice 1 / 7-line paste 0 / 8-line paste 1 /
  struck twin 1; the real board **26 problems** exactly as measured (1 section, 28 in *Now*,
  22 ids, 2 pastes); conservation: itself 0, a verbatim twin removed 0, **T-114 removed → lost**,
  **one T-101 line edited → T-101 + 1 line lost**, T-114 archived 0, today's board without the
  T-122 exemption → T-122 lost, with it 0.
  ⚠️ **A fixture was wrong before it ran:** 7 pasted lines + the shared blank after them is a run
  of **8**, so the "under the threshold" case needed a distinct tail line to test what it claims.
- [x] **2. Delete the two verbatim copies.** ✅ **DONE 2026-09-19.** Content-anchored; the script
  refused unless each copy was byte-identical. **(a)** L600-664 == L1-65 (title, header, second
  `## 🔥 Now`); **(b)** the 125-line block — the *"📥 driver's offer screen"* note, T-078 ×2,
  T-083, T-079+T-080 — deleted from its second position. **4 166 → 3 976 lines.** Predicted and
  got: **26 → 21 problems** (1 *Now* section; 24 cards in it; 20 ids), **0 lost**.
- [x] **3. Ⓑ + Ⓒ + T-078's struck leftover.** ✅ **DONE 2026-09-19.** Every pair read; in all 20
  the copy that stays is at least as new as the one that left and carries the closed or current
  status. **20 cards + 1 note** (the *Parked* line describing three of the folds) moved verbatim
  into the new `docs/TODO-ARCHIVE.md`, each under a line saying where it stood and which copy
  stayed; the six `<details>` folds moved whole. Predicted and got: **21 → 1 problem** (*Now* 20),
  **0 duplicated ids, 0 lost.** Board **352 KB → 277 KB.** No card glued to its neighbour (55 → 46
  glued lines; the 46 are the file's own formatting).
  ⚠️ **A spacing edge found before running:** T-076's fold had no blank line after it, so "take a
  neighbouring blank" would have glued two cards. The rule became "only when both sides are blank".
  📌 **FOUND, NOT FIXED (not this card's question):** **T-024 is in *Done* but was never walked on
  a device** — `PLAN-T024.md` step 7 is open. The old header listed **T-034 · T-043 · T-045** as
  untested too, and all three are in *Done*. *Parked*'s own note says *Done* means
  device-confirmed. **Boarded at close for the owner** — whether *Done* means "committed" or
  "confirmed on a phone" is theirs to say.
- [x] **4. Re-apply max 2.** ✅ **DONE 2026-09-19.** Every card read by its own status line.
  Predicted and got: **✓ one board, 126 cards, 2 in *Now***, 0 lost — **the checker's first green.**

  | Card | From | To | Why (the card's own words) |
  |---|---|---|---|
  | T-122 | *Later* | ***Now*** | active — owner approved 2026-09-19 |
  | T-101 | *Now* | ***Now*** (stays) | decision ① — the only card with open plan steps |
  | T-088 | *Now* | *Next*, top | decision ① — one code step, the rest waits on T-100 / Paynet |
  | T-115 · T-116 | *Now* | *Next*, 2nd · 3rd | decision ① — counter UI · the long-tail decision |
  | T-078 · T-083 · T-079+T-080 · T-081 · T-063 · T-084 | *Now* | *Parked* | *"code-complete and untested"* |
  | T-077 | *Now* | *Parked* | *"APPROVED and STEPS 1-6 DONE"* |
  | T-087 | *Now* | *Parked* | *"STEPS 1-6 DONE … code-complete and untested"*; question ⑥ is the owner's |
  | T-061 · T-055 · T-057 · T-054 | *Now* | *Parked* | *"Only step 8 (owner: deploy/rebuild, walk) and step 9 (commit) remain"* |
  | T-059 · T-046 | *Now* | *Parked* | steps done; only the owner's run and the commit remain |
  | T-082 | *Now* | *Next*, end | *"GROUNDED, NOT BUILT, needs an owner answer first"* |
  | T-031 | *Now* | *Next*, end | *"Steps 4-12 remain"*, blocked on the owner |

  Notes moved with their cards: the *"📥 driver's offer screen"* intro (→ *Parked*, before T-078),
  *"✅ T-080 was built together with T-079"* (→ *Parked*), *"✅ T-092 and T-091 CLOSED … carried
  forward"* (→ *Next*, after T-088). **Three notes about *Now*'s contents that had stopped being
  true → archive** (*"THE ONE ACTIVE TASK IS T-087"*, *"T-061 is the ONLY card … with Claude work
  left"*, *"Only T-031 is left in Now"*).
  ⚠️ **T-059 carries literal line breaks** where it meant to show `\n`, so six of its lines sit at
  column 0 and the parser ends the card early. The move took them along (34 lines); the card's
  text was **not** repaired — rewording is out of scope.
- [x] **5. The header.** ✅ **DONE 2026-09-19.** The 2026-08-12 batch note (22 lines), the
  2026-08-11 state note (31) and *Now*'s header note (20) → archive, verbatim. **T-097 → archive
  too**, rather than "marked superseded": it is the same card as T-122, so one home is the
  archive, and T-122's *Done* entry names it. A 13-line header replaces them: what each section
  means, **one card, one copy**, the checker, and *where the work stands lives in `PLAN.md`'s
  Resume point, not in a dated note*. Predicted and got: ✓ **125 cards, 2 in *Now***, 0 lost.
  ⚠️ **My first header claimed stale notes were "how this file got two *Now* sections".** They
  were not — that was a paste. Corrected before moving on: the true example is the archived note
  that said *"No Claude work remains anywhere"* for five weeks.
- [x] **6. Verify end to end.** ✅ **DONE 2026-09-19.** **No id left the board except T-097**
  (123 → 122), and T-097 is in the archive. Sections *Now* 2 · *Parked* 29 · *Next* 21 · *Later* 49
  · *Done* 24, as predicted. LF kept. Conservation against `fed25f9`: **150 cards, 0 lost, 0 lines
  lost.** Mutations on the final state, each red on exactly its own thing: an archived T-091 pasted
  back → *"T-091 is carded 2×"*; a third card in *Now* → *"Now holds 3"*; T-080's archive entry
  deleted → *"lost card T-080"*.
  ⚠️ **One prediction missed and the fixture was wrong, not the checker:** my "third card in *Now*"
  was inserted before `## 📋 Next` — but *Parked* now sits between *Now* and *Next*, so it landed
  in *Parked*, where it is allowed, and the check stayed green. Re-aimed before `## ⏸️ Parked`,
  it went red. *A mutation that misses its target proves nothing either way.*
  **No code was touched** — the diff is `docs/`, `.claude/commands/end-day.md` and the new
  `scripts/` — so no test suite or `tsc`/lint baseline can have moved; none was re-run.
- [x] **7. Close.** ✅ **DONE 2026-09-19.** T-122 → top of *Done* (moved whole, a closing summary
  on top); *Now* holds **T-101** alone. **T-125** boarded at the top of *Later* (what *Done* means
  — see step 3's finding). `docs/ARCHITECTURE.md` folder map gains `scripts/check-board.mjs` and
  the archive. `docs/JOURNAL.md` written. **Final: ✓ one board, 126 cards, 1 in *Now*; 0 lost;
  352 KB → 273 KB.** Commit proposed, not made.
  🔧 **One more line fixed in `.claude/commands/end-day.md`** (the file decision ③ already
  touched): step 5 said *"There is no test suite yet"*, which contradicts CLAUDE.md §6 since T-118.
  It now says to run `npm test` in every project changed.

### ❓ The three decisions (step 0)

1. **Which card shares *Now* with T-122?** *Recommendation: **T-101*** — it is marked ACTIVE and is
   the only card with an open multi-step plan (`PLAN-T101.md`, steps 2b and 19-26). **T-088** (one
   small code step; the rest waits on T-100 and Paynet), **T-115** (the counter UI) and **T-116**
   (the long-tail decision) go to the top of *Next*, in that order.
2. **Where do the ~20 stale copies go (≈ 57 000 characters)?** *Recommendation: **a new
   `docs/TODO-ARCHIVE.md`**, verbatim* — nothing is lost, the board keeps one copy per card, and
   nobody has to judge which details mattered. The alternatives: delete them and rely on git
   (`fed25f9` has them all), or fold them under `<details>` in place, which keeps the file big.
3. **Keep the checker?** *Recommendation: **yes — `scripts/check-board.mjs`** (new root folder, no
   dependency), plus one line in `.claude/commands/end-day.md` telling `/end-day` to run it;
   **not** wired into CI.* It is the tool this card verifies itself with anyway, and this defect
   has now been boarded **twice (T-097, T-122) and fixed zero times**. A board nobody checks rots back.

## Files to touch

**Docs:** `docs/TODO.md` · `docs/TODO-ARCHIVE.md` (**new**, decision ②) · `docs/PLAN.md` ·
`docs/PLAN-T123.md` (**new** — T-123's plan verbatim) · `docs/JOURNAL.md` ·
`docs/ARCHITECTURE.md` (folder map, two lines)
**Decision ③:** `scripts/check-board.mjs` (**new**) · `.claude/commands/end-day.md`
**NOT touched:** any code, any app, the API, CI, `CLAUDE.md`, any other plan file.

## Risks / open questions

1. ⚠️ **A card moved to the wrong section.** Every move is read from the card's own status line
   and recorded in step 4's table, so the owner can overrule one row without redoing the card.
2. ⚠️ **Keeping the stale copy of a pair.** Dated statuses decide; the loser is archived, not
   deleted.
3. ⚠️ **Line endings.** The script must write LF, and `git diff --stat` must show only
   `docs/` files.
4. ⚠️ **Other docs point into the board by line number** (*"around lines 64 and 663"*). Those go
   stale by design; ids are the stable reference.
5. ⚠️ **The *Parked* rule is only as good as whoever moves cards.** If decision ③ is no, nothing
   stops the next session from filling *Now* again.

## Session notes

### 2026-09-19 — T-123 committed; T-122 planned, approved and finished, steps 0-7

- **T-123 committed as `fed25f9`** at the owner's word ("commit and start next"), after re-running
  its two test files (53 / 60 green) and `tsc` (user 5 / driver 28 = baselines).
- **The owner said "any, you choose"; T-122 was chosen** because every other card is read through
  the board. **Measuring first rewrote the card:** the two *Now* sections were a paste, not two
  sections; the 22 duplicates were not the 22 the card listed (T-026/T-026A are two cards, T-080
  was missing); T-097 is the same card boarded five weeks earlier; and its warning that the two
  header copies differ had stopped being true.
- **Every edit was a script anchored on content, every step predicted before it ran.** 7 steps,
  ~30 predictions; **two missed, and both were fixtures of mine**, not the tools — a paste
  threshold fixture that counted a shared blank line, and a *Now* mutation that landed in *Parked*.
- 🔴 **I wrote one false sentence into the new header** (stale notes as the cause of the two *Now*
  sections) and caught it on reading the result back. It was the header of a card about the board
  saying things that are not true.
- 🔴 **Found after closing, before the commit: a pointer this card broke.** T-088's card said *"the
  card's own detail is in* Later *below"* — the copy step 3 archived. The phrase was split across
  two lines, so the first line-based search missed it. Now points at `docs/TODO-ARCHIVE.md`;
  conservation flags exactly T-088's two rewritten lines, nothing else. **Every other *Later* /
  *Parked* pointer on the board was checked and still resolves.**
- 📌 **Left alone on purpose:** the *"🤝 START HERE: `docs/HANDOFF-2026-09-12.md`"* note still sits
  in *Now* under T-101 — its three blockers may still be true and nobody has re-checked them;
  T-059's literal line breaks (rewording is out of scope); T-065…T-072 living in *Later* by the
  2026-08-12 "one home per card" decision.

## Resume point

> **Updated 2026-09-19. T-122 IS COMPLETE — all 8 steps (0-7). NOT COMMITTED** — the commit is
> proposed and waiting for the owner's yes.
> **Working tree:** `docs/TODO.md` (one board), `docs/TODO-ARCHIVE.md` (new), `docs/PLAN.md`,
> `docs/PLAN-T123.md` (new, T-123's plan), `docs/JOURNAL.md`, `docs/ARCHITECTURE.md`,
> `scripts/check-board.mjs` (new), `.claude/commands/end-day.md`. **No code.**
> 🟢 **`node scripts/check-board.mjs` → ✓ one board, 126 cards, 1 in *Now* (T-101).** Nothing lost
> against `fed25f9` (150 cards, 0 lost, 0 lines lost).
> 🟢 **Baselines untouched** (no code): user `tsc` 5 / lint 0·208 / colours 1 · driver 28 / 0·275 / 3 ·
> API 281 · admin 6. Suites: API 357 · user 255 + 11 · driver 281 + 11.
> **▶️ NEXT: the owner's pick.** *Now* holds **T-101** alone, so one slot is free. The top of *Next*
> is **T-088 → T-115 → T-116**, then T-114 and T-102. **T-125** (what *Done* means) needs an owner
> answer, not code. ⚠️ Still unconfirmed: **T-118's CI run on GitHub** and **T-123's airplane-mode
> device check** (`docs/CHECKLIST.md` §2).
