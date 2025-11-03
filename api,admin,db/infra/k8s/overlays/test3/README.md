# test3.fstu.uz - Kubernetes Deployment

This overlay configures the UberGo application for deployment to **test3.fstu.uz**.

## Configuration Overview

### Domain
- **URL**: https://test3.fstu.uz
- **Namespace**: test3
- **IngressClass**: traefik

### Services

| Service | Image | Port | Internal Port | Path |
|---------|-------|------|---------------|------|
| Admin | ubexgo-admin-test3:latest | 80 | 80 | / |
| API | ubexgo-api-test3:latest | 80 | 4000 | /api |
| PostgreSQL | postgres:17-alpine | 5432 | 5432 | - |

### Storage

| Resource | Size | Path |
|----------|------|------|
| PostgreSQL PV | 5Gi | /opt/local-path-provisioner/postgres-data-test3 |

## Quick Deploy

```bash
# 1. Copy and configure environment
cp env.example .env
nano .env  # Edit with your values

# 2. Run deployment
chmod +x deploy.sh
./deploy.sh
```

## Environment Configuration

Before deploying, you must configure the following in your `.env` file:

### Required Changes

1. **Database Credentials**
   ```env
   DB_PASSWORD=<your-secure-password>
   POSTGRES_PASSWORD=<same-as-above>
   ```

2. **JWT Secrets** (IMPORTANT: Change in production!)
   ```env
   JWT_SECRET=<your-secure-secret-key>
   JWT_REFRESH_SECRET=<your-secure-refresh-key>
   ```

3. **API Keys** (if using these services)
   ```env
   ESKIZ_EMAIL=<your-email>
   ESKIZ_PASSWORD=<your-password>
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-secret>
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<your-maps-key>
   ```

### Pre-configured Values

The following are already set for test3.fstu.uz:
- `DB_HOST=postgres-service-test3`
- `CORS_ORIGIN=https://test3.fstu.uz`
- `VITE_API_BASE_URL=https://test3.fstu.uz/api`
- `NODE_ENV=production`

## Deployment Process

The `deploy.sh` script performs these steps:

1. **Cleanup**: Deletes existing namespace and resets PersistentVolumes
2. **Build API**: Creates Docker image from `apps/api`
3. **Build Admin**: Creates Docker image from `apps/admin`
4. **Import Images**: Loads images into K3s container runtime
5. **Apply Manifests**: Deploys all Kubernetes resources using Kustomize

## Post-Deployment Verification

### Check Pod Status
```bash
kubectl get pods -n test3
```

Expected output:
```
NAME                                  READY   STATUS    RESTARTS   AGE
ubexgo-api-test3-xxxx                 1/1     Running   0          1m
ubexgo-admin-test3-xxxx               1/1     Running   0          1m
postgres-test3-xxxx                   1/1     Running   0          1m
```

### Check Services
```bash
kubectl get services -n test3
```

### Check Ingress
```bash
kubectl get ingress -n test3
```

### View Logs
```bash
# API logs
kubectl logs -f deployment/ubexgo-api-test3 -n test3

# Admin logs
kubectl logs -f deployment/ubexgo-admin-test3 -n test3

# Database logs
kubectl logs -f deployment/postgres-test3 -n test3
```

## Access Application

- **Admin Panel**: https://test3.fstu.uz
- **API Health Check**: https://test3.fstu.uz/api/health (if implemented)
- **API Documentation**: https://test3.fstu.uz/api/docs (if implemented)

## SSL/TLS Setup

Currently configured for HTTP only. To enable HTTPS:

1. Ensure cert-manager is installed in your cluster
2. Edit `ingress.yaml` and uncomment TLS sections:
   ```yaml
   annotations:
     traefik.ingress.kubernetes.io/router.entrypoints: websecure
     cert-manager.io/cluster-issuer: letsencrypt-prod
   spec:
     tls:
       - hosts:
           - test3.fstu.uz
         secretName: test3-fstu-tls
   ```
3. Uncomment `clusterissuer.yaml` in `kustomization.yaml`
4. Redeploy: `kubectl apply -k .`

## Updating Deployment

