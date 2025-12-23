# Mobile Apps - Push Notifications Integration TODO

## Overview
This document outlines exactly what needs to be done in the mobile apps to complete the push notification integration.

## 🎯 Goal
Enable real-time push notifications for all passenger-driver offer communications in both Driver and Passenger apps.

---

## 📱 Driver App Tasks

### 1. Create Notification Handler
**File**: `driver-app-standalone/utils/notificationHandler.ts`

```typescript
import * as Notifications from 'expo-notifications';
import { showToast } from './toast';

export const handleDriverNotification = (
  notification: Notifications.Notification,
  navigation: any
) => {
  const data = notification.request.content.data as any;
  
  if (!data?.type) return;

  switch (data.type) {
    case 'passenger_join_request':
      // Passenger wants to join your offer
      navigation.navigate('OfferPassengers', { 
        offerId: parseInt(data.offer_id) 
      });
      showToast.info(
        'New Passenger Request',
        'Tap to view details'
      );
      break;

    case 'passenger_cancelled':
      // Passenger cancelled their join
      navigation.navigate('OfferPassengers', { 
        offerId: parseInt(data.offer_id) 
      });
      showToast.info(
        'Passenger Cancelled',
        'A passenger cancelled their request'
      );
      break;

    case 'driver_request_confirmed':
      // Your offer to passenger was confirmed
      navigation.navigate('SearchPassengerOffers');
      showToast.success(
        'Request Confirmed!',
        'Your offer has been accepted'
      );
      break;

    case 'driver_request_rejected':
      // Your offer to passenger was rejected
      navigation.navigate('SearchPassengerOffers');
      showToast.error(
        'Request Declined',
        'Your offer was not accepted'
      );
      break;

    case 'offer_cancelled_by_passenger':
      // Passenger cancelled their offer
      navigation.navigate('SearchPassengerOffers');
      showToast.info(
        'Ride Cancelled',
        'The passenger cancelled their ride request'
      );
      break;

    default:
      console.warn('Unknown notification type:', data.type);
  }
};
```

### 2. Update App.tsx
**File**: `driver-app-standalone/App.tsx`

Add notification listeners:

```typescript
import * as Notifications from 'expo-notifications';
import { handleDriverNotification } from './utils/notificationHandler';

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

  useEffect(() => {
    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (navigationRef.current) {
          handleDriverNotification(response.notification, navigationRef.current);
        }
      }
    );

    // Handle foreground notifications
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Foreground notification:', notification);
        showToast.info(
          notification.request.content.title || 'Notification',
          notification.request.content.body || ''
        );
      }
    );

    return () => {
      subscription.remove();
      foregroundSub.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigation */}
    </NavigationContainer>
  );
}
```

### 3. Add Auto-Refresh on Focus
**Files**: 
- `driver-app-standalone/screens/OfferPassengersScreen.tsx`
- `driver-app-standalone/screens/SearchPassengerOffersScreen.tsx`

Add to both screens:

```typescript
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  useCallback(() => {
    // Refresh data when screen comes into focus
    // (e.g., after tapping notification)
    loadData();
  }, [])
);
```

### 4. Test on Physical Device
- [ ] Test passenger join notification
- [ ] Test passenger cancel notification
- [ ] Test driver request confirmed notification
- [ ] Test driver request rejected notification
- [ ] Test offer cancelled notification

---

## 📱 Passenger App Tasks

### 1. Create Notification Handler
**File**: `user-app-standalone/utils/notificationHandler.ts`

```typescript
import * as Notifications from 'expo-notifications';
import { showToast } from './toast';

export const handlePassengerNotification = (
  notification: Notifications.Notification,
  navigation: any
) => {
  const data = notification.request.content.data as any;
  
  if (!data?.type) return;

  switch (data.type) {
    case 'join_confirmed':
      // Driver confirmed your join request
      navigation.navigate('MyBookings');
      showToast.success(
        'Ride Confirmed!',
        'Your request has been confirmed'
      );
      break;

    case 'join_rejected':
      // Driver rejected your join request
      navigation.navigate('MyBookings');
      if (data.rejection_reason) {
        showToast.error(
          'Request Declined',
          data.rejection_reason
        );
      } else {
        showToast.error(
          'Request Declined',
          'Your request was not accepted'
        );
      }
      break;

    case 'offer_cancelled_by_driver':
      // Driver cancelled the offer
      navigation.navigate('MyBookings');
      showToast.error(
        'Ride Cancelled',
        'The driver cancelled this ride'
      );
      break;

    case 'driver_join_request':
      // Driver wants to take you
      navigation.navigate('PassengerOfferDetails', { 
        offerId: parseInt(data.offer_id) 
      });
      showToast.info(
        'New Driver Offer',
        'A driver wants to take you'
      );
      break;

    case 'driver_request_cancelled':
      // Driver cancelled their offer
      navigation.navigate('PassengerOfferDetails', { 
        offerId: parseInt(data.offer_id) 
      });
      showToast.info(
        'Driver Cancelled',
        'A driver cancelled their offer'
      );
      break;

    default:
      console.warn('Unknown notification type:', data.type);
  }
};
```

