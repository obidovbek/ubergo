/**
 * Driver License Screen (Step 3)
 * Collects driving license and emergency contacts
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
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError, parseValidationErrors } from '../utils/errorHandler';
import { validateForm, isValidDate, type ValidationRule } from '../utils/validation';
import { updateLicense, getDriverProfile, uploadImage, fetchCountries, type CountryOption } from '../api/driver';

const theme = createTheme('light');

const categories = ['A', 'B', 'C', 'D', 'BE', 'CE', 'DE'];

export const DriverLicenseScreen: React.FC = () => {
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
  const [licenseData, setLicenseData] = useState({
    license_number: '',
    issue_date: '',
    category_a: '',
    category_b: '',
    category_c: '',
    category_d: '',
    category_be: '',
    category_ce: '',
    category_de: '',
    license_front_url: '',
    license_back_url: '',
  });
  
  const [emergencyContacts, setEmergencyContacts] = useState([
    { phone_country_code: '+998', phone_number: '', relationship: '' },
    { phone_country_code: '+998', phone_number: '', relationship: '' },
  ]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ [key: string]: Date }>({});
  const [tempDate, setTempDate] = useState(new Date());

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState<'front' | 'back' | null>(null);
  const [photoFrontUri, setPhotoFrontUri] = useState<string | null>(null);
  const [photoBackUri, setPhotoBackUri] = useState<string | null>(null);

  // Country selector state
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryPickerIndex, setCountryPickerIndex] = useState<number | null>(null);

  useEffect(() => {
    loadLicenseData();
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const countriesData = await fetchCountries();
      setCountries(countriesData);
    } catch (error) {
      console.error('Failed to load countries:', error);
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
    // Validate the date
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };

  const loadLicenseData = async () => {
    if (!token) return;
    
    try {
      const profile = await getDriverProfile(token);
      if (profile.profile) {
        setPersonalInfo({
          first_name: profile.profile.first_name || '',
          last_name: profile.profile.last_name || '',
          father_name: profile.profile.father_name || '',
          birth_date: convertDateFormat(profile.profile.birth_date),
        });

        // Load license data if exists
        const licenseDataFromApi = (profile.profile as any).license || {};
        
        // Initialize dates
        const issueDateStr = convertDateFormat(licenseDataFromApi.issue_date);
        const issueDate = issueDateStr ? parseDate(issueDateStr) : new Date();
        if (issueDate) setSelectedDate(prev => ({ ...prev, issue_date: issueDate }));

        // Initialize category dates
        categories.forEach(category => {
          const fieldKey = `category_${category.toLowerCase()}`;
          const dateStr = convertDateFormat(licenseDataFromApi[fieldKey]);
          if (dateStr) {
            const parsedDate = parseDate(dateStr);
            if (parsedDate) {
              setSelectedDate(prev => ({ ...prev, [fieldKey]: parsedDate }));
            }
          }
        });

        setLicenseData(prev => ({
          ...prev,
          license_number: licenseDataFromApi.license_number || prev.license_number,
          issue_date: issueDateStr || prev.issue_date,
          category_a: convertDateFormat(licenseDataFromApi.category_a) || prev.category_a,
          category_b: convertDateFormat(licenseDataFromApi.category_b) || prev.category_b,
          category_c: convertDateFormat(licenseDataFromApi.category_c) || prev.category_c,
          category_d: convertDateFormat(licenseDataFromApi.category_d) || prev.category_d,
          category_be: convertDateFormat(licenseDataFromApi.category_be) || prev.category_be,
          category_ce: convertDateFormat(licenseDataFromApi.category_ce) || prev.category_ce,
          category_de: convertDateFormat(licenseDataFromApi.category_de) || prev.category_de,
          license_front_url: licenseDataFromApi.license_front_url || prev.license_front_url,
          license_back_url: licenseDataFromApi.license_back_url || prev.license_back_url,
        }));

        // Load photos
        if (licenseDataFromApi.license_front_url) {
          setPhotoFrontUri(licenseDataFromApi.license_front_url);
        }
        if (licenseDataFromApi.license_back_url) {
          setPhotoBackUri(licenseDataFromApi.license_back_url);
        }

        // Load emergency contacts if exists
        const contactsFromApi = (profile.profile as any).emergencyContacts || [];
        if (contactsFromApi.length > 0) {
          setEmergencyContacts(contactsFromApi.map((c: any, index: number) => ({
            phone_country_code: c.phone_country_code || '+998',
            phone_number: c.phone_number || '',
            relationship: c.relationship || (index === 0 ? t('driverLicense.relationshipFather') : t('driverLicense.relationshipSpouse')),
          })));
        } else {
          // Set default relationships if no contacts exist
          setEmergencyContacts([
            { phone_country_code: '+998', phone_number: '', relationship: t('driverLicense.relationshipFather') },
            { phone_country_code: '+998', phone_number: '', relationship: t('driverLicense.relationshipSpouse') },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load license data:', error);
    }
  };

  const updateLicenseField = (field: string, value: string) => {
    setLicenseData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) {
        return prev;
      }
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    const newContacts = [...emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setEmergencyContacts(newContacts);
  };

  const getSelectedCountry = (countryCode: string): CountryOption | null => {
    return countries.find(c => c.code === countryCode) || null;
  };

  const handleCountrySelect = (country: CountryOption, contactIndex: number) => {
    updateEmergencyContact(contactIndex, 'phone_country_code', country.code);
    setShowCountryPicker(false);
    setCountryPickerIndex(null);
  };

  const handleDateInputChange = (field: string, text: string) => {
    // Remove all non-digits
    const digitsOnly = text.replace(/\D/g, '');
    
    // Limit to 8 digits (DDMMYYYY)
    if (digitsOnly.length > 8) return;
    
    // Auto-format as user types: DD.MM.YYYY
    let formatted = digitsOnly;
    if (digitsOnly.length > 4) {
      formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2, 4) + '.' + digitsOnly.slice(4);
    } else if (digitsOnly.length > 2) {
      formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2);
    }
    
    updateLicenseField(field, formatted);
    
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
    updateLicenseField(datePickerField, formattedDate);
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

  const openDatePicker = (field: string) => {
    const currentDate = selectedDate[field] || new Date();
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
      { value: 0, label: t('common.monthJanuary') },
      { value: 1, label: t('common.monthFebruary') },
      { value: 2, label: t('common.monthMarch') },
      { value: 3, label: t('common.monthApril') },
      { value: 4, label: t('common.monthMay') },
      { value: 5, label: t('common.monthJune') },
      { value: 6, label: t('common.monthJuly') },
      { value: 7, label: t('common.monthAugust') },
      { value: 8, label: t('common.monthSeptember') },
      { value: 9, label: t('common.monthOctober') },
      { value: 10, label: t('common.monthNovember') },
      { value: 11, label: t('common.monthDecember') },
    ];
  };

  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    // For issue_date and category dates, go from past to future
    // For issue_date, start from 10 years ago, for categories start from 1990
    const startYear = datePickerField === 'issue_date' ? currentYear - 10 : 1990;
    const endYear = currentYear + 10;
    
    if (datePickerField === 'issue_date') {
      // For issue date, show from past to future
      for (let year = startYear; year <= endYear; year++) {
        years.push(year);
      }
    } else {
      // For category dates, show from 1990 to future
      for (let year = startYear; year <= endYear; year++) {
        years.push(year);
      }
    }
    return years;
  };

  const handleImagePicker = async (photoType: 'front' | 'back') => {
    if (!token) {
      showToast.error(t('common.error'), t('errors.unauthorized'));
      return;
    }

    Alert.alert(
      t('driverLicense.selectPhoto'),
      t('driverLicense.howToSelectPhoto'),
      [
        {
          text: t('common.camera'),
          onPress: () => pickImage(photoType, 'camera'),
        },
        {
          text: t('common.gallery'),
          onPress: () => pickImage(photoType, 'library'),
        },
        {
          text: t('common.cancel'),
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
              t('common.permissionRequired'),
              t('driverLicense.cameraPermissionMessage')
            );
            return;
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              t('common.permissionRequired'),
              t('driverLicense.galleryPermissionMessage')
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
            updateLicenseField('license_front_url', imageUrl);
          } else {
            setPhotoBackUri(asset.uri);
            updateLicenseField('license_back_url', imageUrl);
          }
          
          showToast.success(t('common.success'), t('driverLicense.photoUploaded'));
        } catch (error) {
          console.error('Failed to upload image:', error);
          showToast.error(t('common.error'), t('driverLicense.photoUploadError'));
        } finally {
          setUploadingPhoto(null);
        }
      };
      
      reader.onerror = () => {
        setUploadingPhoto(null);
        showToast.error(t('common.error'), t('driverLicense.photoReadError'));
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Image picker error:', error);
      setUploadingPhoto(null);
      showToast.error(t('common.error'), t('driverLicense.photoSelectError'));
    }
  };

  type FormFieldKey = keyof typeof licenseData;

  const getInputStyle = (field: FormFieldKey | string) => [
    styles.input,
    fieldErrors[field] ? styles.inputError : undefined,
  ];

  const getLabelStyle = (field: FormFieldKey | string) => [
    styles.label,
    fieldErrors[field] ? styles.labelError : undefined,
  ];

  const handleContinue = async () => {
    // Frontend validation using validation rules
    const validationRules: ValidationRule[] = [
      {
        field: 'license_number',
        value: licenseData.license_number,
        rules: [
          { type: 'required', errorKey: 'driverLicense.licenseNumberRequired' },
        ],
      },
      {
        field: 'issue_date',
        value: licenseData.issue_date,
        rules: [
          { type: 'required', errorKey: 'driverLicense.issueDateRequired' },
          { type: 'date', errorKey: 'formValidation.dateInvalid' },
        ],
      },
    ];

    // Validate category dates if provided
    categories.forEach(category => {
      const fieldKey = `category_${category.toLowerCase()}`;
      const dateValue = licenseData[fieldKey as keyof typeof licenseData];
      if (dateValue) {
        validationRules.push({
          field: fieldKey,
          value: dateValue,
          rules: [
            { type: 'date', errorKey: 'formValidation.dateInvalid' },
          ],
        });
      }
    });

    const validationErrors = validateForm(validationRules, t);

    const errorsMap = validationErrors.reduce<Record<string, string>>((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {});

    if (Object.keys(errorsMap).length > 0) {
      setFieldErrors(errorsMap);
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
      const cleanLicenseData = Object.fromEntries(
        Object.entries(licenseData).filter(([_, v]) => v !== '')
      );

      const cleanContacts = emergencyContacts.filter(c => c.phone_number);

      await updateLicense(token, {
        license: cleanLicenseData,
        emergencyContacts: cleanContacts.length > 0 ? cleanContacts : undefined,
      });
      
      showToast.success(t('common.success'), t('driverLicense.licenseSaved'));
      
      // Navigate to next step (Vehicle)
      (navigation as any).navigate('DriverVehicle');
    } catch (error: any) {
      console.error('Failed to save license info:', error);
      
      // Check if it's a validation error from backend
      if (error?.response?.status === 422 && error?.response?.data?.errors) {
        // Parse validation errors and map to form fields
        const apiErrors = parseValidationErrors(error);
        
        // Map API field names to form field names if needed
        // Backend sends errors with field names matching DriverLicense model
        const mappedErrors: Record<string, string> = {};
        Object.keys(apiErrors).forEach((apiField) => {
          let formField = apiField;
          
          // Handle nested license fields (e.g., license.license_number -> license_number)
          if (apiField.startsWith('license.')) {
            formField = apiField.replace('license.', '');
          }
          
          // Map backend field names to form field names
          // DriverLicense model fields: license_number, issue_date, category_a, etc.
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
          defaultMessage: t('driverLicense.errorUpdate'),
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
                <Text style={styles.backButtonText}>{t('common.back')}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.brand}>UbexGo Driver</Text>
            <Text style={styles.title}>{t('driverLicense.title')}</Text>
            <Text style={styles.subtitle}>{t('driverLicense.subtitle')}</Text>
            <Text style={styles.description}>
              {t('driverLicense.description')}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.requiredHint}>{t('userDetails.requiredField')}</Text>

            {/* Read-only personal info */}
            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>
                {personalInfo.first_name} {personalInfo.last_name} {personalInfo.father_name}
              </Text>
              <Text style={styles.readOnlyLabel}>
                {t('userDetails.birthDate')}: {personalInfo.birth_date}
              </Text>
            </View>

            {/* License Issue Date */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('issue_date')}>
                {t('driverLicense.issueDate')} <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <View style={[styles.dateInputContainer, fieldErrors.issue_date ? styles.inputError : undefined]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder={t('common.datePlaceholder')}
                  value={licenseData.issue_date}
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

            {/* License Number */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('license_number')}>
                {t('driverLicense.licenseNumber')} <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('license_number')}
                placeholder={t('driverLicense.licenseNumberPlaceholder')}
                placeholderTextColor={theme.palette.text.disabled}
                value={licenseData.license_number}
                onChangeText={(value) => updateLicenseField('license_number', value)}
                editable={!isLoading}
              />
              {fieldErrors.license_number && (
                <Text style={styles.errorText}>{fieldErrors.license_number}</Text>
              )}
            </View>

            {/* Categories */}
            {categories.map((category) => {
              const fieldKey = `category_${category.toLowerCase()}` as keyof typeof licenseData;
              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryBox}>
                    <Text style={styles.categoryLabel}>{category}</Text>
                  </View>
                  <View style={[styles.dateInputContainer, fieldErrors[fieldKey] ? styles.inputError : undefined, { flex: 1 }]}>
                    <TextInput
                      style={styles.dateInput}
                      placeholder={t('driverLicense.categoryDatePlaceholder')}
                      placeholderTextColor={theme.palette.text.secondary}
                      value={licenseData[fieldKey] || ''}
                      onChangeText={(value) => handleDateInputChange(fieldKey, value)}
                      keyboardType="numeric"
                      maxLength={10}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.calendarButton}
                      onPress={() => openDatePicker(fieldKey)}
                      disabled={isLoading}
                    >
                      <Text style={styles.calendarIcon}>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* License Photos */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>{t('driverLicense.licensePhoto')}</Text>
              <Text style={styles.helperText}>{t('driverLicense.licensePhotoFrontHint')}</Text>
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
              <Text style={styles.label}>{t('driverLicense.licensePhoto')}</Text>
              <Text style={styles.helperText}>{t('driverLicense.licensePhotoBackHint')}</Text>
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

            {/* Emergency Contacts */}
            <Text style={styles.sectionTitle}>
              {t('driverLicense.emergencyContactsTitle')}
            </Text>
            <Text style={styles.subsectionTitle}>{t('driverLicense.emergencyContactsHint')}</Text>

          {emergencyContacts.map((contact, index) => {
            const selectedCountry = getSelectedCountry(contact.phone_country_code);
            return (
              <View key={index} style={styles.contactRow}>
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => {
                    setCountryPickerIndex(index);
                    setShowCountryPicker(true);
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.countryFlag}>{selectedCountry?.flag || '🌍'}</Text>
                  <Text style={styles.countryCodeText}>{contact.phone_country_code}</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  placeholder={t('driverLicense.phoneNumberPlaceholder')}
                  placeholderTextColor={theme.palette.text.secondary}
                  value={contact.phone_number}
                  onChangeText={(value) => updateEmergencyContact(index, 'phone_number', value)}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
                <TextInput
                  style={styles.relationshipInput}
                  placeholder={index === 0 ? t('driverLicense.relationshipFather') : t('driverLicense.relationshipSpouse')}
                  placeholderTextColor={theme.palette.text.secondary}
                  value={contact.relationship}
                  onChangeText={(value) => updateEmergencyContact(index, 'relationship', value)}
                  editable={!isLoading}
                />
              </View>
            );
          })}

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? t('common.saving') : t('common.next')}
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
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{t('common.selectDate')}</Text>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Text style={styles.modalConfirmText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContainer}>
                {/* Day Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>{t('common.day')}</Text>
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
                  <Text style={styles.pickerLabel}>{t('common.month')}</Text>
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
                  <Text style={styles.pickerLabel}>{t('common.year')}</Text>
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

      {/* Country Picker Modal */}
      {showCountryPicker && countryPickerIndex !== null && (
        <Modal
          transparent
          animationType="fade"
          visible={showCountryPicker}
          onRequestClose={() => {
            setShowCountryPicker(false);
            setCountryPickerIndex(null);
          }}
        >
          <TouchableWithoutFeedback onPress={() => {
            setShowCountryPicker(false);
            setCountryPickerIndex(null);
          }}>
            <View style={styles.countryPickerOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.countryPickerModal}>
                  <View style={styles.countryPickerHeader}>
                    <Text style={styles.countryPickerTitle}>{t('driverLicense.selectCountryCode') || 'Mamlakat kodini tanlang'}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowCountryPicker(false);
                        setCountryPickerIndex(null);
                      }}
                      style={styles.countryPickerCloseButton}
                    >
                      <Text style={styles.countryPickerCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.countryPickerList}>
                    {countries.map((country) => (
                      <TouchableOpacity
                        key={country.id}
                        style={[
                          styles.countryPickerOption,
                          emergencyContacts[countryPickerIndex]?.phone_country_code === country.code && styles.countryPickerOptionSelected
                        ]}
                        onPress={() => handleCountrySelect(country, countryPickerIndex)}
                      >
                        <Text style={styles.countryPickerFlag}>{country.flag || '🌍'}</Text>
                        <Text style={styles.countryPickerName}>{country.name}</Text>
                        <Text style={styles.countryPickerCode}>{country.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
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
  readOnlySection: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(3),
  },
  readOnlyLabel: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
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
  helperText: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  rowLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    marginRight: theme.spacing(1),
  },
  rowInput: {
    flex: 1,
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: theme.spacing(2),
  },
  categoryBox: {
    width: 50,
    minHeight: 48,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing(1.5),
    backgroundColor: theme.palette.background.card,
    alignSelf: 'stretch',
  },
  categoryLabel: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.palette.text.primary,
  },
  categoryInput: {
    flex: 1,
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(0.5),
  },
  subsectionTitle: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(1.5),
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.background.card,
    minWidth: 80,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: theme.spacing(0.5),
  },
  countryCodeText: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 2,
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    marginRight: theme.spacing(1),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  relationshipInput: {
    flex: 1,
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
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
  // Country Picker Styles
  countryPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
  countryPickerModal: {
    backgroundColor: theme.palette.background.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.palette.border,
    ...theme.shadows.md,
    maxHeight: '70%',
  },
  countryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
  },
  countryPickerTitle: {
    ...theme.typography.h6,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  countryPickerCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.palette.grey[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryPickerCloseText: {
    fontSize: 16,
    color: theme.palette.text.secondary,
    fontWeight: 'bold',
  },
  countryPickerList: {
    maxHeight: 400,
  },
  countryPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
  },
  countryPickerOptionSelected: {
    backgroundColor: theme.palette.grey[50],
  },
  countryPickerFlag: {
    fontSize: 24,
    marginRight: theme.spacing(1.5),
  },
  countryPickerName: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    flex: 1,
  },
  countryPickerCode: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
});

