/**
 * Phone Registration Screen
 * First step of registration - collect phone number
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import type { PhoneRegistrationNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useGoogleSignIn, GoogleSignInServiceNative } from '../services/GoogleSignInService';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError } from '../utils/errorHandler';
import { useCountries } from '../hooks/useCountries';
import type { CountryOption } from '../types/country';
import { LanguageSelector } from '../components/LanguageSelector';

const theme = createTheme('light');


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
  const { googleSignIn, sendOtp } = useAuth();
  const { signIn: googleSignInExpo, isReady: googleReady } = useGoogleSignIn();
  const { t } = useTranslation();
  const { countries, isLoading: countriesLoading, error: countriesError } = useCountries();

  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

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

  const formatPhoneNumber = (text: string, country?: CountryOption | null) => {
    const targetCountry = country ?? activeCountry;
    if (!targetCountry) {
      return text.replace(/\D/g, '');
    }
    return formatPhoneForCountry(text, targetCountry);
  };

  useEffect(() => {
    if (activeCountry) {
      setPhoneNumber((prev) => formatPhoneNumber(prev, activeCountry));
    }
  }, [activeCountry?.code, activeCountry?.pattern]);

  const handleContinue = async () => {
    if (!activeCountry) {
      console.warn('No active country selected');
      return;
    }

    // Remove all non-numeric characters
    const cleanedNumber = phoneNumber.replace(/\D/g, '');

    console.log('=== OTP Send Debug ===');
    console.log('Phone input value:', phoneNumber);
    console.log('Cleaned number:', cleanedNumber);
    console.log('Selected country code:', activeCountry.code);

    if (cleanedNumber.length < activeCountry.localLength) {
      showToast.warning(t('common.error'), t('phoneRegistration.errorPhoneIncomplete'));
      return;
    }

    setIsLoading(true);

    try {
      // Format: +9981234567  (country code + 9 digits)
      const fullPhone = `${activeCountry.code}${cleanedNumber}`;
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
        showToast.error(t('common.navigationError'), t('phoneRegistration.errorNavigation'));
      }
    } catch (error) {
      console.error('OTP send error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      handleBackendError(error, {
        t,
        defaultMessage: t('phoneRegistration.errorOtpSend'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    try {
      let result;

      // Try native Google Sign-In first (only works with Google Play Services)
      try {
        console.log('Attempting native Google Sign-In...');
        result = await GoogleSignInServiceNative.signIn();
        console.log('Native Google Sign-In successful');
      } catch (nativeError: any) {
        console.log('Native Google Sign-In not available, using web flow...');

        // Check if Google auth session is ready
        if (!googleReady) {
          throw new Error(t('phoneRegistration.errorGoogleNotReady'));
        }

        // Fall back to expo auth session (web-based OAuth)
        console.log('Starting web-based Google OAuth...');
        result = await googleSignInExpo();

        if (result) {
          console.log('Web-based Google Sign-In successful');
        }
      }

      if (result?.idToken) {
        console.log('Authenticating with backend...');
        await googleSignIn(result.idToken);
        console.log('Backend authentication successful');
        // Navigation handled by auth context
      } else {
        console.log('Google Sign-In cancelled by user');
        showToast.info(t('common.info'), t('phoneRegistration.errorGoogleCancelled'));
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);

      // More specific error messages
      let errorMessage = t('phoneRegistration.errorGoogleFailed');

      if (error.message?.includes('not ready')) {
        errorMessage = t('phoneRegistration.errorGoogleNotReady');
      } else if (error.message?.includes('cancelled')) {
        errorMessage = t('phoneRegistration.errorGoogleCancelled');
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = t('phoneRegistration.errorNetwork');
      }

      showToast.error(t('common.error'), errorMessage);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    if (provider === 'Google') {
      handleGoogleSignIn();
    } else {
      showToast.info(t('common.info'), `${provider}${t('phoneRegistration.infoNotAvailable')}`);
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
            <View style={styles.languageSelectorContainer}>
              <LanguageSelector />
            </View>
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
            disabled={countriesLoading}
          >
            <Text style={styles.countryFlag}>{activeCountry?.flag ?? '🌐'}</Text>
            <Text style={styles.countryName}>{activeCountry?.name ?? t('phoneRegistration.selectCountry')}</Text>
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
                <TouchableWithoutFeedback onPress={() => { }}>
                  <View style={styles.countryPickerModal}>
                    {countries.map((country) => (
                      <TouchableOpacity
                        key={`${country.id ?? country.code}-${country.name}`}
                        style={styles.countryOption}
                        onPress={() => {
                          setSelectedCountry(country);
                          setShowCountryPicker(false);
                          setPhoneNumber((prev) => formatPhoneNumber(prev, country));
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

          {/* Phone Input */}
          <View style={styles.phoneInputContainer}>
            <View style={styles.phoneCodeBox}>
              <Text style={styles.phoneCode}>{activeCountry?.code ?? ''}</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder={t('phoneRegistration.phonePlaceholder')}
              placeholderTextColor={theme.palette.text.hint}
              value={phoneNumber}
              onChangeText={(text: string) =>
                setPhoneNumber(formatPhoneNumber(text, activeCountry))
              }
              keyboardType="phone-pad"
              maxLength={activeCountry ? getFormattedMaxLength(activeCountry) : 20}
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
            disabled={
              isLoading ||
              !activeCountry ||
              phoneNumber.replace(/\D/g, '').length < activeCountry.localLength
            }
          >
            <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
          </TouchableOpacity>

          {/* Social Login Options */}
          {/* <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.socialButton, socialLoading && styles.socialButtonDisabled]}
              onPress={() => handleSocialAuth('Google')}
              disabled={socialLoading || isLoading}
            >
              {socialLoading ? (
                <ActivityIndicator size="small" color={theme.palette.primary.main} style={{ marginRight: theme.spacing(2) }} />
              ) : (
                <Text style={styles.socialIcon}>G</Text>
              )}
              <Text style={styles.socialText}>
                {socialLoading ? t('phoneRegistration.signingIn') : t('phoneRegistration.googleSignIn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth('Apple')}
            >
              <Text style={styles.socialIcon}></Text>
              <Text style={styles.socialText}>{t('phoneRegistration.appleSignIn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => handleSocialAuth('Facebook')}
            >
              <Text style={styles.socialIcon}>f</Text>
              <Text style={[styles.socialText, styles.facebookText]}>
                {t('phoneRegistration.facebookSignIn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth('Microsoft')}
            >
              <Text style={styles.socialIcon}>⊞</Text>
              <Text style={styles.socialText}>{t('phoneRegistration.microsoftSignIn')}</Text>
            </TouchableOpacity>
          </View> */}

          {/* Footer */}
          {/* <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('phoneRegistration.footerText')}
              <Text style={styles.footerLink}>{t('phoneRegistration.footerLink')}</Text>
              {t('phoneRegistration.footerText2')}
            </Text>
          </View> */}

          {/* Login Link */}
          {/* <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('phoneRegistration.alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>{t('phoneRegistration.login')}</Text>
            </TouchableOpacity>
          </View> */}
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
    position: 'relative',
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
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
  socialContainer: {
    marginBottom: theme.spacing(2),
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.palette.border,
    marginBottom: theme.spacing(1.5),
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  facebookButton: {
    borderColor: '#1877F2',
  },
  socialIcon: {
    fontSize: 24,
    marginRight: theme.spacing(2),
    width: 32,
    textAlign: 'center',
  },
  socialText: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    fontWeight: '500',
  },
  facebookText: {
    color: '#1877F2',
  },
  footer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerLink: {
    color: '#2196F3',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.palette.divider,
  },
  loginText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  loginLink: {
    ...theme.typography.body2,
    color: '#2196F3',
    fontWeight: '600',
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
});

