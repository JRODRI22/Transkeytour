# setup-backup-scheduler.ps1
# Configura backup diario comprimido de JarvisDB y otras DBs de proyectos
# SQL Server 2022 — JORGE_R\SQL (Full-Text + Semantic) — soporta BACKUP WITH COMPRESSION
# Ejecutar como Administrador una sola vez

param(
    [string]$BackupFolder  = "C:\SQLBackups",
    [string]$SqlServer     = "JORGE_R\SQL",
    [int]   $RetentionDays = 14,
    [string]$Hour          = "02:00"   # Hora del backup diario (formato HH:mm)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Bases de datos a respaldar ───────────────────────────────────────────────
$Databases = @(
    "JarvisDB"
    # Agrega aquí las DBs de tus proyectos, por ejemplo:
    # "CharlotteFashionDB"
    # "ContabilidadADI"
    # "Chimbox"
)

# ─── Crear carpeta de backups ─────────────────────────────────────────────────
if (-not (Test-Path $BackupFolder)) {
    New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
    Write-Host "✅ Carpeta creada: $BackupFolder"
}

# ─── Escribir script PowerShell del job de backup ────────────────────────────
$JobScriptPath = Join-Path $BackupFolder "run-backup.ps1"

$DbListPS = ($Databases | ForEach-Object { "`"$_`"" }) -join ", "

@"
# run-backup.ps1 — Ejecutado diariamente por el Programador de Tareas
Set-StrictMode -Version Latest
`$ErrorActionPreference = "Continue"

`$SqlServer     = "$SqlServer"
`$BackupFolder  = "$BackupFolder"
`$RetentionDays = $RetentionDays
`$Databases     = @($DbListPS)
`$Timestamp     = (Get-Date -Format "yyyyMMdd_HHmm")
`$LogFile       = Join-Path `$BackupFolder "backup_`$Timestamp.log"

function Write-Log([string]`$Msg) {
    `$line = "[`$(Get-Date -Format 'HH:mm:ss')] `$Msg"
    Write-Host `$line
    Add-Content -Path `$LogFile -Value `$line
}

Write-Log "=== Backup iniciado (`$Timestamp) ==="

foreach (`$db in `$Databases) {
    `$file = Join-Path `$BackupFolder "`${db}_`$Timestamp.bak"
    `$sql  = @"
BACKUP DATABASE [`$db]
TO  DISK = N'`$file'
WITH FORMAT, COMPRESSION, CHECKSUM,
     NAME = N'`$db — `$Timestamp',
     STATS = 10;
"@
    Write-Log "Respaldando `$db → `$file"
    try {
        Invoke-Sqlcmd -ServerInstance `$SqlServer -Query `$sql -QueryTimeout 3600 -TrustServerCertificate
        Write-Log "✅ `$db OK"
    } catch {
        Write-Log "❌ ERROR en `$db: `$(`$_.Exception.Message)"
    }
}

# ── Purgar backups antiguos ───────────────────────────────────────────────────
`$CutOff = (Get-Date).AddDays(-`$RetentionDays)
`$old    = Get-ChildItem -Path `$BackupFolder -Filter "*.bak" |
           Where-Object { `$_.LastWriteTime -lt `$CutOff }
foreach (`$f in `$old) {
    Remove-Item `$f.FullName -Force
    Write-Log "🗑 Eliminado: `$(`$f.Name)"
}

# ── Purgar logs de más de 30 días ─────────────────────────────────────────────
`$oldLogs = Get-ChildItem -Path `$BackupFolder -Filter "backup_*.log" |
            Where-Object { `$_.LastWriteTime -lt (Get-Date).AddDays(-30) }
foreach (`$l in `$oldLogs) { Remove-Item `$l.FullName -Force }

Write-Log "=== Backup finalizado ==="
"@ | Set-Content -Path $JobScriptPath -Encoding UTF8

Write-Host "✅ Script de backup escrito en: $JobScriptPath"

# ─── Verificar que SqlServer PSModule esté disponible ────────────────────────
if (-not (Get-Module -ListAvailable -Name SqlServer)) {
    Write-Host "⚠️  Módulo SqlServer no encontrado. Instalando..."
    Install-Module -Name SqlServer -AllowClobber -Scope AllUsers -Force
}

# ─── Registrar tarea en Programador de Tareas ─────────────────────────────────
$TaskName   = "JarvisDB-DailyBackup"
$TriggerAt  = [datetime]::Parse($Hour)
$Action     = New-ScheduledTaskAction `
                  -Execute  "powershell.exe" `
                  -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$JobScriptPath`""
$Trigger    = New-ScheduledTaskTrigger -Daily -At $TriggerAt
$Settings   = New-ScheduledTaskSettingsSet `
                  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
                  -StartWhenAvailable `
                  -RunOnlyIfNetworkAvailable:$false
$Principal  = New-ScheduledTaskPrincipal `
                  -UserId "SYSTEM" `
                  -LogonType ServiceAccount `
                  -RunLevel Highest

# Si ya existe, reemplazar
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName  $TaskName `
    -Action    $Action `
    -Trigger   $Trigger `
    -Settings  $Settings `
    -Principal $Principal `
    -Force | Out-Null

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗"
Write-Host "║  ✅  Backup diario configurado                              ║"
Write-Host "╠══════════════════════════════════════════════════════════════╣"
Write-Host "║  Servidor   : $SqlServer"
Write-Host "║  Bases de datos: $($Databases -join ', ')"
Write-Host "║  Carpeta    : $BackupFolder"
Write-Host "║  Hora       : $Hour diariamente"
Write-Host "║  Retención  : $RetentionDays días"
Write-Host "║  Tarea      : $TaskName (Programador de Tareas)"
Write-Host "╠══════════════════════════════════════════════════════════════╣"
Write-Host "║  Para agregar DBs: edita `$Databases en este script y"
Write-Host "║  vuelve a ejecutarlo."
Write-Host "║  Para ejecutar ahora: Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "╚══════════════════════════════════════════════════════════════╝"
