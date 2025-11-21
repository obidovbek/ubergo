/**
 * Admin Vehicle Make Service
 * Business logic for managing vehicle makes via admin panel
 */

import { VehicleMake } from '../database/models/index.js';
import { ConflictError, NotFoundError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export interface VehicleMakeInput {
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface VehicleMakeDTO {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapVehicleMakeToDTO(make: VehicleMake): VehicleMakeDTO {
  return {
    id: make.id,
    name: make.name,
    name_uz: make.name_uz,
    name_ru: make.name_ru,
    name_en: make.name_en,
    is_active: make.is_active,
    sort_order: make.sort_order,
    created_at: make.created_at.toISOString(),
    updated_at: make.updated_at.toISOString(),
  };
}

export class AdminVehicleMakeService {
  static async getAll(includeInactive: boolean = true): Promise<VehicleMakeDTO[]> {
    const makes = await VehicleMake.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return makes.map(mapVehicleMakeToDTO);
  }

  static async getById(id: string): Promise<VehicleMakeDTO> {
    const make = await VehicleMake.findByPk(id);

    if (!make) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Make'));
    }

    return mapVehicleMakeToDTO(make);
  }

  static async create(payload: VehicleMakeInput): Promise<VehicleMakeDTO> {
    const existing = await VehicleMake.findOne({
      where: {
        name: payload.name,
      },
    });

    if (existing) {
      throw new ConflictError('Vehicle make with this name already exists');
    }

    const make = await VehicleMake.create({
      name: payload.name,
      name_uz: payload.name_uz ?? null,
      name_ru: payload.name_ru ?? null,
      name_en: payload.name_en ?? null,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    });

    return mapVehicleMakeToDTO(make);
  }

  static async update(id: string, payload: Partial<VehicleMakeInput>): Promise<VehicleMakeDTO> {
    const make = await VehicleMake.findByPk(id);

    if (!make) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Make'));
    }

    if (payload.name && payload.name !== make.name) {
      const existing = await VehicleMake.findOne({
        where: {
          name: payload.name,
        },
      });

      if (existing) {
        throw new ConflictError('Vehicle make with this name already exists');
      }
    }

    await make.update({
      name: payload.name ?? make.name,
      name_uz: payload.name_uz === undefined ? make.name_uz : payload.name_uz,
      name_ru: payload.name_ru === undefined ? make.name_ru : payload.name_ru,
      name_en: payload.name_en === undefined ? make.name_en : payload.name_en,
      sort_order: payload.sort_order ?? make.sort_order,
      is_active: payload.is_active ?? make.is_active,
    });

    return mapVehicleMakeToDTO(make);
  }

  static async delete(id: string): Promise<void> {
    const make = await VehicleMake.findByPk(id);

    if (!make) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Make'));
    }

    await make.destroy();
  }
}

