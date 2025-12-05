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
import { AdminUser, initAdminUser } from './AdminUser.js';
import { Role, initRole } from './Role.js';
import { UserRole, initUserRole } from './UserRole.js';
import { Country, initCountry } from './Country.js';
import { GeoCountry, initGeoCountry } from './GeoCountry.js';
import { GeoProvince, initGeoProvince } from './GeoProvince.js';
import { GeoCityDistrict, initGeoCityDistrict } from './GeoCityDistrict.js';
import { GeoAdministrativeArea, initGeoAdministrativeArea } from './GeoAdministrativeArea.js';
import { GeoSettlement, initGeoSettlement } from './GeoSettlement.js';
import { GeoNeighborhood, initGeoNeighborhood } from './GeoNeighborhood.js';
import { VehicleMake, initVehicleMake } from './VehicleMake.js';
import { VehicleModel, initVehicleModel } from './VehicleModel.js';
import { VehicleBodyType, initVehicleBodyType } from './VehicleBodyType.js';
import { VehicleColor, initVehicleColor } from './VehicleColor.js';
import { VehicleType, initVehicleType } from './VehicleType.js';
import { AppStoreUrl, initAppStoreUrl } from './AppStoreUrl.js';
import { SupportContact, initSupportContact } from './SupportContact.js';
import { Notification, initNotification } from './Notification.js';
import { DriverOffer, initDriverOffer } from './DriverOffer.js';
import { DriverOfferStop, initDriverOfferStop } from './DriverOfferStop.js';

// Initialize all models
initUser(sequelize);
initUserIdentity(sequelize);
initPhone(sequelize);
initOtpCode(sequelize);
initDeletionRequest(sequelize);
initAuditLog(sequelize);
initPushToken(sequelize);
initGeoCountry(sequelize);
initGeoProvince(sequelize);
initGeoCityDistrict(sequelize);
initGeoAdministrativeArea(sequelize);
initGeoSettlement(sequelize);
initGeoNeighborhood(sequelize);
initDriverProfile(sequelize);
initDriverPassport(sequelize);
initDriverLicense(sequelize);
initEmergencyContact(sequelize);
initDriverVehicle(sequelize);
initDriverTaxiLicense(sequelize);
initAdminUser(sequelize);
initRole(sequelize);
initUserRole(sequelize);
initCountry(sequelize);
initVehicleMake(sequelize);
initVehicleModel(sequelize);
initVehicleBodyType(sequelize);
initVehicleColor(sequelize);
initVehicleType(sequelize);
initAppStoreUrl(sequelize);
initSupportContact(sequelize);
initNotification(sequelize);
initDriverOffer(sequelize);
initDriverOfferStop(sequelize);

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

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Geo hierarchy associations
GeoCountry.hasMany(GeoProvince, { foreignKey: 'country_id', as: 'provinces' });
GeoProvince.belongsTo(GeoCountry, { foreignKey: 'country_id', as: 'country' });

GeoProvince.hasMany(GeoCityDistrict, { foreignKey: 'province_id', as: 'cityDistricts' });
GeoCityDistrict.belongsTo(GeoProvince, { foreignKey: 'province_id', as: 'province' });

GeoCityDistrict.hasMany(GeoAdministrativeArea, {
  foreignKey: 'city_district_id',
  as: 'administrativeAreas'
});
GeoAdministrativeArea.belongsTo(GeoCityDistrict, {
  foreignKey: 'city_district_id',
  as: 'cityDistrict'
});

GeoCityDistrict.hasMany(GeoSettlement, { foreignKey: 'city_district_id', as: 'settlements' });
GeoSettlement.belongsTo(GeoCityDistrict, { foreignKey: 'city_district_id', as: 'cityDistrict' });

GeoCityDistrict.hasMany(GeoNeighborhood, { foreignKey: 'city_district_id', as: 'neighborhoods' });
GeoNeighborhood.belongsTo(GeoCityDistrict, { foreignKey: 'city_district_id', as: 'cityDistrict' });

