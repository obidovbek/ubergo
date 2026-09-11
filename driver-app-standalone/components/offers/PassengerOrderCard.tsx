/**
 * PassengerOrderCard — T-101 step 17c.
 *
 * The order card of `DriverQidiruv.dc.html` (lines 157-268), for both of the screen's modes:
 * an INCOMING passenger order (no `request`) and a SENT proposal (`request` = the driver's own
 * join request on it, which adds the status pill and swaps the price for the driver's offer).
 *
 * Measured from the artboard:
 *
 *   card      surface, border 1 (chrome; `brand` once the passenger confirmed; `dangerBorder`
 *             when rejected), radius 20, padding 13 13 12 15, column gap 9
 *   header    name 14.5/800 · urgent pill (warnTint / warnBorder / warnInk, 10/800, bolt 12)
 *             · status pill top-right (4px 9px, radius 99, 10.5/800)
 *   route     connector column 12 wide — 8px dots (`text.tertiary` → `brand`) joined by a 2px
 *             line — from/to 13/700, and a 38px pax disc (mono 17/800) in `brand` or `paid`
 *   seats     26px cells, radius 7, 1.5 border: `maleTint`/`male`, `femaleTint`/`female`,
 *             empty `surfaceSunken`/`emphasis`; front row of 1 above a back row of 3
 *   price     label 11/600 secondary · value mono 14/800 (`paid` for a special order,
 *             `actionPressed` for the driver's own offer, `text.primary` otherwise)
 *             · note 10.5/600 secondary
 *   footer    hairline top, depart mono 11/600 muted · date mono 11/500 tertiary · tag pills
 *             (3px 8px, radius 99, 10.5/700): the kind first, then the flags
 *
 * ⚠️ Deviations, each deliberate:
 *   - No presence dot, no "seen" line, no ★ rating — there is no backend for any of them
 *     (`PLAN-T101-step17.md` §2, owner decision ⑥ 2026-09-11).
 *   - The dashed route connector (`repeating-linear-gradient`) is a solid `brand` hairline —
 *     React Native cannot draw the gradient; step 9 made the same call on the passenger side.
 *   - `'any'` seat cells (offers without `seat_counts`) draw as a filled neutral square with no
 *     glyph: occupied, gender unknown. The artboard has no such state because its data is fake.
 *   - The date line has no weekday: the app's date helper does not format one, and Hermes'
 *     `Intl` cannot be trusted to on every device.
 *
 * Every rule about WHAT is shown (kind, cells, which price, tags, the pill's tone) comes from
 * `utils/passengerOrders.ts` (17a). This file only draws.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDateByLanguage, formatDateTime, formatTimeByLanguage } from '../../utils/date';
import { formatNumberWithSpaces } from '../../utils/format';
import { passengerNameOf } from '../../api/passengerOffers';
import type { OfferDriver, PassengerOffer } from '../../api/passengerOffers';
import {
  listedPrice,
  orderKind,
  orderTags,
  requestLabelKey,
  requestTone,
  seatCells,
  type PillTone,
  type SeatCell,
} from '../../utils/passengerOrders';
import { theme } from '../../themes';

interface PassengerOrderCardProps {
  order: PassengerOffer;
  /** The driver's own request on this order — present in the sent mode, absent when incoming. */
  request?: OfferDriver | null;
  onPress: () => void;
}

// Verbatim `d` attributes from the artboard (24-box, FILLED — unlike the chrome `Icon` set,
// which is stroke-only). Do not hand-tidy these.
const GLYPH = {
  maleHair: 'M7.5 7.6c0-2.7 2-4.6 4.5-4.6s4.5 1.9 4.5 4.6v1.2h-1.3c-1.7 0-3.2-.8-4.2-2-.6 1.2-1.8 1.9-3.1 2h-.4z',
  femaleHair:
    'M12 2.4c-3.3 0-5.5 2.3-5.5 5.7 0 2.4.3 4.2.9 5.5l1.7-.9c-.5-1.1-.7-2.5-.7-4.4 0-2.4 1.5-4 3.6-4s3.6 1.6 3.6 4c0 1.9-.2 3.3-.7 4.4l1.7.9c.6-1.3.9-3.1.9-5.5 0-3.4-2.2-5.7-5.5-5.7z',
  body: 'M12 12.9c-4.2 0-7.5 2.3-7.5 5.4V22h15v-3.7c0-3.1-3.3-5.4-7.5-5.4z',
  bolt: 'M13.2 2 5 13.4h5.1L9.6 22 18.6 9.8h-5.2z',
} as const;

