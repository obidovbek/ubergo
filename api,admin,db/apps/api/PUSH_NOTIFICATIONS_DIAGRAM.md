# Push Notifications Flow Diagram

## Complete Notification Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UBEXGO PUSH NOTIFICATIONS SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │   PushService    │
                         │  (FCM + Expo)    │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
         ┌──────────▼──────────┐     ┌─────────▼──────────┐
         │  Driver Offer Flow  │     │ Passenger Offer    │
         │  (Driver creates)   │     │ Flow (Passenger    │
         │                     │     │ creates)           │
         └──────────┬──────────┘     └─────────┬──────────┘
                    │                           │
                    │                           │
```

## Flow 1: Driver Offer → Passenger Joins

```
DRIVER                                    PASSENGER
  │                                          │
  │ 1. Creates Offer                         │
  ├────────────────────────────────────────► │
  │    Status: published                     │
  │                                          │
  │                                          │ 2. Joins Offer
  │ ◄────────────────────────────────────────┤
  │ 🔔 "New Passenger Request"               │    Status: pending
  │    "{name} wants to join"                │
  │                                          │
  │ 3a. Confirms Passenger                   │
  ├────────────────────────────────────────► │
  │    Status: confirmed                     │ 🔔 "Ride Confirmed!"
  │                                          │    "Your request confirmed"
  │                                          │
  │        OR                                │
  │                                          │
  │ 3b. Rejects Passenger                    │
  ├────────────────────────────────────────► │
  │    Status: rejected                      │ 🔔 "Request Declined"
  │                                          │    "Your request declined"
  │                                          │
  │                                          │ 4. Cancels Join
  │ ◄────────────────────────────────────────┤
  │ 🔔 "Passenger Cancelled"                 │    Status: cancelled
  │    "Passenger cancelled request"         │
  │                                          │
  │ 5. Cancels Offer                         │
  ├────────────────────────────────────────► │
  │    Status: cancelled                     │ 🔔 "Ride Cancelled"
  │                                          │    "Driver cancelled ride"
  │                                          │
```

## Flow 2: Passenger Offer → Driver Joins

```
PASSENGER                                 DRIVER
  │                                          │
  │ 1. Creates Offer                         │
  ├────────────────────────────────────────► │
  │    Status: published                     │
  │                                          │
  │                                          │ 2. Joins Offer
  │ ◄────────────────────────────────────────┤
  │ 🔔 "New Driver Offer"                    │    Status: pending
  │    "{name} wants to take you"            │
  │                                          │
  │ 3a. Confirms Driver                      │
  ├────────────────────────────────────────► │
  │    Status: confirmed                     │ 🔔 "Request Confirmed"
  │    Offer: completed                      │    "Your request confirmed!"
  │                                          │
  │        OR                                │
  │                                          │
  │ 3b. Rejects Driver                       │
  ├────────────────────────────────────────► │
  │    Status: rejected                      │ 🔔 "Request Declined"
  │                                          │    "Your request declined"
  │                                          │
  │                                          │ 4. Cancels Join
  │ ◄────────────────────────────────────────┤
  │ 🔔 "Driver Cancelled"                    │    Status: cancelled
  │    "Driver cancelled request"            │
  │                                          │
  │ 5. Cancels Offer                         │
  ├────────────────────────────────────────► │
  │    Status: cancelled                     │ 🔔 "Ride Request Cancelled"
  │                                          │    "Passenger cancelled"
  │                                          │
```

## Notification Data Structure

```typescript
{
  token: string;              // FCM or Expo token
  title: string;              // "New Passenger Request"
  body: string;               // "John wants to join your ride..."
  data: {
    type: string;             // Event type for routing
    offer_id: string;         // Related offer ID
    passenger_id?: string;    // Passenger ID (if applicable)
    driver_id?: string;       // Driver ID (if applicable)
    passenger_join_id?: string; // Join record ID
    driver_join_id?: string;  // Join record ID
    seats_requested?: string; // Number of seats
    offered_price?: string;   // Offered price
    rejection_reason?: string; // Rejection reason
    was_confirmed?: string;   // Was previously confirmed
  }
}
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPS                               │
├─────────────────────────────────────────────────────────────────┤
│  Driver App                          Passenger App               │
│  - Register push token               - Register push token       │
│  - Handle notifications              - Handle notifications      │
│  - Deep linking                      - Deep linking              │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
             │         HTTP API               │
             ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API SERVER                               │
