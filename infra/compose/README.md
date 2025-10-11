# UberGo Docker Compose Setup

This directory contains Docker Compose configurations for running the entire UberGo application stack.

## Services

### Production Stack (`docker-compose.yml`)

- **PostgreSQL 16** - Main database (port 5432)
- **Redis 7** - Cache and session store (port 6379)
- **API** - Backend Node.js/TypeScript API (port 4000)
- **Admin** - React admin dashboard (port 3000)
- **Nginx** - Reverse proxy (port 80/443)

### Development Stack (`docker-compose.dev.yml`)

- **PostgreSQL 16** - Main database (port 5432)
- **Redis 7** - Cache and session store (port 6379)
- **API** - Backend with hot reload enabled (port 4000)

## Usage

### Production

Start all services:
```bash
docker-compose up -d
```

Start specific services:
```bash
docker-compose up -d postgres redis api
```

View logs:
```bash
docker-compose logs -f
docker-compose logs -f api  # specific service
```

Stop all services:
```bash
docker-compose down
```

Stop and remove volumes (⚠️ deletes data):
```bash
docker-compose down -v
```

### Development

Start development environment:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

Run API in development mode with hot reload:
```bash
docker-compose -f docker-compose.dev.yml up api
```

### Rebuild Services

Rebuild after code changes:
```bash
docker-compose build
docker-compose up -d
```

Force rebuild:
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Accessing Services

### Production
- **Nginx Reverse Proxy**: http://localhost
- **Admin Dashboard**: http://localhost/admin
- **API**: http://localhost/api
- **Direct Admin Access**: http://localhost:3000
- **Direct API Access**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Development
- **API**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Database Connection

```bash
# Connect to PostgreSQL
docker exec -it ubergo-postgres psql -U ubergo -d ubergo

# Connect to Redis
docker exec -it ubergo-redis redis-cli
```

## Environment Variables

Create a `.env` file in this directory to override default values:

```env
# Database
POSTGRES_USER=ubergo
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ubergo

# API
NODE_ENV=production
PORT=4000

# Admin
VITE_API_URL=http://localhost:4000
```

## Network

All services communicate through the `ubergo-network` bridge network.

## Volumes

Persistent data is stored in named volumes:
- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis persistence files

## Health Checks

Services include health checks to ensure proper startup order:
- PostgreSQL: `pg_isready` check
- Redis: `redis-cli ping` check

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check service status
docker-compose ps
```

### Database connection issues
```bash
# Verify PostgreSQL is healthy
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres
```

### Reset everything
```bash
# Stop and remove everything (including volumes)
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## Notes

- The admin app is built as static files and served via Nginx
- The API includes volume mounting for hot reload in development
- Database credentials should be changed for production use
- For production, consider using secrets management

