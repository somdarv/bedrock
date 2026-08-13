"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState, Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { balance, effectiveTotal, type PaymentKind, type WorkPackage } from "@/lib/api";
import {
  computePaymentPlan,
  downloadGateOpen,
  gatesApply,
  paidTotal,
  paymentMethodLabel,
  PAYMENT_METHODS,
  startGateOpen,
} from "@/lib/payments";
import { billPackage, recordPayment, type PaymentFormState } from "@/lib/packages/actions";
import { formatCedis } from "@/lib/utils";

export function PaymentsSection({ pkg }: { pkg: WorkPackage }) {
  const [recording, setRecording] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const total = effectiveTotal(pkg);
  const plan = computePaymentPlan(total);
  const paid = paidTotal(pkg);
  const bal = balance(pkg);
  const fullyPaid = total > 0 && bal <= 0;
  const startOpen = startGateOpen(pkg);
  const dlOpen = downloadGateOpen(pkg);
  const deferred = !gatesApply(pkg);
  // What is owed but not yet on an invoice — the amount "Raise invoice" would ask for.
  const toBill = Math.max(0, bal - pkg.invoicedOutstanding);

  // Suggest the next sensible payment for the modal.
  const suggested =
    paid <= 0
      ? { kind: (plan.rule === "full" ? "full" : "deposit") as PaymentKind, amount: plan.depositDue }
      : { kind: "final" as PaymentKind, amount: Math.max(bal, 0) };

  function handleDone() {
    setRecording(false);
    toast("Payment recorded.", "success");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Payments</h2>
        <div className="flex items-center gap-2">
          {deferred && <RaiseInvoiceButton pkg={pkg} amount={toBill} />}
          <Button size="sm" onClick={() => setRecording(true)} disabled={fullyPaid || total <= 0}>
            Record payment
          </Button>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {deferred ? (
          <>
            Deferred billing — the work runs ungated and is invoiced after it lands. Nothing is
            held back from the client while this is unpaid.
          </>
        ) : (
          <>
            {plan.rule === "full"
              ? `Small job — ${formatCedis(plan.total)} due 100% upfront.`
              : `${formatCedis(plan.depositDue)} deposit (40%) to start · ${formatCedis(plan.finalDue)} balance (60%) on delivery.`}{" "}
            Confirmed in production by the verified Paystack webhook.
          </>
        )}
      </p>

      {/* Gate state, or what has been billed when there are no gates to report on */}
      {deferred ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <GateCard
            label="Delivery"
            open
            openText="Open — files are not held back on this package."
            closedText=""
          />
          <GateCard
            label="Billed"
            openLabel="Invoiced"
            closedLabel="Not invoiced"
            open={pkg.invoicedOutstanding > 0 || (bal <= 0 && pkg.invoicedPaid > 0)}
            openText={
              pkg.invoicedOutstanding > 0
                ? `${formatCedis(pkg.invoicedOutstanding)} invoiced, awaiting payment.`
                : "Invoiced and settled."
            }
            closedText={
              toBill > 0
                ? `${formatCedis(toBill)} of work not yet invoiced.`
                : "Nothing to bill yet."
            }
          />
        </div>
      ) : (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <GateCard
            label="Start gate"
            open={startOpen}
            openText="Open — deposit received, work can begin."
            closedText="Closed — awaiting the deposit."
          />
          <GateCard
            label="Download gate"
            open={dlOpen}
            openText="Open — balance cleared, originals unlocked."
            closedText="Closed — originals stay locked until the balance is zero."
          />
        </div>
      )}

      {/* Totals / receipt */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4">
        <div className="flex gap-6 text-sm">
          <div>
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold">{formatCedis(total)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Paid</div>
            <div className="font-semibold">{formatCedis(paid)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Balance</div>
            <div className="font-semibold">{formatCedis(bal)}</div>
          </div>
        </div>
        {fullyPaid && <Badge variant="success">Paid in full — receipt sent</Badge>}
      </div>

      {pkg.payments.length === 0 ? (
        <EmptyState title="No payments yet" description="Record the deposit when it lands." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Type</TH>
              <TH className="text-right">Amount</TH>
              <TH>Method</TH>
              <TH>Reference</TH>
              <TH>When</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {pkg.payments.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium capitalize">{p.kind}</TD>
                <TD className="text-right">{formatCedis(p.amount)}</TD>
                <TD className="text-muted-foreground">{paymentMethodLabel(p.method)}</TD>
                <TD className="font-mono text-xs text-muted-foreground">
                  {p.paystackReference ?? "—"}
                </TD>
                <TD className="text-muted-foreground">
                  {p.paidAt ? new Date(p.paidAt).toLocaleString() : "—"}
                </TD>
                <TD>
                  <Badge variant={p.status === "success" ? "success" : "warning"}>{p.status}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {recording && (
        <RecordPaymentModal
          packageId={pkg.id}
          suggested={suggested}
          onClose={() => setRecording(false)}
          onDone={handleDone}
        />
      )}
    </div>
  );
}

function GateCard({
  label,
  open,
  openText,
  closedText,
  openLabel = "Open",
  closedLabel = "Closed",
}: {
  label: string;
  open: boolean;
  openText: string;
  closedText: string;
  /** Override when the card reports something other than a gate (e.g. Billed / Not billed). */
  openLabel?: string;
  closedLabel?: string;
}) {
  return (
    <div className="rounded-lg border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={open ? "success" : "warning"}>{open ? openLabel : closedLabel}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{open ? openText : closedText}</p>
    </div>
  );
}

/**
 * Raise the invoice for work already done. Produces a draft and takes the operator to it —
 * nothing reaches the client until it is issued there, so this button is safe to press.
 */
function RaiseInvoiceButton({ pkg, amount }: { pkg: WorkPackage; amount: number }) {
  const [pending, setPending] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleClick() {
    setPending(true);
    const result = await billPackage(pkg.id);
    setPending(false);
    if (result.error) {
      toast(result.error, "danger");
      return;
    }
    toast(`Draft invoice raised for ${formatCedis(amount)}.`, "success");
    if (result.invoiceId) router.push(`/admin/invoices/${result.invoiceId}`);
    else router.refresh();
  }

  // A draft is billable here: this button only shows on deferred packages, where the invoice is
  // the last step rather than the opening one. Requiring a send first meant the client received a
  // priced document before the invoice could be raised at all.
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={pending || amount <= 0}
    >
      {pending ? <Spinner /> : null}
      Raise invoice
    </Button>
  );
}

const initial: PaymentFormState = {};

function RecordPaymentModal({
  packageId,
  suggested,
  onClose,
  onDone,
}: {
  packageId: string;
  suggested: { kind: PaymentKind; amount: number };
  onClose: () => void;
  onDone: () => void;
}) {
  const action = React.useMemo(() => recordPayment.bind(null, packageId), [packageId]);
  const [state, formAction, pending] = React.useActionState(action, initial);

  React.useEffect(() => {
    if (state.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Record payment"
      description="Logs a confirmed payment and runs the two-gate logic (start / download)."
    >
      <form action={formAction} className="space-y-4">
        <Field label="Amount (₵)" htmlFor="amount" required error={state.fieldErrors?.amount}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={suggested.amount || ""}
            required
          />
        </Field>
        <Field label="Kind" htmlFor="kind">
          <Select id="kind" name="kind" defaultValue={suggested.kind}>
            <option value="deposit">Deposit</option>
            <option value="final">Final</option>
            <option value="full">Full</option>
          </Select>
        </Field>
        <Field label="Method" htmlFor="method">
          <Select id="method" name="method" defaultValue="momo">
            {PAYMENT_METHODS.filter((m) => m.value !== "paystack").map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
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
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
