/**
 * MyRideCard — T-101 step 18b.
 *
 * ⚠️ NAMED `MyRideCard`, not `RideCard`: `components/cards/RideCard.tsx` already exists as a
 * zero-importer ORPHAN from the old taxi-style ride model (T-105). Two files with one
 * basename is exactly the twin trap this project keeps hitting, so this one is distinct.
 *
 * The driver's own ride (e'lon) as `DriverMyOrder.dc.html` draws it (lines 121-178): a
 * gradient card that expands to show the passengers who booked it. The only gradient card
 * body in either app.
 *
 * Measured from the artboard:
 *
 *   card      radius 24 (`hero`), padding 14 14 12, column gap 12,
 *             `rideGradient` at 158deg — `rideGradientOff` once cancelled or archived
 *   header    route 17/900 on `rideInk` (letterSpacing -.015em) · `when` mono 11/600 ·
 *             state pill (5px 11px, radius 99, 10.5/800) on rgba(255,255,255,.92) ·
 *             26px chevron disc on rgba(12,42,20,.14)
 *   stats     three equal tiles, rgba(255,255,255,.93), radius 16, padding 10:
 *             value mono 14.5/800 tabular · label 10/700
 *   readout   the fill state — rgba(255,255,255,.93) when full, rgba(255,255,255,.42) when
 *             seats remain (radius 14, padding 9 11, 12.5/800 + a 16px glyph)
 *   actions   48 high, radius 15, gap 8 — cancel is `dangerTint` with a 1.5 `dangerBorder`
 *   reason    the cancelled strip, rgba(255,255,255,.93) with `dangerDeep` 11.5/700
 *
 * ⚠️ Deviations, each deliberate and each recorded on `PLAN-T101-step18.md` §2:
 *   - 🔴 **The fill row is a READOUT, not a button** (owner decision ②). The artboard's
 *     `confirmFull` writes a "confirmed" offer state the server does not have; the phase is
 *     derived from `seats_free` instead, so the row reports and does not act.
 *   - **No parcel row.** The artboard sums `PARCELS[]` per route; there is no parcel-order
 *     model anywhere in the API. The offer's `parcel_accepted` FLAG is shown as a tag
 *     instead, which is the only part of it that is real.
 *   - **No visibility note.** The artboard claims a full e'lon disappears from passenger
 *     search; nothing in `PublicOfferController` does that, so the copy is not repeated.
 *   - **`Reysni bekor qilish` takes no reason** — `POST /driver/offers/:id/cancel` reads no
 *     body. A reason field would be typed and dropped. → T-110.
 *   - Archive / re-publish / delete are drawn where the artboard has only cancel: they are
 *     real server actions the old screen already offered, and Tarix would otherwise be inert.
 *
 * 🔴 THE INK ON THE GRADIENT IS DARK (`rideInk`), NOT WHITE. White measures 2.2:1 on the
 * light end. Measured 26/26 AA against the bundled palette, worst pair 3.91:1 on a 3:1
 * icon floor — the probe is in `PLAN-T101-step18.md` §7.
 *
 * Every rule about WHICH state this is and WHAT may be done to it comes from
 * `utils/myRides.ts` (18a). This file only draws.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDateTime } from '../../utils/date';
import { formatNumberWithSpaces } from '../../utils/format';
import type { DriverOffer } from '../../api/driverOffers';
import {
  canArchive,
  canCancel,
  canDelete,
  canEdit,
  canPublish,
  fillKey,
  isFull,
  isPast,
  moneyLabelKey,
  ridePhase,
  ridePillKey,
  ridePillTone,
  rideStats,
  type BookingLike,
  type PillTone,
} from '../../utils/myRides';
import { theme } from '../../themes';

// Verbatim `d` attributes from the artboard (24-box, stroke). Do not hand-tidy these.
const GLYPH = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  seats: 'M4 16.5v-3.2l1.7-4.1A2 2 0 0 1 7.5 8h9a2 2 0 0 1 1.8 1.2l1.7 4.1v3.2',
} as const;

export interface MyRideCardProps {
  ride: DriverOffer;
  /** `null` until this card is expanded — the stats then fill in (decision ④). */
  bookings: readonly BookingLike[] | null;
  expanded: boolean;
  /** Milliseconds; passed in so the card stays pure and the screen owns the clock. */
  nowMs: number;
  onToggle: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onArchive: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