// Driver associations
User.hasOne(DriverProfile, { foreignKey: 'user_id', as: 'driverProfile' });
DriverProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
DriverProfile.belongsTo(GeoCountry, { foreignKey: 'address_country_id', as: 'addressCountry' });
DriverProfile.belongsTo(GeoProvince, { foreignKey: 'address_province_id', as: 'addressProvince' });
DriverProfile.belongsTo(GeoCityDistrict, {
  foreignKey: 'address_city_district_id',
  as: 'addressCityDistrict'
});
DriverProfile.belongsTo(GeoAdministrativeArea, {
  foreignKey: 'address_administrative_area_id',
  as: 'addressAdministrativeArea'
});
DriverProfile.belongsTo(GeoSettlement, {
  foreignKey: 'address_settlement_id',
  as: 'addressSettlement'
});
DriverProfile.belongsTo(GeoNeighborhood, {
  foreignKey: 'address_neighborhood_id',
  as: 'addressNeighborhood'
});
GeoCountry.hasMany(DriverProfile, { foreignKey: 'address_country_id', as: 'driverProfiles' });
GeoProvince.hasMany(DriverProfile, { foreignKey: 'address_province_id', as: 'driverProfiles' });
GeoCityDistrict.hasMany(DriverProfile, {
  foreignKey: 'address_city_district_id',
  as: 'driverProfiles'
});
GeoAdministrativeArea.hasMany(DriverProfile, {
  foreignKey: 'address_administrative_area_id',
  as: 'driverProfiles'
});
GeoSettlement.hasMany(DriverProfile, { foreignKey: 'address_settlement_id', as: 'driverProfiles' });
GeoNeighborhood.hasMany(DriverProfile, {
  foreignKey: 'address_neighborhood_id',
  as: 'driverProfiles'
});

DriverProfile.hasOne(DriverPassport, { foreignKey: 'driver_profile_id', as: 'passport' });
DriverPassport.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

DriverProfile.hasOne(DriverLicense, { foreignKey: 'driver_profile_id', as: 'license' });
DriverLicense.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

DriverProfile.hasMany(EmergencyContact, { foreignKey: 'driver_profile_id', as: 'emergencyContacts' });
EmergencyContact.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

DriverProfile.hasOne(DriverVehicle, { foreignKey: 'driver_profile_id', as: 'vehicle' });
DriverVehicle.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

// DriverVehicle geo associations
DriverVehicle.belongsTo(GeoCountry, { foreignKey: 'owner_address_country_id', as: 'ownerAddressCountry' });
DriverVehicle.belongsTo(GeoProvince, { foreignKey: 'owner_address_province_id', as: 'ownerAddressProvince' });
DriverVehicle.belongsTo(GeoCityDistrict, {
  foreignKey: 'owner_address_city_district_id',
  as: 'ownerAddressCityDistrict'
});
DriverVehicle.belongsTo(GeoAdministrativeArea, {
  foreignKey: 'owner_address_administrative_area_id',
  as: 'ownerAddressAdministrativeArea'
});
DriverVehicle.belongsTo(GeoSettlement, {
  foreignKey: 'owner_address_settlement_id',
  as: 'ownerAddressSettlement'
});
DriverVehicle.belongsTo(GeoNeighborhood, {
  foreignKey: 'owner_address_neighborhood_id',
  as: 'ownerAddressNeighborhood'
});
GeoCountry.hasMany(DriverVehicle, { foreignKey: 'owner_address_country_id', as: 'ownerVehicles' });
GeoProvince.hasMany(DriverVehicle, { foreignKey: 'owner_address_province_id', as: 'ownerVehicles' });
GeoCityDistrict.hasMany(DriverVehicle, {
  foreignKey: 'owner_address_city_district_id',
  as: 'ownerVehicles'
});
GeoAdministrativeArea.hasMany(DriverVehicle, {
  foreignKey: 'owner_address_administrative_area_id',
  as: 'ownerVehicles'
});
GeoSettlement.hasMany(DriverVehicle, {
  foreignKey: 'owner_address_settlement_id',
  as: 'ownerVehicles'
});
GeoNeighborhood.hasMany(DriverVehicle, {
  foreignKey: 'owner_address_neighborhood_id',
  as: 'ownerVehicles'
});

