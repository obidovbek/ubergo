'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_countries_pattern" AS ENUM ('uz', 'ru', 'generic');
    `);

    await queryInterface.createTable('countries', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(8),
        allowNull: false,
      },
      flag: {
        type: Sequelize.STRING(8),
        allowNull: true,
      },
      local_length: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      pattern: {
        type: 'enum_countries_pattern',
        allowNull: false,
        defaultValue: 'generic',
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('countries', ['code'], {
      name: 'idx_countries_code',
    });

    await queryInterface.addIndex('countries', ['is_active'], {
      name: 'idx_countries_is_active',
    });

    await queryInterface.addIndex('countries', ['sort_order'], {
      name: 'idx_countries_sort_order',
    });

    const now = new Date();
    await queryInterface.bulkInsert('countries', [
      {
        name: "O'zbekiston",
        code: '+998',
        flag: '🇺🇿',
        local_length: 9,
        pattern: 'uz',
        sort_order: 10,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Rossiya',
        code: '+7',
        flag: '🇷🇺',
        local_length: 10,
        pattern: 'ru',
        sort_order: 20,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Qozogiston',
        code: '+7',
        flag: '🇰🇿',
        local_length: 10,
        pattern: 'ru',
        sort_order: 30,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Qirg'iziston",
        code: '+996',
        flag: '🇰🇬',
        local_length: 9,
        pattern: 'generic',
        sort_order: 40,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Tojikiston',
        code: '+992',
        flag: '🇹🇯',
        local_length: 9,
        pattern: 'generic',
        sort_order: 50,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('countries', null, {});
    await queryInterface.dropTable('countries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_countries_pattern";');
  },
};


