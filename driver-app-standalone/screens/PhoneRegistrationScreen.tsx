/**
 * Phone Registration Screen
 * First step of registration - collect phone number
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import type { PhoneRegistrationNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError } from '../utils/errorHandler';

const theme = createTheme('light');


type CountryPattern = 'uz' | 'ru' | 'generic';

interface CountryOption {
  code: string;
  flag: string;
  name: string;
  localLength: number;
  pattern: CountryPattern;
}

// Country data
const countries: CountryOption[] = [
  { code: '+998', flag: '🇺🇿', name: "O'zbekiston", localLength: 9, pattern: 'uz' },
  { code: '+7', flag: '🇷🇺', name: 'Rossiya', localLength: 10, pattern: 'ru' },
  { code: '+7', flag: '🇰🇿', name: 'Qozogiston', localLength: 10, pattern: 'ru' },
  { code: '+996', flag: '🇰🇬', name: "Qirg'iziston", localLength: 9, pattern: 'generic' },
  { code: '+992', flag: '🇹🇯', name: 'Tojikiston', localLength: 9, pattern: 'generic' },
];

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

export const PhoneRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<PhoneRegistrationNavigationProp>();
  const { sendOtp } = useAuth();
  const { t } = useTranslation();
  
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');

  // Driver types shown as radio options in the mock
  const driverTypes = [
    { id: 'driver', label: 'Haydovchi' },
    // { id: 'dispatcher', label: 'Dispetcher' },
    // { id: 'special', label: 'Maxsus transport' },
    // { id: 'logist', label: 'Logist' },
  ];
  const [selectedDriverType, setSelectedDriverType] = useState<string>('driver');

  const formatPhoneNumber = (text: string, country: CountryOption = selectedCountry) => {
    return formatPhoneForCountry(text, country);
  };

  const handleContinue = async () => {
    // Remove all non-numeric characters
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    
    console.log('=== OTP Send Debug ===');
    console.log('Phone input value:', phoneNumber);
    console.log('Cleaned number:', cleanedNumber);
    console.log('Selected country code:', selectedCountry.code);
    
    if (cleanedNumber.length > 0 && cleanedNumber.length < selectedCountry.localLength) {
      showToast.warning(t('common.error'), t('phoneRegistration.errorPhoneIncomplete'));
      return;
    }

    setIsLoading(true);
    
    try {
      let usedPhone: string | undefined;
      let usedUserId: string | undefined = userId?.trim() || undefined;
      if (cleanedNumber.length >= selectedCountry.localLength) {
        usedPhone = `${selectedCountry.code}${cleanedNumber}`;
      }

      if (!usedPhone && !usedUserId) {
        showToast.warning(t('common.error'), t('phoneRegistration.errorPhoneIncomplete'));
        setIsLoading(false);
        return;
      }

      console.log('Full phone number:', usedPhone);
      console.log('UserId:', usedUserId);
      console.log('Sending OTP via push notification to user app...');

      // Driver app ONLY sends push notifications to user app
      // Do NOT fall back to SMS
      await sendOtp(usedPhone, 'push', { userId: usedUserId });
      
      console.log('Push notification sent successfully to user app');

      // Navigate to OTP screen
      console.log('Attempting to navigate to OTPVerification screen...');
      try {
        navigation.navigate('OTPVerification', ({
          phoneNumber: usedPhone || '',
          userId: usedUserId,
        } as any));
        console.log('Navigation successful');
      } catch (navError) {
        console.error('Navigation error:', navError);
        showToast.error('Navigation Error', 'Failed to navigate to OTP screen');
      }
    } catch (error) {
      console.error('Push notification send error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      handleBackendError(error, {
        t,
        defaultMessage: 'Push notification yuborishda xatolik. Telefon raqami UbexGo foydalanuvchi ilovasida ro\'yxatdan o\'tgan va ilova ochiq ekanligini tekshiring.',
      });
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
            <Text style={styles.title}>Driver registration</Text>
          </View>

          {/* Driver type selection */}
          <View style={styles.typesGrid}>
            {driverTypes.map((tItem) => (
              <TouchableOpacity
                key={tItem.id}
                style={styles.typeRow}
                onPress={() => setSelectedDriverType(tItem.id)}
                disabled={isLoading}
              >
                <View style={[styles.radio, selectedDriverType === tItem.id && styles.radioActive]} />
                <Text style={[styles.typeLabel, selectedDriverType === tItem.id && styles.typeLabelActive]}>
                  {tItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Instruction */}
          <Text style={styles.infoText}>
            UbexGo dasturida ro’yxatdan o’tgan telefon raqamingizni kiriting
          </Text>

          {/* Country Selector */}
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryName}>{selectedCountry.name}</Text>
          </TouchableOpacity>

          {/* Country Picker */}
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
                        key={`${country.code}-${country.name}`}
                        style={styles.countryOption}
                        onPress={() => {
                          setSelectedCountry(country);
                          setShowCountryPicker(false);
                          setPhoneNumber((prev) => formatPhoneNumber(prev, country));
                        }}
                      >
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <Text style={styles.countryName}>{country.name}</Text>
                        <Text style={styles.countryCode}>{country.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Phone Input */}
          <View style={styles.phoneInputContainer}>
            <View style={styles.phoneCodeBox}>
              <Text style={styles.phoneCode}>{selectedCountry.code}</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder={t('phoneRegistration.phonePlaceholder')}
              placeholderTextColor={theme.palette.text.secondary}
              value={phoneNumber}
              onChangeText={(text: string) =>
                setPhoneNumber(formatPhoneNumber(text, selectedCountry))
              }
              keyboardType="phone-pad"
              maxLength={getFormattedMaxLength(selectedCountry)}
              editable={!isLoading}
            />
          </View>

          {/* Or ID line */}
          <Text style={styles.orText}>yoki UbexGo ID raqamingiz</Text>

          {/* ID Input */}
          <View style={styles.idInputContainer}>
            <Text style={styles.idLabel}>ID:</Text>
            <View style={styles.idFieldWrapper}>
              <TextInput
                style={styles.idInput}
                placeholder="1 001 117"
                placeholderTextColor={theme.palette.text.secondary}
                value={userId}
                onChangeText={setUserId}
                keyboardType="number-pad"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              “Keyingi” tugmasini bosish orqali <Text style={styles.termsLink}>foydalanuvchi shartnomasi</Text> shartlarini qabul qilaman
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={
              isLoading ||
              (phoneNumber.replace(/\D/g, '').length < selectedCountry.localLength &&
                !(userId && userId.trim().length > 0))
            }
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
    marginTop: theme.spacing(2),
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
    marginBottom: theme.spacing(2),
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: theme.spacing(4),
    rowGap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.palette.border,
    marginRight: theme.spacing(1),
  },
  radioActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  typeLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
  },
  typeLabelActive: {
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.palette.border,
    marginBottom: theme.spacing(2),
  },
  countryFlag: {
    fontSize: 24,
    marginRight: theme.spacing(1.5),
  },
  countryName: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    flex: 1,
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
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
  },
  countryCode: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing(2),
  },
  phoneCodeBox: {
    backgroundColor: theme.palette.grey[100],
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing(1.5),
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.palette.border,
  },
  phoneCode: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: theme.palette.background.card,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  editIcon: {
    marginLeft: theme.spacing(1),
    fontSize: 16,
  },
  orText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  idInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  idLabel: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginRight: theme.spacing(1),
  },
  idFieldWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.background.card,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
  },
  idInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  termsContainer: {
    marginBottom: theme.spacing(3),
  },
  termsText: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    textAlign: 'left',
  },
  termsLink: {
    color: '#2196F3',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: theme.spacing(2.5),
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
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
  },
});

