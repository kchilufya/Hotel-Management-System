# Hotel Management System Deployment Script (PowerShell)
# This script helps deploy the application to various cloud platforms

Write-Host "🏨 Hotel Management System Deployment Script" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Function to check if command exists
function Test-CommandExists {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to deploy to Vercel + Railway
function Deploy-VercelRailway {
    Write-Host "📦 Deploying to Vercel (Frontend) + Railway (Backend)..." -ForegroundColor Yellow
    
    # Check prerequisites
    if (-not (Test-CommandExists "vercel")) {
        Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
        npm install -g vercel
    }
    
    if (-not (Test-CommandExists "railway")) {
        Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
        npm install -g @railway/cli
    }
    
    # Deploy backend to Railway
    Write-Host "🚂 Deploying backend to Railway..." -ForegroundColor Cyan
    railway login
    railway up
    
    # Get Railway URL
    $RailwayUrl = Read-Host "📝 Please enter your Railway backend URL (e.g., https://your-app.railway.app)"
    
    # Deploy frontend to Vercel
    Write-Host "⚡ Deploying frontend to Vercel..." -ForegroundColor Cyan
    Set-Location frontend
    vercel env add REACT_APP_API_URL production $RailwayUrl
    vercel --prod
    Set-Location ..
    
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "Frontend: Check your Vercel dashboard for the URL" -ForegroundColor Cyan
    Write-Host "Backend: $RailwayUrl" -ForegroundColor Cyan
}

# Function to deploy to Heroku
function Deploy-Heroku {
    Write-Host "📦 Deploying to Heroku..." -ForegroundColor Yellow
    
    if (-not (Test-CommandExists "heroku")) {
        Write-Host "❌ Heroku CLI not found. Please install it first." -ForegroundColor Red
        Write-Host "Visit: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
        return
    }
    
    $AppName = Read-Host "📝 Enter your Heroku app name"
    
    heroku create $AppName
    heroku config:set NODE_ENV=production
    
    $JwtSecret = Read-Host "📝 Enter your JWT secret" -AsSecureString
    $JwtSecretPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($JwtSecret))
    heroku config:set JWT_SECRET=$JwtSecretPlain
    
    $MongoUri = Read-Host "📝 Enter your MongoDB URI"
    heroku config:set MONGODB_URI=$MongoUri
    
    git add .
    git commit -m "Deploy to Heroku"
    git push heroku main
    
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "App URL: https://$AppName.herokuapp.com" -ForegroundColor Cyan
}

# Function to prepare for deployment
function Prepare-Deployment {
    Write-Host "🔧 Preparing application for deployment..." -ForegroundColor Yellow
    
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    Set-Location frontend
    npm install
    Set-Location ..
    Set-Location backend
    npm install
    Set-Location ..
    
    # Build frontend
    Write-Host "🏗️ Building frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm run build
    Set-Location ..
    
    # Create production environment files if they don't exist
    if (-not (Test-Path "backend\.env")) {
        Write-Host "📝 Creating backend .env file..." -ForegroundColor Yellow
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "⚠️ Please update backend\.env with your production values" -ForegroundColor Yellow
    }
    
    if (-not (Test-Path "frontend\.env")) {
        Write-Host "📝 Creating frontend .env file..." -ForegroundColor Yellow
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "⚠️ Please update frontend\.env with your production values" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Preparation complete!" -ForegroundColor Green
}

# Main menu
Write-Host "Please choose a deployment option:" -ForegroundColor White
Write-Host "1) Prepare for deployment (install deps, build)" -ForegroundColor White
Write-Host "2) Deploy to Vercel + Railway (Recommended)" -ForegroundColor White
Write-Host "3) Deploy to Heroku" -ForegroundColor White
Write-Host "4) Exit" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Prepare-Deployment
    }
    "2" {
        Prepare-Deployment
        Deploy-VercelRailway
    }
    "3" {
        Prepare-Deployment
        Deploy-Heroku
    }
    "4" {
        Write-Host "👋 Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "❌ Invalid option. Please run the script again." -ForegroundColor Red
        exit 1
    }
}
