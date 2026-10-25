import Link from "next/link";
import { CopyLink } from "@/components/admin/copy-link";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/api";
import { briefForm, visibleSections } from "@/lib/briefs/forms";

export const metadata = { title: "Briefs" };

/**
 * Briefs: scoping questions sent to one person by private link, before any work is agreed.
 * A brief is made on the API with `php artisan briefs:create <form> <name>`.
 */
export default async function BriefsPage() {
  const briefs = await api.briefs.list().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tightest md:text-4xl">Briefs</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Questions sent by private link before a project is agreed. Answers save as they are typed,
          so you can read them before the person presses Send.
        </p>
      </header>

      {briefs.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-6 text-sm text-muted-foreground">
          No briefs yet. Make one on the API server with{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">php artisan briefs:create hanna-bizflow Hanna</code>.
        </p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>For</TH>
              <TH>Answered</TH>
              <TH>Last saved</TH>
              <TH>Sent</TH>
              <TH>Link</TH>
            </TR>
          </THead>
          <TBody>
            {briefs.map((b) => {
              const form = briefForm(b.form);
              const total = form ? visibleSections(form, {}).reduce((n, s) => n + s.questions.length, 0) : null;
              return (
                <TR key={b.id}>
                  <TD>
                    <Link href={`/admin/briefs/${b.id}`} className="font-medium underline-offset-4 hover:underline">
                      {b.name}
                    </Link>
                    <div className="text-xs text-subtle">{form?.title ?? b.form}</div>
                  </TD>
                  <TD className="tabular-nums">
                    {b.answeredCount}
                    {total ? <span className="text-subtle"> of about {total}</span> : null}
                  </TD>
                  <TD className="text-muted-foreground">{b.savedAt ? when(b.savedAt) : "Not opened yet"}</TD>
                  <TD className="text-muted-foreground">{b.sentAt ? when(b.sentAt) : "Not yet"}</TD>
                  <TD className="max-w-[22rem]">
                    <CopyLink path={`/b/${b.token}`} />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Accra",
  });
}
