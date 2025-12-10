#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
DIST_DIR="${ROOT_DIR}/dist"

# Use API_BASE from environment or default to /api
API_BASE="${API_BASE:-/api}"

echo "Building frontend with API_BASE=${API_BASE}"

pushd "${FRONTEND_DIR}" > /dev/null
API_BASE="${API_BASE}" bash build.sh
popd > /dev/null

rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

# Copy static assets into deployment directory
cp -a "${FRONTEND_DIR}/." "${DIST_DIR}/"

# Cleanup build-only scripts from output
rm -f "${DIST_DIR}/build.sh"

echo "Frontend assets copied to ${DIST_DIR}"
