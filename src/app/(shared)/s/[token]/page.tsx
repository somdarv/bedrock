import { cache } from "react";
import { FileBrowser } from "@/components/files/file-browser";
import { SharedFile } from "@/components/files/shared-file";
import { api, ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

// The title and the page both need the link; ask the API once per request.
const open = cache((token: string) => api.shares.open(token));

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await open(token).catch(() => null);
  return {
    title: view?.name ?? "Shared files",
    // A share link is private by being unguessable. Keep it out of search engines, and keep the
    // address out of the Referer header when a download leaves for storage.
    robots: { index: false, follow: false },
    referrer: "no-referrer" as const,
  };
}

/** A share link: a file, a folder, or a whole project's files, for anyone who holds it. */
export default async function SharedPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { token } = await params;
  const { folder } = await searchParams;

  let view;
  try {
    view = await open(token);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 410)) {
      return <LinkClosed ended={e.status === 410} />;
    }
    throw e;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (view.kind === "file") return <SharedFile view={view} token={token} apiBase={apiBase} />;
  return <FileBrowser mode="shared" view={view} token={token} apiBase={apiBase} initialFolderId={folder ?? null} />;
}

function LinkClosed({ ended }: { ended: boolean }) {
  return (
    <section className="drive mx-auto max-w-xl rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] px-6 py-16 text-center sm:px-10">
      <h1 className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-[var(--doc-ink)]">
        {ended ? "This link has ended" : "This link is not active"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--doc-ink-soft)]">
        Ask the person who sent it for a new one.
      </p>
    </section>
  );
}
