/**
 * Driver Taxi License Screen (Step 5)
 * Collects taxi license and related documents
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
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError } from '../utils/errorHandler';
import { updateTaxiLicense, getDriverProfile, getDriverProfileStatus } from '../api/driver';

const theme = createTheme('light');

export const DriverTaxiLicenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    father_name: '',
  });
  const [formData, setFormData] = useState({
    // License Information
    license_number: '',
    license_issue_date: '',
    license_registry_number: '',
    license_document_url: '',
    // License Sheet Information
    license_sheet_number: '',
    license_sheet_valid_from: '',
    license_sheet_valid_until: '',
    license_sheet_document_url: '',
    // Self-Employment
    self_employment_number: '',
    self_employment_document_url: '',
    // Power of Attorney
    power_of_attorney_document_url: '',
    // Insurance
    insurance_document_url: '',
  });

  useEffect(() => {
    loadPersonalInfo();
    loadTaxiLicenseData();
  }, []);

  const loadPersonalInfo = async () => {
    if (!token) return;
    
    try {
      const profile = await getDriverProfile(token);
      if (profile.profile) {
        setPersonalInfo({
          first_name: profile.profile.first_name || '',
          last_name: profile.profile.last_name || '',
          father_name: profile.profile.father_name || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadTaxiLicenseData = async () => {
    if (!token) return;
    
    try {
      const profile = await getDriverProfile(token);
      if (profile.profile?.taxi_license) {
        const taxiLicense = profile.profile.taxi_license;
        setFormData(prev => ({
          ...prev,
          license_number: taxiLicense.license_number || '',
          license_issue_date: taxiLicense.license_issue_date || '',
          license_registry_number: taxiLicense.license_registry_number || '',
          license_sheet_number: taxiLicense.license_sheet_number || '',
          license_sheet_valid_from: taxiLicense.license_sheet_valid_from || '',
          license_sheet_valid_until: taxiLicense.license_sheet_valid_until || '',
          self_employment_number: taxiLicense.self_employment_number || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load taxi license data:', error);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (field: string, type: 'photo' | 'pdf') => {
    // TODO: Implement actual photo/PDF upload
    showToast.info('Info', 'Photo/PDF upload funksiyasi keyinchalik qo\'shiladi');
  };

  const handleContinue = async () => {
    if (!formData.license_number) {
      showToast.warning(t('common.error'), 'Litsenziya raqamini kiriting');
      return;
    }

    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    setIsLoading(true);

    try {
      const cleanData: any = {
        license_number: formData.license_number,
        license_issue_date: formData.license_issue_date || undefined,
        license_registry_number: formData.license_registry_number || undefined,
        license_document_url: formData.license_document_url || undefined,
        license_sheet_number: formData.license_sheet_number || undefined,
        license_sheet_valid_from: formData.license_sheet_valid_from || undefined,
        license_sheet_valid_until: formData.license_sheet_valid_until || undefined,
        license_sheet_document_url: formData.license_sheet_document_url || undefined,
        self_employment_number: formData.self_employment_number || undefined,
        self_employment_document_url: formData.self_employment_document_url || undefined,
        power_of_attorney_document_url: formData.power_of_attorney_document_url || undefined,
        insurance_document_url: formData.insurance_document_url || undefined,
      };

      // Remove undefined values
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === '') {
          delete cleanData[key];
        }
      });

      await updateTaxiLicense(token, cleanData);
      
      showToast.success(t('common.success'), 'Taksi litsenziya ma\'lumotlari saqlandi');
      
      // Check if profile is now complete
      try {
        const status = await getDriverProfileStatus(token);
        if (status.isComplete) {
          // Show completion message
          setTimeout(() => {
            showToast.success(t('common.success'), 'Ro\'yxatdan o\'tish yakunlandi! Bosh sahifaga o\'tmoqda...');
          }, 500);
          
          // Profile is complete - RootNavigator will detect this on next app focus or re-mount
          // No need for polling - the check happens when navigator initializes
        } else {
          // Profile not complete yet, but data is saved
          showToast.info(t('common.info'), 'Ma\'lumotlar saqlandi. Profil tekshirilmoqda...');
        }
      } catch (error) {
        console.error('Failed to check profile status after saving:', error);
        // Still show success message even if status check fails
        showToast.success(t('common.success'), 'Ma\'lumotlar saqlandi');
      }
    } catch (error) {
      console.error('Failed to save taxi license info:', error);
      handleBackendError(error, {
        t,
        defaultMessage: 'Ma\'lumotlarni saqlashda xatolik',
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
            <Text style={styles.brand}>UbexGo</Text>
            <Text style={styles.title}>Shaharlar aro</Text>
            <Text style={styles.subtitle}>LITSENZIYA</Text>
          </View>

          {/* Read-only personal info */}
          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>
              ISM      Familiya      Otasining ismi
            </Text>
            <Text style={styles.readOnlyValue}>
              {personalInfo.first_name} {personalInfo.last_name} {personalInfo.father_name}
            </Text>
          </View>

          {/* License Section */}
          <Text style={styles.sectionTitle}>LITSENZIYA</Text>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>LITSENZIYA raqami:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="AT 1234567"
              placeholderTextColor={theme.palette.text.secondary}
              value={formData.license_number}
              onChangeText={(value: string) => updateField('license_number', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Berilgan sanasi:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="25.01.2025"
              placeholderTextColor={theme.palette.text.secondary}
              value={formData.license_issue_date}
              onChangeText={(value: string) => updateField('license_issue_date', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>LITSENZIYA reyestrda:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="1234567"
              placeholderTextColor={theme.palette.text.secondary}
              value={formData.license_registry_number}
              onChangeText={(value: string) => updateField('license_registry_number', value)}
              editable={!isLoading}
            />
          </View>

          {/* License Document Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>LITSENZIYA rasmi:</Text>
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('license_document_url', 'photo')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📷</Text>
              </TouchableOpacity>
              <Text style={styles.uploadOr}>yoki</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('license_document_url', 'pdf')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📎</Text>
                <Text style={styles.uploadText}>Fayl (pdf)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* License Sheet Section */}
          <Text style={styles.sectionTitle}>LITSENZIYA varaqasi</Text>

          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>
              ISM      Familiya      Otasining ismi
            </Text>
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>LITSENZIYA varaqasi raqami:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="AT 1234567"
              placeholderTextColor={theme.palette.text.secondary}
              value={formData.license_sheet_number}
              onChangeText={(value: string) => updateField('license_sheet_number', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Amal qilish muddati:</Text>
            <View style={styles.dateRangeContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="25.01.2025"
                placeholderTextColor={theme.palette.text.secondary}
                value={formData.license_sheet_valid_from}
                onChangeText={(value: string) => updateField('license_sheet_valid_from', value)}
                keyboardType="numeric"
                editable={!isLoading}
              />
              <Text style={styles.dateRangeText}>dan</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="24.01.2026"
                placeholderTextColor={theme.palette.text.secondary}
                value={formData.license_sheet_valid_until}
                onChangeText={(value: string) => updateField('license_sheet_valid_until', value)}
                keyboardType="numeric"
                editable={!isLoading}
              />
              <Text style={styles.dateRangeText}>gacha</Text>
            </View>
          </View>

          {/* License Sheet Document Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>LITSENZIYA rasmi:</Text>
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('license_sheet_document_url', 'photo')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📷</Text>
              </TouchableOpacity>
              <Text style={styles.uploadOr}>yoki</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('license_sheet_document_url', 'pdf')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📎</Text>
                <Text style={styles.uploadText}>Fayl (pdf)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Self-Employment Section */}
          <Text style={styles.sectionTitle}>O'zini o'zi band qilish</Text>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>O'zini o'zi band qilish №</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="1234567890"
              placeholderTextColor={theme.palette.text.secondary}
              value={formData.self_employment_number}
              onChangeText={(value: string) => updateField('self_employment_number', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          {/* Self-Employment Document Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>O'zini o'zi band qilish rasm:</Text>
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('self_employment_document_url', 'photo')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📷</Text>
              </TouchableOpacity>
              <Text style={styles.uploadOr}>yoki</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('self_employment_document_url', 'pdf')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📎</Text>
                <Text style={styles.uploadText}>Fayl (pdf)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Power of Attorney Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Ishonchnoma rasmi:</Text>
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('power_of_attorney_document_url', 'photo')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📷</Text>
              </TouchableOpacity>
              <Text style={styles.uploadOr}>yoki</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('power_of_attorney_document_url', 'pdf')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📎</Text>
                <Text style={styles.uploadText}>Fayl (pdf)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Insurance Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Sugurta:</Text>
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('insurance_document_url', 'photo')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📷</Text>
              </TouchableOpacity>
              <Text style={styles.uploadOr}>yoki</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handlePhotoUpload('insurance_document_url', 'pdf')}
                disabled={isLoading}
              >
                <Text style={styles.uploadIcon}>📎</Text>
                <Text style={styles.uploadText}>Fayl (pdf)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Saqlanmoqda...' : 'Tayyor'}
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
  readOnlySection: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(2),
  },
  readOnlyLabel: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  readOnlyValue: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  rowLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    marginRight: theme.spacing(1),
    minWidth: 140,
  },
  rowInput: {
    flex: 1,
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  dateRangeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  dateInput: {
    flex: 1,
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  dateRangeText: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginHorizontal: theme.spacing(0.5),
  },
  uploadSection: {
    marginBottom: theme.spacing(3),
  },
  uploadLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  uploadOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  uploadButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.card,
  },
  uploadIcon: {
    fontSize: 30,
    marginBottom: theme.spacing(0.5),
  },
  uploadText: {
    ...theme.typography.caption,
    color: theme.palette.text.primary,
    fontSize: 10,
  },
  uploadOr: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
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

