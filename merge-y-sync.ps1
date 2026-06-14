# ==============================================================
# merge-y-sync.ps1
# Une el Excel de Datum (envíos) con el CSV de respuestas,
# elimina la versión anterior de Vercel y sube la nueva.
# ==============================================================
# USO:
#   .\merge-y-sync.ps1
#   .\merge-y-sync.ps1 -Url http://localhost:3000     (local)
#   .\merge-y-sync.ps1 -ProcesarFolder "C:\otra\ruta"
# ==============================================================

param(
    [string]$ProcesarFolder  = (Join-Path $env:USERPROFILE "OneDrive - ChaskiGo\Documentos - OPERACIONES CHASKI\PROYECTOS\2026\MULTINETMARKET\ETAPA\Procesar"),
    [string]$ResultadosFolder = (Join-Path $env:USERPROFILE "OneDrive - ChaskiGo\Documentos - OPERACIONES CHASKI\PROYECTOS\2026\MULTINETMARKET\ETAPA\Resultados"),
    [string]$Url              = "https://multinetmarket-dashboard.vercel.app"
)

$LogFile        = Join-Path $PSScriptRoot "sync-log.txt"
$MergeScript    = Join-Path $PSScriptRoot "merge-campana.cjs"
$DeleteScript   = Join-Path $PSScriptRoot "delete-by-name.mjs"
$UploadEndpoint = "$Url/api/campaigns/upload"

function Write-Log {
    param([string]$Msg, [string]$Color = "White")
    $ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Msg"
    Write-Host $line -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $line
}

# ── 1. Validar carpetas ───────────────────────────────────────
Write-Log "=== Merge y Sync MultinetMarket → $Url ===" "Magenta"

if (-not (Test-Path $ProcesarFolder)) {
    Write-Log "Carpeta Procesar no encontrada: $ProcesarFolder" "Red"
    exit 1
}
if (-not (Test-Path $ResultadosFolder)) {
    Write-Log "Carpeta Resultados no encontrada: $ResultadosFolder" "Red"
    exit 1
}

# ── 2. Encontrar archivos en Procesar ─────────────────────────
$xlsxFiles = Get-ChildItem -Path $ProcesarFolder -Filter "*.xlsx" | Sort-Object LastWriteTime -Descending
$csvFiles  = Get-ChildItem -Path $ProcesarFolder -Filter "*.csv"  | Sort-Object LastWriteTime -Descending

if ($xlsxFiles.Count -eq 0) {
    Write-Log "No se encontró ningún .xlsx en: $ProcesarFolder" "Red"
    Write-Log "  → Descarga el reporte de Datum y colócalo en esa carpeta." "Yellow"
    exit 1
}
if ($csvFiles.Count -eq 0) {
    Write-Log "No se encontró ningún .csv en: $ProcesarFolder" "Red"
    Write-Log "  → Descarga el export de respuestas de Datum y colócalo en esa carpeta." "Yellow"
    exit 1
}

$xlsxFile = $xlsxFiles[0].FullName
$csvFile  = $csvFiles[0].FullName

Write-Log "Base (xlsx):      $($xlsxFiles[0].Name)" "Cyan"
Write-Log "Respuestas (csv): $($csvFiles[0].Name)"  "Cyan"

if ($xlsxFiles.Count -gt 1) {
    Write-Log "  ⚠ Hay $($xlsxFiles.Count) xlsx en Procesar; se usó el más reciente." "Yellow"
}
if ($csvFiles.Count -gt 1) {
    Write-Log "  ⚠ Hay $($csvFiles.Count) csv en Procesar; se usó el más reciente." "Yellow"
}

# ── 3. Merge ──────────────────────────────────────────────────
Write-Log "Ejecutando merge..." "Cyan"

$rawResult = node $MergeScript --xlsx $xlsxFile --csv $csvFile --output $ResultadosFolder 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Log "Error en el merge:" "Red"
    $rawResult | ForEach-Object { Write-Log "  $_" "Red" }
    exit 1
}

try {
    $result = $rawResult | ConvertFrom-Json
} catch {
    Write-Log "No se pudo parsear el resultado del merge: $rawResult" "Red"
    exit 1
}

$outputPath     = $result.outputPath
$campanaNombre  = $result.campanaNombre
$filename       = $result.filename

Write-Log "Merge OK: $campanaNombre" "Green"
Write-Log "  Filas totales:     $($result.total)" "White"
Write-Log "  Con respuesta:     $($result.conRespuesta)" "White"
Write-Log "  Respuestas en CSV: $($result.respuestasCSV)" "White"
Write-Log "  Archivo generado:  $outputPath" "White"

# ── 4. Eliminar versión anterior de Redis ─────────────────────
Write-Log "Verificando versión anterior en Redis..." "Cyan"
$deleteResult = node $DeleteScript $filename 2>&1

if ($deleteResult -eq "eliminada") {
    Write-Log "  Versión anterior eliminada de Redis: $filename" "Yellow"
} elseif ($deleteResult -eq "no-existe") {
    Write-Log "  No existía en Redis (primera subida): $filename" "White"
} else {
    Write-Log "  Respuesta Redis: $deleteResult" "Gray"
}

# ── 5. Subir a Vercel ─────────────────────────────────────────
Write-Log "Subiendo a Vercel: $filename" "Cyan"

try {
    $bytes    = [System.IO.File]::ReadAllBytes($outputPath)
    $boundary = "----MultinetBoundary$(Get-Random)"

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
    [System.Buffer]::BlockCopy($bodyStart, 0, $body, 0,                   $bodyStart.Length)
    [System.Buffer]::BlockCopy($bytes,     0, $body, $bodyStart.Length,   $bytes.Length)
    [System.Buffer]::BlockCopy($bodyEnd,   0, $body, $bodyStart.Length + $bytes.Length, $bodyEnd.Length)

    $response = Invoke-RestMethod `
        -Uri         $UploadEndpoint `
        -Method      POST `
        -Body        $body `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -ErrorAction Stop

    if ($response.skipped) {
        Write-Log "  Ya existía en Vercel: $($response.nombre)" "Yellow"
    } else {
        Write-Log "  Subida OK: $($response.nombre) (id: $($response.id))" "Green"
    }
}
catch {
    Write-Log "  Error al subir a Vercel: $_" "Red"
    exit 1
}

# ── 6. Resumen final ──────────────────────────────────────────
Write-Log "=== Completado. Dashboard: $Url ===" "Green"
Write-Log "" "White"
Write-Log "Próximos pasos cuando haya nuevas respuestas:" "Gray"
Write-Log "  1. Descarga el CSV actualizado de Datum y reemplázalo en: $ProcesarFolder" "Gray"
Write-Log "  2. Si el reporte base cambió, reemplaza el .xlsx también." "Gray"
Write-Log "  3. Vuelve a ejecutar: .\merge-y-sync.ps1" "Gray"
