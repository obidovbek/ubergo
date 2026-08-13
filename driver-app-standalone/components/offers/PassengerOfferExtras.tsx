/**
 * Passenger Offer Extras (driver side, read-only)
 *
 * Renders the fields the new passenger order screen added (T-018): departure /
 * arrival windows, the gendered seat breakdown or a salon booking, vehicle
 * class, payment type, the flags, the pitak note and the special-order prices.
 *
 * Everything is optional — offers created by older app builds simply render
 * nothing here.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import type {
  PassengerOffer,
  PassengerOfferPaymentType,
  PassengerOfferSeatCounts,
} from '../../api/passengerOffers';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Formatted by hand — Android locale data is not worth relying on. */
const formatTime = (iso?: string | null): string | null => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDayTime = (iso?: string | null): string | null => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${formatTime(iso)}`;
};

const formatMoney = (amount?: number | null): string | null => {
  if (amount === null || amount === undefined) return null;
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const totalSeats = (counts: PassengerOfferSeatCounts): number =>
  counts.front_male + counts.front_female + counts.back_male + counts.back_female;

interface ChipProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'neutral' | 'urgent' | 'info';
}

const Chip: React.FC<ChipProps> = ({ icon, label, tone = 'neutral' }) => (
  <View style={[styles.chip, tone === 'urgent' && styles.chipUrgent, tone === 'info' && styles.chipInfo]}>
    {icon && (
      <Ionicons
        name={icon}
        size={12}
        color={tone === 'urgent' ? '#B91C1C' : tone === 'info' ? '#1D4ED8' : '#4B5563'}
      />
    )}
    <Text style={[styles.chipText, tone === 'urgent' && styles.chipTextUrgent, tone === 'info' && styles.chipTextInfo]}>
      {label}
    </Text>
  </View>
);

interface PassengerOfferExtrasProps {
  offer: PassengerOffer;
}

export const PassengerOfferExtras: React.FC<PassengerOfferExtrasProps> = ({ offer }) => {
  const { t } = useTranslation();
  const tx = (key: string) => t(`passengerOfferExtras.${key}`);

  const departFrom = formatTime(offer.start_at);
  const departUntil = formatTime(offer.depart_until);
  const arriveUntil = formatDayTime(offer.arrive_until);

  const classLabels: Record<string, string> = {
    standard: tx('classStandard'),
    comfort: tx('classComfort'),
    business: tx('classBusiness'),
    econom: tx('classEconom'),
    tourist: tx('classTourist'),
  };

  const paymentLabels: Record<string, string> = {
    cash: tx('paymentCash'),
    click_payme: tx('paymentClickPayme'),
    friend_pays: tx('paymentFriend'),
  };

  const flags: string[] = [
    offer.woman_in_car ? tx('womanInCar') : '',
    offer.roof_rack_needed ? tx('roofRack') : '',
    offer.trailer ? tx('trailer') : '',
    offer.pets ? tx('pets') : '',
    offer.large_baggage ? tx('baggage') : '',
    offer.road_pickup ? tx('roadPickup') : '',
  ].filter(Boolean);

  const special = offer.special_order;
  const specialPrices = special
    ? ([
        [tx('seatsFront'), formatMoney(special.price_front)],
        [tx('seatsBack'), formatMoney(special.price_back)],
        [tx('backSalonFull'), formatMoney(special.price_back_salon)],
        [tx('wholeSalon'), formatMoney(special.price_whole_salon)],
      ].filter(([, price]) => price !== null) as [string, string][])
    : [];

  const seatCounts = offer.seat_counts;
  const showSeatBreakdown = !!seatCounts && totalSeats(seatCounts) > 0;

  /*
   * T-031 — a passenger may now choose cash AND card, plus "Do'stimga" on top,
   * so payment is a LIST of chips rather than one.
   *
   * ⚠️ Falls back to the deprecated `payment_type` when the flags are absent:
   * offers created before the split carry only the single value, and showing
   * the driver nothing at all would be worse than showing the old one.
   */
  const paymentKeys: PassengerOfferPaymentType[] =
    offer.payment_cash === undefined &&
    offer.payment_card === undefined &&
    offer.paid_by_friend === undefined
      ? offer.payment_type
        ? [offer.payment_type]
        : []
      : [
          ...(offer.payment_cash ? (['cash'] as const) : []),
          ...(offer.payment_card ? (['click_payme'] as const) : []),
          ...(offer.paid_by_friend ? (['friend_pays'] as const) : []),
        ];

  const hasAnything =
    offer.is_urgent ||
    !!departUntil ||
    !!arriveUntil ||
    showSeatBreakdown ||
    !!offer.salon_scope ||
    !!offer.vehicle_class ||
    paymentKeys.length > 0 ||
    flags.length > 0 ||
    !!offer.road_pickup_note ||
    !!special;

  if (!hasAnything) return null;

  return (
    <View style={styles.container}>
      {/* Windows */}
      {(offer.is_urgent || departUntil || arriveUntil) && (
        <View style={styles.row}>
          {offer.is_urgent && <Chip icon="flash" label={tx('urgent')} tone="urgent" />}
          {!!departUntil && !!departFrom && (
            <Chip icon="time-outline" label={`${departFrom}–${departUntil}`} />
          )}
          {!!arriveUntil && (
            <Chip icon="flag-outline" label={`${arriveUntil} ${tx('arriveBy')}`} />
          )}
        </View>
      )}

      {/* Seats: a salon booking, or who exactly is travelling */}
      {(showSeatBreakdown || offer.salon_scope || offer.seat_position_any) && (
        <View style={styles.row}>
          {offer.salon_scope === 'whole_salon' && (
            <Chip icon="car-outline" label={tx('wholeSalon')} tone="info" />
          )}
          {offer.salon_scope === 'back_salon_full' && (
            <Chip icon="car-outline" label={tx('backSalonFull')} tone="info" />
          )}

          {showSeatBreakdown && seatCounts && (
            <>
              {seatCounts.front_male + seatCounts.front_female > 0 && (
                <Chip
                  label={`${tx('seatsFront')}: ${describeSeats(seatCounts.front_male, seatCounts.front_female)}`}
                />
              )}
              {seatCounts.back_male + seatCounts.back_female > 0 && (
                <Chip
                  label={`${tx('seatsBack')}: ${describeSeats(seatCounts.back_male, seatCounts.back_female)}`}
                />
              )}
            </>
          )}

          {offer.seat_position_any && <Chip label={tx('positionAny')} />}
        </View>
      )}

      {/* Class, payment, flags */}
      {(offer.vehicle_class || paymentKeys.length > 0 || flags.length > 0) && (
        <View style={styles.row}>
          {!!offer.vehicle_class && (
            <Chip
              icon="car-sport-outline"
              label={classLabels[offer.vehicle_class] ?? offer.vehicle_class}
              tone="info"
            />
          )}
          {paymentKeys.map((key) => (
            <Chip
              key={key}
              icon="wallet-outline"
              label={paymentLabels[key] ?? key}
            />
          ))}
          {flags.map((flag) => (
            <Chip key={flag} label={flag} />
          ))}
        </View>
      )}

      {!!offer.road_pickup_note && (
        <Text style={styles.pickupNote} numberOfLines={2}>
          {offer.road_pickup_note}
        </Text>
      )}

      {/* Special order — the prices the passenger is offering */}
      {!!special && (
        <View style={styles.special}>
          <Text style={styles.specialTitle}>{tx('specialOrder')}</Text>

          {specialPrices.map(([label, price]) => (
            <View key={label} style={styles.specialRow}>
              <Text style={styles.specialLabel}>{label}</Text>
              <Text style={styles.specialPrice}>
                {price} {offer.currency}
              </Text>
            </View>
          ))}

          <View style={styles.row}>
            {special.fixed_price && <Chip label={tx('fixedPrice')} />}
            {special.review_driver_offers && <Chip label={tx('reviewsOffers')} />}
            {formatMoney(special.waiting_fee_per_min) !== null && (
              <Chip
                label={`${tx('waitingFee')} ${formatMoney(special.waiting_fee_per_min)} ${tx('somPerMinute')}`}
              />
            )}
          </View>

          {!!special.free_waiting_min && (
            <Text style={styles.freeWaiting}>
              {tx('freeWaiting').replace('{count}', String(special.free_waiting_min))}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

/** "2♂ 1♀" — compact enough for a chip. */
const describeSeats = (male: number, female: number): string =>
  [male > 0 ? `${male}♂` : '', female > 0 ? `${female}♀` : ''].filter(Boolean).join(' ');

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  chipUrgent: {
    backgroundColor: '#FEE2E2',
  },
  chipInfo: {
    backgroundColor: '#DBEAFE',
  },
  chipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  chipTextUrgent: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  chipTextInfo: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  pickupNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6B7280',
  },
  special: {
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
    gap: 4,
  },
  specialTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 2,
  },
  specialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specialLabel: {
    fontSize: 12,
    color: '#374151',
  },
  specialPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  freeWaiting: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default PassengerOfferExtras;
