/**
 * Frontend Validation Utilities
 * Client-side validation with i18n error messages
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
};

export const isValidDate = (dateString: string): boolean => {
  // DD.MM.YYYY format
  const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > new Date().getFullYear()) {
    return false;
  }
  
  const date = new Date(year, month, day);
  return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
};

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationRule {
  field: string;
  value: any;
  rules: Array<{
    type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'date' | 'in' | 'custom';
    errorKey: string;
    params?: Record<string, any>;
    customValidator?: (value: any) => boolean;
  }>;
}

/**
 * Validate form data with translation support
 */
export const validateForm = (
  validationRules: ValidationRule[],
  t: (key: string) => string
): ValidationError[] => {
  const errors: ValidationError[] = [];

  for (const rule of validationRules) {
    const { field, value, rules } = rule;

    for (const r of rules) {
      let isValid = true;
      let errorMessage = '';

      switch (r.type) {
        case 'required':
          if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
            isValid = false;
            errorMessage = t(r.errorKey);
          }
          break;

        case 'email':
          if (value && !isValidEmail(value)) {
            isValid = false;
            errorMessage = t(r.errorKey);
          }
          break;

        case 'phone':
          if (value && !isValidPhone(value)) {
            isValid = false;
            errorMessage = t(r.errorKey);
          }
          break;

        case 'minLength':
          if (value && typeof value === 'string' && value.length < (r.params?.min || 0)) {
            isValid = false;
            errorMessage = t(r.errorKey);
          }
          break;

        case 'maxLength':
          if (value && typeof value === 'string' && value.length > (r.params?.max || Infinity)) {
            isValid = false;
            errorMessage = t(r.errorKey);
          }
          break;

        case 'date':
          if (value && !isValidDate(value)) {
            isValid = false;
            errorMessage = t(r.errorKey);
          }
          break;

        case 'in':
          if (value && r.params?.values && !r.params.values.includes(value)) {
            isValid = false;
            errorMessage = t(r.errorKey);
          }
          break;

        case 'custom':
          if (r.customValidator && value && !r.customValidator(value)) {
            isValid = false;
            errorMessage = t(r.errorKey);
          }
          break;
      }

      if (!isValid) {
        errors.push({ field, message: errorMessage });
        break; // Stop at first error for this field
      }
    }
  }

  return errors;
};
