# Passenger Join System - Implementation Guide

## Overview
This document describes the complete implementation of the passenger join system where passengers can search for driver offers, join them, and drivers receive push notifications to confirm or reject passengers.

## Architecture

### Database Layer

#### New Table: `offer_passengers`
- Tracks passengers who join driver offers
- Status flow: `pending` → `confirmed` or `rejected` or `cancelled`
- Foreign keys to `driver_offers` and `users`
- Includes seat requests, messages, and timestamps

**Migration**: `20250310000001-create-offer-passengers.cjs`

**Model**: `OfferPassenger.ts`

### API Layer

#### New Service: `OfferPassengerService.ts`
Handles all business logic for passenger joins:

**Methods:**
- `joinOffer()` - Passenger joins an offer (creates pending request)
- `confirmPassenger()` - Driver confirms passenger
- `rejectPassenger()` - Driver rejects passenger with optional reason
- `cancelJoin()` - Passenger cancels their join request
- `getOfferPassengers()` - Get all passengers for an offer (driver view)
- `getPassengerBookings()` - Get passenger's bookings

**Features:**
- Automatic seat availability checking
- Push notifications to both driver and passenger
- Audit logging for all actions
- Seat count management (seats_free updates)

#### New Controller: `OfferPassengerController.ts`
HTTP endpoints for passenger operations:

**Passenger Endpoints:**
- `POST /api/passenger/offers/:offerId/join` - Join an offer
- `POST /api/passenger/bookings/:id/cancel` - Cancel join request
- `GET /api/passenger/bookings` - Get my bookings

**Driver Endpoints:**
- `GET /api/driver/offers/:offerId/passengers` - Get offer passengers
- `POST /api/driver/passengers/:id/confirm` - Confirm passenger
- `POST /api/driver/passengers/:id/reject` - Reject passenger

#### Routes: `offer-passenger.routes.ts`
All routes require authentication via `authMiddleware`

### Push Notifications

#### Notification Flow

**When Passenger Joins:**
```
Passenger → API → Create OfferPassenger (pending)
                → Send Push to Driver
                → "New Passenger Request"
```

**When Driver Confirms:**
```
Driver → API → Update OfferPassenger (confirmed)
             → Update seats_free
             → Send Push to Passenger
             → "Ride Confirmed!"
```

**When Driver Rejects:**
```
Driver → API → Update OfferPassenger (rejected)
             → Send Push to Passenger
             → "Request Declined"
```

**When Passenger Cancels:**
```
Passenger → API → Update OfferPassenger (cancelled)
                → Restore seats_free (if was confirmed)
                → Send Push to Driver
                → "Passenger Cancelled"
```

#### Push Notification Data
All notifications include:
- `type`: Notification type identifier
- `offer_id`: Related offer ID
- `passenger_join_id`: Join request ID
- Additional context (seats, status, etc.)

### Mobile Apps

#### User App (Passenger)

**New API Client: `api/offers.ts`**
```typescript
- searchOffers() - Search published offers
- getOfferDetails() - Get offer details
- joinOffer() - Join an offer
- cancelJoin() - Cancel join request
- getMyBookings() - Get my bookings
```

**New Screens:**

1. **SearchOffersScreen.tsx**
   - Search offers by from/to/date
   - Display list of available offers
   - Show driver info, vehicle, price, seats
   - Navigate to offer details

2. **OfferDetailsScreen.tsx**
   - Full offer information
   - Select number of seats
   - Optional message to driver
   - Join button with confirmation
   - Price calculation

3. **MyBookingsScreen.tsx**
   - List all bookings
   - Filter by status (all/pending/confirmed)
   - Status badges with colors
   - Cancel button for pending/confirmed
   - Show rejection reasons

#### Driver App

**New API Client: `api/offerPassengers.ts`**
```typescript
- getOfferPassengers() - Get passengers for offer
- confirmPassenger() - Confirm a passenger
- rejectPassenger() - Reject with reason
```

**New Screen:**

1. **OfferPassengersScreen.tsx**
   - Summary: Pending/Confirmed counts
   - List all passengers
   - Status badges
   - Passenger info (name, seats, message)
   - Action buttons (Confirm/Reject)
   - Rejection reason modal

**Updated:**
- Add "View Passengers" button to offer cards
- Show pending passenger count badge

## Status Flow

```
┌─────────────────────────────────────────────────────┐
│                  Passenger Joins                    │
│                   (status: pending)                 │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
               ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │  Driver Confirms │   │  Driver Rejects  │
    │ (status: confirmed)│   │ (status: rejected)│
    └──────────┬─────────┘   └──────────────────┘
               │
               ▼
    ┌──────────────────┐
    │Passenger Cancels │
    │(status: cancelled)│
    └──────────────────┘
```

## Seat Management

### Automatic Seat Updates

**When Passenger Confirmed:**
```javascript
seats_free = seats_free - seats_requested
```

