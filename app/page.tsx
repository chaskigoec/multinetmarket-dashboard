import Link from "next/link";
import { readAllCampaigns } from "@/lib/folder";
import { CampaignList } from "@/components/CampaignList";
import { RefreshButton } from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const campaigns = await readAllCampaigns();

  return (
    <div className="space-y-6">
      <div className="fade-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase font-semibold tracking-[0.24em]" style={{ color: "var(--brand)" }}>
            Dashboard Mensajes Masivos
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            Campañas
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-3)" }}>
            {campaigns.length} campaña{campaigns.length !== 1 ? "s" : ""} cargada{campaigns.length !== 1 ? "s" : ""} en el sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Subir campaña
          </Link>
        </div>
      </div>

      <div className="fade-up fade-up-1">
        <CampaignList campaigns={campaigns} />
      </div>
    </div>
  );
}
