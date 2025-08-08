<#
  Split-Rendering-Classes.ps1
  ---------------------------
  Auto-detects specific class declarations in main.js
  and copies each class into its own JS module.

  Default input  : .\main.js      (in current dir)
  Default output : ..\rendering\  (one level up)
#>

param(
    [string]$SourceFile = "main.js",
    [string]$OutputDir  = "..\rendering"
)

# -------- 1. Which classes to export? ----------
# Add or remove names here (order doesn’t matter)
$renderClasses = @(
    'Scene3D',
    'CameraController',
    'AntennaRenderer',
    'NodesRenderer',
    'FieldRenderer',
    'PerformanceMonitor',
    'ThreeDRenderer'
)

# -------- 2. Basic checks ----------
if (-not (Test-Path $SourceFile)) {
    Write-Error "Source file '$SourceFile' not found."
    exit 1
}
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Pre-build a regex that matches   class <AnyNameWeCareAbout>
# Example:  ^\s*class (Scene3D|CameraController)\b
$regexPattern = '^\s*class\s+(' + ($renderClasses -join '|') + ')\b'
$regex = [regex]$regexPattern

# -------- 3. Stream the file and split blocks ----------
$currentName  = $null
$currentLines = @()

function Flush {
    param([string]$Name, [string[]]$Lines)
    if ($Name -and $Lines.Count) {
        $target = Join-Path $OutputDir ("$Name.js")
        $Lines  | Set-Content -Path $target -Encoding utf8
        Write-Host ("Wrote {0} lines to {1}" -f $Lines.Count, $target) -ForegroundColor Cyan
    }
}

Get-Content -Path $SourceFile | ForEach-Object {

    $m = $regex.Match($_)

    if ($m.Success) {
        # Found the start of a class we want
        Flush $currentName $currentLines
        $currentName  = $m.Groups[1].Value   # class name
        $currentLines = @()
    }

    if ($currentName) { $currentLines   += $_ }
}

Flush $currentName $currentLines  # final class

Write-Host ("Rendering classes copied to {0}" -f (Resolve-Path $OutputDir)) -ForegroundColor Green
