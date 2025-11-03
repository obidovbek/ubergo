# UberGo Docker Compose Setup

This directory contains Docker Compose configurations for running the entire UberGo application stack.

## ⚠️ IMPORTANT: Environment Setup Required

Before running Docker Compose, you MUST create a `.env` file:

```powershell
cd D:\projects\UberGo
copy env_content .env
```

All environment variables are now managed in a **single global `.env` file** at the project root.

See [ENVIRONMENT_SETUP_COMPLETE.md](../../ENVIRONMENT_SETUP_COMPLETE.md) for detailed setup instructions.

## Services

### Production Stack (`docker-compose.yml`)

- **PostgreSQL 17** - Main database (port 5432)
- **API** - Backend Node.js/TypeScript API (port 4000)
- **Admin** - React admin dashboard (port 3000 → 80)
- **Nginx** - Reverse proxy (port 80/443)

### Development Stack (`docker-compose.dev.yml`)

- **PostgreSQL 17** - Main database (port 5433 → 5432)
- **API** - Backend with hot reload enabled (port 4001 → 4000)
- **Admin** - React admin with hot reload (port 3001 → 5173)

## Quick Start

### Development Environment (Recommended)

1. **Start all services**:
   ```bash
   cd infra/compose
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **View logs**:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

3. **Stop services**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Production Environment

1. **Start all services**:
   ```bash
   cd infra/compose
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f
   ```

3. **Stop services**:
   ```bash
   docker-compose down
   ```

## Common Commands

### Start Services
```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d

# Start specific service
docker-compose -f docker-compose.dev.yml up -d api
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f admin
```

### Stop Services
```bash
# Stop all
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (⚠️ deletes data)
docker-compose -f docker-compose.dev.yml down -v
```

### Restart Services
```bash
# Restart all
docker-compose -f docker-compose.dev.yml restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart api
```

### Rebuild Services
```bash
# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build

# Force rebuild (no cache)
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

## Accessing Services

### Development (docker-compose.dev.yml)
- **API**: http://localhost:4001
- **Admin Dashboard**: http://localhost:3001
- **PostgreSQL**: localhost:5433
- **API Health Check**: http://localhost:4001/health

### Production (docker-compose.yml)
- **Nginx Reverse Proxy**: http://localhost
- **Admin Dashboard**: http://localhost (served by Nginx)
- **API**: http://localhost/api (proxied by Nginx)
- **Direct Admin Access**: http://localhost:3000
- **Direct API Access**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **API Health Check**: http://localhost:4000/health

## Database Management

### Connect to PostgreSQL

**Development**:
```bash
docker exec -it ubexgo-postgres-dev psql -U ubexgo -d ubexgo
```

**Production**:
```bash
docker exec -it ubexgo-postgres psql -U ubexgo -d ubexgo
```

### Run Database Migrations

**Development**:
```bash
docker exec -it ubexgo-api-dev npm run db:migrate
```

**Production**:
```bash
docker exec -it ubexgo-api npm run db:migrate
```

### Run Database Seeds

```bash
docker exec -it ubexgo-api-dev npm run db:seed
```

### Reset Database

```bash
docker exec -it ubexgo-api-dev npm run db:reset
```

## Environment Variables

Environment variables are configured directly in the `docker-compose.yml` files.

### Development Environment Variables (docker-compose.dev.yml)
All necessary environment variables are pre-configured:
- `DB_HOST=postgres` (Docker service name)
- `DB_PORT=5432`
- `DB_NAME=ubexgo`
- `DB_USER=ubexgo`
- `DB_PASSWORD=ubexgo_password`
- `JWT_SECRET=dev-secret-key-change-in-production`
- And more...

### Production Environment Variables (docker-compose.yml)
For production, you can override sensitive values by creating a `.env` file in this directory:

```env
# JWT Secrets (REQUIRED for production)
JWT_SECRET=your-strong-production-secret-here
JWT_REFRESH_SECRET=your-strong-refresh-secret-here

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Database (if using external database)
DB_HOST=your-db-host
DB_PASSWORD=your-secure-password
```