const pillTint = (tone: PillTone) =>
  tone === 'ok'
    ? styles.statePillOk
    : tone === 'bad'
      ? styles.statePillBad
      : tone === 'wait'
        ? styles.statePillWait
        : styles.statePillNeutral;

const pillInk = (tone: PillTone) =>
  tone === 'ok'
    ? styles.stateInkOk
    : tone === 'bad'
      ? styles.stateInkBad
      : tone === 'wait'
        ? styles.stateInkWait
        : styles.stateInkNeutral;

const Stroke: React.FC<{ d: string; size?: number; color?: string; width?: number }> = ({
  d,
  size = 16,
  color = theme.palette.rideInk,
  width = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MyRideCard: React.FC<MyRideCardProps> = ({
  ride,
  bookings,
  expanded,
  nowMs,
  onToggle,
  onEdit,
  onCancel,
  onArchive,
  onPublish,
  onDelete,
}) => {
  const { t, currentLanguage } = useTranslation();

  const phase = ridePhase(ride);
  const off = ride.status === 'cancelled' || ride.status === 'archived';
  const stats = rideStats(ride, bookings);
  const tone = ridePillTone(ride);
  const full = isFull(ride);
  const past = ride.status === 'published' && isPast(ride, nowMs);

  const route = `${ride.from_text} → ${ride.to_text}`;
  const when = formatDateTime(ride.start_at, currentLanguage);

  // "—" rather than 0 while the passengers have not been fetched: a real 0 and "not yet
  // known" must not read the same (the card is the only place a driver sees this number).
  const dash = '—';
  const ordersValue = stats.orders === null ? dash : String(stats.orders);
  const moneyValue =
    ride.status === 'cancelled'
      ? dash
      : stats.money === null
        ? dash
        : formatNumberWithSpaces(stats.money);
  const moneyLabel =
    ride.status === 'cancelled' ? t('driverOffers.status.cancelled') : t(moneyLabelKey(phase));

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onToggle} accessibilityRole="button">
        <LinearGradient
          colors={off ? theme.palette.rideGradientOff : theme.palette.rideGradient}
          // The artboard's 158deg, as start/end points on the unit square.
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.card}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.route} numberOfLines={2}>
                {route}
              </Text>
              <Text style={styles.when}>{when}</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.statePill, pillTint(tone)]}>
                <Text style={[styles.stateLabel, pillInk(tone)]} numberOfLines={1}>
                  {t(ridePillKey(ride))}
                </Text>
              </View>
              <View style={styles.chevron}>
                <Text style={styles.chevronGlyph}>{expanded ? '▾' : '▸'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{`${stats.taken}/${stats.total}`}</Text>
              <Text style={styles.statLabel}>{t('myRides.statSeats')}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{ordersValue}</Text>
              <Text style={styles.statLabel}>{t('myRides.statOrders')}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{moneyValue}</Text>
              <Text style={styles.statLabel} numberOfLines={2}>
                {moneyLabel}
              </Text>
            </View>
          </View>

          {/* The fill state — a readout, not an action (decision ②). */}
          {ride.status === 'published' && (
            <View style={[styles.readout, full ? styles.readoutFull : styles.readoutOpen]}>
              <Stroke d={full ? GLYPH.check : GLYPH.seats} width={full ? 2.6 : 1.9} />
              <Text style={styles.readoutLabel} numberOfLines={2}>
                {t(fillKey(ride))}
              </Text>
            </View>
          )}

          {past && (
            <View style={styles.strip}>
              <Text style={styles.stripPast} numberOfLines={2}>
                {t('myRides.pastHint')}
              </Text>
            </View>
          )}

          {ride.status === 'cancelled' && !!ride.rejection_reason && (
            <View style={styles.strip}>
              <Text style={styles.stripDanger} numberOfLines={3}>
                {`${t('driverOffers.rejectionReason')}: ${ride.rejection_reason}`}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {canEdit(ride) && (
              <Pressable style={[styles.action, styles.actionQuiet]} onPress={onEdit}>
                <Text style={styles.actionQuietLabel} numberOfLines={1}>
                  {t('driverOffers.edit')}
                </Text>
              </Pressable>
            )}
            {canArchive(ride) && (
              <Pressable style={[styles.action, styles.actionQuiet]} onPress={onArchive}>
                <Text style={styles.actionQuietLabel} numberOfLines={1}>
                  {t('driverOffers.archive')}
                </Text>
              </Pressable>
            )}
            {canPublish(ride) && (
              <Pressable style={[styles.action, styles.actionQuiet]} onPress={onPublish}>
                <Text style={styles.actionQuietLabel} numberOfLines={1}>
                  {t('driverOffers.publish')}
                </Text>
              </Pressable>
            )}
            {canCancel(ride) && (
              <Pressable style={[styles.action, styles.actionDanger]} onPress={onCancel}>
                <Stroke d={GLYPH.cross} size={15} color={theme.palette.dangerDeep} width={2.4} />
                <Text style={styles.actionDangerLabel} numberOfLines={1}>
                  {t('myRides.cancelRide')}
                </Text>
              </Pressable>
            )}
            {canDelete(ride) && (
              <Pressable style={[styles.action, styles.actionDanger]} onPress={onDelete}>
                <Text style={styles.actionDangerLabel} numberOfLines={1}>
                  {t('driverOffers.delete')}
                </Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: {
    borderRadius: theme.borderRadius.hero,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerText: { flex: 1, minWidth: 0, gap: 4 },
  route: {
    fontSize: 17,
    ...theme.font('sans', 900),
    color: theme.palette.rideInk,
    lineHeight: 20,
    letterSpacing: -0.26,
  },
  when: { fontSize: 11, ...theme.font('mono', 600), color: theme.palette.rideInk },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  statePill: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: theme.borderRadius.full },
  statePillOk: { backgroundColor: theme.palette.rideTile },
  statePillWait: { backgroundColor: theme.palette.rideTile },
  statePillBad: { backgroundColor: theme.palette.dangerTint },
  statePillNeutral: { backgroundColor: theme.palette.rideTile },
  stateLabel: { fontSize: 10.5, ...theme.font('sans', 800) },
  stateInkOk: { color: theme.palette.actionPressed },
  stateInkWait: { color: theme.palette.actionPressed },
  stateInkBad: { color: theme.palette.dangerDeep },
  stateInkNeutral: { color: theme.palette.text.muted },

  chevron: {
    width: 26,
    height: 26,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.rideWell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronGlyph: { fontSize: 11, ...theme.font('sans', 900), color: theme.palette.rideInk },

  stats: { flexDirection: 'row', gap: 7 },
  statTile: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    padding: 10,
    borderRadius: 16,
    backgroundColor: theme.palette.rideTile,
  },
  statValue: {
    fontSize: 14.5,
    ...theme.font('mono', 800),
    color: theme.palette.rideInk,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    ...theme.font('sans', 700),
    color: theme.palette.text.secondary,
    lineHeight: 12,
  },

  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: theme.borderRadius.field,
  },
  readoutFull: { backgroundColor: theme.palette.rideTile },
  readoutOpen: { backgroundColor: theme.palette.rideTileSoft },
  readoutLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    ...theme.font('sans', 800),
    color: theme.palette.rideInk,
    lineHeight: 15,
  },

  strip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.rideTile,
  },
  stripPast: {
    fontSize: 11.5,
    ...theme.font('sans', 700),
    color: theme.palette.warnInk,
    lineHeight: 16,
  },
  stripDanger: {
    fontSize: 11.5,
    ...theme.font('sans', 700),
    color: theme.palette.dangerDeep,
    lineHeight: 16,
  },

  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  action: {
    flex: 1,
    minWidth: 96,
    minHeight: 48,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  actionQuiet: { backgroundColor: theme.palette.rideTile },
  actionQuietLabel: {
    fontSize: 12.5,
    ...theme.font('sans', 800),
    color: theme.palette.rideInk,
    textAlign: 'center',
  },
  actionDanger: {
    backgroundColor: theme.palette.dangerTint,
    borderWidth: 1.5,
    borderColor: theme.palette.dangerBorder,
  },
  actionDangerLabel: {
    fontSize: 12.5,
    ...theme.font('sans', 800),
    color: theme.palette.dangerDeep,
    textAlign: 'center',
  },
});
