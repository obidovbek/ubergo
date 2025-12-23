# Passenger Offers Implementation

## Overview
This document describes the implementation of the **Passenger Offers** feature, which allows passengers to create ride requests and drivers to send join requests for those offers. This is the reverse flow of the existing Driver Offers feature.

## Implementation Date
December 10, 2025

## Feature Description
- **Passengers** can create ride requests specifying:
  - Departure and destination locations
  - Date and time
  - Number of seats needed
  - Maximum price per seat they're willing to pay
  - Additional notes

- **Drivers** can:
  - Browse passenger ride requests
  - Send join requests with their offered price
  - View status of their join requests

- **Passengers** can:
  - View drivers who sent join requests
  - Confirm or reject driver requests
  - Manage their ride requests (cancel, archive, etc.)

## Backend Implementation

### 1. Database Models

#### PassengerOffer Model
**File**: `api,admin,db/apps/api/src/database/models/PassengerOffer.ts`

**Fields**:
- `id`: INTEGER (Primary Key)
- `user_id`: INTEGER (Foreign Key to users)
- `from_text`: TEXT (Departure location)
- `from_lat`, `from_lng`: DECIMAL (Optional coordinates)
- `to_text`: TEXT (Destination)
- `to_lat`, `to_lng`: DECIMAL (Optional coordinates)
- `start_at`: DATE (Trip start time)
- `seats_needed`: INTEGER (1-8)
- `max_price_per_seat`: DECIMAL (Maximum price passenger will pay)
- `currency`: CHAR(3) (Default: 'UZS')
- `note`: TEXT (Optional notes)
- `status`: ENUM ('published', 'archived', 'cancelled', 'completed')

#### OfferDriver Model
**File**: `api,admin,db/apps/api/src/database/models/OfferDriver.ts`

**Fields**:
- `id`: UUID (Primary Key)
- `offer_id`: INTEGER (Foreign Key to passenger_offers)
- `driver_id`: INTEGER (Foreign Key to users)
- `vehicle_id`: UUID (Foreign Key to driver_vehicles)
- `seats_offered`: INTEGER (Seats driver can provide)
- `offered_price_per_seat`: DECIMAL (Price driver is offering)
- `total_offered_price`: DECIMAL (Total price calculation)
- `currency`: CHAR(3)
- `status`: ENUM ('pending', 'confirmed', 'rejected', 'cancelled')
- `message`: TEXT (Optional message from driver)
- `rejection_reason`: TEXT (Optional)
- `confirmed_at`, `rejected_at`, `cancelled_at`: DATE (Timestamps)

### 2. Database Migrations

**Files**:
- `api,admin,db/apps/api/src/database/migrations/20251210000001-create-passenger-offers.cjs`
- `api,admin,db/apps/api/src/database/migrations/20251210000002-create-offer-drivers.cjs`

**To run migrations**:
```bash
cd api,admin,db/apps/api
npm run migrate
```

### 3. Services

#### PassengerOfferService
**File**: `api,admin,db/apps/api/src/services/PassengerOfferService.ts`

**Methods**:
- `getUserOffers(userId, filters)` - Get passenger's offers
- `getOfferById(offerId, userId)` - Get single offer
- `createOffer(userId, data, req)` - Create new offer
- `updateOffer(offerId, userId, data, req)` - Update offer
- `cancelOffer(offerId, userId, req)` - Cancel offer
- `publishOffer(offerId, userId, req)` - Publish offer
- `archiveOffer(offerId, userId, req)` - Archive offer
- `completeOffer(offerId, userId, req)` - Mark as completed
- `deleteOffer(offerId, userId, req)` - Delete offer
- `getPublicOffers(filters)` - Get public offers for drivers

#### OfferDriverService
**File**: `api,admin,db/apps/api/src/services/OfferDriverService.ts`

**Methods**:
- `joinOffer(driverId, data, req)` - Driver joins passenger offer
- `confirmDriver(passengerId, driverJoinId, req)` - Passenger confirms driver
- `rejectDriver(passengerId, driverJoinId, rejectionReason, req)` - Passenger rejects driver
- `cancelJoin(driverId, driverJoinId, req)` - Driver cancels join request
- `getDriverJoinRequests(driverId, status)` - Get driver's join requests
- `getOfferDrivers(passengerId, offerId)` - Get drivers for an offer

### 4. Controllers

