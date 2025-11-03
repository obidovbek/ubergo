# Validation Quick Reference Card

## 🌐 Default Language: Uzbek (uz)

## Backend Quick Reference

### Import Required Modules
```typescript
import { validateRequest } from '../middleware/validator.js';
import { t } from '../i18n/translator.js';
import { asyncHandler } from '../middleware/errorHandler.js';
```

### Add Validation to Route
```typescript
router.post('/driver/personal-info', 
  authenticateToken,
  personalInfoValidation,  // Pre-built validation
  asyncHandler(handleRequest)
);
```

### Custom Validation
```typescript
const myValidation = validateRequest([
  { field: 'first_name', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'age', type: 'min', params: { min: 18 } },
]);
```

### Pre-built Validators
- `driverDetailsValidation`
- `personalInfoValidation`
- `passportValidation`
- `licenseValidation`
- `vehicleValidation`
- `taxiLicenseValidation`

## Frontend Quick Reference

### Import Required Modules
```typescript
import { validateForm, type ValidationRule } from '../utils/validation';
import { displayValidationErrors } from '../utils/errorHandler';
import { useTranslation } from '../hooks/useTranslation';
```

### Basic Validation
```typescript
const { t } = useTranslation();

const rules: ValidationRule[] = [
  {
    field: 'first_name',
    value: formData.first_name,
    rules: [
      { type: 'required', errorKey: 'formValidation.firstNameRequired' },
    ],
  },
];

const errors = validateForm(rules, t);
if (errors.length > 0) {
  showToast.error(t('common.error'), errors[0].message);
  return;
}
```

### Handle Backend Errors
```typescript
try {
  await apiCall(data);
} catch (error: any) {
  if (error?.response?.status === 422) {
    displayValidationErrors(error, t, true);
  } else {
    handleBackendError(error, { t });
  }
}
```

## Validation Types

| Type | Usage | Example |
|------|-------|---------|
| `required` | Field must have value | `{ type: 'required', errorKey: 'formValidation.required' }` |
| `email` | Valid email format | `{ type: 'email', errorKey: 'formValidation.emailInvalid' }` |
| `phone` | Valid phone format | `{ type: 'phone', errorKey: 'formValidation.phoneInvalid' }` |
| `minLength` | Minimum string length | `{ type: 'minLength', errorKey: '...', params: { min: 2 } }` |
| `maxLength` | Maximum string length | `{ type: 'maxLength', errorKey: '...', params: { max: 50 } }` |
| `min` | Minimum numeric value | `{ type: 'min', errorKey: '...', params: { min: 18 } }` |
| `max` | Maximum numeric value | `{ type: 'max', errorKey: '...', params: { max: 100 } }` |
| `date` | Valid date format (DD.MM.YYYY) | `{ type: 'date', errorKey: 'formValidation.birthDateInvalid' }` |
| `in` | Value in allowed list | `{ type: 'in', errorKey: '...', params: { values: ['male', 'female'] } }` |
| `custom` | Custom validator | `{ type: 'custom', errorKey: '...', customValidator: (v) => v.startsWith('A') }` |

## Common Translation Keys

### Form Validation (formValidation)
```typescript
// Personal Info
'formValidation.firstNameRequired'    // "Ism majburiy maydon"
'formValidation.lastNameRequired'     // "Familiya majburiy maydon"
'formValidation.genderRequired'       // "Jinsni tanlang"
'formValidation.birthDateInvalid'     // "Sana noto'g'ri formatda"
'formValidation.emailInvalid'         // "Email noto'g'ri formatda"

// Passport
'formValidation.idCardRequired'       // "ID karta raqamini kiriting"
'formValidation.pinflInvalid'         // "JSHSHIR 14 raqamdan iborat bo'lishi kerak"

// Vehicle
'formValidation.licensePlateRequired' // "Davlat raqamini kiriting"

// Generic
'formValidation.required'             // "Bu maydon majburiy"
'formValidation.tooShort'             // "Qiymat juda qisqa"
'formValidation.invalid'              // "Noto'g'ri format"
```

### Driver Messages (driver)
```typescript
'driver.profileUpdated'       // "Profil yangilandi"
'driver.passportUpdated'      // "Passport ma'lumotlari saqlandi"
'driver.licenseUpdated'       // "Guvohnoma ma'lumotlari saqlandi"
'driver.vehicleUpdated'       // "Avtomobil ma'lumotlari saqlandi"
```

### Common Messages (common)
```typescript
'common.error'     // "Xato"
'common.success'   // "Muvaffaqiyat"
'common.loading'   // "Yuklanmoqda..."
```

### Errors (errors)
```typescript
'errors.network'      // "Internet bilan aloqa yo'q"
'errors.serverError'  // "Serverda xatolik yuz berdi"
'errors.unauthorized' // "Ruxsat berilmagan"
'errors.validation'   // "Ma'lumotlar noto'g'ri"
```

## Complete Example

```typescript
// DriverRegistrationScreen.tsx
import { validateForm, type ValidationRule } from '../utils/validation';
import { displayValidationErrors } from '../utils/errorHandler';
import { useTranslation } from '../hooks/useTranslation';

const MyFormScreen: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    email: '',
    age: '',
  });

  const handleSubmit = async () => {
    // 1. Frontend Validation
    const rules: ValidationRule[] = [
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
          { type: 'required', errorKey: 'formValidation.emailRequired' },
          { type: 'email', errorKey: 'formValidation.emailInvalid' },
        ],
      },
      {
        field: 'age',
        value: formData.age,
        rules: [
          { type: 'required', errorKey: 'formValidation.ageRequired' },
          { type: 'min', errorKey: 'formValidation.ageTooYoung', params: { min: 18 } },
        ],
      },
    ];

    const errors = validateForm(rules, t);
    if (errors.length > 0) {
      showToast.error(t('common.error'), errors[0].message);
      return;
    }

    // 2. Submit to API
    setIsLoading(true);
    try {
      await updateProfile(token, formData);
      showToast.success(t('common.success'), t('driver.profileUpdated'));
      navigation.navigate('NextScreen');
    } catch (error: any) {
      // 3. Handle Backend Errors
      if (error?.response?.status === 422) {
        displayValidationErrors(error, t, true);
      } else {
        handleBackendError(error, { t, defaultMessage: t('errors.unknown') });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Your UI here
  );
};
```

## Test Validation

### Test Backend (curl)
```bash
# Uzbek (default)
curl -X POST http://localhost:4001/api/driver/personal-info \
  -H "Accept-Language: uz" \
  -H "Content-Type: application/json" \
  -d '{"first_name":""}'

# English
curl -X POST http://localhost:4001/api/driver/personal-info \
  -H "Accept-Language: en" \
  -H "Content-Type: application/json" \
  -d '{"first_name":""}'
```

### Test Frontend
1. Leave required field empty
2. Enter invalid email
3. Submit form
4. Verify error message in Uzbek

## Tips

✅ **DO:**
- Always validate on both frontend and backend
- Use specific error keys for each field
- Show one error at a time for better UX
- Test with all three languages

❌ **DON'T:**
- Skip frontend validation
- Use generic error messages
- Show all errors at once
- Hardcode error messages

## Support Languages

| Language | Code | Status |
|----------|------|--------|
| Uzbek | uz | ✅ Default |
| English | en | ✅ Supported |
| Russian | ru | ✅ Supported |

---

**For more details, see `MULTILINGUAL_VALIDATION_GUIDE.md`**

