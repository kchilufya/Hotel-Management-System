# Render Deployment Script for Hotel Management System
# This script helps prepare and deploy to Render.com

Write-Host "🌟 Hotel Management System - Render Deployment" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Function to check if command exists
function Test-CommandExists {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to validate environment variables
function Test-EnvironmentSetup {
    Write-Host "🔍 Checking environment setup..." -ForegroundColor Yellow
    
    $issues = @()
    
    # Check if git is available
    if (-not (Test-CommandExists "git")) {
        $issues += "Git is not installed or not in PATH"
    }
    
    # Check if we're in a git repository
    if (Test-CommandExists "git") {
        $gitStatus = git status 2>&1
        if ($LASTEXITCODE -ne 0) {
            $issues += "Not in a Git repository. Run 'git init' first."
        }
    }
    
    # Check if MongoDB Atlas connection string is provided
    if (-not $env:MONGODB_URI -and -not (Test-Path "backend\.env")) {
        $issues += "MongoDB connection string not found. Set MONGODB_URI environment variable or create backend\.env"
    }
    
    if ($issues.Count -gt 0) {
        Write-Host "❌ Issues found:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "   - $issue" -ForegroundColor Red
        }
        return $false
    }
    
    Write-Host "✅ Environment check passed!" -ForegroundColor Green
    return $true
}

# Function to prepare for Render deployment
function Prepare-RenderDeployment {
    Write-Host "🔧 Preparing for Render deployment..." -ForegroundColor Yellow
    
    # Create backend .env if it doesn't exist
    if (-not (Test-Path "backend\.env")) {
        Write-Host "📝 Creating backend .env file..." -ForegroundColor Cyan
        Copy-Item "backend\.env.example" "backend\.env" -ErrorAction SilentlyContinue
        
        Write-Host "⚠️ Please update backend\.env with your MongoDB Atlas connection string:" -ForegroundColor Yellow
        Write-Host "   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel_management" -ForegroundColor White
        Write-Host "   JWT_SECRET=your_32_character_secret_key_here" -ForegroundColor White
        
        $continue = Read-Host "Have you updated the .env file? (y/n)"
        if ($continue -ne "y") {
            Write-Host "Please update the .env file and run the script again." -ForegroundColor Yellow
            return $false
        }
    }
    
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    Set-Location backend
    npm install
    Set-Location ..
    
    Set-Location frontend
    npm install
    Set-Location ..
    
    # Test build
    Write-Host "🏗️ Testing frontend build..." -ForegroundColor Cyan
    Set-Location frontend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed. Please fix build errors." -ForegroundColor Red
        Set-Location ..
        return $false
    }
    Set-Location ..
    
    Write-Host "✅ Preparation complete!" -ForegroundColor Green
    return $true
}

# Function to generate JWT secret
function New-JWTSecret {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $secret = ""
    for ($i = 0; $i -lt 32; $i++) {
        $secret += $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)]
    }
    return $secret
}

# Function to commit and push to Git
function Deploy-ToGit {
    Write-Host "📤 Committing and pushing to Git..." -ForegroundColor Yellow
    
    # Check git status
    $gitStatus = git status --porcelain
    if (-not $gitStatus) {
        Write-Host "✅ No changes to commit. Repository is up to date." -ForegroundColor Green
        return $true
    }
    
    # Add all files
    git add .
    
    # Commit
    $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
    if (-not $commitMessage) {
        $commitMessage = "Deploy to Render - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    git commit -m $commitMessage
    
    # Push
    Write-Host "Pushing to remote repository..." -ForegroundColor Cyan
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Code pushed successfully!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Git push failed. Please check your remote repository settings." -ForegroundColor Red
        return $false
    }
}

