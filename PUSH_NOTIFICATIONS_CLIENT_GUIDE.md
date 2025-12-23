# Push Notifications - Client Integration Guide

## Overview
This guide explains how to integrate push notifications in the Driver and Passenger mobile apps to handle all offer communication events.

## Notification Events Reference

### Driver App Events

| Event Type | Trigger | Screen to Navigate | Description |
|------------|---------|-------------------|-------------|
| `passenger_join_request` | Passenger joins driver's offer | `OfferPassengers` | New passenger wants to join |
| `passenger_cancelled` | Passenger cancels join | `OfferPassengers` | Passenger cancelled their request |
| `driver_request_confirmed` | Passenger confirms driver | `MyDriverRequests` | Your offer to passenger confirmed |
| `driver_request_rejected` | Passenger rejects driver | `MyDriverRequests` | Your offer to passenger declined |
| `offer_cancelled_by_passenger` | Passenger cancels their offer | `SearchPassengerOffers` | Ride request cancelled |

### Passenger App Events

| Event Type | Trigger | Screen to Navigate | Description |
|------------|---------|-------------------|-------------|
| `join_confirmed` | Driver confirms passenger | `MyBookings` | Your join request confirmed |
| `join_rejected` | Driver rejects passenger | `MyBookings` | Your join request declined |
| `offer_cancelled_by_driver` | Driver cancels offer | `MyBookings` | Ride cancelled by driver |
| `driver_join_request` | Driver joins passenger's offer | `PassengerOfferDetails` | New driver wants to take you |
| `driver_request_cancelled` | Driver cancels join | `PassengerOfferDetails` | Driver cancelled their offer |

## Implementation Steps

### 1. Notification Handler Setup

Create a notification handler utility in both apps:

```typescript
// utils/notificationHandler.ts

import { Notifications } from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import { showToast } from './toast';

export interface NotificationData {
  type: string;
  offer_id?: string;
  passenger_id?: string;
  driver_id?: string;
  passenger_join_id?: string;
  driver_join_id?: string;
  seats_requested?: string;
  offered_price?: string;
  rejection_reason?: string;
  was_confirmed?: string;
}

export const handleNotification = (
  notification: Notifications.Notification,
  navigation: NavigationContainerRef<any>
) => {
  const data = notification.request.content.data as NotificationData;
  
  if (!data || !data.type) {
    console.warn('Notification missing type data');
    return;
  }

  console.log('Handling notification:', data.type);

  switch (data.type) {
    // Driver App Events
    case 'passenger_join_request':
      if (data.offer_id) {
        navigation.navigate('OfferPassengers', { 
          offerId: parseInt(data.offer_id) 
        });
      }
      break;

    case 'passenger_cancelled':
      if (data.offer_id) {
        navigation.navigate('OfferPassengers', { 
          offerId: parseInt(data.offer_id) 
        });
      }
      break;

    case 'driver_request_confirmed':
      navigation.navigate('SearchPassengerOffers');
      showToast.success(
        'Request Confirmed',
        'Your offer has been accepted!'
      );
      break;

    case 'driver_request_rejected':
      navigation.navigate('SearchPassengerOffers');
      break;

    case 'offer_cancelled_by_passenger':
      navigation.navigate('SearchPassengerOffers');
      showToast.info(
        'Ride Cancelled',
        'The passenger cancelled their ride request'
      );
      break;

    // Passenger App Events
    case 'join_confirmed':
      navigation.navigate('MyBookings');
      showToast.success(
        'Ride Confirmed!',
        'Your join request has been confirmed'
      );
      break;

    case 'join_rejected':
      navigation.navigate('MyBookings');
      if (data.rejection_reason) {
        showToast.error(
          'Request Declined',
          data.rejection_reason
        );
      }
      break;

    case 'offer_cancelled_by_driver':
      navigation.navigate('MyBookings');
      showToast.error(
        'Ride Cancelled',
        'The driver cancelled this ride'
      );
      break;

    case 'driver_join_request':
      if (data.offer_id) {
        navigation.navigate('PassengerOfferDetails', { 
          offerId: parseInt(data.offer_id) 
        });
      }
      break;

    case 'driver_request_cancelled':
      if (data.offer_id) {
        navigation.navigate('PassengerOfferDetails', { 
          offerId: parseInt(data.offer_id) 
        });
      }
      break;

    default:
      console.warn('Unknown notification type:', data.type);
  }
};
```

### 2. App.tsx Integration

Add notification listeners in your main App component:

```typescript
// App.tsx (both apps)

import * as Notifications from 'expo-notifications';
import { useRef, useEffect } from 'react';
import { handleNotification } from './utils/notificationHandler';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const navigationRef = useRef<any>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received (foreground):', notification);
        // Show in-app notification or toast
        showToast.info(
          notification.request.content.title || 'Notification',
          notification.request.content.body || ''
        );
      }
    );

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        if (navigationRef.current) {
          handleNotification(response.notification, navigationRef.current);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your app navigation */}
    </NavigationContainer>
  );
}
```

### 3. Push Token Registration

Ensure push tokens are registered on:
- App launch
- User login
- Token refresh

```typescript
// hooks/usePushNotifications.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushToken } from '../api/device';

export const usePushNotifications = (token: string | null) => {
  useEffect(() => {
    if (token) {
      registerForPushNotifications();
    }
  }, [token]);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your project ID
      });

      console.log('Push token:', pushToken.data);

      // Register with backend
      if (token) {
        await registerPushToken(token, pushToken.data, Platform.OS);
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
        });
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };
};
```

