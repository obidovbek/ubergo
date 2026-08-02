/**
 * Location Card ("Qayerdan:" / "Qayerga:")
 *
 * The route block of the new order screen, drawn inline on the main screen as
 * in K_buyurtma001Yangi.png (owner decision 2026-07-29: no separate popup).
 *
 * Cascade: viloyat → shahar/tuman → mavze/QFY (optional, many districts have
 * none) + a free-text landmark ("mo'ljal"). The country is fixed to Uzbekistan
 * by the screen and never shown — same rule as OR-004.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import * as GeoAPI from '../../api/geo';
import type { GeoOption } from '../../api/geo';
import { GeoSelectModal } from './GeoSelectModal';

export interface LocationValue {
  province: GeoOption | null;
  cityDistrict: GeoOption | null;
  settlement: GeoOption | null;
  /** Mahalla. A sibling of `settlement`, not a child — both hang off the district. */
  neighborhood: GeoOption | null;
  landmark: string;
}

export const emptyLocation: LocationValue = {
  province: null,
  cityDistrict: null,
  settlement: null,
  neighborhood: null,
  landmark: '',
};

/**
 * "Farg'ona viloyat, Farg'ona tumani, Chimyon QFY, Yangiobod MFY/ Natarius yonida"
 * Country is intentionally left out (OR-004).
 */
export const buildLocationText = (value: LocationValue): string => {
  const parts = [
    value.province?.name,
    value.cityDistrict?.name,
    value.settlement?.name,
    value.neighborhood?.name,
  ].filter((part): part is string => !!part);

  const landmark = value.landmark.trim();
  if (parts.length === 0) return landmark;

  return landmark ? `${parts.join(', ')}/ ${landmark}` : parts.join(', ');
};

type PickerType = 'province' | 'cityDistrict' | 'settlement' | 'neighborhood';

