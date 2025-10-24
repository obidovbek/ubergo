# UberGo Kubernetes Deployment Guide

## Overview

This document provides a comprehensive guide for deploying the UberGo application to Kubernetes using Kustomize overlays. The configuration is based on the ferpiControl project structure and adapted for UberGo's architecture.

## Project Structure

```
UberGo/
├── apps/
│   ├── api/                    # Node.js/Express backend
│   ├── admin/                  # Vite/React admin panel
│   ├── user-app/              # Expo mobile app for users
│   └── driver-app/            # Expo mobile app for drivers
└── infra/
    ├── compose/               # Docker Compose files (development)
    │   ├── docker-compose.yml
    │   ├── docker-compose.dev.yml
    │   └── env.example
    ├── k8s/                   # Kubernetes configurations (production)
    │   ├── ingressclass-traefik.yaml
    │   ├── README.md
    │   └── overlays/
    │       └── test3/         # test3.fstu.uz deployment
    │           ├── api-deployment.yaml
    │           ├── api-service.yaml
    │           ├── admin-deployment.yaml
    │           ├── admin-service.yaml
    │           ├── postgres.yaml
    │           ├── ingress.yaml
    │           ├── clusterissuer.yaml
    │           ├── kustomization.yaml
    │           ├── env.example
    │           ├── deploy.sh
    │           └── README.md
    └── nginx/                 # Nginx configuration (optional)
```

## Architecture

### Components

1. **API Service (Node.js/Express)**
   - Port: 4000
   - Handles all backend logic
   - Connects to PostgreSQL database
   - Provides REST API for admin and mobile apps

2. **Admin Panel (Vite/React)**
   - Port: 80 (served by nginx)
   - Web-based administration interface
   - Communicates with API via REST

3. **PostgreSQL Database**
   - Port: 5432
   - Persistent storage for all data
   - Version: 17-alpine

4. **Mobile Apps (Expo/React Native)**
   - Not deployed to K8s
   - Connect to API via internet
   - Separate builds for iOS and Android

### Networking

```
Internet
    ↓
Traefik Ingress (test3.fstu.uz)
    ↓
    ├─→ / → Admin Service (port 80) → Admin Pod (port 80)
    └─→ /api → API Service (port 80) → API Pod (port 4000)
                                          ↓
                                 PostgreSQL Service (port 5432)
                                          ↓
                                    PostgreSQL Pod
```

## Prerequisites

### Required Software

1. **Kubernetes Cluster**: K3s, Minikube, or any K8s cluster
2. **kubectl**: Kubernetes CLI tool
3. **Docker**: For building images
4. **Kustomize**: Built into kubectl 1.14+

### Required Cluster Components

1. **Traefik Ingress Controller**: For routing traffic
2. **local-path-provisioner**: For persistent volumes (comes with K3s)
3. **cert-manager** (optional): For SSL certificates

### Verify Prerequisites

```bash
# Check kubectl
kubectl version

# Check cluster access
kubectl cluster-info

# Check Traefik
kubectl get pods -n kube-system | grep traefik

# Check storage class
kubectl get storageclass
```

## Deployment for test3.fstu.uz

### Step 1: Prepare Environment

Navigate to the overlay directory:

```bash
cd infra/k8s/overlays/test3/
```

Create `.env` file from template:

```bash
cp env.example .env
```

Edit `.env` and update these critical values:

```env
# Database (CHANGE THESE!)
DB_PASSWORD=your_secure_password_here
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secrets (GENERATE NEW ONES!)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# API Keys (if using these services)
ESKIZ_EMAIL=your_email
ESKIZ_PASSWORD=your_password
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
```

### Step 2: Build Docker Images

The deployment script will build images automatically, but you can also build manually:

**Build API:**
```bash
cd apps/api
docker build -t ubexgo-api-test3:latest .
```

**Build Admin:**
```bash
cd apps/admin
docker build -t ubexgo-admin-test3:latest .
```

### Step 3: Deploy

Run the automated deployment script:

