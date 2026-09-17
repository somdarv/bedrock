import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { FileBrowser } from "@/components/files/file-browser";
import { api, ApiError } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await api.packages.get(id).catch(() => null);
  return { title: pkg ? `${pkg.title} · Files` : "Files" };
}

/** A project's files on a page of their own, with the path back through Files and the client. */
export default async function PackageFilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { id } = await params;
  const { folder } = await searchParams;

  const pkg = await api.packages.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const client = await api.clients.get(pkg.clientId).catch(() => null);

  return (
    <div className="space-y-4">
      <BackButton href={`/admin/packages/${pkg.id}`} label="Project details" />
      <FileBrowser
        mode="admin"
        layout="page"
        pkg={pkg}
        initialFolderId={folder ?? null}
        trail={[
          { label: "Files", href: "/admin/files" },
          ...(client ? [{ label: client.name, href: `/admin/files/${client.id}` }] : []),
        ]}
      />
    </div>
  );
}
