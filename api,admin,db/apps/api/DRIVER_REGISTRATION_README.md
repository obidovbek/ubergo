# Driver Registration API - Complete Implementation

## Overview
Complete backend API for driver registration with 5 progressive steps matching the mobile app mockups.

## Database Models

### 1. DriverProfile
Main profile table linked to users table.
- **Personal Info**: first_name, last_name, father_name, gender, birth_date, email
- **Current Address**: country, region, city, settlement_type, mahalla, street
- **Photos**: photo_face_url, photo_body_url
- **Vehicle Ownership**: vehicle_owner_type (own/other_person/company), vehicle_usage_type (rent/free_use)
- **Registration Tracking**: registration_step enum, is_complete boolean

### 2. DriverPassport
Passport/ID card information.
- **Personal Data**: first_name, last_name, father_name, gender, birth_date
- **Document**: id_card_number, pinfl (JSHSHIR), issue_date, expiry_date, citizenship
- **Birth Place**: country, region, city
- **Photos**: passport_front_url, passport_back_url

### 3. DriverLicense
Driving license information.
- **Personal Data**: first_name, last_name, father_name, birth_date
- **License**: license_number, issue_date
- **Categories**: category_a, category_b, category_c, category_d, category_be, category_ce, category_de (with dates)
- **Photos**: license_front_url, license_back_url

### 4. EmergencyContact
Emergency contacts (2 required).
- phone_country_code, phone_number, relationship

### 5. DriverVehicle
Vehicle information from technical passport.
- **Company Info**: company_name, company_tax_id
- **Owner Info**: first_name, last_name, father_name, pinfl, full address
- **Vehicle Details**: vehicle_type (light/cargo), body_type, make, model, color, license_plate, year
- **Technical**: gross_weight, unladen_weight, fuel_types (JSONB array), seating_capacity
- **Tech Passport**: series, photos (front/back)
- **Vehicle Photos**: front, back, right, left, 45°, interior (6 photos)

### 6. DriverTaxiLicense
Taxi operating license and documents.
- **License**: number, issue_date, registry_number, document_url (PDF/image)
- **License Sheet**: number, valid_from, valid_until, document_url (PDF/image)
- **Self-Employment**: number, document_url (PDF/image)
- **Power of Attorney**: document_url (PDF/image)
- **Insurance**: document_url (PDF/image)

## API Endpoints

### Authentication Required
All endpoints require Bearer token authentication.

### GET /api/driver/profile/status
Check registration progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "hasProfile": false,
    "registrationStep": "personal",
    "isComplete": false
  }
}
```

### GET /api/driver/profile
Get complete driver profile with all related data.

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "passport": { ... },
    "license": { ... },
    "emergencyContacts": [ ... ],
    "vehicle": { ... },
    "taxiLicense": { ... }
  }
}
```

### POST /api/driver/profile/personal
Create/update personal information (Step 1).

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "father_name": "Smith",
  "gender": "male",
  "birth_date": "1985-01-21",
  "email": "john@example.com",
  "address_country": "O'zbekiston",
  "address_region": "Farg'ona viloyat",
  "address_city": "Farg'ona shahar",
  "address_settlement_type": "Shaharcha",
  "address_mahalla": "Mahalla",
  "address_street": "Street Address",
  "vehicle_owner_type": "own",
  "vehicle_usage_type": "free_use"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Personal information saved successfully",
  "data": {
    "profile": { ... }
  }
}
```

### POST /api/driver/profile/passport
Create/update passport (Step 2).

### POST /api/driver/profile/license
Create/update license and emergency contacts (Step 3).

**Request Body:**
```json
{
  "license": {
    "license_number": "AG 1234567",
    "issue_date": "2025-01-21",
    "category_b": "2009-01-10",
    ...
  },
  "emergencyContacts": [
    {
      "phone_country_code": "+998",
      "phone_number": "901234567",
      "relationship": "Ota"
    },
    {
      "phone_country_code": "+998",
      "phone_number": "901234568",
      "relationship": "Onа"
    }
  ]
}
```

### POST /api/driver/profile/vehicle
Create/update vehicle (Step 4).

### POST /api/driver/profile/taxi-license
Create/update taxi license (Step 5).

## Registration Flow Logic

1. **Step 1 (Personal)**: Creates DriverProfile, sets registration_step='passport'
2. **Step 2 (Passport)**: Creates DriverPassport, sets registration_step='license'
3. **Step 3 (License)**: Creates DriverLicense + EmergencyContacts, sets registration_step='vehicle'
4. **Step 4 (Vehicle)**: Creates DriverVehicle, sets registration_step='taxi_license'
5. **Step 5 (Taxi)**: Creates DriverTaxiLicense, sets registration_step='complete', is_complete=true

Each endpoint automatically advances the registration step on successful save.

## Error Handling

All endpoints:
- Require authentication (401 if missing)
- Validate required fields
- Return standardized error responses
- Handle database errors gracefully

## Database Relationships

```
users (1) ←→ (1) driver_profiles
                   ↓ (1:1) driver_passports
                   ↓ (1:1) driver_licenses
                   ↓ (1:1) driver_vehicles
                   ↓ (1:1) driver_taxi_licenses
                   ↓ (1:N) emergency_contacts
```

All foreign keys use CASCADE delete.

## Testing

1. Run migrations:
   ```bash
   cd apps/api
   npx sequelize-cli db:migrate
   ```

2. Start API:
   ```bash
   npm run dev
   ```

3. Test endpoints with Postman or curl:
   ```bash
   # Get profile status
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/driver/profile/status
   ```

## Migration Order

Migrations must run in order:
1. `20250201000001-create-driver-profiles.cjs`
2. `20250201000002-create-driver-passports.cjs`
3. `20250201000003-create-driver-licenses.cjs`
4. `20250201000004-create-emergency-contacts.cjs`
5. `20250201000005-create-driver-vehicles.cjs`
6. `20250201000006-create-driver-taxi-licenses.cjs`

## Notes

- All dates stored as DATEONLY (YYYY-MM-DD)
- Photos stored as URLs (implement file upload separately)
- Fuel types stored as JSONB array
- Empty fields filtered before save
- User role auto-updated to 'driver' on first profile save
- registration_step tracks exact progress

