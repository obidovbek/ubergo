/**
 * T-118 — runs every `scripts/check-*.mjs` in name order and stops at the first red one.
 *
 * `npm test` is `jest && node scripts/run-checks.mjs`: the Jest suite first, then the
 * checkers that predate it. The checkers are NOT being ported — they work and every one
 * has been proven able to go red. New pure-logic tests belong in Jest; this list should
 * stop growing.
 *
 * Each checker is its own process (they shell out to esbuild and `process.exit`), so a
 * red one cannot poison the next — and the exit code is the whole contract.
 *
 * Identical to the user app's copy on purpose (the two apps duplicate shared code).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const checks = fs
  .readdirSync(here)
  .filter((f) => f.startsWith('check-') && f.endsWith('.mjs'))
  .sort();

if (checks.length === 0) {
  console.error('run-checks: no check-*.mjs found next to this script');
  process.exit(1);
}

const started = Date.now();
for (const file of checks) {
  console.log(`\n── ${file} ──`);
  const result = spawnSync(process.execPath, [path.join(here, file)], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`\nrun-checks: ${file} is RED (exit ${result.status ?? 'signal'})`);
    process.exit(result.status ?? 1);
  }
}

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\nrun-checks: ${checks.length} checkers green in ${seconds}s`);
