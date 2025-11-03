#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Test Firebase connectivity from Docker container
.DESCRIPTION
    This script restarts the API container and tests network connectivity to Firebase/Google APIs
#>

Write-Host "🔍 Firebase Network Diagnostics" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "1. Checking Docker status..." -ForegroundColor Yellow
$dockerStatus = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Navigate to compose directory
Write-Host "2. Navigating to compose directory..." -ForegroundColor Yellow
Set-Location -Path "infra/compose"
Write-Host "✅ In directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Restart API container
Write-Host "3. Restarting API container..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml restart api
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restart API container" -ForegroundColor Red
    exit 1
}
Write-Host "✅ API container restarted" -ForegroundColor Green
Write-Host ""

# Wait for container to be ready
Write-Host "4. Waiting for container to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✅ Container should be ready" -ForegroundColor Green
Write-Host ""

# Run network diagnostics
Write-Host "5. Running network diagnostics inside container..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Gray
docker exec ubexgo-api-dev node /app/scripts/test-network.js
Write-Host "---------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Check API logs for Firebase initialization
Write-Host "6. Checking Firebase initialization in logs..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Gray
docker logs ubexgo-api-dev --tail 50 | Select-String -Pattern "Firebase", "🔥", "ubexgo-ae910"
Write-Host "---------------------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Diagnostics complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check the network diagnostics output above" -ForegroundColor White
Write-Host "  2. If DNS resolution fails, check your Docker network settings" -ForegroundColor White
Write-Host "  3. If HTTPS connection fails, check firewall/antivirus settings" -ForegroundColor White
Write-Host "  4. Try sending an OTP via push notification to test" -ForegroundColor White
Write-Host ""
Write-Host "To view live logs: docker logs -f ubexgo-api-dev" -ForegroundColor Gray
Write-Host ""

# Return to project root
Set-Location -Path "../.."

