# Implementation Notes - Sequelize Setup

## Important Configuration Changes

### ES Modules (type: "module")

The API package has been configured to use ES modules (`"type": "module"` in package.json). This means:

1. **All imports must include file extensions:**
   ```typescript
   // ✅ Correct
   import { config } from './config/index.js';
   import User from './models/User.js';
   
   // ❌ Wrong
   import { config } from './config';
   import User from './models/User';
   ```

2. **CommonJS files must use .cjs extension:**
   - `config.js` → `config.cjs`
   - All migration files: `*.cjs`
   - All seeder files: `*.cjs`
   - `.sequelizerc` remains `.js` (CommonJS)

3. **Use `import.meta.url` instead of `__dirname`:**
   ```typescript
   import { fileURLToPath } from 'url';
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   ```

### File Extensions Summary

| File Type | Extension | Module Type |
|-----------|-----------|-------------|
| TypeScript source | `.ts` | ES Module |
| Compiled JavaScript | `.js` | ES Module |
| Sequelize config | `.cjs` | CommonJS |
| Migrations | `.cjs` | CommonJS |
| Seeders | `.cjs` | CommonJS |
| .sequelizerc | `.js` | CommonJS |

## Files Created/Modified

### Configuration Files

1. **`.sequelizerc`** - Points to `.cjs` config file
2. **`src/database/config.cjs`** - Database configuration (CommonJS)
3. **`src/config/index.ts`** - Application configuration (ES Module)
4. **`src/constants/index.ts`** - Enums and constants

### Models (ES Modules with .js imports)

1. **`src/database/models/index.ts`** - Sequelize initialization
2. **`src/database/models/User.ts`** - User model
3. **`src/database/models/Driver.ts`** - Driver model
4. **`src/database/models/Ride.ts`** - Ride model
5. **`src/database/models/Payment.ts`** - Payment model
6. **`src/database/models/Rating.ts`** - Rating model

### Migrations (CommonJS .cjs files)

1. **`20241015000001-create-users.cjs`**
2. **`20241015000002-create-drivers.cjs`**
3. **`20241015000003-create-rides.cjs`**
4. **`20241015000004-create-payments.cjs`**
5. **`20241015000005-create-ratings.cjs`**

### Seeders (CommonJS .cjs files)

1. **`20241015000001-demo-users.cjs`**
2. **`20241015000002-demo-drivers.cjs`**
3. **`20241015000003-demo-rides.cjs`**

### Application Files

1. **`src/app.ts`** - Updated with Sequelize and typed parameters
2. **`src/middleware/errorHandler.ts`** - Error handling
3. **`src/routes/index.ts`** - Base routes

## Known Issues and Solutions

### Issue: "Cannot find module" errors

**Cause:** Dependencies not installed yet.

**Solution:**
```bash
cd apps/api
npm install
```

### Issue: Import path errors

**Cause:** Missing `.js` extension in imports.

**Solution:** All relative imports must include `.js` extension:
```typescript
import { config } from './config/index.js';  // ✅
import { config } from './config';           // ❌
```

### Issue: Sequelize CLI not working

**Cause:** Sequelize CLI expects CommonJS files.

**Solution:** All migrations, seeders, and config use `.cjs` extension.

### Issue: __dirname is not defined

**Cause:** ES modules don't have `__dirname`.

**Solution:** Use this pattern:
```typescript
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## Running the Application

### First Time Setup

```bash
# 1. Install dependencies
cd apps/api
npm install

# 2. Create .env file
cp ../../.env.example ../../.env
# Edit .env with your database credentials

# 3. Create database
createdb ubergo

# 4. Run migrations
npm run db:migrate

# 5. (Optional) Seed demo data
npm run db:seed

# 6. Start development server
npm run dev
```

### Development Workflow

```bash
# Start server
npm run dev

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

## TypeScript Configuration

The `tsconfig.json` is configured with:

- **module:** `"nodenext"` - For ES modules
- **target:** `"esnext"` - Modern JavaScript
- **verbatimModuleSyntax:** `true` - Strict module syntax
- **strict:** `true` - Strict type checking
- **skipLibCheck:** `true` - Skip library type checking

## Environment Variables

Required in `.env`:

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

## Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp ../../.env.example ../../.env
   # Edit .env
   ```

3. **Create database:**
   ```bash
   createdb ubergo
   ```

4. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Start development:**
   ```bash
   npm run dev
   ```

## Additional Notes

### Why ES Modules?

- Modern JavaScript standard
- Better tree-shaking
- Native browser support
- Future-proof

### Why .cjs for Sequelize files?

- Sequelize CLI is built for CommonJS
- Migrations and seeders need to be executable by Sequelize CLI
- Keeping them as `.cjs` ensures compatibility

### Import Best Practices

1. Always use `.js` extension for relative imports
2. No extension needed for node_modules imports
3. Use `index.js` explicitly when importing from directories
4. Keep imports organized (external → internal → types)

## Troubleshooting

### Linter Errors

Most linter errors about "Cannot find module" will resolve after running `npm install`.

### Migration Errors

If migrations fail:
```bash
npm run db:migrate:undo:all
npm run db:migrate
```

### Module Resolution Errors

If you see "Cannot find module" for local files, check:
1. File extension is `.js` in import
2. Path is correct
3. File exists

## Documentation

For more information, see:
- `SEQUELIZE_GUIDE.md` - Complete Sequelize guide
- `QUICK_REFERENCE.md` - Command reference
- `SEQUELIZE_SETUP_SUMMARY.md` - Setup overview
- `../../GETTING_STARTED.md` - Quick start guide
- `../../SETUP_INSTRUCTIONS.md` - Detailed setup

## Summary

✅ Sequelize configured with ES modules  
✅ All models use TypeScript  
✅ Migrations and seeders use CommonJS (.cjs)  
✅ Proper file extensions in all imports  
✅ Configuration ready for development  
✅ Documentation complete  

**Status:** Ready for `npm install` and database setup!

