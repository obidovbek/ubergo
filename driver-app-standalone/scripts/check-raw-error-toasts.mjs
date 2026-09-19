/**
 * No toast or alert puts a raw `error.message` in front of the user. T-116.
 *
 * 🛑 WHAT IT DEFENDS: a thrown error's `.message` is whatever produced it — the runtime's
 * English for a dropped connection ("Network request failed", "Aborted"), a 5xx's internals
 * ("relation … does not exist"), or a server sentence. `getErrorMessage(error, t, fallbackKey)`
 * names a connection failure in the user's language, never shows a 5xx body, and shows a 4xx's
 * already-translated sentence as it came. Passing `error.message` straight to the screen skips
 * all three — and it is the obvious thing to type, so it grows back.
 *
 * 2026-09-19: 4 such calls in this app, all in `NotificationsScreen` — which also called `showToast`,
 * an OBJECT here, as a function, so every one threw instead of toasting — and 5 in the user app.
 *
 * Duplicated from the user app on purpose, like the shared components.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SCANNED = ['screens', 'components', 'contexts', 'utils', 'services', 'navigation'];

/** Calls that put text in front of the user. */
const CALL = /(showToast(?:\.\w+)?|Alert\.alert|showError)\s*\(/g;
/** A thrown error's message, however the catch named the error. */
const RAW = /\b(error|err|e|apiError|uploadError)\??\.message\b/;

/**
 * The argument text of the call whose `(` ends at `start`, by paren depth — with strings blanked
 * (a message may mention `error.message` as prose; that is text, not code) and comments removed
 * (a comment is not an argument; the scan this checker grew from was fooled by exactly that).
 */
function argumentsOf(src, start) {
  let depth = 1;
  let out = '';
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && next === '*') { i = src.indexOf('*/', i + 2); if (i < 0) break; i++; continue; }
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      for (i++; i < src.length && src[i] !== q; i++) if (src[i] === '\\') i++;
      out += '""';
      continue;
    }
    if (c === '(') depth++;
    if (c === ')' && --depth === 0) return out;
    out += c;
  }
  return out;
}

function scan(src) {
  const calls = [];
  for (const m of src.matchAll(CALL)) {
    const args = argumentsOf(src, m.index + m[0].length);
    calls.push({ line: src.slice(0, m.index).split('\n').length, raw: RAW.test(args) });
  }
  return calls;
}

let pass = 0;
const fails = [];
const ok = (label, cond) => (cond ? pass++ : fails.push(label));

// ── fixture: the matcher must catch the bad shape and ignore the good ones ───────────────
const fixture = [
  "showToast.error(t('a'), error.message);", //                       bad
  "showToast('error', t('a'), err?.message || t('b'));", //            bad (driver's old form)
  "showToast.error(t('a'), getErrorMessage(error, t, 'b'));", //       good
  "showToast.error(t('a'), getErrorMessage(error, t)); // not error.message", // good: comment
  "Alert.alert(t('a'), 'see error.message in logs');", //              good: prose in a string
].join('\n');
const f = scan(fixture);
ok('fixture: 5 calls found', f.length === 5);
ok('fixture: the two raw ones are caught', f[0]?.raw === true && f[1]?.raw === true);
ok('fixture: getErrorMessage, a comment and a string are not', f.slice(2).every((c) => !c.raw));

// ── the app ────────────────────────────────────────────────────────────────────────────────
const files = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(full);
  }
};
SCANNED.forEach((d) => walk(path.join(root, d)));

let total = 0;
const offenders = [];
for (const file of files) {
  for (const call of scan(fs.readFileSync(file, 'utf8'))) {
    total++;
    if (call.raw) offenders.push(`${path.relative(root, file).replace(/\\/g, '/')}:${call.line}`);
  }
}
// A scan that silently matched nothing would pass forever.
ok(`scan: found the app's toast/alert calls (${total})`, total >= 50);
ok(
  `no toast/alert shows a raw .message — use getErrorMessage(error, t, fallbackKey):\n       ${offenders.join('\n       ')}`,
  offenders.length === 0,
);

if (fails.length) {
  console.error('FAIL raw error toasts: ' + fails.length + ' of ' + (pass + fails.length));
  for (const x of fails) console.error('   - ' + x);
  process.exit(1);
}
console.log('✓ raw error toasts: all ' + pass + ' assertions pass (fixture · scan · ' + total + ' calls clean)');
