# 🎯 PLAN-T091 — ARCHIVED 2026-08-15 (superseded by T-092 in `PLAN.md`)

> ✅ **Steps 1-6 done.** The owner reported T-091 **complete** on 2026-08-15 — migration run,
> deployed, user app rebuilt, code and username claimed.
> 🛑 **ONLY STEP 7 (the commit) REMAINS**, and the T-091 files are still uncommitted:
> `20260815000001-add-own-promo-code-username.cjs` · `utils/identifiers.ts` + `.test.ts` ·
> `UserController.ts` · `middleware/validator.ts` · `User.ts` · API `{uz,ru,en}.ts` ·
> `EditProfileScreen.tsx` · `UserDetailsScreen.tsx` · app `{uz,ru,en}.ts` ·
> `utils/registrationDraft.ts` · `utils/identifiers.ts` (app copy).
> Everything below is the plan exactly as it stood.

---

> ✅ **T-087 COMPLETE — moved intact → `docs/PLAN-T087.md`** (all 8 steps; migrated, deployed,
> verified on test3 and committed 2026-08-14).
> ✅ **T-081** → `docs/PLAN-T081.md` (steps 1-4 done; owner's user-app rebuild + walk remain).
> ✅ **T-078** → `PLAN-T078.md`. ✅ **T-077** → `PLAN-T077.md`. ✅ **T-065** → `PLAN-T065.md`.
> ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> ✅ **T-059 · T-055 · T-057 · T-054 · T-045 · T-024** → their own files.
> 🔴 **T-047 PARKED.** 🟡 **T-031** — items 5-6 done, item 4 **cancelled** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

## 🔴 BOARD STATE 2026-08-14 — read before starting anything

**`tsc` BASELINES: API 281 · admin 0 · user 6 · driver 28.** All four projects lint at **0 errors**.

✅ **The uncommitted backlog is CLEARED** — `be0c445` and `e22e51a` swept up T-010, T-028, T-032,
T-061/T-063, T-081 and all of T-087. The tree is clean apart from the docs.
✅ **test3 is migrated and deployed**, and `db:migrate:status` shows **every migration `up`**.
🛑 **THE TWO APP REBUILDS ARE STILL OUTSTANDING** — user (T-077 · T-081 · T-083 · T-084) and driver
(T-078 · T-079/T-080 · T-061; **mandatory native rebuild**, T-076 removed a native dep).
🔴 **`JOURNAL.md` STOPS AT `2026-08-13 (2)`** and is missing eleven cards. `/end-day` is overdue.

---

## Task
- **ID / name:** T-091 — the user's OWN promo code (5 chars) and username (≥6 chars)
- **Goal (definition of "done"):**
  1. A user can choose their **own promo code** — exactly **5 characters**, digits + latin letters —
     and it is **unique across all users**.
  2. A user can choose a **username** — **at least 6 characters**, digits + latin letters — also
     unique.
  3. 🔴 **Neither one touches the existing `promo_code` column**, which means something else
     entirely (see below).
  4. The rules are enforced **on the server as well as in the app**, and the server never refuses
     what the app accepted (T-063's rule).
  5. `tsc` at baselines: API **281** · admin **0** · user **6** · driver **28**.
  6. The pure validation logic has a `*.test.ts` beside it, **proven able to fail**.
- **Why now:** it is the only unblocked card in the billing batch that something else depends on —
  **T-089 cannot resolve a referral by promo code until the column that OWNS one exists.** T-092 is
  smaller but leads nowhere; T-088/T-090/T-093 are blocked on the owner.

## 🔴 What is already there (verified 2026-08-14 — do NOT re-derive)
🔴 **`users.promo_code` ALREADY EXISTS AND MEANS THE OPPOSITE OF THIS CARD.**
Migration `20260802000002` says it outright: there are **three alternative ways to name whoever
invited you** — phone, user id, promo code — stored in `referral_phone`, `referral_id` and
**`promo_code`**. `UserDetailsScreen:455` posts `promo_code: promoCode`, and `promoCode` is what the
**new user typed into the "who invited you" box**. It is *somebody else's* code.
✅ **The app already enforces "exactly one of the three"** (`UserDetailsScreen:348-360`) by disabling
the other two as soon as one is filled — a rule that is *visible* rather than a surprise at submit.
🔴 **There is NO `username` column anywhere.** The only hits are the DB connection config and
Telegram SSO's own field.
🔴 **There is NO server-side validation of any of these fields** — `validator.ts` does not mention
`promo_code` or `referral_id`, and `UserController:142-144` writes whatever arrives.
🔴 **The referral data is entirely write-only** — no service reads any of the three columns, so no
referral has ever paid out. (T-089's problem, not this card's.)
✅ **`CITEXT` is the house type for case-insensitive uniqueness** — `phone_e164` and `email` both use
it, and the extension is created by `20250118000001`.
✅ **The admin panel does not show or edit these fields**, so nothing there needs updating.

## Approach
**Two new columns, never a reuse.**

- **`own_promo_code CITEXT UNIQUE NULL`** — the code this user OWNS and gives to others.
- **`username CITEXT UNIQUE NULL`** — the handle this user chooses.
- 🔴 **`promo_code` is left exactly as it is.** Reusing it would equate *"the code I typed in"* with
  *"the code I own"*. That is the `departs_when_full` / `is_urgent` mistake from the 2026-08-13
  meaning review — but with money attached: **T-089 would credit the wrong user on every payout.**
- **`CITEXT`, so `ABC12` and `abc12` collide** by construction. These are things people read off a
  screen and re-type; case-sensitive uniqueness would hand out two codes that look identical.
- **Both nullable** — every existing user has neither, and `null` honestly says "not chosen".
- The character rules go in **`utils/identifiers.ts`** with a real test, for the same reason T-087's
  arithmetic did: services import Sequelize and cannot be tested.

## Steps
- [x] 1. **DONE 2026-08-14. Migration** — `20260815000001-add-own-promo-code-username.cjs`. Approved
  by the owner; **written, NOT run.** `own_promo_code` and `username`, both `CITEXT`, nullable, with
  partial unique indexes. Model updated, and **both `promo_code` and `own_promo_code` now carry
  comments saying which is which.**
  ✅ **The FIRST migration written under T-095's rule — it is atomic** (`sequelize.transaction`), and
  re-runnable via `describeTable` (20260802000002's precedent).
  ✅ `type: 'CITEXT'` as a raw string, matching every other CITEXT column in this schema.
- [x] 2. **DONE 2026-08-14. `utils/identifiers.ts` + `identifiers.test.ts`** — `normalisePromoCode`,
  `normaliseUsername`, `identifiersMatch`, a `RESERVED_NAMES` policy list, and an `IdentifierError`
  carrying both a stable code and the **field it is about**, so the API can name it (T-061's rule:
  an error with its subject deleted is useless).
  🔴 **Length is measured AFTER trimming** — otherwise `'AB1  '` claims a 3-character code.
  🔴 **The reserved check folds case**, or the block is bypassed by pressing shift — CITEXT makes
  `SUPPORT` and `support` the same row.
  🔴 **`identifiersMatch` folds case to agree with CITEXT.** If it did not, a "is this code free?"
  check would say yes and the insert would then fail on the unique index.
  ⚠️ **Matching is EXACT, not substring** — `admin1` and `supporter` are claimable, deliberately.
  🟡 **A test was wrong before the code was** (again): I asserted `admin1` would be refused as too
  short. It is **6 characters**, so it is valid and correctly accepted. The assertion is now inverted
  and kept, with a comment, because it documents a real policy edge rather than a bug.
  **102/102 (28 new), PROVEN ABLE TO FAIL — five mutations, each caught:** no-trim → **2 red** ·
  case-sensitive reserved check → **1** · length-as-minimum → **2** · `identifiersMatch` not folding
  case → **2** · character class widened to allow `_` → **1**. Restore verified byte-identical.
- [x] 3. **DONE 2026-08-15. API** — `profileIdentifiersValidation` mounted on `PUT /user/profile`,
  the two DB-dependent rules in `UserController`, and both fields returned by `/auth/me` **and** the
  update reply.
  ✅ **Four outcomes kept apart, not two:** *wrong format* (422, naming the rule broken — exact
  length / range / alphanumeric / reserved) · *already taken* (422 `unique`, from a pre-check) ·
  *cannot be changed* (422 `immutable`) · *taken in the race* (409, the unique index, via the
  existing `SequelizeUniqueConstraintError` branch of `errorHandler`).
  🔴 **The pre-check is NOT the guarantee and says so in the code** — two users can claim the same
  code between the SELECT and the UPDATE. It exists so the ordinary case gets a **field-named 422**,
  which is the status the apps read field errors from (T-061); only the index can refuse the loser.
  🔴 **`isIdentifierProvided`, not `!== undefined`** — the pattern every other field on this
  endpoint uses would write `''` into a **UNIQUE** column, and the *second* user to save an
  untouched profile would collide with the first on a field neither ever filled in. Both screens PUT
  the whole profile, so this is the normal path, not an edge case.
  🔴 **The middleware TRIMS into `req.body`** — length is measured after trimming (`'AB1  '` is a
  3-character code), so a controller storing the raw value would store what the validator never
  approved. One place trims.
  ✅ **`wrong_length` is answered with a RANGE for a username and an EXACT count for a code**, rather
  than re-deriving which end was hit — that second copy of the length rule would be free to drift.
  ⚠️ **A 5-char code can never collide with a 6-char username**, so the two namespaces need no
  cross-check. Falls out of the rules; noted so nobody adds one.
  **128/128 (26 new), PROVEN ABLE TO FAIL — five mutations, each caught:** `''` counted as provided
  → **2 red** · trim not written back → **1** · exact/range templates swapped → **4** · one locale
  key removed → **1** · only the first field reported → **1**. All three files restored
  **byte-identical** (md5 verified).
  ⚠️ **The immutability and taken checks need a database and are therefore NOT unit-tested** — they
  are step 6's job on test3. Everything testable without one is covered.
- [x] 4. **DONE 2026-08-15. User app** — fields on **`EditProfileScreen` first**, then
  `UserDetailsScreen`, with the same rules as the server.
  ✅ **A boxed "Sizning identifikatorlaringiz" section on BOTH screens**, with its own heading and a
  note saying *this is your code — the PROMO field above is the one who invited you*. On the
  registration screen it also sits far below the referral block: separated by distance **and** by
  wording, because nothing else keeps two promo inputs apart.
  ✅ **`utils/identifiers.ts` (app copy)** returns a translation KEY, not a message — the app's `t()`
  takes no parameters, so the numbers are baked into each locale string.
  🔴 **THE REAL DEFECT THIS STEP HAD TO FIX FIRST: both screens threw away every server error.**
  `throw new Error(data.message)` loses the status, and `handleBackendError` switches on the status —
  so with none it fell through to the generic "profile update failed" toast **and the server's own
  explanation was dropped every time**. Now `throw new ApiError(response.status, data)`, and
  `parseValidationErrors` (which already existed, unused) puts each field error under its input.
  Without this the entire step-3 API would have been invisible.
  🔴 **`EditProfileScreen` re-populates the form in THREE places** (fresh fetch · API-failure
  fallback · <5s cache path). All three had to load the new fields — miss one and a claimed code
  renders as an empty editable box, the user re-types it, the server refuses the "change", and the
  screen looks broken. *T-078's save-but-never-load failure with a lock on top.*
  🔴 **The lock reads the SERVER's user, never the local input** — keying it off `ownPromoCode`
  would lock the box on the first keystroke.
  ✅ **The registration draft carries both fields**, so a half-finished registration does not lose
  them; `hasContent` counts them too, or a draft of only these two would be discarded as empty.
  ⚠️ **`undefined`, never `''`, on submit** — and a locked code is not re-sent at all: it cannot
  change, so sending it only creates a way to be wrong.
  🟡 **`tsc` caught me making it worse.** I removed two `: any` annotations to save two lint
  warnings; they were load-bearing (**TS7006, 6 → 8**). Typed properly instead, so both checks pass.
  *The cheap fix was not free, and only re-running the other check found it.*
  🔴 **Keep them visually SEPARATE from the referral block** or the screen will have two "promo
  code" inputs meaning opposite things — the single most likely way this card confuses a real user.
  ✅ **`EditProfileScreen` is the edit surface** and already PUTs to the same `user.updateProfile`
  endpoint (`:532`), so the API side of editing needs nothing further.
  🔴 **The promo input must LOCK once `own_promo_code` comes back non-null** — the server refuses a
  change with `immutable`, and a field that accepts input the server will always reject is a trap.
  ⚠️ **Send nothing rather than `''`** for an untouched field. The server treats `''` as untouched
  too, so this is belt-and-braces — but an app that sends `''` for a *claimed* code depends entirely
  on that server-side rule to avoid a unique-collision on an unrelated save.
- [x] 5. **DONE 2026-08-15. Verify.**
  ✅ **`tsc` ×4 all at baseline: API 281 · admin 0 · user 6 · driver 28.** Lint: API **230** (pulled
  back to baseline), user **225 vs a measured 221**.
  ⚠️ **THE +4 IS A STATED TRADE-OFF, NOT DRIFT.** All four are `(user as any)?.own_promo_code`-style
  casts — the idiom the two screens already use ~15 times. A hoisted alias would have saved three
  warnings by making these four lines the odd ones out. **The 221 was measured with `git stash`, not
  taken from the card, which said 235** — the recorded number was stale.
  ✅ **API suite 128/128, PROVEN ABLE TO FAIL** (five mutations → 2/1/4/1/1 red).
  ✅ **i18n EVALUATED, not grepped — 13 keys × 3 locales = 39 renders, 0 problems**, and the checker
  itself was **proven able to fail** twice: a renamed ru key → `MISSING`, uz text pasted into ru →
  `UNTRANSLATED`. Both restored byte-identical.
  🔴 **Evaluating was not optional here: `translations/index.ts` ALREADY carries a pre-existing
  TS2322 about locale shape mismatch**, so a key missing from ru or en would not have moved the tsc
  count at all. The compiler could not have caught it.
  ❌ **The app copy of the rules has NO test** — this project has no RN test runner. Only the API's
  copy is tested, so if the two ever disagree the tested one is right. Written on both files.
- [x] 6. **DONE 2026-08-15 — the owner reported the card COMPLETE.** Migration run, API deployed,
  user app rebuilt, a code and a username claimed. *(Reported by the owner, not observed here.)*
- [x] 7. **DONE 2026-08-16 — committed.** Code in `5b97803`, the rest in `cc9eba7`; working tree
  clean. ⚠️ **`cc9eba7` carries T-092 as well**, so the history does not separate the two cards.
  **T-091 IS NOW CLOSED — every step checked.**

## Files to touch
- `api,admin,db/apps/api/src/database/migrations/202608150000xx-add-own-promo-code-username.cjs` **(new)**
- `api,admin,db/apps/api/src/database/models/User.ts`
- `api,admin,db/apps/api/src/utils/identifiers.ts` **(new)** · `identifiers.test.ts` **(new)**
- `api,admin,db/apps/api/src/controllers/UserController.ts` · `middleware/validator.ts`
- `api,admin,db/apps/api/src/i18n/translations/{uz,ru,en}.ts`
- `user-app-standalone/screens/UserDetailsScreen.tsx` · `translations/{uz,ru,en}.ts`
- ❌ No driver-app change. ❌ No admin change.

## Risks / open questions (READ before coding)
- 🔴 **The naming collision is the whole risk of this card.** `promo_code` (theirs) vs
  `own_promo_code` (mine) will sit side by side in the same model. **Anyone reading `promo_code` and
  assuming it is the user's own code will pay the wrong person.** Both columns get a comment saying
  which is which, and T-089 must be pointed at the right one.
- 🔴 **5 alphanumeric characters ≈ 60 million combinations — guessable.** A promo code must never
  become an authentication or lookup key for anything but referral credit. ⚠️ And with **T-092**
  making user IDs start at a known 1 100 001, do not let these become an enumeration pair.
- ⚠️ **A reserved-word list is far cheaper now than later** — `admin`, `support`, `ubexgo`, `help`
  must not be claimable. Taking a username back from a real user is a support problem.
- ⚠️ **Case-insensitive uniqueness needs CITEXT, not `LOWER()` in application code** — the latter
  loses the race between check and insert.
- ✅ **ANSWERED 2026-08-15 — can a code or username be CHANGED once chosen?** Owner delegated the
  decision (*"answer you for best performance and continue"*). **The promo code is PERMANENT once
  set; the username stays editable.** By the time a code is worth changing it has been given out —
  freeing it would break every copy in circulation *and* hand the string to whoever claims it next,
  who would then collect **T-089 referral credit from people who meant to name the first user**. A
  username carries none of that: nobody is paid against it and it is not handed out to be re-typed.
  ⚠️ **Re-sending the SAME code is not a change** (`identifiersMatch`, case-folded to agree with
  CITEXT) — otherwise every profile save after the first would be refused.
- ✅ **ANSWERED 2026-08-15 BY THE CODE — is `UserDetailsScreen` reachable for EDIT?** **No, and it
  does not matter: `EditProfileScreen` is the edit surface and already exists.** `UserDetailsScreen`
  is mounted only in `AuthNavigator` and `ProfileCompletionNavigator` (registration / completion),
  but `EditProfileScreen:532` PUTs to the **same** `user.updateProfile` endpoint. So a user who
  skips these fields at sign-up **can** set them later, and this card needs no new surface — step 4
  simply has to put the fields on **both** screens rather than only the one the plan named.
- Environment: Avast breaks npm/Gradle/git TLS. `.claude/settings.json` stays out of commits.

## Session notes
- **2026-08-14** — planned, approved, steps 1-2 done. Grounding confirmed the trap is worse than
  assumed: the app **enforces "exactly one of phone / id / promo"** for the referrer, so
  `promo_code` unambiguously holds *somebody else's* code.
- **A test was wrong before the code was, for the fourth time in this project's journal.** Recorded
  because the pattern is the point, not the individual slip.
- **Two things the grounding settled that the plan had listed as unknowns:** there is **no**
  server-side validation of these fields today, and the **admin panel does not touch them** — so
  neither needs work.
- **2026-08-15** — step 3 done. Owner delegated both open answers (*"answer you for best performance
  and continue"*), and **one of the two turned out not to be an owner question at all**: whether
  there is an edit surface is a fact about the code, and `EditProfileScreen` — posting to the same
  endpoint — has been there all along. *The plan had escalated a question it could have read.*
- **The dangerous line was the one that looked like every other line.** `if (x !== undefined)` is
  the pattern the other nine fields on this endpoint use, and copying it here would have written
  `''` into a UNIQUE column — where the failure lands on the **second** user to save an untouched
  profile, not on whoever typed something wrong. Caught by asking what an empty box means, not by a
  test.
- **Lint drifted +4 and was pulled back rather than rebaselined** — all four were my own `any`s
  (two in a test helper, two mirroring the file's existing `Record<string, any>`). `Record<string,
  unknown>` and a typed fake `Request` cost nothing and kept the number honest at **230**.
- **2026-08-15** — steps 4 and 5 done. The card is **code-complete**; only the owner's run and the
  commit remain.
- **The step could not be done as written until an unrelated defect was fixed.** Both screens threw
  the server's status and `errors` array away, so *every* API message on this endpoint was already
  being replaced by a generic toast. Step 3's four carefully distinguished answers would have
  arrived as one indistinguishable "profile update failed". *Building the field was the small half.*
- **`parseValidationErrors` already existed and had never been called** — the seam for exactly this
  was there all along, like `resultsCount` in T-077. **Check before building.**
- **A "free" cleanup cost two `tsc` errors.** Dropping two `: any` annotations to save two lint
  warnings produced TS7006 (6 → 8). Caught only because the other check was re-run afterwards —
  *one green check is not evidence when a change was made to satisfy a different one.*

## Resume point (for the next chat)
**STEPS 1-5 DONE (1-2 on 2026-08-14, 3-5 on 2026-08-15). THE CARD IS CODE-COMPLETE AND UNTESTED.**
`tsc` API **281** · admin **0** · user **6** · driver **28**, all at baseline. Lint API **230** ·
user **225** (vs a `git stash`-measured **221**; the +4 are the file's own `(user as any)` idiom).
**128/128 tests, proven able to fail → 2/1/4/1/1 red.** i18n **evaluated** 13 keys × 3 locales,
0 problems, checker proven able to fail twice.

🔴 **THE MIGRATION HAS NOT BEEN RUN** (`20260815000001`). The API now reads and writes two columns
that **do not exist on test3 yet** — a profile save including either field will fail until it is.
It is the only unrun migration on the board.

**Only steps 6 (the owner's run) and 7 (commit) remain.** Step 6 in order:
1. `npm run db:migrate` in `api,admin,db/apps/api`, 2. deploy the API, 3. **rebuild the USER app**,
4. claim a code and a username, 5. **try to claim the same pair from a second account** (expect a
message under the field, not a generic toast), 6. **re-open the profile and confirm both loaded
back** — and that the promo input is now **locked**.
⚠️ **The edit round trip is the test that matters**, as it was for T-078: a field that saves but
never loads back is how this fails with nothing erroring.

✅ **BOTH BLOCKING QUESTIONS ARE ANSWERED** (see Risks): the promo code is **permanent once set**,
the username stays editable; and `EditProfileScreen` is the edit surface that already exists.

🔴 **The one thing to understand before touching this card:** `users.promo_code` is **the referrer's
code the user typed in at registration**, not their own. This card adds `own_promo_code` beside it
and must never merge the two — T-089's payout reads one of them, and picking the wrong one credits
the wrong person.
