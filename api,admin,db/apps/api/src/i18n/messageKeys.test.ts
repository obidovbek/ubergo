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

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..');
const LOCALES: Language[] = ['uz', 'ru', 'en'];

/** Every `messageKey: '<key>'` written anywhere under `src/`. */
const collectKeys = (): { key: string; file: string }[] => {
  const found: { key: string; file: string }[] = [];
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
        found.push({ key: match[1]!, file: entry.name });
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

  it('a parameterised key actually interpolates rather than printing its placeholder', () => {
    const rendered = t('offers.startAtTooSoon', 'uz', { minutes: 30 });
    assert.ok(rendered.includes('30'), `expected the number in: ${rendered}`);
    assert.ok(!rendered.includes('{minutes}'), `placeholder left unreplaced: ${rendered}`);
  });

  it('the three locales agree on which keys exist — none is a locale short', () => {
    for (const { key } of KEYS) {
      const missing = LOCALES.filter((l) => t(key, l) === key);
      assert.deepEqual(missing, [], `${key} missing from: ${missing.join(', ')}`);
    }
  });
});
