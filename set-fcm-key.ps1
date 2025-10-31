# Set FCM Server Key in .env file
# Usage: .\set-fcm-key.ps1 "YOUR_FCM_SERVER_KEY_HERE"

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerKey
)

$envFile = ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Read the .env file
$content = Get-Content $envFile -Raw

# Replace the FCM_SERVER_KEY value
if ($content -match 'FCM_SERVER_KEY=') {
    $newContent = $content -replace 'FCM_SERVER_KEY=.*', "FCM_SERVER_KEY=$ServerKey"
    Set-Content -Path $envFile -Value $newContent -NoNewline
    Write-Host "✅ FCM_SERVER_KEY has been set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your API service:" -ForegroundColor White
    Write-Host "   cd infra/compose" -ForegroundColor Gray
    Write-Host "   docker-compose restart api" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Or if running locally:" -ForegroundColor White
    Write-Host "   cd apps/api" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor Gray
} else {
    Write-Host "ERROR: FCM_SERVER_KEY not found in .env file!" -ForegroundColor Red
    exit 1
}

