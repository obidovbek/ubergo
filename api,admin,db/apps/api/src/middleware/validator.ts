/**
 * Validation Middleware with i18n support
 */

import type { Request, Response, NextFunction } from 'express';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { getValidationError, formatValidationErrors, type ValidationErrorDetail } from '../i18n/translator.js';
import { isValidEmail, isValidPhone } from '../utils/validation.js';

export class ValidationError extends Error {
  public statusCode: number;
  public errors: ValidationErrorDetail[];

  constructor(errors: ValidationErrorDetail[]) {
    super('Validation Error');
    this.statusCode = 422;
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

/**
 * Validation rule types
 */
type ValidationRule = {
  field: string;
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'min' | 'max' | 'date' | 'in' | 'custom';
  params?: Record<string, any>;
  customValidator?: (value: any) => boolean;
  message?: string;
};

/**
 * Validate request data
 */
export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const language = getLanguageFromHeaders(req.headers['accept-language']);
    const data = { ...req.body, ...req.params, ...req.query };
    const errors: Array<{ field: string; type: string; params?: Record<string, any> }> = [];

    for (const rule of rules) {
      const value = data[rule.field];

      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push({ field: rule.field, type: 'required' });
          }
          break;

        case 'email':
          if (value && !isValidEmail(value)) {
            errors.push({ field: rule.field, type: 'email' });
          }
          break;

        case 'phone':
          if (value && !isValidPhone(value)) {
            errors.push({ field: rule.field, type: 'phone' });
          }
          break;

        case 'minLength':
          if (value && typeof value === 'string' && value.length < (rule.params?.min || 0)) {
            errors.push({ field: rule.field, type: 'tooShort', params: { min: rule.params?.min } });
          }
          break;

        case 'maxLength':
          if (value && typeof value === 'string' && value.length > (rule.params?.max || Infinity)) {
            errors.push({ field: rule.field, type: 'tooLong', params: { max: rule.params?.max } });
          }
          break;

        case 'min': {
          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            Number(value) < (rule.params?.min ?? 0)
          ) {
            errors.push({ field: rule.field, type: 'minValue', params: { min: rule.params?.min } });
          }
          break;
        }

        case 'max': {
          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            Number(value) > (rule.params?.max ?? Infinity)
          ) {
            errors.push({ field: rule.field, type: 'maxValue', params: { max: rule.params?.max } });
          }
          break;
        }

        case 'in':
          if (value && rule.params?.values && !rule.params.values.includes(value)) {
            errors.push({ field: rule.field, type: 'invalidChoice' });
          }
          break;

        case 'date':
          if (value && isNaN(Date.parse(value))) {
            errors.push({ field: rule.field, type: 'invalidDate' });
          }
          break;

        case 'custom': {
          const shouldValidate = value !== undefined && value !== null && value !== '';
          if (rule.customValidator && shouldValidate && !rule.customValidator(value)) {
            errors.push({ field: rule.field, type: 'invalid' });
          }
          break;
        }
      }
    }

    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors, language);
      throw new ValidationError(formattedErrors);
    }

    next();
  };
};

/**
 * Driver registration validation rules
 */
export const driverDetailsValidation = validateRequest([
  { field: 'driver_type', type: 'required' },
  { field: 'driver_type', type: 'in', params: { values: ['driver', 'dispatcher', 'special_transport', 'logist'] } },
]);

export const personalInfoValidation = validateRequest([
  { field: 'first_name', type: 'required' },
  { field: 'last_name', type: 'required' },
  { field: 'father_name', type: 'required' },
  { field: 'gender', type: 'required' },
  { field: 'gender', type: 'in', params: { values: ['male', 'female'] } },
  { field: 'birth_date', type: 'required' },
  { field: 'birth_date', type: 'date' },
  { field: 'email', type: 'email' },
]);

export const passportValidation = validateRequest([
  { field: 'id_card_number', type: 'required' },
  { field: 'id_card_number', type: 'minLength', params: { min: 5 } },
  { field: 'pinfl', type: 'required' },
  { field: 'pinfl', type: 'minLength', params: { min: 14 } },
  { field: 'pinfl', type: 'maxLength', params: { max: 14 } },
]);

export const licenseValidation = validateRequest([
  { field: 'license_number', type: 'required' },
  { field: 'license_number', type: 'minLength', params: { min: 5 } },
]);

export const vehicleValidation = validateRequest([
  { field: 'license_plate', type: 'required' },
  { field: 'license_plate', type: 'minLength', params: { min: 5 } },
]);

export const taxiLicenseValidation = validateRequest([
  { field: 'license_number', type: 'required' },
]);

/**
 * Country validation rules
 */
const COUNTRY_PATTERNS = ['uz', 'ru', 'generic'];

export const validateCountryCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'code', type: 'required' },
  { field: 'local_length', type: 'required' },
  { field: 'local_length', type: 'min', params: { min: 1 } },
  { field: 'pattern', type: 'required' },
  { field: 'pattern', type: 'in', params: { values: COUNTRY_PATTERNS } },
]);

export const validateCountryUpdate = validateRequest([
  { field: 'local_length', type: 'min', params: { min: 1 } },
  { field: 'pattern', type: 'in', params: { values: COUNTRY_PATTERNS } },
]);

/**
 * Geo hierarchy validation helpers
 */
const isCoordinate = (value: unknown, min: number, max: number): boolean => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return false;
  }
  return num >= min && num <= max;
};

export const validateGeoCountryCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoCountryUpdate = validateRequest([
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoProvinceCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'country_id', type: 'required' },
  { field: 'country_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoProvinceUpdate = validateRequest([
  { field: 'country_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoCityDistrictCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'province_id', type: 'required' },
  { field: 'province_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoCityDistrictUpdate = validateRequest([
  { field: 'province_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoAdministrativeAreaCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'city_district_id', type: 'required' },
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoAdministrativeAreaUpdate = validateRequest([
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoSettlementCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'city_district_id', type: 'required' },
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoSettlementUpdate = validateRequest([
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoNeighborhoodCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'city_district_id', type: 'required' },
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoNeighborhoodUpdate = validateRequest([
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

/**
 * Auth validation (legacy validators for backward compatibility)
 */
export const validateRegister = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'name', type: 'minLength', params: { min: 2 } },
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'phone', type: 'required' },
  { field: 'phone', type: 'phone' },
  { field: 'password', type: 'required' },
  { field: 'password', type: 'minLength', params: { min: 8 } },
]);

export const validateLogin = validateRequest([
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'required' },
]);

/**
 * Admin auth validation
 */
export const validateAdminLogin = validateRequest([
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'required' },
]);

export const validateAdminRegister = validateRequest([
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'required' },
  { field: 'password', type: 'minLength', params: { min: 8 } },
  { field: 'full_name', type: 'required' },
  { field: 'full_name', type: 'minLength', params: { min: 2 } },
  { field: 'role_slugs', type: 'required' },
]);

/**
 * Pagination validation
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;

  if (page < 1) {
    const language = getLanguageFromHeaders(req.headers['accept-language']);
    throw new ValidationError([{
      field: 'page',
      message: 'Page must be greater than 0',
      type: 'min',
    }]);
  }

  if (limit < 1 || limit > 100) {
    const language = getLanguageFromHeaders(req.headers['accept-language']);
    throw new ValidationError([{
      field: 'limit',
      message: 'Limit must be between 1 and 100',
      type: 'min',
    }]);
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};
