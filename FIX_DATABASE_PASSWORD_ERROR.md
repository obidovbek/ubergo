# Fix: Password Authentication Failed for User "ubexgo"

## 🚨 Current Error
```
error: password authentication failed for user "ubexgo"
code: '28P01'
```

## 🔍 Root Cause
The PostgreSQL container was previously created with different credentials. When you try to start it with new credentials, the old password in the volume conflicts with the new one.

## ✅ Complete Solution

### Step 1: Copy Environment Variables to .env File

1. **Open the file**: `D:\projects\UberGo\env_content`
2. **Copy ALL the content** from that file
3. **Create a new file**: `D:\projects\UberGo\.env` (note the dot at the beginning)
4. **Paste the content** into the `.env` file
5. **Save the file**

The `.env` file should be in the project root:
```
D:\projects\UberGo\
  ├── .env          <-- Create this file
  ├── env_content   <-- Copy from here
  ├── apps\
  ├── infra\
  └── ...
```

### Step 2: Stop and Remove Old Containers with Volumes

This is **CRITICAL** - you must remove the old PostgreSQL volume with the old password:

```powershell
cd D:\projects\UberGo\infra\compose

# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Remove containers AND volumes (this deletes the old database with wrong password)
docker-compose -f docker-compose.dev.yml down -v
```

⚠️ **Important**: The `-v` flag will delete the database volume. This is necessary to fix the password issue.

### Step 3: Verify .env File Exists

```powershell
# Check if .env file exists in project root
cd D:\projects\UberGo
dir .env

# If it exists, you should see:
# .env
```

If the file doesn't exist, create it now with the content from `env_content`.

### Step 4: Rebuild and Start Containers

```powershell
cd D:\projects\UberGo\infra\compose

# Rebuild and start all services
docker-compose -f docker-compose.dev.yml up --build
```

### Step 5: Verify Success

Watch the logs. You should see:
```
ubexgo-postgres-dev | PostgreSQL init process complete; ready for start up.
ubexgo-postgres-dev | database system is ready to accept connections
ubexgo-api-dev      | ✅ Database connection established successfully
ubexgo-api-dev      | ✅ Sequelize: Database connection established successfully
ubexgo-api-dev      | 🚀 Server running on port 4000
```

### Step 6: Test the Connection

Open a new PowerShell window:

```powershell
# Test API health endpoint
curl http://localhost:4001/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-15T...","environment":"development"}
```

## 📋 What Changed

### 1. Global .env File
All environment variables are now in ONE place: `D:\projects\UberGo\.env`

### 2. Docker Compose Files Updated
Both `docker-compose.dev.yml` and `docker-compose.yml` now:
- Use `env_file: - ../../.env` to load the global .env file
- Reference variables using `${VARIABLE_NAME}` syntax
- Have default fallback values using `${VARIABLE_NAME:-default}`

### 3. Consistent Credentials
```env
# PostgreSQL credentials (from .env)
POSTGRES_USER=ubexgo
POSTGRES_PASSWORD=ubexgo_password
POSTGRES_DB=ubexgo

# API uses the same credentials
DB_USER=ubexgo
DB_PASSWORD=ubexgo_password
DB_NAME=ubexgo
```

## 🔧 Troubleshooting

### Issue: .env file not found
**Error**: `WARNING: The POSTGRES_USER variable is not set`

**Solution**:
```powershell
cd D:\projects\UberGo
# Create .env file from env_content
copy env_content .env
```

### Issue: Still getting password error
**Solution**: Make sure you removed the old volume:
```powershell
cd infra\compose
docker-compose -f docker-compose.dev.yml down -v
docker volume ls
# If you see ubexgo_postgres_data_dev, remove it:
docker volume rm ubexgo_postgres_data_dev
# Then start again:
docker-compose -f docker-compose.dev.yml up --build
```

### Issue: Port already in use
**Solution**:
```powershell
# Find process using port 4001
netstat -ano | findstr :4001
# Kill the process or change POSTGRES_PORT_EXTERNAL in .env
```

