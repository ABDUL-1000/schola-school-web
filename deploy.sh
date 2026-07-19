#!/bin/bash
set -e

# Default values if arguments are not provided
TARGET_DIR=${1:-"/home/edumatrixapi/htdocs/school-web"}
DOCKER_NAME=${2:-"school-web"}
IMAGE_NAME=${3:-"schola-school-web:latest"}
TAR_FILE=${4:-"school-web-prod.tar"}

echo "Starting deployment for $DOCKER_NAME..."
echo "Target Directory: $TARGET_DIR"

cd "$TARGET_DIR"

echo "Loading Docker image..."
docker load -i "$TAR_FILE"
rm -f "$TAR_FILE"

echo "Managing Docker container '$DOCKER_NAME'..."
DOCKER_NAME=$DOCKER_NAME IMAGE_NAME=$IMAGE_NAME docker compose -p $DOCKER_NAME up -d

echo "Deployed successfully"
