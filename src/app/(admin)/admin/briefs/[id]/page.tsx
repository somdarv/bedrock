import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/admin/copy-link";
import { api, ApiError, type BriefAnswers } from "@/lib/api";
import { briefForm, isAnswered, type Question } from "@/lib/briefs/forms";

export const metadata = { title: "Brief" };

/**
 * One brief's answers, set against the questions. Every question is listed, including the ones
 * the person's earlier answers hid from them, so the reader sees what was skipped as well.
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
          {form?.title ?? brief.form}. {brief.answeredCount} answered.{" "}
          {brief.sentAt ? `Sent ${when(brief.sentAt)}.` : "Not sent yet."}
          {brief.savedAt ? ` Last saved ${when(brief.savedAt)}.` : ""}
        </p>
        <CopyLink path={`/b/${brief.token}`} />
      </header>

      {!form ? (
        <p className="text-sm text-muted-foreground">
          The question set “{brief.form}” is not in this build, so only the raw answers can be shown.
        </p>
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

function Answer({ question: q, answers }: { question: Question; answers: BriefAnswers }) {
  const hidden = q.showIf ? !q.showIf(answers) : false;
  if (!isAnswered(answers, q.id)) {
    return <span className="text-subtle">{hidden ? "Not asked" : "No answer"}</span>;
  }
  const value = answers[q.id];
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

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Accra",
  });
}
