# To run: powershell -ExecutionPolicy Bypass -File scan-react.ps1

Write-Host "`n=== React Security Scan Starting ===`n"

$ErrorActionPreference = "Stop"

# ------------------------------
# 1. Verify Semgrep installation
# ------------------------------
Write-Host "--- Checking Semgrep installation ---"
$semgrep = Get-Command semgrep -ErrorAction SilentlyContinue

if (-not $semgrep) {
    Write-Host "Semgrep not found. Installing Windows binary..."
    $semgrepUrl = "https://semgrep.dev/api/agent/downloads/semgrep-windows-amd64.exe"
    Invoke-WebRequest $semgrepUrl -OutFile "semgrep.exe"
    $env:PATH += ";$PWD"
    Write-Host "Semgrep installed locally as semgrep.exe"
}

# ------------------------------
# 2. Install ESLint security plugins
# ------------------------------
Write-Host "`n--- Installing ESLint security plugins ---"
npm install --save-dev eslint eslint-plugin-security eslint-plugin-no-unsanitized --silent

# ------------------------------
# 3. Run Semgrep (Updated Rule URLs)
# ------------------------------
Write-Host "`n--- Running Semgrep (OWASP + Security Rules) ---"

# Updated official rulepacks
$semgrepConfigs = @(
    "p/owasp-top-ten",
    "p/javascript",
    "p/security-audit"
)

# Limit scanning to *actual source code only*
$semgrepCommand = "semgrep --error --config " + ($semgrepConfigs -join " --config ") + " src/"

Invoke-Expression $semgrepCommand

# ------------------------------
# 4. Run ESLint Security Scan
# ------------------------------
Write-Host "`n--- Running ESLint (Security + Rules) ---"

# Ignore node_modules, build artifacts, vite deps
npx eslint `
  src `
  --ext .js,.jsx,.ts,.tsx `
  --ignore-pattern node_modules `
  --ignore-pattern .vite `
  --ignore-pattern dist

# ------------------------------
# 5. (Optional) Snyk Scan
# ------------------------------
Write-Host "`n--- Running Snyk Dependency Scan (if authenticated) ---"
try {
    snyk auth --quiet | Out-Null
    snyk test --all-projects
}
catch {
    Write-Host "Skipping Snyk scan (not authenticated or Snyk not installed)."
}

# ------------------------------
# 6. npm Audit
# ------------------------------
Write-Host "`n--- Running npm audit ---"
npm audit --omit=dev

Write-Host "`n=== React Security Scan Complete ===`n"

