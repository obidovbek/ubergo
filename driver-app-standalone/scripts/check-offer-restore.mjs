/**
 * T-101 step 16e — the EDIT path's endpoint restore.
 *
 * Bundles `utils/offerRestore.ts` with esbuild and executes it. Same pattern as
 * `check-offer-validation.mjs` and `check-offer-schedule.mjs` (no RN test runner exists;
 * adding one is a new dependency and the owner's call — CLAUDE.md rule 4).
 *
 * 🛑 What it defends: a saved offer that loads back INCOMPLETE. The next save then writes
 * the blanks over real data, with nothing erroring. That is the failure `OfferWizardScreen`
 * has warned about since T-078, and step 16e found a live instance of it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const out = path.join(root, 'node_modules', '.cache', 'check-offer-restore.mjs');
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild utils/offerRestore.ts --bundle --format=esm --platform=neutral ` +
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
const eq = (label, a, b) =>
  ok(label + ' (got ' + JSON.stringify(a) + ')', JSON.stringify(a) === JSON.stringify(b));

// ── splitLocationParts ──────────────────────────────────────────────────────
eq('split: plain list', M.splitLocationParts('Andijon, Asaka'), ['Andijon', 'Asaka']);
eq('split: trims and drops empties', M.splitLocationParts(' A ,, B , '), ['A', 'B']);
eq('split: null is empty', M.splitLocationParts(null), []);
eq('split: undefined is empty', M.splitLocationParts(undefined), []);
eq('split: empty string', M.splitLocationParts(''), []);

// ── namesMultipleCities ─────────────────────────────────────────────────────
ok('multi: two bare cities', M.namesMultipleCities('Andijon, Asaka') === true);
ok('multi: three bare cities', M.namesMultipleCities('Andijon, Asaka, Shahrixon') === true);
ok('multi: single city is not multi', M.namesMultipleCities('Andijon') === false);
ok(
  'multi: city+province is NOT multi',
  M.namesMultipleCities('Andijon, Andijon viloyati') === false,
);
ok(
  'multi: city+province+country is NOT multi',
  M.namesMultipleCities('Andijon, Andijon viloyati, Ozbekiston') === false,
);
ok(
  'multi: respublika also disqualifies',
  M.namesMultipleCities('Nukus, Qoraqalpogiston Respublikasi') === false,
);
ok(
  'multi: case insensitive on VILOYAT',
  M.namesMultipleCities('Andijon, ANDIJON VILOYATI') === false,
);
ok('multi: empty is not multi', M.namesMultipleCities('') === false);
ok('multi: null is not multi', M.namesMultipleCities(null) === false);
ok('multi: trailing comma is not multi', M.namesMultipleCities('Andijon,') === false);

// ── matchCitiesByName ───────────────────────────────────────────────────────
const CITIES = [
  { id: 'c1', name: 'Andijon' },
  { id: 'c2', name: 'Asaka' },
  { id: 'c3', name: 'Shahrixon' },
];
eq(
  'match: exact names in order',
  M.matchCitiesByName(['Asaka', 'Andijon'], CITIES).map((c) => c.id),
  ['c2', 'c1'],
);
eq('match: case insensitive', M.matchCitiesByName(['aNDIJON'], CITIES).map((c) => c.id), [
  'c1',
]);
eq(
  'match: unknown name is skipped',
  M.matchCitiesByName(['Andijon', 'Nowhere'], CITIES).map((c) => c.id),
  ['c1'],
);
eq(
  'match: duplicate name yields one city',
  M.matchCitiesByName(['Andijon', 'Andijon'], CITIES).map((c) => c.id),
  ['c1'],
);
eq('match: nothing matches', M.matchCitiesByName(['Xyz'], CITIES), []);
eq('match: empty input', M.matchCitiesByName([], CITIES), []);
eq(
  'match: contained-by (saved text is longer)',
  M.matchCitiesByName(['Andijon shahri'], CITIES).map((c) => c.id),
  ['c1'],
);

// ── resolveEndpointRestore — the convention the render path depends on ──────
eq('resolve: none', M.resolveEndpointRestore([]), { city: null, cities: [] });
eq('resolve: ONE city goes to `city` and clears `cities`', M.resolveEndpointRestore([CITIES[0]]), {
  city: CITIES[0],
  cities: [],
});
eq('resolve: TWO cities clear `city` and fill `cities`', M.resolveEndpointRestore([CITIES[0], CITIES[1]]), {
  city: null,
  cities: [CITIES[0], CITIES[1]],
});
eq(
  'resolve: order is preserved (first is primary)',
  M.resolveEndpointRestore([CITIES[2], CITIES[0]]).cities.map((c) => c.id),
  ['c3', 'c1'],
);
eq('resolve: duplicates collapse to a SINGLE selection', M.resolveEndpointRestore([CITIES[0], CITIES[0]]), {
  city: CITIES[0],
  cities: [],
});

// 🔴 The invariant the screen renders on: the two fields are never both populated.
for (const input of [[], [CITIES[0]], [CITIES[0], CITIES[1]], [CITIES[0], CITIES[0]]]) {
  const r = M.resolveEndpointRestore(input);
  ok(
    'invariant: never both `city` and `cities` (' + input.length + ' in)',
    !(r.city !== null && r.cities.length > 0),
  );
}

// ── stopBelongsToEndpoint ───────────────────────────────────────────────────
const EP = { countryId: 'u1', provinceId: 'p1' };
ok(
  'stop: same country+province belongs to the endpoint',
  M.stopBelongsToEndpoint({ countryId: 'u1', provinceId: 'p1' }, EP) === true,
);
ok(
  'stop: different province is a real stop',
  M.stopBelongsToEndpoint({ countryId: 'u1', provinceId: 'p2' }, EP) === false,
);
ok(
  'stop: different country is a real stop',
  M.stopBelongsToEndpoint({ countryId: 'u2', provinceId: 'p1' }, EP) === false,
);
ok(
  'stop: unparsed stop is a real stop, not swallowed',
  M.stopBelongsToEndpoint({ countryId: null, provinceId: null }, EP) === false,
);
ok(
  'stop: unresolved endpoint swallows nothing',
  M.stopBelongsToEndpoint({ countryId: 'u1', provinceId: 'p1' }, { countryId: null, provinceId: null }) ===
    false,
);

// ── ROUND TRIP: save → load, the assertion this whole step exists for ───────
// `handleSave` writes a multi-city endpoint as a bare joined city list
// (`resolveEndpointSelection`), and `loadExistingOffer` must recognise that shape and
// rebuild the SAME selection.
const roundTrip = (picked) => {
  const savedText =
    picked.length > 1
      ? picked.map((c) => c.name).join(', ')
      : picked.length === 1
        ? picked[0].name + ', Andijon viloyati'
        : '';
  const isMulti = M.namesMultipleCities(savedText);
  const names = M.splitLocationParts(savedText);
  const matched = isMulti
    ? M.matchCitiesByName(names, CITIES)
    : M.matchCitiesByName(names.slice(0, 1), CITIES);
  return M.resolveEndpointRestore(matched);
};
eq('round trip: two cities survive a save+load', roundTrip([CITIES[0], CITIES[1]]), {
  city: null,
  cities: [CITIES[0], CITIES[1]],
});
eq(
  'round trip: three cities survive',
  roundTrip([CITIES[0], CITIES[1], CITIES[2]]).cities.map((c) => c.id),
  ['c1', 'c2', 'c3'],
);
eq('round trip: one city stays a single selection', roundTrip([CITIES[0]]), {
  city: CITIES[0],
  cities: [],
});
eq('round trip: no endpoint stays empty', roundTrip([]), { city: null, cities: [] });

// 🔴 The exact defect 16e found: the restore must NOT depend on stops existing.
ok(
  'round trip: multi-city restore does not consult stops at all',
  JSON.stringify(roundTrip([CITIES[0], CITIES[1]])) ===
    JSON.stringify(M.resolveEndpointRestore(M.matchCitiesByName(['Andijon', 'Asaka'], CITIES))),
);



if (fails.length) {
  console.error('FAIL offer restore: ' + fails.length + ' of ' + (pass + fails.length));
  for (const f of fails) console.error('   - ' + f);
  process.exit(1);
}
console.log(
  '✓ offer restore: all ' +
    pass +
    ' assertions pass (split · multi-detect · match · resolve · stops · round trip)',
);
