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
};
