/**
 * Offer Wizard Screen
 * 4-step wizard for creating/editing driver offers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import * as DriverOffersAPI from '../api/driverOffers';
import type { CreateOfferData, DriverOffer } from '../api/driverOffers';
import * as DriverAPI from '../api/driver';
import type { DriverProfile, GeoOption } from '../api/driver';

const theme = createTheme('light');

interface VehicleOption {
  id: string;
  label: string;
}

export const OfferWizardScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { offerId } = route.params || {};
  const { token } = useAuth();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!offerId);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [existingOffer, setExistingOffer] = useState<DriverOffer | null>(null);

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Geo selection states for "From" location
  const [fromGeoModal, setFromGeoModal] = useState<{ type: 'country' | 'province' | 'city'; multiSelect?: boolean } | null>(null);
  const [fromGeoSearch, setFromGeoSearch] = useState('');
  const [fromCountries, setFromCountries] = useState<GeoOption[]>([]);
  const [fromProvinces, setFromProvinces] = useState<GeoOption[]>([]);
  const [fromCities, setFromCities] = useState<GeoOption[]>([]);
  const [fromCountry, setFromCountry] = useState<GeoOption | null>(null);
  const [fromProvince, setFromProvince] = useState<GeoOption | null>(null);
  const [fromCity, setFromCity] = useState<GeoOption | null>(null);
  const [selectedFromCities, setSelectedFromCities] = useState<GeoOption[]>([]);

  // Geo selection states for "To" location
  const [toGeoModal, setToGeoModal] = useState<{ type: 'country' | 'province' | 'city'; multiSelect?: boolean } | null>(null);
  const [toGeoSearch, setToGeoSearch] = useState('');
  const [toCountries, setToCountries] = useState<GeoOption[]>([]);
  const [toProvinces, setToProvinces] = useState<GeoOption[]>([]);
  const [toCities, setToCities] = useState<GeoOption[]>([]);
  const [toCountry, setToCountry] = useState<GeoOption | null>(null);
  const [toProvince, setToProvince] = useState<GeoOption | null>(null);
  const [toCity, setToCity] = useState<GeoOption | null>(null);
  const [selectedToCities, setSelectedToCities] = useState<GeoOption[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);

  // Stops selection states
  const [stops, setStops] = useState<Array<{ id: string; city: GeoOption | null; selectedCities?: GeoOption[]; country: GeoOption | null; province: GeoOption | null; label_text: string; lat?: number; lng?: number }>>([]);
  const [stopGeoModal, setStopGeoModal] = useState<{ stopId: string; type: 'country' | 'province' | 'city'; multiSelect?: boolean } | null>(null);
  const [stopGeoSearch, setStopGeoSearch] = useState('');
  const [stopCountries, setStopCountries] = useState<GeoOption[]>([]);
  const [stopProvinces, setStopProvinces] = useState<Record<string, GeoOption[]>>({});
  const [stopCities, setStopCities] = useState<Record<string, GeoOption[]>>({});
  const [selectedCities, setSelectedCities] = useState<GeoOption[]>([]); // For multi-select cities
  const [multiSelectMode, setMultiSelectMode] = useState<{ stopId: string; country: GeoOption; province: GeoOption } | null>(null);

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
      setFromCountries(countries);
      setToCountries(countries);
      setStopCountries(countries);
    } catch (error: any) {
      console.error('Failed to load countries:', error);
    }
  };

  const loadFromProvinces = async (countryId: number) => {
    try {
      setGeoLoading(true);
      const provinces = await DriverAPI.fetchGeoProvinces(countryId);
      setFromProvinces(provinces);
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      showToast.error('Xatolik', 'Viloyatlarni yuklashda xatolik');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadFromCities = async (provinceId: number) => {
    try {
      setGeoLoading(true);
      const cities = await DriverAPI.fetchGeoCityDistricts(provinceId);
      setFromCities(cities);
    } catch (error: any) {
      console.error('Failed to load cities:', error);
      showToast.error('Xatolik', 'Shaharlarni yuklashda xatolik');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadToProvinces = async (countryId: number) => {
    try {
      setGeoLoading(true);
      const provinces = await DriverAPI.fetchGeoProvinces(countryId);
      setToProvinces(provinces);
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      showToast.error('Xatolik', 'Viloyatlarni yuklashda xatolik');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadToCities = async (provinceId: number) => {
    try {
      setGeoLoading(true);
      const cities = await DriverAPI.fetchGeoCityDistricts(provinceId);
      setToCities(cities);
    } catch (error: any) {
      console.error('Failed to load cities:', error);
      showToast.error('Xatolik', 'Shaharlarni yuklashda xatolik');
    } finally {
      setGeoLoading(false);
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
        setFromCountries(countries);
        setToCountries(countries);
        setStopCountries(countries);
        
        // Pre-fill form data
        const startDate = new Date(offer.start_at);
        setSelectedDate(startDate);
        setSelectedTime(startDate);
        
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
          currency: offer.currency,
          note: offer.note || '',
        });

        // Parse and populate "From" location geo selections
        let loadedFromCountry: GeoOption | null = null;
        let loadedFromProvince: GeoOption | null = null;
        let loadedFromCity: GeoOption | null = null;
        let loadedFromCities: GeoOption[] = [];

        if (offer.from_text) {
          const fromGeo = await parseLocationText(offer.from_text, countries);
          if (fromGeo.country) {
            loadedFromCountry = fromGeo.country;
            setFromCountry(fromGeo.country);
            const provinces = await DriverAPI.fetchGeoProvinces(fromGeo.country.id);
            setFromProvinces(provinces);
            if (fromGeo.province) {
              loadedFromProvince = fromGeo.province;
              setFromProvince(fromGeo.province);
              const cities = await DriverAPI.fetchGeoCityDistricts(fromGeo.province.id);
              setFromCities(cities);
              if (fromGeo.city) {
                loadedFromCity = fromGeo.city;
                setFromCity(fromGeo.city);
                loadedFromCities.push(fromGeo.city);
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
          const toGeo = await parseLocationText(offer.to_text, countries);
          if (toGeo.country) {
            loadedToCountry = toGeo.country;
            setToCountry(toGeo.country);
            const provinces = await DriverAPI.fetchGeoProvinces(toGeo.country.id);
            setToProvinces(provinces);
            if (toGeo.province) {
              loadedToProvince = toGeo.province;
              setToProvince(toGeo.province);
              const cities = await DriverAPI.fetchGeoCityDistricts(toGeo.province.id);
              setToCities(cities);
              if (toGeo.city) {
                loadedToCity = toGeo.city;
                setToCity(toGeo.city);
                loadedToCities.push(toGeo.city);
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
      showToast.error('Xatolik', error.message || 'E\'lonni yuklashda xatolik');
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        // Validate from location - either geo selected (single or multiple) or text provided
        const fromLocationText = fromCity
          ? buildLocationText(fromCountry, fromProvince, fromCity)
          : selectedFromCities.length > 0
          ? selectedFromCities.map(c => c.name).join(', ')
          : formData.from_text?.trim() || '';
        
        if (!fromLocationText) {
          newErrors.from_text = t('offerWizard.errorMissingFields');
        }
        
        // Validate to location - either geo selected (single or multiple) or text provided
        const toLocationText = toCity
          ? buildLocationText(toCountry, toProvince, toCity)
          : selectedToCities.length > 0
          ? selectedToCities.map(c => c.name).join(', ')
          : formData.to_text?.trim() || '';
        
        if (!toLocationText) {
          newErrors.to_text = t('offerWizard.errorMissingFields');
        }
        break;

      case 2:
        if (!formData.start_at) {
          newErrors.start_at = t('offerWizard.errorMissingFields');
        } else {
          const startDate = new Date(formData.start_at);
          const minDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          if (startDate < minDate) {
            newErrors.start_at = t('offerWizard.errorMinAdvance');
          }
        }
        break;

      case 3:
        if (!formData.vehicle_id) {
          newErrors.vehicle_id = t('offerWizard.errorMissingFields');
        }
        if (!formData.seats_total || formData.seats_total < 1 || formData.seats_total > 8) {
          newErrors.seats_total = t('offerWizard.errorInvalidSeats');
        }
        if (!formData.price_per_seat || formData.price_per_seat < 5000) {
          newErrors.price_per_seat = t('offerWizard.errorInvalidPrice');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      updateDateTime(date, selectedTime);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (event.type === 'set' && time) {
      setSelectedTime(time);
      updateDateTime(selectedDate, time);
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const updateDateTime = (date: Date, time: Date) => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);

    setFormData(prev => ({
      ...prev,
      start_at: combined.toISOString(),
    }));
  };

  const formatPrice = (value?: number) => {
    if (value === undefined || value === null) return '';
    const str = Math.floor(value).toString();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const buildLocationText = (
    country: GeoOption | null,
    province: GeoOption | null,
    city: GeoOption | null
  ): string => {
    const parts: string[] = [];
    if (city) parts.push(city.name);
    if (province) parts.push(province.name);
    if (country) parts.push(country.name);
    return parts.join(', ') || '';
  };

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

  const handleFromGeoSelection = async (
    type: 'country' | 'province' | 'city',
    option: GeoOption
  ) => {
    try {
      switch (type) {
        case 'country':
          setFromCountry(option);
          setFromProvince(null);
          setFromCity(null);
          setFromProvinces([]);
          setFromCities([]);
          setFormData(prev => ({ ...prev, from_text: '', from_lat: undefined, from_lng: undefined }));
          await loadFromProvinces(option.id);
          break;
        case 'province':
          setFromProvince(option);
          setFromCity(null);
          setFromCities([]);
          setFormData(prev => ({ ...prev, from_text: '', from_lat: undefined, from_lng: undefined }));
          await loadFromCities(option.id);
          break;
        case 'city':
          // If in multi-select mode, handle differently
          if (fromGeoModal?.multiSelect) {
            // Toggle city selection
            const cityIndex = selectedFromCities.findIndex(c => c.id === option.id);
            if (cityIndex >= 0) {
              setSelectedFromCities(selectedFromCities.filter(c => c.id !== option.id));
            } else {
              setSelectedFromCities([...selectedFromCities, option]);
            }
            return; // Don't close modal, allow more selections
          } else {
            // Single select mode
            setFromCity(option);
            const locationText = buildLocationText(fromCountry, fromProvince, option);
            setFormData(prev => ({
              ...prev,
              from_text: locationText,
              from_lat: option.latitude || undefined,
              from_lng: option.longitude || undefined,
            }));
            setErrors(prev => ({ ...prev, from_text: '' }));
            setFromGeoModal(null);
            setFromGeoSearch('');
            return; // Close modal
          }
      }
      setFromGeoModal(null);
      setFromGeoSearch('');
    } catch (error: any) {
      console.error('Failed to handle geo selection:', error);
    }
  };

  const handleToGeoSelection = async (
    type: 'country' | 'province' | 'city',
    option: GeoOption
  ) => {
    try {
      switch (type) {
        case 'country':
          setToCountry(option);
          setToProvince(null);
          setToCity(null);
          setToProvinces([]);
          setToCities([]);
          setFormData(prev => ({ ...prev, to_text: '', to_lat: undefined, to_lng: undefined }));
          await loadToProvinces(option.id);
          break;
        case 'province':
          setToProvince(option);
          setToCity(null);
          setToCities([]);
          setFormData(prev => ({ ...prev, to_text: '', to_lat: undefined, to_lng: undefined }));
          await loadToCities(option.id);
          break;
        case 'city':
          // If in multi-select mode, handle differently
          if (toGeoModal?.multiSelect) {
            // Toggle city selection
            const cityIndex = selectedToCities.findIndex(c => c.id === option.id);
            if (cityIndex >= 0) {
              setSelectedToCities(selectedToCities.filter(c => c.id !== option.id));
            } else {
              setSelectedToCities([...selectedToCities, option]);
            }
            return; // Don't close modal, allow more selections
          } else {
            // Single select mode
            setToCity(option);
            const locationText = buildLocationText(toCountry, toProvince, option);
            setFormData(prev => ({
              ...prev,
              to_text: locationText,
              to_lat: option.latitude || undefined,
              to_lng: option.longitude || undefined,
            }));
            setErrors(prev => ({ ...prev, to_text: '' }));
            setToGeoModal(null);
            setToGeoSearch('');
            return; // Close modal
          }
      }
      setToGeoModal(null);
      setToGeoSearch('');
    } catch (error: any) {
      console.error('Failed to handle geo selection:', error);
    }
  };

  const openFromGeoModal = async (type: 'country' | 'province' | 'city', multiSelect = false) => {
    setFromGeoSearch('');
    if (type === 'province' && !fromCountry) {
      showToast.error('Xatolik', 'Avval mamlakatni tanlang');
      return;
    }
    if (type === 'city' && !fromProvince) {
      showToast.error('Xatolik', 'Avval viloyatni tanlang');
      return;
    }

    // If multi-select for cities, ensure cities are loaded
    if (multiSelect && type === 'city') {
      if (fromCities.length === 0 && fromProvince) {
        await loadFromCities(fromProvince.id);
      }
      // Pre-select existing cities if editing
      if (selectedFromCities.length === 0 && fromCity) {
        setSelectedFromCities([fromCity]);
      } else {
        setSelectedFromCities([]);
      }
    } else {
      setSelectedFromCities([]);
    }

    setFromGeoModal({ type, multiSelect });
  };

  const openToGeoModal = async (type: 'country' | 'province' | 'city', multiSelect = false) => {
    setToGeoSearch('');
    if (type === 'province' && !toCountry) {
      showToast.error('Xatolik', 'Avval mamlakatni tanlang');
      return;
    }
    if (type === 'city' && !toProvince) {
      showToast.error('Xatolik', 'Avval viloyatni tanlang');
      return;
    }

    // If multi-select for cities, ensure cities are loaded
    if (multiSelect && type === 'city') {
      if (toCities.length === 0 && toProvince) {
        await loadToCities(toProvince.id);
      }
      // Pre-select existing cities if editing
      if (selectedToCities.length === 0 && toCity) {
        setSelectedToCities([toCity]);
      } else {
        setSelectedToCities([]);
      }
    } else {
      setSelectedToCities([]);
    }

    setToGeoModal({ type, multiSelect });
  };

  const getFromGeoOptions = (): GeoOption[] => {
    let options: GeoOption[] = [];
    if (!fromGeoModal) return [];
    
    switch (fromGeoModal.type) {
      case 'country':
        options = fromCountries;
        break;
      case 'province':
        options = fromProvinces;
        break;
      case 'city':
        options = fromCities;
        break;
      default:
        return [];
    }

    if (fromGeoSearch.trim()) {
      const query = fromGeoSearch.toLowerCase();
      return options.filter(opt => opt.name.toLowerCase().includes(query));
    }

    return options;
  };

  const getToGeoOptions = (): GeoOption[] => {
    let options: GeoOption[] = [];
    if (!toGeoModal) return [];
    
    switch (toGeoModal.type) {
      case 'country':
        options = toCountries;
        break;
      case 'province':
        options = toProvinces;
        break;
      case 'city':
        options = toCities;
        break;
      default:
        return [];
    }

    if (toGeoSearch.trim()) {
      const query = toGeoSearch.toLowerCase();
      return options.filter(opt => opt.name.toLowerCase().includes(query));
    }

    return options;
  };

  const confirmMultipleFromCities = () => {
    if (selectedFromCities.length === 0) return;

    // If only one city selected, treat as single selection
    if (selectedFromCities.length === 1) {
      const city = selectedFromCities[0];
      setFromCity(city);
      const locationText = buildLocationText(fromCountry, fromProvince, city);
      setFormData(prev => ({
        ...prev,
        from_text: locationText,
        from_lat: city.latitude || undefined,
        from_lng: city.longitude || undefined,
      }));
      setSelectedFromCities([]);
      setFromGeoModal(null);
      setFromGeoSearch('');
      setErrors(prev => ({ ...prev, from_text: '' }));
      return;
    }

    // Multiple cities selected - keep them in selectedFromCities for display
    // Use first city as primary from location
    const firstCity = selectedFromCities[0];
    setFromCity(null); // Clear single city selection
    const locationText = selectedFromCities.map(city => city.name).join(', ');
    setFormData(prev => ({
      ...prev,
      from_text: locationText,
      from_lat: firstCity.latitude || undefined,
      from_lng: firstCity.longitude || undefined,
    }));

    // Don't add From cities as stops - they're already in selectedFromCities
    // Stops should only be for intermediate locations

    setFromGeoModal(null);
    setFromGeoSearch('');
    setErrors(prev => ({ ...prev, from_text: '' }));
  };

  const confirmMultipleToCities = () => {
    if (selectedToCities.length === 0) return;

    // If only one city selected, treat as single selection
    if (selectedToCities.length === 1) {
      const city = selectedToCities[0];
      setToCity(city);
      const locationText = buildLocationText(toCountry, toProvince, city);
      setFormData(prev => ({
        ...prev,
        to_text: locationText,
        to_lat: city.latitude || undefined,
        to_lng: city.longitude || undefined,
      }));
      setSelectedToCities([]);
      setToGeoModal(null);
      setToGeoSearch('');
      setErrors(prev => ({ ...prev, to_text: '' }));
      return;
    }

    // Multiple cities selected - keep them in selectedToCities for display
    // Use first city as primary to location
    const firstCity = selectedToCities[0];
    setToCity(null); // Clear single city selection
    const locationText = selectedToCities.map(city => city.name).join(', ');
    setFormData(prev => ({
      ...prev,
      to_text: locationText,
      to_lat: firstCity.latitude || undefined,
      to_lng: firstCity.longitude || undefined,
    }));

    // Don't add To cities as stops - they're already in selectedToCities
    // Stops should only be for intermediate locations

    setToGeoModal(null);
    setToGeoSearch('');
    setErrors(prev => ({ ...prev, to_text: '' }));
  };

  const cancelFromMultiSelect = () => {
    setSelectedFromCities([]);
    setFromGeoModal(null);
    setFromGeoSearch('');
  };

  const cancelToMultiSelect = () => {
    setSelectedToCities([]);
    setToGeoModal(null);
    setToGeoSearch('');
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

  const loadStopProvinces = async (stopId: string, countryId: number) => {
    try {
      setGeoLoading(true);
      const provinces = await DriverAPI.fetchGeoProvinces(countryId);
      setStopProvinces(prev => ({ ...prev, [stopId]: provinces }));
    } catch (error: any) {
      console.error('Failed to load provinces for stop:', error);
      showToast.error('Xatolik', 'Viloyatlarni yuklashda xatolik');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadStopCities = async (stopId: string, provinceId: number) => {
    try {
      setGeoLoading(true);
      const cities = await DriverAPI.fetchGeoCityDistricts(provinceId);
      setStopCities(prev => ({ ...prev, [stopId]: cities }));
    } catch (error: any) {
      console.error('Failed to load cities for stop:', error);
      showToast.error('Xatolik', 'Shaharlarni yuklashda xatolik');
    } finally {
      setGeoLoading(false);
    }
  };

  const openStopGeoModal = async (stopId: string, type: 'country' | 'province' | 'city', multiSelect = false) => {
    const stop = stops.find(s => s.id === stopId);
    if (!stop) return;

    if (type === 'province' && !stop.country) {
      showToast.error('Xatolik', 'Avval mamlakatni tanlang');
      return;
    }
    if (type === 'city' && !stop.province) {
      showToast.error('Xatolik', 'Avval viloyatni tanlang');
      return;
    }

    // If multi-select for cities, ensure cities are loaded
    if (multiSelect && type === 'city') {
      if (!stopCities[stopId] || stopCities[stopId].length === 0) {
        // Load cities if not already loaded
        await loadStopCities(stopId, stop.province!.id);
      }
      // Pre-select existing cities if any
      if (stop.selectedCities && stop.selectedCities.length > 0) {
        setSelectedCities(stop.selectedCities);
      } else if (stop.city) {
        setSelectedCities([stop.city]);
      } else {
        setSelectedCities([]);
      }
      setMultiSelectMode({ stopId, country: stop.country!, province: stop.province! });
    } else {
      // Clear multi-select mode for single select
      setMultiSelectMode(null);
      setSelectedCities([]);
    }

    setStopGeoModal({ stopId, type, multiSelect });
    setStopGeoSearch('');
  };

  const confirmMultipleCities = () => {
    if (!multiSelectMode || selectedCities.length === 0) return;

    const { stopId, country, province } = multiSelectMode;
    const stopIndex = stops.findIndex(s => s.id === stopId);
    if (stopIndex === -1) return;

    const updatedStops = [...stops];
    const stop = updatedStops[stopIndex];
    
    // Store multiple cities in the stop
    if (selectedCities.length === 1) {
      // Single city - use the city field
      stop.city = selectedCities[0];
      stop.selectedCities = undefined;
      stop.label_text = buildLocationText(country, province, selectedCities[0]);
      stop.lat = selectedCities[0].latitude || undefined;
      stop.lng = selectedCities[0].longitude || undefined;
    } else {
      // Multiple cities - store in selectedCities array
      stop.city = null; // Clear single city
      stop.selectedCities = selectedCities;
      stop.label_text = selectedCities.map(c => c.name).join(', ');
      // Use first city's coordinates
      stop.lat = selectedCities[0].latitude || undefined;
      stop.lng = selectedCities[0].longitude || undefined;
    }
    
    stop.country = country;
    stop.province = province;

    setStops(updatedStops);
    setSelectedCities([]);
    setMultiSelectMode(null);
    setStopGeoModal(null);
    setStopGeoSearch('');
  };

  const cancelMultiSelect = () => {
    setSelectedCities([]);
    setMultiSelectMode(null);
    setStopGeoModal(null);
    setStopGeoSearch('');
  };

  const handleStopGeoSelection = async (
    stopId: string,
    type: 'country' | 'province' | 'city',
    option: GeoOption
  ) => {
    try {
      const stopIndex = stops.findIndex(s => s.id === stopId);
      if (stopIndex === -1) return;

      const updatedStops = [...stops];
      const stop = updatedStops[stopIndex];

      switch (type) {
        case 'country':
          stop.country = option;
          stop.province = null;
          stop.city = null;
          stop.label_text = '';
          stop.lat = undefined;
          stop.lng = undefined;
          await loadStopProvinces(stopId, option.id);
          break;
        case 'province':
          stop.province = option;
          stop.city = null;
          stop.label_text = '';
          stop.lat = undefined;
          stop.lng = undefined;
          await loadStopCities(stopId, option.id);
          break;
        case 'city':
          // If in multi-select mode, handle differently
          if (stopGeoModal?.multiSelect) {
            // Toggle city selection
            const cityIndex = selectedCities.findIndex(c => c.id === option.id);
            if (cityIndex >= 0) {
              setSelectedCities(selectedCities.filter(c => c.id !== option.id));
            } else {
              setSelectedCities([...selectedCities, option]);
            }
            return; // Don't close modal, allow more selections
          } else {
            // Single select mode
            stop.city = option;
            stop.label_text = buildLocationText(stop.country, stop.province, option);
            stop.lat = option.latitude || undefined;
            stop.lng = option.longitude || undefined;
            setStopGeoModal(null);
            setStopGeoSearch('');
            setStops(updatedStops);
            return; // Close modal
          }
      }

      setStops(updatedStops);
      setStopGeoModal(null);
      setStopGeoSearch('');
    } catch (error: any) {
      console.error('Failed to handle stop geo selection:', error);
    }
  };

  const getStopGeoOptions = (stopId: string): GeoOption[] => {
    if (!stopGeoModal || stopGeoModal.stopId !== stopId) return [];

    let options: GeoOption[] = [];
    switch (stopGeoModal.type) {
      case 'country':
        options = stopCountries;
        break;
      case 'province':
        options = stopProvinces[stopId] || [];
        break;
      case 'city':
        options = stopCities[stopId] || [];
        break;
      default:
        return [];
    }

    if (stopGeoSearch.trim()) {
      const query = stopGeoSearch.toLowerCase();
      return options.filter(opt => opt.name.toLowerCase().includes(query));
    }

    return options;
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) {
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
      showToast.error('Xatolik', error.message || 'E\'lonni saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.stepContainer}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= step && styles.stepCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep >= step && styles.stepNumberActive,
                ]}
              >
                {step}
              </Text>
            </View>
            {step < 4 && (
              <View
                style={[
                  styles.stepLine,
                  currentStep > step && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('offerWizard.step1Title')}</Text>

      {/* From Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('offerWizard.fromLabel')}</Text>
        
        {/* Country */}
        <TouchableOpacity
          style={[styles.selectInput, errors.from_text && styles.inputError]}
          onPress={() => openFromGeoModal('country')}
        >
          <Text style={styles.selectInputText}>
            {fromCountry?.name || 'Mamlakatni tanlang'}
          </Text>
        </TouchableOpacity>

        {/* Province */}
        {fromCountry && (
          <TouchableOpacity
            style={[styles.selectInput, { marginTop: 8 }]}
            onPress={() => openFromGeoModal('province')}
            disabled={fromProvinces.length === 0}
          >
            <Text style={styles.selectInputText}>
              {fromProvince?.name || 'Viloyatni tanlang'}
            </Text>
          </TouchableOpacity>
        )}

        {/* City - Multi Select Only */}
        {fromProvince && (
          <TouchableOpacity
            style={[styles.selectInput, { marginTop: 8 }]}
            onPress={() => openFromGeoModal('city', true)}
            disabled={fromCities.length === 0}
          >
            <Text style={styles.selectInputText}>
              {selectedFromCities.length > 0 
                ? selectedFromCities.map(c => c.name).join(', ')
                : t('offerWizard.selectMultiple') || 'Bir nechta tanlash'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Location text display/input */}
        <View style={{ marginTop: 8 }}>
          {fromCity ? (
            <View style={styles.locationDisplay}>
              <Text style={styles.locationText}>
                {buildLocationText(fromCountry, fromProvince, fromCity)}
              </Text>
            </View>
          ) : selectedFromCities.length > 0 ? (
            <View>
              {/* Show country/province once if all cities are from same location */}
              {(fromCountry || fromProvince) && (
                <View style={styles.locationContext}>
                  <Text style={styles.locationContextText}>
                    {fromProvince ? `${fromProvince.name}${fromCountry ? `, ${fromCountry.name}` : ''}` : fromCountry?.name}
                  </Text>
                </View>
              )}
              <View style={styles.multipleLocationsDisplay}>
                {selectedFromCities.map((city, index) => (
                  <View key={city.id} style={styles.locationChip}>
                    <Text style={styles.locationChipText}>
                      {city.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const updated = selectedFromCities.filter(c => c.id !== city.id);
                        setSelectedFromCities(updated);
                        if (updated.length === 0) {
                          setFromCity(null);
                          setFormData(prev => ({ ...prev, from_text: '', from_lat: undefined, from_lng: undefined }));
                        } else if (updated.length === 1) {
                          const singleCity = updated[0];
                          setFromCity(singleCity);
                          const locationText = buildLocationText(fromCountry, fromProvince, singleCity);
                          setFormData(prev => ({
                            ...prev,
                            from_text: locationText,
                            from_lat: singleCity.latitude || undefined,
                            from_lng: singleCity.longitude || undefined,
                          }));
                        } else {
                          // Update formData with just city names
                          const locationText = updated.map(c => c.name).join(', ');
                          setFormData(prev => ({
                            ...prev,
                            from_text: locationText,
                          }));
                        }
                      }}
                      style={styles.chipRemoveButton}
                    >
                      <Text style={styles.chipRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <TextInput
              style={[styles.input, errors.from_text && styles.inputError]}
              placeholder={t('offerWizard.fromPlaceholder')}
              value={formData.from_text}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, from_text: text }));
                setErrors(prev => ({ ...prev, from_text: '' }));
              }}
            />
          )}
        </View>

        {errors.from_text && (
          <Text style={styles.errorText}>{errors.from_text}</Text>
        )}
      </View>

      {/* To Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('offerWizard.toLabel')}</Text>
        
        {/* Country */}
        <TouchableOpacity
          style={[styles.selectInput, errors.to_text && styles.inputError]}
          onPress={() => openToGeoModal('country')}
        >
          <Text style={styles.selectInputText}>
            {toCountry?.name || 'Mamlakatni tanlang'}
          </Text>
        </TouchableOpacity>

        {/* Province */}
        {toCountry && (
          <TouchableOpacity
            style={[styles.selectInput, { marginTop: 8 }]}
            onPress={() => openToGeoModal('province')}
            disabled={toProvinces.length === 0}
          >
            <Text style={styles.selectInputText}>
              {toProvince?.name || 'Viloyatni tanlang'}
            </Text>
          </TouchableOpacity>
        )}

        {/* City - Multi Select Only */}
        {toProvince && (
          <TouchableOpacity
            style={[styles.selectInput, { marginTop: 8 }]}
            onPress={() => openToGeoModal('city', true)}
            disabled={toCities.length === 0}
          >
            <Text style={styles.selectInputText}>
              {selectedToCities.length > 0 
                ? selectedToCities.map(c => c.name).join(', ')
                : t('offerWizard.selectMultiple') || 'Bir nechta tanlash'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Location text display/input */}
        <View style={{ marginTop: 8 }}>
          {toCity ? (
            <View style={styles.locationDisplay}>
              <Text style={styles.locationText}>
                {buildLocationText(toCountry, toProvince, toCity)}
              </Text>
            </View>
          ) : selectedToCities.length > 0 ? (
            <View>
              {/* Show country/province once if all cities are from same location */}
              {(toCountry || toProvince) && (
                <View style={styles.locationContext}>
                  <Text style={styles.locationContextText}>
                    {toProvince ? `${toProvince.name}${toCountry ? `, ${toCountry.name}` : ''}` : toCountry?.name}
                  </Text>
                </View>
              )}
              <View style={styles.multipleLocationsDisplay}>
                {selectedToCities.map((city, index) => (
                  <View key={city.id} style={styles.locationChip}>
                    <Text style={styles.locationChipText}>
                      {city.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const updated = selectedToCities.filter(c => c.id !== city.id);
                        setSelectedToCities(updated);
                        if (updated.length === 0) {
                          setToCity(null);
                          setFormData(prev => ({ ...prev, to_text: '', to_lat: undefined, to_lng: undefined }));
                        } else if (updated.length === 1) {
                          const singleCity = updated[0];
                          setToCity(singleCity);
                          const locationText = buildLocationText(toCountry, toProvince, singleCity);
                          setFormData(prev => ({
                            ...prev,
                            to_text: locationText,
                            to_lat: singleCity.latitude || undefined,
                            to_lng: singleCity.longitude || undefined,
                          }));
                        } else {
                          // Update formData with just city names
                          const locationText = updated.map(c => c.name).join(', ');
                          setFormData(prev => ({
                            ...prev,
                            to_text: locationText,
                          }));
                        }
                      }}
                      style={styles.chipRemoveButton}
                    >
                      <Text style={styles.chipRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <TextInput
              style={[styles.input, errors.to_text && styles.inputError]}
              placeholder={t('offerWizard.toPlaceholder')}
              value={formData.to_text}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, to_text: text }));
                setErrors(prev => ({ ...prev, to_text: '' }));
              }}
            />
          )}
        </View>

        {errors.to_text && (
          <Text style={styles.errorText}>{errors.to_text}</Text>
        )}
      </View>

      {/* Intermediate Stops Section */}
      <View style={styles.inputGroup}>
        <View style={styles.stopsHeader}>
          <Text style={styles.label}>{t('offerWizard.stopsLabel') || 'Orasidagi to\'xtash joylari (ixtiyoriy)'}</Text>
          <TouchableOpacity
            style={styles.addStopButton}
            onPress={addStop}
            activeOpacity={0.8}
          >
            <Text style={styles.addStopButtonText}>+ {t('offerWizard.addStop') || 'Qo\'shish'}</Text>
          </TouchableOpacity>
        </View>

        {stops.length === 0 && (
          <Text style={styles.helperText}>
            {t('offerWizard.stopsHelper') || 'Yo\'lda yo\'lovchilarni qabul qilish uchun to\'xtash joylarini qo\'shishingiz mumkin'}
          </Text>
        )}

        {stops.map((stop, index) => {
          // Check if this stop has cities that match From/To (to filter display)
          const hasValidCities = stop.city || (stop.selectedCities && stop.selectedCities.length > 0);
          const isDuplicate = hasValidCities && (
            (fromCity && stop.city?.id === fromCity.id) ||
            (selectedFromCities.some(c => stop.city?.id === c.id || stop.selectedCities?.some(sc => sc.id === c.id))) ||
            (toCity && stop.city?.id === toCity.id) ||
            (selectedToCities.some(c => stop.city?.id === c.id || stop.selectedCities?.some(sc => sc.id === c.id)))
          );
          
          return (
          <View key={stop.id} style={styles.stopCard}>
            <View style={styles.stopHeader}>
              <Text style={styles.stopNumber}>{t('offerWizard.stop') || 'To\'xtash'} {index + 1}</Text>
              <TouchableOpacity
                style={styles.removeStopButton}
                onPress={() => removeStop(stop.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeStopButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Country */}
            <TouchableOpacity
              style={[styles.selectInput, { marginTop: 8 }]}
              onPress={() => openStopGeoModal(stop.id, 'country')}
            >
              <Text style={styles.selectInputText}>
                {stop.country?.name || 'Mamlakatni tanlang'}
              </Text>
            </TouchableOpacity>

            {/* Province */}
            {stop.country && (
              <TouchableOpacity
                style={[styles.selectInput, { marginTop: 8 }]}
                onPress={() => openStopGeoModal(stop.id, 'province')}
                disabled={!stopProvinces[stop.id] || stopProvinces[stop.id].length === 0}
              >
                <Text style={styles.selectInputText}>
                  {stop.province?.name || 'Viloyatni tanlang'}
                </Text>
              </TouchableOpacity>
            )}

            {/* City - Multi Select Only */}
            {stop.province && (
              <TouchableOpacity
                style={[styles.selectInput, { marginTop: 8 }]}
                onPress={() => openStopGeoModal(stop.id, 'city', true)}
                disabled={!stopCities[stop.id] || stopCities[stop.id].length === 0}
              >
                <Text style={styles.selectInputText}>
                  {stop.selectedCities && stop.selectedCities.length > 0
                    ? stop.selectedCities.map(c => c.name).join(', ')
                    : stop.city?.name || t('offerWizard.selectMultiple') || 'Bir nechta tanlash'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Location display - show only city names if country/province are already selected above */}
            {(stop.city || (stop.selectedCities && stop.selectedCities.length > 0)) && (
              <View style={{ marginTop: 8 }}>
                {/* Show country/province once if all cities are from same location */}
                {(stop.country || stop.province) && (
                  <View style={styles.locationContext}>
                    <Text style={styles.locationContextText}>
                      {stop.province ? `${stop.province.name}${stop.country ? `, ${stop.country.name}` : ''}` : stop.country?.name}
                    </Text>
                  </View>
                )}
                {stop.selectedCities && stop.selectedCities.length > 0 ? (
                  <View style={styles.multipleLocationsDisplay}>
                    {stop.selectedCities.map((city) => (
                      <View key={city.id} style={styles.locationChip}>
                        <Text style={styles.locationChipText}>
                          {city.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            const updated = stop.selectedCities!.filter(c => c.id !== city.id);
                            const updatedStops = [...stops];
                            const stopIndex = updatedStops.findIndex(s => s.id === stop.id);
                            if (stopIndex >= 0) {
                              if (updated.length === 0) {
                                updatedStops[stopIndex].selectedCities = undefined;
                                updatedStops[stopIndex].city = null;
                                updatedStops[stopIndex].label_text = '';
                              } else if (updated.length === 1) {
                                updatedStops[stopIndex].city = updated[0];
                                updatedStops[stopIndex].selectedCities = undefined;
                                updatedStops[stopIndex].label_text = buildLocationText(stop.country, stop.province, updated[0]);
                              } else {
                                updatedStops[stopIndex].selectedCities = updated;
                                updatedStops[stopIndex].label_text = updated.map(c => c.name).join(', ');
                              }
                              setStops(updatedStops);
                            }
                          }}
                          style={styles.chipRemoveButton}
                        >
                          <Text style={styles.chipRemoveText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : stop.city ? (
                  <View style={[styles.locationDisplay, { marginTop: 0 }]}>
                    <Text style={styles.locationText}>
                      {stop.city.name}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
          );
        })}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('offerWizard.step2Title')}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('offerWizard.dateLabel')}</Text>
        <TouchableOpacity
          style={[styles.dateInput, errors.start_at && styles.inputError]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateInputText}>
            {selectedDate.toLocaleDateString('uz-UZ')}
          </Text>
        </TouchableOpacity>
        {errors.start_at && (
          <Text style={styles.errorText}>{errors.start_at}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('offerWizard.timeLabel')}</Text>
        <TouchableOpacity
          style={[styles.dateInput, errors.start_at && styles.inputError]}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateInputText}>
            {selectedTime.toLocaleTimeString('uz-UZ', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('offerWizard.step3Title')}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('offerWizard.vehicleLabel')}</Text>
        {vehicles.length > 0 ? (
          <>
            <View style={[styles.selectInput, errors.vehicle_id && styles.inputError]}>
              <Text style={styles.selectInputText}>{vehicles[0].label}</Text>
            </View>
            <Text style={styles.helperText}>
              Transport vositasi ma&apos;lumotlari profilingizdan avtomatik olinadi.
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.selectInput, errors.vehicle_id && styles.inputError]}>
              <Text style={styles.selectInputText}>
                Transport vositasi ma&apos;lumotlari topilmadi.
              </Text>
            </View>
            <Text style={styles.helperText}>
              Avval profil bo&apos;limida transport vositasini to&apos;ldiring, so&apos;ng e&apos;lon yarating.
            </Text>
          </>
        )}
        {errors.vehicle_id && (
          <Text style={styles.errorText}>{errors.vehicle_id}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('offerWizard.seatsLabel')}</Text>
        <TextInput
          style={[styles.input, errors.seats_total && styles.inputError]}
          placeholder="1-8"
          keyboardType="numeric"
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
            setFormData(prev => {
              let seats = prev.seats_total;
              if (!seats || isNaN(seats)) {
                seats = 1;
              }
              if (seats < 1) seats = 1;
              if (seats > 8) seats = 8;
              return { ...prev, seats_total: seats };
            });
          }}
        />
        {errors.seats_total && (
          <Text style={styles.errorText}>{errors.seats_total}</Text>
        )}
        <Text style={styles.helperText}>
          {t('offerWizard.seatsDescription')}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('offerWizard.priceLabel')}</Text>
        <TextInput
          style={[styles.input, errors.price_per_seat && styles.inputError]}
          placeholder="5000"
          keyboardType="numeric"
          value={formatPrice(formData.price_per_seat)}
          onChangeText={(text) => {
            const digits = text.replace(/[^\d]/g, '');
            if (digits.trim() === '') {
              setFormData(prev => ({ ...prev, price_per_seat: undefined }));
              return;
            }
            const num = parseInt(digits, 10);
            if (!isNaN(num)) {
              setFormData(prev => ({ ...prev, price_per_seat: num }));
              setErrors(prev => ({ ...prev, price_per_seat: '' }));
            }
          }}
          onBlur={() => {
            setFormData(prev => {
              let price = prev.price_per_seat;
              if (!price || isNaN(price)) {
                return { ...prev, price_per_seat: undefined };
              }
              if (price < 0) price = 0;
              return { ...prev, price_per_seat: price };
            });
          }}
        />
        {errors.price_per_seat && (
          <Text style={styles.errorText}>{errors.price_per_seat}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Oldingi o&apos;rin uchun narx (ixtiyoriy)</Text>
        <TextInput
          style={styles.input}
          placeholder="Masalan, 60000"
          keyboardType="numeric"
          value={formatPrice(formData.front_price_per_seat)}
          onChangeText={(text) => {
            const digits = text.replace(/[^\d]/g, '');
            if (digits.trim() === '') {
              setFormData(prev => ({ ...prev, front_price_per_seat: undefined }));
              return;
            }
            const num = parseInt(digits, 10);
            if (!isNaN(num)) {
              setFormData(prev => ({ ...prev, front_price_per_seat: num }));
            }
          }}
          onBlur={() => {
            setFormData(prev => {
              let price = prev.front_price_per_seat;
              if (price === undefined || price === null || isNaN(price)) {
                return { ...prev, front_price_per_seat: undefined };
              }
              if (price < (prev.price_per_seat || 0)) {
                // Ensure front seat price is not lower than regular; adjust up
                price = prev.price_per_seat || price;
              }
              return { ...prev, front_price_per_seat: price };
            });
          }}
        />
        <Text style={styles.helperText}>
          Oldingi o&apos;rindagi yo&apos;lovchilar uchun biroz yuqoriroq narx belgilashingiz mumkin.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('offerWizard.noteLabel')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('offerWizard.notePlaceholder')}
          multiline
          numberOfLines={4}
          value={formData.note || ''}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, note: text }));
          }}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('offerWizard.step4Title')}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('offerWizard.route')}</Text>
          <Text style={styles.summaryValue}>
            {formData.from_text} → {formData.to_text}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {t('offerWizard.departureTime')}
          </Text>
          <Text style={styles.summaryValue}>
            {formData.start_at
              ? new Date(formData.start_at).toLocaleString('uz-UZ')
              : '-'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('offerWizard.totalSeats')}</Text>
          <Text style={styles.summaryValue}>{formData.seats_total}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {t('offerWizard.pricePerSeat')}
          </Text>
          <Text style={styles.summaryValue}>
            {new Intl.NumberFormat('uz-UZ', {
              style: 'currency',
              currency: formData.currency || 'UZS',
              minimumFractionDigits: 0,
            }).format(formData.price_per_seat || 0)}
          </Text>
        </View>

        {formData.note && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('driverOffers.note')}</Text>
            <Text style={styles.summaryValue}>{formData.note}</Text>
          </View>
        )}

        {stops.filter(s => s.city).length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('offerWizard.stopsLabel') || 'To\'xtash joylari'}</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              {stops
                .filter(s => s.city)
                .map((stop, index) => (
                  <Text key={stop.id} style={styles.summaryValue}>
                    {index + 1}. {stop.city!.name}
                  </Text>
                ))}
            </View>
          </View>
        )}
      </View>
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('offerWizard.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderStepIndicator()}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        <View style={styles.footer}>
          {currentStep < 4 ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleBack}
              >
                <Text style={styles.buttonSecondaryText}>{t('common.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleNext}
              >
                <Text style={styles.buttonPrimaryText}>{t('common.next')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.buttonSecondaryText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => handleSave()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>
                    {offerId
                      ? t('offerWizard.updateOffer')
                      : t('offerWizard.createOffer')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* From Location Geo Modal */}
      {fromGeoModal && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={!!fromGeoModal}
          onRequestClose={() => {
            setFromGeoModal(null);
            setFromGeoSearch('');
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (fromGeoModal?.multiSelect) {
                  cancelFromMultiSelect();
                } else {
                  setFromGeoModal(null);
                  setFromGeoSearch('');
                }
              }}
            />
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContentWrapper}
            >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {fromGeoModal.type === 'country' && 'Mamlakatni tanlang'}
                  {fromGeoModal.type === 'province' && 'Viloyatni tanlang'}
                  {fromGeoModal.type === 'city' && (
                    fromGeoModal.multiSelect 
                      ? `${t('offerWizard.selectMultiple') || 'Bir nechta shahar tanlang'} (${selectedFromCities.length})`
                      : 'Shahar/Tumanni tanlang'
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (fromGeoModal.multiSelect) {
                      cancelFromMultiSelect();
                    } else {
                      setFromGeoModal(null);
                      setFromGeoSearch('');
                    }
                  }}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchBox}>
                <View style={styles.modalSearchContainer}>
                  <Text style={styles.modalSearchIcon}>🔍</Text>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Qidirish..."
                    placeholderTextColor="#9CA3AF"
                    value={fromGeoSearch}
                    onChangeText={setFromGeoSearch}
                  />
                  {fromGeoSearch.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setFromGeoSearch('')}
                      style={styles.modalSearchClear}
                    >
                      <Text style={styles.modalSearchClearText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {geoLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={theme.palette.primary.main} />
                </View>
              ) : getFromGeoOptions().length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>
                    {fromGeoSearch.trim() ? 'Topilmadi' : "Ma'lumot yo'q"}
                  </Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={getFromGeoOptions()}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => {
                      let isSelected = false;
                      
                      if (fromGeoModal.multiSelect && fromGeoModal.type === 'city') {
                        isSelected = selectedFromCities.some(c => c.id === item.id);
                      } else {
                        isSelected =
                          (fromGeoModal.type === 'country' && fromCountry?.id === item.id) ||
                          (fromGeoModal.type === 'province' && fromProvince?.id === item.id) ||
                          (fromGeoModal.type === 'city' && fromCity?.id === item.id);
                      }

                      return (
                        <TouchableOpacity
                          style={[
                            styles.modalItem,
                            isSelected && styles.modalItemSelected,
                          ]}
                          onPress={() => handleFromGeoSelection(fromGeoModal.type, item)}
                        >
                          <Text
                            style={[
                              styles.modalItemText,
                              isSelected && styles.modalItemTextSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                          {isSelected && <Text style={styles.modalCheck}>✓</Text>}
                        </TouchableOpacity>
                      );
                    }}
                    style={styles.modalList}
                  />
                  {fromGeoModal.multiSelect && fromGeoModal.type === 'city' && (
                    <View style={styles.modalFooter}>
                      <View style={styles.modalFooterInfo}>
                        <Text style={styles.modalFooterText}>
                          {selectedFromCities.length > 0 
                            ? `${selectedFromCities.length} ${t('offerWizard.stop') || 'to\'xtash'} tanlandi`
                            : t('offerWizard.selectCities') || 'Shaharlarni tanlang'}
                        </Text>
                      </View>
                      <View style={styles.modalFooterButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalButtonSecondary]}
                          onPress={cancelFromMultiSelect}
                        >
                          <Text style={styles.modalButtonSecondaryText}>
                            {t('common.cancel')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modalButton,
                            styles.modalButtonPrimary,
                            selectedFromCities.length === 0 && styles.modalButtonDisabled,
                          ]}
                          onPress={confirmMultipleFromCities}
                          disabled={selectedFromCities.length === 0}
                        >
                          <Text style={styles.modalButtonPrimaryText}>
                            {t('common.confirm')} ({selectedFromCities.length})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* To Location Geo Modal */}
      {toGeoModal && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={!!toGeoModal}
          onRequestClose={() => {
            setToGeoModal(null);
            setToGeoSearch('');
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (toGeoModal?.multiSelect) {
                  cancelToMultiSelect();
                } else {
                  setToGeoModal(null);
                  setToGeoSearch('');
                }
              }}
            />
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContentWrapper}
            >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {toGeoModal.type === 'country' && 'Mamlakatni tanlang'}
                  {toGeoModal.type === 'province' && 'Viloyatni tanlang'}
                  {toGeoModal.type === 'city' && (
                    toGeoModal.multiSelect 
                      ? `${t('offerWizard.selectMultiple') || 'Bir nechta shahar tanlang'} (${selectedToCities.length})`
                      : 'Shahar/Tumanni tanlang'
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (toGeoModal.multiSelect) {
                      cancelToMultiSelect();
                    } else {
                      setToGeoModal(null);
                      setToGeoSearch('');
                    }
                  }}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchBox}>
                <View style={styles.modalSearchContainer}>
                  <Text style={styles.modalSearchIcon}>🔍</Text>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Qidirish..."
                    placeholderTextColor="#9CA3AF"
                    value={toGeoSearch}
                    onChangeText={setToGeoSearch}
                  />
                  {toGeoSearch.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setToGeoSearch('')}
                      style={styles.modalSearchClear}
                    >
                      <Text style={styles.modalSearchClearText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {geoLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={theme.palette.primary.main} />
                </View>
              ) : getToGeoOptions().length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>
                    {toGeoSearch.trim() ? 'Topilmadi' : "Ma'lumot yo'q"}
                  </Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={getToGeoOptions()}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => {
                      let isSelected = false;
                      
                      if (toGeoModal.multiSelect && toGeoModal.type === 'city') {
                        isSelected = selectedToCities.some(c => c.id === item.id);
                      } else {
                        isSelected =
                          (toGeoModal.type === 'country' && toCountry?.id === item.id) ||
                          (toGeoModal.type === 'province' && toProvince?.id === item.id) ||
                          (toGeoModal.type === 'city' && toCity?.id === item.id);
                      }

                      return (
                        <TouchableOpacity
                          style={[
                            styles.modalItem,
                            isSelected && styles.modalItemSelected,
                          ]}
                          onPress={() => handleToGeoSelection(toGeoModal.type, item)}
                        >
                          <Text
                            style={[
                              styles.modalItemText,
                              isSelected && styles.modalItemTextSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                          {isSelected && <Text style={styles.modalCheck}>✓</Text>}
                        </TouchableOpacity>
                      );
                    }}
                    style={styles.modalList}
                  />
                  {toGeoModal.multiSelect && toGeoModal.type === 'city' && (
                    <View style={styles.modalFooter}>
                      <View style={styles.modalFooterInfo}>
                        <Text style={styles.modalFooterText}>
                          {selectedToCities.length > 0 
                            ? `${selectedToCities.length} ${t('offerWizard.stop') || 'to\'xtash'} tanlandi`
                            : t('offerWizard.selectCities') || 'Shaharlarni tanlang'}
                        </Text>
                      </View>
                      <View style={styles.modalFooterButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalButtonSecondary]}
                          onPress={cancelToMultiSelect}
                        >
                          <Text style={styles.modalButtonSecondaryText}>
                            {t('common.cancel')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modalButton,
                            styles.modalButtonPrimary,
                            selectedToCities.length === 0 && styles.modalButtonDisabled,
                          ]}
                          onPress={confirmMultipleToCities}
                          disabled={selectedToCities.length === 0}
                        >
                          <Text style={styles.modalButtonPrimaryText}>
                            {t('common.confirm')} ({selectedToCities.length})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Stop Location Geo Modal */}
      {stopGeoModal && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={!!stopGeoModal}
          onRequestClose={() => {
            setStopGeoModal(null);
            setStopGeoSearch('');
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (stopGeoModal.multiSelect) {
                  cancelMultiSelect();
                } else {
                  setStopGeoModal(null);
                  setStopGeoSearch('');
                }
              }}
            />
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContentWrapper}
            >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {stopGeoModal.type === 'country' && 'Mamlakatni tanlang'}
                  {stopGeoModal.type === 'province' && 'Viloyatni tanlang'}
                  {stopGeoModal.type === 'city' && (
                    stopGeoModal.multiSelect 
                      ? `${t('offerWizard.selectMultiple') || 'Bir nechta shahar tanlang'} (${selectedCities.length})`
                      : 'Shahar/Tumanni tanlang'
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (stopGeoModal.multiSelect) {
                      cancelMultiSelect();
                    } else {
                      setStopGeoModal(null);
                      setStopGeoSearch('');
                    }
                  }}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchBox}>
                <View style={styles.modalSearchContainer}>
                  <Text style={styles.modalSearchIcon}>🔍</Text>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Qidirish..."
                    placeholderTextColor="#9CA3AF"
                    value={stopGeoSearch}
                    onChangeText={setStopGeoSearch}
                  />
                  {stopGeoSearch.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setStopGeoSearch('')}
                      style={styles.modalSearchClear}
                    >
                      <Text style={styles.modalSearchClearText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {geoLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={theme.palette.primary.main} />
                </View>
              ) : getStopGeoOptions(stopGeoModal.stopId).length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>
                    {stopGeoSearch.trim() ? 'Topilmadi' : "Ma'lumot yo'q"}
                  </Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={getStopGeoOptions(stopGeoModal.stopId)}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => {
                      const stop = stops.find(s => s.id === stopGeoModal.stopId);
                      let isSelected = false;
                      
                      if (stopGeoModal.multiSelect && stopGeoModal.type === 'city') {
                        isSelected = selectedCities.some(c => c.id === item.id);
                      } else {
                        isSelected =
                          (stopGeoModal.type === 'country' && stop?.country?.id === item.id) ||
                          (stopGeoModal.type === 'province' && stop?.province?.id === item.id) ||
                          (stopGeoModal.type === 'city' && stop?.city?.id === item.id);
                      }

                      return (
                        <TouchableOpacity
                          style={[
                            styles.modalItem,
                            isSelected && styles.modalItemSelected,
                          ]}
                          onPress={() => handleStopGeoSelection(stopGeoModal.stopId, stopGeoModal.type, item)}
                        >
                          <Text
                            style={[
                              styles.modalItemText,
                              isSelected && styles.modalItemTextSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                          {isSelected && <Text style={styles.modalCheck}>✓</Text>}
                        </TouchableOpacity>
                      );
                    }}
                    style={styles.modalList}
                  />
                  {stopGeoModal.multiSelect && stopGeoModal.type === 'city' && (
                    <View style={styles.modalFooter}>
                      <View style={styles.modalFooterInfo}>
                        <Text style={styles.modalFooterText}>
                          {selectedCities.length > 0 
                            ? `${selectedCities.length} ${t('offerWizard.stop') || 'to\'xtash'} tanlandi`
                            : t('offerWizard.selectCities') || 'Shaharlarni tanlang'}
                        </Text>
                      </View>
                      <View style={styles.modalFooterButtons}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalButtonSecondary]}
                          onPress={cancelMultiSelect}
                        >
                          <Text style={styles.modalButtonSecondaryText}>
                            {t('common.cancel')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modalButton,
                            styles.modalButtonPrimary,
                            selectedCities.length === 0 && styles.modalButtonDisabled,
                          ]}
                          onPress={confirmMultipleCities}
                          disabled={selectedCities.length === 0}
                        >
                          <Text style={styles.modalButtonPrimaryText}>
                            {t('common.confirm')} ({selectedCities.length})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 60,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 50,
    height: 3,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '800',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  selectInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#000',
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
    color: '#111827',
    fontWeight: '500',
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#000',
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
    color: '#111827',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
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
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  buttonPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonSecondaryText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  // Geo Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentWrapper: {
    width: '95%',
    maxHeight: '95%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '95%',
    minHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000',
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
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.5,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: 20,
  },
  modalSearchBox: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    minHeight: 52,
  },
  modalSearchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#6B7280',
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    fontWeight: '500',
  },
  modalSearchClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSearchClearText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: 16,
  },
  modalList: {
    maxHeight: 500,
    backgroundColor: '#FFFFFF',
  },
  modalLoading: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalEmpty: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#9CA3AF',
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
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  modalItemSelected: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    borderBottomColor: '#D1FAE5',
  },
  modalItemText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  modalItemTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  modalCheck: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: '700',
    marginLeft: 12,
  },
  locationDisplay: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 14,
    padding: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  stopsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addStopButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addStopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stopCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopNumber: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
  },
  removeStopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeStopButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  multiSelectButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  multiSelectButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  modalFooterInfo: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalFooterText: {
    fontSize: 15,
    color: '#6B7280',
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
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modalButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalButtonSecondaryText: {
    color: '#111827',
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
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  locationChipText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginRight: 8,
  },
  chipRemoveButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRemoveText: {
    color: '#FFFFFF',
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
    color: '#6B7280',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});

