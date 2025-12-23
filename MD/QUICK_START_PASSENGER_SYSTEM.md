# Quick Start Guide - Passenger Join System

## 🚀 Getting Started in 5 Minutes

### Step 1: Run Database Migration

```bash
cd api,admin,db/apps/api
npm run migrate
```

This creates the `offer_passengers` table.

### Step 2: Restart API Server

```bash
# If running in development
npm run dev

# If running in production
npm run build
npm start
```

The new endpoints are now available!

### Step 3: Test API Endpoints

#### Test 1: Search for Offers (No Auth Required)
```bash
curl http://localhost:4001/api/public/driver-offers?from_text=Tashkent&to_text=Samarkand
```

#### Test 2: Join an Offer (Auth Required)
```bash
curl -X POST http://localhost:4001/api/passenger/offers/1/join \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seats_requested": 2,
    "message": "Hello, I would like to join!"
  }'
```

#### Test 3: Get Passengers (Driver, Auth Required)
```bash
curl http://localhost:4001/api/driver/offers/1/passengers \
  -H "Authorization: Bearer DRIVER_TOKEN"
```

#### Test 4: Confirm Passenger (Driver, Auth Required)
```bash
curl -X POST http://localhost:4001/api/driver/passengers/PASSENGER_JOIN_ID/confirm \
  -H "Authorization: Bearer DRIVER_TOKEN"
```

### Step 4: Update Mobile Apps

#### User App Navigation

Add to your navigation file (e.g., `navigation/MainNavigator.tsx`):

```typescript
import SearchOffersScreen from '../screens/SearchOffersScreen';
import OfferDetailsScreen from '../screens/OfferDetailsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';

// In your Stack.Navigator
<Stack.Screen 
  name="SearchOffers" 
  component={SearchOffersScreen}
  options={{ title: 'Search Rides' }}
/>
<Stack.Screen 
  name="OfferDetails" 
  component={OfferDetailsScreen}
  options={{ title: 'Ride Details' }}
/>
<Stack.Screen 
  name="MyBookings" 
  component={MyBookingsScreen}
  options={{ title: 'My Bookings' }}
/>
```

Add menu items in your main screen or profile:

```typescript
<TouchableOpacity onPress={() => navigation.navigate('SearchOffers')}>
  <Text>🔍 Search Rides</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
  <Text>📋 My Bookings</Text>
</TouchableOpacity>
```

#### Driver App Navigation

Add to your navigation file:

```typescript
import OfferPassengersScreen from '../screens/OfferPassengersScreen';

// In your Stack.Navigator
<Stack.Screen 
  name="OfferPassengers" 
  component={OfferPassengersScreen}
  options={{ title: 'Passengers' }}
/>
```

Update `OffersListScreen.tsx` to add a button to view passengers:

```typescript
// In the offer card or details modal
<TouchableOpacity 
  style={styles.viewPassengersButton}
  onPress={() => navigation.navigate('OfferPassengers', { offerId: offer.id })}
>
  <Ionicons name="people-outline" size={20} color="#2196F3" />
  <Text style={styles.viewPassengersText}>View Passengers</Text>
</TouchableOpacity>
```

### Step 5: Setup Push Notifications

#### User App (App.tsx or notification service)

```typescript
import * as Notifications from 'expo-notifications';

// Add notification handler
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  switch (data.type) {
    case 'join_confirmed':
      navigation.navigate('MyBookings');
      break;
    case 'join_rejected':
      navigation.navigate('MyBookings');
      break;
  }
});
```

#### Driver App (App.tsx or notification service)

```typescript
import * as Notifications from 'expo-notifications';

// Add notification handler
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  switch (data.type) {
    case 'passenger_join_request':
      navigation.navigate('OfferPassengers', { 
        offerId: parseInt(data.offer_id) 
      });
      break;
    case 'passenger_cancelled':
      navigation.navigate('OfferPassengers', { 
        offerId: parseInt(data.offer_id) 
      });
      break;
  }
});
```

### Step 6: Run Mobile Apps

```bash
# User App
cd user-app-standalone
npm install  # if new dependencies
npm run android  # or npm run ios

# Driver App
cd driver-app-standalone
npm install  # if new dependencies
npm run android  # or npm run ios
```

## 🧪 Testing the Complete Flow

### Scenario 1: Passenger Joins Offer

1. **User App**: Open SearchOffersScreen
2. Search for offers (e.g., "Tashkent" to "Samarkand")
3. Tap on an offer to see details
4. Select number of seats
5. Tap "Request to Join"
6. **Push Notification**: Driver receives notification
7. **Driver App**: Open notification → Goes to OfferPassengersScreen
8. See pending passenger request
9. Tap "Confirm"
10. **Push Notification**: Passenger receives confirmation
11. **User App**: Open MyBookings → See confirmed status

