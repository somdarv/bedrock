import Link from "next/link";
import { BrandLogo } from "@/components/brand-mark";

/**
 * Layout for client-facing offer pages. Wider than the portal (a configurator needs
 * the room) and branded SaharaBase rather than Bedrock — the school is buying a school
 * management system, not our internal tooling.
 */
export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print border-b border-border bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/">
            <BrandLogo />
          </Link>
          <a
            href="tel:+233592123054"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            059 212 3054
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="no-print border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SaharaBase Technologies · Accra, Ghana</span>
          <span className="text-subtle">17 Alhaji Sulley Road, Abelemkpe</span>
        </div>
      </footer>
    </div>
  );
}
