#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# Stop this project's containers only (leave every other project's containers alone)
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Remove this project's old images only, by exact tag
docker rmi -f bassir-stock-system-server:latest bassir-stock-system-client:latest 2>/dev/null || true

# Load the freshly-built images from the tarball
docker load -i bassir-stock-system.tar

# Start the new containers
docker compose -f docker-compose.prod.yml up -d
