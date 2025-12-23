# Complete Push Notifications System

## ✅ Fully Implemented Push Notification Flows

### 1. Driver Offers Flow (Driver creates → Passenger joins)

```
┌─────────────────────────────────────────────────────────────────┐
│                     DRIVER OFFER LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────┘

1. Driver Creates Offer
   ├─ Action: DriverOfferService.createOffer()
   ├─ Status: published
   └─ Notification: None (own action)

2. Passenger Joins Offer
   ├─ Action: OfferPassengerService.joinOffer()
   ├─ Status: pending
   ├─ Notification → DRIVER
   │  ├─ Event: passenger_join_request
   │  ├─ Title: "New Passenger Request"
   │  └─ Body: "{passenger} wants to join your ride from {from} to {to}"
   └─ Data: { offer_id, passenger_id, passenger_join_id, seats_requested }

3a. Driver Confirms Passenger
   ├─ Action: OfferPassengerService.confirmPassenger()
   ├─ Status: confirmed
   ├─ Notification → PASSENGER
   │  ├─ Event: join_confirmed
   │  ├─ Title: "Ride Confirmed!"
   │  └─ Body: "Your request to join the ride from {from} to {to} has been confirmed"
   └─ Data: { offer_id, passenger_join_id }

3b. Driver Rejects Passenger
   ├─ Action: OfferPassengerService.rejectPassenger()
   ├─ Status: rejected
   ├─ Notification → PASSENGER
   │  ├─ Event: join_rejected
   │  ├─ Title: "Request Declined"
   │  └─ Body: "Your request to join the ride from {from} to {to} was declined"
   └─ Data: { offer_id, passenger_join_id, rejection_reason }

4. Passenger Cancels Join
   ├─ Action: OfferPassengerService.cancelJoin()
   ├─ Status: cancelled
   ├─ Notification → DRIVER
   │  ├─ Event: passenger_cancelled
   │  ├─ Title: "Passenger Cancelled"
   │  └─ Body: "A passenger cancelled their {status} request for your ride from {from} to {to}"
   └─ Data: { offer_id, passenger_join_id, was_confirmed }

5. Driver Cancels Offer
   ├─ Action: DriverOfferService.cancelOffer()
   ├─ Status: cancelled
   ├─ Notification → ALL CONFIRMED PASSENGERS
   │  ├─ Event: offer_cancelled_by_driver
   │  ├─ Title: "Ride Cancelled"
   │  └─ Body: "The ride from {from} to {to} has been cancelled by the driver"
   └─ Data: { offer_id, passenger_join_id }
```

### 2. Passenger Offers Flow (Passenger creates → Driver joins)

```
┌─────────────────────────────────────────────────────────────────┐
│                   PASSENGER OFFER LIFECYCLE                      │
└─────────────────────────────────────────────────────────────────┘

1. Passenger Creates Offer
   ├─ Action: PassengerOfferService.createOffer()
   ├─ Status: published
   └─ Notification: None (own action)

2. Driver Joins Offer
   ├─ Action: OfferDriverService.joinOffer()
   ├─ Status: pending
   ├─ Notification → PASSENGER
   │  ├─ Event: driver_join_request
   │  ├─ Title: "New Driver Offer"
   │  └─ Body: "{driver} wants to take you from {from} to {to}"
   └─ Data: { offer_id, driver_id, driver_join_id, offered_price }

3a. Passenger Confirms Driver
   ├─ Action: OfferDriverService.confirmDriver()
   ├─ Status: confirmed
   ├─ Notification → DRIVER
   │  ├─ Event: driver_request_confirmed
   │  ├─ Title: "Request Confirmed"
   │  └─ Body: "Your request to drive from {from} to {to} has been confirmed!"
   └─ Data: { offer_id, driver_join_id }

3b. Passenger Rejects Driver
   ├─ Action: OfferDriverService.rejectDriver()
   ├─ Status: rejected
   ├─ Notification → DRIVER
   │  ├─ Event: driver_request_rejected
   │  ├─ Title: "Request Declined"
   │  └─ Body: "Your request to drive from {from} to {to} was declined"
   └─ Data: { offer_id, driver_join_id }

4. Driver Cancels Join
   ├─ Action: OfferDriverService.cancelJoin()
   ├─ Status: cancelled
   ├─ Notification → PASSENGER
   │  ├─ Event: driver_request_cancelled
   │  ├─ Title: "Driver Cancelled"
   │  └─ Body: "A driver cancelled their request for your ride from {from} to {to}"
   └─ Data: { offer_id, driver_join_id }

5. Passenger Cancels Offer
   ├─ Action: PassengerOfferService.cancelOffer()
   ├─ Status: cancelled
   ├─ Notification → ALL PENDING/CONFIRMED DRIVERS
   │  ├─ Event: offer_cancelled_by_passenger
   │  ├─ Title: "Ride Request Cancelled"
   │  └─ Body: "The ride request from {from} to {to} has been cancelled"
   └─ Data: { offer_id, driver_join_id }
```

