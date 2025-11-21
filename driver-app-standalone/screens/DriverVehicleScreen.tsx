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
  Modal,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { handleBackendError, parseValidationErrors } from '../utils/errorHandler';
import { validateForm, type ValidationRule } from '../utils/validation';
import {
  updateVehicle,
  getDriverProfile,
  fetchVehicleMakes,
  fetchVehicleModels,
  fetchVehicleBodyTypes,
  fetchVehicleColors,
  fetchVehicleTypes,
  fetchGeoCountries,
  fetchGeoProvinces,
  fetchGeoCityDistricts,
  fetchGeoAdministrativeAreas,
  fetchGeoSettlements,
  fetchGeoNeighborhoods,
  uploadImage,
  type VehicleMakeOption,
  type VehicleModelOption,
  type VehicleBodyTypeOption,
  type VehicleColorOption,
  type VehicleTypeOption,
  type GeoOption,
} from '../api/driver';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  
  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  type FormFieldKey = keyof typeof formData;

  const getInputStyle = (field: FormFieldKey | string) => [
    styles.input,
    fieldErrors[field] ? styles.inputError : undefined,
  ];

  const getLabelStyle = (field: FormFieldKey | string) => [
    styles.label,
    fieldErrors[field] ? styles.labelError : undefined,
  ];

  const getSelectContainerStyle = (field: string) => [
    styles.selectInput,
    fieldErrors[field] ? styles.selectInputError : undefined,
  ];
  
  // Photo URI states
  const [techPassportFrontUri, setTechPassportFrontUri] = useState<string | null>(null);
  const [techPassportBackUri, setTechPassportBackUri] = useState<string | null>(null);
  const [photoFrontUri, setPhotoFrontUri] = useState<string | null>(null);
  const [photoBackUri, setPhotoBackUri] = useState<string | null>(null);
  const [photoRightUri, setPhotoRightUri] = useState<string | null>(null);
  const [photoLeftUri, setPhotoLeftUri] = useState<string | null>(null);
  const [photoAngle45Uri, setPhotoAngle45Uri] = useState<string | null>(null);
  const [photoInteriorUri, setPhotoInteriorUri] = useState<string | null>(null);
  
  // Vehicle dropdown state
  type VehicleFieldType = 'type' | 'make' | 'model' | 'body_type' | 'color';
  const [vehicleModalType, setVehicleModalType] = useState<VehicleFieldType | null>(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>('');
  const [types, setTypes] = useState<VehicleTypeOption[]>([]);
  const [makes, setMakes] = useState<VehicleMakeOption[]>([]);
  const [models, setModels] = useState<VehicleModelOption[]>([]);
  const [bodyTypes, setBodyTypes] = useState<VehicleBodyTypeOption[]>([]);
  const [colors, setColors] = useState<VehicleColorOption[]>([]);
  const [selectedType, setSelectedType] = useState<VehicleTypeOption | null>(null);
  const [selectedMake, setSelectedMake] = useState<VehicleMakeOption | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModelOption | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<VehicleBodyTypeOption | null>(null);
  const [selectedColor, setSelectedColor] = useState<VehicleColorOption | null>(null);
  
  // Geo location state
  type GeoFieldType = 'country' | 'province' | 'city_district' | 'administrative_area' | 'settlement' | 'neighborhood';
  const [geoModalType, setGeoModalType] = useState<GeoFieldType | null>(null);
  const [geoSearchQuery, setGeoSearchQuery] = useState<string>('');
  const [countries, setCountries] = useState<GeoOption[]>([]);
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cityDistricts, setCityDistricts] = useState<GeoOption[]>([]);
  const [administrativeAreas, setAdministrativeAreas] = useState<GeoOption[]>([]);
  const [settlements, setSettlements] = useState<GeoOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<GeoOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<GeoOption | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<GeoOption | null>(null);
  const [selectedCityDistrict, setSelectedCityDistrict] = useState<GeoOption | null>(null);
  const [selectedAdministrativeArea, setSelectedAdministrativeArea] = useState<GeoOption | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<GeoOption | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<GeoOption | null>(null);
  
  const [formData, setFormData] = useState({
    // Vehicle basic info
    vehicle_type: '' as 'light' | 'cargo' | '', // Legacy enum field
    vehicle_type_id: '',
    vehicle_make_id: '',
    vehicle_model_id: '',
    vehicle_body_type_id: '',
    vehicle_color_id: '',
    // Legacy string fields (for display/fallback)
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
    // Owner address (Geo IDs)
    owner_address_country_id: null as number | null,
    owner_address_province_id: null as number | null,
    owner_address_city_district_id: null as number | null,
    owner_address_administrative_area_id: null as number | null,
    owner_address_settlement_id: null as number | null,
    owner_address_neighborhood_id: null as number | null,
    owner_address_street: '',
    // Legacy string fields (for display/fallback)
    owner_address_country: '',
    owner_address_region: '',
    owner_address_city: '',
    owner_address_mahalla: '',
    // Vehicle details
    year: '',
    gross_weight: '',
    unladen_weight: '',
    fuel_types: [] as string[],
    seating_capacity: '',
    // Photo URLs
    tech_passport_front_url: '',
    tech_passport_back_url: '',
    photo_front_url: '',
    photo_back_url: '',
    photo_right_url: '',
    photo_left_url: '',
    photo_angle_45_url: '',
    photo_interior_url: '',
  });

  useEffect(() => {
    loadVehicleData();
    loadVehicleOptions();
    loadInitialGeoData();
  }, []);

  const loadInitialGeoData = async () => {
    if (!token) return;
    
    try {
      const countriesData = await fetchGeoCountries();
      setCountries(countriesData);
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  };

  const loadVehicleOptions = async () => {
    if (!token) return;
    
    try {
      setInitialLoading(true);
      const [typesData, makesData, bodyTypesData, colorsData] = await Promise.all([
        fetchVehicleTypes(token),
        fetchVehicleMakes(token),
        fetchVehicleBodyTypes(token),
        fetchVehicleColors(token),
      ]);
      
      setTypes(typesData);
      setMakes(makesData);
      setBodyTypes(bodyTypesData);
      setColors(colorsData);
    } catch (error) {
      console.error('Failed to load vehicle options:', error);
      showToast.error(t('common.error'), 'Transport ma\'lumotlarini yuklashda xatolik');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadVehicleModels = async (makeId: string) => {
    if (!token || !makeId) return;
    
    try {
      const modelsData = await fetchVehicleModels(token, makeId);
      setModels(modelsData);
      return modelsData;
    } catch (error) {
      console.error('Failed to load vehicle models:', error);
      setModels([]);
      return [];
    }
  };

  const loadVehicleData = async () => {
    if (!token) return;
    
    try {
      const profile = await getDriverProfile(token);
      if (profile.profile && (profile.profile as any).vehicle) {
        const vehicle = (profile.profile as any).vehicle;
        
        // Load vehicle options first if not loaded
        if (makes.length === 0) {
          await loadVehicleOptions();
        }
        
        // Set form data with IDs if available
        const typeId = vehicle.vehicle_type_id || '';
        const makeId = vehicle.vehicle_make_id || '';
        const modelId = vehicle.vehicle_model_id || '';
        const bodyTypeId = vehicle.vehicle_body_type_id || '';
        const colorId = vehicle.vehicle_color_id || '';
        
        setFormData(prev => ({
          ...prev,
          vehicle_type: vehicle.vehicle_type || '', // Legacy enum
          vehicle_type_id: typeId,
          vehicle_make_id: makeId,
          vehicle_model_id: modelId,
          vehicle_body_type_id: bodyTypeId,
          vehicle_color_id: colorId,
          // Legacy fields for display
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
          owner_address_country_id: vehicle.owner_address_country_id || null,
          owner_address_province_id: vehicle.owner_address_province_id || null,
          owner_address_city_district_id: vehicle.owner_address_city_district_id || null,
          owner_address_administrative_area_id: vehicle.owner_address_administrative_area_id || null,
          owner_address_settlement_id: vehicle.owner_address_settlement_id || null,
          owner_address_neighborhood_id: vehicle.owner_address_neighborhood_id || null,
          owner_address_street: vehicle.owner_address_street || '',
          // Legacy fields
          owner_address_country: vehicle.owner_address_country || '',
          owner_address_region: vehicle.owner_address_region || '',
          owner_address_city: vehicle.owner_address_city || '',
          owner_address_mahalla: vehicle.owner_address_mahalla || '',
          year: vehicle.year?.toString() || '',
          gross_weight: vehicle.gross_weight?.toString() || '',
          unladen_weight: vehicle.unladen_weight?.toString() || '',
          fuel_types: vehicle.fuel_types || [],
          seating_capacity: vehicle.seating_capacity?.toString() || '',
          // Photo URLs
          tech_passport_front_url: vehicle.tech_passport_front_url || '',
          tech_passport_back_url: vehicle.tech_passport_back_url || '',
          photo_front_url: vehicle.photo_front_url || '',
          photo_back_url: vehicle.photo_back_url || '',
          photo_right_url: vehicle.photo_right_url || '',
          photo_left_url: vehicle.photo_left_url || '',
          photo_angle_45_url: vehicle.photo_angle_45_url || '',
          photo_interior_url: vehicle.photo_interior_url || '',
        }));

        // Set photo URIs for preview
        if (vehicle.tech_passport_front_url) {
          setTechPassportFrontUri(vehicle.tech_passport_front_url);
        }
        if (vehicle.tech_passport_back_url) {
          setTechPassportBackUri(vehicle.tech_passport_back_url);
        }
        if (vehicle.photo_front_url) {
          setPhotoFrontUri(vehicle.photo_front_url);
        }
        if (vehicle.photo_back_url) {
          setPhotoBackUri(vehicle.photo_back_url);
        }
        if (vehicle.photo_right_url) {
          setPhotoRightUri(vehicle.photo_right_url);
        }
        if (vehicle.photo_left_url) {
          setPhotoLeftUri(vehicle.photo_left_url);
        }
        if (vehicle.photo_angle_45_url) {
          setPhotoAngle45Uri(vehicle.photo_angle_45_url);
        }
        if (vehicle.photo_interior_url) {
          setPhotoInteriorUri(vehicle.photo_interior_url);
        }
        
        // Set selected options if IDs exist
        if (typeId && types.length > 0) {
          const typeOption = types.find(t => t.id === typeId);
          if (typeOption) {
            setSelectedType(typeOption);
          }
        }
        
        if (makeId && makes.length > 0) {
          const makeOption = makes.find(m => m.id === makeId);
          if (makeOption) {
            setSelectedMake(makeOption);
            // Load models for this make
            const modelsData = await loadVehicleModels(makeId);
            if (modelId && modelsData && modelsData.length > 0) {
              const modelOption = modelsData.find(m => m.id === modelId);
              if (modelOption) {
                setSelectedModel(modelOption);
              }
            }
          }
        }
        
        if (bodyTypeId && bodyTypes.length > 0) {
          const bodyTypeOption = bodyTypes.find(b => b.id === bodyTypeId);
          if (bodyTypeOption) {
            setSelectedBodyType(bodyTypeOption);
          }
        }
        
        if (colorId && colors.length > 0) {
          const colorOption = colors.find(c => c.id === colorId);
          if (colorOption) {
            setSelectedColor(colorOption);
          }
        }

        // Load and set geo options if IDs exist
        if (vehicle.owner_address_country_id) {
          // Load countries if not loaded
          if (countries.length === 0) {
            const countriesData = await fetchGeoCountries();
            setCountries(countriesData);
          }
          
          const countryOption = findOptionById(countries, vehicle.owner_address_country_id);
          if (countryOption) {
            setSelectedCountry(countryOption);
            const provincesData = await loadProvinces(vehicle.owner_address_country_id);
            
            if (vehicle.owner_address_province_id) {
              const provinceOption = findOptionById(provincesData, vehicle.owner_address_province_id);
              if (provinceOption) {
                setSelectedProvince(provinceOption);
                const cityDistrictsData = await loadCityDistrictsList(vehicle.owner_address_province_id);
                
                if (vehicle.owner_address_city_district_id) {
                  const cityOption = findOptionById(cityDistrictsData, vehicle.owner_address_city_district_id);
                  if (cityOption) {
                    setSelectedCityDistrict(cityOption);
                    const { areas, settlements: settlementsData, neighborhoods: neighborhoodsData } = await loadCityChildren(vehicle.owner_address_city_district_id);
                    
                    if (vehicle.owner_address_administrative_area_id) {
                      const areaOption = findOptionById(areas, vehicle.owner_address_administrative_area_id);
                      if (areaOption) {
                        setSelectedAdministrativeArea(areaOption);
                      }
                    }
                    
                    if (vehicle.owner_address_settlement_id) {
                      const settlementOption = findOptionById(settlementsData, vehicle.owner_address_settlement_id);
                      if (settlementOption) {
                        setSelectedSettlement(settlementOption);
                      }
                    }
                    
                    if (vehicle.owner_address_neighborhood_id) {
                      const neighborhoodOption = findOptionById(neighborhoodsData, vehicle.owner_address_neighborhood_id);
                      if (neighborhoodOption) {
                        setSelectedNeighborhood(neighborhoodOption);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load vehicle data:', error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openVehicleSelector = (type: VehicleFieldType) => {
    if (initialLoading || isLoading) {
      return;
    }

    switch (type) {
      case 'model':
        if (!selectedMake) {
          showToast.error(t('common.error'), "Avval markani tanlang");
          return;
        }
        if (models.length === 0) {
          showToast.error(t('common.error'), "Ushbu marka uchun modellar mavjud emas");
          return;
        }
        break;
    }

    setVehicleSearchQuery('');
    setVehicleModalType(type);
  };

  const handleVehicleSelection = async (type: VehicleFieldType, option: VehicleTypeOption | VehicleMakeOption | VehicleModelOption | VehicleBodyTypeOption | VehicleColorOption) => {
    try {
      switch (type) {
        case 'type':
          handleFieldChange('vehicle_type_id', (option as VehicleTypeOption).id);
          // Also update legacy enum field for backward compatibility
          const typeName = (option as VehicleTypeOption).name;
          if (typeName === 'light' || typeName === 'cargo') {
            updateField('vehicle_type', typeName);
          }
          setSelectedType(option as VehicleTypeOption);
          break;
        case 'make':
          if (selectedMake?.id !== (option as VehicleMakeOption).id) {
            handleFieldChange('vehicle_make_id', (option as VehicleMakeOption).id);
            updateField('make', (option as VehicleMakeOption).name);
            setSelectedMake(option as VehicleMakeOption);
            // Reset model when make changes
            setSelectedModel(null);
            setModels([]);
            handleFieldChange('vehicle_model_id', '');
            updateField('model', '');
            await loadVehicleModels((option as VehicleMakeOption).id);
          } else {
            setSelectedMake(option as VehicleMakeOption);
          }
          break;
        case 'model':
          handleFieldChange('vehicle_model_id', (option as VehicleModelOption).id);
          updateField('model', (option as VehicleModelOption).name);
          setSelectedModel(option as VehicleModelOption);
          break;
        case 'body_type':
          handleFieldChange('vehicle_body_type_id', (option as VehicleBodyTypeOption).id);
          updateField('body_type', (option as VehicleBodyTypeOption).name);
          setSelectedBodyType(option as VehicleBodyTypeOption);
          break;
        case 'color':
          handleFieldChange('vehicle_color_id', (option as VehicleColorOption).id);
          updateField('color', (option as VehicleColorOption).name);
          setSelectedColor(option as VehicleColorOption);
          break;
      }
    } catch (error) {
      console.error('Failed to process vehicle selection:', error);
      showToast.error(t('common.error'), 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setVehicleModalType(null);
      setVehicleSearchQuery('');
    }
  };

  const getVehicleOptionsForModal = (type: VehicleFieldType | null): (VehicleTypeOption | VehicleMakeOption | VehicleModelOption | VehicleBodyTypeOption | VehicleColorOption)[] => {
    if (!type) return [];
    let options: (VehicleTypeOption | VehicleMakeOption | VehicleModelOption | VehicleBodyTypeOption | VehicleColorOption)[] = [];
    switch (type) {
      case 'type':
        options = types;
        break;
      case 'make':
        options = makes;
        break;
      case 'model':
        options = models;
        break;
      case 'body_type':
        options = bodyTypes;
        break;
      case 'color':
        options = colors;
        break;
      default:
        return [];
    }
    
    // Filter options based on search query
    if (vehicleSearchQuery.trim()) {
      const query = vehicleSearchQuery.toLowerCase().trim();
      return options.filter((option) => {
        const name = option.name?.toLowerCase() || '';
        const nameUz = (option as any).name_uz?.toLowerCase() || '';
        const nameRu = (option as any).name_ru?.toLowerCase() || '';
        const nameEn = (option as any).name_en?.toLowerCase() || '';
        return name.includes(query) || nameUz.includes(query) || nameRu.includes(query) || nameEn.includes(query);
      });
    }
    
    return options;
  };

  const getVehicleModalTitle = (type: VehicleFieldType | null): string => {
    switch (type) {
      case 'type':
        return 'Transport turini tanlang';
      case 'make':
        return 'Markani tanlang';
      case 'model':
        return 'Modelni tanlang';
      case 'body_type':
        return 'Kuzov turini tanlang';
      case 'color':
        return 'Rangni tanlang';
      default:
        return '';
    }
  };

  const getVehicleDisplayName = (option: VehicleTypeOption | VehicleMakeOption | VehicleModelOption | VehicleBodyTypeOption | VehicleColorOption | null): string => {
    if (!option) return '';
    // For now, just return the name. Can be enhanced with localization later
    return option.name;
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

  // Geo location handlers (similar to DriverPersonalInfoScreen)
  const geoLevels: GeoFieldType[] = [
    'country',
    'province',
    'city_district',
    'administrative_area',
    'settlement',
    'neighborhood',
  ];

  const geoFieldMap: Record<GeoFieldType, keyof typeof formData> = {
    country: 'owner_address_country_id',
    province: 'owner_address_province_id',
    city_district: 'owner_address_city_district_id',
    administrative_area: 'owner_address_administrative_area_id',
    settlement: 'owner_address_settlement_id',
    neighborhood: 'owner_address_neighborhood_id',
  };

  const findOptionById = (
    options: GeoOption[],
    id?: number | null,
    fallback?: GeoOption | null
  ): GeoOption | null => {
    if (id == null) {
      return null;
    }
    const found = options.find((option) => option.id === id);
    if (found) {
      return found;
    }
    return fallback ?? null;
  };

  const ensureOptionInList = (options: GeoOption[], option: GeoOption | null) => {
    if (!option) {
      return options;
    }
    if (options.some((item) => item.id === option.id)) {
      return options;
    }
    return [...options, option].sort((a, b) => a.name.localeCompare(b.name));
  };

  const loadProvinces = async (countryId: number): Promise<GeoOption[]> => {
    try {
      const data = await fetchGeoProvinces(countryId);
      setProvinces(data);
      return data;
    } catch (error) {
      console.error('Failed to load provinces:', error);
      setProvinces([]);
      return [];
    }
  };

  const loadCityDistrictsList = async (provinceId: number): Promise<GeoOption[]> => {
    try {
      const data = await fetchGeoCityDistricts(provinceId);
      setCityDistricts(data);
      return data;
    } catch (error) {
      console.error('Failed to load city districts:', error);
      setCityDistricts([]);
      return [];
    }
  };

  const loadCityChildren = async (cityDistrictId: number) => {
    try {
      const [areasData, settlementsData, neighborhoodsData] = await Promise.all([
        fetchGeoAdministrativeAreas(cityDistrictId),
        fetchGeoSettlements(cityDistrictId),
        fetchGeoNeighborhoods(cityDistrictId),
      ]);
      setAdministrativeAreas(areasData);
      setSettlements(settlementsData);
      setNeighborhoods(neighborhoodsData);
      return {
        areas: areasData,
        settlements: settlementsData,
        neighborhoods: neighborhoodsData,
      };
    } catch (error) {
      console.error('Failed to load city related geo data:', error);
      setAdministrativeAreas([]);
      setSettlements([]);
      setNeighborhoods([]);
      return { areas: [] as GeoOption[], settlements: [] as GeoOption[], neighborhoods: [] as GeoOption[] };
    }
  };

  const resetGeoSelectionBelow = (level: GeoFieldType) => {
    const levelIndex = geoLevels.indexOf(level);
    if (levelIndex === -1) return;

    for (let i = levelIndex + 1; i < geoLevels.length; i++) {
      const lvl = geoLevels[i];
      const field = geoFieldMap[lvl] as string;
      updateField(field, null);

      switch (lvl) {
        case 'province':
          setSelectedProvince(null);
          setProvinces([]);
          break;
        case 'city_district':
          setSelectedCityDistrict(null);
          setCityDistricts([]);
          break;
        case 'administrative_area':
          setSelectedAdministrativeArea(null);
          setAdministrativeAreas([]);
          break;
        case 'settlement':
          setSelectedSettlement(null);
          setSettlements([]);
          break;
        case 'neighborhood':
          setSelectedNeighborhood(null);
          setNeighborhoods([]);
          break;
      }
    }
  };

  const openGeoSelector = (type: GeoFieldType) => {
    if (initialLoading || isLoading) {
      return;
    }

    switch (type) {
      case 'province':
        if (!formData.owner_address_country_id) {
          showToast.error(t('common.error'), "Avval mamlakatni tanlang");
          return;
        }
        if (provinces.length === 0) {
          showToast.error(t('common.error'), "Ushbu mamlakat uchun viloyatlar mavjud emas");
          return;
        }
        break;
      case 'city_district':
        if (!formData.owner_address_province_id) {
          showToast.error(t('common.error'), "Avval viloyatni tanlang");
          return;
        }
        if (cityDistricts.length === 0) {
          showToast.error(t('common.error'), "Ushbu viloyat uchun shahar/tuman topilmadi");
          return;
        }
        break;
      case 'administrative_area':
      case 'settlement':
      case 'neighborhood':
        if (!formData.owner_address_city_district_id) {
          showToast.error(t('common.error'), "Avval shahar yoki tumanni tanlang");
          return;
        }
        break;
    }

    setGeoSearchQuery('');
    setGeoModalType(type);
  };

  const handleGeoSelection = async (type: GeoFieldType, option: GeoOption) => {
    const fieldName = geoFieldMap[type] as string;

    try {
      switch (type) {
        case 'country':
          if (formData.owner_address_country_id !== option.id) {
            handleFieldChange('owner_address_country_id', option.id);
            setSelectedCountry(option);
            resetGeoSelectionBelow('country');
            await loadProvinces(option.id);
          } else {
            setSelectedCountry(option);
          }
          break;
        case 'province':
          if (formData.owner_address_province_id !== option.id) {
            handleFieldChange('owner_address_province_id', option.id);
            setSelectedProvince(option);
            resetGeoSelectionBelow('province');
            await loadCityDistrictsList(option.id);
          } else {
            setSelectedProvince(option);
          }
          break;
        case 'city_district':
          if (formData.owner_address_city_district_id !== option.id) {
            handleFieldChange('owner_address_city_district_id', option.id);
            setSelectedCityDistrict(option);
            resetGeoSelectionBelow('city_district');
            await loadCityChildren(option.id);
          } else {
            setSelectedCityDistrict(option);
          }
          break;
        case 'administrative_area':
          handleFieldChange('owner_address_administrative_area_id', option.id);
          setSelectedAdministrativeArea(option);
          break;
        case 'settlement':
          handleFieldChange('owner_address_settlement_id', option.id);
          setSelectedSettlement(option);
          break;
        case 'neighborhood':
          handleFieldChange('owner_address_neighborhood_id', option.id);
          setSelectedNeighborhood(option);
          break;
      }
    } catch (error) {
      console.error('Failed to process geo selection:', error);
      showToast.error(t('common.error'), 'Manzil maʼlumotlarini yuklashda xatolik');
    } finally {
      setGeoModalType(null);
      setGeoSearchQuery('');
    }
  };

  const getGeoOptionsForModal = (type: GeoFieldType | null): GeoOption[] => {
    if (!type) return [];
    let options: GeoOption[] = [];
    switch (type) {
      case 'country':
        options = countries;
        break;
      case 'province':
        options = provinces;
        break;
      case 'city_district':
        options = cityDistricts;
        break;
      case 'administrative_area':
        options = administrativeAreas;
        break;
      case 'settlement':
        options = settlements;
        break;
      case 'neighborhood':
        options = neighborhoods;
        break;
      default:
        return [];
    }
    
    // Filter options based on search query
    if (geoSearchQuery.trim()) {
      const query = geoSearchQuery.toLowerCase().trim();
      return options.filter((option) => {
        const nameMatch = option.name.toLowerCase().includes(query);
        const typeMatch = option.type?.toLowerCase().includes(query);
        return nameMatch || typeMatch;
      });
    }
    
    return options;
  };

  const getGeoModalTitle = (type: GeoFieldType | null): string => {
    switch (type) {
      case 'country':
        return 'Mamlakatni tanlang';
      case 'province':
        return 'Viloyatni tanlang';
      case 'city_district':
        return 'Shahar yoki tumanni tanlang';
      case 'administrative_area':
        return 'Maʼmuriy hududni tanlang';
      case 'settlement':
        return 'Aholi punktini tanlang';
      case 'neighborhood':
        return 'Mahallani tanlang';
      default:
        return '';
    }
  };

  // Photo upload handlers
  type PhotoType = 
    | 'tech_passport_front'
    | 'tech_passport_back'
    | 'photo_front'
    | 'photo_back'
    | 'photo_right'
    | 'photo_left'
    | 'photo_angle_45'
    | 'photo_interior';

  const handleImagePicker = async (photoType: PhotoType) => {
    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    Alert.alert(
      'Rasm tanlash',
      'Rasmni qanday tanlamoqchisiz?',
      [
        {
          text: 'Kamera',
          onPress: () => pickImage(photoType, 'camera'),
        },
        {
          text: 'Galereya',
          onPress: () => pickImage(photoType, 'library'),
        },
        {
          text: 'Bekor qilish',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (photoType: PhotoType, source: 'camera' | 'library') => {
    try {
      if (Platform.OS !== 'web') {
        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Ruxsat kerak',
              'Kameradan foydalanish uchun ruxsat bering'
            );
            return;
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Ruxsat kerak',
              'Galereyadan rasm tanlash uchun ruxsat bering'
            );
            return;
          }
        }
      }

      setUploadingPhoto(photoType);

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploadingPhoto(null);
        return;
      }

      const asset = result.assets[0];
      
      // Convert to base64
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          
          // Extract file extension from URI
          const uriParts = asset.uri.split('.');
          const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
          
          // Upload to server
          if (!token) {
            throw new Error('Token is required');
          }
          const imageUrl = await uploadImage(token, base64, fileExtension);
          
          // Update state and form data based on photo type
          const fieldName = `${photoType}_url` as keyof typeof formData;
          updateField(fieldName, imageUrl);
          
          // Set preview URI
          switch (photoType) {
            case 'tech_passport_front':
              setTechPassportFrontUri(asset.uri);
              break;
            case 'tech_passport_back':
              setTechPassportBackUri(asset.uri);
              break;
            case 'photo_front':
              setPhotoFrontUri(asset.uri);
              break;
            case 'photo_back':
              setPhotoBackUri(asset.uri);
              break;
            case 'photo_right':
              setPhotoRightUri(asset.uri);
              break;
            case 'photo_left':
              setPhotoLeftUri(asset.uri);
              break;
            case 'photo_angle_45':
              setPhotoAngle45Uri(asset.uri);
              break;
            case 'photo_interior':
              setPhotoInteriorUri(asset.uri);
              break;
          }
          
          showToast.success(t('common.success'), 'Rasm muvaffaqiyatli yuklandi');
        } catch (error) {
          console.error('Failed to upload image:', error);
          showToast.error(t('common.error'), 'Rasmni yuklashda xatolik');
        } finally {
          setUploadingPhoto(null);
        }
      };
      
      reader.onerror = () => {
        setUploadingPhoto(null);
        showToast.error(t('common.error'), 'Rasmni o\'qishda xatolik');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Image picker error:', error);
      setUploadingPhoto(null);
      showToast.error(t('common.error'), 'Rasmni tanlashda xatolik');
    }
  };

  // Validation using translation keys
  const validateAllFields = (): boolean => {
    const validationRules: ValidationRule[] = [
      {
        field: 'vehicle_type_id',
        value: formData.vehicle_type_id,
        rules: [
          { type: 'required', errorKey: 'formValidation.vehicleTypeRequired' },
        ],
      },
      {
        field: 'vehicle_make_id',
        value: formData.vehicle_make_id,
        rules: [
          { type: 'required', errorKey: 'formValidation.vehicleMakeRequired' },
        ],
      },
      {
        field: 'vehicle_model_id',
        value: formData.vehicle_model_id,
        rules: [
          { type: 'required', errorKey: 'formValidation.vehicleModelRequired' },
        ],
      },
      {
        field: 'vehicle_body_type_id',
        value: formData.vehicle_body_type_id,
        rules: [
          { type: 'required', errorKey: 'formValidation.vehicleBodyTypeRequired' },
        ],
      },
      {
        field: 'vehicle_color_id',
        value: formData.vehicle_color_id,
        rules: [
          { type: 'required', errorKey: 'formValidation.vehicleColorRequired' },
        ],
      },
      {
        field: 'tech_passport_series',
        value: formData.tech_passport_series,
        rules: [
          { type: 'required', errorKey: 'formValidation.techPassportSeriesRequired' },
          { type: 'minLength', errorKey: 'formValidation.techPassportSeriesTooShort', params: { min: 3 } },
        ],
      },
      {
        field: 'license_plate',
        value: formData.license_plate,
        rules: [
          { type: 'required', errorKey: 'formValidation.licensePlateRequired' },
          { type: 'minLength', errorKey: 'formValidation.licensePlateTooShort', params: { min: 3 } },
        ],
      },
      {
        field: 'model',
        value: formData.model,
        rules: [
          { type: 'required', errorKey: 'formValidation.modelRequired' },
        ],
      },
      {
        field: 'owner_first_name',
        value: formData.owner_first_name,
        rules: [
          { type: 'required', errorKey: 'formValidation.ownerFirstNameRequired' },
          { type: 'minLength', errorKey: 'formValidation.ownerFirstNameTooShort', params: { min: 2 } },
        ],
      },
      {
        field: 'owner_last_name',
        value: formData.owner_last_name,
        rules: [
          { type: 'required', errorKey: 'formValidation.ownerLastNameRequired' },
          { type: 'minLength', errorKey: 'formValidation.ownerLastNameTooShort', params: { min: 2 } },
        ],
      },
      {
        field: 'owner_father_name',
        value: formData.owner_father_name,
        rules: [
          { type: 'required', errorKey: 'formValidation.ownerFatherNameRequired' },
          { type: 'minLength', errorKey: 'formValidation.ownerFatherNameTooShort', params: { min: 2 } },
        ],
      },
      {
        field: 'owner_pinfl',
        value: formData.owner_pinfl,
        rules: [
          { type: 'required', errorKey: 'formValidation.ownerPinflRequired' },
          {
            type: 'custom',
            errorKey: 'formValidation.ownerPinflInvalid',
            customValidator: (val) => !val || /^\d{14}$/.test(val.trim()),
          },
        ],
      },
      {
        field: 'owner_address_country_id',
        value: formData.owner_address_country_id,
        rules: [
          { type: 'required', errorKey: 'formValidation.ownerAddressCountryRequired' },
        ],
      },
      {
        field: 'owner_address_province_id',
        value: formData.owner_address_province_id,
        rules: [
          { type: 'required', errorKey: 'formValidation.ownerAddressProvinceRequired' },
        ],
      },
      {
        field: 'owner_address_city_district_id',
        value: formData.owner_address_city_district_id,
        rules: [
          { type: 'required', errorKey: 'formValidation.ownerAddressCityDistrictRequired' },
        ],
      },
      {
        field: 'owner_address_street',
        value: formData.owner_address_street,
        rules: [
          { type: 'required', errorKey: 'formValidation.ownerAddressStreetRequired' },
          { type: 'minLength', errorKey: 'formValidation.ownerAddressStreetTooShort', params: { min: 5 } },
        ],
      },
      {
        field: 'year',
        value: formData.year,
        rules: [
          { type: 'required', errorKey: 'formValidation.yearRequired' },
          {
            type: 'custom',
            errorKey: 'formValidation.yearInvalid',
            customValidator: (val) => {
              if (!val || val.trim() === '') return false;
              const yearNum = parseInt(val);
              if (isNaN(yearNum)) return false;
              const currentYear = new Date().getFullYear();
              return yearNum >= 1900 && yearNum <= currentYear + 1;
            },
          },
        ],
      },
      {
        field: 'fuel_types',
        value: formData.fuel_types,
        rules: [
          { type: 'required', errorKey: 'formValidation.fuelTypesRequired' },
        ],
      },
    ];

    // Optional fields validation
    if (formData.company_name && formData.company_name.trim().length > 0) {
      validationRules.push({
        field: 'company_name',
        value: formData.company_name,
        rules: [
          { type: 'minLength', errorKey: 'formValidation.companyNameTooShort', params: { min: 2 } },
        ],
      });
    }

    if (formData.gross_weight && formData.gross_weight.trim() !== '') {
      validationRules.push({
        field: 'gross_weight',
        value: formData.gross_weight,
        rules: [
          {
            type: 'custom',
            errorKey: 'formValidation.grossWeightInvalid',
            customValidator: (val) => {
              const weight = parseInt(val);
              return !isNaN(weight) && weight > 0 && weight <= 50000;
            },
          },
        ],
      });
    }

    if (formData.unladen_weight && formData.unladen_weight.trim() !== '') {
      validationRules.push({
        field: 'unladen_weight',
        value: formData.unladen_weight,
        rules: [
          {
            type: 'custom',
            errorKey: 'formValidation.unladenWeightInvalid',
            customValidator: (val) => {
              const weight = parseInt(val);
              return !isNaN(weight) && weight > 0 && weight <= 50000;
            },
          },
        ],
      });
    }

    if (formData.seating_capacity && formData.seating_capacity.trim() !== '') {
      validationRules.push({
        field: 'seating_capacity',
        value: formData.seating_capacity,
        rules: [
          {
            type: 'custom',
            errorKey: 'formValidation.seatingCapacityInvalid',
            customValidator: (val) => {
              const capacity = parseInt(val);
              return !isNaN(capacity) && capacity > 0 && capacity <= 50;
            },
          },
        ],
      });
    }

    const validationErrors = validateForm(validationRules, t);
    const errorsMap = validationErrors.reduce<Record<string, string>>((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {});

    setFieldErrors(errorsMap);
    return Object.keys(errorsMap).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value);
    
    // Clear error when user starts typing/selecting
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Validate field on change (optional - can be removed if too aggressive)
    // const error = validateField(field, value);
    // if (error) {
    //   setFieldErrors(prev => ({ ...prev, [field]: error }));
    // }
  };

  const handleFieldBlur = (field: string) => {
    // Field-level validation can be added here if needed
    // For now, we validate on submit only
  };

  const handleContinue = async () => {
    // Validate all fields before submission
    if (!validateAllFields()) {
      showToast.error(t('common.error'), t('formValidation.fixErrors'));
      return;
    }

    setFieldErrors({});

    if (!token) {
      showToast.error(t('common.error'), 'Autentifikatsiya xatosi');
      return;
    }

    setIsLoading(true);

    try {
      const cleanData: any = {
        vehicle_type: formData.vehicle_type || undefined, // Legacy enum
        vehicle_type_id: formData.vehicle_type_id || undefined,
        vehicle_make_id: formData.vehicle_make_id || undefined,
        vehicle_model_id: formData.vehicle_model_id || undefined,
        vehicle_body_type_id: formData.vehicle_body_type_id || undefined,
        vehicle_color_id: formData.vehicle_color_id || undefined,
        // Legacy fields for backward compatibility
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
        owner_address_country_id: formData.owner_address_country_id || undefined,
        owner_address_province_id: formData.owner_address_province_id || undefined,
        owner_address_city_district_id: formData.owner_address_city_district_id || undefined,
        owner_address_administrative_area_id: formData.owner_address_administrative_area_id || undefined,
        owner_address_settlement_id: formData.owner_address_settlement_id || undefined,
        owner_address_neighborhood_id: formData.owner_address_neighborhood_id || undefined,
        owner_address_street: formData.owner_address_street || undefined,
        // Legacy fields for backward compatibility
        owner_address_country: formData.owner_address_country || undefined,
        owner_address_region: formData.owner_address_region || undefined,
        owner_address_city: formData.owner_address_city || undefined,
        owner_address_mahalla: formData.owner_address_mahalla || undefined,
        // Photo URLs
        tech_passport_front_url: formData.tech_passport_front_url || undefined,
        tech_passport_back_url: formData.tech_passport_back_url || undefined,
        photo_front_url: formData.photo_front_url || undefined,
        photo_back_url: formData.photo_back_url || undefined,
        photo_right_url: formData.photo_right_url || undefined,
        photo_left_url: formData.photo_left_url || undefined,
        photo_angle_45_url: formData.photo_angle_45_url || undefined,
        photo_interior_url: formData.photo_interior_url || undefined,
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
      
      showToast.success(t('common.success'), t('driver.vehicleUpdated'));
      
      // Navigate to next step (Taxi License)
      (navigation as any).navigate('DriverTaxiLicense');
    } catch (error: any) {
      console.error('Failed to save vehicle info:', error);
      
      // Check if it's a validation error from backend
      if (error?.response?.status === 422 && error?.response?.data?.errors) {
        // Parse validation errors and map to form fields
        const apiErrors = parseValidationErrors(error);
        
        // Set field errors to display under each field
        setFieldErrors(apiErrors);
        
        // Also show a general error toast
        const firstError = Object.values(apiErrors)[0];
        if (firstError) {
          showToast.error(t('common.error'), firstError);
        }
      } else {
        // For non-validation errors, show general error
        handleBackendError(error, {
          t,
          defaultMessage: t('userDetails.errorUpdate'),
        });
      }
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (navigation as any).goBack()}
              disabled={isLoading}
            >
              <View style={styles.backButtonContent}>
                <Text style={styles.backButtonArrow}>←</Text>
                <Text style={styles.backButtonText}>Orqaga</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.brand}>UbexGo Driver</Text>
            <Text style={styles.title}>Shaharlar aro</Text>
            <Text style={styles.subtitle}>TRANSPORT VOSITASI MA'LUMOTLARI</Text>
            <Text style={styles.description}>
              (Barcha ma'lumotlar tex. passport boyicha kiritiladi)
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.requiredHint}>{t('userDetails.requiredField')}</Text>

            {/* Vehicle Basic Information */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('vehicle_type_id')}>
                Transport turi: <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('vehicle_type_id'),
                  (initialLoading || isLoading) && styles.selectInputDisabled,
                ]}
                onPress={() => openVehicleSelector('type')}
                disabled={initialLoading || isLoading}
              >
                <Text
                  style={
                    selectedType ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedType ? getVehicleDisplayName(selectedType) : 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.vehicle_type_id && (
                <Text style={styles.errorText}>{fieldErrors.vehicle_type_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('vehicle_make_id')}>
                Marka: <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('vehicle_make_id'),
                  (initialLoading || isLoading) && styles.selectInputDisabled,
                ]}
                onPress={() => openVehicleSelector('make')}
                disabled={initialLoading || isLoading}
              >
                <Text
                  style={
                    selectedMake ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedMake ? getVehicleDisplayName(selectedMake) : 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.vehicle_make_id && (
                <Text style={styles.errorText}>{fieldErrors.vehicle_make_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('vehicle_model_id')}>
                Model: <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('vehicle_model_id'),
                  ((!selectedMake || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openVehicleSelector('model')}
                disabled={
                  initialLoading || isLoading || !selectedMake || models.length === 0
                }
              >
                <Text
                  style={
                    selectedModel ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedModel ? getVehicleDisplayName(selectedModel) : 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.vehicle_model_id && (
                <Text style={styles.errorText}>{fieldErrors.vehicle_model_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('vehicle_body_type_id')}>
                Kuzov turi: <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('vehicle_body_type_id'),
                  (initialLoading || isLoading) && styles.selectInputDisabled,
                ]}
                onPress={() => openVehicleSelector('body_type')}
                disabled={initialLoading || isLoading}
              >
                <Text
                  style={
                    selectedBodyType ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedBodyType ? getVehicleDisplayName(selectedBodyType) : 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.vehicle_body_type_id && (
                <Text style={styles.errorText}>{fieldErrors.vehicle_body_type_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('vehicle_color_id')}>
                Rangi: <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.colorInputContainer,
                  (initialLoading || isLoading) && styles.selectInputDisabled,
                  fieldErrors.vehicle_color_id && styles.inputError,
                ]}
                onPress={() => openVehicleSelector('color')}
                disabled={initialLoading || isLoading}
              >
                <Text
                  style={[
                    styles.colorInput,
                    selectedColor ? styles.selectText : styles.selectPlaceholder
                  ]}
                >
                  {selectedColor ? getVehicleDisplayName(selectedColor) : 'Tanlang'}
                </Text>
                <View style={[
                  styles.colorIndicator,
                  selectedColor?.hex_code && { backgroundColor: selectedColor.hex_code }
                ]} />
              </TouchableOpacity>
              {fieldErrors.vehicle_color_id && (
                <Text style={styles.errorText}>{fieldErrors.vehicle_color_id}</Text>
              )}
            </View>

            {/* Tech Passport Information */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('tech_passport_series')}>
                Guvohnoma (Tex.Passport) seriya raqami: <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('tech_passport_series')}
                placeholder="AAG 1234567"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.tech_passport_series}
                onChangeText={(value: string) => handleFieldChange('tech_passport_series', value)}
                onBlur={() => handleFieldBlur('tech_passport_series')}
                editable={!isLoading}
              />
              {fieldErrors.tech_passport_series && (
                <Text style={styles.errorText}>{fieldErrors.tech_passport_series}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('license_plate')}>
                Davlat raqam: 1. <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('license_plate')}
                placeholder="01 A 123 AA"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.license_plate}
                onChangeText={(value: string) => handleFieldChange('license_plate', value)}
                onBlur={() => handleFieldBlur('license_plate')}
                editable={!isLoading}
              />
              {fieldErrors.license_plate && (
                <Text style={styles.errorText}>{fieldErrors.license_plate}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('model')}>
                Rusumi/Modeli: 2. <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('model')}
                placeholder="Cobalt"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.model}
                onChangeText={(value: string) => handleFieldChange('model', value)}
                onBlur={() => handleFieldBlur('model')}
                editable={!isLoading}
              />
              {fieldErrors.model && (
                <Text style={styles.errorText}>{fieldErrors.model}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('vehicle_color_id')}>
                Rangi: 3. <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.colorInputContainer,
                  (initialLoading || isLoading) && styles.selectInputDisabled,
                  fieldErrors.vehicle_color_id && styles.inputError,
                ]}
                onPress={() => openVehicleSelector('color')}
                disabled={initialLoading || isLoading}
              >
                <Text
                  style={[
                    styles.colorInput,
                    selectedColor ? styles.selectText : styles.selectPlaceholder
                  ]}
                >
                  {selectedColor ? getVehicleDisplayName(selectedColor) : 'Tanlang'}
                </Text>
                <View style={[
                  styles.colorIndicator,
                  selectedColor?.hex_code && { backgroundColor: selectedColor.hex_code }
                ]} />
              </TouchableOpacity>
              {fieldErrors.vehicle_color_id && (
                <Text style={styles.errorText}>{fieldErrors.vehicle_color_id}</Text>
              )}
            </View>

            {/* Company Information */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('company_name')}>FIRMA: 4.</Text>
              <TextInput
                style={getInputStyle('company_name')}
                placeholder="LOGISTIKA MCHJ"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.company_name}
                onChangeText={(value: string) => handleFieldChange('company_name', value)}
                onBlur={() => handleFieldBlur('company_name')}
                editable={!isLoading}
              />
              {fieldErrors.company_name && (
                <Text style={styles.errorText}>{fieldErrors.company_name}</Text>
              )}
            </View>

            {/* Owner Personal Information */}
            <Text style={styles.sectionTitle}>FISH: 4.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('owner_first_name')}>
                Ism <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('owner_first_name')}
                placeholder="ISM"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.owner_first_name}
                onChangeText={(value) => handleFieldChange('owner_first_name', value)}
                onBlur={() => handleFieldBlur('owner_first_name')}
                editable={!isLoading}
              />
              {fieldErrors.owner_first_name && (
                <Text style={styles.errorText}>{fieldErrors.owner_first_name}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('owner_last_name')}>
                Familiya <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('owner_last_name')}
                placeholder="Familiya"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.owner_last_name}
                onChangeText={(value) => handleFieldChange('owner_last_name', value)}
                onBlur={() => handleFieldBlur('owner_last_name')}
                editable={!isLoading}
              />
              {fieldErrors.owner_last_name && (
                <Text style={styles.errorText}>{fieldErrors.owner_last_name}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('owner_father_name')}>
                Otasining ismi <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('owner_father_name')}
                placeholder="Otasining ismi"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.owner_father_name}
                onChangeText={(value) => handleFieldChange('owner_father_name', value)}
                onBlur={() => handleFieldBlur('owner_father_name')}
                editable={!isLoading}
              />
              {fieldErrors.owner_father_name && (
                <Text style={styles.errorText}>{fieldErrors.owner_father_name}</Text>
              )}
            </View>

            {/* Owner Address */}
            <Text style={styles.sectionTitle}>Manzili: 5.</Text>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('owner_address_country_id')}>
                Mamlakat <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('owner_address_country_id'),
                  (initialLoading || isLoading) && styles.selectInputDisabled,
                ]}
                onPress={() => openGeoSelector('country')}
                disabled={initialLoading || isLoading}
              >
                <Text
                  style={
                    selectedCountry ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedCountry?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.owner_address_country_id && (
                <Text style={styles.errorText}>{fieldErrors.owner_address_country_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('owner_address_province_id')}>
                Viloyat <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('owner_address_province_id'),
                  ((!formData.owner_address_country_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('province')}
                disabled={
                  initialLoading || isLoading || !formData.owner_address_country_id || provinces.length === 0
                }
              >
                <Text
                  style={
                    selectedProvince ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedProvince?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.owner_address_province_id && (
                <Text style={styles.errorText}>{fieldErrors.owner_address_province_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('owner_address_city_district_id')}>
                Shahar / Tuman <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  getSelectContainerStyle('owner_address_city_district_id'),
                  ((!formData.owner_address_province_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('city_district')}
                disabled={
                  initialLoading || isLoading || !formData.owner_address_province_id || cityDistricts.length === 0
                }
              >
                <Text
                  style={
                    selectedCityDistrict ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedCityDistrict?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
              {fieldErrors.owner_address_city_district_id && (
                <Text style={styles.errorText}>{fieldErrors.owner_address_city_district_id}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ma'muriy hudud</Text>
              <TouchableOpacity
                style={[
                  styles.selectInput,
                  ((!formData.owner_address_city_district_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('administrative_area')}
                disabled={
                  initialLoading || isLoading || !formData.owner_address_city_district_id || administrativeAreas.length === 0
                }
              >
                <Text
                  style={
                    selectedAdministrativeArea ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedAdministrativeArea?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Aholi punkti</Text>
              <TouchableOpacity
                style={[
                  styles.selectInput,
                  ((!formData.owner_address_city_district_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('settlement')}
                disabled={
                  initialLoading || isLoading || !formData.owner_address_city_district_id || settlements.length === 0
                }
              >
                <Text
                  style={
                    selectedSettlement ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedSettlement
                    ? selectedSettlement.type
                      ? `${selectedSettlement.name} (${selectedSettlement.type})`
                      : selectedSettlement.name
                    : 'Tanlang'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mahalla</Text>
              <TouchableOpacity
                style={[
                  styles.selectInput,
                  ((!formData.owner_address_city_district_id || initialLoading || isLoading) && styles.selectInputDisabled),
                ]}
                onPress={() => openGeoSelector('neighborhood')}
                disabled={
                  initialLoading || isLoading || !formData.owner_address_city_district_id || neighborhoods.length === 0
                }
              >
                <Text
                  style={
                    selectedNeighborhood ? styles.selectText : styles.selectPlaceholder
                  }
                >
                  {selectedNeighborhood?.name || 'Tanlang'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('owner_address_street')}>
                Ko'cha va uy <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('owner_address_street')}
                placeholder="Adress. A.Navoiy k. 145 uy"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.owner_address_street}
                onChangeText={(value) => handleFieldChange('owner_address_street', value)}
                onBlur={() => handleFieldBlur('owner_address_street')}
                editable={!isLoading}
              />
              {fieldErrors.owner_address_street && (
                <Text style={styles.errorText}>{fieldErrors.owner_address_street}</Text>
              )}
            </View>

            {/* Company Tax ID and Owner PINFL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma STIR: 8.</Text>
              <TextInput
                style={styles.input}
                placeholder="301458658"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.company_tax_id}
                onChangeText={(value: string) => handleFieldChange('company_tax_id', value)}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('owner_pinfl')}>
                JSHSHIR (ПИНФЛ): 8. <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('owner_pinfl')}
                placeholder="30111854310047"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.owner_pinfl}
                onChangeText={(value: string) => handleFieldChange('owner_pinfl', value)}
                onBlur={() => handleFieldBlur('owner_pinfl')}
                keyboardType="numeric"
                maxLength={14}
                editable={!isLoading}
              />
              {fieldErrors.owner_pinfl && (
                <Text style={styles.errorText}>{fieldErrors.owner_pinfl}</Text>
              )}
            </View>

            {/* Vehicle Specifications */}
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('year')}>
                Ishlab chiqarilgan yili: 9. <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <TextInput
                style={getInputStyle('year')}
                placeholder="2025"
                placeholderTextColor={theme.palette.text.disabled}
                value={formData.year}
                onChangeText={(value: string) => handleFieldChange('year', value)}
                onBlur={() => handleFieldBlur('year')}
                keyboardType="numeric"
                editable={!isLoading}
              />
              {fieldErrors.year && (
                <Text style={styles.errorText}>{fieldErrors.year}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Turi: 9.</Text>
              <View style={styles.typeContainer}>
                <TextInput
                  style={styles.typeInput}
                  placeholder="Yengil"
                  placeholderTextColor={theme.palette.text.disabled}
                  value={formData.vehicle_type === 'light' ? 'Yengil' : ''}
                  editable={false}
                />
                <TextInput
                  style={styles.typeInput}
                  placeholder="Sedan"
                  placeholderTextColor={theme.palette.text.disabled}
                  value={formData.body_type}
                  onChangeText={(value: string) => updateField('body_type', value)}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('gross_weight')}>To'la vazni: 11.</Text>
              <View style={[
                styles.weightInputContainer,
                fieldErrors.gross_weight && styles.inputError,
              ]}>
                <TextInput
                  style={styles.weightInput}
                  placeholder="1850"
                  placeholderTextColor={theme.palette.text.disabled}
                  value={formData.gross_weight}
                  onChangeText={(value: string) => handleFieldChange('gross_weight', value)}
                  onBlur={() => handleFieldBlur('gross_weight')}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
                <Text style={styles.unitLabel}>kg</Text>
              </View>
              {fieldErrors.gross_weight && (
                <Text style={styles.errorText}>{fieldErrors.gross_weight}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('unladen_weight')}>Yuksiz vazni: 12.</Text>
              <View style={[
                styles.weightInputContainer,
                fieldErrors.unladen_weight && styles.inputError,
              ]}>
                <TextInput
                  style={styles.weightInput}
                  placeholder="1850"
                  placeholderTextColor={theme.palette.text.disabled}
                  value={formData.unladen_weight}
                  onChangeText={(value: string) => handleFieldChange('unladen_weight', value)}
                  onBlur={() => handleFieldBlur('unladen_weight')}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
                <Text style={styles.unitLabel}>kg</Text>
              </View>
              {fieldErrors.unladen_weight && (
                <Text style={styles.errorText}>{fieldErrors.unladen_weight}</Text>
              )}
            </View>

            {/* Fuel Types */}
            <View style={styles.inputGroup}>
              <Text style={[styles.sectionTitle, fieldErrors.fuel_types && styles.labelError]}>
                Yoqilg'i turi: <Text style={styles.requiredMarker}>*</Text>
              </Text>
              <View style={styles.fuelTypesContainer}>
                {fuelTypes.map((fuelType) => (
                  <TouchableOpacity
                    key={fuelType}
                    style={styles.fuelTypeOption}
                    onPress={() => {
                      toggleFuelType(fuelType);
                      // Clear error when user selects a fuel type
                      if (fieldErrors.fuel_types) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.fuel_types;
                          return newErrors;
                        });
                      }
                    }}
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
              {fieldErrors.fuel_types && (
                <Text style={styles.errorText}>{fieldErrors.fuel_types}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle('seating_capacity')}>O'tiradigan joylar soni haydovchi bilan: 17.</Text>
              <View style={[
                styles.weightInputContainer,
                fieldErrors.seating_capacity && styles.inputError,
              ]}>
                <TextInput
                  style={styles.weightInput}
                  placeholder="5"
                  placeholderTextColor={theme.palette.text.disabled}
                  value={formData.seating_capacity}
                  onChangeText={(value: string) => handleFieldChange('seating_capacity', value)}
                  onBlur={() => handleFieldBlur('seating_capacity')}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
                <Text style={styles.unitLabel}>ta</Text>
              </View>
              {fieldErrors.seating_capacity && (
                <Text style={styles.errorText}>{fieldErrors.seating_capacity}</Text>
              )}
            </View>

            {/* Photo Sections */}
            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Tex. Pasport oldi tomon rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('tech_passport_front')}
                disabled={isLoading || uploadingPhoto === 'tech_passport_front'}
              >
                {uploadingPhoto === 'tech_passport_front' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : techPassportFrontUri ? (
                  <Image source={{ uri: techPassportFrontUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Tex. Pasport orqa tomon rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('tech_passport_back')}
                disabled={isLoading || uploadingPhoto === 'tech_passport_back'}
              >
                {uploadingPhoto === 'tech_passport_back' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : techPassportBackUri ? (
                  <Image source={{ uri: techPassportBackUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Transport oldi tomon rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('photo_front')}
                disabled={isLoading || uploadingPhoto === 'photo_front'}
              >
                {uploadingPhoto === 'photo_front' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoFrontUri ? (
                  <Image source={{ uri: photoFrontUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Transport orqa tomon rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('photo_back')}
                disabled={isLoading || uploadingPhoto === 'photo_back'}
              >
                {uploadingPhoto === 'photo_back' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoBackUri ? (
                  <Image source={{ uri: photoBackUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Transport o'ng tomon rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('photo_right')}
                disabled={isLoading || uploadingPhoto === 'photo_right'}
              >
                {uploadingPhoto === 'photo_right' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoRightUri ? (
                  <Image source={{ uri: photoRightUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Transport chap tomon rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('photo_left')}
                disabled={isLoading || uploadingPhoto === 'photo_left'}
              >
                {uploadingPhoto === 'photo_left' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoLeftUri ? (
                  <Image source={{ uri: photoLeftUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Transport umumiy ko'rinishi 45°:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('photo_angle_45')}
                disabled={isLoading || uploadingPhoto === 'photo_angle_45'}
              >
                {uploadingPhoto === 'photo_angle_45' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoAngle45Uri ? (
                  <Image source={{ uri: photoAngle45Uri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.photoSection]}>
              <Text style={styles.label}>Transport salon rasmi:</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePicker('photo_interior')}
                disabled={isLoading || uploadingPhoto === 'photo_interior'}
              >
                {uploadingPhoto === 'photo_interior' ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : photoInteriorUri ? (
                  <Image source={{ uri: photoInteriorUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoIcon}>📷+</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? t('common.saving') || 'Saqlanmoqda...' : t('common.next') || 'Keyingi'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Vehicle Dropdown Modal */}
      {vehicleModalType && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={!!vehicleModalType}
          onRequestClose={() => {
            setVehicleModalType(null);
            setVehicleSearchQuery('');
          }}
        >
          <View style={styles.simpleDropdownOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => {
                setVehicleModalType(null);
                setVehicleSearchQuery('');
              }}
            />
            <View style={styles.simpleDropdownContainer}>
              {/* Header */}
              <View style={styles.simpleDropdownHeader}>
                <Text style={styles.simpleDropdownTitle}>{getVehicleModalTitle(vehicleModalType)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setVehicleModalType(null);
                    setVehicleSearchQuery('');
                  }}
                  style={styles.simpleDropdownCloseButton}
                >
                  <Text style={styles.simpleDropdownCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={styles.simpleSearchBox}>
                <TextInput
                  style={styles.simpleSearchInput}
                  placeholder="Qidirish..."
                  placeholderTextColor="#999"
                  value={vehicleSearchQuery}
                  onChangeText={setVehicleSearchQuery}
                  autoFocus={false}
                />
              </View>

              {/* List */}
              {getVehicleOptionsForModal(vehicleModalType).length === 0 ? (
                <View style={styles.simpleDropdownEmpty}>
                  <Text style={styles.simpleDropdownEmptyText}>
                    {vehicleSearchQuery.trim() ? 'Topilmadi' : 'Ma\'lumot yo\'q'}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.simpleDropdownList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                >
                  {getVehicleOptionsForModal(vehicleModalType).map((option) => {
                    const isSelected = (() => {
                      switch (vehicleModalType) {
                        case 'type':
                          return selectedType?.id === option.id;
                        case 'make':
                          return selectedMake?.id === option.id;
                        case 'model':
                          return selectedModel?.id === option.id;
                        case 'body_type':
                          return selectedBodyType?.id === option.id;
                        case 'color':
                          return selectedColor?.id === option.id;
                        default:
                          return false;
                      }
                    })();

                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.simpleDropdownItem,
                          isSelected && styles.simpleDropdownItemSelected,
                        ]}
                        onPress={() => handleVehicleSelection(vehicleModalType, option)}
                      >
                        <Text
                          style={[
                            styles.simpleDropdownItemText,
                            isSelected && styles.simpleDropdownItemTextSelected,
                          ]}
                        >
                          {getVehicleDisplayName(option)}
                        </Text>
                        {isSelected && <Text style={styles.simpleDropdownCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Geo Dropdown Modal */}
      {geoModalType && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={!!geoModalType}
          onRequestClose={() => {
            setGeoModalType(null);
            setGeoSearchQuery('');
          }}
        >
          <View style={styles.simpleDropdownOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => {
                setGeoModalType(null);
                setGeoSearchQuery('');
              }}
            />
            <View style={styles.simpleDropdownContainer}>
              {/* Header */}
              <View style={styles.simpleDropdownHeader}>
                <Text style={styles.simpleDropdownTitle}>{getGeoModalTitle(geoModalType)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setGeoModalType(null);
                    setGeoSearchQuery('');
                  }}
                  style={styles.simpleDropdownCloseButton}
                >
                  <Text style={styles.simpleDropdownCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={styles.simpleSearchBox}>
                <TextInput
                  style={styles.simpleSearchInput}
                  placeholder="Qidirish..."
                  placeholderTextColor="#999"
                  value={geoSearchQuery}
                  onChangeText={setGeoSearchQuery}
                  autoFocus={false}
                />
              </View>

              {/* List */}
              {getGeoOptionsForModal(geoModalType).length === 0 ? (
                <View style={styles.simpleDropdownEmpty}>
                  <Text style={styles.simpleDropdownEmptyText}>
                    {geoSearchQuery.trim() ? 'Topilmadi' : 'Ma\'lumot yo\'q'}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.simpleDropdownList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                >
                  {getGeoOptionsForModal(geoModalType).map((option) => {
                    const isSelected = (() => {
                      switch (geoModalType) {
                        case 'country':
                          return formData.owner_address_country_id === option.id;
                        case 'province':
                          return formData.owner_address_province_id === option.id;
                        case 'city_district':
                          return formData.owner_address_city_district_id === option.id;
                        case 'administrative_area':
                          return formData.owner_address_administrative_area_id === option.id;
                        case 'settlement':
                          return formData.owner_address_settlement_id === option.id;
                        case 'neighborhood':
                          return formData.owner_address_neighborhood_id === option.id;
                        default:
                          return false;
                      }
                    })();

                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.simpleDropdownItem,
                          isSelected && styles.simpleDropdownItemSelected,
                        ]}
                        onPress={() => handleGeoSelection(geoModalType, option)}
                      >
                        <Text
                          style={[
                            styles.simpleDropdownItemText,
                            isSelected && styles.simpleDropdownItemTextSelected,
                          ]}
                        >
                          {option.type ? `${option.name} (${option.type})` : option.name}
                        </Text>
                        {isSelected && <Text style={styles.simpleDropdownCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(1),
    zIndex: 1,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  backButtonArrow: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
    marginTop: 1,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
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
  form: {
    width: '100%',
  },
  requiredHint: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  inputGroup: {
    marginBottom: theme.spacing(2.5),
  },
  label: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  input: {
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    padding: theme.spacing(2),
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
    marginBottom: theme.spacing(1.5),
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
  },
  colorInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
  },
  weightInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.palette.text.primary,
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
    fontWeight: '600',
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
    alignItems: 'flex-start',
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
    marginTop: theme.spacing(1),
  },
  photoIcon: {
    fontSize: 40,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
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
  // Select Input Styles
  selectInput: {
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    padding: theme.spacing(2),
    minHeight: 48,
    justifyContent: 'center',
  },
  selectInputDisabled: {
    opacity: 0.5,
  },
  selectText: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  selectPlaceholder: {
    ...theme.typography.body1,
    color: theme.palette.text.disabled,
  },
  // Simple Dropdown Styles
  simpleDropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  simpleDropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  simpleDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  simpleDropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  simpleDropdownCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleDropdownCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  simpleSearchBox: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  simpleSearchInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  simpleDropdownList: {
    maxHeight: 300,
  },
  simpleDropdownEmpty: {
    padding: 30,
    alignItems: 'center',
  },
  simpleDropdownEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  simpleDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  simpleDropdownItemSelected: {
    backgroundColor: '#F0F8F0',
  },
  simpleDropdownItemText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  simpleDropdownItemTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  simpleDropdownCheck: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  requiredMarker: {
    color: '#E53935',
  },
  labelError: {
    color: '#E53935',
  },
  errorText: {
    ...theme.typography.caption,
    color: '#E53935',
    marginTop: theme.spacing(0.5),
  },
  inputError: {
    borderBottomColor: '#E53935',
  },
  selectInputError: {
    borderBottomColor: '#E53935',
  },
});
