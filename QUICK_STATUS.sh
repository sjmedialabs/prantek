#!/bin/bash

echo "========================================="
echo "Prantek Application Quick Status"
echo "========================================="
echo ""

# Database Health
DB_STATUS=$(curl -s http://localhost:9080/api/health | jq -r '.checks.database' 2>/dev/null)
if [ "$DB_STATUS" = "true" ]; then
    echo "✅ Database: HEALTHY"
else
    echo "❌ Database: UNHEALTHY"
fi

# Application Status
APP_STATUS=$(pm2 list | grep prantek-app | awk '{print $18}')
if [ "$APP_STATUS" = "online" ]; then
    echo "✅ Application: RUNNING"
else
    echo "❌ Application: $APP_STATUS"
fi

# Memory Usage
MEM_USAGE=$(pm2 list | grep prantek-app | awk '{print $16}')
echo "📊 Memory Usage: $MEM_USAGE"

# Uptime
UPTIME=$(pm2 list | grep prantek-app | awk '{print $14}')
echo "⏱️  Uptime: $UPTIME"

echo ""
echo "Access at: http://31.97.224.169:9080/"
echo "Documentation: /www/wwwroot/prantek/FIXES_APPLIED.md"
echo ""
echo "========================================="
