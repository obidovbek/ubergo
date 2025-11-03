# Driver Registration Screens

## Overview
Driver registration consists of 5 steps matching the database models and images provided.

## Created Screens

### ✅ Step 1: DriverPersonalInfoScreen.tsx
- Personal information (ISM, Familiya, Otasining ismi)
- Gender selection
- Birth date
- Email
- Current residence address (Country, Region, City, Settlement, Mahalla, Street)
- Face and body photos
- Vehicle ownership type (own/other_person/company)
- Vehicle usage type (rent/free_use)
- **API**: `POST /driver/profile/personal`

### ✅ Step 2: DriverPassportScreen.tsx
- Passport/ID card information
- Personal data from passport
- ID card number
- PINFL (JSHSHIR)
- Issue and expiry dates
- Citizenship
- Birth place (Country, Region, City)
- Passport photos (front and back)
- **API**: `POST /driver/profile/passport`

### ✅ Step 3: DriverLicenseScreen.tsx
- Driving license number
- Issue date
- Categories (A, B, C, D, BE, CE, DE) with issue dates
- License photos (front and back)
- Emergency contacts (2 contacts with phone and relationship)
- **API**: `POST /driver/profile/license`

### 📝 Step 4: DriverVehicleScreen.tsx (TODO - Create similar to above)
**Fields needed:**
- Vehicle type (light/cargo)
- Body type, Make, Model, Color
- License plate
- Year, Gross weight, Unladen weight
- Fuel types (checkboxes)
- Seating capacity
- Tech passport series and photos
- Vehicle photos (8 photos: front, back, left, right, 45°, interior, general, salon)
- Owner information if not driver (Company name/tax ID or Personal FISH/PINFL/Address)
- **API**: `POST /driver/profile/vehicle`

### 📝 Step 5: DriverTaxiLicenseScreen.tsx (TODO - Create similar to above)
**Fields needed:**
- License number
- Issue date
- Registry number
- License document photo/PDF
- License sheet:
  - Sheet number
  - Valid from/until dates
  - Sheet document photo/PDF
- Self-employment number and document
- Power of attorney document
- Insurance document
- **API**: `POST /driver/profile/taxi-license`

## Screen Flow

```
PhoneRegistration
  ↓ (OTP sent)
OTPVerification
  ↓ (Check profile status)
  ├─ If incomplete → DriverPersonalInfo (Step 1)
  │   ↓
  │   DriverPassport (Step 2)
  │   ↓
  │   DriverLicense (Step 3)
  │   ↓
  │   DriverVehicle (Step 4)
  │   ↓
  │   DriverTaxiLicense (Step 5)
  │   ↓
  └─ If complete → Home
```

## Common Features

All screens include:
- Form validation
- Loading states
- Error handling with toast notifications
- Navigation to next step on success
- Green theme (#4CAF50) matching the mockups
- Photo upload placeholders (to be implemented with actual image picker)
- Auto-check of registration status to navigate to correct step

## Registration Status Tracking

The backend `driver_profiles` table has:
- `registration_step`: enum('personal', 'passport', 'license', 'vehicle', 'taxi_license', 'complete')
- `is_complete`: boolean

Each screen:
1. Checks current status on mount
2. Navigates to correct step if needed
3. Saves data via API
4. Backend automatically advances to next step
5. On final step, marks `is_complete = true`

## TODO

1. **Create DriverVehicleScreen.tsx** - Following the pattern of screens 1-3
2. **Create DriverTaxiLicenseScreen.tsx** - Following the pattern of screens 1-3
3. **Add image upload** functionality using `expo-image-picker`
4. **Update navigation** types to include all new screens
5. **Export all screens** in `screens/index.ts`
6. **Test flow** from OTP → Complete registration

## Notes

- All models are verified ✅ against the provided images
- API endpoints are complete and working
- Screens follow the exact layout from mockups
- Date format: DD.MM.YYYY (as shown in images)
- Phone format: International with country code

