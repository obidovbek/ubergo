/**
 * BookingSheet — T-101 step 18c.
 *
 * One booking in full, as `DriverMyOrder.dc.html` draws its passenger detail (lines 300-387):
 * an inset panel over the list with the order number, the passenger, a key/value block and
 * the actions.
 *
 * Measured: scrim .5 · panel `ground`, margin 64 12 14, radius 24, own scroll · header row
 * with a 36px back tile · 42px initials disc · rows `surface`, radius 14, padding 10, label
 * 12/600 muted vs value mono 12/700 · price block with the `130 000 × 2 kishi` formula.
 *
 * ⚠️ Deviations, each deliberate (`PLAN-T101-step18.md` §2, owner decision ⑤):
 *   - **No status stepper** (`Kutilmoqda → Mashinada → Yetkazildi`) and no step arrows. The
 *     booking's `status` is its BOOKING state, not a delivery state; there is no column for
 *     the latter. Drawing the stepper would invent progress the server never stores. → T-110.
 *   - **No `Budilnik`, no `Xabar`.** No endpoint for either.
 *   - **No pickup / drop-off rows and no ★ rating** — see `BookingRow`.
 *   - The artboard's `orderNo` is a hash of its fixture key; the real booking `id` is used.
 *
 * ⚠️ `Modal` renders OUTSIDE the SafeAreaProvider's layout, so insets are applied by hand —
 * the same reason `NavDrawer` and `PassengerOrderSheet` do it.
 */

import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDateTime } from '../../utils/date';
import { formatNumberWithSpaces } from '../../utils/format';
import { formatContactPhone } from '../../utils/contactPhone';
import type { OfferPassenger } from '../../api/offerPassengers';
import type { DriverOffer } from '../../api/driverOffers';
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

export interface BookingSheetProps {
  booking: OfferPassenger | null;
  ride: DriverOffer | null;
  busy?: boolean;
  onClose: () => void;
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

export const BookingSheet: React.FC<BookingSheetProps> = ({
  booking,
  ride,
  busy = false,
  onClose,
  onConfirm,
  onReject,
  onCall,
}) => {
  const { t, currentLanguage } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!booking) return null;

  const name = booking.passenger?.display_name?.trim() || t('offerPassengers.unknownPassenger');
  const initials = name.charAt(0).toUpperCase() || '?';
  const tone = bookingTone(booking.status);
  const seats = seatLabel(booking);
  const price = priceFormula(booking);
  const phone = phoneUnlocked(booking) ? booking.passenger?.phone_e164 : null;

