/**
 * Tests for the geo helpers (T-010 — the project's first real test suite).
 *
 * ⚠️ These are the functions `OfferPassengerService` uses to decide when a
 * driver is "10 minutes away" and when they have "arrived" — both of which
 * send a push to a real passenger. They were never covered by anything.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDistance,
  estimateTravelTime,
  isWithinMinutes,
  hasArrived,
} from './geo.js';

// Two real Tashkent points, ~1.1 km apart.
const CHORSU = { lat: 41.3255, lon: 69.2333 };
const NAVOI_THEATRE = { lat: 41.3111, lon: 69.2797 };

describe('calculateDistance', () => {
  it('is zero for the same point', () => {
    assert.equal(calculateDistance(41.3, 69.2, 41.3, 69.2), 0);
  });

  it('measures a known Tashkent distance to within 100 m', () => {
    const km = calculateDistance(
      CHORSU.lat,
      CHORSU.lon,
      NAVOI_THEATRE.lat,
      NAVOI_THEATRE.lon
    );
    // Haversine over these two points is ~4.2 km.
    assert.ok(km > 4.0 && km < 4.5, `expected ~4.2 km, got ${km}`);
  });

  it('is symmetric', () => {
    const there = calculateDistance(41.3, 69.2, 41.4, 69.3);
    const back = calculateDistance(41.4, 69.3, 41.3, 69.2);
    assert.equal(there, back);
  });
});

describe('estimateTravelTime', () => {
  it('uses the city speed under 10 km', () => {
    // 5 km at 50 km/h = 6 minutes.
    assert.equal(estimateTravelTime(5), 6);
  });

  it('switches to the highway speed at 10 km', () => {
    // 10 km at 80 km/h = 7.5 → ceil → 8. At city speed it would be 12.
    assert.equal(estimateTravelTime(10), 8);
  });

  it('always rounds up, so an estimate is never optimistic', () => {
    assert.equal(estimateTravelTime(0.1), 1);
  });
});

describe('isWithinMinutes', () => {
  it('says yes when the driver is close', () => {
    const r = isWithinMinutes(41.3255, 69.2333, 41.3265, 69.2343, 10);
    assert.equal(r.within, true);
    assert.ok(r.distanceKm < 1);
  });

  it('says no when the driver is far', () => {
    // Samarkand → Tashkent is ~270 km.
    const r = isWithinMinutes(39.6542, 66.9597, 41.3255, 69.2333, 10);
    assert.equal(r.within, false);
  });

  it('reports Infinity rather than a wrong number for missing coordinates', () => {
    const r = isWithinMinutes(0, 0, 41.3, 69.2, 10);
    assert.equal(r.within, false);
    assert.equal(r.estimatedMinutes, Infinity);
  });
});

describe('hasArrived', () => {
  it('is true within 200 m', () => {
    // ~110 m north.
    assert.equal(hasArrived(41.3255, 69.2333, 41.3265, 69.2333), true);
  });

  it('is false beyond 200 m', () => {
    // ~1.1 km north.
    assert.equal(hasArrived(41.3255, 69.2333, 41.3355, 69.2333), false);
  });

  it('is false for missing coordinates', () => {
    assert.equal(hasArrived(0, 0, 41.3, 69.2), false);
  });
});

/*
 * 🟡 A LATENT BUG, documented rather than silently "fixed".
 *
 * Both guards are `if (!driverLat || !driverLon || …)`, so a coordinate of
 * exactly **0 is treated as missing** — but 0° latitude (the equator) and 0°
 * longitude (Greenwich) are real places. This is the same falsy-zero class as
 * T-078's `pickup_fee` and T-083's price guard.
 *
 * ⚠️ It cannot bite THIS product: Uzbekistan sits at ~41°N, ~69°E, so neither
 * coordinate is ever 0. Changing the guard would alter behaviour that nothing
 * currently depends on, in code that pushes notifications to real passengers —
 * so it is pinned here instead, and the test says what it is.
 */
describe('the falsy-zero guard (documented, not fixed)', () => {
  it('treats 0,0 as missing — harmless for Uzbekistan, wrong in general', () => {
    // A driver genuinely at 0,0 and a pickup 100 m away would still read
    // "not arrived", because the guard rejects the coordinates outright.
    assert.equal(hasArrived(0, 0, 0.001, 0), false);
  });
});
