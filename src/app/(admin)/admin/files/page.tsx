import { FilesOverview } from "@/components/files/files-overview";
import { api } from "@/lib/api";
import { buildOverview } from "@/lib/files/overview";

export const metadata = { title: "Files" };

export default async function FilesPage() {
  const [clients, packages, links] = await Promise.all([
    api.clients.list(),
    api.packages.list(),
    // The list is a convenience. If it cannot be read, the files page still opens.
    api.shares.list().catch(() => []),
  ]);
  const { clients: summaries, files } = buildOverview(clients, packages);
  return <FilesOverview clients={summaries} files={files} links={links} />;
}
