# seed_from_markdown.ps1
# Migra datos de CLAUDE-*.md a AgentBrain SQL Server
# Ejecutar UNA VEZ despues de crear el schema (agentbrain_schema.sql)
# USO: .\seed_from_markdown.ps1 [-DryRun]

param(
    [string]$RaizProyecto = (Split-Path $PSScriptRoot -Parent),
    [switch]$DryRun = $false
)

$DB_SERVER   = "127.0.0.1"
$DB_PORT     = "1433"
$DB_NAME     = "AgentBrain"
$DB_USER     = "agentbrain_svc"
$DB_PASSWORD = "AgentBrain2024!"

$counts = @{ lessons = 0; patterns = 0; decisions = 0; errors = 0 }

function Escape-Sql([string]$s) { return $s -replace "'", "''" }

function Run-Sql([string]$sql) {
    $sql = "SET QUOTED_IDENTIFIER ON;`nSET ANSI_NULLS ON;`n" + $sql
    if ($DryRun) {
        Write-Host ("  [DRY] " + $sql.Substring(0,[Math]::Min(80,$sql.Length))) -ForegroundColor DarkGray
        return $true
    }
    $tmpFile = [System.IO.Path]::GetTempFileName() + ".sql"
    [System.IO.File]::WriteAllText($tmpFile, $sql, [System.Text.Encoding]::UTF8)
    $out = & sqlcmd -S "$DB_SERVER,$DB_PORT" -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -No -i $tmpFile -b 2>&1
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Write-Host ("  ERROR: " + ($out | Select-Object -First 2 | Out-String)) -ForegroundColor Red
        return $false
    }
    return $true
}

Write-Host "" ; Write-Host "=== AgentBrain Seed Script ===" -ForegroundColor Cyan
Write-Host "Raiz: $RaizProyecto" -ForegroundColor Gray
if ($DryRun) { Write-Host "[DRY-RUN MODE]" -ForegroundColor Yellow }
Write-Host ""

# Verificar conexion
$testOut = & sqlcmd -S "$DB_SERVER,$DB_PORT" -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -No -Q "SELECT 1" -b 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se puede conectar a AgentBrain. Verifica: SQL Server corriendo, Mixed Mode habilitado." -ForegroundColor Red
    exit 1
}
Write-Host "Conexion OK a AgentBrain" -ForegroundColor Green

# === PARTE 1: CLAUDE-troubleshooting.md => Lessons ===
$file1 = Join-Path $RaizProyecto "CLAUDE-troubleshooting.md"
Write-Host "" ; Write-Host "--- CLAUDE-troubleshooting.md -> Lessons ---"
if (-not (Test-Path $file1)) {
    Write-Host "No encontrado: $file1" -ForegroundColor Yellow
} else {
    $content = [System.IO.File]::ReadAllText($file1)
    $errBlocks = [regex]::Matches($content, '(?ms)### (ERR-\d+)[^\n]*\n(.*?)(?=###|\z)')
    Write-Host "Bloques ERR-*: $($errBlocks.Count)"
    foreach ($block in $errBlocks) {
        $errId = $block.Groups[1].Value.Trim()
        $body  = $block.Groups[2].Value
        $titleM = [regex]::Match($block.Value, '### ERR-\d+\s+.(.+)')
        $causeM = [regex]::Match($body, '\*\*Causa[^:]*:\*\*\s*(.+?)(?=\n\*\*|\z)', 16)
        $solM   = [regex]::Match($body, '\*\*Soluci[^\*:]*:\*\*\s*(.+?)(?=\n\*\*|\z)', 16)
        $sympM  = [regex]::Match($body, '\*\*Sintoma[^:]*:\*\*\s*(.+?)(?=\n\*\*|\z)', 16)
        $title  = if ($titleM.Success) { $titleM.Groups[1].Value.Trim() } else { $errId }
        $rc     = if ($causeM.Success) { ($causeM.Groups[1].Value.Trim() -replace '\s+', ' ').Substring(0,[Math]::Min(500,($causeM.Groups[1].Value.Trim() -replace '\s+', ' ').Length)) } else { "" }
        $fix    = if ($solM.Success)   { ($solM.Groups[1].Value.Trim()   -replace '\s+', ' ').Substring(0,[Math]::Min(1000,($solM.Groups[1].Value.Trim() -replace '\s+', ' ').Length)) } else { "" }
        $desc   = if ($sympM.Success)  { ($sympM.Groups[1].Value.Trim()  -replace '\s+', ' ').Substring(0,[Math]::Min(1000,($sympM.Groups[1].Value.Trim() -replace '\s+', ' ').Length)) } else { $title.Substring(0,[Math]::Min(200,$title.Length)) }
        $title  = $title.Substring(0,[Math]::Min(200,$title.Length))
        $sql = "IF NOT EXISTS (SELECT 1 FROM Lessons WHERE Title = '" + (Escape-Sql $title) + "' AND LessonType = 'bugfix') "
        $sql += "INSERT INTO Lessons (LessonType, SourceAgent, Title, Description, RootCause, Fix, Severity, Scope, Stack, Tags) "
        $sql += "VALUES ('bugfix', 'MemorySyncAgent', '" + (Escape-Sql $title) + "', '" + (Escape-Sql $desc) + "', '" + (Escape-Sql $rc) + "', '" + (Escape-Sql $fix) + "', 'error', 'global', 'dotnet', 'seed," + $errId + "');"
        if (Run-Sql $sql) { $counts.lessons++; Write-Host "  OK $errId" -ForegroundColor Green }
        else { $counts.errors++ }
    }
}

