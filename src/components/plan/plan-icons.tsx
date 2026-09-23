import * as React from "react";
import type { PlanState } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Glyph } from "@/components/files/icons";

/** The plan's few extra icons, drawn in the same hand as the file repository's. */

type P = { className?: string };

export const PlusIcon = ({ className }: P) => (
  <Glyph className={className}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Glyph>
);
export const ChatIcon = ({ className }: P) => (
  <Glyph className={className}>
    <path d="M20 12.5a7 7 0 0 1-7 7H7.8L4 21.5l1-3.6A7 7 0 0 1 11 5h2a7 7 0 0 1 7 7Z" />
  </Glyph>
);
export const CalendarIcon = ({ className }: P) => (
  <Glyph className={className}>
    <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Glyph>
);
export const EyeOffIcon = ({ className }: P) => (
  <Glyph className={className}>
    <path d="M4 4.5 20 20.5" />
    <path d="M9.9 6.1A8.6 8.6 0 0 1 12 5.5c5.8 0 9.2 6.5 9.2 6.5a15 15 0 0 1-3 3.9" />
    <path d="M6.6 8.2A15.3 15.3 0 0 0 2.8 12s3.4 6.5 9.2 6.5a8.8 8.8 0 0 0 3.4-.7" />
    <path d="M10 10.2a2.8 2.8 0 0 0 3.9 3.9" />
  </Glyph>
);
export const PaperclipIcon = ({ className }: P) => (
  <Glyph className={className}>
    <path d="M16.5 8 9.9 14.6a2.1 2.1 0 0 0 3 3l6.8-6.8a4.2 4.2 0 0 0-6-6l-7 7a6.3 6.3 0 0 0 9 9l5.1-5.1" />
  </Glyph>
);
export const ArchiveIcon = ({ className }: P) => (
  <Glyph className={className}>
    <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.5" />
    <path d="M5.5 9v9.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9M10 13h4" />
  </Glyph>
);
export const HandIcon = ({ className }: P) => (
  <Glyph className={className}>
    <path d="M9 11.5V5.8a1.4 1.4 0 0 1 2.8 0v5.2" />
    <path d="M11.8 10.6V4.9a1.4 1.4 0 0 1 2.8 0v5.7" />
    <path d="M14.6 11V7.4a1.4 1.4 0 0 1 2.8 0v7.1a5.5 5.5 0 0 1-5.5 5.5h-.7a5 5 0 0 1-3.8-1.8l-2.6-3a1.4 1.4 0 0 1 2-2L9 15" />
  </Glyph>
);
export const DotIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={cn("h-[18px] w-[18px] shrink-0", className)} aria-hidden>
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
);
export const QuestionIcon = ({ className }: P) => (
  <Glyph className={className}>
    <path d="M9.4 9.3a2.7 2.7 0 1 1 3.6 2.5c-.7.3-1 .9-1 1.6v.6" />
    <path d="M12 17.6h.01" strokeWidth="2.4" />
  </Glyph>
);

/** The mark in front of an item: what state it is in, at a glance. */
export function StateMark({ state, className }: { state: PlanState; className?: string }) {
  if (state === "proposed") return <QuestionIcon className={className} />;
  if (state === "doing") return <DotIcon className={className} />;
  if (state === "shelved") return <ArchiveIcon className={className} />;
  return null;
}