Then the docker-compose.yml will use these values:
```yaml
environment:
  JWT_SECRET: ${JWT_SECRET:-change-this-secret-in-production}
```

## Network

All services communicate through Docker bridge networks:
- **Development**: `ubexgo-network-dev`
- **Production**: `ubexgo-network`

Services can communicate using their service names (e.g., `postgres`, `api`, `admin`).

## Volumes

Persistent data is stored in named volumes:
- **Development**: `postgres_data_dev` - PostgreSQL database files
- **Production**: `postgres_data` - PostgreSQL database files

## Health Checks

Services include health checks to ensure proper startup order:
- **PostgreSQL**: `pg_isready -U ubexgo` check (every 5s in dev, 10s in prod)
- **API**: Waits for PostgreSQL to be healthy before starting

## Troubleshooting

### Database Connection Refused Error

If you see `ConnectionRefusedError [SequelizeConnectionRefusedError]`:

1. **Stop all containers**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

2. **Rebuild and restart**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Check logs**:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f api
   ```

You should see:
```
✅ Database connection established successfully
✅ Sequelize: Database connection established successfully
🚀 Server running on port 4000
```

### Services Won't Start
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs

# Check service status
docker-compose -f docker-compose.dev.yml ps

# Check specific service
docker-compose -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.dev.yml logs api
```

### Port Already in Use
```bash
# Windows - Find process using port
netstat -ano | findstr :4001

# Linux/Mac - Find process using port
lsof -i :4001

# Then kill the process or change the port in docker-compose.dev.yml
```

### Changes Not Reflecting

**For code changes in `src/`**:
- Should auto-reload automatically
- If not, restart the service:
  ```bash
  docker-compose -f docker-compose.dev.yml restart api
  ```

**For `package.json` changes**:
```bash
docker-compose -f docker-compose.dev.yml up --build api
```

**For Dockerfile changes**:
```bash
docker-compose -f docker-compose.dev.yml build --no-cache api
docker-compose -f docker-compose.dev.yml up api
```

### Reset Everything
```bash
# Stop and remove everything (including volumes)
docker-compose -f docker-compose.dev.yml down -v

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

### Check Service Health
```bash
# Check if PostgreSQL is ready
docker exec ubexgo-postgres-dev pg_isready -U ubexgo

# Check API health endpoint
curl http://localhost:4001/health
```

For more detailed troubleshooting, see [DOCKER_TROUBLESHOOTING.md](../../DOCKER_TROUBLESHOOTING.md) in the project root.

## Notes

- **Hot Reload**: Development mode includes hot reload for both API and Admin
- **Volume Mounting**: Source code is mounted for real-time updates in development
- **Health Checks**: PostgreSQL health checks ensure the database is ready before API starts
- **Port Mapping**: Development uses different ports (4001, 3001, 5433) to avoid conflicts
- **Security**: Change JWT secrets and database passwords for production use
- **Secrets Management**: For production, use Docker secrets or external secrets management

## What's Fixed

This setup resolves the database connection issue by:
1. ✅ Setting `DB_HOST=postgres` (Docker service name, not localhost)
2. ✅ Passing all required environment variables to the API container
3. ✅ Adding health checks to ensure PostgreSQL is ready before API starts
4. ✅ Using proper depends_on with condition: service_healthy
5. ✅ Configuring proper network communication between containers

## Next Steps

1. **Stop existing containers** (if running):
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

2. **Start with the new configuration**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Verify the connection**:
   ```bash
   # Check logs for success messages
   docker-compose -f docker-compose.dev.yml logs -f api
   
   # Test the health endpoint
   curl http://localhost:4001/health
   ```

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Sequelize Documentation](https://sequelize.org/)
- [Detailed Troubleshooting Guide](../../DOCKER_TROUBLESHOOTING.md)

