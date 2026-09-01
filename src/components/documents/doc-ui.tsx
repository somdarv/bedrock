import { cn } from "@/lib/utils";
import { VERIFY_BASE_URL, type DocumentRecord } from "@/lib/documents/registry";

/**
 * Document primitives — the shared visual language for every sheet Bedrock issues.
 *
 * One rule holds the whole system together: structure comes from fill, never from a
 * line. There is no border anywhere in a document body. A block is told apart from
 * the one beside it by a light tint on the white sheet and a generous radius.
 *
 * Nesting alternates against the ground rather than stacking the same tone twice: a
 * tinted `Panel` sitting on the white sheet takes paper `Inset`s inside it, and an
 * `ink` panel remaps its tokens (see `.doc-invert` in globals.css) so anything
 * dropped inside it flips without a single component needing to know where it is.
 *
 * Sizes, fills and radii all resolve to the `--doc-*` custom properties declared in
 * globals.css, so the whole document estate reskins from one place — and steps down
 * to phone proportions there too.
 */

type Tone = "paper" | "quiet" | "base" | "strong" | "ink";

const PANEL_TONE: Record<Tone, string> = {
  paper: "bg-[var(--doc-paper)]",
  quiet: "bg-[var(--doc-fill-quiet)]",
  base: "bg-[var(--doc-fill)]",
  strong: "bg-[var(--doc-fill-strong)]",
  ink: "bg-[var(--doc-fill-ink)] doc-invert",
};

/* ── Blocks ─────────────────────────────────────────────────────────── */

/**
 * A filled block on the sheet. The workhorse: letterhead, option cards, callouts,
 * closing notes. `flush` drops the padding for callers laying out their own grid.
 */
export function Panel({
  tone = "base",
  className,
  flush,
  children,
}: {
  tone?: Tone;
  className?: string;
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--doc-r-panel)]",
        PANEL_TONE[tone],
        !flush && "p-6 sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A block nested inside a Panel. Defaults to paper so it reads as a cut-out lying on
 * the tint — the alternation that replaces an inner border.
 */
export function Inset({
  tone = "paper",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-[var(--doc-r-inset)] p-5 sm:p-6", PANEL_TONE[tone], className)}>
      {children}
    </div>
  );
}

/** A pill. Used for the option index and the appendix marker. */
export function Chip({
  tone = "strong",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--doc-r-chip)] px-3.5 py-1.5",
        "text-[length:var(--doc-t-micro)] font-semibold tracking-[0.16em] uppercase",
        "text-[var(--doc-ink)]",
        PANEL_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Vertical rhythm between the document's top-level parts. */
export function Section({
  className,
  avoidBreak,
  children,
}: {
  className?: string;
  avoidBreak?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("mb-12", avoidBreak && "avoid-break", className)}>{children}</section>
  );
}

/** A rule made of fill rather than a line — the only separator the system allows. */
export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mt-16 mb-10 h-2 rounded-[var(--doc-r-chip)] bg-[var(--doc-fill-strong)]",
        className,
      )}
      aria-hidden
    />
  );
}

/* ── Type ───────────────────────────────────────────────────────────── */

