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

// Log database configuration for debugging
console.log('database', {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password
});

// Add network debugging
console.log('🔍 Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Sequelize: Database connection established successfully');
      return;
    } catch (err) {
      console.error(`❌ Sequelize: Unable to connect to database (attempt ${i + 1}/${retries}):`, err);
      
      if (i === retries - 1) {
        console.error('❌ Sequelize: All connection attempts failed');
        throw err;
      }
      
      console.log(`⏳ Retrying database connection in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

connectWithRetry();

// Import model classes and initialization functions
import { User, initUser } from './User.js';
import { UserIdentity, initUserIdentity } from './UserIdentity.js';
import { Phone, initPhone } from './Phone.js';
import { OtpCode, initOtpCode } from './OtpCode.js';
import { DeletionRequest, initDeletionRequest } from './DeletionRequest.js';
import { PushToken, initPushToken } from './PushToken.js';
import { AuditLog, initAuditLog } from './AuditLog.js';
import { DriverProfile, initDriverProfile } from './DriverProfile.js';
import { DriverPassport, initDriverPassport } from './DriverPassport.js';
import { DriverLicense, initDriverLicense } from './DriverLicense.js';
import { EmergencyContact, initEmergencyContact } from './EmergencyContact.js';
import { DriverVehicle, initDriverVehicle } from './DriverVehicle.js';
import { DriverTaxiLicense, initDriverTaxiLicense } from './DriverTaxiLicense.js';

// Initialize all models
initUser(sequelize);
initUserIdentity(sequelize);
initPhone(sequelize);
initOtpCode(sequelize);
initDeletionRequest(sequelize);
initAuditLog(sequelize);
initPushToken(sequelize);
initDriverProfile(sequelize);
initDriverPassport(sequelize);
initDriverLicense(sequelize);
initEmergencyContact(sequelize);
initDriverVehicle(sequelize);
initDriverTaxiLicense(sequelize);

// Define associations
User.hasMany(Phone, { foreignKey: 'user_id', as: 'phones' });
Phone.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(UserIdentity, { foreignKey: 'user_id', as: 'identities' });
UserIdentity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(DeletionRequest, { foreignKey: 'user_id', as: 'deletionRequests' });
DeletionRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PushToken, { foreignKey: 'user_id', as: 'pushTokens' });
PushToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Driver associations
User.hasOne(DriverProfile, { foreignKey: 'user_id', as: 'driverProfile' });
DriverProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

DriverProfile.hasOne(DriverPassport, { foreignKey: 'driver_profile_id', as: 'passport' });
DriverPassport.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

DriverProfile.hasOne(DriverLicense, { foreignKey: 'driver_profile_id', as: 'license' });
DriverLicense.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

DriverProfile.hasMany(EmergencyContact, { foreignKey: 'driver_profile_id', as: 'emergencyContacts' });
EmergencyContact.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

DriverProfile.hasOne(DriverVehicle, { foreignKey: 'driver_profile_id', as: 'vehicle' });
DriverVehicle.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

DriverProfile.hasOne(DriverTaxiLicense, { foreignKey: 'driver_profile_id', as: 'taxiLicense' });
DriverTaxiLicense.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

// Export models and sequelize instance
export {
  sequelize,
  User,
  UserIdentity,
  Phone,
  OtpCode,
  DeletionRequest,
  AuditLog,
  PushToken,
  DriverProfile,
  DriverPassport,
  DriverLicense,
  EmergencyContact,
  DriverVehicle,
  DriverTaxiLicense,
};

export default sequelize;

