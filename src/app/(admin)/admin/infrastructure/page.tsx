import { InfrastructureView } from "@/components/admin/infrastructure-view";
import { api } from "@/lib/api";

/**
 * Infrastructure monitoring — every client's domains, SSL, hosting and sites in one place,
 * with the cross-client attention list. Entry surface for Phase 1b (see
 * bedrock-api/docs/INFRASTRUCTURE-MODULE.md); live sync arrives in Phase 2+.
 */
export default async function InfrastructurePage() {
  const [overview, clients, servers] = await Promise.all([
    api.infrastructure.overview(),
    api.clients.list(),
    api.infrastructure.listServers(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <div className="eyebrow">Admin</div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
          Infrastructure
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Domains, SSL certificates, hosting and sites for every client — tracked in one place so
          renewals never lapse. Add what a client has here; automatic monitoring fills in expiry
          dates, storage and site health.
        </p>
      </header>

      <InfrastructureView overview={overview} clients={clients} servers={servers} />
    </div>
  );
}
