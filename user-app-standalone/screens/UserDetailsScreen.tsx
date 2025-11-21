/**
 * User Details Screen
 * Final step of registration - collect user profile information
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { UserDetailsNavigationProp } from '../navigation/types';
import { isValidEmail } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../config/api';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError } from '../utils/errorHandler';
import { useCountries } from '../hooks/useCountries';
import type { CountryOption } from '../types/country';

const theme = createTheme('light');
const placeholderColor = theme.palette.text.secondary;


const formatPhoneForCountry = (value: string, country: CountryOption): string => {
  const digits = value.replace(/\D/g, '').slice(0, country.localLength);

  if (!digits) {
    return '';
  }

  if (country.pattern === 'uz') {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`;
  }

  if (country.pattern === 'ru') {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`.trim();
};

const getFormattedMaxLength = (country: CountryOption): number => {
  switch (country.pattern) {
    case 'uz':
      return 14;
    case 'ru':
      return 15;
    default:
      return country.localLength + Math.ceil(country.localLength / 3);
  }
};

export const UserDetailsScreen: React.FC = () => {
  const navigation = useNavigation<UserDetailsNavigationProp>();
  const route = useRoute();
  const { user, token, updateUser } = useAuth();
  const { t } = useTranslation();
  const { countries, isLoading: countriesLoading, error: countriesError } = useCountries();
  
  // Get phone number from route params or user context
  const phoneNumberFromRoute = (route.params as any)?.phoneNumber;
  const phoneNumber = phoneNumberFromRoute || (user as any)?.phone_e164 || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);
  const [currentPhoneInput, setCurrentPhoneInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (countries.length === 0) {
      return;
    }

    setSelectedCountry((prev) => {
      if (!prev) {
        return countries[0];
      }

      const match = countries.find(
        (country) => country.code === prev.code && country.name === prev.name
      );

      return match || countries[0];
    });
  }, [countries]);

  useEffect(() => {
    if (countriesError) {
      console.warn('Country fetch error:', countriesError);
    }
  }, [countriesError]);

  const activeCountry = selectedCountry ?? countries[0];

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
    
    setBirthDate(formatted);
    
    // If valid format (DD.MM.YYYY), update selectedDate
    if (formatted.length === 10) {
      const parsedDate = parseDate(formatted);
      if (parsedDate) {
        setSelectedDate(parsedDate);
        if (errors.birthDate) {
          setErrors({ ...errors, birthDate: undefined });
        }
      }
    }
  };

  const handleDateConfirm = () => {
    setSelectedDate(tempDate);
    const formattedDate = formatDate(tempDate);
    setBirthDate(formattedDate);
    setShowDatePicker(false);
    if (errors.birthDate) {
      setErrors({ ...errors, birthDate: undefined });
    }
  };

  const handleDateCancel = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    // Try to parse existing birthDate, or use selectedDate, or default to 2000-01-01
    let initialDate = selectedDate;
    if (birthDate) {
      const parsed = parseDate(birthDate);
      if (parsed) {
        initialDate = parsed;
      }
    }
    if (!initialDate || isNaN(initialDate.getTime())) {
      initialDate = new Date(2000, 0, 1);
    }
    setTempDate(initialDate);
    setShowDatePicker(true);
  };

  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  const generateMonths = () => {
    return [
      { value: 1, label: t('months.january') },
      { value: 2, label: t('months.february') },
      { value: 3, label: t('months.march') },
      { value: 4, label: t('months.april') },
      { value: 5, label: t('months.may') },
      { value: 6, label: t('months.june') },
      { value: 7, label: t('months.july') },
      { value: 8, label: t('months.august') },
      { value: 9, label: t('months.september') },
      { value: 10, label: t('months.october') },
      { value: 11, label: t('months.november') },
      { value: 12, label: t('months.december') },
    ];
  };

  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const addPhoneNumber = () => {
    if (!activeCountry) {
      return;
    }

    const digits = currentPhoneInput.replace(/\D/g, '').slice(0, activeCountry.localLength);

    if (digits.length < activeCountry.localLength) {
      showToast.warning(t('common.error'), t('userDetails.errorPhone'));
      return;
    }

    const fullPhone = `${activeCountry.code}${digits}`;
    if (!additionalPhones.includes(fullPhone)) {
      setAdditionalPhones([...additionalPhones, fullPhone]);
      setCurrentPhoneInput('');
      if (textInputRef.current) {
        textInputRef.current.clear();
      }
    }
  };

  const scrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const formatPhoneNumber = (text: string, country?: CountryOption | null) => {
    const targetCountry = country ?? selectedCountry ?? countries[0];
    if (!targetCountry) {
      return text.replace(/\D/g, '');
    }

    return formatPhoneForCountry(text, targetCountry);
  };

  useEffect(() => {
    if (activeCountry) {
      setCurrentPhoneInput((prev) => formatPhoneNumber(prev, activeCountry));
    }
  }, [activeCountry?.code, activeCountry?.pattern]);

  const validate = (): boolean => {
    const newErrors: any = {};

    if (!firstName.trim()) {
      newErrors.firstName = t('userDetails.errorFirstName');
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('userDetails.errorLastName');
    }

    if (!gender) {
      newErrors.gender = t('userDetails.errorGender');
    }

    if (birthDate && birthDate.length < 10) {
      newErrors.birthDate = t('userDetails.errorBirthDateIncomplete');
    }

    if (email.trim() && !isValidEmail(email)) {
      newErrors.email = t('userDetails.errorEmailInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast.warning(t('common.error'), t('userDetails.errorAllFields'));
      return;
    }

    setIsLoading(true);

    try {
      console.log('=== Profile Update Debug ===');
      console.log('User token:', token);
      
      // Prepare profile data
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        father_name: fatherName || undefined,
        gender: gender,
        birth_date: birthDate || undefined,
        email: email || undefined,
        additional_phones: additionalPhones,
        promo_code: promoCode || undefined,
        referral_id: userId || undefined,
      };

      console.log('Submitting profile data:', JSON.stringify(profileData, null, 2));

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.user.updateProfile}`,
        {
          method: 'PUT',
          headers: getHeaders(token ?? undefined),
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();
      console.log('Profile update response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update user in context with profile_complete flag
      if (data.data && data.data.user) {
        // Ensure profile_complete is set to true after successful update
        const updatedUser = {
          ...data.data.user,
          profile_complete: true
        };
        updateUser(updatedUser);
        console.log('User updated with profile_complete: true', updatedUser);
      }

      console.log('Profile updated successfully');

      showToast.success(
        t('userDetails.successTitle'),
        t('userDetails.successMessage')
      );
      
      // User will automatically navigate to main app via RootNavigator
      // since they are now authenticated and profile is complete
      console.log('Registration complete, navigating to main app...');
    } catch (error) {
      console.error('Profile update error:', error);
      handleBackendError(error, {
        t,
        defaultMessage: t('userDetails.errorUpdate'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>{t('auth.appName')}</Text>
            <Text style={styles.title}>{t('userDetails.title')}</Text>
            <Text style={styles.subtitle}>
              {t('userDetails.subtitle')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
          {/* Required Field Indicator */}
          <Text style={styles.requiredIndicator}>{t('userDetails.requiredField')}</Text>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('userDetails.firstName')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder={t('userDetails.firstNamePlaceholder')}
              placeholderTextColor={placeholderColor}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) {
                  setErrors({ ...errors, firstName: undefined });
                }
              }}
              editable={!isLoading}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('userDetails.lastName')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder={t('userDetails.lastNamePlaceholder')}
              placeholderTextColor={placeholderColor}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName) {
                  setErrors({ ...errors, lastName: undefined });
                }
              }}
              editable={!isLoading}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          {/* Father Name (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.fatherName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('userDetails.fatherNamePlaceholder')}
              placeholderTextColor={placeholderColor}
              value={fatherName}
              onChangeText={setFatherName}
              editable={!isLoading}
            />
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('userDetails.gender')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonActive,
                  errors.gender && styles.genderButtonError,
                ]}
                onPress={() => {
                  setGender('male');
                  if (errors.gender) {
                    setErrors({ ...errors, gender: undefined });
                  }
                }}
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.radio,
                    gender === 'male' && styles.radioActive,
                    errors.gender && styles.radioError,
                  ]}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === 'male' && styles.genderTextActive,
                  ]}
                >
                  {t('userDetails.male')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonActive,
                  errors.gender && styles.genderButtonError,
                ]}
                onPress={() => {
                  setGender('female');
                  if (errors.gender) {
                    setErrors({ ...errors, gender: undefined });
                  }
                }}
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.radio,
                    gender === 'female' && styles.radioActive,
                    errors.gender && styles.radioError,
                  ]}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === 'female' && styles.genderTextActive,
                  ]}
                >
                  {t('userDetails.female')}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {t('userDetails.genderHelper')}
            </Text>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          {/* Info Note */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {t('userDetails.infoBoxText')}
              <Text style={styles.infoHighlight}>{t('userDetails.infoBoxPhone')}</Text>
              {t('userDetails.infoBoxId')}
              {t('userDetails.infoBoxPromo')}
              <Text style={styles.infoHighlight}>{t('userDetails.infoBoxPromoCode')}</Text>
              {t('userDetails.infoBoxPromo2')}
              <Text style={styles.infoHighlight}>{t('userDetails.infoBoxBonus')}</Text>
              {t('userDetails.infoBoxBonus2')}
            </Text>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.phone')}</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              editable={false}
            />
          </View>

          {/* User ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.userId')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('userDetails.userIdPlaceholder')}
              placeholderTextColor={placeholderColor}
              value={userId}
              onChangeText={setUserId}
              keyboardType="number-pad"
              editable={!isLoading}
              onFocus={scrollToEnd}
            />
          </View>

          {/* Promo Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.promoCode')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('userDetails.promoCodePlaceholder')}
              placeholderTextColor={placeholderColor}
              value={promoCode}
              onChangeText={setPromoCode}
              editable={!isLoading}
              onFocus={scrollToEnd}
            />
          </View>

          {/* Birth Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('userDetails.birthDate')}
            </Text>
            <View style={[styles.dateInputContainer, errors.birthDate && styles.inputError]}>
              <TextInput
                style={styles.dateInput}
                placeholder="KK.OO.YYYY"
                value={birthDate}
                onChangeText={handleDateInputChange}
                keyboardType="numeric"
                maxLength={10}
                placeholderTextColor={placeholderColor}
                editable={!isLoading}
                onFocus={scrollToEnd}
              />
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={openDatePicker}
                disabled={isLoading}
              >
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {t('userDetails.birthDateHelper')}
            </Text>
            {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
            
            {showDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={handleDateCancel}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity
                        onPress={handleDateCancel}
                        style={styles.modalButton}
                      >
                        <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}></Text>
                      <TouchableOpacity
                        onPress={handleDateConfirm}
                        style={styles.modalButton}
                      >
                        <Text style={styles.modalButtonText}>{t('common.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerContainer}>
                      {/* Day Picker */}
                      <View style={styles.pickerColumn}>
                        <Text style={styles.pickerLabel}>{t('userDetails.day')}</Text>
                        <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                          {generateDays(tempDate.getFullYear(), tempDate.getMonth() + 1).map((day) => (
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
                        <Text style={styles.pickerLabel}>{t('userDetails.month')}</Text>
                        <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                          {generateMonths().map((month) => (
                            <TouchableOpacity
                              key={month.value}
                              style={[
                                styles.pickerItem,
                                tempDate.getMonth() + 1 === month.value && styles.pickerItemSelected
                              ]}
                              onPress={() => {
                                const maxDay = new Date(tempDate.getFullYear(), month.value, 0).getDate();
                                const day = Math.min(tempDate.getDate(), maxDay);
                                const newDate = new Date(tempDate.getFullYear(), month.value - 1, day);
                                setTempDate(newDate);
                              }}
                            >
                              <Text style={[
                                styles.pickerItemText,
                                tempDate.getMonth() + 1 === month.value && styles.pickerItemTextSelected
                              ]}>
                                {month.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Year Picker */}
                      <View style={styles.pickerColumn}>
                        <Text style={styles.pickerLabel}>{t('userDetails.year')}</Text>
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
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('userDetails.email')}
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder={t('userDetails.emailPlaceholder')}
              placeholderTextColor={placeholderColor}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: undefined });
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              onFocus={scrollToEnd}
            />
            <Text style={styles.helperText}>{t('userDetails.emailHelper')}</Text>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Additional Contact */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('userDetails.additionalPhones')}
            </Text>
            
            {/* Additional Phones List */}
            {additionalPhones.map((phone, index) => (
              <View key={index} style={styles.phoneItem}>
                <Text style={styles.phoneText}>{phone}</Text>
                <TouchableOpacity 
                  style={styles.removePhoneButton}
                  onPress={() => {
                    const newPhones = additionalPhones.filter((_, i) => i !== index);
                    setAdditionalPhones(newPhones);
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.removePhoneText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add New Phone */}
            {additionalPhones.length < 5 && (
              <View style={styles.addPhoneContainer}>
                
                <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={[
                    styles.addPhoneButton,
                    (!activeCountry || currentPhoneInput.replace(/\D/g, '').length < activeCountry.localLength) &&
                      styles.addPhoneButtonDisabled,
                  ]}
                  onPress={addPhoneNumber}
                  disabled={
                    !activeCountry ||
                    currentPhoneInput.replace(/\D/g, '').length < activeCountry.localLength ||
                    isLoading
                  }
                >
                  <Text style={styles.addPhoneText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.countryCodeButton}
                  onPress={() => setShowCountryPicker((prev) => !prev)}
                  disabled={isLoading || countriesLoading}
                >
                  <Text style={styles.countryFlag}>{activeCountry?.flag ?? '🌐'}</Text>
                  <Text style={styles.countryCode}>{activeCountry?.code ?? ''}</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.phoneRowInput]}
                  placeholder={t('userDetails.phonePlaceholder')}
                  placeholderTextColor={placeholderColor}
                  value={currentPhoneInput}
                  onChangeText={(text) =>
                    setCurrentPhoneInput(formatPhoneNumber(text, activeCountry))
                  }
                  keyboardType="phone-pad"
                  maxLength={activeCountry ? getFormattedMaxLength(activeCountry) : 20}
                  editable={!isLoading}
                  ref={textInputRef}
                  onFocus={scrollToEnd}
                />

              </View>
            </View>
          )}
        </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? t('common.loading') : t('userDetails.submit')}
            </Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        transparent
        animationType="fade"
        visible={showCountryPicker}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.countryPickerModal}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={`${country.id ?? country.code}-${country.name}`}
                    style={styles.countryOption}
                    onPress={() => {
                      setSelectedCountry(country);
                      setShowCountryPicker(false);
                      setCurrentPhoneInput((prev) => formatPhoneNumber(prev, country));
                    }}
                  >
                    <Text style={styles.countryFlag}>{country.flag ?? '🌐'}</Text>
                    <Text style={styles.countryName}>{country.name}</Text>
                    <Text style={styles.countryCode}>{country.code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing(3),
    paddingBottom: theme.spacing(8),
    width: '100%',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: theme.spacing(1),
  },
  title: {
    ...theme.typography.h3,
    color: theme.palette.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  requiredIndicator: {
    ...theme.typography.caption,
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
  },
  inputGroup: {
    marginBottom: theme.spacing(2.5),
  },
  label: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
    fontWeight: '500',
  },
  required: {
    color: theme.palette.error.main,
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
    borderColor: theme.palette.error.main,
  },
  helperText: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.palette.error.main,
    marginTop: theme.spacing(0.5),
  },
  genderContainer: {
    flexDirection: 'row',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: theme.palette.grey[300],
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
  },
  genderButtonActive: {
    borderBottomColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  genderButtonError: {
    borderBottomColor: theme.palette.error.main,
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
    borderColor: theme.palette.error.main,
  },
  genderText: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
  },
  genderTextActive: {
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: theme.spacing(2.5),
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
    lineHeight: 20,
  },
  infoHighlight: {
    color: theme.palette.error.main,
    fontWeight: '600',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    width: '100%',
  },
  countryPicker: {
    backgroundColor: theme.palette.background.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.palette.border,
    marginTop: theme.spacing(1),
    ...theme.shadows.md,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
    width: '100%',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(2),
    gap: theme.spacing(0.5),
    minWidth: 80,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCode: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  countryName: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    flex: 1,
    marginHorizontal: theme.spacing(1),
  },
  phoneRowInput: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
  },
  addPhoneContainer: {
    marginTop: theme.spacing(1),
    width: '100%',
  },
  addPhoneButton: {
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    backgroundColor: '#4CAF50',
    borderRadius: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    minWidth: 50,
  },
  addPhoneButtonDisabled: {
    backgroundColor: 'transparent',
    borderBottomColor: theme.palette.grey[300],
  },
  addPhoneText: {
    fontSize: 18,
    color: '#FFFFFF',
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
  modalButton: {
    padding: 10,
  },
  modalButtonText: {
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
  phoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.grey[50],
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.grey[200],
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  phoneText: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    flex: 1,
  },
  removePhoneButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.palette.error.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: theme.spacing(2.5),
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing(2),
    ...theme.shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontSize: 18,
  },
  pickerOverlay: {
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
    width: '100%',
  },
});

