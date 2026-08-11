# 📔 JOURNAL — daily diary (newest on top)

> Claude writes ONE entry per `/end-day`. Keep entries short — this is for a
> human to quickly remember what happened, not a full report.

---

## 2026-08-11 (3) — seven cards in one run, and the recurring lesson was about my own checks

- **Task:** clear everything that was actually buildable, with device testing batched at the end at
  the owner's request. **T-049, T-050, T-051, T-052, T-053, T-024, T-034, T-043, T-045.**
- **Done:**
  - **T-024** closed the passenger↔driver loop — the passenger can finally answer the drivers who
    offered. It also closed **T-044's known compromise**: `driver_join_request` now routes exactly,
    because the new screen takes the same entity id the payload carries.
  - **T-034 (P1 security)** — OTP codes, the Eskiz bearer token, whole user rows and push tokens are
    out of the logs; phone numbers are masked. And the brute-force cap **fires for the first time**.
  - **T-043** removed the root cause behind T-042's launcher crash — both public endpoints now share
    one mapper instead of disagreeing about the same object.
  - **T-045** — every ride notification is now recorded. Before, `createNotification` had **one
    caller in the entire API**.
  - Plus **T-049** (i18n), **T-050** (wordmark), **T-051** (tab refetch + ordering), **T-052/T-053**
    (dead login/register code deleted).
- **Decisions (owner):** delete the leaking logs rather than gate them; fix the OTP cap without
  changing the code length; build both halves of T-045 and **write the notification row even when
  the push fails**; entry point for T-024 = the existing driver-count row; accept behind a dialog
  naming the consequence.
- **Problems — and the pattern is uncomfortable:** three times today **my verification was wrong
  before the code was**. A regex ran past a Set literal and "found" `center` and `700` as event
  types. A suite crashed instead of reporting red, twice, hiding the very gap it existed to measure.
  And a `\b` mangled by shell escaping failed 14 checks against perfectly good code.
  **A check that cannot fail cleanly proves nothing, and one that fails wrongly sends you hunting a
  bug you invented.** I caught all three only because the results looked implausible — which is not
  a method. The habit that actually worked was running every suite against the **pre-change** code
  and demanding red.
- **The other recurring theme: copying a neighbouring line copies its bugs.** T-024 reproduced a
  wrong `getErrorMessage(error, t('key'))` call by imitation — the second parameter is the `t`
  *function*. `tsc` caught it; the suite never would have.
- **Deleting dead code twice REDUCED the error count** (user 11→10→9): both `login()` and
  `register()` were carrying real type errors nobody could ever reach. Good evidence they were
  genuinely dead, and a reminder that a baseline error count can hide inside unreachable code.
- **Lint:** `npm run lint` in the API still fails as **T-032** documents — **28,575 errors, almost
  entirely `␍` CRLF noise** on Windows, which drowns everything real. Filtering that out, the four
  files I touched hold **17** genuine findings vs **16** before: I introduced two `no-explicit-any`,
  fixed one, and **deliberately kept** the other — a single-line `as any` for Sequelize includes the
  model type does not carry, matching what the original inline mapper did.
- **Next:** the owner deploys and device-tests. **THREE cards share one API deploy** (T-034, T-043,
  T-045 — no migration in any). Both apps need rebuilding. Then **T-047** (killed-app tap) needs a
  `logcat` line before I write another word of it — I have mis-diagnosed that path twice.
- **Commit:** proposed below; not committed.

---

## 2026-08-11 (2) — a device day: two fixes, two closures, and one bug I have now mis-diagnosed twice

- **T-046 shipped and half-worked.** The server no longer abandons drivers' bids when a passenger
  cancels (they stay `pending` forever otherwise), and a **foreground** push now shows a tappable
  toast instead of being logged and dropped. Owner confirmed both: open and background pushes route
  correctly. Committed `892d306`.
- 🔴 **The killed-app tap still lands on the main menu, and my fix was not the cause.** I found a
  genuine race — `flushPendingNotification` **discarded** the parked tap when navigate failed, while
  `goOrPark` **re-parked** it; two halves of one mechanism disagreeing. 14 red against the committed
  code proves that bug was real. **It was also not (all of) it.**
  **That is twice I have diagnosed this path from the source and been wrong.** The honest lesson:
  when a bug survives a confident fix, the next move is *evidence from the device*, not another
  read of the same files. The card now demands a `logcat` line before any further code.
- ✅ **T-048 closed as not-a-defect** — the owner's own retest showed pushes *do* arrive when the app
  is killed. Worth keeping: it rules out delivery for good, so every future notification bug on this
  project is a **routing** bug until proven otherwise.
- ✅ **T-031 item 1 closed as working-as-designed, after two rounds of investigation.** "Can't select
  seats" was the seat steppers correctly disabling themselves because a **salon option was ticked** —
  booking the whole car makes a per-seat count meaningless.
  **The uncomfortable part: the code was right and the screen still misled its own author.** The
  control that causes the lock sits *below* the controls it disables, and nothing explains why they
  went grey. The owner hit it, I hit it while planning, and both of us called it a bug.
  ⚠️ **The owner declined the fix** ("works fine"), which is their call — but the diagnosis is now
  written into the card so a third report gets answered in seconds instead of another investigation.
  **A correct implementation that reliably produces bug reports is still a design defect**; it just
  is not an urgent one.
- **T-049: the reported string was one of nine.** *"passenger needed so many"* was hard-coded English
  on the offer card. Sweeping the screen turned up **8 more** untranslated toasts — all in geo-picker
  error paths, which only fire on a failure or an out-of-order tap. The happy path was fully
  translated, so the screen looked finished. **Fixed the class, not the instance** — that is the
  T-042 lesson applied on purpose this time. 21/21 keys evaluated across uz/ru/en.