### Scenario 2: Driver Rejects Passenger

1. Follow steps 1-7 from Scenario 1
2. **Driver App**: Tap "Reject"
3. Enter rejection reason (optional)
4. Confirm rejection
5. **Push Notification**: Passenger receives rejection
6. **User App**: Open MyBookings → See rejected status with reason

### Scenario 3: Passenger Cancels

1. **User App**: Go to MyBookings
2. Find a pending or confirmed booking
3. Tap "Cancel Booking"
4. Confirm cancellation
5. **Push Notification**: Driver receives cancellation notice
6. **Driver App**: Refresh OfferPassengersScreen → See cancelled status

## 🔍 Troubleshooting

### Issue: Migration Fails

**Solution**: Check if table already exists
```bash
# Connect to database
psql -U postgres -d ubexgo

# Check if table exists
\dt offer_passengers

# If exists, drop and recreate
DROP TABLE offer_passengers CASCADE;
# Then run migration again
```

### Issue: Push Notifications Not Working

**Solution**: Verify Firebase setup
1. Check `ubexgo-firebase-adminsdk.json` exists
2. Verify environment variables
3. Check push token registration
4. Review API logs for errors

### Issue: "Offer not found" Error

**Solution**: Create a test offer first
```bash
# Use driver app or API to create an offer
curl -X POST http://localhost:4001/api/driver/offers \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "YOUR_VEHICLE_ID",
    "from_text": "Tashkent, Tashkent, Uzbekistan",
    "to_text": "Samarkand, Samarkand, Uzbekistan",
    "start_at": "2025-03-15T10:00:00Z",
    "seats_total": 4,
    "price_per_seat": 50000,
    "currency": "UZS"
  }'
```

### Issue: "Cannot join own offer"

**Solution**: Use different accounts
- Create offer with Driver account
- Join with Passenger account (different user)

### Issue: Screens Not Showing

**Solution**: Check navigation setup
1. Verify screens are imported
2. Check Stack.Screen names match navigation calls
3. Restart Metro bundler
```bash
npm start -- --reset-cache
```

## 📱 UI Preview

### User App Flow
```
Home → Search Offers → [List of Offers]
                              ↓
                        Offer Details → Join
                              ↓
                        My Bookings → [Status: Pending]
                              ↓
                        [Driver Confirms]
                              ↓
                        [Status: Confirmed] ✅
```

### Driver App Flow
```
My Offers → [Offer Card] → View Passengers
                                  ↓
                          [List of Passengers]
                                  ↓
                          [Pending Request]
                                  ↓
                          Confirm / Reject
                                  ↓
                          [Status Updated] ✅
```

## 🎯 Key Features to Test

- ✅ Search with filters
- ✅ View offer details
- ✅ Join offer with seat selection
- ✅ View my bookings
- ✅ Filter bookings by status
- ✅ Cancel booking
- ✅ Driver views passengers
- ✅ Driver confirms passenger
- ✅ Driver rejects passenger
- ✅ Push notifications
- ✅ Seat count updates
- ✅ Status badges
- ✅ Pull to refresh

## 📊 Database Verification

Check data in database:

```sql
-- View all passenger joins
SELECT * FROM offer_passengers ORDER BY created_at DESC;

-- View pending requests
SELECT * FROM offer_passengers WHERE status = 'pending';

-- View confirmed passengers for an offer
SELECT 
  op.*,
  u.display_name as passenger_name,
  do.from_text,
  do.to_text
FROM offer_passengers op
JOIN users u ON op.passenger_id = u.id
JOIN driver_offers do ON op.offer_id = do.id
WHERE op.offer_id = 1 AND op.status = 'confirmed';

-- Check seat counts
SELECT 
  id,
  from_text,
  to_text,
  seats_total,
  seats_free,
  (seats_total - seats_free) as seats_taken
FROM driver_offers
WHERE id = 1;
```

## 🎉 Success!

If you've completed all steps, you now have a fully functional passenger join system with:

✅ Backend API with all endpoints
✅ Database with proper schema
✅ Push notifications
✅ Beautiful mobile UI
✅ Real-time status updates
✅ Seat management
✅ Security & validation

## 📚 Next Steps

1. **Add to Main Navigation**: Integrate screens into your main app flow
2. **Customize UI**: Adjust colors, fonts, and layouts to match your brand
3. **Add Analytics**: Track user behavior and conversion rates
4. **Implement Rating**: Add post-ride rating system
5. **Add Chat**: Implement in-app messaging
6. **Payment Integration**: Add payment processing

## 🆘 Need Help?

- Review `PASSENGER_JOIN_SYSTEM.md` for detailed documentation
- Check `IMPLEMENTATION_SUMMARY.md` for architecture overview
- Review API logs for errors
- Check mobile console for client-side errors
- Verify push token registration in database

---

**Happy Coding! 🚗💨**

