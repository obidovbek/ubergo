# Quick Fix Commands - Password Authentication Error

## 🚀 Fast Fix (Copy & Paste These Commands)

### Step 1: Create .env File
```powershell
cd D:\projects\UberGo
copy env_content .env
```

### Step 2: Stop and Remove Old Database
```powershell
cd infra\compose
docker-compose -f docker-compose.dev.yml down -v
```

### Step 3: Start Fresh
```powershell
docker-compose -f docker-compose.dev.yml up --build
```

### Step 4: Verify (in new terminal)
```powershell
curl http://localhost:4001/health
```

---

## 📋 Expected Output

You should see:
```
✅ Database connection established successfully
✅ Sequelize: Database connection established successfully
🚀 Server running on port 4000
```

---

## 🔍 If Still Not Working

### Check if .env exists:
```powershell
cd D:\projects\UberGo
dir .env
```

### Remove volumes manually:
```powershell
docker volume rm ubexgo_postgres_data_dev
```

### Check running containers:
```powershell
docker ps -a
```

### View logs:
```powershell
cd infra\compose
docker-compose -f docker-compose.dev.yml logs -f api
```

---

## ✅ Success Checklist
- [ ] `.env` file exists in `D:\projects\UberGo\.env`
- [ ] Old volumes removed with `-v` flag
- [ ] Containers rebuilt with `--build` flag
- [ ] See ✅ success messages in logs
- [ ] Health endpoint returns `{"status":"ok"}`

---

## 🆘 Emergency Reset
If everything fails, run this:
```powershell
cd D:\projects\UberGo\infra\compose
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
cd D:\projects\UberGo
copy env_content .env
cd infra\compose
docker-compose -f docker-compose.dev.yml up --build
```

