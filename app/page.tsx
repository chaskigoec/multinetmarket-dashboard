import { readAllCampaigns } from "@/lib/folder";
import { CampaignList } from "@/components/CampaignList";
import { RefreshButton } from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const campaigns = await readAllCampaigns();

  return (
    <div>
      <div className="mb-6 fade-up flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            Historial de campañas
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
            {campaigns.length} campaña{campaigns.length !== 1 ? "s" : ""} encontrada{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="fade-up fade-up-1">
        <CampaignList campaigns={campaigns} />
      </div>
    </div>
  );
}