### 4. Screen-Specific Refresh

Add auto-refresh when returning to screens after notification:

```typescript
// Example: OfferPassengersScreen.tsx

import { useFocusEffect } from '@react-navigation/native';

export const OfferPassengersScreen = () => {
  // ... existing code ...

  useFocusEffect(
    useCallback(() => {
      // Refresh passengers when screen comes into focus
      // (e.g., after tapping notification)
      loadPassengers();
    }, [])
  );

  // ... rest of component ...
};
```

### 5. Badge Count Management

Update app badge count based on pending notifications:

```typescript
// utils/badgeManager.ts

import * as Notifications from 'expo-notifications';
import { getMyBookings } from '../api/offers';
import { getOfferPassengers } from '../api/offerPassengers';

export const updateBadgeCount = async (token: string) => {
  try {
    // For passenger app: count pending bookings
    const bookings = await getMyBookings(token, 'pending');
    const pendingCount = bookings.length;
    
    // For driver app: count pending passenger requests across all offers
    // (would need to aggregate from all offers)
    
    await Notifications.setBadgeCountAsync(pendingCount);
  } catch (error) {
    console.error('Error updating badge count:', error);
  }
};
```

## Testing Notifications

### Test on Physical Devices
Push notifications only work on physical devices, not simulators/emulators.

### Test Scenarios

#### Driver App
1. Create an offer
2. Have another user (passenger) join the offer
3. Verify you receive notification
4. Tap notification → Should navigate to OfferPassengers screen
5. Confirm/reject the passenger
6. Verify passenger receives notification

#### Passenger App
1. Join a driver's offer
2. Verify driver receives notification
3. Wait for driver to confirm/reject
4. Verify you receive notification
5. Tap notification → Should navigate to MyBookings screen

#### Cross-Flow Testing
1. Create passenger offer
2. Have driver join
3. Verify notifications work both ways
4. Test cancellations
5. Test offer cancellations

### Debug Logging

Add comprehensive logging:

```typescript
// Enable notification debugging
console.log('Notification received:', {
  title: notification.request.content.title,
  body: notification.request.content.body,
  data: notification.request.content.data,
});

// Log navigation
console.log('Navigating to:', screenName, params);

// Log token registration
console.log('Push token registered:', token);
```

## Troubleshooting

### Notifications Not Received

1. **Check token registration**
   - Verify token is saved in database
   - Check `is_active` flag is true
   - Verify token format (FCM vs Expo)

2. **Check device permissions**
   - iOS: Settings → App → Notifications
   - Android: Settings → Apps → App → Notifications

3. **Check backend logs**
   - Look for "Push notification sent" logs
   - Check for error messages
   - Verify Firebase credentials

4. **Check network connectivity**
   - FCM requires internet connection
   - Verify Firebase project configuration

### Notifications Received but Not Navigating

1. **Check notification data**
   - Verify `type` field is present
   - Verify `offer_id` and other IDs are valid

2. **Check navigation setup**
   - Verify screen names match
   - Verify navigation ref is set
   - Check navigation stack structure

3. **Check notification handler**
   - Verify handler is registered
   - Check for console errors
   - Verify switch cases match event types

## Production Considerations

### 1. Notification Channels (Android)
Create specific channels for different notification types:
- High priority: Join requests, confirmations
- Normal priority: Cancellations, updates
- Low priority: Reminders, tips

### 2. Notification Grouping
Group related notifications:
- Group by offer ID
- Show summary for multiple notifications

### 3. Notification Actions
Add quick actions to notifications:
- "Confirm" / "Reject" buttons
- "View Details" button
- "Cancel" button

### 4. Silent Notifications
Use silent notifications for:
- Data sync
- Badge count updates
- Background refresh

### 5. Rate Limiting
Prevent notification spam:
- Limit notifications per user per hour
- Debounce rapid actions
- Batch similar notifications

## Example: Complete Integration

```typescript
// App.tsx - Complete example

import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from './hooks/useAuth';
import { usePushNotifications } from './hooks/usePushNotifications';
import { handleNotification } from './utils/notificationHandler';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const { token } = useAuth();
  const navigationRef = useRef<any>(null);
  
  // Register push notifications
  usePushNotifications(token);

  useEffect(() => {
    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (navigationRef.current) {
          handleNotification(response.notification, navigationRef.current);
        }
      }
    );

    // Handle foreground notifications
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Foreground notification:', notification);
        // Show toast or in-app notification
        showToast.info(
          notification.request.content.title || 'Notification',
          notification.request.content.body || ''
        );
      }
    );

    return () => {
      subscription.remove();
      foregroundSubscription.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigation stack */}
    </NavigationContainer>
  );
}
```

## Summary

✅ **Backend Implementation Complete**
- All 10 notification flows implemented
- Error handling and token management
- Multi-device support

📱 **Client Integration Required**
- Add notification handlers to both apps
- Register push tokens on login
- Handle navigation from notifications
- Show appropriate UI feedback

🧪 **Testing Required**
- Test all notification flows
- Test on physical devices (iOS + Android)
- Test with multiple devices
- Test error scenarios

## Next Steps

1. **Implement notification handlers** in both mobile apps
2. **Test each notification flow** end-to-end
3. **Add localized notification messages** (optional)
4. **Implement notification preferences** (optional)
5. **Add scheduled reminders** (optional enhancement)

## Support

For issues or questions:
- Check backend logs for notification sending
- Check device logs for notification receipt
- Verify push token registration
- Test with Expo push notification tool: https://expo.dev/notifications

