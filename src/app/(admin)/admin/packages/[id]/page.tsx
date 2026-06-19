import { notFound } from "next/navigation";
import { PackageDetail } from "@/components/admin/package-detail";
import { api, ApiError } from "@/lib/api";

export default async function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const pkg = await api.packages.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const client = await api.clients.get(pkg.clientId).catch(() => null);

  return <PackageDetail pkg={pkg} clientName={client?.name ?? "Unknown client"} />;
}
