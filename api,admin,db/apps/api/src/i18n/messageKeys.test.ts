/**
 * Every `messageKey` a service attaches to an AppError must resolve in all three locales.
 * T-116.
 *
 * 🔴 WHY THIS TEST AND NOT A GREP. The error handler falls back to the English literal when a
 * key is missing, which is deliberate — it is what lets throw sites migrate one at a time
 * without anything breaking. But it also means a TYPO IS INVISIBLE: the message still reads
 * fine in English, and the Uzbek and Russian users it was added for silently keep getting
 * English. Nothing errors, nothing logs at the call site, and `tsc` cannot see a string key.
 *
 * So this reads the real service sources, extracts every `messageKey: '...'` actually in use,
 * and resolves each one for real against uz/ru/en.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { t } from './translator.js';
import type { Language } from './types.js';
import { ORDER_SCOPES } from '../utils/geoMatch.js';
import { SCOPE_PROBLEM_ORDER, scopeMessageKey } from '../utils/scopeGuard.js';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..');
const LOCALES: Language[] = ['uz', 'ru', 'en'];

/**
 * Every `messageKey: '<key>'` written anywhere under `src/`, with the names in the
 * `messageParams: { … }` written beside it (null when the call passes none).
 */
const collectKeys = (): { key: string; file: string; params: string[] | null }[] => {
  const found: { key: string; file: string; params: string[] | null }[] = [];
  const pattern = /messageKey:\s*'([^']+)'/g;

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) continue;
      const text = readFileSync(full, 'utf8');
      for (const match of text.matchAll(pattern)) {
        // The params sit in the same options object as the key. Read no further than that
        // object's own closing brace (depth-counted, so `messageParams: { … }` inside it does
        // not end it early) — otherwise a neighbouring throw's params could be borrowed.
        const rest = text.slice(match.index! + match[0].length);
        let depth = 0;
        let end = rest.length;
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === '{') depth++;
          else if (rest[i] === '}' && depth-- === 0) {
            end = i;
            break;
          }
        }
        const own = rest.slice(0, end);
        const paramsObject = own.match(/messageParams:\s*\{([^}]*)\}/);
        const params = paramsObject
          ? [...paramsObject[1]!.matchAll(/(\w+)\s*(?::|,|$)/g)].map((m) => m[1]!)
          : null;
        found.push({ key: match[1]!, file: entry.name, params });
      }
    }
  };

  walk(SRC);
  return found;
};

const KEYS = collectKeys();

