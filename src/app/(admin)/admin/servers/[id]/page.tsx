import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/admin/refresh-button";
import { api, ApiError, type ServerMetricsDetail } from "@/lib/api";
import { formatBytes } from "@/lib/infrastructure/display";

export default async function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const data = await api.infrastructure.serverMetrics(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });

  const { server, clientName, details, error } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <BackButton href="/admin/infrastructure" label="Infrastructure" />
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{server.label}</h1>
              <Badge>{server.kind}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {clientName ?? "Sahara (own)"} ·{" "}
              {server.hostname ? `${server.hostname}${server.port ? `:${server.port}` : ""}` : "—"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RefreshButton />
            {details && (
              <p className="text-xs text-subtle">
                as of {new Date(details.fetchedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && !details ? (
        <div className="rounded-lg border bg-surface p-6 text-sm text-muted-foreground">{error}</div>
      ) : details ? (
        <Detail d={details} />
      ) : null}
    </div>
  );
}

function Detail({ d }: { d: ServerMetricsDetail }) {
  const usedForShare = d.disk.usedBytes || 1;

  return (
    <div className="space-y-8">
      {/* Top meters */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Meter
          title="Disk usage"
          value={d.disk.usedBytes}
          limit={d.disk.limitBytes}
          percent={d.disk.percent}
          render={formatBytes}
        />
        <Meter
          title="Inodes (file count)"
          value={d.inodes.used}
          limit={d.inodes.limit}
          percent={d.inodes.percent}
          render={(n) => n?.toLocaleString() ?? "—"}
        />
      </section>

      {/* Storage composition — the "what's eating the space" story */}
      <Panel title="What's using the space" hint="Databases + email + everything else (website files).">
        <BarList
          rows={d.composition
            .filter((c) => c.bytes > 0)
            .sort((a, b) => b.bytes - a.bytes)
            .map((c) => ({
              label: c.label,
              valueLabel: formatBytes(c.bytes) ?? "0",
              percent: Math.round((c.bytes / usedForShare) * 100),
            }))}
        />
      </Panel>

      {/* Email mailboxes */}
      {d.email.count > 0 && (
        <Panel
          title="Email mailboxes"
          hint={`${d.email.count} account${d.email.count > 1 ? "s" : ""} · ${formatBytes(d.email.totalBytes) ?? "0"} total`}
        >
          <BarList
            rows={d.email.top
              .filter((e) => e.bytes > 0)
              .map((e) => ({
                label: e.login,
                valueLabel: formatBytes(e.bytes) ?? "0",
                percent: Math.round((e.bytes / (d.email.totalBytes || 1)) * 100),
              }))}
          />
        </Panel>
      )}

      {/* Bandwidth */}
      {d.bandwidth.totalBytes > 0 && (
        <Panel title="Bandwidth" hint={`${formatBytes(d.bandwidth.totalBytes) ?? "0"} total`}>
          <BarList
            rows={Object.entries(d.bandwidth.byProtocol)
              .filter(([, b]) => b > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([proto, b]) => ({
                label: PROTOCOL_LABEL[proto] ?? proto,
                valueLabel: formatBytes(b) ?? "0",
                percent: Math.round((b / (d.bandwidth.totalBytes || 1)) * 100),
              }))}
          />
        </Panel>
      )}

      {/* Sites sharing this account */}
      {(d.domains.main || d.domains.addon.length > 0 || d.domains.sub.length > 0) && (
        <Panel
          title="Sites on this account"
          hint="These websites share this account's disk and plan. (cPanel can't report per-site file sizes on this host — open cPanel → File Manager to inspect a specific site's folder.)"
        >
          <div className="flex flex-wrap gap-2">
            {d.domains.main && <SiteChip name={d.domains.main} kind="main" />}
            {d.domains.addon.map((s) => (
              <SiteChip key={s} name={s} kind="addon" />
            ))}
            {d.domains.sub.map((s) => (
              <SiteChip key={s} name={s} kind="sub" />
            ))}
          </div>
        </Panel>
      )}

      {/* Counts */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        <Stat label="Addon domains" value={d.counts.addonDomains} />
        <Stat label="Subdomains" value={d.counts.subdomains} />
        <Stat label="Email accounts" value={d.counts.emailAccounts} />
        <Stat label="FTP accounts" value={d.counts.ftpAccounts} />
      </section>
    </div>
  );
}

const PROTOCOL_LABEL: Record<string, string> = {
  http: "Web (HTTP)",
  smtp: "Email out (SMTP)",
  imap: "Email sync (IMAP)",
  pop3: "Email (POP3)",
  ftp: "FTP",
};

function meterTone(percent: number | null): string {
  if (percent === null) return "bg-foreground";
  if (percent >= 95) return "bg-danger";
  if (percent >= 85) return "bg-warning";
  return "bg-success";
}

function Meter({
  title,
  value,
  limit,
  percent,
  render,
}: {
  title: string;
  value: number;
  limit: number | null;
  percent: number | null;
  render: (n: number) => string | null;
}) {
  return (
    <div className="rounded-lg border bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{title}</span>
        {percent !== null && <span className="text-sm text-muted-foreground">{percent}%</span>}
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${meterTone(percent)}`}
          style={{ width: `${Math.min(100, percent ?? 0)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {render(value)} {limit ? `of ${render(limit)}` : "(no limit set)"}
      </p>
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-surface p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function BarList({ rows }: { rows: { label: string; valueLabel: string; percent: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing to show.</p>;
  }
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{r.label}</span>
            <span className="shrink-0 text-muted-foreground">
              {r.valueLabel} · {r.percent}%
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${Math.min(100, r.percent)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const SITE_KIND_LABEL: Record<string, string> = { main: "main", addon: "addon", sub: "subdomain" };

function SiteChip({ name, kind }: { name: string; kind: "main" | "addon" | "sub" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
      <span className="font-medium">{name}</span>
      <span className="text-[11px] uppercase tracking-wider text-subtle">{SITE_KIND_LABEL[kind]}</span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-surface px-5 py-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tracking-tight">{value ?? "—"}</div>
    </div>
  );
}
