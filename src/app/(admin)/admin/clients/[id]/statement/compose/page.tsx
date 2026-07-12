import { notFound } from "next/navigation";
import { StatementComposer } from "@/components/admin/statement-composer";
import { api, ApiError } from "@/lib/api";

/**
 * Compose an Infrastructure Status Statement for a client: the live monitored assets are pulled
 * in with their auto-recommendations pre-filled; the operator chooses what to show, edits the
 * wording, then previews the PDF before it's prepared/sent. (See INFRASTRUCTURE-MODULE.md.)
 */
export default async function ComposeStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const [client, assets] = await Promise.all([
      api.clients.get(id),
      api.infrastructure.listAssets(id),
    ]);

    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <div className="eyebrow">Infrastructure statement</div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
            {client.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Pulled live from monitoring. Choose what to include, adjust the wording, then preview the
            document. Nothing is sent from here — you&apos;ll prepare and send once it reads right.
          </p>
        </header>

        <StatementComposer
          clientId={client.id}
          assets={assets}
          contacts={client.contacts ?? []}
          defaultTitle={`Infrastructure status — ${new Date().toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          })}`}
        />
      </div>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
