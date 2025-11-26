# Passengers Not Showing in Admin Panel - Debug Guide

## Issue
Registered passengers are not showing in the admin passengers page at `http://localhost:3001/passengers`.

## API Endpoint
`GET http://localhost:4001/api/admin/passengers?page=1&pageSize=25`

## Debugging Steps

### 1. Check Server Logs
The code now includes console logging. Check the API server console for:
- `[AdminPassengerController] getAll called with:` - Shows the request parameters
- `[AdminPassengerService] Found X passengers` - Shows how many passengers were found
- `[AdminPassengerService] Sample passenger:` - Shows a sample passenger if any found

### 2. Verify Database
Check if users exist in the database with `role = 'user'`:

```sql
SELECT id, phone_e164, email, role, status, created_at 
FROM users 
WHERE role = 'user' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Test API Endpoint Directly
Use curl or Postman to test the endpoint:

```bash
curl -X GET "http://localhost:4001/api/admin/passengers?page=1&pageSize=25" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response structure:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "...",
        "phone_e164": "+998...",
        "email": "...",
        "display_name": "...",
        "status": "active",
        "is_verified": true,
        "profile_complete": false,
        "role": "user",
        "created_at": "...",
        "updated_at": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 4. Check Frontend Console
Open browser DevTools and check:
- Network tab: Look at the actual API response
- Console tab: Check for any JavaScript errors
- Check if the response structure matches what the frontend expects

### 5. Common Issues

#### Issue 1: Users don't have 'user' role
**Solution**: Update existing users:
```sql
UPDATE users 
SET role = 'user' 
WHERE role IS NULL OR role = '';
```

#### Issue 2: Response structure mismatch
The frontend expects:
```javascript
result.data.data // array of passengers
result.data.pagination.total // total count
```

If the response structure is different, the frontend will show empty results.

#### Issue 3: Authentication issue
Make sure the admin token is valid and has the correct permissions.

#### Issue 4: CORS or network issue
Check browser console for CORS errors or network failures.

### 6. Verify User Registration
Test user registration via OTP to ensure users are created with `role: 'user'`:

1. Register a new user via the user app
2. Check the database to verify the user was created with `role = 'user'`
3. Check if the user appears in the admin panel

## Code Changes Made

1. **Added logging** to `AdminPassengerService.getAll()`:
   - Logs total count of passengers found
   - Logs sample passenger data if any found

2. **Added logging** to `AdminPassengerController.getAll()`:
   - Logs request parameters
   - Logs service response

3. **Added explicit attributes** to the User query to ensure all required fields are returned

## Next Steps

1. Check the server console logs when accessing the passengers page
2. Verify the database has users with `role = 'user'`
3. Test the API endpoint directly to see the actual response
4. Check browser console for frontend errors
5. Compare the actual API response with what the frontend expects

## Expected Behavior

When accessing `/admin/passengers`:
1. API should query users with `role = 'user'`
2. Response should include pagination metadata
3. Frontend should display the list of passengers
4. If no passengers exist, should show "Yo'lovchilar topilmadi" (Passengers not found)

