"use client";

import * as React from "react";
import { publicBaseUrl } from "@/lib/utils";

/** A private link shown as text, with a button that copies it. The path is joined to the hub's origin. */
export function CopyLink({ path }: { path: string }) {
  const [url, setUrl] = React.useState(path);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => setUrl(`${publicBaseUrl()}${path}`), [path]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard refused: the link stays on screen to select by hand.
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 truncate rounded bg-muted px-2 py-1 text-xs">{url}</code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
