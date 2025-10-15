/**
 * User Service
 * Business logic for user operations
 */

import { UserModel } from '../models/User';
import { UserDTO, PaginationParams } from '../types';
import { UserRole, UserStatus } from '../constants';
import { NotFoundError } from '../errors/AppError';
import { ERROR_MESSAGES } from '../constants';

export class UserService {
  static async getUsers(
    pagination: PaginationParams,
    filters?: { role?: UserRole; status?: UserStatus }
  ): Promise<{ users: UserDTO[]; total: number }> {
    const { users, total } = await UserModel.findAll(
      pagination.limit,
      pagination.offset,
      filters
    );

    return {
      users: users.map(UserModel.toDTO),
      total,
    };
  }

  static async getUserById(id: string): Promise<UserDTO> {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return UserModel.toDTO(user);
  }

  static async updateUser(
    id: string,
    updateData: Partial<UserDTO>
  ): Promise<UserDTO> {
    const user = await UserModel.update(id, updateData);
    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return UserModel.toDTO(user);
  }

  static async deleteUser(id: string): Promise<void> {
    const deleted = await UserModel.delete(id);
    if (!deleted) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }
}

