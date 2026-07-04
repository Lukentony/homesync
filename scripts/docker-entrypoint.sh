#!/bin/bash
# Docker entrypoint for HomeSync backend
# Handles database initialization with migration locking to prevent race conditions

set -e

DATA_DIR="${DATA_DIR:=/data}"
MIGRATION_LOCK="$DATA_DIR/migrations.lock"
MIGRATION_TIMEOUT=120  # seconds

echo "[Entrypoint] Starting HomeSync backend..."
echo "[Entrypoint] Data directory: $DATA_DIR"

# Ensure data directory exists with proper permissions
if [ ! -d "$DATA_DIR" ]; then
  echo "[Entrypoint] Creating data directory..."
  mkdir -p "$DATA_DIR"
  chmod 777 "$DATA_DIR"
fi

# Migration locking mechanism
acquire_migration_lock() {
  local waited=0
  while [ $waited -lt $MIGRATION_TIMEOUT ]; do
    if mkdir "$MIGRATION_LOCK" 2>/dev/null; then
      echo "[Entrypoint] Migration lock acquired"
      return 0
    fi
    echo "[Entrypoint] Waiting for migration lock (${waited}s)..."
    sleep 2
    waited=$((waited + 2))
  done
  echo "[Entrypoint] ERROR: Could not acquire migration lock after ${MIGRATION_TIMEOUT}s"
  return 1
}

release_migration_lock() {
  if [ -d "$MIGRATION_LOCK" ]; then
    rmdir "$MIGRATION_LOCK" || true
    echo "[Entrypoint] Migration lock released"
  fi
}

# Check if database already exists (migrations already done)
if [ -f "$DATA_DIR/homesync.db" ]; then
  echo "[Entrypoint] Database already exists, skipping migrations..."
  # Clean up any stale lock
  if [ -d "$MIGRATION_LOCK" ]; then
    rmdir "$MIGRATION_LOCK" 2>/dev/null || true
  fi
else
  # Acquire lock before migrations
  if ! acquire_migration_lock; then
    echo "[Entrypoint] WARNING: Could not acquire lock, proceeding anyway..."
  fi
fi

# Trap to ensure lock is released on exit
trap release_migration_lock EXIT

# Start the application
echo "[Entrypoint] Starting uvicorn..."
exec "$@"
