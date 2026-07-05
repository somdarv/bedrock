"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { ClientFormModal } from "@/components/admin/client-form-modal";
import { primaryContact, type Client } from "@/lib/api";
import { deleteClient } from "@/lib/clients/actions";

export function ClientsView({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [deleting, setDeleting] = React.useState<Client | null>(null);
  const [pendingDelete, startDelete] = React.useTransition();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, ...c.contacts.flatMap((ct) => [ct.name, ct.whatsapp, ct.email])].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }, [clients, query]);

  function handleDone(message: string) {
    setCreating(false);
    setEditing(null);
    toast(message, "success");
    router.refresh();
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startDelete(async () => {
      const res = await deleteClient(target.id);
      if (res.error) {
        toast(res.error, "danger");
      } else {
        toast("Client deleted.", "success");
        router.refresh();
      }
      setDeleting(null);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">People you do work for.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New client</Button>
      </div>

      <Input
        placeholder="Search by name, WhatsApp, email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={clients.length === 0 ? "No clients yet" : "No matches"}
          description={
            clients.length === 0
              ? "Add your first client to start a work package."
              : "Try a different search."
          }
          action={
            clients.length === 0 ? (
              <Button onClick={() => setCreating(true)}>New client</Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Type</TH>
              <TH>Primary contact</TH>
              <TH>Added</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((c) => {
              const pc = primaryContact(c);
              return (
              <TR key={c.id} className="transition-colors hover:bg-muted/50">
                <TD>
                  <Link href={`/admin/clients/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </TD>
                <TD>
                  <Badge>{c.type === "organisation" ? "Org" : "Individual"}</Badge>
                </TD>
                <TD className="text-muted-foreground">
                  {pc ? `${pc.whatsapp}${c.type === "organisation" ? ` · ${pc.name}` : ""}` : "—"}
                </TD>
                <TD className="text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(c)}>
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      {/* Mount only while open so each "New client" starts from a blank form. */}
      {creating && (
        <ClientFormModal open onClose={() => setCreating(false)} onDone={handleDone} />
      )}
      {editing && (
        <ClientFormModal
          key={editing.id}
          open
          client={editing}
          onClose={() => setEditing(null)}
          onDone={handleDone}
        />
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => !pendingDelete && setDeleting(null)}
        title="Delete client?"
        description={
          deleting
            ? `${deleting.name} will be removed. This can't be undone.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={pendingDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={pendingDelete}>
              {pendingDelete ? <Spinner /> : null}
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
