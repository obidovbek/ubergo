/**
 * OTP Verification Screen - Driver App
 * Verification of phone and display driver ID
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
  ScrollView,
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
  const { phoneNumber, userId: routeUserId } = (route.params as any) || {};
  const { verifyOtp, sendOtp, user } = useAuth();
  const { t } = useTranslation();

  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [driverId, setDriverId] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Get driver ID from user object once authenticated
  useEffect(() => {
    if (user?.id) {
      setDriverId(user.id.toString());
    }
  }, [user]);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 5 digits entered
    const newOtpCode = [...newOtp].join('');
    if (newOtpCode.length === 5) {
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
    
    if (otpCode.length < 5) {
      showToast.warning(t('common.error'), 'Iltimos kodni to\'ldiring');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('=== Driver OTP Verification ===');
      console.log('Phone:', phoneNumber);
      console.log('OTP Code:', otpCode);
      
      await verifyOtp(phoneNumber, otpCode, { userId: routeUserId });
      
      console.log('OTP verified successfully');
      showToast.success(t('common.success'), 'Telefon tasdiqlandi');
      
      // Navigate to driver details screen after verification
      // Note: Driver registration flow continues to DriverDetailsScreen
    } catch (error) {
      console.error('OTP verification error:', error);
      
      const newAttempts = attempts + 1;
      const newRemainingAttempts = remainingAttempts - 1;
      
      setAttempts(newAttempts);
      setRemainingAttempts(newRemainingAttempts);
      
      if (newRemainingAttempts > 0) {
        // Clear OTP input fields after incorrect attempt
        setOtp(['', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Show error with remaining attempts
        showToast.error(
          t('common.error'),
          `Noto'g'ri kod. Qolgan urinishlar: ${newRemainingAttempts}`
        );
      } else {
        // No more attempts left, redirect to phone registration
        showToast.error(
          'Xatolik',
          'Urinishlar tugadi. Iltimos qaytadan urinib ko\'ring'
        );
        
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
      await sendOtp(phoneNumber, 'push', { userId: routeUserId });
      showToast.success(t('common.success'), 'Yangi kod yuborildi');
      
      // Reset attempts when resending code
      setAttempts(0);
      setRemainingAttempts(3);
      setOtp(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      handleBackendError(error, {
        t,
        defaultMessage: 'Kod yuborishda xatolik',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>UbexGo Driver</Text>
          <Text style={styles.title}>Kodni kiriting</Text>
          <Text style={styles.subtitle}>
            UbexGo dasturida quyidagi akkauntga kelgan Tasdiqlash kodini kiriting
          </Text>
        </View>

        {/* Phone Number Display */}
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tel.:</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>{phoneNumber}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Driver ID Display */}
        {driverId && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>ID:</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{driverId}</Text>
            </View>
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
            (isLoading || otp.join('').length < 5) &&
              styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isLoading || otp.join('').length < 5}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Tekshirilmoqda...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        {/* Resend Code */}
        <TouchableOpacity style={styles.resendContainer} onPress={handleResendCode}>
          <Text style={styles.resendText}>
            Kod kelmadimi? <Text style={styles.resendLink}>Qayta yuborish</Text>
          </Text>
        </TouchableOpacity>
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
    paddingTop: theme.spacing(5),
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing(4),
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: theme.spacing(2),
  },
  title: {
    ...theme.typography.h2,
    color: theme.palette.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing(2),
  },
  subtitle: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing(2),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    paddingHorizontal: theme.spacing(1),
  },
  label: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginRight: theme.spacing(1),
    minWidth: 50,
  },
  infoValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
  },
  infoValue: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  editIcon: {
    fontSize: 18,
    marginLeft: theme.spacing(1),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(3),
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
    ...theme.typography.h1,
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
    marginHorizontal: theme.spacing(2),
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
  resendContainer: {
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  resendText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  resendLink: {
    color: '#2196F3',
    fontWeight: '600',
  },
});

