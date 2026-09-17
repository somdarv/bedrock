"use client";

import * as React from "react";
import Link from "next/link";
import type { ClientSummary, FileIndexEntry } from "@/lib/files/overview";
import { projectFilesHref } from "@/lib/files/overview";
import { formatBytes, plural, shortDate } from "@/lib/files/tree";
import { cn } from "@/lib/utils";
import { FieldPill } from "./drive-ui";
import { ChevronRightIcon, FileGlyph, FolderFilledIcon, LockIcon, SearchIcon } from "./icons";

/**
 * /admin/files: the repository's front door. What arrived lately comes first, because that is
 * what the operator usually came for; then every client as a folder. The search looks through
 * every file in every project.
 */
export function FilesOverview({
  clients,
  files,
}: {
  clients: ClientSummary[];
  files: FileIndexEntry[];
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const totalBytes = clients.reduce((s, c) => s + c.bytes, 0);
  const withFiles = clients.filter((c) => c.files > 0);
  const recent = files.slice(0, 6);

  const results = React.useMemo(() => {
    if (!q) return [];
    return files
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.packageTitle.toLowerCase().includes(q) ||
          f.clientName.toLowerCase().includes(q),
      )
      .slice(0, 200);
  }, [files, q]);

  return (
    <section className="drive rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] p-4 text-[var(--doc-ink-body)] sm:p-7 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[1.875rem] leading-tight font-semibold tracking-[-0.03em] text-[var(--doc-ink)] sm:text-[var(--doc-t-h1)]">
            Files
          </h1>
          <p className="mt-1 text-sm text-[var(--doc-ink-soft)] tabular-nums">
            {files.length === 0
              ? "No work stored yet"
              : `${plural(files.length, "file")} · ${formatBytes(totalBytes)} across ${plural(withFiles.length, "client")}`}
          </p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--doc-ink-soft)]" />
          <FieldPill
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a file, project or client"
            aria-label="Search all files"
            className="pl-10"
          />
        </div>
      </header>

      {q ? (
        <div className="mt-6">
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-[var(--doc-ink-soft)]">
            {results.length === 0 ? `Nothing matches “${query.trim()}”` : results.length === 1 ? "1 match" : `${results.length} matches`}
          </h2>
          {results.length > 0 && (
            <ul className="overflow-hidden rounded-[var(--doc-r-inset)]">
              {results.map((f) => (
                <li key={f.id} className="odd:bg-[var(--doc-fill-quiet)]">
                  <Link
                    href={projectFilesHref(f.packageId, f.folderId)}
                    className="flex min-h-16 items-center gap-3 px-3 py-2 transition-colors hover:bg-[var(--doc-fill)] sm:px-4"
                  >
                    <Thumb entry={f} className="h-11 w-11 rounded-[0.7rem]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-[var(--doc-ink)] sm:text-sm">{f.name}</span>
                      <span className="block truncate text-xs text-[var(--doc-ink-soft)]">
                        {[f.clientName, f.packageTitle, f.folderPath].filter(Boolean).join(" / ")}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-[13px] text-[var(--doc-ink-soft)] tabular-nums sm:block">
                      {formatBytes(f.size)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {recent.length > 0 && (
            <div className="mt-7">
              <h2 className="mb-2 px-1 text-[13px] font-semibold text-[var(--doc-ink-soft)]">Added lately</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
                {recent.map((f) => (
                  <Link
                    key={f.id}
                    href={projectFilesHref(f.packageId, f.folderId)}
                    className="group flex flex-col rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] p-1.5 transition-colors hover:bg-[var(--doc-fill)]"
                  >
                    <Thumb entry={f} className="aspect-[4/3] w-full rounded-[0.8rem]" large />
                    <span className="truncate px-1.5 pt-2 text-sm font-medium text-[var(--doc-ink)]">{f.name}</span>
                    <span className="truncate px-1.5 pb-1 text-xs text-[var(--doc-ink-soft)]">
                      {f.clientName} · {shortDate(f.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-2 px-1 text-[13px] font-semibold text-[var(--doc-ink-soft)]">Clients</h2>
            {clients.length === 0 ? (
              <p className="rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] px-6 py-12 text-center text-[15px] text-[var(--doc-ink-soft)]">
                Add a client and a work package, then upload the work to it.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-[var(--doc-r-inset)]">
                {clients.map((c) => (
                  <li key={c.id} className="odd:bg-[var(--doc-fill-quiet)]">
                    <Link
                      href={`/admin/files/${c.id}`}
                      className={cn(
                        "flex min-h-16 items-center gap-3 px-3 py-2 transition-colors hover:bg-[var(--doc-fill)] sm:px-4",
                        c.files === 0 && "text-[var(--doc-ink-soft)]",
                      )}
                    >
                      <FolderFilledIcon className={c.files === 0 ? "text-[var(--doc-ink-soft)] opacity-50" : "text-[var(--doc-ink)]"} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[15px] font-semibold sm:text-sm", c.files > 0 && "text-[var(--doc-ink)]")}>
                          {c.name}
                        </span>
                        <span className="block truncate text-xs text-[var(--doc-ink-soft)] tabular-nums">
                          {c.files === 0
                            ? `${plural(c.projects.length, "project")}, no files yet`
                            : `${plural(c.projects.length, "project")} · ${plural(c.files, "file")}`}
                          <span className="sm:hidden">{c.files > 0 && ` · ${formatBytes(c.bytes)}`}</span>
                        </span>
                      </span>
                      <span className="hidden w-20 shrink-0 text-right text-[13px] text-[var(--doc-ink-soft)] tabular-nums sm:block">
                        {c.files > 0 ? formatBytes(c.bytes) : ""}
                      </span>
                      <span className="hidden w-28 shrink-0 text-right text-[13px] text-[var(--doc-ink-soft)] md:block">
                        {c.lastAdded ? `Added ${shortDate(c.lastAdded)}` : ""}
                      </span>
                      <ChevronRightIcon className="h-4 w-4 text-[var(--doc-ink-soft)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Thumb({ entry, className, large }: { entry: FileIndexEntry; className?: string; large?: boolean }) {
  const [broken, setBroken] = React.useState(false);
  return (
    <span className={cn("relative block shrink-0 overflow-hidden bg-[var(--doc-paper)]", className)}>
      {entry.hasPreview && entry.previewUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.previewUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <FileGlyph filename={entry.name} type={entry.type} size={large ? "md" : "sm"} />
      )}
      {large && entry.locked && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#fffffff0] px-2 py-0.5 text-[11px] font-medium text-[#12110f]">
          <LockIcon className="h-3 w-3" /> Locked
        </span>
      )}
    </span>
  );
}
