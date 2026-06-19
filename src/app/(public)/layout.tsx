import Link from "next/link";
import { BrandLockup } from "@/components/brand-mark";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/">
            <BrandLockup />
          </Link>
          <Link
            href="/lookup"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Find my packages
          </Link>
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
