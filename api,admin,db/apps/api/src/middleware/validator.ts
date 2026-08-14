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

/*
 * ── T-063: the driver-registration validators, reconciled and mounted ─────
 *
 * These four existed but were mounted NOWHERE, so the whole driver-registration
 * API had zero server-side validation (found by T-061). They were left off on
 * purpose: switching them on as written would have started rejecting payloads
 * the shipped app sends happily.
 *
 * 🔴 **The rule applied here: the server must never refuse what the app
 * accepted.** Its job at this layer is a backstop against a direct API call —
 * not to enforce stricter UX than the build drivers are already using. Every
 * rule below was checked against the real screen before being switched on, and
 * the ones that contradicted it were relaxed, not mounted and hoped for.
 *
 * ✅ Only `required` needed reconciling: `email`, `date`, `minLength` and
 * friends all guard on `if (value && …)`, so they skip an absent field and are
 * safe on optional ones.
 */
export const personalInfoValidation = validateRequest([
  { field: 'first_name', type: 'required' },
  { field: 'last_name', type: 'required' },
  /*
   * 🔴 `father_name` and `birth_date` are NOT required, deliberately.
   * `DriverPersonalInfoScreen` has no rule for either — the app lets a driver
   * submit without them, and requiring them here would have refused people the
   * app told were finished. Making them mandatory is a product decision that
   * has to change the app too; it is not a validation fix.
   */
  { field: 'gender', type: 'required' },
  { field: 'gender', type: 'in', params: { values: ['male', 'female'] } },
  // Format-only: skipped when absent, enforced when sent.
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
  /*
   * 🔴 The `minLength: 5` that used to be here is GONE. `DriverLicenseScreen`
   * requires the number but sets no minimum, so a 4-character entry passes the
   * app — and the server would then have refused it, which is the round trip
   * T-061 was raised to stop. If a minimum is wanted it belongs in both places.
   */
]);

export const vehicleValidation = validateRequest([
  { field: 'license_plate', type: 'required' },
  // Matched to `DriverVehicleScreen`, which enforces exactly this minimum.
  // It used to be 5 here, which would have refused a plate the app accepted.
  { field: 'license_plate', type: 'minLength', params: { min: 3 } },
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
