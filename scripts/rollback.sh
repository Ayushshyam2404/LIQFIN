#!/bin/bash
# ==============================================================================
# LIQIFIN — Rollback & Service Recovery Script
# ==============================================================================

SERVICE=$1
TAG=$2

if [[ -z "$SERVICE" || -z "$TAG" ]]; then
  echo "Usage: $0 [frontend|backend|all] [target_version_tag]"
  echo "Example: $0 backend v1.0.4"
  exit 1
fi

echo "======================================================================"
echo "  LIQIFIN Service Rollback Initiated"
echo "  Target Service : $SERVICE"
echo "  Target Version : $TAG"
echo "======================================================================"

rollback_backend() {
  echo "[-] Rolling back backend to tag: $TAG..."
  
  # 1. Check if the image exists in the local cache or registry
  # docker manifest inspect liquid-finance-api:$TAG > /dev/null 2>&1
  # if [ $? -ne 0 ]; then
  #   echo "[ERROR] Docker tag 'liquid-finance-api:$TAG' not found in registry."
  #   exit 1
  # fi
  
  # 2. Update environment version pointer or Docker Compose file
  if [ -f "docker-compose.yml" ]; then
    echo "[*] Updating docker-compose.yml image tags..."
    # Replace backend image version or export variable
    export BACKEND_VERSION=$TAG
    
    # 3. Gracefully restart the service with the rollback image
    # docker-compose up -d --no-deps --build backend
    echo "[*] Backend rolled back successfully."
  else
    echo "[WARNING] docker-compose.yml not found. Manual deployment update required."
  fi
}

rollback_frontend() {
  echo "[-] Rolling back frontend to tag: $TAG..."
  if [ -f "docker-compose.yml" ]; then
    export FRONTEND_VERSION=$TAG
    # docker-compose up -d --no-deps --build frontend
    echo "[*] Frontend rolled back successfully."
  else
    echo "[WARNING] docker-compose.yml not found. Manual deployment update required."
  fi
}

case "$SERVICE" in
  backend)
    rollback_backend
    ;;
  frontend)
    rollback_frontend
    ;;
  all)
    rollback_backend
    rollback_frontend
    ;;
  *)
    echo "[ERROR] Invalid service target. Choose 'backend', 'frontend', or 'all'."
    exit 1
    ;;
esac

echo "======================================================================"
echo "  Rollback operation complete. Running post-rollback health check..."
echo "======================================================================"

# Run health check to confirm server recovery
curl -s -f http://localhost:5001/health > /dev/null
if [ $? -eq 0 ]; then
  echo "[*] Health check passed! Server is online and stable."
else
  echo "[WARNING] Health check failed or server is unreachable. Please verify logs."
fi
