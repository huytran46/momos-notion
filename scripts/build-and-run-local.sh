#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:-momos-notion:local}"
CONTAINER_NAME="${CONTAINER_NAME:-momos-notion-local}"
HOST_PORT="${HOST_PORT:-3000}"
CONTAINER_PORT=3000

command -v docker >/dev/null 2>&1 || {
  echo "Docker is required but not installed or not in PATH." >&2
  exit 1
}

echo "Building image '${IMAGE_TAG}'..."
docker build -t "${IMAGE_TAG}" .

if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}$"; then
  echo "Removing existing container '${CONTAINER_NAME}'..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

echo "Starting container '${CONTAINER_NAME}' on host port ${HOST_PORT}..."
docker run --rm -d -p "${HOST_PORT}:${CONTAINER_PORT}" --name "${CONTAINER_NAME}" "${IMAGE_TAG}"

echo "Container is running."
echo "Open http://localhost:${HOST_PORT}"

