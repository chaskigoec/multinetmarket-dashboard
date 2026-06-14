import Link from "next/link";
import { notFound } from "next/navigation";
import { readCampaign } from "@/lib/folder";
import { decodeId } from "@/lib/utils";
import { KPICard } from "@/components/KPICard";
import { DonutChart } from "@/components/charts/DonutChart";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { FailuresByErrorChart } from "@/components/charts/FailuresByErrorChart";
import { DailyChart } from "@/components/charts/DailyChart";
import { RateChart } from "@/components/charts/RateChart";
import { CampaignTable } from "@/components/CampaignTable";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

// SVG icons (no emojis)
const IconTotal      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconChannel    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.06 6.06l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IconDelivered  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
const IconRead       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconFailed     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
const IconReply      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>

export default async function CampaignPage({ params }: Props) {
  const { id } = await params;
  const campaign = await readCampaign(decodeId(id));
  if (!campaign) notFound();

  const { metrics, rows, nombre, fechaCampana } = campaign;
  const fecha = new Date(fechaCampana.replace(' ', 'T')).toLocaleString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  return (
    <div className="space-y-6">

      {/* Breadcrumb + Header */}
      <div className="fade-up">
        <Link href="/"
          className="breadcrumb-link inline-flex items-center gap-1.5 text-xs font-medium mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Todas las campañas
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>{nombre}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "var(--brand-light)", color: "var(--brand)", border: "1px solid #f5c6c6" }}>
                ETAPA
              </span>
              <span className="text-xs" style={{ color: "var(--ink-3)" }}>{fecha}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid #bbf7d0" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Completada
          </span>
        </div>
      </div>

      {/* KPI Cards — fila única */}
      <div className="grid grid-cols-6 gap-3 fade-up fade-up-1">
        <KPICard label="Total Destinatarios"    value={metrics.total}          icon={<IconTotal />}     accent="var(--ink-2)"   accentBg="#f1f5f9" />
        <KPICard label="Entregado por WhatsApp" value={metrics.enviadosCanal}  pct={metrics.enviadosCanalPct}  icon={<IconChannel />}   accent="var(--channel)"  accentBg="var(--channel-bg)" />
        <KPICard label="Al usuario"             value={metrics.entregados}     pct={metrics.entregadosPct}     icon={<IconDelivered />} accent="var(--success)"  accentBg="var(--success-bg)" />
        <KPICard label="Leídos"                 value={metrics.leidos}         pct={metrics.leidosPct}         icon={<IconRead />}      accent="var(--warning)"  accentBg="var(--warning-bg)" />
        <KPICard label="Respuestas"             value={metrics.respuestas}     pct={metrics.respuestasPct}     icon={<IconReply />}     accent="#7c3aed"         accentBg="#f5f3ff" />
        <KPICard label="Fallidos"               value={metrics.fallidos}       pct={metrics.fallidosPct}       icon={<IconFailed />}    accent="var(--danger)"   accentBg="var(--danger-bg)" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-up fade-up-2">
        <DonutChart total={metrics.total} enviadosCanal={metrics.enviadosCanal} entregados={metrics.entregados} fallidos={metrics.fallidos} />
        <PerformanceChart total={metrics.total} enviadosCanal={metrics.enviadosCanal} entregados={metrics.entregados} leidos={metrics.leidos} respuestas={metrics.respuestas} />
        <FailuresByErrorChart data={metrics.fallidosPorError} />
        <DailyChart data={metrics.novedadesDiarias} />
        {metrics.enviosPorMinuto.length > 0 && (
          <div className="lg:col-span-2">
            <RateChart
              data={metrics.enviosPorMinuto}
              pico={metrics.pico}
              duracionSegundos={metrics.duracionSegundos}
              tasaPromedio={metrics.tasaPromedio}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="fade-up fade-up-3">
        <CampaignTable rows={rows} />
      </div>
    </div>
  );
}
