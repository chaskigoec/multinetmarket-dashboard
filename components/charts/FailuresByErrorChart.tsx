'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const ERROR_COLORS = [
  '#7c3aed', '#1d4ed8', '#ea580c',
  '#0891b2', '#15803d', '#be185d', '#94a3b8',
]

const MAX_CHARS = 22

function splitLabel(name: string): [string, string] {
  if (name.length <= MAX_CHARS) return [name, '']
  const cut = name.lastIndexOf(' ', MAX_CHARS)
  const idx = cut > 0 ? cut : MAX_CHARS
  return [name.slice(0, idx), name.slice(idx).trim()]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLabel({ cx, cy, midAngle, outerRadius, name, percent }: any) {
  if ((percent ?? 0) < 0.01) return null
  const RADIAN = Math.PI / 180
  const radius = (outerRadius ?? 70) + 32
  const x      = (cx ?? 0) + radius * Math.cos(-(midAngle ?? 0) * RADIAN)
  const y      = (cy ?? 0) + radius * Math.sin(-(midAngle ?? 0) * RADIAN)
  const anchor = x > (cx ?? 0) ? 'start' : 'end'
  const pct    = ((percent ?? 0) * 100).toFixed(0)
  const [line1, line2] = splitLabel(name as string)

  if (!line2) {
    return (
      <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#334155">
        {line1} · {pct}%
      </text>
    )
  }

  return (
    <g>
      <text x={x} y={y - 8} textAnchor={anchor} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#334155">
        {line1}
      </text>
      <text x={x} y={y + 6} textAnchor={anchor} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#334155">
        {line2} · {pct}%
      </text>
    </g>
  )
}

interface FailuresProps {
  data: { tipo: string; cantidad: number }[]
  onSegmentClick?: (tipo: string) => void
  activeTipo?: string | null
}

export function FailuresByErrorChart({ data, onSegmentClick, activeTipo }: FailuresProps) {
  if (!data.length) {
    return (
      <div
        className="rounded-xl p-5 flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', minHeight: 270 }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>Sin mensajes fallidos</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: 'var(--ink-3)' }}
      >
        Fallidos por error
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="cantidad"
            nameKey="tipo"
            cx="50%"
            cy="50%"
            outerRadius={70}
            paddingAngle={3}
            label={renderLabel}
            labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            cursor={onSegmentClick ? 'pointer' : undefined}
            onClick={(entry) => onSegmentClick?.((entry as unknown as { tipo: string }).tipo)}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={ERROR_COLORS[i % ERROR_COLORS.length]}
                opacity={activeTipo && activeTipo !== entry.tipo ? 0.3 : 1}
                stroke={activeTipo === entry.tipo ? ERROR_COLORS[i % ERROR_COLORS.length] : 'none'}
                strokeWidth={activeTipo === entry.tipo ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid var(--border-soft)', fontSize: 13, padding: '8px 12px' }}
            formatter={(v: unknown) => [`${(v as number).toLocaleString('es-EC')} mensajes fallidos`, '']}
            labelFormatter={(label: unknown) => (
              <span style={{ fontWeight: 600, color: '#334155' }}>{label as string}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
