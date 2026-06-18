import * as XLSX from 'xlsx'

export interface CampaignRow {
  id: string
  destino: string
  parametros: string
  estatus: string
  leido: string
  fechaEnvio: string
  fechaEntregaCanal: string
  fechaEntregaUsuario: string
  fechaLectura: string
  respuesta: string
  fechaRespuesta: string
  plantilla: string
  comentario: string
  origen: string
  campanaNombre: string
}

export interface CampaignMetrics {
  total: number
  enviadosCanal: number
  entregados: number
  leidos: number
  fallidos: number
  respuestas: number
  enviadosCanalPct: number
  entregadosPct: number
  leidosPct: number
  fallidosPct: number
  respuestasPct: number
  fallidosPorError: { tipo: string; cantidad: number }[]
  novedadesDiarias: { fecha: string; entregados: number }[]
}

export type TableFilter =
  | { type: 'donut'; key: 'usuario' | 'fallidos' }
  | { type: 'error'; tipo: string }

export interface ParsedCampaign {
  id: string
  nombre: string
  filename: string
  fechaCampana: string           // fecha real del envío (del Excel)
  fechaCarga: string             // fecha de lectura del archivo
  fechaUltimaActualizacion?: string  // fecha más reciente entre todos los eventos del Excel
  rows: CampaignRow[]
  metrics: CampaignMetrics
}

const STATUS_MAP: Record<string, string> = {
  DELIVERED_CHANNEL: 'Entregado por WhatsApp',
  DELIVERED_USER:    'Entregado al usuario',
  DELIVERED:         'Entregado',
  SENT:              'Enviado',
  READ:              'Leído',
  FAILED:            'Fallido',
  UNDELIVERABLE:     'No entregable',
  REJECTED:          'Rechazado',
  PENDING:           'Pendiente',
}

export function normalizeStatus(raw: string): string {
  return STATUS_MAP[raw?.toUpperCase()] ?? raw ?? 'Desconocido'
}

function isDeliveredChannel(estatus: string): boolean {
  return estatus?.toUpperCase() === 'DELIVERED_CHANNEL'
}

export function isDeliveredUser(estatus: string): boolean {
  return ['DELIVERED_USER', 'READ'].includes(estatus?.toUpperCase())
}

function isRead(estatus: string, leido: string): boolean {
  return estatus?.toUpperCase() === 'READ' || leido?.toLowerCase() === 'si'
}

export function isFailed(estatus: string): boolean {
  return ['FAILED', 'UNDELIVERABLE', 'REJECTED'].includes(estatus?.toUpperCase())
}

export function classifyError(comentario: string, estatus: string): string {
  const raw = comentario ?? ''
  const c   = raw.toLowerCase()
  const e   = (estatus ?? '').toLowerCase()

  // Clasificación por código de error (mismos nombres que getErrorDetail en CampaignTable)
  const codeMatch = raw.match(/\[?(\d{4,6})\]?/)
  if (codeMatch) {
    const code = codeMatch[1]
    const CODE_LABELS: Record<string, string> = {
      '130429': 'Límite de velocidad API',
      '130472': 'Experimento de Meta',
      '130497': 'Cuenta restringida por país',
      '131000': 'Error desconocido',
      '131005': 'Acceso denegado',
      '131008': 'Parámetro faltante',
      '131009': 'Parámetro inválido',
      '131016': 'Servicio no disponible',
      '131021': 'Remitente = destinatario',
      '131026': 'Mensaje no entregable',
      '131031': 'Cuenta bloqueada',
      '131042': 'Problema de pago',
      '131047': 'Ventana 24 h cerrada',
      '131048': 'Spam detectado',
      '131049': 'Baja interacción',
      '131051': 'Tipo no soportado',
      '131052': 'Error descarga multimedia',
      '131053': 'Error subida multimedia',
      '131056': 'Demasiados mensajes',
      '131057': 'Cuenta en mantenimiento',
      '132000': 'Parámetros de plantilla incorrectos',
      '132001': 'Plantilla no aprobada',
      '132005': 'Plantilla demasiado larga',
      '132007': 'Contenido viola políticas',
      '132012': 'Formato de parámetro incorrecto',
      '132015': 'Plantilla pausada',
      '132016': 'Plantilla deshabilitada',
      '133004': 'Servidor no disponible',
      '133010': 'Número no registrado',
      '135000': 'Error genérico de parámetros',
    }
    if (CODE_LABELS[code]) return CODE_LABELS[code]
  }

  // Fallbacks por palabras clave
  if (c.includes('ecosystem') || c.includes('engagement') ||
      c.includes('interaccion') || c.includes('interacción') ||
      c.includes('low interaction'))                              return 'Baja interacción'
  if (c.includes('spam') || c.includes('rate limit'))            return 'Spam detectado'
  if (c.includes('24 hour') || c.includes('24-hour'))            return 'Ventana 24 h cerrada'
  if (c.includes('limite') || c.includes('límite') ||
      c.includes('limit'))                                        return 'Límite excedido'
  if (c.includes('no entregable') || c.includes('undeliverable') ||
      e.includes('undeliverable'))                                return 'Mensaje no entregable'
  if (c.includes('rejected') || c.includes('rechazado'))         return 'Rechazado'
  if (c.includes('opted out') || c.includes('opt-out'))          return 'Bloqueado por usuario'
  return 'Fallo general'
}

