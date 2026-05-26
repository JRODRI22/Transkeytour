# ============================================================
# setup-housekeeping-scheduler.ps1
# Registra una tarea semanal en el Programador de tareas de Windows
# que ejecuta sp_Housekeeping en JarvisDB todos los domingos a las 3:00 AM.
#
# REQUISITOS:
#   - sqlcmd.exe en PATH (viene con SQL Server / ODBC Tools)
#   - Permisos para crear Scheduled Tasks (ejecutar como Administrador)
#
# USO:
#   PowerShell -ExecutionPolicy Bypass -File setup-housekeeping-scheduler.ps1
# ============================================================

$TaskName   = "JarvisDB-Housekeeping"
$SqlServer  = "JORGE_R\SQL"
$Database   = "JarvisDB"
$Schedule   = "03:00AM"
$DayOfWeek  = "Sunday"

# ---- Verificar sqlcmd disponible ----
if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    Write-Error "sqlcmd.exe no encontrado en PATH. Instala 'Microsoft Command Line Utilities for SQL Server'."
    exit 1
}

# ---- Eliminar tarea anterior si existe ----
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "[OK] Tarea anterior '$TaskName' eliminada."
}

# ---- Crear acción: llamar sqlcmd ----
$sqlcmdPath = (Get-Command sqlcmd).Source
$sqlArgs    = "-S `"$SqlServer`" -d $Database -E -C -Q `"EXEC dbo.sp_Housekeeping`" -b"

$action = New-ScheduledTaskAction `
    -Execute  $sqlcmdPath `
    -Argument $sqlArgs

# ---- Trigger: cada domingo a las 3 AM ----
$trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek $DayOfWeek `
    -At        $Schedule

# ---- Configurar para ejecutar con privilegios elevados ----
$principal = New-ScheduledTaskPrincipal `
    -UserId    "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel  Highest

# ---- Configuración adicional ----
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -MultipleInstances  IgnoreNew `
    -StartWhenAvailable

# ---- Registrar la tarea ----
Register-ScheduledTask `
    -TaskName  $TaskName `
    -Action    $action `
    -Trigger   $trigger `
    -Principal $principal `
    -Settings  $settings `
    -Description "Ejecuta sp_Housekeeping en JarvisDB para purgar datos obsoletos (runs >30 días, evolved skills expirados, eventos de telemetría >90 días)." `
    -Force | Out-Null

Write-Host ""
Write-Host "============================================="
Write-Host "[OK] Tarea '$TaskName' registrada exitosamente."
Write-Host "     Servidor : $SqlServer"
Write-Host "     Base     : $Database"
Write-Host "     Horario  : Cada $DayOfWeek a las $Schedule"
Write-Host "============================================="
Write-Host ""
Write-Host "Para ejecutar manualmente en cualquier momento:"
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
Write-Host "Para ver el último resultado:"
Write-Host "  Get-ScheduledTaskInfo -TaskName '$TaskName' | Select-Object LastTaskResult, LastRunTime, NextRunTime"
