"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type {
  AssetOverviewRow,
  AssetType,
  Client,
  ClientAssetInput,
  HostingServer,
  HostingServerInput,
  InfrastructureOverview,
  ServerAuthType,
  ServerKind,
} from "@/lib/api";
import {
  createAsset,
  createServer,
  deleteAsset,
  deleteServer,
} from "@/lib/infrastructure/actions";
import {
  ASSET_TYPE_LABEL as TYPE_LABEL,
  STATUS_VARIANT,
  expiryLabel,
  formatBytes,
} from "@/lib/infrastructure/display";

const AUTH_LABEL: Record<ServerAuthType, string> = {
  cpanel: "cPanel token",
  ssh: "SSH",
  hostinger: "Hostinger API",
  none: "None",
};

export function InfrastructureView({
  overview,
  clients,
  servers,
}: {
  overview: InfrastructureOverview;
  clients: Client[];
  servers: HostingServer[];
}) {
  const [assetOpen, setAssetOpen] = React.useState(false);
  const [serverOpen, setServerOpen] = React.useState(false);

  const clientName = (id: string | null) =>
    id ? (clients.find((c) => c.id === id)?.name ?? "—") : "Sahara (own)";

  return (
    <div className="space-y-8">
      {/* Attention */}
      <section className="space-y-3 rounded-lg border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Needs attention</h2>
          <Badge variant={overview.attention.length ? "warning" : "success"}>
            {overview.attention.length} open
          </Badge>
        </div>
        {overview.attention.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing needs attention — everything monitored is healthy.
          </p>
        ) : (
          <ul className="space-y-2">
            {overview.attention.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-background p-3"
              >
                <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                <span className="font-medium">{row.identifier}</span>
                <span className="text-sm text-muted-foreground">{row.clientName ?? "—"}</span>
                {expiryLabel(row) && (
                  <span className="text-sm text-muted-foreground">· {expiryLabel(row)}</span>
                )}
                <span className="w-full text-sm text-muted-foreground sm:ml-auto sm:w-auto">
                  {row.lastError ?? row.recommendation ?? ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Assets */}
      <section className="space-y-3 rounded-lg border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Assets</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Domains, SSL, hosting and sites across all clients.
            </p>
          </div>
          <Button onClick={() => setAssetOpen(true)} disabled={clients.length === 0}>
            Add asset
          </Button>
        </div>
        <AssetTable rows={overview.all} clientName={(id) => clientName(id)} />
      </section>

      {/* Servers */}
      <section className="space-y-3 rounded-lg border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Hosting servers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The cPanel accounts and VPS we read storage & health from. Tokens/keys are stored
              encrypted and never shown.
            </p>
          </div>
          <Button variant="outline" onClick={() => setServerOpen(true)}>
            Add server
          </Button>
        </div>
        <ServerTable servers={servers} clientName={(id) => clientName(id)} />
      </section>

      <AssetModal
        open={assetOpen}
        onClose={() => setAssetOpen(false)}
        clients={clients}
        servers={servers}
      />
      <ServerModal
        open={serverOpen}
        onClose={() => setServerOpen(false)}
        clients={clients}
      />
    </div>
  );
}

/* --------------------------------------------------------------- tables */

function AssetTable({
  rows,
  clientName,
}: {
  rows: AssetOverviewRow[];
  clientName: (id: string | null) => string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No assets yet. Add a client&apos;s domain, hosting or site to start tracking it.
      </p>
    );
  }

  function remove(id: string, label: string) {
    if (!confirm(`Remove "${label}" from monitoring?`)) return;
    startTransition(async () => {
      const res = await deleteAsset(id);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Asset removed.", "success");
        router.refresh();
      }
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-subtle">
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Client</th>
            <th className="py-2 pr-3 font-medium">Type</th>
            <th className="py-2 pr-3 font-medium">Identifier</th>
            <th className="py-2 pr-3 font-medium">Expiry / storage</th>
            <th className="py-2 pr-3 font-medium">Source</th>
            <th className="py-2 pl-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const disk =
              row.metrics && formatBytes(row.metrics.diskUsed)
                ? `${formatBytes(row.metrics.diskUsed)}${
                    formatBytes(row.metrics.diskLimit) ? ` / ${formatBytes(row.metrics.diskLimit)}` : ""
                  }`
                : null;
            return (
              <tr key={row.id} className="border-b last:border-0">
                <td className="py-2.5 pr-3">
                  <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                </td>
                <td className="py-2.5 pr-3">{row.clientName ?? clientName(row.clientId)}</td>
                <td className="py-2.5 pr-3 text-muted-foreground">{TYPE_LABEL[row.type]}</td>
                <td className="py-2.5 pr-3 font-medium">{row.identifier}</td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  {expiryLabel(row) ?? disk ?? "—"}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">{row.source}</td>
                <td className="py-2.5 pl-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    disabled={pending}
                    onClick={() => remove(row.id, row.identifier)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ServerTable({
  servers,
  clientName,
}: {
  servers: HostingServer[];
  clientName: (id: string | null) => string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  if (servers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hosting servers yet. Add a cPanel account or the VPS to read storage automatically.
      </p>
    );
  }

  function remove(id: string, label: string) {
    if (!confirm(`Remove server "${label}"? Its assets stay but lose their storage source.`)) return;
    startTransition(async () => {
      const res = await deleteServer(id);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Server removed.", "success");
        router.refresh();
      }
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-subtle">
            <th className="py-2 pr-3 font-medium">Label</th>
            <th className="py-2 pr-3 font-medium">Owner</th>
            <th className="py-2 pr-3 font-medium">Kind</th>
            <th className="py-2 pr-3 font-medium">Access</th>
            <th className="py-2 pr-3 font-medium">Host</th>
            <th className="py-2 pr-3 font-medium">Secret</th>
            <th className="py-2 pl-3" />
          </tr>
        </thead>
        <tbody>
          {servers.map((s) => (
            <tr key={s.id} className="border-b last:border-0">
              <td className="py-2.5 pr-3 font-medium">{s.label}</td>
              <td className="py-2.5 pr-3">{clientName(s.clientId)}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">{s.kind}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">{AUTH_LABEL[s.authType]}</td>
              <td className="py-2.5 pr-3 text-muted-foreground">
                {s.hostname ? `${s.hostname}${s.port ? `:${s.port}` : ""}` : "—"}
              </td>
              <td className="py-2.5 pr-3">
                <Badge variant={s.hasSecret ? "success" : "default"}>
                  {s.hasSecret ? "stored" : "none"}
                </Badge>
              </td>
              <td className="py-2.5 pl-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  disabled={pending}
                  onClick={() => remove(s.id, s.label)}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------- modals */

const ASSET_TYPES: AssetType[] = ["domain", "ssl", "hosting", "site"];

function AssetModal({
  open,
  onClose,
  clients,
  servers,
}: {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  servers: HostingServer[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [form, setForm] = React.useState<ClientAssetInput & { clientId: string }>(() => ({
    clientId: clients[0]?.id ?? "",
    hostingServerId: null,
    type: "domain",
    label: null,
    identifier: "",
    source: "manual",
    expiryDate: null,
    renewalDate: null,
    recommendation: null,
    monitorEnabled: true,
  }));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.identifier.trim()) {
      toast("Pick a client and enter the domain / identifier.", "danger");
      return;
    }
    const { clientId, ...input } = form;
    startTransition(async () => {
      const res = await createAsset(clientId, input);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Asset added.", "success");
        onClose();
        router.refresh();
      }
    });
  }

  // Only offer servers that belong to the chosen client, or Sahara's own (clientId null).
  const serverOptions = servers.filter(
    (s) => s.clientId === form.clientId || s.clientId === null,
  );

  return (
    <Modal open={open} onClose={onClose} title="Add asset" className="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client" required>
            <Select value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type" required>
            <Select value={form.type} onChange={(e) => set("type", e.target.value as AssetType)}>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Identifier"
          required
          hint="Domain name, cPanel account, or the site URL to monitor."
        >
          <Input
            value={form.identifier}
            onChange={(e) => set("identifier", e.target.value)}
            placeholder="example.com"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Label" hint="Optional friendly name.">
            <Input
              value={form.label ?? ""}
              onChange={(e) => set("label", e.target.value || null)}
              placeholder="Primary domain"
            />
          </Field>
          <Field label="Hosting server" hint="Where storage/health is read from.">
            <Select
              value={form.hostingServerId ?? ""}
              onChange={(e) => set("hostingServerId", e.target.value || null)}
            >
              <option value="">— none —</option>
              {serverOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Expiry date" hint="Auto-filled by monitoring once live; set manually if known.">
            <Input
              type="date"
              value={form.expiryDate ?? ""}
              onChange={(e) => set("expiryDate", e.target.value || null)}
            />
          </Field>
          <Field label="Renewal / billing date" hint="Optional.">
            <Input
              type="date"
              value={form.renewalDate ?? ""}
              onChange={(e) => set("renewalDate", e.target.value || null)}
            />
          </Field>
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.monitorEnabled}
            onChange={(e) => set("monitorEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Monitor this automatically
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add asset"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const KINDS: ServerKind[] = ["shared", "vps"];
const AUTH_TYPES: ServerAuthType[] = ["cpanel", "ssh", "hostinger", "none"];

function ServerModal({
  open,
  onClose,
  clients,
}: {
  open: boolean;
  onClose: () => void;
  clients: Client[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [form, setForm] = React.useState<HostingServerInput>(() => ({
    clientId: null,
    label: "",
    kind: "shared",
    authType: "cpanel",
    hostname: null,
    port: 2083,
    username: null,
    secret: null,
    docroot: null,
    scope: "readonly",
  }));

  function set<K extends keyof HostingServerInput>(key: K, value: HostingServerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) {
      toast("Give the server a label.", "danger");
      return;
    }
    startTransition(async () => {
      const res = await createServer(form);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Server added.", "success");
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add hosting server" className="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Label" required>
            <Input
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Acme — cPanel"
            />
          </Field>
          <Field label="Owner" hint="Whose host this is.">
            <Select
              value={form.clientId ?? ""}
              onChange={(e) => set("clientId", e.target.value || null)}
            >
              <option value="">Sahara (own infrastructure)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Kind" required>
            <Select value={form.kind} onChange={(e) => set("kind", e.target.value as ServerKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Access method" required>
            <Select
              value={form.authType}
              onChange={(e) => set("authType", e.target.value as ServerAuthType)}
            >
              {AUTH_TYPES.map((a) => (
                <option key={a} value={a}>
                  {AUTH_LABEL[a]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Hostname" className="sm:col-span-2">
            <Input
              value={form.hostname ?? ""}
              onChange={(e) => set("hostname", e.target.value || null)}
              placeholder="server42.host.com"
            />
          </Field>
          <Field label="Port">
            <Input
              type="number"
              value={form.port ?? ""}
              onChange={(e) => set("port", e.target.value ? Number(e.target.value) : null)}
              placeholder="2083"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Username" hint="cPanel user, or SSH user.">
            <Input
              value={form.username ?? ""}
              onChange={(e) => set("username", e.target.value || null)}
            />
          </Field>
          <Field label="Doc root" hint="VPS only: path for per-site storage (du).">
            <Input
              value={form.docroot ?? ""}
              onChange={(e) => set("docroot", e.target.value || null)}
              placeholder="/var/www/site"
            />
          </Field>
        </div>

        <Field
          label="Secret (token / SSH key)"
          hint="cPanel/WHM API token or SSH private key. Stored encrypted; never shown again."
        >
          <Textarea
            value={form.secret ?? ""}
            onChange={(e) => set("secret", e.target.value || null)}
            placeholder="Paste the API token or key"
            className="font-mono text-xs"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add server"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
