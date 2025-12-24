/**
 * English Translations
 */

export default {
  // Common messages
  common: {
    success: 'Success',
    error: 'Error',
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    notFound: 'Not Found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    serverError: 'Server Error',
    badRequest: 'Bad Request',
    conflict: 'Already Exists',
  },

  // Validation messages
  validation: {
    required: "{field} is required",
    invalid: "{field} is invalid",
    tooShort: "{field} is too short (minimum {min} characters)",
    tooLong: "{field} is too long (maximum {max} characters)",
    minValue: "{field} must be at least {min}",
    maxValue: "{field} must be at most {max}",
    email: "Invalid email format",
    phone: "Invalid phone format",
    url: "Invalid URL format",
    unique: "{field} already exists",
    notMatch: "{field} does not match",
    invalidDate: "Invalid date format",
    pastDate: "Date must be in the past",
    futureDate: "Date must be in the future",
    invalidChoice: "Invalid choice",
  },

  // Field names
  fields: {
    // User fields
    first_name: 'First Name',
    last_name: 'Last Name',
    father_name: "Father's Name",
    email: 'Email',
    phone: 'Phone Number',
    password: 'Password',
    birth_date: 'Date of Birth',
    gender: 'Gender',
    
    // Driver fields
    driver_type: 'Driver Type',
    role: 'Role',
    
    // Address fields
    address_country_id: 'Country',
    address_province_id: 'Province',
    address_city_district_id: 'City / District',
    address_administrative_area_id: 'Administrative Area',
    address_settlement_id: 'Settlement',
    address_neighborhood_id: 'Neighborhood',
    address_street: 'Street Address',
    
    // Passport fields
    id_card_number: 'ID Card Number',
    pinfl: 'PINFL',
    citizenship: 'Citizenship',
    birth_place_country: 'Birth Country',
    birth_place_region: 'Birth Region',
    birth_place_city: 'Birth City',
    issue_date: 'Issue Date',
    expiry_date: 'Expiry Date',
    
    // License fields
    license_number: 'License Number',
    category: 'Category',
    category_a: 'Category A',
    category_b: 'Category B',
    category_c: 'Category C',
    category_d: 'Category D',
    category_be: 'Category BE',
    category_ce: 'Category CE',
    category_de: 'Category DE',
    license_front_url: 'License Front Photo',
    license_back_url: 'License Back Photo',
    
    // Emergency contact fields
    phone_number: 'Phone Number',
    phone_country_code: 'Country Code',
    relationship: 'Relationship',
    
    // Vehicle fields
    vehicle_type: 'Vehicle Type',
    body_type: 'Body Type',
    make: 'Make',
    model: 'Model',
    color: 'Color',
    tech_passport_series: 'Tech Passport Series',
    license_plate: 'License Plate',
    year: 'Year',
    fuel_types: 'Fuel Types',
    seating_capacity: 'Seating Capacity',
    
    // Owner fields
    company_name: 'Company Name',
    company_tax_id: 'Company Tax ID',
    owner_first_name: "Owner's First Name",
    owner_last_name: "Owner's Last Name",
    owner_father_name: "Owner's Father Name",
    owner_pinfl: "Owner's PINFL",
    
    // Taxi license fields
    license_registry_number: 'License Registry Number',
    license_sheet_number: 'License Sheet Number',
    license_sheet_valid_from: 'Valid From',
    license_sheet_valid_until: 'Valid Until',
    self_employment_number: 'Self-Employment Number',
    
    // Photo fields
    photo_face_url: 'Face Photo',
    photo_body_url: 'Full Body Photo',
  },

  // Authentication messages
  auth: {
    loginSuccess: 'Login successful',
    logoutSuccess: 'Logged out successfully',
    invalidCredentials: 'Invalid email or password',
    accountNotFound: 'Account not found',
    accountDisabled: 'Account is disabled',
    tokenExpired: 'Session expired',
    tokenInvalid: 'Invalid token',
  },

  // OTP messages
  otp: {
    sent: 'Verification code sent',
    verified: 'Code verified',
    invalid: 'Invalid code',
    expired: 'Code expired',
    maxAttempts: 'Maximum attempts exceeded',
    phoneOrUserIdRequired: 'Phone number or user ID is required',
    userNotFoundOrPhoneMissing: 'User not found or phone missing',
    invalidChannel: 'Invalid channel. Use "sms", "call" or "push"',
    phoneOrUserIdAndCodeRequired: 'Phone number or user ID and code are required',
    invalidOrExpiredCode: 'Invalid or expired code',
  },

  // Driver profile messages
  driver: {
    profileUpdated: 'Profile updated',
    profileIncomplete: 'Profile incomplete',
    registrationComplete: 'Registration complete',
    passportUpdated: 'Passport information saved',
    licenseUpdated: 'License information saved',
    vehicleUpdated: 'Vehicle information saved',
    taxiLicenseUpdated: 'Taxi license saved',
  },

  // Offer error messages
  offers: {
    notFound: 'Offer not found',
    notAvailable: 'This offer is not available',
    alreadyStarted: 'This offer has already started',
    cannotJoinOwn: 'You cannot join your own offer',
    alreadyJoined: 'You have already joined this offer',
    noSeatsAvailable: 'No seats available',
    onlySeatsAvailable: 'Only {count} seats available',
    seatsOutOfRange: 'Seats must be between 1 and 8',
    offerNotFound: 'Offer not found',
    joinFailed: 'Failed to join offer',
    cancelFailed: 'Failed to cancel',
    confirmFailed: 'Failed to confirm',
    rejectFailed: 'Failed to reject',
    joinRequestNotFound: 'Join request not found',
    noPermissionConfirm: 'You do not have permission to confirm this request',
    noPermissionReject: 'You do not have permission to reject this request',
    noPermissionCancel: 'You do not have permission to cancel this request',
    alreadyProcessed: 'This request has already been processed',
    cannotCancel: 'This request cannot be cancelled',
    offerNotFoundOrNoPermission: 'Offer not found or you do not have permission',
    vehicleNotFound: 'Vehicle not found or does not belong to you',
    alreadySentRequest: 'You have already sent a request for this offer',
    needsAtLeastSeats: 'Passenger needs at least {count} seats',
    seatsOutOfRangeDriver: 'Seats offered must be between 1 and 8',
    priceMustBePositive: 'Offered price per seat must be greater than 0',
    driverJoinRequestNotFound: 'Driver join request not found',
    noPermissionViewDrivers: 'You do not have permission to view drivers for this offer',
    cannotCancelConfirmed: 'Cannot cancel a confirmed request',
    cannotJoinAfterRejected: 'You cannot join this offer because your previous request was rejected',
    cannotJoinAfterCancelled: 'You cannot join this offer because you cancelled your previous request',
  },

  // Driver License specific messages
  driverLicense: {
    // Validation errors
    licenseNumberRequired: 'License number is required',
    issueDateRequired: 'Issue date is required',
    licenseNumberInvalid: 'License number is invalid',
    issueDateInvalid: 'Issue date is invalid',
    categoryDateInvalid: 'Category date is invalid',
    licenseNumberTooShort: 'License number is too short',
    licenseNumberTooLong: 'License number is too long',
    
    // Field-specific validation
    licenseNumberFormat: 'License number format is invalid (e.g., AG 1234567)',
    issueDatePast: 'Issue date must be in the past',
    issueDateFuture: 'Issue date cannot be in the future',
    categoryDateFuture: 'Category date cannot be in the future',
    
    // Success messages
    licenseCreated: 'License information created',
    licenseUpdated: 'License information updated',
    licenseSaved: 'License information saved',
    
    // Error messages
    licenseNotFound: 'License not found',
    licenseAlreadyExists: 'License already exists',
    licenseUpdateFailed: 'Failed to update license information',
    licenseCreateFailed: 'Failed to create license information',
    licenseDeleteFailed: 'Failed to delete license information',
    
    // Photo upload errors
    photoUploadFailed: 'Failed to upload photo',
    photoFormatInvalid: 'Photo format is invalid',
    photoSizeTooLarge: 'Photo size is too large',
    photoRequired: 'Photo is required',
  },

  // Push notification messages
  push: {
    // Passenger join request (to driver)
    passengerJoinRequestTitle: '🎯 New Passenger Request',
    passengerJoinRequestBody: '{name} wants to join your ride from {from} to {to}. Requesting {seats} seat(s).',
    
    // Join confirmed (to passenger)
    joinConfirmedTitle: '✅ Request Confirmed!',
    joinConfirmedBody: 'Congratulations! Your ride from {from} to {to} has been confirmed. Contact the driver.',
    
    // Join rejected (to passenger)
    joinRejectedTitle: '❌ Request Declined',
    joinRejectedBody: 'Sorry, your request to join the ride from {from} to {to} was declined. Check other offers.',
    
    // Passenger cancelled (to driver)
    passengerCancelledTitle: '⚠️ Passenger Cancelled',
    passengerCancelledBody: 'A passenger cancelled from your ride from {from} to {to}. {status} request was cancelled.',
    
    // Driver join request (to passenger)
    driverJoinRequestTitle: '🚗 New Driver Offer',
    driverJoinRequestBody: '{name} wants to take you from {from} to {to}. Price: {price} {currency}',
    
    // Driver request confirmed (to driver)
    driverRequestConfirmedTitle: '✅ Offer Accepted!',
    driverRequestConfirmedBody: 'Great! Your ride from {from} to {to} has been confirmed. Contact the passenger.',
    
    // Driver request rejected (to driver)
    driverRequestRejectedTitle: '❌ Offer Declined',
    driverRequestRejectedBody: 'Sorry, your offer for the ride from {from} to {to} was declined. Check other offers.',
    
    // Driver request cancelled (to passenger)
    driverRequestCancelledTitle: '⚠️ Driver Cancelled',
    driverRequestCancelledBody: 'A driver cancelled from your ride from {from} to {to}. Search for other drivers.',
    
    // Offer cancelled by driver (to passenger)
    offerCancelledByDriverTitle: '❌ Ride Cancelled',
    offerCancelledByDriverBody: 'Sorry, your ride from {from} to {to} was cancelled by the driver. Search for other offers.',
    
    // Offer cancelled by passenger (to driver)
    offerCancelledByPassengerTitle: '❌ Ride Cancelled',
    offerCancelledByPassengerBody: 'The passenger cancelled the ride from {from} to {to}. Check other offers.',
    
    // Driver arrival notifications (to passenger)
    driver10MinAwayTitle: '⏰ Driver Approaching',
    driver10MinAwayBody: '{driverName} will arrive within {minutes} minutes. Please be ready!',
    driverArrivedTitle: '✅ Driver Arrived',
    driverArrivedBody: '{driverName} is waiting for you at {location}. Please come out!',
  },
};

