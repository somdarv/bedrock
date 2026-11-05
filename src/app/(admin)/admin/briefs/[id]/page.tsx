import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/admin/copy-link";
import { api, ApiError, type Brief, type BriefAnswers, type BriefFile } from "@/lib/api";
import { briefForm, formParts, isAnswered, type FormPart, type Question } from "@/lib/briefs/forms";
import { formatBytes } from "@/lib/files/tree";

export const metadata = { title: "Brief" };

/**
 * One brief's answers, set against the questions. Every question is listed, including the ones
 * the person's earlier answers hid from them, so the reader sees what was skipped as well.
 *
 * A needs list reads part by part, with each part's state and the files sent for each question.
 * Weeks with nothing in them yet are gathered on one line instead of thirteen empty boxes.
 */
export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brief = await api.briefs.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const form = briefForm(brief.form);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-4">
        <Link href="/admin/briefs" className="text-sm text-muted-foreground hover:text-foreground">
          All briefs
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tightest md:text-4xl">{brief.name}</h1>
        <p className="text-sm text-muted-foreground">
          {form?.title ?? brief.form}
          {brief.projectTitle ? `, for ${brief.projectTitle}` : ""}. {brief.answeredCount} answered.{" "}
          {form?.layout === "parts"
            ? `${brief.partsSent ?? 0} of ${brief.partsTotal ?? 0} parts sent, ${brief.partsReceived ?? 0} received.`
            : brief.sentAt
              ? `Sent ${when(brief.sentAt)}.`
              : "Not sent yet."}
          {brief.savedAt ? ` Last saved ${when(brief.savedAt)}.` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <CopyLink path={`/b/${brief.token}`} />
          {brief.workPackageId && (
            <Link
              href={`/admin/packages/${brief.workPackageId}#plan`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              The project&rsquo;s plan
            </Link>
          )}
        </div>
      </header>

      {!form ? (
        <p className="text-sm text-muted-foreground">
          The question set &ldquo;{brief.form}&rdquo; is not in this build, so only the raw answers can be shown.
        </p>
      ) : form.layout === "parts" ? (
        <NeedsListAnswers brief={brief} parts={formParts(form)} />
      ) : (
        form.sections.map((section, i) => (
          <section key={section.title} className="rounded-xl border border-border bg-surface">
            <h2 className="border-b border-border px-5 py-4 font-display text-lg font-semibold">
              <span className="mr-2 text-subtle tabular-nums">{i + 1}</span>
              {section.title}
            </h2>
            <dl className="divide-y divide-border">
              {section.questions.map((q) => (
                <div key={q.id} className="grid gap-1 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
                  <dt className="text-sm text-muted-foreground">
                    <span className="mr-2 font-mono text-xs text-subtle">{q.id}</span>
                    {q.text}
                  </dt>
                  <dd className="text-sm">
                    <Answer question={q} answers={brief.answers} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))
      )}
    </div>
  );
}

function NeedsListAnswers({ brief, parts }: { brief: Brief; parts: FormPart[] }) {
  const files = brief.files ?? [];
  const states = brief.parts ?? {};
  const touched = (p: FormPart) =>
    Boolean(states[p.key]?.sentAt) ||
    p.questions.some((q) => hasTyped(q, brief.answers) || files.some((f) => f.question === q.id));

  // Repeated parts with nothing in them yet, gathered by group: "Every week: 4, 5, 6".
  const idle = new Map<string, { title: string; label: string; ns: number[] }>();
  for (const p of parts) {
    if (p.repeat && !touched(p)) {
      const g = idle.get(p.repeat.group) ?? { title: p.repeat.groupTitle, label: p.repeat.label, ns: [] };
      g.ns.push(p.repeat.n);
      idle.set(p.repeat.group, g);
    }
  }

  return (
    <div className="space-y-6">
      {parts
        .filter((p) => p.tracked && (!p.repeat || touched(p)))
        .map((p) => {
          const state = states[p.key];
          return (
            <section key={p.key} className="rounded-xl border border-border bg-surface">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-4">
                <h2 className="font-display text-lg font-semibold">
                  {p.repeat ? `${p.repeat.groupTitle}: ${p.title}` : p.title}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {state?.received
                    ? "Received"
                    : state?.sentAt
                      ? `Sent ${when(state.sentAt)}`
                      : "Not sent"}
                </span>
              </div>
              <dl className="divide-y divide-border">
                {p.questions
                  .filter((q) => q.kind !== "note")
                  .map((q) => (
                    <div key={q.id} className="grid gap-1 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
                      <dt className="text-sm text-muted-foreground">{q.text}</dt>
                      <dd className="space-y-2 text-sm">
                        {q.kind !== "file" && <Answer question={q} answers={brief.answers} quietBlank={q.kind === "either"} />}
                        {(q.kind === "file" || q.kind === "either") && (
                          <Files
                            packageId={brief.workPackageId ?? null}
                            files={files.filter((f) => f.question === q.id)}
                            quietBlank={q.kind === "either" && hasTyped(q, brief.answers)}
                          />
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
            </section>
          );
        })}

      {[...idle.values()].map((g) => (
        <p key={g.title} className="rounded-lg border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
          {g.title}: nothing yet for {g.label.toLowerCase()} {g.ns.join(", ")}.
        </p>
      ))}
    </div>
  );
}

function Answer({
  question: q,
  answers,
  quietBlank = false,
}: {
  question: Question;
  answers: BriefAnswers;
  quietBlank?: boolean;
}) {
  const hidden = q.showIf ? !q.showIf(answers) : false;
  if (!hasTyped(q, answers)) {
    return quietBlank ? null : <span className="text-subtle">{hidden ? "Not asked" : "No answer"}</span>;
  }
  const value = answers[q.id];
  if (q.kind === "date" && typeof value === "string") {
    return <span className="font-medium">{longDate(value)}</span>;
  }
  const other = answers[`${q.id}.other`];
  const list = Array.isArray(value) ? value : [value];
  return (
    <ul className="space-y-1">
      {list.map((v) => (
        <li key={v} className="whitespace-pre-wrap font-medium">
          {v}
          {q.other && v === q.other && typeof other === "string" && other.trim() !== "" ? `: ${other}` : ""}
        </li>
      ))}
    </ul>
  );
}

function Files({
  packageId,
  files,
  quietBlank,
}: {
  packageId: string | null;
  files: BriefFile[];
  quietBlank: boolean;
}) {
  if (files.length === 0) return quietBlank ? null : <span className="text-subtle">No files</span>;
  return (
    <ul className="space-y-1">
      {files.map((f) => (
        <li key={f.id} className="flex items-baseline justify-between gap-3">
          {packageId ? (
            <a
              href={`/api/admin/deliverables/${packageId}/${f.id}`}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate font-medium underline-offset-4 hover:underline"
            >
              {f.filename}
            </a>
          ) : (
            <span className="min-w-0 truncate font-medium">{f.filename}</span>
          )}
          <span className="shrink-0 text-xs text-subtle tabular-nums">{formatBytes(f.size)}</span>
        </li>
      ))}
    </ul>
  );
}

/** An answer that says something. A prefilled answer left as it came is still empty. */
function hasTyped(q: Question, answers: BriefAnswers) {
  if (!isAnswered(answers, q.id)) return false;
  const value = answers[q.id];
  return !(typeof value === "string" && q.prefill && value.trim() === q.prefill.trim());
}

function longDate(ymd: string) {
  const d = new Date(`${ymd}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? ymd
    : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
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
