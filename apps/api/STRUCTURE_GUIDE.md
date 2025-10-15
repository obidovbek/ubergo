# UberGo API - Backend Structure Guide

This document explains the backend API structure following Node.js/Express best practices.

## 📁 Project Structure

```
api/src/
├── config/                 # Configuration files
│   ├── index.ts           # Main configuration
│   └── database.ts        # Database connection
│
├── constants/              # Application constants
│   └── index.ts           # Enums and constants
│
├── types/                  # TypeScript type definitions
│   └── index.ts           # Interfaces and types
│
├── errors/                 # Custom error classes
│   └── AppError.ts        # Error definitions
│
├── utils/                  # Utility functions
│   ├── jwt.ts             # JWT utilities
│   ├── password.ts        # Password hashing
│   ├── response.ts        # Response helpers
│   └── validation.ts      # Validation helpers
│
├── middleware/             # Express middleware
│   ├── auth.ts            # Authentication middleware
│   ├── errorHandler.ts    # Error handling
│   └── validator.ts       # Request validation
│
├── models/                 # Data models (DB operations)
│   └── User.ts            # User model
│
├── services/               # Business logic layer
│   ├── AuthService.ts     # Auth business logic
│   └── UserService.ts     # User business logic
│
├── controllers/            # Request handlers
│   ├── AuthController.ts  # Auth endpoints
│   └── UserController.ts  # User endpoints
│
├── routes/                 # Route definitions
│   ├── index.ts           # Main router
│   ├── auth.routes.ts     # Auth routes
│   └── user.routes.ts     # User routes
│
├── database/               # Database related files
│   └── schema.sql         # Database schema
│
├── validators/             # Request validators
│
├── app.ts                  # Express app setup
└── index.ts                # Server entry point
```

## 🏗️ Architecture Layers

### 1. **Routes Layer** (`/routes`)
- Defines API endpoints
- Maps HTTP methods to controllers
- Applies middleware (auth, validation)

**Example**:
```typescript
router.post('/login', validateLogin, AuthController.login);
```

### 2. **Controllers Layer** (`/controllers`)
- Handles HTTP requests and responses
- Validates request data
- Calls service layer
- Returns formatted responses

**Example**:
```typescript
static async login(req, res, next) {
  const result = await AuthService.login(email, password);
  successResponse(res, result);
}
```

### 3. **Services Layer** (`/services`)
- Contains business logic
- Orchestrates data operations
- Handles complex workflows
- Calls models for data access

**Example**:
```typescript
static async login(email, password) {
  const user = await UserModel.findByEmail(email);
  // Business logic here
  return { user, token };
}
```

### 4. **Models Layer** (`/models`)
- Database operations (CRUD)
- Data transformation
- Query building
- No business logic

**Example**:
```typescript
static async findByEmail(email) {
  return await pool.query('SELECT * FROM users WHERE email = $1', [email]);
}
```

## 🔑 Key Concepts

### Middleware
Middleware functions process requests before they reach controllers:
- **Authentication**: Verify JWT tokens
- **Authorization**: Check user permissions
- **Validation**: Validate request data
- **Error Handling**: Catch and format errors

### Error Handling
Custom error classes extend `AppError`:
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)

### Response Format
Standardized API responses:

**Success**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

**Paginated**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

## 🔐 Authentication Flow

1. User sends credentials to `/api/auth/login`
2. Controller validates input
3. Service verifies credentials
4. Service generates JWT token
5. Token returned to client
6. Client includes token in `Authorization` header
7. Middleware verifies token on protected routes

## 📊 Database Schema

### Tables
- **users**: User accounts
- **drivers**: Driver profiles
- **rides**: Ride requests and history
- **payments**: Payment transactions
- **ratings**: Driver ratings

### Relationships
- User → Driver (1:1)
- User → Rides (1:many)
- Driver → Rides (1:many)
- Ride → Payment (1:1)
- Ride → Rating (1:1)

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## 📝 Best Practices

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Error Handling**: Use custom error classes
3. **Validation**: Validate all inputs
4. **Security**: Hash passwords, use JWT, sanitize inputs
5. **Type Safety**: Use TypeScript interfaces
6. **Async/Await**: Handle promises properly
7. **Environment Variables**: Use `.env` for configuration
8. **Logging**: Log important operations
9. **Testing**: Write unit and integration tests

## 🔧 Configuration

Environment variables (`.env`):
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ubergo
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [JWT Documentation](https://jwt.io/)

