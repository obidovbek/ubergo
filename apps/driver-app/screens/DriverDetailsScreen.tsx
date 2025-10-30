/**
 * Driver Details Screen - Driver App
 * Driver registration with type selection and profile details
 */

import React, { useState } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError } from '../utils/errorHandler';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../config/api';

const theme = createTheme('light');

type DriverType = 'driver' | 'dispatcher' | 'special_transport' | 'logist';

export const DriverDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token, updateUser } = useAuth();
  const { t } = useTranslation();
  
  const phoneNumberFromRoute = (route.params as any)?.phoneNumber;
  const phoneNumber = phoneNumberFromRoute || user?.phone_e164 || '';
  const driverId = user?.id?.toString() || '';

  const [driverType, setDriverType] = useState<DriverType | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const driverTypes = [
    { id: 'driver', label: 'Haydovchi', icon: '🚗' },
    { id: 'dispatcher', label: 'Dispetcher', icon: '📞' },
    { id: 'special_transport', label: 'Maxsus transport', icon: '🚚' },
    { id: 'logist', label: 'Logist', icon: '📦' },
  ];

  const handleContinue = async () => {
    if (!driverType) {
      showToast.warning('Xatolik', 'Iltimos yo\'nalishni tanlang');
      return;
    }

    setIsLoading(true);

    try {
      console.log('=== Driver Profile Update ===');
      console.log('Driver Type:', driverType);
      
      const profileData = {
        driver_type: driverType,
        role: 'driver',
      };

      console.log('Submitting driver profile:', JSON.stringify(profileData, null, 2));

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.user.updateProfile}`,
        {
          method: 'PUT',
          headers: getHeaders(token),
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();
      console.log('Driver profile update response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update driver profile');
      }

      if (data.data && data.data.user) {
        updateUser(data.data.user);
      }

      console.log('Driver profile updated successfully');
      showToast.success('Muvaffaqiyatli', 'Profil yangilandi');
      
      // Navigate to main app after successful registration
    } catch (error) {
      console.error('Driver profile update error:', error);
      handleBackendError(error, {
        t,
        defaultMessage: 'Profil yangilanmadi',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>UbexGo Driver</Text>
          <Text style={styles.title}>Driver registration</Text>
        </View>

        {/* Driver Type Selection */}
        <View style={styles.driverTypesContainer}>
          {driverTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.driverTypeButton,
                driverType === type.id && styles.driverTypeButtonActive,
              ]}
              onPress={() => setDriverType(type.id as DriverType)}
              disabled={isLoading}
            >
              <View
                style={[
                  styles.radio,
                  driverType === type.id && styles.radioActive,
                ]}
              />
              <Text
                style={[
                  styles.driverTypeText,
                  driverType === type.id && styles.driverTypeTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Text */}
        <Text style={styles.infoText}>
          UbexGo dasturida ro'yxatdan o'tgan telefon raqamingizni kiriting
        </Text>

        {/* Phone Display */}
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tel.:</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>{phoneNumber}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Text 2 */}
        <Text style={styles.infoText}>yoki UbexGo ID raqamingiz</Text>

        {/* Driver ID Display */}
        <View style={styles.infoRow}>
          <Text style={styles.label}>ID:</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>{driverId}</Text>
            <TouchableOpacity>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms Text */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            "Keyingi" tugmasini boshhish orqali{' '}
            <Text style={styles.termsLink}>foydalanuvchi shartlarini</Text>{' '}
            shartlarini qabul qilaman
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (isLoading || !driverType) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isLoading || !driverType}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Yuklanmoqda...' : 'Continue'}
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
    marginBottom: theme.spacing(3),
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
  driverTypesContainer: {
    marginBottom: theme.spacing(3),
  },
  driverTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
    marginBottom: theme.spacing(1),
  },
  driverTypeButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.palette.border,
    marginRight: theme.spacing(2),
  },
  radioActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  driverTypeText: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    fontSize: 16,
  },
  driverTypeTextActive: {
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    paddingHorizontal: theme.spacing(1),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
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
  termsContainer: {
    marginBottom: theme.spacing(3),
    paddingHorizontal: theme.spacing(1),
  },
  termsText: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    textAlign: 'left',
  },
  termsLink: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: theme.spacing(2.5),
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing(2),
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

