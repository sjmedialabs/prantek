#!/bin/bash
# Build and deploy script for standalone Next.js app

echo "Building Next.js application..."
npm run build

echo "Copying static files to standalone directory..."
cp -r .next/static .next/standalone/.next/

echo "Copying public directory to standalone..."
cp -r public .next/standalone/

echo "Build complete! Restart PM2 with: pm2 restart prantek-app"
