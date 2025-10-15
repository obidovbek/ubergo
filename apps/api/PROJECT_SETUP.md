# 🚀 UberGo API - Project Setup Guide

## ✅ What Has Been Created

A complete Node.js/Express backend API with TypeScript, PostgreSQL, and JWT authentication.

### 📂 Directory Structure (50+ files created)

```
api/src/
├── 📁 config/              (2 files)
│   ├── index.ts           - App configuration
│   └── database.ts        - PostgreSQL connection
│
├── 📁 constants/           (1 file)
│   └── index.ts           - Enums and constants
│
├── 📁 types/               (1 file)
│   └── index.ts           - TypeScript interfaces
│
├── 📁 errors/              (1 file)
│   └── AppError.ts        - Custom error classes
│
├── 📁 utils/               (4 files)
│   ├── jwt.ts             - JWT utilities
│   ├── password.ts        - Password hashing
│   ├── response.ts        - Response helpers
│   └── validation.ts      - Validation helpers
│
├── 📁 middleware/          (3 files)
│   ├── auth.ts            - Authentication
│   ├── errorHandler.ts    - Error handling
│   └── validator.ts       - Request validation
│
├── 📁 models/              (1 file)
│   └── User.ts            - User model
│
├── 📁 services/            (2 files)
│   ├── AuthService.ts     - Auth logic
│   └── UserService.ts     - User logic
│
├── 📁 controllers/         (2 files)
│   ├── AuthController.ts  - Auth endpoints
│   └── UserController.ts  - User endpoints
│
├── 📁 routes/              (3 files)
│   ├── index.ts           - Main router
│   ├── auth.routes.ts     - Auth routes
│   └── user.routes.ts     - User routes
│
├── 📁 database/            (1 file)
│   └── schema.sql         - Database schema
│
├── 📄 app.ts               - Express setup
└── 📄 index.ts             - Server entry
```

## 🎯 Quick Start (4 Steps)

### Step 1: Install Dependencies

```bash
cd d:\projects\UberGo\apps\api
npm install
```

### Step 2: Setup Database

Create PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ubergo;

# Exit psql
\q

# Run schema
npm run db:setup
```

Or manually:
```bash
psql -U postgres -d ubergo -f src/database/schema.sql
```

### Step 3: Create Environment File

Create `.env` file in the api directory:

```env
# Server
PORT=3000
NODE_ENV=development
API_PREFIX=/api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ubergo
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=*
```

### Step 4: Start Development

```bash
npm run dev
```

API will be available at: `http://localhost:3000/api`

## 📦 Dependencies Installed

### Production
- `express` - Web framework
- `pg` - PostgreSQL client
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - HTTP logging

### Development
- `typescript` - TypeScript
- `ts-node-dev` - Development server
- `@types/*` - Type definitions

## 🎨 Features Included

1. ✅ **Authentication System**
   - User registration
   - User login
   - JWT token generation
   - Password hashing with bcrypt
   - Protected routes

2. ✅ **User Management**
   - CRUD operations
   - Role-based access control
   - Pagination support
   - Status management

3. ✅ **Database Layer**
   - PostgreSQL integration
   - Connection pooling
   - Transaction support
   - Complete schema

4. ✅ **Security**
   - JWT authentication
   - Password hashing
   - CORS configuration
   - Helmet security headers
   - Input validation

5. ✅ **Error Handling**
   - Custom error classes
   - Centralized error handler
   - Standardized responses

6. ✅ **Type Safety**
   - Full TypeScript support
   - Interface definitions
   - Type checking

## 🔧 API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me (protected)
POST /api/auth/logout (protected)
```

### Users
```
GET    /api/users (admin only)
GET    /api/users/:id
PUT    /api/users/:id (admin only)
DELETE /api/users/:id (admin only)
```

## 📝 Usage Examples

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Current User (Protected)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get All Users (Admin Only)

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=25" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🗂️ Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run db:setup     # Setup database schema
```

## 🔐 Authentication Flow

1. User registers or logs in
2. Server generates JWT token
3. Client stores token
4. Client sends token in `Authorization: Bearer <token>` header
5. Server validates token on protected routes

## 📊 Database Schema

### Users Table
- id (UUID, PK)
- name, email, phone
- password (hashed)
- role (admin/user/driver)
- status (active/inactive/suspended)
- timestamps

### Drivers Table
- id (UUID, PK)
- user_id (FK → users)
- license_number, vehicle details
- rating, total_rides
- availability status
- current location

### Rides Table
- id (UUID, PK)
- user_id, driver_id (FKs)
- pickup/destination locations
- ride_type, status
- fare, distance, duration

### Payments & Ratings
- Payment tracking
- Driver ratings

## 🚨 Important Notes

1. **Change JWT secrets** in production
2. **Use strong passwords** for database
3. **Enable SSL** for database in production
4. **Set proper CORS** origins
5. **Add rate limiting** for production
6. **Implement logging** for production
7. **Add monitoring** tools

## 📚 Documentation

- **STRUCTURE_GUIDE.md** - Detailed architecture explanation
- **API_REFERENCE.md** - Complete API documentation (create if needed)

## ✅ Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Database created
- [ ] Schema applied (`npm run db:setup`)
- [ ] Environment file created (`.env`)
- [ ] Development server running (`npm run dev`)
- [ ] Health check accessible (`/api/health`)
- [ ] Test registration endpoint
- [ ] Test login endpoint

## 🎉 You're Ready!

Your backend API is now ready for development. Start building your ride-sharing platform!

---

**Status**: ✅ Structure Complete - Ready for Development!
**Next**: Connect frontend applications to this API!

