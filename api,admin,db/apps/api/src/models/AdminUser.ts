/**
 * Admin User Model
 * Database operations for admin users
 */

import { pool } from '../config/database.js';
import type { AdminUserDTO } from '../types/index.js';

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login_at?: Date | null;
  last_login_ip?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  permissions?: string[] | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AdminUserModel {
  static async findById(id: string, includeRoles: boolean = true): Promise<any> {
    if (includeRoles) {
      const result = await pool.query(
        `SELECT 
          au.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', r.id,
                'name', r.name,
                'slug', r.slug,
                'description', r.description,
                'permissions', r.permissions,
                'is_active', r.is_active
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) as roles
        FROM admin_users au
        LEFT JOIN user_roles ur ON au.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = true
        WHERE au.id = $1
        GROUP BY au.id`,
        [id]
      );
      return result.rows[0] || null;
    } else {
      const result = await pool.query(
        'SELECT * FROM admin_users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    }
  }

  static async findByEmail(email: string, includeRoles: boolean = true): Promise<any> {
    if (includeRoles) {
      const result = await pool.query(
        `SELECT 
          au.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', r.id,
                'name', r.name,
                'slug', r.slug,
                'description', r.description,
                'permissions', r.permissions,
                'is_active', r.is_active
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) as roles
        FROM admin_users au
        LEFT JOIN user_roles ur ON au.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = true
        WHERE au.email = $1
        GROUP BY au.id`,
        [email]
      );
      return result.rows[0] || null;
    } else {
      const result = await pool.query(
        'SELECT * FROM admin_users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    }
  }

  static async findAll(
    limit: number,
    offset: number,
    filters?: { role?: string; status?: string }
  ): Promise<{ adminUsers: AdminUser[]; total: number }> {
    let query = `SELECT 
      au.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', r.id,
            'name', r.name,
            'slug', r.slug,
            'description', r.description,
            'permissions', r.permissions,
            'is_active', r.is_active
          )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) as roles
    FROM admin_users au
    LEFT JOIN user_roles ur ON au.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = true
    WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.role) {
      query += ` AND EXISTS (
        SELECT 1 FROM user_roles ur2
        JOIN roles r2 ON ur2.role_id = r2.id
        WHERE ur2.user_id = au.id AND r2.slug = $${paramCount}
      )`;
      params.push(filters.role);
      paramCount++;
    }

    if (filters?.status) {
      query += ` AND au.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    query += ` GROUP BY au.id ORDER BY au.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query('SELECT COUNT(*) FROM admin_users WHERE 1=1'),
    ]);

    return {
      adminUsers: usersResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  static async create(adminUserData: {
    email: string;
    password_hash: string;
    full_name: string;
    role_slugs?: string[];
    created_by?: string | null;
  }): Promise<AdminUser> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert admin user
      const userResult = await client.query(
        `INSERT INTO admin_users (email, password_hash, full_name, status, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          adminUserData.email,
          adminUserData.password_hash,
          adminUserData.full_name,
          'active',
          adminUserData.created_by || null,
        ]
      );

      const user = userResult.rows[0];

      // Assign roles if provided
      if (adminUserData.role_slugs && adminUserData.role_slugs.length > 0) {
        const roleResult = await client.query(
          `SELECT id FROM roles WHERE slug = ANY($1::text[]) AND is_active = true`,
          [adminUserData.role_slugs]
        );

        for (const role of roleResult.rows) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id, assigned_by)
             VALUES ($1, $2, $3)`,
            [user.id, role.id, adminUserData.created_by || null]
          );
        }
      }

      await client.query('COMMIT');

      // Fetch user with roles
      return await this.findById(user.id, true);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id: string, adminUserData: Partial<AdminUser>): Promise<AdminUser | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(adminUserData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0] || null;
  }

  static async updateLastLogin(id: string, ip?: string): Promise<void> {
    await pool.query(
      `UPDATE admin_users 
       SET last_login_at = NOW(), last_login_ip = $1, updated_at = NOW()
       WHERE id = $2`,
      [ip || null, id]
    );
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static toDTO(adminUser: any): AdminUserDTO {
    const { password_hash, roles, ...adminUserWithoutPassword } = adminUser;
    
    // Parse roles - handle both JSON string and array formats
    let rolesArray: any[] = [];
    if (roles) {
      if (Array.isArray(roles)) {
        rolesArray = roles;
      } else if (typeof roles === 'string') {
        try {
          rolesArray = JSON.parse(roles);
        } catch (e) {
          console.error('Error parsing roles JSON:', e);
          rolesArray = [];
        }
      }
    }
    
    // Filter out null roles (from LEFT JOIN)
    rolesArray = rolesArray.filter(r => r && r.id);
    
    return {
      id: adminUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
      roles: rolesArray,
      status: adminUser.status,
      last_login_at: adminUser.last_login_at,
      created_at: adminUser.created_at,
      updated_at: adminUser.updated_at,
    };
  }
}

