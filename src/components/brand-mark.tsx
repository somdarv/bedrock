import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * SaharaBase brand icon. Uses the real logo asset (public/brand). Defaults to the
 * black mark for light surfaces; pass variant="white" on dark backgrounds.
 */
export function BrandMark({
  className,
  variant = "black",
}: {
  className?: string;
  variant?: "black" | "white";
}) {
  return (
    <Image
      src={`/brand/icon-${variant}.png`}
      alt="SaharaBase"
      width={110}
      height={89}
      priority
      className={cn("h-7 w-auto", className)}
    />
  );
}

/**
 * Full SaharaBase wordmark logo (public/brand). Use where the full brand should
 * read, e.g. the sign-in screen.
 */
export function BrandLogo({
  className,
  variant = "black",
}: {
  className?: string;
  variant?: "black" | "white";
}) {
  return (
    <Image
      src={`/brand/logo-${variant}.png`}
      alt="SaharaBase"
      width={497}
      height={107}
      priority
      className={cn("h-7 w-auto", className)}
    />
  );
}

/** Icon + product name — the sidebar/header lockup. */
export function BrandLockup({
  className,
  variant = "black",
}: {
  className?: string;
  variant?: "black" | "white";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark variant={variant} />
      <div className="leading-tight">
        <div
          className={cn(
            "font-display text-[15px] font-semibold tracking-tightest",
            variant === "white" ? "text-white" : "text-foreground",
          )}
        >
          Bedrock
        </div>
        <div className={cn("text-[11px] tracking-wide", variant === "white" ? "text-white/60" : "text-subtle")}>
          by SaharaBase
        </div>
      </div>
    </div>
  );
}
