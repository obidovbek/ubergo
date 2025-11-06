/**
 * Driver Passport Screen (Step 2)
 * Collects driver's passport/ID card information
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
import { updatePassport, getDriverProfile } from '../api/driver';

const theme = createTheme('light');

export const DriverPassportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    father_name: '',
    birth_date: '',
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    father_name: '',
    gender: '' as 'male' | 'female' | '',
    birth_date: '',
    citizenship: "O'zbekiston",
    birth_place_country: "O'zbekiston",
    birth_place_region: '',
    birth_place_city: '',
    id_card_number: '',
    pinfl: '',
    issue_date: '',
    expiry_date: '',
  });

  useEffect(() => {
    loadPersonalInfo();
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
          birth_date: profile.profile.birth_date || '',
        });
        
        // Pre-fill passport data if exists
        if (profile.profile.passport) {
          setFormData(prev => ({
            ...prev,
            ...profile.profile.passport
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = async () => {
    // Validation
    if (!formData.id_card_number) {
      showToast.warning(t('common.error'), 'ID karta raqamini kiriting');
      return;
    }

    if (!formData.pinfl) {
      showToast.warning(t('common.error'), 'JSHSHIR (PINFL) raqamini kiriting');
      return;
    }

    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    setIsLoading(true);

    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '')
      );

      await updatePassport(token, cleanData);
      
      showToast.success(t('common.success'), 'Passport ma\'lumotlari saqlandi');
      
      // Navigate to next step (License)
      navigation.navigate('DriverLicense' as any);
    } catch (error) {
      console.error('Failed to save passport info:', error);
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
            <Text style={styles.subtitle}>PASSPORT MA'LUMOTLARI</Text>
            <Text style={styles.description}>
              (Barcha ma'lumotlar passport boyicha kiritiladi)
            </Text>
          </View>

          {/* Personal Info (Read-only from previous step) */}
          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>
              ISM      Familiya      Otasining ismi
            </Text>
            <Text style={styles.readOnlyLabel}>
              Tug'ilgan sanasi  {personalInfo.birth_date}
            </Text>
          </View>

          {/* Passport Information */}
          <TextInput
            style={styles.input}
            placeholder="ISM"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.first_name}
            onChangeText={(value) => updateField('first_name', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Familiya"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.last_name}
            onChangeText={(value) => updateField('last_name', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Otasining ismi"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.father_name}
            onChangeText={(value) => updateField('father_name', value)}
            editable={!isLoading}
          />

          {/* Gender */}
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => updateField('gender', 'male')}
              disabled={isLoading}
            >
              <View style={[styles.radio, formData.gender === 'male' && styles.radioActive]} />
              <Text style={styles.genderLabel}>-Erkak</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => updateField('gender', 'female')}
              disabled={isLoading}
            >
              <View style={[styles.radio, formData.gender === 'female' && styles.radioActive]} />
              <Text style={styles.genderLabel}>-Ayol</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Tug'ilgan sanasi  21.01.1985"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.birth_date}
            onChangeText={(value) => updateField('birth_date', value)}
            keyboardType="numeric"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Berilgan sanasi  21.01.2025"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.issue_date}
            onChangeText={(value) => updateField('issue_date', value)}
            keyboardType="numeric"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Amal qilish muddati  20.01.2035"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.expiry_date}
            onChangeText={(value) => updateField('expiry_date', value)}
            keyboardType="numeric"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Fuqaroligi"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.citizenship}
            onChangeText={(value) => updateField('citizenship', value)}
            editable={!isLoading}
          />

          {/* ID Card Number */}
          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>ID Karta raqami:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="AD 1234567"
              placeholderTextColor={theme.palette.text.secondary}
              value={formData.id_card_number}
              onChangeText={(value) => updateField('id_card_number', value)}
              editable={!isLoading}
            />
          </View>

          {/* PINFL */}
          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>JSHSHIR:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="32101855210037"
              placeholderTextColor={theme.palette.text.secondary}
              value={formData.pinfl}
              onChangeText={(value) => updateField('pinfl', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          {/* Birth Place */}
          <Text style={styles.sectionTitle}>Tug'ilgan joyi:</Text>

          <TextInput
            style={styles.input}
            placeholder="O'zbekiston"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.birth_place_country}
            onChangeText={(value) => updateField('birth_place_country', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Farg'ona viloyat"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.birth_place_region}
            onChangeText={(value) => updateField('birth_place_region', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Farg'ona shahar"
            placeholderTextColor={theme.palette.text.secondary}
            value={formData.birth_place_city}
            onChangeText={(value) => updateField('birth_place_city', value)}
            editable={!isLoading}
          />

          {/* Photo Placeholders */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Pasport/ID karta rasmi:</Text>
            <Text style={styles.photoSubtext}>(Fuqaro rasmi bor tomoni)</Text>
            <TouchableOpacity style={styles.photoButton}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Pasport/ID karta rasmi:</Text>
            <Text style={styles.photoSubtext}>(Orqa tomoni yoki ro'yxatda turish manzili, propiska)</Text>
            <TouchableOpacity style={styles.photoButton}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Saqlanmoqda...' : 'Keyingi'}
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
  description: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  readOnlySection: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(3),
  },
  readOnlyLabel: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  input: {
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    marginBottom: theme.spacing(2),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing(2),
    gap: theme.spacing(4),
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  genderLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
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
    minWidth: 80,
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
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  photoSection: {
    marginBottom: theme.spacing(3),
  },
  photoLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  photoSubtext: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  photoButton: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.card,
  },
  photoIcon: {
    fontSize: 40,
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

