'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const SALT_ROUNDS = 10;
    
    // Hash password for default admin users
    const defaultPassword = await bcrypt.hash('UbexGo@2025', SALT_ROUNDS);

    // First, create roles
    const roles = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Main Administrator',
        slug: 'main_admin',
        description: 'Full system access with all permissions',
        permissions: JSON.stringify(['*']), // All permissions as JSONB
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Dispatcher',
        slug: 'dispatcher',
        description: 'Can manage rides and drivers',
        permissions: JSON.stringify(['rides:read', 'rides:write', 'drivers:read', 'drivers:write']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Support',
        slug: 'support',
        description: 'Can view and manage user support requests',
        permissions: JSON.stringify(['users:read', 'support:read', 'support:write']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Manager',
        slug: 'manager',
        description: 'Can view reports and manage operations',
        permissions: JSON.stringify(['reports:read', 'users:read', 'drivers:read', 'rides:read']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access to view data',
        permissions: JSON.stringify(['reports:read', 'users:read', 'drivers:read', 'rides:read']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert roles using raw query to properly handle JSONB
    for (const role of roles) {
      const permissionsJson = typeof role.permissions === 'string' 
        ? role.permissions 
        : JSON.stringify(role.permissions);
      
      await queryInterface.sequelize.query(
        `INSERT INTO roles (id, name, slug, description, permissions, is_active, created_at, updated_at)
         VALUES (uuid_generate_v4(), :name, :slug, :description, :permissions::jsonb, :is_active, :created_at, :updated_at)`,
        {
          replacements: {
            name: role.name,
            slug: role.slug,
            description: role.description,
            permissions: permissionsJson,
            is_active: role.is_active,
            created_at: role.created_at,
            updated_at: role.updated_at
          }
        }
      );
    }
    
    // Get role IDs by slug
    const roleResults = await queryInterface.sequelize.query(
      `SELECT id, slug FROM roles WHERE slug IN ('main_admin', 'dispatcher', 'support', 'manager', 'viewer')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleMap = {};
    roleResults.forEach(role => {
      roleMap[role.slug] = role.id;
    });

    // Insert admin users
    const adminUsers = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        email: 'admin@ubexgo.com',
        password_hash: defaultPassword,
        full_name: 'Main Administrator',
        status: 'active',
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        email: 'dispatcher@ubexgo.com',
        password_hash: defaultPassword,
        full_name: 'Dispatcher User',
        status: 'active',
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        email: 'support@ubexgo.com',
        password_hash: defaultPassword,
        full_name: 'Support User',
        status: 'active',
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        email: 'manager@ubexgo.com',
        password_hash: defaultPassword,
        full_name: 'Manager User',
        status: 'active',
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        email: 'viewer@ubexgo.com',
        password_hash: defaultPassword,
        full_name: 'Viewer User',
        status: 'active',
        created_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('admin_users', adminUsers, {});

    // Get user IDs by email
    const userResults = await queryInterface.sequelize.query(
      `SELECT id, email FROM admin_users WHERE email IN ('admin@ubexgo.com', 'dispatcher@ubexgo.com', 'support@ubexgo.com', 'manager@ubexgo.com', 'viewer@ubexgo.com')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const userMap = {};
    userResults.forEach(user => {
      userMap[user.email] = user.id;
    });

    // Assign roles to users
    const userRoles = [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: userMap['admin@ubexgo.com'],
        role_id: roleMap['main_admin'],
        assigned_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: userMap['dispatcher@ubexgo.com'],
        role_id: roleMap['dispatcher'],
        assigned_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: userMap['support@ubexgo.com'],
        role_id: roleMap['support'],
        assigned_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: userMap['manager@ubexgo.com'],
        role_id: roleMap['manager'],
        assigned_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: userMap['viewer@ubexgo.com'],
        role_id: roleMap['viewer'],
        assigned_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('user_roles', userRoles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_roles', {
      user_id: {
        [Sequelize.Op.in]: await queryInterface.sequelize.query(
          `SELECT id FROM admin_users WHERE email IN ('admin@ubexgo.com', 'dispatcher@ubexgo.com', 'support@ubexgo.com', 'manager@ubexgo.com', 'viewer@ubexgo.com')`,
          { type: Sequelize.QueryTypes.SELECT }
        ).then(results => results.map(r => r.id))
      }
    }, {});

    await queryInterface.bulkDelete('admin_users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@ubexgo.com',
          'dispatcher@ubexgo.com',
          'support@ubexgo.com',
          'manager@ubexgo.com',
          'viewer@ubexgo.com'
        ]
      }
    }, {});

    await queryInterface.bulkDelete('roles', {
      slug: {
        [Sequelize.Op.in]: ['main_admin', 'dispatcher', 'support', 'manager', 'viewer']
      }
    }, {});
  }
};