## Implementation Details

### Service Files Modified

1. **OfferPassengerService.ts** ✅
   - joinOffer() → Notifies driver
   - confirmPassenger() → Notifies passenger
   - rejectPassenger() → Notifies passenger
   - cancelJoin() → Notifies driver (fixed missing language variable)

2. **OfferDriverService.ts** ✅
   - joinOffer() → Notifies passenger
   - confirmDriver() → Notifies driver
   - rejectDriver() → Notifies driver
   - cancelJoin() → Notifies passenger
   - Fixed: Changed `PushService.sendNotification()` to `PushService.send()`

3. **DriverOfferService.ts** ✅
   - cancelOffer() → Notifies all confirmed passengers
   - Added: notifyPassenger() helper method

4. **PassengerOfferService.ts** ✅
   - cancelOffer() → Notifies all pending/confirmed drivers
   - Added: notifyDriver() helper method

### Push Notification Features

✅ **Multi-device Support**
- Sends to all active tokens for a user
- Supports multiple devices per user

✅ **Token Type Auto-detection**
- FCM tokens (Firebase Cloud Messaging)
- Expo Push Tokens
- Automatically detects and uses correct service

✅ **Error Handling**
- Non-blocking: Failed notifications don't prevent main action
- Invalid token detection and automatic deactivation
- Comprehensive error logging

✅ **Active Token Filtering**
- Only sends to `is_active: true` tokens
- Automatically deactivates invalid tokens

✅ **Rich Data Payload**
- Event type for app routing
- Related IDs for deep linking
- Additional context data

## Notification Event Types

### Driver Offer Events
- `passenger_join_request` - Passenger wants to join driver's offer
- `join_confirmed` - Driver confirmed passenger
- `join_rejected` - Driver rejected passenger
- `passenger_cancelled` - Passenger cancelled their join
- `offer_cancelled_by_driver` - Driver cancelled the offer

### Passenger Offer Events
- `driver_join_request` - Driver wants to join passenger's offer
- `driver_request_confirmed` - Passenger confirmed driver
- `driver_request_rejected` - Passenger rejected driver
- `driver_request_cancelled` - Driver cancelled their join
- `offer_cancelled_by_passenger` - Passenger cancelled the offer

## Testing the Implementation

### Test Scenarios

#### Driver Offer Flow
1. ✅ Create driver offer → No notification
2. ✅ Passenger joins → Driver receives notification
3. ✅ Driver confirms → Passenger receives notification
4. ✅ Driver rejects → Passenger receives notification
5. ✅ Passenger cancels (pending) → Driver receives notification
6. ✅ Passenger cancels (confirmed) → Driver receives notification + seats restored
7. ✅ Driver cancels offer → All confirmed passengers receive notification

#### Passenger Offer Flow
1. ✅ Create passenger offer → No notification
2. ✅ Driver joins → Passenger receives notification
3. ✅ Passenger confirms → Driver receives notification
4. ✅ Passenger rejects → Driver receives notification
5. ✅ Driver cancels → Passenger receives notification
6. ✅ Passenger cancels offer → All pending/confirmed drivers receive notification

### Test with Multiple Devices
- Register multiple push tokens for same user
- Verify all devices receive notifications
- Test FCM and Expo tokens separately

### Test Error Handling
- Send to invalid token → Should deactivate token
- Send to expired token → Should deactivate token
- Network error → Should log but not crash

## Client-Side Integration

### Required Changes in Mobile Apps

