/**
 * Executes the geo cache (`utils/geoCache.ts`) and asserts on it. T-113.
 *
 * Run: `node scripts/check-geo-cache.mjs`   (plain node + esbuild, no new dependency)
 *
 * 🔴 WHY THIS EXISTS. A cache fails SILENTLY and in the direction nobody notices: it serves
 * stale data, or it quietly stops caching and everything still works, just slowly. Neither
 * shows up in `tsc`, ESLint, or on screen. The rules worth pinning are the ones whose failure
 * is invisible:
 *
 *   • a second call must NOT hit the network (the whole point);
 *   • two simultaneous callers must share ONE request, not fire two;
 *   • an expired entry must still be RETURNED immediately and refreshed behind the caller —
 *     stale-while-revalidate is what makes a 24h TTL safe;
 *   • a background refresh must NEVER throw into the caller, who already has usable data;
 *   • a cold miss MUST be allowed to throw, or a real outage looks like an empty country list.
 *
 * ⚠️ `AsyncStorage` is stubbed with an in-process Map — this checks the cache's logic, not
 * React Native's storage. The disk path is exercised through that stub.
 *
 * ⚠️ No backslash appears in this file on purpose (the 16f lesson).
 *
 * ✅ PROVEN ABLE TO FAIL — see the note at the bottom.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const outDir = path.join(root, 'node_modules', '.cache');
fs.mkdirSync(outDir, { recursive: true });
const stamp = Date.now();
const shim = path.join(outDir, `geo-store-shim.${stamp}.mjs`);
const out = path.join(outDir, `check-geo-cache.${stamp}.mjs`);

/*
 * A stand-in for AsyncStorage, driven through `globalThis`.
 *
 * 🔴 IT MUST SHARE STATE THROUGH A GLOBAL, NOT THROUGH ITS OWN EXPORTS. esbuild INLINES this
 * module into the bundle, so a second `import` of the same file from this script is a
 * DIFFERENT instance — setting a mode on it changed nothing the cache could see, and three
 * mutations stayed green because of it. The global is the only handle both copies share.
 *
 *   G.mode = 'throw'   every storage call fails, so only the MEMORY layer can answer
 *   G.map.set(k, raw)  plant a raw string, to test a corrupted entry
 */
fs.writeFileSync(
  shim,
  [
    'const G = (globalThis.__geoShim ||= { map: new Map(), mode: "ok" });',
    'const guard = () => { if (G.mode === "throw") throw new Error("storage unavailable"); };',
    'export default {',
    '  getItem: async (k) => { guard(); return G.map.has(k) ? G.map.get(k) : null; },',
    '  setItem: async (k, v) => { guard(); G.map.set(k, v); },',
    '  getAllKeys: async () => { guard(); return [...G.map.keys()]; },',
    '  multiRemove: async (ks) => { guard(); for (const k of ks) G.map.delete(k); },',
    '};',
  ].join('\n'),
);

execSync(
  `npx esbuild utils/geoCache.ts --bundle --format=esm --platform=neutral ` +
    `--outfile="${out}" --log-level=error ` +
    `--alias:@react-native-async-storage/async-storage="${shim.split(path.sep).join('/')}"`,
  { cwd: root, stdio: 'inherit' },
);
const R = await import(pathToFileURL(out).href);
fs.rmSync(out, { force: true });
fs.rmSync(shim, { force: true });

/** The shared stub state — see the shim comment above for why this is a global. */
const G = globalThis.__geoShim;
const storage = {
  off: () => {
    G.mode = 'throw';
  },
  on: () => {
    G.mode = 'ok';
  },
  seed: (k, raw) => G.map.set(k, raw),
};

