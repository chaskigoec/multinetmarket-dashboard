'use client'

import { useState, useRef, useEffect } from 'react'

export interface DateRange {
  start: Date | null
  end: Date | null
}

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
}

const DAYS_ES = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function toMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function formatShort(d: Date | null): string {
  if (!d) return ''
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getPresets(): { label: string; start: Date; end: Date }[] {
  const today = toMidnight(new Date())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const dayOfWeek = today.getDay()
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - dayOfWeek)
  const startOfLastWeek = new Date(startOfWeek); startOfLastWeek.setDate(startOfWeek.getDate() - 7)
  const endOfLastWeek = new Date(startOfWeek); endOfLastWeek.setDate(startOfWeek.getDate() - 1)
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  const firstOfYear = new Date(today.getFullYear(), 0, 1)
  const firstOfLastYear = new Date(today.getFullYear() - 1, 0, 1)
  const lastOfLastYear = new Date(today.getFullYear() - 1, 11, 31)
  return [
    { label: 'Hoy',           start: today,            end: today },
    { label: 'Ayer',          start: yesterday,        end: yesterday },
    { label: 'Esta semana',   start: startOfWeek,      end: today },
    { label: 'Semana pasada', start: startOfLastWeek,  end: endOfLastWeek },
    { label: 'Este mes',      start: firstOfMonth,     end: today },
    { label: 'Mes pasado',    start: firstOfLastMonth, end: lastOfLastMonth },
    { label: 'Este año',      start: firstOfYear,      end: today },
    { label: 'Año pasado',    start: firstOfLastYear,  end: lastOfLastYear },
  ]
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

function getActivePreset(value: DateRange): string | null {
  if (!value.start || !value.end) return null
  for (const p of getPresets()) {
    if (sameDay(p.start, value.start) && sameDay(p.end, value.end)) return p.label
  }
  return null
}

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<Date | null>(null)
  const [selecting, setSelecting] = useState<Date | null>(null) // first click pending second
  const [viewYear, setViewYear] = useState(() => (value.start ?? new Date()).getFullYear())
  const [viewMonth, setViewMonth] = useState(() => (value.start ?? new Date()).getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const presets = getPresets()
  const activePreset = getActivePreset(value)
  const days = getCalendarDays(viewYear, viewMonth)

  const handleDayClick = (day: Date) => {
    const d = toMidnight(day)
    if (!selecting) {
      setSelecting(d)
      onChange({ start: d, end: null })
    } else {
      if (d < selecting) {
        setSelecting(d)
        onChange({ start: d, end: null })
      } else {
        onChange({ start: selecting, end: d })
        setSelecting(null)
      }
    }
  }

  const isStart = (day: Date) => sameDay(day, value.start)
  const isEnd   = (day: Date) => sameDay(day, value.end)
  const inRange = (day: Date) => {
    const d = toMidnight(day)
    const s = value.start ? toMidnight(value.start) : null
    const e = (selecting ? hovered : value.end) ? toMidnight((selecting ? hovered : value.end)!) : null
    if (!s || !e) return false
    return d > s && d < e
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const displayText = value.start
    ? value.end
      ? `${formatShort(value.start)} — ${formatShort(value.end)}`
      : formatShort(value.start)
    : 'Seleccionar fecha'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Input field */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-lg text-left"
        style={{ border: "1px solid var(--border-soft)", background: "white", color: value.start ? "var(--ink-2)" : "var(--ink-3)" }}>
        <span className="truncate">{displayText}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "var(--ink-3)" }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border-soft)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex', minWidth: 520,
        }}>
          {/* Presets */}
          <div style={{ width: 160, borderRight: '1px solid var(--border-soft)', padding: '12px 0' }}>
            <p className="text-xs font-semibold uppercase tracking-wider px-4 pb-2" style={{ color: "var(--ink-3)" }}>Rangos:</p>
            {presets.map(p => (
              <button key={p.label}
                onClick={() => {
                  onChange({ start: p.start, end: p.end })
                  setSelecting(null)
                  setViewYear(p.start.getFullYear())
                  setViewMonth(p.start.getMonth())
                }}
                className="w-full text-left text-sm px-4 py-1.5 transition-colors hover:bg-[var(--brand-light)]"
                style={{
                  color: activePreset === p.label ? 'var(--brand)' : 'var(--ink-2)',
                  fontWeight: activePreset === p.label ? 600 : 400,
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div style={{ flex: 1, padding: '12px 16px 12px 12px' }}>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-[var(--brand-light)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                {MONTHS_ES[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-[var(--brand-light)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {DAYS_ES.map(d => (
                <div key={d} className="text-center text-xs font-semibold" style={{ color: "var(--ink-3)", padding: '2px 0' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {days.map((day, i) => {
                if (!day) return <div key={`e${i}`} />
                const start = isStart(day)
                const end = isEnd(day)
                const range = inRange(day)
                const today = sameDay(day, toMidnight(new Date()))
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => selecting && setHovered(day)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: (start || end) ? '50%' : (range ? '0' : '50%'),
                      background: (start || end) ? 'var(--brand)' : range ? 'var(--brand-light)' : 'transparent',
                      color: (start || end) ? 'white' : range ? 'var(--brand)' : today ? 'var(--brand)' : 'var(--ink-2)',
                      fontWeight: (start || end || today) ? 600 : 400,
                      fontSize: 13,
                      border: today && !start && !end ? '1px solid var(--brand)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}>
                    {day.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
              <button onClick={() => { setOpen(false); setSelecting(null) }}
                className="text-sm px-4 py-1.5 rounded-lg transition-colors"
                style={{ color: "var(--ink-2)", border: "1px solid var(--border-soft)" }}>
                Cancelar
              </button>
              <button onClick={() => { setOpen(false); setSelecting(null) }}
                className="text-sm px-4 py-1.5 rounded-lg font-semibold"
                style={{ background: "var(--brand)", color: "white" }}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