  const rows: { label: string; value: string }[] = [];
  if (ride) {
    rows.push({ label: t('driverOffers.from'), value: ride.from_text });
    rows.push({ label: t('driverOffers.to'), value: ride.to_text });
    rows.push({ label: t('driverOffers.departure'), value: formatDateTime(ride.start_at, currentLanguage) });
  }
  rows.push({
    label: t('driverOffers.seats'),
    value: t(seats.key).replace('{count}', String(seats.count)),
  });
  rows.push({
    label: t('myRides.bookedAt'),
    value: formatDateTime(booking.created_at, currentLanguage),
  });
  if (booking.rejection_reason) {
    rows.push({ label: t('offerPassengers.rejectionReason'), value: booking.rejection_reason });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        />
        <View
          style={[styles.panel, { marginTop: 64 + insets.top, marginBottom: 14 + insets.bottom }]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={onClose} accessibilityRole="button">
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14.5 5.5L8 12l6.5 6.5"
                  stroke={theme.palette.text.primary}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
            <Text style={styles.title} numberOfLines={1}>
              {t('myRides.bookingTitle')}
            </Text>
            <View style={[styles.pill, pillTint(tone)]}>
              <Text style={[styles.pillLabel, pillInk(tone)]} numberOfLines={1}>
                {t(bookingLabelKey(booking.status))}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.who}>
              <View style={styles.disc}>
                <Text style={styles.discText}>{initials}</Text>
              </View>
              <View style={styles.whoText}>
                <Text style={styles.name} numberOfLines={2}>
                  {name}
                </Text>
                <Text style={styles.orderNo}>{`#${booking.id}`}</Text>
              </View>
            </View>

            {!!booking.message && (
              <View style={styles.messageBox}>
                <Text style={styles.messageLabel}>{t('offerPassengers.message')}</Text>
                <Text style={styles.messageText}>{booking.message}</Text>
              </View>
            )}

            <View style={styles.rows}>
              {rows.map((r) => (
                <View key={r.label} style={styles.row}>
                  <Text style={styles.rowLabel}>{r.label}</Text>
                  <Text style={styles.rowValue} numberOfLines={3}>
                    {r.value}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>{t('driverOffers.price')}</Text>
              <Text style={styles.priceValue}>
                {`${formatNumberWithSpaces(price.total)} ${booking.currency}`}
              </Text>
              <Text style={styles.priceFormula}>
                {`${formatNumberWithSpaces(price.perSeat)} × ${price.seats}`}
              </Text>
            </View>

            {phone ? (
              <Pressable
                style={styles.callBtn}
                onPress={() => onCall(phone)}
                accessibilityRole="button"
              >
                <Text style={styles.callLabel}>{formatContactPhone(phone)}</Text>
              </Pressable>
            ) : (
              booking.status === 'confirmed' && (
                <Text style={styles.noPhone}>{t('offerPassengers.noPhone')}</Text>
              )
            )}
          </ScrollView>

          {(canConfirm(booking) || canReject(booking)) && (
            <View style={styles.actions}>
              {canReject(booking) && (
                <Pressable
                  style={[styles.action, styles.rejectBtn]}
                  onPress={onReject}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <Text style={styles.rejectLabel}>{t('offerPassengers.reject')}</Text>
                </Pressable>
              )}
              {canConfirm(booking) && (
                <Pressable
                  style={[styles.action, styles.confirmBtn]}
                  onPress={onConfirm}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <Text style={styles.confirmLabel}>{t('offerPassengers.confirm')}</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.palette.scrim.modal },
  panel: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: theme.palette.ground,
    borderRadius: theme.borderRadius.hero,
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, minWidth: 0, fontSize: 15.5, ...theme.font('sans', 800), color: theme.palette.text.primary },
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

  body: { gap: 10, paddingBottom: 8 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  disc: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discText: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.actionPressed },
  whoText: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 15, ...theme.font('sans', 800), color: theme.palette.text.primary },
  orderNo: { fontSize: 11, ...theme.font('mono', 600), color: theme.palette.text.tertiary },

  messageBox: {
    padding: 10,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.surface,
    gap: 3,
  },
  messageLabel: { fontSize: 11, ...theme.font('sans', 600), color: theme.palette.text.tertiary },
  messageText: { fontSize: 13, ...theme.font('sans', 500), color: theme.palette.text.primary, lineHeight: 17 },

  rows: { padding: 10, borderRadius: theme.borderRadius.field, backgroundColor: theme.palette.surface, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  rowLabel: { fontSize: 12, ...theme.font('sans', 600), color: theme.palette.text.muted },
  rowValue: {
    flex: 1,
    fontSize: 12,
    ...theme.font('mono', 700),
    color: theme.palette.text.primary,
    textAlign: 'right',
  },

  priceBox: { padding: 10, borderRadius: theme.borderRadius.field, backgroundColor: theme.palette.surface, gap: 2 },
  priceLabel: { fontSize: 11, ...theme.font('sans', 600), color: theme.palette.text.tertiary },
  priceValue: { fontSize: 17, ...theme.font('mono', 800), color: theme.palette.actionPressed },
  priceFormula: { fontSize: 11, ...theme.font('mono', 600), color: theme.palette.text.tertiary },

  callBtn: {
    minHeight: 48,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.palette.successTint,
    borderWidth: 1,
    borderColor: theme.palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callLabel: { fontSize: 14, ...theme.font('mono', 700), color: theme.palette.actionPressed },
  noPhone: { fontSize: 12.5, ...theme.font('sans', 600), color: theme.palette.text.muted, textAlign: 'center' },

  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minHeight: 50,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: theme.palette.dangerTint,
    borderWidth: 1.5,
    borderColor: theme.palette.dangerBorder,
  },
  rejectLabel: { fontSize: 13.5, ...theme.font('sans', 800), color: theme.palette.dangerDeep },
  confirmBtn: { backgroundColor: theme.palette.action },
  confirmLabel: { fontSize: 13.5, ...theme.font('sans', 800), color: theme.palette.text.onDark },
});
