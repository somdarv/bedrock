"use client";

import * as React from "react";
import { CopyButton } from "./secret-value";
import { generateTotp, isValidTotpSecret, secondsRemaining, TOTP_PERIOD } from "@/lib/vault/totp";
import { cn } from "@/lib/utils";

/**
 * The live six-digit code for an entry's TOTP seed, with the time left before it rolls.
 *
 * Worth being clear about what this does not change: holding the seed next to the password
 * means one unlocked vault yields both factors, so this is a convenience, not a second factor
 * in the sense 2FA intends. It is still a real gain over a seed sitting in a text file, and the
 * backup codes below it are the part that actually saves you when a phone is lost.
 */
export function TotpCode({ secret }: { secret: string }) {
  const [code, setCode] = React.useState<string | null>(null);
  const [remaining, setRemaining] = React.useState(TOTP_PERIOD);
  const [error, setError] = React.useState<string | null>(null);

  const valid = isValidTotpSecret(secret);

  React.useEffect(() => {
    if (!valid) {
      setError("This does not look like a valid base32 seed.");
      setCode(null);
      return;
    }

    setError(null);
    let cancelled = false;

    const tick = async () => {
      try {
        const next = await generateTotp(secret);
        if (!cancelled) {
          setCode(next);
          setRemaining(secondsRemaining());
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not generate a code.");
      }
    };

    void tick();
    // One second is enough: the countdown needs it and regenerating is cheap.
    const timer = setInterval(tick, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [secret, valid]);

  if (error) {
    return (
      <div className="border-border text-muted-foreground rounded-lg border px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  const expiring = remaining <= 5;

  return (
    <div className="border-border bg-muted/40 flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">One-time code</div>
        <div
          className={cn(
            "mt-0.5 font-mono text-2xl font-semibold tracking-[0.2em] tabular-nums transition-colors",
            expiring && "text-warning",
          )}
        >
          {code ? `${code.slice(0, 3)} ${code.slice(3)}` : "••• •••"}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Countdown remaining={remaining} expiring={expiring} />
        {code && <CopyButton value={code} label="Copy one-time code" />}
      </div>
    </div>
  );
}

/** A ring that drains over the code's 30 second life. */
function Countdown({ remaining, expiring }: { remaining: number; expiring: boolean }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / TOTP_PERIOD;

  return (
    <span
      className="relative inline-flex h-7 w-7 items-center justify-center"
      title={`${remaining}s until this code changes`}
      aria-label={`${remaining} seconds remaining`}
    >
      <svg viewBox="0 0 28 28" className="h-7 w-7 -rotate-90" aria-hidden>
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-border"
        />
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            expiring ? "text-warning" : "text-foreground",
          )}
        />
      </svg>
      <span className="text-muted-foreground absolute text-[10px] font-medium tabular-nums">
        {remaining}
      </span>
    </span>
  );
}
