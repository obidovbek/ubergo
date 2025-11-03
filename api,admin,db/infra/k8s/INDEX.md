# UberGo Kubernetes - Documentation Index

This directory contains all Kubernetes deployment configurations and documentation for the UberGo project.

## 📚 Documentation Overview

### For Quick Start
Start here if you want to deploy quickly:
1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Common commands and quick deploy steps

### For Complete Understanding
Read these for comprehensive knowledge:
1. **[KUBERNETES_DEPLOYMENT.md](../../KUBERNETES_DEPLOYMENT.md)** - Complete deployment guide (root level)
2. **[README.md](./README.md)** - Kubernetes-specific documentation
3. **[overlays/test3/README.md](./overlays/test3/README.md)** - test3.fstu.uz specific guide

### For Context and Comparison
4. **[STRUCTURE_COMPARISON.md](./STRUCTURE_COMPARISON.md)** - How UberGo compares to ferpiControl
5. **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Summary of what was created

## 🎯 Quick Navigation

### I want to...

#### Deploy to test3.fstu.uz
```bash
cd overlays/test3/
cp env.example .env
# Edit .env
./deploy.sh
```
👉 See: [overlays/test3/README.md](./overlays/test3/README.md)

#### Understand the architecture
👉 See: [README.md](./README.md) - Architecture section

#### Find common commands
👉 See: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

#### Compare with ferpiControl
👉 See: [STRUCTURE_COMPARISON.md](./STRUCTURE_COMPARISON.md)

#### Add a new deployment
👉 See: [README.md](./README.md) - Adding New Overlay section

#### Troubleshoot issues
👉 See: [README.md](./README.md) - Troubleshooting section

#### Enable SSL/TLS
👉 See: [KUBERNETES_DEPLOYMENT.md](../../KUBERNETES_DEPLOYMENT.md) - SSL/TLS section

#### Manage database
👉 See: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Database section

## 📁 File Structure

```
k8s/
├── INDEX.md                          # This file - Documentation index
├── KUBERNETES_DEPLOYMENT.md          # Complete deployment guide (symlink from root)
├── README.md                         # K8s comprehensive documentation
├── QUICK_REFERENCE.md                # Quick command reference
├── STRUCTURE_COMPARISON.md           # Comparison with ferpiControl
├── DEPLOYMENT_SUMMARY.md             # Summary of deployment setup
├── ingressclass-traefik.yaml         # Traefik IngressClass definition
└── overlays/
    └── test3/                        # test3.fstu.uz deployment
        ├── api-deployment.yaml       # API backend Deployment
        ├── api-service.yaml          # API backend Service
        ├── admin-deployment.yaml     # Admin frontend Deployment
        ├── admin-service.yaml        # Admin frontend Service
        ├── postgres.yaml             # PostgreSQL (PV, PVC, Service, Deployment)
        ├── ingress.yaml              # Ingress routing rules
        ├── clusterissuer.yaml        # Let's Encrypt certificate issuer
        ├── kustomization.yaml        # Kustomize configuration
        ├── env.example               # Environment variables template
        ├── deploy.sh                 # Automated deployment script
        └── README.md                 # test3-specific documentation
```

## 📖 Documentation Guide

### Level 1: Beginner - Just Want to Deploy

**Start with:**
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Get deployment command
2. [overlays/test3/README.md](./overlays/test3/README.md) - Follow quick deploy steps

**Time needed:** 15 minutes

### Level 2: Intermediate - Want to Understand

