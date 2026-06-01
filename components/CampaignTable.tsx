'use client'

import { useState } from 'react'
import { CampaignRow, normalizeStatus } from '@/lib/excel'

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
  // Ecuador: 593 + 9XXXXXXXX (10 digits local starting with 09)
  if (digits.startsWith('593') && digits.length >= 12) {
    const local = '0' + digits.slice(3)           // 0987938987
    return local.replace(/^(0\d{2})(\d{3})(\d{4})$/, '$1 $2 $3')
  }
  // Already local format starting with 0
  if (digits.startsWith('0') && digits.length === 10) {
    return digits.replace(/^(0\d{2})(\d{3})(\d{4})$/, '$1 $2 $3')
  }
  return raw
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

const PAGE = 50

export function CampaignTable({ rows }: { rows: CampaignRow[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = rows.filter(r =>
    r.destino.includes(search) ||
    r.parametros.toLowerCase().includes(search.toLowerCase()) ||
    r.estatus.toLowerCase().includes(search.toLowerCase()) ||
    r.plantilla.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(page, totalPages)
  const slice = filtered.slice((cur - 1) * PAGE, cur * PAGE)

  const exportCSV = () => {
    const h = ['Destino', 'Nombre', 'Estatus', 'Fecha de envío', 'Leído', 'Respondido', 'Plantilla']
    const lines = [
      h.join(','),
      ...filtered.map(r => [r.destino, r.parametros, normalizeStatus(r.estatus), r.fechaEnvio, r.leido, r.respuesta || '-', r.plantilla]
        .map(v => `"${v}"`).join(','))
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    a.download = 'detalle.csv'
    a.click()
  }

  const HEADERS = ['Destino', 'Nombre', 'Estatus', 'Fecha de envío', 'Leído', 'Respuesta', 'Plantilla']

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-soft)", background: "var(--surface)" }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5 gap-4"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "#f9fafb" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
          Detalle de mensajes
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar número, estado..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="text-sm outline-none rounded-lg px-3 py-1.5 w-56"
            style={{ border: "1px solid var(--border-soft)", background: "var(--surface)", color: "var(--ink)" }}
          />
          <button onClick={exportCSV}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ border: "1px solid var(--border-soft)", background: "var(--surface)", color: "var(--ink-2)" }}>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-soft)", background: "#f9fafb" }}>
              {HEADERS.map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: "var(--ink-3)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={r.id} className="row-hover transition-colors"
                style={{ borderTop: i > 0 ? "1px solid var(--border-soft)" : undefined }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <EcuadorFlag />
                    <span className="font-mono text-xs tabular" style={{ color: "var(--ink-2)" }}>
                      {formatDestino(r.destino)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "var(--ink)" }}>{r.parametros || '—'}</td>
                <td className="px-4 py-3"><StatusBadge estatus={r.estatus} /></td>
                <td className="px-4 py-3 text-xs tabular whitespace-nowrap" style={{ color: "var(--ink-3)" }}>{r.fechaEnvio}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--ink-3)" }}>{r.leido || '—'}</td>
                <td className="px-4 py-3 text-xs max-w-[180px] truncate" style={{ color: "var(--ink-3)" }}
                  title={r.respuesta || undefined}>{r.respuesta || '—'}</td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--ink-3)" }}>{r.plantilla}</td>
              </tr>
            ))}
            {!slice.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--ink-3)" }}>
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
        <span>{filtered.length.toLocaleString('es-EC')} registros</span>
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
  )
}
