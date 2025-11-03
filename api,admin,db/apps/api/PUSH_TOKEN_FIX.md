# Push Token Foreign Key Constraint Error Fix

## Problem

The server was experiencing unhandled promise rejections with the following error:

```
SequelizeForeignKeyConstraintError: insert or update on table "push_tokens" 
violates foreign key constraint "push_tokens_user_id_fkey"

Detail: Key (user_id)=(4236bf16-1141-419d-a266-f3536d033fcf) is not present in table "users".
```

### Root Cause

The device registration endpoint (`POST /device/register`) was attempting to register a push token for a user that no longer exists in the database. This happened because:

1. A user authenticated with a valid JWT token
2. The user was later deleted from the database (or never properly created)
3. The JWT token remained valid, so the app could still make authenticated requests
4. When the app tried to register a device/push token, it failed because the `user_id` foreign key constraint was violated

## Solution

Applied a multi-layered fix to prevent unhandled rejections and provide better error messages:

### 1. Added User Existence Check (DeviceController.ts)

Before attempting to register the device, we now verify that the user exists:

```typescript
// Verify user exists before attempting to register device
const userExists = await User.findByPk(req.user.userId);
if (!userExists) {
  throw new AppError('User not found. Please log in again.', 404);
}
```

### 2. Added Foreign Key Error Handling (DeviceController.ts)

Added try-catch block to specifically handle foreign key constraint errors:

```typescript
try {
  const [record] = await PushToken.upsert({
    token,
    user_id: req.user.userId,
    platform,
    app,
  });
  // ... success response
} catch (error: any) {
  if (error instanceof ForeignKeyConstraintError) {
    throw new AppError('User not found. Please log in again.', 404);
  }
  throw error;
}
```

### 3. Wrapped Controller in asyncHandler (device.routes.ts)

The route handler was not wrapped in the `asyncHandler` middleware, which meant async errors were not being properly caught by the error handling middleware:

**Before:**
```typescript
router.post('/register', authenticate, registerDevice);
```

**After:**
```typescript
router.post('/register', authenticate, asyncHandler(registerDevice));
```

## Files Modified

1. **apps/api/src/controllers/DeviceController.ts**
   - Added import for `User` model and `ForeignKeyConstraintError`
   - Added user existence check before upsert
   - Added try-catch block to handle foreign key errors gracefully

2. **apps/api/src/routes/device.routes.ts**
   - Added import for `asyncHandler` middleware
   - Wrapped `registerDevice` controller with `asyncHandler`

## Database Context

The `push_tokens` table has a foreign key constraint on `user_id` with `ON DELETE CASCADE`:

```sql
user_id: {
  type: Sequelize.UUID,
  allowNull: false,
  references: { model: 'users', key: 'id' },
  onDelete: 'CASCADE',
}
```

This means when a user is deleted, their push tokens should be automatically deleted. However, this doesn't prevent the error when trying to INSERT a push token for a non-existent user.

## Result

- ✅ No more unhandled promise rejections
- ✅ Proper error responses returned to the client (404 with meaningful message)
- ✅ Client knows to log in again when user doesn't exist
- ✅ Better error logging and debugging

## Testing Recommendations

1. Test device registration with a valid user
2. Test device registration with an invalid/deleted user ID in JWT
3. Verify error response format matches API standards
4. Ensure client app handles 404 errors and redirects to login

## Related Issues

This fix also prevents similar issues in any async route handlers that weren't wrapped with `asyncHandler`. Consider auditing all route handlers to ensure they're properly wrapped.