**Read in order:**
1. [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Understand what exists
2. [README.md](./README.md) - Learn architecture and resources
3. [overlays/test3/README.md](./overlays/test3/README.md) - Understand overlay-specific config

**Time needed:** 30-45 minutes

### Level 3: Advanced - Want Complete Knowledge

**Read all:**
1. [KUBERNETES_DEPLOYMENT.md](../../KUBERNETES_DEPLOYMENT.md) - Complete guide
2. [README.md](./README.md) - Comprehensive K8s docs
3. [STRUCTURE_COMPARISON.md](./STRUCTURE_COMPARISON.md) - Design rationale
4. [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Implementation details
5. [overlays/test3/README.md](./overlays/test3/README.md) - Overlay specifics

**Time needed:** 1-2 hours

## 🚀 Quick Start by Role

### DevOps Engineer
You want complete understanding:
1. [STRUCTURE_COMPARISON.md](./STRUCTURE_COMPARISON.md) - See design pattern
2. [README.md](./README.md) - Understand implementation
3. [KUBERNETES_DEPLOYMENT.md](../../KUBERNETES_DEPLOYMENT.md) - Full deployment guide

### Developer
You need to deploy and update:
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common commands
2. [overlays/test3/README.md](./overlays/test3/README.md) - Deploy and update
3. [README.md](./README.md) - Reference when needed

### System Administrator
You manage infrastructure:
1. [README.md](./README.md) - Architecture and operations
2. [KUBERNETES_DEPLOYMENT.md](../../KUBERNETES_DEPLOYMENT.md) - Complete ops guide
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Daily operations

### New Team Member
You're learning the project:
1. [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Overview
2. [STRUCTURE_COMPARISON.md](./STRUCTURE_COMPARISON.md) - Understand design
3. [README.md](./README.md) - Deep dive
4. Try deploying to test environment

## 🎓 Learning Path

### Phase 1: Understanding (30 min)
- [ ] Read [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)
- [ ] Review file structure above
- [ ] Skim [README.md](./README.md) architecture section

### Phase 2: Deployment (1 hour)
- [ ] Read [overlays/test3/README.md](./overlays/test3/README.md)
- [ ] Configure `.env` file
- [ ] Run deployment
- [ ] Verify deployment successful

### Phase 3: Operations (1 hour)
- [ ] Practice commands from [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [ ] View logs, access pods
- [ ] Connect to database
- [ ] Update application

### Phase 4: Mastery (2+ hours)
- [ ] Read [KUBERNETES_DEPLOYMENT.md](../../KUBERNETES_DEPLOYMENT.md) fully
- [ ] Understand all resource types
- [ ] Learn troubleshooting techniques
- [ ] Create a new overlay for another environment

## 📋 Cheat Sheet

### Most Common Commands
```bash
# Deploy
cd infra/k8s/overlays/test3/ && ./deploy.sh

# Check status
kubectl get pods -n test3

# View logs
kubectl logs -f deployment/ubexgo-api-test3 -n test3

# Access pod
kubectl exec -it deployment/ubexgo-api-test3 -n test3 -- sh

# Update app
kubectl rollout restart deployment ubexgo-api-test3 -n test3

# Database backup
POD=$(kubectl get pods -n test3 -l app=postgres-test3 -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n test3 $POD -- pg_dump -U ubexgo ubexgo > backup.sql
```

## 🔗 External Resources

### Kubernetes
- [Official Docs](https://kubernetes.io/docs/)
- [Kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

### Tools
- [Kustomize](https://kustomize.io/)
- [Traefik](https://doc.traefik.io/traefik/)
- [cert-manager](https://cert-manager.io/docs/)

### PostgreSQL
- [Official Docs](https://www.postgresql.org/docs/)
- [Backup and Restore](https://www.postgresql.org/docs/current/backup.html)

## ❓ FAQ

**Q: Which document should I read first?**  
A: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for quick start, [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for overview.

**Q: How do I deploy to test3.fstu.uz?**  
A: See [overlays/test3/README.md](./overlays/test3/README.md) - Quick Deploy section.

**Q: How is this different from ferpiControl?**  
A: See [STRUCTURE_COMPARISON.md](./STRUCTURE_COMPARISON.md) for detailed comparison.

**Q: What do I need to change before deploying?**  
A: Database password, JWT secrets, and API keys in `.env` file.

**Q: How do I enable SSL/TLS?**  
A: See [KUBERNETES_DEPLOYMENT.md](../../KUBERNETES_DEPLOYMENT.md) - Enabling SSL/TLS section.

**Q: How do I add another deployment?**  
A: See [README.md](./README.md) - Adding New Overlay section.

**Q: Something broke, what do I do?**  
A: See [README.md](./README.md) - Troubleshooting section.

## 🆘 Getting Help

1. **Check documentation** in this directory
2. **View logs**: `kubectl logs -f <pod-name> -n test3`
3. **Check events**: `kubectl get events -n test3`
4. **Describe resource**: `kubectl describe <resource> <name> -n test3`
5. **Contact DevOps team** if issue persists

## ✅ Verification

After deployment, verify:
```bash
# All pods running
kubectl get pods -n test3

# Services have endpoints
kubectl get endpoints -n test3

# Ingress configured
kubectl get ingress -n test3

# Application accessible
curl http://test3.fstu.uz
```

## 🔄 Update History

- **October 2025** - Initial K8s deployment created for test3.fstu.uz
- Based on ferpiControl project structure
- Complete documentation suite added

## 📞 Support

- **Documentation**: This directory
- **Issues**: Check [README.md](./README.md) Troubleshooting section
- **Questions**: Contact DevOps team

---

**Quick Links:**
- 🚀 [Quick Start](./QUICK_REFERENCE.md)
- 📖 [Full Documentation](./README.md)
- 🎯 [Deployment Guide](../../KUBERNETES_DEPLOYMENT.md)
- 📊 [Comparison](./STRUCTURE_COMPARISON.md)
- 📋 [Summary](./DEPLOYMENT_SUMMARY.md)

**Last Updated:** October 2025

