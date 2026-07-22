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
- [x] 1. Pick a maintained SMS Retriever library for the **user app** and verify it builds with
  **RN 0.81 New Architecture** (Expo 54). ✅ **DONE 2026-07-22** — owner approved
  `react-native-otp-verify@1.2.0`; installed; **`:react-native-otp-verify:assembleDebug`
  BUILD SUCCESSFUL** under Gradle 8.14.3 / AGP 8.x. `tsc` = 12 pre-existing errors, none from the lib.
  See "Step 1 findings" below — the npm package is NOT the TurboModule repo its README suggests.
- [x] 2. Wire it in `user-app-standalone/screens/OTPVerificationScreen.tsx`. ✅ **DONE 2026-07-22** —
  added `utils/smsRetriever.ts` (lazy/defensive wrapper) + listener & auto-submit in the screen.
  Option A props kept for iOS. `tsc` clean (12 pre-existing errors only); `extractOtp` unit-tested
  8/8 including a hash that contains digits.
- [~] 3. Print the app hash via `getHash()`. **Code done** (logs `[OR-003] SMS Retriever app hash:`
  on the OTP screen in `__DEV__`). ⏳ **Still needs a real build/device to read the value**, and the
  **RELEASE** hash must come from a release build (debug build → debug hash). Give RELEASE to owner.
- [x] 4. Backend: append the hash behind `ESKIZ_OTP_APP_HASH`. ✅ **DONE 2026-07-22** —
  `config.eskiz.otpAppHash` + `OtpService.buildOtpMessage()`; enforces the 140-byte cap in code
  (drops the hash + warns rather than sending an SMS the retriever would ignore). tsc = 290
  pre-existing errors, none mine. Verified: no env → **byte-identical to today's SMS (105 B)**;
  with hash → 117 B; over-long hash → safely dropped.
  ⏳ **Owner must still add `ESKIZ_OTP_APP_HASH` to the deploy env** (see below) — until then the
  behaviour is unchanged, which is why this is safe to deploy before the template is approved.
- [ ] 5. Coordinate with owner (below); once the template is approved + env set, test end-to-end.

## Steps — OWNER
- [ ] O1. After Claude gives the hash: register a **new Eskiz template** whose text = the current
  message **plus the hash line**, and get it approved (moderation every 3h, weekdays 10:00–16:00).
  Template text (wording unchanged — it fits in 140 bytes):
  `Код верификации для входа к мобильному приложению UbexGo: 1234` + newline + `<release hash>`
- [ ] O2. Set `ESKIZ_OTP_APP_HASH=<release hash>` in the backend env (test3 + prod).
  **Claude did NOT edit these — they are `.env` / `infra/**` (CLAUDE.md rule 4).** Two places:
  - `api,admin,db/infra/compose/docker-compose.yml` — add `ESKIZ_OTP_APP_HASH: ${ESKIZ_OTP_APP_HASH}`
    next to `ESKIZ_EMAIL` (~line 59), and the value in `infra/compose/.env`.
  - k8s test3: add it to the secret/env used by `infra/k8s/overlays/test3/.env`.
  ⚠️ Leave it UNSET until the new template is approved — an SMS whose text doesn't match an
  approved Eskiz template gets rejected. Unset = today's exact message, so deploying early is safe.
- [ ] O3. Test on a **release** build: request SMS → code auto-fills + submits, zero taps.

## Files to touch
- `user-app-standalone/`: `screens/OTPVerificationScreen.tsx` + native config (autolink / maybe a
  config plugin) + the new dependency.
- `api,admin,db/apps/api/src/services/OtpService.ts` (`sendSms`).

## Step 1 findings (2026-07-22) — READ BEFORE STEP 2
- **Installed:** `react-native-otp-verify@1.2.0` (owner-approved).
- ⚠️ **Package identity trap.** The npm package `react-native-otp-verify` is published from
  `github.com/faizalshap/react-native-otp-verify` (Java pkg `com.faizal.OtpVerify`). The
  `pushpender-singh-ap/react-native-otp-verify` GitHub repo advertising "TurboModules / RN >= 0.76"
  is a **different, unaffiliated repo reusing the same name in its docs**. Don't trust that README
  for this dependency. Same-author alternates: `@pushpendersingh/react-native-otp-verify` (~1.7k/wk),
  `react-native-otp-auto-verify` (~2k/wk); `react-native-otp-verify-remastered` is **deprecated**.
- **It is a LEGACY bridge module, not a TurboModule**: no `codegenConfig`, no `cpp/`, plain
  `ReactPackage`, devDeps pinned to RN 0.63 / React 16. It works under New Arch via the **interop
  layer** — fine today, but it is the thing most likely to break on a future RN upgrade.
- **It nevertheless BUILDS.** Its `build.gradle` looks scary (`com.facebook.react:react-native:+`
  = the pre-0.71 Maven coordinate, and an AGP 3.6.1 classpath) but Expo's RN Gradle plugin
  substitutes/normalizes these at the root project. Verified empirically, not assumed.
- **API available** (`lib/typescript/index.d.ts`): `getHash()`, `getOtp()`, `startOtpListener()`,
  `addListener()`, `removeListener()`, and a `useOtpVerify({numberOfDigits})` hook.
  The hook is the cleanest fit for Step 2 (gives `otp`, `hash`, `startListener`, `stopListener`).

