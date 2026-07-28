"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_GENERATOR,
  entropyBits,
  generatePassword,
  ratePassword,
  type GeneratorOptions,
} from "@/lib/vault/generator";
import { cn } from "@/lib/utils";

/** Inline generator for the entry form. Applying it hands the password back to the parent. */
export function PasswordGenerator({ onApply }: { onApply: (password: string) => void }) {
  const [options, setOptions] = React.useState<GeneratorOptions>(DEFAULT_GENERATOR);
  const [candidate, setCandidate] = React.useState("");

  const roll = React.useCallback((next: GeneratorOptions) => {
    setCandidate(generatePassword(next));
  }, []);

  React.useEffect(() => roll(options), [options, roll]);

  const set = <K extends keyof GeneratorOptions>(field: K, value: GeneratorOptions[K]) =>
    setOptions((o) => ({ ...o, [field]: value }));

  const bits = entropyBits(candidate);

  return (
    <div className="border-border bg-muted/40 mt-3 space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <code className="border-border bg-surface min-w-0 flex-1 rounded-md border px-3 py-2 font-mono text-sm break-all">
          {candidate}
        </code>
        <Button type="button" size="sm" variant="outline" onClick={() => roll(options)}>
          Reroll
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="pg-length" className="text-muted-foreground shrink-0 text-xs">
          Length
        </label>
        <input
          id="pg-length"
          type="range"
          min={12}
          max={64}
          value={options.length}
          onChange={(e) => set("length", Number(e.target.value))}
          className="h-1 flex-1 accent-current"
        />
        <span className="w-6 shrink-0 text-right text-xs tabular-nums">{options.length}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Toggle label="A-Z" checked={options.upper} onChange={(v) => set("upper", v)} />
        <Toggle label="0-9" checked={options.digits} onChange={(v) => set("digits", v)} />
        <Toggle label="Symbols" checked={options.symbols} onChange={(v) => set("symbols", v)} />
        <span
          className={cn(
            "ml-auto text-xs tabular-nums",
            ratePassword(candidate).verdict === "strong" ? "text-success" : "text-muted-foreground",
          )}
        >
          ~{bits} bits
        </span>
      </div>

      <Button type="button" size="sm" className="w-full" onClick={() => onApply(candidate)}>
        Use this password
      </Button>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-current"
      />
      <span className="font-mono">{label}</span>
    </label>
  );
}
