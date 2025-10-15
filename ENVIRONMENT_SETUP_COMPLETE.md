# Environment Setup - Complete Guide

## 🎯 Overview

Your UberGo project now uses a **single global `.env` file** for all environment variables. This file is located at the project root and is used by all services (API, Admin, Docker Compose, etc.).

## 📁 File Structure

```
D:\projects\UberGo\
  ├── .env                          <-- Global environment file (YOU CREATE THIS)
  ├── env_content                   <-- Template (copy from here to .env)
  ├── infra\
  │   └── compose\
  │       ├── docker-compose.dev.yml   <-- Uses .env
  │       └── docker-compose.yml       <-- Uses .env
  ├── apps\
  │   ├── api\                      <-- Uses .env via Docker
  │   ├── admin\                    <-- Uses .env via Docker
  │   ├── driver-app\
  │   └── user-app\
  └── ...
```

## 🔧 How It Works

### 1. Global .env File
- **Location**: `D:\projects\UberGo\.env`
- **Purpose**: Single source of truth for all environment variables
- **Used by**: Docker Compose, API, Admin, and all services

### 2. Docker Compose Integration
Both `docker-compose.dev.yml` and `docker-compose.yml` now include:
```yaml
env_file:
  - ../../.env    # Loads the global .env file

environment:
  DB_USER: ${DB_USER}           # References variables from .env
  DB_PASSWORD: ${DB_PASSWORD}   # With fallback defaults
  # ... more variables
```

### 3. Variable Priority
1. **Environment variables** set directly in `docker-compose.yml`
2. **Variables from .env file** loaded via `env_file`
3. **Default values** specified with `${VAR:-default}` syntax

## 📝 Environment Variables in .env

### Database Configuration
```env
DB_HOST=postgres                    # Docker service name
DB_PORT=5432
DB_NAME=ubexgo
DB_USER=ubexgo
DB_PASSWORD=ubexgo_password
DB_DIALECT=postgres
DB_SSL=false

# PostgreSQL Docker (same credentials)
POSTGRES_USER=ubexgo
POSTGRES_PASSWORD=ubexgo_password
POSTGRES_DB=ubexgo
```

### API Configuration
```env
NODE_ENV=development
API_PORT=4000
API_PREFIX=/api
```

### JWT Configuration
```env
JWT_SECRET=dev-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production-67890
JWT_REFRESH_EXPIRES_IN=30d
```

