$ErrorActionPreference = 'SilentlyContinue'

# PreToolUse hook: se Edit/Write/MultiEdit tocca la VIEW o CSS,
# inietta reminder di caricare DESIGN.md + PRODUCT.md (Direttive grafiche in CLAUDE.md).
$raw = [Console]::In.ReadToEnd()
if (-not $raw) { exit 0 }

try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

$path = $data.tool_input.file_path
if (-not $path) { exit 0 }

$p = $path -replace '\\', '/'
$isGrafica = ($p -match '/src/view/') -or ($p -match '\.vue$') -or ($p -match '\.css$')
if (-not $isGrafica) { exit 0 }

$ctx = 'TRIGGER GRAFICA (' + [System.IO.Path]::GetFileName($p) + '): stai per modificare la VIEW/CSS. Se non hai gia fatto, invoca la skill impeccable (tool Skill) prima di procedere. Vedi "Direttive grafiche" in CLAUDE.md.'

$out = @{
    hookSpecificOutput = @{
        hookEventName    = 'PreToolUse'
        additionalContext = $ctx
    }
} | ConvertTo-Json -Compress

[Console]::Out.Write($out)
exit 0