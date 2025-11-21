/**
 * Driver Taxi License Screen (Step 5)
 * Collects taxi license and related documents
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
import { validateForm, type ValidationRule } from '../utils/validation';
import { updateTaxiLicense, getDriverProfile, getDriverProfileStatus, uploadImage } from '../api/driver';

const theme = createTheme('light');

export const DriverTaxiLicenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token, updateUser, user } = useAuth();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    father_name: '',
  });
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'license_issue_date' | 'license_sheet_valid_from' | 'license_sheet_valid_until' | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ [key: string]: Date }>({
    license_issue_date: new Date(),
    license_sheet_valid_from: new Date(),
    license_sheet_valid_until: new Date(),
  });
  const [tempDate, setTempDate] = useState(new Date());
  
  // Photo/document URI states
  const [licenseDocumentUri, setLicenseDocumentUri] = useState<string | null>(null);
  const [licenseSheetDocumentUri, setLicenseSheetDocumentUri] = useState<string | null>(null);
  const [selfEmploymentDocumentUri, setSelfEmploymentDocumentUri] = useState<string | null>(null);
  const [powerOfAttorneyDocumentUri, setPowerOfAttorneyDocumentUri] = useState<string | null>(null);
  const [insuranceDocumentUri, setInsuranceDocumentUri] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    // License Information
    license_number: '',
    license_issue_date: '',
    license_registry_number: '',
    license_document_url: '',
    // License Sheet Information
    license_sheet_number: '',
    license_sheet_valid_from: '',
    license_sheet_valid_until: '',
    license_sheet_document_url: '',
    // Self-Employment
    self_employment_number: '',
    self_employment_document_url: '',
    // Power of Attorney
    power_of_attorney_document_url: '',
    // Insurance
    insurance_document_url: '',
  });

  type FormFieldKey = keyof typeof formData;

  const getInputStyle = (field: FormFieldKey | string) => [
    styles.input,
    fieldErrors[field] ? styles.inputError : undefined,
  ];

  const getLabelStyle = (field: FormFieldKey | string) => [
    styles.label,
    fieldErrors[field] ? styles.labelError : undefined,
  ];

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

  const handleDateInputChange = (field: 'license_issue_date' | 'license_sheet_valid_from' | 'license_sheet_valid_until', text: string) => {
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
    
    handleFieldChange(field, formatted);
    
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

  const openDatePicker = (field: 'license_issue_date' | 'license_sheet_valid_from' | 'license_sheet_valid_until') => {
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
    // For dates, go forward to 2050
    for (let year = currentYear - 10; year <= 2050; year++) {
      years.push(year);
    }
    return years;
  };

  useEffect(() => {
    loadPersonalInfo();
    loadTaxiLicenseData();
  }, []);

  const loadPersonalInfo = async () => {
    if (!token) return;
    
    try {
      const profile = await getDriverProfile(token);
      if (profile.profile) {
        setPersonalInfo({
          first_name: profile.profile.first_name || '',
          last_name: profile.profile.last_name || '',
          father_name: profile.profile.father_name || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadTaxiLicenseData = async () => {
    if (!token) return;
    
    try {
      const profile = await getDriverProfile(token);
      if (profile.profile && (profile.profile as any).taxi_license) {
        const taxiLicense = (profile.profile as any).taxi_license;
        
        const issueDateStr = convertDateFormat(taxiLicense.license_issue_date);
        const validFromStr = convertDateFormat(taxiLicense.license_sheet_valid_from);
        const validUntilStr = convertDateFormat(taxiLicense.license_sheet_valid_until);
        
        // Initialize selected dates
        const issueDate = issueDateStr ? parseDate(issueDateStr) : new Date();
        const validFrom = validFromStr ? parseDate(validFromStr) : new Date();
        const validUntil = validUntilStr ? parseDate(validUntilStr) : new Date();
        
        if (issueDate) setSelectedDate(prev => ({ ...prev, license_issue_date: issueDate }));
        if (validFrom) setSelectedDate(prev => ({ ...prev, license_sheet_valid_from: validFrom }));
        if (validUntil) setSelectedDate(prev => ({ ...prev, license_sheet_valid_until: validUntil }));
        
        setFormData(prev => ({
          ...prev,
          license_number: taxiLicense.license_number || '',
          license_issue_date: issueDateStr || '',
          license_registry_number: taxiLicense.license_registry_number || '',
          license_document_url: taxiLicense.license_document_url || '',
          license_sheet_number: taxiLicense.license_sheet_number || '',
          license_sheet_valid_from: validFromStr || '',
          license_sheet_valid_until: validUntilStr || '',
          license_sheet_document_url: taxiLicense.license_sheet_document_url || '',
          self_employment_number: taxiLicense.self_employment_number || '',
          self_employment_document_url: taxiLicense.self_employment_document_url || '',
          power_of_attorney_document_url: taxiLicense.power_of_attorney_document_url || '',
          insurance_document_url: taxiLicense.insurance_document_url || '',
        }));

        // Set photo URIs for preview
        if (taxiLicense.license_document_url) {
          setLicenseDocumentUri(taxiLicense.license_document_url);
        }
        if (taxiLicense.license_sheet_document_url) {
          setLicenseSheetDocumentUri(taxiLicense.license_sheet_document_url);
        }
        if (taxiLicense.self_employment_document_url) {
          setSelfEmploymentDocumentUri(taxiLicense.self_employment_document_url);
        }
        if (taxiLicense.power_of_attorney_document_url) {
          setPowerOfAttorneyDocumentUri(taxiLicense.power_of_attorney_document_url);
        }
        if (taxiLicense.insurance_document_url) {
          setInsuranceDocumentUri(taxiLicense.insurance_document_url);
        }
      }
    } catch (error) {
      console.error('Failed to load taxi license data:', error);
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

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value);
    
    // Clear error when user starts typing/selecting
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFieldBlur = (field: string) => {
    // Field-level validation can be added here if needed
  };

  // Validation using translation keys
  const validateAllFields = (): boolean => {
    const validationRules: ValidationRule[] = [
      {
        field: 'license_number',
        value: formData.license_number,
        rules: [
          { type: 'required', errorKey: 'formValidation.taxiLicenseRequired' },
          { type: 'minLength', errorKey: 'formValidation.taxiLicenseTooShort', params: { min: 3 } },
        ],
      },
    ];

    // Optional field validations - only validate if field has value
    if (formData.license_issue_date && formData.license_issue_date.trim() !== '') {
      validationRules.push({
        field: 'license_issue_date',
        value: formData.license_issue_date,
        rules: [
          {
            type: 'custom',
            errorKey: 'formValidation.licenseIssueDateInvalid',
            customValidator: (val) => {
              if (!val || val.trim() === '') return true; // Optional
              return parseDate(val) !== null;
            },
          },
        ],
      });
    }

    if (formData.license_registry_number && formData.license_registry_number.trim() !== '') {
      validationRules.push({
        field: 'license_registry_number',
        value: formData.license_registry_number,
        rules: [
          { type: 'minLength', errorKey: 'formValidation.licenseRegistryNumberTooShort', params: { min: 3 } },
        ],
      });
    }

    if (formData.license_sheet_number && formData.license_sheet_number.trim() !== '') {
      validationRules.push({
        field: 'license_sheet_number',
        value: formData.license_sheet_number,
        rules: [
          { type: 'minLength', errorKey: 'formValidation.licenseSheetTooShort', params: { min: 3 } },
        ],
      });
    }

    if (formData.license_sheet_valid_from && formData.license_sheet_valid_from.trim() !== '') {
      validationRules.push({
        field: 'license_sheet_valid_from',
        value: formData.license_sheet_valid_from,
        rules: [
          {
            type: 'custom',
            errorKey: 'formValidation.validFromInvalid',
            customValidator: (val) => {
              if (!val || val.trim() === '') return true; // Optional
              return parseDate(val) !== null;
            },
          },
        ],
      });
    }

    if (formData.license_sheet_valid_until && formData.license_sheet_valid_until.trim() !== '') {
      const validFromDate = formData.license_sheet_valid_from ? parseDate(formData.license_sheet_valid_from) : null;
      const validUntilDate = parseDate(formData.license_sheet_valid_until);
      
      validationRules.push({
        field: 'license_sheet_valid_until',
        value: formData.license_sheet_valid_until,
        rules: [
          {
            type: 'custom',
            errorKey: 'formValidation.validUntilInvalid',
            customValidator: (val) => {
              if (!val || val.trim() === '') return true; // Optional
              return validUntilDate !== null;
            },
          },
          {
            type: 'custom',
            errorKey: 'formValidation.validUntilBeforeValidFrom',
            customValidator: (val) => {
              if (!val || val.trim() === '') return true; // Optional
              if (!validFromDate || !validUntilDate) return true; // Skip if dates are invalid
              return validUntilDate >= validFromDate;
            },
          },
        ],
      });
    }

    if (formData.self_employment_number && formData.self_employment_number.trim() !== '') {
      validationRules.push({
        field: 'self_employment_number',
        value: formData.self_employment_number,
        rules: [
          { type: 'minLength', errorKey: 'formValidation.selfEmploymentNumberTooShort', params: { min: 3 } },
        ],
      });
    }

    const validationErrors = validateForm(validationRules, t);
    const errorsMap = validationErrors.reduce<Record<string, string>>((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {});

    setFieldErrors(errorsMap);
    return Object.keys(errorsMap).length === 0;
  };

  const handleImagePicker = async (photoType: 'license_document' | 'license_sheet_document' | 'self_employment_document' | 'power_of_attorney_document' | 'insurance_document') => {
    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    Alert.alert(
      'Rasm yoki fayl tanlash',
      'Rasm yoki PDF faylni qanday tanlamoqchisiz?',
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

  const pickImage = async (photoType: 'license_document' | 'license_sheet_document' | 'self_employment_document' | 'power_of_attorney_document' | 'insurance_document', source: 'camera' | 'library') => {
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
          
          // Update state and form data based on photo type
          const fieldName = `${photoType}_url` as keyof typeof formData;
          handleFieldChange(fieldName, imageUrl);
          
          // Set preview URI
          switch (photoType) {
            case 'license_document':
              setLicenseDocumentUri(asset.uri);
              break;
            case 'license_sheet_document':
              setLicenseSheetDocumentUri(asset.uri);
              break;
            case 'self_employment_document':
              setSelfEmploymentDocumentUri(asset.uri);
              break;
            case 'power_of_attorney_document':
              setPowerOfAttorneyDocumentUri(asset.uri);
              break;
            case 'insurance_document':
              setInsuranceDocumentUri(asset.uri);
              break;
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

  const handleContinue = async () => {
    // Validate all fields before submission
    if (!validateAllFields()) {
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
      const cleanData: any = {
        license_number: formData.license_number,
        license_issue_date: formData.license_issue_date || undefined,
        license_registry_number: formData.license_registry_number || undefined,
        license_document_url: formData.license_document_url || undefined,
        license_sheet_number: formData.license_sheet_number || undefined,
        license_sheet_valid_from: formData.license_sheet_valid_from || undefined,
        license_sheet_valid_until: formData.license_sheet_valid_until || undefined,
        license_sheet_document_url: formData.license_sheet_document_url || undefined,
        self_employment_number: formData.self_employment_number || undefined,
        self_employment_document_url: formData.self_employment_document_url || undefined,
        power_of_attorney_document_url: formData.power_of_attorney_document_url || undefined,
        insurance_document_url: formData.insurance_document_url || undefined,
      };

      // Remove undefined values
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === '') {
          delete cleanData[key];
        }
      });

      await updateTaxiLicense(token, cleanData);
      
      showToast.success(t('common.success'), t('driver.taxiLicenseUpdated'));
      
      // Check if profile is now complete
      try {
        const status = await getDriverProfileStatus(token);
        if (status.isComplete) {
          // Show completion message
          showToast.success(t('common.success'), t('driver.registrationComplete'));
          
          // Update user in auth context to mark profile as complete
          // This will trigger RootNavigator to re-render and switch to MainNavigator
          if (user) {
            updateUser({
              ...user,
              profile_complete: true,
            } as any);
          }
          
          // RootNavigator will automatically switch from ProfileCompletionNavigator 
          // to MainNavigator (which contains MenuScreen/Home) when it detects 
          // the profile is complete. The updateUser call above helps trigger this.
          // 
          // RootNavigator checks profile status on mount and when user state changes,
          // so it will detect the completion and show MainNavigator with MenuScreen.
        } else {
          // Profile not complete yet, but data is saved
          showToast.info(t('common.info'), 'Ma\'lumotlar saqlandi. Profil tekshirilmoqda...');
        }
      } catch (error) {
        console.error('Failed to check profile status after saving:', error);
        // Still show success message even if status check fails
        showToast.success(t('common.success'), 'Ma\'lumotlar saqlandi');
      }
    } catch (error: any) {
      console.error('Failed to save taxi license info:', error);
      
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
            <Text style={styles.subtitle}>LITSENZIYA</Text>
            <Text style={styles.description}>
              (Barcha ma'lumotlar litsenziya bo'yicha kiritiladi)
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.requiredHint}>{t('userDetails.requiredField')}</Text>

            {/* Read-only personal info */}
            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>
                {personalInfo.first_name} {personalInfo.last_name} {personalInfo.father_name}
              </Text>
            </View>

            {/* License Section */}
            <Text style={styles.sectionTitle}>LITSENZIYA</Text>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('license_number')}>
                LITSENZIYA raqami: <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('license_number')}
                placeholder="AT 1234567"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.license_number}
                onChangeText={(value: string) => handleFieldChange('license_number', value)}
                onBlur={() => handleFieldBlur('license_number')}
                editable={!isLoading}
              />
              {fieldErrors.license_number && (
                <Text style={styles.errorText}>{fieldErrors.license_number}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('license_issue_date')}>
                Berilgan sanasi:
              </Text>
              <View style={[styles.dateInputContainer, fieldErrors.license_issue_date ? styles.inputError : undefined]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="KK.OO.YYYY"
                  value={formData.license_issue_date}
                  onChangeText={(value) => handleDateInputChange('license_issue_date', value)}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={theme.palette.text.secondary}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => openDatePicker('license_issue_date')}
                  disabled={isLoading}
                >
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.license_issue_date && (
                <Text style={styles.errorText}>{fieldErrors.license_issue_date}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('license_registry_number')}>
                LITSENZIYA reyestrda:
              </Text>
              <TextInput
                style={getInputStyle('license_registry_number')}
                placeholder="1234567"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.license_registry_number}
                onChangeText={(value: string) => handleFieldChange('license_registry_number', value)}
                onBlur={() => handleFieldBlur('license_registry_number')}
                editable={!isLoading}
              />
              {fieldErrors.license_registry_number && (
                <Text style={styles.errorText}>{fieldErrors.license_registry_number}</Text>
              )}
            </View>

            {/* License Document Upload */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>LITSENZIYA rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('license_document')}
                disabled={isLoading || uploadingPhoto === 'license_document'}
              >
                {uploadingPhoto === 'license_document' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : licenseDocumentUri ? (
                  <Image source={{ uri: licenseDocumentUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* License Sheet Section */}
            <Text style={styles.sectionTitle}>LITSENZIYA varaqasi</Text>

            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>
                {personalInfo.first_name} {personalInfo.last_name} {personalInfo.father_name}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('license_sheet_number')}>
                LITSENZIYA varaqasi raqami:
              </Text>
              <TextInput
                style={getInputStyle('license_sheet_number')}
                placeholder="AT 1234567"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.license_sheet_number}
                onChangeText={(value: string) => handleFieldChange('license_sheet_number', value)}
                onBlur={() => handleFieldBlur('license_sheet_number')}
                editable={!isLoading}
              />
              {fieldErrors.license_sheet_number && (
                <Text style={styles.errorText}>{fieldErrors.license_sheet_number}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('license_sheet_valid_from')}>
                Amal qilish muddati (dan):
              </Text>
              <View style={[styles.dateInputContainer, fieldErrors.license_sheet_valid_from ? styles.inputError : undefined]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="KK.OO.YYYY"
                  value={formData.license_sheet_valid_from}
                  onChangeText={(value) => handleDateInputChange('license_sheet_valid_from', value)}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={theme.palette.text.secondary}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => openDatePicker('license_sheet_valid_from')}
                  disabled={isLoading}
                >
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.license_sheet_valid_from && (
                <Text style={styles.errorText}>{fieldErrors.license_sheet_valid_from}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('license_sheet_valid_until')}>
                Amal qilish muddati (gacha):
              </Text>
              <View style={[styles.dateInputContainer, fieldErrors.license_sheet_valid_until ? styles.inputError : undefined]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="KK.OO.YYYY"
                  value={formData.license_sheet_valid_until}
                  onChangeText={(value) => handleDateInputChange('license_sheet_valid_until', value)}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor={theme.palette.text.secondary}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => openDatePicker('license_sheet_valid_until')}
                  disabled={isLoading}
                >
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.license_sheet_valid_until && (
                <Text style={styles.errorText}>{fieldErrors.license_sheet_valid_until}</Text>
              )}
            </View>

            {/* License Sheet Document Upload */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>LITSENZIYA varaqasi rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('license_sheet_document')}
                disabled={isLoading || uploadingPhoto === 'license_sheet_document'}
              >
                {uploadingPhoto === 'license_sheet_document' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : licenseSheetDocumentUri ? (
                  <Image source={{ uri: licenseSheetDocumentUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Self-Employment Section */}
            <Text style={styles.sectionTitle}>O'zini o'zi band qilish</Text>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('self_employment_number')}>
                O'zini o'zi band qilish №:
              </Text>
              <TextInput
                style={getInputStyle('self_employment_number')}
                placeholder="1234567890"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.self_employment_number}
                onChangeText={(value: string) => handleFieldChange('self_employment_number', value)}
                onBlur={() => handleFieldBlur('self_employment_number')}
                keyboardType="numeric"
                editable={!isLoading}
              />
              {fieldErrors.self_employment_number && (
                <Text style={styles.errorText}>{fieldErrors.self_employment_number}</Text>
              )}
            </View>

            {/* Self-Employment Document Upload */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>O'zini o'zi band qilish rasm:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('self_employment_document')}
                disabled={isLoading || uploadingPhoto === 'self_employment_document'}
              >
                {uploadingPhoto === 'self_employment_document' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : selfEmploymentDocumentUri ? (
                  <Image source={{ uri: selfEmploymentDocumentUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Power of Attorney Section */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Ishonchnoma rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('power_of_attorney_document')}
                disabled={isLoading || uploadingPhoto === 'power_of_attorney_document'}
              >
                {uploadingPhoto === 'power_of_attorney_document' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : powerOfAttorneyDocumentUri ? (
                  <Image source={{ uri: powerOfAttorneyDocumentUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Insurance Section */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Sugurta rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('insurance_document')}
                disabled={isLoading || uploadingPhoto === 'insurance_document'}
              >
                {uploadingPhoto === 'insurance_document' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : insuranceDocumentUri ? (
                  <Image source={{ uri: insuranceDocumentUri }} style={styles.photoPreview} />
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
                {isLoading ? t('common.saving') : 'Tayyor'}
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
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    fontWeight: '600',
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
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
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
  // Date Picker Modal Styles
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
});
