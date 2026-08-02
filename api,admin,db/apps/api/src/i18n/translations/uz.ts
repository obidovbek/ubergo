/**
 * Uzbek (O'zbekcha) Translations
 * Default language for API responses
 */

export default {
  // Common messages
  common: {
    success: 'Muvaffaqiyatli',
    error: 'Xatolik',
    created: 'Yaratildi',
    updated: 'Yangilandi',
    deleted: "O'chirildi",
    notFound: 'Topilmadi',
    unauthorized: "Ruxsat yo'q",
    forbidden: "Kirish taqiqlangan",
    serverError: "Server xatosi",
    badRequest: "Noto'g'ri so'rov",
    conflict: "Ma'lumot allaqachon mavjud",
  },

  // Validation messages
  validation: {
    required: "{field} majburiy maydon",
    invalid: "{field} noto'g'ri formatda",
    tooShort: "{field} juda qisqa (kamida {min} belgidan iborat bo'lishi kerak)",
    tooLong: "{field} juda uzun (ko'pi bilan {max} belgidan iborat bo'lishi kerak)",
    minValue: "{field} kamida {min} bo'lishi kerak",
    maxValue: "{field} ko'pi bilan {max} bo'lishi kerak",
    email: "Email manzili noto'g'ri formatda",
    phone: "Telefon raqami noto'g'ri formatda",
    url: "URL manzili noto'g'ri formatda",
    unique: "{field} allaqachon mavjud",
    notMatch: "{field} mos kelmadi",
    invalidDate: "Sana noto'g'ri formatda",
    pastDate: "Sana o'tmishda bo'lishi kerak",
    futureDate: "Sana kelajakda bo'lishi kerak",
    invalidChoice: "Noto'g'ri tanlov",
  },

  // Field names
  fields: {
    // User fields
    first_name: 'Ism',
    last_name: 'Familiya',
    father_name: 'Otasining ismi',
    email: 'Email',
    phone: 'Telefon raqami',
    password: 'Parol',
    birth_date: "Tug'ilgan sana",
    gender: 'Jins',
    
    // Driver fields
    driver_type: 'Haydovchi turi',
    role: 'Rol',
    
    // Address fields
    address_country_id: 'Mamlakat',
    address_province_id: 'Viloyat',
    address_city_district_id: 'Shahar / Tuman',
    address_administrative_area_id: 'Ma\'muriy hudud',
    address_settlement_id: 'Aholi punkti',
    address_neighborhood_id: 'Mahalla',
    address_street: 'Ko\'cha',
    
    // Passport fields
    id_card_number: 'ID karta raqami',
    pinfl: 'JSHSHIR',
    citizenship: 'Fuqaroligi',
    birth_place_country: "Tug'ilgan mamlakat",
    birth_place_region: "Tug'ilgan viloyat",
    birth_place_city: "Tug'ilgan shahar",
    issue_date: 'Berilgan sana',
    expiry_date: 'Amal qilish muddati',
    
    // License fields
    license_number: 'Guvohnoma raqami',
    category: 'Kategoriya',
    category_a: 'Kategoriya A',
    category_b: 'Kategoriya B',
    category_c: 'Kategoriya C',
    category_d: 'Kategoriya D',
    category_be: 'Kategoriya BE',
    category_ce: 'Kategoriya CE',
    category_de: 'Kategoriya DE',
    license_front_url: 'Guvohnoma old tomoni rasmi',
    license_back_url: 'Guvohnoma orqa tomoni rasmi',
    
    // Emergency contact fields
    phone_number: 'Telefon raqami',
    phone_country_code: 'Mamlakat kodi',
    relationship: "Qarindoshlik aloqasi",
    
    // Vehicle fields
    vehicle_type: 'Transport turi',
    body_type: 'Kuzov turi',
    make: 'Marka',
    model: 'Model',
    color: 'Rang',
    tech_passport_series: 'Tex. passport seriyasi',
    license_plate: 'Davlat raqami',
    year: 'Ishlab chiqarilgan yili',
    fuel_types: "Yoqilg'i turi",
    seating_capacity: "O'rindiqlar soni",
    
    // Owner fields
    company_name: 'Firma nomi',
    company_tax_id: 'Firma STIR',
    owner_first_name: 'Egasining ismi',
    owner_last_name: 'Egasining familiyasi',
    owner_father_name: 'Egasining otasining ismi',
    owner_pinfl: 'Egasining JSHSHIR',
    
    // Taxi license fields
    license_registry_number: 'Litsenziya reyestr raqami',
    license_sheet_number: 'Litsenziya varaqasi raqami',
    license_sheet_valid_from: 'Amal qilish boshlanishi',
    license_sheet_valid_until: 'Amal qilish tugashi',
    self_employment_number: "O'zini o'zi band qilish raqami",
    
    // Photo fields
    photo_face_url: 'Yuz rasmi',
    photo_body_url: 'Butun bo\'y rasmi',
  },

  // Authentication messages
  auth: {
    loginSuccess: 'Muvaffaqiyatli kirdingiz',
    logoutSuccess: "Tizimdan chiqdingiz",
    invalidCredentials: 'Email yoki parol noto\'g\'ri',
    accountNotFound: 'Akkaunt topilmadi',
    accountDisabled: 'Akkaunt faol emas',
    tokenExpired: 'Sessiya muddati tugagan',
    tokenInvalid: 'Token noto\'g\'ri',
  },

  // OTP messages
  otp: {
    sent: 'Tasdiqlash kodi yuborildi',
    verified: 'Kod tasdiqlandi',
    invalid: 'Kod noto\'g\'ri',
    expired: 'Kod muddati tugagan',
    maxAttempts: 'Urinishlar soni oshib ketdi',
    phoneOrUserIdRequired: 'Telefon raqami yoki foydalanuvchi ID raqami kiritilishi kerak',
    userNotFoundOrPhoneMissing: 'Foydalanuvchi topilmadi yoki telefon raqami mavjud emas',
    invalidChannel: 'Noto\'g\'ri kanal. "sms", "call" yoki "push" dan foydalaning',
    phoneOrUserIdAndCodeRequired: 'Telefon raqami yoki foydalanuvchi ID va kod kiritilishi kerak',
    invalidOrExpiredCode: 'Noto\'g\'ri yoki muddati tugagan kod',
  },

  // Driver profile messages
  driver: {
    profileUpdated: 'Profil yangilandi',
    profileIncomplete: "Profil to'ldirilmagan",
    registrationComplete: "Ro'yxatdan o'tish yakunlandi",
    passportUpdated: 'Passport ma\'lumotlari saqlandi',
    licenseUpdated: 'Guvohnoma ma\'lumotlari saqlandi',
    vehicleUpdated: 'Avtomobil ma\'lumotlari saqlandi',
    taxiLicenseUpdated: 'Taksi litsenziyasi saqlandi',
  },

  // Offer error messages
  offers: {
    notFound: 'E\'lon topilmadi',
    notAvailable: 'Bu e\'lon mavjud emas',
    alreadyStarted: 'Bu e\'lon allaqachon boshlangan',
    cannotJoinOwn: 'O\'z e\'loningizga qo\'shila olmaysiz',
    alreadyJoined: 'Siz allaqachon bu e\'longa qo\'shilgansiz',
    noSeatsAvailable: 'Bo\'sh o\'rinlar qolmagan',
    onlySeatsAvailable: 'Faqat {count} ta o\'rin mavjud',
    seatsOutOfRange: 'O\'rinlar soni 1 dan 8 gacha bo\'lishi kerak',
    offerNotFound: 'E\'lon topilmadi',
    joinFailed: 'E\'longa qo\'shilishda xatolik',
    cancelFailed: 'Bekor qilishda xatolik',
    confirmFailed: 'Tasdiqlashda xatolik',
    rejectFailed: 'Rad etishda xatolik',
    joinRequestNotFound: 'Qo\'shilish so\'rovi topilmadi',
    noPermissionConfirm: 'Sizda bu so\'rovni tasdiqlash uchun ruxsat yo\'q',
    noPermissionReject: 'Sizda bu so\'rovni rad etish uchun ruxsat yo\'q',
    noPermissionCancel: 'Sizda bu so\'rovni bekor qilish uchun ruxsat yo\'q',
    alreadyProcessed: 'Bu so\'rov allaqachon qayta ishlangan',
    frontSeatTaken: 'Oldingi o\'rin allaqachon band qilingan',
    cannotCancel: 'Bu so\'rovni bekor qilish mumkin emas',
    offerNotFoundOrNoPermission: 'E\'lon topilmadi yoki sizda ruxsat yo\'q',
    vehicleNotFound: 'Transport vositasi topilmadi yoki sizga tegishli emas',
    alreadySentRequest: 'Siz allaqachon bu e\'lon uchun so\'rov yuborgansiz',
    needsAtLeastSeats: 'Yo\'lovchi kamida {count} ta o\'rin kerak',
    seatsOutOfRangeDriver: 'Taklif qilingan o\'rinlar 1 dan 8 gacha bo\'lishi kerak',
    priceMustBePositive: 'Har bir o\'rin uchun taklif qilingan narx 0 dan katta bo\'lishi kerak',
    driverJoinRequestNotFound: 'Haydovchi qo\'shilish so\'rovi topilmadi',
    noPermissionViewDrivers: 'Sizda bu e\'lon uchun haydovchilarni ko\'rish uchun ruxsat yo\'q',
    cannotCancelConfirmed: 'Tasdiqlangan so\'rovni bekor qilish mumkin emas',
    cannotJoinAfterRejected: 'Siz bu e\'longa qo\'shila olmaysiz, chunki sizning oldingi so\'rovingiz rad etilgan',
    cannotJoinAfterCancelled: 'Siz bu e\'longa qo\'shila olmaysiz, chunki siz o\'z so\'rovingizni bekor qilgansiz',
  },

  // Driver License specific messages
  driverLicense: {
    // Validation errors
    licenseNumberRequired: 'Guvohnoma raqami majburiy maydon',
    issueDateRequired: 'Berilgan sana majburiy maydon',
    licenseNumberInvalid: 'Guvohnoma raqami noto\'g\'ri formatda',
    issueDateInvalid: 'Berilgan sana noto\'g\'ri formatda',
    categoryDateInvalid: 'Kategoriya sanasi noto\'g\'ri formatda',
    licenseNumberTooShort: 'Guvohnoma raqami juda qisqa',
    licenseNumberTooLong: 'Guvohnoma raqami juda uzun',
    
    // Field-specific validation
    licenseNumberFormat: 'Guvohnoma raqami noto\'g\'ri formatda (masalan: AG 1234567)',
    issueDatePast: 'Berilgan sana o\'tmishda bo\'lishi kerak',
    issueDateFuture: 'Berilgan sana kelajakda bo\'lishi mumkin emas',
    categoryDateFuture: 'Kategoriya sanasi kelajakda bo\'lishi mumkin emas',
    
    // Success messages
    licenseCreated: 'Guvohnoma ma\'lumotlari yaratildi',
    licenseUpdated: 'Guvohnoma ma\'lumotlari yangilandi',
    licenseSaved: 'Guvohnoma ma\'lumotlari saqlandi',
    
    // Error messages
    licenseNotFound: 'Guvohnoma topilmadi',
    licenseAlreadyExists: 'Guvohnoma allaqachon mavjud',
    licenseUpdateFailed: 'Guvohnoma ma\'lumotlarini yangilashda xatolik',
    licenseCreateFailed: 'Guvohnoma ma\'lumotlarini yaratishda xatolik',
    licenseDeleteFailed: 'Guvohnoma ma\'lumotlarini o\'chirishda xatolik',
    
    // Photo upload errors
    photoUploadFailed: 'Rasmni yuklashda xatolik',
    photoFormatInvalid: 'Rasm formati noto\'g\'ri',
    photoSizeTooLarge: 'Rasm hajmi juda katta',
    photoRequired: 'Rasm majburiy',
  },

  // Push notification messages
  push: {
    // Passenger join request (to driver)
    passengerJoinRequestTitle: '🎯 Yangi yo\'lovchi so\'rovi',
    passengerJoinRequestBody: '{name} sizning {from} dan {to} ga safaringizga qo\'shilmoqchi. {seats} ta o\'rin so\'rayapti.',
    
    // Join confirmed (to passenger)
    joinConfirmedTitle: '✅ So\'rovingiz tasdiqlandi!',
    joinConfirmedBody: 'Tabriklaymiz! {from} dan {to} ga safaringiz tasdiqlandi. Haydovchi bilan bog\'laning.',
    
    // Join rejected (to passenger)
    joinRejectedTitle: '❌ So\'rovingiz rad etildi',
    joinRejectedBody: 'Afsus, {from} dan {to} ga safaringizga so\'rovingiz rad etildi. Boshqa takliflarni ko\'rib chiqing.',
    
    // Passenger cancelled (to driver)
    passengerCancelledTitle: '⚠️ Yo\'lovchi bekor qildi',
    passengerCancelledBody: 'Yo\'lovchi {from} dan {to} ga safaringizdan chiqdi. {status} so\'rov bekor qilindi.',
    
    // Driver join request (to passenger)
    driverJoinRequestTitle: '🚗 Yangi haydovchi taklifi',
    driverJoinRequestBody: '{name} sizni {from} dan {to} ga olib borishni taklif qilmoqda. Narx: {price} {currency}',
    
    // Driver request confirmed (to driver)
    driverRequestConfirmedTitle: '✅ Taklifingiz qabul qilindi!',
    driverRequestConfirmedBody: 'Ajoyib! {from} dan {to} ga safaringiz tasdiqlandi. Yo\'lovchi bilan bog\'laning.',
    
    // Driver request rejected (to driver)
    driverRequestRejectedTitle: '❌ Taklifingiz rad etildi',
    driverRequestRejectedBody: 'Afsus, {from} dan {to} ga safaringizga taklifingiz rad etildi. Boshqa takliflarni ko\'rib chiqing.',
    
    // Another driver was chosen (to every driver who was still waiting)
    driverNotChosenTitle: 'Boshqa haydovchi tanlandi',
    driverNotChosenBody: '{from} dan {to} ga buyurtmaga boshqa haydovchi tanlandi. Boshqa buyurtmalarni ko\'rib chiqing.',

    // Driver request cancelled (to passenger)
    driverRequestCancelledTitle: '⚠️ Haydovchi bekor qildi',
    driverRequestCancelledBody: 'Haydovchi {from} dan {to} ga safaringizdan chiqdi. Boshqa haydovchilarni qidiring.',
    
    // Offer cancelled by driver (to passenger)
    offerCancelledByDriverTitle: '❌ Safar bekor qilindi',
    offerCancelledByDriverBody: 'Afsus, {from} dan {to} ga safaringiz haydovchi tomonidan bekor qilindi. Boshqa takliflarni qidiring.',
    
    // Offer cancelled by passenger (to driver)
    offerCancelledByPassengerTitle: '❌ Safar bekor qilindi',
    offerCancelledByPassengerBody: 'Yo\'lovchi {from} dan {to} ga safaringizni bekor qildi. Boshqa takliflarni ko\'rib chiqing.',
    
    // Driver arrival notifications (to passenger)
    driver10MinAwayTitle: '⏰ Haydovchi yaqinlashmoqda',
    driver10MinAwayBody: '{driverName} {minutes} daqiqa ichida yetib keladi. Tayyor bo\'ling!',
    driverArrivedTitle: '✅ Haydovchi yetib keldi',
    driverArrivedBody: '{driverName} {location} da sizni kutmoqda. Tezroq chiqing!',
  },
};

