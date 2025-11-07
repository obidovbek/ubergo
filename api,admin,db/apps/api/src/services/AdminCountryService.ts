/**
 * Admin Country Service
 * Business logic for managing country metadata via admin panel
 */

import { Country } from '../database/models/index.js';
import { mapCountryToDTO, type CountryDTO, type CountryPattern } from './CountryService.js';
import { ConflictError, NotFoundError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export interface CountryInput {
  name: string;
  code: string;
  flag?: string | null;
  local_length: number;
  pattern: CountryPattern;
  sort_order?: number;
  is_active?: boolean;
}

export class AdminCountryService {
  static async getAll(includeInactive: boolean = true): Promise<CountryDTO[]> {
    const countries = await Country.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return countries.map(mapCountryToDTO);
  }

  static async getById(id: string): Promise<CountryDTO> {
    const country = await Country.findByPk(id);

    if (!country) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND);
    }

    return mapCountryToDTO(country);
  }

  static async create(payload: CountryInput): Promise<CountryDTO> {
    const existing = await Country.findOne({
      where: {
        name: payload.name,
      },
    });

    if (existing) {
      throw new ConflictError(ERROR_MESSAGES.COUNTRY_ALREADY_EXISTS);
    }

    const country = await Country.create({
      name: payload.name,
      code: payload.code,
      flag: payload.flag ?? null,
      local_length: payload.local_length,
      pattern: payload.pattern,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    });

    return mapCountryToDTO(country);
  }

  static async update(id: string, payload: Partial<CountryInput>): Promise<CountryDTO> {
    const country = await Country.findByPk(id);

    if (!country) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND);
    }

    if (payload.name && payload.name !== country.name) {
      const existing = await Country.findOne({
        where: {
          name: payload.name,
        },
      });

      if (existing) {
        throw new ConflictError(ERROR_MESSAGES.COUNTRY_ALREADY_EXISTS);
      }
    }

    await country.update({
      name: payload.name ?? country.name,
      code: payload.code ?? country.code,
      flag: payload.flag === undefined ? country.flag : payload.flag,
      local_length: payload.local_length ?? country.local_length,
      pattern: payload.pattern ?? country.pattern,
      sort_order: payload.sort_order ?? country.sort_order,
      is_active: payload.is_active ?? country.is_active,
    });

    return mapCountryToDTO(country);
  }

  static async delete(id: string): Promise<void> {
    const country = await Country.findByPk(id);

    if (!country) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND);
    }

    await country.destroy();
  }
}


