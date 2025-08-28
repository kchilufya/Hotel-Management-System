# cPanel Migration Checklist

## Pre-Migration Checklist

### 1. Hosting Requirements
- [ ] cPanel hosting with Node.js support (v16+ recommended)
- [ ] SSH access (optional but recommended)
- [ ] SSL certificate capability
- [ ] MongoDB access (Atlas recommended)
- [ ] Domain properly configured

### 2. Application Preparation
- [ ] Environment variables configured
- [ ] Production build tested locally
- [ ] Database connection string ready
- [ ] JWT secret generated
- [ ] CORS origins updated

## Migration Steps

### Step 1: Database Setup
1. **MongoDB Atlas Setup** (Recommended)
   ```
   1. Go to https://www.mongodb.com/atlas
   2. Create free cluster
   3. Create database user
   4. Whitelist IP addresses (0.0.0.0/0 for cPanel)
   5. Get connection string
   ```

2. **Update Environment Variables**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel_management
   JWT_SECRET=your-super-secure-jwt-secret-here
   CORS_ORIGIN=https://yourdomain.com
   ```

### Step 2: File Upload
1. **Run Deployment Script**
   ```bash
   # Windows
   deploy-to-cpanel.bat
   
   # Linux/Mac
   chmod +x deploy-to-cpanel.sh
   ./deploy-to-cpanel.sh
   ```

2. **Upload to cPanel**
   - Use File Manager or FTP
   - Upload contents of `deployment/public_html/` to your `public_html/` directory
   - Ensure file permissions are correct (755 for directories, 644 for files)

### Step 3: Node.js Configuration
1. **Access Node.js Selector in cPanel**
2. **Create New Application**
   ```
   Application Root: api
   Application URL: yourdomain.com/api
   Startup File: server.js
   Node.js Version: 16.x or higher
   Application Mode: Production
   ```

3. **Install Dependencies**
   ```bash
   cd public_html/api
   npm install --production
   ```

### Step 4: Environment Configuration
1. **Edit .env file in api directory**
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   CORS_ORIGIN=https://yourdomain.com
   ```

### Step 5: Domain and SSL Setup
1. **Configure Domain**
   - Ensure domain points to cPanel hosting
   - Update DNS A records if needed

2. **Enable SSL**
   - Use Let's Encrypt in cPanel
   - Force HTTPS redirects
   - Update CORS_ORIGIN to use https://

### Step 6: Testing
1. **Test Frontend**
   - Visit https://yourdomain.com
   - Should show hotel landing page
   - Test navigation and booking flow

2. **Test API**
   - Visit https://yourdomain.com/api/health
   - Test public endpoints: https://yourdomain.com/api/public/rooms/available

3. **Test Full Booking Flow**
   - Make test reservation
   - Check database for booking
   - Test admin dashboard access

## Common Issues and Solutions

### Node.js App Won't Start
- Check Node.js version compatibility
- Verify startup file path
- Check application logs in cPanel
- Ensure all dependencies are installed

### Database Connection Issues
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Test connection from cPanel terminal
- Ensure network access is enabled

### CORS Errors
- Update CORS_ORIGIN in .env
- Check frontend API URL configuration
- Ensure protocol matches (http vs https)

### 404 Errors for API Routes
- Verify .htaccess file is uploaded
- Check API route configuration
- Ensure Node.js app is running
- Test direct API URL access

### Frontend Not Loading
- Check if build files are in public_html
- Verify index.html is present
- Check for JavaScript errors in browser console
- Ensure all static assets are accessible

## Performance Optimization

### 1. Enable Compression
- Verify gzip is enabled in .htaccess
- Check compression in cPanel

### 2. Set Cache Headers
- Configure browser caching for static assets
- Set appropriate cache durations

### 3. Optimize Database
- Create indexes for frequently queried fields
- Use connection pooling
- Monitor query performance

### 4. Monitor Resources
- Track CPU and memory usage
- Set up uptime monitoring
- Configure error alerting

## Security Best Practices

### 1. Environment Variables
- Never commit production secrets
- Use strong, unique passwords
- Rotate secrets regularly

### 2. Database Security
- Use MongoDB Atlas security features
- Enable authentication
- Restrict IP access

### 3. Application Security
- Keep dependencies updated
- Enable HTTPS everywhere
- Implement rate limiting
- Validate all inputs

### 4. Server Security
- Regular security updates
- Monitor access logs
- Implement backup strategy

## Backup Strategy

### 1. Database Backups
- Enable MongoDB Atlas automated backups
- Schedule regular exports
- Test restore procedures

### 2. File Backups
- Use cPanel backup features
- Regular code repository updates
- Document configuration changes

### 3. Recovery Planning
- Document recovery procedures
- Test backup restoration
- Maintain offline copies

## Monitoring and Maintenance

### 1. Application Monitoring
- Set up uptime monitoring (UptimeRobot, etc.)
- Monitor API response times
- Track error rates

### 2. Log Monitoring
- Review application logs regularly
- Monitor access logs for security
- Set up log rotation

### 3. Updates and Maintenance
- Schedule regular dependency updates
- Monitor security advisories
- Plan maintenance windows

## Support Contacts

### Hosting Support
- Contact your cPanel hosting provider for:
  - Node.js configuration issues
  - Server resource problems
  - Domain and SSL setup

### Application Support
- Document all configuration changes
- Maintain deployment procedures
- Keep contact information for developers

---

## Quick Reference

### Important URLs
- Frontend: https://yourdomain.com
- API Health: https://yourdomain.com/api/health
- Admin Dashboard: https://yourdomain.com/dashboard
- Online Booking: https://yourdomain.com/reservation

### Key Files
- Backend: public_html/api/server.js
- Environment: public_html/api/.env
- Frontend: public_html/index.html
- URL Rewriting: public_html/.htaccess

### Common Commands
```bash
# Restart Node.js app
pkill -f "node.*server.js" && node server.js

# Check logs
tail -f logs/hotel-management.log

# Install dependencies
npm install --production

# Test database connection
node -e "require('./models/User')"
```
