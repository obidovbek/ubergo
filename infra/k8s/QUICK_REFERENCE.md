# Kubernetes Quick Reference - UberGo

## Quick Deploy (test3.fstu.uz)

```bash
cd infra/k8s/overlays/test3/
cp env.example .env
# Edit .env with your values
./deploy.sh
```

## Common Commands

### Check Status
```bash
kubectl get pods -n test3                    # List pods
kubectl get svc -n test3                     # List services
kubectl get ingress -n test3                 # List ingress
kubectl get all -n test3                     # List all resources
```

### View Logs
```bash
kubectl logs -f deployment/ubexgo-api-test3 -n test3      # API logs
kubectl logs -f deployment/ubexgo-admin-test3 -n test3    # Admin logs
kubectl logs -f deployment/postgres-test3 -n test3        # DB logs
```

### Access Pods
```bash
kubectl exec -it deployment/ubexgo-api-test3 -n test3 -- sh
kubectl exec -it deployment/ubexgo-admin-test3 -n test3 -- sh
kubectl exec -it deployment/postgres-test3 -n test3 -- sh
```

### Database
```bash
# Connect to PostgreSQL
POD=$(kubectl get pods -n test3 -l app=postgres-test3 -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it -n test3 $POD -- psql -U ubexgo -d ubexgo

# Backup
kubectl exec -n test3 $POD -- pg_dump -U ubexgo ubexgo > backup.sql

# Restore
kubectl exec -i -n test3 $POD -- psql -U ubexgo ubexgo < backup.sql
```

### Update Application
```bash
# Quick update (rebuild and redeploy)
cd infra/k8s/overlays/test3/
./deploy.sh

# Or manual restart
kubectl rollout restart deployment ubexgo-api-test3 -n test3
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
```

### Update Environment Variables
```bash
# Edit .env file
nano .env

# Delete old ConfigMap
kubectl delete configmap ubexgo-test3-env -n test3

# Apply new config
kubectl apply -k .

# Restart pods
kubectl rollout restart deployment ubexgo-api-test3 -n test3
kubectl rollout restart deployment ubexgo-admin-test3 -n test3
```

### Troubleshooting
```bash
# Describe pod (shows events and errors)
kubectl describe pod <pod-name> -n test3

# Get recent events
kubectl get events -n test3 --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n test3
kubectl top nodes

# Port forward (test locally)
kubectl port-forward -n test3 svc/api-service-test3 4000:80
kubectl port-forward -n test3 svc/admin-service-test3 8080:80
```

### Scaling
```bash
kubectl scale deployment ubexgo-api-test3 -n test3 --replicas=3
kubectl scale deployment ubexgo-admin-test3 -n test3 --replicas=2
```

### Cleanup
```bash
# Delete everything
kubectl delete namespace test3
kubectl patch pv postgres-pv-test3 -p '{"spec":{"claimRef": null}}'

# Clean images
k3s ctr images rm docker.io/library/ubexgo-api-test3:latest
k3s ctr images rm docker.io/library/ubexgo-admin-test3:latest
```

## File Structure

```
infra/k8s/
├── ingressclass-traefik.yaml          # Ingress controller config
├── README.md                          # Full documentation
├── QUICK_REFERENCE.md                 # This file
└── overlays/
    └── test3/                         # test3.fstu.uz deployment
        ├── *.yaml                     # K8s resource definitions
        ├── env.example                # Environment template
        ├── deploy.sh                  # Deployment script
        └── README.md                  # Overlay-specific docs
```

## Application URLs

- **Admin**: https://test3.fstu.uz
- **API**: https://test3.fstu.uz/api

## Resource Names (test3 overlay)

- **Namespace**: test3
- **API Deployment**: ubexgo-api-test3
- **API Service**: api-service-test3
- **Admin Deployment**: ubexgo-admin-test3
- **Admin Service**: admin-service-test3
- **PostgreSQL Deployment**: postgres-test3
- **PostgreSQL Service**: postgres-service-test3
- **PostgreSQL PVC**: postgres-pvc-test3
- **ConfigMap**: ubexgo-test3-env
- **Ingress**: ubexgo-ingress

## Important Notes

⚠️ **Before deploying**:
1. Copy `env.example` to `.env`
2. Change database passwords
3. Generate new JWT secrets
4. Update API keys if needed

⚠️ **Security**:
- Never commit `.env` files
- Use strong passwords in production
- Enable SSL/TLS for production
- Regular backups of database

⚠️ **PostgreSQL**:
- Keep at 1 replica (unless using replication)
- Regular backups are critical
- Data stored at: `/opt/local-path-provisioner/postgres-data-test3`

## Quick Fixes

### Pods not starting
```bash
kubectl describe pod <pod-name> -n test3
kubectl logs <pod-name> -n test3
./deploy.sh  # Rebuild and redeploy
```

### Can't access via domain
```bash
kubectl describe ingress ubexgo-ingress -n test3
kubectl get pods -n kube-system | grep traefik
# Check DNS: nslookup test3.fstu.uz
```

### Database connection failed
```bash
kubectl get pods -n test3 | grep postgres
kubectl get svc postgres-service-test3 -n test3
kubectl logs -f deployment/postgres-test3 -n test3
```

### Image not found
```bash
k3s ctr images ls | grep ubexgo-test3
./deploy.sh  # Rebuild and import images
```

## For More Information

See:
- `README.md` - Full documentation
- `overlays/test3/README.md` - test3-specific docs
- `../../KUBERNETES_DEPLOYMENT.md` - Complete deployment guide

