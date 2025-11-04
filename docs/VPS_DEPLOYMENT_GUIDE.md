# VPS Deployment Guide - Complete Step-by-Step

This guide will walk you through deploying your SaaS platform to a VPS (Virtual Private Server) hosting environment.

## Prerequisites

- A VPS with at least 2GB RAM, 2 CPU cores, 50GB storage
- Ubuntu 22.04 LTS (recommended) or similar Linux distribution
- Root or sudo access to the server
- A domain name pointing to your VPS IP address
- Basic knowledge of Linux command line

## Table of Contents

1. [Initial Server Setup](#1-initial-server-setup)
2. [Install Required Software](#2-install-required-software)
3. [Setup MongoDB](#3-setup-mongodb)
4. [Deploy Application](#4-deploy-application)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Setup Nginx Reverse Proxy](#6-setup-nginx-reverse-proxy)
7. [Setup SSL Certificate](#7-setup-ssl-certificate)
8. [Setup Process Manager (PM2)](#8-setup-process-manager-pm2)
9. [Security Hardening](#9-security-hardening)
10. [Monitoring and Maintenance](#10-monitoring-and-maintenance)

---

## 1. Initial Server Setup

### 1.1 Connect to Your VPS

\`\`\`bash
ssh root@your_server_ip
\`\`\`

### 1.2 Update System Packages

\`\`\`bash
apt update && apt upgrade -y
\`\`\`

### 1.3 Create a Non-Root User

\`\`\`bash
# Create new user
adduser deploy

# Add user to sudo group
usermod -aG sudo deploy

# Switch to new user
su - deploy
\`\`\`

### 1.4 Setup SSH Key Authentication (Optional but Recommended)

On your local machine:
\`\`\`bash
ssh-copy-id deploy@your_server_ip
\`\`\`

### 1.5 Configure Firewall

\`\`\`bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
\`\`\`

---

## 2. Install Required Software

### 2.1 Install Node.js (v20.x LTS)

\`\`\`bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
\`\`\`

### 2.2 Install MongoDB

\`\`\`bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
\`\`\`

### 2.3 Install Nginx

\`\`\`bash
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
\`\`\`

### 2.4 Install PM2 (Process Manager)

\`\`\`bash
sudo npm install -g pm2
\`\`\`

### 2.5 Install Git

\`\`\`bash
sudo apt install -y git
\`\`\`

---

## 3. Setup MongoDB

### 3.1 Secure MongoDB

\`\`\`bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "YOUR_STRONG_PASSWORD_HERE",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

# Exit mongosh
exit
\`\`\`

### 3.2 Enable Authentication

\`\`\`bash
# Edit MongoDB config
sudo nano /etc/mongod.conf
\`\`\`

Add/modify these lines:
\`\`\`yaml
security:
  authorization: enabled

net:
  bindIp: 127.0.0.1
  port: 27017
\`\`\`

Save and exit (Ctrl+X, Y, Enter)

\`\`\`bash
# Restart MongoDB
sudo systemctl restart mongod
\`\`\`

### 3.3 Create Application Database and User

\`\`\`bash
# Connect with admin user
mongosh -u admin -p --authenticationDatabase admin

# Create application database
use saas_platform

# Create application user
db.createUser({
  user: "saas_user",
  pwd: "YOUR_APP_DB_PASSWORD_HERE",
  roles: [ { role: "readWrite", db: "saas_platform" } ]
})

# Exit
exit
\`\`\`

### 3.4 Get MongoDB Connection String

Your MongoDB connection string will be:
\`\`\`
mongodb://saas_user:YOUR_APP_DB_PASSWORD_HERE@localhost:27017/saas_platform?authSource=saas_platform
\`\`\`

---

## 4. Deploy Application

### 4.1 Create Application Directory

\`\`\`bash
sudo mkdir -p /var/www/saas-platform
sudo chown -R deploy:deploy /var/www/saas-platform
cd /var/www/saas-platform
\`\`\`

### 4.2 Clone Your Repository

\`\`\`bash
# If using Git
git clone https://github.com/yourusername/your-repo.git .

# Or upload files using SCP from your local machine
# scp -r /path/to/your/project/* deploy@your_server_ip:/var/www/saas-platform/
\`\`\`

### 4.3 Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4.4 Build the Application

\`\`\`bash
npm run build
\`\`\`

---

## 5. Configure Environment Variables

### 5.1 Create Production Environment File

\`\`\`bash
nano .env.production
\`\`\`

Add the following variables:

\`\`\`env
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# MongoDB
MONGODB_URI=mongodb://saas_user:YOUR_APP_DB_PASSWORD_HERE@localhost:27017/saas_platform?authSource=saas_platform

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long

# Stripe (if using)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Vercel Blob (if using)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
\`\`\`

Save and exit (Ctrl+X, Y, Enter)

### 5.2 Generate Strong Secrets

\`\`\`bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
\`\`\`

Run this twice to generate both JWT_SECRET and JWT_REFRESH_SECRET

---

## 6. Setup Nginx Reverse Proxy

### 6.1 Create Nginx Configuration

\`\`\`bash
sudo nano /etc/nginx/sites-available/saas-platform
\`\`\`

Add the following configuration:

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP to HTTPS (will be enabled after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }

    # Client max body size (for file uploads)
    client_max_body_size 10M;
}
\`\`\`

Save and exit (Ctrl+X, Y, Enter)

### 6.2 Enable the Site

\`\`\`bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/saas-platform /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
\`\`\`

---

## 7. Setup SSL Certificate

### 7.1 Install Certbot

\`\`\`bash
sudo apt install -y certbot python3-certbot-nginx
\`\`\`

### 7.2 Obtain SSL Certificate

\`\`\`bash
# Make sure your domain is pointing to your server IP
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
\`\`\`

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 7.3 Test Auto-Renewal

\`\`\`bash
sudo certbot renew --dry-run
\`\`\`

The certificate will auto-renew before expiration.

---

## 8. Setup Process Manager (PM2)

### 8.1 Create PM2 Ecosystem File

\`\`\`bash
cd /var/www/saas-platform
nano ecosystem.config.js
\`\`\`

Add the following:

\`\`\`javascript
module.exports = {
  apps: [{
    name: 'saas-platform',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/saas-platform',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: '/var/log/pm2/saas-platform-error.log',
    out_file: '/var/log/pm2/saas-platform-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10
  }]
}
\`\`\`

Save and exit (Ctrl+X, Y, Enter)

### 8.2 Create Log Directory

\`\`\`bash
sudo mkdir -p /var/log/pm2
sudo chown -R deploy:deploy /var/log/pm2
\`\`\`

### 8.3 Start Application with PM2

\`\`\`bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Copy and run the command that PM2 outputs

# Check application status
pm2 status

# View logs
pm2 logs saas-platform

# Monitor application
pm2 monit
\`\`\`

### 8.4 Useful PM2 Commands

\`\`\`bash
# Restart application
pm2 restart saas-platform

# Stop application
pm2 stop saas-platform

# Delete application from PM2
pm2 delete saas-platform

# View logs
pm2 logs saas-platform --lines 100

# Clear logs
pm2 flush

# Monitor CPU and memory
pm2 monit
\`\`\`

---

## 9. Security Hardening

### 9.1 Disable Root Login

\`\`\`bash
sudo nano /etc/ssh/sshd_config
\`\`\`

Find and modify:
\`\`\`
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys
\`\`\`

Restart SSH:
\`\`\`bash
sudo systemctl restart sshd
\`\`\`

### 9.2 Install Fail2Ban

\`\`\`bash
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
\`\`\`

Find the [sshd] section and ensure it's enabled:
\`\`\`ini
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
\`\`\`

Start Fail2Ban:
\`\`\`bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
\`\`\`

### 9.3 Setup Automatic Security Updates

\`\`\`bash
sudo apt install -y unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
\`\`\`

### 9.4 Configure MongoDB Backup

Create backup script:
\`\`\`bash
sudo nano /usr/local/bin/mongodb-backup.sh
\`\`\`

Add:
\`\`\`bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://saas_user:YOUR_APP_DB_PASSWORD_HERE@localhost:27017/saas_platform?authSource=saas_platform" --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 7 days of backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
\`\`\`

Make executable:
\`\`\`bash
sudo chmod +x /usr/local/bin/mongodb-backup.sh
\`\`\`

Setup daily cron job:
\`\`\`bash
sudo crontab -e
\`\`\`

Add:
\`\`\`
0 2 * * * /usr/local/bin/mongodb-backup.sh
\`\`\`

---

## 10. Monitoring and Maintenance

### 10.1 Setup Log Rotation

\`\`\`bash
sudo nano /etc/logrotate.d/saas-platform
\`\`\`

Add:
\`\`\`
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
\`\`\`

### 10.2 Monitor System Resources

\`\`\`bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check MongoDB status
sudo systemctl status mongod

# Check Nginx status
sudo systemctl status nginx

# Check application logs
pm2 logs saas-platform --lines 50
\`\`\`

### 10.3 Application Updates

When you need to update your application:

\`\`\`bash
cd /var/www/saas-platform

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Build application
npm run build

# Restart application
pm2 restart saas-platform

# Check status
pm2 status
\`\`\`

### 10.4 Database Migrations

If you need to run database migrations:

\`\`\`bash
cd /var/www/saas-platform

# Run migration scripts
node scripts/migrate.js

# Or use MongoDB shell
mongosh -u saas_user -p --authenticationDatabase saas_platform saas_platform
\`\`\`

---

## Troubleshooting

### Application Won't Start

\`\`\`bash
# Check PM2 logs
pm2 logs saas-platform --err

# Check if port 3000 is in use
sudo lsof -i :3000

# Check environment variables
pm2 env 0
\`\`\`

### MongoDB Connection Issues

\`\`\`bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh -u saas_user -p --authenticationDatabase saas_platform saas_platform
\`\`\`

### Nginx Issues

\`\`\`bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
\`\`\`

### SSL Certificate Issues

\`\`\`bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nano /etc/nginx/sites-available/saas-platform
\`\`\`

### High Memory Usage

\`\`\`bash
# Check memory usage
free -h
pm2 monit

# Restart application
pm2 restart saas-platform

# Reduce PM2 instances
pm2 scale saas-platform 2
\`\`\`

---

## Performance Optimization

### 10.5 Enable Nginx Caching

Edit Nginx config:
\`\`\`bash
sudo nano /etc/nginx/sites-available/saas-platform
\`\`\`

Add caching configuration:
\`\`\`nginx
# Add at the top of the file
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;

# In the server block
location / {
    proxy_cache my_cache;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    proxy_cache_valid 200 60m;
    proxy_cache_bypass $http_cache_control;
    add_header X-Cache-Status $upstream_cache_status;
    
    # ... rest of proxy settings
}
\`\`\`

### 10.6 Enable Gzip Compression

\`\`\`bash
sudo nano /etc/nginx/nginx.conf
\`\`\`

Ensure gzip is enabled:
\`\`\`nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
\`\`\`

Reload Nginx:
\`\`\`bash
sudo systemctl reload nginx
\`\`\`

---

## Quick Reference Commands

\`\`\`bash
# Application Management
pm2 start ecosystem.config.js    # Start app
pm2 restart saas-platform         # Restart app
pm2 stop saas-platform            # Stop app
pm2 logs saas-platform            # View logs
pm2 monit                         # Monitor resources

# Nginx Management
sudo systemctl restart nginx      # Restart Nginx
sudo nginx -t                     # Test config
sudo systemctl reload nginx       # Reload config

# MongoDB Management
sudo systemctl restart mongod     # Restart MongoDB
mongosh -u saas_user -p          # Connect to DB

# SSL Certificate
sudo certbot renew               # Renew certificate
sudo certbot certificates        # Check certificates

# System Monitoring
df -h                            # Disk usage
free -h                          # Memory usage
top                              # CPU usage
sudo ufw status                  # Firewall status
\`\`\`

---

## Conclusion

Your SaaS platform is now deployed and running on your VPS! 

**Important Next Steps:**
1. Test all functionality thoroughly
2. Setup monitoring alerts (consider using services like UptimeRobot)
3. Configure regular backups
4. Document your specific configuration
5. Setup staging environment for testing updates

**Support Resources:**
- MongoDB Documentation: https://docs.mongodb.com/
- Nginx Documentation: https://nginx.org/en/docs/
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

For any issues, check the logs first:
- Application: `pm2 logs saas-platform`
- Nginx: `/var/log/nginx/error.log`
- MongoDB: `/var/log/mongodb/mongod.log`
