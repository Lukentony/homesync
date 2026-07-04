#!/bin/bash
# DEPRECATED: Il runtime-config.json e' generato automaticamente dal entrypoint.
# Usare solo per debug locale.
# Setup runtime configuration for frontend PWA
# This script generates the runtime-config.json that contains the API base URL
# Used when frontend needs to communicate with backend in Docker networking

set -e

FRONTEND_DIR="${FRONTEND_DIR:=/app}"
API_URL="${API_URL:=http://localhost:8000}"

echo "Setting up runtime config..."
echo "  Frontend dir: $FRONTEND_DIR"
echo "  API URL: $API_URL"

# Create public directory if it doesn't exist
mkdir -p "$FRONTEND_DIR/public"

# Generate runtime-config.json
cat > "$FRONTEND_DIR/public/runtime-config.json" <<EOF
{
  "apiBaseUrl": "$API_URL",
  "version": "1.0.0",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✓ Runtime config generated at $FRONTEND_DIR/public/runtime-config.json"

# Also copy to dist if it exists (for production builds)
if [ -d "$FRONTEND_DIR/dist" ]; then
  cp "$FRONTEND_DIR/public/runtime-config.json" "$FRONTEND_DIR/dist/"
  echo "✓ Copied to dist directory"
fi

echo "Done!"
