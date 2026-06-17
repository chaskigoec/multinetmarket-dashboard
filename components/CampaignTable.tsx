'use client'

import { useEffect, useState } from 'react'
import { CampaignRow, TableFilter, isFailed, isDeliveredUser, classifyError, normalizeStatus } from '@/lib/excel'

function EcuadorFlag() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://flagcdn.com/w40/ec.png"
      alt="Ecuador"
      width={24}
      height={16}
      className="shrink-0 rounded-sm"
      style={{ boxShadow: "0 0 0 0.5px #cbd5e1", objectFit: "cover" }}
    />
  )
}

function formatDestino(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('593') && digits.length >= 12) {
    const local = '0' + digits.slice(3)
    return local.replace(/^(0\d{2})(\d{3})(\d{4})$/, '$1 $2 $3')
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return digits.replace(/^(0\d{2})(\d{3})(\d{4})$/, '$1 $2 $3')
  }
  return raw
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatFecha(raw: string): string {
  if (!raw || raw === '-') return '—'
  const dt = new Date(raw.replace(' ', 'T'))
  if (!isNaN(dt.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(raw.trim())) {
    const d = dt.getDate()
    const m = MESES[dt.getMonth()]
    const y = dt.getFullYear()
    const h = String(dt.getHours()).padStart(2, '0')
    const min = String(dt.getMinutes()).padStart(2, '0')
    return `${d} ${m} ${y}, ${h}:${min}`
  }
  return raw
}

function formatRespuesta(raw: string): string {
  return formatFecha(raw)
}

function traducirComentario(comentario: string): string {
  if (!comentario || comentario === '-') return '—'
  const c = comentario.toLowerCase()
  if (c.includes('ecosystem') || c.includes('engagement') || c.includes('healthy'))
    return 'Número con baja interacción en WhatsApp'
  if (c.includes('limit') || c.includes('limite'))
    return 'Límite de mensajes excedido'
  if (c.includes('undeliverable') || c.includes('no entregable'))
    return 'Número no disponible o inválido'
  if (c.includes('rejected') || c.includes('rechazado'))
    return 'Mensaje rechazado por WhatsApp'
  if (c.includes('opted out') || c.includes('opt-out'))
    return 'Usuario bloqueó los mensajes'
  return comentario
}

type ErrorDetail = { traduccion: string; explicacion: string }

function getErrorDetail(comentario: string): ErrorDetail | null {
  if (!comentario || comentario === '-') return null

  const codeMatch = comentario.match(/\[?(\d{4,6})\]?/)
  const code = codeMatch?.[1]

  const MAP: Record<string, ErrorDetail> = {
    '130429': {
      traduccion: 'Límite de velocidad de la API alcanzado',
      explicacion: 'Se superó el límite de mensajes por segundo permitido por la API de WhatsApp. El sistema intentó enviar demasiados mensajes en simultáneo.',
    },
    '130472': {
      traduccion: 'El número hace parte de un experimento de Meta',
      explicacion: 'Meta bloqueó este mensaje como parte de una prueba interna. Afecta a ~1% de usuarios que no han tenido interacción reciente con cuentas de negocio.',
    },
    '130497': {
      traduccion: 'Cuenta de negocio restringida por país',
      explicacion: 'La cuenta de WhatsApp Business está bloqueada para enviar mensajes a usuarios en determinados países, generalmente por promover productos regulados.',
    },
    '131000': {
      traduccion: 'Error desconocido al enviar el mensaje',
      explicacion: 'Ocurrió un error inesperado. Espera 10 minutos e intenta nuevamente. Si el problema persiste, contacta al soporte técnico.',
    },
    '131005': {
      traduccion: 'Acceso denegado — permisos insuficientes',
      explicacion: 'Los permisos necesarios para enviar el mensaje no han sido otorgados o han sido removidos de la cuenta.',
    },
    '131008': {
      traduccion: 'Falta un parámetro requerido en la solicitud',
      explicacion: 'La solicitud enviada a WhatsApp no incluye todos los campos obligatorios. Revisar la configuración del envío.',
    },
    '131009': {
      traduccion: 'Valor de parámetro no válido',
      explicacion: 'Uno o más valores de los parámetros son inválidos, o el número de teléfono no pertenece a la cuenta de WhatsApp Business configurada.',
    },
    '131016': {
      traduccion: 'Servicio de WhatsApp temporalmente no disponible',
      explicacion: 'WhatsApp está temporalmente fuera de servicio por mantenimiento o sobrecarga de servidores. Reintenta en unos minutos.',
    },
    '131021': {
      traduccion: 'El destinatario no puede ser el mismo que el remitente',
      explicacion: 'No es posible enviar un mensaje al mismo número de teléfono que realiza el envío.',
    },
    '131026': {
      traduccion: 'Mensaje no entregable',
      explicacion: 'No se pudo entregar el mensaje. El destinatario puede no tener WhatsApp instalado, usar una versión muy antigua, o no haber aceptado los términos de servicio de WhatsApp.',
    },
    '131031': {
      traduccion: 'Cuenta bloqueada por violación de políticas',
      explicacion: 'La cuenta de WhatsApp Business fue restringida o deshabilitada por incumplir las políticas de la plataforma de Meta.',
    },
    '131042': {
      traduccion: 'Problema con el método de pago de la cuenta',
      explicacion: 'Hay un error relacionado con el pago: puede faltar una cuenta de pago, se superó el límite de crédito, o hay un problema con la configuración de moneda o zona horaria.',
    },
    '131047': {
      traduccion: 'Ventana de conversación de 24 horas cerrada',
      explicacion: 'Pasaron más de 24 horas desde la última respuesta del destinatario. Para retomar la conversación, es obligatorio usar una plantilla de mensaje aprobada por Meta.',
    },
    '131048': {
      traduccion: 'Límite de mensajes no deseados alcanzado',
      explicacion: 'La calificación de calidad del número bajó porque usuarios reportaron o bloquearon los mensajes. WhatsApp restringe temporalmente los envíos para proteger la reputación.',
    },
    '131049': {
      traduccion: 'Meta decidió no entregar este mensaje',
      explicacion: 'El destinatario recibió demasiados mensajes de marketing en un período corto. Meta limita automáticamente la entrega para mantener una experiencia de interacción saludable y proteger al usuario.',
    },
    '131051': {
      traduccion: 'Tipo de mensaje no soportado',
      explicacion: 'Se intentó enviar un formato de mensaje que la API de WhatsApp no reconoce o no soporta actualmente.',
    },
    '131052': {
      traduccion: 'Error al descargar el archivo multimedia',
      explicacion: 'No se pudo acceder al archivo multimedia enviado por el usuario. El archivo puede estar corrupto, inaccesible o hubo problemas de red.',
    },
    '131053': {
      traduccion: 'Error al subir el archivo multimedia',
      explicacion: 'No se pudo cargar el archivo multimedia del mensaje. Puede ser un formato no soportado, archivo demasiado grande o archivo corrupto.',
    },
    '131056': {
      traduccion: 'Demasiados mensajes al mismo destinatario',
      explicacion: 'Se enviaron demasiados mensajes al mismo número en un período corto. WhatsApp limita la frecuencia de contacto entre el mismo remitente y destinatario.',
    },
    '131057': {
      traduccion: 'Cuenta en modo de mantenimiento',
      explicacion: 'La cuenta de negocio está temporalmente en mantenimiento por actualizaciones del sistema. Vuelve a intentarlo en unos minutos.',
    },
    '132000': {
      traduccion: 'Número de parámetros de plantilla no coincide',
      explicacion: 'La cantidad de variables enviadas no coincide con las que requiere la plantilla. Verifica que se envíen exactamente los parámetros que la plantilla necesita.',
    },
    '132001': {
      traduccion: 'La plantilla no existe o no está aprobada',
      explicacion: 'La plantilla no existe en el idioma especificado o no ha sido aprobada por Meta. Verifica el nombre exacto y el idioma configurado.',
    },
    '132005': {
      traduccion: 'Texto de plantilla demasiado largo',
      explicacion: 'El texto final, después de reemplazar las variables con los valores reales, excede el límite de caracteres permitido por WhatsApp.',
    },
    '132007': {
      traduccion: 'Contenido de plantilla viola políticas de WhatsApp',
      explicacion: 'El contenido de la plantilla fue rechazado por Meta por no cumplir con las políticas de la plataforma de WhatsApp Business.',
    },
    '132012': {
      traduccion: 'Formato de parámetro de plantilla incorrecto',
      explicacion: 'Los valores de los parámetros no tienen el formato correcto según el tipo de dato que la plantilla espera (ej. fecha, número, texto).',
    },
    '132015': {
      traduccion: 'Plantilla pausada por baja calidad',
      explicacion: 'La plantilla fue pausada temporalmente porque recibió comentarios negativos de usuarios. Revisa el contenido y solicita su reactivación en el administrador de WhatsApp Business.',
    },
    '132016': {
      traduccion: 'Plantilla deshabilitada permanentemente',
      explicacion: 'La plantilla fue pausada demasiadas veces (3 o más) por baja calidad y ha sido deshabilitada de forma permanente por Meta.',
    },
    '133004': {
      traduccion: 'Servidor temporalmente no disponible',
      explicacion: 'El servidor de la API de WhatsApp está temporalmente inaccesible. Suele resolverse solo en pocos minutos.',
    },
    '133010': {
      traduccion: 'Número de teléfono no registrado en WhatsApp Business',
      explicacion: 'El número de teléfono no está registrado en la plataforma de WhatsApp Business. Debe completarse el proceso de registro antes de enviar mensajes.',
    },
    '135000': {
      traduccion: 'Error genérico con los parámetros de la solicitud',
      explicacion: 'Error desconocido relacionado con los parámetros enviados. Verifica que todos los datos del mensaje sean correctos y estén bien formateados.',
    },
  }

  if (code && MAP[code]) return MAP[code]

  // Fallback por palabras clave cuando no hay código explícito
  const c = comentario.toLowerCase()
  if (c.includes('ecosystem') || c.includes('engagement') || c.includes('healthy'))
    return {
      traduccion: 'Meta decidió no entregar este mensaje',
      explicacion: 'El destinatario recibió demasiados mensajes de marketing. Meta limita la entrega automáticamente para mantener una experiencia de interacción saludable.',
    }
  if (c.includes('24 hour') || c.includes('24-hour') || c.includes('24 hours'))
    return {
      traduccion: 'Ventana de conversación de 24 horas cerrada',
      explicacion: 'Pasaron más de 24 horas desde la última respuesta del destinatario. Es obligatorio usar una plantilla aprobada para retomar la conversación.',
    }
  if (c.includes('spam') || c.includes('rate limit'))
    return {
      traduccion: 'Límite de mensajes no deseados alcanzado',
      explicacion: 'Los usuarios reportaron o bloquearon los mensajes. WhatsApp restringe temporalmente los envíos para proteger la reputación del número.',
    }
  if (c.includes('undeliverable') || c.includes('no entregable'))
    return {
      traduccion: 'Mensaje no entregable',
      explicacion: 'No se pudo entregar el mensaje. El número puede no tener WhatsApp instalado, estar inactivo o usar una versión incompatible.',
    }
  if (c.includes('rejected') || c.includes('rechazado'))
    return {
      traduccion: 'Mensaje rechazado por WhatsApp',
      explicacion: 'WhatsApp rechazó el mensaje. Puede deberse a una violación de políticas o a restricciones del número.',
    }
  if (c.includes('opted out') || c.includes('opt-out'))
    return {
      traduccion: 'Usuario bloqueó los mensajes',
      explicacion: 'El usuario eligió no recibir más mensajes de esta cuenta de WhatsApp Business.',
    }
  if (c.includes('limit') || c.includes('limite'))
    return {
      traduccion: 'Límite de mensajes excedido',
      explicacion: 'Se superó el límite de mensajes permitido. Espacia los envíos o reduce la frecuencia de la campaña.',
    }

  return null
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  DELIVERED_CHANNEL: { bg: 'var(--channel-bg)',  color: 'var(--channel)' },
  DELIVERED_USER:    { bg: 'var(--success-bg)',  color: 'var(--success)' },
  READ:              { bg: 'var(--warning-bg)',  color: 'var(--warning)' },
  SENT:              { bg: '#f8fafc',            color: 'var(--ink-2)'   },
  FAILED:            { bg: 'var(--danger-bg)',   color: 'var(--danger)'  },
  UNDELIVERABLE:     { bg: 'var(--danger-bg)',   color: 'var(--danger)'  },
}

function StatusBadge({ estatus }: { estatus: string }) {
  const style = STATUS_STYLE[estatus?.toUpperCase()] ?? { bg: '#f1f5f9', color: '#64748b' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: style.bg, color: style.color }}>
      {normalizeStatus(estatus)}
    </span>
  )
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

