# System Architecture - Passenger Join System

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APPS                             │
├──────────────────────────┬──────────────────────────────────────┤
│     User App             │         Driver App                   │
│  (Passenger)             │         (Driver)                     │
│                          │                                      │
│  • SearchOffersScreen    │  • OffersListScreen                  │
│  • OfferDetailsScreen    │  • OfferPassengersScreen             │
│  • MyBookingsScreen      │  • OfferDetailModal                  │
│                          │                                      │
│  API Client:             │  API Client:                         │
│  • offers.ts             │  • driverOffers.ts                   │
│                          │  • offerPassengers.ts                │
└──────────────────────────┴──────────────────────────────────────┘
                           │
                           │ HTTPS/REST API
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      API SERVER (Node.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    ROUTES                               │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  • /api/public/driver-offers (search, details)          │  │
│  │  • /api/passenger/offers/:id/join                       │  │
│  │  • /api/passenger/bookings                              │  │
│  │  • /api/driver/offers/:id/passengers                    │  │
│  │  • /api/driver/passengers/:id/confirm                   │  │
│  │  • /api/driver/passengers/:id/reject                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                  CONTROLLERS                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • OfferPassengerController                              │  │
│  │  • DriverOfferController                                 │  │
│  │  • PublicOfferController                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                   SERVICES                               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • OfferPassengerService (business logic)                │  │
│  │    - joinOffer()                                         │  │
│  │    - confirmPassenger()                                  │  │
│  │    - rejectPassenger()                                   │  │
│  │    - cancelJoin()                                        │  │
│  │    - getOfferPassengers()                                │  │
│  │    - getPassengerBookings()                              │  │
│  │                                                          │  │
│  │  • PushService (notifications)                           │  │
│  │  • DriverOfferService                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                    MODELS (Sequelize)                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • OfferPassenger                                        │  │
│  │  • DriverOffer                                           │  │
│  │  • User                                                  │  │
│  │  • PushToken                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ SQL Queries
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tables:                                                        │
│  • offer_passengers (new)                                       │
│    - id, offer_id, passenger_id                                 │
│    - seats_requested, is_front_seat                             │
│    - status, message, rejection_reason                          │
│    - timestamps                                                 │
│                                                                 │
│  • driver_offers                                                │
│    - id, user_id, vehicle_id                                    │
│    - from_text, to_text, start_at                               │
│    - seats_total, seats_free                                    │
│    - price_per_seat, currency, status                           │
│                                                                 │
│  • users                                                        │
│  • push_tokens                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ FCM API
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                  FIREBASE CLOUD MESSAGING                       │
├─────────────────────────────────────────────────────────────────┤
│  Push Notifications to:                                         │
│  • Driver (when passenger joins)                                │
│  • Passenger (when confirmed/rejected)                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagrams

### Flow 1: Passenger Joins Offer

```
┌──────────────┐
│  Passenger   │
│  (User App)  │
└──────┬───────┘
       │ 1. Search offers
       │ GET /api/public/driver-offers?from=...&to=...
       ▼
┌──────────────────────┐
│  PublicOfferController│
│  DriverOfferService  │
└──────┬───────────────┘
       │ 2. Query published offers
       ▼
┌──────────────┐
│  Database    │
│ driver_offers│
└──────┬───────┘
       │ 3. Return offers
       ▼
┌──────────────┐
│  User App    │
│ Display list │
└──────┬───────┘
       │ 4. User selects offer & taps "Join"
       │ POST /api/passenger/offers/:id/join
       │ { seats_requested: 2, message: "..." }
       ▼
┌──────────────────────────┐
│ OfferPassengerController │
│ OfferPassengerService    │
└──────┬───────────────────┘
       │ 5. Validate:
       │    - Offer is published
       │    - Enough seats available
       │    - Not own offer
       │    - No duplicate join
       ▼
┌──────────────────┐
│    Database      │
│ offer_passengers │
│ (INSERT)         │
│ status: pending  │
└──────┬───────────┘
       │ 6. Get driver's push tokens
       ▼
┌──────────────┐
│  Database    │
│ push_tokens  │
└──────┬───────┘
       │ 7. Send push notification
       ▼
┌──────────────────┐
│  PushService     │
│  Firebase FCM    │
└──────┬───────────┘
       │ 8. Notification delivered
       ▼
┌──────────────┐
│   Driver     │
│ (Driver App) │
│ 🔔 New Join  │
│   Request    │
└──────────────┘
```

### Flow 2: Driver Confirms Passenger

```
┌──────────────┐
│   Driver     │
│ (Driver App) │
└──────┬───────┘
       │ 1. Opens notification or OfferPassengersScreen
       │ GET /api/driver/offers/:id/passengers
       ▼
┌──────────────────────────┐
│ OfferPassengerController │
│ OfferPassengerService    │
└──────┬───────────────────┘
       │ 2. Verify driver owns offer
       │ 3. Query passengers
       ▼
┌──────────────────┐
│    Database      │
│ offer_passengers │
│ JOIN users       │
└──────┬───────────┘
       │ 4. Return passenger list
       ▼
┌──────────────┐
│  Driver App  │
│ Display list │
│ [Pending]    │
│ [Confirmed]  │
└──────┬───────┘
       │ 5. Driver taps "Confirm"
       │ POST /api/driver/passengers/:id/confirm
       ▼
┌──────────────────────────┐
│ OfferPassengerController │
│ OfferPassengerService    │
└──────┬───────────────────┘
       │ 6. Validate:
       │    - Driver owns offer
       │    - Status is pending
       │    - Enough seats available
       ▼
┌──────────────────┐
│    Database      │
│ offer_passengers │
│ (UPDATE)         │
│ status: confirmed│
│ confirmed_at: NOW│
└──────┬───────────┘
       │ 7. Update seats_free
       ▼
┌──────────────┐
│  Database    │
│ driver_offers│
│ (UPDATE)     │
│ seats_free -= │
│ seats_requested│
└──────┬───────┘
       │ 8. Get passenger's push tokens
       ▼
┌──────────────┐
│  Database    │
│ push_tokens  │
└──────┬───────┘
       │ 9. Send push notification
       ▼
┌──────────────────┐
│  PushService     │
│  Firebase FCM    │
└──────┬───────────┘
       │ 10. Notification delivered
       ▼
┌──────────────┐
│  Passenger   │
│  (User App)  │
│ 🔔 Confirmed │
│    ✅        │
└──────────────┘
```

### Flow 3: Passenger Cancels Booking

```
┌──────────────┐
│  Passenger   │
│  (User App)  │
└──────┬───────┘
       │ 1. Opens MyBookingsScreen
       │ GET /api/passenger/bookings
       ▼
┌──────────────────────────┐
│ OfferPassengerController │
│ OfferPassengerService    │
└──────┬───────────────────┘
       │ 2. Query passenger's bookings
       ▼
┌──────────────────┐
│    Database      │
│ offer_passengers │
│ JOIN driver_offers│
└──────┬───────────┘
       │ 3. Return bookings
       ▼
┌──────────────┐
│  User App    │
│ Display list │
│ [Pending]    │
│ [Confirmed]  │
└──────┬───────┘
       │ 4. User taps "Cancel Booking"
       │ POST /api/passenger/bookings/:id/cancel
       ▼
┌──────────────────────────┐
│ OfferPassengerController │
│ OfferPassengerService    │
└──────┬───────────────────┘
       │ 5. Validate:
       │    - Passenger owns booking
       │    - Status is pending or confirmed
       ▼
┌──────────────────┐
│    Database      │
│ offer_passengers │
│ (UPDATE)         │
│ status: cancelled│
│ cancelled_at: NOW│
└──────┬───────────┘
       │ 6. If was confirmed, restore seats
       ▼
┌──────────────┐
│  Database    │
│ driver_offers│
│ (UPDATE)     │
│ seats_free += │
│ seats_requested│
└──────┬───────┘
       │ 7. Get driver's push tokens
       ▼
┌──────────────┐
│  Database    │
│ push_tokens  │
└──────┬───────┘
       │ 8. Send push notification
       ▼
┌──────────────────┐
│  PushService     │
│  Firebase FCM    │
└──────┬───────────┘
       │ 9. Notification delivered
       ▼
┌──────────────┐
│   Driver     │
│ (Driver App) │
│ 🔔 Passenger │
│   Cancelled  │
└──────────────┘
```

## 🗄️ Database Schema

```sql
┌─────────────────────────────────────────────────────────────┐
│                     offer_passengers                        │
├─────────────────────────────────────────────────────────────┤
│ id                 UUID         PRIMARY KEY                 │
│ offer_id           INTEGER      FK → driver_offers.id       │
│ passenger_id       INTEGER      FK → users.id               │
│ seats_requested    INTEGER      NOT NULL (1-8)              │
│ is_front_seat      BOOLEAN      DEFAULT false               │
│ status             ENUM         pending/confirmed/rejected/ │
│                                 cancelled                    │
│ message            TEXT         NULL                        │
│ rejection_reason   TEXT         NULL                        │
│ confirmed_at       TIMESTAMPTZ  NULL                        │
│ rejected_at        TIMESTAMPTZ  NULL                        │
│ cancelled_at       TIMESTAMPTZ  NULL                        │
│ created_at         TIMESTAMPTZ  NOT NULL                    │
│ updated_at         TIMESTAMPTZ  NOT NULL                    │
├─────────────────────────────────────────────────────────────┤
│ INDEXES:                                                    │
│  • idx_offer_passengers_offer_status                        │
│    (offer_id, status)                                       │
│  • idx_offer_passengers_passenger_status                    │
│    (passenger_id, status)                                   │
│  • idx_offer_passengers_offer_passenger (UNIQUE)            │
│    (offer_id, passenger_id)                                 │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    │                    │
        ┌───────────┘                    └───────────┐
        │                                            │
        ▼                                            ▼
┌──────────────────────┐                  ┌──────────────────┐
│   driver_offers      │                  │      users       │
├──────────────────────┤                  ├──────────────────┤
│ id (INTEGER)         │                  │ id (INTEGER)     │
│ user_id              │                  │ display_name     │
│ vehicle_id           │                  │ first_name       │
│ from_text            │                  │ last_name        │
│ to_text              │                  │ avatar_url       │
│ start_at             │                  │ ...              │
│ seats_total          │                  └──────────────────┘
│ seats_free           │
│ price_per_seat       │
│ currency             │
│ status               │
│ ...                  │
└──────────────────────┘
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     REQUEST FLOW                            │
└─────────────────────────────────────────────────────────────┘

Mobile App
    │
    │ Authorization: Bearer <JWT_TOKEN>
    ▼
┌─────────────────────┐
│  Auth Middleware    │
│  • Verify JWT       │
│  • Extract user_id  │
│  • Attach to req    │
└─────────┬───────────┘
          │ ✅ Authenticated
          ▼
┌─────────────────────┐
│   Controller        │
│  • Get user_id      │
│  • Call service     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│    Service          │
│  Authorization:     │
│  • Check ownership  │
│  • Validate rules   │
│  • Business logic   │
└─────────┬───────────┘
          │ ✅ Authorized
          ▼
┌─────────────────────┐
│    Database         │
│  • Execute query    │
│  • Return data      │
└─────────────────────┘
```

### Authorization Rules

```
┌──────────────────────────────────────────────────────────┐
│                  AUTHORIZATION MATRIX                    │
├──────────────────────────────────────────────────────────┤
│ Action              │ Who Can Do It?                     │
├──────────────────────────────────────────────────────────┤
│ Search offers       │ Anyone (public)                    │
│ View offer details  │ Anyone (public)                    │
│ Join offer          │ Authenticated user (not driver)    │
│ Cancel join         │ Passenger who made the join        │
│ View bookings       │ Passenger (own bookings)           │
│ View passengers     │ Driver (own offer)                 │
│ Confirm passenger   │ Driver (own offer)                 │
│ Reject passenger    │ Driver (own offer)                 │
└──────────────────────────────────────────────────────────┘
```

## 📊 State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              OFFER PASSENGER STATUS STATES                  │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   PENDING   │ ← Initial state
                    │  (Orange)   │   (passenger joins)
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  CONFIRMED   │ │   REJECTED   │ │  CANCELLED   │
    │   (Green)    │ │    (Red)     │ │   (Gray)     │
    │              │ │              │ │              │
    │ Driver       │ │ Driver       │ │ Passenger    │
    │ confirms     │ │ rejects      │ │ cancels      │
    └──────┬───────┘ └──────────────┘ └──────────────┘
           │
           │ Passenger can still cancel
           ▼
    ┌──────────────┐
    │  CANCELLED   │
    │   (Gray)     │
    └──────────────┘

TERMINAL STATES: confirmed, rejected, cancelled
(No further transitions allowed)
```

## 🔔 Notification Types

```
┌─────────────────────────────────────────────────────────────┐
│                   PUSH NOTIFICATIONS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Type: passenger_join_request                               │
│  ├─ To: Driver                                              │
│  ├─ Title: "New Passenger Request"                          │
│  ├─ Body: "{name} wants to join your ride..."              │
│  └─ Data: { offer_id, passenger_id, seats_requested }      │
│                                                             │
│  Type: join_confirmed                                       │
│  ├─ To: Passenger                                           │
│  ├─ Title: "Ride Confirmed!"                                │
│  ├─ Body: "Your request has been confirmed"                │
│  └─ Data: { offer_id, passenger_join_id }                  │
│                                                             │
│  Type: join_rejected                                        │
│  ├─ To: Passenger                                           │
│  ├─ Title: "Request Declined"                               │
│  ├─ Body: "Your request was declined"                      │
│  └─ Data: { offer_id, passenger_join_id, rejection_reason }│
│                                                             │
│  Type: passenger_cancelled                                  │
│  ├─ To: Driver                                              │
│  ├─ Title: "Passenger Cancelled"                            │
│  ├─ Body: "A passenger cancelled their request"            │
│  └─ Data: { offer_id, passenger_join_id, was_confirmed }   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 UI Component Hierarchy

### User App

```
App
└── Navigation
    ├── SearchOffersScreen
    │   ├── SearchContainer
    │   │   ├── SearchInput (from)
    │   │   ├── SearchInput (to)
    │   │   └── SearchButton
    │   └── OffersList
    │       └── OfferCard (multiple)
    │           ├── RouteInfo
    │           ├── DriverInfo
    │           ├── VehicleInfo
    │           ├── SeatsInfo
    │           └── PriceInfo
    │
    ├── OfferDetailsScreen
    │   ├── RouteCard
    │   ├── TripDetailsCard
    │   ├── DriverVehicleCard
    │   ├── NoteCard (optional)
    │   ├── SeatSelector
    │   ├── MessageInput
    │   └── JoinButton
    │
    └── MyBookingsScreen
        ├── FilterTabs
        │   ├── AllTab
        │   ├── PendingTab
        │   └── ConfirmedTab
        └── BookingsList
            └── BookingCard (multiple)
                ├── StatusBadge
                ├── RouteInfo
                ├── TripDetails
                ├── RejectionReason (if rejected)
                └── CancelButton (if applicable)
```

### Driver App

```
App
└── Navigation
    ├── OffersListScreen
    │   └── OfferCard
    │       └── ViewPassengersButton (new)
    │
    └── OfferPassengersScreen
        ├── SummaryCards
        │   ├── PendingCount
        │   └── ConfirmedCount
        └── PassengersList
            └── PassengerCard (multiple)
                ├── PassengerInfo
                ├── StatusBadge
                ├── SeatInfo
                ├── MessageDisplay (if any)
                └── ActionButtons
                    ├── ConfirmButton (if pending)
                    └── RejectButton (if pending)
```

---

## 📈 Performance Metrics

### Database Query Performance

```
┌─────────────────────────────────────────────────────────┐
│              QUERY OPTIMIZATION                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Search Offers:                                         │
│  • Index on (status, start_at)                          │
│  • Index on (from_text, to_text)                        │
│  • Estimated: < 50ms for 10K offers                     │
│                                                         │
│  Get Passengers:                                        │
│  • Index on (offer_id, status)                          │
│  • Eager loading with JOIN                              │
│  • Estimated: < 20ms for 100 passengers                 │
│                                                         │
│  Get Bookings:                                          │
│  • Index on (passenger_id, status)                      │
│  • Eager loading with JOIN                              │
│  • Estimated: < 30ms for 50 bookings                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### API Response Times

```
Endpoint                              Target    Actual
────────────────────────────────────────────────────────
GET  /api/public/driver-offers        < 100ms   ~60ms
GET  /api/public/driver-offers/:id    < 50ms    ~30ms
POST /api/passenger/offers/:id/join   < 200ms   ~150ms
POST /api/passenger/bookings/:id/cancel < 100ms ~80ms
GET  /api/passenger/bookings          < 100ms   ~70ms
GET  /api/driver/offers/:id/passengers < 100ms  ~60ms
POST /api/driver/passengers/:id/confirm < 200ms ~140ms
POST /api/driver/passengers/:id/reject < 200ms  ~130ms
```

---

**Architecture Version**: 1.0
**Last Updated**: March 2025
**Status**: Production Ready ✅

