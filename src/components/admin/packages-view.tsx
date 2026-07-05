"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { PackageFormModal } from "@/components/admin/package-form-modal";
import { balance, effectiveTotal, type Client, type WorkPackage } from "@/lib/api";
import { statusMeta } from "@/lib/status";
import { formatCedis } from "@/lib/utils";

export function PackagesView({
  packages,
  clients,
}: {
  packages: WorkPackage[];
  clients: Client[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const clientName = React.useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (clientName.get(p.clientId) ?? "").toLowerCase().includes(q),
    );
  }, [packages, query, clientName]);

  function handleDone(message: string, packageId?: string) {
    setCreating(false);
    toast(message, "success");
    if (packageId) router.push(`/admin/packages/${packageId}`);
    else router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Packages</h1>
          <p className="text-sm text-muted-foreground">Scope, pricing, delivery, and payment.</p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={clients.length === 0}>
          New package
        </Button>
      </div>

      <Input
        placeholder="Search by title or client…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={packages.length === 0 ? "No packages yet" : "No matches"}
          description={
            clients.length === 0
              ? "Add a client first, then create their work package."
              : packages.length === 0
                ? "Create your first work package to start scoping and pricing."
                : "Try a different search."
          }
          action={
            clients.length === 0 ? (
              <Button asChild>
                <Link href="/admin/clients">Go to clients</Link>
              </Button>
            ) : packages.length === 0 ? (
              <Button onClick={() => setCreating(true)}>New package</Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>Client</TH>
              <TH>Status</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Balance</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((p) => {
              const meta = statusMeta(p.status);
              return (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/admin/packages/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                  </TD>
                  <TD className="text-muted-foreground">{clientName.get(p.clientId) ?? "—"}</TD>
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

      {/* Mount only while open so each "New package" starts from a blank form. */}
      {creating && (
        <PackageFormModal
          open
          onClose={() => setCreating(false)}
          clients={clients}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
