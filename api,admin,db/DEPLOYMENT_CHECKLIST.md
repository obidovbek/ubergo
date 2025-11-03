# Deployment Checklist - ESM Fix

## ✅ Pre-Deployment Verification

### 1. File Structure Check
```
src/i18n/
├── index.ts           ✅ Created
├── types.ts           ✅ Created  
├── config.ts          ✅ Created
├── translator.ts      ✅ Updated
└── translations/
    ├── uz.ts          ✅ Exists
    ├── en.ts          ✅ Exists
    └── ru.ts          ✅ Exists
```

### 2. Middleware Updates
```
src/middleware/
├── errorHandler.ts    ✅ Updated imports
└── validator.ts       ✅ Updated imports
```

### 3. Code Quality
- ✅ No linter errors
- ✅ TypeScript compilation passes
- ✅ Proper ESM syntax

## 🚀 Deployment Steps

### Step 1: Commit Changes
```bash
cd api,admin,db
git add apps/api/src/i18n/
git add apps/api/src/middleware/errorHandler.ts
git add apps/api/src/middleware/validator.ts
git commit -m "Fix: ESM module exports for i18n system

- Split i18n into types.ts and config.ts for proper ESM compatibility
- Use explicit 'export type' syntax for TypeScript types
- Update middleware imports to use new module structure
- Fixes SyntaxError in Kubernetes deployment"
```

### Step 2: Build Docker Image
```bash
# From project root
docker build -t ubexgo-api:latest -f api,admin,db/apps/api/Dockerfile api,admin,db/apps/api/

# Or if using docker-compose
cd api,admin,db/infra/compose
docker-compose build api
```

### Step 3: Test Locally (Optional but Recommended)
```bash
# Run the container
docker run -p 4001:4000 ubexgo-api:latest

# Check logs
docker logs <container-id>

# Should NOT see:
# "SyntaxError: The requested module './index.js' does not provide an export named 'Language'"
```

### Step 4: Push to Registry
```bash
# Tag for your registry
docker tag ubexgo-api:latest <your-registry>/ubexgo-api:v1.x.x

# Push
docker push <your-registry>/ubexgo-api:v1.x.x
```

### Step 5: Deploy to Kubernetes
```bash
# Update the image in your deployment
kubectl set image deployment/ubexgo-api-test3 api=<your-registry>/ubexgo-api:v1.x.x -n test3

# Or apply the updated manifest
kubectl apply -f k8s/deployment.yaml -n test3
```

### Step 6: Verify Deployment
```bash
# Watch the pod status
kubectl get pods -n test3 -w

# Check pod logs
kubectl logs -f ubexgo-api-test3-<pod-id> -n test3

# Expected: Normal startup logs, NO syntax errors
# Should see something like:
# "Server listening on port 4000"
# "Database connected"
```

## ✅ Success Criteria

### The deployment is successful if:
1. ✅ Pod starts without crashing
2. ✅ No SyntaxError in logs
3. ✅ API responds to health check
4. ✅ Validation endpoints work correctly
5. ✅ Multilingual errors are returned

### Test Validation:
```bash
# Test health endpoint
kubectl exec -it ubexgo-api-test3-<pod-id> -n test3 -- curl http://localhost:4000/health

# Test validation with different languages
# From outside the cluster (replace with your service URL)
curl -X POST http://your-api-url/api/driver/personal-info \
  -H "Accept-Language: uz" \
  -H "Content-Type: application/json" \
  -d '{"first_name":""}'

# Should return:
# {"success":false,"message":"Ma'lumotlar noto'g'ri","errors":[...]}
```

## 🔍 Troubleshooting

### If pod still crashes:

1. **Check logs for the exact error:**
   ```bash
   kubectl logs ubexgo-api-test3-<pod-id> -n test3
   ```

2. **Verify the image was rebuilt:**
   ```bash
   kubectl describe pod ubexgo-api-test3-<pod-id> -n test3 | grep Image
   ```

3. **Check if old image is cached:**
   ```bash
   # Force pull new image
   kubectl delete pod ubexgo-api-test3-<pod-id> -n test3
   ```

4. **Verify TypeScript compilation:**
   ```bash
   cd api,admin,db/apps/api
   npm run build
   # Check for any compilation errors
   ```

### If validation doesn't work:

1. **Check translation files exist in the image:**
   ```bash
   kubectl exec -it ubexgo-api-test3-<pod-id> -n test3 -- ls -la /app/src/i18n/translations/
   ```

2. **Test the translation function:**
   ```bash
   kubectl exec -it ubexgo-api-test3-<pod-id> -n test3 -- node -e "
   import('./app/src/i18n/translator.js').then(m => console.log(m.t('common.success', 'uz')))
   "
   ```

## 📊 Monitoring

After deployment, monitor:
- Pod restart count (should remain 0)
- API response times
- Error rates
- Validation error responses

```bash
# Watch pod status
kubectl get pods -n test3 -l app=ubexgo-api -w

# Check restart count
kubectl get pods -n test3 -l app=ubexgo-api -o jsonpath='{.items[*].status.containerStatuses[*].restartCount}'
```

## 🎉 Completion

Once all checks pass:
- ✅ Mark deployment as successful
- ✅ Update team on successful fix
- ✅ Document any issues encountered
- ✅ Remove old backup if exists

## 📝 Rollback Plan (If Needed)

If the deployment fails and needs rollback:

```bash
# Rollback to previous version
kubectl rollout undo deployment/ubexgo-api-test3 -n test3

# Check rollback status
kubectl rollout status deployment/ubexgo-api-test3 -n test3
```

---

**Last Updated:** $(date)
**Issue:** ESM module export syntax error
**Fix:** Split i18n types and config for proper ESM compatibility