### Update Environment Variables
```bash
# 1. Edit .env file
nano .env

# 2. Delete old ConfigMap
kubectl delete configmap ubexgo-test3-env -n test3

# 3. Apply new configuration
kubectl apply -k .

# 4. Restart deployments
kubectl rollout restart deployment ubexgo-api-test3 -n test3
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
```

### Update Application Code
```bash
# Run the deploy script again
./deploy.sh
```

Or manually:
```bash
# Rebuild images
cd ../../apps/api
docker build -t ubexgo-api-test3:latest .
docker save ubexgo-api-test3:latest | k3s ctr images import -

cd ../admin
docker build -t ubexgo-admin-test3:latest .
docker save ubexgo-admin-test3:latest | k3s ctr images import -

# Restart deployments
kubectl rollout restart deployment ubexgo-api-test3 -n test3
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
```

## Database Management

### Connect to PostgreSQL
```bash
# Get pod name
POD_NAME=$(kubectl get pods -n test3 -l app=postgres-test3 -o jsonpath='{.items[0].metadata.name}')

# Connect
kubectl exec -it -n test3 $POD_NAME -- psql -U ubexgo -d ubexgo
```

### Backup Database
```bash
POD_NAME=$(kubectl get pods -n test3 -l app=postgres-test3 -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n test3 $POD_NAME -- pg_dump -U ubexgo ubexgo > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
POD_NAME=$(kubectl get pods -n test3 -l app=postgres-test3 -o jsonpath='{.items[0].metadata.name}')
kubectl exec -i -n test3 $POD_NAME -- psql -U ubexgo ubexgo < backup.sql
```

## Troubleshooting

### Pods not starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n test3

# Check pod logs
kubectl logs <pod-name> -n test3
```

### Database connection issues
```bash
# Verify PostgreSQL is running
kubectl get pods -n test3 | grep postgres

# Check service
kubectl get svc postgres-service-test3 -n test3

# Test connection from API pod
kubectl exec -it deployment/ubexgo-api-test3 -n test3 -- env | grep DB_
```

### Ingress not working
```bash
# Check ingress status
kubectl describe ingress ubexgo-ingress -n test3

# Check Traefik logs (if available)
kubectl logs -n kube-system deployment/traefik
```

### Image not found
```bash
# Check if image exists in k3s
k3s ctr images ls | grep ubexgo-test3

# Re-import if needed
./deploy.sh
```

## Scaling

```bash
# Scale API (if stateless)
kubectl scale deployment ubexgo-api-test3 -n test3 --replicas=2

# Scale Admin (if stateless)
kubectl scale deployment ubexgo-admin-test3 -n test3 --replicas=2
```

**Note**: Keep PostgreSQL at 1 replica unless using replication.

## Resource Monitoring

```bash
# Pod resource usage
kubectl top pods -n test3

# Node resource usage
kubectl top nodes

# Watch pod status
kubectl get pods -n test3 -w
```

## Cleanup

To completely remove this deployment:

```bash
# Delete namespace (removes all resources)
kubectl delete namespace test3

# Reset PersistentVolume
kubectl patch pv postgres-pv-test3 -p '{"spec":{"claimRef": null}}'

# Clean up images
k3s ctr images rm docker.io/library/ubexgo-api-test3:latest
k3s ctr images rm docker.io/library/ubexgo-admin-test3:latest
```

## Files in This Overlay

- `api-deployment.yaml` - API backend Deployment
- `api-service.yaml` - API backend Service
- `admin-deployment.yaml` - Admin frontend Deployment
- `admin-service.yaml` - Admin frontend Service
- `postgres.yaml` - PostgreSQL database (PV, PVC, Service, Deployment)
- `ingress.yaml` - Ingress routing rules
- `clusterissuer.yaml` - Let's Encrypt certificate issuer (optional)
- `kustomization.yaml` - Kustomize configuration
- `env.example` - Environment variables template
- `deploy.sh` - Automated deployment script
- `README.md` - This file

## Security Considerations

1. **Change default passwords** in `.env` before deploying
2. **Generate new JWT secrets** for production
3. **Enable SSL/TLS** for production use
4. **Store sensitive data** in Kubernetes Secrets, not ConfigMaps
5. **Limit resource access** with RBAC if needed
6. **Regular backups** of PostgreSQL data

## Contact

For deployment issues or questions, contact your DevOps team or system administrator.

