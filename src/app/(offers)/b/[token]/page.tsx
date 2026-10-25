import { cache } from "react";
import { BriefFormView } from "@/components/briefs/brief-form";
import { api, ApiError } from "@/lib/api";
import { briefForm } from "@/lib/briefs/forms";

export const dynamic = "force-dynamic";

// The title and the page both need the brief; ask the API once per request.
const open = cache((token: string) => api.briefs.open(token));

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const brief = await open(token).catch(() => null);
  const form = brief ? briefForm(brief.form) : null;
  return {
    // Absolute: the person answering is a client, not an operator, so no "Bedrock" in the tab.
    title: { absolute: `${form?.title ?? "Questions"} · SaharaBase` },
    // Private by being unguessable: keep it out of search engines and out of the Referer header.
    robots: { index: false, follow: false },
    referrer: "no-referrer" as const,
  };
}

/** A brief: scoping questions for one person, answered from a private link. */
export default async function BriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let brief;
  try {
    brief = await open(token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return <LinkClosed />;
    throw e;
  }

  if (!briefForm(brief.form)) return <LinkClosed />;

  return <BriefFormView token={token} initial={brief} />;
}

function LinkClosed() {
  return (
    <section className="drive mx-auto my-16 max-w-xl rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] px-6 py-16 text-center sm:px-10">
      <h1 className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-[var(--doc-ink)]">
        This link is not active
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--doc-ink-soft)]">
        Ask the person who sent it for a new one.
      </p>
    </section>
  );
}
