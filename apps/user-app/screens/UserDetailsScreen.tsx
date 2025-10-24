/**
 * User Details Screen
 * Final step of registration - collect user profile information
 */

import React, { useState, useRef } from 'react';
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

const theme = createTheme('light');


// Country codes for additional phone
const countryCodes = [
  { code: '+998', flag: '🇺🇿' },
  { code: '+33', flag: '🇫🇷' },
];

export const UserDetailsScreen: React.FC = () => {
  const navigation = useNavigation<UserDetailsNavigationProp>();
  const route = useRoute();
  const { user, token, updateUser } = useAuth();
  const { t } = useTranslation();
  
  // Get phone number from route params or user context
  const phoneNumberFromRoute = (route.params as any)?.phoneNumber;
  const phoneNumber = phoneNumberFromRoute || user?.phone_e164 || '';

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
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const textInputRef = useRef<TextInput>(null);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleDateConfirm = () => {
    setSelectedDate(tempDate);
    setBirthDate(formatDate(tempDate));
    setShowDatePicker(false);
    if (errors.birthDate) {
      setErrors({ ...errors, birthDate: undefined });
    }
  };

  const handleDateCancel = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
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
    if (currentPhoneInput.replace(/\D/g, '').length >= 9) {
      const fullPhone = `${selectedCountry.code}${currentPhoneInput.replace(/\D/g, '')}`;
      if (!additionalPhones.includes(fullPhone)) {
        setAdditionalPhones([...additionalPhones, fullPhone]);
        setCurrentPhoneInput('');
        if (textInputRef.current) {
          textInputRef.current.clear();
        }
      }
    } else {
      showToast.warning(t('common.error'), t('userDetails.errorPhone'));
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 14);
  };

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

    if (!birthDate) {
      newErrors.birthDate = t('userDetails.errorBirthDate');
    } else if (birthDate.length < 10) {
      newErrors.birthDate = t('userDetails.errorBirthDateIncomplete');
    }

    if (!email.trim()) {
      newErrors.email = t('userDetails.errorEmail');
    } else if (!isValidEmail(email)) {
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
        birth_date: birthDate,
        email: email,
        additional_phones: additionalPhones,
        promo_code: promoCode || undefined,
        referral_id: userId || undefined,
      };

      console.log('Submitting profile data:', JSON.stringify(profileData, null, 2));

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.user.updateProfile}`,
        {
          method: 'PUT',
          headers: getHeaders(token),
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();
      console.log('Profile update response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update user in context
      if (data.data && data.data.user) {
        updateUser(data.data.user);
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
      <ScrollView
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
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) {
                  setErrors({ ...errors, firstName: undefined });
                }
              }}
              editable={!isLoading}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('userDetails.lastName')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder={t('userDetails.lastNamePlaceholder')}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName) {
                  setErrors({ ...errors, lastName: undefined });
                }
              }}
              editable={!isLoading}
            />
          </View>

          {/* Father Name (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.fatherName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('userDetails.fatherNamePlaceholder')}
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
              value={userId}
              onChangeText={setUserId}
              keyboardType="number-pad"
              editable={!isLoading}
            />
          </View>

          {/* Promo Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.promoCode')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('userDetails.promoCodePlaceholder')}
              value={promoCode}
              onChangeText={setPromoCode}
              editable={!isLoading}
            />
          </View>

          {/* Birth Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('userDetails.birthDate')} <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.datePickerButton, errors.birthDate && styles.inputError]}
              onPress={() => {
                console.log('Date picker button pressed');
                setTempDate(selectedDate);
                setShowDatePicker(true);
                console.log('showDatePicker set to true');
              }}
              disabled={isLoading}
            >
              <Text style={[styles.datePickerText, !birthDate && styles.datePickerPlaceholder]}>
                {birthDate || t('userDetails.birthDatePlaceholder')}
              </Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              {t('userDetails.birthDateHelper')}
            </Text>
            
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
                      <Text style={styles.modalTitle}>{t('userDetails.selectDate')}</Text>
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
                              onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), day))}
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
                                const newDate = new Date(tempDate.getFullYear(), month.value - 1, tempDate.getDate());
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
                                const newDate = new Date(year, tempDate.getMonth(), tempDate.getDate());
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
              {t('userDetails.email')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder={t('userDetails.emailPlaceholder')}
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
            />
            <Text style={styles.helperText}>{t('userDetails.emailHelper')}</Text>
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
                  <View style={styles.countryCodeButton}>
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.phoneRowInput]}
                    placeholder={t('userDetails.phonePlaceholder')}
                    value={currentPhoneInput}
                    onChangeText={(text) => setCurrentPhoneInput(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    maxLength={14}
                    editable={!isLoading}
                    ref={(ref) => (textInputRef.current = ref)}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addPhoneButton,
                      (currentPhoneInput.replace(/\D/g, '').length < 9) && styles.addPhoneButtonDisabled
                    ]}
                    onPress={addPhoneNumber}
                    disabled={currentPhoneInput.replace(/\D/g, '').length < 9 || isLoading}
                  >
                    <Text style={styles.addPhoneText}>+</Text>
                  </TouchableOpacity>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
  scrollContent: {
    padding: theme.spacing(3),
    paddingBottom: theme.spacing(5),
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
  phoneRowInput: {
    flex: 1,
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
    marginLeft: theme.spacing(1),
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    padding: theme.spacing(2),
  },
  datePickerText: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: theme.palette.text.secondary,
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
    height: 200,
    paddingHorizontal: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
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
  },
  pickerItemSelected: {
    backgroundColor: '#4CAF50',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#666',
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
});

