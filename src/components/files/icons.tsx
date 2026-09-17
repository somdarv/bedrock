import * as React from "react";
import type { DeliverableType } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { extensionOf } from "@/lib/files/tree";

/**
 * The file repository's icons. Same 24px grid, 1.6 stroke and round joins as the admin sidebar,
 * so a folder here and a nav item there read as one hand.
 */

type P = { className?: string };

function Svg({ className, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[18px] w-[18px] shrink-0", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const FolderIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2.2h7.4a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
  </Svg>
);
export const FolderFilledIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={cn("h-5 w-5 shrink-0", className)} aria-hidden>
    <path
      fill="currentColor"
      d="M3 7.25A2.25 2.25 0 0 1 5.25 5h3.9c.36 0 .7.15.94.42L11.8 7.3h6.95A2.25 2.25 0 0 1 21 9.55v7.2A2.25 2.25 0 0 1 18.75 19H5.25A2.25 2.25 0 0 1 3 16.75Z"
    />
  </svg>
);
export const FolderPlusIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2.2h7.4a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    <path d="M12 11v5M9.5 13.5h5" />
  </Svg>
);
export const UploadIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9" />
    <path d="M4.5 15v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
  </Svg>
);
export const DownloadIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 4.5v11M7.5 11 12 15.5 16.5 11" />
    <path d="M4.5 15v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
  </Svg>
);
export const MoveIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2.2h7.4a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    <path d="M9 13.5h6M12.5 11l2.5 2.5-2.5 2.5" />
  </Svg>
);
export const TrashIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
    <path d="M6.5 7l.8 11.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
  </Svg>
);
export const PencilIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M14.5 5.5l4 4M4.5 19.5l1-4.2L15.8 5a1.4 1.4 0 0 1 2 0l1.2 1.2a1.4 1.4 0 0 1 0 2L8.7 18.5Z" />
  </Svg>
);
export const MoreIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={cn("h-[18px] w-[18px] shrink-0", className)} aria-hidden>
    <circle cx="12" cy="5.5" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="18.5" r="1.6" fill="currentColor" />
  </svg>
);
export const GridIcon = ({ className }: P) => (
  <Svg className={className}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
  </Svg>
);
export const ListIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" strokeWidth="2.4" />
  </Svg>
);
export const SearchIcon = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);
export const CloseIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);
export const ChevronRightIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);
export const ChevronLeftIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
);
export const ChevronDownIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);
export const CheckIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M5 12.5 9.5 17 19 7.5" strokeWidth="2.8" />
  </Svg>
);
export const LockIcon = ({ className }: P) => (
  <Svg className={className}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
);
export const PlayIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4 shrink-0", className)} aria-hidden>
    <path fill="currentColor" d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l10-6.2a.8.8 0 0 0 0-1.4l-10-6.2A.8.8 0 0 0 8 5.8Z" />
  </svg>
);
export const OpenIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M2.8 12s3.4-6.5 9.2-6.5 9.2 6.5 9.2 6.5-3.4 6.5-9.2 6.5S2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const ArrowUpRightIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M7.5 16.5 16.5 7.5M9 7.5h7.5V15" />
  </Svg>
);

/**
 * The tile a file shows when there is no picture of it: its extension, set large. A PSD and a
 * ZIP are told apart by name, which is how the people using this read them anyway.
 */
export function FileGlyph({
  filename,
  type,
  size = "md",
  className,
}: {
  filename: string;
  type: DeliverableType;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const ext = (extensionOf(filename) || type).slice(0, 5).toUpperCase();
  return (
    <span
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 text-[var(--doc-ink-soft)]",
        className,
      )}
      aria-hidden
    >
      <span
        className={cn(
          "font-display leading-none font-semibold tracking-[-0.02em] text-[var(--doc-ink)]",
          size === "sm" && "text-[0.625rem]",
          size === "md" && "text-[1.375rem]",
          size === "lg" && "text-[3rem]",
        )}
      >
        {ext}
      </span>
      {size !== "sm" && type === "video" && (
        <span className="inline-flex items-center gap-1 text-xs">
          <PlayIcon className="h-3 w-3" /> Video
        </span>
      )}
    </span>
  );
}