export function parseExcel(buffer: ArrayBuffer, filename: string): ParsedCampaign {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

  const pad = (n: number) => String(n).padStart(2, '0')
  const str = (v: unknown): string => {
    if (v == null) return ''
    if (v instanceof Date)
      return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())} ${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`
    return String(v)
  }

  const rows: CampaignRow[] = raw.map((r, i) => ({
    id: String(i),
    destino:             str(r['Destino']                     ?? r['destino']        ?? r['phone']),
    parametros:          str(r['Parámetros']                  ?? r['Parametros']     ?? r['nombre_corto']),
    estatus:             str(r['Estatus']                     ?? r['estatus']        ?? r['Status']),
    leido:               str(r['Leido']                       ?? r['Leído']),
    fechaEnvio:          str(r['Fecha de envio']              ?? r['Fecha de envío']),
    fechaEntregaCanal:   str(r['Fecha de entrega al canal']),
    fechaEntregaUsuario: str(r['Fecha de entrega al usuario']),
    fechaLectura:        str(r['Fecha de lectura por usuario']),
    respuesta:           str(r['Respuesta']),
    fechaRespuesta:      str(r['Fecha Respuesta']),
    plantilla:           str(r['Plantilla']                   ?? r['plantilla']),
    comentario:          str(r['Comentario']),
    origen:              str(r['Origen']),
    campanaNombre:       str(r['Campaña']                     ?? r['campaign_name'] ?? filename.replace(/\.xlsx?$/i, '')),
  }))

  const total = rows.length

  // Entregados por WhatsApp (canal): DELIVERED_CHANNEL + DELIVERED_USER + READ
  const enviadosCanalCount = rows.filter(r =>
    isDeliveredChannel(r.estatus) || isDeliveredUser(r.estatus)
  ).length

  // Entregados al usuario: DELIVERED_USER + READ
  const entregadosCount = rows.filter(r => isDeliveredUser(r.estatus)).length

  const leidosCount    = rows.filter(r => isRead(r.estatus, r.leido)).length
  const fallidosCount  = rows.filter(r => isFailed(r.estatus)).length
  const respuestasCount = rows.filter(r => r.respuesta && r.respuesta.trim() !== '').length

  const errorMap: Record<string, number> = {}
  rows.filter(r => isFailed(r.estatus)).forEach(r => {
    const tipo = classifyError(r.comentario, r.estatus)
    errorMap[tipo] = (errorMap[tipo] ?? 0) + 1
  })
  const fallidosPorError = Object.entries(errorMap)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)

  // Novedades diarias: todos los que llegaron al canal o al usuario
  const dailyMap: Record<string, number> = {}
  rows
    .filter(r => isDeliveredChannel(r.estatus) || isDeliveredUser(r.estatus))
    .forEach(r => {
      const fecha = r.fechaEnvio.split(' ')[0]
      if (fecha) dailyMap[fecha] = (dailyMap[fecha] ?? 0) + 1
    })
  const novedadesDiarias = Object.entries(dailyMap)
    .map(([fecha, entregados]) => ({ fecha, entregados }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0

  // Fecha real de la campaña: el datetime más temprano de fechaEnvio (conserva hora)
  const fechas = rows.map(r => r.fechaEnvio).filter(Boolean).sort()
  const fechaCampana = fechas[0] ?? new Date().toISOString().replace('T', ' ').slice(0, 19)

  // Fecha de última actualización: el evento más reciente registrado en el Excel
  const allEventDates = rows.flatMap(r => [
    r.fechaRespuesta,
    r.fechaLectura,
    r.fechaEntregaUsuario,
    r.fechaEntregaCanal,
  ]).filter(Boolean).sort()
  const fechaUltimaActualizacion = allEventDates.at(-1)

  const campanaNombre = rows[0]?.campanaNombre || filename.replace(/\.xlsx?$/i, '')

  return {
    id: crypto.randomUUID(),
    nombre: campanaNombre,
    filename,
    fechaCampana,
    fechaCarga: new Date().toISOString(),
    fechaUltimaActualizacion,
    rows,
    metrics: {
      total,
      enviadosCanal:     enviadosCanalCount,
      entregados:        entregadosCount,
      leidos:            leidosCount,
      fallidos:          fallidosCount,
      respuestas:        respuestasCount,
      enviadosCanalPct:  pct(enviadosCanalCount),
      entregadosPct:     pct(entregadosCount),
      leidosPct:         pct(leidosCount),
      fallidosPct:       pct(fallidosCount),
      respuestasPct:     pct(respuestasCount),
      fallidosPorError,
      novedadesDiarias,
    },
  }
}
