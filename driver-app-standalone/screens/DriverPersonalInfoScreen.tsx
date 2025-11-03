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
import { handleBackendError, displayValidationErrors } from '../utils/errorHandler';
import { updatePersonalInfo, getDriverProfileStatus, uploadImage } from '../api/driver';
import { validateForm, isValidEmail, type ValidationRule } from '../utils/validation';

const theme = createTheme('light');

export const DriverPersonalInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [photoFaceUri, setPhotoFaceUri] = useState<string | null>(null);
  const [photoBodyUri, setPhotoBodyUri] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    father_name: '',
    gender: '' as 'male' | 'female' | '',
    birth_date: '',
    email: '',
    address_country: "O'zbekiston",
    address_region: '',
    address_city: '',
    address_settlement_type: '',
    address_mahalla: '',
    address_street: '',
    photo_face_url: '',
    photo_body_url: '',
    vehicle_owner_type: '' as 'own' | 'other_person' | 'company' | '',
    vehicle_usage_type: '' as 'rent' | 'free_use' | '',
  });

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

  // Check registration status on mount and request permissions
  useEffect(() => {
    checkRegistrationStatus();
    requestImagePickerPermissions();
    loadExistingPhotos();
  }, []);

  const requestImagePickerPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Ruxsat kerak',
          'Rasmlarni yuklash uchun kameraga va galereyaga ruxsat kerak'
        );
      }
    }
  };

  const loadExistingPhotos = async () => {
    if (!token) return;
    
    try {
      const { getDriverProfile } = await import('../api/driver');
      const profile = await getDriverProfile(token);
      if (profile.profile) {
        if (profile.profile.photo_face_url) {
          setPhotoFaceUri(profile.profile.photo_face_url);
          updateField('photo_face_url', profile.profile.photo_face_url);
        }
        if (profile.profile.photo_body_url) {
          setPhotoBodyUri(profile.profile.photo_body_url);
          updateField('photo_body_url', profile.profile.photo_body_url);
        }
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

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
        field: 'father_name',
        value: formData.father_name,
        rules: [
          { type: 'required', errorKey: 'formValidation.fatherNameRequired' },
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
      {
        field: 'birth_date',
        value: formData.birth_date,
        rules: [
          { type: 'required', errorKey: 'formValidation.birthDateRequired' },
          { type: 'date', errorKey: 'formValidation.birthDateInvalid' },
        ],
      },
    ];

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
    
    if (validationErrors.length > 0) {
      // Show first validation error
      showToast.error(t('common.error'), validationErrors[0].message);
      return;
    }

    if (!token) {
      showToast.error(t('common.error'), t('errors.unauthorized'));
      return;
    }

    setIsLoading(true);

    try {
      // Remove empty fields
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '')
      );

      await updatePersonalInfo(token, cleanData);
      
      showToast.success(t('common.success'), t('driver.profileUpdated'));
      
      // Navigate to next step (Passport)
      navigation.navigate('DriverPassport' as any);
    } catch (error: any) {
      console.error('Failed to save personal info:', error);
      
      // Check if it's a validation error from backend
      if (error?.response?.status === 422 && error?.response?.data?.errors) {
        displayValidationErrors(error, t, true);
      } else {
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
            <Text style={styles.brand}>UbexGo Driver</Text>
            <Text style={styles.title}>Shaharlar aro</Text>
            <Text style={styles.subtitle}>HAYDOVCHI MA'LUMOTLARI</Text>
            <Text style={styles.description}>
              (FISH va tug'ilgan sana passport bo'yicha)
            </Text>
          </View>

          {/* Personal Information */}
          <TextInput
            style={styles.input}
            placeholder="ISM"
            value={formData.first_name}
            onChangeText={(value) => updateField('first_name', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Familiya"
            value={formData.last_name}
            onChangeText={(value) => updateField('last_name', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Otasining ismi"
            value={formData.father_name}
            onChangeText={(value) => updateField('father_name', value)}
            editable={!isLoading}
          />

          {/* Gender */}
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

          {/* Birth Date */}
          <View style={styles.dateInputContainer}>
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
          <TextInput
            style={styles.input}
            placeholder="email (elektron manzil)"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          {/* Current Address */}
          <Text style={styles.sectionTitle}>Hozirgi yashash manzili:</Text>

          <TextInput
            style={styles.input}
            placeholder="O'zbekiston"
            value={formData.address_country}
            onChangeText={(value) => updateField('address_country', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Farg'ona viloyat"
            value={formData.address_region}
            onChangeText={(value) => updateField('address_region', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Farg'ona shahar"
            value={formData.address_city}
            onChangeText={(value) => updateField('address_city', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Aholi yashash punkti QFY, Shaharcha, Ovul"
            value={formData.address_settlement_type}
            onChangeText={(value) => updateField('address_settlement_type', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Mahalla Fuqarolar yig'ini"
            value={formData.address_mahalla}
            onChangeText={(value) => updateField('address_mahalla', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Adress. A.Navoiy k 145 uy"
            value={formData.address_street}
            onChangeText={(value) => updateField('address_street', value)}
            editable={!isLoading}
          />

          {/* Photo Uploads */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Shafyor yuz rasmi (selfi):</Text>
            <Text style={styles.photoSubtext}>(Fuqaro rasmi bor tomoni)</Text>
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

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Shafyor boshdan oyoq rasm:</Text>
            <Text style={styles.photoSubtext}>(Fuqaro rasmi bor tomoni)</Text>
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
          <Text style={styles.sectionTitle}>Transport vositasi egasi</Text>

          <View style={styles.ownershipOptions}>
            <TouchableOpacity
              style={styles.radioRow}
              onPress={() => updateField('vehicle_owner_type', 'own')}
              disabled={isLoading}
            >
              <View style={[styles.radio, formData.vehicle_owner_type === 'own' && styles.radioActive]} />
              <Text style={styles.radioLabel}>-O'zimniki</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioRow}
              onPress={() => updateField('vehicle_owner_type', 'other_person')}
              disabled={isLoading}
            >
              <View style={[styles.radio, formData.vehicle_owner_type === 'other_person' && styles.radioActive]} />
              <Text style={styles.radioLabel}>-Boshqa shaxsniki</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioRow}
              onPress={() => updateField('vehicle_owner_type', 'company')}
              disabled={isLoading}
            >
              <View style={[styles.radio, formData.vehicle_owner_type === 'company' && styles.radioActive]} />
              <Text style={styles.radioLabel}>-firma/tashkilotniki</Text>
            </TouchableOpacity>
          </View>

          {/* Usage Type */}
          <Text style={styles.sectionTitle}>Foydalanish shakli</Text>

          <View style={styles.ownershipOptions}>
            <TouchableOpacity
              style={styles.radioRow}
              onPress={() => updateField('vehicle_usage_type', 'rent')}
              disabled={isLoading}
            >
              <View style={[styles.radio, formData.vehicle_usage_type === 'rent' && styles.radioActive]} />
              <Text style={styles.radioLabel}>-Ijara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioRow}
              onPress={() => updateField('vehicle_usage_type', 'free_use')}
              disabled={isLoading}
            >
              <View style={[styles.radio, formData.vehicle_usage_type === 'free_use' && styles.radioActive]} />
              <Text style={styles.radioLabel}>-Tekin foydalanish</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    marginBottom: theme.spacing(2),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
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
    marginBottom: theme.spacing(2),
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
    marginBottom: theme.spacing(2),
    gap: theme.spacing(4),
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: theme.palette.text.primary,
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  photoSection: {
    marginBottom: theme.spacing(3),
  },
  photoLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  photoSubtext: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
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
  },
  photoIcon: {
    fontSize: 40,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  ownershipOptions: {
    marginBottom: theme.spacing(2),
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
  },
  radioLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
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
});

