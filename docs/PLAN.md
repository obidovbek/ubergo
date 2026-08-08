# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-037** → `docs/PLAN-T037.md`. Steps 1, 3-6 done; **step 7 = owner device test**, step 8 the
> commit. Its code is in the working tree, **uncommitted**.
> ✅ **T-036 CLOSED 2026-08-08** → `docs/PLAN-T036.md`.
> ⏸️ **T-031** → `docs/PLAN-T031.md`, step 4 blocked on the owner's salon-option answer.
> ⏸️ **T-033** → `docs/PLAN-T033.md` · **T-030** → `docs/PLAN-T030.md` · **T-027** →
> `docs/PLAN-T027.md` · **T-018** → `docs/PLAN-T018.md` · **T-026A** step 8 · **T-025** step 8.
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-038 — Sessions must survive: use the refresh token, and translate the 401s
- **Goal (definition of "done"):**
  1. Both apps **persist the refresh token** at login.
  2. An expired access token is refreshed **transparently** — the user sees no error and stays
     logged in for the refresh token's full life (7 days), not 15 minutes.
  3. Only a **failed refresh** logs the user out. A deleted account (OR-002) still logs out at once.
  4. The server's auth errors are **translated** (uz/ru/en) instead of hard-coded English.
  5. `tsc` at baselines (API **282** · admin **0** · user **12** · driver **36**); i18n evaluated.
- **Why now:** the owner hit it on a device — 15 minutes after login every screen 401s, and the next
  app start silently signs the user out. It undermines device-testing every other card.
- **Source:** owner, device screenshot 2026-08-08 ("Xato / Invalid or expired token" on Mening
  bronlarim) + "before last logged out maybe for this issue".

## Owner decisions taken 2026-08-08 (do NOT re-ask)
1. **Fix it properly** — store the refresh token and refresh-and-retry. **Not** by raising
   `JWT_EXPIRES_IN`, which would only hide it behind a longer-lived credential.
2. **The untranslated 401s are part of this card**, not split out. (Claude's call, per the owner.)

## What is actually broken (verified in code 2026-08-08 — do NOT re-derive)
- `AuthContext` destructures `const { user, access, refresh } = response.data` at **4 sites per app**
  and **never uses `refresh`**. `STORAGE_KEYS` = `{ TOKEN, USER }` — no refresh key exists.
- `refreshAccessToken()` exists in **both** `api/auth.ts` — **zero call sites**.
- `JWT_EXPIRES_IN` defaults to **15m**; the refresh token to **7d**.
- `middleware/auth.ts` throws hard-coded English at `:20 :28 :36 :54 :58`; `adminAuth.ts:39` too.

✅ **The server side already works.** `POST /auth/refresh` (`auth.routes.v2.ts:28`) →
`AuthController.v2.refreshToken` → `rotateTokens`, which returns **a new access AND a new refresh**.
⚠️ **`rotateTokens` REVOKES the old refresh token** (`utils/jwt.ts:136-139`). Two concurrent
refreshes therefore burn the token and the second one fails → a spurious logout. **A single
in-flight refresh promise is mandatory, not an optimisation.**

## Approach
`getHeaders(token)` in each app's `config/api.ts` is a **near-perfect choke point** — every
authenticated call already `await`s it, with exactly **one** bypass in the whole codebase
(`user-app-standalone/api/users.ts:120`, the avatar upload, which builds its own header).

So make `getHeaders` refresh-aware instead of introducing a new fetch wrapper across dozens of call
sites: decode the access token's `exp`, and if it is expired or nearly so, refresh **once** (guarded
by a shared in-flight promise), persist both new tokens, and return the header with the fresh one.

⚠️ **Watch the import cycle:** `api/auth.ts` imports `getHeaders` from `config/api.ts`, so
`config/api.ts` must **not** import `api/auth.ts`. The refresh call goes in its own small module
that depends on neither.

⚠️ **The two apps stay separate copies** — same as `AppModal`/`errorHandler`. Write it once, copy it,
and keep the two byte-identical.

