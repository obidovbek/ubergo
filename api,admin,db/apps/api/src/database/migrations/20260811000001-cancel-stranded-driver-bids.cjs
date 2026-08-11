'use strict';

/**
 * T-046 — repair driver bids stranded by a cancelled passenger offer.
 *
 * `PassengerOfferService.cancelOffer` used to cancel the offer and notify every
 * interested driver, but never update their `offer_drivers` rows. Those rows are
 * unreachable once the offer is `cancelled` — no other code path touches them —
 * so every affected driver keeps seeing "waiting" for a trip that no longer
 * exists. The service is fixed; this repairs the rows already stranded.
 *
 * `cancelled` rather than `rejected` on purpose (owner, 2026-08-11): the
 * passenger called the trip off, they did not judge the driver's offer.
 *
 * ⚠️ `cancelled_at` is set to the OFFER's `updated_at`, not `NOW()`. That is the
 * closest honest record of when the bid actually died — stamping today's date on
 * a bid that expired weeks ago would invent history.
 *
 * ⚠️ THIS `down` CANNOT TRULY REVERSE THE CHANGE. Each row's prior status
 * (`pending` or `confirmed`) is not recorded anywhere per-row, so restoring it is
 * impossible. `down` is deliberately a NO-OP rather than a plausible-looking
 * rollback that would silently corrupt data — reverting every row to `pending`
 * would resurrect bids on offers cancelled long ago, including any that were
 * legitimately `confirmed`.
 */

module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(`
      UPDATE offer_drivers od
         SET status       = 'cancelled',
             cancelled_at = COALESCE(od.cancelled_at, po.updated_at, NOW()),
             updated_at   = NOW()
        FROM passenger_offers po
       WHERE od.offer_id = po.id
         AND po.status   = 'cancelled'
         AND od.status IN ('pending', 'confirmed')
      RETURNING od.id;
    `);

    const repaired = Array.isArray(rows) ? rows.length : 0;
    console.log(`[T-046] Cancelled ${repaired} stranded driver bid(s).`);
  },

  async down() {
    // Intentionally irreversible — see the note above. Restoring the previous
    // per-row status is not possible from the data that remains.
    console.log(
      '[T-046] down() is a no-op: the original per-row status was not recorded, ' +
        'so this migration cannot be safely reversed.'
    );
  },
};
