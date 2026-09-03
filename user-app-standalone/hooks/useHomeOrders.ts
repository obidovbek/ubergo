/**
 * The home screen's two live blocks — T-101 step 6b.
 *
 * ONE request feeds both: the active-order banner and the recent-routes shortcuts.
 * Fetching twice for two views of the same list is how the home screen would start
 * costing two round-trips on every focus.
 *
 * 🔴 WHY THIS EXISTS: step 6 shipped neither block, and the reason was right at the
 * time — `UserMenuNeW.dc.html` draws the banner with **invented** data ("Toshkent →
 * Samarqand · Sardor A. · Malibu 01 A 777"), and its `routes` list is literally empty
 * markup fed by a hardcoded `ROUTES` constant. Shipping the artboard as drawn would have
 * put fiction on the user's home screen.
 *
 * ✅ What changed 2026-09-01: the owner asked what the empty space should hold, and
 * `getMyPassengerOffers` turns out to answer it with REAL data. Both blocks are derived
 * from the user's own orders, and **both render nothing at all when there are none** —
 * an empty home screen is honest; a fake trip is not.
 *
 * ⚠️ Failure is silent by design. This is decoration on top of a working screen: if the
 * request fails the blocks simply do not appear, and the CTA below them still works. The
 * error is logged, never surfaced — a red banner over the home screen for a failed
 * *shortcut* list would be worse than the missing shortcut.
 */

import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  getMyPassengerOffers,
  type PassengerOffer,
} from "../api/passengerOffers";

/**
 * An order still in play.
 *
 * `published` = posted, waiting for drivers to bid.
 * `driver_found` = a driver is CONFIRMED and the ride has not happened yet
 * (`passengerOffers.ts:82` says so explicitly).
 *
 * The other three — `archived`, `cancelled`, `completed` — are finished and belong in
 * the history list, not the banner.
 */
const ACTIVE_STATUSES: PassengerOffer["status"][] = [
  "published",
  "driver_found",
];

/** How many past routes the artboard's grid holds. */
const RECENT_LIMIT = 3;

export interface RecentRoute {
  /** The offer this was taken from — the key, and what a tap could reopen. */
  id: number;
  fromText: string;
  toText: string;
}

interface HomeOrders {
  activeOffer: PassengerOffer | null;
  recentRoutes: RecentRoute[];
  loading: boolean;
}

/**
 * "Andijon viloyati, Andijon tumani/ Aylanpa" → "Aylanpa"
 *
 * The banner and the chips both need the short form, so it is exported rather than
 * duplicated in the screen.
 */
export const shortPlace = (text: string): string => {
  const afterLandmark = text.includes("/")
    ? (text.split("/").pop() ?? text)
    : text;
  const parts = afterLandmark
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || text.trim();
};

export const useHomeOrders = (): HomeOrders => {
  const [offers, setOffers] = useState<PassengerOffer[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      getMyPassengerOffers()
        .then((rows) => {
          if (!cancelled) setOffers(rows);
        })
        .catch((error) => {
          // Deliberately silent — see the header. The blocks just do not render.
          console.error("Home orders failed to load:", error);
          if (!cancelled) setOffers([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  /*
   * The newest active order wins the banner. `getMyPassengerOffers` does not promise an
   * order, so this sorts rather than taking [0] — trusting an unspecified order is how a
   * screen shows the wrong row for months without anyone noticing.
   */
  const activeOffer =
    offers
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0] ?? null;

  /*
   * Recent routes are for RE-ORDERING, so they come from finished journeys and are
   * de-duplicated: the same commute ordered ten times is one shortcut, not ten.
   */
  const seen = new Set<string>();
  const recentRoutes: RecentRoute[] = [];
  for (const offer of [...offers].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )) {
    if (offer.status === "published" || offer.status === "driver_found")
      continue;
    if (!offer.from_text || !offer.to_text) continue;

    const key = `${offer.from_text}→${offer.to_text}`;
    if (seen.has(key)) continue;
    seen.add(key);

    recentRoutes.push({
      id: offer.id,
      fromText: shortPlace(offer.from_text),
      toText: shortPlace(offer.to_text),
    });
    if (recentRoutes.length === RECENT_LIMIT) break;
  }

  return { activeOffer, recentRoutes, loading };
};
