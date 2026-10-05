import { BrandLockup } from "@/components/brand-mark";

/**
 * The frame around a share link. Whoever opens one may be a printer or a colleague rather than
 * the client, so it carries only the brand: no project tracking, nothing that assumes an account.
 */
export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-4">
          <BrandLockup />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
      <footer className="border-t bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} SaharaBase Technologies · Accra, Ghana
        </div>
      </footer>
    </div>
  );
}