├─────────────────────────────────────────────────────────────────┤
│  Controllers                                                     │
│  ├─ OfferPassengerController                                    │
│  ├─ OfferDriverController                                       │
│  ├─ DriverOfferController                                       │
│  └─ PassengerOfferController                                    │
│                                                                  │
│  Services                                                        │
│  ├─ OfferPassengerService ──┐                                   │
│  ├─ OfferDriverService ──────┼─► PushService                    │
│  ├─ DriverOfferService ──────┤                                  │
│  └─ PassengerOfferService ───┘                                  │
│                                                                  │
│  PushService                                                     │
│  ├─ Auto-detect token type                                      │
│  ├─ Send via FCM (Firebase)                                     │
│  └─ Send via Expo                                               │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
             ▼                                ▼
┌──────────────────────┐        ┌──────────────────────┐
│  Firebase Cloud      │        │  Expo Push           │
│  Messaging (FCM)     │        │  Service             │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  User Devices   │
                  │  (iOS/Android)  │
                  └─────────────────┘
```

## Notification Delivery Flow

```
1. User Action (e.g., Passenger joins offer)
   │
   ├─► Service Method (OfferPassengerService.joinOffer)
   │   ├─ Validate request
   │   ├─ Create database record
   │   └─ Call notifyDriver()
   │
   ├─► Query PushToken table
   │   ├─ Filter: user_id = driver_id
   │   ├─ Filter: is_active = true
   │   └─ Get all tokens
   │
   ├─► For each token:
   │   ├─ Detect token type (FCM vs Expo)
   │   ├─ Call PushService.send()
   │   │   ├─ If FCM → Firebase Admin SDK
   │   │   └─ If Expo → Expo Push API
   │   │
   │   ├─ Handle success
   │   │   └─ Log success
   │   │
   │   └─ Handle failure
   │       ├─ Log error
   │       └─ Deactivate invalid token
   │
   └─► Return response to client
       └─ Notification sent asynchronously
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Push Notification Attempt
  │
  ├─► Success
  │   ├─ Log: "✅ Push notification sent successfully"
  │   └─ Continue
  │
  └─► Failure
      │
      ├─► Invalid Token
      │   ├─ Log: "❌ Invalid token"
      │   ├─ Deactivate token (is_active = false)
      │   └─ Continue (don't crash)
      │
      ├─► Network Error
      │   ├─ Log: "❌ Network error"
      │   └─ Continue (don't crash)
      │
      └─► Other Error
          ├─ Log: "❌ Unknown error"
          └─ Continue (don't crash)

Note: Main action (e.g., join offer) always succeeds
      even if notification fails
```

## Benefits of This Implementation

✅ **Non-blocking**: Notifications never block main operations
✅ **Resilient**: Handles failures gracefully
✅ **Scalable**: Supports unlimited devices per user
✅ **Flexible**: Easy to add new notification types
✅ **Maintainable**: Centralized push logic in PushService
✅ **Auditable**: All notifications logged
✅ **User-friendly**: Automatic token cleanup
✅ **Cross-platform**: FCM + Expo support

## Testing Checklist

- [x] Passenger joins driver offer → Driver notified
- [x] Driver confirms passenger → Passenger notified
- [x] Driver rejects passenger → Passenger notified
- [x] Passenger cancels join → Driver notified
- [x] Driver cancels offer → All confirmed passengers notified
- [x] Driver joins passenger offer → Passenger notified
- [x] Passenger confirms driver → Driver notified
- [x] Passenger rejects driver → Driver notified
- [x] Driver cancels join → Passenger notified
- [x] Passenger cancels offer → All drivers notified
- [x] Multiple devices per user
- [x] Invalid token handling
- [x] FCM vs Expo detection
- [x] Error logging
- [x] Non-blocking behavior

