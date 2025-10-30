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
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import type { PhoneRegistrationNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError } from '../utils/errorHandler';

const theme = createTheme('light');


// Country data (simplified for demo) 
const countries = [
  { code: '+998', flag: '🇺🇿', name: "O'zbekiston" },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
];

export const PhoneRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<PhoneRegistrationNavigationProp>();
  const { sendOtp } = useAuth();
  const { t } = useTranslation();
  
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as: XX XXX-XX-XX (Uzbekistan format)
    // Pattern: XX XXX-XX-XX (total 9 digits)
    let formatted = '';
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 5) {
      formatted = `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
    } else {
      formatted = `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}-${cleaned.slice(7, 9)}`;
    }
    
    return formatted.substring(0, 15); // Max length with formatting
  };

  const handleContinue = async () => {
    // Remove all non-numeric characters
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    
    console.log('=== OTP Send Debug ===');
    console.log('Phone input value:', phoneNumber);
    console.log('Cleaned number:', cleanedNumber);
    console.log('Selected country code:', selectedCountry.code);
    
    if (cleanedNumber.length < 9) {
      showToast.warning(t('common.error'), t('phoneRegistration.errorPhoneIncomplete'));
      return;
    }

    setIsLoading(true);
    
    try {
      // Format: +9981234567  (country code + 9 digits)
      const fullPhone = `${selectedCountry.code}${cleanedNumber}`;
      console.log('Full phone number:', fullPhone);
      console.log('Sending OTP to:', fullPhone);
      
      await sendOtp(fullPhone, 'sms');
      
      console.log('OTP sent successfully');
      
      // Navigate to OTP screen
      console.log('Attempting to navigate to OTPVerification screen...');
      try {
        navigation.navigate('OTPVerification', {
          phoneNumber: fullPhone,
        });
        console.log('Navigation successful');
      } catch (navError) {
        console.error('Navigation error:', navError);
        showToast.error('Navigation Error', 'Failed to navigate to OTP screen');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      handleBackendError(error, {
        t,
        defaultMessage: 'OTP yuborishda xatolik yuz berdi',
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
            <Text style={styles.logo}>{t('auth.appName')}</Text>
            <Text style={styles.title}>{t('phoneRegistration.title')}</Text>
            <Text style={styles.subtitle}>
              {t('phoneRegistration.subtitle')}
            </Text>
          </View>

          {/* Country Selector */}
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryName}>{selectedCountry.name}</Text>
          </TouchableOpacity>

          {/* Country Picker */}
          {showCountryPicker && (
            <View style={styles.countryPicker}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.countryOption}
                  onPress={() => {
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryCode}>{country.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Phone Input */}
          <View style={styles.phoneInputContainer}>
            <View style={styles.phoneCodeBox}>
              <Text style={styles.phoneCode}>{selectedCountry.code}</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder={t('phoneRegistration.phonePlaceholder')}
              value={phoneNumber}
              onChangeText={(text: string) => setPhoneNumber(formatPhoneNumber(text))}
              keyboardType="phone-pad"
              maxLength={15}
              editable={!isLoading}
            />
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              {t('phoneRegistration.termsText')}
              <Text style={styles.termsLink}>{t('phoneRegistration.termsLink')}</Text>
              {t('phoneRegistration.termsText2')}
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isLoading || phoneNumber.replace(/\D/g, '').length < 9}
          >
            <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
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
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: theme.spacing(2),
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
  countryPicker: {
    backgroundColor: theme.palette.background.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.palette.border,
    marginBottom: theme.spacing(2),
    ...theme.shadows.md,
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