// Vehicle associations
VehicleMake.hasMany(VehicleModel, { foreignKey: 'vehicle_make_id', as: 'models' });
VehicleModel.belongsTo(VehicleMake, { foreignKey: 'vehicle_make_id', as: 'make' });

DriverVehicle.belongsTo(VehicleType, { foreignKey: 'vehicle_type_id', as: 'type' });
DriverVehicle.belongsTo(VehicleMake, { foreignKey: 'vehicle_make_id', as: 'make' });
DriverVehicle.belongsTo(VehicleModel, { foreignKey: 'vehicle_model_id', as: 'model' });
DriverVehicle.belongsTo(VehicleBodyType, { foreignKey: 'vehicle_body_type_id', as: 'bodyType' });
DriverVehicle.belongsTo(VehicleColor, { foreignKey: 'vehicle_color_id', as: 'color' });

VehicleType.hasMany(DriverVehicle, { foreignKey: 'vehicle_type_id', as: 'vehicles' });
VehicleMake.hasMany(DriverVehicle, { foreignKey: 'vehicle_make_id', as: 'vehicles' });
VehicleModel.hasMany(DriverVehicle, { foreignKey: 'vehicle_model_id', as: 'vehicles' });
VehicleBodyType.hasMany(DriverVehicle, { foreignKey: 'vehicle_body_type_id', as: 'vehicles' });
VehicleColor.hasMany(DriverVehicle, { foreignKey: 'vehicle_color_id', as: 'vehicles' });

DriverProfile.hasOne(DriverTaxiLicense, { foreignKey: 'driver_profile_id', as: 'taxiLicense' });
DriverTaxiLicense.belongsTo(DriverProfile, { foreignKey: 'driver_profile_id', as: 'driverProfile' });

// Driver Offer associations
User.hasMany(DriverOffer, { foreignKey: 'user_id', as: 'driverOffers' });
DriverOffer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

DriverVehicle.hasMany(DriverOffer, { foreignKey: 'vehicle_id', as: 'offers' });
DriverOffer.belongsTo(DriverVehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

DriverOffer.hasMany(DriverOfferStop, { foreignKey: 'offer_id', as: 'stops' });
DriverOfferStop.belongsTo(DriverOffer, { foreignKey: 'offer_id', as: 'offer' });

AdminUser.hasMany(DriverOffer, { foreignKey: 'reviewed_by', as: 'reviewedOffers' });
DriverOffer.belongsTo(AdminUser, { foreignKey: 'reviewed_by', as: 'reviewer' });

// Admin User associations
AdminUser.belongsTo(AdminUser, { foreignKey: 'created_by', as: 'creator' });

// Admin User - Role associations (many-to-many)
AdminUser.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles'
});

Role.belongsToMany(AdminUser, {
  through: UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users'
});

UserRole.belongsTo(AdminUser, { foreignKey: 'user_id', as: 'user' });
UserRole.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
UserRole.belongsTo(AdminUser, { foreignKey: 'assigned_by', as: 'assigner' });

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
  AdminUser,
  Role,
  UserRole,
  Country,
  GeoCountry,
  GeoProvince,
  GeoCityDistrict,
  GeoAdministrativeArea,
  GeoSettlement,
  GeoNeighborhood,
  VehicleMake,
  VehicleModel,
  VehicleBodyType,
  VehicleColor,
  VehicleType,
  AppStoreUrl,
  SupportContact,
  Notification,
  DriverOffer,
  DriverOfferStop,
};

export default sequelize;

