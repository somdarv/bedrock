import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { PlanBoard } from "@/components/plan/plan-board";
import { api, ApiError } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await api.packages.get(id).catch(() => null);
  return { title: pkg ? `${pkg.title} · Plan` : "Plan" };
}

/** A project's plan on a page of its own, with the path back through Files and the client. */
export default async function PackagePlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const pkg = await api.packages.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const client = await api.clients.get(pkg.clientId).catch(() => null);

  return (
    <div className="space-y-4">
      <BackButton href={`/admin/packages/${pkg.id}`} label="Project details" />
      <PlanBoard
        mode="admin"
        layout="page"
        pkg={pkg}
        trail={[
          { label: "Files", href: "/admin/files" },
          ...(client ? [{ label: client.name, href: `/admin/files/${client.id}` }] : []),
        ]}
      />
    </div>
  );
}
