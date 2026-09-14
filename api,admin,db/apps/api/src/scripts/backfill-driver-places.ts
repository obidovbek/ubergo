/**
 * T-102g — give pre-T-102 driver offers their geo ids, or report why they cannot have them.
 *
 * 🛑 REPORTS BY DEFAULT. WRITES ONLY WITH `--apply`.
 *
 *     npm run backfill:places            # report, touches nothing
 *     npm run backfill:places -- --apply # write the unambiguous ones
 *
 * 🔴 WHY THAT WAY ROUND. The plan calls this the riskiest step on the card, and the reason is
 * asymmetric: an offer left alone KEEPS WORKING — `utils/offerGeoQuery.ts` falls back to its
 * free text for any offer with no place rows — while an offer given the WRONG district is
 * confidently matched to passengers going somewhere else, looks perfectly healthy, and cannot
 * be told from a correct one afterwards. So the safe failure is to skip, and the report exists
 * so a human can see the size and shape of what would be written BEFORE anything is.
 *
 * All the deciding lives in `utils/backfillPlaces.ts`, which is pure and tested (25 cases). This
 * file only reads rows, asks that module, prints, and — when told — writes.
 *
 * ⚠️ Only offers with NO existing place rows are considered. An offer T-102c already wrote is
 * never second-guessed from its prose.
 */

import { Op } from 'sequelize';

import sequelize, {
  DriverOffer,
  DriverOfferPlace,
  GeoCityDistrict
} from '../database/models/index.js';
import {
  describeOutcome,
  isWritable,
  matchDistricts,
  type NamedPlace,
  type OfferBackfill
} from '../utils/backfillPlaces.js';

const APPLY = process.argv.includes('--apply');

const main = async () => {
  await sequelize.authenticate();

  const districts = (await GeoCityDistrict.findAll({
    attributes: ['id', 'name', 'province_id']
  })) as unknown as { id: number; name: string; province_id: number }[];

  const known: NamedPlace[] = districts.map((d) => ({
    id: Number(d.id),
    name: d.name,
    provinceId: Number(d.province_id)
  }));

  // Every offer that has no place rows yet. `separate` is deliberate: a LEFT JOIN would
  // multiply the offer row per place and make "has none" awkward to express.
  const withPlaces = (await DriverOfferPlace.findAll({
    attributes: ['offer_id'],
    group: ['offer_id']
  })) as unknown as { offer_id: number }[];
  const alreadyDone = new Set(withPlaces.map((row) => Number(row.offer_id)));

  const offers = (await DriverOffer.findAll({
    attributes: ['id', 'from_text', 'to_text', 'status', 'start_at'],
    where: alreadyDone.size
      ? { id: { [Op.notIn]: [...alreadyDone] } }
      : {},
    order: [['id', 'ASC']]
  })) as unknown as {
    id: number;
    from_text: string;
    to_text: string;
    status: string;
    start_at: Date;
  }[];

  const tally = { writable: 0, ambiguous: 0, no_match: 0 };
  const lines: string[] = [];

  const decided = offers.map((offer) => {
    const outcome: OfferBackfill = {
      from: matchDistricts(offer.from_text, known),
      to: matchDistricts(offer.to_text, known)
    };

    if (isWritable(outcome)) tally.writable++;
    else if (outcome.from.kind === 'ambiguous' || outcome.to.kind === 'ambiguous') tally.ambiguous++;
    else tally.no_match++;

    lines.push(
      `  #${String(offer.id).padEnd(6)} ${offer.status.padEnd(10)} ` +
        `from=${describeOutcome(outcome.from).padEnd(34)} to=${describeOutcome(outcome.to)}`
    );
    return { offer, outcome };
  });

  console.log(`\ndistricts known: ${known.length}`);
  console.log(`offers already carrying places (skipped): ${alreadyDone.size}`);
  console.log(`offers considered: ${offers.length}\n`);
  console.log(lines.slice(0, 80).join('\n'));
  if (lines.length > 80) console.log(`  … ${lines.length - 80} more`);

  console.log(
    `\n  writable (both ends unambiguous): ${tally.writable}` +
      `\n  ambiguous (a name matched several districts): ${tally.ambiguous}` +
      `\n  no match (renamed, or text naming no district): ${tally.no_match}\n`
  );

  if (!APPLY) {
    console.log('DRY RUN — nothing was written. Re-run with --apply to write the writable ones.\n');
    await sequelize.close();
    return;
  }

  /*
   * ⚠️ One transaction for the whole write. A backfill that dies half way leaves some offers
   * with places and some without — which is not corruption (both shapes are handled), but it
   * makes the report's numbers a lie on the next run, and nobody would know where it stopped.
   */
  let written = 0;
  const transaction = await sequelize.transaction();
  try {
    for (const { offer, outcome } of decided) {
      if (!isWritable(outcome)) continue;
      if (outcome.from.kind !== 'matched' || outcome.to.kind !== 'matched') continue;

      const rows = [
        ...outcome.from.placeIds.map((cityId) => ({
          offer_id: offer.id,
          direction: 'from' as const,
          city_id: cityId
        })),
        ...outcome.to.placeIds.map((cityId) => ({
          offer_id: offer.id,
          direction: 'to' as const,
          city_id: cityId
        }))
      ];

      await DriverOfferPlace.bulkCreate(rows, { transaction });
      written += rows.length;
    }
    await transaction.commit();
    console.log(`APPLIED — ${written} place rows written across ${tally.writable} offers.\n`);
  } catch (error) {
    await transaction.rollback();
    console.error('ROLLED BACK — nothing was written:', error);
    process.exitCode = 1;
  }

  await sequelize.close();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