/**
 * The small tracked label above a section heading. Carried over from the SaharaBase
 * marketing site, where it is the editorial signature.
 */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-[length:var(--doc-t-micro)] font-semibold tracking-[0.18em] text-[var(--doc-ink-soft)] uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Heading({
  size = "h3",
  className,
  children,
}: {
  size?: "h1" | "h2" | "h3";
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = size === "h1" ? "h1" : size === "h2" ? "h2" : "h3";
  return (
    <Tag
      className={cn(
        "leading-[1.12] font-semibold tracking-[-0.02em] text-balance text-[var(--doc-ink)]",
        size === "h1" && "text-[length:var(--doc-t-h1)] tracking-[-0.03em]",
        size === "h2" && "text-[length:var(--doc-t-h2)]",
        size === "h3" && "text-[length:var(--doc-t-h3)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Opening prose. One step up from body, for the paragraph that sets a section up. */
export function Lead({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "text-[length:var(--doc-t-lead)] leading-[1.65] text-[var(--doc-ink-body)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function P({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "text-[length:var(--doc-t-body)] leading-[1.7] text-[var(--doc-ink-body)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Small print: captions, footnotes, the line under a figure. */
export function Note({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "text-[length:var(--doc-t-sm)] leading-[1.6] text-[var(--doc-ink-soft)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/* ── Lists ──────────────────────────────────────────────────────────── */

export function BulletList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <ul className={cn("space-y-3", className)}>{children}</ul>;
}

/**
 * The dot sits in a box exactly one line tall, so it optically centres on the first
 * line at any type size instead of being nudged with a hand-tuned margin.
 */
export function Bullet({
  size = "body",
  children,
}: {
  size?: "body" | "sm";
  children: React.ReactNode;
}) {
  const text =
    size === "sm"
      ? "text-[length:var(--doc-t-xs)] leading-[1.6]"
      : "text-[length:var(--doc-t-body)] leading-[1.7]";
  return (
    <li className={cn("flex gap-3 text-[var(--doc-ink-body)]", text)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center",
          size === "sm" ? "h-[1.6em] w-2" : "h-[1.7em] w-2.5",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "rounded-full bg-[var(--doc-ink-soft)]",
            size === "sm" ? "h-[3px] w-[3px]" : "h-[5px] w-[5px]",
          )}
        />
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/**
 * A label/value summary. Rows are told apart by the same zebra the tables use, so
 * the block needs no dividers at all.
 */
export function DetailList({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[var(--doc-r-inset)]">
      <dl className="[&>div:nth-child(even)]:bg-[var(--doc-fill)] [&>div:nth-child(odd)]:bg-[var(--doc-paper)]">
        {children}
      </dl>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    // Stacks on a phone: several of these values are a full sentence of pricing, and
    // squeezed into a right-hand column they wrap to three or four ragged lines.
    <div className="flex flex-col gap-0.5 px-5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
      <dt className="text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">{label}</dt>
      <dd className="text-[length:var(--doc-t-sm)] font-semibold text-[var(--doc-ink)] sm:text-right">
        {value}
      </dd>
    </div>
  );
}

/* ── Figures ────────────────────────────────────────────────────────── */

/**
 * A price. The one place in a document where type is allowed to get loud, so it can
 * carry the decision on its own without a colour or a badge propping it up.
 */
export function Figure({
  value,
  caption,
  className,
}: {
  value: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[length:var(--doc-t-figure)] leading-none font-semibold tracking-[-0.035em] text-[var(--doc-ink)] tabular-nums">
        {value}
      </p>
      {caption && (
        <p className="mt-2 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">{caption}</p>
      )}
    </div>
  );
}

/* ── Letterhead ─────────────────────────────────────────────────────── */

/**
 * The masthead every document opens with. Driven by the registry record so the
 * reference, dates and document type on the page are the ones /verify confirms.
 */
export function Letterhead({ record }: { record: DocumentRecord }) {
  const meta: [string, string][] = [
    ["Reference", record.reference],
    ["Issued", record.issueDate],
    ...(record.validUntil ? ([["Valid until", record.validUntil]] as [string, string][]) : []),
  ];

  return (
    <Panel className="mb-10 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <Heading size="h1" className="max-w-[9ch] leading-[1.02] tracking-[-0.035em]">
          Saharabase Technologies
        </Heading>
        <div className="mt-5 space-y-0.5 text-[length:var(--doc-t-sm)] text-[var(--doc-ink-soft)]">
          <p>17 Alhaji Sulley Road, Abelemkpe, Accra</p>
          <p>059 212 3054 &nbsp;·&nbsp; 050 988 6584</p>
          <p>www.saharabasetech.com</p>
        </div>
      </div>

      {/* Full width on a phone, a fixed column from small up. */}
      <Inset className="w-full shrink-0 sm:w-[15.5rem]">
        <p className="text-[length:var(--doc-t-lead)] leading-tight font-semibold text-[var(--doc-ink)]">
          {record.type}
        </p>
        <dl className="mt-4 space-y-2.5">
          {meta.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[length:var(--doc-t-micro)] tracking-[0.14em] text-[var(--doc-ink-soft)] uppercase">
                {label}
              </dt>
              <dd className="text-[length:var(--doc-t-sm)] font-medium text-[var(--doc-ink)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Inset>
    </Panel>
  );
}

/**
 * The plaintext verify link that rides above the letterhead, so a printed page still
 * carries the address even if the QR is unreadable or the sheet has been photocopied.
 */
export function VerifyLine({ record }: { record: DocumentRecord }) {
  return (
    <p className="mb-3 text-[length:var(--doc-t-micro)] tracking-wide break-all text-[var(--doc-ink-soft)]">
      {VERIFY_BASE_URL.replace(/^https?:\/\//, "")}/verify/{record.id}
    </p>
  );
}
