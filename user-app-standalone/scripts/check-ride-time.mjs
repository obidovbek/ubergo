/**
 * Checks the order form's time rules. T-101 step 8f.
 *
 * Run: `node scripts/check-ride-time.mjs`  (plain node + esbuild, no new dependency)
 *
 * 🔴 WHY THIS EXISTS: the owner asked whether the design's date/time model was logical
 * (2026-09-01). It was not — see `utils/rideTime.ts` for the four defects. The worst was
 * silent: "leave between 08:00 and 11:00, arrive by 09:00" was ACCEPTED, because arrival
 * was compared against the START of the departure window. Nothing in `tsc`, ESLint or the
 * token ratchet can see a wrong comparison; only cases can.
 *
 * ⚠️ This IMPORTS the real `utils/rideTime.ts` rather than re-implementing it. A checker
 * holding its own copy of the logic passes while the app is broken — the failure mode
 * that made the 2026-08-30 i18n checker useless until it was rewritten to execute the
 * real translations.
 *
 * ⚠️ The user app has NO test runner (CLAUDE.md: only the API does), so this is a script
 * rather than a `*.test.ts`. It should become one the moment a runner is approved.
 *
 * ✅ PROVEN ABLE TO FAIL: reverting `latestDeparture` to use `departFrom` instead of
 * `departUntil` turns the first case red (exit 1).
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const bundle = path.join(root, '.ride-time.mjs');

execFileSync(
  'npx',
  [
    'esbuild',
    path.join(root, 'utils', 'rideTime.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${bundle}`,
  ],
  { stdio: 'pipe', shell: true },
);

const { latestDeparture, arrivalIsReachable, combineDateTime } = await import(
  `file://${bundle}?v=${Date.now()}`
);
fs.unlinkSync(bundle);

const DAY = new Date(2026, 8, 5); // 5 Sept 2026
const NEXT_DAY = new Date(2026, 8, 6);
const at = (h, m = 0) => {
  const d = new Date(DAY);
  d.setHours(h, m, 0, 0);
  return d;
};

/** Mirrors what `validateForm` now asks: is this order fulfillable? */
const accepts = ({
  departFrom = null,
  departUntil = null,
  arriveUntil = null,
  arriveDate = null,
  isUrgent = false,
}) => {
  const latest = latestDeparture({
    isUrgent,
    departDate: DAY,
    departFrom,
    departUntil,
    floor: DAY,
  });
  const arrive = arriveUntil
    ? combineDateTime(arriveDate ?? DAY, arriveUntil)
    : null;
  return arrivalIsReachable(arrive, latest);
};

const cases = [
  // ③ The defect this step fixed: the arrival was checked against the window's START.
  ['window 08-11, arrive by 09 — THE BUG', { departFrom: at(8), departUntil: at(11), arriveUntil: at(9) }, false],
  ['window 08-11, arrive by 12', { departFrom: at(8), departUntil: at(11), arriveUntil: at(12) }, true],
  ['window 08-11, arrive by 11 exactly', { departFrom: at(8), departUntil: at(11), arriveUntil: at(11) }, true],
  ['no window, leave 08, arrive by 09', { departFrom: at(8), arriveUntil: at(9) }, true],
  ['no window, leave 08, arrive by 07', { departFrom: at(8), arriveUntil: at(7) }, false],
  // The arrival is optional — most passengers do not control when they get there.
  ['no arrival given', { departFrom: at(8), departUntil: at(11) }, true],
  // ④ The overnight case, which is why the arrival DAY stays settable.
  ['overnight: leave 22, arrive 06 next day', { departFrom: at(22), arriveUntil: at(6), arriveDate: NEXT_DAY }, true],
  ['leave 22, arrive 06 SAME day', { departFrom: at(22), arriveUntil: at(6) }, false],
];

let failed = 0;
for (const [name, input, expected] of cases) {
  const got = accepts(input);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(42)} accepted=${got} expected=${expected}`,
  );
}

console.log(
  failed === 0 ? `\n✓ ${cases.length} ride-time cases pass` : `\n✗ ${failed} FAILED`,
);
process.exit(failed ? 1 : 0);
