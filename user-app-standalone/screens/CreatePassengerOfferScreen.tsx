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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { createPassengerOffer, CreatePassengerOfferData } from '../api/passengerOffers';
import { useTranslation } from '../hooks/useTranslation';
import * as GeoAPI from '../api/geo';
import type { GeoOption } from '../api/geo';

type MainStackParamList = {
  Menu: undefined;
  CreatePassengerOffer: undefined;
  MyPassengerOffers: undefined;
};

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const CreatePassengerOfferScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  
  // Geo selection states for "From" location
  const [fromGeoModal, setFromGeoModal] = useState<{ type: 'country' | 'province' | 'city' } | null>(null);
  const [fromGeoSearch, setFromGeoSearch] = useState('');
  const [fromCountries, setFromCountries] = useState<GeoOption[]>([]);
  const [fromProvinces, setFromProvinces] = useState<GeoOption[]>([]);
  const [fromCities, setFromCities] = useState<GeoOption[]>([]);
  const [fromCountry, setFromCountry] = useState<GeoOption | null>(null);
  const [fromProvince, setFromProvince] = useState<GeoOption | null>(null);
  const [fromCity, setFromCity] = useState<GeoOption | null>(null);
  const [fromText, setFromText] = useState('');

  // Geo selection states for "To" location
  const [toGeoModal, setToGeoModal] = useState<{ type: 'country' | 'province' | 'city' } | null>(null);
  const [toGeoSearch, setToGeoSearch] = useState('');
  const [toCountries, setToCountries] = useState<GeoOption[]>([]);
  const [toProvinces, setToProvinces] = useState<GeoOption[]>([]);
  const [toCities, setToCities] = useState<GeoOption[]>([]);
  const [toCountry, setToCountry] = useState<GeoOption | null>(null);
  const [toProvince, setToProvince] = useState<GeoOption | null>(null);
  const [toCity, setToCity] = useState<GeoOption | null>(null);
  const [toText, setToText] = useState('');

  const [geoLoading, setGeoLoading] = useState(false);
  
  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour from now
  const [selectedTime, setSelectedTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  
  const [seatsNeeded, setSeatsNeeded] = useState('1');
  const [maxPricePerSeat, setMaxPricePerSeat] = useState('');
  const [frontSeat, setFrontSeat] = useState(false);
  const [pets, setPets] = useState(false);
  const [largeBaggage, setLargeBaggage] = useState(false);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Format number with spaces every 3 digits
  const formatNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add space every 3 digits from right
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Parse formatted number back to number string
  const parseNumber = (formattedValue: string): string => {
    return formattedValue.replace(/\s/g, '');
  };

  // Calculate overall price
  const calculateTotalPrice = (): number => {
    const seats = parseInt(seatsNeeded) || 0;
    const pricePerSeat = parseFloat(maxPricePerSeat) || 0;
    return seats * pricePerSeat;
  };

  // Load initial geo data
  useEffect(() => {
    loadGeoCountries();
  }, []);

  const loadGeoCountries = async () => {
    try {
      setGeoLoading(true);
      const countries = await GeoAPI.fetchGeoCountries();
      setFromCountries(countries);
      setToCountries(countries);
      
      // Auto-select Uzbekistan as default country for From
      const uzbekistan = countries.find(country => 
        country.name.toLowerCase().includes('zbekistan')
      );
      if (uzbekistan && !fromCountry) {
        setFromCountry(uzbekistan);
        await loadFromProvinces(uzbekistan.id);
      }
      
      // Auto-select Uzbekistan as default country for To
      if (uzbekistan && !toCountry) {
        setToCountry(uzbekistan);
        await loadToProvinces(uzbekistan.id);
      }
    } catch (error: any) {
      console.error('Failed to load countries:', error);
      Alert.alert(t('common.error'), 'Failed to load countries');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadFromProvinces = async (countryId: number) => {
    try {
      setGeoLoading(true);
      const provinces = await GeoAPI.fetchGeoProvinces(countryId);
      setFromProvinces(provinces);
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      Alert.alert(t('common.error'), 'Failed to load provinces');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadFromCities = async (provinceId: number) => {
    try {
      setGeoLoading(true);
      const cities = await GeoAPI.fetchGeoCityDistricts(provinceId);
      setFromCities(cities);
    } catch (error: any) {
      console.error('Failed to load cities:', error);
      Alert.alert(t('common.error'), 'Failed to load cities');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadToProvinces = async (countryId: number) => {
    try {
      setGeoLoading(true);
      const provinces = await GeoAPI.fetchGeoProvinces(countryId);
      setToProvinces(provinces);
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      Alert.alert(t('common.error'), 'Failed to load provinces');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadToCities = async (provinceId: number) => {
    try {
      setGeoLoading(true);
      const cities = await GeoAPI.fetchGeoCityDistricts(provinceId);
      setToCities(cities);
    } catch (error: any) {
      console.error('Failed to load cities:', error);
      Alert.alert(t('common.error'), 'Failed to load cities');
    } finally {
      setGeoLoading(false);
    }
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
          setFromText('');
          setErrors(prev => ({ ...prev, from_text: '' }));
          await loadFromProvinces(option.id);
          break;
        case 'province':
          setFromProvince(option);
          setFromCity(null);
          setFromCities([]);
          setFromText('');
          setErrors(prev => ({ ...prev, from_text: '' }));
          await loadFromCities(option.id);
          break;
        case 'city':
          setFromCity(option);
          const locationText = buildLocationText(fromCountry, fromProvince, option);
          setFromText(locationText);
          setErrors(prev => ({ ...prev, from_text: '' }));
          setFromGeoModal(null);
          setFromGeoSearch('');
          return;
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
          setToText('');
          setErrors(prev => ({ ...prev, to_text: '' }));
          await loadToProvinces(option.id);
          break;
        case 'province':
          setToProvince(option);
          setToCity(null);
          setToCities([]);
          setToText('');
          setErrors(prev => ({ ...prev, to_text: '' }));
          await loadToCities(option.id);
          break;
        case 'city':
          setToCity(option);
          const locationText = buildLocationText(toCountry, toProvince, option);
          setToText(locationText);
          setErrors(prev => ({ ...prev, to_text: '' }));
          setToGeoModal(null);
          setToGeoSearch('');
          return;
      }
      setToGeoModal(null);
      setToGeoSearch('');
    } catch (error: any) {
      console.error('Failed to handle geo selection:', error);
    }
  };

  const openFromGeoModal = async (type: 'country' | 'province' | 'city') => {
    setFromGeoSearch('');
    if (type === 'province' && !fromCountry) {
      Alert.alert(t('common.error'), t('passengerOffers.selectCountry'));
      return;
    }
    if (type === 'city' && !fromProvince) {
      Alert.alert(t('common.error'), t('passengerOffers.selectProvince'));
      return;
    }

    if (type === 'province' && fromCountry) {
      await loadFromProvinces(fromCountry.id);
    } else if (type === 'city' && fromProvince) {
      await loadFromCities(fromProvince.id);
    }

    setFromGeoModal({ type });
  };

  const openToGeoModal = async (type: 'country' | 'province' | 'city') => {
    setToGeoSearch('');
    if (type === 'province' && !toCountry) {
      Alert.alert(t('common.error'), t('passengerOffers.selectCountry'));
      return;
    }
    if (type === 'city' && !toProvince) {
      Alert.alert(t('common.error'), t('passengerOffers.selectProvince'));
      return;
    }

    if (type === 'province' && toCountry) {
      await loadToProvinces(toCountry.id);
    } else if (type === 'city' && toProvince) {
      await loadToCities(toProvince.id);
    }

    setToGeoModal({ type });
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
    // Store the combined date/time - we'll use it in validation and submission
  };

  const getStartAtDate = (): Date => {
    const combined = new Date(selectedDate);
    combined.setHours(selectedTime.getHours());
    combined.setMinutes(selectedTime.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const fromLocationText = fromCity
      ? buildLocationText(fromCountry, fromProvince, fromCity)
      : fromText.trim();
    
    if (!fromLocationText) {
      newErrors.from_text = t('passengerOffers.errorFromLocation');
    }

    const toLocationText = toCity
      ? buildLocationText(toCountry, toProvince, toCity)
      : toText.trim();
    
    if (!toLocationText) {
      newErrors.to_text = t('passengerOffers.errorToLocation');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert(t('common.error'), t('passengerOffers.errorAllFields'));
      return false;
    }

    setErrors({});

    const seats = parseInt(seatsNeeded);
    if (isNaN(seats) || seats < 1 || seats > 8) {
      Alert.alert(t('common.error'), t('passengerOffers.errorSeats'));
      return false;
    }

    const price = parseFloat(maxPricePerSeat);
    if (isNaN(price) || price <= 0) {
      Alert.alert(t('common.error'), t('passengerOffers.errorPrice'));
      return false;
    }

    // Check if start time is in the future
    const startAtDate = getStartAtDate();
    const minDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    if (startAtDate < minDate) {
      newErrors.start_at = t('passengerOffers.errorTime');
      setErrors(newErrors);
      Alert.alert(t('common.error'), t('passengerOffers.errorTime'));
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const startAtDate = getStartAtDate();

      // Use geo-selected location text if available, otherwise use manual text input
      const finalFromText = fromText || (fromCity ? buildLocationText(fromCountry, fromProvince, fromCity) : '');
      const finalToText = toText || (toCity ? buildLocationText(toCountry, toProvince, toCity) : '');

      const offerData: CreatePassengerOfferData = {
        from_text: finalFromText.trim(),
        from_lat: fromCity?.latitude || undefined,
        from_lng: fromCity?.longitude || undefined,
        from_country_id: fromCountry?.id || undefined,
        from_province_id: fromProvince?.id || undefined,
        from_city_id: fromCity?.id || undefined,
        to_text: finalToText.trim(),
        to_lat: toCity?.latitude || undefined,
        to_lng: toCity?.longitude || undefined,
        to_country_id: toCountry?.id || undefined,
        to_province_id: toProvince?.id || undefined,
        to_city_id: toCity?.id || undefined,
        start_at: startAtDate.toISOString(),
        seats_needed: parseInt(seatsNeeded),
        max_price_per_seat: parseFloat(maxPricePerSeat),
        currency: 'UZS',
        front_seat: frontSeat,
        pets: pets,
        large_baggage: largeBaggage,
        note: note.trim() || undefined,
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

  const clearFromLocation = () => {
    setFromCountry(null);
    setFromProvince(null);
    setFromCity(null);
    setFromProvinces([]);
    setFromCities([]);
    setFromText('');
  };

  const clearToLocation = () => {
    setToCountry(null);
    setToProvince(null);
    setToCity(null);
    setToProvinces([]);
    setToCities([]);
    setToText('');
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
        {/* Route Card */}
        <View style={styles.routeCard}>
          <Text style={styles.cardTitle}>{t('passengerOffers.route')}</Text>
          
          {/* From Location */}
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>{t('passengerOffers.fromRequired')}</Text>
              
              {/* Country */}
              <TouchableOpacity
                style={[styles.selectInput, errors.from_text && styles.inputError]}
                onPress={() => openFromGeoModal('country')}
              >
                <Text style={styles.selectInputText}>
                  {fromCountry?.name || t('passengerOffers.selectCountry')}
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
                    {fromProvince?.name || t('passengerOffers.selectProvince')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* City */}
              {fromProvince && (
                <TouchableOpacity
                  style={[styles.selectInput, { marginTop: 8 }]}
                  onPress={() => openFromGeoModal('city')}
                  disabled={fromCities.length === 0}
                >
                  <Text style={styles.selectInputText}>
                    {fromCity?.name || t('passengerOffers.selectCity')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Location Display or Manual Input */}
              <View style={{ marginTop: 8 }}>
                {fromCity ? (
                  <View style={styles.locationDisplay}>
                    <Text style={styles.locationText}>
                      {buildLocationText(fromCountry, fromProvince, fromCity)}
                    </Text>
                    <TouchableOpacity
                      style={styles.clearLocationButton}
                      onPress={clearFromLocation}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, errors.from_text && styles.inputError]}
                    value={fromText}
                    onChangeText={setFromText}
                    placeholder={t('passengerOffers.orEnterManually')}
                    placeholderTextColor="#9CA3AF"
                  />
                )}
              </View>

              {errors.from_text && (
                <Text style={styles.errorText}>{errors.from_text}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.routeConnector}>
            <View style={styles.routeLine} />
            <View style={styles.routeArrowContainer}>
              <Ionicons name="arrow-down" size={20} color="#10B981" />
            </View>
          </View>
          
          {/* To Location */}
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>{t('passengerOffers.toRequired')}</Text>
              
              {/* Country */}
              <TouchableOpacity
                style={[styles.selectInput, errors.to_text && styles.inputError]}
                onPress={() => openToGeoModal('country')}
              >
                <Text style={styles.selectInputText}>
                  {toCountry?.name || t('passengerOffers.selectCountry')}
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
                    {toProvince?.name || t('passengerOffers.selectProvince')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* City */}
              {toProvince && (
                <TouchableOpacity
                  style={[styles.selectInput, { marginTop: 8 }]}
                  onPress={() => openToGeoModal('city')}
                  disabled={toCities.length === 0}
                >
                  <Text style={styles.selectInputText}>
                    {toCity?.name || t('passengerOffers.selectCity')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Location Display or Manual Input */}
              <View style={{ marginTop: 8 }}>
                {toCity ? (
                  <View style={styles.locationDisplay}>
                    <Text style={styles.locationText}>
                      {buildLocationText(toCountry, toProvince, toCity)}
                    </Text>
                    <TouchableOpacity
                      style={styles.clearLocationButton}
                      onPress={clearToLocation}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, errors.to_text && styles.inputError]}
                    value={toText}
                    onChangeText={setToText}
                    placeholder={t('passengerOffers.orEnterManually')}
                    placeholderTextColor="#9CA3AF"
                  />
                )}
              </View>

              {errors.to_text && (
                <Text style={styles.errorText}>{errors.to_text}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Date & Time Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{t('passengerOffers.dateTime')}</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('passengerOffers.dateRequired')}</Text>
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
            <Text style={styles.label}>{t('passengerOffers.timeRequired')}</Text>
            <TouchableOpacity
              style={[styles.dateInput, errors.start_at && styles.inputError]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateInputText}>
                {selectedTime.toLocaleTimeString('uz-UZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
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
              is24Hour={true}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Seats & Price Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{t('passengerOffers.seatsBudget')}</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="people" size={24} color="#10B981" />
              </View>
              <Text style={styles.infoLabel} numberOfLines={2}>{t('passengerOffers.seatsNeededRequired')}</Text>
              <TextInput
                style={styles.numberInput}
                value={formatNumber(seatsNeeded)}
                onChangeText={(text) => {
                  const parsed = parseNumber(text);
                  if (parsed === '' || (!isNaN(parseInt(parsed)) && parseInt(parsed) >= 0 && parseInt(parsed) <= 8)) {
                    setSeatsNeeded(parsed);
                  }
                }}
                placeholder="1"
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
                textAlign="center"
              />
              <View style={styles.currencySpacer} />
            </View>
            
            <View style={styles.infoCard}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cash" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.infoLabel} numberOfLines={2}>{t('passengerOffers.maxPricePerSeatRequired')}</Text>
              <TextInput
                style={styles.numberInput}
                value={formatNumber(maxPricePerSeat)}
                onChangeText={(text) => {
                  const parsed = parseNumber(text);
                  if (parsed === '' || (!isNaN(parseFloat(parsed)) && parseFloat(parsed) >= 0)) {
                    setMaxPricePerSeat(parsed);
                  }
                }}
                placeholder="50 000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
                textAlign="center"
              />
              <Text style={styles.currencyText}>UZS</Text>
            </View>
          </View>

          {/* Overall Price Display */}
          {(seatsNeeded && maxPricePerSeat && parseInt(seatsNeeded) > 0 && parseFloat(maxPricePerSeat) > 0) && (
            <View style={styles.totalPriceContainer}>
              <View style={styles.totalPriceDivider} />
              <View style={styles.totalPriceContent}>
                <View style={styles.totalPriceIconContainer}>
                  <Ionicons name="calculator" size={20} color="#10B981" />
                </View>
                <View style={styles.totalPriceTextContainer}>
                  <Text style={styles.totalPriceLabel}>{t('passengerOffers.totalPrice') || 'Jami narx'}</Text>
                  <Text style={styles.totalPriceValue}>
                    {formatNumber(calculateTotalPrice().toString())} UZS
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Options Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{t('passengerOffers.additionalOptions')}</Text>
          
          <View style={styles.optionsContainer}>
            {/* Front Seat */}
            <TouchableOpacity
              style={[styles.optionRow, frontSeat && styles.optionRowActive]}
              onPress={() => setFrontSeat(!frontSeat)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="car-sport" size={20} color="#3B82F6" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{t('passengerOffers.frontSeat')}</Text>
                  <Text style={styles.optionDescription}>{t('passengerOffers.frontSeatDescription')}</Text>
                </View>
              </View>
              <View style={[styles.toggleSwitch, frontSeat && styles.toggleSwitchActive]}>
                <View style={[styles.toggleSwitchThumb, frontSeat && styles.toggleSwitchThumbActive]} />
              </View>
            </TouchableOpacity>

            {/* Pets */}
            <TouchableOpacity
              style={[styles.optionRow, pets && styles.optionRowActive]}
              onPress={() => setPets(!pets)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="paw" size={20} color="#F59E0B" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{t('passengerOffers.pets')}</Text>
                  <Text style={styles.optionDescription}>{t('passengerOffers.petsDescription')}</Text>
                </View>
              </View>
              <View style={[styles.toggleSwitch, pets && styles.toggleSwitchActive]}>
                <View style={[styles.toggleSwitchThumb, pets && styles.toggleSwitchThumbActive]} />
              </View>
            </TouchableOpacity>

            {/* Large Baggage */}
            <TouchableOpacity
              style={[styles.optionRow, largeBaggage && styles.optionRowActive]}
              onPress={() => setLargeBaggage(!largeBaggage)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIconContainer, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="bag" size={20} color="#6366F1" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{t('passengerOffers.largeBaggage')}</Text>
                  <Text style={styles.optionDescription}>{t('passengerOffers.largeBaggageDescription')}</Text>
                </View>
              </View>
              <View style={[styles.toggleSwitch, largeBaggage && styles.toggleSwitchActive]}>
                <View style={[styles.toggleSwitchThumb, largeBaggage && styles.toggleSwitchThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Card */}
        <View style={styles.detailsCard}>
          <View style={styles.noteHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#10B981" />
            <Text style={styles.cardTitle}>{t('passengerOffers.additionalNotes')}</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder={t('passengerOffers.notesPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>{t('passengerOffers.createButton')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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
                setFromGeoModal(null);
                setFromGeoSearch('');
              }}
            />
            <View style={styles.modalContentWrapper}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {fromGeoModal.type === 'country' && t('passengerOffers.selectCountry')}
                    {fromGeoModal.type === 'province' && t('passengerOffers.selectProvince')}
                    {fromGeoModal.type === 'city' && t('passengerOffers.selectCity')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setFromGeoModal(null);
                      setFromGeoSearch('');
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
                      placeholder={t('searchOffers.searchPlaceholder')}
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
                    <ActivityIndicator size="small" color="#10B981" />
                  </View>
                ) : getFromGeoOptions().length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>
                      {fromGeoSearch.trim() ? t('searchOffers.noRidesAvailable') : t('common.info')}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={getFromGeoOptions()}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => {
                      const isSelected =
                        (fromGeoModal.type === 'country' && fromCountry?.id === item.id) ||
                        (fromGeoModal.type === 'province' && fromProvince?.id === item.id) ||
                        (fromGeoModal.type === 'city' && fromCity?.id === item.id);

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
                )}
              </View>
            </View>
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
                setToGeoModal(null);
                setToGeoSearch('');
              }}
            />
            <View style={styles.modalContentWrapper}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {toGeoModal.type === 'country' && t('passengerOffers.selectCountry')}
                    {toGeoModal.type === 'province' && t('passengerOffers.selectProvince')}
                    {toGeoModal.type === 'city' && t('passengerOffers.selectCity')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setToGeoModal(null);
                      setToGeoSearch('');
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
                      placeholder={t('searchOffers.searchPlaceholder')}
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
                    <ActivityIndicator size="small" color="#10B981" />
                  </View>
                ) : getToGeoOptions().length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>
                      {toGeoSearch.trim() ? t('searchOffers.noRidesAvailable') : t('common.info')}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={getToGeoOptions()}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => {
                      const isSelected =
                        (toGeoModal.type === 'country' && toCountry?.id === item.id) ||
                        (toGeoModal.type === 'province' && toProvince?.id === item.id) ||
                        (toGeoModal.type === 'city' && toCity?.id === item.id);

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
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    marginRight: 16,
    marginTop: 4,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
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
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '600',
  },
  locationDisplay: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  clearLocationButton: {
    marginLeft: 12,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    marginVertical: 12,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  routeArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 10,
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
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 200,
  },
  infoIconContainer: {
    width: 52,
    height: 52,
    minHeight: 52,
    maxHeight: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    height: 32,
    minHeight: 32,
    maxHeight: 32,
    lineHeight: 16,
  },
  numberInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    width: '100%',
    height: 56,
    minHeight: 56,
    maxHeight: 56,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  currencyText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
    height: 16,
    lineHeight: 16,
    textAlign: 'center',
    width: '100%',
  },
  currencySpacer: {
    height: 16,
    marginTop: 4,
    width: '100%',
  },
  totalPriceContainer: {
    marginTop: 20,
    paddingTop: 20,
  },
  totalPriceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  totalPriceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  totalPriceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  totalPriceTextContainer: {
    flex: 1,
  },
  totalPriceLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalPriceValue: {
    fontSize: 24,
    color: '#059669',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
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
  footer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
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
  // Modal Styles
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
    shadowOffset: { width: 0, height: 12 },
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
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  optionRowActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
    position: 'relative',
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleSwitchThumbActive: {
    left: 'auto',
    right: 2,
  },
});
