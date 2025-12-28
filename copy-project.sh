#!/bin/bash

# Script to copy this project to a new directory
# Usage: ./copy-project.sh <new-project-name>

if [ -z "$1" ]; then
    echo "Usage: ./copy-project.sh <new-project-name>"
    echo "Example: ./copy-project.sh my-new-project"
    exit 1
fi

NEW_PROJECT_NAME="$1"
CURRENT_DIR="/Users/derek/Public"
NEW_DIR="/Users/derek/$NEW_PROJECT_NAME"

if [ -d "$NEW_DIR" ]; then
    echo "Error: Directory $NEW_DIR already exists!"
    exit 1
fi

echo "Copying project to $NEW_DIR..."
echo ""

# Create new directory
mkdir -p "$NEW_DIR"

# Copy files, excluding node_modules, .next, and other build artifacts
rsync -av \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.vercel' \
    --exclude 'out' \
    --exclude '.git' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude '*.tsbuildinfo' \
    --exclude '.env*.local' \
    --exclude '.env' \
    "$CURRENT_DIR/" "$NEW_DIR/"

echo ""
echo "✅ Project copied successfully!"
echo ""
echo "Next steps:"
echo "1. cd $NEW_DIR"
echo "2. npm install"
echo "3. npm run dev"
echo ""
echo "The new project will run on a different port (or you can stop the current server first)"

