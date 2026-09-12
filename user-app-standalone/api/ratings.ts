/**
 * Driver ratings API — T-101 step 14b-3.
 *
 * 🟢 THIS ENDPOINT HAS EXISTED ALL ALONG AND NOTHING HAS EVER CALLED IT. `DriverRating`,
 * `driver-rating.routes.ts` and the summary controller are all live on the server; the board
 * card T-109 ② said "no rating model exists anywhere in the API", which was a grep of the
 * wrong directory. Verified 2026-09-12 against `DriverRatingController.calculateRatingSummary`.
 *
 * 🔴 ONLY THE SUMMARY IS PUBLIC. The comment text a passenger would want to read is NOT
 * reachable: `GET /ratings/driver/ratings` includes comments but is scoped to `req.user.id`,
 * so it is a driver reading their OWN reviews. There is no "reviews of driver X" endpoint.
 * The artboard's `Foydalanuvchilar izohi` list therefore cannot be built — the distribution
 * below is what replaces it. → T-112.
 */

import { API_BASE_URL, getHeaders, API_TIMEOUT } from '../config/api';

/** Counts per star, keyed '1'..'5'. The server always sends all five, zeros included. */
export type RatingDistribution = Record<'1' | '2' | '3' | '4' | '5', number>;

export interface DriverRatingSummary {
  average_rating: number;
  total_ratings: number;
  rating_distribution: RatingDistribution;
}

const EMPTY_DISTRIBUTION: RatingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

/**
 * The public summary for one driver.
 *
 * ⚠️ The server answers **200 with zeros** for a driver nobody has rated — not a 404 — so an
 * unrated driver is a normal result, not an error. The caller must still render "no rating
 * yet" rather than a 0,0 score; `ratingOf`/`formatRating` in `utils/offerSearch.ts` own that.
 * ⚠️ No auth header is required, but sending one is harmless and keeps every call in this app
 * shaped the same way.
 */
export const getDriverRatingSummary = async (
  driverId: number,
  token?: string | null,
): Promise<DriverRatingSummary> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/ratings/drivers/${driverId}/rating-summary`, {
      method: 'GET',
      headers: await getHeaders(token ?? undefined),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success) {
      /*
       * The app's error helper reads an axios-shaped `.response` even though this is `fetch`
       * — a convention both apps follow. Typed rather than cast, so the shape is checked.
       */
      const error: Error & { response?: { status: number; data: unknown } } = new Error(
        body?.message || 'Failed to load the rating summary',
      );
      error.response = { status: response.status, data: body };
      throw error;
    }

    const data = body.data ?? {};
    return {
      average_rating: Number(data.average_rating) || 0,
      total_ratings: Number(data.total_ratings) || 0,
      // Defensive: an older server could omit a bucket, and a missing bar must read as 0.
      rating_distribution: { ...EMPTY_DISTRIBUTION, ...(data.rating_distribution ?? {}) },
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