const SeatGlyph: React.FC<{ gender: 'm' | 'f' }> = ({ gender }) => {
  const fill = gender === 'm' ? theme.palette.male : theme.palette.female;
  return (
    <Svg viewBox="0 0 24 24" width={17} height={17}>
      <Path d={gender === 'm' ? GLYPH.maleHair : GLYPH.femaleHair} fill={fill} />
      <Circle cx={12} cy={gender === 'm' ? 8.7 : 8.5} r={3.4} fill={fill} />
      <Path d={GLYPH.body} fill={fill} />
    </Svg>
  );
};

const Seat: React.FC<{ cell: SeatCell }> = ({ cell }) => (
  <View
    style={[
      styles.seat,
      cell === 'm' && styles.seatMale,
      cell === 'f' && styles.seatFemale,
      cell === 'any' && styles.seatAny,
    ]}
  >
    {(cell === 'm' || cell === 'f') && <SeatGlyph gender={cell} />}
  </View>
);

const pillStyle = (tone: PillTone) =>
  tone === 'ok' ? styles.pillOk : tone === 'bad' ? styles.pillBad : tone === 'wait' ? styles.pillWait : styles.pillNeutral;
const pillInk = (tone: PillTone) =>
  tone === 'ok' ? styles.pillInkOk : tone === 'bad' ? styles.pillInkBad : tone === 'wait' ? styles.pillInkWait : styles.pillInkNeutral;

