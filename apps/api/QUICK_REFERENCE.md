# UberGo API - Quick Reference

Quick reference guide for common commands and operations.

## Table of Contents

- [NPM Scripts](#npm-scripts)
- [Database Commands](#database-commands)
- [Sequelize CLI](#sequelize-cli)
- [Common Operations](#common-operations)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)

## NPM Scripts

### Development

```bash
# Start development server (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Database

```bash
# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Run seeders
npm run db:seed

# Undo seeders
npm run db:seed:undo

# Reset database (undo all, migrate, seed)
npm run db:reset
```

## Database Commands

### PostgreSQL

```bash
# Connect to database
psql -U postgres -d ubergo

# List databases
psql -U postgres -l

# Create database
createdb ubergo

# Drop database (careful!)
dropdb ubergo

# Backup database
pg_dump ubergo > backup.sql

# Restore database
psql ubergo < backup.sql
```

### Common SQL Queries

```sql
-- List all tables
\dt

-- Describe table structure
\d users

-- Count records
SELECT COUNT(*) FROM users;

-- View recent users
SELECT id, name, email, role FROM users ORDER BY created_at DESC LIMIT 10;

-- Check migrations
SELECT * FROM "SequelizeMeta";

-- Delete all data (careful!)
TRUNCATE users, drivers, rides, payments, ratings CASCADE;
```

## Sequelize CLI

### Migrations

```bash
# Create new migration
npx sequelize-cli migration:generate --name migration-name

# Run all pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Check migration status
npx sequelize-cli db:migrate:status
```

### Seeders

```bash
# Create new seeder
npx sequelize-cli seed:generate --name seeder-name

# Run all seeders
npx sequelize-cli db:seed:all

# Run specific seeder
npx sequelize-cli db:seed --seed 20241015000001-demo-users.js

# Undo all seeders
npx sequelize-cli db:seed:undo:all

# Undo specific seeder
npx sequelize-cli db:seed:undo --seed 20241015000001-demo-users.js
```

## Common Operations

### Using Models

```typescript
import { User, Driver, Ride } from './database/models';

// Create
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+998901234567',
  password: hashedPassword,
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
});

// Find by ID
const user = await User.findByPk(userId);

// Find one
const user = await User.findOne({
  where: { email: 'john@example.com' }
});

// Find all
const users = await User.findAll({
  where: { role: UserRole.USER },
  limit: 10,
  order: [['created_at', 'DESC']]
});

// Update
await user.update({ name: 'Jane Doe' });

// Delete
await user.destroy();

// With associations
const user = await User.findByPk(userId, {
  include: ['driver', 'rides']
});
```

### Transactions

```typescript
import { sequelize } from './database/models';

const t = await sequelize.transaction();

try {
  const user = await User.create(userData, { transaction: t });
  const driver = await Driver.create(driverData, { transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

### Queries with Operators

```typescript
import { Op } from 'sequelize';

// Find users created in the last 7 days
const users = await User.findAll({
  where: {
    created_at: {
      [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  }
});

// Find active or pending users
const users = await User.findAll({
  where: {
    status: {
      [Op.in]: [UserStatus.ACTIVE, UserStatus.PENDING]
    }
  }
});

// Find users with email containing 'example'
const users = await User.findAll({
  where: {
    email: {
      [Op.like]: '%example%'
    }
  }
});
```

## API Endpoints

### Health Check

```bash
# Check API health
curl http://localhost:3000/health

# Check API info
curl http://localhost:3000/api
```

### Authentication (TODO)

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Users (TODO)

```bash
# Get all users
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get user by ID
curl http://localhost:3000/api/users/:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Environment Variables

### Required Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ubergo
DB_USER=postgres
DB_PASSWORD=your_password

# API
API_PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
```

### Loading Environment Variables

```typescript
import { config } from './config';

// Access variables
const dbHost = config.database.host;
const apiPort = config.server.port;
const jwtSecret = config.jwt.secret;
```

## Docker Commands

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose up --build api
```

## Troubleshooting

### Clear Cache and Reinstall

```bash
# Remove node_modules
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

### Reset Database

```bash
# Drop and recreate database
dropdb ubergo
createdb ubergo

# Run migrations and seeders
npm run db:migrate
npm run db:seed
```

### Check Ports

```bash
# Linux/Mac - Check if port 3000 is in use
lsof -i :3000

# Windows - Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process on port 3000 (Linux/Mac)
kill -9 $(lsof -t -i:3000)
```

### View Logs

```bash
# View API logs
tail -f logs/api.log

# View PostgreSQL logs (Linux)
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# View Docker logs
docker-compose logs -f
```

## Useful Git Commands

```bash
# Check status
git status

# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "Your commit message"

# Push to remote
git push origin feature/your-feature

# Pull latest changes
git pull origin main

# Stash changes
git stash
git stash pop
```

## Testing

### Manual Testing

```bash
# Test database connection
psql -U postgres -d ubergo -c "SELECT 1"

# Test API health
curl http://localhost:3000/health

# Test with JSON data
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

### Using Postman/Insomnia

1. Import API collection
2. Set environment variables
3. Test endpoints
4. Save requests

## Performance Tips

### Database Optimization

```typescript
// Use indexes
await queryInterface.addIndex('users', ['email']);

// Select specific columns
const users = await User.findAll({
  attributes: ['id', 'name', 'email']
});

// Use pagination
const users = await User.findAll({
  limit: 20,
  offset: page * 20
});

// Use eager loading
const users = await User.findAll({
  include: [{
    model: Driver,
    as: 'driver',
    attributes: ['id', 'rating']
  }]
});
```

### API Optimization

```typescript
// Use async/await
const users = await User.findAll();

// Use Promise.all for parallel operations
const [users, drivers, rides] = await Promise.all([
  User.findAll(),
  Driver.findAll(),
  Ride.findAll()
]);

// Use caching (Redis)
const cachedData = await redis.get(key);
if (cachedData) return JSON.parse(cachedData);
```

## Security Checklist

- [ ] Use strong JWT secrets
- [ ] Hash passwords with bcrypt
- [ ] Validate all inputs
- [ ] Use HTTPS in production
- [ ] Enable CORS properly
- [ ] Use rate limiting
- [ ] Sanitize user inputs
- [ ] Use prepared statements (Sequelize does this)
- [ ] Keep dependencies updated
- [ ] Don't commit .env file

## Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Demo Credentials

After running seeders, you can use these credentials:

```
Admin:
Email: admin@ubergo.com
Password: password123

User:
Email: john@example.com
Password: password123

Driver:
Email: mike@example.com
Password: password123
```

**⚠️ Change these in production!**

