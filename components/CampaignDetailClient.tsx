'use client'

import { useState } from 'react'
import { CampaignMetrics, CampaignRow, TableFilter } from '@/lib/excel'
import { DonutChart } from './charts/DonutChart'
import { PerformanceChart } from './charts/PerformanceChart'
import { FailuresByErrorChart } from './charts/FailuresByErrorChart'
import { DailyChart } from './charts/DailyChart'
import { CampaignTable } from './CampaignTable'

function filterLabel(f: TableFilter): string {
  if (f.type === 'donut') return f.key === 'usuario' ? 'Entregados al usuario' : 'Fallidos'
  return f.tipo
}

export function CampaignDetailClient({
  metrics,
  rows,
}: {
  metrics: CampaignMetrics
  rows: CampaignRow[]
}) {
  const [activeFilter, setActiveFilter] = useState<TableFilter | null>(null)

  function toggle(next: TableFilter) {
    setActiveFilter(f => {
      if (!f) return next
      if (f.type === 'donut' && next.type === 'donut' && f.key === next.key) return null
      if (f.type === 'error' && next.type === 'error' && f.tipo === next.tipo) return null
      return next
    })
  }

  const donutActiveKey = activeFilter?.type === 'donut' ? activeFilter.key : null
  const errorActiveTipo = activeFilter?.type === 'error' ? activeFilter.tipo : null

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-up fade-up-2">
        <DonutChart
          total={metrics.total}
          enviadosCanal={metrics.enviadosCanal}
          entregados={metrics.entregados}
          fallidos={metrics.fallidos}
          onSegmentClick={key => toggle({ type: 'donut', key: key as 'usuario' | 'fallidos' })}
          activeKey={donutActiveKey}
        />
        <PerformanceChart
          total={metrics.total}
          enviadosCanal={metrics.enviadosCanal}
          entregados={metrics.entregados}
          leidos={metrics.leidos}
          respuestas={metrics.respuestas}
        />
        <FailuresByErrorChart
          data={metrics.fallidosPorError}
          onSegmentClick={tipo => toggle({ type: 'error', tipo })}
          activeTipo={errorActiveTipo}
        />
        <DailyChart data={metrics.novedadesDiarias} />
      </div>

      <div className="fade-up fade-up-3">
        {activeFilter && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--ink-3)' }}>
              Filtrando:
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid #f5c6c6' }}
            >
              {filterLabel(activeFilter)}
              <button
                onClick={() => setActiveFilter(null)}
                className="leading-none transition-opacity hover:opacity-60"
                aria-label="Limpiar filtro"
              >
                ✕
              </button>
            </span>
          </div>
        )}
        <CampaignTable rows={rows} externalFilter={activeFilter} />
      </div>
    </>
  )
}
