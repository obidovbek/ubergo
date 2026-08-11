# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-054 moved intact → `docs/PLAN-T054.md`** (steps 1-7 done; owner's device walk + commit
> remain). ✅ **T-045** → `docs/PLAN-T045.md`. ✅ **T-024** → `docs/PLAN-T024.md`.
> ✅ **T-046** → `docs/PLAN-T046.md`. ✅ **T-044** → `docs/PLAN-T044.md`.
> 🔴 **T-047 PARKED BY THE OWNER** — killed-app push tap; needs a `logcat` line before more code.
> ⏸️ **T-040 · T-039 · T-037 · T-031 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.

## Task
- **ID / name:** T-057 — stop using the OS alert and the OS date picker (owner items B + A)
- **Goal (definition of "done"):**
  1. **No screen in either app calls `Alert.alert` any more.** Every message appears as the app's own
     toast or `ConfirmDialog`. The **one** deliberate exception stays (see below).
  2. An alert whose OK button *does something* (navigates, goes back) becomes a **dialog**, not a
     toast — a toast has no button to press and the side effect would be lost.
  3. The passenger's create-offer screen picks its date and times with the app's **own wheel modal**,
     not the stock Android dialog.
  4. Nothing regresses: every message still appears, in the right language, at the right moment.
  5. `tsc` at baselines: API **281** · admin **0** · user **9** · driver **35**.
- **Why now:** owner, 2026-08-11 — *"all alert/info change to good design, for example when passenger
  create offer alert shows simple"* and *"passenger offer create change datetime picker for better
  design"*. Both are the same complaint: the two places where the app drops out of its own design and
  shows a bare Android box.

## What is already there (verified 2026-08-11 — do NOT re-derive)
✅ **Nothing needs building from scratch — both replacements already exist and are in use.**
- `showToast.{success,error,info,warning}(title, message)` — `utils/toast.tsx`, both apps.
- `showConfirmDialog({ title, message, confirmText, cancelText, onConfirm, onCancel,
  confirmButtonStyle })` — `utils/confirmDialog.tsx` → `components/ConfirmDialog.tsx`, both apps.
- `DateWheelModal` — `components/DateWheelModal.tsx`, **both apps** (built in T-036), an
  `AppModal`-based day/month/year wheel. Used today by `UserDetailsScreen` / `EditProfileScreen`.
✅ **`ConfirmDialogProvider` IS mounted in both apps** (`App.tsx` user :112, driver :120), so the
"nice" dialog is genuinely available everywhere — checked, because if it were missing every dialog
would already be silently degrading to `Alert`.
🔴 **35 raw `Alert.alert` call sites across 13 files** — user **12**, driver **23**:
| count | file |
|---|---|
| 5 | `user…/screens/CreatePassengerOfferScreen.tsx` ← **the owner's example** |
| 4 | `user…/screens/BlockedScreen.tsx` |
| 2 | `user…/screens/NotificationsScreen.tsx` |
| 1 | `user…/utils/confirmDialog.tsx` ← **KEEP (see below)** |
| 4 | `driver…/screens/BlockedScreen.tsx` |
| 3 ×5 | `driver…/screens/Driver{License,Passport,PersonalInfo,TaxiLicense,Vehicle}Screen.tsx` |
| 2 | `driver…/screens/NotificationsScreen.tsx` |
| 1 | `driver…/screens/ProfileScreen.tsx` |
| 1 | `driver…/utils/confirmDialog.tsx` ← **KEEP** |
🔴 **`confirmDialog.tsx`'s own `Alert.alert` MUST STAY.** It is the fallback for
"`ConfirmDialogProvider` is not mounted" — the last resort that keeps a confirmation reachable if the
provider is ever missing. Deleting it would make the failure silent instead of ugly.
⚠️ **6 call sites pass an `onPress` callback** — those are the ones that must become dialogs, not
toasts (goal 2). `CreatePassengerOfferScreen:321` goes **back** on OK; `:539` is the success message
after create/update.
🔴 **The date picker is the bare OS one:** `TimeWindowCard.tsx:199` renders
`@react-native-community/datetimepicker` with `display="default"` on Android — the stock dialog,
opened three separate times (date, from-time, until-time), with no styling and no relation to the
app's look.
⚠️ **`DateWheelModal` is date-only** (day/month/year, `EARLIEST_YEAR = 1900` — it was written for
birth dates). The create-offer screen needs **date + two clock times**, so a time wheel is the one
genuinely new piece.

