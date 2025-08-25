#!/bin/bash

# Hotel Management System - cPanel Deployment Script
# Run this script to prepare your application for cPanel deployment

echo "🚀 Starting Hotel Management System deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required files exist
if [ ! -f "backend/server.js" ]; then
    print_error "Backend server.js not found!"
    exit 1
fi

if [ ! -f "frontend/package.json" ]; then
    print_error "Frontend package.json not found!"
    exit 1
fi

print_status "Required files found"

# Step 1: Install backend dependencies
echo
echo "📦 Installing backend dependencies..."
cd backend
if npm install --production; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Step 2: Build frontend
echo
echo "🏗️  Building frontend..."
cd ../frontend
if npm install; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

if npm run build; then
    print_status "Frontend build completed"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 3: Create deployment package
echo
echo "📦 Creating deployment package..."
cd ..

# Create deployment directory
mkdir -p deployment/public_html
mkdir -p deployment/public_html/api

# Copy frontend build to public_html
cp -r frontend/build/* deployment/public_html/

# Copy backend files to api directory
cp -r backend/* deployment/public_html/api/
# Remove development files from api directory
rm -rf deployment/public_html/api/node_modules
rm -f deployment/public_html/api/.env.example
rm -f deployment/public_html/api/test-*.js
rm -f deployment/public_html/api/check-*.js

# Copy configuration files
cp .htaccess deployment/public_html/
cp backend/.env.production deployment/public_html/api/.env

print_status "Deployment package created in 'deployment' folder"

# Step 4: Create archive for upload
echo
echo "🗜️  Creating archive for upload..."
cd deployment
tar -czf ../hotel-management-cpanel.tar.gz *
cd ..

print_status "Archive created: hotel-management-cpanel.tar.gz"

# Step 5: Generate deployment instructions
echo
echo "📋 Generating deployment instructions..."

cat > deployment-instructions.txt << EOF
Hotel Management System - cPanel Deployment Instructions
========================================================

1. Upload the archive:
   - Upload 'hotel-management-cpanel.tar.gz' to your cPanel File Manager
   - Extract it in the root directory (it will create public_html structure)

2. Configure Node.js in cPanel:
   - Go to "Node.js Selector" or "Node.js Apps"
   - Create new application:
     * Application root: api
     * Application URL: yourdomain.com/api
     * Application startup file: server.js
     * Node.js version: 16.x or higher
     * Application mode: Production

3. Environment Configuration:
   - Edit public_html/api/.env file
   - Update the following variables:
     * MONGODB_URI=your-mongodb-connection-string
     * JWT_SECRET=your-secure-jwt-secret
     * CORS_ORIGIN=https://yourdomain.com

4. Database Setup:
   - Create MongoDB Atlas account or use cPanel MongoDB
   - Update MONGODB_URI in .env file
   - Run initial seed data if needed

5. Domain Configuration:
   - Ensure domain points to cPanel hosting
   - Enable SSL certificate (Let's Encrypt recommended)
   - Test both frontend and API endpoints

6. Testing:
   - Visit https://yourdomain.com (should show hotel landing page)
   - Test API: https://yourdomain.com/api/public/rooms/available
   - Test online reservation system

Files included in this deployment:
- Frontend build files in public_html/
- Backend API in public_html/api/
- .htaccess for URL rewriting
- Environment configuration template

Need help? Check the cpanel-migration-guide.md file for detailed instructions.
EOF

print_status "Deployment instructions created: deployment-instructions.txt"

# Summary
echo
echo "🎉 Deployment preparation complete!"
echo
echo "Files ready for cPanel:"
echo "  📦 hotel-management-cpanel.tar.gz (upload this)"
echo "  📋 deployment-instructions.txt (follow these steps)"
echo "  📖 cpanel-migration-guide.md (detailed guide)"
echo
print_warning "Remember to:"
echo "  1. Update environment variables in .env"
echo "  2. Configure MongoDB connection"
echo "  3. Set up domain and SSL"
echo "  4. Test all functionality after deployment"
echo
print_status "Ready for cPanel deployment! 🚀"