# === PARTE 2: CLAUDE-patterns.md => Patterns ===
$file2 = Join-Path $RaizProyecto "CLAUDE-patterns.md"
Write-Host "" ; Write-Host "--- CLAUDE-patterns.md -> Patterns ---"
if (-not (Test-Path $file2)) {
    Write-Host "No encontrado: $file2" -ForegroundColor Yellow
} else {
    $content = [System.IO.File]::ReadAllText($file2)
    $patBlocks = [regex]::Matches($content, '(?ms)### (PATTERN-\d+)[^\n]*\n(.*?)(?=### PATTERN|\z)')
    Write-Host "Bloques PATTERN-*: $($patBlocks.Count)"
    $seq = 1
    foreach ($block in $patBlocks) {
        $patId  = $block.Groups[1].Value.Trim()
        $body   = $block.Groups[2].Value
        $titleM = [regex]::Match($block.Value, '### PATTERN-\d+\s+.(.+)')
        $whenM  = [regex]::Match($body, '\*\*Cuando[^:]*:\*\*\s*(.+?)(?=\n\*\*|\n```|\z)', 16)
        $codeM  = [regex]::Match($body, '```[a-z]*\r?\n(.*?)```', 16)
        $langM  = [regex]::Match($body, '```(csharp|javascript|typescript|sql|cs|js|ts)')
        $name   = if ($titleM.Success) { $titleM.Groups[1].Value.Trim().Substring(0,[Math]::Min(200,$titleM.Groups[1].Value.Trim().Length)) } else { $patId }
        $when   = if ($whenM.Success)  { ($whenM.Groups[1].Value.Trim() -replace '\s+', ' ').Substring(0,[Math]::Min(500,($whenM.Groups[1].Value.Trim() -replace '\s+', ' ').Length)) } else { "" }
        $code   = if ($codeM.Success)  { $codeM.Groups[1].Value.Trim() } else { "" }
        $lang   = if ($langM.Success)  { $langM.Groups[1].Value } else { "csharp" }
        $nextId = "PAT-" + ($seq).ToString().PadLeft(3,"0") ; $seq++
        $sql = "IF NOT EXISTS (SELECT 1 FROM Patterns WHERE Name = '" + (Escape-Sql $name) + "') "
        $sql += "INSERT INTO Patterns (PatternId, Name, Description, Language, CodeExample, WhenToUse, RelatedAgent) "
        $sql += "VALUES ('" + $nextId + "', '" + (Escape-Sql $name) + "', '" + (Escape-Sql $name) + "', '" + (Escape-Sql $lang) + "', '" + (Escape-Sql $code) + "', '" + (Escape-Sql $when) + "', 'MemorySyncAgent');"
        if (Run-Sql $sql) { $counts.patterns++; Write-Host "  OK $nextId ($patId)" -ForegroundColor Green }
        else { $counts.errors++ }
    }
}

