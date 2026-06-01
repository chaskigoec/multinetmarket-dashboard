interface KPICardProps {
  label: string
  value: number
  pct?: number
  accent: string
  accentBg: string
  icon: React.ReactNode
}

export function KPICard({ label, value, pct, accent, accentBg, icon }: KPICardProps) {
  return (
    <div className="kpi-card rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}>

      {/* Top row: icon */}
      <div className="flex items-center justify-between">
        <span className="section-label">{label}</span>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: accentBg, color: accent }}>
          {icon}
        </span>
      </div>

      {/* Number */}
      <p className="stat-num" style={{ color: "var(--ink)" }}>
        {value.toLocaleString('es-EC')}
      </p>

      {/* Progress bar */}
      {pct !== undefined && (
        <div>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#eef0f3" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct, 100)}%`, background: accent }} />
          </div>
          <p className="text-xs tabular font-semibold mt-1" style={{ color: accent }}>
            {pct.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  )
}
