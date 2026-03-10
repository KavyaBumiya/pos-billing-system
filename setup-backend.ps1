# Quick Backend Setup & Seed Script
# Run this after deploying backend to Render

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl
)

# Clean URL (remove trailing slash)
$BackendUrl = $BackendUrl.TrimEnd('/')

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  Testing Backend Connection" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[1/5] Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/" -Method GET -ErrorAction Stop
    Write-Host "✓ Backend is alive!" -ForegroundColor Green
    Write-Host "    Status: $($health.status)" -ForegroundColor Gray
    Write-Host "    Version: $($health.version)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend not responding at: $BackendUrl" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Seed Database
Write-Host "`n[2/5] Seeding database with products..." -ForegroundColor Yellow
try {
    $seedResult = Invoke-RestMethod -Uri "$BackendUrl/api/seed" -Method POST -ErrorAction Stop
    Write-Host "✓ Database seeded successfully!" -ForegroundColor Green
    Write-Host "    $($seedResult.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Seed failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Verify Categories
Write-Host "`n[3/5] Checking categories..." -ForegroundColor Yellow
try {
    $categories = Invoke-RestMethod -Uri "$BackendUrl/api/categories" -Method GET -ErrorAction Stop
    Write-Host "✓ Found $($categories.Count) categories" -ForegroundColor Green
    $categories | ForEach-Object { Write-Host "    - $($_.name)" -ForegroundColor Gray }
} catch {
    Write-Host "✗ Categories check failed" -ForegroundColor Red
}

# Test 4: Verify Products
Write-Host "`n[4/5] Checking products..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$BackendUrl/api/products" -Method GET -ErrorAction Stop
    Write-Host "✓ Found $($products.Count) products" -ForegroundColor Green
    Write-Host "    Sample: $($products[0].name) - ₹$($products[0].price_per_unit)/$($products[0].unit)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Products check failed" -ForegroundColor Red
}

# Test 5: Update Frontend
Write-Host "`n[5/5] Ready to update frontend" -ForegroundColor Yellow
Write-Host "✓ Your backend API URL is: $BackendUrl/api" -ForegroundColor Green

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  Deployment Commands" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

Write-Host "Run these commands to deploy frontend:`n" -ForegroundColor White
Write-Host "`$env:REACT_APP_API_URL='$BackendUrl/api'" -ForegroundColor Yellow
Write-Host "cd frontend" -ForegroundColor Yellow
Write-Host "npm run build" -ForegroundColor Yellow
Write-Host "cd .." -ForegroundColor Yellow
Write-Host "npx firebase-tools deploy --only hosting`n" -ForegroundColor Yellow

Write-Host "Done! Your backend is ready.`n" -ForegroundColor Green