# === PARTE 3: CLAUDE-decisions.md => Decisions ===
$file3 = Join-Path $RaizProyecto "CLAUDE-decisions.md"
Write-Host "" ; Write-Host "--- CLAUDE-decisions.md -> Decisions ---"
if (-not (Test-Path $file3)) {
    Write-Host "No encontrado: $file3" -ForegroundColor Yellow
} else {
    $content = [System.IO.File]::ReadAllText($file3)
    $adrBlocks = [regex]::Matches($content, '(?ms)### (ADR-\d+)[^\n]*\n(.*?)(?=### ADR|\z)')
    Write-Host "Bloques ADR-*: $($adrBlocks.Count)"
    foreach ($block in $adrBlocks) {
        $adrId  = $block.Groups[1].Value.Trim()
        $body   = $block.Groups[2].Value
        $titleM = [regex]::Match($block.Value, '### ADR-\d+\s+.(.+)')
        $ctxM   = [regex]::Match($body, '\*\*Contexto[^:]*:\*\*\s*(.+?)(?=\n\*\*|\z)', 16)
        $decM   = [regex]::Match($body, '\*\*Decision[^:]*:\*\*\s*(.+?)(?=\n\*\*|\z)', 16)
        $ratM   = [regex]::Match($body, '\*\*Justificaci[^:]*:\*\*\s*(.+?)(?=\n\*\*|\z)', 16)
        $consM  = [regex]::Match($body, '\*\*Consecuencias[^:]*:\*\*\s*(.+?)(?=\n\*\*|\z)', 16)
        $title  = if ($titleM.Success) { $titleM.Groups[1].Value.Trim().Substring(0,[Math]::Min(200,$titleM.Groups[1].Value.Trim().Length)) } else { $adrId }
        $ctx    = if ($ctxM.Success)   { ($ctxM.Groups[1].Value.Trim()  -replace '\s+', ' ').Substring(0,[Math]::Min(1000,($ctxM.Groups[1].Value.Trim()  -replace '\s+', ' ').Length)) } else { $title }
        $dec    = if ($decM.Success)   { ($decM.Groups[1].Value.Trim()  -replace '\s+', ' ').Substring(0,[Math]::Min(1000,($decM.Groups[1].Value.Trim()  -replace '\s+', ' ').Length)) } else { "" }
        $rat    = if ($ratM.Success)   { ($ratM.Groups[1].Value.Trim()  -replace '\s+', ' ').Substring(0,[Math]::Min(1000,($ratM.Groups[1].Value.Trim()  -replace '\s+', ' ').Length)) } else { "" }
        $cons   = if ($consM.Success)  { ($consM.Groups[1].Value.Trim() -replace '\s+', ' ').Substring(0,[Math]::Min(500, ($consM.Groups[1].Value.Trim() -replace '\s+', ' ').Length)) } else { "" }
        $sql = "IF NOT EXISTS (SELECT 1 FROM Decisions WHERE AdrId = '$adrId') "
        $sql += "INSERT INTO Decisions (AdrId, Title, Context, Decision, Rationale, Consequences, Status) "
        $sql += "VALUES ('$adrId', '" + (Escape-Sql $title) + "', '" + (Escape-Sql $ctx) + "', '" + (Escape-Sql $dec) + "', '" + (Escape-Sql $rat) + "', '" + (Escape-Sql $cons) + "', 'accepted');"
        if (Run-Sql $sql) { $counts.decisions++; Write-Host "  OK $adrId" -ForegroundColor Green }
        else { $counts.errors++ }
    }
}

Write-Host "" ; Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "  Lecciones : $($counts.lessons)"
Write-Host "  Patrones  : $($counts.patterns)"
Write-Host "  Decisions : $($counts.decisions)"
if ($counts.errors -gt 0) { Write-Host "  Errores   : $($counts.errors)" -ForegroundColor Red }
else { Write-Host "  Errores   : 0" -ForegroundColor Green }
Write-Host ""
if ($DryRun) { Write-Host "[DRY-RUN] Ejecuta sin -DryRun para insertar realmente." -ForegroundColor Yellow }
elseif ($counts.errors -eq 0) { Write-Host "Migracion exitosa. Verifica en SSMS: SELECT * FROM AgentBrain.dbo.Lessons" -ForegroundColor Green }