#!/bin/bash
set -euo pipefail

# Default to relative API path when no override is provided
API_BASE="${API_BASE:-/api}"

# Generate env.js with the resolved API URL
cat > env.js << EOF
window.ENV = {
  API_BASE: "${API_BASE}"
};
EOF

echo "Environment configuration generated successfully (API_BASE=${API_BASE})"
