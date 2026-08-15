import { notFound } from "next/navigation";
import { PackageDetail } from "@/components/admin/package-detail";
import { api, ApiError } from "@/lib/api";

export default async function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const pkg = await api.packages.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  // The savings rate is only needed to tell the operator what a payment will hold back, so a
  // savings outage must not take the package page down with it.
  const [client, savings] = await Promise.all([
    api.clients.get(pkg.clientId).catch(() => null),
    api.savings.get().catch(() => null),
  ]);

  return (
    <PackageDetail
      pkg={pkg}
      clientName={client?.name ?? "Unknown client"}
      contacts={client?.contacts ?? []}
      savingsRate={savings?.ratePercent ?? 0}
    />
  );
}
