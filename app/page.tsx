import { readAllCampaigns } from "@/lib/folder";
import { CampaignList } from "@/components/CampaignList";
import { RefreshButton } from "@/components/RefreshButton";
import { KPICard } from "@/components/KPICard";
import { DonutChart } from "@/components/charts/DonutChart";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { FailuresByErrorChart } from "@/components/charts/FailuresByErrorChart";
import { DailyChart } from "@/components/charts/DailyChart";

export const dynamic = "force-dynamic";

const IconCampaign = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
  </svg>
)

export default async function Home() {
  const campaigns = await readAllCampaigns();

  const summary = campaigns.reduce((acc, campaign) => {
    acc.total += campaign.metrics.total;
    acc.enviadosCanal += campaign.metrics.enviadosCanal;
    acc.entregados += campaign.metrics.entregados;
    acc.leidos += campaign.metrics.leidos;
    acc.respuestas += campaign.metrics.respuestas;
    acc.fallidos += campaign.metrics.fallidos;

    campaign.metrics.fallidosPorError.forEach(({ tipo, cantidad }) => {
      acc.fallidosPorError[tipo] = (acc.fallidosPorError[tipo] ?? 0) + cantidad;
    });

    campaign.metrics.novedadesDiarias.forEach(({ fecha, entregados }) => {
      acc.novedadesDiarias[fecha] = (acc.novedadesDiarias[fecha] ?? 0) + entregados;
    });

    return acc;
  }, {
    total: 0,
    enviadosCanal: 0,
    entregados: 0,
    leidos: 0,
    respuestas: 0,
    fallidos: 0,
    fallidosPorError: {} as Record<string, number>,
    novedadesDiarias: {} as Record<string, number>,
  });

  const fallidosPorError = Object.entries(summary.fallidosPorError)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const novedadesDiarias = Object.entries(summary.novedadesDiarias)
    .map(([fecha, entregados]) => ({ fecha, entregados }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="space-y-8">
      <div className="fade-up">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase font-semibold tracking-[0.24em]" style={{ color: "var(--brand)" }}>
              Dashboard Mensajes Masivos
            </p>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
              Analítica de campañas de marketing
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-3)" }}>
              {campaigns.length} campaña{campaigns.length !== 1 ? "s" : ""} cargada{campaigns.length !== 1 ? "s" : ""} en el sistema.
            </p>
          </div>
          <RefreshButton />
        </div>
      </div>

      {campaigns.length > 0 && (
        <>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 fade-up fade-up-1">
            <KPICard label="Campañas" value={campaigns.length} icon={<IconCampaign />} accent="var(--brand)" accentBg="#eff6ff" />
            <KPICard label="Total mensajes" value={summary.total} icon={<IconCampaign />} accent="var(--ink)" accentBg="#f8fafc" />
            <KPICard label="Mensajes entregados" value={summary.entregados} pct={summary.total ? Math.round(summary.entregados / summary.total * 1000) / 10 : 0} icon={<IconCampaign />} accent="var(--success)" accentBg="var(--success-bg)" />
            <KPICard label="WhatsApp canal" value={summary.enviadosCanal} pct={summary.total ? Math.round(summary.enviadosCanal / summary.total * 1000) / 10 : 0} icon={<IconCampaign />} accent="var(--channel)" accentBg="var(--channel-bg)" />
            <KPICard label="Leídos" value={summary.leidos} pct={summary.total ? Math.round(summary.leidos / summary.total * 1000) / 10 : 0} icon={<IconCampaign />} accent="var(--warning)" accentBg="var(--warning-bg)" />
            <KPICard label="Respuestas" value={summary.respuestas} pct={summary.total ? Math.round(summary.respuestas / summary.total * 1000) / 10 : 0} icon={<IconCampaign />} accent="#7c3aed" accentBg="#f5f3ff" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 fade-up fade-up-2">
            <DonutChart total={summary.total} enviadosCanal={summary.enviadosCanal} entregados={summary.entregados} fallidos={summary.fallidos} />
            <PerformanceChart total={summary.total} enviadosCanal={summary.enviadosCanal} entregados={summary.entregados} leidos={summary.leidos} respuestas={summary.respuestas} />
            <FailuresByErrorChart data={fallidosPorError} />
            <DailyChart data={novedadesDiarias} />
          </div>
        </>
      )}

      <div className="fade-up fade-up-3">
        <CampaignList campaigns={campaigns} />
      </div>
    </div>
  );
}
