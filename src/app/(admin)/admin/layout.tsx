import Link from "next/link";
import { BrandLockup } from "@/components/brand-mark";
import { UserMenu } from "@/components/admin/user-menu";
import { requireSession } from "@/lib/auth/session";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/packages", label: "Work Packages" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: every /admin/* route requires a valid session.
  const user = await requireSession();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-surface md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <BrandLockup />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4 text-xs text-subtle">Admin · v0.1</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-surface px-6">
          <span className="text-sm font-medium text-muted-foreground">Bedrock Admin</span>
          <UserMenu user={user} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
