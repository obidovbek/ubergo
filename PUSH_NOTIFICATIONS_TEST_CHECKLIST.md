# Push Notifications Testing Checklist

## Pre-Testing Setup

### Backend Setup
- [x] PushService implemented with FCM and Expo support
- [x] All service methods updated with notification calls
- [x] Error handling and token management in place
- [x] Firebase Admin SDK configured
- [x] No linter errors

### Frontend Setup (Required Before Testing)
- [ ] Notification handler implemented in both apps
- [ ] App.tsx updated with notification listeners
- [ ] Push token registration on login
- [ ] Navigation setup for all screens
- [ ] Physical iOS device available
- [ ] Physical Android device available

## Testing Matrix

### Test 1: Driver Offer Flow

#### 1.1 Passenger Joins Driver Offer
- [ ] **Setup**: Driver creates offer, passenger joins
- [ ] **Expected**: Driver receives notification "New Passenger Request"
- [ ] **Verify**: Notification title, body, and data payload
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to OfferPassengers screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 1.2 Driver Confirms Passenger
- [ ] **Setup**: Passenger has pending join request
- [ ] **Action**: Driver confirms passenger
- [ ] **Expected**: Passenger receives "Ride Confirmed!"
- [ ] **Verify**: Notification appears on passenger's device
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to MyBookings screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 1.3 Driver Rejects Passenger
- [ ] **Setup**: Passenger has pending join request
- [ ] **Action**: Driver rejects passenger with reason
- [ ] **Expected**: Passenger receives "Request Declined"
- [ ] **Verify**: Rejection reason in notification data
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to MyBookings screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 1.4 Passenger Cancels Join (Pending)
- [ ] **Setup**: Passenger has pending join request
- [ ] **Action**: Passenger cancels join
- [ ] **Expected**: Driver receives "Passenger Cancelled"
- [ ] **Verify**: Body mentions "pending request"
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to OfferPassengers screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 1.5 Passenger Cancels Join (Confirmed)
- [ ] **Setup**: Passenger has confirmed join
- [ ] **Action**: Passenger cancels join
- [ ] **Expected**: Driver receives "Passenger Cancelled"
- [ ] **Verify**: Body mentions "confirmed request"
- [ ] **Verify**: Seats restored in offer
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to OfferPassengers screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 1.6 Driver Cancels Offer (With Confirmed Passengers)
- [ ] **Setup**: Offer has 2+ confirmed passengers
- [ ] **Action**: Driver cancels offer
- [ ] **Expected**: All confirmed passengers receive "Ride Cancelled"
- [ ] **Verify**: Multiple devices receive notification
- [ ] **Action**: Tap notification (any passenger)
- [ ] **Expected**: Navigate to MyBookings screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 2: Passenger Offer Flow

#### 2.1 Driver Joins Passenger Offer
- [ ] **Setup**: Passenger creates offer, driver joins
- [ ] **Expected**: Passenger receives "New Driver Offer"
- [ ] **Verify**: Notification title, body, and data payload
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to PassengerOfferDetails screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 2.2 Passenger Confirms Driver
- [ ] **Setup**: Driver has pending join request
- [ ] **Action**: Passenger confirms driver
- [ ] **Expected**: Driver receives "Request Confirmed"
- [ ] **Verify**: Notification appears on driver's device
- [ ] **Verify**: Offer status changes to "completed"
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to SearchPassengerOffers screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 2.3 Passenger Rejects Driver
- [ ] **Setup**: Driver has pending join request
- [ ] **Action**: Passenger rejects driver with reason
- [ ] **Expected**: Driver receives "Request Declined"
- [ ] **Verify**: Rejection reason in notification data
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to SearchPassengerOffers screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 2.4 Driver Cancels Join
- [ ] **Setup**: Driver has pending join request
- [ ] **Action**: Driver cancels join
- [ ] **Expected**: Passenger receives "Driver Cancelled"
- [ ] **Verify**: Notification body correct
- [ ] **Action**: Tap notification
- [ ] **Expected**: Navigate to PassengerOfferDetails screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 2.5 Passenger Cancels Offer (With Interested Drivers)
- [ ] **Setup**: Offer has 2+ pending/confirmed drivers
- [ ] **Action**: Passenger cancels offer
- [ ] **Expected**: All drivers receive "Ride Request Cancelled"
- [ ] **Verify**: Multiple devices receive notification
- [ ] **Action**: Tap notification (any driver)
- [ ] **Expected**: Navigate to SearchPassengerOffers screen
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3: Multi-Device Scenarios

#### 3.1 Same User, Multiple Devices
- [ ] **Setup**: Register 2+ devices for same user
- [ ] **Action**: Trigger any notification
- [ ] **Expected**: All devices receive notification
- [ ] **Verify**: Check all devices simultaneously
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 3.2 FCM Token (Android)
- [ ] **Setup**: Use Android device with FCM token
- [ ] **Action**: Trigger notification
- [ ] **Expected**: Notification received via FCM
- [ ] **Verify**: Check backend logs for "FCM" detection
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 3.3 Expo Token (iOS/Android)
- [ ] **Setup**: Use device with Expo token
- [ ] **Action**: Trigger notification
- [ ] **Expected**: Notification received via Expo
- [ ] **Verify**: Check backend logs for "Expo" detection
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 4: Error Handling

