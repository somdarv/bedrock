import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { Heading, Section } from "./doc-ui";

/**
 * The drawing kit for plans and proposals that argue in pictures: numbered parts joined
 * by bridge lines, boxes and arrows, and one colour code. Dark is our work, light is the
 * client's part. Lifted out of the Nadkof plan on 2026-10-22, when the Ghana Student Awards
 * proposal became the second document to need it.
 */

/* ── Type shorthands ────────────────────────────────────────────────── */

export const SM = "text-[length:var(--doc-t-sm)] leading-[1.55]";
export const XS = "text-[length:var(--doc-t-xs)] leading-[1.5]";
export const MICRO = "text-[length:var(--doc-t-micro)] leading-[1.4]";
export const INK = "text-[var(--doc-ink)]";
export const BODY = "text-[var(--doc-ink-body)]";
export const SOFT = "text-[var(--doc-ink-soft)]";

/* ── Colour ─────────────────────────────────────────────────────────── */

/**
 * Every diagram holds one code: dark is our work, light is the clinic's part. Each side has
 * a deep tone and a lighter one. The deep tone heads a table or marks the main step, and the
 * lighter one fills the rows under it, so a long table never turns into a wall of black.
 *
 * `date` is the calendar: things nobody does. `clay` is the one accent. It is kept for what
 * the eye should follow: the moments cut out of the podcast, the people the funnel loses, the
 * path a stranger takes to a booking, and what the clinic's knowledge turns into.
 *
 * The lighter tints came from the user on 2026-10-08: black and one cream felt limiting.
 */
export type Tone = "ours" | "oursLight" | "yours" | "yoursLight" | "date" | "clay";

export const TONE: Record<Tone, string> = {
  ours: "doc-invert bg-[var(--doc-fill-ink)]",
  oursLight: "doc-invert bg-[#3a3732]",
  yours: "bg-[#dbd6cb]",
  yoursLight: "bg-[#ece8df]",
  date: "bg-[#aba69c]",
  clay: "doc-invert bg-[#94492a]",
};

/**
 * Secondary text on each tone. Main text is always `INK`, which `.doc-invert` flips to white
 * on the dark fills. Soft ink fails contrast on the clay, so clay keeps full ink.
 */
export const TONE_SOFT: Record<Tone, string> = {
  ours: SOFT,
  oursLight: SOFT,
  yours: BODY,
  yoursLight: BODY,
  date: BODY,
  clay: INK,
};

/** The clay at a whisper, for the boxes that name where people get lost. */
export const CLAY_TINT = "bg-[#f4e5dc]";

/** The section numbers. Dark enough to read as large text, light enough to sit back. */
export const NUMBER = "text-[#8a857b]";

/* ── Small parts ────────────────────────────────────────────────────── */

export function Swatch({ tone }: { tone: Tone }) {
  return <span className={cn("h-4 w-4 shrink-0 rounded-[5px]", TONE[tone])} aria-hidden />;
}

/** A key entry. Takes the deep and the light tone, so the reader learns both belong to one side. */
export function KeyItem({ tones, children }: { tones: Tone[]; children: React.ReactNode }) {
  return (
    <span className={cn("flex items-center gap-2.5", SM, BODY)}>
      <span className="flex gap-1">
        {tones.map((t) => (
          <Swatch key={t} tone={t} />
        ))}
      </span>
      {children}
    </span>
  );
}

/** A filled arrow. Points right; rotate it to point down where a row stacks on a phone. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5 shrink-0 text-[var(--doc-ink-soft)]", className)}
      aria-hidden
    >
      <path
        d="M4 12h14M12.5 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Tags({ items, tone = "fill" }: { items: string[]; tone?: "fill" | "paper" }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "rounded-[var(--doc-r-chip)] px-2.5 py-0.5 font-medium whitespace-nowrap",
            MICRO,
            BODY,
            tone === "paper" ? "bg-[var(--doc-paper)]" : "bg-[var(--doc-fill)]",
          )}
        >
          {item}
        </span>
      ))}
    </span>
  );
}

/** A small filled tag in one of the plan's tones. */
export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--doc-r-chip)] px-2.5 py-0.5 font-semibold whitespace-nowrap",
        MICRO,
        INK,
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

/** A numbered section heading. The numbers let the reader see the plan as one sequence. */
export function Head({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4">
      <span
        className={cn(
          "shrink-0 text-[length:var(--doc-t-h3)] leading-[1.12] font-semibold tabular-nums",
          NUMBER,
        )}
      >
        {String(n).padStart(2, "0")}
      </span>
      <Heading className="font-bold">{children}</Heading>
    </div>
  );
}

/**
 * The line that joins a section to the one before it. The user asked for every section to be
 * joined, so the plan reads as one argument. It opens the next section rather than closing the
 * last, inside that section's held-together block, so a page never ends on a lone bridge.
 */
export function Bridge({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 flex items-center gap-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--doc-fill-strong)]">
        <Arrow className="h-4 w-4 rotate-90 text-[var(--doc-ink)]" />
      </span>
      <p className={cn("font-semibold", SM, INK)}>{children}</p>
    </div>
  );
}

/** A numbered part of the plan. Wider apart than a plain section: the user asked for more air. */
export function Part({ className, children }: { className?: string; children: React.ReactNode }) {
  return <Section className={cn("mb-20", className)}>{children}</Section>;
}

export type StepTone = Tone | "quiet" | "raised";

export const STEP_BG: Record<StepTone, string> = {
  ...TONE,
  quiet: "bg-[var(--doc-fill-quiet)]",
  raised: "bg-[var(--doc-fill-strong)]",
};

export const STEP_SOFT: Record<StepTone, string> = { ...TONE_SOFT, quiet: SOFT, raised: SOFT };

export type Step = { tone: StepTone; title: string; sub?: string };

/** Boxes joined by arrows. Runs across from small up, down on a phone. */
export function Steps({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-stretch", className)}>
      {steps.map((s, i) => (
        <Fragment key={s.title}>
          {i > 0 && <Arrow className="mx-auto rotate-90 sm:mx-0 sm:rotate-0 sm:self-center" />}
          <div
            className={cn(
              "min-w-0 flex-1 rounded-[var(--doc-r-inset)] px-4 py-3.5",
              STEP_BG[s.tone],
            )}
          >
            {s.sub && <p className={cn(MICRO, STEP_SOFT[s.tone])}>{s.sub}</p>}
            <p className={cn("mt-0.5 font-semibold", XS, INK)}>{s.title}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/** A filled dot for "yes", a speck for "no". Used by every dot chart in the plan. */
export function Dot({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <span
      role="img"
      aria-label={label}
      className="h-3.5 w-3.5 rounded-full bg-[var(--doc-fill-ink)]"
    />
  ) : (
    <span className="h-1.5 w-1.5 rounded-full bg-[var(--doc-fill-strong)]" aria-hidden />
  );
}

/** A plain list with small dots, for lists that sit inside a filled block. */
export function DotList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <li key={item} className={cn("flex items-baseline gap-2.5", XS, BODY)}>
          <span
            className="h-1.5 w-1.5 shrink-0 -translate-y-px rounded-full bg-[var(--doc-ink-soft)]"
            aria-hidden
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
