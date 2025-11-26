'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Starting UUID to INTEGER conversion migration...');

      // Step 1: Create temporary mapping tables
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS _user_id_mapping (
          old_id UUID PRIMARY KEY,
          new_id INTEGER
        );
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE SEQUENCE IF NOT EXISTS _user_id_seq START 1;
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS _driver_profile_id_mapping (
          old_id UUID PRIMARY KEY,
          new_id INTEGER
        );
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE SEQUENCE IF NOT EXISTS _driver_profile_id_seq START 1;
      `, { transaction });

      // Step 2: Populate user ID mappings (preserve order by created_at)
      await queryInterface.sequelize.query(`
        INSERT INTO _user_id_mapping (old_id, new_id)
        SELECT id, nextval('_user_id_seq')
        FROM users 
        ORDER BY created_at ASC;
      `, { transaction });

      // Step 3: Populate driver profile ID mappings
      await queryInterface.sequelize.query(`
        INSERT INTO _driver_profile_id_mapping (old_id, new_id)
        SELECT id, nextval('_driver_profile_id_seq')
        FROM driver_profiles 
        ORDER BY created_at ASC;
      `, { transaction });

      // Step 4: Drop all foreign key constraints that reference users.id
      console.log('Dropping foreign key constraints...');
      
      // Drop FK constraints on user_id columns
      const userFkTables = [
        { name: 'phones', nullable: false },
        { name: 'user_identities', nullable: false },
        { name: 'deletion_requests', nullable: false },
        { name: 'audit_logs', nullable: true }, // audit_logs.user_id is nullable
        { name: 'push_tokens', nullable: false },
        { name: 'driver_profiles', nullable: false }
      ];

      for (const table of userFkTables) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE ${table.name} 
            DROP CONSTRAINT IF EXISTS ${table.name}_user_id_fkey;
          `, { transaction });
        } catch (error) {
          console.log(`Warning: Could not drop FK constraint on ${table.name}.user_id:`, error.message);
        }
      }

      // Drop FK constraints on driver_profile_id columns
      const driverProfileFkTables = [
        'driver_passports',
        'driver_licenses',
        'emergency_contacts',
        'driver_vehicles',
        'driver_taxi_licenses'
      ];

      for (const table of driverProfileFkTables) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE ${table} 
            DROP CONSTRAINT IF EXISTS ${table}_driver_profile_id_fkey;
          `, { transaction });
        } catch (error) {
          console.log(`Warning: Could not drop FK constraint on ${table}.driver_profile_id:`, error.message);
        }
      }

      // Step 5: Update all foreign key columns first (convert UUID to INTEGER)
      console.log('Updating foreign key columns...');

      // Update user_id columns
      for (const table of userFkTables) {
        if (table.name === 'users') continue; // Skip users table itself
        
        try {
          // Always create column as nullable first to handle orphaned records
          await queryInterface.sequelize.query(`
            ALTER TABLE ${table.name}
            ADD COLUMN IF NOT EXISTS user_id_new INTEGER;
          `, { transaction });

          if (table.nullable) {
            // For nullable columns, handle both non-NULL and NULL values
            await queryInterface.sequelize.query(`
              UPDATE ${table.name} t
              SET user_id_new = m.new_id
              FROM _user_id_mapping m
              WHERE t.user_id::text = m.old_id::text
              AND t.user_id IS NOT NULL;
            `, { transaction });

            // Keep NULL values as NULL
            await queryInterface.sequelize.query(`
              UPDATE ${table.name}
              SET user_id_new = NULL
              WHERE user_id IS NULL;
            `, { transaction });
          } else {
            // For non-nullable columns, update with mapping
            await queryInterface.sequelize.query(`
              UPDATE ${table.name} t
              SET user_id_new = m.new_id
              FROM _user_id_mapping m
              WHERE t.user_id::text = m.old_id::text;
            `, { transaction });

            // Delete orphaned records (user_id not in users table)
            // These are invalid and should be removed
            const orphanedResult = await queryInterface.sequelize.query(`
              SELECT COUNT(*) as count
              FROM ${table.name}
              WHERE user_id_new IS NULL
              AND user_id IS NOT NULL;
            `, { transaction, type: Sequelize.QueryTypes.SELECT });

            const orphanedCount = orphanedResult && orphanedResult[0] ? parseInt(orphanedResult[0].count) : 0;
            if (orphanedCount > 0) {
              console.log(`Warning: Found ${orphanedCount} orphaned records in ${table.name} (user_id not in users table). Deleting them...`);
              await queryInterface.sequelize.query(`
                DELETE FROM ${table.name}
                WHERE user_id_new IS NULL
                AND user_id IS NOT NULL;
              `, { transaction });
            }

            // Verify no NULL values remain for non-nullable columns
            // This should not happen if data integrity is maintained, but check anyway
            const nullCheckResult = await queryInterface.sequelize.query(`
              SELECT COUNT(*) as count
              FROM ${table.name}
              WHERE user_id_new IS NULL;
            `, { transaction, type: Sequelize.QueryTypes.SELECT });

            const nullCount = nullCheckResult && nullCheckResult[0] ? parseInt(nullCheckResult[0].count) : 0;
            if (nullCount > 0) {
              throw new Error(`${table.name} has ${nullCount} records with NULL user_id_new, but this column is not nullable. Data integrity issue detected.`);
            }
          }

          await queryInterface.sequelize.query(`
            ALTER TABLE ${table.name}
            DROP COLUMN IF EXISTS user_id;
          `, { transaction });

          await queryInterface.sequelize.query(`
            ALTER TABLE ${table.name}
            RENAME COLUMN user_id_new TO user_id;
          `, { transaction });

          // Only set NOT NULL if the column is not nullable
          if (!table.nullable) {
            await queryInterface.sequelize.query(`
              ALTER TABLE ${table.name}
              ALTER COLUMN user_id SET NOT NULL;
            `, { transaction });
          }
        } catch (error) {
          console.error(`Error updating ${table.name}.user_id:`, error.message);
          throw error; // Re-throw to trigger rollback
        }
      }

      // Update driver_profile_id columns
      for (const table of driverProfileFkTables) {
        try {
          // Always create column as nullable first to handle orphaned records
          await queryInterface.sequelize.query(`
            ALTER TABLE ${table}
            ADD COLUMN IF NOT EXISTS driver_profile_id_new INTEGER;
          `, { transaction });

          await queryInterface.sequelize.query(`
            UPDATE ${table} t
            SET driver_profile_id_new = m.new_id
            FROM _driver_profile_id_mapping m
            WHERE t.driver_profile_id::text = m.old_id::text;
          `, { transaction });

          // Delete orphaned records (driver_profile_id not in driver_profiles table)
          // These are invalid and should be removed
          const orphanedResult = await queryInterface.sequelize.query(`
            SELECT COUNT(*) as count
            FROM ${table}
            WHERE driver_profile_id_new IS NULL
            AND driver_profile_id IS NOT NULL;
          `, { transaction, type: Sequelize.QueryTypes.SELECT });

          const orphanedCount = orphanedResult && orphanedResult[0] ? parseInt(orphanedResult[0].count) : 0;
          if (orphanedCount > 0) {
            console.log(`Warning: Found ${orphanedCount} orphaned records in ${table} (driver_profile_id not in driver_profiles table). Deleting them...`);
            await queryInterface.sequelize.query(`
              DELETE FROM ${table}
              WHERE driver_profile_id_new IS NULL
              AND driver_profile_id IS NOT NULL;
            `, { transaction });
          }

          // Verify no NULL values remain (driver_profile_id should always be NOT NULL)
          const nullCheckResult = await queryInterface.sequelize.query(`
            SELECT COUNT(*) as count
            FROM ${table}
            WHERE driver_profile_id_new IS NULL;
          `, { transaction, type: Sequelize.QueryTypes.SELECT });

          const nullCount = nullCheckResult && nullCheckResult[0] ? parseInt(nullCheckResult[0].count) : 0;
          if (nullCount > 0) {
            throw new Error(`${table} has ${nullCount} records with NULL driver_profile_id_new. Data integrity issue detected.`);
          }

          await queryInterface.sequelize.query(`
            ALTER TABLE ${table}
            DROP COLUMN IF EXISTS driver_profile_id;
          `, { transaction });

          await queryInterface.sequelize.query(`
            ALTER TABLE ${table}
            RENAME COLUMN driver_profile_id_new TO driver_profile_id;
          `, { transaction });

          await queryInterface.sequelize.query(`
            ALTER TABLE ${table}
            ALTER COLUMN driver_profile_id SET NOT NULL;
          `, { transaction });
        } catch (error) {
          console.log(`Warning: Error updating ${table}.driver_profile_id:`, error.message);
        }
      }

      // Step 6: Update primary key columns
      console.log('Updating primary key columns...');

      // Update users.id
      await queryInterface.sequelize.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS id_new INTEGER;
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE users u
        SET id_new = m.new_id
        FROM _user_id_mapping m
        WHERE u.id::text = m.old_id::text;
      `, { transaction });

      // Drop primary key constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE users
        DROP CONSTRAINT IF EXISTS users_pkey;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE users
        DROP COLUMN IF EXISTS id;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE users
        RENAME COLUMN id_new TO id;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE users
        ALTER COLUMN id SET NOT NULL;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE users
        ADD PRIMARY KEY (id);
      `, { transaction });

      // Create sequence for users.id
      await queryInterface.sequelize.query(`
        CREATE SEQUENCE IF NOT EXISTS users_id_seq OWNED BY users.id;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE users
        ALTER COLUMN id SET DEFAULT nextval('users_id_seq');
      `, { transaction });

      // Update driver_profiles.id
      await queryInterface.sequelize.query(`
        ALTER TABLE driver_profiles
        ADD COLUMN IF NOT EXISTS id_new INTEGER;
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE driver_profiles dp
        SET id_new = m.new_id
        FROM _driver_profile_id_mapping m
        WHERE dp.id::text = m.old_id::text;
      `, { transaction });

      // Drop primary key constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE driver_profiles
        DROP CONSTRAINT IF EXISTS driver_profiles_pkey;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE driver_profiles
        DROP COLUMN IF EXISTS id;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE driver_profiles
        RENAME COLUMN id_new TO id;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE driver_profiles
        ALTER COLUMN id SET NOT NULL;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE driver_profiles
        ADD PRIMARY KEY (id);
      `, { transaction });

      // Create sequence for driver_profiles.id
      await queryInterface.sequelize.query(`
        CREATE SEQUENCE IF NOT EXISTS driver_profiles_id_seq OWNED BY driver_profiles.id;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE driver_profiles
        ALTER COLUMN id SET DEFAULT nextval('driver_profiles_id_seq');
      `, { transaction });

      // Step 7: Recreate foreign key constraints
      console.log('Recreating foreign key constraints...');

      // Recreate user_id foreign keys
      for (const table of userFkTables) {
        if (table.name === 'users') continue;
        
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE ${table.name}
            ADD CONSTRAINT ${table.name}_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE ON UPDATE CASCADE;
          `, { transaction });
        } catch (error) {
          console.log(`Warning: Could not recreate FK constraint on ${table.name}.user_id:`, error.message);
        }
      }

      // Recreate driver_profile_id foreign keys
      for (const table of driverProfileFkTables) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE ${table}
            ADD CONSTRAINT ${table}_driver_profile_id_fkey
            FOREIGN KEY (driver_profile_id) REFERENCES driver_profiles(id)
            ON DELETE CASCADE ON UPDATE CASCADE;
          `, { transaction });
        } catch (error) {
          console.log(`Warning: Could not recreate FK constraint on ${table}.driver_profile_id:`, error.message);
        }
      }

      // Step 8: Update sequences to continue from max ID
      await queryInterface.sequelize.query(`
        SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
      `, { transaction });

      await queryInterface.sequelize.query(`
        SELECT setval('driver_profiles_id_seq', COALESCE((SELECT MAX(id) FROM driver_profiles), 1), true);
      `, { transaction });

      // Step 9: Clean up temporary mapping tables and sequences
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS _user_id_mapping;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP SEQUENCE IF EXISTS _user_id_seq;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS _driver_profile_id_mapping;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP SEQUENCE IF EXISTS _driver_profile_id_seq;
      `, { transaction });

      await transaction.commit();
      console.log('UUID to INTEGER conversion completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed, rolling back:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a complex migration to reverse
    // For safety, we'll just log a warning
    console.warn('DOWN migration for UUID to INTEGER conversion is not implemented.');
    console.warn('This is a destructive migration that cannot be easily reversed.');
    console.warn('If you need to reverse this, you would need to restore from a backup.');
    throw new Error('DOWN migration not implemented - restore from backup if needed');
  }
};

