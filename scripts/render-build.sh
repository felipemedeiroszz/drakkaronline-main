#!/bin/bash

# Render build script
echo "Starting Render build process..."

# Remove any pnpm lock files if they exist
rm -f pnpm-lock.yaml
rm -f .pnpm-debug.log*

# Clear npm cache to avoid conflicts
npm cache clean --force

# Install dependencies with npm
echo "Installing dependencies with npm..."
npm install --legacy-peer-deps

# Build the Next.js application
echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"