'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { ParsedCampaign } from '@/lib/excel'
import { encodeId } from '@/lib/utils'
import { FilterPanel, Filters } from './FilterPanel'

interface CampaignListProps {
  campaigns: ParsedCampaign[]
}

type SortField = 'nombre' | 'fecha' | 'total'
type SortDir   = 'asc' | 'desc'

function getOrg(c: ParsedCampaign): string {
  const s = (c.nombre + c.filename).toLowerCase()
  if (s.includes('etapa')) return 'ETAPA'
  return 'Otro'
}

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
    <span className="inline-flex flex-col ml-1" style={{ opacity: active ? 1 : 0.35 }}>
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

function defaultFilters(): Filters {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return { search: '', canal: '', dateRange: { start: firstOfMonth, end: today } }
}

function countActiveFilters(f: Filters): number {
  const def = defaultFilters()
  let n = 0
  if (f.search.trim()) n++
  if (f.canal) n++
  const ds = f.dateRange.start?.toDateString()
  const de = f.dateRange.end?.toDateString()
  const dd = def.dateRange
  if (ds !== dd.start?.toDateString() || de !== dd.end?.toDateString()) n++
  return n
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDir,   setSortDir]   = useState<SortDir>('desc')
  const [panelOpen, setPanelOpen] = useState(false)
  const [applied,   setApplied]   = useState<Filters>(defaultFilters)
  const filterBtnRef = useRef<HTMLDivElement>(null)

  const canales = useMemo(
    () => [...new Set(campaigns.map(getOrg))].sort(),
    [campaigns]
  )

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir(field === 'total' ? 'desc' : 'asc') }
  }

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      // Fecha
      const { start, end } = applied.dateRange
      if (start || end) {
        const fecha = new Date(c.fechaCampana.replace(' ', 'T'))
        if (start && fecha < start) return false
        if (end) {
          const endOfDay = new Date(end); endOfDay.setHours(23, 59, 59, 999)
          if (fecha > endOfDay) return false
        }
      }
      // Canal
      if (applied.canal && getOrg(c) !== applied.canal) return false
      // Búsqueda
      if (applied.search.trim()) {
        const q = applied.search.trim().toLowerCase()
        if (!c.nombre.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [campaigns, applied])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortField === 'nombre') cmp = a.nombre.localeCompare(b.nombre, 'es')
    if (sortField === 'fecha')  cmp = a.fechaCampana.localeCompare(b.fechaCampana)
    if (sortField === 'total')  cmp = a.metrics.total - b.metrics.total
    return sortDir === 'asc' ? cmp : -cmp
  }), [filtered, sortField, sortDir])

  const activeCount = countActiveFilters(applied)
  const thCls = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap select-none cursor-pointer hover:text-[var(--ink)] transition-colors"

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

  return (
    <div className="rounded-xl border overflow-visible"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}>

      {/* Header con botón Filtros + contador */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "#f9fafb" }}>

        <span className="text-xs" style={{ color: "var(--ink-3)" }}>
          {sorted.length} {sorted.length === 1 ? 'campaña' : 'campañas'}
        </span>

        <div ref={filterBtnRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-lg transition-all"
            style={{
              background: panelOpen || activeCount > 0 ? "var(--brand-light)" : "white",
              color: panelOpen || activeCount > 0 ? "var(--brand)" : "var(--ink-2)",
              border: `1px solid ${panelOpen || activeCount > 0 ? '#f5c6c6' : 'var(--border-soft)'}`,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filtros
            {activeCount > 0 && (
              <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "var(--brand)", color: "white", fontSize: 10 }}>
                {activeCount}
              </span>
            )}
          </button>

          <FilterPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            canales={canales}
            initial={applied}
            onApply={f => { setApplied(f); setPanelOpen(false) }}
          />
        </div>
      </div>

      {/* Tabla o empty state */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>
              No hay campañas para el período seleccionado
            </p>
            <button onClick={() => setApplied(defaultFilters())}
              className="text-xs mt-2 underline transition-colors"
              style={{ color: "var(--brand)" }}>
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-soft)", background: "#f9fafb" }}>
              <th className={thCls} style={{ color: "var(--ink-3)" }} onClick={() => toggleSort('nombre')}>
                Campaña <SortIcon active={sortField === 'nombre'} dir={sortDir} />
              </th>
              <th className={thCls} style={{ color: "var(--ink-3)" }}>Organización</th>
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
                      {getOrg(c)}
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
      )}
    </div>
  )
}
