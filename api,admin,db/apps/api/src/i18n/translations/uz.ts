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
    address_country: 'Mamlakat',
    address_region: 'Viloyat',
    address_city: 'Shahar',
    address_settlement_type: 'Aholi yashash punkti',
    address_mahalla: 'Mahalla',
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
};

