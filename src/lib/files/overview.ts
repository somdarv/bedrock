import type { Client, DeliverableType, WorkPackage, WorkPackageStatus } from "@/lib/api/types";
import { pathTo } from "./tree";

/**
 * The whole repository at a glance: every client as a folder, every project inside it, and a
 * flat list of files to search. Built on the server from the lists the admin already loads, and
 * trimmed to what the Files pages show, so the browser receives names and numbers rather than
 * every package's payments and line items.
 */

export interface FileIndexEntry {
  id: string;
  name: string;
  type: DeliverableType;
  size: number | null;
  createdAt: string;
  previewUrl: string | null;
  hasPreview: boolean;
  locked: boolean;
  packageId: string;
  packageTitle: string;
  clientName: string;
  folderId: string | null;
  /** "Logos / Final", or "" at the project root. */
  folderPath: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: WorkPackageStatus;
  files: number;
  folders: number;
  bytes: number;
  locked: number;
  lastAdded: string | null;
}

export interface ClientSummary {
  id: string;
  name: string;
  projects: ProjectSummary[];
  files: number;
  bytes: number;
  lastAdded: string | null;
}

const latest = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

export function summarizeProject(p: WorkPackage): ProjectSummary {
  let bytes = 0;
  let locked = 0;
  let lastAdded: string | null = null;
  for (const f of p.deliverables) {
    bytes += f.size ?? 0;
    if (f.locked && !f.archived) locked++;
    lastAdded = latest(lastAdded, f.createdAt);
  }
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    files: p.deliverables.length,
    folders: (p.folders ?? []).length,
    bytes,
    locked,
    lastAdded,
  };
}

export function buildOverview(clients: Client[], packages: WorkPackage[]) {
  const names = new Map(clients.map((c) => [c.id, c.name]));
  const byClient = new Map<string, ClientSummary>(
    clients.map((c) => [c.id, { id: c.id, name: c.name, projects: [], files: 0, bytes: 0, lastAdded: null }]),
  );
  const files: FileIndexEntry[] = [];

  for (const p of packages) {
    const summary = byClient.get(p.clientId);
    const project = summarizeProject(p);
    if (summary) {
      summary.projects.push(project);
      summary.files += project.files;
      summary.bytes += project.bytes;
      summary.lastAdded = latest(summary.lastAdded, project.lastAdded);
    }
    for (const f of p.deliverables) {
      files.push({
        id: f.id,
        name: f.filename,
        type: f.type,
        size: f.size,
        createdAt: f.createdAt,
        previewUrl: f.previewUrl,
        hasPreview: f.hasPreview,
        locked: f.locked,
        packageId: p.id,
        packageTitle: p.title,
        clientName: names.get(p.clientId) ?? "Unknown client",
        folderId: f.folderId,
        folderPath: pathTo(p.folders ?? [], f.folderId)
          .map((d) => d.name)
          .join(" / "),
      });
    }
  }

  // Busiest first: the client whose work arrived most recently, then the ones with none.
  const ordered = [...byClient.values()].sort((a, b) => {
    if (a.lastAdded && b.lastAdded) return b.lastAdded.localeCompare(a.lastAdded);
    if (a.lastAdded || b.lastAdded) return a.lastAdded ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const c of ordered) {
    c.projects.sort((a, b) => (b.lastAdded ?? "").localeCompare(a.lastAdded ?? ""));
  }
  files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { clients: ordered, files };
}

export function projectFilesHref(packageId: string, folderId: string | null) {
  return `/admin/packages/${packageId}/files${folderId ? `?folder=${folderId}` : ""}`;
}
