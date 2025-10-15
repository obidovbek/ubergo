/**
 * Sequelize Models Index
 * Initializes Sequelize and exports all models
 */

import { Sequelize } from 'sequelize';
import { config } from '../../config/index.js';

// Initialize Sequelize
const sequelize = new Sequelize({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  dialect: 'postgres',
  logging: config.server.env === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Sequelize: Database connection established successfully');
  })
  .catch((err) => {
    console.error('❌ Sequelize: Unable to connect to database:', err);
  });

// Import models


// Export models and sequelize instance
export {
  sequelize,
};

export default sequelize;

