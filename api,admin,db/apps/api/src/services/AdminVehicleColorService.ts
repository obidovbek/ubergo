/**
 * Admin Vehicle Color Service
 * Business logic for managing vehicle colors via admin panel
 */

import { VehicleColor } from '../database/models/index.js';
import { ConflictError, NotFoundError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export interface VehicleColorInput {
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  hex_code?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface VehicleColorDTO {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  hex_code?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapVehicleColorToDTO(color: VehicleColor): VehicleColorDTO {
  return {
    id: color.id,
    name: color.name,
    name_uz: color.name_uz,
    name_ru: color.name_ru,
    name_en: color.name_en,
    hex_code: color.hex_code,
    is_active: color.is_active,
    sort_order: color.sort_order,
    created_at: color.created_at.toISOString(),
    updated_at: color.updated_at.toISOString(),
  };
}

export class AdminVehicleColorService {
  static async getAll(includeInactive: boolean = true): Promise<VehicleColorDTO[]> {
    const colors = await VehicleColor.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return colors.map(mapVehicleColorToDTO);
  }

  static async getById(id: string): Promise<VehicleColorDTO> {
    const color = await VehicleColor.findByPk(id);

    if (!color) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Color'));
    }

    return mapVehicleColorToDTO(color);
  }

  static async create(payload: VehicleColorInput): Promise<VehicleColorDTO> {
    const existing = await VehicleColor.findOne({
      where: {
        name: payload.name,
      },
    });

    if (existing) {
      throw new ConflictError('Vehicle color with this name already exists');
    }

    const color = await VehicleColor.create({
      name: payload.name,
      name_uz: payload.name_uz ?? null,
      name_ru: payload.name_ru ?? null,
      name_en: payload.name_en ?? null,
      hex_code: payload.hex_code ?? null,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    });

    return mapVehicleColorToDTO(color);
  }

  static async update(id: string, payload: Partial<VehicleColorInput>): Promise<VehicleColorDTO> {
    const color = await VehicleColor.findByPk(id);

    if (!color) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Color'));
    }

    if (payload.name && payload.name !== color.name) {
      const existing = await VehicleColor.findOne({
        where: {
          name: payload.name,
        },
      });

      if (existing) {
        throw new ConflictError('Vehicle color with this name already exists');
      }
    }

    await color.update({
      name: payload.name ?? color.name,
      name_uz: payload.name_uz === undefined ? color.name_uz : payload.name_uz,
      name_ru: payload.name_ru === undefined ? color.name_ru : payload.name_ru,
      name_en: payload.name_en === undefined ? color.name_en : payload.name_en,
      hex_code: payload.hex_code === undefined ? color.hex_code : payload.hex_code,
      sort_order: payload.sort_order ?? color.sort_order,
      is_active: payload.is_active ?? color.is_active,
    });

    return mapVehicleColorToDTO(color);
  }

  static async delete(id: string): Promise<void> {
    const color = await VehicleColor.findByPk(id);

    if (!color) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Color'));
    }

    await color.destroy();
  }
}