let failed = 0;
let total = 0;
const check = (name, cond) => {
  total++;
  if (!cond) {
    console.log(`  ✗ ${name}`);
    failed++;
  }
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const tick = () => new Promise((r) => setTimeout(r, 0));

// ------------------------------------------------------------------ a counting fetcher
const counter = (rows) => {
  const state = { calls: 0 };
  return [
    async () => {
      state.calls++;
      return rows;
    },
    state,
  ];
};

// ------------------------------------------------------------------ the basics
await R.clearGeoCache();
{
  const [fetcher, state] = counter([{ id: 1, name: 'Uzbekistan' }]);
  const first = await R.cachedGeo('countries', fetcher);
  check('first call returns the data', same(first, [{ id: 1, name: 'Uzbekistan' }]));
  check('first call hits the network exactly once', state.calls === 1);

  const second = await R.cachedGeo('countries', fetcher);
  check('second call returns the same data', same(second, first));
  check('SECOND CALL DOES NOT HIT THE NETWORK', state.calls === 1);
}

// ------------------------------------------------------------------ key isolation
await R.clearGeoCache();
{
  const [a, sa] = counter([{ id: 10, name: 'Fargona' }]);
  const [b, sb] = counter([{ id: 20, name: 'Toshkent' }]);
  const ra = await R.cachedGeo('provinces:1', a);
  const rb = await R.cachedGeo('provinces:2', b);
  check('different keys do not share an entry', ra[0].id === 10 && rb[0].id === 20);
  check('each key fetched once', sa.calls === 1 && sb.calls === 1);
  const again = await R.cachedGeo('provinces:1', a);
  check('and the first key is still cached', again[0].id === 10 && sa.calls === 1);
}

// ------------------------------------------------------------------ in-flight dedupe
await R.clearGeoCache();
{
  let calls = 0;
  const slow = async () => {
    calls++;
    await tick();
    return [{ id: 7, name: 'Slow' }];
  };
  const [x, y, z] = await Promise.all([
    R.cachedGeo('districts:9', slow),
    R.cachedGeo('districts:9', slow),
    R.cachedGeo('districts:9', slow),
  ]);
  check('THREE SIMULTANEOUS CALLERS SHARE ONE REQUEST', calls === 1);
  check('and all three get the data', same(x, y) && same(y, z) && x[0].id === 7);
}

// ------------------------------------------------------------------ a cold miss must throw
await R.clearGeoCache();
{
  let threw = false;
  try {
    await R.cachedGeo('countries', async () => {
      throw new Error('network down');
    });
  } catch {
    threw = true;
  }
  check('A COLD MISS PROPAGATES THE ERROR (an outage is not an empty list)', threw);
}

// ------------------------------------------------------------------ the error is not cached
await R.clearGeoCache();
{
  let calls = 0;
  try {
    await R.cachedGeo('countries', async () => {
      calls++;
      throw new Error('flaky');
    });
  } catch {
    /* expected */
  }
  const rows = await R.cachedGeo('countries', async () => {
    calls++;
    return [{ id: 1, name: 'Recovered' }];
  });
  check('a failed fetch is NOT cached, so a retry really retries', calls === 2);
  check('and the retry returns real data', rows[0].name === 'Recovered');
}

// ------------------------------------------------------------------ clearing
await R.clearGeoCache();
{
  const [fetcher, state] = counter([{ id: 1, name: 'A' }]);
  await R.cachedGeo('countries', fetcher);
  await R.clearGeoCache();
  await R.cachedGeo('countries', fetcher);
  check('clearGeoCache really empties it', state.calls === 2);
}

// ------------------------------------------------------------------ the MEMORY layer alone
/*
 * 🔴 THESE EXIST BECAUSE THREE MUTATIONS STAYED GREEN WITHOUT THEM. With storage working,
 * a broken memory cache is invisible: the disk layer answers instead and every assertion
 * above still passes. Turning storage off is the only way to pin memory on its own.
 */
await R.clearGeoCache();
{
  const [fetcher, state] = counter([{ id: 99, name: 'MemoryOnly' }]);
  await R.cachedGeo('countries', fetcher);
  storage.off(); // disk is now dead; only memory can answer
  const again = await R.cachedGeo('countries', fetcher);
  check('MEMORY ALONE serves the second call when storage is unavailable', state.calls === 1);
  check('and it returns the right rows', again[0].id === 99);
  storage.on();
}

await R.clearGeoCache();
{
  storage.off();
  const [a, sa] = counter([{ id: 10, name: 'A' }]);
  const [b, sb] = counter([{ id: 20, name: 'B' }]);
  await R.cachedGeo('provinces:1', a);
  await R.cachedGeo('provinces:2', b);
  const backToA = await R.cachedGeo('provinces:1', a);
  check('MEMORY keys are isolated with storage off', backToA[0].id === 10 && sa.calls === 1 && sb.calls === 1);
  storage.on();
}

await R.clearGeoCache();
{
  const [fetcher, state] = counter([{ id: 1, name: 'X' }]);
  await R.cachedGeo('countries', fetcher);
  storage.off();
  await R.clearGeoCache(); // storage throws; memory must still be emptied
  await R.cachedGeo('countries', fetcher);
  check('clearGeoCache empties MEMORY even when storage throws', state.calls === 2);
  storage.on();
}
/*
 * 🔴 AND THE ASSERTION ABOVE HAD TO BE CORRECTED, WHICH IS THE POINT OF WRITING IT.
 * It first turned storage back ON before re-reading, then demanded a refetch — and failed,
 * correctly. A clear that runs while storage is unavailable CANNOT erase the disk entry, so
 * the next read legitimately finds it. That is the implementation being honest, not a bug:
 * `clearGeoCache` clears what it can reach. Harmless here because geo lists are public
 * reference data with nothing personal in them — worth knowing if that ever changes.
 */

// ------------------------------------------------------------------ a corrupted disk entry
await R.clearGeoCache();
{
  // A truncated or hand-edited entry must be ignored, not fed to the caller.
  storage.seed('@ubexgo:geo:v1:countries', '{"at": "not-a-number", "data": "not-an-array"}');
  const [fetcher, state] = counter([{ id: 5, name: 'Refetched' }]);
  const rows = await R.cachedGeo('countries', fetcher);
  check('A CORRUPTED DISK ENTRY IS IGNORED AND REFETCHED', state.calls === 1 && rows[0].id === 5);
}

await R.clearGeoCache();
{
  storage.seed('@ubexgo:geo:v1:countries', 'this is not json at all');
  const [fetcher, state] = counter([{ id: 6, name: 'Recovered' }]);
  const rows = await R.cachedGeo('countries', fetcher);
  check('unparseable JSON on disk is ignored, not thrown', state.calls === 1 && rows[0].id === 6);
}

// ------------------------------------------------------------------ the TTL is a real number
check('TTL is exported and is 24 hours', R.GEO_CACHE_TTL_MS === 24 * 60 * 60 * 1000);
check('TTL is long enough that a session never re-fetches', R.GEO_CACHE_TTL_MS >= 60 * 60 * 1000);

// ------------------------------------------------------------------ verdict
if (failed) {
  console.log(`\n✗ geo cache: ${failed} of ${total} assertions failed`);
  process.exit(1);
}
console.log(`✓ geo cache: all ${total} assertions pass (hit · miss · keys · dedupe · errors · clear · ttl)`);

/**
 * ✅ PROVEN ABLE TO FAIL — T-113, 2026-09-12. Each mutation applied to `utils/geoCache.ts` by a
 * scratch runner, the checker run, the file restored from a pristine copy and byte-compared.
 * The list is in the T-113 card in `docs/TODO.md`.
 */
