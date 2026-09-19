/**
 * The ratchet on English errors — T-116.
 *
 * Both apps show the server's own sentence for every 4xx, so an English `AppError` a phone can
 * reach IS an English screen for an Uzbek user. T-116 translated every one a user can hit
 * (`messageKey` at the throw site, `messageKeys.test.ts` checks the keys). The rest stay English
 * ON PURPOSE — the four classes are written down in `middleware/errorHandler.ts`.
 *
 * 🔴 What this stops is the drift that made T-116 necessary: a new English 4xx throw added next
 * to the translated ones. It counts the unkeyed 4xx `AppError`s outside the admin files and
 * holds the count at `CEILING`. Translating one lowers the count — then lower the ceiling to
 * lock it in; never raise it. (The same idiom as the apps' raw-colour ceiling.)
 *
 * Subclasses (`NotFoundError`, …) take a message and nothing else, so they cannot carry a key:
 * none may be thrown with a literal message at all.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HttpStatus } from '../constants/index.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Unkeyed English 4xx `AppError`s outside the admin files. Lower it when it falls; never raise it. */
const CEILING = 107;

/**
 * Subclass throws with a literal message outside admin — both in `WalletService`
 * (`'Duplicate transaction'`, `'This entry has already been reversed'`), which no app calls:
 * it answers Paynet (in Paynet's own codes) and the admin panel. Lower only.
 */
const SUBCLASS_CEILING = 2;

/** The admin panel is not localised at all — a different audience, deliberately out of scope. */
const isAdmin = (file: string) => /^admin/i.test(basename(file));

const sourceFiles = (): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) files.push(full);
    }
  };
  walk(SRC);
  return files;
};

/**
 * The top-level arguments of the call whose `(` is at `open`, split on depth-0 commas.
 * Strings are skipped whole, so a comma or a paren inside a message cannot split it.
 */
const callArguments = (src: string, open: number): string[] => {
  const args: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = open + 1;
  for (let i = open; i < src.length; i++) {
    const c = src[i]!;
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') {
      depth--;
      if (depth === 0) {
        args.push(src.slice(start, i).trim());
        break;
      }
    } else if (c === ',' && depth === 1) {
      args.push(src.slice(start, i).trim());
      start = i + 1;
    }
  }
  return args.filter((a) => a.length > 0);
};

/** A status argument as a number: a literal, an `HttpStatus.NAME`, or AppError's default (500). */
const statusOf = (arg: string | undefined): number => {
  if (arg === undefined) return 500;
  if (/^\d{3}$/.test(arg)) return Number(arg);
  const name = /^HttpStatus\.(\w+)$/.exec(arg)?.[1];
  const value = name ? (HttpStatus as unknown as Record<string, number>)[name] : undefined;
  return typeof value === 'number' ? value : 500;
};

interface Site {
  where: string;
  status: number;
  keyed: boolean;
  translatedAtThrow: boolean;
  admin: boolean;
}

const scan = (): { sites: Site[]; literalSubclasses: string[] } => {
  const sites: Site[] = [];
  const literalSubclasses: string[] = [];
  for (const file of sourceFiles()) {
    const src = readFileSync(file, 'utf8');
    const rel = relative(SRC, file).replace(/\\/g, '/');
    const lineOf = (index: number) => src.slice(0, index).split('\n').length;

    for (const match of src.matchAll(/new AppError\(/g)) {
      const args = callArguments(src, match.index! + match[0].length - 1);
      sites.push({
        where: `${rel}:${lineOf(match.index!)}`,
        status: statusOf(args[1]),
        keyed: args.slice(2).some((a) => /messageKey\s*:/.test(a)),
        translatedAtThrow: /^t\(/.test(args[0] ?? ''),
        admin: isAdmin(file),
      });
    }

    const subclass = /new (?:BadRequest|NotFound|Forbidden|Conflict|Validation|Unauthorized)Error\(\s*['"`]/g;
    for (const match of src.matchAll(subclass)) {
      if (!isAdmin(file)) literalSubclasses.push(`${rel}:${lineOf(match.index!)}`);
    }
  }
  return { sites, literalSubclasses };
};

const { sites, literalSubclasses } = scan();
const unkeyed4xx = sites.filter(
  (s) => s.status >= 400 && s.status < 500 && !s.keyed && !s.translatedAtThrow && !s.admin,
);

describe('🔴 the ratchet on English 4xx errors (T-116)', () => {
  it('the scan finds the AppErrors at all (guards against a scan that silently matches nothing)', () => {
    assert.ok(sites.length >= 200, `expected ~220 AppError calls, found ${sites.length}`);
    assert.ok(sites.some((s) => s.keyed), 'expected some keyed AppErrors');
  });

  it(`unkeyed English 4xx AppErrors outside admin stay at the ceiling (${CEILING})`, () => {
    const count = unkeyed4xx.length;
    assert.ok(
      count <= CEILING,
      `English 4xx errors ROSE to ${count} (ceiling ${CEILING}). A phone shows a 4xx's text verbatim — ` +
        `give the new throw a messageKey (see messageKeys.test.ts). Unkeyed sites:\n  ` +
        unkeyed4xx.map((s) => `${s.where} (${s.status})`).join('\n  '),
    );
    assert.ok(
      count >= CEILING,
      `English 4xx errors FELL to ${count} — lower CEILING in unkeyedErrors.test.ts to ${count} to lock it in.`,
    );
  });

  it(`AppError subclasses thrown with a literal message stay at the ceiling (${SUBCLASS_CEILING})`, () => {
    // A subclass takes a message and nothing else, so it cannot carry a key. A new one is a new
    // untranslatable message: use `new AppError(message, status, { messageKey })` instead.
    assert.ok(
      literalSubclasses.length <= SUBCLASS_CEILING,
      `literal-message subclass throws ROSE to ${literalSubclasses.length} (ceiling ${SUBCLASS_CEILING}):\n  ` +
        literalSubclasses.join('\n  '),
    );
    assert.ok(
      literalSubclasses.length >= SUBCLASS_CEILING,
      `literal-message subclass throws FELL to ${literalSubclasses.length} — lower SUBCLASS_CEILING to lock it in.`,
    );
  });
});
