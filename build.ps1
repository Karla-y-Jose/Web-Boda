<#
  build.ps1  — Minify CSS and JS for the wedding website.
  Run once before deployment:  .\build.ps1
  Outputs: css/styles.min.css  and  js/scripts.min.js
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── CSS minifier ─────────────────────────────────────────────────────────────
function Invoke-MinifyCSS ([string]$src) {
    $css = Get-Content $src -Raw -Encoding UTF8

    # 1) Remove /* … */ comments
    $css = [Regex]::Replace($css, '/\*[\s\S]*?\*/', '')

    # 2) Normalise line endings → single space
    $css = $css -replace '[\r\n\t]+', ' '

    # 3) Collapse runs of spaces
    $css = $css -replace ' {2,}', ' '

    # 4) Remove spaces around structural tokens (safe – avoids : to protect url() / calc())
    $css = $css -replace '\s*\{\s*', '{'
    $css = $css -replace '\s*\}\s*', '}'
    $css = $css -replace '\s*;\s*', ';'
    $css = $css -replace '\s*,\s*', ','

    # 5) Drop trailing semicolons before }
    $css = $css -replace ';}', '}'

    return $css.Trim()
}

# ── JS minifier ──────────────────────────────────────────────────────────────
# Conservative: strips block comments and collapses blank lines.
# Does NOT mangle names (safe for jQuery-based code without a full parser).
function Invoke-MinifyJS ([string]$src) {
    $js = Get-Content $src -Raw -Encoding UTF8

    # 1) Remove /* … */ block comments (skip regex-literal risk – none in this file)
    $js = [Regex]::Replace($js, '/\*[\s\S]*?\*/', '')

    # 2) Remove // line comments that occupy a whole line (safest subset)
    $js = $js -replace '(?m)^\s*//.*$', ''

    # 3) Collapse 3+ consecutive blank lines to one
    $js = $js -replace '(\r?\n){3,}', "`n`n"

    # 4) Collapse leading whitespace on each line to a single space (preserves indentation intent but saves bytes)
    $js = ($js -split '\r?\n' | ForEach-Object { $_.TrimEnd() }) -join "`n"

    return $js.Trim()
}

# ── Build ─────────────────────────────────────────────────────────────────────
$root = $PSScriptRoot

Write-Host 'Building CSS…' -ForegroundColor Cyan
$minCSS = Invoke-MinifyCSS "$root\css\styles.css"
[System.IO.File]::WriteAllText("$root\css\styles.min.css", $minCSS, [System.Text.Encoding]::UTF8)
$origKB = [math]::Round((Get-Item "$root\css\styles.css").Length  / 1KB, 1)
$minKB  = [math]::Round((Get-Item "$root\css\styles.min.css").Length / 1KB, 1)
Write-Host "  styles.css  $origKB KB  →  styles.min.css  $minKB KB" -ForegroundColor Green

Write-Host 'Building JS…'  -ForegroundColor Cyan
$minJS  = Invoke-MinifyJS  "$root\js\scripts.js"
[System.IO.File]::WriteAllText("$root\js\scripts.min.js", $minJS, [System.Text.Encoding]::UTF8)
$origKB = [math]::Round((Get-Item "$root\js\scripts.js").Length  / 1KB, 1)
$minKB  = [math]::Round((Get-Item "$root\js\scripts.min.js").Length / 1KB, 1)
Write-Host "  scripts.js  $origKB KB  →  scripts.min.js  $minKB KB" -ForegroundColor Green

Write-Host 'Done.' -ForegroundColor White