#### 1. Handle Notification Events
```typescript
// In notification handler (both apps)
switch (notification.data.type) {
  case 'passenger_join_request':
    // Navigate to OfferPassengers screen
    navigation.navigate('OfferPassengers', { 
      offerId: notification.data.offer_id 
    });
    break;
    
  case 'join_confirmed':
    // Navigate to MyBookings screen
    navigation.navigate('MyBookings');
    break;
    
  case 'join_rejected':
    // Show rejection reason
    navigation.navigate('MyBookings');
    break;
    
  case 'passenger_cancelled':
    // Refresh offer passengers
    navigation.navigate('OfferPassengers', { 
      offerId: notification.data.offer_id 
    });
    break;
    
  case 'offer_cancelled_by_driver':
    // Show cancellation message
    navigation.navigate('MyBookings');
    break;
    
  case 'driver_join_request':
    // Navigate to passenger offer drivers screen
    navigation.navigate('PassengerOfferDrivers', { 
      offerId: notification.data.offer_id 
    });
    break;
    
  case 'driver_request_confirmed':
    // Navigate to driver's join requests
    navigation.navigate('MyDriverRequests');
    break;
    
  case 'driver_request_rejected':
    // Show rejection
    navigation.navigate('MyDriverRequests');
    break;
    
  case 'driver_request_cancelled':
    // Refresh passenger offer drivers
    navigation.navigate('PassengerOfferDrivers', { 
      offerId: notification.data.offer_id 
    });
    break;
    
  case 'offer_cancelled_by_passenger':
    // Show cancellation message
    navigation.navigate('MyDriverRequests');
    break;
}
```

#### 2. Register Push Tokens
Both apps should register push tokens on:
- App launch
- Login
- Token refresh

#### 3. Handle Foreground Notifications
Show in-app alerts or toasts when app is in foreground

## API Endpoints Using Push Notifications

### Driver Offer Endpoints
- `POST /api/passenger/offers/:offerId/join` → Notifies driver
- `POST /api/driver/passengers/:id/confirm` → Notifies passenger
- `POST /api/driver/passengers/:id/reject` → Notifies passenger
- `POST /api/passenger/bookings/:id/cancel` → Notifies driver
- `POST /api/driver/offers/:id/cancel` → Notifies all confirmed passengers

### Passenger Offer Endpoints
- `POST /api/driver/passenger-offers/:offerId/join` → Notifies passenger
- `POST /api/passenger/offer-drivers/:id/confirm` → Notifies driver
- `POST /api/passenger/offer-drivers/:id/reject` → Notifies driver
- `POST /api/driver/offer-drivers/:id/cancel` → Notifies passenger
- `POST /api/passenger/offers/:id/cancel` → Notifies all pending/confirmed drivers

## Database Schema

### push_tokens Table
```sql
CREATE TABLE push_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  platform VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Configuration

### Firebase Admin SDK
- Service account JSON files in API root
- Initialized in `FirebaseService.ts`
- Supports FCM HTTP v1 API

### Expo Push Service
- Uses Expo's push notification service
- No additional configuration needed
- Endpoint: `https://exp.host/--/api/v2/push/send`

## Monitoring & Logging

All push notifications are logged with:
- ✅ Success/failure status
- ✅ User ID (sender/receiver)
- ✅ Event type
- ✅ Token validity
- ✅ Error details (if failed)

Console output examples:
```
📤 Sending FCM push notification via Firebase Admin SDK...
✅ Firebase Admin SDK: Push notification sent successfully
   Message ID: projects/ubexgo/messages/0:1234567890

❌ Firebase Admin SDK: Failed to send push notification
   Error code: messaging/invalid-registration-token
   → Token is invalid or expired. User needs to re-register their device.
```

## Next Steps (Optional Enhancements)

### 1. Localized Notifications
- Use user's preferred language from profile
- Translate notification titles and bodies
- Already prepared with i18n infrastructure

### 2. Notification Preferences
- Allow users to enable/disable specific notification types
- Add settings in user profile
- Store preferences in database

### 3. Scheduled Notifications
- Ride reminders (1-2 hours before departure)
- Background job using cron or similar
- Notify driver + all confirmed passengers

### 4. Offer Update Notifications
- Detect significant changes (time, price, route)
- Notify all confirmed passengers/drivers
- Add to updateOffer() methods

### 5. Rating Notifications
- Notify driver when passenger rates them
- Optional feature for driver engagement

## Summary

✅ **8 Core Notification Flows Implemented**
- Passenger joins driver offer
- Driver confirms/rejects passenger
- Passenger cancels join
- Driver cancels offer
- Driver joins passenger offer
- Passenger confirms/rejects driver
- Driver cancels join
- Passenger cancels offer

✅ **Robust Error Handling**
- Invalid token deactivation
- Non-blocking notifications
- Comprehensive logging

✅ **Multi-device Support**
- Multiple tokens per user
- FCM and Expo support
- Auto-detection

✅ **Production Ready**
- All edge cases handled
- Audit logging
- Scalable architecture

