# Push Notifications Implementation Guide

## Overview
This document outlines the complete push notification system for passenger-driver offer communications in UbexGo.

## Push Notification Scenarios

### 1. Driver Offers (Driver creates, Passenger joins)

#### Scenario A: Passenger Actions
- ✅ **Passenger joins offer** → Notify Driver
  - Event: `passenger_join_request`
  - Trigger: `OfferPassengerService.joinOffer()`
  - Recipient: Driver (offer owner)
  - Message: "X wants to join your ride from A to B"

- ✅ **Passenger cancels join** → Notify Driver
  - Event: `passenger_cancelled`
  - Trigger: `OfferPassengerService.cancelJoin()`
  - Recipient: Driver (offer owner)
  - Message: "A passenger cancelled their request"

#### Scenario B: Driver Actions
- ✅ **Driver confirms passenger** → Notify Passenger
  - Event: `join_confirmed`
  - Trigger: `OfferPassengerService.confirmPassenger()`
  - Recipient: Passenger (who joined)
  - Message: "Your request has been confirmed"

- ✅ **Driver rejects passenger** → Notify Passenger
  - Event: `join_rejected`
  - Trigger: `OfferPassengerService.rejectPassenger()`
  - Recipient: Passenger (who joined)
  - Message: "Your request was declined"

### 2. Passenger Offers (Passenger creates, Driver joins)

#### Scenario A: Driver Actions
- ✅ **Driver joins offer** → Notify Passenger
  - Event: `driver_join_request`
  - Trigger: `OfferDriverService.joinOffer()`
  - Recipient: Passenger (offer owner)
  - Message: "X wants to take you from A to B"

- ✅ **Driver cancels join** → Notify Passenger
  - Event: `driver_request_cancelled`
  - Trigger: `OfferDriverService.cancelJoin()`
  - Recipient: Passenger (offer owner)
  - Message: "A driver cancelled their request"

#### Scenario B: Passenger Actions
- ✅ **Passenger confirms driver** → Notify Driver
  - Event: `driver_request_confirmed`
  - Trigger: `OfferDriverService.confirmDriver()`
  - Recipient: Driver (who joined)
  - Message: "Your request has been confirmed"

- ✅ **Passenger rejects driver** → Notify Driver
  - Event: `driver_request_rejected`
  - Trigger: `OfferDriverService.rejectDriver()`
  - Recipient: Driver (who joined)
  - Message: "Your request was declined"

## Additional Scenarios to Implement

### 3. Offer Lifecycle Notifications

- **Driver creates offer** → No notification (own action)
- **Passenger creates offer** → No notification (own action)

- **Driver cancels/archives offer** → Notify all confirmed passengers
  - Event: `offer_cancelled_by_driver`
  - Recipients: All confirmed passengers
  - Message: "The ride from A to B has been cancelled"

- **Passenger cancels offer** → Notify all confirmed/pending drivers
  - Event: `offer_cancelled_by_passenger`
  - Recipients: All confirmed/pending drivers
  - Message: "The ride request from A to B has been cancelled"

- **Driver updates offer** → Notify all confirmed passengers (if significant changes)
  - Event: `offer_updated`
  - Recipients: All confirmed passengers
  - Message: "The ride details have been updated"

### 4. Reminder Notifications

- **Ride starting soon** → Notify driver and all confirmed passengers
  - Event: `ride_reminder`
  - Trigger: Scheduled job (1-2 hours before start)
  - Recipients: Driver + all confirmed passengers
  - Message: "Your ride from A to B starts in X hours"

### 5. Rating Notifications

- **Passenger rates driver** → Notify driver (optional)
  - Event: `rating_received`
  - Trigger: After ride completion
  - Recipient: Driver
  - Message: "You received a new rating"

## Implementation Status

### ✅ Implemented (Working)
1. Passenger joins driver offer → Driver notified
2. Driver confirms passenger → Passenger notified
3. Driver rejects passenger → Passenger notified
4. Passenger cancels join → Driver notified
5. Driver joins passenger offer → Passenger notified
6. Passenger confirms driver → Driver notified
7. Passenger rejects driver → Driver notified
8. Driver cancels join → Passenger notified

### ⚠️ Issues Found
1. **OfferDriverService.ts** - Incorrect method call
   - Line 566, 600: `PushService.sendNotification()` should be `PushService.send()`
   - Need to fix the method signature

### 🔄 To Be Implemented
1. Offer cancellation notifications (driver cancels → notify passengers)
2. Offer cancellation notifications (passenger cancels → notify drivers)
3. Offer update notifications (significant changes)
4. Ride reminder notifications (scheduled)
5. Rating received notifications (optional)

## Technical Details

### Push Service
- **Location**: `api,admin,db/apps/api/src/services/PushService.ts`
- **Method**: `send(message: PushMessage)`
- **Supports**: FCM (Firebase) and Expo Push Tokens
- **Auto-detection**: Determines token type automatically

### Push Token Storage
- **Table**: `push_tokens`
- **Fields**: `user_id`, `token`, `is_active`, `platform`
- **Active tokens only**: Queries filter by `is_active: true`
- **Invalid token handling**: Automatically deactivates invalid tokens

### Notification Data Structure
```typescript
{
  token: string;           // FCM or Expo token
  title: string;           // Notification title
  body: string;            // Notification body
  data?: {                 // Custom data payload
    type: string;          // Event type
    offer_id: string;      // Related offer ID
    [key: string]: string; // Additional data
  }
}
```

## Next Steps

1. **Fix OfferDriverService.ts** - Update incorrect method calls
2. **Implement offer cancellation notifications** - Add to DriverOfferService and PassengerOfferService
3. **Add offer update notifications** - Detect significant changes and notify
4. **Create scheduled reminder job** - Background job for ride reminders
5. **Add i18n support** - Translate notification messages based on user language
6. **Test all scenarios** - Comprehensive testing of all notification flows

## Testing Checklist

- [ ] Passenger joins driver offer
- [ ] Driver confirms passenger
- [ ] Driver rejects passenger
- [ ] Passenger cancels join (pending)
- [ ] Passenger cancels join (confirmed)
- [ ] Driver joins passenger offer
- [ ] Passenger confirms driver
- [ ] Passenger rejects driver
- [ ] Driver cancels join
- [ ] Driver cancels offer (with confirmed passengers)
- [ ] Passenger cancels offer (with pending/confirmed drivers)
- [ ] Multiple devices (same user, multiple tokens)
- [ ] Invalid token handling
- [ ] FCM vs Expo token detection

## Notes

- All notification methods are non-blocking (async with error handling)
- Failed notifications are logged but don't prevent the main action
- Invalid tokens are automatically deactivated
- Supports multiple devices per user
- Language detection from request headers (Accept-Language)