#### 4.1 Invalid Token
- [ ] **Setup**: Manually set invalid token in database
- [ ] **Action**: Trigger notification
- [ ] **Expected**: Backend logs error
- [ ] **Verify**: Token is_active set to false
- [ ] **Verify**: Main action still succeeds
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 4.2 Expired Token
- [ ] **Setup**: Use expired push token
- [ ] **Action**: Trigger notification
- [ ] **Expected**: Backend logs error
- [ ] **Verify**: Token deactivated
- [ ] **Verify**: Main action still succeeds
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 4.3 No Active Tokens
- [ ] **Setup**: User with no active tokens
- [ ] **Action**: Trigger notification
- [ ] **Expected**: Backend logs "No active push tokens"
- [ ] **Verify**: Main action still succeeds
- [ ] **Verify**: No crash or error
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 5: Foreground vs Background

#### 5.1 App in Foreground
- [ ] **Setup**: App is open and active
- [ ] **Action**: Trigger notification
- [ ] **Expected**: Notification shown in-app (toast/alert)
- [ ] **Verify**: Notification data accessible
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 5.2 App in Background
- [ ] **Setup**: App is in background
- [ ] **Action**: Trigger notification
- [ ] **Expected**: System notification appears
- [ ] **Action**: Tap notification
- [ ] **Expected**: App opens and navigates correctly
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 5.3 App Closed
- [ ] **Setup**: App is completely closed
- [ ] **Action**: Trigger notification
- [ ] **Expected**: System notification appears
- [ ] **Action**: Tap notification
- [ ] **Expected**: App launches and navigates correctly
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 6: Edge Cases

#### 6.1 Rapid Actions
- [ ] **Setup**: Multiple passengers join same offer quickly
- [ ] **Expected**: Driver receives all notifications
- [ ] **Verify**: No notifications lost
- [ ] **Verify**: Correct order maintained
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 6.2 Network Interruption
- [ ] **Setup**: Disable network during notification send
- [ ] **Expected**: Backend logs error
- [ ] **Verify**: Main action still succeeds
- [ ] **Verify**: Notification retried (if retry logic exists)
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

#### 6.3 Offer Deleted Before Notification
- [ ] **Setup**: Delete offer immediately after action
- [ ] **Expected**: Notification still sent (if possible)
- [ ] **Verify**: No crash or error
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Performance Testing

### Response Time
- [ ] **Test**: Measure time from action to notification receipt
- [ ] **Expected**: < 2 seconds average
- [ ] **Actual**: _____ seconds
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

### Concurrent Notifications
- [ ] **Test**: 10+ passengers join same offer simultaneously
- [ ] **Expected**: All notifications sent successfully
- [ ] **Verify**: No rate limiting issues
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

### Token Cleanup
- [ ] **Test**: Check invalid token deactivation
- [ ] **Expected**: Invalid tokens marked is_active = false
- [ ] **Verify**: Database updated correctly
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Localization Testing

### Language Detection
- [ ] **Test**: Set Accept-Language header to 'uz'
- [ ] **Expected**: Uzbek notifications (if implemented)
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed | ⏭️ Skipped

- [ ] **Test**: Set Accept-Language header to 'ru'
- [ ] **Expected**: Russian notifications (if implemented)
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed | ⏭️ Skipped

- [ ] **Test**: Set Accept-Language header to 'en'
- [ ] **Expected**: English notifications (if implemented)
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed | ⏭️ Skipped

---

## Security Testing

### Authorization
- [ ] **Test**: Try to trigger notification for other user's offer
- [ ] **Expected**: Authorization error, no notification sent
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

### Data Validation
- [ ] **Test**: Send malformed notification data
- [ ] **Expected**: Error handled gracefully
- [ ] **Verify**: No crash or security issue
- [ ] **Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Test Results Summary

### Overall Status
- **Total Tests**: 25+
- **Passed**: _____
- **Failed**: _____
- **Not Tested**: _____
- **Skipped**: _____

### Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Minor Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Sign-Off

### Backend Developer
- **Name**: _____________________
- **Date**: _____________________
- **Signature**: ✅ Backend implementation complete

### QA Tester
- **Name**: _____________________
- **Date**: _____________________
- **Signature**: ⬜ Testing in progress

### Product Owner
- **Name**: _____________________
- **Date**: _____________________
- **Signature**: ⬜ Approved for production

---

## Notes

Use this checklist to systematically test all push notification flows. Mark each test as:
- ⬜ Not Tested
- ✅ Passed
- ❌ Failed
- ⏭️ Skipped (if not applicable)

Document any issues found in the "Issues Found" sections above.

**Remember**: Push notifications only work on physical devices, not simulators/emulators!

