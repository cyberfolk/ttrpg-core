$ErrorActionPreference = 'SilentlyContinue'

# PreToolUse (Bash / git commit): tripwire per CLAUDE.md sez. "Responsabilita di manutenzione".
# Se lo staged tocca MODEL/STORE o la VIEW che porta comportamento (router,
# components, composables use*.js) ma NON docs/requisiti-funzionali/,
# chiede conferma: cambio funzionale => aggiorna i requisiti nello stesso commit;
# refactor interno / stile => procedi. Il giudizio resta all'operatore, non all'hook.
$raw = [Console]::In.ReadToEnd()
if (-not $raw) { exit 0 }

try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

$cmd = $data.tool_input.command
if (-not $cmd) { exit 0 }
if ($cmd -notmatch 'git\s+commit') { exit 0 }

$staged = git diff --cached --name-only 2>$null
if (-not $staged) { exit 0 }
$files = $staged -split "`n" | Where-Object { $_ }

$code = $files | Where-Object {
    ($_ -match '^src/model/') -or ($_ -match '^src/store/') -or
    ($_ -match '^src/view/router\.js$') -or
    ($_ -match '^src/view/components/') -or ($_ -match '^src/view/use')
}
$docs = $files | Where-Object { $_ -match '^docs/requisiti-funzionali/' }

if ($code -and -not $docs) {
    $reason = 'Commit tocca MODEL/STORE/VIEW-comportamento (' + ($code -join ', ') + ') ma NON docs/requisiti-funzionali/. ' +
              'Se cambia comportamento funzionale (entita, reputazione, viste, flussi, dati) aggiorna il pezzo pertinente nello STESSO commit (CLAUDE.md sez. "Responsabilita di manutenzione"). ' +
              'Se e refactor interno / stile / test senza impatto funzionale, procedi.'
    $out = @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = 'ask'
            permissionDecisionReason = $reason
        }
    } | ConvertTo-Json -Compress
    [Console]::Out.Write($out)
}

exit 0
