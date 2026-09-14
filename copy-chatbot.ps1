<#
.SYNOPSIS
    Automated one-command script to copy and install the Mining AI Chatbot into any cloned project.
.DESCRIPTION
    Safely copies all chatbot components, libraries, styles, and API routes into a target directory.
    Installs required npm dependencies and verifies setup.
.PARAMETER TargetDir
    The root path of the cloned repository (e.g. D:\Marketing-Website-Mining-discovery).
.EXAMPLE
    .\copy-chatbot.ps1 -TargetDir "D:\Marketing-Website-Mining-discovery"
#>

param (
    [string]$TargetDir = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($TargetDir)) {
    $TargetDir = Read-Host "Enter the full path to the cloned project root (e.g. D:\new-clone)"
}

# Remove any trailing quotes or slashes
$TargetDir = $TargetDir.Trim('"').Trim("'").TrimEnd('\').TrimEnd('/')

if (!(Test-Path $TargetDir)) {
    Write-Error "Target directory '$TargetDir' does not exist! Please provide a valid path."
    exit 1
}

$targetPackageJson = Join-Path $TargetDir "package.json"
if (!(Test-Path $targetPackageJson)) {
    Write-Error "Target directory '$TargetDir' does not appear to be a Next.js project (missing package.json)."
    exit 1
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Installing Mining AI Chatbot into: $TargetDir" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Determine source location
$scriptDir = $PSScriptRoot
$sourceDir = ""

if (Test-Path (Join-Path $scriptDir "src\lib\mining-answer.ts")) {
    $sourceDir = $scriptDir
} elseif (Test-Path (Join-Path $scriptDir "export-mining-assistant\src\lib\mining-answer.ts")) {
    $sourceDir = Join-Path $scriptDir "export-mining-assistant"
} elseif (Test-Path (Join-Path $scriptDir "mining-ai-assistant.zip")) {
    Write-Host "Extracting portable package from zip..." -ForegroundColor Yellow
    $tempExtract = Join-Path $env:TEMP "mining-ai-chatbot-extract"
    if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }
    Expand-Archive -Path (Join-Path $scriptDir "mining-ai-assistant.zip") -DestinationPath $tempExtract -Force
    $sourceDir = $tempExtract
} else {
    Write-Error "Could not find source chatbot files in '$scriptDir'. Ensure export-mining-assistant or mining-ai-assistant.zip is present."
    exit 1
}

# 1. Copy src/lib directory
Write-Host "[1/6] Copying chatbot core libraries (src/lib)..." -ForegroundColor Yellow
$destLib = Join-Path $TargetDir "src\lib"
New-Item -ItemType Directory -Path $destLib -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "src\lib\*") -Destination $destLib -Recurse -Force
Write-Host "  [OK] Core libraries copied successfully." -ForegroundColor Green

# 2. Copy UI components
Write-Host "[2/6] Copying UI components..." -ForegroundColor Yellow
$destUi = Join-Path $TargetDir "src\components\ui"
New-Item -ItemType Directory -Path $destUi -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "src\components\ui\MiningAICHatWidget.tsx") -Destination $destUi -Force

$destComp = Join-Path $TargetDir "src\components"
New-Item -ItemType Directory -Path $destComp -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "src\components\MiningChart.tsx") -Destination $destComp -Force
Write-Host "  [OK] MiningAICHatWidget & MiningChart copied." -ForegroundColor Green

# 3. Copy API route
Write-Host "[3/6] Copying API route (src/app/api/chat/route.ts)..." -ForegroundColor Yellow
$destApi = Join-Path $TargetDir "src\app\api\chat"
New-Item -ItemType Directory -Path $destApi -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDir "src\app\api\chat\route.ts") -Destination $destApi -Force
Write-Host "  [OK] Chat API route copied." -ForegroundColor Green

# 4. Check & Inject layout component
Write-Host "[4/6] Checking layout.tsx integration..." -ForegroundColor Yellow
$layoutPath = Join-Path $TargetDir "src\app\layout.tsx"
if (Test-Path $layoutPath) {
    $layoutContent = Get-Content $layoutPath -Raw
    $modified = $false

    if ($layoutContent -notmatch "MiningAICHatWidget") {
        # Add import at the top
        $layoutContent = "import MiningAICHatWidget from ""@/components/ui/MiningAICHatWidget"";`n" + $layoutContent
        # Add component before </body>
        if ($layoutContent -match "</body>") {
            $layoutContent = $layoutContent -replace "</body>", "        <MiningAICHatWidget />`n      </body>"
            $modified = $true
        }
    }

    if ($modified) {
        Set-Content -Path $layoutPath -Value $layoutContent -Encoding utf8
        Write-Host "  [OK] Injected <MiningAICHatWidget /> into layout.tsx." -ForegroundColor Green
    } else {
        Write-Host "  [OK] layout.tsx already includes MiningAICHatWidget." -ForegroundColor Green
    }
}

# 5. Check CSS styles in globals.css
Write-Host "[5/6] Ensuring mobile-responsive chatbot styles in globals.css..." -ForegroundColor Yellow
$globalsCssPath = Join-Path $TargetDir "src\app\globals.css"
if (Test-Path $globalsCssPath) {
    $currentCss = Get-Content $globalsCssPath -Raw
    if ($currentCss -notmatch "chat-window-new") {
        $sourceCssPath = Join-Path $sourceDir "src\app\globals.css"
        if (Test-Path $sourceCssPath) {
            $sourceCss = Get-Content $sourceCssPath -Raw
            Add-Content -Path $globalsCssPath -Value "`n/* === MINING AI CHATBOT STYLES === */`n$sourceCss" -Encoding utf8
            Write-Host "  [OK] Added responsive chatbot styles to globals.css." -ForegroundColor Green
        }
    } else {
        Write-Host "  [OK] globals.css already has chatbot styling." -ForegroundColor Green
    }
}

# 6. Copy environment variables (.env.local)
$targetEnv = Join-Path $TargetDir ".env.local"
$sourceEnv = Join-Path $scriptDir ".env.local"
if (!(Test-Path $targetEnv)) {
    if (Test-Path $sourceEnv) {
        Copy-Item -Path $sourceEnv -Destination $targetEnv
        Write-Host "  [OK] Restored .env.local with OPENAI_API_KEY." -ForegroundColor Green
        $envTemplate = @"
ADMIN_USERNAME=miningAdmin
ADMIN_PASSWORD=Mining@123
SESSION_SECRET=Mining_discovery_2026_question_answer-ai_assistent
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_DB=mining_discovery
MONGODB_URI=mongodb://127.0.0.1:27017/mining_discovery
"@
        Set-Content -Path $targetEnv -Value $envTemplate -Encoding utf8
        Write-Host "  [OK] Created .env.local (fill in OPENAI_API_KEY)." -ForegroundColor Green
    }
}

# 7. Install dependencies
Write-Host "[6/6] Installing required dependencies (openai, mongodb)..." -ForegroundColor Yellow
Push-Location $TargetDir
try {
    npm install openai mongodb --save
    Write-Host "  [OK] Dependencies installed successfully." -ForegroundColor Green
} catch {
    Write-Warning "Could not run 'npm install' automatically. Please run 'npm install openai mongodb' in the project directory."
} finally {
    Pop-Location
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Mining AI Chatbot successfully installed!" -ForegroundColor Green
Write-Host " You can now run:" -ForegroundColor Cyan
Write-Host "   cd `"$TargetDir`"" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
