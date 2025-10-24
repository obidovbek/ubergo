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

// Import model classes and initialization functions
import { User, initUser } from './User.js';
import { UserIdentity, initUserIdentity } from './UserIdentity.js';
import { Phone, initPhone } from './Phone.js';
import { OtpCode, initOtpCode } from './OtpCode.js';
import { DeletionRequest, initDeletionRequest } from './DeletionRequest.js';
import { AuditLog, initAuditLog } from './AuditLog.js';

// Initialize all models
initUser(sequelize);
initUserIdentity(sequelize);
initPhone(sequelize);
initOtpCode(sequelize);
initDeletionRequest(sequelize);
initAuditLog(sequelize);

// Define associations
User.hasMany(Phone, { foreignKey: 'user_id', as: 'phones' });
Phone.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(UserIdentity, { foreignKey: 'user_id', as: 'identities' });
UserIdentity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(DeletionRequest, { foreignKey: 'user_id', as: 'deletionRequests' });
DeletionRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Export models and sequelize instance
export {
  sequelize,
  User,
  UserIdentity,
  Phone,
  OtpCode,
  DeletionRequest,
  AuditLog,
};

export default sequelize;

