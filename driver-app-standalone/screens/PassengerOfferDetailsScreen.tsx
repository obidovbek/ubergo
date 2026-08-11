/**
 * Passenger Offer Details Screen (driver side) — T-037 steps 3 & 4.
 *
 * The screen the driver lands on after tapping an order in
 * `SearchPassengerOffersScreen`. Before this, that tap navigated to an
 * unregistered route and did nothing at all (was T-021).
 *
 * It shows the whole order read-only, then lets the driver make an offer on it
 * (`joinPassengerOffer`). The T-018 extras — windows, gendered seats, salon,
 * class, payment, flags, special-order prices — are rendered by the existing
 * `PassengerOfferExtras`, the same component the search cards use, rather than
 * being laid out a second time here.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as PassengerOffersAPI from '../api/passengerOffers';
import { passengerNameOf, passengerPhoneOf } from '../api/passengerOffers';
import * as DriverAPI from '../api/driver';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { PassengerOfferExtras } from '../components/offers/PassengerOfferExtras';
import { AppModal } from '../components/AppModal';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDateTime } from '../utils/date';
import { showToast } from '../utils/toast';
import { getErrorMessage } from '../utils/errorHandler';
import { dialPhone, formatContactPhone } from '../utils/contactPhone';

/** The one vehicle attached to the driver's profile, as the wizard reads it. */
interface DriverVehicleSummary {
  id: string;
  label: string;
  seatingCapacity: number;
}

