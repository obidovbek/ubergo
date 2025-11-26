#!/bin/bash

set -e  # Exit on error

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"

echo "🧹 Resetting namespace..."
kubectl delete namespace test3 --ignore-not-found
kubectl create namespace test3

echo "🧹 Resetting PersistentVolumes..."
kubectl patch pv postgres-pv-test3 -p '{"spec":{"claimRef": null}}' || true
kubectl patch pv uploads-pv-test3 -p '{"spec":{"claimRef": null}}' || true

echo "🚀 Building API..."
cd "$PROJECT_ROOT/apps/api"
docker build -t ubexgo-api-test3:latest .
docker save ubexgo-api-test3:latest -o ubexgo-api-test3.tar
k3s ctr images import ubexgo-api-test3.tar
rm -f ubexgo-api-test3.tar

echo "🚀 Building Admin..."
cd "$PROJECT_ROOT/apps/admin"
docker build -t ubexgo-admin-test3:latest .
docker save ubexgo-admin-test3:latest -o ubexgo-admin-test3.tar
k3s ctr images import ubexgo-admin-test3.tar
rm -f ubexgo-admin-test3.tar

echo "📦 Applying K8s manifests..."
cd "$SCRIPT_DIR"
kubectl apply -k .

echo "✅ Done."
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n test3"
echo "  kubectl logs -f <pod-name> -n test3"
echo "  kubectl exec -it -n test3 <pod-name> -- sh"
echo "  kubectl describe pod <pod-name> -n test3"
echo ""
echo "Check deployment status:"
echo "  kubectl get deployments -n test3"
echo "  kubectl get services -n test3"
echo "  kubectl get ingress -n test3"

