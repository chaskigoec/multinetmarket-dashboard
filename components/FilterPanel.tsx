'use client'

import { useState, useEffect, useRef } from 'react'
import { DateRangePicker, DateRange } from './DateRangePicker'

export interface Filters {
  search: string
  canal: string
  dateRange: DateRange
}

interface Props {
  open: boolean
  onClose: () => void
  canales: string[]
  initial: Filters
  onApply: (f: Filters) => void
}

export function FilterPanel({ open, onClose, canales, initial, onApply }: Props) {
  const [draft, setDraft] = useState<Filters>(initial)
  const ref = useRef<HTMLDivElement>(null)

  // Sync draft when panel opens
  useEffect(() => {
    if (open) setDraft(initial)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  const handleClear = () => {
    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    setDraft({ search: '', canal: '', dateRange: { start: firstOfMonth, end: today } })
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
      background: 'var(--surface)', border: '1px solid var(--border-soft)',
      borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      padding: 20, width: 'min(480px, calc(100vw - 32px))',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>

        {/* Buscar en campaña */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ink-3)" }}>
            Buscar en campaña
          </label>
          <input
            type="text"
            placeholder="Buscar en campaña"
            value={draft.search}
            onChange={e => setDraft(d => ({ ...d, search: e.target.value }))}
            className="w-full text-sm px-3 py-2 rounded-lg outline-none"
            style={{ border: "1px solid var(--border-soft)", color: "var(--ink-2)", background: "white" }}
          />
        </div>

        {/* Canales */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ink-3)" }}>
            Canales
          </label>
          <select
            value={draft.canal}
            onChange={e => setDraft(d => ({ ...d, canal: e.target.value }))}
            className="w-full text-sm px-3 py-2 rounded-lg appearance-none"
            style={{ border: "1px solid var(--border-soft)", color: draft.canal ? "var(--ink-2)" : "var(--ink-3)", background: "white" }}>
            <option value="">Todos los canales</option>
            {canales.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Fecha — ocupa todo el ancho */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ink-3)" }}>
            Fecha
          </label>
          <DateRangePicker
            value={draft.dateRange}
            onChange={range => setDraft(d => ({ ...d, dateRange: range }))}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-5 pt-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
        <button onClick={handleClear}
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ color: "var(--ink-2)", border: "1px solid var(--border-soft)" }}>
          Limpiar
        </button>
        <button onClick={handleApply}
          className="text-sm px-5 py-2 rounded-lg font-semibold"
          style={{ background: "var(--brand)", color: "white" }}>
          Aplicar
        </button>
      </div>
    </div>
  )
}
