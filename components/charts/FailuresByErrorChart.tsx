'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ERROR_COLORS = ['#7c3aed', '#1d4ed8', '#ea580c', '#15803d', '#94a3b8']

export function FailuresByErrorChart({ data }: { data: { tipo: string; cantidad: number }[] }) {
  if (!data.length) {
    return (
      <div className="rounded-xl p-5 flex flex-col items-center justify-center gap-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", minHeight: 270 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="1.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Sin mensajes fallidos</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--ink-3)" }}>
        Fallidos por error
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="cantidad"
            nameKey="tipo"
            cx="50%"
            cy="50%"
            outerRadius={80}
            paddingAngle={3}
            label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => <Cell key={i} fill={ERROR_COLORS[i % ERROR_COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border-soft)", fontSize: 12 }}
            formatter={(v) => [(v as number).toLocaleString('es-EC'), 'mensajes']}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
