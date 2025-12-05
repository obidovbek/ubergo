'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if driver_offers table exists
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'driver_offers'
      );
    `);
    
    const tableExists = results[0].exists;
    
    // If table doesn't exist, skip this migration
    // The create migration will create it with the correct enum values
    if (!tableExists) {
      console.log('driver_offers table does not exist yet, skipping enum update migration');
      return;
    }

    // Step 1: Drop the default value first (it depends on the enum type)
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN status DROP DEFAULT;
    `);

    // Step 2: Convert the enum column to text temporarily so we can update values
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN status TYPE text 
      USING status::text;
    `);

    // Step 3: Update existing records to map old statuses to new ones:
    // - draft, pending_review, approved, published -> published (active offers)
    // - rejected -> cancelled
    // - archived -> archived (stays the same)
    await queryInterface.sequelize.query(`
      UPDATE driver_offers 
      SET status = CASE 
        WHEN status IN ('draft', 'pending_review', 'approved', 'published') THEN 'published'
        WHEN status = 'rejected' THEN 'cancelled'
        WHEN status = 'archived' THEN 'archived'
        ELSE 'published'
      END
    `);

    // Step 4: Drop the old enum type (now safe since default is dropped and column is text)
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_driver_offers_status";
    `);

    // Step 5: Create the new enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_offers_status" AS ENUM (
        'published',
        'archived',
        'cancelled'
      );
    `);

    // Step 6: Convert the column back to the new enum type
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN status TYPE "enum_driver_offers_status" 
      USING status::"enum_driver_offers_status";
    `);

    // Step 7: Set the new default value
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN status SET DEFAULT 'published';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Check if driver_offers table exists
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'driver_offers'
      );
    `);
    
    const tableExists = results[0].exists;
    
    // If table doesn't exist, skip this migration
    if (!tableExists) {
      console.log('driver_offers table does not exist, skipping enum rollback migration');
      return;
    }

    // Step 1: Drop the default value first
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN status DROP DEFAULT;
    `);

    // Step 2: Convert the enum column to text temporarily
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN status TYPE text 
      USING status::text;
    `);

    // Step 3: Map new statuses back to old ones:
    // - published -> draft (most conservative)
    // - cancelled -> rejected
    // - archived -> archived
    await queryInterface.sequelize.query(`
      UPDATE driver_offers 
      SET status = CASE 
        WHEN status = 'published' THEN 'draft'
        WHEN status = 'cancelled' THEN 'rejected'
        WHEN status = 'archived' THEN 'archived'
        ELSE 'draft'
      END
    `);

    // Step 4: Drop the new enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_driver_offers_status";
    `);

    // Step 5: Create the old enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_offers_status" AS ENUM (
        'draft',
        'pending_review',
        'approved',
        'published',
        'rejected',
        'archived'
      );
    `);

    // Step 6: Convert the column back to the old enum type
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN status TYPE "enum_driver_offers_status" 
      USING status::"enum_driver_offers_status";
    `);

    // Step 7: Set the old default value
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN status SET DEFAULT 'draft';
    `);
  }
};

