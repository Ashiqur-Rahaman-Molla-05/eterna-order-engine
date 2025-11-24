#!/usr/bin/env powershell

<#
.SYNOPSIS
    Automated video demo runner - executes tests and verification for video recording
.DESCRIPTION
    Runs npm test and node verify-system.js with clear output for video demonstration
.EXAMPLE
    .\record-demo.ps1
#>

Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ETERNA Order Execution Engine - Video Demo Runner         ║" -ForegroundColor Cyan
Write-Host "║  Recording guide: See VIDEO_RECORDING_GUIDE.md             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# Step 1: Run Tests
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "STEP 1: Running Unit Tests (npm test)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "`n📝 SCRIPT: 'The system has 32 unit tests covering DEX routing, order execution, slippage validation, and queue behavior. All tests pass.'" -ForegroundColor Cyan
Write-Host "`n"

npm test
$testResult = $LASTEXITCODE

if ($testResult -eq 0) {
    Write-Host "`n✅ Tests passed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Tests failed. Fix issues before recording." -ForegroundColor Red
    exit 1
}

# Step 2: Run System Verification
Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "STEP 2: Running System Verification (node verify-system.js)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "`n📝 SCRIPT: 'Let me verify the core system components. This demonstrates DEX routing, quote comparison, and swap execution with realistic delays.'" -ForegroundColor Cyan
Write-Host "`n"

node verify-system.js
$verifyResult = $LASTEXITCODE

if ($verifyResult -eq 0) {
    Write-Host "`n✅ System verification passed!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Verification failed. Check output above." -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ DEMO READY - All systems operational!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n📹 Next steps for video recording:" -ForegroundColor Yellow
Write-Host "  1. Open VIDEO_RECORDING_GUIDE.md" -ForegroundColor White
Write-Host "  2. Follow shots 1-7 in order" -ForegroundColor White
Write-Host "  3. Use this script output as reference" -ForegroundColor White
Write-Host "  4. Record with Win+G or OBS Studio" -ForegroundColor White
Write-Host "`n🎬 Total video duration: ~2 minutes" -ForegroundColor Yellow
Write-Host "⏱️  Total recording time: ~10 minutes including upload" -ForegroundColor Yellow
Write-Host "`n"
