/**
 * Admin Driver Service
 * Business logic for managing drivers
 */

import { 
  User, 
  DriverProfile,
  DriverPassport,
  DriverLicense,
  EmergencyContact,
  DriverVehicle,
  DriverTaxiLicense,
  Phone,
  UserIdentity,
  PushToken
} from '../database/models/index.js';
import { Op } from 'sequelize';
import { NotFoundError } from '../errors/AppError.js';
import { ErrorMessages as ERROR_MESSAGES } from '../constants/index.js';

export class AdminDriverService {
  /**
   * Get all drivers (users with role='driver')
   */
  static async getAll(
    page: number = 1,
    pageSize: number = 25,
    filters?: { status?: string; search?: string; registrationStep?: string }
  ) {
    const offset = (page - 1) * pageSize;
    const where: any = {
      role: 'driver'
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where[Op.or] = [
        { phone_e164: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { display_name: { [Op.iLike]: `%${filters.search}%` } },
        { first_name: { [Op.iLike]: `%${filters.search}%` } },
        { last_name: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: DriverProfile,
          as: 'driverProfile',
          required: false,
          include: [
            {
              model: DriverVehicle,
              as: 'vehicle',
              required: false
            }
          ]
        },
        {
          model: Phone,
          as: 'phones',
          required: false
        }
      ]
    });

    // Filter by registration step if provided
    let filteredUsers = users;
    if (filters?.registrationStep) {
      filteredUsers = users.filter(user => 
        user.driverProfile?.registration_step === filters.registrationStep
      );
    }

    return {
      drivers: filteredUsers,
      total: filters?.registrationStep ? filteredUsers.length : total,
      page,
      pageSize
    };
  }

  /**
   * Get driver by ID with all related data
   */
  static async getById(id: string) {
    const user = await User.findOne({
      where: {
        id,
        role: 'driver'
      },
      include: [
        {
          model: Phone,
          as: 'phones',
          required: false
        },
        {
          model: UserIdentity,
          as: 'identities',
          required: false
        },
        {
          model: PushToken,
          as: 'pushTokens',
          required: false
        },
        {
          model: DriverProfile,
          as: 'driverProfile',
          required: false,
          include: [
            {
              model: DriverPassport,
              as: 'passport',
              required: false
            },
            {
              model: DriverLicense,
              as: 'license',
              required: false
            },
            {
              model: EmergencyContact,
              as: 'emergencyContacts',
              required: false
            },
            {
              model: DriverVehicle,
              as: 'vehicle',
              required: false
            },
            {
              model: DriverTaxiLicense,
              as: 'taxiLicense',
              required: false
            }
          ]
        }
      ]
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    return user;
  }

  /**
   * Update driver
   */
  static async update(id: string, updateData: Partial<User>) {
    const user = await User.findOne({
      where: {
        id,
        role: 'driver'
      }
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    await user.update(updateData);
    return user;
  }

  /**
   * Delete driver
   */
  static async delete(id: string) {
    const user = await User.findOne({
      where: {
        id,
        role: 'driver'
      }
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    await user.destroy();
    return true;
  }
}

