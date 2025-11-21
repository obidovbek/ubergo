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

  // Geo hierarchy
  geo: {
    title: 'Hududiy Ma\'lumotlar',
    description: 'Mamlakat, viloyat, tuman va boshqa hududlarni boshqarish',
    countries: {
      sectionTitle: 'Mamlakatlar',
      list: 'Mamlakatlar ro\'yxati',
      create: 'Mamlakat qo\'shish',
      edit: 'Mamlakatni tahrirlash',
      createTitle: 'Yangi mamlakat qo\'shish',
      editTitle: 'Mamlakatni tahrirlash',
      addButton: 'Mamlakatni qo\'shish',
      name: 'Nom',
      latitude: 'Kenglik (lat)',
      longitude: 'Uzunlik (lng)',
    },
    provinces: {
      sectionTitle: 'Viloyatlar',
      list: 'Viloyatlar ro\'yxati',
      create: 'Viloyat qo\'shish',
      edit: 'Viloyatni tahrirlash',
      createTitle: 'Yangi viloyat qo\'shish',
      editTitle: 'Viloyatni tahrirlash',
      selectCountry: 'Mamlakatni tanlang',
      addButton: 'Viloyatni qo\'shish',
      name: 'Nom',
    },
    cityDistricts: {
      sectionTitle: 'Shaharlar / Tumanlar',
      list: 'Shahar va tumanlar ro\'yxati',
      create: 'Shahar yoki tumanni qo\'shish',
      edit: 'Shahar yoki tumanni tahrirlash',
      createTitle: 'Yangi shahar yoki tuman qo\'shish',
      editTitle: 'Shahar yoki tumanni tahrirlash',
      selectProvince: 'Viloyatni tanlang',
      addButton: 'Shahar yoki tumanni qo\'shish',
      name: 'Nom',
    },
    administrativeAreas: {
      sectionTitle: 'Ma\'muriy hududlar',
      list: 'Ma\'muriy hududlar ro\'yxati',
      create: 'Ma\'muriy hudud qo\'shish',
      edit: 'Ma\'muriy hududni tahrirlash',
      createTitle: 'Yangi ma\'muriy hudud qo\'shish',
      editTitle: 'Ma\'muriy hududni tahrirlash',
      addButton: 'Ma\'muriy hududni qo\'shish',
      name: 'Nom',
    },
    settlements: {
      sectionTitle: 'Aholi punktlari',
       list: 'Aholi punktlari ro\'yxati',
       create: 'Aholi punktini qo\'shish',
       edit: 'Aholi punktini tahrirlash',
       createTitle: 'Yangi aholi punktini qo\'shish',
       editTitle: 'Aholi punktini tahrirlash',
      addButton: 'Aholi punktini qo\'shish',
      name: 'Nom',
      type: 'Turi',
    },
    neighborhoods: {
      sectionTitle: 'Mahallalar',
      list: 'Mahallalar ro\'yxati',
      create: 'Mahalla qo\'shish',
      edit: 'Mahallani tahrirlash',
      createTitle: 'Yangi mahalla qo\'shish',
      editTitle: 'Mahallani tahrirlash',
      addButton: 'Mahallani qo\'shish',
      name: 'Nom',
    },
    tables: {
      name: 'Nom',
      parent: 'Ota hudud',
      type: 'Turi',
      latitude: 'Lat',
      longitude: 'Lng',
      actions: 'Amallar',
      empty: 'Ma\'lumot mavjud emas',
    },
  },

  // Vehicles
  vehicles: {
    title: 'Transport vositalari',
    types: {
      sectionTitle: 'Transport turlari',
      list: 'Turlar ro\'yxati',
      create: 'Tur qo\'shish',
    },
    makes: {
      sectionTitle: 'Transport markalari',
      list: 'Markalar ro\'yxati',
      create: 'Marka qo\'shish',
    },
    models: {
      sectionTitle: 'Transport modellari',
      list: 'Modellar ro\'yxati',
      create: 'Model qo\'shish',
    },
    bodyTypes: {
      sectionTitle: 'Kuzov turlari',
      list: 'Kuzov turlari ro\'yxati',
      create: 'Kuzov turi qo\'shish',
    },
    colors: {
      sectionTitle: 'Ranglar',
      list: 'Ranglar ro\'yxati',
      create: 'Rang qo\'shish',
    },
  },

  // Errors
  errors: {
    loadFailed: 'Admin foydalanuvchilarni yuklashda xatolik',
    createFailed: 'Admin foydalanuvchi yaratishda xatolik',
    updateFailed: 'Admin foydalanuvchini yangilashda xatolik',
    deleteFailed: 'Admin foydalanuvchini o\'chirishda xatolik',
    loadUserFailed: 'Admin foydalanuvchini yuklashda xatolik',
    updateUserFailed: 'Foydalanuvchini yangilashda xatolik',
    countriesLoadFailed: 'Mamlakatlarni yuklashda xatolik',
    countryCreateFailed: 'Mamlakatni yaratishda xatolik',
    countryUpdateFailed: 'Mamlakatni yangilashda xatolik',
    countryDeleteFailed: 'Mamlakatni o\'chirishda xatolik',
    countryLoadFailed: 'Mamlakatni yuklashda xatolik',
    geoCountriesLoadFailed: 'Hududiy mamlakatlarni yuklashda xatolik',
    geoProvincesLoadFailed: 'Viloyatlarni yuklashda xatolik',
    geoDistrictsLoadFailed: 'Tumanlarni yuklashda xatolik',
    geoAdministrativeAreasLoadFailed: 'Ma\'muriy hududlarni yuklashda xatolik',
    geoSettlementsLoadFailed: 'Aholi punktlarini yuklashda xatolik',
    geoNeighborhoodsLoadFailed: 'Mahallalarni yuklashda xatolik',
    geoCreateFailed: 'Hududiy ma\'lumotni yaratishda xatolik',
    geoDeleteFailed: 'Hududiy ma\'lumotni o\'chirishda xatolik',
  },
};

