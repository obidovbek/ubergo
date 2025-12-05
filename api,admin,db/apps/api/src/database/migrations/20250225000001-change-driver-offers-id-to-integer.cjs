'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Drop foreign key constraint from driver_offer_stops
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offer_stops 
      DROP CONSTRAINT IF EXISTS driver_offer_stops_offer_id_fkey;
    `);

    // Step 2: Drop the primary key constraint on driver_offers.id
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      DROP CONSTRAINT IF EXISTS driver_offers_pkey;
    `);

    // Step 3: Change driver_offer_stops.offer_id from UUID to INTEGER
    // First, we need to handle existing data - if there's data, we'll need to clear it
    // or create a mapping. For now, we'll assume the table can be cleared or is empty.
    await queryInterface.sequelize.query(`
      -- Clear existing stops if any (since we can't map UUIDs to integers)
      TRUNCATE TABLE driver_offer_stops;
    `);

    // Change the column type to INTEGER
    // Since we truncated, we can safely change the type
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offer_stops 
      ALTER COLUMN offer_id TYPE INTEGER USING NULL;
    `);

    // Step 4: Change driver_offers.id from UUID to INTEGER with auto-increment
    // Since we can't directly convert UUID to INTEGER, we'll:
    // 1. Create a new temporary INTEGER column
    // 2. Populate it with sequence numbers
    // 3. Drop the old UUID column
    // 4. Rename the new column to id
    // 5. Set it as primary key with auto-increment

    await queryInterface.sequelize.query(`
      -- Create a new INTEGER column
      ALTER TABLE driver_offers 
      ADD COLUMN id_new INTEGER;
    `);

    // Populate with sequence numbers based on created_at (or random order if no created_at)
    await queryInterface.sequelize.query(`
      -- Create a sequence for the new IDs
      CREATE SEQUENCE IF NOT EXISTS driver_offers_id_seq;
      
      -- Populate the new column with sequential numbers
      WITH ordered_offers AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as rn
        FROM driver_offers
      )
      UPDATE driver_offers 
      SET id_new = ordered_offers.rn
      FROM ordered_offers
      WHERE driver_offers.id = ordered_offers.id;
      
      -- Set the sequence to start from max value + 1
      SELECT setval('driver_offers_id_seq', COALESCE((SELECT MAX(id_new) FROM driver_offers), 0) + 1, false);
    `);

    // Drop the old UUID column
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      DROP COLUMN id;
    `);

    // Rename the new column to id
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      RENAME COLUMN id_new TO id;
    `);

    // Set as primary key and make it auto-increment
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      ALTER COLUMN id SET NOT NULL,
      ALTER COLUMN id SET DEFAULT nextval('driver_offers_id_seq'),
      ADD PRIMARY KEY (id);
    `);


    // Step 5: Set offer_id as NOT NULL and recreate foreign key constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offer_stops 
      ALTER COLUMN offer_id SET NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offer_stops 
      ADD CONSTRAINT driver_offer_stops_offer_id_fkey 
      FOREIGN KEY (offer_id) 
      REFERENCES driver_offers(id) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Reverse the migration: change back to UUID
    
    // Step 1: Drop foreign key constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offer_stops 
      DROP CONSTRAINT IF EXISTS driver_offer_stops_offer_id_fkey;
    `);

    // Step 2: Drop primary key
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offers 
      DROP CONSTRAINT IF EXISTS driver_offers_pkey;
    `);

    // Step 3: Change driver_offers.id back to UUID
    await queryInterface.sequelize.query(`
      -- Create new UUID column
      ALTER TABLE driver_offers 
      ADD COLUMN id_new UUID DEFAULT uuid_generate_v4();
    `);

    await queryInterface.sequelize.query(`
      -- Drop old INTEGER column
      ALTER TABLE driver_offers 
      DROP COLUMN id;
    `);

    await queryInterface.sequelize.query(`
      -- Rename new column
      ALTER TABLE driver_offers 
      RENAME COLUMN id_new TO id;
    `);

    await queryInterface.sequelize.query(`
      -- Set as primary key
      ALTER TABLE driver_offers 
      ALTER COLUMN id SET NOT NULL,
      ADD PRIMARY KEY (id);
    `);

    // Step 4: Change driver_offer_stops.offer_id back to UUID
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offer_stops 
      ALTER COLUMN offer_id TYPE UUID USING NULL;
    `);

    // Step 5: Recreate foreign key (note: data will be lost since we can't map back)
    await queryInterface.sequelize.query(`
      ALTER TABLE driver_offer_stops 
      ADD CONSTRAINT driver_offer_stops_offer_id_fkey 
      FOREIGN KEY (offer_id) 
      REFERENCES driver_offers(id) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
    `);

    // Drop the sequence
    await queryInterface.sequelize.query(`
      DROP SEQUENCE IF EXISTS driver_offers_id_seq;
    `);
  }
};

