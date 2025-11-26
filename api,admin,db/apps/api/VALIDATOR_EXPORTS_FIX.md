# Validator Exports Fix

## Issue
After refactoring the validator middleware to support i18n, some original validators were not included, causing import errors:

```
SyntaxError: The requested module '../middleware/validator' does not provide an export named 'validatePagination'
```

## Root Cause
The original `validator.ts` had these exports that were missing after refactoring:
- `validateRegister` - User registration validation
- `validateLogin` - User login validation
- `validatePagination` - Pagination query parameter validation

## Solution
Re-added the missing validators to `src/middleware/validator.ts` with the following approaches:

### 1. Auth Validators (Converted to new system)
Converted `validateRegister` and `validateLogin` to use the new `validateRequest` pattern:

```typescript
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
```

### 2. Pagination Validator (Custom logic preserved)
Kept `validatePagination` as a custom validator function because it needs to:
- Parse query parameters
- Apply default values
- Modify the request object

```typescript
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;

  if (page < 1) {
    throw new ValidationError([{
      field: 'page',
      message: 'Page must be greater than 0',
      type: 'min',
    }]);
  }

  if (limit < 1 || limit > 100) {
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
```

## Complete Validator Exports

After the fix, `src/middleware/validator.ts` exports:

### Classes:
- `ValidationError` - Custom error class for validation errors

### Functions:
- `validateRequest()` - Generic validation function builder

### Driver Registration Validators:
- `driverDetailsValidation`
- `personalInfoValidation`
- `passportValidation`
- `licenseValidation`
- `vehicleValidation`
- `taxiLicenseValidation`

### Auth Validators:
- `validateRegister`
- `validateLogin`

### Utility Validators:
- `validatePagination`

## Files Using These Validators

### `src/routes/auth.routes.ts`
```typescript
import { validateRegister, validateLogin } from '../middleware/validator';
```

### `src/routes/user.routes.ts`
```typescript
import { validatePagination } from '../middleware/validator';
```

### Driver Routes (future)
```typescript
import { 
  personalInfoValidation,
  passportValidation,
  licenseValidation,
  vehicleValidation,
  taxiLicenseValidation
} from '../middleware/validator';
```

## Testing

After deployment, verify:

1. **Auth endpoints work:**
   ```bash
   # Registration
   curl -X POST http://api-url/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123","name":"Test","phone":"+998901234567"}'
   
   # Login
   curl -X POST http://api-url/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   ```

2. **Pagination works:**
   ```bash
   curl "http://api-url/api/users?page=1&limit=10"
   ```

3. **Validation errors are in Uzbek (default):**
   ```bash
   curl -X POST http://api-url/api/auth/register \
     -H "Accept-Language: uz" \
     -H "Content-Type: application/json" \
     -d '{"email":"invalid","password":"short"}'
   ```

## Status
✅ All missing validators have been restored
✅ Backward compatibility maintained
✅ i18n support added to auth validators
✅ No breaking changes to routes

## Next Deployment
This fix should be deployed together with the ESM module fix to resolve all module export issues.


























