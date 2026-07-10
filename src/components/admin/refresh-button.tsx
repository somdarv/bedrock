"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Re-fetches the current server-rendered page (live metrics are no-store, so this repulls them). */
export function RefreshButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
    >
      <RefreshIcon spinning={pending} />
      {pending ? "Refreshing…" : label}
    </Button>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
