import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api, ApiError, balance, effectiveTotal } from "@/lib/api";
import { statusMeta } from "@/lib/status";
import { formatCedis } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await api.clients.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const packages = await api.packages.list({ clientId: id });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/clients" className="text-sm text-muted-foreground hover:text-foreground">
          ← Clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{client.name}</h1>
      </div>

      <dl className="grid max-w-xl grid-cols-2 gap-4 rounded-lg border bg-surface p-5 text-sm">
        <div>
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="mt-0.5 font-medium">{client.whatsapp}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="mt-0.5 font-medium">{client.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="mt-0.5 font-medium">{client.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Added</dt>
          <dd className="mt-0.5 font-medium">{new Date(client.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Work packages</h2>
        {packages.length === 0 ? (
          <EmptyState
            title="No packages yet"
            description="Work packages for this client appear here (Phase 3)."
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
                  <TR key={p.id}>
                    <TD className="font-medium">{p.title}</TD>
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
    </div>
  );
}
