/**
 * Offer Wizard Screen
 * 4-step wizard for creating/editing driver offers
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
// T-101 step 16a — the wizard's rules, lifted out pure so they can be executed and proven
// able to fail (`scripts/check-offer-validation.mjs`). See that file for WHY submit must
// use `validateAll` before step 16d removes the pagination.
import {
  buildLocationText,
  clampSeats,
  resolveEndpointSelection,
  resolveLocationText,
  validateAll,
  isValid,
  type OfferValidationInput,
} from '../utils/offerWizardValidation';
// T-101 step 16b — the form's sections, cut out in the order `DriverElon.dc.html`
// draws them. The wizard still paginates over them; step 16d deletes the pagination.
import {
  CarSection,
  ChipSelectSection,
  FormField,
  NumberField,
  RouteEndpointSection,
  RouteSwapButton,
  ScheduleSheet,
  SectionCard,
  ToggleSection,
} from '../components/offerWizard';
import { BackButton } from '../components/BackButton';
import { getErrorMessage } from '../utils/errorHandler';
import { formatDateByLanguage } from '../utils/date';
import * as DriverOffersAPI from '../api/driverOffers';
import type { CreateOfferData, DriverOffer } from '../api/driverOffers';
import * as DriverAPI from '../api/driver';
import type { DriverProfile, GeoOption } from '../api/driver';
// T-101 step 16c — the app's own geo cascade, adopted at last. Its header lists
// this screen as one of the seven places that had re-implemented it by hand;
// `GeoPickerModal` and the three copies behind it are gone from this screen.
import { GeoSheet, type GeoPath } from '../components/geo/GeoSheet';
// T-101 step 16c-2 — the departure window / arrival deadline rules, pure and executed
// by `scripts/check-offer-schedule.mjs`. See that file for the defect they prevent.
import {
  clampSlot,
  firstSelectableSlotToday,
  restoreSchedule,
  slotToDate,
  slotToLabel,
  toSchedulePayload,
  validateScheduleWindow,
  type ScheduleInput,
  type WindowSelection,
} from '../utils/offerSchedule';

const theme = createTheme('light');

/**
 * T-078 — read a number the API may send as a DECIMAL **string**.
 *
 * 🔴 The point of this over `Number(x) || undefined` is that it KEEPS a
 * legitimate `0`. "Joyidan olish + 0 so'm" (free door pickup) and
 * "bepul kutish 0 minut" are real answers the driver typed; `||` would silently
 * turn both into "not set" and the next save would blank them.
 */
/** T-078 — the mockup's five radios, in its own order. */
const VEHICLE_CLASSES = [
  'standard',
  'comfort',
  'business',
  'econom',
  'tourist',
] as const;

/**
 * T-101 step 16b — the two INDEPENDENT checkbox groups, named once.
 *
 * 🔴 These are the arrays `ChipSelectSection` filters to decide what is on. They must
 * stay in step with the chip lists in `renderStep3`: a key present there and missing
 * here renders a chip that can never look selected.
 */
const PAYMENT_KEYS = ['payment_cash', 'payment_card'] as const;
const AMENITY_KEYS = ['air_conditioner', 'wifi', 'roof_rack_needed', 'trailer'] as const;

