"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState, Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  type DeliveryMode,
  effectiveTotal,
  type Milestone,
  type MilestoneKind,
  type WorkPackage,
} from "@/lib/api";
import {
  addMilestone,
  deleteMilestone,
  type MilestoneFormState,
  payMilestone,
  setDeliveryMode,
  updateMilestone,
} from "@/lib/packages/actions";
import { PAYMENT_METHODS, paymentMethodLabel } from "@/lib/payments";
import { cn, formatCedis } from "@/lib/utils";

const KIND_LABEL: Record<MilestoneKind, string> = {
  deposit: "Deposit",
  progress: "Progress",
  final: "Final",
};
const KIND_VARIANT: Record<MilestoneKind, "info" | "default" | "warning"> = {
  deposit: "info",
  progress: "default",
  final: "warning",
};

const DELIVERY: { value: DeliveryMode; label: string }[] = [
  { value: "gated_files", label: "Gated files" },
  { value: "milestones", label: "Milestones" },
];

export function MilestonesSection({ pkg }: { pkg: WorkPackage }) {
  const router = useRouter();
  const { toast } = useToast();

  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<Milestone | null>(null);
  const [deleting, setDeleting] = React.useState<Milestone | null>(null);
  const [paying, setPaying] = React.useState<Milestone | null>(null);

  const [pendingDelete, startDelete] = React.useTransition();
  const [pendingMode, startMode] = React.useTransition();

  const [optimisticMode, setOptimisticMode] = React.useState<DeliveryMode>(pkg.deliveryMode);
  React.useEffect(() => setOptimisticMode(pkg.deliveryMode), [pkg.deliveryMode]);

  const milestones = [...pkg.milestones].sort((a, b) => a.position - b.position);
  const total = effectiveTotal(pkg);
  const scheduled = milestones.reduce((s, m) => s + m.amount, 0);
  const scheduledPaid = milestones
    .filter((m) => m.status === "paid")
    .reduce((s, m) => s + m.amount, 0);
  const remaining = Math.max(0, total - scheduled);
  const mismatch = total > 0 && Math.abs(scheduled - total) > 0.005;

  // Sensible defaults for a new milestone: the missing stage, and whatever value is unscheduled.
  const hasDeposit = milestones.some((m) => m.kind === "deposit");
  const hasFinal = milestones.some((m) => m.kind === "final");
  const suggestedKind: MilestoneKind = !hasDeposit ? "deposit" : !hasFinal ? "final" : "progress";
  const suggestedAmount =
    suggestedKind === "deposit"
      ? Math.min(remaining, Math.round(total * 0.15))
      : remaining;

  function changeMode(mode: DeliveryMode) {
    if (mode === optimisticMode) return;
    setOptimisticMode(mode);
    startMode(async () => {
      const res = await setDeliveryMode(pkg.id, mode);
      if (res.error) {
        setOptimisticMode(pkg.deliveryMode);
        toast(res.error, "danger");
      } else {
        router.refresh();
      }
    });
  }

  function afterMutation(message: string) {
    setAdding(false);
    setEditing(null);
    setPaying(null);
    toast(message, "success");
    router.refresh();
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startDelete(async () => {
      const res = await deleteMilestone(pkg.id, target.id);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Milestone removed.", "success");
        router.refresh();
      }
      setDeleting(null);
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Payment schedule</h2>
        <div className="flex items-center gap-3">
          {/* Delivery mode toggle */}
          <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Delivery mode">
            {DELIVERY.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => changeMode(d.value)}
                disabled={pendingMode}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  optimisticMode === d.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setAdding(true)}>
            Add milestone
          </Button>
        </div>
      </div>

      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        {optimisticMode === "milestones"
          ? "Web / systems job. The schedule is the plan for how money comes in; paying a milestone is your cue to unlock the next phase (deploy, connect the domain, hand over credentials). The site itself is not paywalled."
          : "Graphic design job. Originals stay locked until the balance clears (the download gate). The schedule is usually a deposit to start and a final on delivery."}
      </p>

      {milestones.length === 0 ? (
        <EmptyState
          title="No schedule yet"
          description="Add a deposit milestone (and a final) so the receivables dashboard can show the exact deposit due."
        />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Milestone</TH>
                <TH>Stage</TH>
                <TH className="text-right">Amount</TH>
                <TH>Status</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {milestones.map((m) => (
                <TR key={m.id}>
                  <TD className="font-medium">{m.label}</TD>
                  <TD>
                    <Badge variant={KIND_VARIANT[m.kind]}>{KIND_LABEL[m.kind]}</Badge>
                  </TD>
                  <TD className="text-right">{formatCedis(m.amount)}</TD>
                  <TD>
                    <Badge variant={m.status === "paid" ? "success" : "warning"}>
                      {m.status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {m.status === "pending" && (
                        <Button size="sm" onClick={() => setPaying(m)}>
                          Mark paid
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEditing(m)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(m)}>
                        Remove
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4 text-sm">
            <div className="flex gap-6">
              <div>
                <div className="text-muted-foreground">Scheduled</div>
                <div className="font-semibold">{formatCedis(scheduled)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Paid</div>
                <div className="font-semibold">{formatCedis(scheduledPaid)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Package total</div>
                <div className="font-semibold">{formatCedis(total)}</div>
              </div>
            </div>
            {mismatch && (
              <Badge variant="warning">
                Schedule {scheduled > total ? "exceeds" : "is under"} the total by{" "}
                {formatCedis(Math.abs(total - scheduled))}
              </Badge>
            )}
          </div>
        </>
      )}

      {/* Add / edit modal */}
      {adding && (
        <MilestoneModal
          packageId={pkg.id}
          suggested={{ kind: suggestedKind, amount: suggestedAmount }}
          onClose={() => setAdding(false)}
          onDone={() => afterMutation("Milestone added.")}
        />
      )}
      {editing && (
        <MilestoneModal
          key={editing.id}
          packageId={pkg.id}
          milestone={editing}
          onClose={() => setEditing(null)}
          onDone={() => afterMutation("Milestone updated.")}
        />
      )}

      {/* Pay modal */}
      {paying && (
        <PayMilestoneModal
          packageId={pkg.id}
          milestone={paying}
          onClose={() => setPaying(null)}
          onDone={() => afterMutation("Milestone marked paid.")}
        />
      )}

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => !pendingDelete && setDeleting(null)}
        title="Remove milestone?"
        description={deleting ? `"${deleting.label}" will be removed from the schedule.` : undefined}
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

const initial: MilestoneFormState = {};

function MilestoneModal({
  packageId,
  milestone,
  suggested,
  onClose,
  onDone,
}: {
  packageId: string;
  milestone?: Milestone;
  suggested?: { kind: MilestoneKind; amount: number };
  onClose: () => void;
  onDone: () => void;
}) {
  const action = React.useMemo(
    () =>
      milestone
        ? updateMilestone.bind(null, packageId, milestone.id)
        : addMilestone.bind(null, packageId),
    [packageId, milestone],
  );
  const [state, formAction, pending] = React.useActionState(action, initial);

  React.useEffect(() => {
    if (state.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  const defaultKind = milestone?.kind ?? suggested?.kind ?? "progress";
  const defaultAmount = milestone?.amount ?? (suggested?.amount || "");

  return (
    <Modal open onClose={onClose} title={milestone ? "Edit milestone" : "Add milestone"}>
      <form action={formAction} className="space-y-4">
        <Field label="Label" htmlFor="label" required error={state.fieldErrors?.label}>
          <Input
            id="label"
            name="label"
            defaultValue={milestone?.label ?? ""}
            placeholder="e.g. Deposit, Design sign-off, Launch"
            required
          />
        </Field>
        <Field label="Stage" htmlFor="kind" error={state.fieldErrors?.kind}>
          <Select id="kind" name="kind" defaultValue={defaultKind}>
            <option value="deposit">Deposit (starts the work)</option>
            <option value="progress">Progress (unlocks the next phase)</option>
            <option value="final">Final (handover / balance cleared)</option>
          </Select>
        </Field>
        <Field label="Amount (GHS)" htmlFor="amount" required error={state.fieldErrors?.amount}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={defaultAmount}
            required
          />
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
            {milestone ? "Save" : "Add milestone"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PayMilestoneModal({
  packageId,
  milestone,
  onClose,
  onDone,
}: {
  packageId: string;
  milestone: Milestone;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [method, setMethod] = React.useState("momo");
  const [pending, startPay] = React.useTransition();

  function submit() {
    startPay(async () => {
      const res = await payMilestone(packageId, milestone.id, method || null);
      if (res.error) toast(res.error, "danger");
      else onDone();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Record milestone payment"
      description={`Logs ${formatCedis(milestone.amount)} against "${milestone.label}" and runs the gates.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Spinner /> : null}
            Mark paid ({formatCedis(milestone.amount)})
          </Button>
        </>
      }
    >
      <Field label="Method" htmlFor="pay-method">
        <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAYMENT_METHODS.filter((m) => m.value !== "paystack").map((m) => (
            <option key={m.value} value={m.value}>
              {paymentMethodLabel(m.value)}
            </option>
          ))}
        </Select>
      </Field>
    </Modal>
  );
}
