'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts'

export function DailyChart({ data }: { data: { fecha: string; entregados: number }[] }) {
  if (!data.length) {
    return (
      <div className="rounded-xl p-5 flex items-center justify-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", minHeight: 270 }}>
        <p className="text-sm" style={{ color: "var(--ink-3)" }}>Sin datos de entregas por día</p>
      </div>
    )
  }

  const formatted = data.map(d => ({ ...d, label: d.fecha.slice(5) }))

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--ink-3)" }}>
        Entregas por día
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border-soft)", fontSize: 12 }}
            formatter={(v) => [(v as number).toLocaleString('es-EC'), 'entregados']}
            labelFormatter={(l) => `Fecha: ${l}`}
          />
          <Bar dataKey="entregados" fill="#1d4ed8" radius={[4, 4, 0, 0]} barSize={32}>
            <LabelList dataKey="entregados" position="top" style={{ fontSize: 11, fill: "#64748b", fontVariantNumeric: "tabular-nums" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
