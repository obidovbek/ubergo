/**
 * Fails when a live file styles text with `fontWeight` instead of `font('sans', n)`.
 * T-101 step 14.
 *
 * Run: `node scripts/check-font-weights.mjs`  (plain node, no dependency)
 *
 * 🔴 WHY THIS EXISTS: on Android React Native does NOT synthesise font weights. The family
 * NAME must carry the weight, so `fontWeight: '700'` selects no face at all — it silently
 * falls back to something that looks *nearly* right. Nothing throws, nothing warns, and
 * `tsc`, ESLint and the token ratchet are all blind to it. It is only visible on a device,
 * side by side with a correct screen.
 *
 * 🔴 AND IT KEPT COMING BACK IN NEW SPELLINGS. Step 10 converted 34 of these; step 11
 * another 12; step 12 another 14; step 13 another 28 — and step 14 then found 4 more in
 * screens already declared converted, because the earlier passes matched only
 * SINGLE-QUOTED numerals:
 *
 *     fontWeight: '700'    caught from step 10
 *     fontWeight: "700"    MISSED until step 14 (double quotes)
 *     fontWeight: 'bold'   MISSED until step 14 (keyword, not a numeral)
 *
 * *A hand-run grep is only as good as the spelling you thought of.* Hence a checker.
 *
 * ⚠️ TWO KINDS OF EXEMPTION, both deliberate:
 *   • `EXEMPT_FILES` — orphans with zero importers, and screens a later step rebuilds.
 *     Converting dead code is work with no user-visible effect.
 *   • an inline `fontWeight` on a line-range listed in `EXEMPT_LINES`, for a weight the
 *     bundled family does not have. Manrope's range is 500-800: a 300 hairline folds
 *     UPWARD through `font()` and renders HEAVIER, which is the opposite of the intent.
 *
 * ✅ PROVEN ABLE TO FAIL: see the note at the bottom.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const DIRS = ['screens', 'components'];

/**
 * Files that legitimately still carry `fontWeight`.
 *
 * ⚠️ Every entry needs a REASON, and the reason should expire. When an orphan is deleted
 * or a step rebuilds a screen, drop it from this list rather than leaving it to rot —
 * a stale exemption hides a real defect, which is exactly how the stale-baseline trap
 * (T-031) worked.
 */
const EXEMPT_FILES = new Map([
  // Orphaned by step 9's merge; not deleted (rule 4) -> T-105.
  ['screens/MyBookingsScreen.tsx', 'orphan, zero importers (step 9)'],
  ['screens/MyPassengerOffersScreen.tsx', 'orphan, zero importers (step 9)'],
  // Exported but never routed — the Home tab renders MenuScreen. Found in step 14.
  ['screens/HomeScreen.tsx', 'orphan, exported but unrouted'],
  // ⚠️ NO STEP COVERS THIS SCREEN YET (step 17 is the DRIVER's search). It is gated by
  // T-102/T-103 and needs a card of its own — see PLAN.md "Next actions".
  ['screens/SearchOffersScreen.tsx', 'unplanned card, gated by T-102/T-103'],
  // Zero importers, verified in step 14.
  ['components/cards/RideCard.tsx', 'orphan, zero importers'],
  ['components/@extended/NetworkStatus.tsx', 'orphan, zero importers'],
  ['components/TimeWheelModal.tsx', 'orphan since step 8e -> T-105'],
]);

/** file -> line numbers where a sub-500 weight is deliberate. */
const EXEMPT_LINES = new Map([
  // The `×` delete glyph: a hairline is the point, and Manrope has nothing below 500.
  ['screens/NotificationsScreen.tsx', new Set([543])],
]);

const walk = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
};

// Every spelling: single quotes, double quotes, numerals and the `bold`/`normal` keywords.
const PATTERN = /fontWeight:\s*['"](?:\d+|bold|normal)['"]/;

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
  console.log('✗ fontWeight found in live files — use font(\'sans\', n) instead:\n');
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