describe('AppError messageKeys', () => {
  it('finds the keys the services attach (guards against the scan silently matching nothing)', () => {
    assert.ok(
      KEYS.length >= 10,
      `expected the services to carry messageKeys, found ${KEYS.length}`,
    );
  });

  for (const language of LOCALES) {
    it(`every messageKey resolves in ${language}`, () => {
      const unresolved: string[] = [];
      for (const { key, file } of KEYS) {
        const value = t(key, language);
        // `t()` returns the key itself when it is missing — that IS the presence test.
        if (value === key || value.trim() === '') unresolved.push(`${key} (${file})`);
      }
      assert.deepEqual(unresolved, [], `unresolved in ${language}: ${unresolved.join(', ')}`);
    });
  }

  /*
   * 🔴 T-127 — THE SCAN ABOVE CANNOT SEE A COMPUTED KEY, AND THIS IS THE FIRST ONE.
   *
   * `collectKeys` matches `messageKey: '<literal>'`. The scope guard builds its key from the
   * problem and the scope (`offers.scope_missing_from_adm3`), so the throw site reads
   * `messageKey: verdict.messageKey` and matches nothing — every check in this file would pass
   * while a whole family of messages was missing from ru and uz, showing English to exactly the
   * users they were written for. That is the failure this file exists to prevent, so the family
   * is enumerated and resolved here instead.
   *
   * ⚠️ If another computed key appears, it needs a block like this one. There is no way to scan
   * for what is not written down.
   */
  describe('computed keys (invisible to the scan)', () => {
    // ⚠️ The API's `ORDER_SCOPES` is a list of STRINGS (the user app's is a list of objects with
    // `.key` — the same name, two shapes). `s.key` here was `undefined`, which `matchLevelFor`
    // answered with 'adm2', so every computed key came out adm2 and the adm3 half of this family
    // was never checked at all. The suite stayed green; `tsc` is what caught it.
    const computed = SCOPE_PROBLEM_ORDER.flatMap((problem) =>
      ORDER_SCOPES.map((scope) => scopeMessageKey(problem, scope))
    );

    it('the scope guard can produce keys at all — including both levels', () => {
      assert.ok(computed.length >= 20, `expected a key per problem × scope, got ${computed.length}`);
      assert.ok(computed.some((k) => k.endsWith('_adm3')), 'no adm3 key was produced');
      assert.ok(computed.some((k) => k.endsWith('_adm2')), 'no adm2 key was produced');
    });

    for (const language of LOCALES) {
      it(`every scope-guard key resolves in ${language}`, () => {
        const unresolved = [...new Set(computed)].filter((key) => {
          const value = t(key, language);
          return value === key || value.trim() === '';
        });
        assert.deepEqual(unresolved, [], `unresolved in ${language}: ${unresolved.join(', ')}`);
      });
    }

    it('and carries no placeholder — the level is in the key, not a parameter', () => {
      // The throw site passes no `messageParams`, so a `{…}` in any of these would reach the
      // passenger literally.
      const withPlaceholders = [...new Set(computed)].flatMap((key) =>
        LOCALES.filter((l) => /\{\w+\}/.test(t(key, l))).map((l) => `${key} (${l})`)
      );
      assert.deepEqual(withPlaceholders, []);
    });
  });

  it('a parameterised key actually interpolates rather than printing its placeholder', () => {
    const rendered = t('offers.startAtTooSoon', 'uz', { minutes: 30 });
    assert.ok(rendered.includes('30'), `expected the number in: ${rendered}`);
    assert.ok(!rendered.includes('{minutes}'), `placeholder left unreplaced: ${rendered}`);
  });

  it('every locale carries the same {placeholders} as English — a lost one would print literally', () => {
    // T-116. The test above renders ONE parameterised key; this checks them all. `t()` without
    // params returns the template untouched, so its `{names}` are what each locale will fill.
    const placeholders = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const mismatched: string[] = [];
    for (const { key } of KEYS) {
      const english = placeholders(t(key, 'en'));
      for (const language of ['uz', 'ru'] as const) {
        const got = placeholders(t(key, language));
        if (got !== english) mismatched.push(`${key} (${language}: {${got}}, en: {${english}})`);
      }
    }
    assert.deepEqual(mismatched, []);
  });

  it('every throw of a parameterised key passes each parameter its template needs', () => {
    // T-116. Resolving is not enough: a key whose English reads "at least {minutes} minutes",
    // thrown WITHOUT `messageParams`, shows the user a literal "{minutes}" — and every test
    // above stays green, because the key itself exists in all three locales.
    const missing: string[] = [];
    for (const { key, file, params } of KEYS) {
      const needed = [...t(key, 'en').matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
      const absent = needed.filter((name) => !(params ?? []).includes(name));
      if (absent.length) missing.push(`${key} in ${file} lacks {${absent.join(', ')}}`);
    }
    assert.deepEqual(missing, []);
  });

  it('a two-parameter key fills both numbers in every locale', () => {
    for (const language of LOCALES) {
      const rendered = t('offers.cannotReduceSeatsBelowBooked', language, { newTotal: 2, booked: 3 });
      assert.ok(rendered.includes('2') && rendered.includes('3'), `${language}: ${rendered}`);
      assert.ok(!/\{\w+\}/.test(rendered), `${language}: placeholder left unreplaced: ${rendered}`);
    }
  });

  it('the three locales agree on which keys exist — none is a locale short', () => {
    for (const { key } of KEYS) {
      const missing = LOCALES.filter((l) => t(key, l) === key);
      assert.deepEqual(missing, [], `${key} missing from: ${missing.join(', ')}`);
    }
  });
});
