"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { DeliverablesSection } from "@/components/admin/deliverables-section";
import { DocumentSendModal } from "@/components/admin/document-send-modal";
import { MilestonesSection } from "@/components/admin/milestones-section";
import { PaymentsSection } from "@/components/admin/payments-section";
import { LineItemModal } from "@/components/admin/line-item-modal";
import { PackageFormModal } from "@/components/admin/package-form-modal";
import {
  balance,
  type ClientNotifyEvent,
  type Contact,
  type DiscountType,
  effectiveTotal,
  grossSubtotal,
  itemDiscountTotal,
  lineGross,
  lineNet,
  packageDiscount,
  savings,
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
  sendPackageReceipt,
  sendStatement,
  setPackageDiscount,
  setPricingMode,
  setTotalOverride,
  toggleLineItemDone,
} from "@/lib/packages/actions";
import { paidTotal } from "@/lib/payments";
import { nextTransitions, statusMeta } from "@/lib/status";
import { cn, formatCedis, publicBaseUrl } from "@/lib/utils";

export function PackageDetail({
  pkg,
  clientName,
  contacts,
}: {
  pkg: WorkPackage;
  clientName: string;
  contacts: Contact[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [addingItem, setAddingItem] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<LineItem | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<LineItem | null>(null);
  const [sendingReceipt, setSendingReceipt] = React.useState(false);

  const [pendingMode, startMode] = React.useTransition();
  const [pendingItemDelete, startItemDelete] = React.useTransition();
  const [pendingDelete, startDelete] = React.useTransition();
  const [pendingLifecycle, startLifecycle] = React.useTransition();
  const [pendingProgress, startProgress] = React.useTransition();

  // Optimistic pricing mode so the toggle flips instantly; reconciled on refresh.
  const [optimisticMode, setOptimisticMode] = React.useState<PricingMode>(pkg.pricingMode);
  React.useEffect(() => setOptimisticMode(pkg.pricingMode), [pkg.pricingMode]);
  const [copied, setCopied] = React.useState(false);

  const meta = statusMeta(pkg.status);
  const isFixed = optimisticMode === "fixed";
  const transitions = nextTransitions(pkg.status, pkg.billingMode);
  const doneCount = pkg.lineItems.filter((li) => li.done).length;
  const progressPct = pkg.lineItems.length
    ? Math.round((doneCount / pkg.lineItems.length) * 100)
    : 0;
  const total = effectiveTotal(pkg);
  // Everything taken off the list price, both levels together. Drives whether the pricing
  // ladder is worth showing at all: with no discount anywhere it would just repeat the total.
  const saved = savings(pkg);
  // Includes cedis that arrived on an invoice raised for this package, so Total − Paid = Balance
  // still reads true when the work was billed rather than paid up front.
  const paid = paidTotal(pkg);
  const bal = balance(pkg);
  const publicUrl = `${publicBaseUrl()}/p/${pkg.publicSlug}`;
  // The receipt is drawn from payments recorded on the package itself. A deferred package is
  // paid on the invoice raised for it, so its receipt belongs to that invoice, not here.
  const hasReceipt = pkg.payments.some((p) => p.status === "success");
  const receiptBlockedReason =
    (pkg.invoicedPaid ?? 0) > 0
      ? "Paid on an invoice, so send the receipt from there"
      : "No payment recorded on this package yet";

  function changeMode(mode: PricingMode) {
    if (mode === optimisticMode) return;
    setOptimisticMode(mode); // instant visual switch
    startMode(async () => {
      const res = await setPricingMode(pkg.id, mode);
      if (res.error) {
        setOptimisticMode(pkg.pricingMode); // revert on failure
        toast(res.error, "danger");
      } else {
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

  function doNotify(event: ClientNotifyEvent) {
    startLifecycle(async () => {
      const res = await sendStatement(pkg.id, event);
      if (res.error) toast(res.error, "danger");
      else {
        toast(
          event === "account_statement" ? "Statement sent to the client." : "Reminder sent to the client.",
          "success",
        );
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
      setCopied(true);
      toast("Public link copied.", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy failed — select and copy manually.", "danger");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <BackButton href="/admin/packages" label="Work Packages" />
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{pkg.title}</h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
              {/* Worth seeing at a glance: it changes what the client can reach right now. */}
              {pkg.billingMode === "deferred" && <Badge variant="info">Invoiced later</Badge>}
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
        <Button
          variant={copied ? "primary" : "outline"}
          size="sm"
          onClick={copyLink}
          className="min-w-26"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Copied
            </>
          ) : (
            "Copy link"
          )}
        </Button>
        <div className="flex w-full gap-4 border-t pt-3 text-sm">
          <a
            href={`${publicUrl}/invoice`}
            target="_blank"
            rel="noopener"
            className="font-medium underline-offset-4 hover:underline"
          >
            Invoice PDF
          </a>
          <a
            href={`${publicUrl}/receipt`}
            target="_blank"
            rel="noopener"
            className="font-medium underline-offset-4 hover:underline"
          >
            Receipt PDF
          </a>
        </div>
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

      {/* Client messages — on-demand statement / reminder for long-running accounts.
          (Sent automatically every month too, for any package with a balance.) */}
      {pkg.status !== "draft" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Client messages</div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Send a progress statement, a payment reminder, or a receipt over WhatsApp + email.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => doNotify("account_statement")}
              disabled={pendingLifecycle}
            >
              Send statement
            </Button>
            <Button
              variant="outline"
              onClick={() => doNotify("payment_reminder")}
              disabled={pendingLifecycle || balance(pkg) <= 0}
              title={balance(pkg) <= 0 ? "No outstanding balance" : undefined}
            >
              Send reminder
            </Button>
            {/* The balance clearing already sends a receipt by itself. This covers everything
                else: a deposit, a re-send, a client who cannot find the email. */}
            <Button
              variant="outline"
              onClick={() => setSendingReceipt(true)}
              disabled={pendingLifecycle || !hasReceipt}
              title={hasReceipt ? undefined : receiptBlockedReason}
            >
              Send receipt
            </Button>
          </div>
        </div>
      )}

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
                    optimisticMode === mode
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
                <TH>{isFixed ? "Scope" : "Description"}</TH>
                {!isFixed && (
                  <>
                    <TH className="text-right">Qty</TH>
                    <TH className="text-right">Unit</TH>
                    <TH className="text-right">Line total</TH>
                  </>
                )}
                <TH />
              </TR>
            </THead>
            <TBody>
              {pkg.lineItems.length === 0 ? (
                <TR>
                  <TD colSpan={isFixed ? 3 : 6} className="text-center text-muted-foreground">
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
                    {!isFixed && (
                      <>
                        <TD className="text-right">{li.quantity}</TD>
                        <TD className="text-right">{formatCedis(li.unitPrice)}</TD>
                        <TD className="text-right">
                          {formatCedis(lineNet(li))}
                          {/* The list price stays visible next to what is actually charged:
                              a discount nobody can see is a price cut, not a discount. */}
                          {lineGross(li) > lineNet(li) && (
                            <div className="text-xs font-normal text-muted-foreground">
                              was {formatCedis(lineGross(li))}
                            </div>
                          )}
                        </TD>
                      </>
                    )}
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

          <PackageDiscountForm pkg={pkg} />
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
            {/* The ladder, only when there is one to show: what the work lists at, what came
                off it, and what is actually being charged. */}
            {saved > 0 && (
              <div className="space-y-1.5 border-b pb-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">List price</span>
                  <span className="tabular-nums">{formatCedis(grossSubtotal(pkg))}</span>
                </div>
                {itemDiscountTotal(pkg) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discounts on lines</span>
                    <span className="tabular-nums">- {formatCedis(itemDiscountTotal(pkg))}</span>
                  </div>
                )}
                {packageDiscount(pkg) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {pkg.discountLabel?.trim() || "Discount"}
                      {pkg.discountType === "percent" && ` (${pkg.discountValue}%)`}
                    </span>
                    <span className="tabular-nums">- {formatCedis(packageDiscount(pkg))}</span>
                  </div>
                )}
              </div>
            )}
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

      {/* Payment schedule (milestones) */}
      <MilestonesSection pkg={pkg} />

      {/* Payments & gates */}
      <PaymentsSection pkg={pkg} />

      {/* Deliverables */}
      <DeliverablesSection pkg={pkg} />

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
      {addingItem && (
        <LineItemModal
          open
          packageId={pkg.id}
          fixed={isFixed}
          onClose={() => setAddingItem(false)}
          onDone={itemDone}
        />
      )}
      {editingItem && (
        <LineItemModal
          key={editingItem.id}
          open
          packageId={pkg.id}
          item={editingItem}
          fixed={isFixed}
          onClose={() => setEditingItem(null)}
          onDone={itemDone}
        />
      )}
      {sendingReceipt && (
        <DocumentSendModal
          heading="Send receipt"
          description="Goes out over WhatsApp and email as a PDF attachment, and is filed in the client's document history."
          contacts={contacts}
          preview={{ href: `${publicUrl}/receipt`, label: "Preview the receipt PDF" }}
          // A receipt proves money moved; the invoice says what for. They belong in one email.
          pair={{ label: "Attach the invoice for this project", href: `${publicUrl}/invoice` }}
          send={(values) => sendPackageReceipt(pkg.id, values)}
          onClose={() => setSendingReceipt(false)}
          onSent={(sentTo) => {
            setSendingReceipt(false);
            toast(sentTo ? `Receipt sent to ${sentTo}.` : "Receipt sent.", "success");
            router.refresh();
          }}
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

/**
 * The discount on the whole quote, taken off the subtotal once the lines have settled.
 *
 * Deliberately separate from the price above rather than folded into it: the client's documents
 * print the standard price and this reduction as two rows, so they can see what the work is
 * worth as well as what they are paying. Lines can carry their own discounts as well; the two
 * are independent and both apply.
 */
function PackageDiscountForm({ pkg }: { pkg: WorkPackage }) {
  const router = useRouter();
  const { toast } = useToast();
  const action = React.useMemo(() => setPackageDiscount.bind(null, pkg.id), [pkg.id]);
  const [state, formAction, pending] = React.useActionState(action, {});
  const [type, setType] = React.useState<"" | DiscountType>((pkg.discountType ?? "") as "" | DiscountType);

  React.useEffect(() => {
    if (state.ok) {
      toast("Discount updated.", "success");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  const off = packageDiscount(pkg);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border bg-muted/40 p-4">
      <div>
        <h3 className="text-sm font-medium">Discount on the total</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Comes off the subtotal, on top of anything the lines above discount. The client sees
          the full price and this reduction as separate rows.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-36">
          <label htmlFor="pkg-discount-type" className="block text-xs text-muted-foreground">
            Type
          </label>
          <Select
            id="pkg-discount-type"
            name="discountType"
            value={type}
            onChange={(e) => setType(e.target.value as "" | DiscountType)}
            className="mt-1"
          >
            <option value="">No discount</option>
            <option value="percent">Percent</option>
            <option value="amount">Fixed amount</option>
          </Select>
        </div>
        {type && (
          <>
            <div className="w-28">
              <label htmlFor="pkg-discount-value" className="block text-xs text-muted-foreground">
                {type === "percent" ? "Off (%)" : "Off (₵)"}
              </label>
              <Input
                id="pkg-discount-value"
                name="discountValue"
                type="number"
                min={0}
                max={type === "percent" ? 100 : undefined}
                step="0.01"
                defaultValue={pkg.discountValue || ""}
                className="mt-1"
              />
            </div>
            <div className="min-w-50 flex-1">
              <label htmlFor="pkg-discount-label" className="block text-xs text-muted-foreground">
                Reason (printed on the invoice)
              </label>
              <Input
                id="pkg-discount-label"
                name="discountLabel"
                defaultValue={pkg.discountLabel ?? ""}
                placeholder="e.g. Launch offer, Partner rate"
                className="mt-1"
              />
            </div>
          </>
        )}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? <Spinner /> : null}
          Save discount
        </Button>
      </div>

      {off > 0 && (
        <p className="text-xs text-muted-foreground">
          Currently taking {formatCedis(off)} off this quote.
        </p>
      )}
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
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
          Fixed total (₵)
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
