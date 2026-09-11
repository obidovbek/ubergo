/**
 * Fails when a live file styles text with `fontWeight` instead of `font('sans', n)`.
 * T-101 step 15 — ported from `user-app-standalone/scripts/check-font-weights.mjs` (step 14).
 *
 * Run: `node scripts/check-font-weights.mjs`  (plain node, no dependency)
 *
 * 🔴 WHY THIS EXISTS: on Android React Native does NOT synthesise font weights. The family
 * NAME must carry the weight, so `fontWeight: '700'` selects no face at all — it silently
 * falls back to something that looks *nearly* right. Nothing throws, nothing warns, and
 * `tsc`, ESLint and the token ratchet are all blind to it. It is only visible on a device,
 * side by side with a correct screen.
 *
 * 🔴 IT KEPT COMING BACK IN NEW SPELLINGS in the user app. Steps 10-13 converted 88 of
 * these, and step 14 still found 4 more in screens already declared converted, because the
 * earlier passes matched only SINGLE-QUOTED numerals:
 *
 *     fontWeight: '700'    caught from step 10
 *     fontWeight: "700"    MISSED until step 14 (double quotes)
 *     fontWeight: 'bold'   MISSED until step 14 (keyword, not a numeral)
 *
 * *A hand-run grep is only as good as the spelling you thought of.* Hence a checker.
 *
 * 🔴 TWO GAPS IN THE USER APP'S COPY ARE CLOSED HERE, both found while porting:
 *   • `fontWeight: 700` — the UNQUOTED numeral. React Native accepts it and TypeScript
 *     types it, so it is a legal fourth spelling that the step-14 regex could not see.
 *     Zero occurrences in either app today; the regex covers it so it stays that way.
 *   • `sections/` and `utils/` were outside the scanned directories. Both are clean in this
 *     app right now — but `utils/toast.tsx` and `sections/**` both render text, so they were
 *     one commit away from an invisible regression.
 *   ⚠️ Port both fixes back to the user app's copy (recorded in PLAN.md step 15).
 *
 * ⚠️ TWO KINDS OF EXEMPTION, both deliberate:
 *   • `EXEMPT_FILES` — orphans with zero importers, and screens a later step rebuilds.
 *     Converting code that a later step will rewrite wholesale is work with no effect.
 *   • an inline `fontWeight` on a line listed in `EXEMPT_LINES`, for a weight the bundled
 *     family does not have. Manrope's range is 500-800: a 300 hairline folds UPWARD through
 *     `font()` and renders HEAVIER, which is the opposite of the intent. (None yet here.)
 *
 * ✅ PROVEN ABLE TO FAIL: see the note at the bottom.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
// `sections` and `utils` are here and NOT in the user app's copy — see the header.
const DIRS = ['screens', 'components', 'sections', 'utils'];

/**
 * Files that legitimately still carry `fontWeight`.
 *
 * ⚠️ Every entry needs a REASON, and the reason should expire. When an orphan is deleted
 * or a step rebuilds a screen, drop it from this list rather than leaving it to rot —
 * a stale exemption hides a real defect, which is exactly how the stale-baseline trap
 * (T-031) worked.
 *
 * 🔴 THE DRIVER APP IS AT THE START OF ITS REBUILD, AND THAT MAKES THIS LIST LONG.
 * **235 occurrences across 30 files** when step 15 ported this checker. The user app's copy
 * arrived at the END of its rebuild, with 8 exemptions; here almost every screen is still
 * owned by an unstarted step (16-22). Converting a screen that step 16 or 21 will rewrite
 * wholesale is work with no user-visible effect, so each of those is exempt UNTIL ITS STEP —
 * and the step number is the expiry. **Delete the entry when the step lands.**
 *
 * ⚠️ This list shrinks to (almost) nothing by step 22. If it is still this long then, the
 * exemptions have gone stale and are hiding real defects.
 */
