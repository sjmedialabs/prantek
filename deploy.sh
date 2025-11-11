#!/bin/bash
set -e

echo "Building Next.js application..."
npm run build

echo "Copying static files to standalone..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "Restarting PM2..."
pm2 restart prantek-app

echo "Deployment complete!"
pm2 status prantek-app
