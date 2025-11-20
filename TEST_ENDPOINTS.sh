#!/bin/bash

# Test script to verify API endpoints are responding
BASE_URL="http://localhost:9080"

echo "========================================="
echo "Prantek API Endpoint Tests"
echo "========================================="
echo ""

echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/api/health" | jq -r '.status' 2>/dev/null || echo "FAILED"
echo ""

echo "2. Testing Init DB Endpoint..."
curl -s -X POST "$BASE_URL/api/init-db" | jq -r '.message' 2>/dev/null || echo "Response received"
echo ""

echo "3. Checking Application Status..."
pm2 list | grep prantek-app | awk '{print "Status: " $10}'
echo ""

echo "4. Recent Logs (last 5 lines)..."
pm2 logs prantek-app --lines 5 --nostream 2>/dev/null | tail -5
echo ""

echo "========================================="
echo "Test Complete"
echo "========================================="
