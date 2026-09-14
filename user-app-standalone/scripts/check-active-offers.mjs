/**
 * The app's active-offer count, and whether it still agrees with the SERVER's. T-115, passenger side.
 *
 * 🛑 WHAT IT DEFENDS. The ceiling is enforced in the API; the app only DISPLAYS the count and
 * pre-empts the create. Those are two implementations of one rule, in two languages, in two
 * repositories' worth of code — the classic way a UI starts lying. A chip reading `1 / 2` in
 * front of a server that answers 409 is worse than no chip at all.
 *
 * So this does two things:
 *   ① executes the app's rule (statuses, past departures, the `>=` boundary), and
 *   ② reads the API's `src/utils/activeOffers.ts` and asserts the CONSTANTS still match.
 *
 * ⚠️ ② is a source-text comparison, not an import: the API is a separate project with its own
 * module system. It is deliberately narrow — the ceiling and the status list — because those
 * are the two values that change behaviour and the two a reader would change without thinking
 * about the other side.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const API = path.resolve(root, '..', 'api,admin,db', 'apps', 'api', 'src', 'utils', 'activeOffers.ts');

const out = path.join(root, 'node_modules', '.cache', 'check-active-offers.mjs');
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild utils/activeOffers.ts --bundle --format=esm --platform=neutral ` +
    `--outfile="${out}" --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);
const M = await import(pathToFileURL(out).href);
fs.rmSync(out, { force: true });

let pass = 0;
const fails = [];
const ok = (label, cond) => {
  if (cond) pass++;
  else fails.push(label);
};

const NOW = new Date('2026-09-13T12:00:00.000Z');
const SOON = '2026-09-13T18:00:00.000Z';
const PAST = '2026-09-12T18:00:00.000Z';
const offer = (status, start_at) => ({ status, start_at });

// ── the rule ────────────────────────────────────────────────────────────────
ok('counts a published order leaving later', M.isActiveOffer(offer('published', SOON), NOW) === true);
ok('does not count a cancelled order', M.isActiveOffer(offer('cancelled', SOON), NOW) === false);
ok('does not count an archived order', M.isActiveOffer(offer('archived', SOON), NOW) === false);
ok(
  'COUNTS a matched order — a driver is found but the ride has not happened',
  M.isActiveOffer(offer('driver_found', SOON), NOW) === true,
);
ok('does not count a completed order', M.isActiveOffer(offer('completed', SOON), NOW) === false);
ok(
  'does NOT count a published offer that has already departed',
  M.isActiveOffer(offer('published', PAST), NOW) === false,
);
ok(
  'counts one departing at this exact instant (>= , not >)',
  M.isActiveOffer(offer('published', '2026-09-13T12:00:00.000Z'), NOW) === true,
);
ok('an unparseable departure does not count', M.isActiveOffer(offer('published', 'x'), NOW) === false);
ok(
  'counts only the live, future ones in a mixed list',
  M.countActiveOffers(
    [
      offer('published', SOON),
      offer('published', PAST),
      offer('cancelled', SOON),
      offer('archived', SOON),
      offer('published', SOON),
    ],
    NOW,
  ) === 2,
);
ok('nothing held is zero', M.countActiveOffers([], NOW) === 0);
ok('one held is below the limit', M.isAtActiveLimit(1) === false);
ok('two held IS the limit (>=, so the third is refused)', M.isAtActiveLimit(2) === true);
ok('already over the ceiling still counts as at it', M.isAtActiveLimit(3) === true);

// ── ② the two sides still agree ─────────────────────────────────────────────
const apiSrc = fs.readFileSync(API, 'utf8');

const apiMax = apiSrc.match(/MAX_ACTIVE_OFFERS\s*=\s*(\d+)/);
ok('the API still declares a ceiling', !!apiMax);
ok(
  `the ceiling matches the API (app ${M.MAX_ACTIVE_OFFERS}, api ${apiMax ? apiMax[1] : '?'})`,
  !!apiMax && Number(apiMax[1]) === M.MAX_ACTIVE_OFFERS,
);

const apiStatuses = apiSrc.match(/PASSENGER_ACTIVE_STATUSES\s*=\s*\[([^\]]*)\]/);
ok('the API still declares the passenger status list', !!apiStatuses);
if (apiStatuses) {
  const parsed = apiStatuses[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
  ok(
    `the passenger status list matches the API ([${parsed}] vs [${M.PASSENGER_ACTIVE_STATUSES}])`,
    JSON.stringify(parsed) === JSON.stringify([...M.PASSENGER_ACTIVE_STATUSES]),
  );
}

/*
 * ⚠️ NO ARTBOARD BLOCK HERE, unlike the driver's copy. No `UserBuyurtma*` or `UserMening*`
 * board draws a limit at all — only `DriverMyOrder` does — so there is no third copy of the
 * number to compare against on this side. The API is the only authority that matters.
 */

if (fails.length) {
  console.error('FAIL active offers: ' + fails.length + ' of ' + (pass + fails.length));
  for (const f of fails) console.error('   - ' + f);
  process.exit(1);
}
console.log('✓ active offers: all ' + pass + ' assertions pass (rule · API parity)');
