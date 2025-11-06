/**
 * Driver License Screen (Step 3)
 * Collects driving license and emergency contacts
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
import { updateLicense } from '../api/driver';

const theme = createTheme('light');

const categories = ['A', 'B', 'C', 'D', 'BE', 'CE', 'DE'];

export const DriverLicenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [licenseData, setLicenseData] = useState({
    license_number: '',
    issue_date: '',
    category_a: '',
    category_b: '',
    category_c: '',
    category_d: '',
    category_be: '',
    category_ce: '',
    category_de: '',
  });
  
  const [emergencyContacts, setEmergencyContacts] = useState([
    { phone_country_code: '+33', phone_number: '', relationship: 'Ota' },
    { phone_country_code: '+33', phone_number: '', relationship: 'Turmush o\'rtoq' },
  ]);

  const updateLicenseField = (field: string, value: string) => {
    setLicenseData(prev => ({ ...prev, [field]: value }));
  };

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    const newContacts = [...emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setEmergencyContacts(newContacts);
  };

  const handleContinue = async () => {
    if (!licenseData.license_number) {
      showToast.warning(t('common.error'), 'Guvohnoma raqamini kiriting');
      return;
    }

    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    setIsLoading(true);

    try {
      const cleanLicenseData = Object.fromEntries(
        Object.entries(licenseData).filter(([_, v]) => v !== '')
      );

      const cleanContacts = emergencyContacts.filter(c => c.phone_number);

      await updateLicense(token, {
        license: cleanLicenseData,
        emergencyContacts: cleanContacts.length > 0 ? cleanContacts : undefined,
      });
      
      showToast.success(t('common.success'), 'Guvohnoma ma\'lumotlari saqlandi');
      
      // Navigate to next step (Vehicle)
      navigation.navigate('DriverVehicle' as any);
    } catch (error) {
      console.error('Failed to save license info:', error);
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
            <Text style={styles.subtitle}>HAYDOVCHILIK GUVOHNOMASI</Text>
            <Text style={styles.description}>
              (Barcha ma'lumotlar passport boyicha kiritiladi)
            </Text>
          </View>

          {/* Read-only personal info */}
          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>
              ISM      Familiya      Otasining ismi
            </Text>
            <Text style={styles.readOnlyLabel}>
              Tug'ilgan sanasi  21.01.1985
            </Text>
          </View>

          {/* License Issue Date */}
          <TextInput
            style={styles.input}
            placeholder="4a. Berilgan sanasi  21.01.2025"
            placeholderTextColor={theme.palette.text.secondary}
            value={licenseData.issue_date}
            onChangeText={(value) => updateLicenseField('issue_date', value)}
            keyboardType="numeric"
            editable={!isLoading}
          />

          {/* License Number */}
          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Guvohnoma raqami 5.:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="AG 1234567"
              placeholderTextColor={theme.palette.text.secondary}
              value={licenseData.license_number}
              onChangeText={(value) => updateLicenseField('license_number', value)}
              editable={!isLoading}
            />
          </View>

          {/* Categories */}
          {categories.map((category) => {
            const fieldKey = `category_${category.toLowerCase()}` as keyof typeof licenseData;
            return (
              <View key={category} style={styles.categoryRow}>
                <View style={styles.categoryBox}>
                  <Text style={styles.categoryLabel}>{category}</Text>
                </View>
                <TextInput
                  style={styles.categoryInput}
                  placeholder="10. Ruxsat berilgan sana 10.01.2009"
                  placeholderTextColor={theme.palette.text.secondary}
                  value={licenseData[fieldKey] || ''}
                  onChangeText={(value) => updateLicenseField(fieldKey, value)}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
            );
          })}

          {/* License Photos */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Haydovchilik guvohnomasi:</Text>
            <Text style={styles.photoSubtext}>(Fuqaro rasmi bor tomoni)</Text>
            <TouchableOpacity style={styles.photoButton}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Haydovchilik guvohnomasi:</Text>
            <Text style={styles.photoSubtext}>(Orqa tomoni)</Text>
            <TouchableOpacity style={styles.photoButton}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          {/* Emergency Contacts */}
          <Text style={styles.sectionTitle}>
            Favqulotda holatlar uchun 2 ta yaqin qarindoshlaringiz raqamini kiriting
          </Text>
          <Text style={styles.subsectionTitle}>(ota,ona,aka.....)</Text>

          {emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactRow}>
              <View style={styles.flagBox}>
                <Text style={styles.flag}>🇫🇷</Text>
                <Text style={styles.countryCode}>{contact.phone_country_code}</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="0 00 00 00 00"
                placeholderTextColor={theme.palette.text.secondary}
                value={contact.phone_number}
                onChangeText={(value) => updateEmergencyContact(index, 'phone_number', value)}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
              <TextInput
                style={styles.relationshipInput}
                placeholder={index === 0 ? 'Ota' : "Turmush o'rtoq"}
                placeholderTextColor={theme.palette.text.secondary}
                value={contact.relationship}
                onChangeText={(value) => updateEmergencyContact(index, 'relationship', value)}
                editable={!isLoading}
              />
            </View>
          ))}

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
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  rowLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    marginRight: theme.spacing(1),
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  categoryBox: {
    width: 50,
    height: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing(1.5),
    backgroundColor: theme.palette.background.card,
  },
  categoryLabel: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.palette.text.primary,
  },
  categoryInput: {
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
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(0.5),
  },
  subsectionTitle: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(1),
    paddingVertical: theme.spacing(1),
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.background.card,
  },
  flag: {
    fontSize: 20,
    marginRight: theme.spacing(0.5),
  },
  countryCode: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
  },
  phoneInput: {
    flex: 2,
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    marginRight: theme.spacing(1),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  relationshipInput: {
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

