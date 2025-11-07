'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for admin status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_admin_users_status" AS ENUM ('active', 'inactive', 'suspended');
    `);

    // Create admin_users table
    await queryInterface.createTable('admin_users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      email: {
        type: 'CITEXT',
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password_hash: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      full_name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: 'enum_admin_users_status',
        defaultValue: 'active',
        allowNull: false
      },
      last_login_at: {
        type: 'TIMESTAMPTZ',
        allowNull: true
      },
      last_login_ip: {
        type: Sequelize.INET,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'admin_users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    // Create roles table
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      },
      slug: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      permissions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    // Create user_roles junction table
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'admin_users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'admin_users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('admin_users', ['email'], {
      name: 'idx_admin_users_email',
      unique: true
    });
    await queryInterface.addIndex('admin_users', ['status'], {
      name: 'idx_admin_users_status'
    });
    await queryInterface.addIndex('admin_users', ['created_by'], {
      name: 'idx_admin_users_created_by'
    });

    await queryInterface.addIndex('roles', ['slug'], {
      name: 'idx_roles_slug',
      unique: true
    });
    await queryInterface.addIndex('roles', ['name'], {
      name: 'idx_roles_name',
      unique: true
    });
    await queryInterface.addIndex('roles', ['is_active'], {
      name: 'idx_roles_is_active'
    });

    await queryInterface.addIndex('user_roles', ['user_id'], {
      name: 'idx_user_roles_user_id'
    });
    await queryInterface.addIndex('user_roles', ['role_id'], {
      name: 'idx_user_roles_role_id'
    });
    await queryInterface.addIndex('user_roles', ['user_id', 'role_id'], {
      name: 'idx_user_roles_user_role',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('admin_users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_users_status";');
  }
};
