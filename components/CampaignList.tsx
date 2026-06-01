import Link from 'next/link'
import { ParsedCampaign } from '@/lib/excel'
import { encodeId } from '@/lib/folder'

interface CampaignListProps {
  campaigns: ParsedCampaign[]
}

const HEADERS = [
  { label: "Campaña",        cls: "flex-[3]" },
  { label: "Organización",   cls: "w-28"     },
  { label: "Fecha de envío", cls: "w-44"     },
  { label: "Total Destinatarios", cls: "w-36 text-right" },
  { label: "Estado",         cls: "w-28"     },
]

function formatFecha(raw: string): string {
  // raw format: "2026-05-28 15:44:57"
  const dt = new Date(raw.replace(' ', 'T'))
  if (isNaN(dt.getTime())) return raw
  return dt.toLocaleString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export function CampaignList({ campaigns }: CampaignListProps) {
  if (!campaigns.length) {
    return (
      <div className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3 text-center"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5">
          <path d="M9 17H5a2 2 0 0 0-2 2" strokeLinecap="round"/>
          <path d="M9 17V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5" strokeLinecap="round"/>
          <path d="M13 21h8M17 17l4 4-4-4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>
            Sin campañas en la carpeta de Resultados
          </p>
          <p className="text-xs mt-1 max-w-sm" style={{ color: "var(--ink-3)" }}>
            Exporta el reporte desde YCloud y guárdalo en OPERACIONES CHASKI / MULTINETMARKET / ETAPA / Resultados
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}>

      {/* Header */}
      <div className="flex items-center gap-6 px-5 py-3"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "#f9fafb" }}>
        {HEADERS.map(h => (
          <div key={h.label} className={`${h.cls} text-xs font-semibold uppercase tracking-wider shrink-0`}
            style={{ color: "var(--ink-3)" }}>
            {h.label}
          </div>
        ))}
        <div className="w-5 shrink-0" />
      </div>

      {/* Rows */}
      {campaigns.map((c, idx) => {
        const id = encodeId(c.filename)

        return (
          <Link
            key={c.id}
            href={`/campaign/${id}`}
            className="relative flex items-center gap-6 px-5 py-4 row-hover group"
            style={{ borderTop: idx > 0 ? "1px solid var(--border-soft)" : undefined }}
          >
            {/* Acento izquierdo en hover */}
            <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: "var(--brand)" }} />

            {/* Nombre */}
            <div className="flex-[3] min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-[var(--brand)] transition-colors"
                style={{ color: "var(--ink)" }}>
                {c.nombre}
              </p>
            </div>

            {/* Organización */}
            <div className="w-28 shrink-0">
              <span className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                ETAPA
              </span>
            </div>

            {/* Fecha de envío con hora */}
            <div className="w-44 shrink-0 text-sm tabular" style={{ color: "var(--ink-2)" }}>
              {formatFecha(c.fechaCampana)}
            </div>

            {/* Total Destinatarios */}
            <div className="w-36 shrink-0 text-right text-sm font-semibold tabular"
              style={{ color: "var(--ink)" }}>
              {c.metrics.total.toLocaleString('es-EC')}
            </div>

            {/* Estado */}
            <div className="w-28 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid #bbf7d0" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Completa
              </span>
            </div>

            {/* Arrow */}
            <div className="w-5 shrink-0 flex justify-end">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                className="opacity-25 group-hover:opacity-70 transition-opacity">
                <path d="M6 3l5 5-5 5" stroke="var(--ink)" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
