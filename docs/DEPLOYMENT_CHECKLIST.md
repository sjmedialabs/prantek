# VPS Deployment Checklist

Use this checklist to ensure you've completed all necessary steps for deploying your SaaS platform to a VPS.

## Pre-Deployment

- [ ] VPS purchased and accessible (minimum 2GB RAM, 2 CPU cores)
- [ ] Domain name registered and DNS configured
- [ ] Domain A record pointing to VPS IP address
- [ ] SSH access to VPS confirmed
- [ ] All environment variables documented
- [ ] Stripe account setup (if using payments)
- [ ] Email service configured (if using email features)

## Server Setup

- [ ] System packages updated (`apt update && apt upgrade`)
- [ ] Non-root user created with sudo privileges
- [ ] SSH key authentication configured
- [ ] Firewall configured (UFW) with ports 22, 80, 443 open
- [ ] Node.js v20.x installed and verified
- [ ] MongoDB 7.0 installed and running
- [ ] Nginx installed and running
- [ ] PM2 installed globally
- [ ] Git installed

## MongoDB Configuration

- [ ] MongoDB admin user created
- [ ] MongoDB authentication enabled
- [ ] Application database created
- [ ] Application database user created with proper permissions
- [ ] MongoDB connection string documented
- [ ] MongoDB bound to localhost only (security)
- [ ] MongoDB backup script created
- [ ] Daily backup cron job configured

## Application Deployment

- [ ] Application directory created (`/var/www/saas-platform`)
- [ ] Code deployed (via Git or SCP)
- [ ] Dependencies installed (`npm install`)
- [ ] Application built successfully (`npm run build`)
- [ ] `.env.production` file created with all variables
- [ ] JWT secrets generated (minimum 32 characters)
- [ ] Environment variables verified

## Nginx Configuration

- [ ] Nginx site configuration created
- [ ] Site enabled in sites-enabled
- [ ] Default site removed
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded
- [ ] Application accessible via domain (HTTP)

## SSL Certificate

- [ ] Certbot installed
- [ ] SSL certificate obtained for domain
- [ ] HTTPS working correctly
- [ ] HTTP to HTTPS redirect enabled
- [ ] Auto-renewal tested (`certbot renew --dry-run`)

## PM2 Process Manager

- [ ] PM2 ecosystem file created
- [ ] Log directory created (`/var/log/pm2`)
- [ ] Application started with PM2
- [ ] PM2 process list saved
- [ ] PM2 startup script configured
- [ ] Application auto-starts on server reboot
- [ ] PM2 logs accessible and working

## Security Hardening

- [ ] Root login disabled
- [ ] Password authentication disabled (if using SSH keys)
- [ ] Fail2Ban installed and configured
- [ ] Automatic security updates enabled
- [ ] MongoDB authentication enforced
- [ ] MongoDB not accessible from outside
- [ ] Strong passwords used for all services
- [ ] JWT secrets are cryptographically secure

## Monitoring & Maintenance

- [ ] Log rotation configured
- [ ] MongoDB backup script tested
- [ ] Application logs accessible via PM2
- [ ] Nginx logs accessible
- [ ] MongoDB logs accessible
- [ ] Disk space monitoring plan in place
- [ ] Uptime monitoring configured (optional: UptimeRobot)

## Testing

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] JWT authentication working
- [ ] Database operations working (CRUD)
- [ ] All dashboard pages accessible
- [ ] Settings pages functional
- [ ] Reports generating correctly
- [ ] Stripe integration working (if applicable)
- [ ] File uploads working (if applicable)
- [ ] Email sending working (if applicable)
- [ ] Mobile responsiveness verified
- [ ] SSL certificate valid and trusted
- [ ] No console errors in browser
- [ ] API endpoints responding correctly

## Performance

- [ ] Gzip compression enabled in Nginx
- [ ] Static file caching configured
- [ ] PM2 running in cluster mode
- [ ] Application response time acceptable (<2s)
- [ ] Database queries optimized
- [ ] Indexes created on frequently queried fields

## Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] API endpoints documented
- [ ] Backup and restore procedures documented
- [ ] Troubleshooting guide created
- [ ] Team members have access to documentation

## Post-Deployment

- [ ] All team members notified of deployment
- [ ] Production URL shared with stakeholders
- [ ] Monitoring alerts configured
- [ ] Backup verification completed
- [ ] Disaster recovery plan documented
- [ ] Update schedule established
- [ ] Support process defined

## Optional Enhancements

- [ ] CDN configured for static assets
- [ ] Redis caching layer added
- [ ] Application monitoring (e.g., New Relic, DataDog)
- [ ] Error tracking (e.g., Sentry)
- [ ] Analytics configured (e.g., Google Analytics)
- [ ] Staging environment setup
- [ ] CI/CD pipeline configured
- [ ] Load balancer configured (for high traffic)
- [ ] Database replication setup (for high availability)

---

## Emergency Contacts

**VPS Provider Support:**
- Provider: _______________
- Support URL: _______________
- Support Email: _______________

**Domain Registrar:**
- Provider: _______________
- Support URL: _______________

**Team Contacts:**
- DevOps Lead: _______________
- Backend Developer: _______________
- System Administrator: _______________

---

## Important URLs

- Production URL: https://_______________
- Server IP: _______________
- MongoDB Connection: mongodb://localhost:27017/saas_platform
- PM2 Web Interface: http://_______________:9615 (if configured)

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** _______________
