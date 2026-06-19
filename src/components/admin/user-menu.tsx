import { logout } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/api";

export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <div className="text-sm font-medium">{user.name}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
