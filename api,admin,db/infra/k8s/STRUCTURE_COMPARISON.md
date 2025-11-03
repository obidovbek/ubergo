# Structure Comparison: UberGo vs ferpiControl

This document shows how the UberGo Kubernetes configuration mirrors the ferpiControl project structure.

## Directory Structure Comparison

### ferpiControl Structure
```
ferpiControl/
├── application/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── api/              # Node.js backend
│   ├── frontend/         # React frontend
│   └── nginx/
└── k8s/
    ├── ingressclass-traefik.yaml
    └── overlays/
        ├── fstu/         # portal.fstu.uz, tif.fstu.uz, etc.
        ├── fjsti/        # fjsti deployment
        ├── demo/         # demo deployment
        └── kokanduni/    # kokanduni deployment
```

### UberGo Structure
```
UberGo/
├── apps/
│   ├── api/              # Node.js backend (Express)
│   ├── admin/            # React admin panel (Vite)
│   ├── user-app/         # Expo mobile app
│   └── driver-app/       # Expo mobile app
├── infra/
│   ├── compose/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── env.example
│   └── k8s/
│       ├── ingressclass-traefik.yaml
│       └── overlays/
│           └── test3/    # test3.fstu.uz deployment
└── KUBERNETES_DEPLOYMENT.md
```

## File-by-File Comparison

### Overlay Structure

#### ferpiControl/k8s/overlays/fstu/
```
├── backend-deployment.yaml
├── backend-service.yaml
├── frontend-deployment.yaml
├── frontend-service.yaml
├── postgres.yaml
├── uploads-pvc.yaml
├── ingress.yaml
├── clusterissuer.yaml
├── kustomization.yaml
└── deploy.sh
```

#### UberGo/infra/k8s/overlays/test3/
```
├── api-deployment.yaml       # Similar to backend-deployment.yaml
├── api-service.yaml          # Similar to backend-service.yaml
├── admin-deployment.yaml     # Similar to frontend-deployment.yaml
├── admin-service.yaml        # Similar to frontend-service.yaml
├── postgres.yaml             # Same structure
├── ingress.yaml              # Same structure
├── clusterissuer.yaml        # Same structure
├── kustomization.yaml        # Same structure
├── env.example               # Environment configuration
├── deploy.sh                 # Same deployment script
└── README.md                 # Documentation
```

## Component Mapping

| ferpiControl | UberGo | Purpose |
|--------------|--------|---------|
| backend | api | Node.js API server |
| frontend | admin | React web application |
| postgres | postgres | PostgreSQL database |
| uploads-pvc | (not needed yet) | File uploads storage |
| nginx | nginx | Reverse proxy (in Docker Compose) |

## Configuration Comparison

### 1. Backend/API Deployment

