import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { NewPackageButton } from "@/components/admin/new-package-button";
import { SendDocumentButton } from "@/components/admin/send-document-button";
import { EmptyState } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api, ApiError, balance, effectiveTotal } from "@/lib/api";
import { statusMeta } from "@/lib/status";
import { formatCedis } from "@/lib/utils";
import { ASSET_TYPE_LABEL, STATUS_VARIANT, assetSummary } from "@/lib/infrastructure/display";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await api.clients.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const packages = await api.packages.list({ clientId: id });
  const assets = await api.infrastructure.listAssets(id).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <BackButton href="/admin/clients" label="Clients" />
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
              <Badge>{client.type === "organisation" ? "Organisation" : "Individual"}</Badge>
              {client.accountType === "ongoing" && <Badge variant="info">Ongoing account</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Added {new Date(client.createdAt).toLocaleDateString()}
            </p>
          </div>
          <SendDocumentButton clientId={client.id} contacts={client.contacts} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          {client.type === "organisation" ? "Contacts" : "Contact"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {client.contacts.map((ct) => (
            <div key={ct.id} className="rounded-lg border bg-surface p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{ct.name}</span>
                {ct.isPrimary && client.type === "organisation" && (
                  <Badge variant="info">Primary</Badge>
                )}
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd className="font-medium">{ct.whatsapp}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{ct.phone ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{ct.email ?? "—"}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Work packages</h2>
          {packages.length > 0 && (
            <NewPackageButton clientId={client.id} clientName={client.name} size="sm" />
          )}
        </div>
        {packages.length === 0 ? (
          <EmptyState
            title="No packages yet"
            description="Create the first work package for this client."
            action={<NewPackageButton clientId={client.id} clientName={client.name} />}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Status</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-right">Balance</TH>
              </TR>
            </THead>
            <TBody>
              {packages.map((p) => {
                const meta = statusMeta(p.status);
                return (
                  <TR key={p.id} className="transition-colors hover:bg-muted/50">
                    <TD className="font-medium">
                      <Link
                        href={`/admin/packages/${p.id}`}
                        className="text-foreground hover:underline"
                      >
                        {p.title}
                      </Link>
                    </TD>
                    <TD>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TD>
                    <TD className="text-right">{formatCedis(effectiveTotal(p))}</TD>
                    <TD className="text-right">{formatCedis(balance(p))}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Infrastructure</h2>
          <div className="flex items-center gap-4">
            {assets.length > 0 && (
              <a
                href={`/admin/clients/${client.id}/statement`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Status statement ↓
              </a>
            )}
            <Link
              href="/admin/infrastructure"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Manage
            </Link>
          </div>
        </div>
        {assets.length === 0 ? (
          <EmptyState
            title="No infrastructure tracked"
            description="Add this client's domains, hosting or sites from the Infrastructure page."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Status</TH>
                <TH>Type</TH>
                <TH>Identifier</TH>
                <TH>Expiry / storage</TH>
              </TR>
            </THead>
            <TBody>
              {assets.map((a) => (
                <TR key={a.id} className="transition-colors hover:bg-muted/50">
                  <TD>
                    <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                  </TD>
                  <TD className="text-muted-foreground">{ASSET_TYPE_LABEL[a.type]}</TD>
                  <TD className="font-medium">{a.identifier}</TD>
                  <TD className="text-muted-foreground">{assetSummary(a)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
