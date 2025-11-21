/**
 * Driver Passport Screen (Step 2)
 * Collects driver's passport/ID card information
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
import { updatePassport, getDriverProfile, fetchGeoCountries, fetchGeoProvinces, fetchGeoCityDistricts, uploadImage, type GeoOption } from '../api/driver';

const theme = createTheme('light');

export const DriverPassportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    father_name: '',
    birth_date: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'birth_date' | 'issue_date' | 'expiry_date' | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ [key: string]: Date }>({
    birth_date: new Date(2000, 0, 1),
    issue_date: new Date(),
    expiry_date: new Date(),
  });
  const [tempDate, setTempDate] = useState(new Date());
  
  // Geo selector state
  type GeoFieldType = 'citizenship' | 'birth_country' | 'birth_province' | 'birth_city';
  const [geoModalType, setGeoModalType] = useState<GeoFieldType | null>(null);
  const [geoSearchQuery, setGeoSearchQuery] = useState<string>('');
  const [countries, setCountries] = useState<GeoOption[]>([]);
  const [birthProvinces, setBirthProvinces] = useState<GeoOption[]>([]);
  const [birthCityDistricts, setBirthCityDistricts] = useState<GeoOption[]>([]);
  const [selectedCitizenship, setSelectedCitizenship] = useState<GeoOption | null>(null);
  const [selectedBirthCountry, setSelectedBirthCountry] = useState<GeoOption | null>(null);
  const [selectedBirthProvince, setSelectedBirthProvince] = useState<GeoOption | null>(null);
  const [selectedBirthCity, setSelectedBirthCity] = useState<GeoOption | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<'front' | 'back' | null>(null);
  const [photoFrontUri, setPhotoFrontUri] = useState<string | null>(null);
  const [photoBackUri, setPhotoBackUri] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    father_name: '',
    gender: '' as 'male' | 'female' | '',
    birth_date: '',
    citizenship: "O'zbekiston",
    birth_place_country: "O'zbekiston",
    birth_place_region: '',
    birth_place_city: '',
    id_card_number: '',
    pinfl: '',
    issue_date: '',
    expiry_date: '',
    passport_front_url: '',
    passport_back_url: '',
  });

  useEffect(() => {
    loadPersonalInfo();
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const data = await fetchGeoCountries();
      setCountries(data);
    } catch (error) {
      console.error('Failed to load countries:', error);
      setCountries([]);
    }
  };

  const loadBirthProvinces = async (countryId: number): Promise<GeoOption[]> => {
    try {
      const data = await fetchGeoProvinces(countryId);
      setBirthProvinces(data);
      return data;
    } catch (error) {
      console.error('Failed to load provinces:', error);
      setBirthProvinces([]);
      return [];
    }
  };

  const loadBirthCityDistricts = async (provinceId: number): Promise<GeoOption[]> => {
    try {
      const data = await fetchGeoCityDistricts(provinceId);
      setBirthCityDistricts(data);
      return data;
    } catch (error) {
      console.error('Failed to load city districts:', error);
      setBirthCityDistricts([]);
      return [];
    }
  };

  const openGeoSelector = (type: GeoFieldType) => {
    if (isLoading) {
      return;
    }

    switch (type) {
      case 'birth_province':
        if (!selectedBirthCountry) {
          showToast.error(t('common.error'), "Avval mamlakatni tanlang");
          return;
        }
        if (birthProvinces.length === 0) {
          showToast.error(t('common.error'), "Ushbu mamlakat uchun viloyatlar mavjud emas");
          return;
        }
        break;
      case 'birth_city':
        if (!selectedBirthProvince) {
          showToast.error(t('common.error'), "Avval viloyatni tanlang");
          return;
        }
        if (birthCityDistricts.length === 0) {
          showToast.error(t('common.error'), "Ushbu viloyat uchun shahar/tuman topilmadi");
          return;
        }
        break;
    }

    setGeoSearchQuery('');
    setGeoModalType(type);
  };

  const handleGeoSelection = async (type: GeoFieldType, option: GeoOption) => {
    try {
      switch (type) {
        case 'citizenship':
          updateField('citizenship', option.name);
          setSelectedCitizenship(option);
          break;
        case 'birth_country':
          if (selectedBirthCountry?.id !== option.id) {
            updateField('birth_place_country', option.name);
            setSelectedBirthCountry(option);
            setSelectedBirthProvince(null);
            setSelectedBirthCity(null);
            setBirthProvinces([]);
            setBirthCityDistricts([]);
            updateField('birth_place_region', '');
            updateField('birth_place_city', '');
            await loadBirthProvinces(option.id);
          } else {
            setSelectedBirthCountry(option);
          }
          break;
        case 'birth_province':
          if (selectedBirthProvince?.id !== option.id) {
            updateField('birth_place_region', option.name);
            setSelectedBirthProvince(option);
            setSelectedBirthCity(null);
            setBirthCityDistricts([]);
            updateField('birth_place_city', '');
            await loadBirthCityDistricts(option.id);
          } else {
            setSelectedBirthProvince(option);
          }
          break;
        case 'birth_city':
          updateField('birth_place_city', option.name);
          setSelectedBirthCity(option);
          break;
      }
    } catch (error) {
      console.error('Failed to process geo selection:', error);
      showToast.error(t('common.error'), 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setGeoModalType(null);
      setGeoSearchQuery('');
    }
  };

  const getGeoOptionsForModal = (type: GeoFieldType | null): GeoOption[] => {
    if (!type) return [];
    let options: GeoOption[] = [];
    switch (type) {
      case 'citizenship':
      case 'birth_country':
        options = countries;
        break;
      case 'birth_province':
        options = birthProvinces;
        break;
      case 'birth_city':
        options = birthCityDistricts;
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
      case 'citizenship':
        return 'Fuqarolikni tanlang';
      case 'birth_country':
        return 'Mamlakatni tanlang';
      case 'birth_province':
        return 'Viloyatni tanlang';
      case 'birth_city':
        return 'Shahar yoki tumanni tanlang';
      default:
        return '';
    }
  };

  const handleImagePicker = async (photoType: 'front' | 'back') => {
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

  const pickImage = async (photoType: 'front' | 'back', source: 'camera' | 'library') => {
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
        aspect: [3, 4],
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
          if (photoType === 'front') {
            setPhotoFrontUri(asset.uri);
            updateField('passport_front_url', imageUrl);
          } else {
            setPhotoBackUri(asset.uri);
            updateField('passport_back_url', imageUrl);
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

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const parseDate = (dateString: string): Date | null => {
    // Parse DD.MM.YYYY format
    const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) return null;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
    const year = parseInt(match[3], 10);
    
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > new Date().getFullYear() + 10) {
      return null;
    }
    
    const date = new Date(year, month, day);
    // Validate the date (e.g., check for invalid dates like 31.02.2000)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };

  const handleDateInputChange = (field: 'birth_date' | 'issue_date' | 'expiry_date', text: string) => {
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
    
    updateField(field, formatted);
    
    // If valid format (DD.MM.YYYY), update selectedDate
    if (formatted.length === 10) {
      const parsedDate = parseDate(formatted);
      if (parsedDate) {
        setSelectedDate(prev => ({ ...prev, [field]: parsedDate }));
      }
    }
  };

  const handleDateConfirm = () => {
    if (!datePickerField) return;
    
    setSelectedDate(prev => ({ ...prev, [datePickerField]: tempDate }));
    const formattedDate = formatDate(tempDate);
    updateField(datePickerField, formattedDate);
    setShowDatePicker(false);
    setDatePickerField(null);
  };

  const handleDateCancel = () => {
    if (datePickerField) {
      setTempDate(selectedDate[datePickerField] || new Date());
    }
    setShowDatePicker(false);
    setDatePickerField(null);
  };

  const openDatePicker = (field: 'birth_date' | 'issue_date' | 'expiry_date') => {
    const currentDate = selectedDate[field] || (field === 'birth_date' ? new Date(2000, 0, 1) : new Date());
    setTempDate(currentDate);
    setDatePickerField(field);
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
    // For birth_date, go back to 1900, for others go forward to 2050
    const startYear = datePickerField === 'birth_date' ? 1900 : currentYear - 10;
    const endYear = datePickerField === 'birth_date' ? currentYear : 2050;
    
    if (datePickerField === 'birth_date') {
      for (let year = endYear; year >= startYear; year--) {
        years.push(year);
      }
    } else {
      for (let year = startYear; year <= endYear; year++) {
        years.push(year);
      }
    }
    return years;
  };

  const loadPersonalInfo = async () => {
    if (!token) return;
    
    try {
      // Ensure countries are loaded first
      if (countries.length === 0) {
        await loadCountries();
      }
      
      const profile = await getDriverProfile(token);
      if (profile.profile) {
        const personalInfoData = {
          first_name: profile.profile.first_name || '',
          last_name: profile.profile.last_name || '',
          father_name: profile.profile.father_name || '',
          birth_date: convertDateFormat(profile.profile.birth_date),
        };
        
        setPersonalInfo(personalInfoData);
        
        // Pre-fill form data with personal info as defaults
        const passportData = (profile.profile as any).passport || {};
        
        const birthDateStr = convertDateFormat(passportData.birth_date) || personalInfoData.birth_date;
        const issueDateStr = convertDateFormat(passportData.issue_date) || '';
        const expiryDateStr = convertDateFormat(passportData.expiry_date) || '';
        
        // Initialize selected dates
        const birthDate = birthDateStr ? parseDate(birthDateStr) : new Date(2000, 0, 1);
        const issueDate = issueDateStr ? parseDate(issueDateStr) : new Date();
        const expiryDate = expiryDateStr ? parseDate(expiryDateStr) : new Date();
        
        if (birthDate) setSelectedDate(prev => ({ ...prev, birth_date: birthDate }));
        if (issueDate) setSelectedDate(prev => ({ ...prev, issue_date: issueDate }));
        if (expiryDate) setSelectedDate(prev => ({ ...prev, expiry_date: expiryDate }));
        
        setFormData(prev => ({
          ...prev,
          // Pre-fill from personal info if not already set in passport data
          first_name: passportData.first_name || personalInfoData.first_name || prev.first_name,
          last_name: passportData.last_name || personalInfoData.last_name || prev.last_name,
          father_name: passportData.father_name || personalInfoData.father_name || prev.father_name,
          gender: passportData.gender || profile.profile.gender || prev.gender,
          birth_date: birthDateStr || prev.birth_date,
          // Keep other passport-specific fields from passport data if exists
          citizenship: passportData.citizenship || prev.citizenship,
          birth_place_country: passportData.birth_place_country || prev.birth_place_country,
          birth_place_region: passportData.birth_place_region || prev.birth_place_region,
          birth_place_city: passportData.birth_place_city || prev.birth_place_city,
          id_card_number: passportData.id_card_number || prev.id_card_number,
          pinfl: passportData.pinfl || prev.pinfl,
          issue_date: issueDateStr || prev.issue_date,
          expiry_date: expiryDateStr || prev.expiry_date,
          passport_front_url: passportData.passport_front_url || prev.passport_front_url,
          passport_back_url: passportData.passport_back_url || prev.passport_back_url,
        }));

        // Initialize photo URIs if they exist
        if (passportData.passport_front_url) {
          setPhotoFrontUri(passportData.passport_front_url);
        }
        if (passportData.passport_back_url) {
          setPhotoBackUri(passportData.passport_back_url);
        }

        // Initialize selected geo options if data exists
        if (passportData.citizenship) {
          const citizenshipOption = countries.find(c => c.name === passportData.citizenship);
          if (citizenshipOption) {
            setSelectedCitizenship(citizenshipOption);
          }
        }

        if (passportData.birth_place_country) {
          const birthCountryOption = countries.find(c => c.name === passportData.birth_place_country);
          if (birthCountryOption) {
            setSelectedBirthCountry(birthCountryOption);
            // Load provinces for birth country
            loadBirthProvinces(birthCountryOption.id).then(provinces => {
              if (passportData.birth_place_region) {
                const provinceOption = provinces.find(p => p.name === passportData.birth_place_region);
                if (provinceOption) {
                  setSelectedBirthProvince(provinceOption);
                  // Load cities for birth province
                  loadBirthCityDistricts(provinceOption.id).then(cities => {
                    if (passportData.birth_place_city) {
                      const cityOption = cities.find(c => c.name === passportData.birth_place_city);
                      if (cityOption) {
                        setSelectedBirthCity(cityOption);
                      }
                    }
                  });
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

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

  const handleContinue = async () => {
    // Frontend validation
    const validationErrors: Record<string, string> = {};
    
    if (!formData.first_name) {
      validationErrors.first_name = 'Ismni kiriting';
    }

    if (!formData.last_name) {
      validationErrors.last_name = 'Familiyani kiriting';
    }

    if (!formData.gender) {
      validationErrors.gender = 'Jinsni tanlang';
    }

    if (!formData.birth_date) {
      validationErrors.birth_date = 'Tug\'ilgan sanani kiriting';
    }

    if (!formData.citizenship) {
      validationErrors.citizenship = 'Fuqarolikni kiriting';
    }

    if (!formData.id_card_number) {
      validationErrors.id_card_number = 'ID karta raqamini kiriting';
    }

    if (!formData.pinfl) {
      validationErrors.pinfl = 'JSHSHIR (PINFL) raqamini kiriting';
    }

    if (!formData.issue_date) {
      validationErrors.issue_date = 'Berilgan sanani kiriting';
    }

    if (!formData.expiry_date) {
      validationErrors.expiry_date = 'Amal qilish muddatini kiriting';
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      showToast.error(t('common.error'), t('formValidation.fixErrors'));
      return;
    }

    setFieldErrors({});

    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    setIsLoading(true);

    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '')
      );

      await updatePassport(token, cleanData);
      
      showToast.success(t('common.success'), 'Passport ma\'lumotlari saqlandi');
      
      // Navigate to next step (License)
      (navigation as any).navigate('DriverLicense');
    } catch (error: any) {
      console.error('Failed to save passport info:', error);
      
      // Check if it's a validation error from backend
      if (error?.response?.status === 422 && error?.response?.data?.errors) {
        // Parse validation errors and map to form fields
        const apiErrors = parseValidationErrors(error);
        
        // Set field errors to display under each field
        setFieldErrors(apiErrors);
        
        // Also show a general error toast
        const firstError = Object.values(apiErrors)[0];
        if (firstError) {
          showToast.error(t('common.error'), firstError);
        }
      } else {
        // For non-validation errors, show general error
        handleBackendError(error, {
          t,
          defaultMessage: 'Ma\'lumotlarni saqlashda xatolik',
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
              onPress={() => (navigation as any).goBack()}
              disabled={isLoading}
            >
              <View style={styles.backButtonContent}>
                <Text style={styles.backButtonArrow}>←</Text>
                <Text style={styles.backButtonText}>Orqaga</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.brand}>UbexGo Driver</Text>
            <Text style={styles.title}>Shaharlar aro</Text>
            <Text style={styles.subtitle}>PASSPORT MA'LUMOTLARI</Text>
            <Text style={styles.description}>
              (Barcha ma'lumotlar passport bo'yicha kiritiladi)
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.requiredHint}>{t('userDetails.requiredField')}</Text>

            {/* Personal Info (Read-only from previous step) */}
            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>
                {personalInfo.first_name} {personalInfo.last_name} {personalInfo.father_name}
              </Text>
              <Text style={styles.readOnlyLabel}>
                Tug'ilgan sanasi: {personalInfo.birth_date}
              </Text>
            </View>

            {/* Passport Information */}
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
              {fieldErrors.first_name && (
                <Text style={styles.errorText}>{fieldErrors.first_name}</Text>
              )}
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
              {fieldErrors.last_name && (
                <Text style={styles.errorText}>{fieldErrors.last_name}</Text>
              )}
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
              {fieldErrors.father_name && (
                <Text style={styles.errorText}>{fieldErrors.father_name}</Text>
              )}
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
              {fieldErrors.gender && (
                <Text style={styles.errorText}>{fieldErrors.gender}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('birth_date')}>
                {t('userDetails.birthDate')} <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <View style={[styles.dateInputContainer, fieldErrors.birth_date ? styles.inputError : undefined]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="KK.OO.YYYY"
                  value={formData.birth_date}
                  onChangeText={(value) => handleDateInputChange('birth_date', value)}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={theme.palette.text.secondary}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => openDatePicker('birth_date')}
                  disabled={isLoading}
                >
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.birth_date && (
                <Text style={styles.errorText}>{fieldErrors.birth_date}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('issue_date')}>
                Berilgan sanasi <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <View style={[styles.dateInputContainer, fieldErrors.issue_date ? styles.inputError : undefined]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="KK.OO.YYYY"
                  value={formData.issue_date}
                  onChangeText={(value) => handleDateInputChange('issue_date', value)}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={theme.palette.text.secondary}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => openDatePicker('issue_date')}
                  disabled={isLoading}
                >
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.issue_date && (
                <Text style={styles.errorText}>{fieldErrors.issue_date}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('expiry_date')}>
                Amal qilish muddati <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <View style={[styles.dateInputContainer, fieldErrors.expiry_date ? styles.inputError : undefined]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="KK.OO.YYYY"
                  value={formData.expiry_date}
                  onChangeText={(value) => handleDateInputChange('expiry_date', value)}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={theme.palette.text.secondary}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => openDatePicker('expiry_date')}
                  disabled={isLoading}
                >
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.expiry_date && (
                <Text style={styles.errorText}>{fieldErrors.expiry_date}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('citizenship')}>
                Fuqaroligi <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('citizenship'),
                  isLoading && styles.selectInputDisabled,
                ]}
                onPress={() => openGeoSelector('citizenship')}
                disabled={isLoading}
              >
                <Text
                  style={
                    selectedCitizenship ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedCitizenship?.name || formData.citizenship || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.citizenship && (
                <Text style={styles.errorText}>{fieldErrors.citizenship}</Text>
              )}
            </View>

            {/* ID Card Number */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('id_card_number')}>
                ID Karta raqami <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('id_card_number')}
                placeholder="AD 1234567"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.id_card_number}
                onChangeText={(value) => updateField('id_card_number', value)}
                editable={!isLoading}
              />
              {fieldErrors.id_card_number && (
                <Text style={styles.errorText}>{fieldErrors.id_card_number}</Text>
              )}
            </View>

            {/* PINFL */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('pinfl')}>
                JSHSHIR (PINFL) <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('pinfl')}
                placeholder="32101855210037"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.pinfl}
                onChangeText={(value) => updateField('pinfl', value)}
                keyboardType="numeric"
                editable={!isLoading}
              />
              {fieldErrors.pinfl && (
                <Text style={styles.errorText}>{fieldErrors.pinfl}</Text>
              )}
            </View>

            {/* Birth Place */}
            <Text style={styles.sectionTitle}>Tug'ilgan joyi:</Text>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('birth_place_country')}>
                Mamlakat
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('birth_place_country'),
                  isLoading && styles.selectInputDisabled,
                ]}
                onPress={() => openGeoSelector('birth_country')}
                disabled={isLoading}
              >
                <Text
                  style={
                    selectedBirthCountry ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedBirthCountry?.name || formData.birth_place_country || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.birth_place_country && (
                <Text style={styles.errorText}>{fieldErrors.birth_place_country}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('birth_place_region')}>
                Viloyat
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('birth_place_region'),
                  ((!selectedBirthCountry || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('birth_province')}
                disabled={isLoading || !selectedBirthCountry || birthProvinces.length === 0}
              >
                <Text
                  style={
                    selectedBirthProvince ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedBirthProvince?.name || formData.birth_place_region || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.birth_place_region && (
                <Text style={styles.errorText}>{fieldErrors.birth_place_region}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('birth_place_city')}>
                Shahar
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('birth_place_city'),
                  ((!selectedBirthProvince || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('birth_city')}
                disabled={isLoading || !selectedBirthProvince || birthCityDistricts.length === 0}
              >
                <Text
                  style={
                    selectedBirthCity ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedBirthCity?.name || formData.birth_place_city || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.birth_place_city && (
                <Text style={styles.errorText}>{fieldErrors.birth_place_city}</Text>
              )}
            </View>

            {/* Photo Placeholders */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Pasport/ID karta rasmi</Text>
              <Text style={styles.helperText}>(Fuqaro rasmi bor tomoni)</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('front')}
                disabled={isLoading || uploadingPhoto === 'front'}
              >
                {uploadingPhoto === 'front' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoFrontUri ? (
                  <Image source={{ uri: photoFrontUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Pasport/ID karta rasmi</Text>
              <Text style={styles.helperText}>(Orqa tomoni yoki ro'yxatda turish manzili, propiska)</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('back')}
                disabled={isLoading || uploadingPhoto === 'back'}
              >
                {uploadingPhoto === 'back' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoBackUri ? (
                  <Image source={{ uri: photoBackUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
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

      {/* Date Picker Modal */}
      {showDatePicker && datePickerField && (
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

      {/* Geo Dropdown Modal */}
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
              {/* Header */}
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

              {/* Search */}
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

              {/* List */}
              {getGeoOptionsForModal(geoModalType).length === 0 ? (
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
                        case 'citizenship':
                          return selectedCitizenship?.id === option.id;
                        case 'birth_country':
                          return selectedBirthCountry?.id === option.id;
                        case 'birth_province':
                          return selectedBirthProvince?.id === option.id;
                        case 'birth_city':
                          return selectedBirthCity?.id === option.id;
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
  form: {
    width: '100%',
  },
  requiredHint: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  readOnlySection: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(2.5),
  },
  readOnlyLabel: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
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
  genderLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
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
  // Geo Dropdown Styles
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

