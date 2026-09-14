/**
 * T-118 step 2 — the first Jest test in the driver app.
 *
 * Pins the `Faol e'lon: n / 2` counter rules (`activeOffers.ts`, T-115). The API holds the
 * authoritative twin (`api/src/utils/activeOffers.test.ts`, same fixtures on purpose) and
 * `scripts/check-active-offers.mjs` cross-reads the API source to prove the two constant
 * lists still agree — that cross-file check stays in the checker; this file tests the
 * module's own behaviour only.
 */
import { describe, expect, it } from '@jest/globals';

import {
  DRIVER_ACTIVE_STATUSES,
  MAX_ACTIVE_OFFERS,
  countActiveOffers,
  isActiveOffer,
  isAtActiveLimit,
} from './activeOffers';

const NOW = new Date('2026-09-13T12:00:00.000Z');
const SOON = '2026-09-13T18:00:00.000Z';
const PAST = '2026-09-12T18:00:00.000Z';

const offer = (status: string, start_at: string | Date | null | undefined) => ({ status, start_at });

describe('MAX_ACTIVE_OFFERS', () => {
  it("is the owner's 2, the artboard's MAX_ELON", () => {
    expect(MAX_ACTIVE_OFFERS).toBe(2);
  });
});

describe('DRIVER_ACTIVE_STATUSES', () => {
  it('is `published` alone — a driver offer is live only when published', () => {
    expect([...DRIVER_ACTIVE_STATUSES]).toEqual(['published']);
  });
});

describe('isActiveOffer', () => {
  it('counts a published offer leaving later', () => {
    expect(isActiveOffer(offer('published', SOON), NOW)).toBe(true);
  });

  it('counts a published offer leaving exactly now (the search still shows it)', () => {
    expect(isActiveOffer(offer('published', NOW.toISOString()), NOW)).toBe(true);
  });

  it('does not count a published offer that already left — it holds no slot', () => {
    expect(isActiveOffer(offer('published', PAST), NOW)).toBe(false);
  });

  it.each(['draft', 'cancelled', 'archived', 'completed', 'in_progress'])(
    'does not count status %s even when leaving later',
    (status) => {
      expect(isActiveOffer(offer(status, SOON), NOW)).toBe(false);
    },
  );

  it('an unparseable departure does not count', () => {
    expect(isActiveOffer(offer('published', 'not a date'), NOW)).toBe(false);
  });

  it('a missing departure does not count', () => {
    expect(isActiveOffer(offer('published', null), NOW)).toBe(false);
    expect(isActiveOffer(offer('published', undefined), NOW)).toBe(false);
  });

  it('accepts a Date instance as well as an ISO string', () => {
    expect(isActiveOffer(offer('published', new Date(SOON)), NOW)).toBe(true);
    expect(isActiveOffer(offer('published', new Date(PAST)), NOW)).toBe(false);
  });
});

describe('countActiveOffers', () => {
  it('nothing held is zero', () => {
    expect(countActiveOffers([], NOW)).toBe(0);
  });

  it('counts only the live published ones in a mixed list', () => {
    const held = [
      offer('published', SOON),
      offer('published', PAST),
      offer('cancelled', SOON),
      offer('published', SOON),
      offer('archived', PAST),
    ];
    expect(countActiveOffers(held, NOW)).toBe(2);
  });

  it('defaults `now` to the clock', () => {
    const farAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(countActiveOffers([offer('published', farAhead)])).toBe(1);
  });
});

describe('isAtActiveLimit', () => {
  it('below the limit', () => {
    expect(isAtActiveLimit(0)).toBe(false);
    expect(isAtActiveLimit(1)).toBe(false);
  });

  it('two held IS the limit (>=, so the third is refused)', () => {
    expect(isAtActiveLimit(2)).toBe(true);
  });

  it('already over the ceiling still counts as at it', () => {
    expect(isAtActiveLimit(3)).toBe(true);
  });
});
