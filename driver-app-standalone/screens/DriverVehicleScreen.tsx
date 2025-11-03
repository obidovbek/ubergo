/**
 * Driver Vehicle Screen (Step 4)
 * Collects vehicle information based on technical passport
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
import { updateVehicle, getDriverProfile } from '../api/driver';

const theme = createTheme('light');

const fuelTypes = ['benzine', 'metan', 'propan', 'electric', 'diesel'];
const fuelTypeLabels = {
  benzine: 'Benzin',
  metan: 'Metan',
  propan: 'Propan',
  electric: 'Elektr',
  diesel: 'Dizel',
};

export const DriverVehicleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Vehicle basic info
    vehicle_type: '' as 'light' | 'cargo' | '',
    body_type: '',
    make: '',
    model: '',
    color: '',
    // Tech passport
    tech_passport_series: '',
    license_plate: '',
    // Owner information (can be company or person)
    company_name: '',
    company_tax_id: '',
    owner_first_name: '',
    owner_last_name: '',
    owner_father_name: '',
    owner_pinfl: '',
    // Owner address
    owner_address_country: "O'zbekiston",
    owner_address_region: '',
    owner_address_city: '',
    owner_address_mahalla: '',
    owner_address_street: '',
    // Vehicle details
    year: '',
    gross_weight: '',
    unladen_weight: '',
    fuel_types: [] as string[],
    seating_capacity: '',
  });

  useEffect(() => {
    loadVehicleData();
  }, []);

  const loadVehicleData = async () => {
    if (!token) return;
    
    try {
      const profile = await getDriverProfile(token);
      if (profile.profile?.vehicle) {
        const vehicle = profile.profile.vehicle;
        setFormData(prev => ({
          ...prev,
          vehicle_type: vehicle.vehicle_type || '',
          body_type: vehicle.body_type || '',
          make: vehicle.make || '',
          model: vehicle.model || '',
          color: vehicle.color || '',
          tech_passport_series: vehicle.tech_passport_series || '',
          license_plate: vehicle.license_plate || '',
          company_name: vehicle.company_name || '',
          company_tax_id: vehicle.company_tax_id || '',
          owner_first_name: vehicle.owner_first_name || '',
          owner_last_name: vehicle.owner_last_name || '',
          owner_father_name: vehicle.owner_father_name || '',
          owner_pinfl: vehicle.owner_pinfl || '',
          owner_address_country: vehicle.owner_address_country || "O'zbekiston",
          owner_address_region: vehicle.owner_address_region || '',
          owner_address_city: vehicle.owner_address_city || '',
          owner_address_mahalla: vehicle.owner_address_mahalla || '',
          owner_address_street: vehicle.owner_address_street || '',
          year: vehicle.year?.toString() || '',
          gross_weight: vehicle.gross_weight?.toString() || '',
          unladen_weight: vehicle.unladen_weight?.toString() || '',
          fuel_types: vehicle.fuel_types || [],
          seating_capacity: vehicle.seating_capacity?.toString() || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load vehicle data:', error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFuelType = (fuelType: string) => {
    setFormData(prev => {
      const currentTypes = prev.fuel_types || [];
      if (currentTypes.includes(fuelType)) {
        return { ...prev, fuel_types: currentTypes.filter(t => t !== fuelType) };
      } else {
        return { ...prev, fuel_types: [...currentTypes, fuelType] };
      }
    });
  };

  const handleContinue = async () => {
    if (!formData.license_plate) {
      showToast.warning(t('common.error'), 'Davlat raqamini kiriting');
      return;
    }

    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    setIsLoading(true);

    try {
      const cleanData: any = {
        vehicle_type: formData.vehicle_type || undefined,
        body_type: formData.body_type || undefined,
        make: formData.make || undefined,
        model: formData.model || undefined,
        color: formData.color || undefined,
        tech_passport_series: formData.tech_passport_series || undefined,
        license_plate: formData.license_plate,
        company_name: formData.company_name || undefined,
        company_tax_id: formData.company_tax_id || undefined,
        owner_first_name: formData.owner_first_name || undefined,
        owner_last_name: formData.owner_last_name || undefined,
        owner_father_name: formData.owner_father_name || undefined,
        owner_pinfl: formData.owner_pinfl || undefined,
        owner_address_country: formData.owner_address_country || undefined,
        owner_address_region: formData.owner_address_region || undefined,
        owner_address_city: formData.owner_address_city || undefined,
        owner_address_mahalla: formData.owner_address_mahalla || undefined,
        owner_address_street: formData.owner_address_street || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        gross_weight: formData.gross_weight ? parseInt(formData.gross_weight) : undefined,
        unladen_weight: formData.unladen_weight ? parseInt(formData.unladen_weight) : undefined,
        fuel_types: formData.fuel_types.length > 0 ? formData.fuel_types : undefined,
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : undefined,
      };

      // Remove undefined values
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });

      await updateVehicle(token, cleanData);
      
      showToast.success(t('common.success'), 'Avtomobil ma\'lumotlari saqlandi');
      
      // Navigate to next step (Taxi License)
      navigation.navigate('DriverTaxiLicense' as any);
    } catch (error) {
      console.error('Failed to save vehicle info:', error);
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
            <Text style={styles.subtitle}>TRANSPORT VOSITASI MA'LUMOTLARI</Text>
            <Text style={styles.description}>
              (Barcha ma'lumotlar tex. passport boyicha kiritiladi)
            </Text>
          </View>

          {/* Vehicle Basic Information */}
          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Transport turi:</Text>
            <View style={styles.vehicleTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.vehicleTypeOption,
                  formData.vehicle_type === 'light' && styles.vehicleTypeOptionActive
                ]}
                onPress={() => updateField('vehicle_type', 'light')}
                disabled={isLoading}
              >
                <Text style={[
                  styles.vehicleTypeText,
                  formData.vehicle_type === 'light' && styles.vehicleTypeTextActive
                ]}>Yengil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.vehicleTypeOption,
                  formData.vehicle_type === 'cargo' && styles.vehicleTypeOptionActive
                ]}
                onPress={() => updateField('vehicle_type', 'cargo')}
                disabled={isLoading}
              >
                <Text style={[
                  styles.vehicleTypeText,
                  formData.vehicle_type === 'cargo' && styles.vehicleTypeTextActive
                ]}>Yuk</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Kuzov turi:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="Sedan"
              value={formData.body_type}
              onChangeText={(value: string) => updateField('body_type', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Marka:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="Chevrolet"
              value={formData.make}
              onChangeText={(value: string) => updateField('make', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Model:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="Cobalt"
              value={formData.model}
              onChangeText={(value: string) => updateField('model', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Rangi:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="Havorang"
              value={formData.color}
              onChangeText={(value: string) => updateField('color', value)}
              editable={!isLoading}
            />
            <View style={styles.colorIndicator} />
          </View>

          {/* Tech Passport Information */}
          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Guvohnoma (Tex.Passport) seriya raqami.:</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="AAG 1234567"
              value={formData.tech_passport_series}
              onChangeText={(value: string) => updateField('tech_passport_series', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Davlat raqam: 1.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="01 A 123 AA"
              value={formData.license_plate}
              onChangeText={(value: string) => updateField('license_plate', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Rusumi/Modeli: 2.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="Cobalt"
              value={formData.model}
              onChangeText={(value: string) => updateField('model', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Rangi: 3.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="Xavorang tumannoe ozero"
              value={formData.color}
              onChangeText={(value: string) => updateField('color', value)}
              editable={!isLoading}
            />
            <View style={styles.colorIndicator} />
          </View>

          {/* Company Information */}
          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>FIRMA: 4.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="LOGISTIKA MCHJ"
              value={formData.company_name}
              onChangeText={(value: string) => updateField('company_name', value)}
              editable={!isLoading}
            />
          </View>

          {/* Owner Personal Information */}
          <Text style={styles.sectionTitle}>FISH: 4.</Text>
          
          <TextInput
            style={styles.input}
            placeholder="ISM"
            value={formData.owner_first_name}
            onChangeText={(value) => updateField('owner_first_name', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Familiya"
            value={formData.owner_last_name}
            onChangeText={(value) => updateField('owner_last_name', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Otasining ismi"
            value={formData.owner_father_name}
            onChangeText={(value) => updateField('owner_father_name', value)}
            editable={!isLoading}
          />

          {/* Owner Address */}
          <Text style={styles.sectionTitle}>Manzili: 5.</Text>

          <TextInput
            style={styles.input}
            placeholder="O'zbekiston"
            value={formData.owner_address_country}
            onChangeText={(value) => updateField('owner_address_country', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Farg'ona viloyat"
            value={formData.owner_address_region}
            onChangeText={(value) => updateField('owner_address_region', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Farg'ona shahar"
            value={formData.owner_address_city}
            onChangeText={(value) => updateField('owner_address_city', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Aholi yashash punkti QFY, Shaharcha, Ovul"
            value={formData.owner_address_mahalla}
            onChangeText={(value) => updateField('owner_address_mahalla', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Mahalla Fuqarolar yig'ini"
            value={formData.owner_address_mahalla}
            onChangeText={(value) => updateField('owner_address_mahalla', value)}
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Adress. A.Navoiy k. 145 uy"
            value={formData.owner_address_street}
            onChangeText={(value) => updateField('owner_address_street', value)}
            editable={!isLoading}
          />

          {/* Company Tax ID and Owner PINFL */}
          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Firma STIR: 8.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="301458658"
              value={formData.company_tax_id}
              onChangeText={(value: string) => updateField('company_tax_id', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>JSHSHIR (ПИНФЛ): 8.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="30111854310047"
              value={formData.owner_pinfl}
              onChangeText={(value: string) => updateField('owner_pinfl', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          {/* Vehicle Specifications */}
          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Ishlab chiqarilgan yili: 9.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="2025"
              value={formData.year}
              onChangeText={(value: string) => updateField('year', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Turi: 9.</Text>
            <View style={styles.typeContainer}>
              <TextInput
                style={styles.typeInput}
                placeholder="Yengil"
                value={formData.vehicle_type === 'light' ? 'Yengil' : ''}
                editable={false}
              />
              <TextInput
                style={styles.typeInput}
                placeholder="Sedan"
                value={formData.body_type}
                onChangeText={(value: string) => updateField('body_type', value)}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>To'la vazni: 11.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="1850"
              value={formData.gross_weight}
              onChangeText={(value: string) => updateField('gross_weight', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
            <Text style={styles.unitLabel}>kg</Text>
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>Yuksiz vazni: 12.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="1850"
              value={formData.unladen_weight}
              onChangeText={(value: string) => updateField('unladen_weight', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
            <Text style={styles.unitLabel}>kg</Text>
          </View>

          {/* Fuel Types */}
          <Text style={styles.sectionTitle}>Yoqilg'i turi:</Text>
          <View style={styles.fuelTypesContainer}>
            {fuelTypes.map((fuelType) => (
              <TouchableOpacity
                key={fuelType}
                style={styles.fuelTypeOption}
                onPress={() => toggleFuelType(fuelType)}
                disabled={isLoading}
              >
                <View style={[
                  styles.checkbox,
                  formData.fuel_types.includes(fuelType) && styles.checkboxChecked
                ]}>
                  {formData.fuel_types.includes(fuelType) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.fuelTypeLabel}>
                  -{fuelTypeLabels[fuelType as keyof typeof fuelTypeLabels]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowContainer}>
            <Text style={styles.rowLabel}>O'tiradigan joylar soni haydovchi bilan : 17.</Text>
            <TextInput
              style={styles.rowInput}
              placeholder="5"
              value={formData.seating_capacity}
              onChangeText={(value: string) => updateField('seating_capacity', value)}
              keyboardType="numeric"
              editable={!isLoading}
            />
            <Text style={styles.unitLabel}>ta</Text>
          </View>

          {/* Photo Sections */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Tex. Pasport oldi tomon rasmi:</Text>
            <TouchableOpacity style={styles.photoButton} disabled={isLoading}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Tex. Pasport orqa tomon rasmi:</Text>
            <TouchableOpacity style={styles.photoButton} disabled={isLoading}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Transport oldi tomon rasmi:</Text>
            <TouchableOpacity style={styles.photoButton} disabled={isLoading}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Transport orqa tomon rasmi:</Text>
            <TouchableOpacity style={styles.photoButton} disabled={isLoading}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Transport o'ng tomon rasmi:</Text>
            <TouchableOpacity style={styles.photoButton} disabled={isLoading}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Transport chap tomon rasmi:</Text>
            <TouchableOpacity style={styles.photoButton} disabled={isLoading}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Transport umumiy ko'rinishi 45°:</Text>
            <TouchableOpacity style={styles.photoButton} disabled={isLoading}>
              <Text style={styles.photoIcon}>📷+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Transport salon rasmi :</Text>
            <TouchableOpacity style={styles.photoButton} disabled={isLoading}>
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
    minWidth: 120,
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
  vehicleTypeContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing(1),
  },
  vehicleTypeOption: {
    flex: 1,
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingVertical: theme.spacing(1.5),
    alignItems: 'center',
  },
  vehicleTypeOptionActive: {
    backgroundColor: '#4CAF50',
  },
  vehicleTypeText: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  vehicleTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#87CEEB',
    marginLeft: theme.spacing(1),
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  typeContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing(1),
  },
  typeInput: {
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
  unitLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    marginLeft: theme.spacing(1),
    minWidth: 30,
  },
  fuelTypesContainer: {
    marginBottom: theme.spacing(2),
  },
  fuelTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.palette.border,
    borderRadius: 4,
    marginRight: theme.spacing(1),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.card,
  },
  checkboxChecked: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fuelTypeLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  photoSection: {
    marginBottom: theme.spacing(3),
  },
  photoLabel: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
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