## Approach
Two independent halves, done in that order so the app is runnable after each.

**B — the alerts.** Mechanical, one file at a time. For each call site decide by its shape:
- no buttons, informational → **`showToast`** (`.success` / `.error` / `.info`)
- has an `onPress` that navigates or changes state → **`showConfirmDialog`**
- a genuine yes/no → **`showConfirmDialog`** with both buttons

**A — the picker.** Add a `TimeWheelModal` beside the existing `DateWheelModal` (same `AppModal`
shell, same wheel styling, hours 0-23 / minutes 0-59), then point `TimeWindowCard` at
`DateWheelModal` + `TimeWheelModal` instead of the OS component. ⚠️ `DateWheelModal`'s
`EARLIEST_YEAR` default of 1900 is wrong for a trip date — pass `earliestYear`/`latestYear`, do not
change the default (the birth-date screens depend on it).

## Steps
- [x] 1. **DONE 2026-08-11. User app alerts** — `CreatePassengerOfferScreen` (5),
  `NotificationsScreen` (2), `BlockedScreen` (4).
- [x] 2. **DONE 2026-08-11. Driver app alerts** — all 8 files, 23 sites.
  🔴 **The five registration screens were NOT a toast swap.** Their photo alert offers **three
  choices** (camera / gallery / cancel), and `ConfirmDialog` renders one action plus an optional
  cancel — it cannot express that. New shared **`components/PhotoSourceModal.tsx`** wraps the
  existing `ModalList` ("pick one of these", already behind 17 of the app's modals) with two fixed
  rows. One component, five call sites.
  🔴 **Three of those screens had the strings HARD-CODED IN UZBEK** (`'Rasm tanlash'`,
  `'Ruxsat kerak'`, …), so a Russian or English driver was shown Uzbek. Moving to the shared modal
  fixed the picker for free; the permission messages became new `common.*` keys in all three locales.
- [x] 3. **DONE 2026-08-11. Sweep verified.** Zero `Alert.alert` in either app outside the two
  deliberate `confirmDialog.tsx` fallbacks, which are asserted **present** so a later cleanup cannot
  quietly delete the safety net.
  ⚠️ **9 dead `Alert` imports** were also removed (screens importing it with no call site) — the trap
  that invites the next author to reach for it.
- [x] 4. **DONE 2026-08-11. `TimeWheelModal`** — hour/minute wheels, built deliberately to
  `DateWheelModal`'s shape (same shell, same columns, same controlled contract).
  ⚠️ **Minutes step by 5**, and the selected row is matched by **bucket, not equality**: a value
  already on the clock (21:07) sits between two rows, and an equality test would highlight nothing.
- [x] 5. **DONE 2026-08-11. `TimeWindowCard` uses the wheels**; the OS picker import is gone.
  🔴 **The wheels are controlled, which fixes a real defect in passing:** the OS picker fired
  `onChange` per spin on iOS, so Cancel could not undo a scroll. Nothing now reaches the form until
  Confirm.
  ⚠️ The date wheel is bounded to **this year and next** — `DateWheelModal`'s 1900 default is for
  birth dates, and was left alone because `UserDetailsScreen`/`EditProfileScreen` depend on it.
  ⚠️ `minimumDate` is gone with the OS picker; the screen's existing **≥31-minute** validation
  (`MIN_ADVANCE_MS`, `CreatePassengerOfferScreen:377`) still refuses a past departure with a proper
  message, which is better than a silently unselectable day.
- [x] 6. **DONE 2026-08-11. i18n** — `common.hour`/`common.minute` (user) and
  `common.selectPhoto`/`common.cameraPermissionMessage`/`common.galleryPermissionMessage` (driver),
  all ×3 locales. **591/598 keys evaluated**, not grepped.
- [x] 7. **DONE 2026-08-11. 58/58, proven able to fail — 31 red.**
  `tsc` API **281** · admin **0** · user **9** · driver **35**, all at baseline; the 9 errors in the
  driver's `NotificationsScreen` **proven pre-existing via `git stash`** (it calls `showToast` as a
  function; that is not this card's bug).
  The wheel maths is **executed**, not read: the real transpiled `TimeWheelModal` is rendered through
  a JSX factory and its rows inspected — **all 60 minute values** proven to highlight a bucket,
  hour/minute picks proven independent, seconds zeroed, the caller's `Date` proven **not mutated**,
  and 5 hostile `minuteStep` values (0, -5, 1, 60, 90) proven not to hang or throw.
  ⚠️ **The suite was wrong twice before the code was.** First it read a stub that the JSX factory
  never invokes, so three modal-shell checks were measuring nothing; then it **crashed** against
  pre-change code instead of reporting red, because the component file did not exist. Both fixed —
  the second is the exact trap the 2026-08-11 journal names.
  🟡 The i18n run surfaced **3 pre-existing missing keys** (2 of them uz-only, rendering raw to
  Russian/English drivers). **Proven to pre-date this card against `HEAD`** and logged as **T-058**,
  not silently absorbed.
- [ ] 8. **Owner:** rebuild both apps, walk the create-offer screen and one alert per app.
- [ ] 9. Commit (only after the owner's approval).

## Files to touch
- `user-app-standalone/screens/{CreatePassengerOffer,Notifications,Blocked}Screen.tsx`
- `driver-app-standalone/screens/{DriverLicense,DriverPassport,DriverPersonalInfo,DriverTaxiLicense,
  DriverVehicle,Notifications,Profile,Blocked}Screen.tsx`
- `user-app-standalone/components/TimeWheelModal.tsx` — **new**
- `user-app-standalone/components/passengerOffer/TimeWindowCard.tsx`
- `{user,driver}-app-standalone/translations/{uz,ru,en}.ts`
- ❌ **No API change, no migration, no deploy.** ❌ `utils/confirmDialog.tsx` — its `Alert` stays.

## Risks / open questions (READ before coding)
- 🔴 **A toast cannot replace an alert that had a button.** 6 sites carry an `onPress`; turning those
  into toasts would silently drop a navigation. Check each one individually.
- 🔴 **`Alert.alert` blocks; a toast does not.** Code written after an alert may have assumed the user
  had acknowledged it. Read the surrounding lines, do not swap blind.
- ⚠️ **Do not delete the `confirmDialog.tsx` fallback** — it is the safety net, not an oversight.
- ⚠️ **`DateWheelModal`'s 1900 default** belongs to birth dates. Pass explicit years for a trip date;
  changing the default would break `UserDetailsScreen` / `EditProfileScreen`.
- ⚠️ **Both apps carry near-identical screens** — the driver app has 8 files to the user app's 3.
- ⚠️ **This card touches `CreatePassengerOfferScreen`, which T-031 and T-040 also own.** T-031's
  remaining steps are blocked on the owner; this card's changes are additive (alerts + the picker
  component), so they should not collide — but T-031 must be re-read before it resumes.
- ❓ **Open question — how far does "unnecessary" go for the picker?** The plan keeps the three
  controls (date / from / until). If the owner wants the Figma's single "route and time" popup
  instead, that is a bigger redesign and should be said now.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-11** — card opened from owner items B + A. Grounded: **nothing needs inventing** —
  `showToast`, `showConfirmDialog` and `DateWheelModal` all exist in both apps and the dialog
  provider is genuinely mounted. The work is **35 call sites** and **one new time wheel**.
- **2026-08-11 (2)** — approved. **Steps 1-7 done.** Two things the plan underestimated: the photo
  alert needed a **third choice** (→ new `PhotoSourceModal`), and three screens were **hard-coded in
  Uzbek**. Logged **T-058** for 3 pre-existing missing keys found by the i18n run.

## Resume point (for the next chat)
**Steps 1-7 DONE 2026-08-11. Only step 8 (owner: rebuild both apps and walk it) and step 9 (commit)
remain.** ❌ **No API deploy** — this card is app-side only.

**What changed:** every one of the **35** OS alert boxes is gone, replaced by the app's own toast or
dialog, and the create-offer screen now picks its date and times with in-app wheels instead of the
stock Android dialog. The two `confirmDialog.tsx` fallbacks deliberately remain.

🔴 **Three defects were fixed in passing, none of them the reported symptom:**
1. **Three driver screens had their photo strings hard-coded in Uzbek**, so Russian and English
   drivers were shown Uzbek on every photo upload.
2. **The OS time picker could not be cancelled on iOS** — it committed each spin. The new wheels
   commit only on Confirm.
3. **9 dead `Alert` imports** removed, so the next author cannot casually reach for it.

**What to check on the device:** create a passenger offer — the date and both times should open the
app's own wheel, and the success message should be the app's dialog, whose OK returns you to the
list. Then upload any driver document: camera/gallery should be the app's own sheet.

**Baselines:** API **281** · admin **0** · user **9** · driver **35**.
