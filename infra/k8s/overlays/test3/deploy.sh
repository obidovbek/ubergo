#!/bin/bash

set -e  # Exit on error

echo "🧹 Resetting namespace..."
kubectl delete namespace test3 --ignore-not-found
kubectl create namespace test3

echo "🧹 Resetting PersistentVolume..."
kubectl patch pv postgres-pv-test3 -p '{"spec":{"claimRef": null}}' || true

echo "🚀 Building API..."
cd ../../apps/api
docker build -t ubexgo-api-test3:latest .
docker save ubexgo-api-test3:latest -o ubexgo-api-test3.tar
k3s ctr images import ubexgo-api-test3.tar
rm -f ubexgo-api-test3.tar

echo "🚀 Building Admin..."
cd ../admin/
docker build -t ubexgo-admin-test3:latest .
docker save ubexgo-admin-test3:latest -o ubexgo-admin-test3.tar
k3s ctr images import ubexgo-admin-test3.tar
rm -f ubexgo-admin-test3.tar

echo "📦 Applying K8s manifests..."
cd ../../infra/k8s/overlays/test3/
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

