"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { LineItemModal } from "@/components/admin/line-item-modal";
import { PackageFormModal } from "@/components/admin/package-form-modal";
import {
  balance,
  effectiveTotal,
  type LineItem,
  type PricingMode,
  type WorkPackage,
  type WorkPackageStatus,
} from "@/lib/api";
import {
  changeStatus,
  deletePackage,
  deleteLineItem,
  sendPackage,
  setPricingMode,
  setTotalOverride,
  toggleLineItemDone,
} from "@/lib/packages/actions";
import { nextTransitions, statusMeta } from "@/lib/status";
import { cn, formatCedis } from "@/lib/utils";

export function PackageDetail({ pkg, clientName }: { pkg: WorkPackage; clientName: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [addingItem, setAddingItem] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<LineItem | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<LineItem | null>(null);

  const [pendingMode, startMode] = React.useTransition();
  const [pendingItemDelete, startItemDelete] = React.useTransition();
  const [pendingDelete, startDelete] = React.useTransition();
  const [pendingLifecycle, startLifecycle] = React.useTransition();
  const [pendingProgress, startProgress] = React.useTransition();

  const meta = statusMeta(pkg.status);
  const isFixed = pkg.pricingMode === "fixed";
  const transitions = nextTransitions(pkg.status);
  const doneCount = pkg.lineItems.filter((li) => li.done).length;
  const progressPct = pkg.lineItems.length
    ? Math.round((doneCount / pkg.lineItems.length) * 100)
    : 0;
  const total = effectiveTotal(pkg);
  const paid = pkg.payments
    .filter((p) => p.status === "success")
    .reduce((s, p) => s + p.amount, 0);
  const bal = balance(pkg);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${pkg.publicSlug}`
      : `/p/${pkg.publicSlug}`;

  function changeMode(mode: PricingMode) {
    if (mode === pkg.pricingMode) return;
    startMode(async () => {
      const res = await setPricingMode(pkg.id, mode);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Pricing mode updated.", "success");
        router.refresh();
      }
    });
  }

  function itemDone(message: string) {
    setAddingItem(false);
    setEditingItem(null);
    toast(message, "success");
    router.refresh();
  }

  function confirmDeleteItem() {
    if (!deletingItem) return;
    const target = deletingItem;
    startItemDelete(async () => {
      const res = await deleteLineItem(pkg.id, target.id);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Line item removed.", "success");
        router.refresh();
      }
      setDeletingItem(null);
    });
  }

  function confirmDeletePackage() {
    startDelete(async () => {
      const res = await deletePackage(pkg.id);
      if (res.error) {
        toast(res.error, "danger");
        setDeleting(false);
      } else {
        toast("Package deleted.", "success");
        router.push("/admin/packages");
      }
    });
  }

  function doSend() {
    startLifecycle(async () => {
      const res = await sendPackage(pkg.id);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Invoice sent to the client.", "success");
        router.refresh();
      }
    });
  }

  function doTransition(status: WorkPackageStatus) {
    startLifecycle(async () => {
      const res = await changeStatus(pkg.id, status);
      if (res.error) toast(res.error, "danger");
      else {
        toast(`Moved to ${statusMeta(status).label}.`, "success");
        router.refresh();
      }
    });
  }

  function doToggleDone(item: LineItem, done: boolean) {
    startProgress(async () => {
      const res = await toggleLineItemDone(pkg.id, item.id, done);
      if (res.error) toast(res.error, "danger");
      else router.refresh();
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast("Public link copied.", "success");
    } catch {
      toast("Copy failed — select and copy manually.", "danger");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/packages"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Work Packages
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{pkg.title}</h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              For{" "}
              <Link href={`/admin/clients/${pkg.clientId}`} className="hover:underline">
                {clientName}
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="ghost" onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Public link */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-surface p-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-muted-foreground">Client link</div>
          <div className="truncate font-mono text-sm">{publicUrl}</div>
        </div>
        <Button variant="outline" size="sm" onClick={copyLink}>
          Copy link
        </Button>
      </div>

      {/* Lifecycle */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Lifecycle</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-sm">Current:</span>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {pkg.status === "draft" && (
            <Button onClick={doSend} disabled={pendingLifecycle}>
              {pendingLifecycle ? <Spinner /> : null}
              Send invoice &amp; link
            </Button>
          )}
          {transitions.map((status) => (
            <Button
              key={status}
              variant="outline"
              onClick={() => doTransition(status)}
              disabled={pendingLifecycle}
            >
              Move to {statusMeta(status).label}
            </Button>
          ))}
          {pkg.status !== "draft" && transitions.length === 0 && (
            <span className="text-sm text-muted-foreground">No further transitions.</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pricing + line items */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Pricing</h2>
            <div className="inline-flex rounded-md border p-0.5">
              {(["itemized", "fixed"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => changeMode(mode)}
                  disabled={pendingMode}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    pkg.pricingMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {isFixed && (
            <p className="text-sm text-muted-foreground">
              Fixed pricing — line items are shown to the client as scope only and don&apos;t affect
              the total.
            </p>
          )}

          <Table>
            <THead>
              <TR>
                <TH className="w-12">Done</TH>
                <TH>Description</TH>
                <TH className="text-right">Qty</TH>
                <TH className="text-right">Unit</TH>
                <TH className="text-right">Line total</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {pkg.lineItems.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="text-center text-muted-foreground">
                    No line items yet.
                  </TD>
                </TR>
              ) : (
                pkg.lineItems.map((li) => (
                  <TR key={li.id}>
                    <TD>
                      <input
                        type="checkbox"
                        checked={li.done}
                        disabled={pendingProgress}
                        onChange={(e) => doToggleDone(li, e.target.checked)}
                        className="h-4 w-4 accent-primary"
                        aria-label={`Mark ${li.description} done`}
                      />
                    </TD>
                    <TD className={cn("font-medium", li.done && "text-muted-foreground line-through")}>
                      {li.description}
                    </TD>
                    <TD className={cn("text-right", isFixed && "text-subtle line-through")}>
                      {li.quantity}
                    </TD>
                    <TD className={cn("text-right", isFixed && "text-subtle line-through")}>
                      {formatCedis(li.unitPrice)}
                    </TD>
                    <TD className={cn("text-right", isFixed && "text-subtle line-through")}>
                      {formatCedis(li.quantity * li.unitPrice)}
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(li)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeletingItem(li)}>
                          Remove
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          <Button variant="outline" size="sm" onClick={() => setAddingItem(true)}>
            Add line item
          </Button>

          {isFixed && <FixedTotalForm packageId={pkg.id} current={pkg.totalOverride} />}
        </div>

        {/* Summary */}
        <aside className="space-y-4">
          <div className="space-y-2 rounded-lg border bg-surface p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {doneCount}/{pkg.lineItems.length} done
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">{formatCedis(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Paid</span>
              <span>{formatCedis(paid)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium">Balance</span>
              <span className={cn("font-semibold", bal > 0 ? "text-warning" : "text-success")}>
                {formatCedis(bal)}
              </span>
            </div>
          </div>

          <dl className="space-y-2 rounded-lg border bg-surface p-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estimated delivery</dt>
              <dd>
                {pkg.estimatedDeliveryDate
                  ? new Date(pkg.estimatedDeliveryDate).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(pkg.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* Activity timeline */}
      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Activity</h2>
        <div className="rounded-lg border bg-surface">
          {pkg.activity.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y">
              {[...pkg.activity]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-4 px-5 py-3">
                    <span className="text-sm">{entry.message}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modals */}
      <PackageFormModal
        key={`edit-${pkg.id}`}
        open={editing}
        pkg={pkg}
        onClose={() => setEditing(false)}
        onDone={(m) => {
          setEditing(false);
          toast(m, "success");
          router.refresh();
        }}
      />
      <LineItemModal
        open={addingItem}
        packageId={pkg.id}
        onClose={() => setAddingItem(false)}
        onDone={itemDone}
      />
      {editingItem && (
        <LineItemModal
          key={editingItem.id}
          open
          packageId={pkg.id}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onDone={itemDone}
        />
      )}

      <Modal
        open={Boolean(deletingItem)}
        onClose={() => !pendingItemDelete && setDeletingItem(null)}
        title="Remove line item?"
        description={deletingItem ? `"${deletingItem.description}" will be removed.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingItem(null)} disabled={pendingItemDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteItem} disabled={pendingItemDelete}>
              {pendingItemDelete ? <Spinner /> : null}
              Remove
            </Button>
          </>
        }
      />

      <Modal
        open={deleting}
        onClose={() => !pendingDelete && setDeleting(false)}
        title="Delete package?"
        description={`${pkg.title} and its line items will be removed. This can't be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(false)} disabled={pendingDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeletePackage} disabled={pendingDelete}>
              {pendingDelete ? <Spinner /> : null}
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

function FixedTotalForm({ packageId, current }: { packageId: string; current: number | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const action = React.useMemo(() => setTotalOverride.bind(null, packageId), [packageId]);
  const [state, formAction, pending] = React.useActionState(action, {});

  React.useEffect(() => {
    if (state.ok) {
      toast("Fixed total updated.", "success");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/40 p-4"
    >
      <div className="flex-1">
        <label htmlFor="fixed-total" className="block text-sm font-medium">
          Fixed total (GHS)
        </label>
        <Input
          id="fixed-total"
          name="totalOverride"
          type="number"
          min={0}
          step="0.01"
          defaultValue={current ?? ""}
          className="mt-1 max-w-xs"
        />
        {state.fieldErrors?.totalOverride && (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.totalOverride}</p>
        )}
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? <Spinner /> : null}
        Update total
      </Button>
    </form>
  );
}
