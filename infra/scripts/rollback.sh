#!/usr/bin/env bash
# Roll back the Kubernetes deployment to the previous image revision.
# Usage: ./rollback.sh [api|web] [namespace]
set -euo pipefail

DEPLOYMENT="${1:-api}"
NAMESPACE="${2:-obraflux}"

if [[ "$DEPLOYMENT" != "api" && "$DEPLOYMENT" != "web" ]]; then
  echo "Usage: $0 [api|web] [namespace]"
  exit 1
fi

echo "▶  Rolling back $DEPLOYMENT deployment in namespace $NAMESPACE..."
kubectl rollout undo deployment/"$DEPLOYMENT" -n "$NAMESPACE"

echo "▶  Waiting for rollout to complete..."
kubectl rollout status deployment/"$DEPLOYMENT" -n "$NAMESPACE" --timeout=120s

echo "✓  Rollback complete."
kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT"
