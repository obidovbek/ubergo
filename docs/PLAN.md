# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **Parked (awaiting owner device test — implemented, on `main` @ 6c006a4):**
> - T-011 (OR-001 OTP resume) — both apps.
> - T-012 (OR-002 deleted-user logout) — App + API.

## Task
- **ID / name:** T-013 (owner request OR-003) — auto-read the OTP SMS (user app), **zero-tap**
- **Goal (definition of "done"):** On the user app OTP screen, when the SMS arrives the code
  fills and submits **automatically, with no dialog and no tap** (Android), verified on a device.
- **Why now:** Owner request. Chose the seamless, industry-standard path.

## Decision (2026-07-21)
- Option A (JS `autoComplete`/`textContentType`) is **already shipped** (helps iOS) but **does
  NOT auto-fill on Android** (confirmed on Samsung S24). Keep it — don't revert.
- Android needs a native Google API. Owner picked the **SMS Retriever API (hash)** — zero-tap,
  no "read SMS" dialog, no SMS permission. Cost = the 11-char app hash must be in the SMS, so a
  **new Eskiz template** is needed.
- Division of labor (owner's words): **Claude** adds the native module + prints the app hash
  (debug + release) and adds a backend env to append it; **Owner** registers + gets the new
  Eskiz template approved.

## Steps — CLAUDE
- [ ] 1. Pick a maintained SMS Retriever library for the **user app** and verify it builds with
  **RN 0.81 New Architecture** (Expo 54). Candidate: `react-native-otp-verify` (SMS Retriever).
  ⚠️ Verify new-arch compat FIRST — if it fails, consider an Expo config-plugin / alternative.
  (Ask before finalizing the dependency — CLAUDE.md rule 4.)
- [ ] 2. Wire it in `user-app-standalone/screens/OTPVerificationScreen.tsx`: start the retriever
  on mount; on SMS received, parse the 4-digit code → fill boxes → auto-submit; clean up on
  unmount. KEEP the existing Option A props (iOS).
- [ ] 3. Print the app hash for **debug AND release** via the lib's `getHash()`. Give the
  **RELEASE** hash to the owner (that's the one production SMS must contain). Release hash comes
  from the user-app release keystore.
- [ ] 4. Backend `api,admin,db/apps/api/src/services/OtpService.ts` (`sendSms`): append the hash
  to the SMS via a NEW env var `ESKIZ_OTP_APP_HASH`, only when set. Format: `<msg>\n<hash>`.
  ⚠️ Check the total stays **≤ 140 bytes** (see risk below).
- [ ] 5. Coordinate with owner (below); once the template is approved + env set, test end-to-end.

## Steps — OWNER
- [ ] O1. After Claude gives the hash: register a **new Eskiz template** whose text = the current
  message **plus the hash line**, and get it approved (moderation every 3h, weekdays 10:00–16:00).
- [ ] O2. Set `ESKIZ_OTP_APP_HASH=<release hash>` in the backend env (test3 + prod).
- [ ] O3. Test on a **release** build: request SMS → code auto-fills + submits, zero taps.

## Files to touch
- `user-app-standalone/`: `screens/OTPVerificationScreen.tsx` + native config (autolink / maybe a
  config plugin) + the new dependency.
- `api,admin,db/apps/api/src/services/OtpService.ts` (`sendSms`).

## Risks / open questions (READ before coding)
- **New Architecture compat:** RN 0.81 defaults to New Arch; many SMS libs are old. Verify the
  chosen lib builds/runs before wiring UI. This is the #1 risk.
- **140-byte SMS limit:** SMS Retriever only delivers messages **≤140 bytes**. The current text
  is Cyrillic (`Код верификации…`, ~62 chars) — Cyrillic is 2 bytes/char in UTF-8, so it's already
  ~100+ bytes. Adding `\n` + 11-char hash may **exceed 140 bytes** → Retriever won't fire.
  **Measure it**; if over, the Eskiz template may need a SHORTER message (e.g. Latin/English).
- **Hash is signing-key specific:** debug build → debug hash; release build → release hash. The
  approved Eskiz template carries ONE hash, so **test on a release build with the release hash**
  (or temporarily use the debug hash for a debug-build test).
- Driver app is out of scope (its code arrives via push to the user app, not SMS).

## Session notes (one line per work session)
- 2026-07-21: Shipped Option A (JS). Device test: Android didn't auto-fill (expected). Owner chose
  the **hash / SMS Retriever** path. Documented for handoff; implementation not started.

## Resume point (for the next chat)
**Next action = Step 1 (CLAUDE):** add an SMS Retriever library to the **user app** and confirm it
builds under RN 0.81 New Architecture — ask the owner before finalizing the dependency. Then wire
the listener (Step 2), print the app hash (Step 3, give the RELEASE hash to the owner), and append
the hash to the SMS behind `ESKIZ_OTP_APP_HASH` (Step 4). Owner then does O1–O3 (new Eskiz
template + env + release-build test). Watch the **140-byte SMS limit** and **new-arch compat**.
Option A is already in place in `OTPVerificationScreen.tsx` — keep it. SMS text is built in
`OtpService.sendSms`.

## ⚠️ Uncommitted at handoff
Working tree (Windows) has **uncommitted** OR-003 Option A + these docs. Not yet committed:
`user-app-standalone/screens/OTPVerificationScreen.tsx` + `docs/*`. Consider committing before
switching machines (proposed: `feat(otp): one-tap SMS autofill on the user app OTP screen (OR-003)`).