**Files**:
- `api,admin,db/apps/api/src/controllers/PassengerOfferController.ts`
- `api,admin,db/apps/api/src/controllers/OfferDriverController.ts`
- `api,admin,db/apps/api/src/controllers/PublicPassengerOfferController.ts`

### 5. API Routes

#### Passenger Routes (User App)
**Base**: `/api/passenger/offers`

- `GET /` - Get user's passenger offers
- `GET /:id` - Get offer by ID
- `POST /` - Create new passenger offer
- `PATCH /:id` - Update passenger offer
- `POST /:id/cancel` - Cancel offer
- `POST /:id/publish` - Publish offer
- `POST /:id/archive` - Archive offer
- `POST /:id/complete` - Complete offer
- `DELETE /:id` - Delete offer

#### Driver Routes (Driver App)
**Base**: `/api/driver`

- `POST /passenger-offers/:offerId/join` - Driver joins passenger offer
- `POST /join-requests/:id/cancel` - Driver cancels join request
- `GET /join-requests` - Get driver's join requests

#### Passenger-Driver Management
**Base**: `/api/passenger`

- `GET /offers/:offerId/drivers` - Get drivers for an offer
- `POST /drivers/:id/confirm` - Confirm driver
- `POST /drivers/:id/reject` - Reject driver

#### Public Routes
**Base**: `/api/public/passenger-offers`

- `GET /` - Browse passenger offers (for drivers)
- `GET /:id` - Get passenger offer details

## Frontend Implementation

### User App (Passenger Side)

#### 1. API Client
**File**: `user-app-standalone/api/passengerOffers.ts`

**Functions**:
- `getMyPassengerOffers(status)` - Get user's offers
- `getPassengerOfferById(offerId)` - Get offer details
- `createPassengerOffer(offerData)` - Create new offer
- `updatePassengerOffer(offerId, offerData)` - Update offer
- `cancelPassengerOffer(offerId)` - Cancel offer
- `deletePassengerOffer(offerId)` - Delete offer
- `getOfferDrivers(offerId)` - Get drivers for offer
- `confirmDriver(driverJoinId)` - Confirm driver
- `rejectDriver(driverJoinId, rejectionReason)` - Reject driver

#### 2. Screens

**CreatePassengerOfferScreen**
**File**: `user-app-standalone/screens/CreatePassengerOfferScreen.tsx`

Features:
- Form to create ride request
- Location inputs (from/to)
- Date and time pickers
- Seats needed input
- Maximum price input
- Optional notes
- Validation and error handling

**MyPassengerOffersScreen**
**File**: `user-app-standalone/screens/MyPassengerOffersScreen.tsx`

Features:
- List of user's passenger offers
- Filter by status (all, published, completed, cancelled)
- View driver interest count
- Cancel offers
- Pull to refresh
- Navigate to offer details

#### 3. Menu Integration
**File**: `user-app-standalone/screens/MenuScreen.tsx`

Added menu options:
- "Create Ride Request" - Navigate to CreatePassengerOfferScreen
- "My Ride Requests" - Navigate to MyPassengerOffersScreen

### Driver App (Driver Side)

#### 1. API Client
**File**: `driver-app-standalone/api/passengerOffers.ts`

**Functions**:
- `searchPassengerOffers(params)` - Search passenger offers
- `getPassengerOfferById(offerId)` - Get offer details
- `joinPassengerOffer(offerId, joinData)` - Join passenger offer
- `getMyJoinRequests(status)` - Get driver's join requests
- `cancelJoinRequest(joinRequestId)` - Cancel join request

#### 2. Screens

**SearchPassengerOffersScreen**
**File**: `driver-app-standalone/screens/SearchPassengerOffersScreen.tsx`

Features:
- Browse passenger ride requests
- Search by location (from/to)
- Sort options (date, price, seats)
- View passenger details
- See maximum price offered
- Navigate to offer details to join

## Database Schema

