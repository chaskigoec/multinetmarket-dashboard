import { readAllCampaigns } from "@/lib/folder";
import { CampaignList } from "@/components/CampaignList";
import { RefreshButton } from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const campaigns = await readAllCampaigns();

  return (
    <div className="space-y-6">
      <div className="fade-up flex items-end justify-between">
        <div>
          <p className="text-xs uppercase font-semibold tracking-[0.24em]" style={{ color: "var(--brand)" }}>
            Dashboard Mensajes Masivos
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            Campañas
          </h1>
        </div>
        <RefreshButton />
      </div>

      <div className="fade-up fade-up-1">
        <CampaignList campaigns={campaigns} />
      </div>
    </div>
  );
}