export default function PassengerOfferDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { offerId } = route.params as { offerId: number };

  const [offer, setOffer] = useState<PassengerOffersAPI.PassengerOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Join flow
  const [vehicle, setVehicle] = useState<DriverVehicleSummary | null>(null);
  const [joinVisible, setJoinVisible] = useState(false);
  const [seatsOffered, setSeatsOffered] = useState(1);
  const [priceInput, setPriceInput] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * The driver's OWN existing request on this offer, or null if they have none.
   *
   * ⚠️ This used to be a bare `joinSent` boolean starting at `false`, set only by
   * a successful submit **in the current screen session**. Leaving the screen and
   * coming back reset it, so the green "take this order" button reappeared for an
   * offer the driver had already applied to (owner, 2026-08-10). The server does
   * refuse the duplicate — `OfferDriverService.joinOffer:109-129` — so no bad row
   * was ever written, but the driver was invited to fill in seats and a price for
   * something that could never succeed. For `rejected` and `cancelled` it is
   * worse: those refusals are PERMANENT, so the button was a dead end.
   *
   * The detail payload cannot answer this — the offer's `drivers` list is
   * deliberately owner-only (rival bids are none of a driver's business), so we
   * ask `GET /driver/join-requests`, which returns only this driver's own rows.
   */
  const [myJoin, setMyJoin] = useState<PassengerOffersAPI.OfferDriver | null>(null);

  const loadOffer = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await PassengerOffersAPI.getPassengerOfferById(offerId);
      setOffer(data);
    } catch (error: any) {
      setLoadError(getErrorMessage(error, t, 'passengerOfferDetails.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offerId, t]);

  /**
   * Has this driver already applied to this offer?
   *
   * Deliberately non-fatal: if this call fails the order is still perfectly
   * readable, so we leave `myJoin` null and let the driver try. The server is
   * the real guard and will refuse a duplicate with a translated 400 — this
   * lookup exists to stop them WASTING the attempt, not to enforce the rule.
   */
  const loadMyJoin = useCallback(async () => {
    if (!token) return;

    try {
      const requests = await PassengerOffersAPI.getMyJoinRequests(token);
      const mine = requests.find((r) => Number(r.offer_id) === Number(offerId));
      setMyJoin(mine ?? null);
    } catch {
      setMyJoin(null);
    }
  }, [token, offerId]);

  // The driver has exactly one vehicle (profile.vehicle) — this mirrors
  // OfferWizardScreen.loadVehicles rather than offering a picker.
  const loadVehicle = useCallback(async () => {
    if (!token) return;

    try {
      const profileResponse = await DriverAPI.getDriverProfile(token);
      const profile = (profileResponse as any)?.profile;
      const v = profile?.vehicle;

      if (v?.id) {
        const parts: string[] = [];
        if (v.make?.name_uz || v.make?.name) parts.push(v.make.name_uz || v.make.name);
        if (v.model?.name_uz || v.model?.name) parts.push(v.model.name_uz || v.model.name);
        if (v.license_plate) parts.push(v.license_plate);

        setVehicle({
          id: v.id,
          label: parts.join(' • ') || t('passengerOfferDetails.vehicle'),
          seatingCapacity: Math.min(Math.max(Number(v.seating_capacity) || 1, 1), 8),
        });
      } else {
        setVehicle(null);
      }
    } catch (error: any) {
      // Not fatal — the order is still readable. The join sheet reports it.
      setVehicle(null);
    }
  }, [token, t]);

  useEffect(() => {
    loadOffer();
    loadVehicle();
    loadMyJoin();
  }, [loadOffer, loadVehicle, loadMyJoin]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOffer();
    // Pull-to-refresh must re-check this too: the passenger may have confirmed
    // or rejected the driver while this screen sat open.
    loadMyJoin();
  };

  const openJoin = () => {
    if (!offer) return;

    // ⚠️ The server refuses seats_offered < seats_needed, and a T-018 salon
    // booking needs 3 or 4. Defaulting to 1 (the API client's default) would
    // reject the driver on every salon order with a confusing message.
    setSeatsOffered(offer.seats_needed);
    setPriceInput(
      offer.max_price_per_seat != null ? String(Math.round(Number(offer.max_price_per_seat))) : ''
    );
    setMessage('');
    setJoinVisible(true);
  };

  const pricePerSeat = Number(priceInput.replace(/\s/g, ''));
  const priceValid = Number.isFinite(pricePerSeat) && pricePerSeat > 0;
  // The server bills per seat × what the passenger NEEDS, not × what the driver
  // has free (OfferDriverService, confirmed by the owner 2026-08-02).
  const totalPrice = offer && priceValid ? pricePerSeat * offer.seats_needed : 0;

  const canSubmit = !!offer && !!vehicle && priceValid && seatsOffered >= offer.seats_needed && !submitting;

  const handleSubmitJoin = async () => {
    if (!offer || !token) return;

    if (!vehicle) {
      showToast.error(t('common.error'), t('passengerOfferDetails.noVehicle'));
      return;
    }
    if (!priceValid) {
      showToast.error(t('common.error'), t('passengerOfferDetails.errorPrice'));
      return;
    }
    if (seatsOffered < offer.seats_needed) {
      showToast.error(t('common.error'), t('passengerOfferDetails.errorSeats'));
      return;
    }

    try {
      setSubmitting(true);
      const created = await PassengerOffersAPI.joinPassengerOffer(token, offer.id, {
        vehicle_id: vehicle.id,
        seats_offered: seatsOffered,
        offered_price_per_seat: pricePerSeat,
        message: message.trim() || undefined,
      });

      setJoinVisible(false);
      // Trust the row the server just created, so the footer is correct
      // immediately; the next open/refresh re-reads it from the API anyway.
      setMyJoin(created ?? null);
      showToast.success(
        t('passengerOfferDetails.sentTitle'),
        t('passengerOfferDetails.sentMessage')
      );
    } catch (error: any) {
      // The server's 400s are already translated (already applied / rejected /
      // cancelled / started / own offer / no vehicle), so show them verbatim.
      showToast.error(t('common.error'), getErrorMessage(error, t, 'passengerOfferDetails.joinFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * How the footer presents an existing request. Each status gets its own
   * wording and colour — lumping them together as one green "sent" banner would
   * tell a REJECTED driver their offer is still live.
   *
   * `rejected` and `cancelled` are terminal: `joinOffer` refuses a second
   * attempt permanently (`cannotJoinAfterRejected` / `cannotJoinAfterCancelled`),
   * so no button is offered in those states — there is nothing the driver can do
   * here, and pretending otherwise is what caused the original complaint.
   */
  const joinBanner = (() => {
    switch (myJoin?.status) {
      case 'confirmed':
        return {
          icon: 'checkmark-done-circle' as const,
          color: '#047857',
          style: styles.bannerSuccess,
          text: t('passengerOfferDetails.statusConfirmed'),
        };
      case 'rejected':
        return {
          icon: 'close-circle' as const,
          color: '#B91C1C',
          style: styles.bannerDanger,
          text: t('passengerOfferDetails.statusRejected'),
        };
      case 'cancelled':
        return {
          icon: 'ban' as const,
          color: '#6B7280',
          style: styles.bannerMuted,
          text: t('passengerOfferDetails.statusCancelled'),
        };
      default: // pending
        return {
          icon: 'checkmark-circle' as const,
          color: '#047857',
          style: styles.bannerSuccess,
          text: t('passengerOfferDetails.alreadySent'),
        };
    }
  })();

  const renderRow = (icon: keyof typeof Ionicons.glyphMap, label: string, value: string) => (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color="#6B7280" />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('passengerOfferDetails.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : loadError || !offer ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
          <Text style={styles.errorText}>{loadError || t('passengerOfferDetails.notFound')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOffer} activeOpacity={0.8}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            {/* Route */}
            <View style={styles.card}>
              <View style={styles.routeRow}>
                <View style={styles.routeDot} />
                <View style={styles.routeContent}>
                  <Text style={styles.routeLabel}>{t('passengerOfferDetails.from')}</Text>
                  <Text style={styles.routeText}>{offer.from_text}</Text>
                  {!!offer.from_landmark && (
                    <Text style={styles.landmarkText}>{offer.from_landmark}</Text>
                  )}
                </View>
              </View>

              <View style={styles.routeConnector}>
                <View style={styles.routeLine} />
                <Ionicons name="arrow-down" size={16} color="#D1D5DB" />
              </View>

              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
                <View style={styles.routeContent}>
                  <Text style={styles.routeLabel}>{t('passengerOfferDetails.to')}</Text>
                  <Text style={styles.routeText}>{offer.to_text}</Text>
                  {!!offer.to_landmark && (
                    <Text style={styles.landmarkText}>{offer.to_landmark}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Facts */}
            <View style={styles.card}>
              {renderRow(
                'calendar-outline',
                t('passengerOfferDetails.departure'),
                formatDateTime(offer.start_at, currentLanguage)
              )}
              {renderRow(
                'person-outline',
                t('passengerOfferDetails.passenger'),
                // ⚠️ NOT `offer.passenger.name` — that crashed the whole app.
                // The browse list and this detail endpoint sit under the same
                // `/public/passenger-offers` prefix but return DIFFERENT shapes:
                // the list is hand-mapped and ends in `passenger: {id, name}`,
                // while `getOfferById` returns the raw Sequelize model, whose
                // include is aliased `as: 'user'`. So `passenger` is undefined
                // here, and reading `.name` off it threw during render — with no
                // error boundary above, that killed the process to the launcher.
                passengerNameOf(offer) || t('passengerOfferDetails.passengerUnknown')
              )}
              {renderRow(
                'people-outline',
                t('passengerOfferDetails.seatsNeeded'),
                String(offer.seats_needed)
              )}
              {renderRow(
                'cash-outline',
                t('passengerOfferDetails.maxPrice'),
                offer.max_price_per_seat != null
                  ? `${formatNumberWithSpaces(Math.round(Number(offer.max_price_per_seat)))} ${offer.currency}`
                  : t('passengerOfferDetails.priceNotSet')
              )}

              <PassengerOfferExtras offer={offer} />
            </View>

            {!!offer.note && (
              <View style={styles.card}>
                <Text style={styles.noteLabel}>{t('passengerOfferDetails.note')}</Text>
                <Text style={styles.noteText}>{offer.note}</Text>
              </View>
            )}
          </ScrollView>

          {/* CTA — reflects the driver's REAL state on this offer, not just what
              happened while this screen instance was mounted. */}
          <View style={styles.footer}>
            {myJoin ? (
              <>
                <View style={[styles.sentBanner, joinBanner.style]}>
                  <Ionicons name={joinBanner.icon} size={20} color={joinBanner.color} />
                  <Text style={[styles.sentBannerText, { color: joinBanner.color }]}>
                    {joinBanner.text}
                  </Text>
                </View>

                {/* T-054 — this is the screen the driver actually has open after
                    browsing, so the confirmed ride's contact belongs here too.
                    🔴 The number must be read from `myJoin.offer`, NOT from this
                    screen's `offer`: that one comes from the PUBLIC detail
                    endpoint, which carries no phone for anybody. */}
                {myJoin.status === 'confirmed' &&
                  (passengerPhoneOf(myJoin.offer) ? (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => dialPhone(passengerPhoneOf(myJoin.offer), t)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                      <Text style={styles.callText}>
                        {formatContactPhone(passengerPhoneOf(myJoin.offer))}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.contactMissing}>
                      {t('myJoinRequests.noPhone')}
                    </Text>
                  ))}
              </>
            ) : (
              <TouchableOpacity style={styles.cta} onPress={openJoin} activeOpacity={0.85}>
                <Ionicons name="car-outline" size={20} color="#FFFFFF" />
                <Text style={styles.ctaText}>{t('passengerOfferDetails.takeOrder')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Join sheet */}
      <AppModal
        visible={joinVisible}
        onClose={() => setJoinVisible(false)}
        title={t('passengerOfferDetails.joinTitle')}
        // A stray backdrop tap would discard a typed price mid-flow.
        dismissOnBackdropPress={false}
        actions={[
          {
            label: submitting
              ? t('passengerOfferDetails.sending')
              : t('passengerOfferDetails.send'),
            onPress: handleSubmitJoin,
            variant: 'primary',
            disabled: !canSubmit,
          },
          {
            label: t('common.cancel'),
            onPress: () => setJoinVisible(false),
            variant: 'cancel',
            disabled: submitting,
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
          {/* Vehicle — read-only: the driver has exactly one */}
          <Text style={styles.fieldLabel}>{t('passengerOfferDetails.vehicle')}</Text>
          {vehicle ? (
            <View style={styles.vehicleBox}>
              <Ionicons name="car-sport-outline" size={18} color="#374151" />
              <Text style={styles.vehicleText}>{vehicle.label}</Text>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
              <Text style={styles.warningText}>{t('passengerOfferDetails.noVehicle')}</Text>
            </View>
          )}

          {/* Seats offered */}
          <Text style={styles.fieldLabel}>{t('passengerOfferDetails.seatsOffered')}</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setSeatsOffered((n) => Math.max(offer?.seats_needed ?? 1, n - 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{seatsOffered}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setSeatsOffered((n) => Math.min(8, n + 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#111827" />
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldHint}>
            {t('passengerOfferDetails.seatsHint').replace(
              '{count}',
              String(offer?.seats_needed ?? 1)
            )}
          </Text>

          {/* Price */}
          <Text style={styles.fieldLabel}>{t('passengerOfferDetails.pricePerSeat')}</Text>
          <TextInput
            style={styles.input}
            value={priceInput}
            onChangeText={(text) => setPriceInput(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />

          {priceValid && !!offer && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('passengerOfferDetails.total')}</Text>
              <Text style={styles.totalValue}>
                {formatNumberWithSpaces(totalPrice)} {offer.currency}
              </Text>
            </View>
          )}

          {/* Message */}
          <Text style={styles.fieldLabel}>{t('passengerOfferDetails.messageLabel')}</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={message}
            onChangeText={setMessage}
            placeholder={t('passengerOfferDetails.messagePlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={300}
          />
        </ScrollView>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  routeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginTop: 6,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  landmarkText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingVertical: 6,
  },
  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#10B981',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#10B981',
  },
  callText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactMissing: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  // Per-status skins. The banner is no longer always green — a rejected driver
  // seeing a green "sent" banner would think their offer was still live.
  bannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  bannerDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  bannerMuted: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  sentBannerText: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
    // Colour comes from `joinBanner.color` at the call site — it varies by
    // status, so deliberately none here.
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
  },
  fieldHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  vehicleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  vehicleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 16,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  stepperButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  totalLabel: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
  },
});