**ferpiControl** (`backend-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app-fstu
spec:
  containers:
    - name: nodejs
      image: backend-fstu:latest
      ports:
        - containerPort: 1894
      volumeMounts:
        - name: uploads-volume
          mountPath: /app/src/common/utils/uploads
```

**UberGo** (`api-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ubexgo-api-test3
spec:
  containers:
    - name: api
      image: ubexgo-api-test3:latest
      ports:
        - containerPort: 4000
      # No uploads volume (can be added if needed)
```

### 2. Frontend/Admin Deployment

**ferpiControl** (`frontend-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: react-frontend-fstu
spec:
  containers:
    - name: react-frontend
      image: frontend-fstu:latest
      ports:
        - containerPort: 80
```

**UberGo** (`admin-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ubexgo-admin-test3
spec:
  containers:
    - name: admin
      image: ubexgo-admin-test3:latest
      ports:
        - containerPort: 80
```

### 3. PostgreSQL Configuration

**Both projects use identical structure**:
- PersistentVolume for data storage
- PersistentVolumeClaim for volume binding
- Service for internal networking
- Deployment for pod management

Only differences:
- Storage paths: `/opt/local-path-provisioner/postgres-data-fstu` vs `postgres-data-test3`
- Service names: `postgres-service-fstu` vs `postgres-service-test3`
- Image versions: `postgres:14` vs `postgres:17-alpine`

### 4. Ingress Configuration

**ferpiControl** (`ingress.yaml`):
```yaml
spec:
  rules:
    - host: portal.fstu.uz
      http:
        paths:
          - path: /
            backend:
              service:
                name: react-service-fstu
          - path: /api
            backend:
              service:
                name: nodejs-service-fstu
    - host: tif.fstu.uz
      # ... (multiple domains)
```

**UberGo** (`ingress.yaml`):
```yaml
spec:
  rules:
    - host: test3.fstu.uz
      http:
        paths:
          - path: /
            backend:
              service:
                name: admin-service-test3
          - path: /api
            backend:
              service:
                name: api-service-test3
```

### 5. Kustomization

**ferpiControl** (`kustomization.yaml`):
```yaml
namespace: fstu

resources:
  - backend-deployment.yaml
  - backend-service.yaml
  - frontend-deployment.yaml
  - frontend-service.yaml
  - ingress.yaml
  - postgres.yaml
  - uploads-pvc.yaml

configMapGenerator:
  - name: app-fstu-env
    envs:
      - .env
```

**UberGo** (`kustomization.yaml`):
```yaml
namespace: test3

resources:
  - api-deployment.yaml
  - api-service.yaml
  - admin-deployment.yaml
  - admin-service.yaml
  - ingress.yaml
  - postgres.yaml

configMapGenerator:
  - name: ubexgo-test3-env
    envs:
      - .env
```

## Deployment Script Comparison

### ferpiControl (`deploy.sh`):
```bash
kubectl delete namespace fstu --ignore-not-found
kubectl create namespace fstu
kubectl patch pv postgres-pv-fstu -p '{"spec":{"claimRef": null}}'

cd ./application/api
docker build -t backend-fstu:latest .
docker save backend-fstu:latest -o backend-fstu.tar
k3s ctr images import backend-fstu.tar

cd ../frontend/
docker build --build-arg INSTANCE_NAME=fstu -t frontend-fstu:latest .
docker save frontend-fstu:latest -o frontend-fstu.tar
k3s ctr images import frontend-fstu.tar

cd ../../k8s/overlays/fstu/
kubectl apply -k .
```

### UberGo (`deploy.sh`):
```bash
kubectl delete namespace test3 --ignore-not-found
kubectl create namespace test3
kubectl patch pv postgres-pv-test3 -p '{"spec":{"claimRef": null}}'

cd ../../apps/api
docker build -t ubexgo-api-test3:latest .
docker save ubexgo-api-test3:latest -o ubexgo-api-test3.tar
k3s ctr images import ubexgo-api-test3.tar

cd ../admin/
docker build -t ubexgo-admin-test3:latest .
docker save ubexgo-admin-test3:latest -o ubexgo-admin-test3.tar
k3s ctr images import ubexgo-admin-test3.tar

cd ../../infra/k8s/overlays/test3/
kubectl apply -k .
```

**Identical pattern**, just different paths and names!

## Key Similarities

1. ✅ **Overlay-based structure** - Multiple deployments for different environments
2. ✅ **Kustomize for configuration** - Manages environment-specific settings
3. ✅ **Traefik for ingress** - HTTP(S) routing to services
4. ✅ **Local path provisioner** - Persistent storage for PostgreSQL
5. ✅ **ConfigMap for environment** - Environment variables from .env
6. ✅ **Automated deployment script** - build, import, deploy in one command
7. ✅ **Namespace isolation** - Each deployment in separate namespace
8. ✅ **Same service pattern** - Backend + Frontend + Database

## Key Differences

| Aspect | ferpiControl | UberGo |
|--------|--------------|--------|
| Backend framework | NestJS (likely) | Express |
| Frontend framework | React (CRA) | React (Vite) |
| Backend port | 1894 | 4000 |
| Uploads volume | Yes (uploads-pvc) | Not yet (can be added) |
| Mobile apps | No | Yes (Expo apps) |
| Multiple domains | Yes (4 domains) | No (single domain per overlay) |
| PostgreSQL version | 14 | 17-alpine |

## Docker Compose Comparison

### ferpiControl (`docker-compose.yml`):
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  postgres-service:
    image: postgres:16.6
    ports: ["${PGPORT}:${PGPORT}"]
  nginx_sewing:
    build: ./nginx
    ports: ["8080:80"]
  api:
    build: ./api
    ports: ["${REACT_APP_API_PORT}:${REACT_APP_API_PORT}"]
```

### UberGo (`docker-compose.dev.yml`):
```yaml
services:
  postgres:
    image: postgres:17-alpine
    ports: ["${POSTGRES_PORT_EXTERNAL:-5433}:5432"]
  api:
    build: ../../apps/api
    ports: ["${API_PORT_EXTERNAL:-4001}:${API_PORT:-4000}"]
  admin:
    build: ../../apps/admin
    ports: ["${ADMIN_PORT_EXTERNAL:-3001}:5173"]
```

**Similar structure**, different naming conventions.

## Environment Variables

### Common Variables in Both

Both projects use similar environment patterns:

**Database**:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

**Application**:
- `NODE_ENV`
- `API_PORT`
- Various service-specific configurations

**Frontend** (ferpiControl uses `REACT_APP_*`, UberGo uses `VITE_*`):
- API URL configuration
- App name/version

## Adding New Overlays

Both projects follow the same pattern:

1. Copy existing overlay directory
2. Rename namespace and resources
3. Update domain in ingress
4. Update environment variables
5. Update deploy script paths
6. Deploy

Example for UberGo (production):
```bash
cp -r overlays/test3 overlays/production
# Update all files
cd overlays/production
./deploy.sh
```

## Best Practices Inherited from ferpiControl

1. ✅ **Namespace isolation** - Each environment in separate namespace
2. ✅ **Resource naming convention** - Clear, descriptive names
3. ✅ **ConfigMap for env vars** - Easy environment management
4. ✅ **Local storage for database** - Simple, reliable storage
5. ✅ **Automated deployment** - Scripted build and deploy process
6. ✅ **ClusterIssuer for SSL** - Let's Encrypt integration ready
7. ✅ **Commented TLS config** - Easy to enable when needed

## Improvements in UberGo

1. ✅ **Better documentation** - Comprehensive READMEs
2. ✅ **Environment template** - `env.example` for easy setup
3. ✅ **Quick reference** - Common commands easily accessible
4. ✅ **Cleaner structure** - Separated infra from apps
5. ✅ **Deployment guide** - Step-by-step instructions

## Migration Path

To add features from ferpiControl to UberGo:

### Add File Uploads Support
```bash
# Create uploads-pvc.yaml (copy from ferpiControl)
# Add volume mount to api-deployment.yaml
# Add to kustomization.yaml resources
```

### Add Multiple Domains
```bash
# In ingress.yaml, add more rules:
- host: another-domain.fstu.uz
  http:
    paths:
      - path: /
        # ...
```

### Add More Overlays
```bash
cp -r overlays/test3 overlays/new-deployment
# Update configurations
```

## Summary

The UberGo Kubernetes configuration successfully replicates the proven ferpiControl structure:

- ✅ **Same deployment pattern** - Overlays for different environments
- ✅ **Same tools** - Kustomize, Traefik, kubectl
- ✅ **Same workflow** - Build, import, deploy
- ✅ **Same resources** - Deployments, Services, Ingress, PV/PVC
- ✅ **Same principles** - Namespace isolation, ConfigMaps, automation

The main differences are in:
- Application technology stack
- Port numbers
- Naming conventions
- Documentation (enhanced in UberGo)

This ensures that anyone familiar with ferpiControl can immediately understand and work with the UberGo Kubernetes deployment.

