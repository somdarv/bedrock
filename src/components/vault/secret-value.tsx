"use client";

import * as React from "react";
import { useToast } from "@/components/ui/toast";
import { copySecret } from "@/lib/vault/use-auto-lock";
import { cn } from "@/lib/utils";

const iconClass = "h-4 w-4";

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={iconClass}
    aria-hidden
  >
    <path d="M2.5 12s3.6-6.5 9.5-6.5S21.5 12 21.5 12s-3.6 6.5-9.5 6.5S2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.75" />
    {!open && <path d="m4 20 16-16" />}
  </svg>
);

const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={iconClass}
    aria-hidden
  >
    <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
    <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15" />
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={iconClass}
    aria-hidden
  >
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="text-subtle hover:bg-muted hover:text-foreground rounded-md p-1.5 transition-colors"
    >
      {children}
    </button>
  );
}

/** Copy any value to the clipboard, with the auto-wipe and a transient confirmation. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await copySecret(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("The browser blocked the clipboard.", "danger");
    }
  }

  return (
    <IconButton label={copied ? "Copied" : label} onClick={copy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </IconButton>
  );
}

/**
 * A secret rendered masked, with reveal and copy. Values stay hidden until asked for, so a
 * shoulder-surfer or a screen share sees dots rather than the password. Copy does not require
 * revealing first, which is the safer of the two paths and so gets no extra friction.
 */
export function SecretValue({
  label,
  value,
  mono = true,
  empty = "Not set",
}: {
  label: string;
  value: string;
  mono?: boolean;
  empty?: string;
}) {
  const [shown, setShown] = React.useState(false);

  return (
    <div className="border-border flex items-start justify-between gap-3 border-b py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div
          className={cn(
            "mt-0.5 text-sm break-all",
            mono && "font-mono",
            !value && "text-subtle italic",
          )}
        >
          {!value ? empty : shown ? value : "•".repeat(Math.min(value.length, 24))}
        </div>
      </div>

      {value && (
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton label={shown ? "Hide" : "Reveal"} onClick={() => setShown((s) => !s)}>
            <EyeIcon open={shown} />
          </IconButton>
          <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
        </div>
      )}
    </div>
  );
}

/** A plain (non-secret) detail row, so the entry panel reads as one list. */
export function PlainValue({
  label,
  value,
  href,
  mono = false,
  empty = "Not set",
}: {
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
  empty?: string;
}) {
  return (
    <div className="border-border flex items-start justify-between gap-3 border-b py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div
          className={cn(
            "mt-0.5 text-sm break-all",
            mono && "font-mono",
            !value && "text-subtle italic",
          )}
        >
          {!value ? (
            empty
          ) : href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground underline underline-offset-2"
            >
              {value}
            </a>
          ) : (
            value
          )}
        </div>
      </div>
      {value && (
        <div className="shrink-0">
          <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
        </div>
      )}
    </div>
  );
}