## ⚠️ Environment blocker: Avast breaks TLS for npm AND Gradle (fixed per-command, NOT globally)
**Avast Web/Mail Shield re-signs HTTPS** with its own root (`CN=Avast Web/Mail Shield Root`).
Windows/PowerShell trust it; **Node and Java ship their own truststores and do not** → every
`npm install` fails `UNABLE_TO_VERIFY_LEAF_SIGNATURE` and every Gradle dependency fetch fails
`PKIX path building failed`. Nothing was disabled and no global config was changed. Workarounds used:
- **npm:** `$env:NODE_OPTIONS="--use-system-ca"` before `npm install` (Node 22 reads the Windows store).
- **Gradle:** a copy of the Adoptium-17 `cacerts` with the Avast root imported, passed via
  `$env:GRADLE_OPTS="-Djavax.net.ssl.trustStore=<path> -Djavax.net.ssl.trustStorePassword=changeit"`.
  Scratchpad copy is temporary. **Permanent fix (owner's choice):** either disable Avast HTTPS
  scanning, or import the Avast root into the JDK cacerts / set `NODE_EXTRA_CA_CERTS` for good.
  Note Gradle uses `~/.gradle/jdks/eclipse_adoptium-17-...`, **not** `JAVA_HOME` (Android Studio jbr).

## Risks / open questions (READ before coding)
- **New Architecture compat:** RN 0.81 defaults to New Arch; many SMS libs are old. Verify the
  chosen lib builds/runs before wiring UI. This is the #1 risk.
- ~~**140-byte SMS limit**~~ ✅ **RESOLVED 2026-07-22 — measured, it fits.**
  `Код верификации для входа к мобильному приложению UbexGo: 1234` = 62 chars / **105 bytes** UTF-8.
  Plus `\n` + 11-char hash = **117 bytes**, under the 140-byte limit with 23 bytes of headroom.
  **No shorter/Latin template needed** — the Eskiz template can keep the current Cyrillic wording.
- **Hash is signing-key specific:** debug build → debug hash; release build → release hash. The
  approved Eskiz template carries ONE hash, so **test on a release build with the release hash**
  (or temporarily use the debug hash for a debug-build test).
- Driver app is out of scope (its code arrives via push to the user app, not SMS).

## Session notes (one line per work session)
- 2026-07-21: Shipped Option A (JS). Device test: Android didn't auto-fill (expected). Owner chose
  the **hash / SMS Retriever** path. Documented for handoff; implementation not started.
- 2026-07-22: Committed Option A + docs (`9b36014`). **Step 1 DONE**: installed
  `react-native-otp-verify@1.2.0` (owner-approved) and proved it compiles (`assembleDebug`
  BUILD SUCCESSFUL). Found the package-identity trap + legacy-bridge fact, and diagnosed the
  Avast TLS interception that was blocking npm and Gradle. No app source changed yet.
- 2026-07-22 (2): **Step 2 DONE** (+ Step 3 code). Added `utils/smsRetriever.ts` and wired the
  listener + zero-tap auto-submit into `OTPVerificationScreen.tsx`. **Measured the SMS: 117 bytes
  with the hash — the 140-byte risk is resolved, template wording can stay.** Not yet run on a device.
- 2026-07-22 (3): **Step 4 DONE** — backend builds the SMS via `buildOtpMessage()` behind
  `ESKIZ_OTP_APP_HASH`, with the 140-byte cap enforced in code. Committed for server deploy.
  All CLAUDE steps now done except reading the hash off a real build (Step 3's device half).

## Resume point (for the next chat)
**All code for OR-003 is written and committed. What remains is device/owner work.**
**Next action = Step 3's remaining half (needs a real build):** run the user app on Android, open
the OTP screen, read the `[OR-003] SMS Retriever app hash:` log line. A **debug** build prints the
**debug** hash; the Eskiz template needs the **RELEASE** hash, so build release (release keystore)
to get the value for the owner. Then owner does O1 (template) → O2 (env) → O3 (release test).
Build cmds in this environment: `$env:NODE_OPTIONS="--use-system-ca"; npm run android` (user app).
⚠️ In this environment, prefix npm with `$env:NODE_OPTIONS="--use-system-ca"` and Gradle with the
`GRADLE_OPTS` truststore — see the Avast section above.

## 📌 For the NEXT CHAT — read this first
**State:** all OR-003 code is written, committed (`d963cfb`) and **pushed to `origin/main`**.
The working tree is clean apart from `.claude/settings.json` (permission entries, ignore it).
**Claude has nothing left to code on T-013.** The remaining work is physical/owner work:
a release build to read the hash → Eskiz template → env var → device test (see Steps 3/O1–O3).

If the owner comes back with the hash and an approved template, the only action is setting the
env var (owner does that; `infra/**` is off-limits per CLAUDE.md rule 4) and testing.
If instead they want to move on, the board's next cards are **T-011/T-012 device tests** (both
implemented, awaiting confirmation) or **T-001** (passenger→offer join flow).

⚠️ **Environment (will bite immediately):** Avast Web/Mail Shield re-signs HTTPS, so **npm,
Gradle and git push all fail** on certificate errors out of the box. Fixes that worked, per
command — see the Avast section below for the full detail:
- npm → `$env:NODE_OPTIONS="--use-system-ca"`
- Gradle → `GRADLE_OPTS` pointing at a cacerts copy containing the Avast root
- git → `git -c http.sslCAInfo=<bundle with Avast root> push`
The scratchpad copies are temporary and will be gone; regenerate them by exporting the Avast root
from `Cert:\LocalMachine\Root`, or (better) ask the owner to fix this permanently.

## Not yet verified (be honest about this)
Everything so far is **static verification only** — `tsc`, a Gradle module compile, and a Node
unit-test of the regex. The app has **never been run** and no SMS has been received. The zero-tap
flow is unproven until a device test with an approved template containing the hash.