## Steps
- [x] 1. **DONE 2026-08-08. API: auth errors translated.** All 5 strings in `middleware/auth.ts` and
  all 4 in `adminAuth.ts` now go through `t()` with the language read from `Accept-Language`
  (`getLanguageFromHeaders`) — the only signal available, since this middleware runs *before* any
  handler and there is no user record to read a preference from yet.
  ⚠️ **Reused the existing `auth.*` keys rather than inventing duplicates**: `tokenExpired`
  ("Sessiya muddati tugagan") and `accountNotFound` already existed and fit exactly. Only 4 keys are
  new — `noToken`, `notAuthenticated`, `insufficientPermissions`, `adminTokenInvalid` — ×3 locales.
  🔴 **Found while doing it: `adminAuth`'s catch rewrote EVERY failure as "Invalid or expired
  token"**, including the two specific errors thrown a few lines above it, so those messages had
  never reached the admin panel at all. Translating them alone would have changed nothing. An
  `UnauthorizedError` now passes through unchanged, matching what `auth.ts` already did.
  `tsc` API **282 = baseline**; the 3 errors reported inside the touched files were **proven
  pre-existing against `HEAD`** (`req.user = decoded` and two extension-less route imports — none of
  them mine, and no `git stash` needed with T-037's work in the tree).
  **18/18** messages resolve through the **real translator**, called the way the middleware calls it,
  for the three `Accept-Language` values the apps actually send — plus an assertion that **no
  hard-coded English literal is left** in either middleware. Script: `scratchpad/api-i18n-check.js`.
- [x] 2. **DONE 2026-08-08. User app persists the refresh token.** New `utils/tokenStore.ts` owns the
  key names and `AuthContext` imports them, so the two can never drift. Two helpers —
  `persistSession()` and `clearSession()` — replaced the **8** hand-rolled storage blocks; the four
  sign-in paths were byte-identical, which is exactly how the refresh token got dropped four times.
- [x] 3. **DONE 2026-08-08. `getHeaders` refreshes transparently.** `ensureFreshAccessToken` in
  `config/api.ts`, behind the mandatory single in-flight promise. `tokenStore.ts` stays
  **storage + JWT decoding only, no network**, which is what keeps the `api/auth.ts` ↔ `config/api.ts`
  cycle from forming. The `api/users.ts:120` avatar bypass now calls it explicitly.
  ⚠️ **No base64/JWT library exists in the app and adding a dependency needs the owner** (rule 4), so
  `exp` is decoded by hand — with a regex fallback for payloads whose non-ASCII claims break
  `JSON.parse` on latin-1 bytes. Both paths are covered by the runtime check.
  ⚠️ **An unreadable or missing `exp` means "do not refresh", never "expired"** — guessing "expired"
  would rotate a token on every single request and burn the refresh chain.
  🔴 **The trap this hit, and the reason it is worth reading:** screens hold the token they were
  handed at sign-in, so after one refresh **every caller's copy is stale forever**. Without a re-read
  of storage before refreshing, each request would have seen an "expired" token and rotated again.
  `ensureFreshAccessToken` now checks what is actually on disk first.
- [x] 4. **DONE 2026-08-08. A failed refresh is a real logout — a flaky network is not.**
  `onAuthLost` fires **only** when the server *rejected* the refresh token; `AuthContext` clears the
  session and dispatches `LOGOUT`. A network failure returns the old token and says nothing, so an
  outage can no longer end a session. OR-002 still logs a deleted account out immediately.
  ⚠️ **Deliberately no "tokens changed" event.** Pushing each refreshed token into `AuthContext`
  state would change `state.token` every ~15 min and re-run everything keyed on it — the identity
  churn behind **T-017**. The in-memory token is just a "signed in" marker now.
  🔴 **Found while wiring it: `logout` never revoked anything.** It called
  `headers: getHeaders(state.token)` **un-awaited**, so `headers` was a `Promise` and the request
  went out with **no Authorization at all**, and it never sent the refresh token either. Harmless
  while the refresh token was being thrown away; unacceptable now that it is stored and lives 7 days.
  It now calls `AuthAPI.logout(token, refresh)`, which already did both correctly and had no caller.
- [x] 5. **DONE 2026-08-08. Driver app carries the same three changes.** `utils/tokenStore.ts` copied
  and verified **byte-identical** (`diff -q`); the refresh block in `config/api.ts` is **character-for-
  character identical** to the user app's (3507 chars, compared programmatically, not by eye).
  Its `AuthContext` needed the same 8 storage sites rerouted through `persistSession`/`clearSession`,
  and the same never-awaited `getHeaders(token)` in `logout` replaced with `AuthAPI.logout`.
  ⚠️ The driver's helpers are `useCallback`s — every method in that file is memoized with no state
  deps on purpose (it reads through `stateRef`), and breaking that convention is what T-017 was.
- [x] 6. **DONE 2026-08-08. Verification.**
  `tsc`: API **282 = baseline** · admin **0 = baseline** · user **11** · driver **35**.
  ⚠️ **Both apps are one BELOW baseline (12 and 36) — deliberately.** The removed error *is* the
  logout bug: `headers: getHeaders(token)` was never awaited, and that un-awaited call was itself one
  of the baseline errors in each app. Every remaining error in a touched file was **proven
  pre-existing against `HEAD`** (`git show HEAD:<file>`), not `git stash` — T-037's work is
  uncommitted in the same tree.
  **18/18** API auth messages resolve through the **real translator** for the three
  `Accept-Language` values the apps send, plus an assertion that no hard-coded English literal
  remains. **291/291** driver i18n checks still pass (T-037's, unaffected).
  **28/28 + 28/28 runtime checks** — the suite loads the **real** `tokenStore.ts` and `config/api.ts`
  through babel with only React Native's edges stubbed, so nothing is re-implemented and a bug in the
  shipped code fails the script. It covers: `exp` decoding incl. the **non-ASCII regex fallback**;
  unknown/missing `exp` never counting as expired; **10 concurrent callers → exactly ONE refresh**;
  the rotated refresh token being persisted; a **stale caller token not re-rotating**; a rejected
  refresh clearing both tokens and firing `authLost` **once**; a **network failure doing neither**;
  and a pre-T-038 install (no refresh token) attempting no request and keeping its session.
  Scripts: `scratchpad/refresh-check.js`, `scratchpad/api-i18n-check.js`.
- [ ] 7. **Owner: deploy the API FIRST, then rebuild both apps.** Then: log in, wait >15 min (or set
  `JWT_EXPIRES_IN=1m` on test3 to make it quick), use a screen, confirm **no error and no logout**;
  kill and reopen the app; confirm a deleted account still logs out.
- [ ] 8. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/middleware/auth.ts` · `adminAuth.ts` · `src/i18n/**` (new `auth.*` keys)
- `{user,driver}-app-standalone/config/api.ts` — refresh-aware `getHeaders`
- **NEW** `{user,driver}-app-standalone/utils/tokenStore.ts`
- `{user,driver}-app-standalone/contexts/AuthContext.tsx` — persist + clear the refresh token
- `user-app-standalone/api/users.ts` — the one bypass
- ❌ **No migration. No change to `JWT_EXPIRES_IN`** (owner decision 1).

## Risks / open questions (READ before coding)
- ⚠️ **`rotateTokens` revokes the old refresh token.** Concurrent refreshes = a spurious logout. The
  in-flight promise is the fix and must be tested, not assumed.
- ⚠️ **Import cycle** `config/api.ts` ↔ `api/auth.ts`. Metro will not always error — it can hand back
  `undefined` at runtime instead. Keep the refresh call in its own module.
- ⚠️ **Do not break OR-002** (T-012). A deleted account must still log out immediately; only the
  *expired token* case gets the new second chance.
- ⚠️ **The server's revoked-token list is an in-memory `Set`** (`utils/jwt.ts`), so an API restart
  forgets every revocation. Out of scope here — **board it** rather than fix it in this card.
- ⚠️ **Every user will be logged out once** when this ships: existing installs hold no refresh token,
  so their next expiry still ends the session. Unavoidable, and worth telling testers.
- ⚠️ **T-037's code is uncommitted in the same working tree.** Do not mix the two in one commit.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up permission-prompt changes — **keep it out of commits.**

## Session notes (one line per work session)
- **2026-08-08** — card created from the owner's device screenshot. Root cause traced end to end
  before any code: the refresh token is destructured and thrown away in both apps, and
  `refreshAccessToken` has never had a call site. Owner chose the real fix over raising the TTL.
  **Steps 1-6 all done the same session.** Both apps finished one `tsc` error *below* baseline,
  because the never-awaited `getHeaders` in `logout` was itself a baseline error. The runtime suite
  (28 checks, run against both apps' real modules) is the part worth keeping — the mutex and the
  stale-token re-read are not reviewable by reading.

## Resume point (for the next chat)
**Steps 1-6 DONE. Only step 7 (owner: deploy + device test) and step 8 (commit) remain.**

**What now happens:** every sign-in stores the refresh token; `getHeaders` — which every
authenticated call already awaits — swaps a spent access token for a fresh pair behind one in-flight
promise; only a refresh the **server rejected** ends the session; and the API's 401s are translated.

**Three defects surfaced that were not in the original diagnosis:**
1. **A stale caller token would have re-rotated on every request.** Screens keep the token they were
   handed at sign-in, so after one refresh every caller's copy is stale forever. `ensureFreshAccessToken`
   re-reads storage before deciding to refresh. Without this the mutex alone would not have saved it.
2. **`logout` never revoked anything, in EITHER app.** `headers: getHeaders(token)` was not awaited,
   so `headers` was a `Promise` and the request carried no `Authorization`; the refresh token was
   never sent either. It now calls `AuthAPI.logout(token, refresh)` — which already did both
   correctly and had **zero callers**.
3. **`adminAuth`'s catch rewrote every failure as "Invalid or expired token"**, so its specific
   messages had never reached the admin panel at all.

⚠️ **Tell the testers: everyone gets logged out ONE more time.** Existing installs hold no refresh
token, so their current session still ends at its next expiry. After that, sessions last 7 days.

🛑 **Nothing has run on a device or against the live API.** ⚠️ **Deploy the API FIRST** — the apps
are harmless against the old API, but the translated 401s only appear once it ships.
💡 To test in minutes rather than 15, set `JWT_EXPIRES_IN=1m` on test3 first, then put it back.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
