"use client";

import * as React from "react";
import type { BriefAnswers, PublicBrief } from "@/lib/api";
import { saveBrief, sendBrief } from "@/lib/briefs/actions";
import { briefForm, isAnswered, visibleSections, type BriefForm, type Question } from "@/lib/briefs/forms";
import { cn } from "@/lib/utils";

type SaveState = "saved" | "waiting" | "saving" | "failed";

/** How long typing must pause before a save. Short enough that closing the tab loses little. */
const SAVE_AFTER_MS = 1200;

/**
 * A brief, as the person answering sees it. Every change saves on its own after a short pause;
 * the whole set of answers goes each time, so a save that lands late or twice does no harm.
 */
export function BriefFormView({ token, initial }: { token: string; initial: PublicBrief }) {
  // Looked up here, not passed in: a question set carries functions, which cannot cross from the server.
  const form = briefForm(initial.form) as BriefForm;
  const [answers, setAnswers] = React.useState<BriefAnswers>(initial.answers ?? {});
  const [state, setState] = React.useState<SaveState>("saved");
  const [error, setError] = React.useState<string | null>(null);
  const [sentAt, setSentAt] = React.useState<string | null>(initial.sentAt);
  const [sending, setSending] = React.useState(false);
  const [confirmBlank, setConfirmBlank] = React.useState(false);

  const latest = React.useRef(answers);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = React.useRef(false);
  const again = React.useRef(false);

  const flush = React.useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) {
      again.current = true;
      return;
    }
    inFlight.current = true;
    setState("saving");
    const result = await saveBrief(token, latest.current);
    inFlight.current = false;
    if (again.current) {
      again.current = false;
      void flush();
      return;
    }
    if (result.ok) {
      setState("saved");
      setError(null);
    } else {
      setState("failed");
      setError(result.error);
    }
  }, [token]);

  const update = (id: string, value: string | string[]) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      latest.current = next;
      return next;
    });
    setState("waiting");
    setConfirmBlank(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_AFTER_MS);
  };

  // Leaving the page with a save still waiting: send it now.
  React.useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && timer.current) void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  const sections = visibleSections(form, answers);
  const questions = sections.flatMap((s) => s.questions);
  const answered = questions.filter((q) => isAnswered(answers, q.id)).length;
  const blanks = questions.filter((q) => !isAnswered(answers, q.id));

  const send = async () => {
    if (blanks.length > 0 && !confirmBlank) {
      setConfirmBlank(true);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setSending(true);
    const result = await sendBrief(token, latest.current);
    setSending(false);
    setConfirmBlank(false);
    if (result.ok) {
      setSentAt(result.brief.sentAt);
      setState("saved");
      setError(null);
    } else {
      setError(result.error);
    }
  };

  const goToFirstBlank = () => {
    const first = blanks[0];
    if (!first) return;
    document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setConfirmBlank(false);
  };

  return (
    <div className="drive mx-auto w-full max-w-3xl px-4 pb-24 sm:px-5">
      <header className="pt-10 pb-8 sm:pt-14">
        <h1 className="font-display text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-[var(--doc-ink)]">
          {form.title}
        </h1>
        <div className="mt-5 space-y-2 text-[var(--doc-t-body)] leading-relaxed text-[var(--doc-ink-body)]">
          <p className="font-medium text-[var(--doc-ink)]">{form.greeting}</p>
          {form.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>

      <Progress answered={answered} total={questions.length} state={state} />

      {error && (
        <p role="alert" className="mt-4 rounded-[var(--doc-r-inset)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-6">
        {sections.map((section, i) => (
          <section
            key={section.title}
            className="rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] px-5 py-7 sm:px-8 sm:py-9"
          >
            <h2 className="flex items-baseline gap-3 font-display text-[1.35rem] leading-tight font-semibold tracking-[-0.02em] text-[var(--doc-ink)] sm:text-[var(--doc-t-h3)]">
              <span className="text-[var(--doc-ink-soft)] tabular-nums">{i + 1}</span>
              {section.title}
            </h2>
            {section.note && <p className="mt-2 text-[var(--doc-t-sm)] text-[var(--doc-ink-soft)]">{section.note}</p>}
            <ol className="mt-6 space-y-8">
              {section.questions.map((q, n) => (
                <QuestionRow
                  key={q.id}
                  number={n + 1}
                  question={q}
                  answers={answers}
                  onChange={update}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-[var(--doc-r-panel)] bg-[var(--doc-fill-ink)] px-5 py-8 text-[var(--doc-ink-invert)] sm:px-8">
        {sentAt ? (
          <>
            <p className="font-display text-[1.35rem] leading-tight font-semibold">{form.thanks}</p>
            <p className="mt-2 text-[var(--doc-t-sm)] text-[var(--doc-ink-invert-soft)]">
              Sent on {formatWhen(sentAt)}. You can still change any answer on this page. Changes save on their own.
            </p>
          </>
        ) : confirmBlank ? (
          <>
            <p className="font-display text-[1.25rem] leading-tight font-semibold">
              {blanks.length === 1 ? "One question is still blank." : `${blanks.length} questions are still blank.`}
            </p>
            <p className="mt-2 text-[var(--doc-t-sm)] text-[var(--doc-ink-invert-soft)]">
              You can send now, or answer them first.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="rounded-full bg-[var(--doc-paper)] px-6 py-3 text-[var(--doc-t-sm)] font-semibold text-[var(--doc-ink)] hover:bg-[var(--doc-fill-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink-invert)] disabled:opacity-60"
              >
                {sending ? "Sending" : "Send now"}
              </button>
              <button
                type="button"
                onClick={goToFirstBlank}
                className="rounded-full px-6 py-3 text-[var(--doc-t-sm)] font-semibold text-[var(--doc-ink-invert)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink-invert)]"
              >
                Show me the first one
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="font-display text-[1.25rem] leading-tight font-semibold">Finished?</p>
            <p className="mt-2 text-[var(--doc-t-sm)] text-[var(--doc-ink-invert-soft)]">
              Press Send and we will read your answers.
            </p>
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="mt-5 rounded-full bg-[var(--doc-paper)] px-6 py-3 text-[var(--doc-t-sm)] font-semibold text-[var(--doc-ink)] hover:bg-[var(--doc-fill-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink-invert)] disabled:opacity-60"
            >
              {sending ? "Sending" : "Send my answers"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function Progress({ answered, total, state }: { answered: number; total: number; state: SaveState }) {
  const pct = total === 0 ? 0 : Math.round((answered / total) * 100);
  const label =
    state === "saving" ? "Saving" : state === "waiting" ? "Saving soon" : state === "failed" ? "Not saved" : "Saved";
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-background px-4 py-3 sm:-mx-5 sm:px-5">
      <div className="flex items-baseline justify-between gap-4 text-[var(--doc-t-sm)]">
        <span className="font-medium text-[var(--doc-ink)] tabular-nums">
          {answered} of {total} answered
        </span>
        <span
          aria-live="polite"
          className={cn(
            "text-[var(--doc-t-xs)]",
            state === "failed" ? "font-semibold text-[var(--color-danger)]" : "text-[var(--doc-ink-soft)]",
          )}
        >
          {label}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--doc-fill-strong)]">
        <div
          className="h-full rounded-full bg-[var(--doc-fill-ink)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuestionRow({
  number,
  question: q,
  answers,
  onChange,
}: {
  number: number;
  question: Question;
  answers: BriefAnswers;
  onChange: (id: string, value: string | string[]) => void;
}) {
  const value = answers[q.id];
  const labelId = `q-${q.id}-label`;
  const hint = q.kind === "many" ? "Tick all that apply." : null;

  return (
    <li id={`q-${q.id}`} className="scroll-mt-24">
      <p id={labelId} className="flex gap-3 text-[var(--doc-t-body)] leading-snug font-medium text-[var(--doc-ink)]">
        <span className="w-5 shrink-0 text-[var(--doc-ink-soft)] tabular-nums">{number}</span>
        <span className="min-w-0">{q.text}</span>
      </p>
      {hint && <p className="mt-1 pl-8 text-[var(--doc-t-xs)] text-[var(--doc-ink-soft)]">{hint}</p>}

      <div className="mt-3 pl-8">
        {q.kind === "text" ? (
          <textarea
            id={`a-${q.id}`}
            aria-labelledby={labelId}
            rows={q.long ? 4 : 2}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(q.id, e.target.value)}
            maxLength={4000}
            placeholder="Type your answer"
            className="w-full resize-y rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] px-4 py-3 text-[var(--doc-t-body)] leading-relaxed text-[var(--doc-ink)] placeholder:text-[var(--doc-ink-soft)] focus:bg-[var(--doc-fill-quiet)] focus:outline-2 focus:outline-[var(--doc-ink)]"
          />
        ) : (
          <Choices question={q} value={value} labelId={labelId} onChange={onChange} />
        )}

        {q.other && has(value, q.other) && (
          <input
            id={`a-${q.id}-other`}
            aria-label={`${q.other}: please say`}
            value={typeof answers[`${q.id}.other`] === "string" ? (answers[`${q.id}.other`] as string) : ""}
            onChange={(e) => onChange(`${q.id}.other`, e.target.value)}
            maxLength={300}
            placeholder="Please say"
            className="mt-2 w-full rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] px-4 py-3 text-[var(--doc-t-body)] text-[var(--doc-ink)] placeholder:text-[var(--doc-ink-soft)] focus:bg-[var(--doc-fill-quiet)] focus:outline-2 focus:outline-[var(--doc-ink)]"
          />
        )}
      </div>
    </li>
  );
}

function Choices({
  question: q,
  value,
  labelId,
  onChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  labelId: string;
  onChange: (id: string, value: string | string[]) => void;
}) {
  const options = q.kind === "yn" ? ["Yes", "No"] : (q.options ?? []);
  const multi = q.kind === "many";

  const toggle = (option: string) => {
    if (multi) {
      const list = Array.isArray(value) ? value : [];
      onChange(q.id, list.includes(option) ? list.filter((v) => v !== option) : [...list, option]);
    } else {
      // Tapping the chosen answer again clears it, so a wrong tap can be undone.
      onChange(q.id, value === option ? "" : option);
    }
  };

  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-labelledby={labelId}
      className={cn("grid gap-2", q.kind === "yn" ? "grid-cols-2 sm:max-w-xs" : "sm:grid-cols-2")}
    >
      {options.map((option) => {
        const chosen = has(value, option);
        return (
          <button
            key={option}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={chosen}
            onClick={() => toggle(option)}
            className={cn(
              "flex items-start gap-3 rounded-[var(--doc-r-inset)] px-4 py-3 text-left text-[var(--doc-t-sm)] leading-snug transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]",
              chosen
                ? "bg-[var(--doc-fill-ink)] text-[var(--doc-ink-invert)]"
                : "bg-[var(--doc-fill)] text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill-strong)]",
            )}
          >
            <Mark multi={multi} chosen={chosen} />
            <span className="min-w-0">{option}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A tick box or a dot, so a choice reads as chosen without relying on colour alone. */
function Mark({ multi, chosen }: { multi: boolean; chosen: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-[3px] flex size-4 shrink-0 items-center justify-center",
        multi ? "rounded-[5px]" : "rounded-full",
        "bg-[var(--doc-paper)]",
      )}
    >
      {chosen &&
        (multi ? (
          <svg viewBox="0 0 16 16" className="size-3 text-[var(--doc-ink)]" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="size-2 rounded-full bg-[var(--doc-ink)]" />
        ))}
    </span>
  );
}

function has(value: string | string[] | undefined, option: string) {
  return Array.isArray(value) ? value.includes(option) : value === option;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
