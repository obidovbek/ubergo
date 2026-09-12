/**
 * BookingRow — T-101 step 18c.
 *
 * One passenger booked onto a ride, as `DriverMyOrder.dc.html` draws it (lines 193-232),
 * nested under an expanded `MyRideCard`.
 *
 * Measured from the artboard:
 *
 *   row      surface, border 1 (chrome; `brand` once confirmed), radius 20, padding 13,
 *            column gap 10, card shadow
 *   header   42px initials disc (`successTint` / `successInk`, 14/800) · name 14.5/800 ·
 *            status pill top-right (4px 9px, radius 99, 10.5/800, 1px border)
 *   footer   hairline top, seat label 11/600 tertiary above the price mono 14/800
 *            (`actionPressed`) · the action buttons right, 42px discs / 42-high pills
 *
 * ⚠️ Deviations, each deliberate (`PLAN-T101-step18.md` §2, owner decision ⑤):
 *   - **No pickup / drop-off rows.** The artboard draws two addresses per passenger with a
 *     dotted connector. A join request carries a free-text `message`, not addresses — the
 *     message is shown instead, where it exists.
 *   - **No ★ rating.** There is no rating model anywhere in the API (T-109 ②).
 *   - **No message button, no `Budilnik` ping, no delivery-step button.** None has an
 *     endpoint; a button that silently does nothing is worse than no button. → T-110.
 *   - The call disc appears only on a confirmed booking WITH a number — the server strips
 *     `phone_e164` from every other status (T-055), so drawing it earlier would be a
 *     button that cannot dial.
 *
 * Every rule about what may be done comes from `utils/myRides.ts` (18a); this file draws.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../../hooks/useTranslation';
import { formatNumberWithSpaces } from '../../utils/format';
import { formatContactPhone } from '../../utils/contactPhone';
import type { OfferPassenger } from '../../api/offerPassengers';
import {
  bookingLabelKey,
  bookingTone,
  canConfirm,
  canReject,
  phoneUnlocked,
  priceFormula,
  seatLabel,
  type PillTone,
} from '../../utils/myRides';
import { theme } from '../../themes';

// Verbatim `d` attributes from the artboard (24-box, stroke).
const GLYPH = {
  phone:
    'M7 4.5 9.5 9 7.8 10.8c1 2.2 3.2 4.4 5.4 5.4l1.8-1.7 4.5 2.5-1.4 2.5c-2.4.9-6.5-.6-9.6-3.7S3.6 8.3 4.5 5.9z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
} as const;

export interface BookingRowProps {
  booking: OfferPassenger;
  onPress: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onCall: (phone: string) => void;
}

const pillTint = (tone: PillTone) =>
  tone === 'ok'
    ? styles.pillOk
    : tone === 'bad'
      ? styles.pillBad
      : tone === 'wait'
        ? styles.pillWait
        : styles.pillNeutral;

const pillInk = (tone: PillTone) =>
  tone === 'ok'
    ? styles.inkOk
    : tone === 'bad'
      ? styles.inkBad
      : tone === 'wait'
        ? styles.inkWait
        : styles.inkNeutral;

const Stroke: React.FC<{ d: string; size?: number; color: string; width?: number }> = ({
  d,
  size = 19,
  color,
  width = 1.9,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BookingRow: React.FC<BookingRowProps> = ({
  booking,
  onPress,
  onConfirm,
  onReject,
  onCall,
}) => {
  const { t } = useTranslation();

  const name = booking.passenger?.display_name?.trim() || t('offerPassengers.unknownPassenger');
  const initials = name.charAt(0).toUpperCase() || '?';
  const tone = bookingTone(booking.status);
  const seats = seatLabel(booking);
  const price = priceFormula(booking);
  const phone = phoneUnlocked(booking) ? booking.passenger?.phone_e164 : null;

  return (
    <Pressable
      style={[styles.row, booking.status === 'confirmed' && styles.rowConfirmed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.disc}>
          <Text style={styles.discText}>{initials}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          {!!phone && <Text style={styles.phone}>{formatContactPhone(phone)}</Text>}
        </View>
        <View style={[styles.pill, pillTint(tone)]}>
          <Text style={[styles.pillLabel, pillInk(tone)]} numberOfLines={1}>
            {t(bookingLabelKey(booking.status))}
          </Text>
        </View>
      </View>

      {!!booking.message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText} numberOfLines={3}>
            {booking.message}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerText}>
          <Text style={styles.seatLabel} numberOfLines={2}>
            {t(seats.key).replace('{count}', String(seats.count))}
          </Text>
          <Text style={styles.price}>
            {`${formatNumberWithSpaces(price.total)} ${booking.currency}`}
          </Text>
        </View>

        <View style={styles.actions}>
          {!!phone && (
            <Pressable
              style={styles.discAction}
              onPress={() => onCall(phone)}
              accessibilityRole="button"
              accessibilityLabel={t('offerPassengers.contactTitle')}
            >
              <Stroke d={GLYPH.phone} color={theme.palette.actionPressed} />
            </Pressable>
          )}
          {canReject(booking) && (
            <Pressable
              style={styles.rejectBtn}
              onPress={onReject}
              accessibilityRole="button"
              accessibilityLabel={t('offerPassengers.reject')}
            >
              <Stroke d={GLYPH.cross} size={16} color={theme.palette.dangerDeep} width={2.2} />
            </Pressable>
          )}
          {canConfirm(booking) && (
            <Pressable style={styles.confirmBtn} onPress={onConfirm} accessibilityRole="button">
              <Stroke d={GLYPH.check} size={16} color={theme.palette.text.onDark} width={2.6} />
              <Text style={styles.confirmLabel} numberOfLines={1}>
                {t('offerPassengers.confirm')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.borders.chrome,
    borderRadius: theme.borderRadius.card,
    padding: 13,
    gap: 10,
    ...theme.shadows.card,
  },
  rowConfirmed: { borderColor: theme.palette.brand },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  disc: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discText: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.actionPressed },
  headerText: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 14.5, ...theme.font('sans', 800), color: theme.palette.text.primary, lineHeight: 18 },
  phone: { fontSize: 11, ...theme.font('mono', 500), color: theme.palette.text.tertiary },

  pill: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: theme.borderRadius.full, borderWidth: 1 },
  pillOk: { backgroundColor: theme.palette.successTint, borderColor: theme.palette.brand },
  pillWait: { backgroundColor: theme.palette.warnTint, borderColor: theme.palette.warnBorder },
  pillBad: { backgroundColor: theme.palette.dangerTint, borderColor: theme.palette.dangerBorder },
  pillNeutral: { backgroundColor: theme.palette.surfaceSunken, borderColor: theme.palette.borders.emphasis },
  pillLabel: { fontSize: 10.5, ...theme.font('sans', 800) },
  inkOk: { color: theme.palette.actionPressed },
  inkWait: { color: theme.palette.warnInk },
  inkBad: { color: theme.palette.dangerDeep },
  inkNeutral: { color: theme.palette.text.muted },

  messageBox: {
    padding: 10,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.ground,
  },
  messageText: {
    fontSize: 12,
    ...theme.font('sans', 600),
    color: theme.palette.text.muted,
    lineHeight: 16,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 9,
    borderTopWidth: theme.sizes.borderHairline,
    borderTopColor: theme.palette.borders.chrome,
  },
  footerText: { flex: 1, minWidth: 0, gap: 2 },
  seatLabel: { fontSize: 11, ...theme.font('sans', 600), color: theme.palette.text.tertiary },
  price: { fontSize: 14, ...theme.font('mono', 800), color: theme.palette.actionPressed },

  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  discAction: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    borderWidth: 1,
    borderColor: theme.palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.dangerTint,
    borderWidth: 1,
    borderColor: theme.palette.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.action,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmLabel: { fontSize: 12.5, ...theme.font('sans', 800), color: theme.palette.text.onDark },
});