### 2. Update App.tsx
**File**: `user-app-standalone/App.tsx`

Same as Driver App - add notification listeners.

### 3. Add Auto-Refresh on Focus
**Files**: 
- `user-app-standalone/screens/MyBookingsScreen.tsx`
- `user-app-standalone/screens/MyPassengerOffersScreen.tsx`

Add useFocusEffect hook to refresh data.

### 4. Test on Physical Device
- [ ] Test join confirmed notification
- [ ] Test join rejected notification
- [ ] Test offer cancelled notification
- [ ] Test driver join request notification
- [ ] Test driver cancelled notification

---

## 🔧 Common Tasks (Both Apps)

### 1. Install Dependencies (if not already installed)
```bash
npm install expo-notifications
npm install @react-native-async-storage/async-storage
```

### 2. Configure Notification Channels (Android)
```typescript
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#10B981',
    sound: 'default',
  });
}
```

### 3. Request Permissions
```typescript
const { status } = await Notifications.requestPermissionsAsync();
if (status !== 'granted') {
  console.log('Push notification permission denied');
  return;
}
```

### 4. Register Push Token
This should already be implemented in both apps, but verify:
```typescript
const pushToken = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id',
});

await registerPushToken(authToken, pushToken.data, Platform.OS);
```

---

## 📋 Testing Checklist

### Driver App
- [ ] Notification handler created
- [ ] App.tsx updated with listeners
- [ ] Auto-refresh on focus added
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] All 5 event types tested

### Passenger App
- [ ] Notification handler created
- [ ] App.tsx updated with listeners
- [ ] Auto-refresh on focus added
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] All 5 event types tested

### Cross-App Testing
- [ ] Driver creates offer → Passenger joins → Notifications work
- [ ] Passenger creates offer → Driver joins → Notifications work
- [ ] Cancellation flows work both ways
- [ ] Multiple devices receive notifications
- [ ] Foreground and background notifications work

---

## 🚀 Deployment Order

1. **Backend** (Already Done ✅)
   - Push notification code deployed
   - Firebase configured
   - Database ready

2. **Driver App** (Next)
   - Add notification handler
   - Update App.tsx
   - Test on devices
   - Deploy to TestFlight/Play Store Beta

3. **Passenger App** (Next)
   - Add notification handler
   - Update App.tsx
   - Test on devices
   - Deploy to TestFlight/Play Store Beta

4. **Production** (Final)
   - Monitor beta testing
   - Fix any issues
   - Deploy to production

---

## 📊 Success Metrics

### User Engagement
- Notification tap rate > 50%
- Time to action < 30 seconds
- User satisfaction with real-time updates

### Technical Metrics
- Notification delivery success rate > 99%
- Average delivery time < 2 seconds
- Zero crashes related to notifications

### Business Impact
- Faster response times between passengers and drivers
- Improved booking confirmation rates
- Better user retention

---

## 🎓 Learning Resources

### Expo Notifications
- [Official Docs](https://docs.expo.dev/push-notifications/overview/)
- [Push Notification Tool](https://expo.dev/notifications)
- [Testing Guide](https://docs.expo.dev/push-notifications/testing/)

### Firebase Cloud Messaging
- [FCM Overview](https://firebase.google.com/docs/cloud-messaging)
- [Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Best Practices](https://firebase.google.com/docs/cloud-messaging/best-practices)

### React Navigation
- [Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Navigation Ref](https://reactnavigation.org/docs/navigating-without-navigation-prop/)

---

## 💡 Tips & Best Practices

### 1. Always Test on Physical Devices
Push notifications don't work on simulators/emulators.

### 2. Handle All Notification States
- App in foreground → Show in-app alert
- App in background → System notification
- App closed → System notification + launch

### 3. Provide User Feedback
Show toasts or alerts when notifications are received, even in foreground.

### 4. Implement Deep Linking Properly
Ensure navigation works from any app state.

### 5. Monitor Token Validity
If notifications stop working, check if token needs refresh.

### 6. Test Error Scenarios
- Invalid token
- No internet connection
- Permission denied
- App uninstalled and reinstalled

---

## ✅ Completion Criteria

The push notification integration is complete when:

1. ✅ Backend sends notifications for all 10 flows
2. ✅ Mobile apps receive notifications
3. ✅ Tapping notifications navigates correctly
4. ✅ Foreground notifications show alerts
5. ✅ Background notifications appear in system tray
6. ✅ Multi-device support works
7. ✅ Error handling works (invalid tokens)
8. ✅ All tests passed on iOS and Android

---

**Created**: December 22, 2025
**Status**: 📋 Action Items for Frontend Team
**Priority**: 🔴 High (Required for production)
**Estimated Effort**: 4-6 hours per app

