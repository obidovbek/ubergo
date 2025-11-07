/**
 * Uzbek Translations
 * Centralized translation strings for the admin app
 */

export const translations = {
  // Common
  common: {
    loading: 'Yuklanmoqda...',
    error: 'Xatolik',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    saving: 'Saqlanmoqda...',
    delete: "O'chirish",
    edit: 'Tahrirlash',
    create: 'Yaratish',
    update: 'Yangilash',
    back: 'Orqaga',
    next: 'Keyingi',
    previous: 'Oldingi',
    actions: 'Amallar',
    name: 'Ism',
    email: 'Email',
    status: 'Holat',
    roles: 'Rollar',
    never: 'Hech qachon',
    page: 'Sahifa',
    of: 'dan',
    logout: 'Chiqish',
    profile: 'Profil',
  },

  // Admin Users
  adminUsers: {
    title: 'Admin Foydalanuvchilar',
    list: 'Ro\'yxat',
    create: 'Yaratish',
    createTitle: 'Admin Foydalanuvchi Yaratish',
    editTitle: 'Admin Foydalanuvchini Tahrirlash',
    createButton: 'Admin Foydalanuvchi Yaratish',
    updateButton: 'Admin Foydalanuvchini Yangilash',
    backToList: 'Ro\'yxatga Qaytish',
    noUsersFound: 'Admin foydalanuvchilar topilmadi',
    deleteConfirm: 'Bu admin foydalanuvchini o\'chirishni xohlaysizmi?',
    lastLogin: 'Oxirgi Kirish',
    fullName: 'To\'liq Ism',
    password: 'Parol',
    passwordPlaceholder: 'Parolni o\'zgartirish uchun yangi parol kiriting',
    passwordKeepCurrent: 'Joriy parolni saqlash uchun bo\'sh qoldiring',
    profile: 'Profil',
    editProfile: 'Profilni Tahrirlash',
  },

  // Passengers
  passengers: {
    title: 'Yo\'lovchilar',
    list: 'Ro\'yxat',
  },

  // Drivers
  drivers: {
    title: 'Haydovchilar',
    list: 'Ro\'yxat',
  },

  // Form Validation
  validation: {
    emailRequired: 'Email talab qilinadi',
    emailInvalid: 'Noto\'g\'ri email formati',
    passwordRequired: 'Parol talab qilinadi',
    passwordMinLength: 'Parol kamida 6 belgidan iborat bo\'lishi kerak',
    fullNameRequired: 'To\'liq ism talab qilinadi',
    countryNameRequired: 'Mamlakat nomi talab qilinadi',
    countryCodeRequired: 'Telefon kodi talab qilinadi',
    countryLocalLengthRequired: 'Mahalliy raqam uzunligini kiriting',
    countryLocalLengthMin: 'Mahalliy raqam uzunligi 1 dan kichik bo\'lmasligi kerak',
    countryPatternRequired: 'Format turini tanlang',
  },

  // Status
  status: {
    active: 'Faol',
    inactive: 'Nofaol',
    suspended: 'Bloklangan',
  },

  // Roles
  roles: {
    mainAdmin: 'Bosh Administrator',
    dispatcher: 'Dispetcher',
    support: 'Qo\'llab-quvvatlash',
    manager: 'Menejer',
    viewer: 'Ko\'ruvchi',
  },

  // Countries
  countries: {
    title: 'Mamlakatlar',
    createTitle: 'Mamlakat Qo\'shish',
    editTitle: 'Mamlakatni Tahrirlash',
    createButton: 'Mamlakatni Qo\'shish',
    updateButton: 'Mamlakatni Yangilash',
    list: 'Ro\'yxat',
    create: 'Yaratish',
    backToList: 'Mamlakatlar ro\'yxatiga qaytish',
    listEmpty: 'Mamlakatlar topilmadi',
    deleteConfirm: 'Bu mamlakatni o\'chirishni xohlaysizmi?',
    name: 'Mamlakat nomi',
    code: 'Telefon kodi',
    flag: 'Flag emoji',
    localLength: 'Mahalliy raqam uzunligi',
    pattern: 'Format turi',
    sortOrder: 'Tartib raqami',
    isActive: 'Faol',
    patterns: {
      uz: 'O\'zbekiston formati',
      ru: 'Rossiya (7) formati',
      generic: 'Umumiy format',
    },
  },

  // Errors
  errors: {
    loadFailed: 'Admin foydalanuvchilarni yuklashda xatolik',
    createFailed: 'Admin foydalanuvchi yaratishda xatolik',
    updateFailed: 'Admin foydalanuvchini yangilashda xatolik',
    deleteFailed: 'Admin foydalanuvchini o\'chirishda xatolik',
    loadUserFailed: 'Admin foydalanuvchini yuklashda xatolik',
    countriesLoadFailed: 'Mamlakatlarni yuklashda xatolik',
    countryCreateFailed: 'Mamlakatni yaratishda xatolik',
    countryUpdateFailed: 'Mamlakatni yangilashda xatolik',
    countryDeleteFailed: 'Mamlakatni o\'chirishda xatolik',
    countryLoadFailed: 'Mamlakatni yuklashda xatolik',
  },
};

