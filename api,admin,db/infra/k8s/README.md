# UberGo Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the UberGo application to a Kubernetes cluster using Kustomize.

## Project Structure

```
k8s/
├── ingressclass-traefik.yaml          # Traefik IngressClass definition
└── overlays/
    └── test3/                         # test3.fstu.uz deployment
        ├── api-deployment.yaml        # API backend deployment
        ├── api-service.yaml           # API backend service
        ├── admin-deployment.yaml      # Admin frontend deployment
        ├── admin-service.yaml         # Admin frontend service
        ├── postgres.yaml              # PostgreSQL database (PV, PVC, Service, Deployment)
        ├── ingress.yaml               # Ingress rules for routing
        ├── clusterissuer.yaml         # Let's Encrypt certificate issuer (optional)
        ├── kustomization.yaml         # Kustomize configuration
        ├── env.example                # Environment variables template
        └── deploy.sh                  # Deployment script
```

## Prerequisites

1. **Kubernetes Cluster** - K3s, Minikube, or any Kubernetes cluster
2. **kubectl** - Kubernetes command-line tool
3. **Kustomize** - Configuration management (built into kubectl 1.14+)
4. **Traefik** - Ingress controller (should be installed in the cluster)
5. **Docker** - For building images
6. **cert-manager** (optional) - For automatic SSL certificates

## Architecture

The UberGo application consists of three main components:

1. **API Service** (Node.js/Express)
   - Port: 4000
   - Path: `/api`
   - Connected to PostgreSQL

2. **Admin Panel** (Vite/React)
   - Port: 80 (nginx)
   - Path: `/`
   - Communicates with API

3. **PostgreSQL Database**
   - Port: 5432
   - Persistent storage via PersistentVolume

## Quick Start - test3.fstu.uz

### 1. Prepare Environment

Copy the environment template and configure it:

```bash
cd infra/k8s/overlays/test3/
cp env.example .env
```

Edit `.env` file and update:
- Database passwords
- JWT secrets (production-safe values)
- API keys (Eskiz, Google, etc.)
- Domain-specific URLs

### 2. Build and Deploy

Make the deploy script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Delete and recreate the namespace
2. Reset PersistentVolumes
3. Build Docker images for API and Admin
4. Import images to K3s
5. Apply all Kubernetes manifests

### 3. Verify Deployment

Check if all pods are running:

```bash
kubectl get pods -n test3
```

Check services:

```bash
kubectl get services -n test3
```

Check ingress:

```bash
kubectl get ingress -n test3
```

### 4. Access the Application

Once deployed, the application will be accessible at:
- **Admin Panel**: https://test3.fstu.uz
- **API**: https://test3.fstu.uz/api

## Manual Deployment Steps

If you prefer manual deployment or need to troubleshoot:

### 1. Create Namespace

```bash
kubectl create namespace test3
```

### 2. Build Docker Images

**API:**
```bash
cd apps/api
docker build -t ubexgo-api-test3:latest .
docker save ubexgo-api-test3:latest -o ubexgo-api-test3.tar
k3s ctr images import ubexgo-api-test3.tar
```

**Admin:**
```bash
cd apps/admin
docker build -t ubexgo-admin-test3:latest .
docker save ubexgo-admin-test3:latest -o ubexgo-admin-test3.tar
k3s ctr images import ubexgo-admin-test3.tar
```

### 3. Apply Manifests

```bash
cd infra/k8s/overlays/test3/
kubectl apply -k .
```

## SSL/TLS Configuration

To enable HTTPS with Let's Encrypt:

### 1. Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 2. Enable SSL in Configuration

Edit `ingress.yaml` and uncomment the TLS sections:

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

### 3. Apply ClusterIssuer

Uncomment in `kustomization.yaml`:
```yaml
resources:
  - clusterissuer.yaml
```

Then apply:
```bash
kubectl apply -k .
```

## Troubleshooting

### Check Pod Logs

```bash
# List all pods
kubectl get pods -n test3

# View logs for specific pod
kubectl logs -f <pod-name> -n test3

# View logs for specific container in pod
kubectl logs -f <pod-name> -c api -n test3
```

