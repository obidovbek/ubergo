/**
 * Who is allowed to move the passenger's search route. T-114 follow-up.
 *
 * 🛑 WHAT IT DEFENDS — two failure modes, both silent, in opposite directions:
 *   ① TOO LAX: the search tab never follows an edited order, and goes on showing the route
 *      that order had BEFORE the edit. That is the device report of 2026-09-13
 *      (*"after edit on user search page remains data before edit"*) and is what this rule
 *      was written for.
 *   ② TOO EAGER: the tab re-applies the stored route on every focus, silently overwriting a
 *      search the passenger set up by hand. The screen SAVES that same key on every change,
 *      so a rule that reacts to any write reacts to the screen's own.
 *
 * Neither throws. Neither shows up in `tsc`. The difference between them is one comparison.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const out = path.join(root, 'node_modules', '.cache', 'check-last-search.mjs');
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild utils/lastSearch.ts --bundle --format=esm --platform=neutral ` +
    `--external:@react-native-async-storage/async-storage --outfile="${out}" --log-level=error`,
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

// ── the rule ────────────────────────────────────────────────────────────────
ok(
  'adopt: a revision moved by someone else IS followed (the reported bug)',
  M.shouldAdoptLastSearch(3, 4) === true,
);
ok(
  'adopt: the same revision is NOT re-applied (the screen must not react to itself)',
  M.shouldAdoptLastSearch(4, 4) === false,
);
ok(
  'adopt: nothing stored, nothing to follow',
  M.shouldAdoptLastSearch(4, null) === false,
);
ok(
  'adopt: the FIRST focus never adopts — initialize() has just seeded the screen',
  M.shouldAdoptLastSearch(null, 7) === false,
);
ok(
  'adopt: neither side known is not a change',
  M.shouldAdoptLastSearch(null, null) === false,
);
/*
 * 🔴 A revision going BACKWARDS still counts as a change. Storage can be cleared and start
 * over at 1 while the screen holds 9; refusing that would strand the tab for the whole
 * session. "Different", not "greater", is deliberate.
 */
ok(
  'adopt: a revision that went BACKWARDS is still a change (storage can be reset)',
  M.shouldAdoptLastSearch(9, 1) === true,
);
ok('adopt: zero is a real revision, not "absent"', M.shouldAdoptLastSearch(0, 1) === true);
ok('adopt: zero on both sides is not a change', M.shouldAdoptLastSearch(0, 0) === false);

// ── the key must not drift from the screen's own constant ───────────────────
/*
 * ⚠️ `SearchOffersScreen` declares this key itself and its comment warns that renaming it
 * orphans every existing save. Two copies of a storage key is exactly the kind of thing that
 * drifts, so the value is compared against the screen's source rather than trusted.
 */
const screenSrc = fs.readFileSync(path.join(root, 'screens', 'SearchOffersScreen.tsx'), 'utf8');
const declared = screenSrc.match(/LAST_SEARCH_KEY = '([^']+)'/);
ok('key: the screen still declares a last-search key', !!declared);
ok(
  `key: it matches utils/lastSearch.ts (${M.LAST_SEARCH_KEY})`,
  !!declared && declared[1] === M.LAST_SEARCH_KEY,
);
ok(
  'key: the revision lives in its OWN key, not inside the 2026-08 payload',
  M.LAST_SEARCH_REVISION_KEY !== M.LAST_SEARCH_KEY,
);

if (fails.length) {
  console.error('FAIL last search: ' + fails.length + ' of ' + (pass + fails.length));
  for (const f of fails) console.error('   - ' + f);
  process.exit(1);
}
console.log('✓ last search: all ' + pass + ' assertions pass (adopt rule · storage keys)');
