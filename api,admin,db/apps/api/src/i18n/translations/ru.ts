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
    tooManyRequests: 'Слишком много запросов. Пожалуйста, попробуйте позже',
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
    // T-091 — the user's own promo code / username.
    exactLength: "{field} должен состоять ровно из {length} символов",
    lengthRange: "{field} должен содержать от {min} до {max} символов",
    alphanumeric: "{field} может содержать только латинские буквы и цифры",
    reserved: "{field} недоступен, выберите другой",
    immutable: "{field} выбирается один раз и не может быть изменён",
  },

  // Field names
  // Passenger-offer column names for the "what changed" push (T-065).
  // Deliberately separate from `fields` below — see the note in uz.ts.
  offerFields: {
    from_text: 'Место отправления',
    from_lat: 'Координаты отправления',
    from_lng: 'Координаты отправления',
    from_country_id: 'Страна отправления',
    from_province_id: 'Область отправления',
    from_city_id: 'Город / район отправления',
    from_settlement_id: 'Населённый пункт отправления',
    from_landmark: 'Ориентир отправления',
    to_text: 'Место назначения',
    to_lat: 'Координаты назначения',
    to_lng: 'Координаты назначения',
    to_country_id: 'Страна назначения',
    to_province_id: 'Область назначения',
    to_city_id: 'Город / район назначения',
    to_settlement_id: 'Населённый пункт назначения',
    to_landmark: 'Ориентир назначения',
    start_at: 'Время отправления',
    depart_until: 'Крайнее время отправления',
    arrive_from: 'Время прибытия',
    arrive_until: 'Крайнее время прибытия',
    is_urgent: 'Срочная поездка',
    seats_needed: 'Количество мест',
    max_price_per_seat: 'Цена за место',
    currency: 'Валюта',
    payment_type: 'Способ оплаты',
    payment_cash: 'Наличные',
    payment_card: 'Click, Payme',
    paid_by_friend: 'Оплачивает друг',
    payer_phone: 'Телефон плательщика',
    seat_counts: 'Распределение мест',
    seat_position_any: 'Любое расположение места',
    salon_scope: 'Тип салона',
    vehicle_class: 'Класс автомобиля',
    vehicle_types: 'Типы автомобилей',
    front_seat: 'Переднее место',
    pets: 'Домашние животные',
    large_baggage: 'Крупный багаж',
    woman_in_car: 'Женщина в машине',
    roof_rack_needed: 'Нужен багажник',
    trailer: 'Прицеп',
    road_pickup: 'Посадка в пути',
    road_pickup_note: 'Примечание к посадке в пути',
    special_order: 'Специальный заказ',
    note: 'Примечание',
  },

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
    // T-091 — see the uz file: this is the user's OWN code, not their referrer's.
    own_promo_code: 'Ваш промокод',
    username: 'Имя пользователя',

    // Driver fields
    driver_type: 'Тип водителя',
    role: 'Роль',
    
    // Address fields
    address_country_id: 'Страна',
    address_province_id: 'Регион',
    address_city_district_id: 'Город / Район',
    address_administrative_area_id: 'Административная зона',
    address_settlement_id: 'Населенный пункт',
    address_neighborhood_id: 'Махалля',
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
    category_a: 'Категория A',
    category_b: 'Категория B',
    category_c: 'Категория C',
    category_d: 'Категория D',
    category_be: 'Категория BE',
    category_ce: 'Категория CE',
    category_de: 'Категория DE',
    license_front_url: 'Фото лицевой стороны прав',
    license_back_url: 'Фото обратной стороны прав',
    
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
    // T-041 — `POST /auth/refresh` answered in hard-coded English until now.
    refreshTokenRequired: 'Токен обновления не передан',
    tokenRefreshed: 'Сессия обновлена',
    // T-038 — the auth middleware used to throw these in hard-coded English, so
    // every 401 reached the apps untranslated no matter the Accept-Language.
    noToken: 'Токен авторизации не передан',
    notAuthenticated: 'Вы не вошли в систему',
    insufficientPermissions: 'У вас нет прав на это действие',
    adminTokenInvalid: 'Неверный админ-токен',
  },

  // OTP messages
  otp: {
    sent: 'Код отправлен',
    verified: 'Код подтвержден',
    invalid: 'Неверный код',
    expired: 'Код истек',
    maxAttempts: 'Превышено количество попыток',
    phoneOrUserIdRequired: 'Требуется номер телефона или идентификатор пользователя',
    userNotFoundOrPhoneMissing: 'Пользователь не найден или отсутствует номер телефона',
    invalidChannel: 'Неверный канал. Используйте "sms", "call" или "push"',
    phoneOrUserIdAndCodeRequired: 'Требуется номер телефона или идентификатор пользователя и код',
    invalidOrExpiredCode: 'Неверный или истекший код',
    tooSoon: 'Код только что отправлен. Подождите {seconds} сек., чтобы запросить новый',
    tooManyRequests: 'Слишком много запросов кода. Пожалуйста, попробуйте позже',
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

  // Offer error messages
  offers: {
    notFound: 'Объявление не найдено',
    notAvailable: 'Это объявление недоступно',
    alreadyStarted: 'Это объявление уже началось',
    cannotJoinOwn: 'Вы не можете присоединиться к своему собственному объявлению',
    alreadyJoined: 'Вы уже присоединились к этому объявлению',
    noSeatsAvailable: 'Нет свободных мест',
    onlySeatsAvailable: 'Доступно только {count} мест',
    seatsOutOfRange: 'Количество мест должно быть от 1 до 8',
    offerNotFound: 'Объявление не найдено',
    joinFailed: 'Не удалось присоединиться к объявлению',
    cancelFailed: 'Не удалось отменить',
    confirmFailed: 'Не удалось подтвердить',
    rejectFailed: 'Не удалось отклонить',
    joinRequestNotFound: 'Запрос на присоединение не найден',
    noPermissionConfirm: 'У вас нет разрешения на подтверждение этого запроса',
    noPermissionReject: 'У вас нет разрешения на отклонение этого запроса',
    noPermissionCancel: 'У вас нет разрешения на отмену этого запроса',
    alreadyProcessed: 'Этот запрос уже обработан',
    frontSeatTaken: 'Переднее место уже занято',
    // T-081 — the driver did not price this salon, so it is not for sale.
    salonNotOffered: 'Водитель не предлагает такое бронирование салона',
    cannotCancel: 'Этот запрос нельзя отменить',
    offerNotFoundOrNoPermission: 'Объявление не найдено или у вас нет разрешения',
    vehicleNotFound: 'Транспортное средство не найдено или вам не принадлежит',
    alreadySentRequest: 'Вы уже отправили запрос на это объявление',
    needsAtLeastSeats: 'Пассажиру нужно как минимум {count} мест',
    seatsOutOfRangeDriver: 'Предложенные места должны быть от 1 до 8',
    priceMustBePositive: 'Предложенная цена за место должна быть больше 0',
    driverJoinRequestNotFound: 'Запрос водителя на присоединение не найден',
    noPermissionViewDrivers: 'У вас нет разрешения на просмотр водителей для этого объявления',
    cannotCancelConfirmed: 'Нельзя отменить подтвержденный запрос',
    cannotJoinAfterRejected: 'Вы не можете присоединиться к этому объявлению, так как ваш предыдущий запрос был отклонен',
    cannotEditInStatus:
      'Этот заказ больше нельзя изменить — он отменён или завершён',
    cannotJoinAfterCancelled: 'Вы не можете присоединиться к этому объявлению, так как вы отменили свой предыдущий запрос',
  },

  // Driver License specific messages
  driverLicense: {
    // Validation errors
    licenseNumberRequired: 'Номер прав обязателен',
    issueDateRequired: 'Дата выдачи обязательна',
    licenseNumberInvalid: 'Номер прав неверен',
    issueDateInvalid: 'Дата выдачи неверна',
    categoryDateInvalid: 'Дата категории неверна',
    licenseNumberTooShort: 'Номер прав слишком короткий',
    licenseNumberTooLong: 'Номер прав слишком длинный',
    
    // Field-specific validation
    licenseNumberFormat: 'Формат номера прав неверен (например: AG 1234567)',
    issueDatePast: 'Дата выдачи должна быть в прошлом',
    issueDateFuture: 'Дата выдачи не может быть в будущем',
    categoryDateFuture: 'Дата категории не может быть в будущем',
    
    // Success messages
    licenseCreated: 'Данные прав созданы',
    licenseUpdated: 'Данные прав обновлены',
    licenseSaved: 'Данные прав сохранены',
    
    // Error messages
    licenseNotFound: 'Права не найдены',
    licenseAlreadyExists: 'Права уже существуют',
    licenseUpdateFailed: 'Не удалось обновить данные прав',
    licenseCreateFailed: 'Не удалось создать данные прав',
    licenseDeleteFailed: 'Не удалось удалить данные прав',
    
    // Photo upload errors
    photoUploadFailed: 'Не удалось загрузить фото',
    photoFormatInvalid: 'Формат фото неверен',
    photoSizeTooLarge: 'Размер фото слишком большой',
    photoRequired: 'Фото обязательно',
  },

  // Push notification messages
  push: {
    // Passenger join request (to driver)
    passengerJoinRequestTitle: '🎯 Новый запрос пассажира',
    passengerJoinRequestBody: '{name} хочет присоединиться к вашей поездке из {from} в {to}. Запрашивает {seats} место(а).',
    
    // Join confirmed (to passenger)
    joinConfirmedTitle: '✅ Запрос подтвержден!',
    joinConfirmedBody: 'Поздравляем! Ваша поездка из {from} в {to} подтверждена. Свяжитесь с водителем.',
    
    // Join rejected (to passenger)
    joinRejectedTitle: '❌ Запрос отклонен',
    joinRejectedBody: 'К сожалению, ваш запрос на поездку из {from} в {to} был отклонен. Проверьте другие предложения.',
    
    // Passenger cancelled (to driver)
    passengerCancelledTitle: '⚠️ Пассажир отменил',
    passengerCancelledBody: 'Пассажир отменил вашу поездку из {from} в {to}. {status} запрос был отменен.',
    
    // Driver join request (to passenger)
    driverJoinRequestTitle: '🚗 Новое предложение водителя',
    driverJoinRequestBody: '{name} хочет отвезти вас из {from} в {to}. Цена: {price} {currency}',
    
    // Driver request confirmed (to driver)
    driverRequestConfirmedTitle: '✅ Предложение принято!',
    driverRequestConfirmedBody: 'Отлично! Ваша поездка из {from} в {to} подтверждена. Свяжитесь с пассажиром.',
    
    // Driver request rejected (to driver)
    driverRequestRejectedTitle: '❌ Предложение отклонено',
    driverRequestRejectedBody: 'К сожалению, ваше предложение на поездку из {from} в {to} было отклонено. Проверьте другие предложения.',
    
    // Driver request cancelled (to passenger)
    // Another driver was chosen (to every driver who was still waiting)
    driverNotChosenTitle: 'Выбран другой водитель',
    driverNotChosenBody: 'На заказ из {from} в {to} выбран другой водитель. Посмотрите другие заказы.',

    driverRequestCancelledTitle: '⚠️ Водитель отменил',
    driverRequestCancelledBody: 'Водитель отменил вашу поездку из {from} в {to}. Найдите других водителей.',
    
    // Offer cancelled by driver (to passenger)
    offerCancelledByDriverTitle: '❌ Поездка отменена',
    offerCancelledByDriverBody: 'К сожалению, ваша поездка из {from} в {to} была отменена водителем. Найдите другие предложения.',
    
    // Offer cancelled by passenger (to driver)
    offerCancelledByPassengerTitle: '❌ Поездка отменена',
    offerCancelledByPassengerBody: 'Пассажир отменил поездку из {from} в {to}. Проверьте другие предложения.',

    // Passenger edited a ride request a driver is committed to or bidding on (T-065)
    passengerOfferUpdatedTitle: '✏️ Заявка на поездку изменена',
    passengerOfferUpdatedBody: 'В заявке из {from} в {to} изменилось: {changed}. Проверьте новые условия.',
    
    // Driver arrival notifications (to passenger)
    driver10MinAwayTitle: '⏰ Водитель приближается',
    driver10MinAwayBody: '{driverName} прибудет в течение {minutes} минут. Пожалуйста, будьте готовы!',
    driverArrivedTitle: '✅ Водитель прибыл',
    driverArrivedBody: '{driverName} ждет вас в {location}. Пожалуйста, выходите!',
  },
};