### Issue: Can't create .env file (file is ignored)
**Solution**: 
The `.env` file is in `.gitignore`, which is correct. You need to create it manually:
```powershell
cd D:\projects\UberGo
notepad .env
# Paste content from env_content
# Save and close
```

## 📝 Quick Commands Reference

```powershell
# Navigate to compose directory
cd D:\projects\UberGo\infra\compose

# Stop containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (REQUIRED for password fix)
docker-compose -f docker-compose.dev.yml down -v

# Start services
docker-compose -f docker-compose.dev.yml up -d

# Start with rebuild
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# View API logs only
docker-compose -f docker-compose.dev.yml logs -f api

# View PostgreSQL logs only
docker-compose -f docker-compose.dev.yml logs -f postgres

# Check container status
docker-compose -f docker-compose.dev.yml ps

# Connect to PostgreSQL
docker exec -it ubexgo-postgres-dev psql -U ubexgo -d ubexgo

# Run migrations
docker exec -it ubexgo-api-dev npm run db:migrate
```

## 🎯 Verification Checklist

- [ ] Created `.env` file in `D:\projects\UberGo\.env`
- [ ] Copied all content from `env_content` to `.env`
- [ ] Stopped containers: `docker-compose -f docker-compose.dev.yml down`
- [ ] Removed volumes: `docker-compose -f docker-compose.dev.yml down -v`
- [ ] Started containers: `docker-compose -f docker-compose.dev.yml up --build`
- [ ] Saw success messages in logs (✅ Database connection established)
- [ ] Tested health endpoint: `curl http://localhost:4001/health`
- [ ] Can connect to database: `docker exec -it ubexgo-postgres-dev psql -U ubexgo -d ubexgo`

## 🌐 Service Access URLs

After successful startup:
- **API**: http://localhost:4001
- **Admin**: http://localhost:3001
- **API Health**: http://localhost:4001/health
- **PostgreSQL**: localhost:5433 (from host machine)

## 📚 Environment Variables Structure

The `.env` file contains:
```env
# Database credentials (used by both PostgreSQL and API)
POSTGRES_USER=ubexgo
POSTGRES_PASSWORD=ubexgo_password
POSTGRES_DB=ubexgo
DB_USER=ubexgo
DB_PASSWORD=ubexgo_password
DB_NAME=ubexgo

# API configuration
API_PORT=4000
JWT_SECRET=dev-secret-key-change-in-production-12345
# ... and more
```

Docker Compose reads from `.env` automatically when you run commands from the `infra/compose` directory.

## 🔐 Security Notes

1. **Never commit `.env` to Git** - It's already in `.gitignore`
2. **Change secrets in production** - The dev secrets are just placeholders
3. **Use strong passwords** - For production, generate random secure passwords
4. **Rotate secrets regularly** - Especially JWT secrets

## ✅ Success Indicators

When everything is working correctly, you'll see:

```
ubexgo-postgres-dev | LOG:  database system is ready to accept connections
ubexgo-api-dev      | ✅ Database connection established successfully
ubexgo-api-dev      | ✅ Sequelize: Database connection established successfully
ubexgo-api-dev      | 🚀 Server running on port 4000
ubexgo-api-dev      | 📝 Environment: development
ubexgo-api-dev      | 🔗 API: http://localhost:4000/api
```

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check .env file location**: Must be at `D:\projects\UberGo\.env`
2. **Verify .env content**: Should have all variables from `env_content`
3. **Ensure volumes are removed**: `docker volume ls` should not show old volumes
4. **Check Docker Desktop**: Make sure it's running
5. **Review logs**: `docker-compose -f docker-compose.dev.yml logs`

## 📖 Related Documentation

- [infra/compose/README.md](./infra/compose/README.md) - Docker Compose setup
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables guide
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Project setup guide

---

**Summary**: The password error occurs because the old PostgreSQL volume has the old password. The fix is to:
1. Create `.env` file from `env_content`
2. Remove old volumes with `docker-compose down -v`
3. Restart with `docker-compose up --build`

