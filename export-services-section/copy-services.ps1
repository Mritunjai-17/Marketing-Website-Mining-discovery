<#
.SYNOPSIS
    Automated one-command script to copy and install the Services section into any cloned Next.js project.
.DESCRIPTION
    Safely copies the /services page route, all Services components, styling modules, 
    data schemas, required motion utilities, and all public image assets into a target directory.
    Checks and installs required npm dependencies (gsap, lucide-react).
.PARAMETER TargetDir
    The root path of the cloned repository (e.g. D:\Marketing-Website-Mining-discovery-cloned).
.EXAMPLE
    .\copy-services.ps1 -TargetDir "D:\Marketing-Website-Mining-discovery-cloned"
#>

param (
    [string]$TargetDir = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($TargetDir)) {
    $TargetDir = Read-Host "Enter the full path to the cloned project root (e.g. D:\Marketing-Website-Mining-discovery-cloned)"
}

# Clean path
$TargetDir = $TargetDir.Trim('"').Trim("'").TrimEnd('\').TrimEnd('/')

if (!(Test-Path $TargetDir)) {
    Write-Error "Target directory '$TargetDir' does not exist! Please clone the repository first or provide a valid path."
    exit 1
}

$targetPackageJson = Join-Path $TargetDir "package.json"
if (!(Test-Path $targetPackageJson)) {
    Write-Error "Target directory '$TargetDir' does not appear to be a Next.js project (missing package.json)."
    exit 1
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Installing Services Section into: $TargetDir" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Determine source location
$scriptDir = $PSScriptRoot
$sourceDir = ""

if (Test-Path (Join-Path $scriptDir "src\app\services\page.tsx")) {
    $sourceDir = $scriptDir
} elseif (Test-Path (Join-Path $scriptDir "export-services-section\src\app\services\page.tsx")) {
    $sourceDir = Join-Path $scriptDir "export-services-section"
} else {
    Write-Error "Could not find source Services files in '$scriptDir'."
    exit 1
}

# 1. Copy App Route: src/app/services
Write-Host "[1/5] Copying /services route (src/app/services)..." -ForegroundColor Yellow
$destApp = Join-Path $TargetDir "src\app\services"
New-Item -ItemType Directory -Path $destApp -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "src\app\services\*") -Destination $destApp -Recurse -Force
Write-Host "  [OK] /services route copied." -ForegroundColor Green

# 2. Copy Components: src/components/services
Write-Host "[2/5] Copying components (src/components/services)..." -ForegroundColor Yellow
$destComp = Join-Path $TargetDir "src\components\services"
New-Item -ItemType Directory -Path $destComp -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "src\components\services\*") -Destination $destComp -Recurse -Force
Write-Host "  [OK] Services components copied." -ForegroundColor Green

# 3. Copy Shared Motion & Data Dependencies
Write-Host "[3/5] Copying shared utilities & data (reveal.tsx, trustedBrands.ts)..." -ForegroundColor Yellow
$destAbout = Join-Path $TargetDir "src\components\about"
New-Item -ItemType Directory -Path $destAbout -Force | Out-Null
$srcReveal = Join-Path $sourceDir "src\components\about\reveal.tsx"
if (Test-Path $srcReveal) {
    Copy-Item -Path $srcReveal -Destination $destAbout -Force
    Write-Host "  [OK] src/components/about/reveal.tsx copied." -ForegroundColor Green
}

$destData = Join-Path $TargetDir "src\data"
New-Item -ItemType Directory -Path $destData -Force | Out-Null
$srcBrands = Join-Path $sourceDir "src\data\trustedBrands.ts"
if (Test-Path $srcBrands) {
    Copy-Item -Path $srcBrands -Destination $destData -Force
    Write-Host "  [OK] src/data/trustedBrands.ts copied." -ForegroundColor Green
}

# 4. Copy Public Assets
Write-Host "[4/5] Copying public assets (services, images, cards, stats)..." -ForegroundColor Yellow

# public/services
$destPublicServices = Join-Path $TargetDir "public\services"
New-Item -ItemType Directory -Path $destPublicServices -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "public\services\*") -Destination $destPublicServices -Recurse -Force

# public/images/services
$destPublicImgServices = Join-Path $TargetDir "public\images\services"
New-Item -ItemType Directory -Path $destPublicImgServices -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "public\images\services\*") -Destination $destPublicImgServices -Recurse -Force

