$ErrorActionPreference = 'SilentlyContinue'

# UserPromptSubmit hook: se il prompt utente contiene una parola-trigger grafica
# (CLAUDE.md "Direttive grafiche"), inietta reminder di invocare la skill impeccable
# PRIMA di agire. Complementa grafica-reminder.ps1 (che scatta tardi, solo su Edit
# di file VIEW/CSS): questo intercetta l'intento gia dal prompt, path-agnostico.
$raw = [Console]::In.ReadToEnd()
if (-not $raw) { exit 0 }

try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

$prompt = $data.prompt
if (-not $prompt) { exit 0 }

# Parole-trigger da CLAUDE.md. -match e case-insensitive in PowerShell.
$triggers = 'grafic|impeccable|\bvista\b|\bview\b|\bcss\b|\bstil|\blayout\b|color|tipografi|\bfont\b|spaziatur|allineament|\bds-|drawer|modale|toolbar|badge|\bchip\b|\bhover\b|\bfocus\b|responsive|mobile|smartphone|tablet|animazion|transizion'

if ($prompt -notmatch $triggers) { exit 0 }

$ctx = 'TRIGGER GRAFICA (rilevato nel prompt): il task tocca aspetto/VIEW. Prima di agire invoca la skill impeccable (tool Skill) e instrada sul comando giusto. Vedi "Direttive grafiche" in CLAUDE.md.'

$out = @{
    hookSpecificOutput = @{
        hookEventName     = 'UserPromptSubmit'
        additionalContext = $ctx
    }
} | ConvertTo-Json -Compress

[Console]::Out.Write($out)
exit 0
