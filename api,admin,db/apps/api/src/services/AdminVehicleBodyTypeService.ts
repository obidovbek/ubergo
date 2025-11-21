/**
 * Admin Vehicle Body Type Service
 * Business logic for managing vehicle body types via admin panel
 */

import { VehicleBodyType } from '../database/models/index.js';
import { ConflictError, NotFoundError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export interface VehicleBodyTypeInput {
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface VehicleBodyTypeDTO {
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

function mapVehicleBodyTypeToDTO(bodyType: VehicleBodyType): VehicleBodyTypeDTO {
  return {
    id: bodyType.id,
    name: bodyType.name,
    name_uz: bodyType.name_uz,
    name_ru: bodyType.name_ru,
    name_en: bodyType.name_en,
    is_active: bodyType.is_active,
    sort_order: bodyType.sort_order,
    created_at: bodyType.created_at.toISOString(),
    updated_at: bodyType.updated_at.toISOString(),
  };
}

export class AdminVehicleBodyTypeService {
  static async getAll(includeInactive: boolean = true): Promise<VehicleBodyTypeDTO[]> {
    const bodyTypes = await VehicleBodyType.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return bodyTypes.map(mapVehicleBodyTypeToDTO);
  }

  static async getById(id: string): Promise<VehicleBodyTypeDTO> {
    const bodyType = await VehicleBodyType.findByPk(id);

    if (!bodyType) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Body Type'));
    }

    return mapVehicleBodyTypeToDTO(bodyType);
  }

  static async create(payload: VehicleBodyTypeInput): Promise<VehicleBodyTypeDTO> {
    const existing = await VehicleBodyType.findOne({
      where: {
        name: payload.name,
      },
    });

    if (existing) {
      throw new ConflictError('Vehicle body type with this name already exists');
    }

    const bodyType = await VehicleBodyType.create({
      name: payload.name,
      name_uz: payload.name_uz ?? null,
      name_ru: payload.name_ru ?? null,
      name_en: payload.name_en ?? null,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    });

    return mapVehicleBodyTypeToDTO(bodyType);
  }

  static async update(id: string, payload: Partial<VehicleBodyTypeInput>): Promise<VehicleBodyTypeDTO> {
    const bodyType = await VehicleBodyType.findByPk(id);

    if (!bodyType) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Body Type'));
    }

    if (payload.name && payload.name !== bodyType.name) {
      const existing = await VehicleBodyType.findOne({
        where: {
          name: payload.name,
        },
      });

      if (existing) {
        throw new ConflictError('Vehicle body type with this name already exists');
      }
    }

    await bodyType.update({
      name: payload.name ?? bodyType.name,
      name_uz: payload.name_uz === undefined ? bodyType.name_uz : payload.name_uz,
      name_ru: payload.name_ru === undefined ? bodyType.name_ru : payload.name_ru,
      name_en: payload.name_en === undefined ? bodyType.name_en : payload.name_en,
      sort_order: payload.sort_order ?? bodyType.sort_order,
      is_active: payload.is_active ?? bodyType.is_active,
    });

    return mapVehicleBodyTypeToDTO(bodyType);
  }

  static async delete(id: string): Promise<void> {
    const bodyType = await VehicleBodyType.findByPk(id);

    if (!bodyType) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Body Type'));
    }

    await bodyType.destroy();
  }
}