**When Confirmed Passenger Cancels:**
```javascript
seats_free = seats_free + seats_requested
```

**Validation:**
- Check `seats_free >= seats_requested` before confirming
- Prevent joining if not enough seats
- Prevent double-joining same offer

## Security & Validation

### Authorization Checks
- Passengers can only join others' offers
- Drivers can only manage their own offers' passengers
- Users can only cancel their own join requests

### Validation Rules
- Offer must be `published` and in the future
- Seats requested: 1-8
- Seats requested ≤ seats_free
- No duplicate joins (same passenger + offer)
- Status transitions must be valid

### Audit Logging
All actions logged with:
- User ID
- Action type
- Payload (offer_id, seats, etc.)
- Request metadata

## Testing Checklist

### API Tests
- [ ] Passenger can join published offer
- [ ] Passenger cannot join own offer
- [ ] Passenger cannot join twice
- [ ] Passenger cannot join if not enough seats
- [ ] Driver receives push notification on join
- [ ] Driver can confirm pending passenger
- [ ] Driver can reject pending passenger
- [ ] Passenger receives push on confirm/reject
- [ ] Seats_free updates correctly
- [ ] Passenger can cancel pending request
- [ ] Passenger can cancel confirmed request
- [ ] Seats restored on cancel

### Mobile App Tests
- [ ] Search offers displays results
- [ ] Offer details shows all info
- [ ] Join offer creates pending request
- [ ] My bookings shows all bookings
- [ ] Status filters work correctly
- [ ] Cancel booking works
- [ ] Driver sees passenger list
- [ ] Driver can confirm/reject
- [ ] Push notifications received
- [ ] Real-time updates work

## Performance Optimizations

### Database Indexes
```sql
-- offer_passengers table
CREATE INDEX idx_offer_passengers_offer_status ON offer_passengers(offer_id, status);
CREATE INDEX idx_offer_passengers_passenger_status ON offer_passengers(passenger_id, status);
CREATE UNIQUE INDEX idx_offer_passengers_offer_passenger ON offer_passengers(offer_id, passenger_id);
```

### API Optimizations
- Eager loading with Sequelize `include`
- Pagination for search results (limit: 20)
- Status filtering at database level
- Minimal data transfer (only required fields)

### Push Notification Optimizations
- Batch send to multiple tokens
- Automatic token cleanup (deactivate invalid)
- Error handling with retries
- Async processing (non-blocking)

## Future Enhancements

### Phase 2
- [ ] Real-time updates via WebSocket
- [ ] In-app chat between driver and passenger
- [ ] Rating system after trip completion
- [ ] Payment integration
- [ ] Route tracking with GPS
- [ ] Estimated arrival time
- [ ] Passenger pickup points

### Phase 3
- [ ] Recurring offers (weekly schedules)
- [ ] Offer templates
- [ ] Favorite routes
- [ ] Driver preferences (smoking, pets, etc.)
- [ ] Passenger verification
- [ ] Insurance integration
- [ ] Multi-language support

## API Endpoints Summary

### Public (No Auth)
```
GET  /api/public/driver-offers          - Search offers
GET  /api/public/driver-offers/:id      - Get offer details
```

### Passenger (Auth Required)
```
POST /api/passenger/offers/:id/join     - Join offer
POST /api/passenger/bookings/:id/cancel - Cancel join
GET  /api/passenger/bookings            - Get bookings
```

### Driver (Auth Required)
```
GET  /api/driver/offers/:id/passengers  - Get passengers
POST /api/driver/passengers/:id/confirm - Confirm passenger
POST /api/driver/passengers/:id/reject  - Reject passenger
```

## Configuration

### Environment Variables
```env
# Firebase (for push notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=./ubexgo-firebase-adminsdk.json

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ubexgo
DB_USER=postgres
DB_PASSWORD=password
```

### Mobile App Config
```typescript
// user-app-standalone/config/api.ts
export const API_BASE_URL = 'https://test3.fstu.uz/api';

// driver-app-standalone/config/api.ts
export const API_BASE_URL = 'https://test3.fstu.uz/api';
```

## Deployment

### Database Migration
```bash
cd api,admin,db/apps/api
npm run migrate
```

### API Deployment
```bash
cd api,admin,db/apps/api
npm run build
npm start
```

### Mobile Apps
```bash
# User App
cd user-app-standalone
npm run android  # or npm run ios

# Driver App
cd driver-app-standalone
npm run android  # or npm run ios
```

## Troubleshooting

### Push Notifications Not Working
1. Check Firebase service account credentials
2. Verify push token registration
3. Check token validity in database
4. Review PushService logs

### Seats Not Updating
1. Verify transaction handling
2. Check seat validation logic
3. Review OfferPassengerService.confirmPassenger()

### Join Request Failing
1. Check offer status (must be published)
2. Verify seat availability
3. Check for duplicate joins
4. Review validation errors

## Support

For issues or questions:
- Check logs in API server
- Review mobile app console
- Check database records
- Verify push token status

