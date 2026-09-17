"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Controls for the file repository, drawn in the document language: filled pills, no outlines,
 * generous radii. Colours resolve to the `--doc-*` tokens that `.drive` shares with the sheets.
 */

type Tone = "ink" | "fill" | "ghost" | "danger";

const TONE: Record<Tone, string> = {
  ink: "bg-[var(--doc-fill-ink)] text-white hover:bg-[#2b2925]",
  fill: "bg-[var(--doc-fill)] text-[var(--doc-ink)] hover:bg-[var(--doc-fill-strong)]",
  ghost: "text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill)] hover:text-[var(--doc-ink)]",
  danger: "bg-danger text-white hover:bg-[#9a2019]",
};

export const Pill = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: "sm" | "md" }
>(function Pill({ tone = "fill", size = "md", className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap",
        "transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]",
        size === "md" ? "h-11 px-4.5 text-sm sm:h-10" : "h-9 px-3.5 text-[13px] sm:h-8",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
});

/** A round, icon-only button. Always carries an accessible name. */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: Tone; size?: "sm" | "md" }
>(function IconButton({ label, tone = "ghost", size = "md", className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-out",
        "disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]",
        size === "md" ? "h-11 w-11 sm:h-10 sm:w-10" : "h-9 w-9 sm:h-8 sm:w-8",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ dialog */

/**
 * A dialog on paper. A centred card on a desktop, a sheet rising from the bottom on a phone,
 * where the thumb already is. Escape and the backdrop close it; focus goes in and comes back.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const panel = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>(
      "[data-autofocus], input, button:not([data-dialog-close])",
    );
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="drive fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="drive-fade absolute inset-0 bg-[rgba(18,17,15,0.42)]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "drive-rise relative flex max-h-[88dvh] w-full flex-col bg-[var(--doc-paper)] text-[var(--doc-ink-body)]",
          "rounded-t-[1.5rem] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_40px_-12px_rgba(18,17,15,0.3)]",
          "sm:max-w-md sm:rounded-[var(--doc-r-panel)] sm:pb-0 sm:shadow-[0_24px_60px_-16px_rgba(18,17,15,0.35)]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-7 sm:pt-7">
          <h2 id={titleId} className="font-display text-xl leading-tight font-semibold tracking-[-0.02em] text-[var(--doc-ink)]">
            {title}
          </h2>
          <IconButton label="Close" size="sm" onClick={onClose} data-dialog-close className="-mt-1 -mr-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-3 pb-2 sm:px-7">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 px-6 pt-4 pb-6 sm:flex-row sm:justify-end sm:px-7 sm:pb-7">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------- menu */

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Shown on the right on a desktop, e.g. "F2". */
  hint?: string;
}

export type MenuAnchor = { x: number; y: number; alignRight?: boolean };

/**
 * An item's actions. Opens beside the button (or at the pointer, for a right-click). On a
 * phone it becomes an action sheet with the item's name on top, which is what a phone user
 * expects from a long list of choices.
 */
export function Menu({
  anchor,
  title,
  items,
  onClose,
}: {
  anchor: MenuAnchor | null;
  title: string;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  const [sheet, setSheet] = React.useState(false);

  React.useLayoutEffect(() => {
    if (!anchor) return;
    const narrow = window.matchMedia("(max-width: 639px)").matches;
    setSheet(narrow);
    if (narrow || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const margin = 8;
    let left = anchor.alignRight ? anchor.x - width : anchor.x;
    let top = anchor.y;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    if (top + height > window.innerHeight - margin) top = Math.max(margin, anchor.y - height - 44);
    setPos({ left, top });
  }, [anchor]);

  React.useEffect(() => {
    if (!anchor) return;
    const first = ref.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const all = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
      const at = all.indexOf(document.activeElement as HTMLElement);
      const next = e.key === "ArrowDown" ? (at + 1) % all.length : (at - 1 + all.length) % all.length;
      all[next]?.focus();
    };
    const close = () => onClose();
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", close);
    };
  }, [anchor, onClose]);

  if (!anchor || typeof document === "undefined") return null;

  const list = (
    <div role="menu" aria-label={title} className="flex flex-col p-1.5">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            onClose();
            item.onSelect();
          }}
          className={cn(
            "flex h-12 w-full items-center gap-3 rounded-[0.875rem] px-3.5 text-left text-[15px] sm:h-10 sm:text-sm",
            "transition-colors duration-100 outline-none disabled:opacity-40",
            "hover:bg-[var(--doc-fill)] focus-visible:bg-[var(--doc-fill)]",
            item.danger ? "text-danger" : "text-[var(--doc-ink)]",
          )}
        >
          <span className={cn("flex w-5 justify-center", item.danger ? "text-danger" : "text-[var(--doc-ink-soft)]")}>
            {item.icon}
          </span>
          <span className="flex-1">{item.label}</span>
          {item.hint && <span className="hidden text-xs text-[var(--doc-ink-soft)] sm:inline">{item.hint}</span>}
        </button>
      ))}
    </div>
  );

  return createPortal(
    <div className="drive fixed inset-0 z-[65]" onContextMenu={(e) => e.preventDefault()}>
      <div
        className={cn("absolute inset-0", sheet && "drive-fade bg-[rgba(18,17,15,0.42)]")}
        onPointerDown={onClose}
        aria-hidden
      />
      {sheet ? (
        <div
          ref={ref}
          className="drive-rise absolute inset-x-0 bottom-0 rounded-t-[1.5rem] bg-[var(--doc-paper)] px-2 pt-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_40px_-12px_rgba(18,17,15,0.3)]"
        >
          <p className="truncate px-4 pb-2 text-sm font-semibold text-[var(--doc-ink)]">{title}</p>
          {list}
        </div>
      ) : (
        <div
          ref={ref}
          style={pos ? { left: pos.left, top: pos.top } : { left: anchor.x, top: anchor.y, visibility: "hidden" }}
          className="drive-pop absolute w-60 rounded-[1.125rem] bg-[var(--doc-paper)] shadow-[0_2px_6px_rgba(18,17,15,0.08),0_16px_40px_-10px_rgba(18,17,15,0.3)]"
        >
          {list}
        </div>
      )}
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------- utilities */

/** A text field in the document language: a filled pill with no outline until focused. */
export const FieldPill = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function FieldPill({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-full bg-[var(--doc-fill)] px-4 text-base text-[var(--doc-ink)] sm:h-10 sm:text-sm",
          "placeholder:text-[var(--doc-ink-soft)] outline-none transition-[background-color,box-shadow] duration-150",
          "focus:bg-[var(--doc-paper)] focus:shadow-[0_0_0_2px_var(--doc-ink)]",
          className,
        )}
        {...props}
      />
    );
  },
);

/** The pointer is a mouse or pen with hover, rather than a finger. */
export function useFinePointer() {
  const [fine, setFine] = React.useState(true);
  React.useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

/** A value kept in localStorage: view mode, sort order. Falls back quietly when storage is off. */
export function useStoredState<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const [value, setValue] = React.useState<T>(fallback);
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(key) as T | null;
      if (stored && allowed.includes(stored)) setValue(stored);
    } catch {
      // storage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = React.useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // storage unavailable
      }
    },
    [key],
  );
  return [value, set] as const;
}