function MessageDrawer({ row, onClose }: { row: CampaignRow; onClose: () => void }) {
  const [tab, setTab] = useState<'general' | 'solicitud'>('general')
  const failed = isFailed(row.estatus)
  const params = row.parametros
    ? row.parametros.split(',').map(p => p.trim()).filter(Boolean)
    : []

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const Field = ({
    label, value, danger = false, justify = false,
  }: { label: string; value: React.ReactNode; danger?: boolean; justify?: boolean }) => (
    <div className="flex items-start justify-between gap-6 px-4 py-3"
      style={{ borderTop: '1px solid var(--border-soft)' }}>
      <span className="text-sm shrink-0" style={{ color: 'var(--ink-3)' }}>{label}</span>
      {typeof value === 'string'
        ? <span className="text-sm font-medium break-words"
            style={{ color: danger ? 'var(--danger)' : 'var(--ink)', textAlign: justify ? 'justify' : 'right' }}>{value}</span>
        : value}
    </div>
  )

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(1px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: 'min(480px, 100vw)',
          background: 'var(--surface)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
          borderLeft: '1px solid var(--border-soft)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface-muted, #f1f5f9)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
              {row.destino}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--ink-3)' }}
            aria-label="Cerrar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          {(['general', 'solicitud'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-3 text-sm font-medium transition-colors"
              style={{
                color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
                borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t === 'general' ? 'Información general' : 'Cuerpo de solicitud'}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {tab === 'general' && (
            <>
              {/* Resumen */}
              <section>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
                  Resumen
                </h3>
                <div className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--border-soft)' }}>

                  {/* First row has no top border */}
                  <div className="flex items-start justify-between gap-6 px-4 py-3">
                    <span className="text-sm shrink-0" style={{ color: 'var(--ink-3)' }}>Destino</span>
                    <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--ink)' }}>
                      {row.destino}
                    </span>
                  </div>

                  <Field label="Origen" value={row.origen || 'Campaña'} />
                  <Field label="Plantilla" value={row.plantilla || '—'} />
                  <Field label="Estatus" value={<StatusBadge estatus={row.estatus} />} />
                  <Field label="Fecha de envío" value={formatFecha(row.fechaEnvio)} />

                  {failed && row.comentario && (() => {
                    const detail = getErrorDetail(row.comentario)
                    const codeMatch = row.comentario.match(/\[?(\d{4,6})\]?/)
                    const code = codeMatch?.[1]
                    const label = detail
                      ? `${code ? `[${code}] ` : ''}${detail.traduccion}`
                      : row.comentario
                    return (
                      <>
                        <Field label="Error" value={label} danger />
                        {detail?.explicacion && (
                          <Field label="¿Por qué ocurrió?" value={detail.explicacion} justify />
                        )}
                      </>
                    )
                  })()}

                  <Field
                    label="Confirmación de lectura"
                    value={row.leido && row.leido.toLowerCase() !== 'no' && row.leido !== '' ? row.leido : 'No'}
                  />
                </div>
              </section>

              {/* Parámetros */}
              {params.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"
                    style={{ color: 'var(--ink)' }}>
                    Parámetros
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold"
                      style={{ background: 'var(--ink)', color: '#fff' }}>
                      {params.length}
                    </span>
                  </h3>
                  <div className="rounded-xl px-4 py-3 space-y-1.5"
                    style={{ border: '1px solid var(--border-soft)' }}>
                    {params.map((p, i) => (
                      <p key={i} className="text-sm" style={{ color: 'var(--ink-2)' }}>
                        • {p}
                      </p>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {tab === 'solicitud' && (
            <section>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
                Entrega y respuesta
              </h3>
              <div className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border-soft)' }}>

                <div className="flex items-start justify-between gap-6 px-4 py-3">
                  <span className="text-sm shrink-0" style={{ color: 'var(--ink-3)' }}>Entrega al canal</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    {formatFecha(row.fechaEntregaCanal)}
                  </span>
                </div>

                <Field label="Entrega al usuario" value={formatFecha(row.fechaEntregaUsuario)} />
                <Field label="Fecha de lectura"   value={formatFecha(row.fechaLectura)} />
                <Field label="Respuesta"           value={formatRespuesta(row.respuesta)} />
                <Field label="Fecha respuesta"     value={row.fechaRespuesta ? formatFecha(row.fechaRespuesta) : '—'} />
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50, 100]

type TableSortField = 'destino' | 'parametros' | 'estatus' | 'fechaEnvio' | 'respuesta' | 'fechaRespuesta'
type TableSortDir   = 'asc' | 'desc'

function TableSortIcon({ active, dir }: { active: boolean; dir: TableSortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 shrink-0" style={{ opacity: active ? 1 : 0.3 }}>
      <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"
        style={{ opacity: active && dir === 'asc' ? 1 : 0.4 }}>
        <path d="M4 1l3 4H1z"/>
      </svg>
      <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"
        style={{ opacity: active && dir === 'desc' ? 1 : 0.4 }}>
        <path d="M4 7L1 3h6z"/>
      </svg>
    </span>
  )
}

export function CampaignTable({ rows, externalFilter }: { rows: CampaignRow[]; externalFilter?: TableFilter | null }) {
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(20)
  const [selected, setSelected]   = useState<CampaignRow | null>(null)
  const [sortField, setSortField] = useState<TableSortField>('respuesta')
  const [sortDir,   setSortDir]   = useState<TableSortDir>('desc')

  const toggleSort = (field: TableSortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const q       = search.toLowerCase().trim()
  const qDigits = search.replace(/\D/g, '')

  const baseRows = externalFilter ? rows.filter(r => {
    if (externalFilter.type === 'donut') {
      if (externalFilter.key === 'usuario') return isDeliveredUser(r.estatus)
      if (externalFilter.key === 'fallidos') return isFailed(r.estatus)
    }
    if (externalFilter.type === 'error') {
      return isFailed(r.estatus) && classifyError(r.comentario, r.estatus) === externalFilter.tipo
    }
    return true
  }) : rows

  const filtered = !q ? baseRows : baseRows.filter(r => {
    // Comparar dígitos puros del raw Y de la versión local (sin prefijo 593)
    const destinoDigits  = r.destino.replace(/\D/g, '')
    const localDigits    = formatDestino(r.destino).replace(/\D/g, '')
    const matchesNumero  = qDigits.length >= 2 && (
      destinoDigits.includes(qDigits) || localDigits.includes(qDigits)
    )
    return (
      matchesNumero ||
      formatDestino(r.destino).toLowerCase().includes(q) ||
      r.parametros.toLowerCase().includes(q) ||
      r.estatus.toLowerCase().includes(q) ||
      normalizeStatus(r.estatus).toLowerCase().includes(q) ||
      r.plantilla.toLowerCase().includes(q) ||
      r.leido.toLowerCase().includes(q) ||
      r.respuesta.toLowerCase().includes(q) ||
      r.fechaEnvio.includes(search) ||
      traducirComentario(r.comentario).toLowerCase().includes(q)
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'destino':        cmp = a.destino.localeCompare(b.destino); break
      case 'parametros':     cmp = a.parametros.localeCompare(b.parametros, 'es'); break
      case 'estatus':        cmp = a.estatus.localeCompare(b.estatus); break
      case 'fechaEnvio':     cmp = a.fechaEnvio.localeCompare(b.fechaEnvio); break
      case 'respuesta': {
        const aHas = a.respuesta.trim() ? 1 : 0
        const bHas = b.respuesta.trim() ? 1 : 0
        if (aHas !== bHas) return bHas - aHas  // con respuesta siempre primero
        cmp = a.respuesta.localeCompare(b.respuesta, 'es')
        break
      }
      case 'fechaRespuesta': cmp = a.fechaRespuesta.localeCompare(b.fechaRespuesta); break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const cur        = Math.min(page, totalPages)
  const slice      = sorted.slice((cur - 1) * pageSize, cur * pageSize)

  const exportCSV = () => {
    const h = ['Destino', 'Nombre', 'Estatus', 'Fecha de envío', 'Leído', 'Respondido', 'Fecha respuesta', 'Plantilla']
    const lines = [
      h.join(','),
      ...filtered.map(r => [r.destino, r.parametros, normalizeStatus(r.estatus), r.fechaEnvio, r.leido, formatRespuesta(r.respuesta), r.fechaRespuesta ? formatRespuesta(r.fechaRespuesta) : '', r.plantilla]
        .map(v => `"${v}"`).join(','))
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    a.download = 'detalle.csv'
    a.click()
  }

  type ColDef = { label: string; sort?: TableSortField }
  const COLS: ColDef[] = [
    { label: 'Destino',         sort: 'destino',       },
    { label: 'Nombre',          sort: 'parametros'     },
    { label: 'Estatus',         sort: 'estatus'        },
    { label: 'Fecha de envío',  sort: 'fechaEnvio'     },
    { label: 'Leído'                                   },
    { label: 'Respuesta',       sort: 'respuesta'      },
    { label: 'Fecha respuesta', sort: 'fechaRespuesta' },
    { label: 'Plantilla'                               },
  ]

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-soft)", background: "var(--surface)" }}>

        {/* Toolbar */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 gap-3"
          style={{ borderBottom: "1px solid var(--border-soft)", background: "#f9fafb" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: "var(--ink-3)" }}>
            Detalle de mensajes
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="text-xs outline-none rounded-lg px-2 py-1.5 cursor-pointer shrink-0"
              style={{ border: "1px solid var(--border-soft)", background: "var(--surface)", color: "var(--ink-2)" }}
            >
              {PAGE_SIZES.map(s => (
                <option key={s} value={s}>{s} por página</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Buscar número, estado..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="text-sm outline-none rounded-lg px-3 py-1.5 flex-1 min-w-[160px]"
              style={{ border: "1px solid var(--border-soft)", background: "var(--surface)", color: "var(--ink)" }}
            />
            <button
              onClick={exportCSV}
              className="text-xs font-medium px-3 py-1.5 rounded-lg shrink-0"
              style={{ border: "1px solid var(--border-soft)", background: "var(--surface)", color: "var(--ink-2)" }}
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-soft)", background: "#f9fafb" }}>
                {COLS.map(col => (
                  <th
                    key={col.label}
                    className={`text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap${col.sort ? ' cursor-pointer select-none hover:text-[var(--ink)] transition-colors' : ''}`}
                    style={{ color: "var(--ink-3)" }}
                    onClick={col.sort ? () => toggleSort(col.sort!) : undefined}
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      {col.sort && <TableSortIcon active={sortField === col.sort} dir={sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r, i) => (
                <tr
                  key={r.id}
                  className="row-hover transition-colors cursor-pointer"
                  style={{ borderTop: i > 0 ? "1px solid var(--border-soft)" : undefined }}
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: 140 }}>
                    <div className="flex items-center gap-1.5">
                      <EcuadorFlag />
                      <span className="font-mono text-xs tabular" style={{ color: "var(--ink-2)" }}>
                        {formatDestino(r.destino)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--ink)" }}>{r.parametros || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge estatus={r.estatus} /></td>
                  <td className="px-4 py-3 text-xs tabular whitespace-nowrap" style={{ color: "var(--ink-3)" }}>{formatFecha(r.fechaEnvio)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--ink-3)" }}>{r.leido || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--ink-3)", maxWidth: 180 }}>
                    <div
                      className="truncate"
                      style={{ maxWidth: 168 }}
                      title={r.respuesta || undefined}
                    >
                      {formatRespuesta(r.respuesta)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap tabular" style={{ color: "var(--ink-3)" }}>
                    {r.fechaRespuesta ? formatRespuesta(r.fechaRespuesta) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--ink-3)", maxWidth: 160 }}>
                    <div className="truncate font-mono" style={{ maxWidth: 148 }} title={r.plantilla || undefined}>
                      {r.plantilla}
                    </div>
                  </td>
                </tr>
              ))}
              {!slice.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: "var(--ink-3)" }}>
                    Sin resultados para &quot;{search}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 text-xs"
          style={{ borderTop: "1px solid var(--border-soft)", color: "var(--ink-3)" }}>
          <span>
            {sorted.length === 0 ? '0 registros' : (
              <>
                {((cur - 1) * pageSize + 1).toLocaleString('es-EC')}–{Math.min(cur * pageSize, sorted.length).toLocaleString('es-EC')} de {sorted.length.toLocaleString('es-EC')}
              </>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={cur === 1}
              className="px-2.5 py-1 rounded font-medium disabled:opacity-30"
              style={{ border: "1px solid var(--border-soft)" }}>
              Anterior
            </button>
            <span className="px-3">{cur} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={cur === totalPages}
              className="px-2.5 py-1 rounded font-medium disabled:opacity-30"
              style={{ border: "1px solid var(--border-soft)" }}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Drawer — mounted outside the table so it overlays the full viewport */}
      {selected && (
        <MessageDrawer row={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
