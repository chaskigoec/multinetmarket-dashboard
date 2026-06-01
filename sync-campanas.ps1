# =============================================================
# sync-campanas.ps1 — Sincroniza Excel de resultados YCloud
#                     con el dashboard de MultinetMarket
# =============================================================
# USO:
#   .\sync-campanas.ps1                  → sincroniza una vez
#   .\sync-campanas.ps1 -Watch           → vigila la carpeta y sincroniza automático
#   .\sync-campanas.ps1 -Url https://... → usa URL de Vercel en producción
# =============================================================

param(
    [string]$Url = "https://multinetmarket-dashboard.vercel.app",
    [switch]$Watch,
    [switch]$InstalarTarea  # Registra una tarea en Windows Task Scheduler
)

# Carpeta donde YCloud guarda los resultados
# Usa $env:USERPROFILE para evitar problemas de encoding con caracteres especiales
$ResultadosFolder = Join-Path $env:USERPROFILE "OneDrive - ChaskiGo\Documentos - OPERACIONES CHASKI\PROYECTOS\2026\MULTINETMARKET\ETAPA\Resultados"

$UploadEndpoint = "$Url/api/campaigns/upload"
$LogFile = Join-Path $PSScriptRoot "sync-log.txt"

function Write-Log {
    param([string]$Msg, [string]$Color = "White")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Msg"
    Write-Host $line -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $line
}

function Sync-Campaign {
    param([string]$FilePath)

    $filename = Split-Path $FilePath -Leaf
    Write-Log "Sincronizando: $filename" "Cyan"

    try {
        # Leer archivo como bytes
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $boundary = "----MultinetBoundary$(Get-Random)"

        # Construir multipart/form-data manualmente
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$filename`"",
            "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "",
            ""
        )
        $bodyStart = [System.Text.Encoding]::UTF8.GetBytes(($bodyLines -join "`r`n"))
        $bodyEnd   = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")

        $body = New-Object byte[] ($bodyStart.Length + $bytes.Length + $bodyEnd.Length)
        [System.Buffer]::BlockCopy($bodyStart, 0, $body, 0, $bodyStart.Length)
        [System.Buffer]::BlockCopy($bytes, 0, $body, $bodyStart.Length, $bytes.Length)
        [System.Buffer]::BlockCopy($bodyEnd, 0, $body, $bodyStart.Length + $bytes.Length, $bodyEnd.Length)

        $response = Invoke-RestMethod `
            -Uri $UploadEndpoint `
            -Method POST `
            -Body $body `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -ErrorAction Stop

        if ($response.skipped) {
            Write-Log "  Ya existia: $($response.nombre)" "Yellow"
        } else {
            Write-Log "  Cargada OK: $($response.nombre) (id: $($response.id))" "Green"
        }
    }
    catch {
        Write-Log "  ERROR en $filename`: $_" "Red"
    }
}

function Sync-All {
    if (-not (Test-Path $ResultadosFolder)) {
        Write-Log "Carpeta no encontrada: $ResultadosFolder" "Red"
        return
    }

    $files = Get-ChildItem -Path $ResultadosFolder -Filter "*.xlsx" | Sort-Object LastWriteTime
    if ($files.Count -eq 0) {
        Write-Log "No se encontraron archivos .xlsx en la carpeta de resultados." "Yellow"
        return
    }

    Write-Log "Encontrados $($files.Count) archivo(s) Excel." "White"
    foreach ($f in $files) {
        Sync-Campaign -FilePath $f.FullName
    }
    Write-Log "Sincronizacion completada. Dashboard: $Url" "Green"
}

# --- MODO WATCH (vigilancia continua) ---
if ($Watch) {
    Write-Log "Modo WATCH activo. Vigilando: $ResultadosFolder" "Magenta"
    Write-Log "Presiona Ctrl+C para detener." "Gray"

    # Sincronizar archivos existentes primero
    Sync-All

    # Crear watcher de sistema de archivos
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $ResultadosFolder
    $watcher.Filter = "*.xlsx"
    $watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName, [System.IO.NotifyFilters]::LastWrite
    $watcher.EnableRaisingEvents = $true

    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $changeType = $Event.SourceEventArgs.ChangeType
        if ($changeType -eq "Created" -or $changeType -eq "Changed") {
            Start-Sleep -Seconds 2  # Esperar que el archivo termine de escribirse
            & $using:function:Sync-Campaign -FilePath $path
        }
    }

    Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
    Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null

    try {
        while ($true) { Start-Sleep -Seconds 5 }
    }
    finally {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
        Write-Log "Watch detenido." "Gray"
    }
}
else {
    # --- INSTALAR TAREA PROGRAMADA ---
    if ($InstalarTarea) {
        $scriptPath = $MyInvocation.MyCommand.Path
        $action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-NonInteractive -File `"$scriptPath`" -Url $Url"
        $trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 15) -Once -At (Get-Date)
        $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -RunOnlyIfNetworkAvailable
        Register-ScheduledTask -TaskName "MultinetMarket-Sync" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -Force | Out-Null
        Write-Log "Tarea programada instalada: se sincronizara cada 15 minutos." "Green"
        Write-Log "Para desinstalar: Unregister-ScheduledTask -TaskName 'MultinetMarket-Sync' -Confirm:`$false" "Gray"
        return
    }

    # --- MODO SINCRONIZACIÓN ÚNICA ---
    Write-Log "=== Sincronizacion MultinetMarket → $Url ===" "Magenta"
    Sync-All
}
