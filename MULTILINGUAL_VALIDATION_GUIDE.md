# Multilingual Form Validation Guide

This guide explains the implementation of multilingual form validation with default Uzbek (uz) language support across the UbexGo application.

## Overview

The system provides comprehensive validation error messages in three languages:
- **Uzbek (uz)** - Default language
- **English (en)**
- **Russian (ru)**

## Backend Implementation

### 1. i18n Configuration

**Location:** `api,admin,db/apps/api/src/i18n/`

#### Files Structure:
```
i18n/
├── index.ts                 # i18n configuration and language detection
├── translator.ts            # Translation utility functions
└── translations/
    ├── uz.ts               # Uzbek translations (default)
    ├── en.ts               # English translations
    └── ru.ts               # Russian translations
```

#### Key Features:
- Automatic language detection from `Accept-Language` header
- Default language: Uzbek (uz)
- Field name translations
- Validation error message templates with parameter substitution

### 2. Enhanced Validation Middleware

**Location:** `api,admin,db/apps/api/src/middleware/validator.ts`

#### Features:
- Multi-rule validation support
- i18n error messages
- Custom validation rules:
  - `required` - Field is mandatory
  - `email` - Valid email format
  - `phone` - Valid phone format
  - `minLength` / `maxLength` - String length validation
  - `min` / `max` - Numeric value validation
  - `date` - Valid date format
  - `in` - Value must be in allowed list
  - `custom` - Custom validation function

#### Example Usage:
```typescript
import { validateRequest } from '../middleware/validator.js';

// In your route
router.post('/driver/personal-info', 
  personalInfoValidation,  // Validation middleware
  asyncHandler(updatePersonalInfo)
);
```

#### Predefined Validation Rules:
- `driverDetailsValidation` - Driver type validation
- `personalInfoValidation` - Personal information validation
- `passportValidation` - Passport information validation
- `licenseValidation` - License validation
- `vehicleValidation` - Vehicle information validation
- `taxiLicenseValidation` - Taxi license validation

### 3. Error Handler with i18n

**Location:** `api,admin,db/apps/api/src/middleware/errorHandler.ts`

#### Features:
- Detects `Accept-Language` header
- Returns errors in requested language
- Handles validation errors with field-specific messages
- Structured error response format:

```json
{
  "success": false,
  "message": "Ma'lumotlar noto'g'ri",
  "errors": [
    {
      "field": "first_name",
      "message": "Ism majburiy maydon",
      "type": "required"
    }
  ]
}
```

## Frontend Implementation

### 1. Translation Files

**Location:** `driver-app-standalone/translations/`

#### Enhanced Translations Include:

**Form Validation Messages:**
```typescript
formValidation: {
  // Driver Details
  driverTypeRequired: "Yo'nalishni tanlang",
  driverTypeInvalid: "Noto'g'ri yo'nalish tanlangan",

  // Personal Info
  firstNameRequired: "Ism majburiy maydon",
  lastNameRequired: "Familiya majburiy maydon",
  genderRequired: "Jinsni tanlang",
  birthDateInvalid: "Sana noto'g'ri formatda",
  emailInvalid: "Email noto'g'ri formatda",

  // Generic messages
  required: "Bu maydon majburiy",
  tooShort: "Qiymat juda qisqa",
  invalid: "Noto'g'ri format",
}
```

**Driver Messages:**
```typescript
driver: {
  profileUpdated: 'Profil yangilandi',
  passportUpdated: 'Passport ma\'lumotlari saqlandi',
  licenseUpdated: 'Guvohnoma ma\'lumotlari saqlandi',
  vehicleUpdated: 'Avtomobil ma\'lumotlari saqlandi',
}
```

### 2. Validation Utility

**Location:** `driver-app-standalone/utils/validation.ts`

#### Features:
- Frontend validation with i18n support
- Validation rule builder
- Reusable validation functions:
  - `isValidEmail()`
  - `isValidPhone()`
  - `isValidDate()`
  - `validateForm()` - Main validation function

#### Example Usage:
```typescript
import { validateForm, type ValidationRule } from '../utils/validation';
import { useTranslation } from '../hooks/useTranslation';

const { t } = useTranslation();

const validationRules: ValidationRule[] = [
  {
    field: 'first_name',
    value: formData.first_name,
    rules: [
      { type: 'required', errorKey: 'formValidation.firstNameRequired' },
      { type: 'minLength', errorKey: 'formValidation.firstNameTooShort', params: { min: 2 } },
    ],
  },
  {
    field: 'email',
    value: formData.email,
    rules: [
      { type: 'email', errorKey: 'formValidation.emailInvalid' },
    ],
  },
];

const validationErrors = validateForm(validationRules, t);

if (validationErrors.length > 0) {
  showToast.error(t('common.error'), validationErrors[0].message);
  return;
}
```

### 3. Enhanced Error Handler

**Location:** `driver-app-standalone/utils/errorHandler.ts`

#### New Functions:

**`displayValidationErrors()`** - Display backend validation errors:
```typescript
import { displayValidationErrors } from '../utils/errorHandler';

try {
  await updatePersonalInfo(token, cleanData);
} catch (error: any) {
  // Check if it's a validation error from backend
  if (error?.response?.status === 422 && error?.response?.data?.errors) {
    displayValidationErrors(error, t, true); // Shows first error
  } else {
    handleBackendError(error, { t, defaultMessage: t('userDetails.errorUpdate') });
  }
}
```

