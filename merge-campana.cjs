/**
 * merge-campana.cjs
 * Une el Excel base de Datum (envíos) con el CSV de respuestas de Datum.
 * Uso: node merge-campana.cjs --xlsx <ruta> --csv <ruta> --output <carpeta>
 */
const XLSX = require('./node_modules/xlsx')
const fs   = require('fs')
const path = require('path')

// ── Argumentos ──────────────────────────────────────────────
const args   = process.argv.slice(2)
const getArg = (name) => { const i = args.indexOf('--' + name); return i !== -1 ? args[i + 1] : null }

const xlsxPath     = getArg('xlsx')
const csvPath      = getArg('csv')
const outputFolder = getArg('output')

if (!xlsxPath || !csvPath || !outputFolder) {
  console.error('Uso: node merge-campana.cjs --xlsx <ruta> --csv <ruta> --output <carpeta>')
  process.exit(1)
}

// ── Parser CSV robusto (maneja comillas y comas dentro de campos) ─
function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []

  function splitLine(line) {
    const cols = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cols.push(cur.trim())
    return cols
  }

  const headers = splitLine(lines[0])
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = splitLine(line)
    const row = {}
    headers.forEach((h, i) => row[h] = vals[i] ?? '')
    return row
  })
}

// ── Normalizar número de teléfono ────────────────────────────
// El CSV de Datum guarda el contacto en notación científica (5.93998501269e+11 → 593998501269)
function normalizePhone(raw) {
  if (!raw) return ''
  const num = parseFloat(raw)
  if (!isNaN(num) && num > 1e9) return Math.round(num).toString()
  return String(raw).replace(/\D/g, '')
}

// ── Leer CSV y construir mapa teléfono → respuesta ───────────
const csvRows    = parseCSV(fs.readFileSync(csvPath, 'utf-8'))

// Si el CSV tiene campo 'accion', deriva la etiqueta legible; si no, usa 'respuesta' tal cual
function accionLabel(row) {
  const accion = (row['accion'] || '').trim().toLowerCase()
  if (accion === 'agente') return 'Clic Agente'
  if (accion === 'url')    return 'Clic Formulario'
  return row['respuesta'] || ''
}

// Acumular respuestas únicas por contacto; conservar la fecha más reciente
const rawMap = {}
for (const r of csvRows) {
  const phone = normalizePhone(r['contacto'])
  if (!phone) continue
  const respuesta      = accionLabel(r)
  const fechaRespuesta = r['responded']  || ''
  if (!rawMap[phone]) rawMap[phone] = { responses: new Set(), latestDate: '' }
  if (respuesta) rawMap[phone].responses.add(respuesta)
  if (fechaRespuesta > rawMap[phone].latestDate) rawMap[phone].latestDate = fechaRespuesta
}

// Unir respuestas distintas con " · " (ej: "Clic Formulario · Hola, qué gusto")
const responseMap = {}
for (const [phone, data] of Object.entries(rawMap)) {
  const parts = [...data.responses]
  if (parts.length > 0) {
    responseMap[phone] = {
      respuesta:      parts.join(' · '),
      fechaRespuesta: data.latestDate,
    }
  }
}

// ── Leer Excel base (Datum envíos) ───────────────────────────
const wb   = XLSX.readFile(xlsxPath, { cellDates: true })
const ws   = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

if (rows.length === 0) {
  console.error('El Excel base no tiene filas.')
  process.exit(1)
}

// ── Orden de columnas del archivo final ───────────────────────
const COLS = [
  'Id del mensaje',
  'Destino',
  'Parámetros',
  'Estatus',
  'Leido',
  'Fecha de envio',
  'Fecha de entrega al canal',
  'Fecha de entrega al usuario',
  'Fecha de lectura por usuario',
  'Fecha Respuesta',
  'Respuesta',
  'Plantilla',
  'Comentario',
  'Origen',
  'Operador',
  'Campaña',
  'Bot',
  'Team',
  'Enviado por',
]

// Helper: Date → string "YYYY-MM-DD HH:MM:SS"
function fmtDate(v) {
  if (!(v instanceof Date) || isNaN(v.getTime())) return String(v ?? '')
  const p = n => String(n).padStart(2, '0')
  return `${v.getFullYear()}-${p(v.getMonth()+1)}-${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`
}

// ── Merge ─────────────────────────────────────────────────────
let conRespuesta = 0

const merged = rows.map(r => {
  const phone = normalizePhone(String(r['Destino'] ?? ''))
  const resp  = responseMap[phone]
  if (resp?.respuesta || String(r['Respuesta'] ?? '').trim()) conRespuesta++

  const out = {}
  for (const col of COLS) {
    if (col === 'Respuesta') {
      const fromXlsx = String(r['Respuesta'] ?? '').trim()
      const fromCsv  = resp?.respuesta ?? ''
      // Si ambas fuentes tienen texto distinto, combinar con " · "
      if (fromXlsx && fromCsv && fromXlsx !== fromCsv) {
        out[col] = fromCsv + ' · ' + fromXlsx
      } else {
        out[col] = fromCsv || fromXlsx
      }
    } else if (col === 'Fecha Respuesta') {
      out[col] = resp?.fechaRespuesta || r['Fecha Respuesta'] || ''
    } else {
      const v = r[col]
      out[col] = v instanceof Date ? fmtDate(v) : (v ?? '')
    }
  }
  return out
})

// ── Nombre de salida desde el campo Campaña ───────────────────
const campanaNombre = String(rows[0]?.['Campaña'] || `merge_${Date.now()}`)
const outputPath    = path.join(outputFolder, campanaNombre + '.xlsx')

// ── Escribir Excel resultado ──────────────────────────────────
const newWs = XLSX.utils.json_to_sheet(merged, { header: COLS })
const newWb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(newWb, newWs, 'Data')
XLSX.writeFile(newWb, outputPath)

// Resultado para que lo lea el PS1
console.log(JSON.stringify({
  ok:             true,
  outputPath,
  campanaNombre,
  filename:       campanaNombre + '.xlsx',
  total:          merged.length,
  conRespuesta,
  respuestasCSV:  Object.keys(responseMap).length,
}))
