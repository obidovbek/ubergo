/**
 * Turning an old offer's free text back into geo ids. T-102g — **the riskiest step on the card.**
 *
 * 🔴 THE RULE THIS MODULE EXISTS TO ENFORCE: A WRONG ID IS WORSE THAN NO ID.
 * An offer with no places keeps working — `utils/offerGeoQuery.ts` falls back to its text for
 * exactly that reason — so leaving a row alone costs nothing. An offer given the WRONG district
 * is confidently matched to passengers going somewhere else, and nothing about it looks broken.
 * So every function here is built to REFUSE rather than to guess, and ambiguity is an outcome
 * to be reported, not a tie to be broken.
 *
 * ⚠️ It decides; it does not write. The script drives it, defaults to a report, and only writes
 * when told to — see `src/scripts/backfill-driver-places.ts`.
 *
 * WHAT THE TEXT LOOKS LIKE. `from_text` was built by `buildLocationText` and, for a
 * multi-district endpoint, by joining district names with ", ". So it is one of:
 *   "Andijon"                                  a bare district
 *   "Andijon, Andijon viloyati"                district + province
 *   "Andijon, Andijon viloyati, O'zbekiston"   + country
 *   "Andijon, Asaka"                           SEVERAL districts (the smuggled case)
 * The parts are not labelled, which is the whole problem — that is why the driver app's own
 * loader had to test whether a part `includes('viloyat')`, and why a district actually named
 * "…viloyat…" broke it.
 */

/** A geo row as the backfill needs it — only what it matches on. */
export interface NamedPlace {
  id: number;
  name: string;
  /** For a district: the province it belongs to. Absent for provinces. */
  provinceId?: number;
}

export type MatchOutcome =
  | { kind: 'matched'; placeIds: number[] }
  /** Nothing in the text resembled a known district. Leave the offer alone. */
  | { kind: 'no_match'; reason: 'no_candidates' }
  /** A part matched SEVERAL districts and nothing disambiguates them. Leave the offer alone. */
  | { kind: 'ambiguous'; part: string; candidateIds: number[] };

/** Split the stored text the way it was built: on commas, trimmed, blanks dropped. */
export const splitParts = (text: string | null | undefined): string[] =>
  (text ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');

/**
 * Compare two place names for identity.
 *
 * 🔴 EXACT, CASE- AND APOSTROPHE-INSENSITIVE — never "contains". The old loader used
 * `includes()` in both directions, which makes *Andijon* match *Andijon viloyati* and every
 * district whose name is a prefix of another. For a backfill that writes to the database,
 * "close enough" is precisely the failure mode that cannot be undone.
 *
 * ⚠️ Uzbek writes the same name with several apostrophes — `Qo'qon`, `Qo‘qon`, `Qoʻqon` — so
 * they are folded before comparing. Ignoring that would leave thousands of rows unmatched and
 * look like the data was unmatchable.
 */
export const sameName = (a: string, b: string): boolean => {
  const fold = (value: string) =>
    value
      .toLowerCase()
      .replace(/[‘’ʻʼ'`´]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  return fold(a) === fold(b) && fold(a) !== '';
};

/**
 * Which districts does this text name?
 *
 * Every part is looked up against the district list. Parts that match nothing are ignored —
 * they are the province and country the text also carries. A part matching more than one
 * district makes the WHOLE offer ambiguous: picking either would be the guess this module
 * refuses to make.
 */
export const matchDistricts = (
  text: string | null | undefined,
  districts: readonly NamedPlace[],
): MatchOutcome => {
  const parts = splitParts(text);
  const placeIds: number[] = [];

  for (const part of parts) {
    const hits = districts.filter((d) => sameName(d.name, part));
    if (hits.length === 0) continue; // a province, a country, or a renamed district
    if (hits.length > 1) {
      return { kind: 'ambiguous', part, candidateIds: hits.map((h) => h.id) };
    }
    const id = hits[0]!.id;
    if (!placeIds.includes(id)) placeIds.push(id);
  }

  if (placeIds.length === 0) return { kind: 'no_match', reason: 'no_candidates' };
  return { kind: 'matched', placeIds };
};

/**
 * 🔴 BOTH DIRECTIONS MUST SUCCEED, OR NEITHER IS WRITTEN.
 *
 * A half-backfilled offer is the worst of both worlds: it has place rows, so
 * `offerGeoQuery` stops falling back to its text — and then matches on only one end. It would
 * silently start offering rides in the wrong direction. All or nothing.
 */
export interface OfferBackfill {
  from: MatchOutcome;
  to: MatchOutcome;
}

export const isWritable = (outcome: OfferBackfill): boolean =>
  outcome.from.kind === 'matched' && outcome.to.kind === 'matched';

/** One line per offer for the report, so a human can see WHY something was skipped. */
export const describeOutcome = (outcome: MatchOutcome): string => {
  if (outcome.kind === 'matched') return `matched(${outcome.placeIds.join('+')})`;
  if (outcome.kind === 'no_match') return 'no_match';
  return `ambiguous("${outcome.part}" → ${outcome.candidateIds.length} districts)`;
};
