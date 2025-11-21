/**
 * Driver Service
 * Handles driver profile and registration logic
 */

import {
  DriverProfile,
  DriverPassport,
  DriverLicense,
  EmergencyContact,
  DriverVehicle,
  DriverTaxiLicense,
  User,
  GeoCountry,
  GeoProvince,
  GeoCityDistrict,
  GeoAdministrativeArea,
  GeoSettlement,
  GeoNeighborhood
} from '../database/models/index.js';
import { AppError } from '../errors/AppError.js';

export class DriverService {
  /**
   * Get driver profile with all related data
   */
  static async getDriverProfile(userId: string) {
    const driverProfile = await DriverProfile.findOne({
      where: { user_id: userId },
      include: [
        {
          model: DriverPassport,
          as: 'passport'
        },
        {
          model: DriverLicense,
          as: 'license'
        },
        {
          model: EmergencyContact,
          as: 'emergencyContacts'
        },
        {
          model: DriverVehicle,
          as: 'vehicle'
        },
        {
          model: DriverTaxiLicense,
          as: 'taxiLicense'
        },
        {
          model: GeoCountry,
          as: 'addressCountry',
          attributes: ['id', 'name']
        },
        {
          model: GeoProvince,
          as: 'addressProvince',
          attributes: ['id', 'name']
        },
        {
          model: GeoCityDistrict,
          as: 'addressCityDistrict',
          attributes: ['id', 'name']
        },
        {
          model: GeoAdministrativeArea,
          as: 'addressAdministrativeArea',
          attributes: ['id', 'name']
        },
        {
          model: GeoSettlement,
          as: 'addressSettlement',
          attributes: ['id', 'name', 'type']
        },
        {
          model: GeoNeighborhood,
          as: 'addressNeighborhood',
          attributes: ['id', 'name']
        }
      ]
    });

    return driverProfile;
  }

  /**
   * Get driver profile status
   */
  static async getDriverProfileStatus(userId: string) {
    const driverProfile = await DriverProfile.findOne({
      where: { user_id: userId },
      attributes: ['id', 'registration_step', 'is_complete']
    });

    return {
      hasProfile: !!driverProfile,
      registrationStep: driverProfile?.registration_step || 'personal',
      isComplete: driverProfile?.is_complete || false
    };
  }

  /**
   * Create or update driver profile (Step 1: Personal Info)
   */
  static async upsertDriverProfile(
    userId: string,
    data: {
      first_name?: string;
      last_name?: string;
      father_name?: string;
      gender?: 'male' | 'female';
      birth_date?: string;
      email?: string;
      address_country_id?: number | null;
      address_province_id?: number | null;
      address_city_district_id?: number | null;
      address_administrative_area_id?: number | null;
      address_settlement_id?: number | null;
      address_neighborhood_id?: number | null;
      address_street?: string;
      photo_face_url?: string;
      photo_body_url?: string;
      vehicle_owner_type?: 'own' | 'other_person' | 'company';
      vehicle_usage_type?: 'rent' | 'free_use';
    }
  ) {
    // Update user role to driver
    await User.update(
      { role: 'driver' },
      { where: { id: userId } }
    );

    // Find existing profile
    let driverProfile = await DriverProfile.findOne({
      where: { user_id: userId }
    });

    if (driverProfile) {
      // Update existing profile
      await driverProfile.update({
        ...data,
        registration_step: 'passport' // Move to next step
      });
    } else {
      // Create new profile
      driverProfile = await DriverProfile.create({
        user_id: userId,
        ...data,
        registration_step: 'passport'
      });
    }

    return driverProfile;
  }

  /**
   * Create or update driver passport (Step 2: Passport)
   */
  static async upsertDriverPassport(userId: string, data: {
    first_name?: string;
    last_name?: string;
    father_name?: string;
    gender?: 'male' | 'female';
    birth_date?: string;
    citizenship?: string;
    birth_place_country?: string;
    birth_place_region?: string;
    birth_place_city?: string;
    id_card_number?: string;
    pinfl?: string;
    issue_date?: string;
    expiry_date?: string;
    passport_front_url?: string;
    passport_back_url?: string;
  }) {
    // Get driver profile
    const driverProfile = await DriverProfile.findOne({
      where: { user_id: userId }
    });

    if (!driverProfile) {
      throw new AppError('Driver profile not found', 404);
    }

    // Find existing passport
    let passport = await DriverPassport.findOne({
      where: { driver_profile_id: driverProfile.id }
    });

    if (passport) {
      await passport.update(data);
    } else {
      passport = await DriverPassport.create({
        driver_profile_id: driverProfile.id,
        ...data
      });
    }

    // Update registration step
    await driverProfile.update({
      registration_step: 'license'
    });

    return passport;
  }

