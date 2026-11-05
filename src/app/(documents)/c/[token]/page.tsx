import { cache } from "react";
import { hasDocumentBody, renderDocumentBody } from "@/components/documents/bodies";
import { ContractFrame } from "@/components/documents/contract-signing";
import { api, ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

// The title and the page both need the contract; ask the API once per request.
const open = cache((token: string) => api.contracts.open(token));

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await open(token).catch(() => null);
  return {
    title: { absolute: `${record?.title ?? "Contract"} · SaharaBase` },
    // Private by being unguessable: keep it out of search engines and out of the Referer header.
    robots: { index: false, follow: false },
    referrer: "no-referrer" as const,
  };
}

/** A contract to read and sign, from a private link. See `contract-signing.tsx`. */
export default async function ContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let record;
  try {
    record = await open(token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return <LinkClosed />;
    throw e;
  }
  if (!hasDocumentBody(record.id)) return <LinkClosed />;

  return (
    <ContractFrame
      token={token}
      record={record}
      filename={`${record.id}-${record.client.replace(/[^a-z0-9]+/gi, "-")}`}
    >
      {renderDocumentBody(record)}
    </ContractFrame>
  );
}

function LinkClosed() {
  return (
    <div className="doc-page">
      <section className="mx-auto my-16 max-w-xl rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] px-6 py-16 text-center sm:px-10">
        <h1 className="text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-[var(--doc-ink)]">
          This link is not active
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--doc-ink-soft)]">
          Ask the person who sent it for a new one.
        </p>
      </section>
    </div>
  );
}