# public/images/engine
$destPublicEngine = Join-Path $TargetDir "public\images\engine"
New-Item -ItemType Directory -Path $destPublicEngine -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "public\images\engine\*") -Destination $destPublicEngine -Recurse -Force

# public/images/jurisdictions_map.webp
$destPublicImages = Join-Path $TargetDir "public\images"
New-Item -ItemType Directory -Path $destPublicImages -Force | Out-Null
$srcMap = Join-Path $sourceDir "public\images\jurisdictions_map.webp"
if (Test-Path $srcMap) {
    Copy-Item -Path $srcMap -Destination $destPublicImages -Force
}

# public/cards (all cards including real_audience_strategy, real_social_media, bg_card_*)
$destPublicCards = Join-Path $TargetDir "public\cards"
New-Item -ItemType Directory -Path $destPublicCards -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "public\cards\*") -Destination $destPublicCards -Recurse -Force

# public/stats (all stats including newsletter-briefing, real_newsletter_desk)
$destPublicStats = Join-Path $TargetDir "public\stats"
New-Item -ItemType Directory -Path $destPublicStats -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "public\stats\*") -Destination $destPublicStats -Recurse -Force

# public/about/open-pit-golden-hour.webp
$destPublicAbout = Join-Path $TargetDir "public\about"
New-Item -ItemType Directory -Path $destPublicAbout -Force | Out-Null
$srcPit = Join-Path $sourceDir "public\about\open-pit-golden-hour.webp"
if (Test-Path $srcPit) {
    Copy-Item -Path $srcPit -Destination $destPublicAbout -Force
}
Write-Host "  [OK] Public assets copied." -ForegroundColor Green

# 5. Check & Install Dependencies
Write-Host "[5/5] Checking npm dependencies (gsap, lucide-react)..." -ForegroundColor Yellow
$pkgContent = Get-Content $targetPackageJson -Raw
$missingPackages = @()

if ($pkgContent -notmatch '"gsap"') {
    $missingPackages += "gsap"
}
if ($pkgContent -notmatch '"lucide-react"') {
    $missingPackages += "lucide-react"
}

if ($missingPackages.Count -gt 0) {
    $pkgList = $missingPackages -join " "
    Write-Host "  Installing missing packages: $pkgList..." -ForegroundColor Cyan
    Push-Location $TargetDir
    try {
        npm install $missingPackages --save
        Write-Host "  [OK] Packages installed successfully." -ForegroundColor Green
    } catch {
        Write-Warning "Could not run 'npm install $pkgList'. Please run npm install $pkgList manually."
    } finally {
        Pop-Location
    }
} else {
    Write-Host "  [OK] Required packages (gsap, lucide-react) are already installed." -ForegroundColor Green
}

# 6. Verification
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Verifying Installation Integrity..." -ForegroundColor Yellow
$requiredFiles = @(
    "src\app\services\page.tsx",
    "src\components\services\ServicesJourney.tsx",
    "src\components\services\servicesData.ts",
    "src\components\services\ServiceDetailOverlay.tsx",
    "src\components\about\reveal.tsx",
    "src\data\trustedBrands.ts",
    "public\images\jurisdictions_map.webp",
    "public\about\open-pit-golden-hour.webp",
    "public\cards\real_audience_strategy.webp",
    "public\stats\real_newsletter_desk.webp",
    "public\images\engine\real_investor_handshake.webp",
    "public\images\engine\real_conference_summit.webp",
    "public\images\engine\real_digital_brand.webp",
    "public\images\services\service_01_investor_light.webp"
)

$allFound = $true
foreach ($file in $requiredFiles) {
    $checkPath = Join-Path $TargetDir $file
    if (!(Test-Path $checkPath)) {
        Write-Warning "Missing: $file"
        $allFound = $false
    }
}

if ($allFound) {
    Write-Host "  [VERIFIED] All core services files and assets are present!" -ForegroundColor Green
} else {
    Write-Warning "  Some assets may be missing. Check warning lines above."
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Services Section Successfully Installed!" -ForegroundColor Green
Write-Host "  To test in the cloned project:" -ForegroundColor Cyan
Write-Host "    cd `"$TargetDir`"" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor White
Write-Host "  Then visit: http://localhost:3000/services" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