### passenger_offers Table
```sql
CREATE TABLE passenger_offers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_text TEXT NOT NULL,
  from_lat DECIMAL(10, 7),
  from_lng DECIMAL(10, 7),
  to_text TEXT NOT NULL,
  to_lat DECIMAL(10, 7),
  to_lng DECIMAL(10, 7),
  start_at TIMESTAMPTZ NOT NULL,
  seats_needed INTEGER NOT NULL CHECK (seats_needed BETWEEN 1 AND 8),
  max_price_per_seat DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'UZS',
  note TEXT,
  status enum_passenger_offers_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### offer_drivers Table
```sql
CREATE TABLE offer_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id INTEGER NOT NULL REFERENCES passenger_offers(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES driver_vehicles(id) ON DELETE CASCADE,
  seats_offered INTEGER NOT NULL DEFAULT 1 CHECK (seats_offered BETWEEN 1 AND 8),
  offered_price_per_seat DECIMAL(10, 2) NOT NULL,
  total_offered_price DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'UZS',
  status enum_offer_drivers_status NOT NULL DEFAULT 'pending',
  message TEXT,
  rejection_reason TEXT,
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(offer_id, driver_id)
);
```

## Usage Flow

### Passenger Flow
1. Passenger opens user app
2. Navigates to "Create Ride Request"
3. Fills in trip details (from, to, date, time, seats, max price)
4. Submits the request
5. Request is published and visible to drivers
6. Passenger receives notifications when drivers send join requests
7. Passenger views interested drivers in "My Ride Requests"
8. Passenger reviews driver offers (price, vehicle, rating)
9. Passenger confirms a driver
10. Offer status changes to "completed"

### Driver Flow
1. Driver opens driver app
2. Navigates to "Passenger Requests" (browse feature)
3. Searches for passenger offers by location
4. Views passenger offer details
5. Sends join request with offered price and vehicle
6. Waits for passenger confirmation
7. Receives notification when passenger confirms/rejects
8. If confirmed, trip is arranged

## Push Notifications

The system sends push notifications for:
- **To Passenger**: When a driver sends a join request
- **To Driver**: When passenger confirms/rejects the request
- **To Passenger**: When a driver cancels their request

## Testing

### Backend Testing
```bash
# Run migrations
cd api,admin,db/apps/api
npm run migrate

# Start the API server
npm run dev
```

### Test API Endpoints
```bash
# Create passenger offer
POST /api/passenger/offers
{
  "from_text": "Tashkent",
  "to_text": "Samarkand",
  "start_at": "2025-12-15T10:00:00Z",
  "seats_needed": 2,
  "max_price_per_seat": 50000,
  "currency": "UZS"
}

# Search passenger offers (driver)
GET /api/public/passenger-offers?from_text=Tashkent&to_text=Samarkand

# Driver joins offer
POST /api/driver/passenger-offers/1/join
{
  "vehicle_id": "uuid-here",
  "seats_offered": 2,
  "offered_price_per_seat": 45000
}

# Passenger confirms driver
POST /api/passenger/drivers/{join_id}/confirm
```

## Future Enhancements

1. **Real-time Updates**: Add WebSocket support for real-time offer updates
2. **Chat Feature**: Allow passengers and drivers to chat before confirming
3. **Rating System**: Add ratings for passengers (similar to driver ratings)
4. **Price Negotiation**: Allow counter-offers between passenger and driver
5. **Route Optimization**: Suggest optimal routes and stops
6. **Payment Integration**: Integrate payment gateway for secure transactions
7. **Insurance**: Add trip insurance options
8. **Multi-stop Support**: Allow passengers to add multiple stops
9. **Recurring Requests**: Allow passengers to create recurring ride requests
10. **Advanced Filters**: Add more search filters (vehicle type, driver rating, etc.)

## Notes

- All prices are stored in the smallest currency unit (e.g., UZS)
- Minimum advance time for offers is 30 minutes
- Maximum seats allowed is 8
- Offers automatically expire after the start time
- Push notifications require proper Firebase configuration
- All API endpoints require authentication except public browsing endpoints

## Related Files

### Backend
- Models: `api,admin,db/apps/api/src/database/models/`
- Services: `api,admin,db/apps/api/src/services/`
- Controllers: `api,admin,db/apps/api/src/controllers/`
- Routes: `api,admin,db/apps/api/src/routes/`
- Migrations: `api,admin,db/apps/api/src/database/migrations/`

### Frontend (User App)
- API: `user-app-standalone/api/passengerOffers.ts`
- Screens: `user-app-standalone/screens/`
  - `CreatePassengerOfferScreen.tsx`
  - `MyPassengerOffersScreen.tsx`
  - `MenuScreen.tsx`

### Frontend (Driver App)
- API: `driver-app-standalone/api/passengerOffers.ts`
- Screens: `driver-app-standalone/screens/`
  - `SearchPassengerOffersScreen.tsx`

## Support

For questions or issues, please contact the development team or create an issue in the project repository.



