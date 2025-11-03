/**
 * Validation Middleware with i18n support
 */

import type { Request, Response, NextFunction } from 'express';
import { getLanguageFromHeaders } from '../i18n/index.js';
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

        case 'min':
          if (value !== undefined && value !== null && Number(value) < (rule.params?.min || 0)) {
            errors.push({ field: rule.field, type: 'minValue', params: { min: rule.params?.min } });
          }
          break;

        case 'max':
          if (value !== undefined && value !== null && Number(value) > (rule.params?.max || Infinity)) {
            errors.push({ field: rule.field, type: 'maxValue', params: { max: rule.params?.max } });
          }
          break;

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

        case 'custom':
          if (rule.customValidator && value && !rule.customValidator(value)) {
            errors.push({ field: rule.field, type: 'invalid' });
          }
          break;
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
