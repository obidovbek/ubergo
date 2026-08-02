/**
 * Create Passenger Offer Screen
 * Screen for passengers to create ride requests
 * Redesigned with modern, clean UI with geo selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  createPassengerOffer,
  type CreatePassengerOfferData,
  type PassengerOfferPaymentType,
  type PassengerOfferSalonScope,
  type PassengerOfferVehicleClass,
} from '../api/passengerOffers';
import { useTranslation } from '../hooks/useTranslation';
import * as GeoAPI from '../api/geo';
import {
  LocationCard,
  buildLocationText,
  emptyLocation,
  type LocationValue,
} from '../components/passengerOffer/LocationCard';
import { TimeWindowCard, combineDateTime } from '../components/passengerOffer/TimeWindowCard';
import { CheckRow } from '../components/passengerOffer/CheckRow';
import { SeatStepper, type SeatRowCounts } from '../components/passengerOffer/SeatStepper';
import {
  SpecialOrderPanel,
  emptySpecialOrder,
  hasAnySeatPrice,
  parseMoney,
  FREE_WAITING_MINUTES,
  type SpecialOrderValue,
} from '../components/passengerOffer/SpecialOrderPanel';

type MainStackParamList = {
  Menu: undefined;
  CreatePassengerOffer: undefined;
  MyPassengerOffers: undefined;
};

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const CreatePassengerOfferScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  
  // Country is fixed to Uzbekistan and never shown (OR-004 precedent)
  const [countryId, setCountryId] = useState<number | null>(null);

  // Route — the two cards of K_buyurtma001Yangi.png
  const [fromLocation, setFromLocation] = useState<LocationValue>(emptyLocation);
  const [toLocation, setToLocation] = useState<LocationValue>(emptyLocation);

  // Departure: hozioq, or a date + a from–until window
  const [isUrgent, setIsUrgent] = useState(false);
  const [departDate, setDepartDate] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));
  const [departFrom, setDepartFrom] = useState<Date | null>(new Date(Date.now() + 60 * 60 * 1000));
  const [departUntil, setDepartUntil] = useState<Date | null>(null);

  // Arrival ("...gacha yetib borish kerak") — fully optional
  const [arriveDate, setArriveDate] = useState<Date | null>(null);
  const [arriveUntil, setArriveUntil] = useState<Date | null>(null);

  // Payment — single choice despite the checkbox styling in the Figma
  const [paymentType, setPaymentType] = useState<PassengerOfferPaymentType | null>(null);
  const [payerPhone, setPayerPhone] = useState('+998 ');

  // Vehicle class — one deselectable radio group of five
  const [vehicleClass, setVehicleClass] = useState<PassengerOfferVehicleClass | null>(null);

  // Seats: a sedan, as drawn — 1 front seat, 3 back seats
  const [frontCounts, setFrontCounts] = useState<SeatRowCounts>({ male: 0, female: 0 });
  const [backCounts, setBackCounts] = useState<SeatRowCounts>({ male: 0, female: 0 });
  const [seatPositionAny, setSeatPositionAny] = useState(false);
  const [salonScope, setSalonScope] = useState<PassengerOfferSalonScope | null>(null);

  const [womanInCar, setWomanInCar] = useState(false);
  const [largeBaggage, setLargeBaggage] = useState(false);
  const [roofRackNeeded, setRoofRackNeeded] = useState(false);
  const [trailer, setTrailer] = useState(false);
  const [pets, setPets] = useState(false);
  const [roadPickup, setRoadPickup] = useState(false);
  const [roadPickupNote, setRoadPickupNote] = useState('');
  const [note, setNote] = useState('');

  // Special order — collapsed by default, posts to the same endpoint
  const [specialExpanded, setSpecialExpanded] = useState(false);
  const [specialOrder, setSpecialOrder] = useState<SpecialOrderValue>(emptySpecialOrder);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // A salon booking takes every seat, so the per-seat picker is meaningless
  const seatsLocked = salonScope !== null;
  const totalSeats = frontCounts.male + frontCounts.female + backCounts.male + backCounts.female;

  /** Radios are deselectable: tapping the active one clears the group. */
  const toggleSalonScope = (scope: PassengerOfferSalonScope) => {
    setSalonScope((current) => (current === scope ? null : scope));
  };

  const toggleVehicleClass = (option: PassengerOfferVehicleClass) => {
    setVehicleClass((current) => (current === option ? null : option));
  };

  // Resolve Uzbekistan once; the country itself is never shown (OR-004).
  useEffect(() => {
    let cancelled = false;

    GeoAPI.fetchGeoCountries()
      .then((countries) => {
        if (cancelled) return;
        const uzbekistan = countries.find((country) =>
          country.name.toLowerCase().includes('zbekistan')
        );
        setCountryId(uzbekistan?.id ?? countries[0]?.id ?? null);
      })
      .catch((error) => {
        console.error('Failed to load countries:', error);
        Alert.alert(t('common.error'), t('passengerOffers.errorLoad'));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Departure moment: "now" when urgent, otherwise the day + window start. */
  const getStartAtDate = (): Date => {
    if (isUrgent) return new Date();
    return combineDateTime(departDate, departFrom ?? departDate);
  };

  /** End of the departure window — only when the passenger set one. */
  const getDepartUntilDate = (): Date | null => {
    if (isUrgent || !departUntil) return null;
    return combineDateTime(departDate, departUntil);
  };

  /** "…gacha yetib borish kerak" — needs both a day and a time. */
  const getArriveUntilDate = (): Date | null => {
    if (!arriveDate || !arriveUntil) return null;
    return combineDateTime(arriveDate, arriveUntil);
  };

  const validateForm = (withSpecialOrder: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    // Province + city/district are required; settlement and landmark are not
    // (many districts have no settlements at all).
    if (!fromLocation.province || !fromLocation.cityDistrict) {
      newErrors.from_text = t('passengerOffers.errorFromLocation');
    }
    if (!toLocation.province || !toLocation.cityDistrict) {
      newErrors.to_text = t('passengerOffers.errorToLocation');
    }

    const startAtDate = getStartAtDate();

    if (!isUrgent) {
      if (!departFrom) {
        newErrors.start_at = t('passengerOffers.errorTime');
      } else if (startAtDate < new Date(Date.now() + 30 * 60 * 1000)) {
        // Same 30-minute floor the API applies to non-urgent offers
        newErrors.start_at = t('passengerOffers.errorTime');
      }

      const departUntilDate = getDepartUntilDate();
      if (departUntilDate && departUntilDate < startAtDate) {
        newErrors.start_at = t('passengerOffers.errorDepartureTime');
      }
    }

    const arriveUntilDate = getArriveUntilDate();
    if (arriveUntilDate && arriveUntilDate < startAtDate) {
      newErrors.arrive_until = t('passengerOffers.errorArrivalTime');
    }

    // Either single seats or a whole-salon booking — the API needs one of them
    if (!salonScope && totalSeats === 0) {
      newErrors.seats = t('passengerOffers.errorSeatsRequired');
    }

    if (!paymentType) {
      newErrors.payment_type = t('passengerOffers.errorPaymentRequired');
    } else if (paymentType === 'friend_pays' && payerPhone.replace(/\D/g, '').length < 7) {
      newErrors.payer_phone = t('passengerOffers.errorPayerPhone');
    }

    // The API rejects a special order without a single seat price
    if (withSpecialOrder && !hasAnySeatPrice(specialOrder)) {
      newErrors.special_order = t('passengerOffers.errorSpecialPrice');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert(t('common.error'), Object.values(newErrors)[0] || t('passengerOffers.errorAllFields'));
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (withSpecialOrder = false) => {
    if (!validateForm(withSpecialOrder)) {
      return;
    }

    setIsLoading(true);

    try {
      const departUntilDate = getDepartUntilDate();
      const arriveUntilDate = getArriveUntilDate();

      // Most precise geo level the passenger picked, for the map later on
      const fromPoint = fromLocation.settlement ?? fromLocation.cityDistrict;
      const toPoint = toLocation.settlement ?? toLocation.cityDistrict;

      const offerData: CreatePassengerOfferData = {
        from_text: buildLocationText(fromLocation),
        from_lat: fromPoint?.latitude || undefined,
        from_lng: fromPoint?.longitude || undefined,
        from_country_id: countryId || undefined,
        from_province_id: fromLocation.province?.id || undefined,
        from_city_id: fromLocation.cityDistrict?.id || undefined,
        from_settlement_id: fromLocation.settlement?.id || undefined,
        from_landmark: fromLocation.landmark.trim() || undefined,
        to_text: buildLocationText(toLocation),
        to_lat: toPoint?.latitude || undefined,
        to_lng: toPoint?.longitude || undefined,
        to_country_id: countryId || undefined,
        to_province_id: toLocation.province?.id || undefined,
        to_city_id: toLocation.cityDistrict?.id || undefined,
        to_settlement_id: toLocation.settlement?.id || undefined,
        to_landmark: toLocation.landmark.trim() || undefined,
        start_at: getStartAtDate().toISOString(),
        depart_until: departUntilDate?.toISOString(),
        arrive_until: arriveUntilDate?.toISOString(),
        is_urgent: isUrgent,
        // seats_needed and max_price_per_seat are deliberately absent: the API
        // derives the seat count, and this form collects no price at all.
        payment_type: paymentType ?? undefined,
        payer_phone: paymentType === 'friend_pays' ? payerPhone.trim() : undefined,
        seat_counts: salonScope
          ? undefined
          : {
              front_male: frontCounts.male,
              front_female: frontCounts.female,
              back_male: backCounts.male,
              back_female: backCounts.female,
            },
        seat_position_any: seatPositionAny,
        salon_scope: salonScope ?? undefined,
        vehicle_class: vehicleClass ?? undefined,
        currency: 'UZS',
        // Kept in sync for the older list screens that still read front_seat.
        // The whole salon includes the front seat; the back salon does not.
        front_seat: salonScope
          ? salonScope === 'whole_salon'
          : frontCounts.male + frontCounts.female > 0,
        pets: pets,
        large_baggage: largeBaggage,
        woman_in_car: womanInCar,
        roof_rack_needed: roofRackNeeded,
        trailer: trailer,
        road_pickup: roadPickup,
        road_pickup_note: roadPickup ? roadPickupNote.trim() || undefined : undefined,
        note: note.trim() || undefined,
        // Stored as typed; no money moves anywhere yet (owner decision, T-006)
        special_order: withSpecialOrder
          ? {
              price_front: parseMoney(specialOrder.priceFront),
              price_back: parseMoney(specialOrder.priceBack),
              price_back_salon: parseMoney(specialOrder.priceBackSalon),
              price_whole_salon: parseMoney(specialOrder.priceWholeSalon),
              review_driver_offers: specialOrder.reviewDriverOffers,
              fixed_price: specialOrder.fixedPrice,
              waiting_fee_per_min: parseMoney(specialOrder.waitingFeePerMin),
              free_waiting_min: FREE_WAITING_MINUTES,
            }
          : undefined,
      };

      await createPassengerOffer(offerData);

      Alert.alert(
        t('passengerOffers.success'),
        t('passengerOffers.successMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating passenger offer:', error);
      Alert.alert(
        t('passengerOffers.errorCreate'),
        error.message || t('passengerOffers.errorCreateMessage')
      );
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('passengerOffers.createRideRequest')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Route + times — inline, exactly as drawn on K_buyurtma001Yangi.png */}
        <View style={styles.routeCard}>
          <LocationCard
            label={t('passengerOffers.fromLabel')}
            countryId={countryId}
            value={fromLocation}
            onChange={setFromLocation}
            accent="start"
            error={errors.from_text}
          />

          <TimeWindowCard
            variant="departure"
            date={departDate}
            onDateChange={setDepartDate}
            fromTime={departFrom}
            onFromTimeChange={setDepartFrom}
            untilTime={departUntil}
            onUntilTimeChange={setDepartUntil}
            urgent={isUrgent}
            onUrgentChange={setIsUrgent}
            error={errors.start_at}
          />

          <LocationCard
            label={t('passengerOffers.toLabel')}
            countryId={countryId}
            value={toLocation}
            onChange={setToLocation}
            accent="end"
            error={errors.to_text}
          />

          <TimeWindowCard
            variant="arrival"
            date={arriveDate}
            onDateChange={setArriveDate}
            untilTime={arriveUntil}
            onUntilTimeChange={setArriveUntil}
            error={errors.arrive_until}
          />
        </View>

        {/* Payment ("To'lov turi") — single choice, the Figma draws checkboxes */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{t('passengerOffers.paymentTitle')}</Text>

          <View style={styles.inlineRow}>
            <CheckRow
              label={t('passengerOffers.paymentCash')}
              checked={paymentType === 'cash'}
              onPress={() => setPaymentType(paymentType === 'cash' ? null : 'cash')}
            />
            <CheckRow
              label={t('passengerOffers.paymentClickPayme')}
              checked={paymentType === 'click_payme'}
              onPress={() => setPaymentType(paymentType === 'click_payme' ? null : 'click_payme')}
            />
          </View>

          <CheckRow
            label={t('passengerOffers.paymentFriend')}
            checked={paymentType === 'friend_pays'}
            onPress={() => setPaymentType(paymentType === 'friend_pays' ? null : 'friend_pays')}
          />

          {/* The friend may well be abroad — the number is typed in full */}
          {paymentType === 'friend_pays' && (
            <TextInput
              style={[styles.plainInput, !!errors.payer_phone && styles.inputError]}
              value={payerPhone}
              onChangeText={setPayerPhone}
              placeholder={t('passengerOffers.payerPhonePlaceholder')}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={20}
            />
          )}

          {!!errors.payment_type && <Text style={styles.errorText}>{errors.payment_type}</Text>}
          {!!errors.payer_phone && <Text style={styles.errorText}>{errors.payer_phone}</Text>}
        </View>

        {/* Vehicle class — one deselectable group of five */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{t('passengerOffers.vehicleClass')}</Text>

          <View style={styles.inlineRow}>
            <CheckRow
              label={t('passengerOffers.classStandard')}
              shape="radio"
              checked={vehicleClass === 'standard'}
              onPress={() => toggleVehicleClass('standard')}
            />
            <CheckRow
              label={t('passengerOffers.classComfort')}
              shape="radio"
              checked={vehicleClass === 'comfort'}
              onPress={() => toggleVehicleClass('comfort')}
            />
            <CheckRow
              label={t('passengerOffers.classBusiness')}
              shape="radio"
              checked={vehicleClass === 'business'}
              onPress={() => toggleVehicleClass('business')}
            />
          </View>

          <CheckRow
            label={t('passengerOffers.classEconom')}
            shape="radio"
            checked={vehicleClass === 'econom'}
            onPress={() => toggleVehicleClass('econom')}
          />
          <CheckRow
            label={t('passengerOffers.classTourist')}
            shape="radio"
            checked={vehicleClass === 'tourist'}
            onPress={() => toggleVehicleClass('tourist')}
          />
        </View>

        {/* Seats */}
        <View style={styles.detailsCard}>
          <View style={styles.seatsHeader}>
            <Text style={styles.cardTitle}>{t('passengerOffers.seatsTitle')}</Text>
            {totalSeats > 0 && !seatsLocked && (
              <View style={styles.seatTotalBadge}>
                <Text style={styles.seatTotalText}>{totalSeats}</Text>
              </View>
            )}
          </View>

          <SeatStepper
            label={t('passengerOffers.seatRowFront')}
            counts={frontCounts}
            capacity={1}
            disabled={seatsLocked}
            onChange={setFrontCounts}
          />
          <SeatStepper
            label={t('passengerOffers.seatRowBack')}
            counts={backCounts}
            capacity={3}
            disabled={seatsLocked}
            onChange={setBackCounts}
          />

          <CheckRow
            label={t('passengerOffers.seatPositionAny')}
            checked={seatPositionAny}
            onPress={() => setSeatPositionAny(!seatPositionAny)}
            disabled={seatsLocked}
          />

          <View style={styles.inlineRow}>
            <CheckRow
              label={t('passengerOffers.salonWhole')}
              shape="radio"
              checked={salonScope === 'whole_salon'}
              onPress={() => toggleSalonScope('whole_salon')}
            />
            <CheckRow
              label={t('passengerOffers.salonBackFull')}
              shape="radio"
              checked={salonScope === 'back_salon_full'}
              onPress={() => toggleSalonScope('back_salon_full')}
            />
          </View>

          <CheckRow
            label={t('passengerOffers.womanInCar')}
            checked={womanInCar}
            onPress={() => setWomanInCar(!womanInCar)}
          />

          {!!errors.seats && <Text style={styles.errorText}>{errors.seats}</Text>}
        </View>

        {/* Baggage, animals, pitak */}
        <View style={styles.detailsCard}>
          <CheckRow
            label={t('passengerOffers.baggage')}
            checked={largeBaggage}
            onPress={() => setLargeBaggage(!largeBaggage)}
          />

          <View style={styles.inlineRow}>
            <CheckRow
              label={t('passengerOffers.roofRack')}
              checked={roofRackNeeded}
              onPress={() => setRoofRackNeeded(!roofRackNeeded)}
            />
            <CheckRow
              label={t('passengerOffers.trailer')}
              checked={trailer}
              onPress={() => setTrailer(!trailer)}
            />
          </View>

          <CheckRow
            label={t('passengerOffers.animals')}
            checked={pets}
            onPress={() => setPets(!pets)}
          />

          <CheckRow
            label={t('passengerOffers.roadPickup')}
            checked={roadPickup}
            onPress={() => setRoadPickup(!roadPickup)}
            emphasis="danger"
          />

          {roadPickup && (
            <TextInput
              style={styles.noteInput}
              value={roadPickupNote}
              onChangeText={setRoadPickupNote}
              placeholder={t('passengerOffers.roadPickupPlaceholder')}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Qo'shimcha ma'lumot */}
        <View style={styles.detailsCard}>
          <Text style={[styles.cardTitle, styles.cardTitleDanger]}>
            {t('passengerOffers.additionalInfo')}
          </Text>
          <TextInput
            style={styles.noteInput}
            placeholder={t('passengerOffers.additionalInfoPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Both buttons scroll with the form, as drawn — the green one first,
            then the special order below it */}
        <View style={styles.submitWrapper}>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={() => handleSubmit(false)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>{t('passengerOffers.submitOrder')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <SpecialOrderPanel
          expanded={specialExpanded}
          onToggle={() => setSpecialExpanded(!specialExpanded)}
          value={specialOrder}
          onChange={setSpecialOrder}
          onSubmit={() => handleSubmit(true)}
          disabled={isLoading}
          error={errors.special_order}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  // T-018 — sections of the Figma order screen
  cardTitleDanger: {
    color: '#DC2626',
  },
  // Wraps instead of overflowing: the labels differ a lot in length per language
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 16,
  },
  plainInput: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#111827',
  },
  seatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatTotalBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  seatTotalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  noteInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 100,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
