/**
 * OfferResultCard — T-101 step 14b-2.
 *
 * One driver offer in the passenger's search results, as `UserQidiruv.dc.html` draws it
 * (lines 219-300). One component for BOTH of the screen's modes: a plain search result
 * (no `bid`) and a driver's offer on the passenger's own order (`bid` present, which swaps
 * the price block for the driver's own figure and adds a status pill).
 *
 * Measured from the artboard:
 *
 *   card     surface, border 1 (chrome), radius 20, padding 13 13 12 15, column gap 9
 *   header   car 15/800 · colour name 11.5/600 · class pill (2px 8px, radius 99, ground,
 *            10.5/700) · fuel mono 10.5/500 · free-seats badge right
 *            (4px 9px, radius 99, `successTint` on `brand`, 11/800)
 *   seats    a 1-cell front row above a 3-cell back row; 32px cells, radius 9, 2px border
 *   prices   right column, label 11/600 + value mono 14/700, `Old` above `Orqa`
 *   footer   hairline top, depart mono 11/600 · date mono 11/500 · tag pill right
 *
 * 🔴 THE ARTBOARD'S SEAT-CELL COLOURS FAILED AND WERE NOT COPIED. Measured against the real
 * palette: its free-cell border (`brand`) is **2.56:1** on surface and its taken-cell border
 * (a .16 ink wash) is **1.41:1** — both under the 3:1 non-text floor, on the one control that
 * tells a passenger whether a seat is free. Now `action` (5.29:1) and `text.tertiary`
 * (5.16:1). **25/25 pairs pass** — the probe is in `PLAN-T101-step14b.md` §7.
 *
 * ⚠️ Deviations, each deliberate (`PLAN-T101-step14b.md` §2, owner decision ③):
 *   - **No presence dot and no "seen 12 daq oldin".** There is no `last_seen` or online flag
 *     anywhere in the API. The artboard's absolutely-positioned dot is simply absent.
 *   - **The seat cells show OCCUPANCY, not GENDER.** How many seats are free is real
 *     (`seats_free` + `back_seats_free`); who sits in them is not (→ T-106). So a taken cell
 *     is a filled neutral square, never a man/woman glyph the server cannot justify.
 *     🔴 **But occupancy itself has THREE front-seat states, not two** — `free`, `taken` and
 *     `notOffered` — and the first version of this card had two. `api/offers.ts` spells the
 *     rule out under T-083: a seat the driver never priced is not a seat that is gone.
 *   - **No colour swatch.** `VehicleColor.hex_code` exists but is not serialised into the
 *     offer response; the colour NAME is shown instead. One-line server change → T-106.
 *   - **No `Hoziroq` pill.** Driver-side urgency does not exist (→ T-103); `is_urgent` is
 *     passenger-side only and must not be borrowed.
 *   - **No ★ rating on the card.** It is real and it IS built — but in the driver block
 *     (14b-3), where the artboard puts it, not on the result row.
 *
 * Every rule about WHAT is shown comes from `utils/offerSearch.ts` (14b-1); this file draws.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { formatNumberWithSpaces } from '../../utils/format';
import type { DriverOffer } from '../../api/offers';
import {
  BACK_SEAT_COUNT,
  bidCarName,
  bidColorName,
  bidDriverName,
  bidLabelKey,
  bidPrices,
  bidTone,
  freeSeats,
  fuelChips,
  money,
  seatAvailability,
  type BidLike,
  type FrontSeatState,
} from '../../utils/offerSearch';
import { theme } from '../../themes';

/**
 * A DISCRIMINATED UNION, NOT AN OFFER WITH AN OPTIONAL BID.
 *
 * The two modes render two different objects that merely look alike: `Qidiruv` shows a
 * driver's published ride (`DriverOffer`); `Takliflar` shows a driver's bid on the passenger's
 * own request (`OfferDriver`), which has no `DriverOffer` behind it at all and nests its
 * vehicle one level deeper. This card first took `offer` plus an optional `bid`, which quietly
 * implied the bid decorated the offer - the T-042 trap, one logical thing with two shapes.
 */
export type OfferResultCardProps = {
  /** "25.08.2025 Dushanba" and "22:00", formatted by the screen (Hermes locale is not trusted). */
  departText: string;
  dateText: string;
  onPress: () => void;
} & (
  | { mode: 'offer'; offer: DriverOffer; bid?: undefined }
  | { mode: 'bid'; bid: BidLike; offer?: undefined }
);

