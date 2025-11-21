/**
 * Driver Personal Info Screen (Step 1)
 * Collects driver's personal information and address
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError, parseValidationErrors } from '../utils/errorHandler';
import {
  updatePersonalInfo,
  getDriverProfileStatus,
  uploadImage,
  getDriverProfile,
  fetchGeoCountries,
  fetchGeoProvinces,
  fetchGeoCityDistricts,
  fetchGeoAdministrativeAreas,
  fetchGeoSettlements,
  fetchGeoNeighborhoods,
  type GeoOption,
  type DriverProfile,
} from '../api/driver';
import { validateForm, isValidEmail, type ValidationRule } from '../utils/validation';

const theme = createTheme('light');

export const DriverPersonalInfoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { t } = useTranslation();

  type GeoFieldType =
    | 'country'
    | 'province'
    | 'city_district'
    | 'administrative_area'
    | 'settlement'
    | 'neighborhood';

  const initialFormState = {
    first_name: '',
    last_name: '',
    father_name: '',
    gender: '' as 'male' | 'female' | '',
    birth_date: '',
    email: '',
    address_country_id: null as number | null,
    address_province_id: null as number | null,
    address_city_district_id: null as number | null,
    address_administrative_area_id: null as number | null,
    address_settlement_id: null as number | null,
    address_neighborhood_id: null as number | null,
    address_street: '',
    photo_face_url: '',
    photo_body_url: '',
    vehicle_owner_type: '' as 'own' | 'other_person' | 'company' | '',
    vehicle_usage_type: '' as 'rent' | 'free_use' | '',
  };

  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [photoFaceUri, setPhotoFaceUri] = useState<string | null>(null);
  const [photoBodyUri, setPhotoBodyUri] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [geoModalType, setGeoModalType] = useState<GeoFieldType | null>(null);
  const [geoModalLoading, setGeoModalLoading] = useState<boolean>(false);
  const [geoSearchQuery, setGeoSearchQuery] = useState<string>('');
  const [countries, setCountries] = useState<GeoOption[]>([]);
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cityDistricts, setCityDistricts] = useState<GeoOption[]>([]);
  const [administrativeAreas, setAdministrativeAreas] = useState<GeoOption[]>([]);
  const [settlements, setSettlements] = useState<GeoOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<GeoOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<GeoOption | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<GeoOption | null>(null);
  const [selectedCityDistrict, setSelectedCityDistrict] = useState<GeoOption | null>(null);
  const [selectedAdministrativeArea, setSelectedAdministrativeArea] = useState<GeoOption | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<GeoOption | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<GeoOption | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  type FormFieldKey = keyof typeof formData;

  const getInputStyle = (field: FormFieldKey) => [
    styles.input,
    fieldErrors[field] ? styles.inputError : undefined,
  ];

  const getLabelStyle = (field: FormFieldKey | string) => [
    styles.label,
    fieldErrors[field] ? styles.labelError : undefined,
  ];

  const getSelectContainerStyle = (field: string) => [
    styles.selectInput,
    fieldErrors[field] ? styles.selectInputError : undefined,
  ];

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const convertDateFormat = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    
    // If already in DD.MM.YYYY format, return as is
    if (dateString.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
      return dateString;
    }
    
    // If in YYYY-MM-DD format, convert to DD.MM.YYYY
    const isoMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2].padStart(2, '0');
      const day = isoMatch[3].padStart(2, '0');
      return `${day}.${month}.${year}`;
    }
    
    // Return as is if format is unknown
    return dateString;
  };

  const parseDate = (dateString: string): Date | null => {
    // Parse DD.MM.YYYY format
    const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) return null;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
    const year = parseInt(match[3], 10);
    
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > new Date().getFullYear()) {
      return null;
    }
    
    const date = new Date(year, month, day);
    // Validate the date (e.g., check for invalid dates like 31.02.2000)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };

  const handleDateInputChange = (text: string) => {
    // Remove all non-digits
    const digitsOnly = text.replace(/\D/g, '');
    
    // Limit to 8 digits (DDMMYYYY)
    if (digitsOnly.length > 8) return;
    
    // Auto-format as user types: DD.MM.YYYY
    let formatted = digitsOnly;
    if (digitsOnly.length > 4) {
      // Insert dots: DDMMYYYY -> DD.MM.YYYY
      formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2, 4) + '.' + digitsOnly.slice(4);
    } else if (digitsOnly.length > 2) {
      // Insert first dot: DDMM -> DD.MM
      formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2);
    }
    
    updateField('birth_date', formatted);
    
    // If valid format (DD.MM.YYYY), update selectedDate
    if (formatted.length === 10) {
      const parsedDate = parseDate(formatted);
      if (parsedDate) {
        setSelectedDate(parsedDate);
      }
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) {
        return prev;
      }
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleDateConfirm = () => {
    setSelectedDate(tempDate);
    const formattedDate = formatDate(tempDate);
    updateField('birth_date', formattedDate);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setTempDate(selectedDate || new Date(2000, 0, 1));
    setShowDatePicker(true);
  };

  const generateDays = () => {
    const days = [];
    const maxDay = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= maxDay; i++) {
      days.push(i);
    }
    return days;
  };

  const generateMonths = () => {
    return [
      { value: 0, label: 'Yanvar' },
      { value: 1, label: 'Fevral' },
      { value: 2, label: 'Mart' },
      { value: 3, label: 'Aprel' },
      { value: 4, label: 'May' },
      { value: 5, label: 'Iyun' },
      { value: 6, label: 'Iyul' },
      { value: 7, label: 'Avgust' },
      { value: 8, label: 'Sentabr' },
      { value: 9, label: 'Oktabr' },
      { value: 10, label: 'Noyabr' },
      { value: 11, label: 'Dekabr' },
    ];
  };

  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  const geoLevels: GeoFieldType[] = [
    'country',
    'province',
    'city_district',
    'administrative_area',
    'settlement',
    'neighborhood',
  ];

  const geoFieldMap: Record<GeoFieldType, keyof typeof formData> = {
    country: 'address_country_id',
    province: 'address_province_id',
    city_district: 'address_city_district_id',
    administrative_area: 'address_administrative_area_id',
    settlement: 'address_settlement_id',
    neighborhood: 'address_neighborhood_id',
  };

  const findOptionById = (
    options: GeoOption[],
    id?: number | null,
    fallback?: GeoOption | null
  ): GeoOption | null => {
    if (id == null) {
      return null;
    }
    const found = options.find((option) => option.id === id);
    if (found) {
      return found;
    }
    return fallback ?? null;
  };

  const ensureOptionInList = (options: GeoOption[], option: GeoOption | null) => {
    if (!option) {
      return options;
    }
    if (options.some((item) => item.id === option.id)) {
      return options;
    }
    return [...options, option].sort((a, b) => a.name.localeCompare(b.name));
  };

  const loadProvinces = async (countryId: number): Promise<GeoOption[]> => {
    try {
      const data = await fetchGeoProvinces(countryId);
      setProvinces(data);
      return data;
    } catch (error) {
      console.error('Failed to load provinces:', error);
      setProvinces([]);
      return [];
    }
  };

  const loadCityDistrictsList = async (provinceId: number): Promise<GeoOption[]> => {
    try {
      const data = await fetchGeoCityDistricts(provinceId);
      setCityDistricts(data);
      return data;
    } catch (error) {
      console.error('Failed to load city districts:', error);
      setCityDistricts([]);
      return [];
    }
  };

  const loadCityChildren = async (cityDistrictId: number) => {
    try {
      const [areasData, settlementsData, neighborhoodsData] = await Promise.all([
        fetchGeoAdministrativeAreas(cityDistrictId),
        fetchGeoSettlements(cityDistrictId),
        fetchGeoNeighborhoods(cityDistrictId),
      ]);
      setAdministrativeAreas(areasData);
      setSettlements(settlementsData);
      setNeighborhoods(neighborhoodsData);
      return {
        areas: areasData,
        settlements: settlementsData,
        neighborhoods: neighborhoodsData,
      };
    } catch (error) {
      console.error('Failed to load city related geo data:', error);
      setAdministrativeAreas([]);
      setSettlements([]);
      setNeighborhoods([]);
      return { areas: [] as GeoOption[], settlements: [] as GeoOption[], neighborhoods: [] as GeoOption[] };
    }
  };

  const resetGeoSelectionBelow = (level: GeoFieldType) => {
    const levelIndex = geoLevels.indexOf(level);
    if (levelIndex === -1) return;

    for (let i = levelIndex + 1; i < geoLevels.length; i++) {
      const lvl = geoLevels[i];
      const field = geoFieldMap[lvl] as string;
      updateField(field, null);

      switch (lvl) {
        case 'province':
          setSelectedProvince(null);
          setProvinces([]);
          break;
        case 'city_district':
          setSelectedCityDistrict(null);
          setCityDistricts([]);
          break;
        case 'administrative_area':
          setSelectedAdministrativeArea(null);
          setAdministrativeAreas([]);
          break;
        case 'settlement':
          setSelectedSettlement(null);
          setSettlements([]);
          break;
        case 'neighborhood':
          setSelectedNeighborhood(null);
          setNeighborhoods([]);
          break;
      }
    }
  };

  const loadInitialProfileData = async () => {
    if (!token) return;

    try {
      setInitialLoading(true);
      const [countriesData, profileResponse] = await Promise.all([
        fetchGeoCountries(),
        getDriverProfile(token),
      ]);

      setCountries(countriesData);

      const profile = profileResponse.profile;
      if (profile) {
        const updatedForm = {
          ...initialFormState,
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? '',
          father_name: profile.father_name ?? '',
          gender: (profile.gender as 'male' | 'female' | '') ?? '',
          birth_date: convertDateFormat(profile.birth_date),
          email: profile.email ?? '',
          address_country_id: profile.address_country_id ?? null,
          address_province_id: profile.address_province_id ?? null,
          address_city_district_id: profile.address_city_district_id ?? null,
          address_administrative_area_id: profile.address_administrative_area_id ?? null,
          address_settlement_id: profile.address_settlement_id ?? null,
          address_neighborhood_id: profile.address_neighborhood_id ?? null,
          address_street: profile.address_street ?? '',
          photo_face_url: profile.photo_face_url ?? '',
          photo_body_url: profile.photo_body_url ?? '',
          vehicle_owner_type: (profile.vehicle_owner_type as 'own' | 'other_person' | 'company' | '') ?? '',
          vehicle_usage_type: (profile.vehicle_usage_type as 'rent' | 'free_use' | '') ?? '',
        };
        setFormData(updatedForm);
        setFieldErrors({});

        if (profile.photo_face_url) {
          setPhotoFaceUri(profile.photo_face_url);
        } else {
          setPhotoFaceUri(null);
        }

        if (profile.photo_body_url) {
          setPhotoBodyUri(profile.photo_body_url);
        } else {
          setPhotoBodyUri(null);
        }

        if (profile.address_country_id) {
          let countryOption = findOptionById(
            countriesData,
            profile.address_country_id,
            profile.addressCountry ?? null
          );
          if (countryOption) {
            if (countryOption && !countriesData.some((item) => item.id === countryOption.id)) {
              const updatedCountries = ensureOptionInList(countriesData, countryOption);
              setCountries(updatedCountries);
            }
            setSelectedCountry(countryOption);
          }

          const provincesData = await loadProvinces(profile.address_country_id);
          if (profile.address_province_id) {
            let provinceOption = findOptionById(
              provincesData,
              profile.address_province_id,
              profile.addressProvince ?? null
            );
            if (provinceOption) {
              if (!provincesData.some((item) => item.id === provinceOption.id)) {
                setProvinces(ensureOptionInList(provincesData, provinceOption));
              }
              setSelectedProvince(provinceOption);

              const cityDistrictsData = await loadCityDistrictsList(provinceOption.id);
              if (profile.address_city_district_id) {
                let cityOption = findOptionById(
                  cityDistrictsData,
                  profile.address_city_district_id,
                  profile.addressCityDistrict ?? null
                );
                if (cityOption) {
                  if (!cityDistrictsData.some((item) => item.id === cityOption.id)) {
                    setCityDistricts(ensureOptionInList(cityDistrictsData, cityOption));
                  }
                  setSelectedCityDistrict(cityOption);

                  const { areas, settlements: settlementsData, neighborhoods: neighborhoodsData } =
                    await loadCityChildren(cityOption.id);

                  if (profile.address_administrative_area_id) {
                    let areaOption = findOptionById(
                      areas,
                      profile.address_administrative_area_id,
                      profile.addressAdministrativeArea ?? null
                    );
                  if (areaOption) {
                      if (!areas.some((item) => item.id === areaOption.id)) {
                        setAdministrativeAreas(ensureOptionInList(areas, areaOption));
                      }
                      setSelectedAdministrativeArea(areaOption);
                    }
                  }

                  if (profile.address_settlement_id) {
                    let settlementOption = findOptionById(
                      settlementsData,
                      profile.address_settlement_id,
                      profile.addressSettlement ?? null
                    );
                    if (settlementOption) {
                      if (!settlementsData.some((item) => item.id === settlementOption.id)) {
                        setSettlements(ensureOptionInList(settlementsData, settlementOption));
                      }
                      setSelectedSettlement(settlementOption);
                    }
                  }

                  if (profile.address_neighborhood_id) {
                    let neighborhoodOption = findOptionById(
                      neighborhoodsData,
                      profile.address_neighborhood_id,
                      profile.addressNeighborhood ?? null
                    );
                    if (neighborhoodOption) {
                      if (!neighborhoodsData.some((item) => item.id === neighborhoodOption.id)) {
                        setNeighborhoods(ensureOptionInList(neighborhoodsData, neighborhoodOption));
                      }
                      setSelectedNeighborhood(neighborhoodOption);
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        setFormData(initialFormState);
        setPhotoFaceUri(null);
        setPhotoBodyUri(null);
        setSelectedCountry(null);
        setSelectedProvince(null);
        setSelectedCityDistrict(null);
        setSelectedAdministrativeArea(null);
        setSelectedSettlement(null);
        setSelectedNeighborhood(null);
        setProvinces([]);
        setCityDistricts([]);
        setAdministrativeAreas([]);
        setSettlements([]);
        setNeighborhoods([]);
      }
    } catch (error) {
      console.error('Failed to load driver profile data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const openGeoSelector = (type: GeoFieldType) => {
    if (initialLoading) {
      return;
    }

    switch (type) {
      case 'province':
        if (!formData.address_country_id) {
          showToast.error(t('common.error'), "Avval mamlakatni tanlang");
          return;
        }
        if (provinces.length === 0) {
          showToast.error(t('common.error'), "Ushbu mamlakat uchun viloyatlar mavjud emas");
          return;
        }
        break;
      case 'city_district':
        if (!formData.address_province_id) {
          showToast.error(t('common.error'), "Avval viloyatni tanlang");
          return;
        }
        if (cityDistricts.length === 0) {
          showToast.error(t('common.error'), "Ushbu viloyat uchun shahar/tuman topilmadi");
          return;
        }
        break;
      case 'administrative_area':
      case 'settlement':
      case 'neighborhood':
        if (!formData.address_city_district_id) {
          showToast.error(t('common.error'), "Avval shahar yoki tumanni tanlang");
          return;
        }
        break;
    }

    setGeoSearchQuery(''); // Reset search when opening modal
    setGeoModalType(type);
  };

  const handleGeoSelection = async (type: GeoFieldType, option: GeoOption) => {
    const fieldName = geoFieldMap[type] as string;
    setFieldErrors((prev) => {
      if (!prev[fieldName]) {
        return prev;
      }
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });

    try {
      switch (type) {
        case 'country':
          if (formData.address_country_id !== option.id) {
            updateField('address_country_id', option.id);
            setSelectedCountry(option);
            resetGeoSelectionBelow('country');
            await loadProvinces(option.id);
          } else {
            setSelectedCountry(option);
          }
          break;
        case 'province':
          if (formData.address_province_id !== option.id) {
            updateField('address_province_id', option.id);
            setSelectedProvince(option);
            resetGeoSelectionBelow('province');
            await loadCityDistrictsList(option.id);
          } else {
            setSelectedProvince(option);
          }
          break;
        case 'city_district':
          if (formData.address_city_district_id !== option.id) {
            updateField('address_city_district_id', option.id);
            setSelectedCityDistrict(option);
            resetGeoSelectionBelow('city_district');
            await loadCityChildren(option.id);
          } else {
            setSelectedCityDistrict(option);
          }
          break;
        case 'administrative_area':
          updateField('address_administrative_area_id', option.id);
          setSelectedAdministrativeArea(option);
          break;
        case 'settlement':
          updateField('address_settlement_id', option.id);
          setSelectedSettlement(option);
          break;
        case 'neighborhood':
          updateField('address_neighborhood_id', option.id);
          setSelectedNeighborhood(option);
          break;
      }
    } catch (error) {
      console.error('Failed to process geo selection:', error);
      showToast.error(t('common.error'), 'Manzil maʼlumotlarini yuklashda xatolik');
    } finally {
      setGeoModalType(null);
      setGeoSearchQuery(''); // Clear search when closing modal
    }
  };

  const getGeoOptionsForModal = (type: GeoFieldType | null): GeoOption[] => {
    if (!type) return [];
    let options: GeoOption[] = [];
    switch (type) {
      case 'country':
        options = countries;
        break;
      case 'province':
        options = provinces;
        break;
      case 'city_district':
        options = cityDistricts;
        break;
      case 'administrative_area':
        options = administrativeAreas;
        break;
      case 'settlement':
        options = settlements;
        break;
      case 'neighborhood':
        options = neighborhoods;
        break;
      default:
        return [];
    }
    
    // Filter options based on search query
    if (geoSearchQuery.trim()) {
      const query = geoSearchQuery.toLowerCase().trim();
      return options.filter((option) => {
        const nameMatch = option.name.toLowerCase().includes(query);
        const typeMatch = option.type?.toLowerCase().includes(query);
        return nameMatch || typeMatch;
      });
    }
    
    return options;
  };

  const getGeoModalTitle = (type: GeoFieldType | null): string => {
    switch (type) {
      case 'country':
        return 'Mamlakatni tanlang';
      case 'province':
        return 'Viloyatni tanlang';
      case 'city_district':
        return 'Shahar yoki tumanni tanlang';
      case 'administrative_area':
        return 'Maʼmuriy hududni tanlang';
      case 'settlement':
        return 'Aholi punktini tanlang';
      case 'neighborhood':
        return 'Mahallani tanlang';
      default:
        return '';
    }
  };

  // Check registration status on mount and request permissions
  useEffect(() => {
    if (!token) return;
    checkRegistrationStatus();
    loadInitialProfileData();
  }, [token]);

  const handleImagePicker = async (photoType: 'face' | 'body') => {
    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    Alert.alert(
      'Rasm tanlash',
      'Rasmni qanday tanlamoqchisiz?',
      [
        {
          text: 'Kamera',
          onPress: () => pickImage(photoType, 'camera'),
        },
        {
          text: 'Galereya',
          onPress: () => pickImage(photoType, 'library'),
        },
        {
          text: 'Bekor qilish',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (photoType: 'face' | 'body', source: 'camera' | 'library') => {
    try {
      if (Platform.OS !== 'web') {
        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Ruxsat kerak',
              'Kameradan foydalanish uchun ruxsat bering'
            );
            return;
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Ruxsat kerak',
              'Galereyadan rasm tanlash uchun ruxsat bering'
            );
            return;
          }
        }
      }

      setUploadingPhoto(photoType);

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: photoType === 'face' ? [1, 1] : [3, 4],
        quality: 0.8,
      };

      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploadingPhoto(null);
        return;
      }

      const asset = result.assets[0];
      
      // Convert to base64
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          
          // Extract file extension from URI
          const uriParts = asset.uri.split('.');
          const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
          
          // Upload to server
          if (!token) {
            throw new Error('Token is required');
          }
          const imageUrl = await uploadImage(token, base64, fileExtension);
          
          // Update state and form data
          if (photoType === 'face') {
            setPhotoFaceUri(asset.uri);
            updateField('photo_face_url', imageUrl);
          } else {
            setPhotoBodyUri(asset.uri);
            updateField('photo_body_url', imageUrl);
          }
          
          showToast.success(t('common.success'), 'Rasm muvaffaqiyatli yuklandi');
        } catch (error) {
          console.error('Failed to upload image:', error);
          showToast.error(t('common.error'), 'Rasmni yuklashda xatolik');
        } finally {
          setUploadingPhoto(null);
        }
      };
      
      reader.onerror = () => {
        setUploadingPhoto(null);
        showToast.error(t('common.error'), 'Rasmni o\'qishda xatolik');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Image picker error:', error);
      setUploadingPhoto(null);
      showToast.error(t('common.error'), 'Rasmni tanlashda xatolik');
    }
  };

  const checkRegistrationStatus = async () => {
    if (!token) return;
    
    try {
      console.log('Checking registration status... token', token);
      const status = await getDriverProfileStatus(token);
      console.log('Registration status', status);
      // If profile exists and not on personal step, navigate to correct step
      if (status.hasProfile && status.registrationStep !== 'personal') {
        navigateToStep(status.registrationStep);
      }
    } catch (error) {
      console.error('Failed to check registration status:', error);
    }
  };

  const navigateToStep = (step: string) => {
    switch (step) {
      case 'passport':
        navigation.navigate('DriverPassport' as any);
        break;
      case 'license':
        navigation.navigate('DriverLicense' as any);
        break;
      case 'vehicle':
        navigation.navigate('DriverVehicle' as any);
        break;
      case 'taxi_license':
        navigation.navigate('DriverTaxiLicense' as any);
        break;
      case 'complete':
        navigation.navigate('Home' as any);
        break;
    }
  };

  const handleContinue = async () => {
    // Frontend validation
    const validationRules: ValidationRule[] = [
      {
        field: 'first_name',
        value: formData.first_name,
        rules: [
          { type: 'required', errorKey: 'formValidation.firstNameRequired' },
          { type: 'minLength', errorKey: 'formValidation.firstNameTooShort', params: { min: 2 } },
        ],
      },
      {
        field: 'last_name',
        value: formData.last_name,
        rules: [
          { type: 'required', errorKey: 'formValidation.lastNameRequired' },
          { type: 'minLength', errorKey: 'formValidation.lastNameTooShort', params: { min: 2 } },
        ],
      },
      {
        field: 'gender',
        value: formData.gender,
        rules: [
          { type: 'required', errorKey: 'formValidation.genderRequired' },
          { type: 'in', errorKey: 'formValidation.genderInvalid', params: { values: ['male', 'female'] } },
        ],
      },
    ];

    if (formData.birth_date) {
      validationRules.push({
        field: 'birth_date',
        value: formData.birth_date,
        rules: [
          { type: 'date', errorKey: 'formValidation.birthDateInvalid' },
        ],
      });
    }

    // Add email validation only if email is provided
    if (formData.email) {
      validationRules.push({
        field: 'email',
        value: formData.email,
        rules: [
          { type: 'email', errorKey: 'formValidation.emailInvalid' },
        ],
      });
    }

    const validationErrors = validateForm(validationRules, t);

    const errorsMap = validationErrors.reduce<Record<string, string>>((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {});

    const geoErrors: Record<string, string> = {};
    if (!formData.address_country_id) {
      geoErrors.address_country_id = 'Mamlakatni tanlang';
    }
    if (!formData.address_province_id) {
      geoErrors.address_province_id = 'Viloyatni tanlang';
    }
    if (!formData.address_city_district_id) {
      geoErrors.address_city_district_id = 'Shahar yoki tumanni tanlang';
    }

    const combinedErrors = { ...errorsMap, ...geoErrors };

    if (Object.keys(combinedErrors).length > 0) {
      setFieldErrors(combinedErrors);
      showToast.error(t('common.error'), t('formValidation.fixErrors'));
      return;
    }

    setFieldErrors({});

    if (!token) {
      showToast.error(t('common.error'), t('errors.unauthorized'));
      return;
    }

    setIsLoading(true);

    try {
      // Remove empty strings but keep nulls so backend can clear selections
      const cleanDataEntries = Object.entries(formData).map(([key, value]) => {
        if (typeof value === 'string') {
          return [key, value.trim()];
        }
        return [key, value];
      });

      const cleanData = Object.fromEntries(
        cleanDataEntries.filter(([_, value]) => value !== '' && value !== undefined)
      );

      await updatePersonalInfo(token, cleanData as Partial<DriverProfile>);
      
      showToast.success(t('common.success'), t('driver.profileUpdated'));
      
      // Navigate to next step (Passport)
      navigation.navigate('DriverPassport' as any);
    } catch (error: any) {
      console.error('Failed to save personal info:', error);
      
      // Check if it's a validation error from backend
      if (error?.response?.status === 422 && error?.response?.data?.errors) {
        // Parse validation errors and map to form fields
        const apiErrors = parseValidationErrors(error);
        
        // Map API field names to form field names if needed
        const mappedErrors: Record<string, string> = {};
        Object.keys(apiErrors).forEach((apiField) => {
          // API field names should match form field names, but we can map if needed
          // For example: 'address_country' -> 'address_country_id'
          let formField = apiField;
          
          // Handle any field name mappings if necessary
          if (apiField === 'address_country') {
            formField = 'address_country_id';
          } else if (apiField === 'address_province') {
            formField = 'address_province_id';
          } else if (apiField === 'address_city_district') {
            formField = 'address_city_district_id';
          } else if (apiField === 'address_administrative_area') {
            formField = 'address_administrative_area_id';
          } else if (apiField === 'address_settlement') {
            formField = 'address_settlement_id';
          } else if (apiField === 'address_neighborhood') {
            formField = 'address_neighborhood_id';
          }
          
          mappedErrors[formField] = apiErrors[apiField];
        });
        
        // Set field errors to display under each field
        setFieldErrors(mappedErrors);
        
        // Also show a general error toast
        const firstError = Object.values(mappedErrors)[0];
        if (firstError) {
          showToast.error(t('common.error'), firstError);
        }
      } else {
        // For non-validation errors, show general error
        handleBackendError(error, {
          t,
          defaultMessage: t('userDetails.errorUpdate'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('PhoneRegistration' as any)}
              disabled={isLoading || initialLoading}
            >
              <View style={styles.backButtonContent}>
                <Text style={styles.backButtonArrow}>←</Text>
                <Text style={styles.backButtonText}>Orqaga</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.brand}>UbexGo Driver</Text>
            <Text style={styles.title}>Shaharlar aro</Text>
            <Text style={styles.subtitle}>HAYDOVCHI MA'LUMOTLARI</Text>
            <Text style={styles.description}>
              (FISH va tug'ilgan sana passport bo'yicha)
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.requiredHint}>{t('userDetails.requiredField')}</Text>

            {/* Personal Information */}
            <View style={styles.inputGroup}>
            <Text style={getLabelStyle('first_name')}>
                {t('userDetails.firstName')} <Text style={styles.requiredMarker}>*</Text>
            </Text>
            <TextInput
              style={getInputStyle('first_name')}
              placeholder={t('userDetails.firstNamePlaceholder')}
              placeholderTextColor={theme.palette.text.disabled}
              value={formData.first_name}
              onChangeText={(value) => updateField('first_name', value)}
              editable={!isLoading}
            />
            {fieldErrors.first_name && <Text style={styles.errorText}>{fieldErrors.first_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('last_name')}>
                {t('userDetails.lastName')} <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('last_name')}
              placeholder={t('userDetails.lastNamePlaceholder')}
              placeholderTextColor={theme.palette.text.disabled}
                value={formData.last_name}
                onChangeText={(value) => updateField('last_name', value)}
                editable={!isLoading}
              />
              {fieldErrors.last_name && <Text style={styles.errorText}>{fieldErrors.last_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('father_name')}>
                {t('userDetails.fatherName')}
              </Text>
              <TextInput
                style={getInputStyle('father_name')}
              placeholder={t('userDetails.fatherNamePlaceholder')}
              placeholderTextColor={theme.palette.text.disabled}
                value={formData.father_name}
                onChangeText={(value) => updateField('father_name', value)}
                editable={!isLoading}
              />
              {fieldErrors.father_name && <Text style={styles.errorText}>{fieldErrors.father_name}</Text>}
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('gender')}>
                {t('userDetails.gender')} <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={styles.genderOption}
                  onPress={() => updateField('gender', 'male')}
                  disabled={isLoading}
                >
                  <View style={[styles.radio, formData.gender === 'male' && styles.radioActive]} />
                  <Text style={styles.genderLabel}>-Erkak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.genderOption}
                  onPress={() => updateField('gender', 'female')}
                  disabled={isLoading}
                >
                  <View style={[styles.radio, formData.gender === 'female' && styles.radioActive]} />
                  <Text style={styles.genderLabel}>-Ayol</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.gender && <Text style={styles.errorText}>{fieldErrors.gender}</Text>}
            </View>

            {/* Birth Date */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('birth_date')}>
                {t('userDetails.birthDate')}
              </Text>
              <View style={[styles.dateInputContainer, fieldErrors.birth_date ? styles.inputError : undefined]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="KK.OO.YYYY"
                  value={formData.birth_date}
                  onChangeText={handleDateInputChange}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={theme.palette.text.secondary}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={openDatePicker}
                  disabled={isLoading}
                >
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.birth_date && <Text style={styles.errorText}>{fieldErrors.birth_date}</Text>}
            </View>

          {/* Simple Date Picker Modal */}
          {showDatePicker && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showDatePicker}
              onRequestClose={handleDateCancel}
            >
              <View style={styles.modalOverlay}>
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={handleDateCancel}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleDateCancel}>
                      <Text style={styles.modalCancelText}>Bekor</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Sanani tanlang</Text>
                    <TouchableOpacity onPress={handleDateConfirm}>
                      <Text style={styles.modalConfirmText}>Tasdiqlash</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerContainer}>
                    {/* Day Picker */}
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>Kun</Text>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {generateDays().map((day) => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.pickerItem,
                              tempDate.getDate() === day && styles.pickerItemSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), day);
                              setTempDate(newDate);
                            }}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              tempDate.getDate() === day && styles.pickerItemTextSelected
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Month Picker */}
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>Oy</Text>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {generateMonths().map((month) => (
                          <TouchableOpacity
                            key={month.value}
                            style={[
                              styles.pickerItem,
                              tempDate.getMonth() === month.value && styles.pickerItemSelected
                            ]}
                            onPress={() => {
                              const maxDay = new Date(tempDate.getFullYear(), month.value + 1, 0).getDate();
                              const day = Math.min(tempDate.getDate(), maxDay);
                              const newDate = new Date(tempDate.getFullYear(), month.value, day);
                              setTempDate(newDate);
                            }}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              tempDate.getMonth() === month.value && styles.pickerItemTextSelected
                            ]}>
                              {month.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Year Picker */}
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>Yil</Text>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {generateYears().map((year) => (
                          <TouchableOpacity
                            key={year}
                            style={[
                              styles.pickerItem,
                              tempDate.getFullYear() === year && styles.pickerItemSelected
                            ]}
                            onPress={() => {
                              const maxDay = new Date(year, tempDate.getMonth() + 1, 0).getDate();
                              const day = Math.min(tempDate.getDate(), maxDay);
                              const newDate = new Date(year, tempDate.getMonth(), day);
                              setTempDate(newDate);
                            }}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              tempDate.getFullYear() === year && styles.pickerItemTextSelected
                            ]}>
                              {year}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
          )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('email')}>
                {t('userDetails.email')}
              </Text>
              <TextInput
                style={getInputStyle('email')}
                placeholder={t('userDetails.emailPlaceholder')}
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
            </View>

            {/* Current Address */}
            <Text style={styles.sectionTitle}>Hozirgi yashash manzili</Text>
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('address_country_id')}>Mamlakat</Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('address_country_id'),
                  (initialLoading || isLoading) && styles.selectInputDisabled,
                ]}
                onPress={() => openGeoSelector('country')}
                disabled={initialLoading || isLoading}
              >
                <Text
                  style={
                    selectedCountry ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedCountry?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.address_country_id && (
                <Text style={styles.errorText}>{fieldErrors.address_country_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('address_province_id')}>Viloyat</Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('address_province_id'),
                  ((!formData.address_country_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('province')}
                disabled={
                  initialLoading || isLoading || !formData.address_country_id || provinces.length === 0
                }
              >
                <Text
                  style={
                    selectedProvince ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedProvince?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.address_province_id && (
                <Text style={styles.errorText}>{fieldErrors.address_province_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('address_city_district_id')}>Shahar / Tuman</Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('address_city_district_id'),
                  ((!formData.address_province_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('city_district')}
                disabled={
                  initialLoading || isLoading || !formData.address_province_id || cityDistricts.length === 0
                }
              >
                <Text
                  style={
                    selectedCityDistrict ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedCityDistrict?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.address_city_district_id && (
                <Text style={styles.errorText}>{fieldErrors.address_city_district_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('address_administrative_area_id')}>
                Ma'muriy hudud
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('address_administrative_area_id'),
                  ((!formData.address_city_district_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('administrative_area')}
                disabled={
                  initialLoading || isLoading || !formData.address_city_district_id || administrativeAreas.length === 0
                }
              >
                <Text
                  style={
                    selectedAdministrativeArea ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedAdministrativeArea?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.address_administrative_area_id && (
                <Text style={styles.errorText}>{fieldErrors.address_administrative_area_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('address_settlement_id')}>Aholi punkti</Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('address_settlement_id'),
                  ((!formData.address_city_district_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('settlement')}
                disabled={
                  initialLoading || isLoading || !formData.address_city_district_id || settlements.length === 0
                }
              >
                <Text
                  style={
                    selectedSettlement ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedSettlement
                    ? selectedSettlement.type
                      ? `${selectedSettlement.name} (${selectedSettlement.type})`
                      : selectedSettlement.name
                    : 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.address_settlement_id && (
                <Text style={styles.errorText}>{fieldErrors.address_settlement_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('address_neighborhood_id')}>Mahalla</Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('address_neighborhood_id'),
                  ((!formData.address_city_district_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('neighborhood')}
                disabled={
                  initialLoading || isLoading || !formData.address_city_district_id || neighborhoods.length === 0
                }
              >
                <Text
                  style={
                    selectedNeighborhood ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedNeighborhood?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.address_neighborhood_id && (
                <Text style={styles.errorText}>{fieldErrors.address_neighborhood_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('address_street')}>Ko'cha va uy</Text>
              <TextInput
                style={getInputStyle('address_street')}
                placeholder=""
                value={formData.address_street}
                onChangeText={(value) => updateField('address_street', value)}
                editable={!isLoading}
              />
              {fieldErrors.address_street && (
                <Text style={styles.errorText}>{fieldErrors.address_street}</Text>
              )}
            </View>

            {/* Photo Uploads */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Haydovchi yuz rasmi (selfi)</Text>
              <Text style={styles.helperText}>(Fuqaro rasmi bor tomoni)</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('face')}
                disabled={isLoading || uploadingPhoto === 'face'}
              >
                {uploadingPhoto === 'face' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoFaceUri ? (
                  <Image source={{ uri: photoFaceUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Haydovchi to'liq qomat rasmi</Text>
              <Text style={styles.helperText}>(Fuqaro rasmi bor tomoni)</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('body')}
                disabled={isLoading || uploadingPhoto === 'body'}
              >
                {uploadingPhoto === 'body' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoBodyUri ? (
                  <Image source={{ uri: photoBodyUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Vehicle Ownership */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>Transport vositasi egasi</Text>
              <View style={styles.choiceGroup}>
                <TouchableOpacity
                  style={[
                    styles.choiceOption,
                    formData.vehicle_owner_type === 'own' && styles.choiceOptionActive,
                  ]}
                  onPress={() => updateField('vehicle_owner_type', 'own')}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.radio,
                      formData.vehicle_owner_type === 'own' && styles.radioActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.choiceLabel,
                      formData.vehicle_owner_type === 'own' && styles.choiceLabelActive,
                    ]}
                  >
                    O'zimniki
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceOption,
                    formData.vehicle_owner_type === 'other_person' && styles.choiceOptionActive,
                  ]}
                  onPress={() => updateField('vehicle_owner_type', 'other_person')}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.radio,
                      formData.vehicle_owner_type === 'other_person' && styles.radioActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.choiceLabel,
                      formData.vehicle_owner_type === 'other_person' && styles.choiceLabelActive,
                    ]}
                  >
                    Boshqa shaxsga tegishli
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceOption,
                    formData.vehicle_owner_type === 'company' && styles.choiceOptionActive,
                  ]}
                  onPress={() => updateField('vehicle_owner_type', 'company')}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.radio,
                      formData.vehicle_owner_type === 'company' && styles.radioActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.choiceLabel,
                      formData.vehicle_owner_type === 'company' && styles.choiceLabelActive,
                    ]}
                  >
                    Tashkilot/firma
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Usage Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>Foydalanish shakli</Text>
              <View style={styles.choiceGroup}>
                <TouchableOpacity
                  style={[
                    styles.choiceOption,
                    formData.vehicle_usage_type === 'rent' && styles.choiceOptionActive,
                  ]}
                  onPress={() => updateField('vehicle_usage_type', 'rent')}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.radio,
                      formData.vehicle_usage_type === 'rent' && styles.radioActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.choiceLabel,
                      formData.vehicle_usage_type === 'rent' && styles.choiceLabelActive,
                    ]}
                  >
                    Ijara asosida
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceOption,
                    formData.vehicle_usage_type === 'free_use' && styles.choiceOptionActive,
                  ]}
                  onPress={() => updateField('vehicle_usage_type', 'free_use')}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.radio,
                      formData.vehicle_usage_type === 'free_use' && styles.radioActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.choiceLabel,
                      formData.vehicle_usage_type === 'free_use' && styles.choiceLabelActive,
                    ]}
                  >
                    Tekin foydalanish
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'Saqlanmoqda...' : 'Keyingi'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Simple Geo Dropdown Modal */}
      {geoModalType && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={!!geoModalType}
          onRequestClose={() => {
            setGeoModalType(null);
            setGeoSearchQuery('');
          }}
        >
          <View style={styles.simpleDropdownOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => {
                setGeoModalType(null);
                setGeoSearchQuery('');
              }}
            />
            <View style={styles.simpleDropdownContainer}>
              {/* Simple Header */}
              <View style={styles.simpleDropdownHeader}>
                <Text style={styles.simpleDropdownTitle}>{getGeoModalTitle(geoModalType)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setGeoModalType(null);
                    setGeoSearchQuery('');
                  }}
                  style={styles.simpleDropdownCloseButton}
                >
                  <Text style={styles.simpleDropdownCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Simple Search */}
              <View style={styles.simpleSearchBox}>
                <TextInput
                  style={styles.simpleSearchInput}
                  placeholder="Qidirish..."
                  placeholderTextColor="#999"
                  value={geoSearchQuery}
                  onChangeText={setGeoSearchQuery}
                  autoFocus={false}
                />
              </View>

              {/* Simple List */}
              {geoModalLoading ? (
                <View style={styles.simpleDropdownLoading}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                </View>
              ) : getGeoOptionsForModal(geoModalType).length === 0 ? (
                <View style={styles.simpleDropdownEmpty}>
                  <Text style={styles.simpleDropdownEmptyText}>
                    {geoSearchQuery.trim() ? 'Topilmadi' : 'Ma\'lumot yo\'q'}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.simpleDropdownList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                >
                  {getGeoOptionsForModal(geoModalType).map((option) => {
                    const isSelected = (() => {
                      switch (geoModalType) {
                        case 'country':
                          return formData.address_country_id === option.id;
                        case 'province':
                          return formData.address_province_id === option.id;
                        case 'city_district':
                          return formData.address_city_district_id === option.id;
                        case 'administrative_area':
                          return formData.address_administrative_area_id === option.id;
                        case 'settlement':
                          return formData.address_settlement_id === option.id;
                        case 'neighborhood':
                          return formData.address_neighborhood_id === option.id;
                        default:
                          return false;
                      }
                    })();

                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.simpleDropdownItem,
                          isSelected && styles.simpleDropdownItemSelected,
                        ]}
                        onPress={() => handleGeoSelection(geoModalType, option)}
                      >
                        <Text
                          style={[
                            styles.simpleDropdownItemText,
                            isSelected && styles.simpleDropdownItemTextSelected,
                          ]}
                        >
                          {option.type ? `${option.name} (${option.type})` : option.name}
                        </Text>
                        {isSelected && <Text style={styles.simpleDropdownCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
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
    backgroundColor: theme.palette.background.default,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing(3),
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(1),
    zIndex: 1,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  backButtonArrow: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
    marginTop: 1,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
  },
  form: {
    width: '100%',
  },
  requiredHint: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  inputGroup: {
    marginBottom: theme.spacing(2.5),
  },
  label: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  labelError: {
    color: '#E53935',
  },
  requiredMarker: {
    color: '#E53935',
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: theme.spacing(1),
  },
  title: {
    ...theme.typography.h3,
    color: theme.palette.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing(1),
  },
  description: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  input: {
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    padding: theme.spacing(2),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  inputError: {
    borderBottomColor: '#E53935',
  },
  errorText: {
    ...theme.typography.caption,
    color: '#E53935',
    marginTop: theme.spacing(0.5),
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    marginBottom: 0,
    minHeight: 48,
  },
  dateInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
  },
  calendarButton: {
    padding: theme.spacing(1.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#4CAF50',
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
    color: '#666',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    backgroundColor: '#FAFAFA',
  },
  pickerItemSelected: {
    backgroundColor: '#4CAF50',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(2),
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: theme.palette.grey[300],
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
  },
  genderOptionActive: {
    borderBottomColor: '#4CAF50',
  },
  genderOptionError: {
    borderBottomColor: '#E53935',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.palette.border,
    marginRight: theme.spacing(1),
  },
  radioActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  radioError: {
    borderColor: '#E53935',
  },
  genderLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
  },
  genderLabelActive: {
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
  photoSection: {
    alignItems: 'flex-start',
  },
  photoButton: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.card,
    marginTop: theme.spacing(1),
  },
  photoIcon: {
    fontSize: 40,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  choiceGroup: {
    marginTop: theme.spacing(1),
  },
  choiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(2),
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: theme.palette.grey[300],
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    marginBottom: theme.spacing(1.5),
  },
  choiceOptionActive: {
    borderBottomColor: '#4CAF50',
  },
  choiceLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
  },
  choiceLabelActive: {
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: theme.spacing(2.5),
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    ...theme.shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Select Input Styles
  selectInput: {
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    padding: theme.spacing(2),
    minHeight: 48,
    justifyContent: 'center',
  },
  selectInputError: {
    borderBottomColor: '#E53935',
  },
  selectInputDisabled: {
    opacity: 0.5,
  },
  selectText: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  selectPlaceholder: {
    ...theme.typography.body1,
    color: theme.palette.text.disabled,
  },
  // Simple Dropdown Styles
  simpleDropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  simpleDropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  simpleDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  simpleDropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  simpleDropdownCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleDropdownCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  simpleSearchBox: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  simpleSearchInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  simpleDropdownList: {
    maxHeight: 300,
  },
  simpleDropdownLoading: {
    padding: 30,
    alignItems: 'center',
  },
  simpleDropdownEmpty: {
    padding: 30,
    alignItems: 'center',
  },
  simpleDropdownEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  simpleDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  simpleDropdownItemSelected: {
    backgroundColor: '#F0F8F0',
  },
  simpleDropdownItemText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  simpleDropdownItemTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  simpleDropdownCheck: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

