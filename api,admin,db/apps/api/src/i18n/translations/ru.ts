/**
 * Russian Translations
 */

export default {
  // Common messages
  common: {
    success: 'Успешно',
    error: 'Ошибка',
    created: 'Создано',
    updated: 'Обновлено',
    deleted: 'Удалено',
    notFound: 'Не найдено',
    unauthorized: 'Не авторизован',
    forbidden: 'Доступ запрещен',
    serverError: 'Ошибка сервера',
    badRequest: 'Неверный запрос',
    conflict: 'Уже существует',
  },

  // Validation messages
  validation: {
    required: "{field} обязательное поле",
    invalid: "{field} неверный формат",
    tooShort: "{field} слишком короткий (минимум {min} символов)",
    tooLong: "{field} слишком длинный (максимум {max} символов)",
    minValue: "{field} должен быть не менее {min}",
    maxValue: "{field} должен быть не более {max}",
    email: "Неверный формат email",
    phone: "Неверный формат телефона",
    url: "Неверный формат URL",
    unique: "{field} уже существует",
    notMatch: "{field} не совпадает",
    invalidDate: "Неверный формат даты",
    pastDate: "Дата должна быть в прошлом",
    futureDate: "Дата должна быть в будущем",
    invalidChoice: "Неверный выбор",
  },

  // Field names
  fields: {
    // User fields
    first_name: 'Имя',
    last_name: 'Фамилия',
    father_name: 'Отчество',
    email: 'Email',
    phone: 'Телефон',
    password: 'Пароль',
    birth_date: 'Дата рождения',
    gender: 'Пол',
    
    // Driver fields
    driver_type: 'Тип водителя',
    role: 'Роль',
    
    // Address fields
    address_country: 'Страна',
    address_region: 'Регион',
    address_city: 'Город',
    address_settlement_type: 'Тип населенного пункта',
    address_mahalla: 'Махалля',
    address_street: 'Улица',
    
    // Passport fields
    id_card_number: 'Номер ID карты',
    pinfl: 'ПИНФЛ',
    citizenship: 'Гражданство',
    birth_place_country: 'Страна рождения',
    birth_place_region: 'Регион рождения',
    birth_place_city: 'Город рождения',
    issue_date: 'Дата выдачи',
    expiry_date: 'Срок действия',
    
    // License fields
    license_number: 'Номер прав',
    category: 'Категория',
    
    // Emergency contact fields
    phone_number: 'Номер телефона',
    phone_country_code: 'Код страны',
    relationship: 'Родство',
    
    // Vehicle fields
    vehicle_type: 'Тип транспорта',
    body_type: 'Тип кузова',
    make: 'Марка',
    model: 'Модель',
    color: 'Цвет',
    tech_passport_series: 'Серия техпаспорта',
    license_plate: 'Гос номер',
    year: 'Год выпуска',
    fuel_types: 'Тип топлива',
    seating_capacity: 'Количество мест',
    
    // Owner fields
    company_name: 'Название компании',
    company_tax_id: 'ИНН компании',
    owner_first_name: 'Имя владельца',
    owner_last_name: 'Фамилия владельца',
    owner_father_name: 'Отчество владельца',
    owner_pinfl: 'ПИНФЛ владельца',
    
    // Taxi license fields
    license_registry_number: 'Реестровый номер',
    license_sheet_number: 'Номер лицензии',
    license_sheet_valid_from: 'Действителен с',
    license_sheet_valid_until: 'Действителен до',
    self_employment_number: 'Номер самозанятости',
    
    // Photo fields
    photo_face_url: 'Фото лица',
    photo_body_url: 'Фото в полный рост',
  },

  // Authentication messages
  auth: {
    loginSuccess: 'Успешный вход',
    logoutSuccess: 'Выход выполнен',
    invalidCredentials: 'Неверный email или пароль',
    accountNotFound: 'Аккаунт не найден',
    accountDisabled: 'Аккаунт отключен',
    tokenExpired: 'Сессия истекла',
    tokenInvalid: 'Неверный токен',
  },

  // OTP messages
  otp: {
    sent: 'Код отправлен',
    verified: 'Код подтвержден',
    invalid: 'Неверный код',
    expired: 'Код истек',
    maxAttempts: 'Превышено количество попыток',
  },

  // Driver profile messages
  driver: {
    profileUpdated: 'Профиль обновлен',
    profileIncomplete: 'Профиль не заполнен',
    registrationComplete: 'Регистрация завершена',
    passportUpdated: 'Данные паспорта сохранены',
    licenseUpdated: 'Данные прав сохранены',
    vehicleUpdated: 'Данные автомобиля сохранены',
    taxiLicenseUpdated: 'Лицензия такси сохранена',
  },
};

