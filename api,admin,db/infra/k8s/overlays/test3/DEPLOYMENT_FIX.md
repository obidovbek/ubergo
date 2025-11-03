# Deploy Script Path Fix

## Issue Fixed

The original `deploy.sh` script had incorrect relative paths that caused the following error:

```bash
./infra/k8s/overlays/test3/deploy.sh: line 13: cd: ../../apps/api: No such file or directory
```

## Root Cause

The script is located at `infra/k8s/overlays/test3/deploy.sh` and was trying to navigate to `../../apps/api`, but that path only goes up 2 levels. From `test3/` directory, we need to go up 4 levels to reach the project root:

```
test3/ → overlays/ → k8s/ → infra/ → [project root]
```

## Solution

Updated the script to use absolute paths based on the script's location:

```bash
# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"

# Then use absolute paths
cd "$PROJECT_ROOT/apps/api"
cd "$PROJECT_ROOT/apps/admin"
cd "$SCRIPT_DIR"  # Back to overlay directory for kubectl apply
```

## Benefits

✅ **Works from any location** - You can run the script from anywhere  
✅ **No relative path confusion** - Clear absolute paths  
✅ **More robust** - Won't break if directory structure changes slightly  

## Usage

The script now works correctly:

```bash
# From project root
./infra/k8s/overlays/test3/deploy.sh

# From overlay directory
cd infra/k8s/overlays/test3/
./deploy.sh

# From any other location
/path/to/project/infra/k8s/overlays/test3/deploy.sh
```

## Verification

After the fix, you should see:

```bash
root@fstu:/home/fstu/projects/test/ubergo# ./infra/k8s/overlays/test3/deploy.sh
🧹 Resetting namespace...
namespace "test3" deleted
namespace/test3 created
🧹 Resetting PersistentVolume...
persistentvolume/postgres-pv-test3 patched (no change)
🚀 Building API...
[+] Building 2.5s ...
Successfully built and tagged ubexgo-api-test3:latest
🚀 Building Admin...
[+] Building 3.2s ...
Successfully built and tagged ubexgo-admin-test3:latest
📦 Applying K8s manifests...
deployment.apps/ubexgo-api-test3 created
service/api-service-test3 created
...
✅ Done.
```

## Files Changed

- `infra/k8s/overlays/test3/deploy.sh` - Fixed path navigation

## Date

October 24, 2025