# Function to display Render setup instructions
function Show-RenderInstructions {
    Write-Host "🌟 Render Deployment Instructions" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    
    Write-Host "`n1. 📊 MongoDB Atlas Setup:" -ForegroundColor Yellow
    Write-Host "   - Go to https://www.mongodb.com/cloud/atlas" -ForegroundColor White
    Write-Host "   - Create free cluster" -ForegroundColor White
    Write-Host "   - Create database user and whitelist IP (0.0.0.0/0)" -ForegroundColor White
    Write-Host "   - Get connection string" -ForegroundColor White
    
    Write-Host "`n2. 🚀 Render Backend Setup:" -ForegroundColor Yellow
    Write-Host "   - Go to https://render.com and sign in" -ForegroundColor White
    Write-Host "   - Click 'New +' → 'Web Service'" -ForegroundColor White
    Write-Host "   - Connect your Git repository" -ForegroundColor White
    Write-Host "   - Configure:" -ForegroundColor White
    Write-Host "     * Name: hotel-management-backend" -ForegroundColor Gray
    Write-Host "     * Environment: Node" -ForegroundColor Gray
    Write-Host "     * Build Command: cd backend && npm install" -ForegroundColor Gray
    Write-Host "     * Start Command: cd backend && node clean-server.js" -ForegroundColor Gray
    
    Write-Host "`n3. 🔐 Backend Environment Variables:" -ForegroundColor Yellow
    Write-Host "   Set these in Render dashboard:" -ForegroundColor White
    Write-Host "   - NODE_ENV = production" -ForegroundColor Gray
    Write-Host "   - PORT = 10000" -ForegroundColor Gray
    Write-Host "   - MONGODB_URI = your_mongodb_atlas_connection_string" -ForegroundColor Gray
    
    $jwtSecret = New-JWTSecret
    Write-Host "   - JWT_SECRET = $jwtSecret" -ForegroundColor Gray
    Write-Host "   (Generated JWT secret above - copy it!)" -ForegroundColor Cyan
    
    Write-Host "`n4. 🌐 Render Frontend Setup:" -ForegroundColor Yellow
    Write-Host "   - Click 'New +' → 'Static Site'" -ForegroundColor White
    Write-Host "   - Connect same Git repository" -ForegroundColor White
    Write-Host "   - Configure:" -ForegroundColor White
    Write-Host "     * Name: hotel-management-frontend" -ForegroundColor Gray
    Write-Host "     * Build Command: cd frontend && npm install && npm run build" -ForegroundColor Gray
    Write-Host "     * Publish Directory: frontend/build" -ForegroundColor Gray
    
    Write-Host "`n5. 🔗 Frontend Environment Variables:" -ForegroundColor Yellow
    Write-Host "   Set in Render frontend dashboard:" -ForegroundColor White
    Write-Host "   - REACT_APP_API_URL = https://hotel-management-backend.onrender.com" -ForegroundColor Gray
    Write-Host "   (Replace with your actual backend URL)" -ForegroundColor Cyan
    
    Write-Host "`n6. 🎉 Deploy:" -ForegroundColor Yellow
    Write-Host "   - Both services will auto-deploy from Git" -ForegroundColor White
    Write-Host "   - Monitor deployment logs in Render dashboard" -ForegroundColor White
    Write-Host "   - Backend health check: /api/health" -ForegroundColor White
    
    Write-Host "`n📋 Post-Deployment:" -ForegroundColor Green
    Write-Host "   - Test your backend health endpoint" -ForegroundColor White
    Write-Host "   - Verify frontend loads correctly" -ForegroundColor White
    Write-Host "   - Test login functionality" -ForegroundColor White
    Write-Host "   - Check all features work properly" -ForegroundColor White
    
    Write-Host "`n🔗 Useful Links:" -ForegroundColor Green
    Write-Host "   - Render Dashboard: https://dashboard.render.com" -ForegroundColor White
    Write-Host "   - MongoDB Atlas: https://cloud.mongodb.com" -ForegroundColor White
    Write-Host "   - Render Docs: https://render.com/docs" -ForegroundColor White
}

# Main execution
Write-Host "Starting Render deployment preparation..." -ForegroundColor White

# Check environment
if (-not (Test-EnvironmentSetup)) {
    Write-Host "`n❌ Environment setup failed. Please fix the issues above." -ForegroundColor Red
    exit 1
}

# Prepare deployment
if (-not (Prepare-RenderDeployment)) {
    Write-Host "`n❌ Deployment preparation failed." -ForegroundColor Red
    exit 1
}

# Commit and push
$pushToGit = Read-Host "`nDo you want to commit and push changes to Git? (y/n)"
if ($pushToGit -eq "y") {
    if (-not (Deploy-ToGit)) {
        Write-Host "`n❌ Git deployment failed." -ForegroundColor Red
        exit 1
    }
}

# Show instructions
Write-Host "`n" -ForegroundColor White
Show-RenderInstructions

Write-Host "`n🎉 Preparation complete! Follow the instructions above to deploy to Render." -ForegroundColor Green
Write-Host "💡 Tip: Keep this terminal open to copy the JWT secret and other values." -ForegroundColor Yellow
