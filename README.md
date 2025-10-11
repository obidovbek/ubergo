- Pul masalalari
    
    $100 oldim 07.10.2025 
    
- Texnik Topshiriq
    - Umumiy Info
        
        # TEXNIK TOPSHIRIQ (TT): “UberGo” (MVP → v1.0)
        
        ## 0. Maqsad va qamrov
        
        - **Maqsad:** Yo‘lovchi–haydovchi platformasi (shahar ichi/shaharlararo), buyurtma/band qilish, eksklyuziv kelishuv, trip hayotiy sikli, to‘lovlar, reyting va admin boshqaruv.
        - **Qamrov:** Excel fayl bo‘yicha quyidagilar to‘liq qamrab olinadi
            - **UserApp (~35 band)**, **DriverApp (~40)**, **Server (~43)**, **MikroServis (~12)**, **Marketing (~11)**, **Okna/UI (~194 ekran)**, **HamkorApp (bori bilan)**, **BiznesApp (backlog)**, **Xavfsizlik/Blacklist**, **Xabarlar**.
        - **MVP natija:** 1-iteratsiyada ishlaydigan asosiy oqimlar (Auth & Profil, Driver login/panel, Location & Qidiruv, Standart buyurtma, Trip sikli + reyting, To‘lov (naqd/plastik), Adminning bazaviy funksiyalari, Monitoring/QA/Prod deploy).
        
        ## 1. Texnologiyalar va arxitektura (asos)
        
        - **Backend:** Node.js (NestJS), PostgreSQL, Redis (sessiya/kesh), REST API (+keyin GraphQL ixtiyoriy).
        - **Mobil:** React Native (UserApp/DriverApp), OTA update (Expo EAS yoki CodePush).
        - **Admin panel:** React + RBAC.
        - **Mikroxizmatlar:** OTP/SMS (Eskiz fallback), SIP/Asterisk (IVR/qo‘ng‘iroq), Bildirishnomalar, Payment-gateway, ETL/Analitika, Arxiv servisi.
        - **Integratsiya:** Eskiz SMS, SIP/Asterisk, botlar (Telegram/Viber/WhatsApp), SSO (Google/Apple/Facebook/Microsoft), **OneID (keyingi bosqich)**, xarita/geokoding/ETA provayderi.
        - **Monitoring & QA:** Sentry, Prometheus/Grafana, Graylog/ELK; Jest/E2E; Postman suit.
        - **DevOps:** Git monorepo, CI/CD (build–test–deploy), env: dev/stage/prod, auto-rollback, zaxira/DR.
        
        ---
        
        # ISHLAB CHIQISH KETMA-KETLIGI (SPRINTLAR)
        
        > Har bir sprint uchun: deliverables, API/DB o‘zgarishlari, qabul mezonlari (DoD), testlar keltiriladi. Excel “Opesaniye”dagi mos bandlar har sprint ostida kapsulalanadi.
        > 
        
        ## Sprint 0. Foundation & Infra
        
        **Vazifalar:**
        
        - Monorepo, servis skeleti, umumiy **RBAC**, **audit trail**, **feature flags**.
        - **Auth infrasi:** JWT/refresh, rate-limit, IP/device fingerprint.
        - **OTP/SMS** servisi: Eskiz bilan integratsiya, retry va fallback siyosati.
        - **Qo‘ng‘iroq registratsiyasi:** SIP/Asterisk IVR pipeline (kiruvchi/chiqish).
        - **Botlar:** Telegram/Viber/WhatsApp orqali ro‘yxatdan o‘tish bosqichi.
        - **Data siyosati:** PII shifrlash, arxiv DB konturlari, backup jadvali.
        
        **DoD:**
        
        - CI/CD yoqilgan, env’lar ishlayapti; SMS/IVR dev/stage’da sinovdan o‘tgan.
        - Audit loglar oqadi; basic metrics dashboard mavjud.
    - Sprint 1 — Auth & Profil (UserApp → Driver login)
        - 1.1 — Monorepo, DevInfra, CI/CD skeleton
            
            **Monorepo, Docker/Compose, Nginx, CI/CD skeleton** bo‘limi to‘liq va tushunarli tarzda. Maqsad: butun loyihani bitta buyruq bilan ishga tushirish, kod sifati nazorati (lint/type/test), avtomatik build va deployga tayyorlash.
            
            ---
            
            # 1.1 — Monorepo, Docker/Compose, Nginx, CI/CD (to‘liq tushuntirish)
            
            ## Nima hosil bo‘ladi?
            
            - **Monorepo tuzilmasi**: API, mobil ilovalar (RN), admin panel, infra fayllari bitta repoda.
            - **Docker Compose**: Postgres, Redis, API (NestJS), Nginx reverse-proxy konteynerlari.
            - **Nginx**: tashqi trafikni `/api` ga yo‘naltiradi, gzip va limitlar bilan.
            - **CI/CD skeleton**: lint → typecheck → test → build → docker build/push ish ketma-ketligi.
            - **Healthcheck & logs**: API sog‘ligi va loglar standartga keltirilgan.
            
            ---
            
            ## 1) Monorepo tuzilmasi
            
            ```
            repo-root/
              apps/
                api/                # NestJS (Node.js + TypeScript + Sequelize)
                user-app/           # React Native (User)
                driver-app/         # React Native (Driver)
                admin/              # React  - keyinroq ishlatiladi
              infra/
                nginx/
                  nginx.conf
                docker/
                  api.Dockerfile
                compose/
                  docker-compose.yml
              .github/workflows/
                ci.yml
              package.json          # (agar pnpm/yarn workspaces ishlatsangiz)
              tsconfig.base.json
              .eslintrc.cjs
              .prettierrc
              .editorconfig
              .env.example
              README.md
            
            ```
            
            **Tavsiyalar:**
            
            - **Workspaces** (yarn/pnpm) ishlatish: umumiy dev dependency’lar bir joyda turadi.
            - Husky + commitlint: noto‘g‘ri commitlarni to‘xtatadi, stil bir xil.
        - 1.2 — DB modeli (PostgreSQL + Sequelize)
            
            ## Asosiy jadvallar va maqsadi
            
            1. **users** — foydalanuvchi profili (asosiy entitet)
            2. **user_identities** — SSO va tashqi identifikatorlar (Google/Apple/Facebook/MS/Telegram/OneID)
            3. **phones** — primary/trusted/extra telefonlar (5 tagacha)
            4. **otp_codes** — OTP SMS/qo‘ng‘iroq kodlari (muddati va urinishlar)
            5. **deletion_requests** — akkauntni 72 soatda o‘chirish uchun so‘rovlar
            6. **audit_logs** — kim, qachon, qanday harakat qilgan (izini qoldirish)
            
            > Postgres tavsiyalar: uuid PK, jsonb meta maydonlar, citext e-mail uchun, timestamptz vaqtlar.
            > 
            
            ---
            
            ## ER bog‘lanishlar (soddalashtirib)
            
            - `users (1) — (N) phones` (har userda bir nechta raqam)
            - `users (1) — (N) user_identities` (SSO provayderlari)
            - `users (1) — (N) deletion_requests`
            - `users (1) — (N) audit_logs` (nullable bo‘lishi mumkin — ba’zi loglar service-level)
            
            ---
            
            ## Jadval dizayni (ustunlar)
            
            ### users
            
            - `id UUID PK`
            - `phone_e164 citext UNIQUE NULLABLE` (ba’zan SSO-only bo‘lishi mumkin)
            - `email citext UNIQUE NULLABLE`
            - `password_hash TEXT NULLABLE` (hozir OTP/SSO uchun shart emas, lekin kelajak uchun)
            - `is_verified BOOLEAN DEFAULT false`
            - `status ENUM('active','blocked','pending_delete') DEFAULT 'active'`
            - `display_name TEXT`
            - `country_code TEXT` (UZ, RU, …)
            - `role ENUM('user','driver','admin') DEFAULT 'user'`
            - `created_at timestamptz`, `updated_at timestamptz`
            
            **Indekslar:**
            
            - `UNIQUE (phone_e164)`, `UNIQUE (email)`
            - `INDEX (status)`, `INDEX (role)`
            
            ### user_identities
            
            - `id UUID PK`, `user_id UUID FK -> users.id`
            - `provider ENUM('google','apple','facebook','microsoft','telegram','oneid')`
            - `provider_uid TEXT` (Tizimdagi noyob UID)
            - `meta JSONB` (provider’dan kelgan foydali maydonlar)
            - `created_at timestamptz`
            
            **Indekslar:**
            
            - **UNIQUE**(`provider`,`provider_uid`)
            - `INDEX (user_id)`
            
            ### phones
            
            - `id UUID PK`, `user_id UUID FK`
            - `label ENUM('primary','trusted','extra')`
            - `e164 citext` (telefon raqami `+998...` format)
            - `is_verified BOOLEAN DEFAULT false`
            - `created_at timestamptz`
            
            **Cheklovlar:**
            
            - Har user uchun **max 5 ta** yozuv (application-level tekshirish)
            - **Unique per user**: `(user_id, e164)` UNIQUE
            
            ### otp_codes
            
            - `id UUID PK`
            - `channel ENUM('sms','call')`
            - `target citext` (qaysi raqamga yuborildi)
            - `code TEXT`
            - `expires_at timestamptz`
            - `attempts INTEGER DEFAULT 0`
            - `meta JSONB` (masalan, client_id, device, ip)
            - `created_at timestamptz`
            
            **Indeks:**
            
            - `(target, created_at)` → tezkor qidiruv uchun
            
            ### deletion_requests
            
            - `id UUID PK`, `user_id UUID FK`
            - `requested_at timestamptz`
            - `deadline_at timestamptz` (72 soat)
            - `status ENUM('pending','done','cancelled') DEFAULT 'pending'`
            
            **Indekslar:**
            
            - `(user_id)`
            - `(status, deadline_at)` (cron ishlarini optimallashtirish uchun)
            
            ### audit_logs
            
            - `id UUID PK`
            - `user_id UUID NULLABLE`
            - `action TEXT` (masalan, `auth.otp.send`, `auth.otp.verify`, `user.update`)
            - `ip TEXT`, `ua TEXT`
            - `payload JSONB`
            - `created_at timestamptz`
            
            **Indekslar:**
            
            - `(user_id, created_at)`
            - `(action, created_at)`
            
            ## Migratsiyalar (namuna)
            
            > Papkalar: apps/api/src/database/migrations (yoki sequelize-cli default)
            > 
            
            **users (migration qisqa namunasi):**
            
            ```jsx
            // YYYYMMDDHHmmss-create-users.js
            module.exports = {
              up: async (queryInterface, Sequelize) => {
                await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
                await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "citext";');
            
                await queryInterface.createTable('users', {
                  id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('uuid_generate_v4()') },
                  phone_e164: { type: 'CITEXT', allowNull: true, unique: true },
                  email: { type: 'CITEXT', allowNull: true, unique: true },
                  password_hash: { type: Sequelize.TEXT, allowNull: true },
                  is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
                  status: { type: Sequelize.ENUM('active','blocked','pending_delete'), defaultValue: 'active' },
                  display_name: { type: Sequelize.TEXT },
                  country_code: { type: Sequelize.TEXT },
                  role: { type: Sequelize.ENUM('user','driver','admin'), defaultValue: 'user' },
                  created_at: { type: 'TIMESTAMPTZ', defaultValue: Sequelize.fn('NOW') },
                  updated_at: { type: 'TIMESTAMPTZ', defaultValue: Sequelize.fn('NOW') },
                });
                await queryInterface.addIndex('users', ['status']);
                await queryInterface.addIndex('users', ['role']);
              },
            
              down: async (queryInterface) => {
                await queryInterface.dropTable('users');
                await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
                await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
              }
            };
            
            ```
            
            **user_identities (UNIQUE provider+provider_uid):**
            
            ```jsx
            await queryInterface.createTable('user_identities', {
              id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('uuid_generate_v4()') },
              user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
              provider: { type: Sequelize.ENUM('google','apple','facebook','microsoft','telegram','oneid'), allowNull: false },
              provider_uid: { type: Sequelize.TEXT, allowNull: false },
              meta: { type: Sequelize.JSONB, defaultValue: {} },
              created_at: { type: 'TIMESTAMPTZ', defaultValue: Sequelize.fn('NOW') },
            });
            await queryInterface.addConstraint('user_identities', {
              fields: ['provider','provider_uid'],
              type: 'unique',
              name: 'uniq_provider_uid'
            });
            await queryInterface.addIndex('user_identities', ['user_id']);
            
            ```
            
            **phones (user-scope’d unique):**
            
            ```jsx
            await queryInterface.createTable('phones', {
              id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('uuid_generate_v4()') },
              user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
              label: { type: Sequelize.ENUM('primary','trusted','extra'), allowNull: false, defaultValue: 'extra' },
              e164: { type: 'CITEXT', allowNull: false },
              is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
              created_at: { type: 'TIMESTAMPTZ', defaultValue: Sequelize.fn('NOW') },
            });
            await queryInterface.addConstraint('phones', {
              fields: ['user_id','e164'],
              type: 'unique',
              name: 'uniq_user_phone'
            });
            await queryInterface.addIndex('phones', ['user_id']);
            
            ```
            
            **otp_codes:**
            
            ```jsx
            await queryInterface.createTable('otp_codes', {
              id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('uuid_generate_v4()') },
              channel: { type: Sequelize.ENUM('sms','call'), allowNull: false },
              target: { type: 'CITEXT', allowNull: false }, // phone
              code: { type: Sequelize.TEXT, allowNull: false },
              expires_at: { type: 'TIMESTAMPTZ', allowNull: false },
              attempts: { type: Sequelize.INTEGER, defaultValue: 0 },
              meta: { type: Sequelize.JSONB, defaultValue: {} },
              created_at: { type: 'TIMESTAMPTZ', defaultValue: Sequelize.fn('NOW') },
            });
            await queryInterface.addIndex('otp_codes', ['target','created_at']);
            
            ```
            
            **deletion_requests:**
            
            ```jsx
            await queryInterface.createTable('deletion_requests', {
              id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('uuid_generate_v4()') },
              user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
              requested_at: { type: 'TIMESTAMPTZ', defaultValue: Sequelize.fn('NOW') },
              deadline_at: { type: 'TIMESTAMPTZ', allowNull: false }, // now + 72h
              status: { type: Sequelize.ENUM('pending','done','cancelled'), defaultValue: 'pending' },
            });
            await queryInterface.addIndex('deletion_requests', ['user_id']);
            await queryInterface.addIndex('deletion_requests', ['status','deadline_at']);
            
            ```
            
            **audit_logs:**
            
            ```jsx
            await queryInterface.createTable('audit_logs', {
              id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('uuid_generate_v4()') },
              user_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
              action: { type: Sequelize.TEXT, allowNull: false },
              ip: { type: Sequelize.TEXT },
              ua: { type: Sequelize.TEXT },
              payload: { type: Sequelize.JSONB, defaultValue: {} },
              created_at: { type: 'TIMESTAMPTZ', defaultValue: Sequelize.fn('NOW') },
            });
            await queryInterface.addIndex('audit_logs', ['user_id','created_at']);
            await queryInterface.addIndex('audit_logs', ['action','created_at']);
            
            ```
            
            ---
            
            ## Sequelize Model & Assotsiatsiyalar (qisqa)
            
            ```tsx
            // user.model.ts
            User.hasMany(Phone, { foreignKey: 'user_id', as: 'phones' });
            User.hasMany(UserIdentity, { foreignKey: 'user_id', as: 'identities' });
            User.hasMany(DeletionRequest, { foreignKey: 'user_id', as: 'deletionRequests' });
            User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
            
            // phone.model.ts
            Phone.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
            
            // identity.model.ts
            UserIdentity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
            
            ```
            
            ---
            
            ## Ish oqimlari (biznes-jarayon nuqtai nazaridan)
            
            ### OTP yuborish/tekshirish
            
            1. `/auth/otp/send` — `otp_codes` ga yozuv qo‘shiladi (expires_at), Eskiz’ga jo‘natiladi.
            2. `/auth/otp/verify` — topiladi → muddat/attempt tekshiradi → foydalanuvchi yo‘q bo‘lsa `users` ga yaratiladi → `is_verified=true`.
            
            **Anti-abuse:** `attempts` (++), rate-limit (IP/phone), audit_logs’ga yozish.
            
            ### SSO login
            
            - `user_identities(provider, provider_uid)` bo‘yicha foydalanuvchi topiladi.
            - Yo‘q bo‘lsa `users` yaratiladi, identity bog‘lanadi.
            
            ### Multi-phone
            
            - `POST /users/me/phones` → OTP verify bo‘lsa `is_verified=true`.
            - `(user_id, e164)` unique; 5 dona limit (kodda tekshir).
            
            ### Delete-72h
            
            - `POST deletion_requests` → `deadline_at = now + 72h`
            - Cron/worker: deadline yetganda `status=done` → user `status=pending_delete` → arxiv servisiga ko‘chirish (keyingi sprintlarda to‘liq).
            
            ### Audit log
            
            - Har muhim action (otp_send, otp_verify, social_link, update_profile, create_deletion_request) `audit_logs` ga yoziladi (user_id bo‘lsa ulab qo‘yiladi).
            
            ---
            
            ## Naming, cheklovlar, sifat
            
            - **Naming:** jadval nomlari `snake_case` (Sequelize `underscored:true`), timestamplar `created_at/updated_at`.
            - **Enumlar:** `Sequelize.ENUM` — down’da **enum type** ni drop qilishni unutmang.
            - **Indekslar:** qidiriladigan/kartochkada ko‘p ishlatiladigan maydonlarga.
            - **Validatsiya:** telefon — E.164; e-mail — RFC (validator kutubxonasi).
            - **PII:** `email/phone` uchun `citext` → case-insensitive qidiruv; loglarda masking.
            
            ---
            
            ## Buyruqlar
            
            ```bash
            # migratsiyalar
            npx sequelize-cli db:migrate
            # qaytarish
            npx sequelize-cli db:migrate:undo
            # seed (ixtiyoriy)
            npx sequelize-cli db:seed:all
            
            ```
            
            ---
            
            ## Testlash (1.2 doirasida)
            
            - **Migration test**: bo‘sh DB’da `db:migrate` → success.
            - **Assotsiatsiya test**: `User.create` → `Phone.create` (FK ishlaydi), `UserIdentity.create` unique constraint ishlashi.
            - **OTP expiry**: muddati o‘tgan kodni tekshirish test-case.
            - **Delete-72h**: `deadline_at` < `now()` bo‘lsa worker topadi.
            
            ---
            
            ## Definition of Done (1.2)
            
            - Barcha jadvallar **migratsiya orqali** yaratiladi; **down** rollback ishlaydi.
            - **Indeks/UNIQUE** cheklovlar joyida.
            - **Assotsiatsiyalar** (User↔Phones/Identities/DeletionRequests/AuditLogs) ishlaydi.
            - **Seeding** (ixtiyoriy) — devda test uchun minimal user.
            - **Hujjat**: ER diagram (oddiy sxema), maydonlar tavsifi, cheklovlar ro‘yxati.
        - 1.3 — Auth API (to‘liq tushuntirish)
            
            ## Nima chiqadi?
            
            - **OTP (SMS)**: telefon raqami bilan ro‘yxatdan o‘tish/kirish.
            - **IVR (Call fallback)**: SMS kelmasa avtomatik qo‘ng‘iroq orqali kod aytib berish.
            - **SSO (Google/Apple, keyin Facebook/MS)**: bir tugma bilan kirish.
            - **Sessiya**: `access token` (15 daqiqa) + `refresh token` (7–30 kun), **refresh rotation** va **logout**.
            - **Anti-abuse**: rate-limit, urinishlar limiti, throttle, audit log.
            - **Akkountlarni bog‘lash**: bir user’da bir nechta SSO/telefon bo‘lishi mumkin.
            
            ---
            
            ## Endpointlar (oddiy ro‘yxat)
            
            - **OTP oqimi**
                - `POST /auth/otp/send` — OTP yuborish (SMS; kerak bo‘lsa `channel=call` IVR)
                - `POST /auth/otp/verify` — kiritilgan kodni tekshirish → tokenlar (access/refresh)
            - **SSO oqimi**
                - `POST /auth/social/google` (yoki `/apple`) — provider tokenini tekshir, user yarat/yoki top
            - **Sessiya**
                - `GET /auth/me` — hozirgi user ma’lumoti
                - `POST /auth/refresh` — yangi access/refresh chiqarish (rotation)
                - `POST /auth/logout` — refresh’ni bekor qilish (blacklist/rotate)
            - **(ixtiyoriy) Parol bilan kirish** (keyinroq kerak bo‘lsa):
                - `POST /auth/login`, `POST /auth/register` (email+password)
            
            > Barcha sessiya talab qiladigan endpointlar Authorization: Bearer <access> bilan.
            > 
            
            ---
            
            ## Ish oqimlari (oddiy “blok-sxema”)
            
            ### A) SMS OTP
            
            ```
            /auth/otp/send  --> OTP yozilishi (otp_codes), Eskiz SMS --> OK
            /auth/otp/verify --> kod tekshirildi?
               ha: user bor? yo'q bo'lsa yarat --> JWT(access,refresh) qaytar
               yo'q: attempts++ ; limitga yetsa vaqtincha blok
            
            ```
            
            ### B) IVR (Call) fallback
            
            ```
            /auth/otp/send?channel=call --> Asterisk IVR qo'ng'iroq qiladi (kodni aytadi)
            verify bosqichi SMS bilan bir xil
            
            ```
            
            ### C) SSO (Google/Apple)
            
            ```
            /auth/social/google {id_token} --> Google bilan tekshir --> (provider, uid)
               user_identities da bor? bor: user'ni ol --> JWT qaytar
               yo'q: users da yarat --> identity ulash --> JWT qaytar
            
            ```
            
            ### D) Sessiya
            
            ```
            /auth/refresh {refresh} --> yangi access+refresh (eskisini bekor qilamiz/rotate)
            /auth/logout --> refreshni blacklist yoki revoke
            
            ```
            
            ---
            
            ## Ma’lumotlar bazasi (1.2 bilan bog‘liq)
            
            - `users`: foydalanuvchi profili (role/status/verif.)
            - `user_identities`: SSO bog‘lamalari (`provider`, `provider_uid`)
            - `phones`: qo‘shimcha raqamlar
            - `otp_codes`: yuborilgan kodlar (muddati/attempts)
            - `audit_logs`: harakatlar izi
            
            ---
            
            ## Validatsiya va cheklovlar
            
            - **Telefon**: E.164 format (`+998...`).
            - **OTP**: 4–6 raqamli; **muddati** 2–5 daqiqa; **attempts ≤ 5**.
            - **Rate-limit**:
                - `/auth/otp/send`: masalan, *1 raqamga 60s ichida 1 marta*, *soatiga 5 marta*.
                - `/auth/otp/verify`: *min 1s delay* (timing attack’ni yumshatish).
            - **SSO**: `provider+provider_uid` **unique**, emailni tekshirish (agar provider bergan bo‘lsa).
            - **JWT**:
                - `access` — 15 daqiqa
                - `refresh` — 7–30 kun (env)
                - **Rotation**: refresh ishlatilganda eski refresh **amaldan chiqariladi**, yangisi beriladi.
            
            ---
            
            ## Xavfsizlik (muhim nuqtalar)
            
            - **Brute force guard**: attempts va rate-limit bilan.
            - **IP/device validation**: OTP yuborishda IP/Device ko‘rsatkichlarini `meta`ga yozish.
            - **Loglarda PII masking**: telefonlar `+998**…` ko‘rinishida.
            - **HTTPS (prod)**: Nginx’da TLS, HSTS.
            - **Secrets**: Eskiz/API kalitlari faqat env/CI secrets’da.
            
            ---
            
            ## Namuna — Request/Response (oddiy misollar)
            
            ### `POST /auth/otp/send`
            
            **Body:**
            
            ```json
            { "phone": "+998901234567", "channel": "sms" }
            
            ```
            
            **200:**
            
            ```json
            { "sent": true, "channel": "sms", "expiresInSec": 120 }
            
            ```
            
            **429 (rate-limit):**
            
            ```json
            { "error": "Too many requests, try later" }
            
            ```
            
            ### `POST /auth/otp/verify`
            
            **Body:**
            
            ```json
            { "phone": "+998901234567", "code": "123456" }
            
            ```
            
            **200:**
            
            ```json
            {
              "access": "<jwt-access>",
              "refresh": "<jwt-refresh>",
              "user": { "id": "uuid", "phone_e164": "+998901234567", "is_verified": true, "role": "user" }
            }
            
            ```
            
            **400 (xato kod):** `{ "error": "Invalid or expired code" }`
            
            ### `POST /auth/social/google`
            
            **Body:**
            
            ```json
            { "id_token": "<google-id-token>" }
            
            ```
            
            **200:**
            
            ```json
            {
              "access": "<jwt-access>",
              "refresh": "<jwt-refresh>",
              "user": { "id": "uuid", "email": "user@gmail.com", "role": "user" }
            }
            
            ```
            
            ### `POST /auth/refresh`
            
            **Body:**
            
            ```json
            { "refresh": "<jwt-refresh>" }
            
            ```
            
            **200:**
            
            ```json
            { "access": "<new-access>", "refresh": "<new-refresh>" }
            
            ```
            
            ### `GET /auth/me` (Header: `Authorization: Bearer <access>`)
            
            **200:**
            
            ```json
            { "id": "uuid", "phone_e164": "+998901234567", "display_name": "Ali", "role": "user" }
            
            ```
            
            ---
            
            ## Eskiz (SMS) va Asterisk (IVR) integratsiyasi — qisqa
            
            - **Eskiz**: OTP yuborishda `POST` qilib, javobni log’ga yozamiz; xatoliklarda retry.
            - **IVR**: `channel=call` bo‘lsa, Asterisk API orqali chiqish qo‘ng‘irog‘i qilib, `TTS` yoki oldindan yozilgan audio bilan kodni aytib beradi. `otp_codes` ga aynan shu kod yozilgan bo‘ladi — verify bir xil.
            
            ---
            
            ## Audit loglar
            
            Har muhim harakat `audit_logs` ga yoziladi:
            
            - `auth.otp.send`, `auth.otp.verify.success|fail`
            - `auth.social.google.success|fail`
            - `auth.refresh.success|fail`, `auth.logout`
            - `user.link.phone`, `user.unlink.phone`
            
            **Maydonlar**: `user_id (nullable)`, `action`, `ip`, `ua`, `payload(jsonb)`, `created_at`.
            
            ---
            
            ## Monitoring & metrikalar
            
            - OTP yuborish muvaffaqiyati (%), o‘rtacha kechikish (ms).
            - Verify success/fail nisbati, attempts o‘rtacha soni.
            - SSO success/fail, token refresh soni.
            - 4xx/5xx ko‘rsatkichlari, p95/p99 javob vaqtlari.
            
            ---
            
            ## Qo‘shimcha funksiya: Akkount bog‘lash (ixtiyoriy, lekin foydali)
            
            - **Telefon + SSO** bog‘lash: `/users/me/link/google`, `/users/me/link/phone`
            - Agar SSO foydalanuvchisi keyin telefon qo‘shsa, yoki aksincha.
            - `user_identities` va `phones` jadvallarida duplication tekshiruvlar.
            
            ---
            
            ## Edge-caselar (ko‘p uchraydigan)
            
            - **OTP kech keladi**: foydalanuvchi 2 marta so‘raydi → yangisini oldingisini bekor qilish shart emas, tekshirishda oxirgisini ko‘rish kifoya.
            - **Bir raqam — bir nechta akkauntga ulangan**: qoidaga qarab blok yoki merge flow (MVP’da blok tavsiya).
            - **SSO email verifikatsiya qilinmagan**: emailga ishonmaslik, faqat provider_uid ga tayanish.
            - **Refresh o‘g‘irlandi**: rotation bo‘lgani uchun keyingi chaqiriqda eski refresh ishlamaydi; “suspected theft” bayrog‘i + logout-all.
            
            ---
            
            ## Test plani (1.3 doirasida)
            
            - **OTP**: to‘g‘ri kod, noto‘g‘ri kod, muddati o‘tgan kod, attempts>limit, rate-limit.
            - **IVR**: `channel=call` flow (dev stub), verify ishlashi.
            - **SSO**: Google token to‘g‘ri/noto‘g‘ri; yangi user yaratilishi; identity unique constraint.
            - **JWT**: access muddati tugashi, refresh bilan yangilash, logout.
            - **Security**: PII masking loglar, CORS/Helmet, 429 holatlari.
            - **Load**: `/auth/otp/send` SpAM sinovi (rate-limit ishlashi).
            
            ---
            
            ## Definition of Done (1.3)
            
            - `POST /auth/otp/send` va `POST /auth/otp/verify` **to‘liq ishlaydi** (SMS/IVR).
            - **SSO (kamida Google, Apple)** ishlaydi, `user_identities` da unique constraint.
            - **JWT sessiya**: access/refresh, rotation, logout.
            - **Anti-abuse**: rate-limit, attempts limiter, audit logs.
            - **Swagger** (`/api/docs`) yoki Postman collection yangilangan.
            - **Monitor**: OTP/SSO muvaffaqiyat metrikalari ko‘rinadi.
            
            ---
            
            ### Qisqa “ish tartibi” (dev ko‘zdan)
            
            1. `/auth/otp/send` ni yozish (Eskiz integratsiya + rate-limit)
            2. `/auth/otp/verify` (user create/link + JWT)
            3. `/auth/social/google` (`id_token` tekshir, identity yarat)
            4. `/auth/refresh` (rotation), `/auth/logout`
            5. Audit log + monitoring metrikalari
            6. Testlar: unit/integration/postman (negative cases bilan)
        - 1.4 — Profil CRUD, Multi-phone, Trusted contact, Delete-72h
            
            ## Nima chiqadi?
            
            - Foydalanuvchi **profilini ko‘rish va tahrirlash** (ism, mamlakat).
            - **Bir akkauntga 5 tagacha telefon raqami** qo‘shish (OTP bilan tasdiqlanadi).
            - **Trusted contact** (ishonchli aloqa) flagi.
            - **Akkountni o‘chirish** uchun ariza: 72 soat “pending”, so‘ng arxivga ko‘chiriladi.
            - **Audit log** va **rate-limit** himoyasi.
            - Frontend (RN) uchun **oddiy, tushunarli** oqimlar.
            
            ---
            
            ## End-pointlar (REST)
            
            > Barchasi Authorization: Bearer <access> bilan.
            > 
            
            ### Profil
            
            - `GET /users/me` — profil va bog‘liq ma’lumotlar (phones, identities)
            - `PATCH /users/me` — `display_name?`, `country_code?`
            
            ### Telefonlar (Multi-phone)
            
            - `GET /users/me/phones`
            - `POST /users/me/phones` — `{ phone: "+998901234567" }` → OTP yuboriladi
            - `POST /users/me/phones/verify` — `{ phone, code }` → `is_verified=true`
            - `PATCH /users/me/phones/:id` — `{ label: "trusted" | "extra" | "primary" }`
            - `DELETE /users/me/phones/:id`
            
            ### Akkount o‘chirish (72 soat)
            
            - `POST /users/me/deletion-requests` — 72h taymerni boshlash
            - `DELETE /users/me/deletion-requests/:id/cancel` — bekor qilish
            
            > Cron/worker (background): deadline yetganda status=done, user pending_delete → archived (arxiv servisi).
            > 
            
            ---
            
            ## Oqimlar (odam tilida)
            
            ### A) Profilni ko‘rish/tahrirlash
            
            1. **Ko‘rish**: `GET /users/me` UI’da ism, mamlakat, raqamlar va SSO bog‘lamalari chiqadi.
            2. **Tahrir**: `PATCH /users/me` orqali `display_name`, `country_code` yangilanadi.
            3. **Audit**: `user.update` yozuvi `audit_logs` ga tushadi.
            
            ### B) Raqam qo‘shish (5 tagacha)
            
            1. **Qo‘shish**: `POST /users/me/phones` → raqam E.164 formatda qabul qilinadi.
            2. API **OTP yuboradi** (Eskiz) va `phones` jadvalida **tasdiqlanmagan** yozuv yaratadi (`is_verified=false`).
            3. **Tasdiqlash**: `POST /users/me/phones/verify` — to‘g‘ri kod → `is_verified=true`.
            4. **Label**: `PATCH /users/me/phones/:id` bilan **`trusted`** (ishonchli aloqa) yoki **`primary`** (asosiy) qilinadi.
            5. **Cheklovlar**:
                - Har user uchun **≤ 5** raqam.
                - `(user_id, e164)` **unique** (bitta raqam ikki marta bo‘lmaydi).
                - `primary` faqat bitta bo‘lishi kerak (API’da nazorat).
            6. **O‘chirish**: `DELETE /users/me/phones/:id` — `primary` bo‘lsa avval `primary` boshqasiga ko‘chiriladi yoki bloklanadi.
            7. **Audit**: `user.phone.add|verify|update|remove`.
            
            ### C) Trusted contact (ishonchli aloqa)
            
            - `label="trusted"` qo‘yilgan raqamlar “favqulodda aloqa” uchun ishlatilishi mumkin (kelajakda).
            - UI’da yorliq bilan alohida ajratib ko‘rsatiladi.
            - Bitta userda **bir nechta trusted** bo‘lishi mumkin (odatda 1–2 tavsiya).
            
            ### D) Akkountni o‘chirish (72 soat)
            
            1. **So‘rov**: `POST /users/me/deletion-requests` → `requested_at=now`, `deadline_at=now+72h`, `status=pending`.
            2. UI’da **“Akkount 72 soatdan keyin o‘chiriladi”** deb ko‘rsatiladi; qayta kirganda ham shu banner turadi.
            3. **Bekor qilish**: `DELETE /users/me/deletion-requests/:id/cancel` → `status=cancelled`.
            4. **Deadline yetganda**: cron/worker topadi → `status=done`, user `status='pending_delete'` → **arxiv servisi**ga ko‘chirish (PII siyosatiga binoan).
            5. **Audit**: `user.delete.request|cancel|finalize`.
            
            ---
            
            ## Validasiyalar va cheklovlar
            
            - **`display_name`**: 1–64 belgidan oshmasin; emoji/noqonuniy belgilar filtrlanadi.
            - **`country_code`**: ISO-2 (UZ, RU, GB, …) — mavjud ro‘yxatga tekshirish.
            - **Telefon**: E.164 format (`+998…`), serverda normalize qilinadi.
            - **OTP**: 2–5 daqiqa amal qiladi, `attempts ≤ 5`, rate-limit (raqam, IP, user).
            - **`primary`**: har doim **bitta**; `PATCH` da yangi `primary` belgilansa, eski `primary` avtomatik **extra** ga o‘tadi.
            - **`trusted`**: cheklov yo‘q, lekin UI’da 1–2 tavsiya.
            - **Delete-72h**: `pending` holatida user tizimga kira oladi, lekin ayrim amallarni cheklash mumkin (masalan, yangi to‘lov ma’lumotlari qo‘shish).
            - **Arxiv**: deadline o‘tgach foydalanuvchi **login qila olmaydi**; ma’lumotlar arxiv DBga ko‘chiriladi (qonuniy saqlash muddati).
            
            ---
            
            ## Xavfsizlik
            
            - **RBAC**: oddiy foydalanuvchi faqat **o‘z** ma’lumotlarini ko‘radi/o‘zgartiradi.
            - **Rate-limit**: `phones` operatsiyalarida (qo‘shish/verify) throttling.
            - **PII masking**: loglarda telefon/e-mail to‘liq ko‘rsatilmaydi.
            - **Audit**: muhim harakatlar yoziladi (kim, qachon, ip, payload).
            - **CSRF yo‘q** (mobil/JSON API), lekin **CORS/Helmet** 1.1 bosqichida yoqilgan.
            
            ---
            
            ## Frontend (RN) oqimlari
            
            **Profil ekrani**
            
            - Ism, mamlakat – `PATCH /users/me`
            - Telefonlar ro‘yxati – `GET /users/me/phones`
            - “Raqam qo‘shish” → raqam kiritish → OTP kiritish → tasdiq
            - Har bir raqam yonida: `Set primary`, `Mark trusted`, `Remove`
            - “Akkountni o‘chirish” tugmasi → tasdiqlash modali → `POST deletion-requests`
            
            **UX detallar**
            
            - OTP vaqt sanog‘i (resend cheklovi).
            - Primary’ni o‘zgartirganda tasdiqlovchi modal.
            - Delete 72h banneri (deadline countdown).
            - Offline holatlari uchun “retry” va “queued changes” strategiyasi (ixtiyoriy).
            
            ---
            
            ## Audit log namunalari
            
            - `user.update` — `{ before:{...}, after:{...} }`
            - `user.phone.add` — `{ phone:"+99890***", label:"extra" }`
            - `user.phone.verify.success` — `{ phone:"+99890***" }`
            - `user.phone.set_primary` — `{ phoneId:"...", oldPrimary:"..." }`
            - `user.delete.request` — `{ deadline_at:"2025-10-14T10:00:00Z" }`
            - `user.delete.finalize` — `{ archived:true }`
            
            ---
            
            ## Test reja (QA)
            
            **Backend**
            
            - `GET /users/me` — 200, boshqa user ma’lumotlarini ko‘ra olmaslik.
            - `PATCH /users/me` — valid/invalid qiymatlar, emoji filtri.
            - `POST /users/me/phones` — yaroqli/yaroqsiz raqam, 5+ limitda 400.
            - `POST /users/me/phones/verify` — to‘g‘ri/xato/muddati o‘tgan OTP; attempts limiti.
            - `PATCH /users/me/phones/:id` — `primary` almashishi, `trusted` belgilash.
            - `DELETE /users/me/phones/:id` — `primary`ni to‘g‘ri boshqarish.
            - `POST deletion-requests` — `pending` yaralishi; qayta bosganda 409 yoki mavjudini qaytarish.
            - Cron/worker test — deadline o‘tganida finalizatsiya.
            
            **Mobil (RN)**
            
            - Raqam qo‘shish → OTP → tasdiq UI oqimi.
            - Primary/trusted tugmalari ishlashi.
            - Delete 72h banner ko‘rinishi va cancel oqimi.
            
            ---
            
            ## Monitoring & metrikalar
            
            - `phones.add` soni/kun, verify muvaffaqiyat foizi.
            - `primary.set` va `trusted.set` chastotasi.
            - `deletion.request` va `finalize` soni (vaqt bo‘yicha).
            - 4xx/5xx, p95/p99 javob vaqtlari.
            
            ---
            
            ## Definition of Done (1.4)
            
            - **Profil CRUD**: `GET/PATCH /users/me` ishlaydi.
            - **Multi-phone**: qo‘shish → OTP verify → label’lar (`primary`, `trusted`) → o‘chirish — hammasi to‘liq.
            - **Delete-72h**: so‘rov, cancel, cron/worker finalize + arxivga ko‘chirish kancasi.
            - **Audit log** va **rate-limit** yoqilgan.
            - **RN UI**: profil/telefon/akkount o‘chirish ekrani (real API bilan).
            - **Hujjat**: Swagger/Redoc yangilangan; Postman collection yangilangan.
            
            ---
            
            ## Pseudokod (NestJS DTO/guard qisqa ko‘rinish)
            
            ```tsx
            // dto
            class UpdateMeDto { display_name?: string; country_code?: string; }
            class AddPhoneDto { phone: string; }
            class VerifyPhoneDto { phone: string; code: string; }
            class UpdatePhoneLabelDto { label: 'primary'|'trusted'|'extra'; }
            
            // guard
            @UseGuards(JwtAuthGuard)
            @Get('users/me')
            
            // service (asosiy g’oya)
            addPhone(userId, phone) {
              assertPhoneFormat(phone);
              assertUserPhoneCount(userId < 5);
              createPhone({ userId, phone, is_verified:false });
              sendOtp(phone);
            }
            
            verifyPhone(userId, phone, code) {
              validateOtp(phone, code);
              markPhoneVerified(userId, phone);
            }
            
            setPrimary(userId, phoneId) {
              unsetAllPrimary(userId);
              setLabel(phoneId, 'primary');
            }
            
            ```
            
        - 1.5 — React Native (UserApp & DriverApp) — Auth & Profil
            
            ## 1) Ilova karkasi (stack va kataloglar)
            
            - **Stack**: React Native + TypeScript, **React Navigation** (stack + bottom-tabs), **React Query** (data fetching), **Zustand** yoki **Redux Toolkit** (auth/session), **react-hook-form + zod** (form validatsiya), **i18next** (UZ/RU/EN), **Axios** (API), **MMKV** yoki **EncryptedStorage** (token secure saqlash), **RN Localize** (til/mintaqa).
            - **Kataloglar:**
                
                ```
                /src
                  /app             # navigation roots
                  /screens         # onboarding, auth, profile, phones, delete
                  /components      # UI atoms/molecules (Input, Button, CodeBox)
                  /features        # auth, profile (hooks, api, types)
                  /lib             # axios, queryClient, storage, i18n
                  /store           # authStore (tokens, user)
                  /styles          # theme, spacing, colors
                  /utils           # validators, formatters, maskers
                
                ```
                
            
            ## 2) Navigatsiya xaritasi (UserApp)
            
            - **AuthStack**
                - Onboarding (til tanlash)
                - PhoneEnter → OtpVerify → (yoki) SocialLogin (Google/Apple)
            - **MainTabs**
                - Home (keyin) | **Profile** | (keyin: Buyurtma/Trip)
            - **Profile stack**
                - ProfileScreen (ism, mamlakat, avtoriz. yulduzcha)
                - PhonesScreen (raqamlar ro‘yxati)
                - AddPhoneScreen → OTP Screen (tasdiqlash)
                - DeleteAccountScreen (72h ogohlantirish)
            
            > DriverApp hozircha: AuthStack (login/SSO) + ProfileScreen (keyingi sprintda kengayadi).
            > 
            
            ## 3) Ekranlar va UX (odam tilida)
            
            ### Onboarding
            
            - Til: UZ/RU/EN (i18n).
            - “Davom etish” — AuthStack’ga olib boradi.
            
            ### PhoneEnter (Ro‘yxatdan o‘tish/kirish)
            
            - **Input**: `+998 ..` maskasi (E.164 ga normalize qilinadi).
            - **CTA**: “SMS yuborish”; spinner va rate-limit xabarlar.
            - **Fallback**: “SMS kelmadimi? Qo‘ng‘iroq qiling (IVR)”.
            
            ### OtpVerify
            
            - **6-raqamli** CodeBox, **resend timer** (masalan 60s).
            - “Tekshirish” bosilganda **loading**; muvaffaqiyatli bo‘lsa tokenlar saqlanadi va **MainTabs**ga o‘tadi.
            - Xato kiritilganda sarsarib turuvchi animatsiya + matn.
            
            ### SocialLogin (SSO)
            
            - **Google/Apple** tugmalari.
            - Provider’dan qaytgan token → backend → sessiya.
            
            ### ProfileScreen
            
            - `displayName`, `country`, **8-qirrali yulduz** (avtorizatsiya belgisi).
            - “Profilni tahrirlash” (modal yoki alohida sahifa) — `PATCH /users/me`.
            - “Telefonlar”, “Akkountni o‘chirish” menu elementlari.
            
            ### PhonesScreen
            
            - Raqamlar ro‘yxati: `primary`, `trusted`, `extra` yorliqlari.
            - **Actions**: “Asosiy qilish (primary)”, “Ishonchli belgilash (trusted)”, “O‘chirish”.
            - “Yangi raqam qo‘shish” → **AddPhone**.
            
            ### AddPhoneScreen → OtpVerify (phone)
            
            - Raqam kiritish → `POST /users/me/phones` (OTP yuboradi).
            - OtpVerify (phone) → `POST /users/me/phones/verify` → `is_verified=true`.
            
            ### DeleteAccountScreen
            
            - Ogohlantirish matni (72h), **checkbox**: “roziman”.
            - “So‘rov yuborish” → `POST /users/me/deletion-requests`.
            - Muvaffaqiyatda banner: **“Akkount 72 soatdan keyin o‘chiriladi (countdown)”**.
            - “Bekor qilish” (agar qayta kirsa) → `DELETE /users/me/deletion-requests/:id/cancel`.
            
            **UX mayda-lekin-muhim:**
            
            - **Error/Empty/Loading** holatlari (standart komponent).
            - **Pull-to-refresh** profil/telefonlar ro‘yxati.
            - Offline’da “retry” va light cache.
            - Hamma matnlar i18n’dagi kalitlardan.
            
            ## 4) API integratsiya (React Query + Axios)
            
            - **Axios instance**: baseURL `/api`, interceptor’da **access token** header’a ulanadi, 401’da **refresh** chaqiradi (bir marta), bo‘lmasa **logout**.
            - **Queries/Mutations**:
                - `useMe()` — `GET /auth/me`
                - `useUpdateMe()` — `PATCH /users/me`
                - `usePhones()` — `GET /users/me/phones`
                - `useAddPhone()` → `POST /users/me/phones`
                - `useVerifyPhone()` → `POST /users/me/phones/verify`
                - `useSetPhoneLabel()` → `PATCH /users/me/phones/:id`
                - `useRemovePhone()` → `DELETE /users/me/phones/:id`
                - `useRequestDeletion()` → `POST /users/me/deletion-requests`
                - `useCancelDeletion()` → `DELETE /users/me/deletion-requests/:id/cancel`
            
            **Optimistik UI**: label’ni o‘zgartirishda oldindan yangilab, xato bo‘lsa qaytarish.
            
            ## 5) Auth saqlash (tokenlar va sessiya)
            
            - **EncryptedStorage/MMKV** (platformaga mos): `access`, `refresh`, `user`.
            - App ishga tushganda **hydrate**: token bor → `GET /auth/me`; yo‘q → AuthStack.
            - Logout: storage tozalash, **react-query** cache clear.
            
            ## 6) Validatsiya va xatoliklar
            
            - **react-hook-form + zod**: phone mask → E.164 validator; displayName 1–64; country ISO2.
            - Server xatolari: 400/401/429… → to‘g‘ri lokalizatsiya qilingan matnlar.
            
            ## 7) Accessibility va UI detallar
            
            - Touchable elementlar **hitSlop**; minimal **44dp**.
            - Rangi/kontrasti WCAGga yaqin.
            - Dynamic font size (fontScale) test qilinadi.
            - RTL (keyin): i18n’da yo‘nalish.
            
            ## 8) Telemetriya (min)
            
            - `screen_view` eventlari: onboarding, phone_enter, otp_verify, profile, phones, delete.
            - `auth_success|fail`, `otp_resend`, `phone_add|verify`, `delete_request|cancel`.
            
            ## 9) Testlar
            
            - **Unit**: form validatorlari (phone, code, name).
            - **Component**: OTP input, PhoneItem (label/actions).
            - **E2E (Detox minimal)**:
                - phone → send OTP → verify → me → phones → add phone → verify → set primary → delete request.
            
            ## 10) Definition of Done (1.5)
            
            - **Auth oqimi**: Phone OTP (resend/timer), IVR fallback tugmasi, SSO (kamida Google) tugmasi ko‘rinadi (SSO real ishlashi 1.3 ga bog‘liq).
            - **Profil**: ko‘rish/tahrirlash real API bilan.
            - **Telefonlar**: ro‘yxat, qo‘shish → OTP verify, label (primary/trusted), o‘chirish — real API bilan.
            - **Delete-72h**: so‘rov yuborish va cancel UI.
            - **Til**: UZ/RU/EN matnlari ishlaydi.
            - **Stabillik**: 401’da auto-refresh, xatoliklar uchun toza snackbar/dialoglar.
            - **Testlar**: eng asosiy oqimlar o‘tadi (Detox minimal), Postman collection bilan yakuniy smoke.
            
            ---
            
            ## Qisqa komponent eskizi (pseudokod)
            
            ```tsx
            // /features/auth/useAuth.ts
            export const useAuth = () => {
              const { access, refresh, setTokens, clear } = useAuthStore();
              const axios = useAxiosWithAuth({ access, onRefresh: refreshTokens });
              return { axios, setTokens, clear };
            };
            
            // /screens/auth/PhoneEnter.tsx
            function PhoneEnter() {
              const { mutate: sendOtp, isLoading } = useSendOtp();
              const { control, handleSubmit } = useForm({ resolver: zodResolver(phoneSchema) });
              return (
                <Screen>
                  <PhoneInput control={control} name="phone" />
                  <Button loading={isLoading} onPress={handleSubmit(v => sendOtp(v))}>
                    {t('auth.send_sms')}
                  </Button>
                  <Link onPress={() => sendOtp({ phone, channel:'call' })}>
                    {t('auth.call_me_instead')}
                  </Link>
                </Screen>
              );
            }
            
            // /screens/profile/Phones.tsx
            function Phones() {
              const { data } = usePhones();
              const setLabel = useSetPhoneLabel();
              const remove = useRemovePhone();
              return (
                <Screen>
                  {data?.map(p => (
                    <PhoneItemkey={p.id}
                      phone={p.e164}
                      label={p.label}
                      onSetPrimary={() => setLabel({ id: p.id, label:'primary' })}
                      onSetTrusted={() => setLabel({ id: p.id, label:'trusted' })}
                      onRemove={() => remove({ id: p.id })}
                    />
                  ))}
                  <Fab onPress={() => nav.navigate('AddPhone')} icon="plus" />
                </Screen>
              );
            }
            
            ```
            
        - 1.6 — Admin mini-panel (React)
            
            ## 1) Nima chiqadi?
            
            - **/admin** UI: “Users” ro‘yxati (qidiruv, filter, pagination), user kartochkasi (phones/identities/status), **audit log** ro‘yxati.
            - **RBAC**: faqat `role=admin` bo‘lsa kira oladi (JWT ichidan tekshiramiz).
            - **Minimal update**: `display_name` va `status` ni o‘zgartirish → auditga yoziladi (backendda allaqachon bor).
            
            ---
            
            ## 2) Stack va kataloglar
            
            - **Stack**: React + TypeScript, **React Router** (v6), **React Query**, **Axios**, **Zustand** yoki **Redux Toolkit** (auth/session), **MUI** yoki **AntD** (ixtiyoriy), **i18next** (UZ/RU/EN).
            - **Tu zilma** (Vite/CRA farqsiz):
            
            ```
            apps/admin/              # sof React admin-SPA
              src/
                main.tsx
                App.tsx
                routes/
                  AdminRoutes.tsx
                  guards/RequireAdmin.tsx
                pages/
                  Login.tsx                # agar alohida admin-login bo‘lsa
                  UsersList.tsx
                  UserDetail.tsx
                  AuditLogs.tsx
                  NotFound.tsx
                components/
                  Table.tsx
                  Filters.tsx
                  Pagination.tsx
                  PhoneList.tsx
                  IdentityList.tsx
                features/
                  auth/ (store, hooks)
                  adminApi/ (react-query hooks: useAdminUsers, useAdminUserDetail, useAuditLogs)
                lib/
                  axios.ts   # baseURL, auth header, 401 refresh
                  queryClient.ts
                  i18n.ts
                styles/
              index.html
              vite.config.ts
            
            ```
            
            ---
            
            ## 3) Routing (React Router) va Guard
            
            - **Marshrutlar:**
                - `/admin/users` — ro‘yxat
                - `/admin/users/:id` — user detail
                - `/admin/audit` — audit log
                - `/admin/*` — 404
            - **Guard**: JWT borligini va `role=admin` ekanini tekshiradi.
            
            ```tsx
            // routes/guards/RequireAdmin.tsx
            import { Navigate, Outlet } from "react-router-dom";
            import { useAuthStore } from "@/features/auth/store";
            export default function RequireAdmin() {
              const { token, user } = useAuthStore();
              if (!token) return <Navigate to="/login" replace />;
              if (user?.role !== "admin") return <Navigate to="/403" replace />;
              return <Outlet />;
            }
            
            ```
            
            ```tsx
            // routes/AdminRoutes.tsx
            import { Routes, Route } from "react-router-dom";
            import RequireAdmin from "./guards/RequireAdmin";
            import UsersList from "@/pages/UsersList";
            import UserDetail from "@/pages/UserDetail";
            import AuditLogs from "@/pages/AuditLogs";
            import NotFound from "@/pages/NotFound";
            
            export function AdminRoutes() {
              return (
                <Routes>
                  <Route element={<RequireAdmin />}>
                    <Route path="/admin/users" element={<UsersList />} />
                    <Route path="/admin/users/:id" element={<UserDetail />} />
                    <Route path="/admin/audit" element={<AuditLogs />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              );
            }
            
            ```
            
            ---
            
            ## 4) Auth saqlash va Axios
            
            - Token va admin foydalanuvchi ma’lumotini **Zustand** (yoki RTK) store’da saqlaymiz.
            - Axios **interceptor** access token qo‘shadi; 401 bo‘lsa refresh qiladi (yoki logout).
            
            ```tsx
            // lib/axios.ts
            import Axios from "axios";
            import { useAuthStore } from "@/features/auth/store";
            
            export const api = Axios.create({ baseURL: import.meta.env.VITE_API_BASE });
            
            api.interceptors.request.use((config) => {
              const { token } = useAuthStore.getState();
              if (token) config.headers.Authorization = `Bearer ${token}`;
              return config;
            });
            
            api.interceptors.response.use(
              (r) => r,
              async (err) => {
                if (err?.response?.status === 401) {
                  const { refresh, setTokens, logout } = useAuthStore.getState();
                  if (!refresh) { logout(); return Promise.reject(err); }
                  try {
                    const { data } = await Axios.post(`${import.meta.env.VITE_API_BASE}/auth/refresh`, { refresh });
                    setTokens(data.access, data.refresh);
                    err.config.headers.Authorization = `Bearer ${data.access}`;
                    return api.request(err.config);
                  } catch {
                    logout();
                  }
                }
                return Promise.reject(err);
              }
            );
            
            ```
            
            ---
            
            ## 5) Data Fetching (React Query hooks)
            
            **Users ro‘yxati (server-side pagination):**
            
            ```tsx
            // features/adminApi/useAdminUsers.ts
            import { useQuery } from "@tanstack/react-query";
            import { api } from "@/lib/axios";
            
            export function useAdminUsers(params: {
              q?: string; status?: string; role?: string; page?: number; limit?: number;
            }) {
              return useQuery({
                queryKey: ["admin-users", params],
                queryFn: async () => {
                  const { data } = await api.get("/admin/users", { params });
                  return data as { items:any[]; total:number; page:number; pageSize:number };
                },
                keepPreviousData: true,
              });
            }
            
            ```
            
            **User detail + update:**
            
            ```tsx
            // features/adminApi/useAdminUserDetail.ts
            import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
            import { api } from "@/lib/axios";
            
            export const useAdminUserDetail = (id: string) => useQuery({
              queryKey: ["admin-user", id],
              queryFn: async () => (await api.get(`/admin/users/${id}`)).data,
            });
            
            export const useAdminUserUpdate = (id: string) => {
              const qc = useQueryClient();
              return useMutation({
                mutationFn: async (payload: { display_name?: string; status?: "active"|"blocked" }) =>
                  (await api.patch(`/admin/users/${id}`, payload)).data,
                onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user", id] }),
              });
            };
            
            ```
            
            **Audit logs:**
            
            ```tsx
            // features/adminApi/useAuditLogs.ts
            import { useQuery } from "@tanstack/react-query";
            import { api } from "@/lib/axios";
            
            export function useAuditLogs(params: { user_id?: string; action?: string; from?: string; to?: string; page?: number; limit?: number; }) {
              return useQuery({
                queryKey: ["audit-logs", params],
                queryFn: async () => (await api.get("/admin/audit-logs", { params })).data
              });
            }
            
            ```
            
            ---
            
            ## 6) Sahifalar (UI xulq-atvori)
            
            ### UsersList.tsx
            
            - **Filterlar**: qidiruv (q/phone/email/name), `status`, `role`.
            - **Jadval**: ID, Display Name, Phone, Email, Role, Status, Created.
            - **Sahifalash**: `page`, `limit`.
            - **Row bosilganda** → `/admin/users/:id`.
            
            ```tsx
            function UsersList() {
              const [q, setQ] = useState(""); const [status, setStatus] = useState("");
              const [role, setRole] = useState(""); const [page, setPage] = useState(1);
              const { data, isLoading } = useAdminUsers({ q, status, role, page, limit: 25 });
            
              return (
                <Page title="Users">
                  <Filters q={q} onChangeQ={setQ} status={status} onChangeStatus={setStatus} role={role} onChangeRole={setRole} />
                  <Table rows={data?.items ?? []} loading={isLoading} onRowClick={(row) => navigate(`/admin/users/${row.id}`)} />
                  <Pagination total={data?.total ?? 0} page={page} onChange={setPage} />
                </Page>
              );
            }
            
            ```
            
            ### UserDetail.tsx
            
            - User info + **Phones** (label, verified) + **Identities**.
            - **Update**: `display_name`, `status (active|blocked)` → `useAdminUserUpdate`.
            
            ```tsx
            function UserDetail() {
              const { id } = useParams();
              const { data, isLoading } = useAdminUserDetail(id!);
              const update = useAdminUserUpdate(id!);
            
              return (
                <Page title={`User ${id}`}>
                  {isLoading ? <Spinner/> : (
                    <>
                      <UserCard user={data.user} onSave={(dto)=>update.mutate(dto)} saving={update.isPending} />
                      <PhoneList phones={data.phones} />
                      <IdentityList identities={data.identities} />
                    </>
                  )}
                </Page>
              );
            }
            
            ```
            
            ### AuditLogs.tsx
            
            - Filterlar: `user_id`, `action`, `time range`.
            - Jadval: time, user_id, action, ip, ua(short), payload(short).
            - PII masking (telefon/emailni to‘liq ko‘rsatmaslik).
            
            ---
            
            ## 7) UI & UX detallar
            
            - **PII masking** (mas: `+99890*****12`), faqat kerakli joyda to‘liq ko‘rsatish.
            - **Loading/empty/error** holatlari: umumiy komponentlar.
            - **Copy to clipboard** (user id, provider uid).
            - **Dark mode** (ixtiyoriy).
            - **i18n** (UZ/RU/EN) kalitlar: sarlavha, ustun nomlari, xatolik matnlari.
            
            ---
            
            ## 8) Xavfsizlik
            
            - Guard faqat UI darajasida emas — **backend RBAC** allaqachon bor: `/admin/*` endpointlar `admin` rolini talab qiladi.
            - Token secure saqlanishi (localStorage emas, **sessionStorage** yoki memory + refresh strategiyasi; prodda HTTPS).
            - **CORS** backendda ruxsat etilgan origin bilan.
            
            ---
            
            ## 9) Build/Deploy (Nginx)
            
            - Vite/CRA `npm run build` → `dist/` (yoki `build/`).
            - Nginx static serve:
            
            ```
            location /admin/ {
              try_files $uri /admin/index.html;
            }
            
            ```
            
            - **API** uchun reverse proxy: `/api/` → backend (1.1’dagi Nginx sozlamalari bilan).
            
            ---
            
            ## 10) Test rejasi
            
            **Frontend**
            
            - Users list: filterlar, pagination (mock server bilan).
            - User detail: update tugmasi ishlaydi; muvaffaqiyat/xatolik holatlari.
            - Audit logs: filterlar, sahifalash.
            - Guard: token yo‘q → `/login`; role!=admin → 403.
            
            **E2E** (Playwright/Cypress ixtiyoriy):
            
            - Login (admin) → Users → User detail → display_name/status o‘zgartirish → Audit’ni tekshirish.
            
            ---
            
            ## 11) Definition of Done (React varianti)
            
            - `/admin/users`, `/admin/users/:id`, `/admin/audit` **sofligi**: qidiruv/filter/pagination server-side.
            - **RBAC**: RequireAdmin guard ishlaydi; backend ham 401/403 bilan himoyalaydi.
            - **Update** (display_name, status) muvaffaqiyatli va **auditga yoziladi**.
            - **Monitoring**: Sentry (frontend) + backend metrikalar (1.1’da).
            - **Build**: Vite/CRA build → Nginx’da serve, `/admin` deep-link ishlaydi.
        - 1.7 — Xavfsizlik, Rate-limit, Monitoring, Testlar
            
            Maqsad: Sprint 1 (Auth & Profil) funksiyalari **barqaror, xavfsiz, o‘lchanadigan** holatda bo‘lsin va **DoD** yopilsin. Stack: **Node.js (NestJS, TS, Sequelize, Postgres, Redis), React/React Native, Docker/Compose, Nginx, CI/CD**.
            
            ---
            
            ## 1) Xavfsizlik (API va infratuzilma)
            
            ### API darajasida (NestJS)
            
            - **Helmet + CORS**: `app.use(helmet())`, CORS’da faqat ruxsat etilgan originlar.
            - **JWT Guard**: barcha `/users/*` va shaxsiy endpointlar faqat `Bearer access` bilan.
            - **RBAC**: `RolesGuard` — admin endpointlar faqat `role=admin`.
            - **Input validatsiya**: DTO + `class-validator`/`zod` (telefon E.164, country ISO2, name 1–64).
            - **PII masking**: logga email/telefon to‘liq chiqmasin (`+99890****321`).
            - **Refresh rotation**: `/auth/refresh` chaqirilganda eski refresh **bekor** qilinadi, yangisi beriladi.
            - **Audit log**: muhim amallar (`auth.otp.send|verify`, `auth.social.*`, `user.update`, `user.delete.request`) `audit_logs` ga yoziladi.
            - **Secrets**: `.env` repoga kirmaydi; CI/CD secrets; prod’da **env-vars**.
            
            ### Nginx darajasida
            
            - **TLS** (prod): Let’s Encrypt/ACME, **HSTS**.
            - **Request limit** (DDOS/Brute force yumshatish) va **body size**:
                
                ```
                http {
                  limit_req_zone $binary_remote_addr zone=otp_zone:10m rate=1r/s;
                
                  server {
                    client_max_body_size 10m;
                
                    location /api/auth/otp/ {
                      limit_req zone=otp_zone burst=5 nodelay;  # 1 r/s, burst 5
                      proxy_pass http://api:3000/api/auth/otp/;
                    }
                  }
                }
                
                ```
                
            
            ### Redis / Rate limit (API)
            
            - `/auth/otp/send`, `/auth/otp/verify` uchun **IP** va **phone** bo‘yicha throttling:
                - masalan: *1 daqiqada 1 marta (phone), 1 daqiqada 5 marta (IP)*.
            - Kod misoli (Express/Nest bilan `rate-limiter-flexible`):
                
                ```tsx
                const rateLimiterByIP = new RateLimiterRedis({ storeClient: redis, points: 5, duration: 60 });
                const rateLimiterByPhone = new RateLimiterRedis({ storeClient: redis, points: 1, duration: 60, keyPrefix:'otp-phone' });
                
                // guard/middleware ichida:
                await rateLimiterByIP.consume(req.ip);
                await rateLimiterByPhone.consume(req.body.phone);
                
                ```
                
            
            ---
            
            ## 2) Monitoring & Observability
            
            ### Health/Readiness
            
            - **`/api/healthz`**: 200 — servis tirik.
            - **`/api/readyz`**: DB/Redis ulanishi tekshiriladi (ishga tayyor).
            
            ### Metrikalar (Prometheus format)
            
            - Kiritamiz:
                - `http_requests_total{path,method,status}`
                - `http_request_duration_seconds_bucket` (p50/p95/p99)
                - `otp_send_total{result="success|fail"}`
                - `otp_verify_total{result="success|fail"}`
                - `sso_login_total{provider,result}`
                - `auth_refresh_total{result}`
            
            Nest’da `/metrics` endpoint (authsiz — **faqat ichki tarmoq**):
            
            ```tsx
            // metrics.module.ts
            import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';
            const registry = new Registry(); collectDefaultMetrics({ register: registry });
            export const httpDuration = new Histogram({ name:'http_request_duration_seconds', help:'', buckets:[0.05,0.1,0.3,0.5,1,2], labelNames:['method','path','status'] });
            export const otpSendCounter = new Counter({ name:'otp_send_total', help:'', labelNames:['result'] });
            // Controller: GET /metrics -> registry.metrics()
            
            ```
            
            ### Loglash
            
            - **JSON log** (pino/winston): `timestamp, level, msg, reqId, path, userId, ip`.
            - Prod’da loglar **stdout** → Docker → log shipper (ELK/Graylog).
            - Xatolarni Sentry/Alertmanager orqali ogohlantirish.
            
            ### Alertlar (Grafana yoki Sentry)
            
            - **Error rate** > 1% (5 daq. oynada) → alert.
            - **p95** `> 500ms` (kritik endpointlar) → alert.
            - `otp_send_total{result="fail"}` tezligi keskin oshsa → alert.
            - DB connection errors yoki `readyz` 500 → alert.
            
            ---
            
            ## 3) Testlar (Backend, Frontend, Mobile)
            
            ### Backend testlari
            
            - **Unit**: servislar (OTP generator/validator, rate-limit helper, JWT service).
            - **Integration (supertest)**:
                - `/auth/otp/send`: 200, 429 (rate-limit), 400 (format).
                - `/auth/otp/verify`: success, invalid, expired, attempts>limit.
                - `/auth/social/google`: success/fail; identity unique.
                - `/users/me`: GET/PATCH (role guard, validatsiya).
                - `/users/me/phones`: add → verify → set primary/trusted → delete (cheklovlar).
                - `/users/me/deletion-requests`: create/cancel; cron finalize testi.
            - **Security tests**:
                - Authsiz kirish — 401/403.
                - RBAC nojoiz kirish — 403.
                - Input sanitizatsiya — XSS payloadlar kesiladi.
                - Brute force — 429 qaytadi.
            
            ### Frontend (React Admin)
            
            - **Unit**: filter/pagination komponentlari, form validatsiyasi.
            - **Integration**: `UsersList` qidiruv/filter, `UserDetail` update → snackbar.
            - **E2E (Cypress/Playwright)**: admin login → user qidirish → detail → status o‘zgartirish → audit’ni tekshirish.
            
            ### Mobile (RN)
            
            - **Unit**: form validatorlar (phone, OTP, name).
            - **Component**: OTP input (timer/resend), PhoneItem (actions).
            - **E2E (Detox minimal)**: register → otp → me → phones → add+verify → set primary → delete request.
            
            ---
            
            ## 4) Error-handling va foydalanuvchiga xabarlar
            
            - **API**: standart javoblar:
                - 400 — `{"error":"ValidationError","details":[...]}`
                - 401 — `{"error":"Unauthorized"}`
                - 403 — `{"error":"Forbidden"}`
                - 429 — `{"error":"TooManyRequests","retryAfter":60}`
                - 5xx — `{"error":"ServerError","traceId":"..."}`
            - **Client**: i18n matnlar bilan:
                - OTP noto‘g‘ri yoki muddati o‘tgan — aniq xabar.
                - Rate-limit — “birozdan so‘ng urinib ko‘ring (NN s)”.
            
            ---
            
            ## 5) CI/CD yakun tekshiruvlari (quality gates)
            
            - `npm run lint` + `npm run typecheck` (hamma paketlarda).
            - Backend: `npm test` (unit+integration) **yashil**.
            - React & RN: **lint/type** o‘tgan, minimal unit testlar.
            - Docker imijlar build + `healthcheck` (compose’da) **OK**.
            - `/api/healthz` va `/api/readyz` CI “smoke” bosqichida tekshiriladi.
            
            ---
            
            ## 6) DoS/Brute-force yumshatish (qo‘shimcha choralar)
            
            - **Captcha** (MVP keyin) — OTP yuborish formida.
            - **Account lockout**: attempts juda ko‘p bo‘lsa vaqtincha blok (env orqali).
            - **Circuit-breaker**: Eskiz yoki SSO provider down bo‘lsa retry/backoff.
            
            ---
            
            ## 7) Definition of Done (1.7 — Sprint 1 yopilish mezoni)
            
            - **Xavfsizlik**: Helmet, CORS, JWT+RBAC, PII masking, audit logs.
            - **Rate-limit**: `/auth/otp/*` da IP+phone asosida ishlaydi; Nginx’da ham basic limit.
            - **Monitoring**: `/metrics`, asosiy metrikalar (otp/send/verify, sso, http p95/p99), Grafana paneli, alertlar.
            - **Testlar**: Backend unit+integration, Admin React integration, RN Detox minimal oqimlar — **yashil**.
            - **CI/CD**: lint/type/test/build → docker → healthcheck → pass.
            - **Hujjat**: “Runbook” (alarmlar kelganda nima qilish), “Ops cheatsheet” (restart/rollback), Swagger/Redoc va Postman yangilangan.
            
            ---
            
            ## 8) Tez qo‘llanma (dev uchun qisqa kod/konfiglar)
            
            **NestJS — Helmet/CORS**
            
            ```tsx
            app.use(helmet());
            app.enableCors({ origin: ['https://admin.example.com','https://app.example.com'], credentials: true });
            
            ```
            
            **NestJS — Req timing (metrics middleware)**
            
            ```tsx
            app.use((req, res, next) => {
              const start = process.hrtime.bigint();
              res.on('finish', () => {
                const dur = Number(process.hrtime.bigint() - start)/1e9;
                httpDuration.labels(req.method, req.path, String(res.statusCode)).observe(dur);
              });
              next();
            });
            
            ```
            
            **Nginx — API proxy + rate**
            
            ```
            location /api/ {
              proxy_pass http://api:3000/api/;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              client_max_body_size 10m;
            }
            location /api/auth/otp/ {
              limit_req zone=otp_zone burst=5 nodelay;
              proxy_pass http://api:3000/api/auth/otp/;
            }
            
            ```
            
            ---
            
            ### Xulosa
            
            1.7 — bu Sprint 1 ni **ishlab** turadigan va **o‘lchanadigan** holatga keltiruvchi paket: xavfsizlik, throttling, kuzatuv va testlar. Shular bilan Auth & Profil funksiyalari real foydalanuvchi yukiga tayyor bo‘ladi. 
            
    - Sprint 2 — Driver panel & DriverOffer (Yo‘lovchi ilovasi ichida)
        
        **Qamrov (Excel):** “Driver panel” (liniyaga chiqish/band), e’lon yaratish (yo‘nalish, sana/vaqt, narx, o‘rinlar, avtomobil ma’lumoti), **moderatsiya/auto-faollashtirish**.
        
        **Vazifalar:**
        
        - Haydovchi rejimiga o‘tish, hujjat yuklash/tekshirish.
        - E’lon yaratish → moderatsiya queue → auto-approve shartlari.
        - E’lonlar ro‘yxati/filtrlash, statuslar.
        
        **API/DB:**
        
        - `driver/profile`, `driver/vehicle`, `driver/offers`, `driver/offers/:id/approve`.
        - `drivers`, `vehicles`, `driver_offers`, `driver_verifications`.
        
        **DoD:**
        
        - Excel “DriverOffer” talablariga mos; admin tasdiqlash ishlaydi.
        
        ---
        
    - Sprint 3 — Location & Qidiruv
        
        **Qamrov (Excel):** geolokatsiya ruxsati, manzil qidiruv, saqlangan manzillar, filtrelar (brend/narx/reyting/shaharlararo).
        
        **Vazifalar:**
        
        - Geokoding, autocomplete, marshrut asosida **taxminiy narx** kalkulyatori.
        - Filtrlash: xizmat brendi, narx, reyting, masofa.
        
        **API/DB:**
        
        - `search/places`, `search/routes`, `prices/estimate`, `favorites`.
        - `places_cache`, `user_favorites`.
        
        **DoD:**
        
        - Qidiruv natijalari < 300 ms (kesh bilan); edge-case: no-GPS/offline.
        
        ---
        
    - Sprint 4 — Standart buyurtma (Band qilish) oqimi
        
        **Qamrov (Excel):** band qilish, to‘lov usuli (naqd/plastik), holatlar zanjiri, bekor qilish siyosati, **o‘zini-o‘zi band**.
        
        **Vazifalar:**
        
        - Buyurtma yaratish → driver matching → statuslar: **Yaratildi → Tayinlandi → Yo‘lda → Safarda → Yakunlandi**.
        - O‘zini-o‘zi band qilish rejimi.
        - Bekor qilish siyosati (jarimalar).
        
        **API/DB:**
        
        - `orders`, `orders/:id/cancel`, `matching/assign`.
        - `orders`, `order_events`, `cancellation_policies`.
        
        **DoD:**
        
        - Buyurtma hayotiy sikli ishlaydi; Excel’dagi bandlar yopilgan.
        
        ---
        
    - Sprint 5 — Trip hayotiy sikli + Reyting + Xabarlar
        
        **Qamrov (Excel):** pick-upga yo‘l olish, real-time holatlar, tushirish, to‘lovdan so‘ng **baholash**, “Xabarlar” bo‘limi (kompaniya yangiliklari; filtr/kategoriyalar).
        
        **Vazifalar:**
        
        - Trip telemetriya (minimum), holat bildirishnomalari.
        - Ikki tomonlama reyting, sharh; nizolarni yaratish.
        - In-app **Xabarlar**: yangiliklar/elonlar; opt-in/opt-out.
        
        **API/DB:**
        
        - `trips`, `trips/:id/events`, `ratings`, `reviews`, `news`.
        - `trip_events`, `ratings`, `reviews`, `news_items`, `user_news_reads`.
        
        **DoD:**
        
        - Trip statuslari real vaqtda ko‘rinadi; reyting/shikoyat oqimi ishlaydi.
        
        ---
        
    - Sprint 6 — To‘lov & Hisob-kitob
        
        **Qamrov (Excel):** naqd/plastik (MVP), komissiya, refund/hold, reconciliation.
        
        **Vazifalar:**
        
        - Payment-gateway integratsiyasi (plastik); naqd jarayoni protokoli.
        - Komissiya hisoblash (dinamik stavka), promo ta’siri.
        - Refund/hold jarayonlari; kassa jurnali.
        
        **API/DB:**
        
        - `payments/intent`, `payments/webhook`, `ledger`.
        - `payments`, `payouts`, `ledger_entries`, `commissions`.
        
        **DoD:**
        
        - To‘lov muvaffaqiyat/nojavob holatlari to‘liq ishlovchi; audit izi bor.
        
        ---
        
    - Sprint 7 — Admin panel (MVP)
        
        **Qamrov (Excel):** analitika (yangi/qo‘shimcha ro‘yxatdan o‘tganlar, login/logout/sign-in; Android/iOS), foydalanuvchilar CRUD, **qora ro‘yxat** (foyd./hayd.), haydovchilarni verifikatsiya, **promokod/aksiya**, **reklama/xizmat xabarlari**ni jo‘natish.
        
        **Vazifalar:**
        
        - RBAC (Admin/Moderator/Support).
        - Foydalanuvchi/haydovchi, hujjatlarni tasdiqlash.
        - Promokod/aksiya boshqaruvi; xabarnomalar jo‘natish.
        - Chiziqli dashboard (MVP KPI).
        
        **DoD:**
        
        - Excel AdminPaneldagi bandlar bajarilgan; bulk operatsiyalar xavfsiz.
        
        ---
        
    - Sprint 8 — Marketing (kampaniya/referral/cashback)
        
        **Qamrov (Excel):** promokodlar, A/B test, segment targeting (hudud, brend, reyting, faoliyat), referral/cash-back, banner/karusel, KPI panel.
        
        **Vazifalar:**
        
        - Segmentator + kampaniya orkestratori.
        - In-app kontent (banner/karusel) CMS.
        - Referral/cashback balans hisob-kitobi.
        
        **DoD:**
        
        - Kampaniya → eventlar → konversiya ko‘rsatkichlari dashboard’da.
        
        ---
        
    - Sprint 9 — Mikroservislar: ETL/Analitika, Arxiv, Bildirishnoma
        
        **Qamrov (Excel):** log→metrika ETL, arxiv servisi (o‘chirilgan akkauntlar), bildirishnoma orkestratsiyasi.
        
        **Vazifalar:**
        
        - ETL jobs (yuklama grafigi bilan), materialized views.
        - Arxiv servisi (GDPR-ga o‘xshash talablar).
        - Bildirishnoma qoidalari (push/SMS/Email templating).
        
        **DoD:**
        
        - ETL backlog’lari jadval bo‘yicha; arxiv/restore sinovdan o‘tgan.
        
        ---
        
    - Sprint 10 — Integratsiyalarni to‘liq yopish
        
        **Qamrov (Excel):** Eskiz, SIP/Asterisk, botlar, SSO, OneID (keyin), xarita/ETA.
        
        **Vazifalar:**
        
        - Integratsiya kontrakt testlari; rate-limit/proxy.
        - Xavfsizlik skanlari; secret-rotation.
        
        **DoD:**
        
        - Barqarorlik testlari + yopiqlik (circuit-breaker, retry-policy).
        
        ---
        
    - Sprint 11 — Support, QA & Prodga chiqarish
        
        **Qamrov (Excel):** nizolarni ko‘rib chiqish, tiketing oqimi, regression, yuklama testi, SRE alarmlar, runbook, versiyalash/migratsiya.
        
        **Vazifalar:**
        
        - Support paneli (basic), SLA/SLO, on-call jadval.
        - Regression chek-list; yuklama testi.
        - Prod release’lar: canary/blue-green.
        
        **DoD:**
        
        - SLA ko‘rsatkichlari qanoatlantirilgan; release-notes.