import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ChevronRightIcon, FolderFilledIcon, LockIcon } from "@/components/files/icons";
import { api, ApiError } from "@/lib/api";
import { projectFilesHref, summarizeProject } from "@/lib/files/overview";
import { formatBytes, plural, shortDate } from "@/lib/files/tree";
import { statusMeta } from "@/lib/status";

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const client = await api.clients.get(clientId).catch(() => null);
  return { title: client ? `${client.name} · Files` : "Files" };
}

/** One client's projects, each a folder of its own. */
export default async function ClientFilesPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const [client, packages] = await Promise.all([
    api.clients.get(clientId).catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    }),
    api.packages.list({ clientId }),
  ]);

  const projects = packages
    .map(summarizeProject)
    .sort((a, b) => (b.lastAdded ?? "").localeCompare(a.lastAdded ?? ""));
  const files = projects.reduce((s, p) => s + p.files, 0);
  const bytes = projects.reduce((s, p) => s + p.bytes, 0);

  return (
    <section className="drive rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] p-4 text-[var(--doc-ink-body)] sm:p-7 lg:p-8">
      <nav aria-label="Folder path" className="-ml-1.5 mb-1.5 flex items-center text-sm">
        <Link
          href="/admin/files"
          className="rounded-full px-1.5 py-0.5 text-[var(--doc-ink-soft)] hover:bg-[var(--doc-fill)] hover:text-[var(--doc-ink)]"
        >
          Files
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5 text-[var(--doc-ink-soft)]" />
      </nav>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-[var(--doc-ink)] sm:text-[var(--doc-t-h2)]">
            {client.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--doc-ink-soft)] tabular-nums">
            {plural(projects.length, "project")}
            {files > 0 && ` · ${plural(files, "file")} · ${formatBytes(bytes)}`}
          </p>
        </div>
        <Link
          href={`/admin/clients/${client.id}`}
          className="inline-flex h-10 shrink-0 items-center self-start rounded-full bg-[var(--doc-fill)] px-4 text-sm font-medium text-[var(--doc-ink)] transition-colors hover:bg-[var(--doc-fill-strong)] sm:self-auto"
        >
          Client details
        </Link>
      </header>

      <div className="mt-7">
        {projects.length === 0 ? (
          <div className="rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] px-6 py-14 text-center">
            <p className="font-display text-xl font-semibold text-[var(--doc-ink)]">No projects yet</p>
            <p className="mt-2 text-[15px] text-[var(--doc-ink-soft)]">
              Files live inside a work package. Create one for {client.name} first.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-2 px-1 text-[13px] font-semibold text-[var(--doc-ink-soft)]">Projects</h2>
            <ul className="overflow-hidden rounded-[var(--doc-r-inset)]">
              {projects.map((p) => {
                const meta = statusMeta(p.status);
                return (
                  <li key={p.id} className="odd:bg-[var(--doc-fill-quiet)]">
                    <Link
                      href={projectFilesHref(p.id, null)}
                      className="flex min-h-[4.5rem] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[var(--doc-fill)] sm:px-4"
                    >
                      <FolderFilledIcon
                        className={p.files === 0 ? "text-[var(--doc-ink-soft)] opacity-50" : "text-[var(--doc-ink)]"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate text-[15px] font-semibold text-[var(--doc-ink)] sm:text-sm">
                            {p.title}
                          </span>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[var(--doc-ink-soft)] tabular-nums">
                          {p.files === 0
                            ? "No files yet"
                            : [
                                plural(p.files, "file"),
                                p.folders > 0 ? plural(p.folders, "folder") : "",
                                formatBytes(p.bytes),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                        </span>
                      </span>
                      {p.locked > 0 && (
                        <span className="hidden shrink-0 items-center gap-1 text-[13px] text-[var(--doc-ink-soft)] sm:inline-flex">
                          <LockIcon className="h-3.5 w-3.5" />
                          {p.locked} locked
                        </span>
                      )}
                      <span className="hidden w-28 shrink-0 text-right text-[13px] text-[var(--doc-ink-soft)] md:block">
                        {p.lastAdded ? `Added ${shortDate(p.lastAdded)}` : ""}
                      </span>
                      <ChevronRightIcon className="h-4 w-4 text-[var(--doc-ink-soft)]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
