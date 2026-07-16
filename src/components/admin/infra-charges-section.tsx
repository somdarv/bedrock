"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { type InfraCharge } from "@/lib/api";
import {
  addInfraCharge,
  deleteInfraCharge,
  type InfraChargeFormState,
  payInfraCharge,
  updateInfraCharge,
} from "@/lib/infrastructure/actions";
import { formatCedis } from "@/lib/utils";

export function InfraChargesSection({
  clientId,
  charges,
}: {
  clientId: string;
  charges: InfraCharge[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<InfraCharge | null>(null);
  const [deleting, setDeleting] = React.useState<InfraCharge | null>(null);
  const [pendingPay, startPay] = React.useTransition();
  const [pendingDelete, startDelete] = React.useTransition();
  const [payingId, setPayingId] = React.useState<string | null>(null);

  const rows = [...charges].sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const outstanding = rows
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);

  function afterMutation(message: string) {
    setAdding(false);
    setEditing(null);
    toast(message, "success");
    router.refresh();
  }

  function pay(charge: InfraCharge) {
    setPayingId(charge.id);
    startPay(async () => {
      const res = await payInfraCharge(charge.id, clientId);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Charge marked paid.", "success");
        router.refresh();
      }
      setPayingId(null);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startDelete(async () => {
      const res = await deleteInfraCharge(target.id, clientId);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Charge removed.", "success");
        router.refresh();
      }
      setDeleting(null);
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Infrastructure charges</h2>
        <div className="flex items-center gap-4">
          {outstanding > 0 && (
            <span className="text-sm text-muted-foreground">
              Outstanding <span className="font-semibold text-foreground">{formatCedis(outstanding)}</span>
            </span>
          )}
          <Button size="sm" onClick={() => setAdding(true)}>
            Add charge
          </Button>
        </div>
      </div>

      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Hosting, domain and other recurring fees, billed separately from project work. Unpaid charges
        roll up into the Infrastructure bucket on the Receivables dashboard.
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="No charges yet"
          description="Add a hosting or domain fee to track what this client owes for infrastructure."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Charge</TH>
              <TH className="text-right">Amount</TH>
              <TH>Due</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.description}</TD>
                <TD className="text-right">{formatCedis(c.amount)}</TD>
                <TD className="text-muted-foreground">
                  {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "—"}
                </TD>
                <TD>
                  <Badge variant={c.status === "paid" ? "success" : "warning"}>
                    {c.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {c.status === "pending" && (
                      <Button size="sm" onClick={() => pay(c)} disabled={pendingPay && payingId === c.id}>
                        {pendingPay && payingId === c.id ? <Spinner /> : null}
                        Mark paid
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(c)}>
                      Remove
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {adding && (
        <ChargeModal
          clientId={clientId}
          onClose={() => setAdding(false)}
          onDone={() => afterMutation("Charge added.")}
        />
      )}
      {editing && (
        <ChargeModal
          key={editing.id}
          clientId={clientId}
          charge={editing}
          onClose={() => setEditing(null)}
          onDone={() => afterMutation("Charge updated.")}
        />
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => !pendingDelete && setDeleting(null)}
        title="Remove charge?"
        description={deleting ? `"${deleting.description}" will be removed.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={pendingDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={pendingDelete}>
              {pendingDelete ? <Spinner /> : null}
              Remove
            </Button>
          </>
        }
      />
    </div>
  );
}

const initial: InfraChargeFormState = {};

function ChargeModal({
  clientId,
  charge,
  onClose,
  onDone,
}: {
  clientId: string;
  charge?: InfraCharge;
  onClose: () => void;
  onDone: () => void;
}) {
  const action = React.useMemo(
    () =>
      charge
        ? updateInfraCharge.bind(null, charge.id, clientId)
        : addInfraCharge.bind(null, clientId),
    [charge, clientId],
  );
  const [state, formAction, pending] = React.useActionState(action, initial);

  React.useEffect(() => {
    if (state.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <Modal open onClose={onClose} title={charge ? "Edit charge" : "Add infrastructure charge"}>
      <form action={formAction} className="space-y-4">
        <Field label="Description" htmlFor="description" required error={state.fieldErrors?.description}>
          <Input
            id="description"
            name="description"
            defaultValue={charge?.description ?? ""}
            placeholder="e.g. example.com domain renewal 2026"
            required
          />
        </Field>
        <Field label="Amount (₵)" htmlFor="amount" required error={state.fieldErrors?.amount}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={charge?.amount ?? ""}
            required
          />
        </Field>
        <Field label="Due date" htmlFor="dueDate" error={state.fieldErrors?.dueDate}>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={charge?.dueDate ?? ""} />
        </Field>

        {state.error && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner /> : null}
            {charge ? "Save" : "Add charge"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
