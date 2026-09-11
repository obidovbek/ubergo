/**
 * PassengerOrderSheet — T-101 step 17e.
 *
 * The detail-and-offer sheet of `DriverQidiruv.dc.html` (lines 271-412): an inset panel over
 * the list — scrim, `ground`, radius 24, its own scroll — showing one passenger order and, on
 * an INCOMING order, the two things a driver can do about it:
 *
 *   • `Qabul qilish` — a join request at the passenger's OWN price (`acceptPayload`), after a
 *     confirm dialog that names the total. The passenger still chooses (T-024); the phone
 *     opens only when they do (T-054). Hidden when the order names no price.
 *   • `Taklif yuborish` — the counter-offer: ONE per-seat price typed in thousands, × the seats
 *     the passenger needs → total, plus a note. The API takes one `offered_price_per_seat`
 *     (owner decision ④), so the artboard's per-row inputs collapse to one.
 *
 * On a SENT proposal it shows the driver's own offer with its state, the passenger's number
 * once they confirmed (through `passengerPhoneOf()` only), and a cancel button while pending
 * (the server refuses to cancel anything else — the old screen's guard, kept).
 *
 * This absorbs the join form of `PassengerOfferDetailsScreen`: vehicle read-only (the driver
 * has exactly one), the same three validations in the same order (`validateOffer`), the same
 * "seats offered = seats needed" default a T-018 salon order relies on, and the server's
 * translated 400s shown verbatim.
 *
 * ⚠️ `Modal` renders OUTSIDE the SafeAreaProvider's layout, so the insets are applied by hand —
 * the 7c / 8e nav-bar lesson, the same reason `NavDrawer` does it.
 *
 * ⚠️ NOT built, each by owner decision (2026-09-11): `Rad etish` with reasons (no API — the
 * only reject on the server is the passenger→driver direction) · presence, "seen", ★ rating
 * and trip count (no backend) · per-row offer prices (one per-seat price on the API).
 * A `seats offered` stepper is also gone on purpose: the server bills per seat × what the
 * passenger NEEDS, so offering more seats changes nothing — the field is sent as `seats_needed`.
 *
 * Every rule about WHAT is shown comes from `utils/passengerOrders.ts`; this file draws and
 * calls the API.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as PassengerOffersAPI from '../../api/passengerOffers';
import { passengerNameOf, passengerPhoneOf } from '../../api/passengerOffers';
import type { OfferDriver, PassengerOffer } from '../../api/passengerOffers';
import * as DriverAPI from '../../api/driver';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { showToast } from '../../utils/toast';
import { showConfirmDialog } from '../../utils/confirmDialog';
import { getErrorMessage } from '../../utils/errorHandler';
import { dialPhone, formatContactPhone } from '../../utils/contactPhone';
import { formatDateByLanguage, formatDateTime, formatTimeByLanguage } from '../../utils/date';
import { formatNumberWithSpaces } from '../../utils/format';
import { Icon } from '../chrome/Icon';
import {
  acceptPayload,
  canCancelRequest,
  listedPrice,
  offerTotal,
  orderKind,
  orderTags,
  parseThousands,
  paymentKeys,
  PAYMENT_LABEL_KEY,
  phoneUnlocked,
  requestLabelKey,
  requestTone,
  seatCells,
  seatKindKey,
  seedOfferThousands,
  validateOffer,
  type PillTone,
} from '../../utils/passengerOrders';
import { theme } from '../../themes';

export type SheetOutcome = 'accept' | 'offer' | 'cancel';

interface PassengerOrderSheetProps {
  visible: boolean;
  order: PassengerOffer | null;
  /** The driver's own request on it — present in the sent mode. */
  request: OfferDriver | null;
  onClose: () => void;
  /**
   * Something was written on the server; the list must reload. `total` is what the passenger
   * will see for an accept or an offer — the result dialog (17f) names it.
   */
  onChanged: (outcome: SheetOutcome, total?: number) => void;
}

interface VehicleSummary {
  id: string;
  label: string;
}