**`parseValidationErrors()`** - Extract validation errors from response:
```typescript
const errors = parseValidationErrors(error);
// Returns: { field_name: "Error message", ... }
```

## Example Implementation

### Backend Route with Validation

```typescript
// driver.routes.ts
import { personalInfoValidation } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

router.put(
  '/driver/personal-info',
  authenticateToken,
  personalInfoValidation,  // Validates with i18n
  asyncHandler(async (req, res) => {
    const data = req.body;
    // Process validated data
    res.json({ success: true, message: t('driver.profileUpdated', req.language) });
  })
);
```

### Frontend Form with Validation

```typescript
// DriverPersonalInfoScreen.tsx
import { validateForm, type ValidationRule } from '../utils/validation';
import { displayValidationErrors } from '../utils/errorHandler';
import { useTranslation } from '../hooks/useTranslation';

const { t } = useTranslation();

const handleSubmit = async () => {
  // 1. Frontend validation
  const validationRules: ValidationRule[] = [
    {
      field: 'first_name',
      value: formData.first_name,
      rules: [
        { type: 'required', errorKey: 'formValidation.firstNameRequired' },
      ],
    },
  ];

  const errors = validateForm(validationRules, t);
  if (errors.length > 0) {
    showToast.error(t('common.error'), errors[0].message);
    return;
  }

  // 2. Submit to backend
  try {
    await updatePersonalInfo(token, formData);
    showToast.success(t('common.success'), t('driver.profileUpdated'));
  } catch (error: any) {
    // 3. Handle backend validation errors
    if (error?.response?.status === 422) {
      displayValidationErrors(error, t, true);
    } else {
      handleBackendError(error, { t, defaultMessage: t('errors.unknown') });
    }
  }
};
```

## Language Detection

### Backend
The backend detects language from the `Accept-Language` HTTP header:
```
Accept-Language: uz
Accept-Language: en
Accept-Language: ru
```

If no language is specified or an unsupported language is requested, it defaults to Uzbek (uz).

### Frontend
The frontend uses the `useTranslation()` hook which provides:
- Current language state
- `t()` function for translations
- `changeLanguage()` function to switch languages

```typescript
const { t, currentLanguage, changeLanguage } = useTranslation();

// Use translation
const errorMessage = t('formValidation.firstNameRequired');

// Change language
changeLanguage('en');
```

## Adding New Validation Messages

### Backend

1. Add to translation files (`api,admin,db/apps/api/src/i18n/translations/uz.ts`, etc.):
```typescript
validation: {
  customError: "{field} имеет специальную ошибку",
}

fields: {
  custom_field: 'Махсус майдон',
}
```

2. Use in validation middleware:
```typescript
export const customValidation = validateRequest([
  { field: 'custom_field', type: 'required' },
]);
```

### Frontend

1. Add to translation files (`driver-app-standalone/translations/uz.ts`, etc.):
```typescript
formValidation: {
  customFieldRequired: "Maxsus maydon majburiy",
  customFieldInvalid: "Maxsus maydon noto'g'ri",
}
```

2. Use in validation:
```typescript
const rules: ValidationRule[] = [
  {
    field: 'custom_field',
    value: formData.custom_field,
    rules: [
      { type: 'required', errorKey: 'formValidation.customFieldRequired' },
    ],
  },
];
```

## Best Practices

1. **Always validate on both frontend and backend**
   - Frontend: Better UX, immediate feedback
   - Backend: Security, data integrity

2. **Use translation keys consistently**
   - Follow naming convention: `section.fieldAction`
   - Example: `formValidation.firstNameRequired`

3. **Provide specific error messages**
   - Bad: "Invalid input"
   - Good: "Ism kamida 2 belgidan iborat bo'lishi kerak"

4. **Handle validation errors gracefully**
   - Show one error at a time for better UX
   - Use toast notifications for immediate feedback
   - Display field-specific errors when available

5. **Test with different languages**
   - Ensure all error messages are translated
   - Check message formatting with parameters
   - Verify cultural appropriateness

## Testing

### Backend Testing
```bash
# Test with different languages
curl -H "Accept-Language: uz" http://localhost:4001/api/driver/personal-info
curl -H "Accept-Language: en" http://localhost:4001/api/driver/personal-info
curl -H "Accept-Language: ru" http://localhost:4001/api/driver/personal-info
```

### Frontend Testing
1. Change language in app settings
2. Test form validation
3. Submit with invalid data
4. Verify error messages are in correct language

## Troubleshooting

**Issue:** Validation errors not showing in correct language
- **Solution:** Check `Accept-Language` header is set correctly

**Issue:** Translation key not found
- **Solution:** Verify key exists in all translation files (uz, en, ru)

**Issue:** Parameters not replaced in message
- **Solution:** Ensure parameter names match in translation string and validator call

## Summary

This implementation provides:
✅ Multilingual validation (uz, en, ru)
✅ Default Uzbek language
✅ Consistent error messages across frontend and backend
✅ Easy to extend with new validations
✅ Better user experience with localized errors
✅ Type-safe validation with TypeScript
✅ Reusable validation utilities