export const PassengerOrderCard: React.FC<PassengerOrderCardProps> = ({ order, request, onPress }) => {
  const { t, currentLanguage } = useTranslation();

  const kind = orderKind(order);
  const paid = kind === 'maxsus';
  const cells = seatCells(order);
  const price = listedPrice(order);
  const tags = orderTags(order);
  const tone: PillTone | null = request ? requestTone(request.status) : null;
  const name = passengerNameOf(order) || '—';
  const people = Math.max(1, Math.floor(Number(order.seats_needed)) || 1);

  // The card border tells the state before the pill is read.
  const borderStyle =
    tone === 'ok' ? styles.cardConfirmed : tone === 'bad' ? styles.cardRejected : null;

  // Price: the driver's own offer in the sent mode, else what the passenger listed.
  const priceLabel = request
    ? t('passengerOrders.priceMine')
    : paid
      ? t('passengerOrders.pricePassenger')
      : t('passengerOrders.priceListed');
  const priceTotal = request ? Math.round(Number(request.total_offered_price)) : price.total;
  const priceText =
    priceTotal === null || !Number.isFinite(priceTotal)
      ? t('passengerOfferExtras.priceNegotiable')
      : `${formatNumberWithSpaces(priceTotal)} ${order.currency}`;
  const priceInk = request ? styles.priceMine : paid ? styles.pricePaid : styles.priceInk;
  const priceNote = request
    ? formatDateTime(request.created_at, currentLanguage)
    : `${people} ${t('passengerOrders.people')}`;

  // Departure: "Hoziroq" for an urgent order, else the time or the window's two ends.
  const depart = order.is_urgent
    ? t('passengerOfferExtras.urgent')
    : order.depart_until
      ? `${formatTimeByLanguage(order.start_at, currentLanguage)}-${formatTimeByLanguage(order.depart_until, currentLanguage)}`
      : formatTimeByLanguage(order.start_at, currentLanguage);
  const date = formatDateByLanguage(order.start_at, currentLanguage);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${order.from_text} → ${order.to_text}. ${priceLabel}: ${priceText}`}
      style={({ pressed }) => [styles.card, borderStyle, pressed && styles.cardPressed]}
    >
      {/* header */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {!!order.is_urgent && (
              <View style={styles.urgent}>
                <Svg viewBox="0 0 24 24" width={12} height={12}>
                  <Path d={GLYPH.bolt} fill={theme.palette.warnInk} />
                </Svg>
                <Text style={styles.urgentText}>{t('passengerOfferExtras.urgent')}</Text>
              </View>
            )}
          </View>
        </View>
        {request && tone && (
          <View style={[styles.pill, pillStyle(tone)]}>
            <Text style={[styles.pillText, pillInk(tone)]}>{t(requestLabelKey(request.status))}</Text>
          </View>
        )}
      </View>

      {/* route */}
      <View style={styles.routeRow}>
        <View style={styles.connector}>
          <View style={[styles.dot, styles.dotFrom]} />
          <View style={styles.line} />
          <View style={[styles.dot, styles.dotTo]} />
        </View>
        <View style={styles.routeTexts}>
          <Text style={styles.place} numberOfLines={2}>
            {order.from_text}
          </Text>
          <Text style={styles.place} numberOfLines={2}>
            {order.to_text}
          </Text>
        </View>
        <View style={styles.discCol}>
          <View style={[styles.disc, paid ? styles.discPaid : styles.discBrand]}>
            <Text style={[styles.discText, paid ? styles.discTextPaid : styles.discTextBrand]}>{people}</Text>
          </View>
        </View>
      </View>

      {/* seats + price */}
      <View style={styles.seatsRow}>
        <View style={styles.seatGrid} accessibilityLabel={`${cells.occupied} ${t('passengerOrders.people')}`}>
          <View style={styles.seatLine}>
            {cells.front.map((cell, i) => (
              <Seat key={`f${i}`} cell={cell} />
            ))}
          </View>
          <View style={styles.seatLine}>
            {cells.back.map((cell, i) => (
              <Seat key={`b${i}`} cell={cell} />
            ))}
          </View>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>{priceLabel}</Text>
          <Text style={[styles.priceValue, priceInk]}>{priceText}</Text>
          <Text style={styles.priceNote}>{priceNote}</Text>
        </View>
      </View>

      {/* footer */}
      <View style={styles.footer}>
        <Text style={styles.depart}>{depart}</Text>
        <Text style={styles.date}>{date}</Text>
        <View style={styles.spacer} />
        <View style={[styles.tag, paid ? styles.tagPaid : styles.tagKind]}>
          <Text style={[styles.tagText, paid ? styles.tagTextPaid : styles.tagTextKind]}>
            {t(paid ? 'passengerOrders.kindMaxsus' : 'passengerOrders.kindOddiy')}
          </Text>
        </View>
        {tags.map((key) => (
          <View key={key} style={[styles.tag, styles.tagFlag]}>
            <Text style={[styles.tagText, styles.tagTextFlag]}>{t(key)}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
};

// Measured radii the scale does not carry: the seat square (7) — between `xs` 2 and `sm` 8.
const SEAT_RADIUS = 7;
const SEAT = 26;
const DISC = 38;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.chrome,
    borderRadius: theme.borderRadius.card,
    paddingTop: 13,
    paddingRight: 13,
    paddingBottom: 12,
    paddingLeft: 15,
    gap: 9,
  },
  cardConfirmed: { borderColor: theme.palette.brand },
  cardRejected: { borderColor: theme.palette.dangerBorder },
  cardPressed: { backgroundColor: theme.palette.surfaceInput },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  headerMain: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  name: { flexShrink: 1, fontSize: 14.5, lineHeight: 18, ...theme.font('sans', 800), color: theme.palette.text.primary },
  urgent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.warnTint,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.warnBorder,
  },
  urgentText: { fontSize: 10, lineHeight: 13, ...theme.font('sans', 800), color: theme.palette.warnInk },

  pill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.sizes.borderHairline,
  },
  pillOk: { backgroundColor: theme.palette.successTint, borderColor: theme.palette.brand },
  pillBad: { backgroundColor: theme.palette.dangerTint, borderColor: theme.palette.dangerBorder },
  pillWait: { backgroundColor: theme.palette.warnTint, borderColor: theme.palette.warnBorder },
  pillNeutral: { backgroundColor: theme.palette.surfaceSunken, borderColor: theme.palette.borders.emphasis },
  pillText: { fontSize: 10.5, lineHeight: 13, ...theme.font('sans', 800) },
  pillInkOk: { color: theme.palette.actionPressed },
  pillInkBad: { color: theme.palette.dangerDeep },
  pillInkWait: { color: theme.palette.warnInk },
  pillInkNeutral: { color: theme.palette.text.muted },

  routeRow: { flexDirection: 'row', gap: 10 },
  connector: { width: 12, alignItems: 'center', paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: theme.borderRadius.full },
  dotFrom: { backgroundColor: theme.palette.text.tertiary },
  dotTo: { backgroundColor: theme.palette.brand },
  line: { flex: 1, width: 2, minHeight: 16, marginVertical: 2, backgroundColor: theme.palette.brand },
  routeTexts: { flex: 1, minWidth: 0, gap: 3 },
  place: { fontSize: 13, lineHeight: 17, ...theme.font('sans', 700), color: theme.palette.text.primary },
  discCol: { width: 44, alignItems: 'flex-end', justifyContent: 'center' },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discBrand: { backgroundColor: theme.palette.successTint, borderColor: theme.palette.brand },
  discPaid: { backgroundColor: theme.palette.paidTint, borderColor: theme.palette.paid },
  discText: { fontSize: 17, lineHeight: 20, ...theme.font('mono', 700) },
  discTextBrand: { color: theme.palette.actionPressed },
  discTextPaid: { color: theme.palette.paid },

  seatsRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  seatGrid: { gap: 4, alignItems: 'flex-end' },
  seatLine: { flexDirection: 'row', gap: 4 },
  seat: {
    width: SEAT,
    height: SEAT,
    borderRadius: SEAT_RADIUS,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.emphasis,
    backgroundColor: theme.palette.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatMale: { backgroundColor: theme.palette.maleTint, borderColor: theme.palette.male },
  seatFemale: { backgroundColor: theme.palette.femaleTint, borderColor: theme.palette.female },
  seatAny: { backgroundColor: theme.palette.disabled, borderColor: theme.palette.borders.emphasis },
  priceBlock: { flex: 1, minWidth: 0, alignItems: 'flex-end', gap: 3 },
  priceLabel: { fontSize: 11, lineHeight: 14, ...theme.font('sans', 600), color: theme.palette.text.secondary },
  priceValue: { fontSize: 14, lineHeight: 18, ...theme.font('mono', 700) },
  priceInk: { color: theme.palette.text.primary },
  pricePaid: { color: theme.palette.paid },
  priceMine: { color: theme.palette.actionPressed },
  priceNote: { fontSize: 10.5, lineHeight: 13, ...theme.font('sans', 600), color: theme.palette.text.secondary },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    paddingTop: 7,
    borderTopWidth: theme.sizes.borderHairline,
    borderTopColor: theme.palette.borders.chrome,
  },
  depart: { fontSize: 11, lineHeight: 14, ...theme.font('mono', 600), color: theme.palette.text.muted },
  date: { fontSize: 11, lineHeight: 14, ...theme.font('mono', 500), color: theme.palette.text.tertiary },
  spacer: { flex: 1 },
  tag: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: theme.borderRadius.full },
  tagKind: { backgroundColor: theme.palette.successTint },
  tagPaid: { backgroundColor: theme.palette.paidTint },
  tagFlag: { backgroundColor: theme.palette.ground },
  tagText: { fontSize: 10.5, lineHeight: 13, ...theme.font('sans', 700) },
  tagTextKind: { color: theme.palette.actionPressed },
  tagTextPaid: { color: theme.palette.paid },
  tagTextFlag: { color: theme.palette.text.muted },
});