```bash
cd infra/k8s/overlays/test3/
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Reset namespace and PersistentVolumes
2. Build and import Docker images
3. Apply all Kubernetes manifests
4. Display helpful commands

### Step 4: Verify Deployment

Check pod status:
```bash
kubectl get pods -n test3
```

Expected output:
```
NAME                                  READY   STATUS    RESTARTS   AGE
ubexgo-api-test3-xxxx                 1/1     Running   0          2m
ubexgo-admin-test3-xxxx               1/1     Running   0          2m
postgres-test3-xxxx                   1/1     Running   0          2m
```

Check services:
```bash
kubectl get svc -n test3
```

Check ingress:
```bash
kubectl get ingress -n test3
```

### Step 5: Access Application

Once deployed:
- **Admin Panel**: http://test3.fstu.uz
- **API**: http://test3.fstu.uz/api

## Manual Deployment (Alternative)

If you prefer step-by-step deployment:

### 1. Create Namespace

```bash
kubectl create namespace test3
```

### 2. Build and Import Images

```bash
# API
cd apps/api
docker build -t ubexgo-api-test3:latest .
docker save ubexgo-api-test3:latest -o ubexgo-api-test3.tar
k3s ctr images import ubexgo-api-test3.tar
rm ubexgo-api-test3.tar

# Admin
cd ../admin
docker build -t ubexgo-admin-test3:latest .
docker save ubexgo-admin-test3:latest -o ubexgo-admin-test3.tar
k3s ctr images import ubexgo-admin-test3.tar
rm ubexgo-admin-test3.tar
```

### 3. Apply Manifests

```bash
cd ../../infra/k8s/overlays/test3/
kubectl apply -k .
```

## Enabling SSL/TLS with Let's Encrypt

### Prerequisites

Install cert-manager:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

Wait for cert-manager to be ready:
```bash
kubectl get pods -n cert-manager
```

### Enable SSL

1. Uncomment the ClusterIssuer resource in `kustomization.yaml`:
```yaml
resources:
  - clusterissuer.yaml  # Uncomment this line
```

2. Edit `ingress.yaml` and uncomment TLS sections:
```yaml
annotations:
  traefik.ingress.kubernetes.io/router.entrypoints: websecure  # Change from 'web'
  cert-manager.io/cluster-issuer: letsencrypt-prod  # Add this line

spec:
  tls:  # Uncomment this section
    - hosts:
        - test3.fstu.uz
      secretName: test3-fstu-tls
```

3. Apply changes:
```bash
kubectl apply -k .
```

4. Verify certificate:
```bash
kubectl get certificate -n test3
kubectl describe certificate test3-fstu-tls -n test3
```

The certificate will be automatically provisioned within a few minutes.

## Updating the Application

### Update Code

Run the deployment script again:
```bash
./deploy.sh
```

Or manually:
```bash
# Rebuild and reimport images
cd apps/api
docker build -t ubexgo-api-test3:latest .
docker save ubexgo-api-test3:latest | k3s ctr images import -

cd ../admin
docker build -t ubexgo-admin-test3:latest .
docker save ubexgo-admin-test3:latest | k3s ctr images import -

# Restart deployments
kubectl rollout restart deployment ubexgo-api-test3 -n test3
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
```

### Update Environment Variables

1. Edit `.env` file
2. Delete old ConfigMap:
```bash
kubectl delete configmap ubexgo-test3-env -n test3
```
3. Recreate ConfigMap:
```bash
kubectl apply -k .
```
4. Restart pods:
```bash
kubectl rollout restart deployment ubexgo-api-test3 -n test3
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
kubectl rollout restart deployment postgres-test3 -n test3
```

## Database Management

### Connect to PostgreSQL

```bash
# Get pod name
POD=$(kubectl get pods -n test3 -l app=postgres-test3 -o jsonpath='{.items[0].metadata.name}')