- **Boarded, not started:** T-050 (the "UbexGo" wordmark wrapping mid-word — rendered in 8+ screens,
  so it needs one shared treatment or it drifts straight back; likely a large system font size on the
  owner's phone) and T-051 (swiping between tabs refetches the whole list).
- **Next:** the logcat line for T-047. Everything else is boarded and can wait.

---

## 2026-08-11 — T-044 and T-042 close on a device. Two cards off the board, one commit.

- **Owner device test passed on both counts.** *"push opens exactly page thats solved"* and
  *"opening a passenger order detail's crash also solved"*. **T-044** and **T-042** are done
  end-to-end, committed as `55718f6` "push navigation".
- **Both went into ONE commit**, though the plan explicitly asked to keep them separate, and
  `.claude/settings.json` was swept in for the **fourth** time (T-033, T-036, T-040, now this).
  No harm — both cards were confirmed in the same test, so the commit is not lying about what was
  verified. But *"keep the commits separate"* has now been written into a plan and not survived
  contact three times running. **A rule nothing enforces is a wish.** If commit hygiene actually
  matters here, it needs a pre-commit hook, not another line in a plan file.
- **What the two cards leave behind, and it is the same lesson twice:** a stale comment was the
  proximate cause of *both* defects. T-042's crash came from a type doc-block asserting that two
  endpoints returned the same shape (they do not); T-044's four dead-ended notification types came
  from a comment saying *"there is no screen for these yet"* long after T-037 built one.
  **Comments assert facts about other files and nothing ever checks them.** Both were fixed
  structurally rather than by editing the prose — `passenger` is now optional so the bare read fails
  to compile, and the route table is asserted against route names parsed from the real
  `MainNavigator`. That is the only kind of fix that holds.
- **T-037 is NOT closed, and it would be easy to think it is.** Its device test failed *on T-042's
  crash*, so clearing that unblocks it — but only the browse → details path has ever been walked.
  The **join sheet** and **`MyJoinRequestsScreen`** have still never been opened on a phone, and
  T-037 found **three** defects in never-executed code the first time it was looked at. The risk
  there is unchanged; only the obstacle to testing is gone.
- **Board state:** *Now* is effectively empty. T-031 is the only card left there and it is blocked on
  an owner answer (was a salon option ticked?). The cheapest win available is finishing T-037's walk
  on the build already installed; the most valuable next build is **T-024**, which T-044 proved is a
  real user-facing hole — a passenger gets told "a driver wants your trip", taps the push, and lands
  on a list with nothing to answer.
- **One question resolved, and the answer was "working as intended".** The owner asked whether a
  driver re-entering a passenger order and finding **nothing to do but read** was normal. It is —
  the driver app's detail screen is read-only *because the bid is the action*, and since T-042 ③ the
  footer reports the bid's real status instead of re-offering the button. Worth recording because
  the question spanned two apps and the answers are opposite: **read-only is correct on the driver
  side and a genuine defect on the passenger side** (T-024), where someone is told a driver wants
  their trip and has no way to answer.
- **Next:** owner picks — finish T-037's walk, unblock T-031, or start T-024.

---

## 2026-08-10 (3) — T-044: the push plumbing was fine; the destinations were the bug

- **Owner:** *"any notification on click should open that exactly page or screen in both apps."*
  The first useful finding was what **not** to build: the tap plumbing is already complete and
  careful in both apps — handler, a `pendingTarget` park for taps arriving before the navigator
  exists, flush on navigator-ready **and** on auth change. Cold start and pre-login were solved.
  **The gap was one function: the destination table.**
- 🔴 **The driver app was one stale comment away from working.** Four types fell through to the
  generic list under *"there is no screen for these yet (T-023/T-024)"* — but **T-037 built
  `MyJoinRequests` and registered it**. The code was correct when written and quietly wrong ever
  since. That is now twice this week a stale comment has been the proximate cause of a defect
  (T-042's crash was the other), which is a pattern worth naming: **comments assert facts about
  other files, and nothing checks them.**
- **The trap that justified planning first.** `offer_id` means **two different entities**. For the
  passenger's booking notifications it is a **DriverOffer** — safe to open in `OfferDetails`. For
  `driver_join_request` it is the passenger's **own PassengerOffer**, and `OfferDetailsScreen`
  fetches `OffersAPI.getOfferDetails` → a *driver* offer. Routing "a driver wants your trip" to
  `OfferDetails` would have fetched a **wrong row or a 404 and presented it as the user's own trip**.
  It was the most tempting deep-link on the board and it had to be left on the list until T-024.
- **Two things bigger than the plan assumed.** Both `navigate()` call sites passed only
  `target.screen`, so params would have been **silently dropped on the parked cold-start path** even
  with a perfect mapper — the exact case (tap while the app is dead) that matters most. And the user
  module's header comment asserted *"every destination is a param-less route"*, which this change
  falsified; corrected immediately rather than left to rot into the next T-042.
- **The check that earns its keep:** every destination is asserted against route names **parsed out
  of each app's real `MainNavigator` source**, not a hand-typed list. A renamed route now fails the
  suite instead of passing while the app navigates nowhere. **11 red against the pre-change files**
  proves it measures the gap rather than agreeing with the new code.
- **Scoped down deliberately.** Two blockers found while investigating were split out rather than
  absorbed: **T-045** (the in-app list navigates nowhere — and, far worse, `notifyDriver`/
  `notifyPassenger` **never persist a row at all**, so a missed push leaves no record anywhere) and
  **T-024** (the passenger's "drivers who offered" screen).
- **Next:** owner rebuilds both apps and taps a real push of each kind. No API deploy.

---

## 2026-08-10 (2) — T-042: the same bug in the screen the sweep skipped, then the layout behind it

- **The owner's T-037 device test half-passed.** Driver search **finds** passenger orders — the
  T-037 wiring works. But tapping *"Details"* **killed the app to the phone's home screen**.
- **Cause: `offer.passenger.name`, one line.** Two endpoints under the **same**
  `/public/passenger-offers` prefix return **different shapes**. The browse list is hand-mapped and
  ends in `passenger: {id, name}`; the detail (`getOfferById`) does `return offer` — the **raw
  Sequelize model**, whose include is aliased **`as: 'user'`**. So `passenger` was `undefined` and
  `.name` threw **during render**, where RN has no error boundary. Hence a hard process death rather
  than an error screen — the symptom that made it look catastrophic.
- 🔴 **The uncomfortable part: T-037 already found and fixed this exact bug, and I missed a screen.**
  On 2026-08-08 the same mismatch was traced for `GET /driver/join-requests` and a helper was
  written for it — `passengerNameOf`. It was applied to the **one screen observed failing**, not to
  every screen reading that field. Two days later the untouched screen crashed on a device.
  **A fix applied to the observed instance instead of the class is a half-fix**; the search should
  have been "who else reads `.passenger`" the moment the shape mismatch was understood.
- 🔴 **A comment caused the bug.** The type's doc block asserted the `public/*` browse **and detail**
  endpoints both build the mapped shape. Only the browse does. Whoever wrote the detail screen —
  me — read that and used a bare `.name` with confidence. **A wrong comment is worse than none.**
  It is corrected, and the fix is now structural: `passenger` is **optional** on the type, so a bare
  `.passenger.name` no longer compiles.
- **The type was lying in the same direction.** `passenger` was declared **required** while the
  server frequently does not send it. TypeScript then actively certified the crashing line as safe.
  Marking it optional is not defensive padding — it is the type finally matching reality.
- **Swept the whole app this time**, which caught `SearchPassengerOffersScreen:560` doing the same
  bare read. It works *today* only because the list happens to carry the mapped shape — a latent
  copy of the same crash, now closed.
- **Owner decided app-side only** (driver rebuild, no API deploy) — the shape mismatch is the real
  root cause but `getOfferById` is shared with the passenger app and T-040's edit flow, so changing
  it needs its own testing pass. Logged as **T-043** rather than smuggled into a crash fix.
- **12/12 runtime checks, and the crash is reproduced** against the old expression
  (`TypeError: Cannot read properties of undefined`) — the check can fail, which is the only reason
  its passing means anything. **18/18** i18n keys evaluated across uz/ru/en. `tsc` driver
  **35 = baseline**, proven by stashing.
- **Then the layout, same screen, same session.** The owner: *"the list merges with the
  search country/city card"*. 🔴 **The screen had two independent scroll surfaces** — a `ScrollView`
  with **`maxHeight: 270`** holding the picker, as a **sibling** of the `FlatList`. The card could
  never scroll away, so it ate ~270px forever; and because the picker and the offer cards use the
  **same white / radius-20 / shadow**, they read as one continuous sheet right at the seam.
  The `FlatList` had no `flex: 1` either, so the two fought over the remaining space.
- **Fixed by making it ONE scroll surface** — the picker became `ListHeaderComponent`, so it slides
  away and the results get the whole screen. **The "merging" was a symptom of the structure, not of
  the styling**; a divider alone would have papered over a card that still stole a third of the
  screen forever. The seam got a labelled break too (`{count}` orders + rule), and the picker a
  slightly stronger shadow so it reads as sitting *above* the results rather than being one of them.
- **A stale style nearly shipped with it:** `emptyContainer` was `flex: 1` + `paddingTop: 80`, sized
  for when it filled a bare container. Inside the list, under a header, that pushed the empty state
  off the bottom on small phones. Moving a block between containers invalidates its layout
  assumptions — worth checking every time, not just when something looks wrong.
- **Third find, and the owner's question was the right instinct:** *"driver sends a request, re-enters
  the offer, and can send again — is that normal?"* No. ✅ **The server was never at risk** —
  `joinOffer` refuses duplicates with a translated 400. **But the app offered an action that could
  not succeed:** the footer read a local `joinSent` boolean that reset to `false` on every mount, so
  re-entering brought the green CTA back and the driver re-typed seats and a price before being
  refused. For `rejected`/`cancelled` — **permanent** refusals — it was a dead end, not a wasted trip.
- **The interesting constraint:** the detail payload *cannot* answer "did I already apply?", because
  the offer's `drivers` list is deliberately **owner-only** — rival bids (name, plate, price) are
  none of a driver's business. That gate is right, so the answer came from
  `GET /driver/join-requests`, which returns only the driver's own rows. **The privacy rule shaped
  the fix instead of being weakened by it**, and no API change was needed.
- **Same class of bug as the crash, one layer up:** local component state standing in for server
  truth. `joinSent` was a *guess* about what the backend knew, and like every guess it was wrong the
  moment the screen remounted. The banner also had to split by status — one green "sent" for all
  four would tell a **rejected** driver their offer was still live.
- **Next:** owner rebuilds the driver app and re-walks T-037 — the join sheet and
  `MyJoinRequestsScreen` are still unreached, so their never-executed code is still unproven.

---

## 2026-08-10 — T-041 CLOSED on a device: the session survives. T-038 closes with it.

- **The owner device-tested and the refresh-token issue is resolved.** Committed as `0ccde30`.
  T-041 is done end-to-end, and **T-038 closes with it** — T-041 was repairing the mechanism T-038
  built, so one device test settles both. Two cards leave the board; the *Now* section drops to one.
- **What actually made the difference — two defects, and the card needed both.** Fixing either alone
  would have left the owner logged out:
  1. **The apps over-reacted.** `performTokenRefresh` treated **any** non-`ok` as "the session is
     over" — clearing both tokens and firing `notifyAuthLost()`. A 429 did it. A transient 5xx did
     it. So did a **200 whose body the app could not parse**. Only **401/403** does now.
  2. **The server made that fire constantly.** `/auth/refresh`, `/auth/logout` and **`GET /auth/me`**
     shared one **20-per-15-min** budget — and `/auth/me` runs on **every app launch**, with both
     apps on one phone counting against the same key.
- **The deeper bug was the limiter *key*, not the number.** Raising 20 to 60 would have hidden this
  through the test session and then reappeared in production: the budget was keyed on **IP**, and a
  mobile carrier NAT puts thousands of real users behind one. The new `refreshLimiter` (30/15min)
  and `sessionReadLimiter` (120/15min) key on the **user in the token** via `tokenSubjectKey`, which
  decodes (never verifies) — safe, because it only picks a counter and grants nothing.
- **The 8/8 limiter check tested the claim the fix rests on**, not the limiter: user A blocked at
  exactly #31, **user B on the same IP unaffected**. An assertion that "the limiter limits" would
  have passed against the broken per-IP version too.
- **Proving the suite could fail was worth more than the 98 green checks.** Stashing the two app
  files turned **32 of them red** — so the matrix reproduces the owner's actual bug rather than
  merely agreeing with the new code. The T-038 suite had been 28/28 green and still missed this,
  because it only ever simulated a **401** — the one status that was already handled correctly.
- **Recurring lesson, third time this week:** the bug was in the branch nobody had executed. T-037's
  three defects, T-038's `logout`, and now the non-401 refresh path — all code that existed, looked
  right, and had never run.
- ✅ **Owner reviewed the two numbers I had chosen (30 and 120) and decided to keep them** — with
  per-user budgets a real user will not trip them. Settled, not to be revisited; they are two
  literals in `rateLimiter.ts` if a 429 ever shows up in a user report.
- **Next:** no active task. The owner's device tests continue on **T-037 · T-039 · T-040**
  (and further back T-033 · T-030 · T-027 · T-025); **T-031** is the only card left in *Now*.

---

## 2026-08-08 (2) — device testing turned into five cards; the pattern was "the backend was already done"

- **Task:** the owner device-tested and reported four things. Four cards came out of it —
  **T-037** (driver can't reach passenger orders), **T-038** (everyone logged out after 15 min),
  **T-039** (an order the passenger sees as "Faol" is invisible to drivers), **T-040** (a passenger
  can't edit an order) — plus **T-041**, opened at the very end and still unresolved.
- **The recurring shape of the day:** in T-037, T-039 and T-040 the **backend was already complete
  and correct**, and the app simply never called it. `SearchPassengerOffersScreen` was 1000 lines,
  fully built, and **registered in no navigator**. `joinPassengerOffer`, `getMyJoinRequests`,
  `cancelJoinRequest`, `updatePassengerOffer` all had **zero call sites**. The work was wiring, not
  building — but the defects hiding in never-executed code were real.
- **T-037 — three defects in code nobody had ever run:** the three authenticated calls in
  `api/passengerOffers.ts` called `getHeaders()` with **no token**, so they sent no `Authorization`
  header and would have 401'd every time; `offer.passenger` **does not exist** on
  `GET /driver/join-requests` (that endpoint returns the raw model with `offer.user`; only `public/*`
  builds the mapped shape), so the list would have crashed on every row; and three keys existed in
  **uz only**.
- **T-038 — the worst find of the day.** The refresh token was destructured out of every login
  response in **both** apps and **thrown away** — no storage key existed — and `refreshAccessToken()`
  had zero call sites. With a 15-minute access token, **every session died after 15 minutes** and the
  next app start logged the user out through the OR-002 "account deleted" branch. Fixed at the
  `getHeaders` choke point (one function per app, not a per-call-site wrapper), behind a **single
  in-flight promise** — mandatory, because `rotateTokens` revokes the old refresh token on use.
- **The trap inside that fix:** screens keep the token they were handed at sign-in, so after one
  refresh every caller's copy is stale **forever**. Without re-reading storage before refreshing,
  every request would have rotated a token. The mutex alone would not have saved it.
- **T-039 — my first hypothesis was wrong, and the correction mattered.** I proposed that "urgent"
  orders were the cause (they stamp `start_at = now` and are filtered by `start_at >= now`). The
  owner's screenshots disproved it: `departDate`/`departFrom` both default to **now + 1 hour**, so a
  default-accepted order created at 12:23 lands on 13:23 — an ordinary order that had simply expired.
  The urgent bug is real but was **not** what they hit.
- **Sweeping for the same shape paid off twice.** T-039's grace window would have swapped one lie for
  another: `OfferDriverService.joinOffer` carried the identical `start_at < now` guard, so a driver
  would have been shown a card and then refused it with "this trip already started". T-038's
  `adminAuth` catch rewrote every failure as "Invalid or expired token", so translating its specific
  messages alone would have changed nothing.
- **Two `logout` implementations never revoked anything** (both apps): `headers: getHeaders(token)`
  was **not awaited**, so `headers` was a `Promise` and the request went out with no `Authorization`;
  the refresh token was never sent either. Harmless while the refresh token was discarded — not now.
  Fixing it took **both apps one `tsc` error BELOW baseline**, because that un-awaited call was
  itself a baseline error.
- **Decisions (owner):** fix the session properly rather than raising `JWT_EXPIRES_IN`
  (🚫 **do not touch it, even for testing**); a **3-hour** grace window with urgent orders under the
  same rule and no special case; expired orders shown as expired to the passenger; **full** order
  editing by reusing the create screen; and warn-but-keep when drivers have already offered.
- **Problems / carry-forward:**
  - 🛑 **T-041 is open and was interrupted mid-investigation.** The owner deployed T-038, rebuilt
    both apps, and is **still logged out**. Confirmed working: the deploy is live (the 401 now reads
    the translated "Sessiya muddati tugagan"), the server returns `refresh`, and the app persists it.
    **Hypothesis A:** the expected one-time transition — a pre-T-038 session has no refresh token on
    disk, and **rebuilding does not clear AsyncStorage**, so the owner must log out and back in once.
    **Hypothesis B — a real defect either way:** `performTokenRefresh` treats **any** non-`ok` as
    "session over", but `/auth/refresh` sits behind `authLimiter` (**20 / 15 min**), so a **429 —
    or any 5xx — destroys the session**. Only 401/403 should. The runtime suite missed it because it
    only ever simulated a 401.
  - ⚠️ **T-040 collides with T-031** in the same 757-line file; T-031's remaining steps must build on
    the edit-mode version.
  - ⚠️ **Nothing from T-037/T-040 has run on a device**, and T-039/T-040 both need the API deployed.
  - ⚠️ `npm run lint` still fails instantly in **both** apps (eslint 9, no flat config) — **T-032**.
- **Verification (honest):** `tsc` API **282 = baseline** · admin **0 = baseline** · user **11** ·
  driver **35** — the two apps sit **one below** baseline on purpose (the logout fix). Every error
  inside a touched file was proven pre-existing, against `HEAD` while the tree was dirty and via
  `git stash` once it was clean. Runtime suites: **28+28** (refresh mutex, boundary and failure
  modes, run against both apps' real modules), **32** (T-039 drift and boundaries), **125** (T-040
  field completeness across all 40 sendable fields), **18** (API auth messages), **360** driver i18n.
  ⚠️ **The T-040 check flagged 4 and 3 were the check being wrong** — verified before dismissing.
- **Next:** **T-041 first** — ask the owner whether they re-logged-in, and fix the 429/5xx defect
  regardless. Then the device tests for T-037/T-039/T-040.
- **Commits:** the owner committed throughout — `1fb673b`, `9447bdf`, **`c940940`** (T-037/38/39)
  and **`6b84aaf`** (T-040). Only the docs are left for this entry.
  ⚠️ **`.claude/settings.json` was swept into `6b84aaf` again** despite the standing note to keep it
  out. That is the fourth commit it has ridden along in.

---

## 2026-08-08 — first real device test; one bug exposed a dead error pipe, then all 33 modals got one shell
- **Task:** the owner started **device testing**. Two cards came out of it: **T-033** (OTP resend
  error) and **T-036** (modals must match the Figma). Both implemented end to end.
- **T-033 — the reported bug was the smallest part.** Resend inside 60s showed a generic
  "OTP yuborishda xatolik". The 60s per-phone cooldown is *correct* and was the cause — but it threw
  a bare English `Error`, so the controller's catch-all returned **HTTP 500** for a routine refusal.
  ⚠️ **The real find:** `handleBackendError` is written for **axios** (`error.response.status`) and
  **neither app imports axios** — both use `fetch`, which never sets `.response`. The entire status
  switch was dead code, so **12 screens had never shown a server message**. Fixed with an `ApiError`
  carrying `status`/`data`/**and** `response`, because attaching an axios-shaped `.response` turned
  out to be *already* this codebase's convention (`passengerOffers.ts` ×5, `driver.ts`, both
  `auth.ts` do it by hand) — so nothing existing had to change.
  Also: all five express limiters answered **plain text**, which `response.json()` turned into
  `JSON Parse error`; and the resend link had no cooldown UI at all.
- **T-036 — 33 modals, 22 files, three patterns.** No shared modal component existed: every site
  re-declared its own backdrop, radius and palette, across two animation conventions, with emoji
  glyphs (`🔍` `✕` `✓`). Now one `AppModal` + `ModalList` (+ optional multi-select) +
  `DateWheelModal`, **byte-identical across both apps**, plus adapters. The look lives in **one token
  object per app**, so restyling is 2 files, not 33.
- **Duplication collapsed rather than migrated:** 3 identical country pickers → 1; 2 identical date
  wheels **and their generators** → 1; 7 driver geo pickers → 1.
- **The judgement call worth remembering:** I did **not** move the driver's date pickers onto
  `DateWheelModal`. It runs 1900→today for birth dates; the driver's generators enforce
  **future-only** dates and hours. Swapping would have dropped the past-date guard **silently** —
  no compile error, no visible symptom until a driver posted a trip in the past. They got the
  chrome only, bodies untouched.
- **Two of my own numbers were wrong and had to be corrected mid-task:**
  1. "24 modals" → actually **33**. I had counted driver *files* (11) instead of instances (20).
  2. The search-filter panel was inventoried as a *list picker*; it is a multi-section panel, so it
     took `AppModal` directly instead of `ModalList`.
- **The i18n check earned its keep — 15 real misses on the first run.**
  `phoneRegistration.selectCountry`, `driverLicense.selectCountryCode` and
  `offerWizard.select{Country,Province,City}` were referenced but had **never existed**; three were
  hidden behind `|| 'hard-coded Uzbek'` fallbacks, so ru/en would have rendered raw key names.
  The driver app was also missing a whole `searchPassengerOffers` block.
- **Decisions:** (1) `otpSendLimiter` **stays at 5/hour** — legible now, that's enough, do not
  revisit; (2) T-036 scope = **both apps, every modal**; (3) the shell is **derived** from the
  Shablon/Tanlov overlays, since no Figma exists for the pickers themselves.
- **Problems / carry-forward:**
  - 🛑 **Nothing has run on a device or a live API.** Both cards await the owner's phone.
  - ⚠️ **`34988cc` mixes unrelated work into the T-036 commit** — `PassengerOfferService.ts` (478
    lines), `CreatePassengerOfferScreen.tsx` (757), `TimeWindowCard.tsx`, `CHECKLIST.md`,
    `PLAN-T018.md`. Looks like in-progress T-031/T-018 work swept in. Not reverted; flagged.
  - ⚠️ **`.claude/settings.json` was committed in BOTH commits** despite the standing note to keep
    it out.
  - ⚠️ An **unrelated stash** exists: `stash@{0} WIP on (no branch): 3eead5e db connection problem`.
    Predates this session; left untouched.
  - New card **T-035** (duplicate `errors:` blocks — driver `uz` has one, ru/en have two, so five
    keys resolve in Uzbek only). **T-034** still open (OTP codes + Eskiz token in plaintext logs;
    brute-force counter that never fires).
- **Verification (honest): `tsc` exactly at baseline throughout** — API **282** · admin **0** ·
  user **12** · driver **36**, every in-file error **proven pre-existing via `git stash`**.
  **42/42 + 17/17** checks on T-033 (i18n, and the real error path run against the exact envelope
  the API emits); **129/129** i18n on T-036. Zero bare `<Modal>` outside `AppModal.tsx` in either app.
- **Next:** the owner rebuilds both apps and walks the modals — riskiest first: multi-select
  stop/city pickers, driver date/time limits, USER_NOT_REGISTERED, and the rating/detail sheets
  whose action buttons stayed in the body.
- **Commits:** owner committed twice — `6b691ab` (T-033) and `34988cc` (T-036).

---

## 2026-08-02 (4) — four cards in one day; two audits proved the owner right, and three of my own conclusions wrong
- **Task:** started the day on T-025 bookkeeping, then **T-026A** (offer concurrency), then three
  owner batches arrived back-to-back — **OR-010 → T-027**, **OR-011 → T-030**, **OR-012 → T-031**.
- **T-026A — overbooking.** `confirmPassenger` read `seats_free`, checked it, then wrote it back with
  nothing in between: two concurrent confirms both passed and **4 seats sold on a 2-seat offer**.
  Also nothing enforced a single front seat, and a driver could confirm onto a **cancelled** offer.
  One mechanism closed all four: `sequelize.transaction()` + `lock: tx.LOCK.UPDATE` on the offer row.
  ⚠️ **The lock had to be on the offer row ALONE** — Postgres refuses `FOR UPDATE` on the nullable
  side of an outer join, which is exactly what Sequelize emits when `lock` meets `include`. The
  obvious implementation would have been a **production 500**, not a compile error.
- **T-027 — OR-010, seven user-app fixes.** Three needed **no backend work at all** because the API
  already had what they needed and nobody had wired it up. The push tap was the opposite: **no tap
  handler existed in either app**, so a tapped notification had never done anything but cold-open
  the app. That needed a parked-intent queue — on a cold start the tap fires before the navigator
  exists, and the destination screens do not mount until the user is authenticated.
- **T-030 — OR-011. The audit was the valuable part.** The owner said photo uploads work and asked
  me to check. **They were right.** Uploads are fine; the break is on the way *back* — the server
  returns a host-less `/uploads/...` and every screen hands that straight to `<Image>`, which needs
  an absolute URL. It looked fine right after picking because the screen shows the **local file**.
  The admin panel had already solved this correctly, so I copied its helper instead of inventing one.
- **Three of my own conclusions had to be corrected mid-task.** Worth recording, because each was
  stated confidently before being checked:
  1. "10 photo fields across 4 screens" → actually **18 across 5**; my first sweep grepped for the
     wrong string and missed `DriverVehicleScreen` entirely.
  2. "Use `maximumDate`/`minimumDate`" → **impossible**: these screens hand-roll their pickers, which
     is *why* those props appear nowhere in the app. The limits had to go into the generators.
  3. "`fetchGeoSettlements` is dead code" → it was **already wired**; what was missing was mahallas.
- **Decisions:** (1) payment becomes `payment_cash` + `payment_card` booleans plus a **separate**
  `paid_by_friend`, keeping `payment_type` for one release so already-installed apps do not lose
  data; (2) the waiting fee becomes an **admin setting**, not a passenger input, and waiting time
  stays **stored but uncounted** — the owner was explicit it exists only to keep passengers punctual;
  (3) OR-012 item 1 is a **bug in the existing gender picker**, not a request for seat-position
  shifting; (4) OR-011 item 3 **deferred** by the owner.
- **Problems / carry-forward:**
  - 🛑 **T-030 step 7 is blocked**: the driver's address cascade is *already* complete, so "pull the
    base I gave" is most likely **empty dropdowns = a data problem in the admin Excel upload**, which
    cannot be checked without the DB.
  - 🛑 **T-031 item 1**: no defect found in `SeatStepper`/`GenderPickSheet`. Strong suspect is
    `seatsLocked = salonScope !== null`, which disables both steppers **with no on-screen reason**,
    from checkboxes drawn *below* them. Needs the owner's repro.
  - ⚠️ **`npm run lint` is broken in both RN apps** — eslint 9 with **no config file at all**. The
    API's does run: 26,273 problems, ~all `␍` CRLF noise. Logged as **T-032**.
  - **T-027's migration has still never been run**, and the app already sends `referral_phone`.
  - New follow-ups logged, not absorbed: **T-028** (`MainStackParamList` lists 3 of 9 routes, so the
    whole user app navigates via `(navigation as any)`), **T-029** (mahalla stored as text only).
- **Verification (honest): nothing ran on a device or a DB all day.** `tsc` held at baseline on all
  four projects through every card (API **282** · admin **0** · user **12** · driver **36**), with
  every in-file error **proven pre-existing via `git stash`**. 29/29 + 30/30 + 21/21 runtime checks
  on pure functions and i18n keys. **Ten cards now await the owner's phone.**
- **Next:** the owner's two answers (T-030 step 7, T-031 item 1), then **one testing session** — run
  T-027's migration, deploy, rebuild both apps once, and walk the backlog rather than adding to it.
- **Commit:** owner committed three times — `7119daa` (T-026A), `24ad170` (T-027), `9ab9b2c`
  (T-030 + T-031 items 2/3/7). Working tree clean.

---

## 2026-08-02 (3) — two offer audits, T-025 created, seven fixes; one root cause behind five bugs
- **Task:** Owner: "check driver app create offer logic both in frontend and backend, there should
  not be any unexpected error" — then the same treatment for the passenger-connection leg.
  Two end-to-end audits, then a new card (**T-025**) and steps 1–7 of it.
- **The single root cause worth remembering:** `price_per_seat` / `front_price_per_seat` are
  `DECIMAL(10,2)`, pg returns numeric as a **string**, and nothing overrides that
  (no `setTypeParser` anywhere in the project). Arithmetic (`*`, `-`) coerces and is safe, so this
  hid for months — but **`<` and `>` between two strings are lexicographic**, and
  `"12000.00" < "5000.00"` is `true`. That one fact caused three separate user-visible bugs in
  three different files, in both the API and the user app.
- **Audit 1 — driver create-offer (16 findings).** Worst three, all fixed:
  1. **Editing any offer with a front-seat price 400s.** The string comparison above, in
     `DriverOfferService.validateOfferData`. Any offer whose front price has more digits than the
     base (60000 vs 5000 — the app's own placeholder) could not be edited at all.
  2. **Every edit re-sold booked seats.** `updateOffer` reset `seats_free = seats_total`, and the
     wizard always sends `seats_total`, so it fired on *every* edit. Overbooking.
  3. `driver-app-standalone/api/geo.ts` was missing (**T-022**) — but it was never a port: the
     app's own `api/driver.ts` already exported all four symbols, so a 3-line re-export shim did it.
- **Audit 2 — passenger↔driver-offer connection leg (17 findings).** The headline: **this leg is
  fully wired in both apps** (`OfferDetailsScreen` → join; `OffersListScreen` → `OfferPassengers` →
  confirm/reject), unlike the OfferDriver leg reviewed on 2026-08-02 (2) which has no UI at all.
  So these are live bugs. Worst three, all fixed:
  4. **Passengers were charged a front-seat premium that was never displayed.** Same string
     comparison, this time in `OfferDetailsScreen.tsx:192`. It gated the price banner, the premium
     and the breakdown — but **not the front-seat toggle** — while the server charged on plain
     truthiness of the string. Tick the box, see no price, get billed.
  5. **A cancelled offer gave the passenger a blank screen.** `successResponse` is
     `(res, data, message?, statusCode?)`, so `successResponse(res, {offer:null}, 404)` put the
     **404 in the message slot** and answered HTTP **200 / success:true**. The app's `!response.ok`
     check sailed past it and `if (!offer) return null` rendered nothing, with no way back.
  6. Every price rendered as `60 000.00` — `formatNumberWithSpaces` did `num.toString()` on the
     DECIMAL string.
- **Decisions:** (1) **T-022 absorbed into T-025** as step 1 rather than kept as its own card, so
  *Now* stayed at two. (2) **T-018's plan was preserved** at `docs/PLAN-T018.md` instead of being
  overwritten by `/new-task` — it is still live at step 9 and holds 450 lines of context.
  (3) **Scope held deliberately narrow**: 3 of 16 findings, then 3 of 17, all user-visible; the
  other 27 went to **T-026**, because they fire only on malicious/broken input and taking them now
  would have stalled T-018 for days. Owner approved the split. (4) `formatNumberWithSpaces` was
  **not** made null-tolerant — the 2026-08-02 decision to let `tsc` police null call sites stands.
- **The lesson repeated itself.** API `tsc` went 285 → 282, and **the three errors that disappeared
  were the three bugs I had just fixed** — TypeScript had flagged every `successResponse` arg-order
  slip as `Argument of type 'number' is not assignable to parameter of type 'string'` and all three
  were sitting unread in the baseline. This is the *second* time in two days the backlog turned out
  to contain real defects (2026-08-02: the driver app's missing `formatNumberWithSpaces` export).
  **The baselines are a bug queue, not noise.**
- **Verification (honest status): nothing ran on a device or against a DB.** `tsc`: API
  **285 → 282**, user app **12 → 12**, driver app **40 → 36**, admin **0** — zero new errors
  anywhere. 27/27 + 20/20 runtime checks on the pure functions. Two bugs were **proven, not
  assumed**, by re-running the check scripts against a `git stash` of the pre-fix code. Step 3's
  `seats_free` arithmetic has **no** runtime coverage (it needs a DB) and is verified by reading
  only — smoke test 8(d) is its only real test.
- **Problems / carry-forward:** T-026 now holds 27 findings across both legs — the same defect
  classes in two services (mass assignment, 500-instead-of-4xx, unguarded `response.json()`,
  missing transactions). Two genuine overbooking paths remain open there: a **lost-update race** in
  `confirmPassenger` (two concurrent confirms both pass the seat check) and **nothing enforcing a
  single front seat**. Also: I dated everything 2026-08-03 while writing and had to correct
  `PLAN.md`/`TODO.md` back to 2026-08-02 at end-day.
- **Next:** Owner — deploy the API to test3 and rebuild **both** apps (the user app carries fixes
  now, which earlier T-025 sessions did not), then walk the seven smoke tests in `docs/PLAN.md`
  step 8. Then commit step 9, and T-018 unparks from `docs/PLAN-T018.md`.
- **Commit:** owner committed twice mid-session — `5a57781` (docs + board) and `0371cbd`
  (T-025 steps 1–3). **Steps 5–7 are NOT committed** — 6 files awaiting approval, message proposed
  in `docs/PLAN.md`.

---

## 2026-08-02 (2) — driver-connection review, six owner decisions, deployed to test3
- **Task:** Owner asked for the same end-to-end review as the create-offer one, applied to the
  passenger-create + driver-connection path — "don't miss anything".
- **The finding that matters most:** the driver-connection leg **has no UI in either app**.
  `joinPassengerOffer` / `getMyJoinRequests` / `cancelJoinRequest` (driver) and
  `getOfferDrivers` / `confirmDriver` / `rejectDriver` (user) exist as API clients with **zero
  call sites**. `MyPassengerOffersScreen` prints "3 drivers interested" with nothing to tap. So
  the backend was reviewed and fixed for screens that do not exist yet. New cards below.
- **Eight defects found and fixed** before the owner decisions:
  1. `confirmDriver` let a passenger confirm a **second** driver — every other row stays
     'pending', and only that row was checked. Two confirmed cars for one ride.
  2. `offered_price_per_seat` had no type check: `undefined <= 0` and `'abc' <= 0` are both
     false, so garbage became `NaN` and died in Postgres as a 500.
  3. `GET /public/passenger-offers/:id` is **unauthenticated** and returned the full `drivers`
     include — every rival driver's name, plate, car and bid price, to anyone.
  4. Non-numeric `:id` → Postgres integer error → 500 instead of 404 (three entry points).
  5. `?status=<typo>` on join-requests → Postgres enum error → 500.
  6. `?date=<garbage>` → Invalid Date → Sequelize RangeError → 500.
  7. `successResponse(…, 201)` argument-order bug again in `joinOffer` (+ `getOfferDrivers`
     never forwarded `req`, so its errors were always Uzbek).
  8. Nine `await response.json()` error paths with no `.catch` across both offer API clients —
     same JSON-parse trap as `geo.ts`.
- **Six owner decisions (2026-08-02) — binding, do NOT re-ask:**
  1. **Price-less orders stay visible when a driver filters by budget.** `max_price` is now
     `price <= budget OR price IS NULL`. Most new orders have no price, so the old `<=` made the
     driver's list look empty.
  2. **Confirming a driver no longer finishes the trip.** New status **`driver_found`** between
     "picked" and "travelled"; the losing drivers are auto-rejected
     (`rejection_reason: 'another_driver_chosen'`) and notified; `completed` is now reachable
     only from `driver_found`; `cancelOffer` accepts `driver_found`; `archiveOffer` refuses it
     (archiving would strand the confirmed driver silently).
  3. **Each person's language is stored** (`users.language`) and every push is written in the
     **recipient's** language. All 11 call sites across 4 services changed — the two loops
     (cancel offer → many drivers, cancel trip → many passengers) now resolve per person.
     `getLanguageFromHeaders` deliberately stays for HTTP error messages, which the caller reads.
  4. **Seat-count trap: documented, not changed.** `seats_offered` defaults to 1 while a T-018
     salon booking needs 3–4; a comment at the check warns whoever builds the join screen.
  5. **`total_offered_price = price × seats_needed` is the intended rule** — the passenger does
     not pay for the driver's spare seats. Comment says so, and says not to "fix" it.
  6. **A driver who cancels can never re-offer — intentional**, anti-spam. Comment records it,
     plus the fact that the unique `(offer_id, driver_id)` index enforces it anyway.
- **Migration `20260802000001-driver-found-status-and-user-language.cjs`** — enum value +
  `users.language`. **Applied on test3 by the owner, `migrated (0.014s)`.** The deploy script
  resets the namespace, but `db:migrate` ran only this one migration, which proves `SequelizeMeta`
  survived → the volume kept its data.
- **Deployed:** full `deploy.sh` run, all three pods Running. This is the first deploy carrying
  the T-018 API + today's fixes.
- **New `docs/CHECKLIST.md`** — plain-language manual test list for the whole system, marked
  🔴 changed-today / ⚪ normal / 🚫 screen-doesn't-exist. Also the plan for T-010's future
  automatic tests (server rule tests first — every bug found today was a server rule).
- **Problems / still open:** `driver-app-standalone/api/geo.ts` is **still missing**, so the
  driver's search screen cannot bundle. Everything driver-facing is untestable until it lands.
- **tsc:** API **289 → 285**, admin **0**, user app **12**, driver app **40**. No new errors.
- **Commit:** owner committed and pushed as `1117481`, then deployed.

---

## 2026-08-02 — T-018 step 9: first real run — two crashes + the rate-limiter proxy bug
- **Task:** Owner pasted a test3 API log and a Metro log. Not a planned step — three defects
  read straight out of the logs.
- **Proof the deploy happened:** the app crash below can only fire on an offer whose
  `max_price_per_seat` is NULL, and NULL can only be written by the new API + the new order
  form. So the API image **is** deployed on test3 and step 9 has actually begun.
- **Bug 1 — API `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`.** The ingress sets `X-Forwarded-For` but
  Express never trusted it, so `express-rate-limit` keyed every request on the **ingress pod's
  IP** — a single shared bucket, meaning one noisy client could lock every user out of the OTP
  and auth limiters. Fixed: `app.set('trust proxy', 1)` in `app.ts:35`. **One** hop, not `true`:
  with `true` anyone could spoof the header and walk past the OTP limiter entirely.
- **Bug 2 — user app `TypeError: Cannot read property 'toString' of null`.** T-018 fallout we
  missed. Step 7 taught the *driver* app that an offer can have no price, but nobody taught the
  *user* app: `MyPassengerOffersScreen` still called `formatNumberWithSpaces(item.max_price_per_seat)`
  and `format.ts:31` does `num.toString()`. It compiled because `api/passengerOffers.ts` typed the
  field as `number` — the type was lying. Fixed the type (`number | null`, so tsc now polices the
  call sites) and the card now shows "Narx kelishiladi", same as the driver app. +1 key × uz/ru/en.
- **Bug 3 — driver app imported a function that was never exported.** `SearchPassengerOffersScreen`
  imports `formatNumberWithSpaces` from `utils/format`, which only the **user** app defines —
  `undefined is not a function` on any priced offer. It was sitting in the 41-error tsc baseline
  unnoticed. Added the function to `driver-app-standalone/utils/format.ts`.
- **Lesson:** the 41/12/289 tsc baselines are not just noise to keep flat — bug 3 was a real
  runtime crash hiding inside the driver baseline, and bug 2 got through *because* a hand-written
  API type disagreed with the schema. When a migration makes a column nullable, grep the app
  types for that column in the same step.
- **Still open (not fixed — owner's call):** the driver app has **no** `api/geo.ts`, but
  `SearchPassengerOffersScreen:27` imports it. PLAN.md logged this as baseline noise; it is not —
  Metro cannot resolve the module, so that screen has never opened. The user app's `api/geo.ts`
  already exports the four symbols it needs, so it is a straight port.
- **tsc:** user **12 → 12**, driver **41 → 40** (bug 3 removed one), API **289 → 289**.
- **Next:** port `api/geo.ts` into the driver app, then resume step 9 — create an offer with
  every field set and walk it through My offers + the driver search screen.
- **Commit:** not committed yet.

---

## 2026-07-28 (2) — T-018 / OR-007 step 1: passenger_offers schema for the new order screen
- **Task:** First implementation step of the approved T-018 plan — the DB migration + model for
  the ~20 new fields of the Figma order screen.
- **Done:** New migration `20260728000001-extend-passenger-offers-figma.cjs` (departure/arrival
  windows, settlement level + landmarks, payment type + payer phone, `seat_counts` JSONB,
  `seat_position_any`, `salon_scope`, `vehicle_class`, `vehicle_types`, 5 flags, pitak text,
  `special_order` JSONB, 2 FK indexes) and `PassengerOffer.ts` (new exported types, attributes,
  creation-optionals, `init` fields). Committed + pushed as `7e49b5e`, then **applied on test3**
  by the owner — `migrated (0.040s)`, 12/12 spot-checked columns verified in `information_schema`.
- **Decisions:** (1) Everything additive/nullable, plus a single `max_price_per_seat DROP NOT
  NULL` — the new form has no price field at all, prices live only inside the special order.
  (2) VARCHAR + app-level validation instead of PG enums, so a new payment method or vehicle
  class never needs a migration. (3) Owner chose to skip a local DB run and migrate straight on
  test3 — so steps 2–7 are written without a local database to test against.
- **Two Figma corrections** (the PNG beat the plan text): vehicle class is **one radio group of
  five** — Standart/Comfort/Biznes/**Econom**/**Turistik**, not 3 classes plus a vehicle-type
  checkbox row (`vehicle_types` stays in the schema, unused by the UI). And
  `004…Tanlov oynasi.png` is **not** the route/time popup — it is the driver-offer selection
  window (Qidiruv/Takliflar, driver + car info, seat/price grid). No mock exists for the
  route/time editor, which has to be settled with the owner before step 4.
- **Migration recipe learned (worth reusing):** the API image is built with
  `npm install --omit=dev`, so the migration file is not in it and `sequelize-cli` may be missing.
  `kubectl cp` the `.cjs` into the running pod, then `npm run db:migrate` inside it — the pod's
  `NODE_ENV=production` + configMap `DB_*` make sequelize-cli pick the right config by itself.
  Written down in `docs/PLAN.md` step 1b.
- **Problems:** none in the migration. `\d passenger_offers | grep …` looked like a failure
  ("exit code 1") — that was only psql's pager getting SIGPIPE'd; `information_schema` confirmed
  everything. Also corrected the stale note claiming T-017 was uncommitted — it is in `a1ecedd`.
- **Next:** step 2 — `PassengerOfferService` + `PassengerOfferController` /
  `PublicPassengerOfferController` accept, validate and return the new fields; `seats_needed`
  computed server-side; `max_price_per_seat` validated only when provided.
- **Commit:** `7e49b5e` (schema + model). Docs updated separately.

---

## 2026-07-28 — T-017 driver app: infinite profile-check loop after OTP login (fix implemented)
- **Task:** Owner reported from a live Metro log: after entering the OTP the driver app "refreshed
  loading and registration many times". New card T-017 (P1).
- **Root cause (the interesting part):** a render-identity feedback loop, not a navigation bug.
  `RootNavigator.checkDriverProfile()` calls `updateUser(serverUser)` with a freshly parsed object,
  so state always changes → `AuthProvider` re-renders → `logout`/`updateUser`/`value` are plain
  inline definitions, so every consumer gets **new function identities** → `checkDriverProfile`
  (a `useCallback` depending on them) gets a new identity → the effect that lists it in its deps
  re-fires → back to the start. Two API calls and one splash flash per iteration. **It only stopped
  because the API rate-limited the app** — the tell-tale `JSON Parse error: Unexpected character:
  T` at the end of the log is a non-JSON error page, which skipped `updateUser` and broke the cycle.
- **Second bug found on the way:** that effect watched `user.profile_complete`, which lives on the
  **user** record (`first_name && last_name && gender`). The **driver** profile is a separate
  record, so a driver can legitimately have `profile_complete: true` and an empty driver profile —
  exactly the logged account (id 13). So it was both looping *and* watching the wrong signal.
- **Done:** `AuthContext` — all nine methods `useCallback`ed with no state deps, `value` `useMemo`ed,
  `logout` moved to the top and reading a new `stateRef`. `RootNavigator` — two effects collapsed
  into one keyed on auth identity only, `profile_complete` watcher removed, `checkInFlightRef`
  guard, dead `refreshTrigger` deleted. New `utils/driverProfileEvents.ts` (module pub/sub) carries
  the explicit "a registration step was saved" signal; `DriverTaxiLicenseScreen` emits it.
- **Decisions:** (1) Replace the `profile_complete` side-channel with an **explicit event** rather
  than tightening the deps — the taxi-license screen used to switch navigators purely as a
  side-effect of the loop, so without it a driver who finished registration would have been stuck
  on the registration stack. That regression was the main risk of this fix. (2) Also fixed the
  `AppState` effect, whose deps included the whole `state` object (it re-registered the OS listener
  on every state change); reading `stateRef.current` gives the handler *fresher* state than the old
  closure did. (3) Left `updateUser({ profile_complete: true })` in place — it writes a real flag
  other code reads; it is just no longer the navigation trigger.
- **Problems / honest status:** **Nothing has run on a device.** Verification is static only: driver
  app `tsc` — **41 errors before, 41 after, identical set** (line numbers normalised, measured
  against a `git stash` of exactly these files). All 41 are pre-existing and unrelated. `npm run
  lint` still fails repo-wide (ESLint 9, no flat config) — pre-existing.
- **Note:** this is the blind spot T-016 flagged in writing ("the driver app has its own
  `RootNavigator` + `checkDriverProfile`, may have the same class of bug"). It turned out to be a
  *different* bug in the same place. Also noticed T-016 was committed by the owner as `2a76e12`;
  PLAN/TODO notes calling it "uncommitted" were corrected.
- **Next:** Owner: rebuild the driver app, enter the OTP, and confirm the Metro log shows
  `Checking driver profile status...` **once** with no splash flicker; then finish registration
  through the taxi-license step and confirm it lands on the main menu.
- **Commit:** ⚠️ **NOT committed** — 4 files awaiting approval. Proposed message:
  `fix(driver): stop the infinite driver-profile check loop after OTP login (T-017)`

---

## 2026-07-27 — OR-006 / T-016 half-finished registration → main menu (fix implemented)
- **Task:** New owner request OR-006 (T-016): "chala registratsiya qilsa registratsiya joyidan
  boshlab ketmasakan. GLavniy menyuga borib qolarkan yolovchi" — a half-finished registration must
  resume on the registration form instead of dropping the passenger into the main menu (user app).
- **Done:** Root cause traced, plan approved, **steps 1-6 implemented** (step 7 = owner deploy +
  device test).
  - **API:** `GET /auth/me` now returns `profile_complete` + the profile fields (it returned
    neither). Also rewrote `UserController.updateProfile`'s completeness rule — it required `email`
    and `birth_date`, which the sign-up form treats as **optional**, then silently corrected itself
    two lines later.
  - **User app:** `AuthContext.initializeAuth()` now **merges** the server user over the cached one
    instead of replacing it; `RootNavigator` decides completeness from data that is actually
    present; `UserDetailsScreen` trusts the server's `profile_complete` instead of forcing `true`;
    new `utils/registrationDraft.ts` keeps the typed fields so the resumed form is pre-filled.
- **Root cause (the interesting part):** not a navigation bug at all. `/auth/me` never sent
  `profile_complete`, and the app **overwrote** its cached user with that reply on every cold start,
  so the flag became `undefined` — and `RootNavigator` read `undefined !== false` as **complete**
  → `MainNavigator`. One API omission, amplified by two unsafe app defaults ("unknown ⇒ complete"
  and a destructive cache overwrite). Fixed all three so the class of bug is gone, not just this
  instance.
- **Decisions:** (1) Owner confirmed "resume from the registration point" means **both** — open the
  form *and* keep what was typed — so the draft is in scope. (2) The draft is **tagged with the
  phone number** and dropped if a different phone registers, so one person's half-typed name can
  never appear in someone else's form. (3) `RootNavigator`'s fallback deliberately accepts
  `display_name`, not just `first_name`: the *old* `/auth/me` sends `display_name` but not
  `first_name`, so a stricter check would have thrown **registered** users onto the sign-up form
  during the window where a new app build meets a not-yet-deployed API.
- **Problems / honest status:** **Nothing has run on a device and the API is NOT deployed** — on
  test3 the old `/auth/me` is still live, so the bug still reproduces until the owner deploys.
  Verification is static only: `tsc` at baseline (user app 12, API 290 pre-existing errors, none in
  any touched file). `npm run lint` fails repo-wide (ESLint 9 with no flat config) — pre-existing,
  unrelated. Also corrected a **stale note** carried in PLAN.md: T-014/T-015 were described as
  uncommitted, but they landed in `5b315a6`.
- **Board hygiene:** *Now* held 4 cards, all implemented and only awaiting device tests, so they
  moved to a new **⏸️ Parked — awaiting owner device test** section and *Now* holds only T-016.
- **Next:** Owner: (1) deploy the API to test3 **first**, (2) build the user app, (3) verify OTP →
  kill from recents → reopen → must land on the registration form **with the typed fields still
  there**, (4) finish registration → reopen → must land on Home.
- **Commit:** ⚠️ **NOT committed** — 13 files on disk awaiting approval. Proposed message:
  `fix(auth): resume half-finished registration instead of the main menu (OR-006)`.
  `.claude/settings.json` (permission entries) is also still modified, unrelated.

---

## 2026-07-26 — OR-003 / T-013 ✅ zero-tap OTP auto-read VERIFIED on device
- **Task:** OR-003 — finish + verify zero-tap OTP SMS auto-read (user app + API)
- **Done:** **Zero-tap works on a real device** (user app, test3 env) — request OTP → code
  auto-fills and auto-submits, no dialog, no tap. First real end-to-end test; everything before
  was static only. Owner set `ESKIZ_OTP_APP_HASH` in the test3 `.env` (picked up by the
  `ubexgo-test3-env` configMapGenerator on redeploy), registered/approved the Eskiz template,
  and confirmed delivery + auto-read. T-013 marked done on the board; OR-003 → ✅.
- **Decisions / big catch:** **The real app hash is `asNtyBnPVzB`, not `JtArsQcEBm9`.** The running
  build logged `[OR-003] SMS Retriever app hash: ["asNtyBnPVzB"]` via `getHash()` — the authoritative
  value SMS Retriever actually matches. The earlier `JtArsQcEBm9` was a wrong static keystore
  computation from a past session (an Eskiz template had even been approved with it). Corrected the
  env, the docs, and the `or003-sms-app-hash` memory. **Lesson: trust `getHash()` on a real build
  over any hand-computed keystore hash.**
- **Problems / carry-forward:** `android/app/debug.keystore` is **not committed to git** and signs
  both debug+release (`build.gradle:118`), so `asNtyBnPVzB` only holds for builds from this machine's
  current keystore — a real production release `.jks` (or a clean prebuild elsewhere) changes it →
  must redo the Eskiz template + env then. Also: register a production-grade Eskiz template for the
  `asNtyBnPVzB` wording before real users (test send delivered on a test number).
- **Next:** Owner continues in a new chat. Board's remaining items are device-test confirmations for
  T-011/T-012/T-014/T-015 (all implemented) or fresh work T-001 (join flow) / T-002 (offer wizard).
- **Commit:** ⚠️ **NOT committed** — T-014/T-015 app changes + today's doc updates are on disk,
  awaiting approval. `.claude/settings.json` also modified (permission entries).

---

## 2026-07-22 — OR-003 / T-013 SMS Retriever implemented + pushed
- **Task:** OR-003 — zero-tap OTP SMS auto-read (user app + API)
- **Done:** All CLAUDE steps of the plan (1, 2, 4, and the code half of 3).
  Committed `9b36014` (Option A backlog + docs) and `d963cfb` (Option B), **pushed to
  `origin/main`** so the server can deploy from the last commit.
  - User app: `react-native-otp-verify@1.2.0` + new `utils/smsRetriever.ts` (lazy Android-only
    require, extracts the code from the full SMS body, ignores the timeout sentinel);
    `OTPVerificationScreen` starts/stops the listener, auto-submits, guards double-submit.
  - API: `config.eskiz.otpAppHash` + `OtpService.buildOtpMessage()` behind `ESKIZ_OTP_APP_HASH`,
    with the 140-byte cap enforced in code.
- **Decisions:** (1) Did **not** use the library's `useOtpVerify` hook — it builds a
  `NativeEventEmitter` from a *throwing Proxy at import time*, which can crash on iOS; wrapped it
  defensively instead. (2) Put the byte check in code, not just in the docs, so a wrong hash
  degrades to a working SMS + warning instead of silently killing autofill.
- **Wins:** ✅ **140-byte risk resolved by measurement** — 105 B now, 117 B with the hash, so the
  Cyrillic wording stays and the owner does NOT need a reworded template.
  ✅ With the env unset the SMS is **byte-identical to today's**, so deploying is safe before the
  new Eskiz template is approved.
- **Problems / honest status:** **Nothing has run on a device.** Verification so far is static
  only: `tsc` (user app 12 / API 290 errors, both = pre-existing baseline, none mine), a Gradle
  compile of the native module (BUILD SUCCESSFUL), and Node unit-tests of the code-extraction (8/8)
  and message-building (3/3). Zero-tap is unproven until a real SMS on a real phone.
  Also corrected a mistake from the previous session: I had conflated same-named npm packages —
  the installed lib is an **old-style bridge module**, not a TurboModule (works via New-Arch
  interop; most likely thing to break on a future RN upgrade).
  **Environment:** Avast Web/Mail Shield re-signs HTTPS, which breaks npm, Gradle **and git push**
  (Node/Java/git each have their own truststore). Worked around per-command without disabling
  TLS checks; a permanent fix is still owner's call.
- **Next:** Owner: (1) release build → read `[OR-003] SMS Retriever app hash:`, (2) new Eskiz
  template with that hash, (3) only after approval set `ESKIZ_OTP_APP_HASH`, (4) zero-tap test.
  Still also pending: device tests for OR-001 (T-011) and OR-002 (T-012).
- **Commit:** `d963cfb` (pushed). Uncommitted leftover: `.claude/settings.json` (permission
  entries only, unrelated to the feature).

---

## 2026-07-21 (5) — OR-003 / T-013 decision + HANDOFF
- **Task:** OR-003 — decide the OTP auto-read approach; hand off to next session
- **Done:** Shipped Option A (JS autofill). Device-tested on Samsung S24 → **Android did NOT
  auto-fill** (expected JS limitation; iOS still benefits). Explained the native options.
- **Decisions:** Owner chose the **SMS Retriever (hash)** path — zero-tap, no read dialog, no SMS
  permission (over User Consent, which pops a dialog each time). Plan of record written in PLAN.md.
- **Problems / watch-outs for next session:** (1) RN 0.81 **New Architecture** compat of the SMS
  lib — verify before wiring. (2) SMS Retriever needs the message **≤140 bytes** — current Cyrillic
  text is byte-heavy; measure with the hash. (3) **release** hash (not debug) is what prod SMS needs.
- **Next (new chat / /start-day):** PLAN.md Step 1 — add the SMS Retriever module to the user app
  (ask before finalizing the dep), then wire listener + hash + backend env; owner does the Eskiz
  template + env + release test.
- **Commit:** ⚠️ still UNCOMMITTED: OR-003 Option A (`OTPVerificationScreen.tsx`) + docs. Proposed
  `feat(otp): one-tap SMS autofill on the user app OTP screen (OR-003)`. Also still pending: device
  tests for OR-001 (T-011) and OR-002 (T-012), and the k3s deploy 401 (kubectl/k3s certs) on `fstu`.

## 2026-07-21 (4) — OR-003 / T-013 OTP SMS autofill
- **Task:** Owner request OR-003 — auto-read the OTP SMS (user app)
- **Done:** Option A: added `textContentType="oneTimeCode"` + `autoComplete="sms-otp"` +
  `importantForAutofill` to the user-app OTP inputs; box 0 takes the full code and
  `handleOtpChange` spreads an autofill dump across the 4 boxes + auto-submits. tsc clean.
- **Decisions:** superseded by entry (5) — moved from A/Consent to SMS Retriever (hash).
- **Next:** see entry (5).
- **Commit:** proposed `feat(otp): one-tap SMS autofill on the user app OTP screen (OR-003)`

---

## 2026-07-21 (3) — OR-002 / T-012 deleted-user logout
- **Task:** Owner security bug OR-002 — deleted passenger/driver still gets into the app
- **Done:** Full fix (App + API). API `authenticate` middleware now verifies the user still
  exists (401 if deleted). Both apps attach the HTTP status from `/auth/me` and, on 401/403/404,
  clear the cache and return to the login/OTP screen (driver also on foreground). Kept cache
  fallback for network errors (offline). `tsc`: no new errors (backend 290 = same as HEAD).
- **Decisions:** App + API (owner-approved). Blocked/pending_delete stay on BlockedScreen; only
  deleted → login. DB errors pass through (no false-logout on outage).
- **Problems:** Backend has a big pre-existing `tsc` backlog (290 errors) — runs on tsx in dev;
  out of scope. User app has no foreground-refresh handler (reopen path covers it).
- **Next:** Owner device test (login → admin delete → reopen → login); then commit.
- **Commit:** proposed `fix(auth): log out deleted users + reject deleted tokens (OR-002)`

---

## 2026-07-21 (2) — OR-001 / T-011 OTP resume
- **Task:** Owner bug OR-001 — OTP screen jumps to main menu after backgrounding
- **Done:** Root-caused (app killed in background + no nav persistence). Implemented a
  targeted fix in BOTH apps: `utils/pendingOtp.ts` + `AuthNavigator` resume-to-OTP +
  save/clear in the OTP screen + clear on logout. `tsc` clean for all changed files.
- **Decisions:** Both apps, targeted persistence (not full nav-state). Deferred the
  splash/NavigationContainer refactor — not needed for this fix.
- **Problems:** Can't run the RN apps headless here; behavior needs a device test.
  ESLint isn't configured in either app (no flat config) — used `tsc` instead.
- **Next:** Owner rebuilds an app and verifies resume; then commit + mark done.
- **Commit:** proposed `fix(otp): resume OTP screen after app is backgrounded (OR-001)`

---

## 2026-07-21
- **Task:** Adopt the project-control-kit (CLAUDE.md + docs/ + slash commands)
- **Done:** Installed `CLAUDE.md`, `docs/` (ARCHITECTURE, TODO, PLAN, JOURNAL), and
  `.claude/commands/` at the repo root, personalized to the real UbexGo stack
  (Express + Sequelize + PostgreSQL; 2 RN apps; admin panel). Seeded T-001 as the
  current task (verify passenger→offer join flow).
- **Decisions:** Backend is Express, not NestJS (spec was aspirational). Kept the kit's
  simple 4-file memory model rather than a heavier vault.
- **Problems:** ~48 scattered `.md` fix-notes and stale `tmp/` duplicates still need
  consolidating — parked as T-004 (Phase 2), needs approval before moving/deleting.
- **Next:** `/start-day`, then T-001 step 1 (audit the join flow).
- **Commit:** `chore: add CLAUDE.md + docs control system`

---

## Entry template (copy for each new day)

## YYYY-MM-DD
- **Task:**
- **Done:**
- **Decisions:**
- **Problems:**
- **Next:**
- **Commit:**