const numOrUndef = (raw: unknown): number | undefined => {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

interface VehicleOption {
  id: string;
  label: string;
}

export const OfferWizardScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { offerId } = route.params || {};
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!offerId);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [existingOffer, setExistingOffer] = useState<DriverOffer | null>(null);

  // Date/Time picker states

  // Geo selection states for "From" location
  const [fromCountry, setFromCountry] = useState<GeoOption | null>(null);
  const [fromProvince, setFromProvince] = useState<GeoOption | null>(null);
  const [fromCity, setFromCity] = useState<GeoOption | null>(null);
  const [selectedFromCities, setSelectedFromCities] = useState<GeoOption[]>([]);

  // Geo selection states for "To" location
  const [toCountry, setToCountry] = useState<GeoOption | null>(null);
  const [toProvince, setToProvince] = useState<GeoOption | null>(null);
  const [toCity, setToCity] = useState<GeoOption | null>(null);
  const [selectedToCities, setSelectedToCities] = useState<GeoOption[]>([]);

  // Stops selection states
  const [stops, setStops] = useState<Array<{ id: string; city: GeoOption | null; selectedCities?: GeoOption[]; country: GeoOption | null; province: GeoOption | null; label_text: string; lat?: number; lng?: number }>>([]);
  const [stopProvinces, setStopProvinces] = useState<Record<string, GeoOption[]>>({});
  const [stopCities, setStopCities] = useState<Record<string, GeoOption[]>>({});

  // Form data
  const [formData, setFormData] = useState<Partial<CreateOfferData>>({
    vehicle_id: '',
    from_text: '',
    to_text: '',
    start_at: '',
    seats_total: 1,
    price_per_seat: 5000,
    front_price_per_seat: undefined,
    currency: 'UZS',
    note: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing offer if editing
  useEffect(() => {
    if (offerId && token) {
      loadExistingOffer();
    } else if (token) {
      loadVehicles();
    }
  }, [offerId, token]);

  // Load vehicles
  useEffect(() => {
    if (!offerId && token) {
      loadVehicles();
    }
  }, [token]);

  // Load initial geo data
  useEffect(() => {
    if (token) {
      loadGeoCountries();
    }
  }, [token]);

  const loadGeoCountries = async () => {
    try {
      const countries = await DriverAPI.fetchGeoCountries();
      
      // Set Uzbekistan as default for "From" if not already set
      const uzbekistan = countries.find(country => 
        country.name.toLowerCase().includes('zbekistan') ||
        country.name.toLowerCase().includes('uzbekiston') ||
        country.name.toLowerCase().includes('o\'zbekiston')
      );
      
      if (uzbekistan && !fromCountry && !offerId) {
        setFromCountry(uzbekistan);
        await loadFromProvinces(uzbekistan.id);
      }
      
      // Set Uzbekistan as default for "To" if not already set
      if (uzbekistan && !toCountry && !offerId) {
        setToCountry(uzbekistan);
        await loadToProvinces(uzbekistan.id);
      }
    } catch (error: any) {
      console.error('Failed to load countries:', error);
    }
  };

  const loadFromProvinces = async (countryId: number) => {
    try {
      const provinces = await DriverAPI.fetchGeoProvinces(countryId);
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      showToast.error('Xatolik', 'Viloyatlarni yuklashda xatolik');
    } finally {
    }
  };

  const loadToProvinces = async (countryId: number) => {
    try {
      const provinces = await DriverAPI.fetchGeoProvinces(countryId);
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      showToast.error('Xatolik', 'Viloyatlarni yuklashda xatolik');
    } finally {
    }
  };

  const loadExistingOffer = async () => {
    if (!token) return;

    try {
      setInitialLoading(true);
      const response = await DriverOffersAPI.getDriverOfferById(token, offerId);
      if (response.success && response.offer) {
        const offer = response.offer;
        setExistingOffer(offer);
        
        // Check if offer is archived or cancelled - prevent editing
        if (offer.status === 'archived' || offer.status === 'cancelled') {
          showToast.error(
            'Xatolik',
            offer.status === 'archived' 
              ? 'Arxivlangan e\'lonni tahrirlash mumkin emas'
              : 'Bekor qilingan e\'lonni tahrirlash mumkin emas'
          );
          navigation.goBack();
          return;
        }
        
        // Load countries first and get the result directly
        const countries = await DriverAPI.fetchGeoCountries();
        
        // Pre-fill form data

        /*
         * T-101 step 16c-2 — put the saved instants back onto the ruler.
         *
         * 🛑 This is the half line 296 warns about: a field that saves but never loads
         * back means the NEXT save silently blanks it. The departure window is the
         * newest place that could happen, so the conversion is pure and asserted
         * (`restoreSchedule`), not written inline here.
         *
         * ⚠️ `null` is a real answer — an offer whose start_at falls outside the four
         * days the sheet offers keeps its stored value in `formData` and simply does
         * not move the ruler, rather than snapping the driver to today.
         */
        const restored = restoreSchedule(
          scheduleDays,
          offer.start_at,
          offer.depart_until,
          offer.arrive_until,
        );
        if (restored) {
          setDepartDayIndex(restored.dayIndex);
          setDepartWindow(restored.window);
          setArriveDayIndex(restored.arriveDayIndex);
          setArriveSlot(restored.arriveSlot);
        }
        
        setFormData({
          vehicle_id: offer.vehicle_id,
          from_text: offer.from_text,
          to_text: offer.to_text,
          from_lat: offer.from_lat || undefined,
          from_lng: offer.from_lng || undefined,
          to_lat: offer.to_lat || undefined,
          to_lng: offer.to_lng || undefined,
          start_at: offer.start_at,
          seats_total: offer.seats_total,
          price_per_seat: offer.price_per_seat,
          front_price_per_seat: (offer as any).front_price_per_seat || undefined,
          /*
            T-078 — these MUST load back, or the next save silently blanks them.
            A field that writes but never reads is how this card fails without
            anything erroring.

            🔴 `numOrUndef`, not `|| undefined`: pg sends DECIMAL as a STRING,
            and `||` would also throw away a legitimate **0** — and 0 is a real
            answer for `pickup_fee` ("Joyidan olish + 0 so'm", exactly as the
            mockup draws it) and for `free_waiting_min`.
            🔴 `?? undefined` for the payment flags, never `||`: `false` is a
            real answer ("I do not take card") and `||` would erase it into
            "not stated".
          */
          price_back_salon: numOrUndef(offer.price_back_salon),
          price_whole_salon: numOrUndef(offer.price_whole_salon),
          waiting_fee_per_min: numOrUndef(offer.waiting_fee_per_min),
          free_waiting_min: numOrUndef(offer.free_waiting_min),
          pickup_fee: numOrUndef(offer.pickup_fee),
          payment_cash: offer.payment_cash ?? undefined,
          payment_card: offer.payment_card ?? undefined,
          vehicle_class: offer.vehicle_class ?? undefined,
          // T-079/T-080 — same rule as above: `?? undefined`, never `||`, or a
          // deliberate `false` ("no air conditioner") reads as "not stated".
          air_conditioner: offer.air_conditioner ?? undefined,
          wifi: offer.wifi ?? undefined,
          roof_rack_needed: offer.roof_rack_needed ?? undefined,
          trailer: offer.trailer ?? undefined,
          parcel_accepted: offer.parcel_accepted ?? undefined,
          parcel_price: numOrUndef(offer.parcel_price),
          parcel_max_kg: numOrUndef(offer.parcel_max_kg),
          road_pickup: offer.road_pickup ?? undefined,
          road_pickup_note: offer.road_pickup_note ?? undefined,
          depart_until: offer.depart_until ?? undefined,
          arrive_from: offer.arrive_from ?? undefined,
          arrive_until: offer.arrive_until ?? undefined,
          departs_when_full: offer.departs_when_full ?? undefined,
          currency: offer.currency,
          note: offer.note || '',
        });

        // Parse and populate "From" location geo selections
        let loadedFromCountry: GeoOption | null = null;
        let loadedFromProvince: GeoOption | null = null;
        let loadedFromCity: GeoOption | null = null;
        let loadedFromCities: GeoOption[] = [];

        if (offer.from_text) {
          // Check if from_text contains multiple cities (comma-separated, no province/country)
          const fromTextParts = offer.from_text.split(',').map(p => p.trim());
          const hasMultipleCities = fromTextParts.length > 1 && !fromTextParts.some(p => 
            // Check if any part looks like a province/country (longer, common province names)
            p.toLowerCase().includes('viloyat') || p.toLowerCase().includes('respublik')
          );

          if (hasMultipleCities) {
            // Multiple cities in from_text - parse first one to get country/province
            const firstCityGeo = await parseLocationText(fromTextParts[0], countries);
            if (firstCityGeo.country && firstCityGeo.province) {
              loadedFromCountry = firstCityGeo.country;
              setFromCountry(firstCityGeo.country);
              const provinces = await DriverAPI.fetchGeoProvinces(firstCityGeo.country.id);
              
              loadedFromProvince = firstCityGeo.province;
              setFromProvince(firstCityGeo.province);
              const cities = await DriverAPI.fetchGeoCityDistricts(firstCityGeo.province.id);

              // Parse all cities from from_text
              for (const cityName of fromTextParts) {
                const foundCity = cities.find(c => 
                  c.name.toLowerCase() === cityName.toLowerCase() ||
                  c.name.toLowerCase().includes(cityName.toLowerCase()) ||
                  cityName.toLowerCase().includes(c.name.toLowerCase())
                );
                if (foundCity && !loadedFromCities.some(c => c.id === foundCity.id)) {
                  loadedFromCities.push(foundCity);
                }
              }
            }
          } else {
            // Single city or full location format
            const fromGeo = await parseLocationText(offer.from_text, countries);
            if (fromGeo.country) {
              loadedFromCountry = fromGeo.country;
              setFromCountry(fromGeo.country);
              const provinces = await DriverAPI.fetchGeoProvinces(fromGeo.country.id);
              if (fromGeo.province) {
                loadedFromProvince = fromGeo.province;
                setFromProvince(fromGeo.province);
                const cities = await DriverAPI.fetchGeoCityDistricts(fromGeo.province.id);
                if (fromGeo.city) {
                  loadedFromCity = fromGeo.city;
                  setFromCity(fromGeo.city);
                  loadedFromCities.push(fromGeo.city);
                }
              }
            }
          }
        }

        // Parse and populate "To" location geo selections
        let loadedToCountry: GeoOption | null = null;
        let loadedToProvince: GeoOption | null = null;
        let loadedToCity: GeoOption | null = null;
        let loadedToCities: GeoOption[] = [];

        if (offer.to_text) {
          // Check if to_text contains multiple cities (comma-separated, no province/country)
          const toTextParts = offer.to_text.split(',').map(p => p.trim());
          const hasMultipleCities = toTextParts.length > 1 && !toTextParts.some(p => 
            // Check if any part looks like a province/country (longer, common province names)
            p.toLowerCase().includes('viloyat') || p.toLowerCase().includes('respublik')
          );

          if (hasMultipleCities) {
            // Multiple cities in to_text - parse first one to get country/province
            const firstCityGeo = await parseLocationText(toTextParts[0], countries);
            if (firstCityGeo.country && firstCityGeo.province) {
              loadedToCountry = firstCityGeo.country;
              setToCountry(firstCityGeo.country);
              const provinces = await DriverAPI.fetchGeoProvinces(firstCityGeo.country.id);
              
              loadedToProvince = firstCityGeo.province;
              setToProvince(firstCityGeo.province);
              const cities = await DriverAPI.fetchGeoCityDistricts(firstCityGeo.province.id);

              // Parse all cities from to_text
              for (const cityName of toTextParts) {
                const foundCity = cities.find(c => 
                  c.name.toLowerCase() === cityName.toLowerCase() ||
                  c.name.toLowerCase().includes(cityName.toLowerCase()) ||
                  cityName.toLowerCase().includes(c.name.toLowerCase())
                );
                if (foundCity && !loadedToCities.some(c => c.id === foundCity.id)) {
                  loadedToCities.push(foundCity);
                }
              }
            }
          } else {
            // Single city or full location format
            const toGeo = await parseLocationText(offer.to_text, countries);
            if (toGeo.country) {
              loadedToCountry = toGeo.country;
              setToCountry(toGeo.country);
              const provinces = await DriverAPI.fetchGeoProvinces(toGeo.country.id);
              if (toGeo.province) {
                loadedToProvince = toGeo.province;
                setToProvince(toGeo.province);
                const cities = await DriverAPI.fetchGeoCityDistricts(toGeo.province.id);
                if (toGeo.city) {
                  loadedToCity = toGeo.city;
                  setToCity(toGeo.city);
                  loadedToCities.push(toGeo.city);
                }
              }
            }
          }
        }

        // Load stops if they exist
        // Separate stops that belong to From/To multi-city selections from true intermediate stops
        const trueIntermediateStops: Array<{ id: string; city: GeoOption | null; selectedCities?: GeoOption[]; country: GeoOption | null; province: GeoOption | null; label_text: string; lat?: number; lng?: number }> = [];
        
        if (offer.stops && offer.stops.length > 0) {
          for (let index = 0; index < offer.stops.length; index++) {
            const stop = offer.stops[index];
            let country: GeoOption | null = null;
            let province: GeoOption | null = null;
            let city: GeoOption | null = null;

            if (stop.label_text) {
              const stopGeo = await parseLocationText(stop.label_text, countries);
              country = stopGeo.country;
              province = stopGeo.province;
              city = stopGeo.city;

              // Check if this stop belongs to From multi-city selection
              if (country && province && city && 
                  loadedFromCountry && loadedFromProvince &&
                  country.id === loadedFromCountry.id && 
                  province.id === loadedFromProvince.id) {
                // This is an additional From city, add to selectedFromCities
                // Don't add if it's the same as the primary fromCity
                if (loadedFromCity && city.id === loadedFromCity.id) {
                  // This is the primary city, skip it (already in loadedFromCities)
                  continue;
                }
                if (!loadedFromCities.some(c => c.id === city!.id)) {
                  loadedFromCities.push(city);
                }
                continue; // Skip adding to stops
              }

              // Check if this stop belongs to To multi-city selection
              if (country && province && city &&
                  loadedToCountry && loadedToProvince &&
                  country.id === loadedToCountry.id && 
                  province.id === loadedToProvince.id) {
                // This is an additional To city, add to selectedToCities
                // Don't add if it's the same as the primary toCity
                if (loadedToCity && city.id === loadedToCity.id) {
                  // This is the primary city, skip it (already in loadedToCities)
                  continue;
                }
                if (!loadedToCities.some(c => c.id === city!.id)) {
                  loadedToCities.push(city);
                }
                continue; // Skip adding to stops
              }

              // This is a true intermediate stop (different location)
              // Load provinces and cities if country/province found
              if (country) {
                const provinces = await DriverAPI.fetchGeoProvinces(country.id);
                setStopProvinces(prev => ({ ...prev, [`stop-${index}`]: provinces }));
                if (province) {
                  const cities = await DriverAPI.fetchGeoCityDistricts(province.id);
                  setStopCities(prev => ({ ...prev, [`stop-${index}`]: cities }));
                }
              }

              trueIntermediateStops.push({
                id: `stop-${index}`,
                city,
                country,
                province,
                label_text: stop.label_text,
                lat: stop.lat || undefined,
                lng: stop.lng || undefined,
              });
            }
          }

          // Update selectedFromCities and selectedToCities with additional cities
          // Combine primary city (from from_text/to_text) with additional cities (from stops)
          // When multiple cities: all cities go in selectedFromCities/selectedToCities, clear single city
          // When single city: set as fromCity/toCity, selectedFromCities/selectedToCities empty
          if (loadedFromCities.length > 1) {
            // Multiple cities: all go in selectedFromCities, clear single city
            // Primary city is first, additional cities follow
            setFromCity(null);
            setSelectedFromCities(loadedFromCities);
          } else if (loadedFromCities.length === 1) {
            // Single city: set as fromCity, clear selectedFromCities
            setFromCity(loadedFromCities[0]);
            setSelectedFromCities([]);
          }
          
          if (loadedToCities.length > 1) {
            // Multiple cities: all go in selectedToCities, clear single city
            // Primary city is first, additional cities follow
            setToCity(null);
            setSelectedToCities(loadedToCities);
          } else if (loadedToCities.length === 1) {
            // Single city: set as toCity, clear selectedToCities
            setToCity(loadedToCities[0]);
            setSelectedToCities([]);
          }

          setStops(trueIntermediateStops);
        }

        // Load vehicles after setting form data
        await loadVehicles();
      }
    } catch (error: any) {
      console.error('Failed to load offer:', error);
      const errorMsg = getErrorMessage(error, t, 'errors.loadFailed');
      showToast.error(t('common.error'), errorMsg);
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const loadVehicles = async () => {
    if (!token) return;

    try {
      // Load driver's profile with attached vehicle
      const profileResponse = await DriverAPI.getDriverProfile(token);
      const profile = profileResponse.profile as any;
      const vehicle = profile?.vehicle;

      if (vehicle && vehicle.id) {
        // Build a nice label: Make Model • Plate • Year
        const parts: string[] = [];
        if (vehicle.make?.name_uz || vehicle.make?.name) {
          parts.push(vehicle.make.name_uz || vehicle.make.name);
        }
        if (vehicle.model?.name_uz || vehicle.model?.name) {
          parts.push(vehicle.model.name_uz || vehicle.model.name);
        }
        if (vehicle.license_plate) {
          parts.push(vehicle.license_plate);
        }
        if (vehicle.year) {
          parts.push(String(vehicle.year));
        }

        const label = parts.join(' • ') || 'Transport vositasi';
        setVehicles([{ id: vehicle.id, label }]);

        // Pre-fill vehicle_id and default seats from seating_capacity if not set
        setFormData(prev => ({
          ...prev,
          vehicle_id: prev.vehicle_id || vehicle.id,
          seats_total:
            prev.seats_total && prev.seats_total > 0
              ? prev.seats_total
              : Math.min(Math.max(vehicle.seating_capacity || 1, 1), 8),
        }));
        setErrors(prev => ({ ...prev, vehicle_id: '' }));
      } else {
        setVehicles([]);
      }
    } catch (error: any) {
      console.error('Failed to load vehicles:', error);
      showToast.error('Xatolik', 'Transport vositalarini yuklashda xatolik');
    }
  };

  /**
   * T-101 step 16a — the current state, in the shape the pure rules read.
   *
   * Gathering it in ONE place is what stops the section validators and `validateAll` drifting apart:
   * both are handed the same snapshot, so a rule cannot see different data depending on which
   * entry point called it.
   */
  const validationInput = (): OfferValidationInput => ({
    form: formData,
    from: {
      country: fromCountry,
      province: fromProvince,
      city: fromCity,
      cities: selectedFromCities,
    },
    to: { country: toCountry, province: toProvince, city: toCity, cities: selectedToCities },
  });

  /** Translate the rules' KEYS into the messages the form shows. */
  const applyErrors = (raw: Record<string, string>): boolean => {
    const translated: Record<string, string> = {};
    for (const [field, key] of Object.entries(raw)) translated[field] = t(key);
    setErrors(translated);
    return isValid(raw);
  };

  /**
   * 🛑 EVERY rule. This is what submit uses.
   *
   * The old `handleSave` called `validateStep(currentStep)` — one step's worth of checks. The
   * pagination made that safe by accident; step 16d removed the pagination, so this is now
   * the ONLY thing standing between a half-filled form and the API.
   */
  const validateEverything = (): boolean => applyErrors(validateAll(validationInput()));

  // Parse location text and find matching geo options
  // Supports formats: "City, Province" or "City, Province, Country"
  const parseLocationText = async (
    locationText: string,
    countries: GeoOption[]
  ): Promise<{ country: GeoOption | null; province: GeoOption | null; city: GeoOption | null }> => {
    if (!locationText || !countries || countries.length === 0) {
      return { country: null, province: null, city: null };
    }

    // Split by comma and trim
    const parts = locationText.split(',').map(p => p.trim()).filter(p => p);
    
    if (parts.length === 0) {
      return { country: null, province: null, city: null };
    }

    let country: GeoOption | null = null;
    let province: GeoOption | null = null;
    let city: GeoOption | null = null;

    // Determine format:
    // - 1 part: could be city only
    // - 2 parts: City, Province (most common)
    // - 3 parts: City, Province, Country

    if (parts.length === 1) {
      // Only city name - search all countries/provinces for this city
      for (const c of countries) {
        try {
          const provinces = await DriverAPI.fetchGeoProvinces(c.id);
          for (const p of provinces) {
            try {
              const cities = await DriverAPI.fetchGeoCityDistricts(p.id);
              const foundCity = cities.find(city => 
                city.name.toLowerCase() === parts[0].toLowerCase() ||
                city.name.toLowerCase().includes(parts[0].toLowerCase()) ||
                parts[0].toLowerCase().includes(city.name.toLowerCase())
              );
              if (foundCity) {
                country = c;
                province = p;
                city = foundCity;
                return { country, province, city };
              }
            } catch (error) {
              // Continue to next province
            }
          }
        } catch (error) {
          // Continue to next country
        }
      }
    } else if (parts.length === 2) {
      // Format: "City, Province" - search for province in all countries
      const cityName = parts[0].toLowerCase();
      const provinceName = parts[1].toLowerCase();
      
      for (const c of countries) {
        try {
          const provinces = await DriverAPI.fetchGeoProvinces(c.id);
          const foundProvince = provinces.find(p => 
            p.name.toLowerCase() === provinceName ||
            p.name.toLowerCase().includes(provinceName) ||
            provinceName.includes(p.name.toLowerCase())
          );
          if (foundProvince) {
            country = c;
            province = foundProvince;
            
            // Try to match city
            try {
              const cities = await DriverAPI.fetchGeoCityDistricts(foundProvince.id);
              city = cities.find(c => 
                c.name.toLowerCase() === cityName ||
                c.name.toLowerCase().includes(cityName) ||
                cityName.includes(c.name.toLowerCase())
              ) || null;
            } catch (error) {
              console.error('Failed to load cities:', error);
            }
            break;
          }
        } catch (error) {
          // Continue to next country
        }
      }
    } else if (parts.length >= 3) {
      // Format: "City, Province, Country" - try to match country first
      const cityName = parts[0].toLowerCase();
      const provinceName = parts[parts.length - 2].toLowerCase();
      const countryName = parts[parts.length - 1].toLowerCase();
      
      // Try to match country
      country = countries.find(c => 
        c.name.toLowerCase() === countryName ||
        c.name.toLowerCase().includes(countryName) ||
        countryName.includes(c.name.toLowerCase())
      ) || null;

      if (country) {
        // Country found, try to match province
        try {
          const provinces = await DriverAPI.fetchGeoProvinces(country.id);
          province = provinces.find(p => 
            p.name.toLowerCase() === provinceName ||
            p.name.toLowerCase().includes(provinceName) ||
            provinceName.includes(p.name.toLowerCase())
          ) || null;

          // Try to match city
          if (province) {
            try {
              const cities = await DriverAPI.fetchGeoCityDistricts(province.id);
              city = cities.find(c => 
                c.name.toLowerCase() === cityName ||
                c.name.toLowerCase().includes(cityName) ||
                cityName.includes(c.name.toLowerCase())
              ) || null;
            } catch (error) {
              console.error('Failed to load cities:', error);
            }
          }
        } catch (error) {
          console.error('Failed to load provinces:', error);
        }
      } else {
        // Country not found, search all countries for province
        for (const c of countries) {
          try {
            const provinces = await DriverAPI.fetchGeoProvinces(c.id);
            const foundProvince = provinces.find(p => 
              p.name.toLowerCase() === provinceName ||
              p.name.toLowerCase().includes(provinceName) ||
              provinceName.includes(p.name.toLowerCase())
            );
            if (foundProvince) {
              country = c;
              province = foundProvince;
              
              // Try to match city
              try {
                const cities = await DriverAPI.fetchGeoCityDistricts(foundProvince.id);
                city = cities.find(c => 
                  c.name.toLowerCase() === cityName ||
                  c.name.toLowerCase().includes(cityName) ||
                  cityName.includes(c.name.toLowerCase())
                ) || null;
              } catch (error) {
                console.error('Failed to load cities:', error);
              }
              break;
            }
          } catch (error) {
            // Continue to next country
          }
        }
      }
    }

    return { country, province, city };
  };

  // Stop management functions
  const addStop = () => {
    const newStop = {
      id: `stop-${Date.now()}`,
      city: null as GeoOption | null,
      country: null as GeoOption | null,
      province: null as GeoOption | null,
      label_text: '',
      lat: undefined,
      lng: undefined,
    };
    setStops([...stops, newStop]);
  };

  const removeStop = (stopId: string) => {
    setStops(stops.filter(s => s.id !== stopId));
    // Clean up related state
    const newStopProvinces = { ...stopProvinces };
    const newStopCities = { ...stopCities };
    delete newStopProvinces[stopId];
    delete newStopCities[stopId];
    setStopProvinces(newStopProvinces);
    setStopCities(newStopCities);
  };

  const handleSave = async () => {
    // T-101 step 16a: EVERY section, not just the one on screen. See validateEverything.
    if (!validateEverything()) {
      return;
    }

    if (!token) {
      showToast.error('Xatolik', 'Autentifikatsiya kerak');
      return;
    }

    setLoading(true);
    try {

      // Prepare stops data
      // Filter out stops that are duplicates of From/To cities and expand multiple cities into separate stops
      const intermediateStops: Array<{ label_text: string; lat?: number; lng?: number; order_no: number }> = [];
      let orderNo = 1;
      
      stops.forEach(stop => {
        // Skip empty stops
        if (!stop.city && (!stop.selectedCities || stop.selectedCities.length === 0)) return;
        
        // Handle multiple cities in a stop
        if (stop.selectedCities && stop.selectedCities.length > 0) {
          stop.selectedCities.forEach(city => {
            // Don't include cities that match From/To
            if (fromCity && city.id === fromCity.id) return;
            if (selectedFromCities.some(c => c.id === city.id)) return;
            if (toCity && city.id === toCity.id) return;
            if (selectedToCities.some(c => c.id === city.id)) return;
            
            intermediateStops.push({
              label_text: buildLocationText(stop.country, stop.province, city),
              lat: city.latitude || undefined,
              lng: city.longitude || undefined,
              order_no: orderNo++,
            });
          });
        } else if (stop.city) {
          // Single city stop
          // Don't include if it matches From/To
          if (fromCity && stop.city.id === fromCity.id) return;
          if (selectedFromCities.some(c => c.id === stop.city!.id)) return;
          if (toCity && stop.city.id === toCity.id) return;
          if (selectedToCities.some(c => c.id === stop.city!.id)) return;
          
          intermediateStops.push({
            label_text: stop.label_text || buildLocationText(stop.country, stop.province, stop.city),
            lat: stop.lat,
            lng: stop.lng,
            order_no: orderNo++,
          });
        }
      });

      // Include additional From cities (except first one which is primary)
      const fromStops = selectedFromCities.length > 1 
        ? selectedFromCities.slice(1).map((city, index) => ({
            label_text: buildLocationText(fromCountry, fromProvince, city),
            lat: city.latitude || undefined,
            lng: city.longitude || undefined,
            order_no: intermediateStops.length + index + 1,
          }))
        : [];

      // Include additional To cities (except first one which is primary)
      const toStops = selectedToCities.length > 1
        ? selectedToCities.slice(1).map((city, index) => ({
            label_text: buildLocationText(toCountry, toProvince, city),
            lat: city.latitude || undefined,
            lng: city.longitude || undefined,
            order_no: intermediateStops.length + fromStops.length + index + 1,
          }))
        : [];

      // Combine: intermediate stops first, then additional From cities, then additional To cities
      const stopsData = [...intermediateStops, ...fromStops, ...toStops];

      const offerDataWithStops = {
        ...formData,
        stops: stopsData.length > 0 ? stopsData : undefined,
      };

      if (offerId) {
        // Update existing offer
        const response = await DriverOffersAPI.updateDriverOffer(
          token,
          offerId,
          offerDataWithStops
        );
        if (response.success) {
          showToast.success(t('common.success'), t('offerWizard.updateSuccess'));
        }
      } else {
        // Create new offer (automatically published)
        const response = await DriverOffersAPI.createDriverOffer(
          token,
          offerDataWithStops as CreateOfferData
        );
        if (response.success && response.offer) {
          showToast.success(t('common.success'), t('offerWizard.createSuccess'));
        }
      }

      // Offer is created/updated with published status by default
      // No need to submit separately - offers are published immediately

      // Refresh the offers list by navigating back and triggering a refresh
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to save offer:', error);
      const errorMsg = getErrorMessage(error, t, 'errors.saveFailed');
      showToast.error(t('common.error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ── T-101 step 16c: one sheet for every place on this screen ──────────────
   *
   * 🔴 `GeoSheet` ALREADY EXISTED IN THIS APP and its own header names
   * `OfferWizardScreen` as one of the SEVEN places that had re-implemented the
   * cascade by hand. `SearchPassengerOffersScreen` adopted it during T-101; this
   * screen never did, and kept three more copies (from · to · every stop).
   *
   * The sheet owns the fetching, the "clear the child when the parent changes"
   * rule, the search box and the multi-select. This screen now owns only the
   * ANSWER.
   */
  const [geoSheet, setGeoSheet] = useState<
    { endpoint: 'from' | 'to' } | { endpoint: 'stop'; stopId: string } | null
  >(null);

  /** The resolved place for an endpoint's row, or '' while nothing is picked. */
  const endpointLine = (which: 'from' | 'to'): string =>
    resolveLocationText(
      which === 'from'
        ? { country: fromCountry, province: fromProvince, city: fromCity, cities: selectedFromCities }
        : { country: toCountry, province: toProvince, city: toCity, cities: selectedToCities },
      undefined,
    );

  const stopLine = (stop: { country: GeoOption | null; province: GeoOption | null; city: GeoOption | null; selectedCities?: GeoOption[] }): string =>
    resolveLocationText(
      {
        country: stop.country,
        province: stop.province,
        city: stop.city,
        cities: stop.selectedCities ?? [],
      },
      undefined,
    );

  /** Everything one endpoint owns, so `swapEndpoints` cannot forget half of it. */
  const applyGeoPath = (target: { endpoint: 'from' | 'to' } | { endpoint: 'stop'; stopId: string }, path: GeoPath) => {
    // `districts` is the multi-select; `district` is the single. A caller that
    // picked one still gets a one-element list, so there is one code path below.
    const cities = path.districts ?? (path.district ? [path.district] : []);
    const country = path.country ?? null;
    const province = path.province ?? null;
    const next = resolveEndpointSelection(cities, country, province);

    if (target.endpoint === 'stop') {
      setStops(prev =>
        prev.map(s =>
          s.id === target.stopId
            ? {
                ...s,
                country,
                province,
                city: next.city as GeoOption | null,
                selectedCities: cities,
                label_text: next.text,
                lat: next.lat,
                lng: next.lng,
              }
            : s,
        ),
      );
      return;
    }

    if (target.endpoint === 'from') {
      setFromCountry(country);
      setFromProvince(province);
      setFromCity(next.city as GeoOption | null);
      setSelectedFromCities(cities);
      setFormData(prev => ({
        ...prev,
        from_text: next.text,
        from_lat: next.lat,
        from_lng: next.lng,
      }));
      setErrors(prev => ({ ...prev, from_text: '' }));
      return;
    }

    setToCountry(country);
    setToProvince(province);
    setToCity(next.city as GeoOption | null);
    setSelectedToCities(cities);
    setFormData(prev => ({
      ...prev,
      to_text: next.text,
      to_lat: next.lat,
      to_lng: next.lng,
    }));
    setErrors(prev => ({ ...prev, to_text: '' }));
  };

  /**
   * The artboard's ⇅. A driver who picked the route backwards should not have to
   * re-enter both ends.
   *
   * ⚠️ It swaps the geo selections AND the persisted text/coordinates together.
   * Swapping only `from_text`/`to_text` would leave the pickers showing the old
   * order, and the next edit of either end would silently restore it.
   */
  const swapEndpoints = () => {
    setFromCountry(toCountry);
    setFromProvince(toProvince);
    setFromCity(toCity);
    setSelectedFromCities(selectedToCities);

    setToCountry(fromCountry);
    setToProvince(fromProvince);
    setToCity(fromCity);
    setSelectedToCities(selectedFromCities);

    setFormData(prev => ({
      ...prev,
      from_text: prev.to_text,
      from_lat: prev.to_lat,
      from_lng: prev.to_lng,
      to_text: prev.from_text,
      to_lat: prev.from_lat,
      to_lng: prev.from_lng,
    }));
    setErrors(prev => ({ ...prev, from_text: '', to_text: '' }));
  };

  /** What the open sheet should start from, so re-opening resumes where it was. */
  const geoSheetInitialPath = (): GeoPath => {
    if (!geoSheet) return {};
    if (geoSheet.endpoint === 'stop') {
      const stop = stops.find(s => s.id === geoSheet.stopId);
      return {
        country: stop?.country ?? undefined,
        province: stop?.province ?? undefined,
        districts: stop?.selectedCities ?? [],
      };
    }
    return geoSheet.endpoint === 'from'
      ? {
          country: fromCountry ?? undefined,
          province: fromProvince ?? undefined,
          districts: selectedFromCities,
        }
      : {
          country: toCountry ?? undefined,
          province: toProvince ?? undefined,
          districts: selectedToCities,
        };
  };

  /**
   * ── T-101 step 16c-2: the departure window and the arrival deadline ──────────
   *
   * 🔴 Every rule below comes from `utils/offerSchedule.ts`, which is pure and asserted
   * in `scripts/check-offer-schedule.mjs` — including the one that shipped broken on the
   * passenger side until step 8f: an arrival is judged against the **latest** departure
   * the offer permits, never the earliest.
   */
  const [scheduleSheet, setScheduleSheet] = useState<'depart' | 'arrive' | null>(null);
  const [departWindow, setDepartWindow] = useState<WindowSelection>(() => {
    const first = firstSelectableSlotToday(new Date()) + 2;
    return { start: clampSlot(first), end: clampSlot(first + 4) };
  });
  const [departUrgent, setDepartUrgent] = useState(false);
  const [departDayIndex, setDepartDayIndex] = useState(0);
  /** Null means the driver gave no deadline — a legitimate and common answer. */
  const [arriveSlot, setArriveSlot] = useState<number | null>(null);
  const [arriveDayIndex, setArriveDayIndex] = useState(0);

  /** The four days the artboard offers, starting today. */
  const scheduleDays = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return [0, 1, 2, 3].map(i => new Date(base.getTime() + i * 86400000));
  }, []);

  const scheduleInput = (): ScheduleInput => ({
    departDate: scheduleDays[departDayIndex] ?? scheduleDays[0],
    window: departWindow,
    urgent: departUrgent,
    arriveAt:
      arriveSlot === null
        ? null
        : slotToDate(scheduleDays[arriveDayIndex] ?? scheduleDays[0], arriveSlot),
    now: new Date(),
  });

  const departSummary = (): string => {
    if (departUrgent) return t('offerWizard.urgentDeparture');
    const day = formatDateByLanguage(
      scheduleDays[departDayIndex] ?? scheduleDays[0],
      currentLanguage,
    );
    return `${day} · ${slotToLabel(departWindow.start)}–${slotToLabel(departWindow.end)}`;
  };

  const arriveSummary = (): string => {
    if (arriveSlot === null) return t('offerWizard.arriveNone');
    const day = formatDateByLanguage(
      scheduleDays[arriveDayIndex] ?? scheduleDays[0],
      currentLanguage,
    );
    return `${day} · ${slotToLabel(arriveSlot)}`;
  };

  /**
   * Push the schedule into `formData` so `handleSave`'s `...formData` carries it.
   *
   * ⚠️ Called on CONFIRM, not on every drag: `start_at` is validated, and writing a
   * half-finished drag into the validated field would flash errors at the driver while
   * their finger is still down.
   */
  const commitSchedule = () => {
    const payload = toSchedulePayload(scheduleInput());
    setFormData(prev => ({
      ...prev,
      start_at: payload.start_at,
      depart_until: payload.depart_until,
      arrive_until: payload.arrive_until,
    }));
    setErrors(prev => ({ ...prev, start_at: '', arrive_until: '' }));
    setScheduleSheet(null);
  };

  /** The live rule breach, shown inside the sheet rather than only after confirming. */
  const scheduleWarning = (): string | undefined => {
    const errs = validateScheduleWindow(scheduleInput());
    const key = scheduleSheet === 'arrive' ? errs.arrive_until : errs.start_at;
    return key ? t(key) : undefined;
  };

  /**
   * The car — FIRST, as `DriverElon.dc.html` draws it: its "Mashina tanlash" eyebrow is
   * the artboard's opening block, above "Qayerdan".
   *
   * ⚠️ It could not sit here before step 16d. While the wizard paginated, a field drawn
   * on page 1 was not validated until page 3, because `validateStepNumber` indexed the
   * validators BY PAGE. With one form there are no pages and `validateAll` covers every
   * section wherever it is drawn.
   */
  const renderCar = () => (
    <View style={styles.stepContent}>
      <CarSection
        title={t('offerWizard.vehicleLabel')}
        vehicleLabel={vehicles.length > 0 ? vehicles[0].label : undefined}
        helper="Transport vositasi ma'lumotlari profilingizdan avtomatik olinadi."
        emptyLabel="Transport vositasi ma'lumotlari topilmadi."
        emptyHelper="Avval profil bo'limida transport vositasini to'ldiring, so'ng e'lon yarating."
        error={errors.vehicle_id}
      />
    </View>
  );

  /**
   * Step 1 — the route. T-101 step 16c.
   *
   * Each endpoint is ONE tappable line that opens `GeoSheet`, as the artboard draws
   * it. The three stacked dropdowns it replaces were the cascade rendered as a form,
   * and there were THREE copies of them on this screen (from · to · every stop).
   */
  const renderRoute = () => (
    <View style={styles.stepContent}>
      <RouteEndpointSection
        title={t('offerWizard.fromLabel')}
        variant="from"
        line={endpointLine('from')}
        placeholder={t('offerWizard.selectPlace')}
        onPress={() => setGeoSheet({ endpoint: 'from' })}
        text={formData.from_text}
        freeTextPlaceholder={t('offerWizard.fromPlaceholder')}
        error={errors.from_text}
        onChangeText={(text) => {
          setFormData(prev => ({ ...prev, from_text: text }));
          setErrors(prev => ({ ...prev, from_text: '' }));
        }}
      />

      <RouteSwapButton onPress={swapEndpoints} label={t('offerWizard.swapRoute')} />

      <RouteEndpointSection
        title={t('offerWizard.toLabel')}
        variant="to"
        line={endpointLine('to')}
        placeholder={t('offerWizard.selectPlace')}
        onPress={() => setGeoSheet({ endpoint: 'to' })}
        text={formData.to_text}
        freeTextPlaceholder={t('offerWizard.toPlaceholder')}
        error={errors.to_text}
        onChangeText={(text) => {
          setFormData(prev => ({ ...prev, to_text: text }));
          setErrors(prev => ({ ...prev, to_text: '' }));
        }}
      />

      {/* ── Orasidagi to'xtash joylari ───────────────────────────────────
          The artboard draws no stops, so this keeps the screen's own shape —
          but each stop is now the SAME row and the SAME sheet as the two
          endpoints, instead of a third hand-rolled copy of the cascade. */}
      <SectionCard title={t('offerWizard.stopsLabel')}>
        {stops.map((stop, index) => (
          <View key={stop.id} style={styles.stopRow}>
            <View style={styles.stopMain}>
              <RouteEndpointSection
                title={`${t('offerWizard.stopLabel')} ${index + 1}`}
                variant="stop"
                line={stopLine(stop)}
                placeholder={t('offerWizard.selectPlace')}
                onPress={() => setGeoSheet({ endpoint: 'stop', stopId: stop.id })}
                text={stop.label_text}
                freeTextPlaceholder={t('offerWizard.selectPlace')}
                onChangeText={(text) =>
                  setStops(prev =>
                    prev.map(s => (s.id === stop.id ? { ...s, label_text: text } : s)),
                  )
                }
              />
            </View>
            <TouchableOpacity
              style={styles.stopRemove}
              onPress={() => removeStop(stop.id)}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
            >
              <Text style={styles.stopRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addStopButton}
          onPress={addStop}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.addStopText}>+ {t('offerWizard.addStop')}</Text>
        </TouchableOpacity>
      </SectionCard>
    </View>
  );

  /**
   * Step 2 — when the offer leaves, and when it must arrive. T-101 step 16c-2.
   *
   * 🔴 THE DEPARTURE IS NOW A WINDOW, NOT AN INSTANT. `depart_until` and `arrive_until`
   * have existed on `driver_offers` since T-080 and already round-tripped through
   * `loadExistingOffer` / `handleSave` — but nothing has ever SET them. A driver could
   * say "I leave at 08:00" and never "between 08:00 and 11:00", which is what the
   * artboard draws and what the passenger app already reads.
   *
   * The two wheel modals this replaces are gone; the rules are in `utils/offerSchedule.ts`.
   */
  const renderSchedule = () => (
    <View style={styles.stepContent}>
      <SectionCard title={t('offerWizard.departLabel')} error={errors.start_at}>
        <TouchableOpacity
          style={[styles.scheduleRow, errors.start_at && styles.scheduleRowInvalid]}
          onPress={() => setScheduleSheet('depart')}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.scheduleValue}>{departSummary()}</Text>
          <Text style={styles.scheduleChevron}>›</Text>
        </TouchableOpacity>
      </SectionCard>

      {/*
        The arrival deadline is OPTIONAL and says so. Most drivers on a shared route do
        not commit to one, and a required-looking field would invite a guess — which is
        exactly the promise the passenger app would then render as fact.
      */}
      <SectionCard
        title={t('offerWizard.arriveLabel')}
        helper={t('offerWizard.arriveHelper')}
        error={errors.arrive_until}
      >
        <TouchableOpacity
          style={[styles.scheduleRow, errors.arrive_until && styles.scheduleRowInvalid]}
          onPress={() => setScheduleSheet('arrive')}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text
            style={[styles.scheduleValue, arriveSlot === null && styles.schedulePlaceholder]}
          >
            {arriveSummary()}
          </Text>
          <Text style={styles.scheduleChevron}>›</Text>
        </TouchableOpacity>
      </SectionCard>
    </View>
  );

  /**
   * The rest of the offer — payment, class, seats, conditions and the prices.
   * (The car itself moved to `renderCar`, at the top, in step 16d.)
   *
   * T-101 step 16b: the sections are now `components/offerWizard/` pieces, in the
   * order `DriverElon.dc.html` draws them (car · to'lov · avto turi · o'rindiqlar ·
   * shartlar · ma'lumot · narxlar). The artboard puts the car FIRST of all, above
   * the route — that move waits for 16d, because while the wizard still paginates a
   * field rendered on step 1 would not be validated until step 3.
   */
  const renderDetails = () => (
    <View style={styles.stepContent}>

      {/* ── To'lov turi ─────────────────────────────────────────────────
          Two INDEPENDENT toggles. T-031's lesson on the passenger side:
          one shared value makes them behave as a radio group, so picking
          card silently cleared cash. */}
      <ChipSelectSection
        title={t('offerWizard.paymentLabel')}
        layout="fill"
        options={[
          { value: 'payment_cash', label: t('offerWizard.paymentCash') },
          { value: 'payment_card', label: t('offerWizard.paymentCard') },
        ]}
        selected={PAYMENT_KEYS.filter((key) => formData[key] === true)}
        onToggle={(key) =>
          setFormData(prev => ({ ...prev, [key]: !(prev[key] === true) }))
        }
      />

      {/* ── Avto sinfi — one radio, deselectable ───────────────────────── */}
      <ChipSelectSection
        title={t('offerWizard.vehicleClassLabel')}
        options={VEHICLE_CLASSES.map((cls) => ({
          value: cls,
          label: t(`offerWizard.vehicleClass_${cls}`),
        }))}
        selected={formData.vehicle_class ? [formData.vehicle_class] : []}
        onToggle={(cls) =>
          setFormData(prev => ({
            ...prev,
            // Deselectable: tapping the active one clears it, matching
            // the passenger screen's radio behaviour.
            vehicle_class: prev.vehicle_class === cls ? undefined : cls,
          }))
        }
      />

      <SectionCard
        title={t('offerWizard.seatsLabel')}
        helper={t('offerWizard.seatsDescription')}
        error={errors.seats_total}
      >
        <FormField
          placeholder="1-8"
          keyboardType="numeric"
          invalid={!!errors.seats_total}
          value={formData.seats_total?.toString() || ''}
          onChangeText={(text) => {
            // Allow empty while typing; normalize on blur/validation
            if (text.trim() === '') {
              setFormData(prev => ({ ...prev, seats_total: undefined }));
              return;
            }
            const num = parseInt(text, 10);
            setFormData(prev => ({ ...prev, seats_total: isNaN(num) ? prev.seats_total : num }));
            setErrors(prev => ({ ...prev, seats_total: '' }));
          }}
          onBlur={() => {
            setFormData(prev => ({
              ...prev,
              seats_total: clampSeats(prev.seats_total),
            }));
          }}
        />
      </SectionCard>

      {/* ── Qo'shimcha shartlar — T-079 ─────────────────────────────────── */}
      <ChipSelectSection
        title={t('offerWizard.amenitiesLabel')}
        options={[
          { value: 'air_conditioner', label: t('offerWizard.amenityAirCon') },
          { value: 'wifi', label: t('offerWizard.amenityWifi') },
          { value: 'roof_rack_needed', label: t('offerWizard.amenityRoofRack') },
          { value: 'trailer', label: t('offerWizard.amenityTrailer') },
        ]}
        selected={AMENITY_KEYS.filter((key) => formData[key] === true)}
        onToggle={(key) =>
          setFormData(prev => ({ ...prev, [key]: !(prev[key] === true) }))
        }
      />

      {/* ── T-079: Jo'natma (pochta). The price and weight only mean
          anything once parcels are accepted. ───────────────────────────── */}
      <ToggleSection
        label={t('offerWizard.parcelAccepted')}
        on={formData.parcel_accepted === true}
        onToggle={() =>
          setFormData(prev => ({
            ...prev,
            parcel_accepted: !(prev.parcel_accepted === true),
          }))
        }
      >
        <NumberField
          label={t('offerWizard.parcelPriceLabel')}
          value={formData.parcel_price}
          error={errors.parcel_price}
          onChange={(value) => setFormData(prev => ({ ...prev, parcel_price: value }))}
        />
        <NumberField
          label={t('offerWizard.parcelMaxKgLabel')}
          helper={t('offerWizard.parcelMaxKgHelper')}
          value={formData.parcel_max_kg}
          error={errors.parcel_max_kg}
          onChange={(value) => setFormData(prev => ({ ...prev, parcel_max_kg: value }))}
        />
      </ToggleSection>

      {/* ── T-079: "Faqat pitakdan yoki yo'lga chiqib tursa olaman" ─────── */}
      <ToggleSection
        label={t('offerWizard.roadPickupLabel')}
        on={formData.road_pickup === true}
        onToggle={() =>
          setFormData(prev => ({ ...prev, road_pickup: !(prev.road_pickup === true) }))
        }
      >
        <FormField
          multiline
          numberOfLines={3}
          placeholder={t('offerWizard.roadPickupPlaceholder')}
          value={formData.road_pickup_note || ''}
          onChangeText={(text) =>
            setFormData(prev => ({ ...prev, road_pickup_note: text }))
          }
        />
      </ToggleSection>

      {/* ── T-080: "hozioq (to'lishi bilan yuraman)" ────────────────────── */}
      <ToggleSection
        label={t('offerWizard.departsWhenFullLabel')}
        helper={t('offerWizard.departsWhenFullHelper')}
        on={formData.departs_when_full === true}
        onToggle={() =>
          setFormData(prev => ({
            ...prev,
            departs_when_full: !(prev.departs_when_full === true),
          }))
        }
      />

      {/* ── Qo'shimcha ma'lumot ─────────────────────────────────────────── */}
      <SectionCard title={t('offerWizard.noteLabel')}>
        <FormField
          multiline
          numberOfLines={4}
          placeholder={t('offerWizard.notePlaceholder')}
          value={formData.note || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
        />
      </SectionCard>

      {/* ── Narxlar ──────────────────────────────────────────────────────
          The artboard groups every price under ONE eyebrow, so they are one
          section here rather than seven loose fields. T-078 landed the last
          five; `price_per_seat` and `front_price_per_seat` are older and are
          read by the passenger app — do NOT rename them. */}
      <SectionCard title={t('offerWizard.pricesSectionTitle')}>
        <NumberField
          label={t('offerWizard.priceLabel')}
          placeholder="5000"
          value={formData.price_per_seat}
          error={errors.price_per_seat}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, price_per_seat: value }));
            setErrors(prev => ({ ...prev, price_per_seat: '' }));
          }}
        />
        <NumberField
          label="Oldingi o'rin uchun narx (ixtiyoriy)"
          helper="Oldingi o'rindagi yo'lovchilar uchun biroz yuqoriroq narx belgilashingiz mumkin."
          placeholder="Masalan, 60000"
          value={formData.front_price_per_seat}
          // The front seat may not be cheaper than an ordinary one; on blur it is
          // raised to match rather than rejected.
          clampMin={formData.price_per_seat}
          onChange={(value) =>
            setFormData(prev => ({ ...prev, front_price_per_seat: value }))
          }
        />
        <NumberField
          label={t('offerWizard.priceBackSalonLabel')}
          helper={t('offerWizard.priceBackSalonHelper')}
          value={formData.price_back_salon}
          error={errors.price_back_salon}
          onChange={(value) => setFormData(prev => ({ ...prev, price_back_salon: value }))}
        />
        <NumberField
          label={t('offerWizard.priceWholeSalonLabel')}
          helper={t('offerWizard.priceWholeSalonHelper')}
          value={formData.price_whole_salon}
          error={errors.price_whole_salon}
          onChange={(value) => setFormData(prev => ({ ...prev, price_whole_salon: value }))}
        />
        {/*
          Kutish. 🔴 A rate the passenger is SHOWN — nothing charges it (owner,
          2026-08-13). The helper text says so, so a driver does not expect the
          app to collect it for them.
        */}
        <NumberField
          label={t('offerWizard.waitingFeeLabel')}
          helper={t('offerWizard.waitingFeeHelper')}
          value={formData.waiting_fee_per_min}
          error={errors.waiting_fee_per_min}
          onChange={(value) => setFormData(prev => ({ ...prev, waiting_fee_per_min: value }))}
        />
        <NumberField
          allowZero
          label={t('offerWizard.freeWaitingLabel')}
          helper={t('offerWizard.freeWaitingHelper')}
          value={formData.free_waiting_min}
          error={errors.free_waiting_min}
          onChange={(value) => setFormData(prev => ({ ...prev, free_waiting_min: value }))}
        />
        <NumberField
          allowZero
          label={t('offerWizard.pickupFeeLabel')}
          helper={t('offerWizard.pickupFeeHelper')}
          value={formData.pickup_fee}
          error={errors.pickup_fee}
          onChange={(value) => setFormData(prev => ({ ...prev, pickup_fee: value }))}
        />
      </SectionCard>
    </View>
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.palette.primary.main} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.palette.surface} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          {/* T-071 — was a green `←` that scaled with the system font.
              Step 16d: with the pagination gone there is no wizard to step back
              through, so the arrow leaves the screen. */}
          <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />
          <Text style={styles.headerTitle}>
            {offerId ? (t('offerWizard.editTitle') || 'E\'lonni tahrirlash') : t('offerWizard.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/*
          ── T-101 step 16d ──────────────────────────────────────
          ONE scrolling form, in the order the artboard draws it: mashina · qayerdan ·
          qayerga · yurish vaqti · yetib borish · to'lov · avto turi · o'rindiqlar ·
          shartlar · ma'lumot · narxlar.

          The artboard has NO step concept — no indicator, no next button, no `step` key
          in its state. The 4-page wizard was ours, not the design's.

          🛑 Submit calls `validateEverything()` (step 16a). That had to exist BEFORE
          this step: the old `handleSave` validated only the page you were standing on,
          and the pagination was the only thing that made it safe.
        */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCar()}
          {renderRoute()}
          {renderSchedule()}
          {renderDetails()}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => handleSave()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.palette.text.onAccent} />
            ) : (
              <Text style={styles.buttonPrimaryText}>
                {offerId
                  ? t('offerWizard.updateOffer')
                  : t('offerWizard.createOffer')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/*
        ── T-101 step 16c ──────────────────────────────────────────────────────
        ONE sheet for all three kinds of place, replacing three `GeoPickerModal`
        instances and the hand-rolled cascade behind them.

        `multiSelectAt="district"` is what makes the adoption lossless: a driver
        has always been able to name several tumans for one endpoint, and the
        sheet had no multi-select until this step added it.
      */}
      <ScheduleSheet
        visible={!!scheduleSheet}
        mode={scheduleSheet === 'arrive' ? 'arrive' : 'depart'}
        days={scheduleDays}
        dayIndex={scheduleSheet === 'arrive' ? arriveDayIndex : departDayIndex}
        onPickDay={(index) =>
          scheduleSheet === 'arrive' ? setArriveDayIndex(index) : setDepartDayIndex(index)
        }
        window={departWindow}
        onChangeWindow={setDepartWindow}
        urgent={departUrgent}
        onToggleUrgent={() => setDepartUrgent(v => !v)}
        arriveSlot={arriveSlot}
        onPickArriveSlot={setArriveSlot}
        warning={scheduleWarning()}
        now={new Date()}
        formatDay={(day) => formatDateByLanguage(day, currentLanguage)}
        onConfirm={commitSchedule}
        onClose={() => setScheduleSheet(null)}
        labels={{
          departTitle: t('offerWizard.departLabel'),
          arriveTitle: t('offerWizard.arriveLabel'),
          departCrumb: t('offerWizard.departCrumb'),
          arriveCrumb: t('offerWizard.arriveCrumb'),
          urgent: t('offerWizard.urgentDeparture'),
          confirm: t('common.confirm'),
          close: t('common.cancel'),
          nextDay: t('offerWizard.nextDay'),
          clear: t('offerWizard.arriveNone'),
        }}
      />

      <GeoSheet
        visible={!!geoSheet}
        multiSelectAt="district"
        endLevel="district"
        initialPath={geoSheetInitialPath()}
        title={
          geoSheet?.endpoint === 'to'
            ? t('offerWizard.toLabel')
            : geoSheet?.endpoint === 'stop'
              ? t('offerWizard.stopsLabel')
              : t('offerWizard.fromLabel')
        }
        onClose={() => setGeoSheet(null)}
        onDone={(path) => {
          if (geoSheet) applyGeoPath(geoSheet, path);
          setGeoSheet(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.ground,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.ground,
  },
  loadingText: {
    marginTop: 16,
    color: theme.palette.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: theme.palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.borders.strong,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  // T-071 — layout only; the tile itself comes from <BackButton />.
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    color: theme.palette.text.primary,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: theme.palette.text.primary,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    backgroundColor: theme.palette.surface,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    borderRadius: 14,
    padding: 16,
    color: theme.palette.text.primary,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: theme.palette.danger,
    borderWidth: 2,
  },
  selectInput: {
    backgroundColor: theme.palette.surface,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  selectInputText: {
    fontSize: 16,
    color: theme.palette.text.primary,
    fontWeight: '500',
  },
  dateInput: {
    backgroundColor: theme.palette.surface,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dateInputText: {
    fontSize: 16,
    color: theme.palette.text.primary,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: 6,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: theme.palette.dangerText,
    marginTop: 6,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
    backgroundColor: theme.palette.surface,
    borderTopWidth: 1,
    borderTopColor: theme.palette.borders.strong,
    gap: 12,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonPrimary: {
    backgroundColor: theme.palette.action,
    shadowColor: theme.palette.action,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonPrimaryText: {
    fontSize: 16,
    color: theme.palette.text.onAccent,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Geo Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.palette.scrim.modal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentWrapper: {
    width: '95%',
    maxHeight: '95%',
  },
  modalContent: {
    backgroundColor: theme.palette.surface,
    borderRadius: 24,
    width: '100%',
    maxHeight: '95%',
    minHeight: '70%',
    overflow: 'hidden',
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.borders.strong,
    backgroundColor: theme.palette.surface,
  },
  modalTitle: {
    fontSize: 20,
    color: theme.palette.text.primary,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.5,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.palette.surfaceSunken,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: theme.palette.text.secondary,
    fontWeight: '600',
    lineHeight: 20,
  },
  modalSearchBox: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.borders.strong,
    backgroundColor: theme.palette.surface,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.ground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  modalSearchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: theme.palette.text.secondary,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.palette.text.primary,
    paddingVertical: 0,
    fontWeight: '500',
  },
  modalSearchClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.palette.borders.strong,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSearchClearText: {
    fontSize: 16,
    color: theme.palette.text.secondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  modalList: {
    maxHeight: 500,
    backgroundColor: theme.palette.surface,
  },
  modalLoading: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.surface,
  },
  modalEmpty: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.surface,
  },
  modalEmptyText: {
    fontSize: 16,
    color: theme.palette.text.tertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.surfaceSunken,
    backgroundColor: theme.palette.surface,
  },
  modalItemSelected: {
    backgroundColor: theme.palette.successTint,
    borderLeftWidth: 4,
    borderLeftColor: theme.palette.action,
    borderBottomColor: theme.palette.successTint,
  },
  modalItemText: {
    fontSize: 16,
    color: theme.palette.text.primary,
    flex: 1,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  modalItemTextSelected: {
    color: theme.palette.actionPressed,
    fontWeight: '600',
  },
  modalCheck: {
    fontSize: 20,
    color: theme.palette.action,
    fontWeight: '700',
    marginLeft: 12,
  },
  locationDisplay: {
    backgroundColor: theme.palette.successTint,
    borderWidth: 1.5,
    borderColor: theme.palette.action,
    borderRadius: 14,
    padding: 16,
  },
  locationText: {
    fontSize: 16,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  stopsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  /* ── T-101 step 16c-2: the two schedule rows ─────────────────────────────── */
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: theme.sizes.buttonLg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderEmphasis,
    borderColor: theme.palette.borders.control,
  },
  scheduleRowInvalid: {
    borderColor: theme.palette.dangerText,
  },
  scheduleValue: {
    ...theme.typography.placeLine,
    color: theme.palette.text.primary,
    flex: 1,
  },
  schedulePlaceholder: {
    color: theme.palette.text.tertiary,
  },
  scheduleChevron: {
    ...theme.typography.cardTitle,
    color: theme.palette.text.chevron,
  },

  /* ── T-101 step 16c: a stop is the same row as an endpoint, plus a remove ── */
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stopMain: {
    flex: 1,
    minWidth: 0,
  },
  stopRemove: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopRemoveText: {
    ...theme.typography.cardTitle,
    color: theme.palette.text.tertiary,
  },
  addStopText: {
    ...theme.typography.chipLabel,
    color: theme.palette.text.onAccent,
    textAlign: 'center',
  },
  addStopButton: {
    backgroundColor: theme.palette.action,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: theme.palette.action,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addStopButtonText: {
    color: theme.palette.text.onAccent,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stopCard: {
    backgroundColor: theme.palette.ground,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopNumber: {
    fontSize: 15,
    color: theme.palette.text.primary,
    fontWeight: '700',
  },
  removeStopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.palette.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeStopButtonText: {
    color: theme.palette.text.onAccent,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  multiSelectButton: {
    backgroundColor: theme.palette.warnBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.palette.warnBorder,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  multiSelectButtonText: {
    color: theme.palette.text.onAccent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.palette.borders.strong,
    backgroundColor: theme.palette.ground,
  },
  modalFooterInfo: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalFooterText: {
    fontSize: 15,
    color: theme.palette.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalFooterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  modalButtonPrimary: {
    backgroundColor: theme.palette.action,
    shadowColor: theme.palette.action,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonSecondary: {
    backgroundColor: theme.palette.surface,
    borderWidth: 2,
    borderColor: theme.palette.borders.strong,
  },
  modalButtonDisabled: {
    backgroundColor: theme.palette.borders.strong,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalButtonPrimaryText: {
    color: theme.palette.text.onAccent,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalButtonSecondaryText: {
    color: theme.palette.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  multipleLocationsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.successTint,
    borderWidth: 1.5,
    borderColor: theme.palette.action,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  locationChipText: {
    fontSize: 14,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  chipRemoveButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.palette.action,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRemoveText: {
    color: theme.palette.text.onAccent,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  locationContext: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  locationContextText: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  // Date/Time Picker Modal Styles
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: theme.palette.scrim.modal,
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.borders.strong,
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.palette.text.primary,
  },
  datePickerModalCancelText: {
    fontSize: 16,
    color: theme.palette.text.secondary,
  },
  datePickerModalConfirmText: {
    fontSize: 16,
    color: theme.palette.action,
    fontWeight: '600',
  },
  datePickerContainer: {
    flexDirection: 'row',
    height: 250,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: theme.palette.text.secondary,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.surfaceSunken,
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.palette.ground,
  },
  pickerItemSelected: {
    backgroundColor: theme.palette.action,
  },
  pickerItemText: {
    fontSize: 15,
    color: theme.palette.text.secondary,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: theme.palette.text.onAccent,
    fontWeight: '600',
  },
});

