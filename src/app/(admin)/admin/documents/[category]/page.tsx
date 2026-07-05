import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABELS, type DocumentCategory } from "@/lib/documents/registry";
import { listDocumentsByCategory } from "@/lib/documents/api";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

function isCategory(v: string): v is DocumentCategory {
  return v in CATEGORY_LABELS;
}

const BLURBS: Record<DocumentCategory, string> = {
  invoices: "Branded, verifiable invoices generated from a work package.",
  proposals: "Bespoke project proposals and fee schedules with system-stamped authenticity.",
  quotes: "Fast, on-brand quotes for a scope before it becomes a package.",
  receipts: "Payment receipts issued once a balance clears.",
};

export default async function DocumentCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const docs = await listDocumentsByCategory(category);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <div className="eyebrow">Documents</div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
          {CATEGORY_LABELS[category]}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {BLURBS[category]}
        </p>
      </header>

      {docs.length === 0 ? (
        <EmptyState
          title={`No ${CATEGORY_LABELS[category].toLowerCase()} yet`}
          description="Author one locally, register it, and it appears here — verifiable and ready to download."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {docs.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/d/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 md:px-6"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.title}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {d.client} · {d.type} · {d.id}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="hidden text-xs text-subtle sm:block">{d.issueDate}</span>
                    <Badge variant={d.status === "valid" ? "success" : "default"}>{d.status}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
