/**
 * Admin Vehicle Type Service
 * Business logic for managing vehicle types via admin panel
 */

import { VehicleType } from '../database/models/index.js';
import { ConflictError, NotFoundError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export interface VehicleTypeInput {
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface VehicleTypeDTO {
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

function mapVehicleTypeToDTO(type: VehicleType): VehicleTypeDTO {
  return {
    id: type.id,
    name: type.name,
    name_uz: type.name_uz,
    name_ru: type.name_ru,
    name_en: type.name_en,
    is_active: type.is_active,
    sort_order: type.sort_order,
    created_at: type.created_at.toISOString(),
    updated_at: type.updated_at.toISOString(),
  };
}

export class AdminVehicleTypeService {
  static async getAll(includeInactive: boolean = true): Promise<VehicleTypeDTO[]> {
    const types = await VehicleType.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return types.map(mapVehicleTypeToDTO);
  }

  static async getById(id: string): Promise<VehicleTypeDTO> {
    const type = await VehicleType.findByPk(id);

    if (!type) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Type'));
    }

    return mapVehicleTypeToDTO(type);
  }

  static async create(payload: VehicleTypeInput): Promise<VehicleTypeDTO> {
    const existing = await VehicleType.findOne({
      where: {
        name: payload.name,
      },
    });

    if (existing) {
      throw new ConflictError('Vehicle type with this name already exists');
    }

    const type = await VehicleType.create({
      name: payload.name,
      name_uz: payload.name_uz ?? null,
      name_ru: payload.name_ru ?? null,
      name_en: payload.name_en ?? null,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    });

    return mapVehicleTypeToDTO(type);
  }

  static async update(id: string, payload: Partial<VehicleTypeInput>): Promise<VehicleTypeDTO> {
    const type = await VehicleType.findByPk(id);

    if (!type) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Type'));
    }

    if (payload.name && payload.name !== type.name) {
      const existing = await VehicleType.findOne({
        where: {
          name: payload.name,
        },
      });

      if (existing) {
        throw new ConflictError('Vehicle type with this name already exists');
      }
    }

    await type.update({
      name: payload.name ?? type.name,
      name_uz: payload.name_uz === undefined ? type.name_uz : payload.name_uz,
      name_ru: payload.name_ru === undefined ? type.name_ru : payload.name_ru,
      name_en: payload.name_en === undefined ? type.name_en : payload.name_en,
      sort_order: payload.sort_order ?? type.sort_order,
      is_active: payload.is_active ?? type.is_active,
    });

    return mapVehicleTypeToDTO(type);
  }

  static async delete(id: string): Promise<void> {
    const type = await VehicleType.findByPk(id);

    if (!type) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Type'));
    }

    await type.destroy();
  }
}

