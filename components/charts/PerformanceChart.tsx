'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts'

interface PerformanceChartProps {
  total: number
  enviadosCanal: number
  entregados: number
  leidos: number
  respuestas: number
}

export function PerformanceChart({ total, enviadosCanal, entregados, leidos, respuestas }: PerformanceChartProps) {
  const pct = (n: number) => total > 0 ? Math.round(n / total * 1000) / 10 : 0

  const data = [
    { name: 'Total',               value: total,         pct: 100,               color: '#334155' },
    { name: 'Entregado por WhatsApp', value: enviadosCanal, pct: pct(enviadosCanal), color: '#1d4ed8' },
    { name: 'Al usuario',          value: entregados,    pct: pct(entregados),    color: '#15803d' },
    { name: 'Leídos',              value: leidos,        pct: pct(leidos),        color: '#b45309' },
    { name: 'Respuestas',          value: respuestas,    pct: pct(respuestas),    color: '#7c3aed' },
  ]

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--ink-3)" }}>
        Rendimiento
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 72, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" domain={[0, total]} hide />
          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border-soft)", fontSize: 12 }}
            formatter={(v, _n, props) => [
              `${(v as number).toLocaleString('es-EC')} (${(props.payload as { pct?: number })?.pct ?? 0}%)`,
              (props.payload as { name?: string })?.name ?? '',
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            <LabelList
              content={({ x, y, width, height, value, index }) => {
                const d = data[index as number]
                return (
                  <text
                    x={Number(x) + Number(width) + 8}
                    y={Number(y) + Number(height) / 2 + 4}
                    fontSize={12}
                    fill="#64748b"
                  >
                    {Number(value).toLocaleString('es-EC')}{' '}
                    <tspan fill={d.color} fontWeight="600">({d.pct}%)</tspan>
                  </text>
                )
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