/**
 * 🔴 THREE STATES, NOT TWO (T-083). A seat the driver never offered is drawn as a dashed,
 * empty outline — visibly different from a taken seat, which is filled. Collapsing them would
 * tell a passenger a seat is gone when it never existed. `'unknown'` (a pre-T-083 offer) draws
 * as free: under-claiming hides nothing.
 */
const Cell: React.FC<{ state: FrontSeatState }> = ({ state }) => {
  if (state === 'notOffered') return <View style={[styles.cell, styles.cellNotOffered]} />;
  if (state === 'taken') {
    return (
      <View style={[styles.cell, styles.cellTaken]}>
        <View style={styles.cellDot} />
      </View>
    );
  }
  return <View style={[styles.cell, styles.cellFree]} />;
};

export const OfferResultCard: React.FC<OfferResultCardProps> = (props) => {
  const { t } = useTranslation();
  const { departText, dateText, onPress } = props;

  const priceText = (n: number | null) =>
    n == null ? t('searchOffers.priceNone') : formatNumberWithSpaces(n);

  const isBid = props.mode === 'bid';
  const offer = props.mode === 'offer' ? props.offer : null;
  const bid = props.mode === 'bid' ? props.bid : null;

  /*
   * A bid has NO seat grid. The driver names how many seats they are OFFERING, not which of a
   * published ride's seats remain - so the grid is omitted rather than drawn empty, which
   * would invent an availability the row cannot know.
   */
  const free = offer ? freeSeats(offer) : 0;
  const avail = offer ? seatAvailability(offer) : null;
  const fuels = offer ? fuelChips(offer) : [];
  const backTaken = avail ? BACK_SEAT_COUNT - avail.backFree : 0;

  const frontPrice = offer ? money(offer.front_price_per_seat) : null;
  const backPrice = offer ? money(offer.price_per_seat) : null;
  const bidMoney = bid ? bidPrices(bid) : null;

  const carName = offer
    ? [offer.vehicle?.make, offer.vehicle?.model].filter(Boolean).join(' ') ||
      t('searchOffers.vehicleUnknown')
    : (bid && bidCarName(bid)) || t('searchOffers.vehicleUnknown');
  const colorName = offer ? offer.vehicle?.color : bid ? bidColorName(bid) : null;
  const driverName = bid ? bidDriverName(bid) : null;
  const tone = bid ? bidTone(bid.status) : null;

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.car} numberOfLines={1}>
              {carName}
            </Text>
            {!!colorName && (
              <Text style={styles.colorName} numberOfLines={1}>
                {colorName}
              </Text>
            )}
          </View>
          <View style={styles.metaRow}>
            {!!offer?.vehicle_class && (
              <View style={styles.classPill}>
                <Text style={styles.classLabel}>{offer.vehicle_class}</Text>
              </View>
            )}
            {fuels.length > 0 && (
              <Text style={styles.fuel} numberOfLines={1}>
                {fuels.map((f) => (f.key ? t(f.key) : f.raw)).join(' · ')}
              </Text>
            )}
            {!!driverName && (
              <Text style={styles.fuel} numberOfLines={1}>
                {driverName}
              </Text>
            )}
          </View>
        </View>

        {isBid ? (
          <View style={[styles.statusPill, pillTint(tone)]}>
            <Text style={[styles.statusLabel, pillInk(tone)]} numberOfLines={1}>
              {t(bidLabelKey(bid?.status))}
            </Text>
          </View>
        ) : (
          <View style={styles.freeBadge}>
            <Text style={styles.freeLabel}>
              {`${free} ${t('searchOffers.seat')}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {avail && (
          <View style={styles.seats}>
            <View style={styles.seatRow}>
              <Cell state={avail.front} />
            </View>
            <View style={styles.seatRow}>
              {Array.from({ length: BACK_SEAT_COUNT }).map((_, i) => (
                <Cell key={i} state={i < backTaken ? 'taken' : 'free'} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.prices}>
          {bidMoney ? (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('searchOffers.perSeat')}</Text>
                <Text style={styles.bidPrice}>{priceText(bidMoney.perSeat)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('offerDrivers.total')}</Text>
                <Text style={styles.bidPrice}>{priceText(bidMoney.total)}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('searchOffers.priceFront')}</Text>
                <Text style={[styles.priceValue, frontPrice == null && styles.priceMissing]}>
                  {priceText(frontPrice)}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('searchOffers.priceBack')}</Text>
                <Text style={[styles.priceValue, backPrice == null && styles.priceMissing]}>
                  {priceText(backPrice)}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.depart}>{departText}</Text>
        <Text style={styles.date}>{dateText}</Text>
        <View style={styles.spacer} />
        {!!offer?.parcel_accepted && (
          <View style={styles.tag}>
            <Text style={styles.tagLabel}>{t('offerDetails.parcelAccepted')}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

type Tone = ReturnType<typeof bidTone> | null;
const pillTint = (tone: Tone) =>
  tone === 'ok'
    ? styles.pillOk
    : tone === 'bad'
      ? styles.pillBad
      : tone === 'wait'
        ? styles.pillWait
        : styles.pillNeutral;
const pillInk = (tone: Tone) =>
  tone === 'ok'
    ? styles.inkOk
    : tone === 'bad'
      ? styles.inkBad
      : tone === 'wait'
        ? styles.inkWait
        : styles.inkNeutral;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.borders.chrome,
    borderRadius: theme.borderRadius.card,
    paddingTop: 13,
    paddingRight: 13,
    paddingBottom: 12,
    paddingLeft: 15,
    gap: 9,
  },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  headerText: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  car: { fontSize: 15, ...theme.font('sans', 800), color: theme.palette.text.primary, lineHeight: 19 },
  colorName: { fontSize: 11.5, ...theme.font('sans', 600), color: theme.palette.text.secondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  classPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.ground,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
  },
  classLabel: { fontSize: 10.5, ...theme.font('sans', 700), color: theme.palette.text.muted },
  fuel: { fontSize: 10.5, ...theme.font('mono', 500), color: theme.palette.text.tertiary },

  freeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    borderWidth: 1,
    borderColor: theme.palette.brand,
  },
  freeLabel: { fontSize: 11, ...theme.font('sans', 800), color: theme.palette.actionPressed },

  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  pillOk: { backgroundColor: theme.palette.successTint, borderColor: theme.palette.brand },
  pillWait: { backgroundColor: theme.palette.warnTint, borderColor: theme.palette.warnBorder },
  pillBad: { backgroundColor: theme.palette.dangerTint, borderColor: theme.palette.dangerBorder },
  pillNeutral: {
    backgroundColor: theme.palette.surfaceSunken,
    borderColor: theme.palette.borders.emphasis,
  },
  statusLabel: { fontSize: 10.5, ...theme.font('sans', 800) },
  inkOk: { color: theme.palette.actionPressed },
  inkWait: { color: theme.palette.warnInk },
  inkBad: { color: theme.palette.dangerDeep },
  inkNeutral: { color: theme.palette.text.muted },

  body: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  seats: { gap: 4, alignItems: 'flex-end' },
  seatRow: { flexDirection: 'row', gap: 4 },
  cell: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 🔴 Measured, not copied — see the header note.
  cellFree: { backgroundColor: theme.palette.surface, borderColor: theme.palette.action },
  cellTaken: {
    backgroundColor: theme.palette.surfaceSunken,
    borderColor: theme.palette.text.tertiary,
  },
  cellNotOffered: {
    backgroundColor: theme.palette.surface,
    borderColor: theme.palette.borders.strong,
    borderStyle: 'dashed',
  },
  cellDot: {
    width: 10,
    height: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.text.muted,
  },

  prices: { flex: 1, minWidth: 0, gap: 3, alignItems: 'flex-end' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceLabel: { fontSize: 11, ...theme.font('sans', 600), color: theme.palette.text.tertiary },
  priceValue: { fontSize: 14, ...theme.font('mono', 700), color: theme.palette.text.primary },
  priceMissing: { color: theme.palette.text.tertiary },
  bidPrice: { fontSize: 14, ...theme.font('mono', 700), color: theme.palette.actionPressed },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
    paddingTop: 6,
    borderTopWidth: theme.sizes.borderHairline,
    borderTopColor: theme.palette.borders.chrome,
  },
  depart: { fontSize: 11, ...theme.font('mono', 600), color: theme.palette.text.muted },
  date: { fontSize: 11, ...theme.font('mono', 500), color: theme.palette.text.tertiary },
  spacer: { flex: 1 },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
  },
  tagLabel: { fontSize: 10.5, ...theme.font('sans', 700), color: theme.palette.actionPressed },
});
