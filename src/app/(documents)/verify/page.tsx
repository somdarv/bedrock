"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-mark";

/**
 * Pull the document reference out of whatever the user pastes: a bare Document ID,
 * a full verify URL (hub.saharabasetech.com/verify/{ID}), or a link with query/hash.
 */
function extractRef(input: string): string {
  const value = input.trim();
  if (!value) return "";

  const marker = "/verify/";
  const at = value.indexOf(marker);
  if (at !== -1) {
    return value
      .slice(at + marker.length)
      .replace(/[/?#].*$/, "")
      .trim();
  }

  try {
    const url = new URL(value);
    const seg = url.pathname.split("/").filter(Boolean).pop();
    if (seg) return seg;
  } catch {
    // not a URL — treat the whole thing as the reference
  }

  return value;
}

export default function VerifyLookupPage() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = extractRef(value);
    if (!ref) {
      setError("Enter a document ID or paste its verify link.");
      return;
    }
    router.push(`/verify/${encodeURIComponent(ref)}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <BrandLogo className="h-6" />
          <span className="eyebrow">Verify</span>
        </div>

        <form onSubmit={submit} className="px-6 py-6">
          <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Verify a document
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Paste the document&apos;s verification code or its full verify link to confirm it was
            issued by SaharaBase.
          </p>

          <label htmlFor="ref" className="eyebrow mt-6 block">
            Document ID or link
          </label>
          <input
            id="ref"
            name="ref"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="SAH-BD-20260630-BIL-DYN-52  ·  or  hub.saharabasetech.com/verify/…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="mt-2 h-11 w-full rounded-md border border-input bg-surface px-3 text-sm placeholder:text-subtle focus-visible:border-ring focus-visible:outline-none"
          />
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}

          <button
            type="submit"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Verify document
          </button>
        </form>

        <div className="border-t border-border px-6 py-3 text-[10px] text-subtle">
          www.saharabasetech.com
        </div>
      </div>
    </div>
  );
}
