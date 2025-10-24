'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for phone labels
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_phones_label" AS ENUM ('primary', 'trusted', 'extra');
    `);

    // Create phones table
    await queryInterface.createTable('phones', {
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
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      label: {
        type: 'enum_phones_label',
        defaultValue: 'extra',
        allowNull: false
      },
      e164: {
        type: 'CITEXT',
        allowNull: false
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    // Create unique constraint on user_id + e164
    await queryInterface.addConstraint('phones', {
      fields: ['user_id', 'e164'],
      type: 'unique',
      name: 'uniq_user_phone'
    });

    // Create index on user_id
    await queryInterface.addIndex('phones', ['user_id'], {
      name: 'idx_phones_user_id'
    });

    // Create index on e164
    await queryInterface.addIndex('phones', ['e164'], {
      name: 'idx_phones_e164'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('phones');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_phones_label";');
  }
};

