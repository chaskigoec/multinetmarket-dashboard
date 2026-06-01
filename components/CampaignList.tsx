'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ParsedCampaign } from '@/lib/excel'
import { encodeId } from '@/lib/folder'

interface CampaignListProps {
  campaigns: ParsedCampaign[]
}

type SortField = 'nombre' | 'fecha' | 'total'
type SortDir = 'asc' | 'desc'

function formatFecha(raw: string): string {
  const dt = new Date(raw.replace(' ', 'T'))
  if (isNaN(dt.getTime())) return raw
  return dt.toLocaleString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 opacity-40" style={{ opacity: active ? 1 : 0.35 }}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
        style={{ opacity: active && dir === 'asc' ? 1 : 0.4 }}>
        <path d="M4 1l3 4H1z"/>
      </svg>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
        style={{ opacity: active && dir === 'desc' ? 1 : 0.4 }}>
        <path d="M4 7L1 3h6z"/>
      </svg>
    </span>
  )
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'total' ? 'desc' : 'asc')
    }
  }

  const sorted = [...campaigns].sort((a, b) => {
    let cmp = 0
    if (sortField === 'nombre') cmp = a.nombre.localeCompare(b.nombre, 'es')
    if (sortField === 'fecha')  cmp = a.fechaCampana.localeCompare(b.fechaCampana)
    if (sortField === 'total')  cmp = a.metrics.total - b.metrics.total
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (!campaigns.length) {
    return (
      <div className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3 text-center"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5">
          <path d="M9 17H5a2 2 0 0 0-2 2" strokeLinecap="round"/>
          <path d="M9 17V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5" strokeLinecap="round"/>
          <path d="M13 21h8M17 17l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>Sin campañas</p>
          <p className="text-xs mt-1 max-w-sm" style={{ color: "var(--ink-3)" }}>
            Ejecuta el script sync-campanas.ps1 para cargar los archivos de la carpeta Resultados
          </p>
        </div>
      </div>
    )
  }

  const thCls = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap select-none cursor-pointer hover:text-[var(--ink)] transition-colors"

  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-soft)", background: "#f9fafb" }}>
            <th className={thCls} style={{ color: "var(--ink-3)" }} onClick={() => toggleSort('nombre')}>
              Campaña <SortIcon active={sortField === 'nombre'} dir={sortDir} />
            </th>
            <th className={thCls} style={{ color: "var(--ink-3)" }}>
              Organización
            </th>
            <th className={thCls} style={{ color: "var(--ink-3)" }} onClick={() => toggleSort('fecha')}>
              Fecha de envío <SortIcon active={sortField === 'fecha'} dir={sortDir} />
            </th>
            <th className={`${thCls} text-right`} style={{ color: "var(--ink-3)" }} onClick={() => toggleSort('total')}>
              Total <SortIcon active={sortField === 'total'} dir={sortDir} />
            </th>
            <th className={thCls} style={{ color: "var(--ink-3)" }}>Estado</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, idx) => {
            const id = encodeId(c.filename)
            return (
              <tr key={c.id} className="row-hover group relative"
                style={{ borderTop: idx > 0 ? "1px solid var(--border-soft)" : undefined }}>
                <td className="px-5 py-4">
                  <Link href={`/campaign/${id}`} className="block">
                    <p className="text-sm font-semibold group-hover:text-[var(--brand)] transition-colors"
                      style={{ color: "var(--ink)" }}>
                      {c.nombre}
                    </p>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                    ETAPA
                  </span>
                </td>
                <td className="px-5 py-4 text-sm tabular" style={{ color: "var(--ink-2)" }}>
                  {formatFecha(c.fechaCampana)}
                </td>
                <td className="px-5 py-4 text-sm font-semibold tabular text-right" style={{ color: "var(--ink)" }}>
                  {c.metrics.total.toLocaleString('es-EC')}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid #bbf7d0" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Completa
                  </span>
                </td>
                <td className="px-3 py-4">
                  <Link href={`/campaign/${id}`}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                      className="opacity-25 group-hover:opacity-70 transition-opacity">
                      <path d="M6 3l5 5-5 5" stroke="var(--ink)" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
