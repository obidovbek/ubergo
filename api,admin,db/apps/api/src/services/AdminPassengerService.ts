/**
 * Admin Passenger Service
 * Business logic for managing regular users (passengers)
 */

import { 
  User, 
  Phone, 
  UserIdentity, 
  PushToken, 
  OtpCode,
  DeletionRequest 
} from '../database/models/index.js';
import { Op } from 'sequelize';
import { NotFoundError } from '../errors/AppError.js';
import { ErrorMessages as ERROR_MESSAGES } from '../constants/index.js';

export class AdminPassengerService {
  /**
   * Get all passengers (users with role='user' or 'driver')
   * Note: Drivers are included because they were originally passengers who registered in the user app
   */
  static async getAll(
    page: number = 1,
    pageSize: number = 25,
    filters?: { status?: string; search?: string }
  ) {
    const offset = (page - 1) * pageSize;
    // Include both 'user' and 'driver' roles since drivers were originally passengers
    // Users who registered in user app should show in passengers list even if they later became drivers
    const where: any = {
      role: { [Op.in]: ['user', 'driver'] }
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
      attributes: [
        'id',
        'phone_e164',
        'email',
        'display_name',
        'first_name',
        'last_name',
        'father_name',
        'gender',
        'birth_date',
        'status',
        'is_verified',
        'profile_complete',
        'role',
        'created_at',
        'updated_at'
      ],
      include: [
        {
          model: Phone,
          as: 'phones',
          required: false
        }
      ]
    });

    // Log for debugging
    console.log(`[AdminPassengerService] Found ${total} passengers (page ${page}, pageSize ${pageSize})`);
    if (users.length > 0) {
      console.log(`[AdminPassengerService] Sample passenger:`, {
        id: users[0].id,
        phone: users[0].phone_e164,
        role: users[0].role,
        status: users[0].status
      });
    }

    return {
      passengers: users,
      total,
      page,
      pageSize
    };
  }

  /**
   * Get passenger by ID with all related data
   */
  static async getById(id: string) {
    const user = await User.findOne({
      where: {
        id,
        role: { [Op.in]: ['user', 'driver'] } // Include drivers since they were originally passengers
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
          model: DeletionRequest,
          as: 'deletionRequests',
          required: false,
          order: [['requested_at', 'DESC']]
        }
      ]
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    return user;
  }

  /**
   * Update passenger
   */
  static async update(id: string, updateData: Partial<User>) {
    const user = await User.findOne({
      where: {
        id,
        role: { [Op.in]: ['user', 'driver'] } // Include drivers since they were originally passengers
      }
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    await user.update(updateData);
    return user;
  }

  /**
   * Update passenger status
   */
  static async updateStatus(id: string, status: 'active' | 'blocked' | 'pending_delete') {
    const user = await User.findOne({
      where: {
        id,
        role: { [Op.in]: ['user', 'driver'] } // Include drivers since they were originally passengers
      }
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    await user.update({ status });
    return user;
  }

  /**
   * Delete passenger
   */
  static async delete(id: string) {
    const user = await User.findOne({
      where: {
        id,
        role: { [Op.in]: ['user', 'driver'] } // Include drivers since they were originally passengers
      }
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    await user.destroy();
    return true;
  }
}