  /**
   * Create or update driver license and emergency contacts (Step 3: License)
   */
  static async upsertDriverLicense(userId: string, data: {
    license?: {
      first_name?: string;
      last_name?: string;
      father_name?: string;
      birth_date?: string;
      license_number?: string;
      issue_date?: string;
      category_a?: string;
      category_b?: string;
      category_c?: string;
      category_d?: string;
      category_be?: string;
      category_ce?: string;
      category_de?: string;
      license_front_url?: string;
      license_back_url?: string;
    };
    emergencyContacts?: Array<{
      phone_country_code?: string;
      phone_number?: string;
      relationship?: string;
    }>;
  }) {
    // Get driver profile
    const driverProfile = await DriverProfile.findOne({
      where: { user_id: userId }
    });

    if (!driverProfile) {
      throw new AppError('Driver profile not found', 404);
    }

    // Handle license
    if (data.license) {
      let license = await DriverLicense.findOne({
        where: { driver_profile_id: driverProfile.id }
      });

      if (license) {
        await license.update(data.license);
      } else {
        await DriverLicense.create({
          driver_profile_id: driverProfile.id,
          ...data.license
        });
      }
    }

    // Handle emergency contacts
    if (data.emergencyContacts) {
      // Delete existing contacts
      await EmergencyContact.destroy({
        where: { driver_profile_id: driverProfile.id }
      });

      // Create new contacts
      for (const contact of data.emergencyContacts) {
        await EmergencyContact.create({
          driver_profile_id: driverProfile.id,
          ...contact
        });
      }
    }

    // Update registration step
    await driverProfile.update({
      registration_step: 'vehicle'
    });

    return { success: true };
  }

  /**
   * Create or update driver vehicle (Step 4: Vehicle)
   */
  static async upsertDriverVehicle(userId: string, data: {
    company_name?: string;
    company_tax_id?: string;
    owner_first_name?: string;
    owner_last_name?: string;
    owner_father_name?: string;
    owner_pinfl?: string;
    owner_address_country?: string;
    owner_address_region?: string;
    owner_address_city?: string;
    owner_address_mahalla?: string;
    owner_address_street?: string;
    vehicle_type?: 'light' | 'cargo';
    body_type?: string;
    make?: string;
    model?: string;
    color?: string;
    license_plate?: string;
    year?: number;
    gross_weight?: number;
    unladen_weight?: number;
    fuel_types?: string[];
    seating_capacity?: number;
    tech_passport_series?: string;
    tech_passport_front_url?: string;
    tech_passport_back_url?: string;
    photo_front_url?: string;
    photo_back_url?: string;
    photo_right_url?: string;
    photo_left_url?: string;
    photo_angle_45_url?: string;
    photo_interior_url?: string;
  }) {
    // Get driver profile
    const driverProfile = await DriverProfile.findOne({
      where: { user_id: userId }
    });

    if (!driverProfile) {
      throw new AppError('Driver profile not found', 404);
    }

    // Find existing vehicle
    let vehicle = await DriverVehicle.findOne({
      where: { driver_profile_id: driverProfile.id }
    });

    if (vehicle) {
      await vehicle.update(data);
    } else {
      vehicle = await DriverVehicle.create({
        driver_profile_id: driverProfile.id,
        ...data
      });
    }

    // Update registration step
    await driverProfile.update({
      registration_step: 'taxi_license'
    });

    return vehicle;
  }

  /**
   * Create or update taxi license (Step 5: Taxi License)
   */
  static async upsertDriverTaxiLicense(userId: string, data: {
    license_number?: string;
    license_issue_date?: string;
    license_registry_number?: string;
    license_document_url?: string;
    license_sheet_number?: string;
    license_sheet_valid_from?: string;
    license_sheet_valid_until?: string;
    license_sheet_document_url?: string;
    self_employment_number?: string;
    self_employment_document_url?: string;
    power_of_attorney_document_url?: string;
    insurance_document_url?: string;
  }) {
    // Get driver profile
    const driverProfile = await DriverProfile.findOne({
      where: { user_id: userId }
    });

    if (!driverProfile) {
      throw new AppError('Driver profile not found', 404);
    }

    // Find existing taxi license
    let taxiLicense = await DriverTaxiLicense.findOne({
      where: { driver_profile_id: driverProfile.id }
    });

    if (taxiLicense) {
      await taxiLicense.update(data);
    } else {
      taxiLicense = await DriverTaxiLicense.create({
        driver_profile_id: driverProfile.id,
        ...data
      });
    }

    // Mark registration as complete
    await driverProfile.update({
      registration_step: 'complete',
      is_complete: true
    });

    return taxiLicense;
  }
}

