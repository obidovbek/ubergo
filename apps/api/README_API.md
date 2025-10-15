# 🚗 UberGo API - Backend Service

A robust, scalable Node.js/Express backend API for the UberGo ride-sharing platform.

## 📋 Overview

This API provides authentication, user management, ride booking, and payment processing functionality for the UberGo platform.

## 🏗️ Architecture

Built following industry best practices with a layered architecture:

- **Routes** → **Controllers** → **Services** → **Models** → **Database**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Create .env file (see .env.example)

# Start development
npm run dev
```

## 📦 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Security**: Helmet, CORS
- **Logging**: Morgan

## 📂 Structure

```
src/
├── config/         # Configuration
├── constants/      # Constants & enums
├── types/          # TypeScript types
├── errors/         # Custom errors
├── utils/          # Utilities
├── middleware/     # Express middleware
├── models/         # Data models
├── services/       # Business logic
├── controllers/    # Request handlers
├── routes/         # Route definitions
└── database/       # Database schema
```

## 🔑 Features

- ✅ JWT Authentication
- ✅ Role-based Access Control
- ✅ Password Hashing
- ✅ Input Validation
- ✅ Error Handling
- ✅ Pagination Support
- ✅ TypeScript Support
- ✅ Database Transactions
- ✅ Security Best Practices

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## 🔐 Authentication

Include JWT token in requests:

```
Authorization: Bearer <your-token>
```

## 📝 Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🗂️ Scripts

```bash
npm run dev          # Development server
npm run build        # Build for production
npm start            # Production server
npm run lint         # Lint code
npm run lint:fix     # Fix lint errors
npm run format       # Format code
npm run db:setup     # Setup database
```

## 📚 Documentation

- **STRUCTURE_GUIDE.md** - Architecture details
- **PROJECT_SETUP.md** - Setup instructions

## 🔧 Configuration

Environment variables in `.env`:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_NAME=ubergo
JWT_SECRET=your-secret
```

## 🛡️ Security

- JWT token authentication
- Password hashing with bcrypt
- Helmet security headers
- CORS configuration
- Input validation
- SQL injection prevention

## 📊 Database

PostgreSQL with the following tables:
- users
- drivers
- rides
- payments
- ratings

## 🤝 Contributing

1. Follow the existing structure
2. Use TypeScript
3. Write clean, documented code
4. Handle errors properly
5. Test your changes

## 📄 License

Private - UberGo Project

---

Built with ❤️ using Node.js + TypeScript + PostgreSQL

