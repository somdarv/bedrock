"use client";

import * as React from "react";
import type { BriefAnswers, BriefFile, BriefPartState, PublicBrief } from "@/lib/api";
import { removeBriefFile, saveBrief, sendBriefPart } from "@/lib/briefs/actions";
import { briefForm, formParts, type BriefForm, type FormPart, type Question } from "@/lib/briefs/forms";
import { formatBytes } from "@/lib/files/tree";
import { useBriefUploads, type UploadItem } from "@/lib/files/use-uploads";
import { cn } from "@/lib/utils";

/**
 * A needs list, as the client fills it in: the parts down the side on a desktop, one part at a
 * time on a phone. Answers save on their own after a short pause. Each part is sent on its own,
 * which moves its item on the project's plan to us; files go into the project's files.
 */

type SaveState = "saved" | "waiting" | "saving" | "failed";
type PartStatus = "read" | "empty" | "started" | "sent" | "received";

const SAVE_AFTER_MS = 1200;
const ACTIVE = ["queued", "uploading", "finishing"];

export function BriefWorkspace({ token, initial }: { token: string; initial: PublicBrief }) {
  // Looked up here, not passed in: a question set carries functions, which cannot cross from the server.
  const form = briefForm(initial.form) as BriefForm;
  const parts = React.useMemo(() => formParts(form), [form]);

  const saver = useAnswerSaver(token, initial.answers ?? {});
  const [partStates, setPartStates] = React.useState<Record<string, BriefPartState>>(initial.parts ?? {});
  const [files, setFiles] = React.useState<BriefFile[]>(initial.files ?? []);
  const [notice, setNotice] = React.useState<string | null>(null);

  const takeServer = React.useCallback((b: PublicBrief) => {
    if (b.parts) setPartStates(b.parts);
    if (b.files) setFiles(b.files);
  }, []);
  const uploads = useBriefUploads(token, takeServer);

  const [current, setCurrent] = useCurrentPart(parts);
  const part = parts.find((p) => p.key === current) ?? parts[0];
  const index = parts.indexOf(part);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const go = (key: string) => {
    setCurrent(key);
    setNotice(null);
    // On a phone a new part always starts just under the top bar. On a desktop the side list stays
    // in view, so only come back up if the part's heading has scrolled away.
    const top = contentRef.current?.getBoundingClientRect().top ?? 0;
    const phone = window.matchMedia("(max-width: 1023px)").matches;
    if (phone || top < 0) contentRef.current?.scrollIntoView({ block: "start" });
  };

  const status = (p: FormPart): PartStatus => {
    if (!p.tracked) return "read";
    const s = partStates[p.key];
    if (s?.received) return "received";
    if (s?.sentAt) return "sent";
    return answeredIn(p, saver.answers, files) > 0 ? "started" : "empty";
  };

  const tracked = parts.filter((p) => p.tracked);
  const sentCount = tracked.filter((p) => ["sent", "received"].includes(status(p))).length;

  return (
    <div className="drive mx-auto w-full max-w-6xl px-4 pb-32 sm:px-5 lg:pb-20">
      <header className="pt-8 pb-6 sm:pt-12 lg:pb-10">
        <h1 className="font-display text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-[var(--doc-ink)]">
          {form.title}
        </h1>
        {initial.projectTitle && (
          <p className="mt-2 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">{initial.projectTitle}</p>
        )}
        <div className="mt-5 max-w-2xl space-y-1.5 text-[length:var(--doc-t-body)] leading-relaxed text-[var(--doc-ink-body)]">
          <p className="font-medium text-[var(--doc-ink)]">{form.greeting}</p>
          {form.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>

      {/* Phone: where you are, and a picker for every part. */}
      <div className="sticky top-0 z-20 -mx-4 bg-background px-4 pt-2 pb-3 sm:-mx-5 sm:px-5 lg:hidden">
        <Progress sent={sentCount} total={tracked.length} state={saver.state} />
        <label className="mt-3 block">
          <span className="sr-only">Choose a part</span>
          <select
            value={part.key}
            onChange={(e) => go(e.target.value)}
            className="w-full appearance-none rounded-[var(--doc-r-inset)] bg-[var(--doc-paper)] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat px-4 py-3 pr-10 text-[length:var(--doc-t-body)] font-semibold text-[var(--doc-ink)] focus:outline-2 focus:outline-[var(--doc-ink)]"
            style={{ backgroundImage: CHEVRON }}
          >
            {groups(parts).map((g) =>
              g.repeat ? (
                <optgroup key={g.key} label={g.title}>
                  {g.parts.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.title}
                      {optionSuffix(status(p))}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={g.key} value={g.parts[0].key}>
                  {g.parts[0].title}
                  {optionSuffix(status(g.parts[0]))}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        {/* Desktop: every part down the side. */}
        <nav
          aria-label="Parts of the list"
          className="hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1"
        >
          <Progress sent={sentCount} total={tracked.length} state={saver.state} />
          <ol className="mt-5 space-y-1">
            {groups(parts).map((g) =>
              g.repeat ? (
                <li key={g.key} className="pt-3">
                  <p className="px-3 pb-2 text-[length:var(--doc-t-xs)] font-semibold text-[var(--doc-ink)]">{g.title}</p>
                  <div className="grid grid-cols-5 gap-1.5 px-3">
                    {g.parts.map((p) => (
                      <WeekTile
                        key={p.key}
                        part={p}
                        status={status(p)}
                        current={p.key === part.key}
                        onClick={() => go(p.key)}
                      />
                    ))}
                  </div>
                </li>
              ) : (
                <li key={g.key}>
                  <NavRow
                    part={g.parts[0]}
                    status={status(g.parts[0])}
                    progress={progressText(g.parts[0], saver.answers, files)}
                    current={g.parts[0].key === part.key}
                    onClick={() => go(g.parts[0].key)}
                  />
                </li>
              ),
            )}
          </ol>
        </nav>

        <div ref={contentRef} className="scroll-mt-28 pt-4 lg:pt-0">
          {saver.error && (
            <p role="alert" className="mb-4 rounded-[var(--doc-r-inset)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {saver.error}
            </p>
          )}

          <PartView
            key={part.key}
            token={token}
            part={part}
            status={status(part)}
            state={partStates[part.key]}
            answers={saver.answers}
            files={files}
            acceptsFiles={initial.acceptsFiles ?? false}
            uploads={uploads.items}
            onAnswer={saver.update}
            onAddFiles={(question, list) =>
              uploads.add(
                list.map((file) => ({
                  file,
                  destination: question,
                  fields: { part: part.key, question },
                })),
              )
            }
            onRetry={uploads.retry}
            onCancel={uploads.cancel}
            onDismiss={uploads.dismiss}
            onRemoveFile={async (id) => {
              const result = await removeBriefFile(token, id);
              if (result.ok) takeServer(result.brief);
              else setNotice(result.error);
            }}
            onSend={async () => {
              const answers = await saver.settle();
              const result = await sendBriefPart(token, part.key, answers);
              if (!result.ok) {
                setNotice(result.error);
                // The answers did not go with it: save them the ordinary way.
                void saver.flush();
                return false;
              }
              // The answers went with the part, so they are saved too.
              saver.markSaved();
              takeServer(result.brief);
              setNotice(null);
              return true;
            }}
            notice={notice}
          />

          <PartSteps
            back={index > 0 ? parts[index - 1] : null}
            next={index < parts.length - 1 ? parts[index + 1] : null}
            onGo={go}
          />

          <p className="mt-10 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">{form.thanks}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ one part */

function PartView({
  token,
  part,
  status,
  state,
  answers,
  files,
  acceptsFiles,
  uploads,
  onAnswer,
  onAddFiles,
  onRetry,
  onCancel,
  onDismiss,
  onRemoveFile,
  onSend,
  notice,
}: {
  token: string;
  part: FormPart;
  status: PartStatus;
  state: BriefPartState | undefined;
  answers: BriefAnswers;
  files: BriefFile[];
  acceptsFiles: boolean;
  uploads: UploadItem[];
  onAnswer: (id: string, value: string | string[]) => void;
  onAddFiles: (question: string, files: File[]) => void;
  onRetry: (key: string) => void;
  onCancel: (key: string) => void;
  onDismiss: (key: string) => void;
  onRemoveFile: (id: string) => Promise<void>;
  onSend: () => Promise<boolean>;
  notice: string | null;
}) {
  const answerable = part.questions.filter((q) => q.kind !== "note");
  const blanks = answerable.filter((q) => !isDone(q, answers, files));
  const busy = uploads.some((u) => ACTIVE.includes(u.status) && part.questions.some((q) => q.id === u.destination));
  let n = 0;

  return (
    <section
      aria-labelledby={`part-${part.key}`}
      className="rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] px-5 py-7 sm:px-8 sm:py-9 lg:px-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <h2
          id={`part-${part.key}`}
          className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.02em] text-balance text-[var(--doc-ink)] sm:text-[length:var(--doc-t-h2)]"
        >
          {part.title}
          {part.repeat && (
            <span className="ml-2 text-[length:var(--doc-t-body)] font-medium text-[var(--doc-ink-soft)]">
              of {part.repeat.count}
            </span>
          )}
        </h2>
        {part.tracked && <StatusPill status={status} />}
      </div>

      {part.note && (
        <p className="mt-3 max-w-2xl text-[length:var(--doc-t-sm)] leading-relaxed text-[var(--doc-ink-body)]">{part.note}</p>
      )}

      <ol className="mt-8 space-y-9">
        {part.questions.map((q) =>
          q.kind === "note" ? (
            <li key={q.id}>
              <NoteLine text={q.text} />
            </li>
          ) : (
            <QuestionBlock
              key={q.id}
              number={++n}
              question={q}
              answers={answers}
              files={files.filter((f) => f.question === q.id)}
              uploads={uploads.filter((u) => u.destination === q.id && u.status !== "done")}
              acceptsFiles={acceptsFiles}
              locked={status === "received"}
              onAnswer={onAnswer}
              onAddFiles={(list) => onAddFiles(q.id, list)}
              onRetry={onRetry}
              onCancel={onCancel}
              onDismiss={onDismiss}
              onRemoveFile={onRemoveFile}
            />
          ),
        )}
      </ol>

      {part.tracked && (
        <SendBox
          key={`${token}-${part.key}`}
          status={status}
          sentAt={state?.sentAt ?? null}
          blanks={blanks}
          busy={busy}
          onSend={onSend}
          notice={notice}
        />
      )}
    </section>
  );
}

function QuestionBlock({
  number,
  question: q,
  answers,
  files,
  uploads,
  acceptsFiles,
  locked,
  onAnswer,
  onAddFiles,
  onRetry,
  onCancel,
  onDismiss,
  onRemoveFile,
}: {
  number: number;
  question: Question;
  answers: BriefAnswers;
  files: BriefFile[];
  uploads: UploadItem[];
  acceptsFiles: boolean;
  locked: boolean;
  onAnswer: (id: string, value: string | string[]) => void;
  onAddFiles: (files: File[]) => void;
  onRetry: (key: string) => void;
  onCancel: (key: string) => void;
  onDismiss: (key: string) => void;
  onRemoveFile: (id: string) => Promise<void>;
}) {
  const labelId = `q-${q.id}-label`;
  const value = answers[q.id];
  const text = typeof value === "string" ? value : "";

  return (
    <li id={`q-${q.id}`} className="scroll-mt-32">
      <p id={labelId} className="flex max-w-3xl gap-3 text-[length:var(--doc-t-body)] leading-snug font-medium text-[var(--doc-ink)]">
        <span className="w-6 shrink-0 text-[var(--doc-ink-soft)] tabular-nums">{number}</span>
        <span className="min-w-0">{q.text}</span>
      </p>

      <div className="mt-3 space-y-3 pl-9">
        {(q.kind === "text" || q.kind === "either") && (
          <TextAnswer question={q} labelId={labelId} value={value} onChange={(v) => onAnswer(q.id, v)} />
        )}

        {q.kind === "date" && (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              aria-labelledby={labelId}
              value={text}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              className="min-h-12 rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] px-4 py-2.5 text-[length:var(--doc-t-body)] text-[var(--doc-ink)] tabular-nums focus:bg-[var(--doc-fill-quiet)] focus:outline-2 focus:outline-[var(--doc-ink)]"
            />
            {text && (
              <span className="text-[length:var(--doc-t-sm)] text-[var(--doc-ink-body)]">{longDate(text)}</span>
            )}
          </div>
        )}

        {q.kind === "yn" && <YesNo labelId={labelId} value={text} onChange={(v) => onAnswer(q.id, v)} />}

        {(q.kind === "one" || q.kind === "many") && (
          <Choices question={q} labelId={labelId} value={value} onChange={(v) => onAnswer(q.id, v)} />
        )}

        {(q.kind === "file" || q.kind === "either") &&
          (acceptsFiles ? (
            <FileAnswer
              labelId={labelId}
              files={files}
              uploads={uploads}
              locked={locked}
              onAdd={onAddFiles}
              onRetry={onRetry}
              onCancel={onCancel}
              onDismiss={onDismiss}
              onRemove={onRemoveFile}
            />
          ) : (
            <p className="text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">Send these files to us on WhatsApp.</p>
          ))}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ answers */

function TextAnswer({
  question: q,
  labelId,
  value,
  onChange,
}: {
  question: Question;
  labelId: string;
  value: string | string[] | undefined;
  onChange: (value: string) => void;
}) {
  // A prefilled answer starts with its lines ("Facebook: "), for them to fill in.
  const shown = typeof value === "string" ? value : (q.prefill ?? "");
  const lines = q.prefill ? q.prefill.split("\n").length + 1 : q.long ? 5 : 2;
  return (
    <textarea
      aria-labelledby={labelId}
      rows={lines}
      value={shown}
      onChange={(e) => onChange(e.target.value)}
      maxLength={4000}
      placeholder={q.kind === "either" ? "Type it here, or add a file below" : "Type your answer"}
      className="block w-full max-w-3xl resize-y rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] px-4 py-3 text-[length:var(--doc-t-body)] leading-relaxed text-[var(--doc-ink)] placeholder:text-[var(--doc-ink-soft)] focus:bg-[var(--doc-fill-quiet)] focus:outline-2 focus:outline-[var(--doc-ink)]"
    />
  );
}

function YesNo({ labelId, value, onChange }: { labelId: string; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-labelledby={labelId} className="grid max-w-xs grid-cols-2 gap-2">
      {["Yes", "No"].map((option) => {
        const chosen = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={chosen}
            // Tapping the chosen answer again clears it, so a wrong tap can be undone.
            onClick={() => onChange(chosen ? "" : option)}
            className={cn(
              "min-h-12 rounded-[var(--doc-r-inset)] px-4 py-3 text-[length:var(--doc-t-sm)] font-semibold transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]",
              chosen
                ? "bg-[var(--doc-fill-ink)] text-[var(--doc-ink-invert)]"
                : "bg-[var(--doc-fill)] text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill-strong)]",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Choices({
  question: q,
  labelId,
  value,
  onChange,
}: {
  question: Question;
  labelId: string;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const multi = q.kind === "many";
  const has = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <div role={multi ? "group" : "radiogroup"} aria-labelledby={labelId} className="grid max-w-3xl gap-2 sm:grid-cols-2">
      {(q.options ?? []).map((option) => (
        <button
          key={option}
          type="button"
          role={multi ? "checkbox" : "radio"}
          aria-checked={has(option)}
          onClick={() => {
            if (multi) {
              const list = Array.isArray(value) ? value : [];
              onChange(list.includes(option) ? list.filter((v) => v !== option) : [...list, option]);
            } else onChange(value === option ? "" : option);
          }}
          className={cn(
            "rounded-[var(--doc-r-inset)] px-4 py-3 text-left text-[length:var(--doc-t-sm)] leading-snug focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]",
            has(option)
              ? "bg-[var(--doc-fill-ink)] text-[var(--doc-ink-invert)]"
              : "bg-[var(--doc-fill)] text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill-strong)]",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function FileAnswer({
  labelId,
  files,
  uploads,
  locked,
  onAdd,
  onRetry,
  onCancel,
  onDismiss,
  onRemove,
}: {
  labelId: string;
  files: BriefFile[];
  uploads: UploadItem[];
  locked: boolean;
  onAdd: (files: File[]) => void;
  onRetry: (key: string) => void;
  onCancel: (key: string) => void;
  onDismiss: (key: string) => void;
  onRemove: (id: string) => Promise<void>;
}) {
  const input = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const [removing, setRemoving] = React.useState<string | null>(null);

  const take = (list: FileList | null) => {
    if (list && list.length > 0) onAdd(Array.from(list));
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--doc-r-inset)] px-4 py-4 transition-colors duration-150 ease-out motion-reduce:transition-none",
          over ? "bg-[var(--doc-fill-strong)]" : "bg-[var(--doc-fill-quiet)]",
        )}
      >
        <button
          type="button"
          aria-describedby={labelId}
          onClick={() => input.current?.click()}
          className="min-h-11 rounded-full bg-[var(--doc-fill-ink)] px-5 py-2.5 text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink-invert)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]"
        >
          Add files
        </button>
        <span className="hidden text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)] sm:inline">Or drop them here.</span>
        <input
          ref={input}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            take(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {(files.length > 0 || uploads.length > 0) && (
        <ul className="divide-y divide-[var(--doc-fill-strong)] rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)]">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
              <Thumb file={f} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[length:var(--doc-t-sm)] font-medium text-[var(--doc-ink)]">{f.filename}</p>
                <p className="text-[length:var(--doc-t-xs)] text-[var(--doc-ink-soft)] tabular-nums">{formatBytes(f.size)}</p>
              </div>
              {!locked && (
                <button
                  type="button"
                  disabled={removing === f.id}
                  onClick={async () => {
                    setRemoving(f.id);
                    await onRemove(f.id);
                    setRemoving(null);
                  }}
                  className="min-h-10 rounded-full px-3 text-[length:var(--doc-t-sm)] font-medium text-[var(--doc-ink-soft)] hover:bg-[var(--doc-fill-strong)] hover:text-[var(--doc-ink)] focus-visible:outline-2 focus-visible:outline-[var(--doc-ink)] disabled:opacity-50"
                  aria-label={`Remove ${f.filename}`}
                >
                  {removing === f.id ? "Removing" : "Remove"}
                </button>
              )}
            </li>
          ))}
          {uploads.map((u) => (
            <li key={u.key} className="flex items-center gap-3 px-3 py-2.5">
              <span aria-hidden className="size-10 shrink-0 rounded-lg bg-[var(--doc-fill-strong)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[length:var(--doc-t-sm)] font-medium text-[var(--doc-ink)]">{u.name}</p>
                {u.status === "failed" ? (
                  <p className="text-[length:var(--doc-t-xs)] text-[var(--color-danger)]">{u.error ?? "This file did not go through."}</p>
                ) : u.status === "cancelled" ? (
                  <p className="text-[length:var(--doc-t-xs)] text-[var(--doc-ink-soft)]">Stopped</p>
                ) : (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--doc-fill-strong)]">
                    <div
                      className="h-full rounded-full bg-[var(--doc-fill-ink)] transition-[width] duration-150 ease-out motion-reduce:transition-none"
                      style={{ width: `${u.size ? Math.round((u.loaded / u.size) * 100) : 100}%` }}
                    />
                  </div>
                )}
              </div>
              {u.status === "failed" || u.status === "cancelled" ? (
                <div className="flex shrink-0 flex-col items-end sm:flex-row sm:items-center">
                  {!u.refused && (
                    <button
                      type="button"
                      onClick={() => onRetry(u.key)}
                      className="min-h-10 rounded-full px-3 text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)] hover:bg-[var(--doc-fill-strong)] focus-visible:outline-2 focus-visible:outline-[var(--doc-ink)]"
                    >
                      Try again
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDismiss(u.key)}
                    aria-label={`Remove ${u.name}`}
                    className="min-h-10 rounded-full px-3 text-[length:var(--doc-t-sm)] font-medium text-[var(--doc-ink-soft)] hover:bg-[var(--doc-fill-strong)] hover:text-[var(--doc-ink)] focus-visible:outline-2 focus-visible:outline-[var(--doc-ink)]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onCancel(u.key)}
                  className="min-h-10 rounded-full px-3 text-[length:var(--doc-t-sm)] font-medium text-[var(--doc-ink-soft)] hover:bg-[var(--doc-fill-strong)] focus-visible:outline-2 focus-visible:outline-[var(--doc-ink)]"
                  aria-label={`Stop ${u.name}`}
                >
                  Stop
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {locked && files.length > 0 && (
        <p className="text-[length:var(--doc-t-xs)] text-[var(--doc-ink-soft)]">We have this part, so its files stay. Message us if one needs to change.</p>
      )}
    </div>
  );
}

function Thumb({ file }: { file: BriefFile }) {
  const [broken, setBroken] = React.useState(false);
  if (file.previewUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a small thumbnail from our own API
      <img
        src={file.previewUrl}
        alt=""
        onError={() => setBroken(true)}
        className="size-10 shrink-0 rounded-lg bg-[var(--doc-fill-strong)] object-cover"
      />
    );
  }
  const ext = file.filename.includes(".") ? file.filename.split(".").pop()!.slice(0, 4).toUpperCase() : "FILE";
  return (
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--doc-fill-strong)] text-[10px] font-bold tracking-wide text-[var(--doc-ink-soft)]"
    >
      {ext}
    </span>
  );
}

function NoteLine({ text }: { text: string }) {
  return (
    <p className="flex max-w-3xl gap-3 rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] px-4 py-3 text-[length:var(--doc-t-sm)] leading-relaxed text-[var(--doc-ink-body)]">
      <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 text-[var(--doc-ink-soft)]" fill="currentColor">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 3.5a1 1 0 110 2 1 1 0 010-2zM9 9h2v6H9V9z" />
      </svg>
      <span>{text}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ sending */

function SendBox({
  status,
  sentAt,
  blanks,
  busy,
  onSend,
  notice,
}: {
  status: PartStatus;
  sentAt: string | null;
  blanks: Question[];
  busy: boolean;
  onSend: () => Promise<boolean>;
  notice: string | null;
}) {
  const [confirm, setConfirm] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [justSent, setJustSent] = React.useState(false);

  const send = async () => {
    if (blanks.length > 0 && !confirm) {
      setConfirm(true);
      return;
    }
    setSending(true);
    const ok = await onSend();
    setSending(false);
    setConfirm(false);
    setJustSent(ok);
  };

  const showFirst = () => {
    const first = blanks[0];
    if (first) document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setConfirm(false);
  };

  const sent = status === "sent" || status === "received";

  return (
    <div className="mt-10 rounded-[var(--doc-r-panel)] bg-[var(--doc-fill-ink)] px-5 py-6 text-[var(--doc-ink-invert)] sm:px-7">
      {confirm ? (
        <>
          <p className="font-display text-[1.2rem] leading-tight font-semibold">
            {blanks.length === 1 ? "One item is still empty." : `${blanks.length} items are still empty.`}
          </p>
          <p className="mt-1.5 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-invert-soft)]">
            You can send now and add them later, or fill them in first.
          </p>
        </>
      ) : sent ? (
        <>
          <p className="font-display text-[1.2rem] leading-tight font-semibold">
            {status === "received" ? "We have this part. Thank you." : justSent ? "Sent. Thank you." : "You sent this part."}
          </p>
          <p className="mt-1.5 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-invert-soft)]">
            {sentAt ? `Sent on ${when(sentAt)}. ` : ""}If something changes, edit it here and send it again.
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-[1.2rem] leading-tight font-semibold">Ready?</p>
          <p className="mt-1.5 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-invert-soft)]">
            Send this part to us. You can still change it after.
          </p>
        </>
      )}

      {notice && (
        <p role="alert" className="mt-3 text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink-invert)]">
          {notice}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={sending || busy}
          className="min-h-12 rounded-full bg-[var(--doc-paper)] px-6 py-3 text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)] hover:bg-[var(--doc-fill-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink-invert)] disabled:opacity-60"
        >
          {sending ? "Sending" : confirm ? "Send anyway" : sent ? "Send again" : "Send this part"}
        </button>
        {confirm && (
          <button
            type="button"
            onClick={showFirst}
            className="min-h-12 rounded-full px-5 py-3 text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink-invert)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink-invert)]"
          >
            Show me the first one
          </button>
        )}
        {busy && <span className="text-[length:var(--doc-t-sm)] text-[var(--doc-ink-invert-soft)]">Wait for your files to finish.</span>}
      </div>
    </div>
  );
}

function PartSteps({
  back,
  next,
  onGo,
}: {
  back: FormPart | null;
  next: FormPart | null;
  onGo: (key: string) => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--doc-fill-strong)] bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <button
          type="button"
          disabled={!back}
          onClick={() => back && onGo(back.key)}
          className="min-h-12 shrink-0 rounded-full bg-[var(--doc-fill-strong)] px-5 py-3 text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--doc-ink)] disabled:invisible"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && onGo(next.key)}
          className="min-h-12 min-w-0 truncate rounded-full bg-[var(--doc-fill-ink)] px-5 py-3 text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink-invert)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)] disabled:invisible"
        >
          {next ? `Next: ${next.title}` : "Next"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the side */

function Progress({ sent, total, state }: { sent: number; total: number; state: SaveState }) {
  const pct = total === 0 ? 0 : Math.round((sent / total) * 100);
  const label =
    state === "saving" ? "Saving" : state === "waiting" ? "Saving soon" : state === "failed" ? "Not saved" : "Saved";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-[length:var(--doc-t-sm)]">
        <span className="font-semibold text-[var(--doc-ink)] tabular-nums">
          {sent} of {total} parts sent
        </span>
        <span
          aria-live="polite"
          className={cn(
            "text-[length:var(--doc-t-xs)]",
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

function NavRow({
  part,
  status,
  progress,
  current,
  onClick,
}: {
  part: FormPart;
  status: PartStatus;
  progress: string;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? "step" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--doc-r-inset)] px-3 py-2.5 text-left transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-[var(--doc-ink)]",
        current ? "bg-[var(--doc-paper)]" : "hover:bg-[var(--doc-fill-strong)]",
      )}
    >
      <Mark status={status} />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[length:var(--doc-t-sm)] leading-snug text-[var(--doc-ink)]", current ? "font-semibold" : "font-medium")}>
          {part.title}
        </span>
        {part.tracked && <span className="block text-[length:var(--doc-t-xs)] text-[var(--doc-ink-soft)]">{progress}</span>}
      </span>
    </button>
  );
}

function WeekTile({
  part,
  status,
  current,
  onClick,
}: {
  part: FormPart;
  status: PartStatus;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? "step" : undefined}
      aria-label={`${part.title}, ${statusWord(status)}`}
      className={cn(
        "flex aspect-square items-center justify-center rounded-lg text-[length:var(--doc-t-xs)] font-semibold tabular-nums transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--doc-ink)]",
        status === "received" || status === "sent"
          ? "bg-[var(--doc-fill-ink)] text-[var(--doc-ink-invert)]"
          : status === "started"
            ? "bg-[var(--doc-paper)] text-[var(--doc-ink)]"
            : "bg-[var(--doc-fill-strong)] text-[var(--doc-ink-soft)] hover:bg-[var(--doc-paper)]",
        current && "ring-2 ring-[var(--doc-ink)] ring-offset-2 ring-offset-background",
      )}
    >
      {status === "received" ? <Tick className="size-3.5" /> : part.repeat?.n}
    </button>
  );
}

function Mark({ status }: { status: PartStatus }) {
  if (status === "read") {
    return <span aria-hidden className="size-5 shrink-0 rounded-full bg-[var(--doc-fill-strong)]" />;
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full",
        status === "received" || status === "sent"
          ? "bg-[var(--doc-fill-ink)] text-[var(--doc-ink-invert)]"
          : "bg-[var(--doc-fill-strong)]",
      )}
    >
      {(status === "received" || status === "sent") && <Tick className="size-3" />}
      {status === "started" && <span className="size-1.5 rounded-full bg-[var(--doc-ink)]" />}
    </span>
  );
}

function StatusPill({ status }: { status: PartStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[length:var(--doc-t-xs)] font-semibold",
        status === "received" || status === "sent"
          ? "bg-[var(--doc-fill-ink)] text-[var(--doc-ink-invert)]"
          : "bg-[var(--doc-fill)] text-[var(--doc-ink-body)]",
      )}
    >
      {statusWord(status)}
    </span>
  );
}

function Tick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ helpers */

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%2312110f' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

/** Parts gathered for the side: a repeated part's copies sit together under one heading. */
function groups(parts: FormPart[]) {
  const out: { key: string; title: string; repeat: boolean; parts: FormPart[] }[] = [];
  for (const p of parts) {
    if (p.repeat) {
      const last = out[out.length - 1];
      if (last?.repeat && last.key === p.repeat.group) last.parts.push(p);
      else out.push({ key: p.repeat.group, title: p.repeat.groupTitle, repeat: true, parts: [p] });
    } else out.push({ key: p.key, title: p.title, repeat: false, parts: [p] });
  }
  return out;
}

/** Whether a question has what it asks for. A prefilled answer left as it came is still empty. */
function isDone(q: Question, answers: BriefAnswers, files: BriefFile[]) {
  const value = answers[q.id];
  const typed = Array.isArray(value)
    ? value.length > 0
    : typeof value === "string" && value.trim() !== "" && value.trim() !== (q.prefill ?? "").trim();
  const filed = files.some((f) => f.question === q.id);
  if (q.kind === "file") return filed;
  if (q.kind === "either") return typed || filed;
  return typed;
}

function answeredIn(part: FormPart, answers: BriefAnswers, files: BriefFile[]) {
  return part.questions.filter((q) => q.kind !== "note" && isDone(q, answers, files)).length;
}

function progressText(part: FormPart, answers: BriefAnswers, files: BriefFile[]) {
  const total = part.questions.filter((q) => q.kind !== "note").length;
  return `${answeredIn(part, answers, files)} of ${total} done`;
}

function statusWord(status: PartStatus) {
  return {
    read: "To read",
    empty: "Not started",
    started: "Started",
    sent: "Sent",
    received: "We have it",
  }[status];
}

function optionSuffix(status: PartStatus) {
  return status === "sent" ? " (sent)" : status === "received" ? " (we have it)" : "";
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function longDate(ymd: string) {
  const d = new Date(`${ymd}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** The part on screen, kept in the address (#brand, #weekly-03) so a refresh or a shared link lands on it. */
function useCurrentPart(parts: FormPart[]): [string, (key: string) => void] {
  const first = parts[0]?.key ?? "";
  const [current, setCurrentState] = React.useState(first);

  React.useEffect(() => {
    const read = () => {
      const key = decodeURIComponent(window.location.hash.slice(1));
      if (parts.some((p) => p.key === key)) setCurrentState(key);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [parts]);

  const set = React.useCallback((key: string) => {
    setCurrentState(key);
    window.history.replaceState(null, "", `#${encodeURIComponent(key)}`);
  }, []);

  return [current, set];
}

/**
 * Answers that save themselves after a short pause. The whole set goes each time, so a save that
 * lands late or twice does no harm. `settle` waits out any save in flight and hands back the
 * latest answers, so a part sent straight after typing carries every last word.
 */
function useAnswerSaver(token: string, initial: BriefAnswers) {
  const [answers, setAnswers] = React.useState<BriefAnswers>(initial);
  const [state, setState] = React.useState<SaveState>("saved");
  const [error, setError] = React.useState<string | null>(null);

  const latest = React.useRef(answers);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = React.useRef<Promise<void> | null>(null);
  const again = React.useRef(false);

  const flush = React.useCallback(async (): Promise<void> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) {
      again.current = true;
      return inFlight.current;
    }
    setState("saving");
    const run = (async () => {
      const result = await saveBrief(token, latest.current);
      if (result.ok) {
        setState("saved");
        setError(null);
      } else {
        setState("failed");
        setError(result.error);
      }
    })();
    inFlight.current = run;
    await run;
    inFlight.current = null;
    if (again.current) {
      again.current = false;
      await flush();
    }
  }, [token]);

  const update = React.useCallback(
    (id: string, value: string | string[]) => {
      setAnswers((prev) => {
        const next = { ...prev, [id]: value };
        latest.current = next;
        return next;
      });
      setState("waiting");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_AFTER_MS);
    },
    [flush],
  );

  const settle = React.useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) await inFlight.current;
    return latest.current;
  }, []);

  // Leaving the page with a save still waiting: send it now.
  React.useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && timer.current) void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  const markSaved = React.useCallback(() => {
    setState("saved");
    setError(null);
  }, []);

  return { answers, state, error, update, settle, flush, markSaved };
}
