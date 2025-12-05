# Driver Offers - Mobile App Implementation Status

## ✅ Completed

### 1. API Client (`api/driverOffers.ts`)
- ✅ Complete API client with all CRUD operations
- ✅ Type definitions for DriverOffer and status types
- ✅ All endpoints: create, update, submit, publish, archive, delete
- ✅ Error handling with timeouts

### 2. API Configuration (`config/api.ts`)
- ✅ Added driver offers endpoints to API configuration

### 3. Translations (`translations/uz.ts`)
- ✅ Complete Uzbek translations for:
  - Driver offers list screen
  - Offer wizard (4 steps)
  - Status labels
  - Action buttons
  - Error messages

### 4. Offers List Screen (`screens/OffersListScreen.tsx`)
- ✅ Complete list view with status badges
- ✅ Status filtering (all, draft, pending_review, approved, published, rejected, archived)
- ✅ Pull-to-refresh
- ✅ Action buttons (edit, submit, publish, archive, delete)
- ✅ Empty state with create button
- ✅ Rejection reason display
- ✅ Formatting for dates and prices
- ✅ Color-coded status badges

### 5. Navigation
- ✅ Added "My Offers" menu item to ProfileScreen
- ✅ Added OffersListScreen to MainNavigator
- ✅ Export added to screens/index.ts

## 🚧 Pending Implementation

### 1. Offer Wizard Screen (4 Steps)
**Location:** `screens/OfferWizardScreen.tsx`

**Steps to implement:**

#### Step 1: Route Selection
- Text inputs for "From" and "To" locations
- Optional: Future map integration for coordinate selection
- Navigation: Next button

#### Step 2: Date & Time Selection
- Date picker for departure date
- Time picker for departure time
- Validation: Must be at least 30 minutes in the future
- Navigation: Back and Next buttons

#### Step 3: Seats & Price
- Number input for seats (1-8)
- Number input for price per seat
- Currency selector (default: UZS)
- Vehicle selector (dropdown from driver's vehicles)
- Optional note textarea
- Validation:
  - Seats: 1-8
  - Price: Minimum 5000 UZS
- Navigation: Back and Next buttons

#### Step 4: Review & Submit
- Display all entered information
- Edit button to go back
- Action buttons:
  - Save as Draft
  - Submit for Review (only for new offers or draft/rejected)
  - Update Offer (for existing offers)

**Navigation Structure:**
```typescript
// Use a stepper component or simple state management
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState<CreateOfferData>({
  vehicle_id: '',
  from_text: '',
  to_text: '',
  start_at: '',
  seats_total: 1,
  price_per_seat: 5000,
  currency: 'UZS',
  note: '',
});
```

**Key Features:**
- Load existing offer data if editing (offerId prop)
- Form validation at each step
- Save draft functionality
- Vehicle list loading from driver profile

### 2. Vehicle Selection Helper
- Need to fetch driver's vehicle from `/driver/profile` endpoint
- Display vehicle make, model, license plate
- Select vehicle for the offer

## 📝 Implementation Guide for OfferWizard

### Step 1: Setup
```typescript
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import * as DriverOffersAPI from '../api/driverOffers';
import * as DriverAPI from '../api/driver';
```

### Step 2: State Management
```typescript
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState<Partial<CreateOfferData>>({});
const [vehicles, setVehicles] = useState([]);
const [loading, setLoading] = useState(false);
const route = useRoute();
const { offerId } = route.params || {};
```

### Step 3: Load Existing Offer (if editing)
```typescript
useEffect(() => {
  if (offerId) {
    loadOffer(offerId);
  }
  loadVehicles();
}, [offerId]);
```

### Step 4: Create Stepper UI
- Show step indicator (1/4, 2/4, 3/4, 4/4)
- Conditional rendering based on `currentStep`
- Navigation buttons (Back/Next/Save/Submit)

### Step 5: Validation
```typescript
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      return !!(formData.from_text && formData.to_text);
    case 2:
      // Validate date/time (30 min advance)
      return !!formData.start_at;
    case 3:
      // Validate seats (1-8), price (>=5000), vehicle
      return !!(formData.seats_total && formData.price_per_seat >= 5000 && formData.vehicle_id);
    default:
      return true;
  }
};
```

### Step 6: Submit Handler
```typescript
const handleSave = async (submit: boolean = false) => {
  if (!validateStep(currentStep)) return;
  
  setLoading(true);
  try {
    if (offerId) {
      await DriverOffersAPI.updateDriverOffer(token, offerId, formData);
    } else {
      await DriverOffersAPI.createDriverOffer(token, formData as CreateOfferData);
    }
    
    if (submit) {
      await DriverOffersAPI.submitDriverOffer(token, offerId || createdOffer.id);
    }
    
    navigation.goBack();
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
};
```

## 🎨 UI Components Needed

### Date/Time Picker
- Use `@react-native-community/datetimepicker` or similar
- Or create custom date/time selection UI

### Vehicle Selector
- Dropdown/picker showing:
  - Make + Model
  - License Plate
  - Year

### Stepper Component
- Visual indicator showing current step
- Progress bar or dots

## 📋 Testing Checklist

- [ ] Create new offer (draft)
- [ ] Create and submit offer
- [ ] Edit draft offer
- [ ] Edit rejected offer
- [ ] View offer details
- [ ] Submit offer for review
- [ ] Publish approved offer
- [ ] Archive offer
- [ ] Delete offer
- [ ] Validation errors display correctly
- [ ] Form data persists across steps
- [ ] Navigation works correctly
- [ ] Loading states display
- [ ] Error handling works

## 🔗 Related Files

1. **API Client:** `driver-app-standalone/api/driverOffers.ts`
2. **List Screen:** `driver-app-standalone/screens/OffersListScreen.tsx`
3. **Translations:** `driver-app-standalone/translations/uz.ts`
4. **Navigation:** `driver-app-standalone/navigation/MainNavigator.tsx`
5. **Profile Screen:** `driver-app-standalone/screens/ProfileScreen.tsx`

## 🚀 Next Steps

1. Implement OfferWizardScreen with 4 steps
2. Add date/time picker component
3. Add vehicle selection component
4. Test all flows
5. Add loading states and error handling
6. Polish UI/UX

## 📝 Notes

- The backend API is fully functional and tested
- All translations are ready
- The list screen is complete and functional
- Only the wizard screen needs to be implemented
- The wizard should follow the same design patterns as other screens (DriverVehicleScreen, etc.)

