import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { UserMenu } from "@/components/admin/user-menu";
import { requireSession } from "@/lib/auth/session";
import { api } from "@/lib/api";

const ATTENTION_STATUSES = ["sent", "awaiting_deposit", "awaiting_final_payment"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: every /admin/* route requires a valid session.
  const user = await requireSession();

  // Live nav badges: packages waiting on payment, and infrastructure needing attention.
  const [packages, infra] = await Promise.all([
    api.packages.list().catch(() => []),
    api.infrastructure.overview().catch(() => ({ attention: [], all: [] })),
  ]);
  const attention = packages.filter((p) => ATTENTION_STATUSES.includes(p.status)).length;
  const infraAttention = infra.attention.length;

  return (
    // App shell: locked to the viewport. The page never scrolls — only <main> does.
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar counts={{ attention, infra: infraAttention }} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6 md:px-10">
          <span className="eyebrow">Bedrock Admin</span>
          <UserMenu user={user} />
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
