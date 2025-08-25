# GitHub Push Helper Script
# Run this after creating your GitHub repository

Write-Host "🚀 GitHub Push Helper" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

Write-Host "`n1. First, create a repository on GitHub:" -ForegroundColor Yellow
Write-Host "   - Go to https://github.com" -ForegroundColor White
Write-Host "   - Click 'New repository'" -ForegroundColor White
Write-Host "   - Name: hotel-management-system" -ForegroundColor White
Write-Host "   - Keep it PUBLIC (for free Render deployment)" -ForegroundColor White
Write-Host "   - DON'T initialize with README" -ForegroundColor White
Write-Host "   - Copy the repository URL" -ForegroundColor White

Write-Host "`n2. Enter your GitHub repository URL:" -ForegroundColor Yellow
$repoUrl = Read-Host "Repository URL (e.g., https://github.com/username/hotel-management-system.git)"

if ($repoUrl) {
    Write-Host "`n3. Pushing to GitHub..." -ForegroundColor Yellow
    
    git remote add origin $repoUrl
    git branch -M main
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "`n🎉 Your code is now ready for Render deployment!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
        Write-Host "2. Follow the DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
        Write-Host "3. Use your repository: $repoUrl" -ForegroundColor White
    } else {
        Write-Host "`n❌ Push failed. Please check:" -ForegroundColor Red
        Write-Host "- Repository URL is correct" -ForegroundColor White
        Write-Host "- You have push access to the repository" -ForegroundColor White
        Write-Host "- GitHub credentials are set up" -ForegroundColor White
    }
} else {
    Write-Host "`n❌ No repository URL provided." -ForegroundColor Red
}
