/**
 * Admin User Service
 * Business logic for admin user management
 */

import { AdminUserModel } from '../models/AdminUser.js';
import { hashPassword } from '../utils/password.js';
import { pool } from '../config/database.js';
import type { AdminUserDTO } from '../types/index.js';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export class AdminUserService {
  static async getAll(
    page: number = 1,
    pageSize: number = 25,
    filters?: { role?: string; status?: string }
  ): Promise<{ adminUsers: AdminUserDTO[]; total: number; page: number; pageSize: number }> {
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    const result = await AdminUserModel.findAll(limit, offset, filters);

    return {
      adminUsers: result.adminUsers.map(AdminUserModel.toDTO),
      total: result.total,
      page,
      pageSize,
    };
  }

  static async getById(id: string): Promise<AdminUserDTO> {
    const adminUser = await AdminUserModel.findById(id, true);
    if (!adminUser) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return AdminUserModel.toDTO(adminUser);
  }

  static async create(data: {
    email: string;
    password: string;
    full_name: string;
    role_slugs?: string[];
    status?: 'active' | 'inactive' | 'suspended';
    created_by?: string;
  }): Promise<AdminUserDTO> {
    // Check if admin user already exists
    const existingAdmin = await AdminUserModel.findByEmail(data.email, false);
    if (existingAdmin) {
      throw new ConflictError(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create admin user
    const adminUser = await AdminUserModel.create({
      email: data.email,
      password_hash: hashedPassword,
      full_name: data.full_name,
      role_slugs: data.role_slugs || [],
      created_by: data.created_by || null,
    });

    return AdminUserModel.toDTO(adminUser);
  }

  static async update(
    id: string,
    data: {
      email?: string;
      password?: string;
      full_name?: string;
      role_slugs?: string[];
      status?: 'active' | 'inactive' | 'suspended';
    }
  ): Promise<AdminUserDTO> {
    const adminUser = await AdminUserModel.findById(id, false);
    if (!adminUser) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if email is being changed and if it already exists
    if (data.email && data.email !== adminUser.email) {
      const existingAdmin = await AdminUserModel.findByEmail(data.email, false);
      if (existingAdmin) {
        throw new ConflictError(ERROR_MESSAGES.USER_ALREADY_EXISTS);
      }
    }

    const updateData: any = {};

    if (data.full_name !== undefined) {
      updateData.full_name = data.full_name;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.email) {
      updateData.email = data.email;
    }

    if (data.password) {
      updateData.password_hash = await hashPassword(data.password);
    }

    // Update admin user
    const updatedUser = await AdminUserModel.update(id, updateData);

    if (!updatedUser) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Handle role updates if provided
    if (data.role_slugs !== undefined) {
      // Delete existing roles
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

      // Add new roles
      if (data.role_slugs.length > 0) {
        const roleResult = await pool.query(
          `SELECT id FROM roles WHERE slug = ANY($1::text[]) AND is_active = true`,
          [data.role_slugs]
        );

        for (const role of roleResult.rows) {
          await pool.query(
            `INSERT INTO user_roles (user_id, role_id, assigned_by)
             VALUES ($1, $2, $3)`,
            [id, role.id, null] // assigned_by can be null for updates
          );
        }
      }
    }

    // Fetch updated user with roles
    const userWithRoles = await AdminUserModel.findById(id, true);
    return AdminUserModel.toDTO(userWithRoles);
  }

  static async delete(id: string): Promise<void> {
    const adminUser = await AdminUserModel.findById(id, false);
    if (!adminUser) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const deleted = await AdminUserModel.delete(id);
    if (!deleted) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }
}

