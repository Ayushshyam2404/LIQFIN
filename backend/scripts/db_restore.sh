#!/bin/bash
# ==============================================================================
# LIQIFIN — Database Recovery & Restore Automation Script
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Resolve scripts directory absolute path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load Environment variables if available
if [ -f "$BACKEND_DIR/.env" ]; then
  export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)
fi

DB_URI=${MONGODB_URI:-"mongodb://127.0.0.1:27017/liquid-finance"}
BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: $0 [backup_dir_path]"
  echo "Example: $0 $BACKEND_DIR/backups/2026-06-08_04-10-29"
  exit 1
fi

# Check if target directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  echo "[ERROR] Backup directory not found: $BACKUP_DIR"
  exit 1
fi

echo "======================================================================"
echo "  LIQIFIN Database Recovery Service"
echo "  Timestamp        : $(date)"
echo "  Source Directory : $BACKUP_DIR"
echo "  Target URI       : ${DB_URI/:\([^:@]\+\)@/:****@}"
echo "======================================================================"

# Run mongorestore
if command -v mongorestore &> /dev/null; then
  # --drop deletes collections from the database before restoring from backup
  mongorestore --uri="$DB_URI" --drop "$BACKUP_DIR"
  echo "SUCCESS: Database restoration completed successfully from: $BACKUP_DIR"
else
  echo "[WARNING] 'mongorestore' command not found."
  echo "Attempting restore using Docker container fallback..."
  
  # Fallback to docker container restore if MongoDB is run inside docker-compose
  if command -v docker &> /dev/null && docker ps | grep -q "mongo"; then
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep "mongo" | head -n 1)
    echo "Found running Mongo container: $CONTAINER_NAME"
    
    # Copy backup to docker container
    docker cp "$BACKUP_DIR" "$CONTAINER_NAME:/data/db/restore_temp"
    
    # Run mongorestore inside the container
    docker exec "$CONTAINER_NAME" mongorestore --drop "/data/db/restore_temp"
    
    # Cleanup container folder
    docker exec "$CONTAINER_NAME" rm -rf "/data/db/restore_temp"
    echo "SUCCESS: Database restored successfully inside container from: $BACKUP_DIR"
  else
    echo "[ERROR] Restoration failed. Neither local 'mongorestore' nor a running Docker MongoDB instance was found."
    exit 1
  fi
fi
