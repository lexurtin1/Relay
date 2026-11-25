#!/bin/sh
# One job container when Docker and goose are both available.
# Unit tests use fakes and do not need this script.
set -eu

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "Docker is not available. Skipping the live sandbox."
  exit 0
fi

if ! command -v goose >/dev/null 2>&1; then
  echo "goose is not on PATH. Skipping the live sandbox."
  exit 0
fi

name="relay-runner-smoke-$$"
docker run -d --name "$name" --cap-drop ALL --network none node:22-bookworm-slim sleep 30
docker exec "$name" node -e "console.log('workspace ready')"
docker rm -f "$name" >/dev/null
echo "Removed smoke container $name"
