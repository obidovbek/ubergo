/**
 * The passenger's last search route, and WHO is allowed to move it. T-114 follow-up,
 * device-reported 2026-09-13: *"after edit on user search page remains data before edit"*.
 *
 * 🔴 WHY A REVISION AND NOT JUST A WRITE. `SearchOffersScreen` is a TAB: it mounts once and
 * stays mounted for the life of the app, and it seeds its from/to exactly once
 * (`initialize()`, mount-only by design — the T-077 hand-off is rebuilt from `route.params`
 * on every render, so depending on it would loop). Editing an order therefore had no way to
 * reach it, and the tab went on showing the route the order had BEFORE the edit.
 *
 * Re-reading the stored route on every focus would fix that and break something else: the
 * screen SAVES the route on every change, so a passenger who had set up a search by hand
 * would have it silently re-applied, and any future writer would fight them for the field.
 *
 * So the rule is: **the stored route moves the screen only when someone other than the screen
 * changed it.** `bumpLastSearchRoute` is that someone — the order form, on create and edit.
 * The screen's own `saveLastSearch` deliberately does NOT bump, so it never reacts to itself.
 *
 * ⚠️ THE PAYLOAD SHAPE AND KEY ARE THE 2026-08 ONES, FIELD FOR FIELD. `SearchOffersScreen`
 * warns that renaming a key orphans every existing save, so the revision lives in its OWN key
 * rather than inside the payload.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** ⚠️ Must stay byte-identical to `SearchOffersScreen`'s own constant. */
export const LAST_SEARCH_KEY = '@ubexgo:last_search';
export const LAST_SEARCH_REVISION_KEY = '@ubexgo:last_search_rev';

/** One node of the route as it is stored. Only what this module compares. */
export interface LastSearchNode {
  id: number;
  name: string;
}

/** The stored payload — the 2026-08 shape, unchanged. */
export interface LastSearchRoute {
  fromCountry?: LastSearchNode | null;
  fromProvince?: LastSearchNode | null;
  fromCity?: LastSearchNode | null;
  toCountry?: LastSearchNode | null;
  toProvince?: LastSearchNode | null;
  toCity?: LastSearchNode | null;
}

/**
 * Should the screen adopt the stored route?
 *
 * 🔴 PURE, AND THE ONLY RULE THAT MATTERS HERE — asserted in
 * `scripts/check-last-search.mjs`, because getting it wrong is silent both ways: too eager and
 * it overwrites a search the passenger typed, too lax and the reported bug comes straight back.
 *
 * `applied` is the revision the screen has already acted on; `stored` is what is on disk.
 * A first focus (`applied === null`) does NOT adopt: the screen has just seeded itself from
 * the hand-off or the saved route, and re-applying would undo an explicit hand-off.
 */
export const shouldAdoptLastSearch = (
  applied: number | null,
  stored: number | null,
): boolean => {
  if (stored === null) return false;
  if (applied === null) return false;
  return stored !== applied;
};

const readNumber = async (key: string): Promise<number | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    // A read that throws must not take the screen down — it just means "no news".
    return null;
  }
};

export const readLastSearchRevision = (): Promise<number | null> =>
  readNumber(LAST_SEARCH_REVISION_KEY);

export const readLastSearchRoute = async (): Promise<LastSearchRoute | null> => {
  try {
    const raw = await AsyncStorage.getItem(LAST_SEARCH_KEY);
    return raw ? (JSON.parse(raw) as LastSearchRoute) : null;
  } catch {
    return null;
  }
};

/**
 * Write the route AND move the revision — the call that tells the search tab to follow.
 *
 * ⚠️ Used by the ORDER FORM only. If the search screen ever calls this it will react to its
 * own writes, which is the loop the mount-only comment there is guarding against.
 */
export const bumpLastSearchRoute = async (route: LastSearchRoute): Promise<void> => {
  try {
    // Both ends are required, or the screen has nothing to search with and the stored
    // route would be worse than the one it already has.
    if (!route.fromProvince || !route.toProvince) return;
    await AsyncStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(route));
    const current = (await readLastSearchRevision()) ?? 0;
    await AsyncStorage.setItem(LAST_SEARCH_REVISION_KEY, String(current + 1));
  } catch (error) {
    // Never block the save of an order on a convenience cache.
    console.error('Failed to hand the route to the search tab:', error);
  }
};
