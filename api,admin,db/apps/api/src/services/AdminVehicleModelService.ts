/**
 * Admin Vehicle Model Service
 * Business logic for managing vehicle models via admin panel
 */

import { VehicleModel, VehicleMake } from '../database/models/index.js';
import { ConflictError, NotFoundError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export interface VehicleModelInput {
  vehicle_make_id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface VehicleModelDTO {
  id: string;
  vehicle_make_id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  make?: {
    id: string;
    name: string;
  };
}

function mapVehicleModelToDTO(model: VehicleModel): VehicleModelDTO {
  return {
    id: model.id,
    vehicle_make_id: model.vehicle_make_id,
    name: model.name,
    name_uz: model.name_uz,
    name_ru: model.name_ru,
    name_en: model.name_en,
    is_active: model.is_active,
    sort_order: model.sort_order,
    created_at: model.created_at.toISOString(),
    updated_at: model.updated_at.toISOString(),
    make: (model as any).make ? {
      id: (model as any).make.id,
      name: (model as any).make.name,
    } : undefined,
  };
}

export class AdminVehicleModelService {
  static async getAll(includeInactive: boolean = true, makeId?: string): Promise<VehicleModelDTO[]> {
    const where: any = includeInactive ? {} : { is_active: true };
    if (makeId) {
      where.vehicle_make_id = makeId;
    }

    const models = await VehicleModel.findAll({
      where,
      include: [
        {
          model: VehicleMake,
          as: 'make',
          attributes: ['id', 'name'],
        },
      ],
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return models.map(mapVehicleModelToDTO);
  }

  static async getById(id: string): Promise<VehicleModelDTO> {
    const model = await VehicleModel.findByPk(id, {
      include: [
        {
          model: VehicleMake,
          as: 'make',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!model) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Model'));
    }

    return mapVehicleModelToDTO(model);
  }

  static async create(payload: VehicleModelInput): Promise<VehicleModelDTO> {
    // Verify make exists
    const make = await VehicleMake.findByPk(payload.vehicle_make_id);
    if (!make) {
      throw new NotFoundError('Vehicle make not found');
    }

    const existing = await VehicleModel.findOne({
      where: {
        vehicle_make_id: payload.vehicle_make_id,
        name: payload.name,
      },
    });

    if (existing) {
      throw new ConflictError('Vehicle model with this name already exists for this make');
    }

    const model = await VehicleModel.create({
      vehicle_make_id: payload.vehicle_make_id,
      name: payload.name,
      name_uz: payload.name_uz ?? null,
      name_ru: payload.name_ru ?? null,
      name_en: payload.name_en ?? null,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    });

    const created = await VehicleModel.findByPk(model.id, {
      include: [
        {
          model: VehicleMake,
          as: 'make',
          attributes: ['id', 'name'],
        },
      ],
    });

    return mapVehicleModelToDTO(created!);
  }

  static async update(id: string, payload: Partial<VehicleModelInput>): Promise<VehicleModelDTO> {
    const model = await VehicleModel.findByPk(id);

    if (!model) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Model'));
    }

    if (payload.vehicle_make_id) {
      const make = await VehicleMake.findByPk(payload.vehicle_make_id);
      if (!make) {
        throw new NotFoundError('Vehicle make not found');
      }
    }

    if (payload.name && (payload.name !== model.name || payload.vehicle_make_id !== model.vehicle_make_id)) {
      const existing = await VehicleModel.findOne({
        where: {
          vehicle_make_id: payload.vehicle_make_id ?? model.vehicle_make_id,
          name: payload.name,
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictError('Vehicle model with this name already exists for this make');
      }
    }

    await model.update({
      vehicle_make_id: payload.vehicle_make_id ?? model.vehicle_make_id,
      name: payload.name ?? model.name,
      name_uz: payload.name_uz === undefined ? model.name_uz : payload.name_uz,
      name_ru: payload.name_ru === undefined ? model.name_ru : payload.name_ru,
      name_en: payload.name_en === undefined ? model.name_en : payload.name_en,
      sort_order: payload.sort_order ?? model.sort_order,
      is_active: payload.is_active ?? model.is_active,
    });

    const updated = await VehicleModel.findByPk(model.id, {
      include: [
        {
          model: VehicleMake,
          as: 'make',
          attributes: ['id', 'name'],
        },
      ],
    });

    return mapVehicleModelToDTO(updated!);
  }

  static async delete(id: string): Promise<void> {
    const model = await VehicleModel.findByPk(id);

    if (!model) {
      throw new NotFoundError(ERROR_MESSAGES.COUNTRY_NOT_FOUND.replace('Country', 'Vehicle Model'));
    }

    await model.destroy();
  }
}

