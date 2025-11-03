/**
 * Uzbek Translations
 * Default language for the app
 */

export default {
  common: {
    continue: 'Continue',
    cancel: 'Bekor qilish',
    confirm: 'Tasdiqlash',
    ok: 'OK',
    error: 'Xato',
    success: 'Muvaffaqiyat',
    loading: 'Yuklanmoqda...',
    retry: 'Qayta urinish',
  },

  auth: {
    appName: 'UbexGo',
  },

  // Phone Registration Screen
  phoneRegistration: {
    title: 'Registratsiya',
    subtitle: "Dasturdan foydalanish uchun telefon\nraqamingizni kiriting",
    phonePlaceholder: '00 000-00-00',
    termsText: '"Keyingi" tugmasini boshish orqali ',
    termsLink: 'foydalanuvchi shartlarini',
    termsText2: ' shartlarini qabul qilaman',
    googleSignIn: 'Google orqali kirish',
    appleSignIn: 'Apple orqali kirish',
    facebookSignIn: 'Facebook orqali kirish',
    microsoftSignIn: 'Microsoft orqali kirish',
    signingIn: 'Kirilmoqda...',
    footerText: "yuqoridagi platformalar yordamida ro'yxatdan o'tish orqali men ",
    footerLink: 'foydalanuvchi shartlarini',
    footerText2: ' shartlarini qabul qilaman',
    alreadyHaveAccount: 'Allaqachon akkauntingiz bormi? ',
    login: 'Kirish',
    errorPhoneIncomplete: "Iltimos telefon raqamingizni to'liq kiriting (9 raqam)",
    errorGoogleNotReady: "Google xizmati tayyor emas. Iltimos qayta urinib ko'ring.",
    errorGoogleCancelled: "Google orqali kirish bekor qilindi",
    errorNetwork: "Internet aloqasi bilan muammo. Iltimos qayta urinib ko'ring.",
    errorGoogleFailed: "Google orqali kirish amalga oshmadi",
    infoNotAvailable: " orqali kirish hozircha mavjud emas",
  },

  // OTP Verification Screen
  otpVerification: {
    title: 'Kodni kiriting',
    subtitle: "Tasdiqlash kodi quyidagi raqamga\nyuborildi",
    verifying: 'Tekshirilmoqda...',
    resendQuestion: 'Kodni olmadingizmi? ',
    resendLink: 'Qayta yuborish',
    newCodeSent: 'Yangi kod yuborildi',
    errorIncomplete: "Iltimos tasdiqlash kodini to'liq kiriting (4 raqam)",
    errorIncorrect: "Kod noto'g'ri! Qolgan urinishlar: ",
    errorNoAttempts: "Urinishlar tugadi",
    errorNoAttemptsMessage: "3 marta noto'g'ri kod kiritdingiz. Qaytadan telefon raqamingizni kiriting.",
    errorResend: 'Kod yuborishda xatolik yuz berdi',
    attemptsLabel: 'Urinish: ',
    remainingLabel: ' | Qolgan: ',
  },

  // User Details Screen
  userDetails: {
    title: 'Shaharlar aro',
    subtitle: "Bonus va sovg'alarni\nolish uchun shaklni to'ldirin",
    requiredField: '* - majburiy maydon',
    firstName: 'ISM',
    lastName: 'Familiya',
    fatherName: 'Otasining ismi',
    gender: 'Jins',
    male: 'Erkak',
    female: 'Ayol',
    birthDate: "Tug'ilgan sanasi",
    email: 'email (elektron manzil)',
    phone: 'Tel.:',
    userId: 'ID:',
    promoCode: 'PROMO:',
    additionalPhones: "Doim aloqada bo'lish uchun\nqo'shimcha raqam kiriting\n(5 tagacha. Antenna chiqmay qolsa ....)",
    submit: 'Tayyor',
    firstNamePlaceholder: 'Ismingizni kiriting',
    lastNamePlaceholder: 'Familiyangizni kiriting',
    fatherNamePlaceholder: 'Otangizning ismi',
    emailPlaceholder: 'example@email.com',
    userIdPlaceholder: '1 001 117',
    promoCodePlaceholder: '1515',
    birthDatePlaceholder: '21.01.1985',
    phonePlaceholder: '90 123 45 67',
    genderHelper: 'Siz uchun qulay transport topish uchun',
    birthDateHelper: "Tug'ilgan kuningizda kompaniyadan sovg'a uchun",
    emailHelper: 'Akkountingizni tiklash uchun',
    infoBoxText: "Sizni taklif qilgan (link yuborgan) shaxs ",
    infoBoxPhone: 'telefon raqami',
    infoBoxId: '\nID raqami',
    infoBoxPromo: "\nyoki reklama ",
    infoBoxPromoCode: 'PROMO kod',
    infoBoxPromo2: ' ini kiritib\n',
    infoBoxBonus: '10 000',
    infoBoxBonus2: ' bonus oling',
    selectDate: "Tug'ilgan sanani tanlang",
    day: 'Kun',
    month: 'Oy',
    year: 'Yil',
    errorFirstName: 'Ism majburiy',
    errorLastName: 'Familiya majburiy',
    errorGender: 'Jinsni tanlang',
    errorBirthDate: "Tug'ilgan sanani kiriting",
    errorBirthDateIncomplete: "To'liq sanani kiriting",
    errorEmail: 'Email majburiy',
    errorEmailInvalid: "Email formati noto'g'ri",
    errorPhone: "Iltimos telefon raqamini to'liq kiriting",
    errorAllFields: "Iltimos barcha majburiy maydonlarni to'ldiring",
    successTitle: 'Muvaffaqiyatli!',
    successMessage: 'Registratsiya muvaffaqiyatli yakunlandi',
    errorUpdate: "Profil yangilashda xatolik yuz berdi",
  },

  // Menu Screen (Home)
  menu: {
    title: 'TAXI',
    subtitle: 'Mamlakatni tanlang',
    uzbekistan: "O'zbekiston",
    guest: 'Guest',
    // Taxi options
    viloyatlar: 'Taksi\nViloyatlar Aro',
    ichi: 'Taksi\nViloyat\nichi',
    tuman: 'Taksi\nTuman,\nichi va Yaqin\nmasofalar',
    empty: 'Taksi',
    xalqaro: 'Taksi\nXALQARO',
  },

  // Profile Screen
  profile: {
    logout: 'Chiqish',
    logoutConfirm: 'Haqiqatan ham tizimdan chiqmoqchimisiz?',
    logoutError: "Chiqishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
    noEmail: 'No email',
    noPhone: 'No phone',
    appVersion: 'UbexGo v1.0.0',
    // Menu items
    editProfile: 'Profilni tahrirlash',
    paymentMethods: "To'lov usullari",
    tripHistory: 'Sayohatlar tarixi',
    helpSupport: "Yordam va qo'llab-quvvatlash",
    settings: 'Sozlamalar',
  },

  // Months
  months: {
    january: 'Yanvar',
    february: 'Fevral',
    march: 'Mart',
    april: 'Aprel',
    may: 'May',
    june: 'Iyun',
    july: 'Iyul',
    august: 'Avgust',
    september: 'Sentabr',
    october: 'Oktabr',
    november: 'Noyabr',
    december: 'Dekabr',
  },

  // Driver Messages
  driver: {
    profileUpdated: 'Profil yangilandi',
    profileIncomplete: "Profil to'ldirilmagan",
    registrationComplete: "Ro'yxatdan o'tish yakunlandi",
    passportUpdated: 'Passport ma\'lumotlari saqlandi',
    licenseUpdated: 'Guvohnoma ma\'lumotlari saqlandi',
    vehicleUpdated: 'Avtomobil ma\'lumotlari saqlandi',
    taxiLicenseUpdated: 'Taksi litsenziyasi saqlandi',
  },

  // Backend Error Messages
  errors: {
    network: "Internet bilan aloqa yo'q",
    timeout: 'Kutish vaqti tugadi',
    serverError: "Serverda xatolik yuz berdi",
    unauthorized: "Ruxsat berilmagan",
    forbidden: "Kirish taqiqlangan",
    notFound: "Topilmadi",
    badRequest: "Noto'g'ri so'rov",
    conflict: "Ma'lumot allaqachon mavjud",
    validation: "Ma'lumotlar noto'g'ri",
    unknown: "Noma'lum xatolik yuz berdi",
    tryAgain: "Iltimos qaytadan urinib ko'ring",
  },

  // Form Validation Messages
  formValidation: {
    // Driver Details
    driverTypeRequired: "Yo'nalishni tanlang",
    driverTypeInvalid: "Noto'g'ri yo'nalish tanlangan",

    // Personal Info
    firstNameRequired: "Ism majburiy maydon",
    firstNameTooShort: "Ism juda qisqa",
    lastNameRequired: "Familiya majburiy maydon",
    lastNameTooShort: "Familiya juda qisqa",
    fatherNameRequired: "Otasining ismi majburiy maydon",
    genderRequired: "Jinsni tanlang",
    genderInvalid: "Noto'g'ri jins tanlangan",
    birthDateRequired: "Tug'ilgan sanani kiriting",
    birthDateInvalid: "Sana noto'g'ri formatda",
    emailInvalid: "Email noto'g'ri formatda",
    addressCountryRequired: "Mamlakatni kiriting",
    addressRegionRequired: "Viloyatni kiriting",
    addressCityRequired: "Shaharni kiriting",
    photoRequired: "Rasm yuklash majburiy",

    // Passport Info
    idCardRequired: "ID karta raqamini kiriting",
    idCardTooShort: "ID karta raqami juda qisqa",
    pinflRequired: "JSHSHIR (PINFL) ni kiriting",
    pinflInvalid: "JSHSHIR 14 raqamdan iborat bo'lishi kerak",
    citizenshipRequired: "Fuqaroligini kiriting",
    issueDateRequired: "Berilgan sanani kiriting",
    expiryDateRequired: "Amal qilish muddatini kiriting",

    // License Info
    licenseNumberRequired: "Guvohnoma raqamini kiriting",
    licenseNumberTooShort: "Guvohnoma raqami juda qisqa",
    issueDateInvalid: "Berilgan sana noto'g'ri",
    categoryRequired: "Kamida bitta kategoriya tanlanishi kerak",

    // Emergency Contacts
    phoneRequired: "Telefon raqamini kiriting",
    phoneInvalid: "Telefon raqami noto'g'ri formatda",
    relationshipRequired: "Qarindoshlik aloqasini kiriting",

    // Vehicle Info
    vehicleTypeRequired: "Transport turini tanlang",
    vehicleTypeInvalid: "Noto'g'ri transport turi",
    licensePlateRequired: "Davlat raqamini kiriting",
    licensePlateTooShort: "Davlat raqami juda qisqa",
    makeRequired: "Markani kiriting",
    modelRequired: "Modelni kiriting",
    yearRequired: "Ishlab chiqarilgan yilini kiriting",
    yearInvalid: "Yil noto'g'ri formatda",
    colorRequired: "Rangni kiriting",

    // Taxi License
    taxiLicenseRequired: "Taksi litsenziya raqamini kiriting",
    licenseSheetRequired: "Litsenziya varaqasi raqamini kiriting",
    validFromRequired: "Amal qilish boshlanish sanasini kiriting",
    validUntilRequired: "Amal qilish tugash sanasini kiriting",

    // Generic messages
    required: "Bu maydon majburiy",
    tooShort: "Qiymat juda qisqa",
    tooLong: "Qiymat juda uzun",
    invalid: "Noto'g'ri format",
    mustBeNumber: "Faqat raqamlar kiritilishi kerak",
    mustBePositive: "Musbat qiymat bo'lishi kerak",
  },
};

