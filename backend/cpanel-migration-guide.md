# Zanji Lodge Management System - cPanel Migration Guide

## Prerequisites
- cPanel hosting account with Node.js support
- SSH access (recommended)
- File Manager access
- Domain name configured

## Step 1: Prepare Your Application

### 1.1 Environment Configuration
Create production environment files:

**backend/.env.production**
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/zanji_lodge_prod
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://ihszambia.org
```

**frontend/.env.production**
```
REACT_APP_API_URL=https://ihszambia.org/api
REACT_APP_HOTEL_NAME=Zanji Lodge
REACT_APP_CONTACT_EMAIL=info@zanjilodge.com
REACT_APP_CONTACT_PHONE=+260-212-555-789
```

### 1.2 Update Package.json Scripts
Add production scripts to both backend and frontend package.json files.

## Step 2: Database Setup

### 2.1 MongoDB Atlas (Recommended)
1. Create MongoDB Atlas account: https://www.mongodb.com/atlas
2. Create a new cluster
3. Get connection string
4. Update MONGODB_URI in production environment

### 2.2 Alternative: cPanel MongoDB
Some cPanel hosts provide MongoDB. Check with your hosting provider.

## Step 3: Backend Deployment

### 3.1 Upload Backend Files
1. Compress backend folder (excluding node_modules)
2. Upload via cPanel File Manager to public_html/api/
3. Extract files

### 3.2 Install Dependencies
```bash
cd public_html/api
npm install --production
```

### 3.3 Configure Node.js App in cPanel
1. Go to "Node.js Selector" in cPanel
2. Create new application:
   - Node.js version: Latest LTS
   - Application mode: Production
   - Application root: api
   - Application URL: yourdomain.com/api
   - Application startup file: server.js

## Step 4: Frontend Deployment

### 4.1 Build React App
```bash
cd frontend
npm run build
```

### 4.2 Upload Build Files
1. Upload contents of build/ folder to public_html/
2. Configure index.html as default document

## Step 5: Domain and SSL Configuration

### 5.1 Domain Setup
- Point domain to cPanel hosting
- Configure subdomain if needed (api.yourdomain.com)

### 5.2 SSL Certificate
- Enable SSL in cPanel (Let's Encrypt recommended)
- Force HTTPS redirects

## Step 6: File Structure on cPanel

```
public_html/
├── index.html (React build)
├── static/ (React assets)
├── api/
│   ├── server.js
│   ├── package.json
│   ├── routes/
│   ├── models/
│   └── .env.production
└── .htaccess (URL rewriting)
```

## Step 7: URL Rewriting (.htaccess)

Create .htaccess in public_html/:

```apache
RewriteEngine On

# API routes
RewriteRule ^api/(.*)$ /api/server.js [L]

# React Router support
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## Step 8: Testing and Monitoring

### 8.1 Test All Features
- Public reservation system
- Admin dashboard
- Database connections
- File uploads (if any)

### 8.2 Setup Monitoring
- Enable error logs in cPanel
- Configure uptime monitoring
- Setup backup schedules

## Step 9: Post-Migration Tasks

### 9.1 DNS Configuration
- Update A records
- Configure CNAME for subdomains
- Setup email forwarding if needed

### 9.2 Performance Optimization
- Enable gzip compression
- Setup CDN if needed
- Optimize images and assets

## Troubleshooting Common Issues

### Node.js Version Issues
- Ensure cPanel supports your Node.js version
- Update package.json engines field

### MongoDB Connection
- Whitelist cPanel server IP in MongoDB Atlas
- Check network access settings

### CORS Errors
- Update CORS_ORIGIN in backend
- Check API URL configuration

### File Permissions
- Set correct permissions (755 for directories, 644 for files)
- Check node_modules permissions

## Alternative: Using cPanel Terminal

If your cPanel provides terminal access:

```bash
# Clone repository
git clone https://github.com/yourusername/hotel-management.git
cd hotel-management

# Backend setup
cd backend
npm install --production
pm2 start server.js --name hotel-api

# Frontend build
cd ../frontend
npm install
npm run build
```

## Security Considerations

1. **Environment Variables**: Never commit production secrets
2. **Database Security**: Use strong passwords and IP whitelisting
3. **SSL/HTTPS**: Always enable SSL certificates
4. **File Permissions**: Set restrictive permissions
5. **Regular Updates**: Keep dependencies updated

## Backup Strategy

1. **Database Backups**: Schedule MongoDB Atlas backups
2. **File Backups**: Use cPanel backup features
3. **Code Backups**: Maintain Git repository

## Support and Maintenance

1. **Monitoring**: Setup uptime monitoring
2. **Logs**: Regular log monitoring in cPanel
3. **Updates**: Plan for regular updates
4. **Support**: Document admin procedures

---

**Need Help?** 
- Check cPanel documentation for Node.js setup
- Contact your hosting provider for specific configurations
- Test thoroughly in staging environment first
