@echo off
echo 🚀 Starting Hotel Management System deployment preparation...

REM Colors for output (Windows doesn't support colors in batch, but we'll use echo)
set "GREEN=✅"
set "YELLOW=⚠️ "
set "RED=❌"

REM Check if required files exist
if not exist "backend\server.js" (
    echo %RED% Backend server.js not found!
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo %RED% Frontend package.json not found!
    pause
    exit /b 1
)

echo %GREEN% Required files found

REM Step 1: Install backend dependencies
echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install --production
if errorlevel 1 (
    echo %RED% Failed to install backend dependencies
    pause
    exit /b 1
)
echo %GREEN% Backend dependencies installed

REM Step 2: Build frontend
echo.
echo 🏗️  Building frontend...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo %RED% Failed to install frontend dependencies
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo %RED% Frontend build failed
    pause
    exit /b 1
)
echo %GREEN% Frontend build completed

REM Step 3: Create deployment package
echo.
echo 📦 Creating deployment package...
cd ..

REM Create deployment directory
if not exist "deployment" mkdir deployment
if not exist "deployment\public_html" mkdir deployment\public_html
if not exist "deployment\public_html\api" mkdir deployment\public_html\api

REM Copy frontend build to public_html
xcopy "frontend\build\*" "deployment\public_html\" /E /I /Y

REM Copy backend files to api directory
xcopy "backend\*" "deployment\public_html\api\" /E /I /Y /EXCLUDE:deployment-exclude.txt

REM Remove development files from api directory
if exist "deployment\public_html\api\node_modules" rmdir /S /Q "deployment\public_html\api\node_modules"
if exist "deployment\public_html\api\.env.example" del "deployment\public_html\api\.env.example"
if exist "deployment\public_html\api\test-*.js" del "deployment\public_html\api\test-*.js"
if exist "deployment\public_html\api\check-*.js" del "deployment\public_html\api\check-*.js"

REM Copy configuration files
copy ".htaccess" "deployment\public_html\"
copy "backend\.env.production" "deployment\public_html\api\.env"

echo %GREEN% Deployment package created in 'deployment' folder

REM Step 4: Create instructions
echo.
echo 📋 Creating deployment instructions...

echo Hotel Management System - cPanel Deployment Instructions > deployment-instructions.txt
echo ======================================================== >> deployment-instructions.txt
echo. >> deployment-instructions.txt
echo 1. Upload files to cPanel: >> deployment-instructions.txt
echo    - Upload all files from 'deployment\public_html' folder >> deployment-instructions.txt
echo    - Upload to your cPanel File Manager public_html directory >> deployment-instructions.txt
echo. >> deployment-instructions.txt
echo 2. Configure Node.js in cPanel: >> deployment-instructions.txt
echo    - Go to "Node.js Selector" or "Node.js Apps" >> deployment-instructions.txt
echo    - Create new application: >> deployment-instructions.txt
echo      * Application root: api >> deployment-instructions.txt
echo      * Application URL: yourdomain.com/api >> deployment-instructions.txt
echo      * Application startup file: server.js >> deployment-instructions.txt
echo      * Node.js version: 16.x or higher >> deployment-instructions.txt
echo      * Application mode: Production >> deployment-instructions.txt
echo. >> deployment-instructions.txt
echo 3. Environment Configuration: >> deployment-instructions.txt
echo    - Edit public_html/api/.env file >> deployment-instructions.txt
echo    - Update MONGODB_URI, JWT_SECRET, CORS_ORIGIN >> deployment-instructions.txt
echo. >> deployment-instructions.txt
echo 4. Test the application: >> deployment-instructions.txt
echo    - Visit https://yourdomain.com >> deployment-instructions.txt
echo    - Test API: https://yourdomain.com/api/public/rooms/available >> deployment-instructions.txt

echo %GREEN% Deployment instructions created: deployment-instructions.txt

REM Summary
echo.
echo 🎉 Deployment preparation complete!
echo.
echo Files ready for cPanel:
echo   📁 deployment\public_html\ (upload these files)
echo   📋 deployment-instructions.txt (follow these steps)
echo   📖 cpanel-migration-guide.md (detailed guide)
echo.
echo %YELLOW% Remember to:
echo   1. Update environment variables in .env
echo   2. Configure MongoDB connection
echo   3. Set up domain and SSL
echo   4. Test all functionality after deployment
echo.
echo %GREEN% Ready for cPanel deployment! 🚀

pause
