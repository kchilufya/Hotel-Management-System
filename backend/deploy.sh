#!/bin/bash

# Hotel Management System Deployment Script
# This script helps deploy the application to various cloud platforms

echo "🏨 Hotel Management System Deployment Script"
echo "=============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Vercel + Railway
deploy_vercel_railway() {
    echo "📦 Deploying to Vercel (Frontend) + Railway (Backend)..."
    
    # Check prerequisites
    if ! command_exists vercel; then
        echo "❌ Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    if ! command_exists railway; then
        echo "❌ Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    # Deploy backend to Railway
    echo "🚂 Deploying backend to Railway..."
    railway login
    railway up
    
    # Get Railway URL
    echo "📝 Please enter your Railway backend URL (e.g., https://your-app.railway.app):"
    read RAILWAY_URL
    
    # Deploy frontend to Vercel
    echo "⚡ Deploying frontend to Vercel..."
    cd frontend
    vercel env add REACT_APP_API_URL production "$RAILWAY_URL"
    vercel --prod
    cd ..
    
    echo "✅ Deployment complete!"
    echo "Frontend: Check your Vercel dashboard for the URL"
    echo "Backend: $RAILWAY_URL"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "📦 Deploying to Heroku..."
    
    if ! command_exists heroku; then
        echo "❌ Heroku CLI not found. Please install it first."
        echo "Visit: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    echo "📝 Enter your Heroku app name:"
    read APP_NAME
    
    heroku create "$APP_NAME"
    heroku config:set NODE_ENV=production
    
    echo "📝 Enter your JWT secret:"
    read -s JWT_SECRET
    heroku config:set JWT_SECRET="$JWT_SECRET"
    
    echo "📝 Enter your MongoDB URI:"
    read MONGODB_URI
    heroku config:set MONGODB_URI="$MONGODB_URI"
    
    git add .
    git commit -m "Deploy to Heroku"
    git push heroku main
    
    echo "✅ Deployment complete!"
    echo "App URL: https://$APP_NAME.herokuapp.com"
}

# Function to prepare for deployment
prepare_deployment() {
    echo "🔧 Preparing application for deployment..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    cd frontend && npm install && cd ..
    cd backend && npm install && cd ..
    
    # Build frontend
    echo "🏗️ Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    # Create production environment files if they don't exist
    if [ ! -f "backend/.env" ]; then
        echo "📝 Creating backend .env file..."
        cp backend/.env.example backend/.env
        echo "⚠️ Please update backend/.env with your production values"
    fi
    
    if [ ! -f "frontend/.env" ]; then
        echo "📝 Creating frontend .env file..."
        cp frontend/.env.example frontend/.env
        echo "⚠️ Please update frontend/.env with your production values"
    fi
    
    echo "✅ Preparation complete!"
}

# Main menu
echo "Please choose a deployment option:"
echo "1) Prepare for deployment (install deps, build)"
echo "2) Deploy to Vercel + Railway (Recommended)"
echo "3) Deploy to Heroku"
echo "4) Exit"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        prepare_deployment
        ;;
    2)
        prepare_deployment
        deploy_vercel_railway
        ;;
    3)
        prepare_deployment
        deploy_heroku
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option. Please run the script again."
        exit 1
        ;;
esac