const pillStyle = (tone: PillTone) =>
  tone === 'ok' ? styles.pillOk : tone === 'bad' ? styles.pillBad : tone === 'wait' ? styles.pillWait : styles.pillNeutral;
const pillInk = (tone: PillTone) =>
  tone === 'ok' ? styles.pillInkOk : tone === 'bad' ? styles.pillInkBad : tone === 'wait' ? styles.pillInkWait : styles.pillInkNeutral;

export const PassengerOrderSheet: React.FC<PassengerOrderSheetProps> = ({
  visible,
  order,
  request,
  onClose,
  onChanged,
}) => {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();

  const [offerMode, setOfferMode] = useState(false);
  const [priceThousands, setPriceThousands] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleSummary | null | undefined>(undefined);

  // Reset the form each time the sheet opens on an order.
  useEffect(() => {
    if (!visible) return;
    setOfferMode(false);
    setNote('');
    const seed = order ? seedOfferThousands(order) : null;
    setPriceThousands(seed === null ? '' : String(seed));
  }, [visible, order]);

  // The driver has exactly one vehicle (profile.vehicle) — read once, read-only, no picker.
  useEffect(() => {
    if (!visible || request || vehicle !== undefined || !token) return;
    (async () => {
      try {
        const response = (await DriverAPI.getDriverProfile(token)) as unknown as {
          profile?: {
            vehicle?: {
              id?: string;
              make?: { name_uz?: string; name?: string };
              model?: { name_uz?: string; name?: string };
              license_plate?: string;
            };
          };
        };
        const v = response?.profile?.vehicle;
        if (v?.id) {
          const parts = [
            v.make?.name_uz || v.make?.name,
            v.model?.name_uz || v.model?.name,
            v.license_plate,
          ].filter(Boolean) as string[];
          setVehicle({ id: v.id, label: parts.join(' • ') || t('passengerOfferDetails.vehicle') });
        } else {
          setVehicle(null);
        }
      } catch {
        // Not fatal — the order is still readable; sending reports it.
        setVehicle(null);
      }
    })();
  }, [visible, request, vehicle, token, t]);

  const price = useMemo(() => (order ? listedPrice(order) : null), [order]);
  const cells = useMemo(() => (order ? seatCells(order) : null), [order]);
  const seatsNeeded = order ? Math.max(1, Math.floor(Number(order.seats_needed)) || 1) : 1;
  const thousands = parseThousands(priceThousands);
  const total = offerTotal(thousands, seatsNeeded);

  if (!order) return null;

  const name = passengerNameOf(order) || t('passengerOfferDetails.passengerUnknown');
  const paid = orderKind(order) === 'maxsus';
  const tone: PillTone | null = request ? requestTone(request.status) : null;
  const currency = order.currency;
  const money = (n: number) => `${formatNumberWithSpaces(Math.round(n))} ${currency}`;

  const depart = order.is_urgent
    ? t('passengerOfferExtras.urgent')
    : order.depart_until
      ? `${formatTimeByLanguage(order.start_at, currentLanguage)}-${formatTimeByLanguage(order.depart_until, currentLanguage)}`
      : formatTimeByLanguage(order.start_at, currentLanguage);
  const departLine = `${formatDateByLanguage(order.start_at, currentLanguage)} · ${depart}`;
  const arriveLine = order.arrive_until
    ? `${t('passengerOfferExtras.arriveBy')} ${formatDateTime(order.arrive_until, currentLanguage)}`
    : null;

  const frontCount = cells ? cells.front.filter((c) => c !== null).length : 0;
  const backCount = cells ? cells.back.filter((c) => c !== null).length : 0;
  const payments = paymentKeys(order).map((k) => t(PAYMENT_LABEL_KEY[k]));
  const tags = [
    t(paid ? 'passengerOrders.kindMaxsus' : 'passengerOrders.kindOddiy'),
    ...orderTags(order).map((k) => t(k)),
  ];

  // T-054 — the number exists on the payload only for a CONFIRMED request, and the rule is
  // re-checked here so a server change could not make the reveal silent.
  const phone = request && phoneUnlocked(request) ? passengerPhoneOf(order) : null;

  const accept = acceptPayload(order);

  // ------------------------------------------------------------------ actions
  const send = async (
    payload: PassengerOffersAPI.JoinPassengerOfferData,
    outcome: SheetOutcome,
    sentTotal: number,
  ) => {
    if (!token) return;
    try {
      setSubmitting(true);
      await PassengerOffersAPI.joinPassengerOffer(token, order.id, payload);
      // No toast here — the result dialog (17f) says it, with the figures.
      onChanged(outcome, sentTotal);
    } catch (error: unknown) {
      // The server's 400s are already translated (already applied / rejected / cancelled /
      // started / own offer / no vehicle) — show them verbatim.
      showToast.error(t('common.error'), getErrorMessage(error, t, 'passengerOfferDetails.joinFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = () => {
    if (!accept || !price || price.total === null) return;
    if (!vehicle) {
      showToast.error(t('common.error'), t('passengerOfferDetails.noVehicle'));
      return;
    }
    showConfirmDialog({
      title: t('passengerOrders.acceptConfirmTitle'),
      message: `${t('passengerOrders.acceptConfirmBody')} ${money(price.total)}`,
      confirmText: t('passengerOrders.accept'),
      cancelText: t('common.back'),
      onConfirm: () =>
        send(
          { vehicle_id: vehicle.id, seats_offered: accept.seats_offered, offered_price_per_seat: accept.offered_price_per_seat },
          'accept',
          accept.offered_price_per_seat * accept.seats_offered,
        ),
      onCancel: () => {},
    });
  };

  const handleSendOffer = () => {
    const perSeat = thousands * 1000;
    const problem = validateOffer({ perSeat, seats: seatsNeeded, seatsNeeded, hasVehicle: !!vehicle });
    if (problem) {
      showToast.error(t('common.error'), t(problem));
      return;
    }
    send(
      {
        vehicle_id: (vehicle as VehicleSummary).id,
        seats_offered: seatsNeeded,
        offered_price_per_seat: perSeat,
        message: note.trim() || undefined,
      },
      'offer',
      total,
    );
  };

  const handleCancel = () => {
    if (!request || !token) return;
    showConfirmDialog({
      title: t('myJoinRequests.cancelTitle'),
      message: t('myJoinRequests.cancelWarning'),
      confirmText: t('myJoinRequests.cancelConfirm'),
      cancelText: t('common.back'),
      confirmButtonStyle: 'destructive',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await PassengerOffersAPI.cancelJoinRequest(token, request.id);
          showToast.success(t('common.success'), t('myJoinRequests.cancelled'));
          onChanged('cancel');
        } catch (error: unknown) {
          showToast.error(t('common.error'), getErrorMessage(error, t, 'myJoinRequests.cancelFailed'));
        } finally {
          setSubmitting(false);
        }
      },
      onCancel: () => {},
    });
  };

  // ------------------------------------------------------------------ render
  const row = (label: string, value: string, valueStyle?: object) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.back')} />
        <View style={[styles.panel, { marginTop: insets.top + 12, marginBottom: insets.bottom + 14 }]}>
          <ScrollView contentContainerStyle={styles.panelContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* header */}
            <View style={styles.header}>
              <Pressable style={styles.roundButton} onPress={offerMode ? () => setOfferMode(false) : onClose} accessibilityRole="button" accessibilityLabel={t('common.back')}>
                <Icon name="chevronLeft" size={18} color={theme.palette.text.primary} />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.eyebrow}>{t(request ? 'passengerOrders.sheetSent' : 'passengerOrders.sheetIncoming')}</Text>
                <Text style={styles.code}>{`${t('passengerOrders.code')} #${order.id}`}</Text>
              </View>
              <Pressable style={styles.roundButton} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.back')}>
                <Text style={styles.closeGlyph}>×</Text>
              </Pressable>
            </View>

            {/* passenger */}
            <View style={styles.card}>
              <View style={styles.passengerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.passengerName} numberOfLines={2}>
                  {name}
                </Text>
                {request && tone && (
                  <View style={[styles.pill, pillStyle(tone)]}>
                    <Text style={[styles.pillText, pillInk(tone)]}>{t(requestLabelKey(request.status))}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* route */}
            <View style={[styles.card, styles.routeCard]}>
              <View style={styles.connector}>
                <View style={[styles.dot, styles.dotFrom]} />
                <View style={styles.line} />
                <View style={[styles.dot, styles.dotTo]} />
              </View>
              <View style={styles.routeTexts}>
                <View style={styles.routeStop}>
                  <Text style={styles.place}>{order.from_text}</Text>
                  {!!order.from_landmark && <Text style={styles.placeNote}>{order.from_landmark}</Text>}
                  <Text style={styles.departLine}>{departLine}</Text>
                  {!!arriveLine && <Text style={styles.departLine}>{arriveLine}</Text>}
                </View>
                <View style={styles.routeStop}>
                  <Text style={styles.place}>{order.to_text}</Text>
                  {!!order.to_landmark && <Text style={styles.placeNote}>{order.to_landmark}</Text>}
                </View>
              </View>
            </View>

            {/* tags */}
            <View style={styles.tags}>
              {tags.map((label) => (
                <View key={label} style={styles.tag}>
                  <Text style={styles.tagText}>{label}</Text>
                </View>
              ))}
            </View>

            {/* seats, payment, phone, price */}
            <View style={[styles.card, styles.rows]}>
              <Text style={styles.eyebrow}>{t('passengerOrders.seatsTitle')}</Text>
              {row(t('passengerOfferExtras.seatsFront'), `${frontCount} ${t('passengerOrders.people')}`)}
              {row(t('passengerOfferExtras.seatsBack'), `${backCount} ${t('passengerOrders.people')}`)}
              {row(t('passengerOrders.seatKind'), t(seatKindKey(order)))}
              {payments.length > 0 && row(t('passengerOrders.payment'), payments.join(' · '))}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('passengerOrders.phone')}</Text>
                {phone ? (
                  <Pressable style={styles.callButton} onPress={() => dialPhone(phone, t)} accessibilityRole="button">
                    <Ionicons name="call" size={14} color={theme.palette.text.onAccent} />
                    <Text style={styles.callText}>{formatContactPhone(phone)}</Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.rowValue, styles.rowValueMuted]}>
                    {request && phoneUnlocked(request) ? t('myJoinRequests.noPhone') : t('passengerOrders.phoneHidden')}
                  </Text>
                )}
              </View>
              {price && price.lines.length > 0 && (
                <View style={styles.special}>
                  <Text style={styles.eyebrow}>{t('passengerOrders.specialTitle')}</Text>
                  {price.lines.map((l) => (
                    <View key={l.labelKey} style={styles.specialLine}>
                      <Text style={styles.specialLabel}>{`${t(l.labelKey)} ${l.qty}× ${formatNumberWithSpaces(l.unit)}`}</Text>
                      <Text style={styles.specialValue}>{`= ${money(l.sum)}`}</Text>
                    </View>
                  ))}
                </View>
              )}
              {price &&
                row(
                  t(paid ? 'passengerOrders.pricePassenger' : 'passengerOrders.priceListed'),
                  price.total === null ? t('passengerOfferExtras.priceNegotiable') : money(price.total),
                  paid ? styles.rowValuePaid : undefined,
                )}
            </View>

            {!!order.note && (
              <View style={[styles.card, styles.rows]}>
                <Text style={styles.eyebrow}>{t('passengerOfferDetails.note')}</Text>
                <Text style={styles.noteText}>{order.note}</Text>
              </View>
            )}

            {/* sent mode: my offer */}
            {request && (
              <View style={[styles.card, styles.rows]}>
                <Text style={styles.eyebrow}>{t('passengerOrders.sheetSent')}</Text>
                {row(t('myJoinRequests.pricePerSeat'), money(Number(request.offered_price_per_seat)))}
                {row(t('myJoinRequests.seatsOffered'), String(request.seats_offered))}
                {row(t('myJoinRequests.total'), money(Number(request.total_offered_price)), styles.rowValueMine)}
                {!!request.message && <Text style={styles.noteText}>{request.message}</Text>}
                {request.status === 'rejected' && !!request.rejection_reason && (
                  <Text style={styles.rejection}>{request.rejection_reason}</Text>
                )}
                <Text style={styles.sentAt}>{formatDateTime(request.created_at, currentLanguage)}</Text>
              </View>
            )}

            {/* offer mode: one per-seat price × seats needed */}
            {!request && offerMode && (
              <View style={[styles.card, styles.rows]}>
                <Text style={styles.eyebrow}>{t('passengerOrders.yourPrice')}</Text>
                <View style={styles.offerRow}>
                  <Text style={styles.offerLabel}>{t('passengerOfferDetails.pricePerSeat')}</Text>
                  <View style={styles.offerField}>
                    <TextInput
                      value={priceThousands}
                      onChangeText={(v) => setPriceThousands(v.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={theme.palette.text.tertiary}
                      style={styles.offerInput}
                      maxLength={5}
                      accessibilityLabel={t('passengerOfferDetails.pricePerSeat')}
                    />
                    <Text style={styles.offerSuffix}>{` ${t('passengerOrders.thousands')}`}</Text>
                  </View>
                  <Text style={styles.offerUnit}>{currency}</Text>
                </View>
                <View style={styles.calc}>
                  <View style={styles.specialLine}>
                    <Text style={styles.specialLabel}>{`${t('passengerOfferDetails.pricePerSeat')} ${seatsNeeded}× ${formatNumberWithSpaces(thousands * 1000)}`}</Text>
                    <Text style={styles.calcValue}>{`= ${money(total)}`}</Text>
                  </View>
                  <View style={styles.calcTotal}>
                    <Text style={styles.calcTotalLabel}>{t('passengerOfferDetails.total')}</Text>
                    <Text style={styles.calcTotalValue}>{money(total)}</Text>
                  </View>
                </View>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('passengerOrders.notePlaceholder')}
                  placeholderTextColor={theme.palette.text.tertiary}
                  multiline
                  numberOfLines={2}
                  style={styles.noteInput}
                  maxLength={255}
                />
                <Text style={[styles.vehicleLine, vehicle === null && styles.vehicleMissing]}>
                  {vehicle === undefined
                    ? '…'
                    : vehicle === null
                      ? t('passengerOfferDetails.noVehicle')
                      : `${t('passengerOfferDetails.vehicle')}: ${vehicle.label}`}
                </Text>
              </View>
            )}

            {/* actions */}
            {submitting ? (
              <ActivityIndicator size="large" color={theme.palette.action} style={styles.spinner} />
            ) : request ? (
              canCancelRequest(request) && (
                <Pressable style={[styles.button, styles.buttonDanger]} onPress={handleCancel} accessibilityRole="button">
                  <Text style={styles.buttonDangerText}>{t('myJoinRequests.cancel')}</Text>
                </Pressable>
              )
            ) : offerMode ? (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.button, total > 0 ? styles.buttonPrimary : styles.buttonDisabled]}
                  onPress={handleSendOffer}
                  disabled={total <= 0}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: total <= 0 }}
                >
                  <Text style={total > 0 ? styles.buttonPrimaryText : styles.buttonDisabledText}>{t('passengerOrders.sendOffer')}</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.buttonQuiet]} onPress={() => setOfferMode(false)} accessibilityRole="button">
                  <Text style={styles.buttonQuietText}>{t('common.back')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable style={[styles.button, styles.buttonOutline]} onPress={() => setOfferMode(true)} accessibilityRole="button">
                  <Text style={styles.buttonOutlineText}>{t('passengerOrders.offer')}</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.buttonQuiet]} onPress={onClose} accessibilityRole="button">
                  <Text style={styles.buttonQuietText}>{t('common.back')}</Text>
                </Pressable>
                {accept && (
                  <Pressable style={[styles.button, styles.buttonPrimary, styles.buttonTall]} onPress={handleAccept} accessibilityRole="button">
                    <Text style={styles.buttonPrimaryText}>{t('passengerOrders.accept')}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.palette.scrim.sheet },
  // Artboard: margin 64px 12px 14px, ground, radius 24, padding 14, gap 10, deep shadow.
  panel: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: theme.palette.ground,
    borderRadius: theme.borderRadius.hero,
    overflow: 'hidden',
    ...theme.shadows.drawer,
  },
  panelContent: { padding: 14, gap: 10 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerCenter: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: { fontSize: 22, lineHeight: 24, color: theme.palette.text.primary, ...theme.font('sans', 500) },
  eyebrow: { ...theme.typography.eyebrow, color: theme.palette.text.tertiary, textTransform: 'uppercase' },
  code: { fontSize: 12.5, lineHeight: 16, ...theme.font('mono', 700), color: theme.palette.text.primary },

  card: {
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.chrome,
    borderRadius: theme.borderRadius.card,
    padding: 14,
  },
  rows: { gap: 8 },

  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, lineHeight: 20, ...theme.font('sans', 800), color: theme.palette.actionPressed },
  passengerName: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20, ...theme.font('sans', 800), color: theme.palette.text.primary },

  pill: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: theme.borderRadius.full, borderWidth: theme.sizes.borderHairline },
  pillOk: { backgroundColor: theme.palette.successTint, borderColor: theme.palette.brand },
  pillBad: { backgroundColor: theme.palette.dangerTint, borderColor: theme.palette.dangerBorder },
  pillWait: { backgroundColor: theme.palette.warnTint, borderColor: theme.palette.warnBorder },
  pillNeutral: { backgroundColor: theme.palette.surfaceSunken, borderColor: theme.palette.borders.emphasis },
  pillText: { fontSize: 10.5, lineHeight: 13, ...theme.font('sans', 800) },
  pillInkOk: { color: theme.palette.actionPressed },
  pillInkBad: { color: theme.palette.dangerDeep },
  pillInkWait: { color: theme.palette.warnInk },
  pillInkNeutral: { color: theme.palette.text.muted },

  routeCard: { flexDirection: 'row', gap: 12 },
  connector: { width: 14, alignItems: 'center', paddingTop: 5 },
  dot: { width: 10, height: 10, borderRadius: theme.borderRadius.full },
  dotFrom: { backgroundColor: theme.palette.text.tertiary },
  dotTo: { backgroundColor: theme.palette.brand },
  line: { flex: 1, width: 2, minHeight: 48, marginVertical: 3, backgroundColor: theme.palette.brand },
  routeTexts: { flex: 1, minWidth: 0, gap: 12 },
  routeStop: { gap: 3 },
  place: { fontSize: 14, lineHeight: 19, ...theme.font('sans', 800), color: theme.palette.text.primary },
  placeNote: { fontSize: 12, lineHeight: 17, ...theme.font('sans', 600), color: theme.palette.text.muted },
  departLine: { fontSize: 11.5, lineHeight: 17, ...theme.font('mono', 500), color: theme.palette.text.secondary },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.brand,
  },
  tagText: { fontSize: 12, lineHeight: 15, ...theme.font('sans', 700), color: theme.palette.actionPressed },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowLabel: { flexShrink: 1, fontSize: 13.5, lineHeight: 18, ...theme.font('sans', 700), color: theme.palette.text.primary },
  rowValue: { fontSize: 13, lineHeight: 17, ...theme.font('mono', 700), color: theme.palette.text.primary, textAlign: 'right' },
  rowValueMuted: { ...theme.font('mono', 500), color: theme.palette.text.tertiary },
  rowValuePaid: { color: theme.palette.paid },
  rowValueMine: { color: theme.palette.actionPressed },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.action,
  },
  callText: { fontSize: 13, lineHeight: 16, ...theme.font('mono', 700), color: theme.palette.text.onAccent },

  special: { gap: 4, paddingTop: 9, borderTopWidth: theme.sizes.borderHairline, borderTopColor: theme.palette.borders.chrome },
  specialLine: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  specialLabel: { flexShrink: 1, fontSize: 11.5, lineHeight: 15, ...theme.font('mono', 600), color: theme.palette.text.muted },
  specialValue: { fontSize: 11.5, lineHeight: 15, ...theme.font('mono', 700), color: theme.palette.paid },

  noteText: { fontSize: 13, lineHeight: 18, ...theme.font('sans', 600), color: theme.palette.text.secondary },
  rejection: { fontSize: 12.5, lineHeight: 17, ...theme.font('sans', 600), color: theme.palette.dangerText },
  sentAt: { fontSize: 11, lineHeight: 14, ...theme.font('mono', 500), color: theme.palette.text.tertiary },

  // Offer mode — artboard lines 371-412: pill field 42 high, 2px ink border on successTint, mono digits.
  offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  offerLabel: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 16, ...theme.font('sans', 700), color: theme.palette.text.primary },
  offerField: {
    width: 126,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.palette.text.primary,
    backgroundColor: theme.palette.successTint,
  },
  offerInput: { minWidth: 48, padding: 0, textAlign: 'right', fontSize: 15, ...theme.font('mono', 700), color: theme.palette.text.primary },
  offerSuffix: { fontSize: 15, lineHeight: 18, ...theme.font('mono', 700), color: theme.palette.text.primary },
  offerUnit: { fontSize: 12, lineHeight: 15, ...theme.font('sans', 600), color: theme.palette.text.secondary },
  calc: { gap: 6, padding: 12, borderRadius: theme.borderRadius.field, backgroundColor: theme.palette.ground },
  calcValue: { fontSize: 12, lineHeight: 15, ...theme.font('mono', 700), color: theme.palette.text.primary },
  calcTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: theme.sizes.borderHairline,
    borderTopColor: theme.palette.borders.strong,
  },
  calcTotalLabel: { fontSize: 14, lineHeight: 18, ...theme.font('sans', 800), color: theme.palette.text.primary },
  calcTotalValue: { fontSize: 16, lineHeight: 20, ...theme.font('mono', 700), color: theme.palette.actionPressed },
  noteInput: {
    minHeight: 64,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.strong,
    borderRadius: theme.borderRadius.field,
    padding: 11,
    fontSize: 13,
    ...theme.font('sans', 600),
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.surfaceInput,
    textAlignVertical: 'top',
  },
  vehicleLine: { fontSize: 12, lineHeight: 16, ...theme.font('sans', 600), color: theme.palette.text.secondary },
  vehicleMissing: { color: theme.palette.dangerText },

  // Buttons — artboard: 50 high, radius 16; primary 52.
  actions: { gap: 9, paddingTop: 2 },
  spinner: { paddingVertical: 12 },
  button: { minHeight: 50, borderRadius: theme.borderRadius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonTall: { minHeight: 52 },
  buttonPrimary: { backgroundColor: theme.palette.action },
  buttonPrimaryText: { fontSize: 15, lineHeight: 19, ...theme.font('sans', 800), color: theme.palette.text.onAccent },
  buttonDisabled: { backgroundColor: theme.palette.disabled },
  buttonDisabledText: { fontSize: 15, lineHeight: 19, ...theme.font('sans', 800), color: theme.palette.text.muted },
  buttonOutline: { backgroundColor: theme.palette.surface, borderWidth: 1.5, borderColor: theme.palette.text.primary },
  buttonOutlineText: { fontSize: 15, lineHeight: 19, ...theme.font('sans', 800), color: theme.palette.text.primary },
  buttonQuiet: { backgroundColor: theme.palette.blueTint, borderWidth: theme.sizes.borderHairline, borderColor: theme.palette.borders.default },
  buttonQuietText: { fontSize: 15, lineHeight: 19, ...theme.font('sans', 700), color: theme.palette.text.primary },
  buttonDanger: { backgroundColor: theme.palette.surface, borderWidth: theme.sizes.borderHairline, borderColor: theme.palette.dangerBorder },
  buttonDangerText: { fontSize: 15, lineHeight: 19, ...theme.font('sans', 800), color: theme.palette.dangerText },
});
