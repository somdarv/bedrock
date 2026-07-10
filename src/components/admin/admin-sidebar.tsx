"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo, BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ icons */
type IconProps = { className?: string };
const s = (className?: string) => cn("h-[18px] w-[18px] shrink-0", className);

const DashboardIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={s(className)} aria-hidden>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
const ClientsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={s(className)} aria-hidden>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" />
    <path d="M17.5 14.4A5.5 5.5 0 0 1 20.5 19.5" />
  </svg>
);
const PackagesIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={s(className)} aria-hidden>
    <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
    <path d="M3.5 7 12 11.5 20.5 7" />
    <path d="M12 11.5V21.5" />
  </svg>
);
const InfraIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={s(className)} aria-hidden>
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
    <path d="M7 7h.01M7 17h.01" />
  </svg>
);
const DocumentsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={s(className)} aria-hidden>
    <path d="M6 2.5h7l5 5V21a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 21V3a.5.5 0 0 1 .5-.5Z" />
    <path d="M13 2.5V7.5h5" />
    <path d="M9 13h6M9 16.5h6" />
  </svg>
);
const SettingsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={s(className)} aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.5M12 19v2.5M4.4 4.4l1.8 1.8M17.8 17.8l1.8 1.8M2.5 12H5M19 12h2.5M4.4 19.6l1.8-1.8M17.8 6.2l1.8-1.8" />
  </svg>
);
const Chevron = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4 shrink-0", className)} aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const PanelIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={cn("h-[18px] w-[18px] shrink-0", className)} aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
);

/* ------------------------------------------------------------------- model */
type Counts = { attention: number; infra: number };

type Item =
  | { kind: "link"; href: string; label: string; Icon: React.FC<IconProps>; badge?: keyof Counts }
  | {
      kind: "group";
      label: string;
      Icon: React.FC<IconProps>;
      children: { href: string; label: string }[];
    };

const NAV: Item[] = [
  { kind: "link", href: "/admin", label: "Dashboard", Icon: DashboardIcon },
  { kind: "link", href: "/admin/clients", label: "Clients", Icon: ClientsIcon },
  { kind: "link", href: "/admin/packages", label: "Work Packages", Icon: PackagesIcon, badge: "attention" },
  { kind: "link", href: "/admin/infrastructure", label: "Infrastructure", Icon: InfraIcon, badge: "infra" },
  {
    kind: "group",
    label: "Documents",
    Icon: DocumentsIcon,
    children: [
      { href: "/admin/documents/invoices", label: "Invoices" },
      { href: "/admin/documents/proposals", label: "Proposals" },
      { href: "/admin/documents/quotes", label: "Quotes" },
      { href: "/admin/documents/receipts", label: "Receipts" },
    ],
  },
];

const FOOTER: { href: string; label: string; Icon: React.FC<IconProps> }[] = [
  { href: "/admin/settings", label: "Settings", Icon: SettingsIcon },
];

const STORAGE_KEY = "bedrock:sidebar-collapsed";

/* --------------------------------------------------------------- component */
export function AdminSidebar({ counts }: { counts: Counts }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  // Restore collapse state.
  React.useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
        collapsed ? "w-17" : "w-64",
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center px-0" : "px-6")}>
        {collapsed ? <BrandMark /> : <BrandLogo className="h-7" />}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        {!collapsed && <div className="eyebrow px-3 pb-2 pt-1">Workspace</div>}

        {NAV.map((item) => {
          if (item.kind === "link") {
            const active = isActive(item.href);
            const count = item.badge ? counts[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(rowClass(active), collapsed && "justify-center px-0")}
              >
                <ActiveBar active={active} collapsed={collapsed} />
                <item.Icon className={iconClass(active)} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.badge && count > 0 && <CountBadge n={count} />}
              </Link>
            );
          }

          // group — open if the user toggled it, otherwise when it holds the active route.
          const anyActive = item.children.some((c) => pathname.startsWith(c.href));
          const open = openGroups[item.label] ?? anyActive;

          if (collapsed) {
            // Collapsed: the group icon links to its first child.
            return (
              <Link
                key={item.label}
                href={item.children[0].href}
                title={item.label}
                className={cn(rowClass(anyActive), "justify-center px-0")}
              >
                <ActiveBar active={anyActive} collapsed />
                <item.Icon className={iconClass(anyActive)} />
              </Link>
            );
          }

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => setOpenGroups((g) => ({ ...g, [item.label]: !open }))}
                aria-expanded={open}
                className={cn(rowClass(anyActive && !open), "w-full")}
              >
                <ActiveBar active={anyActive && !open} collapsed={false} />
                <item.Icon className={iconClass(anyActive)} />
                <span className="flex-1 truncate text-left">{item.label}</span>
                <Chevron className={cn("text-subtle transition-transform duration-200", open && "rotate-180")} />
              </button>

              {open && (
                <div className="mb-1 ml-6.5 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
                  {item.children.map((c) => {
                    const active = pathname.startsWith(c.href);
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto shrink-0 border-t border-border px-3 py-3">
        {FOOTER.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(rowClass(active), collapsed && "justify-center px-0")}
            >
              <ActiveBar active={active} collapsed={collapsed} />
              <item.Icon className={iconClass(active)} />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={toggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <PanelIcon className="text-subtle" />
          {!collapsed && <span className="flex-1 text-left">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

/* --------------------------------------------------------------- fragments */
function rowClass(active: boolean) {
  return cn(
    "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
    active
      ? "bg-muted font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

function iconClass(active: boolean) {
  return cn(
    "h-[18px] w-[18px] shrink-0 transition-colors",
    active ? "text-foreground" : "text-subtle group-hover:text-foreground",
  );
}

function ActiveBar({ active, collapsed }: { active: boolean; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <span
      className={cn(
        "absolute left-0 h-5 w-0.5 rounded-full bg-foreground transition-transform duration-300",
        active ? "scale-y-100" : "scale-y-0",
      )}
    />
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground group-aria-[current=page]:bg-foreground group-aria-[current=page]:text-primary-foreground">
      {n > 99 ? "99+" : n}
    </span>
  );
}
