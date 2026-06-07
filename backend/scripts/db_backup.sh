#!/bin/bash
# MongoDB Backup Script - LIQIFIN
# This script can be run manually or configured as a cron job in production.

# Exit immediately if a command exits with a non-zero status
set -e

# Resolve scripts directory absolute path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load Environment variables if available
if [ -f "$BACKEND_DIR/.env" ]; then
  # Load dotenv variables ignoring commented lines
  export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)
fi

DB_URI=${MONGODB_URI:-"mongodb://127.0.0.1:27017/liquid-finance"}
BACKUP_DIR="$BACKEND_DIR/backups/$(date +%Y-%m-%d_%H-%M-%S)"

echo "============================================="
echo "  LIQIFIN Database Backup Service"
echo "  Timestamp: $(date)"
echo "  Targeting URI: ${DB_URI/:\([^:@]\+\)@/:****@}"
echo "============================================="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Run mongodump to dump the database
if command -v mongodump &> /dev/null; then
  mongodump --uri="$DB_URI" --out="$BACKUP_DIR"
  echo "SUCCESS: Backup stored successfully in: $BACKUP_DIR"
else
  echo "WARNING: 'mongodump' command not found."
  echo "Attempting backup using direct Docker volume archive..."
  
  # Fallback to docker container database dump if MongoDB is run inside docker-compose
  if command -v docker &> /dev/null && docker ps | grep -q "mongo"; then
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep "mongo" | head -n 1)
    echo "Found running Mongo container: $CONTAINER_NAME"
    docker exec "$CONTAINER_NAME" mongodump --out="/data/db/backup_temp"
    docker cp "$CONTAINER_NAME:/data/db/backup_temp" "$BACKUP_DIR"
    docker exec "$CONTAINER_NAME" rm -rf "/data/db/backup_temp"
    echo "SUCCESS: Backup extracted from docker container to: $BACKUP_DIR"
  else
    echo "ERROR: Backup failed. Neither local 'mongodump' nor a running Docker MongoDB instance was found."
    exit 1
  fi
fi
