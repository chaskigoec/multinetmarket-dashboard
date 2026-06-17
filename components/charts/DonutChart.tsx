'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DonutChartProps {
  total: number
  enviadosCanal: number
  entregados: number
  fallidos: number
  onSegmentClick?: (key: string) => void
  activeKey?: string | null
}

export function DonutChart({ total, entregados, fallidos, onSegmentClick, activeKey }: DonutChartProps) {
  // El 100% es entre entregados al usuario + fallidos
  const subtotal = entregados + fallidos
  const pct = (n: number) => subtotal > 0 ? Number((n / subtotal * 100).toFixed(1)) : 0

  const segments = [
    { key: 'usuario',  label: 'Entregado al usuario', value: entregados, color: '#15803d', pct: pct(entregados) },
    { key: 'fallidos', label: 'Fallidos',              value: fallidos,   color: '#b91c1c', pct: pct(fallidos)   },
  ].filter(s => s.value > 0)

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "var(--ink-3)" }}>
        Estado de operación
      </p>

      <div className="flex items-center gap-5">

        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
          {segments.length > 0 ? (
            <>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={segments}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={76}
                    paddingAngle={segments.length > 1 ? 3 : 0}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    cursor={onSegmentClick ? 'pointer' : undefined}
                    onClick={(entry) => onSegmentClick?.((entry as { key: string }).key)}
                  >
                    {segments.map((s, i) => (
                      <Cell
                        key={i}
                        fill={s.color}
                        opacity={activeKey && activeKey !== s.key ? 0.3 : 1}
                        stroke={activeKey === s.key ? s.color : 'none'}
                        strokeWidth={activeKey === s.key ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border-soft)", fontSize: 12 }}
                    formatter={(v, _n, props) => [
                      `${(v as number).toLocaleString('es-EC')} mensajes (${pct(v as number).toFixed(1)}% del total)`,
                      (props.payload as { label?: string })?.label ?? '',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Total en centro */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold tabular leading-none" style={{ color: "var(--ink)" }}>
                  {total.toLocaleString('es-EC')}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: "var(--ink-3)" }}>total</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center"
              style={{ border: "10px solid #f1f5f9" }}>
              <span className="text-xs text-center px-3" style={{ color: "var(--ink-3)" }}>Sin datos</span>
            </div>
          )}
        </div>

        {/* Leyenda — porcentaje siempre sobre el total */}
        <div className="flex flex-col gap-3.5 flex-1 min-w-0">
          {segments.map(s => (
            <div
              key={s.key}
              onClick={() => onSegmentClick?.(s.key)}
              style={{ cursor: onSegmentClick ? 'pointer' : undefined, opacity: activeKey && activeKey !== s.key ? 0.4 : 1, transition: 'opacity 0.15s' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color, outline: activeKey === s.key ? `2px solid ${s.color}` : 'none', outlineOffset: 1 }} />
                  <span className="text-xs truncate" style={{ color: "var(--ink-2)" }}>{s.label}</span>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-xs font-bold tabular" style={{ color: s.color }}>
                    {s.pct.toFixed(1)}%
                  </span>
                  <span className="text-xs tabular" style={{ color: "var(--ink-3)" }}>
                    {s.value.toLocaleString('es-EC')}
                  </span>
                </div>
              </div>
              {/* Barra = % del total */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-1" style={{ borderTop: "1px solid var(--border-soft)" }}>
            <span className="text-[10px]" style={{ color: "var(--ink-3)" }}>Total medidos</span>
            <span className="text-[10px] font-semibold tabular" style={{ color: "var(--ink-2)" }}>
              {subtotal.toLocaleString('es-EC')} · 100%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
