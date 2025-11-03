'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add profile fields to users table
    await queryInterface.addColumn('users', 'first_name', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'last_name', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'father_name', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.ENUM('male', 'female', 'other'),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'birth_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'additional_phones', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('users', 'promo_code', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'referral_id', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'profile_complete', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove profile fields from users table
    await queryInterface.removeColumn('users', 'first_name');
    await queryInterface.removeColumn('users', 'last_name');
    await queryInterface.removeColumn('users', 'father_name');
    await queryInterface.removeColumn('users', 'gender');
    await queryInterface.removeColumn('users', 'birth_date');
    await queryInterface.removeColumn('users', 'additional_phones');
    await queryInterface.removeColumn('users', 'promo_code');
    await queryInterface.removeColumn('users', 'referral_id');
    await queryInterface.removeColumn('users', 'profile_complete');
    
    // Drop the gender enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_gender";');
  }
};

