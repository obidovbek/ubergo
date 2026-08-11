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
  ScrollView,
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { OTPVerificationNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError, getRetryAfterSec } from '../utils/errorHandler';
import { savePendingOtp, clearPendingOtp } from '../utils/pendingOtp';

const theme = createTheme('light');

/**
 * Fallback resend cooldown, in seconds.
 *
 * The server is the authority (it returns `cooldownSec` on a send and `retryAfterSec`
 * on a 429); this only covers the first render, before either has arrived.
 * The cooldown is per phone, so it applies to the push channel used here too.
 */
const DEFAULT_RESEND_COOLDOWN_SEC = 60;


export const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPVerificationNavigationProp>();
  const route = useRoute();
  const { phoneNumber, userId: routeUserId } = (route.params as any) || {};
  const { verifyOtp, sendOtp, user, token, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [driverId, setDriverId] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [isResending, setIsResending] = useState(false);
  // A code was just sent to reach this screen, so the cooldown starts now. Held as a
  // wall-clock deadline rather than a counter: JS timers are throttled while the app is
  // backgrounded, so a decrementing counter would come back stale (T-033).
  const [resendAt, setResendAt] = useState<number>(
    () => Date.now() + DEFAULT_RESEND_COOLDOWN_SEC * 1000
  );
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_RESEND_COOLDOWN_SEC);

  // Recompute from the deadline every second, so returning from the background shows
  // the true remaining time instead of resuming where the timer was paused.
  useEffect(() => {
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resendAt]);

  const canResend = secondsLeft <= 0 && !isResending;

  // Get driver ID from user object once authenticated
  useEffect(() => {
    if (user?.id) {
      setDriverId(user.id.toString());
    }
  }, [user]);

  // Remember we're on the OTP step so a background/app-kill resumes here with the
  // phone prefilled, instead of dropping to the main menu (OR-001).
  useEffect(() => {
    if (phoneNumber || routeUserId) {
      savePendingOtp({ phone: phoneNumber, userId: routeUserId });
    }
  }, [phoneNumber, routeUserId]);

  // Handle navigation after successful authentication
  // RootNavigator will switch from AuthNavigator to ProfileCompletionNavigator or MainNavigator
  // This effect ensures the screen doesn't remain visible during the transition
  useEffect(() => {
    if (verificationSuccess && isAuthenticated && user && token) {
      console.log('OTPVerificationScreen: Authentication successful, RootNavigator will handle navigation');
      // RootNavigator will automatically switch navigators based on profile status
      // We don't need to navigate manually - the RootNavigator will unmount this screen
      // when it switches from AuthNavigator to ProfileCompletionNavigator or MainNavigator
      // Keep loading state active during transition
      setIsLoading(true);
    }
  }, [verificationSuccess, isAuthenticated, user, token]);

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

    // Auto-submit when all 4 digits entered
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
      console.log('=== Driver OTP Verification ===');
      console.log('Phone:', phoneNumber);
      console.log('OTP Code:', otpCode);
      
      // Verify OTP - this will update auth context with token
      await verifyOtp(phoneNumber, otpCode, { userId: routeUserId });
      
      console.log('OTP verified successfully');
      setVerificationSuccess(true);
      // Verification done — don't resume the OTP screen anymore.
      clearPendingOtp();
      showToast.success(t('common.success'), t('otpVerification.phoneVerified'));
      
      // Auth context will update and RootNavigator will automatically check
      // driver profile status and route accordingly:
      // - If profile incomplete → ProfileCompletionNavigator (DriverPersonalInfo)
      // - If profile complete → MainNavigator (Home)
      // The RootNavigator will switch from AuthNavigator to the appropriate navigator,
      // which will unmount this screen automatically
      console.log('Auth context updated, RootNavigator will handle routing based on driver profile status');
      
      // Give RootNavigator a moment to process the auth state change and switch navigators
      // If still on this screen after a short delay, it means RootNavigator hasn't switched yet
      // (This should be rare, but helps ensure smooth transition)
    } catch (error) {
      console.error('OTP verification error:', error);
      
      const newAttempts = attempts + 1;
      const newRemainingAttempts = remainingAttempts - 1;
      
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
        
        clearPendingOtp();
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

  // The user wants to change the phone number. Clear the resume marker and go to
  // phone registration — works whether OTP is a pushed screen or the resumed root.
  const handleEditPhone = () => {
    clearPendingOtp();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('PhoneRegistration');
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      console.log('Resending OTP via push notification...');
      const response = await sendOtp(phoneNumber, 'push', { userId: routeUserId });
      setResendAt(
        Date.now() +
          (response?.data?.cooldownSec ?? DEFAULT_RESEND_COOLDOWN_SEC) * 1000
      );
      showToast.success(t('common.success'), t('otpVerification.newCodeSent'));

      // Reset attempts when resending code
      setAttempts(0);
      setRemainingAttempts(3);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Failed to resend push notification:', error);
      // If the server refused because we are still inside its window, sync the
      // countdown to what it actually said instead of guessing.
      const retryAfter = getRetryAfterSec(error);
      if (retryAfter) {
        setResendAt(Date.now() + retryAfter * 1000);
      }
      handleBackendError(error, {
        t,
        defaultMessage: t('otpVerification.errorResendPush'),
      });
    } finally {
      setIsResending(false);
    }
  };

  // If authentication succeeded, RootNavigator will switch navigators
  // Show loading state during transition
  if (verificationSuccess && isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('otpVerification.phoneVerified')}</Text>
          <Text style={styles.loadingSubtext}>Yuklanmoqda...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>{t('otpVerification.brand')}</Text>
          <Text style={styles.title}>{t('otpVerification.title')}</Text>
          <Text style={styles.subtitle}>
            {t('otpVerification.subtitle')}
          </Text>
        </View>

        {/* Phone Number Display */}
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('userDetails.phone')}</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>{phoneNumber}</Text>
            <TouchableOpacity onPress={handleEditPhone}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Driver ID Display */}
        {driverId && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('userDetails.userId')}</Text>
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
                ref={(ref) => { inputRefs.current[index] = ref; }}
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
        {/* Resend Code — disabled with a visible countdown while the server's
            cooldown is running, so the tap cannot fail (T-033). */}
        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleResendCode}
          disabled={!canResend}
        >
          <Text style={styles.resendText}>
            {t('otpVerification.resendQuestion')}
            {canResend ? (
              <Text style={styles.resendLink}>{t('otpVerification.resendLink')}</Text>
            ) : (
              <Text style={styles.resendCountdown}>
                {t('otpVerification.resendIn').replace('{seconds}', String(secondsLeft))}
              </Text>
            )}
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
  // Deliberately not the link blue — it must not read as tappable while counting down.
  resendCountdown: {
    color: theme.palette.text.disabled,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  loadingText: {
    ...theme.typography.h3,
    color: '#4CAF50',
    fontWeight: '700',
    marginBottom: theme.spacing(2),
    textAlign: 'center',
  },
  loadingSubtext: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },
});

