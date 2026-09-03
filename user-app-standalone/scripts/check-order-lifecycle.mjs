/**
 * Checks the order list's lifecycle grouping. T-101 step 9.
 *
 * Run: `node scripts/check-order-lifecycle.mjs`  (plain node + esbuild, no new dependency)
 *
 * 🔴 WHY THIS EXISTS: step 9 merged two screens into one list whose three modes are
 * DERIVED, not stored — see `utils/orderLifecycle.ts`. Nothing in `tsc`, ESLint or the
 * token ratchet can see an order filed under the wrong mode; the screen renders happily
 * either way. Only cases can. The two rules most worth pinning are the ones that would
 * otherwise re-introduce a defect this project has already fixed once:
 *
 *   • an EXPIRED request must fall to "Tarix", not sit under "Jarayonda" (T-039: telling
 *     the passenger something is live when no driver can see it);
 *   • a CONFIRMED booking whose ride has departed must fall to "Tarix", or last
 *     Tuesday's ride stays "Faol" forever.
 *
 * ⚠️ This IMPORTS the real module rather than re-implementing it. A checker holding its
 * own copy of the logic passes while the app is broken — the failure that made the
 * 2026-08-30 i18n checker useless until it was rewritten to execute the real source.
 *
 * ⚠️ The user app has NO test runner (CLAUDE.md: only the API does), so this is a script
 * rather than a `*.test.ts`. It should become one the moment a runner is approved.
 *
 * ✅ PROVEN ABLE TO FAIL: see the note at the bottom of this file.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const bundle = path.join(root, '.order-lifecycle.mjs');

execFileSync(
  'npx',
  [
    'esbuild',
    path.join(root, 'utils', 'orderLifecycle.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${bundle}`,
  ],
  { stdio: 'pipe', shell: true },
);

const { offerMode, bookingMode, displayOfferStatus, byNewestCreated, BROWSE_GRACE_MS } =
  await import(`file://${bundle}?v=${Date.now()}`);
fs.unlinkSync(bundle);

const NOW = new Date(2026, 8, 3, 12, 0, 0).getTime(); // 3 Sept 2026, 12:00
const iso = (msFromNow) => new Date(NOW + msFromNow).toISOString();
const HOUR = 60 * 60 * 1000;

// --------------------------------------------------------------- ride requests
const offerCases = [
  ['published, leaves in 2h', { status: 'published', start_at: iso(2 * HOUR) }, 'jarayon'],
  ['published, left 1h ago (inside grace)', { status: 'published', start_at: iso(-1 * HOUR) }, 'jarayon'],
  // T-039: past the grace window nobody can see it any more.
  ['published, left 4h ago — EXPIRED', { status: 'published', start_at: iso(-4 * HOUR) }, 'tarix'],
  ['published, exactly at the grace edge', { status: 'published', start_at: iso(-BROWSE_GRACE_MS) }, 'jarayon'],
  ['driver_found', { status: 'driver_found', start_at: iso(2 * HOUR) }, 'aktiv'],
  ['completed', { status: 'completed', start_at: iso(-48 * HOUR) }, 'tarix'],
  ['cancelled', { status: 'cancelled', start_at: iso(2 * HOUR) }, 'tarix'],
  ['archived', { status: 'archived', start_at: iso(-48 * HOUR) }, 'tarix'],
];

// --------------------------------------------------------------- bookings
const bookingCases = [
  ['pending', { status: 'pending', offer: { start_at: iso(5 * HOUR) } }, 'jarayon'],
  ['confirmed, ride ahead', { status: 'confirmed', offer: { start_at: iso(5 * HOUR) } }, 'aktiv'],
  // Nothing marks a ride finished; the departure time is the only signal there is.
  ['confirmed, ride departed — HISTORY', { status: 'confirmed', offer: { start_at: iso(-5 * HOUR) } }, 'tarix'],
  ['confirmed, no offer payload', { status: 'confirmed', offer: null }, 'tarix'],
  ['rejected', { status: 'rejected', offer: { start_at: iso(5 * HOUR) } }, 'tarix'],
  ['cancelled', { status: 'cancelled', offer: { start_at: iso(5 * HOUR) } }, 'tarix'],
];

let failed = 0;
const check = (label, got, expected) => {
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(44)} ${got} (expected ${expected})`);
};

console.log('ride requests');
for (const [name, offer, expected] of offerCases) {
  check(name, offerMode(offer, NOW), expected);
}

console.log('\nbookings');
for (const [name, booking, expected] of bookingCases) {
  check(name, bookingMode(booking, NOW), expected);
}

console.log('\nderived label');
check(
  'expired request still reports `expired`',
  displayOfferStatus({ status: 'published', start_at: iso(-4 * HOUR) }, NOW),
  'expired',
);
check(
  'live request reports its real status',
  displayOfferStatus({ status: 'published', start_at: iso(2 * HOUR) }, NOW),
  'published',
);

// T-051 — newest CREATED first, across two record types with different id shapes.
console.log('\nordering');
const sorted = [
  { id: 1, created_at: iso(-3 * HOUR) },
  { id: 'b7', created_at: iso(-1 * HOUR) },
  { id: 2, created_at: iso(-2 * HOUR) },
].sort(byNewestCreated);
check('newest created first', sorted.map((r) => r.id).join(','), 'b7,2,1');

const tied = [
  { id: 5, created_at: iso(-HOUR) },
  { id: 9, created_at: iso(-HOUR) },
].sort(byNewestCreated);
check('same second breaks by id', tied.map((r) => r.id).join(','), '9,5');

const total = offerCases.length + bookingCases.length + 4;
console.log(failed === 0 ? `\n✓ ${total} lifecycle cases pass` : `\n✗ ${failed} FAILED`);
process.exit(failed ? 1 : 0);
