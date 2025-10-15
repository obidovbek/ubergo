# Sequelize Setup Guide

This guide explains how to use Sequelize ORM in the UberGo API backend.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Models](#models)
4. [Migrations](#migrations)
5. [Seeders](#seeders)
6. [Usage](#usage)
7. [Best Practices](#best-practices)

## Installation

Sequelize and its dependencies are already installed. If you need to reinstall:

```bash
cd apps/api
npm install sequelize pg pg-hstore
npm install --save-dev sequelize-cli
```

## Configuration

### Directory Structure

```
apps/api/
  src/
    database/
      config.js           # Sequelize configuration
      models/
        index.ts          # Models initialization
        User.ts           # User model
        Driver.ts         # Driver model
        Ride.ts           # Ride model
        Payment.ts        # Payment model
        Rating.ts         # Rating model
      migrations/         # Database migrations
      seeders/            # Database seeders
  .sequelizerc           # Sequelize CLI configuration
```

### Configuration Files

**`.sequelizerc`** - Tells Sequelize CLI where to find files:
```javascript
const path = require('path');

module.exports = {
  'config': path.resolve('src', 'database', 'config.js'),
  'models-path': path.resolve('src', 'database', 'models'),
  'seeders-path': path.resolve('src', 'database', 'seeders'),
  'migrations-path': path.resolve('src', 'database', 'migrations')
};
```

**`src/database/config.js`** - Database connection settings:
- Reads from global `.env` file
- Supports development, test, and production environments
- Configures connection pooling and SSL

## Models

### Model Structure

Each model extends Sequelize's `Model` class and includes:

1. **Attributes Interface** - TypeScript type definitions
2. **Model Class** - Sequelize model definition
3. **initModel()** - Static method to initialize the model
4. **associate()** - Static method to define relationships

### Example Model

```typescript
import { Model, DataTypes, Sequelize } from 'sequelize';

class User extends Model {
  public id!: string;
  public name!: string;
  public email!: string;

  static initModel(sequelize: Sequelize): typeof User {
    User.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
    }, {
      sequelize,
      tableName: 'users',
      modelName: 'User',
    });
    return User;
  }

  static associate(): void {
    // Define relationships
  }
}
```

### Available Models

1. **User** - User accounts (admin, user, driver)
2. **Driver** - Driver profiles and vehicle information
3. **Ride** - Ride requests and details
4. **Payment** - Payment transactions
5. **Rating** - Ride ratings and reviews

### Model Relationships

```
User (1) ──── (1) Driver
User (1) ──── (N) Ride
Driver (1) ──── (N) Ride
Ride (1) ──── (1) Payment
Ride (1) ──── (1) Rating
User (1) ──── (N) Payment
User (1) ──── (N) Rating
Driver (1) ──── (N) Rating
```

## Migrations

### What are Migrations?

Migrations are version control for your database schema. They allow you to:
- Create/modify/delete tables
- Add/remove columns
- Create indexes
- Maintain database history

### Available Migrations

1. `20241015000001-create-users.js` - Creates users table
2. `20241015000002-create-drivers.js` - Creates drivers table
3. `20241015000003-create-rides.js` - Creates rides table
4. `20241015000004-create-payments.js` - Creates payments table
5. `20241015000005-create-ratings.js` - Creates ratings table

### Migration Commands

```bash
# Run all pending migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Undo all migrations
npm run db:migrate:undo:all
```

### Creating a New Migration

```bash
# Using Sequelize CLI
npx sequelize-cli migration:generate --name add-column-to-users

# This creates a new migration file in src/database/migrations/
```

### Migration Example

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  },
};
```

## Seeders

### What are Seeders?

Seeders populate your database with initial or test data.

### Available Seeders

1. `20241015000001-demo-users.js` - Creates demo users (admin, users, drivers)
2. `20241015000002-demo-drivers.js` - Creates demo driver profiles
3. `20241015000003-demo-rides.js` - Creates demo rides

### Seeder Commands

```bash
# Run all seeders
npm run db:seed

# Undo all seeders
npm run db:seed:undo

# Reset database (undo all migrations, run migrations, run seeders)
npm run db:reset
```

### Creating a New Seeder

```bash
# Using Sequelize CLI
npx sequelize-cli seed:generate --name demo-data

# This creates a new seeder file in src/database/seeders/
```

### Seeder Example

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'John Doe',
        email: 'john@example.com',
        created_at: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
```

## Usage

### Importing Models

```typescript
import { User, Driver, Ride } from './database/models';
```

### Basic CRUD Operations

#### Create

```typescript
// Create a new user
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+998901234567',
  password: hashedPassword,
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
});
```

#### Read

```typescript
// Find all users
const users = await User.findAll();

// Find by primary key
const user = await User.findByPk(userId);

// Find with conditions
const user = await User.findOne({
  where: { email: 'john@example.com' }
});

// Find with associations
const user = await User.findByPk(userId, {
  include: ['driver', 'rides']
});
```

#### Update

```typescript
// Update instance
await user.update({ name: 'Jane Doe' });

// Update with conditions
await User.update(
  { status: UserStatus.INACTIVE },
  { where: { id: userId } }
);
```

#### Delete

```typescript
// Delete instance
await user.destroy();

// Delete with conditions
await User.destroy({
  where: { status: UserStatus.INACTIVE }
});
```

### Advanced Queries

#### Pagination

```typescript
const { count, rows } = await User.findAndCountAll({
  limit: 10,
  offset: 0,
  order: [['created_at', 'DESC']],
});
```

#### Filtering

```typescript
import { Op } from 'sequelize';

const users = await User.findAll({
  where: {
    role: UserRole.USER,
    status: {
      [Op.in]: [UserStatus.ACTIVE, UserStatus.PENDING]
    },
    created_at: {
      [Op.gte]: new Date('2024-01-01')
    }
  }
});
```

#### Associations

```typescript
// Include related data
const ride = await Ride.findByPk(rideId, {
  include: [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email']
    },
    {
      model: Driver,
      as: 'driver',
      include: ['user']
    },
    'payment',
    'rating'
  ]
});
```

#### Transactions

```typescript
import { sequelize } from './database/models';

const t = await sequelize.transaction();

try {
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
  }, { transaction: t });

  const driver = await Driver.create({
    userId: user.id,
    licenseNumber: 'DL12345',
  }, { transaction: t });

  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

## Best Practices

### 1. Use Transactions for Related Operations

Always use transactions when creating/updating multiple related records:

```typescript
await sequelize.transaction(async (t) => {
  const ride = await Ride.create(rideData, { transaction: t });
  const payment = await Payment.create(paymentData, { transaction: t });
});
```

### 2. Define Indexes

Add indexes to frequently queried columns in migrations:

```javascript
await queryInterface.addIndex('users', ['email']);
await queryInterface.addIndex('rides', ['status']);
```

### 3. Use Validation

Define validation rules in models:

```typescript
email: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  validate: {
    isEmail: true,
  },
}
```

### 4. Handle Soft Deletes

Enable paranoid mode for soft deletes:

```typescript
User.init({
  // ... attributes
}, {
  sequelize,
  tableName: 'users',
  paranoid: true, // Adds deletedAt column
});
```

### 5. Use Raw Queries Sparingly

Prefer Sequelize methods over raw SQL:

```typescript
// Good
const users = await User.findAll({ where: { status: 'active' } });

// Avoid (unless necessary)
const [users] = await sequelize.query('SELECT * FROM users WHERE status = ?', {
  replacements: ['active'],
  type: QueryTypes.SELECT
});
```

### 6. Optimize Queries

- Use `attributes` to select specific columns
- Use `include` with `attributes` to limit joined data
- Use pagination for large datasets
- Add appropriate indexes

```typescript
const users = await User.findAll({
  attributes: ['id', 'name', 'email'], // Only select needed columns
  include: [{
    model: Driver,
    as: 'driver',
    attributes: ['id', 'rating'] // Limit joined data
  }],
  limit: 20,
  offset: 0
});
```

## Troubleshooting

### Migration Errors

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Undo last migration and try again
npm run db:migrate:undo
npm run db:migrate
```

### Connection Issues

1. Verify database is running
2. Check `.env` configuration
3. Ensure database exists
4. Check network connectivity

### Model Sync Issues

Don't use `sync()` in production:

```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  await sequelize.sync({ alter: true });
}
```

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Sequelize CLI](https://github.com/sequelize/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

