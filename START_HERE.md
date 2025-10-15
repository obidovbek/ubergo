# 🎯 START HERE - Fix Your Docker Setup

## 🚨 Current Problem

You're seeing these warnings:
```
The "POSTGRES_USER" variable is not set. Defaulting to a blank string.
The "POSTGRES_PASSWORD" variable is not set. Defaulting to a blank string.
```

**Reason**: The `.env` file doesn't exist yet!

---

## ✅ THE SOLUTION (3 Commands)

Open PowerShell and run these **3 commands**:

```powershell
# 1. Go to project root
cd D:\projects\UberGo

# 2. Create .env file from template
copy env_content .env

# 3. Go to compose directory and restart
cd infra\compose
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

**That's it!** 🎉

---

## 📊 What Each Command Does

### Command 1: Navigate to Project
```powershell
cd D:\projects\UberGo
```
Goes to your project root directory.

### Command 2: Create .env File
```powershell
copy env_content .env
```
Creates the `.env` file that Docker Compose needs.

**Before:**
```
D:\projects\UberGo\
  ├── env_content     ✅ (template)
  ├── .env            ❌ (missing!)
```

**After:**
```
D:\projects\UberGo\
  ├── env_content     ✅ (template)
  ├── .env            ✅ (created!)
```

### Command 3: Restart Docker
```powershell
cd infra\compose
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```
- `down -v` = Stop and remove old database
- `up --build` = Start fresh with new configuration

---

## ✅ Success Indicators

You'll know it worked when you see:

### ✅ No Warnings
The variable warnings will be **gone**.

### ✅ Success Messages
```
ubexgo-postgres-dev | database system is ready to accept connections
ubexgo-api-dev      | ✅ Database connection established successfully
ubexgo-api-dev      | 🚀 Server running on port 4000
```

### ✅ Healthy Status
```powershell
docker ps
# STATUS column should show "healthy"
```

---

## 🔍 Quick Check

Verify `.env` was created:
```powershell
dir D:\projects\UberGo\.env
```

Should show:
```
.env
```

---

## 🎯 Full Command Block (Copy & Paste)

```powershell
cd D:\projects\UberGo
copy env_content .env
cd infra\compose
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

---

## 🆘 Troubleshooting

### Issue: "File not found" when copying
**Solution**: Make sure you're in `D:\projects\UberGo`
```powershell
cd D:\projects\UberGo
dir env_content  # Should show the file
copy env_content .env
```

### Issue: Still seeing warnings
**Solution**: Check if .env was actually created
```powershell
dir .env
type .env | Select-String "POSTGRES_USER"
# Should show: POSTGRES_USER=ubexgo
```

### Issue: "Container is unhealthy"
**Solution**: The old database has wrong password. Remove it:
```powershell
docker-compose -f docker-compose.dev.yml down -v
docker volume rm ubexgo_postgres_data_dev
docker-compose -f docker-compose.dev.yml up --build
```

---

## 📚 What's in the .env File?

The `.env` file contains all your configuration:
```env
# Database
POSTGRES_USER=ubexgo
POSTGRES_PASSWORD=ubexgo_password
POSTGRES_DB=ubexgo

# API
API_PORT=4000
JWT_SECRET=dev-secret-key...

# And more...
```

---

## 🎉 After Success

Once everything is running:

### Test the API
```powershell
curl http://localhost:4001/health
```

Expected response:
```json
{"status":"ok","timestamp":"...","environment":"development"}
```

### Access Services
- **API**: http://localhost:4001
- **Admin**: http://localhost:3001
- **PostgreSQL**: localhost:5433

### Connect to Database
```powershell
docker exec -it ubexgo-postgres-dev psql -U ubexgo -d ubexgo
```

---

## 🔐 Security Note

- ✅ `.env` is in `.gitignore` (won't be committed)
- ✅ `env_content` is the template (safe to commit)
- ✅ Never share your `.env` file
- ✅ Use different secrets in production

---

## 📖 More Information

- **Quick fix**: See [CRITICAL_FIX_NOW.md](./CRITICAL_FIX_NOW.md)
- **Detailed guide**: See [ENVIRONMENT_SETUP_COMPLETE.md](./ENVIRONMENT_SETUP_COMPLETE.md)
- **Troubleshooting**: See [FIX_DATABASE_PASSWORD_ERROR.md](./FIX_DATABASE_PASSWORD_ERROR.md)

---

## ✅ Summary

**Problem**: `.env` file doesn't exist  
**Solution**: `copy env_content .env`  
**Result**: Docker Compose can read your configuration  

**Just run these 3 commands:**
```powershell
cd D:\projects\UberGo
copy env_content .env
cd infra\compose && docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up --build
```

**Done!** 🚀

