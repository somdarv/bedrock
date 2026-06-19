import { cn } from "@/lib/utils";

/**
 * SaharaBase monochrome brand mark. Single-color by design so it doubles as the
 * deliverable watermark glyph. Inherits `currentColor`.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-7 w-7", className)}
    >
      <rect x="2" y="2" width="28" height="28" rx="7" fill="currentColor" opacity="0.12" />
      <path
        d="M9 22l5-12 2 5 2-5 5 12"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="text-primary" />
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Bedrock</div>
        <div className="text-[11px] text-muted-foreground">SaharaBase</div>
      </div>
    </div>
  );
}
