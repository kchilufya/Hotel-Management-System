# 🌟 Quick Start: Deploy to Render

## Prerequisites
1. **Git Repository**: Your code must be in GitHub/GitLab
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Free database at [mongodb.com](https://cloud.mongodb.com)

## 🚀 1-Click Deployment Guide

### Step 1: Database Setup (5 minutes)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → Create free account
2. Create cluster → Create database user → Whitelist all IPs (0.0.0.0/0)
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/hotel_management`

### Step 2: Backend Deployment (5 minutes)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Configure:
   ```
   Name: hotel-management-backend
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && node clean-server.js
   ```
5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_32_character_secret_key
   ```
6. Click **"Create Web Service"**

### Step 3: Frontend Deployment (3 minutes)
1. Click **"New +"** → **"Static Site"**
2. Connect same repository
3. Configure:
   ```
   Name: hotel-management-frontend
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/build
   ```
4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://hotel-management-backend.onrender.com
   ```
   (Replace with your actual backend URL from step 2)
5. Click **"Create Static Site"**

### Step 4: Test Your Deployment
- Backend health check: `https://your-backend.onrender.com/api/health`
- Frontend: `https://your-frontend.onrender.com`

## 🛠️ Automated Setup Script

Run this PowerShell script to prepare your deployment:

```powershell
.\deploy-render.ps1
```

This script will:
- ✅ Install all dependencies
- ✅ Test frontend build
- ✅ Generate JWT secret
- ✅ Commit and push to Git
- ✅ Show step-by-step Render instructions

## 💰 Cost
- **Development**: Free (with sleep after 15 min inactivity)
- **Production**: $7/month (no sleep, faster performance)

## 🆘 Need Help?
- 📖 Full guide: `RENDER_DEPLOYMENT.md`
- 🐛 Issues: Check Render service logs
- 💬 Support: Render has excellent support

---
**Total deployment time: ~15 minutes** ⏱️