interface LocationCardProps {
  label: string;
  /** Uzbekistan, resolved once by the screen. */
  countryId: number | null;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  /** Colour of the marker in front of the label (start vs. end of the route). */
  accent: 'start' | 'end';
  error?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  label,
  countryId,
  value,
  onChange,
  accent,
  error,
}) => {
  const { t } = useTranslation();

  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cityDistricts, setCityDistricts] = useState<GeoOption[]>([]);
  const [settlements, setSettlements] = useState<GeoOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<GeoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState<PickerType | null>(null);
  // A failed load used to be console.error only, which left the user staring at
  // an empty list that reads exactly like "this district has no settlements".
  const [loadFailed, setLoadFailed] = useState(false);

  // Deps are plain ids on purpose — passing the objects would re-fire these
  // effects on every parent render (the T-017 loop).
  const provinceId = value.province?.id ?? null;
  const cityDistrictId = value.cityDistrict?.id ?? null;

  useEffect(() => {
    if (!countryId) {
      setProvinces([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    GeoAPI.fetchGeoProvinces(countryId)
      .then((items) => {
        if (cancelled) return;
        setProvinces(items);
        setLoadFailed(false);
      })
      .catch((err) => {
        console.error('Failed to load provinces:', err);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryId]);

  useEffect(() => {
    if (!provinceId) {
      setCityDistricts([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    GeoAPI.fetchGeoCityDistricts(provinceId)
      .then((items) => {
        if (cancelled) return;
        setCityDistricts(items);
        setLoadFailed(false);
      })
      .catch((err) => {
        console.error('Failed to load city districts:', err);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [provinceId]);

  useEffect(() => {
    if (!cityDistrictId) {
      setSettlements([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    GeoAPI.fetchGeoSettlements(cityDistrictId)
      .then((items) => {
        if (cancelled) return;
        setSettlements(items);
        setLoadFailed(false);
      })
      .catch((err) => {
        console.error('Failed to load settlements:', err);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cityDistrictId]);

  // Mahallas hang off the same district as settlements, so this mirrors the
  // effect above rather than chaining off it.
  useEffect(() => {
    if (!cityDistrictId) {
      setNeighborhoods([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    GeoAPI.fetchGeoNeighborhoods(cityDistrictId)
      .then((items) => {
        if (cancelled) return;
        setNeighborhoods(items);
        setLoadFailed(false);
      })
      .catch((err) => {
        console.error('Failed to load neighborhoods:', err);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cityDistrictId]);

  const handleSelect = (option: GeoOption) => {
    switch (picker) {
      case 'province':
        // Everything below the changed level is no longer valid
        onChange({
          ...value,
          province: option,
          cityDistrict: null,
          settlement: null,
          neighborhood: null,
        });
        break;
      case 'cityDistrict':
        onChange({ ...value, cityDistrict: option, settlement: null, neighborhood: null });
        break;
      case 'settlement':
        onChange({ ...value, settlement: option });
        break;
      case 'neighborhood':
        onChange({ ...value, neighborhood: option });
        break;
    }
    setPicker(null);
  };

  const pickerTitle =
    picker === 'province'
      ? t('passengerOffers.selectProvince')
      : picker === 'cityDistrict'
        ? t('passengerOffers.selectCity')
        : picker === 'neighborhood'
          ? t('passengerOffers.selectNeighborhood')
          : t('passengerOffers.selectSettlement');

  const pickerOptions =
    picker === 'province'
      ? provinces
      : picker === 'cityDistrict'
        ? cityDistricts
        : picker === 'neighborhood'
          ? neighborhoods
          : settlements;

  const pickerSelectedId =
    picker === 'province'
      ? (value.province?.id ?? null)
      : picker === 'cityDistrict'
        ? (value.cityDistrict?.id ?? null)
        : picker === 'neighborhood'
          ? (value.neighborhood?.id ?? null)
          : (value.settlement?.id ?? null);

  const summary = buildLocationText(value);

  return (
    <View style={[styles.card, !!error && styles.cardError]}>
      <View style={styles.labelRow}>
        <View style={[styles.marker, accent === 'end' && styles.markerEnd]} />
        <Text style={styles.label}>{label}</Text>
        {loading && <ActivityIndicator size="small" color="#10B981" />}
      </View>

      <TouchableOpacity
        style={styles.select}
        onPress={() => setPicker('province')}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !value.province && styles.selectPlaceholder]}>
          {value.province?.name || t('passengerOffers.selectProvince')}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>

      {!!value.province && (
        <TouchableOpacity
          style={styles.select}
          onPress={() => setPicker('cityDistrict')}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectText, !value.cityDistrict && styles.selectPlaceholder]}>
            {value.cityDistrict?.name || t('passengerOffers.selectCity')}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </TouchableOpacity>
      )}

      {/* Only offered where the district actually has settlements */}
      {!!value.cityDistrict && settlements.length > 0 && (
        <TouchableOpacity
          style={styles.select}
          onPress={() => setPicker('settlement')}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectText, !value.settlement && styles.selectPlaceholder]}>
            {value.settlement?.name || t('passengerOffers.selectSettlement')}
          </Text>
          {!!value.settlement ? (
            <TouchableOpacity
              onPress={() => onChange({ ...value, settlement: null })}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          )}
        </TouchableOpacity>
      )}

      {/* Mahalla — same rule as settlements: only offered where the district has any */}
      {!!value.cityDistrict && neighborhoods.length > 0 && (
        <TouchableOpacity
          style={styles.select}
          onPress={() => setPicker('neighborhood')}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectText, !value.neighborhood && styles.selectPlaceholder]}>
            {value.neighborhood?.name || t('passengerOffers.selectNeighborhood')}
          </Text>
          {!!value.neighborhood ? (
            <TouchableOpacity
              onPress={() => onChange({ ...value, neighborhood: null })}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          )}
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.landmarkInput}
        value={value.landmark}
        onChangeText={(text) => onChange({ ...value, landmark: text })}
        placeholder={t('passengerOffers.landmarkPlaceholder')}
        placeholderTextColor="#9CA3AF"
        maxLength={255}
      />

      {!!summary && <Text style={styles.summary}>{summary}</Text>}

      {loadFailed && !loading && (
        <Text style={styles.errorText}>{t('passengerOffers.errorLoad')}</Text>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <GeoSelectModal
        visible={picker !== null}
        title={pickerTitle}
        options={pickerOptions}
        selectedId={pickerSelectedId}
        loading={loading}
        onSelect={handleSelect}
        onClose={() => setPicker(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  cardError: {
    borderColor: '#EF4444',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  marker: {
    width: 12,
    height: 12,
    backgroundColor: '#111827',
  },
  markerEnd: {
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    gap: 8,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  selectPlaceholder: {
    color: '#9CA3AF',
  },
  landmarkInput: {
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
  summary: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: '#111827',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EF4444',
  },
});

export default LocationCard;
