# Cloud Deployment Guide

This guide covers deploying the Hotel Management System to various cloud platforms.

## Quick Start (Recommended: Vercel + Railway + MongoDB Atlas)

### 1. Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Create a database user and note the credentials
4. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/hotel_management`)
5. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)

### 2. Backend Deployment (Railway)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Create new project: `railway new`
4. Add environment variables in Railway dashboard:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   NODE_ENV=production
   PORT=5003
   ```
5. Deploy: `railway up`
6. Note your Railway domain (e.g., `https://your-app.railway.app`)

### 3. Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. From the frontend directory: `cd frontend`
4. Set environment variable:
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter your Railway backend URL
   ```
5. Deploy: `vercel --prod`

## Alternative Deployment Options

### Option 1: Heroku (Full Stack)

#### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- Git repository

#### Steps
1. **Create Heroku app:**
   ```bash
   heroku create your-hotel-management-app
   ```

2. **Add MongoDB addon:**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Option 2: AWS (Advanced)

#### Prerequisites
- AWS Account
- AWS CLI configured

#### Services Used
- **Frontend:** S3 + CloudFront
- **Backend:** EC2 or Elastic Beanstalk
- **Database:** DocumentDB or MongoDB Atlas

#### Deployment Steps
1. **Frontend (S3 + CloudFront):**
   ```bash
   cd frontend
   npm run build
   aws s3 sync build/ s3://your-bucket-name
   ```

2. **Backend (Elastic Beanstalk):**
   ```bash
   cd backend
   zip -r hotel-backend.zip .
   # Upload to Elastic Beanstalk via console
   ```

### Option 3: Google Cloud Platform

#### Prerequisites
- Google Cloud Account
- gcloud CLI

#### Services Used
- **Frontend:** Firebase Hosting
- **Backend:** Cloud Run
- **Database:** MongoDB Atlas

#### Deployment Steps
1. **Frontend (Firebase):**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   cd frontend && npm run build
   firebase deploy
   ```

2. **Backend (Cloud Run):**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/hotel-backend
   gcloud run deploy --image gcr.io/PROJECT_ID/hotel-backend
   ```

## Environment Variables Setup

### Required Environment Variables

#### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/hotel` |
| `JWT_SECRET` | Secret for JWT tokens | `super_secret_key_12345` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `5003` |

#### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://api.yourapp.com` |

## Post-Deployment Steps

1. **Database Seeding:**
   - Access your deployed backend
   - Run the seed endpoint: `POST /api/seed`
   - Or manually create an admin user

2. **Domain Setup (Optional):**
   - Configure custom domain
   - Set up SSL certificates
   - Update CORS settings

3. **Monitoring:**
   - Set up error tracking (Sentry)
   - Configure logging
   - Set up uptime monitoring

## Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] Environment variables properly set
- [ ] Database access restricted
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation in place

## Common Issues

### CORS Errors
- Ensure backend URL is correct in frontend
- Check CORS configuration in backend

### Database Connection
- Verify MongoDB connection string
- Check network access/IP whitelist

### Build Failures
- Ensure all dependencies are in package.json
- Check Node.js version compatibility

## Support

For deployment issues:
1. Check logs in your cloud platform
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity

## Cost Estimation

### Free Tier Options
- **Vercel:** Frontend hosting (free)
- **Railway:** $5/month for backend
- **MongoDB Atlas:** Free tier (512MB)
- **Total:** ~$5/month

### Production Options
- **Heroku:** $7-25/month
- **AWS:** $10-50/month (varies)
- **GCP:** $10-40/month (varies)
