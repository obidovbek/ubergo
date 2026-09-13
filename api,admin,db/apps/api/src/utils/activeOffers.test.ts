import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DRIVER_ACTIVE_STATUSES,
  MAX_ACTIVE_OFFERS,
  PASSENGER_ACTIVE_STATUSES,
  countActiveOffers,
  isActiveOffer,
  isAtActiveLimit,
  remainingActiveSlots,
} from './activeOffers.js';

const NOW = new Date('2026-09-13T12:00:00.000Z');
const SOON = new Date('2026-09-13T18:00:00.000Z');
const PAST = new Date('2026-09-12T18:00:00.000Z');

const driver = (status: string, start_at: Date | string | null) => ({ status, start_at });

describe('MAX_ACTIVE_OFFERS', () => {
  it("is the owner's 2, and the artboard's MAX_ELON", () => {
    assert.equal(MAX_ACTIVE_OFFERS, 2);
  });
});

describe('isActiveOffer — a live status AND a departure still ahead', () => {
  it('counts a published driver offer leaving later today', () => {
    assert.equal(isActiveOffer(driver('published', SOON), DRIVER_ACTIVE_STATUSES, NOW), true);
  });

  it('does NOT count a cancelled offer', () => {
    assert.equal(isActiveOffer(driver('cancelled', SOON), DRIVER_ACTIVE_STATUSES, NOW), false);
  });

  it('does NOT count an archived offer', () => {
    assert.equal(isActiveOffer(driver('archived', SOON), DRIVER_ACTIVE_STATUSES, NOW), false);
  });

  /*
   * 🔴 The one that decides whether a driver can ever post again. The search already hides
   * `start_at < now`, so a past offer is invisible to everyone; counting it would lock the
   * driver out over rows nobody can see and nothing ages out of `published`.
   */
  it('does NOT count a published offer whose departure has passed', () => {
    assert.equal(isActiveOffer(driver('published', PAST), DRIVER_ACTIVE_STATUSES, NOW), false);
  });

  it('counts an offer departing at this exact instant (>= , not >)', () => {
    assert.equal(isActiveOffer(driver('published', NOW), DRIVER_ACTIVE_STATUSES, NOW), true);
  });

  it('accepts an ISO string as well as a Date — pg hands back either', () => {
    assert.equal(
      isActiveOffer(driver('published', SOON.toISOString()), DRIVER_ACTIVE_STATUSES, NOW),
      true,
    );
  });

  it('does not count a row with no departure at all', () => {
    assert.equal(isActiveOffer(driver('published', null), DRIVER_ACTIVE_STATUSES, NOW), false);
  });

  it('does not count an unparseable departure rather than throwing', () => {
    assert.equal(
      isActiveOffer(driver('published', 'not-a-date'), DRIVER_ACTIVE_STATUSES, NOW),
      false,
    );
  });
});

describe('the two sides do not share a status list', () => {
  it("counts a passenger's order that already has a driver — the ride has not happened", () => {
    assert.equal(
      isActiveOffer(driver('driver_found', SOON), PASSENGER_ACTIVE_STATUSES, NOW),
      true,
    );
  });

  it('does NOT count `driver_found` on the DRIVER side, which has no such status', () => {
    assert.equal(isActiveOffer(driver('driver_found', SOON), DRIVER_ACTIVE_STATUSES, NOW), false);
  });

  it('does NOT count a completed passenger order', () => {
    assert.equal(isActiveOffer(driver('completed', SOON), PASSENGER_ACTIVE_STATUSES, NOW), false);
  });
});

describe('countActiveOffers', () => {
  it('counts only the live, future ones out of a mixed list', () => {
    const offers = [
      driver('published', SOON), // yes
      driver('published', PAST), // no — departed
      driver('cancelled', SOON), // no — cancelled
      driver('archived', SOON), // no — archived
      driver('published', SOON), // yes
    ];
    assert.equal(countActiveOffers(offers, DRIVER_ACTIVE_STATUSES, NOW), 2);
  });

  it('an empty list is zero, not an error', () => {
    assert.equal(countActiveOffers([], DRIVER_ACTIVE_STATUSES, NOW), 0);
  });
});

describe('isAtActiveLimit', () => {
  it('lets a person with none through', () => {
    assert.equal(isAtActiveLimit(0), false);
  });

  it('lets a person with one through', () => {
    assert.equal(isAtActiveLimit(1), false);
  });

  /* 🔴 `>=`, not `>`. With `>` the third offer would be created before anyone complained. */
  it('refuses the THIRD — someone already holding two is at the limit', () => {
    assert.equal(isAtActiveLimit(2), true);
  });

  it('still refuses if existing data is somehow already over the ceiling', () => {
    assert.equal(isAtActiveLimit(5), true);
  });
});

describe('remainingActiveSlots', () => {
  it('reports both slots free when nothing is held', () => {
    assert.equal(remainingActiveSlots(0), 2);
  });

  it('reports one left', () => {
    assert.equal(remainingActiveSlots(1), 1);
  });

  it('never goes negative when data predates the limit', () => {
    assert.equal(remainingActiveSlots(7), 0);
  });
});
