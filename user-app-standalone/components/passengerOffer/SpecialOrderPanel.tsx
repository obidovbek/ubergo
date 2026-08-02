/**
 * Special Order Panel ("Maxsus buyurtma")
 *
 * Collapsed behind a bar on the order screen; expanding it reveals the price
 * list the passenger is willing to pay, and its own submit button.
 *
 * DATA ONLY — the "pullik" / "3000 so'm/birlik" wording comes straight from the
 * Figma, but nothing is charged anywhere. Real payments are T-006.
 */

import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import { CheckRow } from './CheckRow';

/** Prices are kept as typed strings ("150 000") and parsed on submit. */
export interface SpecialOrderValue {
  priceFront: string;
  priceBack: string;
  priceBackSalon: string;
  priceWholeSalon: string;
  reviewDriverOffers: boolean;
  fixedPrice: boolean;
  waitingFeePerMin: string;
}

export const emptySpecialOrder: SpecialOrderValue = {
  priceFront: '',
  priceBack: '',
  priceBackSalon: '',
  priceWholeSalon: '',
  reviewDriverOffers: false,
  fixedPrice: false,
  waitingFeePerMin: '',
};

/** Free waiting time is a fixed promise of the product, not an input. */
export const FREE_WAITING_MINUTES = 10;

/** "150000" → "150 000" */
export const formatMoney = (value: string): string =>
  value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** "150 000" → 150000, or null when the field was left empty. */
export const parseMoney = (value: string): number | null => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : null;
};

export const hasAnySeatPrice = (value: SpecialOrderValue): boolean =>
  [value.priceFront, value.priceBack, value.priceBackSalon, value.priceWholeSalon].some(
    (price) => parseMoney(price) !== null
  );

interface SpecialOrderPanelProps {
  expanded: boolean;
  onToggle: () => void;
  value: SpecialOrderValue;
  onChange: (value: SpecialOrderValue) => void;
  onSubmit: () => void;
  disabled?: boolean;
  error?: string;
}

export const SpecialOrderPanel: React.FC<SpecialOrderPanelProps> = ({
  expanded,
  onToggle,
  value,
  onChange,
  onSubmit,
  disabled = false,
  error,
}) => {
  const { t } = useTranslation();

  const priceRow = (
    label: string,
    key: 'priceFront' | 'priceBack' | 'priceBackSalon' | 'priceWholeSalon'
  ) => (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <TextInput
        style={styles.priceInput}
        value={value[key]}
        onChangeText={(text) => onChange({ ...value, [key]: formatMoney(text) })}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor="#9CA3AF"
        textAlign="center"
        maxLength={11}
      />
      <Text style={styles.priceCurrency}>{t('passengerOffers.currencySom')}</Text>
    </View>
  );

  return (
    <View>
      <TouchableOpacity style={styles.toggle} onPress={onToggle} activeOpacity={0.8}>
        <Text style={styles.toggleText}>{t('passengerOffers.specialOrderToggle')}</Text>
        <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={20} color="#1E3A8A" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.panel}>
          <Text style={styles.title}>{t('passengerOffers.specialOrderTitle')}</Text>
          <Text style={styles.priceNotice}>{t('passengerOffers.specialOrderPrice')}</Text>
          <Text style={styles.intro}>{t('passengerOffers.specialOrderIntro')}</Text>

          <Text style={styles.pricesHeading}>{t('passengerOffers.specialOrderPrices')}</Text>

          {priceRow(t('passengerOffers.priceFront'), 'priceFront')}
          {priceRow(t('passengerOffers.priceBack'), 'priceBack')}
          {priceRow(t('passengerOffers.priceBackSalon'), 'priceBackSalon')}
          {priceRow(t('passengerOffers.priceWholeSalon'), 'priceWholeSalon')}

          <CheckRow
            label={t('passengerOffers.reviewDriverOffers')}
            checked={value.reviewDriverOffers}
            onPress={() => onChange({ ...value, reviewDriverOffers: !value.reviewDriverOffers })}
          />
          <CheckRow
            label={t('passengerOffers.fixedPrice')}
            checked={value.fixedPrice}
            onPress={() => onChange({ ...value, fixedPrice: !value.fixedPrice })}
          />

          <View style={styles.waitingRow}>
            <Text style={styles.priceLabel}>{t('passengerOffers.waiting')}</Text>
            <TextInput
              style={[styles.priceInput, styles.waitingInput]}
              value={value.waitingFeePerMin}
              onChangeText={(text) => onChange({ ...value, waitingFeePerMin: formatMoney(text) })}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              textAlign="center"
              maxLength={9}
            />
            <Text style={styles.priceCurrency}>{t('passengerOffers.somPerMinute')}</Text>
          </View>

          <Text style={styles.freeWaiting}>{t('passengerOffers.freeWaiting')}</Text>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submit, disabled && styles.submitDisabled]}
            onPress={onSubmit}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>{t('passengerOffers.specialOrderToggle')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#BFDBFE',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  panel: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  priceNotice: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  intro: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  pricesHeading: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priceLabel: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  priceInput: {
    width: 120,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    backgroundColor: '#DBEAFE',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  priceCurrency: {
    width: 78,
    fontSize: 14,
    color: '#374151',
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  waitingInput: {
    backgroundColor: '#FEF08A',
    borderColor: '#CA8A04',
  },
  freeWaiting: {
    marginTop: 6,
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
  submit: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
});

export default SpecialOrderPanel;