### Access Pod Shell

```bash
kubectl exec -it -n test3 <pod-name> -- sh
# or for bash
kubectl exec -it -n test3 <pod-name> -- bash
```

### Describe Resources

```bash
# Describe pod
kubectl describe pod <pod-name> -n test3

# Describe deployment
kubectl describe deployment ubexgo-api-test3 -n test3

# Describe ingress
kubectl describe ingress ubexgo-ingress -n test3
```

### Check Events

```bash
kubectl get events -n test3 --sort-by='.lastTimestamp'
```

### Database Issues

Connect to PostgreSQL:
```bash
# Get postgres pod name
kubectl get pods -n test3 | grep postgres

# Connect to database
kubectl exec -it -n test3 <postgres-pod-name> -- psql -U ubexgo -d ubexgo
```

### Image Pull Issues

If images aren't loading:
```bash
# Check if images exist in k3s
k3s ctr images ls | grep ubexgo

# Re-import images
docker save ubexgo-api-test3:latest | k3s ctr images import -
```

### ConfigMap Updates

After updating `.env` file, recreate the ConfigMap:
```bash
kubectl delete configmap ubexgo-test3-env -n test3
kubectl apply -k .
```

Then restart pods:
```bash
kubectl rollout restart deployment ubexgo-api-test3 -n test3
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
kubectl rollout restart deployment postgres-test3 -n test3
```

## Scaling

Scale deployments up or down:

```bash
# Scale API
kubectl scale deployment ubexgo-api-test3 -n test3 --replicas=3

# Scale Admin
kubectl scale deployment ubexgo-admin-test3 -n test3 --replicas=2
```

**Note:** PostgreSQL should typically remain at 1 replica unless using a clustered setup.

## Updating the Application

### Update API

```bash
cd apps/api
docker build -t ubexgo-api-test3:latest .
docker save ubexgo-api-test3:latest | k3s ctr images import -
kubectl rollout restart deployment ubexgo-api-test3 -n test3
```

### Update Admin

```bash
cd apps/admin
docker build -t ubexgo-admin-test3:latest .
docker save ubexgo-admin-test3:latest | k3s ctr images import -
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
```

## Backup and Restore

### Backup Database

```bash
kubectl exec -n test3 <postgres-pod-name> -- pg_dump -U ubexgo ubexgo > backup.sql
```

### Restore Database

```bash
kubectl exec -i -n test3 <postgres-pod-name> -- psql -U ubexgo ubexgo < backup.sql
```

## Monitoring

### Watch Pod Status

```bash
kubectl get pods -n test3 -w
```

### Resource Usage

```bash
kubectl top pods -n test3
kubectl top nodes
```

## Cleanup

To completely remove the deployment:

```bash
# Delete namespace (removes all resources)
kubectl delete namespace test3

# Reset PersistentVolumes
kubectl patch pv postgres-pv-test3 -p '{"spec":{"claimRef": null}}'

# Clean up images
k3s ctr images rm docker.io/library/ubexgo-api-test3:latest
k3s ctr images rm docker.io/library/ubexgo-admin-test3:latest
```

## Adding New Overlay

To deploy to a new domain (e.g., `production.example.com`):

1. Copy the test3 overlay:
```bash
cp -r overlays/test3 overlays/production
```

2. Update all files:
   - Change namespace in all YAML files
   - Update domain in `ingress.yaml`
   - Update environment variables in `.env`
   - Update image names in `kustomization.yaml`
   - Update paths in `deploy.sh`

3. Deploy:
```bash
cd overlays/production
./deploy.sh
```

## Best Practices

1. **Secrets Management**: Use Kubernetes Secrets for sensitive data instead of ConfigMaps
2. **Resource Limits**: Add resource requests and limits to deployments
3. **Health Checks**: Configure liveness and readiness probes
4. **Persistent Storage**: Regularly backup PostgreSQL data
5. **Image Tags**: Use specific version tags instead of `latest` in production
6. **Environment Separation**: Use separate namespaces for dev/staging/prod

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [cert-manager Documentation](https://cert-manager.io/docs/)

## Support

For issues or questions, contact the development team or open an issue in the project repository.

