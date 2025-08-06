# Render Deployment Guide for Hotel Management System

This guide covers deploying your Hotel Management System to Render.com - a modern cloud platform with generous free tiers.

## 🌟 Why Render?
- **Free Tier**: Great for development and small projects
- **Easy Setup**: Git-based deployments
- **Full Stack Support**: Both frontend and backend
- **Automatic HTTPS**: SSL certificates included
- **Environment Variables**: Easy configuration
- **Health Checks**: Built-in monitoring

## 🚀 Deployment Options

### Option 1: Render + MongoDB Atlas (Recommended)
- **Frontend**: Render Static Site (Free)
- **Backend**: Render Web Service (Free with limitations, $7/month for production)
- **Database**: MongoDB Atlas (Free tier - 512MB)
- **Total Cost**: Free for development, $7/month for production

### Option 2: All Render Services
- **Frontend**: Render Static Site (Free)
- **Backend**: Render Web Service ($7/month)
- **Database**: Render PostgreSQL ($7/month) + MongoDB alternative
- **Total Cost**: $14/month

## 📋 Prerequisites

1. **Git Repository**: Your code must be in a Git repository (GitHub, GitLab, etc.)
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas** (recommended): Set up at [mongodb.com](https://www.mongodb.com/cloud/atlas)

## 🗄️ Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account

2. **Create a Cluster**
   - Choose "Shared" (free tier)
   - Select your preferred region
   - Create cluster

3. **Create Database User**
   - Go to "Database Access"
   - Add new database user
   - Note the username and password

4. **Configure Network Access**
   - Go to "Network Access"
   - Add IP address: `0.0.0.0/0` (allow from anywhere)

5. **Get Connection String**
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

## 🔧 Backend Deployment (Render Web Service)

### Method 1: Using Render Dashboard (Recommended)

1. **Login to Render**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub/GitLab

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Select your repository

3. **Configure Service**
   ```
   Name: hotel-management-backend
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && node clean-server.js
   ```

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key_32_characters_long
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your service URL (e.g., `https://hotel-management-backend.onrender.com`)

### Method 2: Using render.yaml (Infrastructure as Code)

1. **Commit render.yaml**
   ```bash
   git add render.yaml
   git commit -m "Add Render configuration"
   git push origin main
   ```

2. **Create Service from Blueprint**
   - In Render dashboard: "New +" → "Blueprint"
   - Connect repository and select `render.yaml`

## 🌐 Frontend Deployment (Render Static Site)

### Method 1: Using Render Dashboard

1. **Create New Static Site**
   - Click "New +" → "Static Site"
   - Connect your Git repository

2. **Configure Static Site**
   ```
   Name: hotel-management-frontend
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/build
   ```

3. **Set Environment Variables**
   ```
   REACT_APP_API_URL=https://hotel-management-backend.onrender.com
   ```
   (Replace with your actual backend URL)

4. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment

### Method 2: Using render.yaml

The render.yaml file already includes frontend configuration. Just ensure your backend URL is correct.

## 🔐 Environment Variables Setup

### Backend Environment Variables
| Variable | Description | Example Value |
|----------|-------------|---------------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `10000` |
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@cluster.mongodb.net/hotel` |
| `JWT_SECRET` | JWT signing key | `your_32_character_secret_key_here` |

### Frontend Environment Variables
| Variable | Description | Example Value |
|----------|-------------|---------------|
| `REACT_APP_API_URL` | Backend API URL | `https://your-backend.onrender.com` |

## 🚀 Quick Deploy Commands

### Using Git (if render.yaml is configured)
```bash
# Commit all changes
git add .
git commit -m "Deploy to Render"
git push origin main

# Render will automatically deploy when you push to main branch
```

### Manual Deployment
1. Push code to Git repository
2. Create services in Render dashboard
3. Configure environment variables
4. Deploy

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] Code is in Git repository (GitHub, GitLab, etc.)
- [ ] MongoDB Atlas cluster created
- [ ] Database user and network access configured
- [ ] Connection string obtained

### Backend Deployment
- [ ] Web Service created in Render
- [ ] Build and start commands configured
- [ ] Environment variables set
- [ ] Health check path configured (`/api/health`)
- [ ] Service deployed successfully

### Frontend Deployment
- [ ] Static Site created in Render
- [ ] Build command configured
- [ ] Publish directory set to `frontend/build`
- [ ] `REACT_APP_API_URL` points to backend service
- [ ] Site deployed successfully

### Post-Deployment
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] API endpoints accessible
- [ ] Database connection working
- [ ] Authentication working
- [ ] CORS configured properly

## 🛠️ Troubleshooting

### Common Issues

**Build Failures**
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

**Database Connection Issues**
- Verify MongoDB Atlas connection string
- Check network access settings (0.0.0.0/0)
- Ensure database user credentials are correct

**CORS Errors**
- Verify frontend `REACT_APP_API_URL` points to correct backend
- Check backend CORS configuration

**Environment Variables**
- Ensure all required variables are set
- Check for typos in variable names
- Verify secret keys are properly generated

### Performance Optimization

**Free Tier Limitations**
- Services sleep after 15 minutes of inactivity
- Cold start time: 30-60 seconds
- 750 hours/month limit

**Upgrade to Paid Tier ($7/month) for:**
- No sleeping
- Faster cold starts
- More compute resources
- Custom domains

## 💰 Cost Breakdown

### Free Tier
- **Static Site**: Free forever
- **Web Service**: 750 hours/month free
- **MongoDB Atlas**: 512MB free
- **Total**: $0/month (with limitations)

### Production Ready
- **Static Site**: Free
- **Web Service**: $7/month
- **MongoDB Atlas**: Free (512MB) or $9/month (2GB)
- **Total**: $7-16/month

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/node-express-app)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Render Status](https://status.render.com/)

## 🆘 Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test API endpoints manually
4. Check MongoDB Atlas connectivity
5. Review Render documentation
6. Contact Render support (excellent support team!)

---

**Next Steps**: After deployment, your hotel management system will be live at:
- **Frontend**: `https://your-frontend-name.onrender.com`
- **Backend API**: `https://your-backend-name.onrender.com`

The system will be accessible worldwide with automatic HTTPS and monitoring!
