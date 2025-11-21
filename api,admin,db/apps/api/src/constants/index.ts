/**
 * Application Constants
 */

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  DRIVER = 'driver',
}

// User Status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

// Ride Types
export enum RideType {
  ECONOMY = 'economy',
  COMFORT = 'comfort',
  PREMIUM = 'premium',
  XL = 'xl',
}

// Ride Status
export enum RideStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Payment Methods
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  WALLET = 'wallet',
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

// Error Messages (Uzbek)
export const ErrorMessages = {
  UNAUTHORIZED: 'Ruxsatsiz kirish',
  FORBIDDEN: 'Kirish taqiqlangan',
  NOT_FOUND: 'Ma\'lumot topilmadi',
  INVALID_CREDENTIALS: 'Noto\'g\'ri email yoki parol',
  USER_EXISTS: 'Foydalanuvchi allaqachon mavjud',
  VALIDATION_ERROR: 'Ma\'lumotlarni tekshirishda xatolik',
  INTERNAL_ERROR: 'Server xatoligi',
  COUNTRY_EXISTS: 'Mamlakat allaqachon mavjud',
  COUNTRY_NOT_FOUND: 'Mamlakat topilmadi',
  GEO_COUNTRY_EXISTS: 'Hududiy mamlakat allaqachon mavjud',
  GEO_COUNTRY_NOT_FOUND: 'Hududiy mamlakat topilmadi',
  GEO_PROVINCE_EXISTS: 'Viloyat allaqachon mavjud',
  GEO_PROVINCE_NOT_FOUND: 'Viloyat topilmadi',
  GEO_CITY_DISTRICT_EXISTS: 'Shahar yoki tuman allaqachon mavjud',
  GEO_CITY_DISTRICT_NOT_FOUND: 'Shahar yoki tuman topilmadi',
  GEO_ADMIN_AREA_EXISTS: 'Ma\'muriy hudud allaqachon mavjud',
  GEO_ADMIN_AREA_NOT_FOUND: 'Ma\'muriy hudud topilmadi',
  GEO_SETTLEMENT_EXISTS: 'Aholi punkti allaqachon mavjud',
  GEO_SETTLEMENT_NOT_FOUND: 'Aholi punkti topilmadi',
  GEO_NEIGHBORHOOD_EXISTS: 'Mahalla allaqachon mavjud',
  GEO_NEIGHBORHOOD_NOT_FOUND: 'Mahalla topilmadi',
};

// Alias for backward compatibility
export const ERROR_MESSAGES = {
  UNAUTHORIZED: ErrorMessages.UNAUTHORIZED,
  FORBIDDEN: ErrorMessages.FORBIDDEN,
  NOT_FOUND: ErrorMessages.NOT_FOUND,
  INVALID_CREDENTIALS: ErrorMessages.INVALID_CREDENTIALS,
  USER_ALREADY_EXISTS: ErrorMessages.USER_EXISTS,
  USER_NOT_FOUND: 'Foydalanuvchi topilmadi',
  USER_SUSPENDED: 'Foydalanuvchi hisobi bloklangan',
  VALIDATION_ERROR: ErrorMessages.VALIDATION_ERROR,
  INTERNAL_ERROR: ErrorMessages.INTERNAL_ERROR,
  COUNTRY_ALREADY_EXISTS: ErrorMessages.COUNTRY_EXISTS,
  COUNTRY_NOT_FOUND: ErrorMessages.COUNTRY_NOT_FOUND,
  GEO_COUNTRY_ALREADY_EXISTS: ErrorMessages.GEO_COUNTRY_EXISTS,
  GEO_COUNTRY_NOT_FOUND: ErrorMessages.GEO_COUNTRY_NOT_FOUND,
  GEO_PROVINCE_ALREADY_EXISTS: ErrorMessages.GEO_PROVINCE_EXISTS,
  GEO_PROVINCE_NOT_FOUND: ErrorMessages.GEO_PROVINCE_NOT_FOUND,
  GEO_CITY_DISTRICT_ALREADY_EXISTS: ErrorMessages.GEO_CITY_DISTRICT_EXISTS,
  GEO_CITY_DISTRICT_NOT_FOUND: ErrorMessages.GEO_CITY_DISTRICT_NOT_FOUND,
  GEO_ADMIN_AREA_ALREADY_EXISTS: ErrorMessages.GEO_ADMIN_AREA_EXISTS,
  GEO_ADMIN_AREA_NOT_FOUND: ErrorMessages.GEO_ADMIN_AREA_NOT_FOUND,
  GEO_SETTLEMENT_ALREADY_EXISTS: ErrorMessages.GEO_SETTLEMENT_EXISTS,
  GEO_SETTLEMENT_NOT_FOUND: ErrorMessages.GEO_SETTLEMENT_NOT_FOUND,
  GEO_NEIGHBORHOOD_ALREADY_EXISTS: ErrorMessages.GEO_NEIGHBORHOOD_EXISTS,
  GEO_NEIGHBORHOOD_NOT_FOUND: ErrorMessages.GEO_NEIGHBORHOOD_NOT_FOUND,
};

// Success Messages (Uzbek)
export const SuccessMessages = {
  USER_CREATED: 'Foydalanuvchi muvaffaqiyatli yaratildi',
  USER_UPDATED: 'Foydalanuvchi muvaffaqiyatli yangilandi',
  USER_DELETED: 'Foydalanuvchi muvaffaqiyatli o\'chirildi',
  LOGIN_SUCCESS: 'Kirish muvaffaqiyatli',
  LOGOUT_SUCCESS: 'Chiqish muvaffaqiyatli',
  COUNTRY_CREATED: 'Mamlakat muvaffaqiyatli qo\'shildi',
  COUNTRY_UPDATED: 'Mamlakat ma\'lumotlari yangilandi',
  COUNTRY_DELETED: 'Mamlakat muvaffaqiyatli o\'chirildi',
  GEO_COUNTRY_CREATED: 'Hududiy mamlakat qo\'shildi',
  GEO_COUNTRY_UPDATED: 'Hududiy mamlakat yangilandi',
  GEO_COUNTRY_DELETED: 'Hududiy mamlakat o\'chirildi',
  GEO_PROVINCE_CREATED: 'Viloyat qo\'shildi',
  GEO_PROVINCE_UPDATED: 'Viloyat yangilandi',
  GEO_PROVINCE_DELETED: 'Viloyat o\'chirildi',
  GEO_CITY_DISTRICT_CREATED: 'Shahar yoki tuman qo\'shildi',
  GEO_CITY_DISTRICT_UPDATED: 'Shahar yoki tuman yangilandi',
  GEO_CITY_DISTRICT_DELETED: 'Shahar yoki tuman o\'chirildi',
  GEO_ADMIN_AREA_CREATED: 'Ma\'muriy hudud qo\'shildi',
  GEO_ADMIN_AREA_UPDATED: 'Ma\'muriy hudud yangilandi',
  GEO_ADMIN_AREA_DELETED: 'Ma\'muriy hudud o\'chirildi',
  GEO_SETTLEMENT_CREATED: 'Aholi punkti qo\'shildi',
  GEO_SETTLEMENT_UPDATED: 'Aholi punkti yangilandi',
  GEO_SETTLEMENT_DELETED: 'Aholi punkti o\'chirildi',
  GEO_NEIGHBORHOOD_CREATED: 'Mahalla qo\'shildi',
  GEO_NEIGHBORHOOD_UPDATED: 'Mahalla yangilandi',
  GEO_NEIGHBORHOOD_DELETED: 'Mahalla o\'chirildi',
};