# Connect
kubectl exec -it -n test3 $POD -- psql -U ubexgo -d ubexgo
```

### Backup Database

```bash
POD=$(kubectl get pods -n test3 -l app=postgres-test3 -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n test3 $POD -- pg_dump -U ubexgo ubexgo > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
POD=$(kubectl get pods -n test3 -l app=postgres-test3 -o jsonpath='{.items[0].metadata.name}')
kubectl exec -i -n test3 $POD -- psql -U ubexgo ubexgo < backup.sql
```

### Run Migrations

If your API has database migrations:

```bash
# Get API pod name
POD=$(kubectl get pods -n test3 -l app=ubexgo-api-test3 -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -it -n test3 $POD -- npm run migrate
# or
kubectl exec -it -n test3 $POD -- npm run db:migrate
```

## Monitoring and Debugging

### View Logs

```bash
# API logs (follow)
kubectl logs -f deployment/ubexgo-api-test3 -n test3

# Admin logs
kubectl logs -f deployment/ubexgo-admin-test3 -n test3

# PostgreSQL logs
kubectl logs -f deployment/postgres-test3 -n test3

# All pods
kubectl logs -f -n test3 --all-containers=true
```

### Shell Access

```bash
# API pod
kubectl exec -it deployment/ubexgo-api-test3 -n test3 -- sh

# Admin pod
kubectl exec -it deployment/ubexgo-admin-test3 -n test3 -- sh

# PostgreSQL pod
kubectl exec -it deployment/postgres-test3 -n test3 -- sh
```

### Check Pod Events

```bash
kubectl describe pod <pod-name> -n test3
kubectl get events -n test3 --sort-by='.lastTimestamp'
```

### Resource Usage

```bash
kubectl top pods -n test3
kubectl top nodes
```

## Troubleshooting

### Pods Not Starting

**Issue**: Pods are in `Pending`, `CrashLoopBackOff`, or `Error` state

**Solution**:
```bash
# Check pod details
kubectl describe pod <pod-name> -n test3

# Check logs
kubectl logs <pod-name> -n test3

# Common issues:
# - Image not found: Re-run deploy.sh
# - PVC not bound: Check PersistentVolume status
# - Resource constraints: Check node resources
```

### Database Connection Failed

**Issue**: API can't connect to PostgreSQL

**Solution**:
```bash
# Verify PostgreSQL is running
kubectl get pods -n test3 | grep postgres

# Check service
kubectl get svc postgres-service-test3 -n test3

# Test connection from API pod
kubectl exec -it deployment/ubexgo-api-test3 -n test3 -- sh
# Inside pod:
ping postgres-service-test3
nc -zv postgres-service-test3 5432
```

### Ingress Not Working

**Issue**: Can't access application via domain

**Solution**:
```bash
# Check ingress
kubectl describe ingress ubexgo-ingress -n test3

# Verify Traefik is running
kubectl get pods -n kube-system | grep traefik

# Check Traefik logs
kubectl logs -n kube-system deployment/traefik

# Verify DNS
nslookup test3.fstu.uz

# Test service directly (bypass ingress)
kubectl port-forward -n test3 svc/admin-service-test3 8080:80
# Then access: http://localhost:8080
```

### Image Pull Errors

**Issue**: `ImagePullBackOff` or `ErrImagePull`

**Solution**:
```bash
# Check if image exists
k3s ctr images ls | grep ubexgo-test3

# Reimport image
docker save ubexgo-api-test3:latest | k3s ctr images import -
docker save ubexgo-admin-test3:latest | k3s ctr images import -

# Restart deployment
kubectl rollout restart deployment ubexgo-api-test3 -n test3
```

### ConfigMap Not Updating

**Issue**: Environment changes not reflected in pods

**Solution**:
```bash
# Delete and recreate ConfigMap
kubectl delete configmap ubexgo-test3-env -n test3
kubectl apply -k .

# Force pod restart
kubectl rollout restart deployment ubexgo-api-test3 -n test3
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
```

## Scaling

### Scale Deployments

```bash
# Scale API (if stateless)
kubectl scale deployment ubexgo-api-test3 -n test3 --replicas=3

# Scale Admin (if stateless)
kubectl scale deployment ubexgo-admin-test3 -n test3 --replicas=2

# Check status
kubectl get pods -n test3
```

**Note**: PostgreSQL should remain at 1 replica unless using replication/clustering.

### Auto-scaling (Optional)

Create HorizontalPodAutoscaler:
```bash
kubectl autoscale deployment ubexgo-api-test3 -n test3 \
  --cpu-percent=70 \
  --min=1 \
  --max=5
```

## Cleanup

### Remove Deployment

```bash
# Delete namespace (removes all resources)
kubectl delete namespace test3

# Reset PersistentVolume
kubectl patch pv postgres-pv-test3 -p '{"spec":{"claimRef": null}}'

# Clean up images
k3s ctr images rm docker.io/library/ubexgo-api-test3:latest
k3s ctr images rm docker.io/library/ubexgo-admin-test3:latest
```

### Partial Cleanup

```bash
# Delete specific deployment
kubectl delete deployment ubexgo-api-test3 -n test3

# Delete specific service
kubectl delete service api-service-test3 -n test3
```

## Creating Additional Overlays

To deploy to another domain (e.g., `production.example.com`):

### 1. Copy Existing Overlay

```bash
cp -r infra/k8s/overlays/test3 infra/k8s/overlays/production
```

### 2. Update Configuration

**In all YAML files**, replace:
- Namespace: `test3` → `production`
- Image names: `ubexgo-*-test3` → `ubexgo-*-production`
- PV/PVC names: `*-test3` → `*-production`
- Service names: `*-test3` → `*-production`

**In `ingress.yaml`**:
- Domain: `test3.fstu.uz` → `production.example.com`

**In `.env`**:
- Update all URLs with new domain
- Change passwords and secrets
- Update `DB_HOST` to new service name

**In `deploy.sh`**:
- Update image names
- Update paths if needed

### 3. Deploy

```bash
cd infra/k8s/overlays/production
./deploy.sh
```

## Best Practices

### Security

1. ✅ **Use Kubernetes Secrets** for sensitive data instead of ConfigMaps
2. ✅ **Enable SSL/TLS** for production deployments
3. ✅ **Change default passwords** before deploying
4. ✅ **Generate unique JWT secrets** for each environment
5. ✅ **Implement RBAC** for access control
6. ✅ **Regular security updates** for images

### Reliability

1. ✅ **Add health checks** (liveness/readiness probes)
2. ✅ **Set resource limits** (CPU/memory)
3. ✅ **Regular backups** of PostgreSQL data
4. ✅ **Monitor pod status** and logs
5. ✅ **Use specific image tags** instead of `latest` in production

### Performance

1. ✅ **Scale horizontally** based on load
2. ✅ **Use persistent volumes** for database
3. ✅ **Enable caching** where appropriate
4. ✅ **Optimize Docker images** (multi-stage builds)

## Support and Resources

### Documentation

- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Kustomize Docs](https://kustomize.io/)
- [Traefik Docs](https://doc.traefik.io/traefik/)
- [cert-manager Docs](https://cert-manager.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Project Structure Reference

Based on ferpiControl project structure:
- Similar overlay pattern for different deployments
- Kustomize for configuration management
- Traefik for ingress
- Local path provisioner for storage

### Getting Help

1. Check logs: `kubectl logs -f <pod-name> -n test3`
2. Check events: `kubectl get events -n test3`
3. Describe resources: `kubectl describe <resource> <name> -n test3`
4. Contact DevOps team or open an issue

## Appendix

### Environment Variables Reference

See `env.example` for complete list and descriptions.

### Port Reference

| Service | Internal Port | External Port | Protocol |
|---------|---------------|---------------|----------|
| API | 4000 | 80 (via ingress) | HTTP |
| Admin | 80 | 80 (via ingress) | HTTP |
| PostgreSQL | 5432 | - | PostgreSQL |

### Resource Requirements

Default (minimal):
- API: 256Mi RAM, 0.1 CPU
- Admin: 128Mi RAM, 0.1 CPU
- PostgreSQL: 256Mi RAM, 0.1 CPU, 5Gi storage

Recommended (production):
- API: 512Mi-1Gi RAM, 0.5-1 CPU
- Admin: 256Mi-512Mi RAM, 0.2-0.5 CPU
- PostgreSQL: 1Gi-2Gi RAM, 0.5-1 CPU, 20Gi+ storage

### Useful kubectl Commands

```bash
# Get all resources in namespace
kubectl get all -n test3

# Watch pods
kubectl get pods -n test3 -w

# Port forward
kubectl port-forward -n test3 svc/api-service-test3 4000:80

# Copy files
kubectl cp <pod>:/path/to/file ./local-file -n test3

# Execute command
kubectl exec -n test3 <pod> -- <command>

# Get pod YAML
kubectl get pod <pod-name> -n test3 -o yaml

# Rollout status
kubectl rollout status deployment/ubexgo-api-test3 -n test3

# Rollout history
kubectl rollout history deployment/ubexgo-api-test3 -n test3

# Rollback
kubectl rollout undo deployment/ubexgo-api-test3 -n test3
```

---

**Last Updated**: October 2025  
**Maintained By**: UberGo Development Team

