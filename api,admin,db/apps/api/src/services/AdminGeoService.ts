/**
 * Admin Geo Service
 * Business logic for managing geo hierarchy via admin panel
 */

import {
  GeoCountry,
  GeoProvince,
  GeoCityDistrict,
  GeoAdministrativeArea,
  GeoSettlement,
  GeoNeighborhood,
} from '../database/models/index.js';
import { ConflictError, NotFoundError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const mapCountry = (country: GeoCountry) => ({
  id: country.id,
  name: country.name,
  latitude: toNumber(country.get('latitude')),
  longitude: toNumber(country.get('longitude')),
  created_at: country.created_at,
  updated_at: country.updated_at,
});

const mapProvince = (province: GeoProvince) => ({
  id: province.id,
  name: province.name,
  country_id: province.country_id,
  latitude: toNumber(province.get('latitude')),
  longitude: toNumber(province.get('longitude')),
  created_at: province.created_at,
  updated_at: province.updated_at,
});

const mapCityDistrict = (cityDistrict: GeoCityDistrict) => ({
  id: cityDistrict.id,
  name: cityDistrict.name,
  province_id: cityDistrict.province_id,
  latitude: toNumber(cityDistrict.get('latitude')),
  longitude: toNumber(cityDistrict.get('longitude')),
  created_at: cityDistrict.created_at,
  updated_at: cityDistrict.updated_at,
});

const mapAdministrativeArea = (adminArea: GeoAdministrativeArea) => ({
  id: adminArea.id,
  name: adminArea.name,
  city_district_id: adminArea.city_district_id,
  latitude: toNumber(adminArea.get('latitude')),
  longitude: toNumber(adminArea.get('longitude')),
  created_at: adminArea.created_at,
  updated_at: adminArea.updated_at,
});

const mapSettlement = (settlement: GeoSettlement) => ({
  id: settlement.id,
  name: settlement.name,
  city_district_id: settlement.city_district_id,
  type: settlement.type ?? null,
  latitude: toNumber(settlement.get('latitude')),
  longitude: toNumber(settlement.get('longitude')),
  created_at: settlement.created_at,
  updated_at: settlement.updated_at,
});

const mapNeighborhood = (neighborhood: GeoNeighborhood) => ({
  id: neighborhood.id,
  name: neighborhood.name,
  city_district_id: neighborhood.city_district_id,
  latitude: toNumber(neighborhood.get('latitude')),
  longitude: toNumber(neighborhood.get('longitude')),
  created_at: neighborhood.created_at,
  updated_at: neighborhood.updated_at,
});

export interface GeoCountryInput {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface GeoProvinceInput {
  name: string;
  country_id: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface GeoCityDistrictInput {
  name: string;
  province_id: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface GeoAdministrativeAreaInput {
  name: string;
  city_district_id: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface GeoSettlementInput {
  name: string;
  city_district_id: number;
  type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface GeoNeighborhoodInput {
  name: string;
  city_district_id: number;
  latitude?: number | null;
  longitude?: number | null;
}

export class AdminGeoService {
  /* Countries */
  static async listCountries(): Promise<ReturnType<typeof mapCountry>[]> {
    const countries = await GeoCountry.findAll({
      order: [['name', 'ASC']],
    });
    return countries.map(mapCountry);
  }

  static async getCountry(id: number): Promise<ReturnType<typeof mapCountry>> {
    const country = await GeoCountry.findByPk(id);
    if (!country) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_COUNTRY_NOT_FOUND);
    }
    return mapCountry(country);
  }

  static async createCountry(payload: GeoCountryInput): Promise<ReturnType<typeof mapCountry>> {
    const existing = await GeoCountry.findOne({
      where: { name: payload.name },
    });
    if (existing) {
      throw new ConflictError(ERROR_MESSAGES.GEO_COUNTRY_ALREADY_EXISTS);
    }

    const country = await GeoCountry.create({
      name: payload.name,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    });
    return mapCountry(country);
  }

  static async updateCountry(
    id: number,
    payload: Partial<GeoCountryInput>
  ): Promise<ReturnType<typeof mapCountry>> {
    const country = await GeoCountry.findByPk(id);
    if (!country) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_COUNTRY_NOT_FOUND);
    }

    if (payload.name && payload.name !== country.name) {
      const existing = await GeoCountry.findOne({
        where: { name: payload.name },
      });
      if (existing) {
        throw new ConflictError(ERROR_MESSAGES.GEO_COUNTRY_ALREADY_EXISTS);
      }
    }

    await country.update({
      name: payload.name ?? country.name,
      latitude:
        payload.latitude !== undefined ? payload.latitude ?? null : toNumber(country.get('latitude')),
      longitude:
        payload.longitude !== undefined
          ? payload.longitude ?? null
          : toNumber(country.get('longitude')),
    });

    await country.reload();
    return mapCountry(country);
  }

  static async deleteCountry(id: number): Promise<void> {
    const country = await GeoCountry.findByPk(id);
    if (!country) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_COUNTRY_NOT_FOUND);
    }
    await country.destroy();
  }

  /* Provinces */
  static async listProvinces(
    countryId?: number
  ): Promise<ReturnType<typeof mapProvince>[]> {
    const provinces = await GeoProvince.findAll({
      where: countryId ? { country_id: countryId } : undefined,
      order: [
        ['country_id', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    return provinces.map(mapProvince);
  }

  static async getProvince(id: number): Promise<ReturnType<typeof mapProvince>> {
    const province = await GeoProvince.findByPk(id);
    if (!province) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_PROVINCE_NOT_FOUND);
    }
    return mapProvince(province);
  }

  static async createProvince(payload: GeoProvinceInput): Promise<ReturnType<typeof mapProvince>> {
    const country = await GeoCountry.findByPk(payload.country_id);
    if (!country) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_COUNTRY_NOT_FOUND);
    }

    const existing = await GeoProvince.findOne({
      where: { country_id: payload.country_id, name: payload.name },
    });
    if (existing) {
      throw new ConflictError(ERROR_MESSAGES.GEO_PROVINCE_ALREADY_EXISTS);
    }

    const province = await GeoProvince.create({
      name: payload.name,
      country_id: payload.country_id,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    });
    return mapProvince(province);
  }

  static async updateProvince(
    id: number,
    payload: Partial<GeoProvinceInput>
  ): Promise<ReturnType<typeof mapProvince>> {
    const province = await GeoProvince.findByPk(id);
    if (!province) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_PROVINCE_NOT_FOUND);
    }

    const targetCountryId = payload.country_id ?? province.country_id;
    const country = await GeoCountry.findByPk(targetCountryId);
    if (!country) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_COUNTRY_NOT_FOUND);
    }

    if (
      payload.name &&
      (payload.name !== province.name || targetCountryId !== province.country_id)
    ) {
      const existing = await GeoProvince.findOne({
        where: { country_id: targetCountryId, name: payload.name },
      });
      if (existing) {
        throw new ConflictError(ERROR_MESSAGES.GEO_PROVINCE_ALREADY_EXISTS);
      }
    }

    await province.update({
      name: payload.name ?? province.name,
      country_id: targetCountryId,
      latitude:
        payload.latitude !== undefined ? payload.latitude ?? null : toNumber(province.get('latitude')),
      longitude:
        payload.longitude !== undefined
          ? payload.longitude ?? null
          : toNumber(province.get('longitude')),
    });

    await province.reload();
    return mapProvince(province);
  }

  static async deleteProvince(id: number): Promise<void> {
    const province = await GeoProvince.findByPk(id);
    if (!province) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_PROVINCE_NOT_FOUND);
    }
    await province.destroy();
  }

  /* City Districts */
  static async listCityDistricts(
    provinceId?: number
  ): Promise<ReturnType<typeof mapCityDistrict>[]> {
    const districts = await GeoCityDistrict.findAll({
      where: provinceId ? { province_id: provinceId } : undefined,
      order: [
        ['province_id', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    return districts.map(mapCityDistrict);
  }

  static async createCityDistrict(
    payload: GeoCityDistrictInput
  ): Promise<ReturnType<typeof mapCityDistrict>> {
    const province = await GeoProvince.findByPk(payload.province_id);
    if (!province) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_PROVINCE_NOT_FOUND);
    }

    const existing = await GeoCityDistrict.findOne({
      where: { province_id: payload.province_id, name: payload.name },
    });
    if (existing) {
      throw new ConflictError(ERROR_MESSAGES.GEO_CITY_DISTRICT_ALREADY_EXISTS);
    }

    const district = await GeoCityDistrict.create({
      name: payload.name,
      province_id: payload.province_id,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    });
    return mapCityDistrict(district);
  }

  static async updateCityDistrict(
    id: number,
    payload: Partial<GeoCityDistrictInput>
  ): Promise<ReturnType<typeof mapCityDistrict>> {
    const district = await GeoCityDistrict.findByPk(id);
    if (!district) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_CITY_DISTRICT_NOT_FOUND);
    }

    const targetProvinceId = payload.province_id ?? district.province_id;
    const province = await GeoProvince.findByPk(targetProvinceId);
    if (!province) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_PROVINCE_NOT_FOUND);
    }

    if (
      payload.name &&
      (payload.name !== district.name || targetProvinceId !== district.province_id)
    ) {
      const existing = await GeoCityDistrict.findOne({
        where: { province_id: targetProvinceId, name: payload.name },
      });
      if (existing) {
        throw new ConflictError(ERROR_MESSAGES.GEO_CITY_DISTRICT_ALREADY_EXISTS);
      }
    }

    await district.update({
      name: payload.name ?? district.name,
      province_id: targetProvinceId,
      latitude:
        payload.latitude !== undefined ? payload.latitude ?? null : toNumber(district.get('latitude')),
      longitude:
        payload.longitude !== undefined
          ? payload.longitude ?? null
          : toNumber(district.get('longitude')),
    });

    await district.reload();
    return mapCityDistrict(district);
  }

  static async deleteCityDistrict(id: number): Promise<void> {
    const district = await GeoCityDistrict.findByPk(id);
    if (!district) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_CITY_DISTRICT_NOT_FOUND);
    }
    await district.destroy();
  }

  /* Administrative Areas */
  static async listAdministrativeAreas(
    cityDistrictId?: number
  ): Promise<ReturnType<typeof mapAdministrativeArea>[]> {
    const areas = await GeoAdministrativeArea.findAll({
      where: cityDistrictId ? { city_district_id: cityDistrictId } : undefined,
      order: [
        ['city_district_id', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    return areas.map(mapAdministrativeArea);
  }

  static async createAdministrativeArea(
    payload: GeoAdministrativeAreaInput
  ): Promise<ReturnType<typeof mapAdministrativeArea>> {
    const district = await GeoCityDistrict.findByPk(payload.city_district_id);
    if (!district) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_CITY_DISTRICT_NOT_FOUND);
    }

    const existing = await GeoAdministrativeArea.findOne({
      where: { city_district_id: payload.city_district_id, name: payload.name },
    });
    if (existing) {
      throw new ConflictError(ERROR_MESSAGES.GEO_ADMIN_AREA_ALREADY_EXISTS);
    }

    const area = await GeoAdministrativeArea.create({
      name: payload.name,
      city_district_id: payload.city_district_id,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    });
    return mapAdministrativeArea(area);
  }

  static async updateAdministrativeArea(
    id: number,
    payload: Partial<GeoAdministrativeAreaInput>
  ): Promise<ReturnType<typeof mapAdministrativeArea>> {
    const area = await GeoAdministrativeArea.findByPk(id);
    if (!area) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_ADMIN_AREA_NOT_FOUND);
    }

    const targetDistrictId = payload.city_district_id ?? area.city_district_id;
    const district = await GeoCityDistrict.findByPk(targetDistrictId);
    if (!district) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_CITY_DISTRICT_NOT_FOUND);
    }

    if (
      payload.name &&
      (payload.name !== area.name || targetDistrictId !== area.city_district_id)
    ) {
      const existing = await GeoAdministrativeArea.findOne({
        where: { city_district_id: targetDistrictId, name: payload.name },
      });
      if (existing) {
        throw new ConflictError(ERROR_MESSAGES.GEO_ADMIN_AREA_ALREADY_EXISTS);
      }
    }

    await area.update({
      name: payload.name ?? area.name,
      city_district_id: targetDistrictId,
      latitude:
        payload.latitude !== undefined ? payload.latitude ?? null : toNumber(area.get('latitude')),
      longitude:
        payload.longitude !== undefined
          ? payload.longitude ?? null
          : toNumber(area.get('longitude')),
    });

    await area.reload();
    return mapAdministrativeArea(area);
  }

  static async deleteAdministrativeArea(id: number): Promise<void> {
    const area = await GeoAdministrativeArea.findByPk(id);
    if (!area) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_ADMIN_AREA_NOT_FOUND);
    }
    await area.destroy();
  }

  /* Settlements */
  static async listSettlements(
    cityDistrictId?: number
  ): Promise<ReturnType<typeof mapSettlement>[]> {
    const settlements = await GeoSettlement.findAll({
      where: cityDistrictId ? { city_district_id: cityDistrictId } : undefined,
      order: [
        ['city_district_id', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    return settlements.map(mapSettlement);
  }

  static async createSettlement(
    payload: GeoSettlementInput
  ): Promise<ReturnType<typeof mapSettlement>> {
    const district = await GeoCityDistrict.findByPk(payload.city_district_id);
    if (!district) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_CITY_DISTRICT_NOT_FOUND);
    }

    const existing = await GeoSettlement.findOne({
      where: { city_district_id: payload.city_district_id, name: payload.name },
    });
    if (existing) {
      throw new ConflictError(ERROR_MESSAGES.GEO_SETTLEMENT_ALREADY_EXISTS);
    }

    const settlement = await GeoSettlement.create({
      name: payload.name,
      city_district_id: payload.city_district_id,
      type: payload.type ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    });
    return mapSettlement(settlement);
  }

  static async updateSettlement(
    id: number,
    payload: Partial<GeoSettlementInput>
  ): Promise<ReturnType<typeof mapSettlement>> {
    const settlement = await GeoSettlement.findByPk(id);
    if (!settlement) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_SETTLEMENT_NOT_FOUND);
    }

    const targetDistrictId = payload.city_district_id ?? settlement.city_district_id;
    const district = await GeoCityDistrict.findByPk(targetDistrictId);
    if (!district) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_CITY_DISTRICT_NOT_FOUND);
    }

    if (
      payload.name &&
      (payload.name !== settlement.name || targetDistrictId !== settlement.city_district_id)
    ) {
      const existing = await GeoSettlement.findOne({
        where: { city_district_id: targetDistrictId, name: payload.name },
      });
      if (existing) {
        throw new ConflictError(ERROR_MESSAGES.GEO_SETTLEMENT_ALREADY_EXISTS);
      }
    }

    await settlement.update({
      name: payload.name ?? settlement.name,
      city_district_id: targetDistrictId,
      type: payload.type !== undefined ? payload.type ?? null : settlement.type ?? null,
      latitude:
        payload.latitude !== undefined
          ? payload.latitude ?? null
          : toNumber(settlement.get('latitude')),
      longitude:
        payload.longitude !== undefined
          ? payload.longitude ?? null
          : toNumber(settlement.get('longitude')),
    });

    await settlement.reload();
    return mapSettlement(settlement);
  }

  static async deleteSettlement(id: number): Promise<void> {
    const settlement = await GeoSettlement.findByPk(id);
    if (!settlement) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_SETTLEMENT_NOT_FOUND);
    }
    await settlement.destroy();
  }

  /* Neighborhoods */
  static async listNeighborhoods(
    cityDistrictId?: number
  ): Promise<ReturnType<typeof mapNeighborhood>[]> {
    const neighborhoods = await GeoNeighborhood.findAll({
      where: cityDistrictId ? { city_district_id: cityDistrictId } : undefined,
      order: [
        ['city_district_id', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    return neighborhoods.map(mapNeighborhood);
  }

  static async createNeighborhood(
    payload: GeoNeighborhoodInput
  ): Promise<ReturnType<typeof mapNeighborhood>> {
    const district = await GeoCityDistrict.findByPk(payload.city_district_id);
    if (!district) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_CITY_DISTRICT_NOT_FOUND);
    }

    const existing = await GeoNeighborhood.findOne({
      where: { city_district_id: payload.city_district_id, name: payload.name },
    });
    if (existing) {
      throw new ConflictError(ERROR_MESSAGES.GEO_NEIGHBORHOOD_ALREADY_EXISTS);
    }

    const neighborhood = await GeoNeighborhood.create({
      name: payload.name,
      city_district_id: payload.city_district_id,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    });
    return mapNeighborhood(neighborhood);
  }

  static async updateNeighborhood(
    id: number,
    payload: Partial<GeoNeighborhoodInput>
  ): Promise<ReturnType<typeof mapNeighborhood>> {
    const neighborhood = await GeoNeighborhood.findByPk(id);
    if (!neighborhood) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_NEIGHBORHOOD_NOT_FOUND);
    }

    const targetDistrictId = payload.city_district_id ?? neighborhood.city_district_id;
    const district = await GeoCityDistrict.findByPk(targetDistrictId);
    if (!district) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_CITY_DISTRICT_NOT_FOUND);
    }

    if (
      payload.name &&
      (payload.name !== neighborhood.name || targetDistrictId !== neighborhood.city_district_id)
    ) {
      const existing = await GeoNeighborhood.findOne({
        where: { city_district_id: targetDistrictId, name: payload.name },
      });
      if (existing) {
        throw new ConflictError(ERROR_MESSAGES.GEO_NEIGHBORHOOD_ALREADY_EXISTS);
      }
    }

    await neighborhood.update({
      name: payload.name ?? neighborhood.name,
      city_district_id: targetDistrictId,
      latitude:
        payload.latitude !== undefined
          ? payload.latitude ?? null
          : toNumber(neighborhood.get('latitude')),
      longitude:
        payload.longitude !== undefined
          ? payload.longitude ?? null
          : toNumber(neighborhood.get('longitude')),
    });

    await neighborhood.reload();
    return mapNeighborhood(neighborhood);
  }

  static async deleteNeighborhood(id: number): Promise<void> {
    const neighborhood = await GeoNeighborhood.findByPk(id);
    if (!neighborhood) {
      throw new NotFoundError(ERROR_MESSAGES.GEO_NEIGHBORHOOD_NOT_FOUND);
    }
    await neighborhood.destroy();
  }

  /* Bulk Upload Methods */
  static async bulkUploadCountries(data: Array<{
    name: string;
    latitude?: number | null;
    longitude?: number | null;
  }>): Promise<{ created: number; updated: number; errors: string[] }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || row.name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }
        
        // Check if country already exists
        const existing = await GeoCountry.findOne({ where: { name: row.name } });
        
        if (existing) {
          // Update existing
          await existing.update({
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.updated++;
        } else {
          // Create new
          await GeoCountry.create({
            name: row.name,
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return result;
  }

  static async bulkUploadProvinces(data: Array<{
    name: string;
    country_name: string;
    latitude?: number | null;
    longitude?: number | null;
  }>): Promise<{ created: number; updated: number; errors: string[] }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || row.name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }
        
        if (!row.country_name || row.country_name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Country name is required`);
          continue;
        }
        
        // Find country by name
        const country = await GeoCountry.findOne({ where: { name: row.country_name } });
        if (!country) {
          result.errors.push(`Row ${i + 1}: Country '${row.country_name}' not found`);
          continue;
        }
        
        // Check if province already exists
        const existing = await GeoProvince.findOne({
          where: { name: row.name, country_id: country.id }
        });
        
        if (existing) {
          // Update existing
          await existing.update({
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.updated++;
        } else {
          // Create new
          await GeoProvince.create({
            name: row.name,
            country_id: country.id,
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return result;
  }

  static async bulkUploadCityDistricts(data: Array<{
    name: string;
    province_name: string;
    country_name: string;
    latitude?: number | null;
    longitude?: number | null;
  }>): Promise<{ created: number; updated: number; errors: string[] }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || row.name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }
        
        if (!row.province_name || row.province_name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Province name is required`);
          continue;
        }
        
        if (!row.country_name || row.country_name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Country name is required`);
          continue;
        }
        
        // Find country by name
        const country = await GeoCountry.findOne({ where: { name: row.country_name } });
        if (!country) {
          result.errors.push(`Row ${i + 1}: Country '${row.country_name}' not found`);
          continue;
        }
        
        // Find province by name and country
        const province = await GeoProvince.findOne({
          where: { name: row.province_name, country_id: country.id }
        });
        if (!province) {
          result.errors.push(`Row ${i + 1}: Province '${row.province_name}' not found in country '${row.country_name}'`);
          continue;
        }
        
        // Check if city district already exists
        const existing = await GeoCityDistrict.findOne({
          where: { name: row.name, province_id: province.id }
        });
        
        if (existing) {
          // Update existing
          await existing.update({
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.updated++;
        } else {
          // Create new
          await GeoCityDistrict.create({
            name: row.name,
            province_id: province.id,
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return result;
  }

  static async bulkUploadAdministrativeAreas(data: Array<{
    name: string;
    city_district_name: string;
    province_name: string;
    country_name: string;
    latitude?: number | null;
    longitude?: number | null;
  }>): Promise<{ created: number; updated: number; errors: string[] }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || row.name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }
        
        if (!row.city_district_name || row.city_district_name.trim() === '') {
          result.errors.push(`Row ${i + 1}: City district name is required`);
          continue;
        }
        
        // Find city district (with province and country for context)
        const cityDistrict = await GeoCityDistrict.findOne({
          where: { name: row.city_district_name },
          include: [{
            model: GeoProvince,
            as: 'province',
            where: row.province_name ? { name: row.province_name } : undefined,
            include: row.country_name ? [{
              model: GeoCountry,
              as: 'country',
              where: { name: row.country_name },
            }] : [],
          }],
        });
        
        if (!cityDistrict) {
          result.errors.push(`Row ${i + 1}: City district '${row.city_district_name}' not found`);
          continue;
        }
        
        // Check if administrative area already exists
        const existing = await GeoAdministrativeArea.findOne({
          where: { name: row.name, city_district_id: cityDistrict.id }
        });
        
        if (existing) {
          // Update existing
          await existing.update({
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.updated++;
        } else {
          // Create new
          await GeoAdministrativeArea.create({
            name: row.name,
            city_district_id: cityDistrict.id,
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return result;
  }

  static async bulkUploadSettlements(data: Array<{
    name: string;
    type?: string | null;
    city_district_name: string;
    province_name: string;
    country_name: string;
    latitude?: number | null;
    longitude?: number | null;
  }>): Promise<{ created: number; updated: number; errors: string[] }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || row.name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }
        
        if (!row.city_district_name || row.city_district_name.trim() === '') {
          result.errors.push(`Row ${i + 1}: City district name is required`);
          continue;
        }
        
        // Find city district (with province and country for context)
        const cityDistrict = await GeoCityDistrict.findOne({
          where: { name: row.city_district_name },
          include: [{
            model: GeoProvince,
            as: 'province',
            where: row.province_name ? { name: row.province_name } : undefined,
            include: row.country_name ? [{
              model: GeoCountry,
              as: 'country',
              where: { name: row.country_name },
            }] : [],
          }],
        });
        
        if (!cityDistrict) {
          result.errors.push(`Row ${i + 1}: City district '${row.city_district_name}' not found`);
          continue;
        }
        
        // Check if settlement already exists
        const existing = await GeoSettlement.findOne({
          where: { name: row.name, city_district_id: cityDistrict.id }
        });
        
        if (existing) {
          // Update existing
          await existing.update({
            type: row.type || null,
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.updated++;
        } else {
          // Create new
          await GeoSettlement.create({
            name: row.name,
            city_district_id: cityDistrict.id,
            type: row.type || null,
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return result;
  }

  static async bulkUploadNeighborhoods(data: Array<{
    name: string;
    city_district_name: string;
    province_name: string;
    country_name: string;
    latitude?: number | null;
    longitude?: number | null;
  }>): Promise<{ created: number; updated: number; errors: string[] }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || row.name.trim() === '') {
          result.errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }
        
        if (!row.city_district_name || row.city_district_name.trim() === '') {
          result.errors.push(`Row ${i + 1}: City district name is required`);
          continue;
        }
        
        // Find city district (with province and country for context)
        const cityDistrict = await GeoCityDistrict.findOne({
          where: { name: row.city_district_name },
          include: [{
            model: GeoProvince,
            as: 'province',
            where: row.province_name ? { name: row.province_name } : undefined,
            include: row.country_name ? [{
              model: GeoCountry,
              as: 'country',
              where: { name: row.country_name },
            }] : [],
          }],
        });
        
        if (!cityDistrict) {
          result.errors.push(`Row ${i + 1}: City district '${row.city_district_name}' not found`);
          continue;
        }
        
        // Check if neighborhood already exists
        const existing = await GeoNeighborhood.findOne({
          where: { name: row.name, city_district_id: cityDistrict.id }
        });
        
        if (existing) {
          // Update existing
          await existing.update({
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.updated++;
        } else {
          // Create new
          await GeoNeighborhood.create({
            name: row.name,
            city_district_id: cityDistrict.id,
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return result;
  }
}

export default AdminGeoService;

