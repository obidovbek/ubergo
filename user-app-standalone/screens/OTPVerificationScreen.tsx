/**
 * OTP Verification Screen
 * Second step of registration - verify phone with OTP code
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { OTPVerificationNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError } from '../utils/errorHandler';

const theme = createTheme('light');


export const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPVerificationNavigationProp>();
  const route = useRoute();
  const { phoneNumber } = (route.params as any) || {};
  const { verifyOtp, sendOtp } = useAuth();
  const { t } = useTranslation();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    const newOtpCode = [...newOtp].join('');
    if (newOtpCode.length === 4) {
      handleVerify(newOtpCode);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    
    if (otpCode.length < 4) {
      showToast.warning(t('common.error'), t('otpVerification.errorIncomplete'));
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('=== OTP Verification Debug ===');
      console.log('Phone:', phoneNumber);
      console.log('OTP Code:', otpCode);
      
      await verifyOtp(phoneNumber, otpCode);
      
      console.log('OTP verified successfully');
      showToast.success(t('common.success'), t('otpVerification.title'));
      
      // Note: After successful OTP verification, the AuthContext will automatically
      // update the user state. The RootNavigator will handle navigation based on
      // whether the user's profile is complete or not.
      // - If profile_complete is false, RootNavigator will show UserDetailsScreen
      // - If profile_complete is true, RootNavigator will show MainNavigator (HomeScreen)
    } catch (error) {
      console.error('OTP verification error:', error);
      console.log('Current attempts:', attempts);
      console.log('Current remaining attempts:', remainingAttempts);
      
      const newAttempts = attempts + 1;
      const newRemainingAttempts = remainingAttempts - 1;
      
      console.log('New attempts:', newAttempts);
      console.log('New remaining attempts:', newRemainingAttempts);
      
      setAttempts(newAttempts);
      setRemainingAttempts(newRemainingAttempts);
      
      if (newRemainingAttempts > 0) {
        // Clear OTP input fields after incorrect attempt
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Show error with remaining attempts
        showToast.error(
          t('common.error'),
          `${t('otpVerification.errorIncorrect')}${newRemainingAttempts}`
        );
      } else {
        // No more attempts left, redirect to phone registration
        showToast.error(
          t('otpVerification.errorNoAttempts'),
          t('otpVerification.errorNoAttemptsMessage')
        );
        
        // Navigate back after showing toast
        setTimeout(() => {
          navigation.navigate('PhoneRegistration');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    handleVerify();
  };

  const handleResendCode = async () => {
    try {
      await sendOtp(phoneNumber, 'sms');
      showToast.success(t('common.success'), t('otpVerification.newCodeSent'));
      
      // Reset attempts when resending code
      setAttempts(0);
      setRemainingAttempts(3);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      handleBackendError(error, {
        t,
        defaultMessage: t('otpVerification.errorResend'),
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>{t('auth.appName')}</Text>
          <Text style={styles.title}>{t('otpVerification.title')}</Text>
          <Text style={styles.subtitle}>
            {t('otpVerification.subtitle')}
          </Text>
        </View>

        {/* Phone Number Display */}
        <View style={styles.phoneContainer}>
          <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Attempts Counter */}
        {attempts > 0 && (
          <View style={[
            styles.attemptsContainer,
            remainingAttempts === 1 && styles.attemptsContainerWarning
          ]}>
            <Text style={[
              styles.attemptsText,
              remainingAttempts === 1 && styles.attemptsTextWarning
            ]}>
              {t('otpVerification.attemptsLabel')}{attempts}/3{t('otpVerification.remainingLabel')}{remainingAttempts}
            </Text>
          </View>
        )}

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.otpInputWrapper}>
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
              <View
                style={[
                  styles.otpIndicator,
                  digit && styles.otpIndicatorFilled,
                ]}
              />
            </View>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (isLoading || otp.join('').length < 4) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isLoading || otp.join('').length < 4}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? t('otpVerification.verifying') : t('common.continue')}
          </Text>
        </TouchableOpacity>

        {/* Resend Code */}
        <TouchableOpacity style={styles.resendContainer} onPress={handleResendCode}>
          <Text style={styles.resendText}>
            {t('otpVerification.resendQuestion')}
            <Text style={styles.resendLink}>{t('otpVerification.resendLink')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
  content: {
    flex: 1,
    padding: theme.spacing(3),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing(4),
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(4),
  },
  phoneNumber: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginRight: theme.spacing(2),
  },
  editIcon: {
    fontSize: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(4),
    paddingHorizontal: theme.spacing(2),
  },
  otpInputWrapper: {
    flex: 1,
    marginHorizontal: theme.spacing(0.5),
    alignItems: 'center',
  },
  otpInput: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.borderRadius.md,
    ...theme.typography.h2,
    textAlign: 'center',
    color: theme.palette.text.primary,
    fontWeight: '700',
  },
  otpIndicator: {
    marginTop: theme.spacing(1),
    height: 4,
    width: '100%',
    backgroundColor: theme.palette.grey[300],
    borderRadius: 2,
  },
  otpIndicatorFilled: {
    backgroundColor: '#4CAF50',
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
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  resendLink: {
    color: '#2196F3',
    fontWeight: '600',
  },
  attemptsContainer: {
    backgroundColor: '#FFF3E0',
    padding: theme.spacing(1.5),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(2),
    alignItems: 'center',
  },
  attemptsContainerWarning: {
    backgroundColor: '#FFEBEE',
  },
  attemptsText: {
    ...theme.typography.body2,
    color: '#FF9800',
    fontWeight: '600',
  },
  attemptsTextWarning: {
    color: theme.palette.error.main,
  },
});

