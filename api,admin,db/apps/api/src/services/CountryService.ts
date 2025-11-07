/**
 * Country Service
 * Shared logic for retrieving country metadata
 */

import { Op } from 'sequelize';
import { Country } from '../database/models/index.js';

export type CountryPattern = 'uz' | 'ru' | 'generic';

export interface CountryDTO {
  id: string;
  name: string;
  code: string;
  flag?: string | null;
  local_length: number;
  pattern: CountryPattern;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const mapCountryToDTO = (country: Country): CountryDTO => {
  const plain = country.get({ plain: true }) as unknown as CountryDTO;
  return {
    id: plain.id,
    name: plain.name,
    code: plain.code,
    flag: plain.flag ?? null,
    local_length: plain.local_length,
    pattern: plain.pattern,
    sort_order: plain.sort_order,
    is_active: plain.is_active,
    created_at: plain.created_at,
    updated_at: plain.updated_at,
  };
};

export class CountryService {
  static async getActiveCountries(): Promise<CountryDTO[]> {
    const countries = await Country.findAll({
      where: {
        is_active: true,
      },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return countries.map(mapCountryToDTO);
  }

  static async getByCodes(codes: string[]): Promise<CountryDTO[]> {
    if (codes.length === 0) {
      return [];
    }

    const countries = await Country.findAll({
      where: {
        code: {
          [Op.in]: codes,
        },
      },
    });

    return countries.map(mapCountryToDTO);
  }
}


