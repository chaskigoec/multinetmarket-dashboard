'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatDuracion(seg: number): string {
  if (seg <= 0) return '< 1s'
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  return [h ? `${h}h` : '', m ? `${m}m` : '', s ? `${s}s` : ''].filter(Boolean).join(' ')
}

interface Props {
  data: { minuto: string; cantidad: number }[]
  pico: number
  duracionSegundos: number
  tasaPromedio: number
}

export function RateChart({ data, pico, duracionSegundos, tasaPromedio }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-xl p-5 flex items-center justify-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", minHeight: 270 }}>
        <p className="text-sm" style={{ color: "var(--ink-3)" }}>Sin datos de envío por minuto</p>
      </div>
    )
  }

  const formatted = data.map(d => ({ ...d, label: d.minuto.slice(11) }))

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
          Envíos por minuto
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "var(--brand-light)", color: "var(--brand)", border: "1px solid #f5c6c6" }}>
            Pico: {pico} msg/min
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "#f1f5f9", color: "var(--ink-2)", border: "1px solid var(--border-soft)" }}>
            Duración: {formatDuracion(duracionSegundos)}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid #bbf7d0" }}>
            Promedio: {tasaPromedio} msg/min
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border-soft)", fontSize: 12 }}
            formatter={(v) => [(v as number).toLocaleString('es-EC'), 'mensajes']}
            labelFormatter={(l) => `Minuto: ${l}`}
          />
          <Line
            type="monotone"
            dataKey="cantidad"
            stroke="#1d4ed8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