### CORS Configuration
```env
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

### Docker Ports
```env
POSTGRES_PORT_EXTERNAL=5433    # Host → Container port mapping
API_PORT_EXTERNAL=4001
ADMIN_PORT_EXTERNAL=3001
```

### Admin Panel (Vite)
```env
VITE_API_BASE_URL=http://localhost:4001/api
VITE_API_URL=http://localhost:4001
VITE_APP_NAME=UberGo Admin
VITE_APP_VERSION=1.0.0
```

### Mobile Apps (Expo)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4001/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## 🚀 Setup Instructions

### First Time Setup

1. **Create .env file**:
   ```powershell
   cd D:\projects\UberGo
   copy env_content .env
   ```

2. **Customize if needed** (optional):
   ```powershell
   notepad .env
   # Modify any values as needed
   ```

3. **Start services**:
   ```powershell
   cd infra\compose
   docker-compose -f docker-compose.dev.yml up --build
   ```

### If You Have Existing Containers

1. **Stop and remove old containers** (IMPORTANT):
   ```powershell
   cd D:\projects\UberGo\infra\compose
   docker-compose -f docker-compose.dev.yml down -v
   ```

2. **Create .env file**:
   ```powershell
   cd D:\projects\UberGo
   copy env_content .env
   ```

3. **Start fresh**:
   ```powershell
   cd infra\compose
   docker-compose -f docker-compose.dev.yml up --build
   ```

## 🔍 Verification

### Check .env File Exists
```powershell
cd D:\projects\UberGo
dir .env
# Should show: .env
```

### Check Environment Variables Loaded
```powershell
cd infra\compose
docker-compose -f docker-compose.dev.yml config
# Shows the resolved configuration with all variables
```

### Check Service Status
```powershell
docker-compose -f docker-compose.dev.yml ps
# All services should show "Up" or "healthy"
```

### Test API Connection
```powershell
curl http://localhost:4001/health
# Expected: {"status":"ok","timestamp":"...","environment":"development"}
```

### Test Database Connection
```powershell
docker exec -it ubexgo-postgres-dev psql -U ubexgo -d ubexgo
# Should connect successfully
```

## 🎨 Benefits of This Setup

### ✅ Single Source of Truth
- All environment variables in ONE file
- No duplication across multiple files
- Easy to manage and update

### ✅ Consistent Credentials
- Database credentials match between PostgreSQL and API
- No password mismatch errors
- Same variables used everywhere

### ✅ Easy Configuration
- Change one value in `.env`, affects all services
- No need to update multiple files
- Clear and organized structure

### ✅ Environment-Specific
- Different `.env` files for dev/staging/production
- Override variables as needed
- Secure secrets management

### ✅ Docker Integration
- Docker Compose automatically reads `.env`
- Variables available in all containers
- Proper variable substitution with defaults

## 🔐 Security Best Practices

### Development
```env
# Use simple passwords for development
DB_PASSWORD=ubexgo_password
JWT_SECRET=dev-secret-key-change-in-production-12345
```

### Production
```env
# Use strong, random passwords
DB_PASSWORD=xK9mP2nQ8vL5wR7tY3zA1bC4dE6fG
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
CORS_ORIGIN=https://yourdomain.com
DB_SSL=true
LOG_LEVEL=error
```

### Never Commit .env
```gitignore
# .gitignore already includes:
.env
.env.local
.env.*.local
```

## 📚 Variable Reference

### Required Variables
These MUST be set in `.env`:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### Optional Variables
These have defaults if not set:
- `API_PORT` (default: 4000)
- `DB_PORT` (default: 5432)
- `CORS_ORIGIN` (default: *)
- `LOG_LEVEL` (default: debug)

### Port Mapping Variables
- `POSTGRES_PORT_EXTERNAL` - Host port for PostgreSQL (default: 5433)
- `API_PORT_EXTERNAL` - Host port for API (default: 4001)
- `ADMIN_PORT_EXTERNAL` - Host port for Admin (default: 3001)

## 🛠️ Common Operations

### Update Environment Variables
```powershell
# 1. Edit .env file
notepad D:\projects\UberGo\.env

# 2. Restart services to apply changes
cd D:\projects\UberGo\infra\compose
docker-compose -f docker-compose.dev.yml restart
```

### Change Database Password
```powershell
# 1. Update .env file
# Change both POSTGRES_PASSWORD and DB_PASSWORD

# 2. Remove old database volume
cd D:\projects\UberGo\infra\compose
docker-compose -f docker-compose.dev.yml down -v

# 3. Start fresh
docker-compose -f docker-compose.dev.yml up --build
```

### Switch to Production
```powershell
# 1. Update .env with production values
# 2. Use production docker-compose
cd D:\projects\UberGo\infra\compose
docker-compose up --build
```

## 📖 Related Documentation

- **[FIX_DATABASE_PASSWORD_ERROR.md](./FIX_DATABASE_PASSWORD_ERROR.md)** - Fix password authentication errors
- **[QUICK_FIX_COMMANDS.md](./QUICK_FIX_COMMANDS.md)** - Quick command reference
- **[infra/compose/README.md](./infra/compose/README.md)** - Docker Compose documentation
- **[ENV_SETUP.md](./ENV_SETUP.md)** - Detailed environment setup guide

## 🎯 Quick Start Commands

```powershell
# Navigate to project
cd D:\projects\UberGo

# Create .env from template
copy env_content .env

# Start services
cd infra\compose
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## ✅ Setup Complete!

Your environment is now configured with:
- ✅ Single global `.env` file
- ✅ Consistent credentials across all services
- ✅ Docker Compose integration
- ✅ Proper variable substitution
- ✅ Health checks for reliable startup
- ✅ Clear documentation

**Next Steps**:
1. Create `.env` file from `env_content`
2. Start services with Docker Compose
3. Verify all services are running
4. Begin development! 🚀

