#!/usr/bin/env node
/**
 * check-board.mjs — T-122.
 *
 * Checks that docs/TODO.md is still ONE board:
 *   - no `## ` section header appears twice (there must be exactly one `## 🔥 Now`);
 *   - *Now* holds at most 2 cards (CLAUDE.md rule 1);
 *   - no T-### id is the own id of more than one card;
 *   - no block of 8+ consecutive lines appears twice (the signature of a paste accident).
 *
 * Why this exists: by 2026-09-19 the board had two *Now* sections, 23 cards in *Now*
 * and 22 ids carded twice or more. The defect was boarded twice (T-097, T-122) before
 * anyone fixed it, because nothing looked. A duplicated card means one copy is always
 * stale, and whichever copy a session reads first wins.
 *
 *   node scripts/check-board.mjs          # check docs/TODO.md
 *   node scripts/check-board.mjs FILE     # check another copy of the board
 *
 * No dependencies — plain node. Run by /end-day; not wired into CI.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const NOW_HEADER = '## 🔥 Now';
const NOW_LIMIT = 2;

/** This many identical consecutive lines, appearing twice, is a paste — not a coincidence. */
const PASTE_RUN = 8;
/** A run only starts on a line this long, so blank lines and short list items cannot start one. */
const PASTE_MIN_CHARS = 40;

const ID = String.raw`T-\d{3}[A-Za-z]?(?:-\d+)?`;
/**
 * A card's OWN ids are the ones it opens with: `T-079 + T-080 (P2) …`, `~~T-044 (P1)~~ …`.
 * Ids mentioned later in the text are references to other cards, not claims to be them.
 */
const OWN_IDS = new RegExp(String.raw`^(?:~~)?\s*(${ID}(?:\s*\+\s*${ID})*)`);

/**
 * Split the board into sections and cards.
 * A card is a top-level `- [ ]` / `- [x]` line plus the indented lines under it; it ends at
 * the next non-empty line that is not indented (another card, a header, a note, `<details>`).
 */
export function parseBoard(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  const cards = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) sections.push({ title: lines[i], line: i + 1 });
    if (!/^- \[[ x]\] /.test(lines[i])) continue;

    let end = i + 1;
    while (end < lines.length && (lines[end] === '' || /^\s/.test(lines[end]))) end++;
    while (end > i + 1 && lines[end - 1] === '') end--;

    const head = lines[i].replace(/^- \[[ x]\] /, '');
    const own = head.match(OWN_IDS);
    cards.push({
      line: i + 1,
      endLine: end,
      ids: own ? own[1].match(new RegExp(ID, 'g')) : [],
      section: sections.at(-1)?.title ?? '(before the first section)',
      text: lines.slice(i, end).join('\n'),
    });
  }
  return { lines, sections, cards };
}

/** Every way the board disagrees with itself, as sentences. Empty means clean. */
export function findProblems({ lines, sections, cards }) {
  const problems = [];

  const byTitle = new Map();
  for (const s of sections) byTitle.set(s.title, [...(byTitle.get(s.title) ?? []), s.line]);
  for (const [title, at] of byTitle) {
    if (at.length > 1) problems.push(`section "${title}" appears ${at.length}× (lines ${at.join(', ')})`);
  }
  if (!sections.some((s) => s.title.startsWith(NOW_HEADER))) problems.push(`no "${NOW_HEADER}" section`);

  const inNow = cards.filter((c) => c.section.startsWith(NOW_HEADER));
  if (inNow.length > NOW_LIMIT) {
    problems.push(
      `Now holds ${inNow.length} cards, the limit is ${NOW_LIMIT}: ` +
        inNow.map((c) => (c.ids.length ? c.ids.join('+') : `line ${c.line}`)).join(', '),
    );
  }

  const byId = new Map();
  for (const c of cards) for (const id of c.ids) byId.set(id, [...(byId.get(id) ?? []), c.line]);
  for (const [id, at] of [...byId].sort(([a], [b]) => a.localeCompare(b))) {
    if (at.length > 1) problems.push(`${id} is carded ${at.length}× (lines ${at.join(', ')})`);
  }

  // Paste accidents: the same run of lines twice. Compare each long line with its later twins.
  const where = new Map();
  lines.forEach((l, i) => {
    if (l.trim().length >= PASTE_MIN_CHARS) where.set(l, [...(where.get(l) ?? []), i]);
  });
  const covered = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (covered.has(i)) continue;
    for (const k of where.get(lines[i]) ?? []) {
      if (k <= i) continue;
      let n = 0;
      while (i + n < k && k + n < lines.length && lines[i + n] === lines[k + n]) n++;
      if (n >= PASTE_RUN) {
        problems.push(`lines ${i + 1}-${i + n} are pasted again at ${k + 1}-${k + n}`);
        for (let q = 0; q < n; q++) covered.add(i + q);
        break;
      }
    }
  }

  return problems;
}

// Run only when invoked directly, so the parser can be imported without printing anything.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = process.argv[2] ? resolve(process.argv[2]) : join(ROOT, 'docs', 'TODO.md');
  const board = parseBoard(readFileSync(file, 'utf8'));
  const problems = findProblems(board);

  if (problems.length) {
    console.error(`\n✗ The board disagrees with itself in ${problems.length} place(s):\n`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error(`\n  One card, one copy, one section. docs/TODO-ARCHIVE.md takes what leaves.\n`);
    process.exit(1);
  }

  const now = board.cards.filter((c) => c.section.startsWith(NOW_HEADER)).length;
  console.log(`✓ One board: ${board.cards.length} cards, ${now} in Now, every id carded once.`);
}
