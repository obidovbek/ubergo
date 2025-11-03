# PowerShell script to create .env file from env_content
# Run this from the project root: D:\projects\UberGo

Write-Host "Creating .env file from env_content..." -ForegroundColor Cyan

$sourceFile = "env_content"
$targetFile = ".env"

if (Test-Path $sourceFile) {
    Copy-Item -Path $sourceFile -Destination $targetFile -Force
    Write-Host "✅ Successfully created .env file!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. cd infra\compose" -ForegroundColor White
    Write-Host "2. docker-compose -f docker-compose.dev.yml down -v" -ForegroundColor White
    Write-Host "3. docker-compose -f docker-compose.dev.yml up --build" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Error: env_content file not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root (D:\projects\UberGo)" -ForegroundColor Yellow
}

