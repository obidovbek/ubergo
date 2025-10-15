/**
 * User Model
 * Database operations for users
 */

import { pool } from '../config/database';
import { User, UserDTO } from '../types';
import { UserRole, UserStatus } from '../constants';

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findAll(
    limit: number,
    offset: number,
    filters?: { role?: UserRole; status?: UserStatus }
  ): Promise<{ users: User[]; total: number }> {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.role) {
      query += ` AND role = $${paramCount}`;
      params.push(filters.role);
      paramCount++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query('SELECT COUNT(*) FROM users WHERE 1=1'),
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  static async create(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.name,
        userData.email,
        userData.phone,
        userData.password,
        userData.role || UserRole.USER,
        UserStatus.ACTIVE,
      ]
    );
    return result.rows[0];
  }

  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
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

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static toDTO(user: User): UserDTO {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