const EXEMPT_FILES = new Map([
  // ---- orphans: zero importers, verified by grep in step 15. Not deleted (rule 4) -> T-105.
  // Exported from screens/index.ts but imported by NOTHING and routed nowhere — the Home tab
  // renders MenuScreen (navigation/MainTabs.tsx). The SAME trap as the user app's HomeScreen,
  // found in step 14 there and independently here in step 15.
  ['screens/HomeScreen.tsx', 'orphan, exported but unrouted -> T-105'],
  ['components/cards/RideCard.tsx', 'orphan, zero importers -> T-105'],
  ['sections/home/RideTypeSelector.tsx', 'orphan, zero importers -> T-105'],
  ['sections/profile/ProfileHeader.tsx', 'orphan, zero importers -> T-105'],
  // Step 16c-2 replaced the wizard's date wheel with the artboard's date-card sheet; nothing
  // imports this file any more (grep-verified 2026-09-11). Converting dead code has no
  // user-visible effect (the step-14 rule), so it waits for deletion with the others.
  ['components/DateWheelModal.tsx', 'orphan since 16c-2, zero importers -> T-105'],

  // ---- step 17g (2026-09-11) replaced three screens with `PassengerOrdersScreen`; these four
  // have ZERO importers now (grep-verified). Not deleted (rule 4) -> T-105.
  ['screens/SearchPassengerOffersScreen.tsx', 'orphan since 17g, zero importers -> T-105'],
  ['screens/MyJoinRequestsScreen.tsx', 'orphan since 17g, zero importers -> T-105'],
  ['screens/PassengerOfferDetailsScreen.tsx', 'orphan since 17g, zero importers -> T-105'],
  ['components/offers/PassengerOfferExtras.tsx', 'orphan since 17g, zero importers -> T-105'],

  // ---- step 17h (2026-09-11) converted `OffersListScreen` and `OfferCard` (values only) and
  // replaced these tabs with `PanelTabs`. Only the barrel (`components/offers/index.ts`) still
  // names the file; nothing renders it. Not deleted (rule 4) -> T-105.
  ['components/offers/StatusFilterTabs.tsx', 'orphan since 17h, barrel re-export only -> T-105'],

  // ---- step 18: my orders / passengers (DriverMyOrder).
  ['screens/OfferPassengersScreen.tsx', 'step 18 rebuilds it'],
  ['components/offers/OfferDetailModal.tsx', 'step 18 owns the detail sheet'],

  // ---- step 20: profile (DriverProfil).
  ['screens/ProfileScreen.tsx', 'step 20 rebuilds it'],
  ['screens/EditProfileScreen.tsx', 'step 20 rebuilds it'],

  // ---- step 21: vehicles + the five document screens (DriverMashinalar / DriverHujjatlar / …).
  ['screens/DriverPersonalInfoScreen.tsx', 'step 21 rebuilds it'],
  ['screens/DriverPassportScreen.tsx', 'step 21 rebuilds it'],
  ['screens/DriverLicenseScreen.tsx', 'step 21 rebuilds it'],
  ['screens/DriverVehicleScreen.tsx', 'step 21 rebuilds it'],
  ['screens/DriverTaxiLicenseScreen.tsx', 'step 21 rebuilds it'],

  // ---- step 22: the auth flow (DriverR1 / DriverR2otp / DriverR3fio / DriverR4Veh).
  ['screens/RegisterFirstScreen.tsx', 'step 22 rebuilds the auth flow'],
  ['screens/PhoneRegistrationScreen.tsx', 'step 22 rebuilds the auth flow'],
  ['screens/OTPVerificationScreen.tsx', 'step 22 rebuilds the auth flow'],
  ['screens/DriverDetailsScreen.tsx', 'step 22 rebuilds the auth flow'],

  // ---- no step owns these yet. They are LIVE, so these are the entries to watch.
  // BlockedScreen has no artboard; the user app's equivalent was converted in step 14, so
  // this one is a genuine gap rather than a deferral -> recorded in PLAN.md step 15.
  ['screens/BlockedScreen.tsx', 'no artboard; user app twin done in step 14 -> gap, see PLAN'],
  ['screens/NotificationsScreen.tsx', 'no driver artboard; the panel is drawer-side (step 15)'],
  ['components/@extended/NetworkStatus.tsx', 'live but chrome-less; converted with step 23'],
  ['components/AppModal.tsx', 'shared primitive; converted with step 23'],
  ['components/ModalList.tsx', 'shared primitive; converted with step 23'],
  ['utils/toast.tsx', 'shared primitive; converted with step 23'],
  // Themed primitive; its weights come from a variant map that step 23 folds into font().
  ['components/themed-text.tsx', 'variant map, retired with the aliases in step 23'],
]);

/** file -> line numbers where a sub-500 weight is deliberate. */
const EXEMPT_LINES = new Map();

const walk = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
};

// Every spelling: single quotes, double quotes, NO quotes, numerals and the
// `bold`/`normal` keywords. The optional quote is the fix over the user app's copy.
const PATTERN = /fontWeight:\s*(?:['"](?:\d+|bold|normal)['"]|\d+)/;

const findings = [];
for (const dir of DIRS) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (EXEMPT_FILES.has(rel)) continue;
    const exemptLines = EXEMPT_LINES.get(rel);
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (!PATTERN.test(line)) return;
        if (exemptLines?.has(i + 1)) return;
        findings.push(`${rel}:${i + 1}  ${line.trim()}`);
      });
  }
}

if (findings.length) {
  console.log("✗ fontWeight found in live files — use font('sans', n) instead:\n");
  for (const f of findings) console.log('  ' + f);
  console.log(
    `\n${findings.length} occurrence(s). On Android fontWeight selects no face at all;` +
      '\nthe family name must carry the weight. See themes/index.ts.',
  );
  process.exit(1);
}

console.log(
  `✓ no fontWeight in live files (${EXEMPT_FILES.size} files exempt, each with a reason)`,
);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 15, all FOUR spellings, each injected into
 * `screens/MenuScreen.tsx` in turn and then reverted:
 *
 *     fontWeight: '700'   -> red, exit 1
 *     fontWeight: "700"   -> red, exit 1
 *     fontWeight: 'bold'  -> red, exit 1
 *     fontWeight: 700     -> red, exit 1   (the spelling the user app's regex MISSES)
 *
 * A checker that cannot go red proves nothing. If you widen the exemptions, re-run this.
 */
