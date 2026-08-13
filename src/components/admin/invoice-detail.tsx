"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DocumentSendModal } from "@/components/admin/document-send-modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type { Contact, Invoice } from "@/lib/api";
import {
  deleteInvoice,
  issueInvoice,
  recordInvoicePayment,
  refreshInvoiceRate,
  sendInvoice,
  voidInvoice,
} from "@/lib/invoices/actions";
import { cedisFor, invoiceStatusMeta, outstandingCedis } from "@/lib/invoices/display";
import { formatCedis, formatMoney, formatRate } from "@/lib/utils";

const METHODS = ["bank transfer", "mobile money", "cash", "cheque", "card"];

/**
 * One standalone invoice, and everything you can do to it: issue (which mints its verifiable
 * reference), send it to the client, record money that arrived outside Paystack, or void it.
 *
 * The lifecycle is deliberately one-way. A draft is editable; issuing freezes the lines because
 * the client is now holding a numbered document, and the only ways out are payment or a void.
 */
export function InvoiceDetail({
  invoice,
  contacts,
  clientName,
}: {
  invoice: Invoice;
  contacts: Contact[];
  clientName: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [sending, setSending] = React.useState<"invoice" | "receipt" | null>(null);
  const [paying, setPaying] = React.useState(false);
  const [confirmVoid, setConfirmVoid] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const meta = invoiceStatusMeta(invoice);
  const isDraft = invoice.status === "draft";
  const isVoid = invoice.status === "void";
  const settled = invoice.balance <= 0 && invoice.total > 0;
  // Priced in dollars: the client pays cedis at the rate on the day, so "paid" and "received"
  // are two different figures and both matter.
  const isUsd = invoice.currency === "USD";
  const hasReceipt = Boolean(invoice.receiptDocumentId);
  // A balance can go past zero: cedis are sent in round numbers, and a dollar total rarely lands
  // on one. Owed and overpaid are different facts, so neither is shown as a negative debt.
  const owed = Math.max(0, invoice.balance);
  const overpaid = Math.max(0, -invoice.balance);
  const billedGhs = cedisFor(invoice, invoice.total);
  // Everything taken off the list price, both levels together. Nothing discounted, nothing to show.
  const saved = invoice.itemDiscountTotal + invoice.discountAmount;

  function run(fn: () => Promise<{ ok?: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast(res.error, "danger");
      else {
        toast(success, "success");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Invoice {invoice.reference ?? "(draft)"}</div>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tightest">
            {invoice.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {clientName && <span className="text-sm text-muted-foreground">{clientName}</span>}
            {/* Raised from a package: paying this settles that job, so say which one. */}
            {invoice.workPackageId && (
              <Link
                href={`/admin/packages/${invoice.workPackageId}`}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Bills a work package
              </Link>
            )}
            {invoice.dueDate && (
              <span className="text-sm text-muted-foreground">
                Due {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/invoices/${invoice.id}/edit`}>Edit</Link>
              </Button>
              <Button size="sm" onClick={() => run(() => issueInvoice(invoice.id, invoice.clientId), "Invoice issued.")} disabled={pending}>
                {pending ? <Spinner /> : null}
                Issue invoice
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
                Delete
              </Button>
            </>
          )}
          {!isDraft && !isVoid && (
            <>
              {/* Read the document before it goes out. Both open the exact PDF the client is
                  sent — same route, same renderer — so nothing is signed off unseen. */}
              <Button variant="outline" size="sm" asChild>
                <a href={`/i/${invoice.publicSlug}/invoice`} target="_blank" rel="noopener">
                  Invoice PDF
                </a>
              </Button>
              {hasReceipt && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/i/${invoice.publicSlug}/receipt`} target="_blank" rel="noopener">
                    Receipt PDF
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSending("invoice")}>
                Send invoice
              </Button>
              {!settled && isUsd && invoice.fxExpired && (
                <Button
                  size="sm"
                  onClick={() =>
                    run(
                      () => refreshInvoiceRate(invoice.id, invoice.clientId),
                      "Rate refreshed. Send the invoice again so they have the new amount.",
                    )
                  }
                  disabled={pending}
                >
                  {pending ? <Spinner /> : null}
                  Refresh rate
                </Button>
              )}
              {!settled && (
                <Button size="sm" onClick={() => setPaying(true)}>
                  Record payment
                </Button>
              )}
              {hasReceipt && (
                <Button variant="outline" size="sm" onClick={() => setSending("receipt")}>
                  Send receipt
                </Button>
              )}
              {!settled && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmVoid(true)} disabled={pending}>
                  Void
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="eyebrow">Total</div>
            <div className="mt-2 font-display text-xl font-semibold tracking-tight">
              {formatMoney(invoice.total, invoice.currency)}
            </div>
            {/* Every dollar figure carries its cedi counterpart: the invoice is binding in
                dollars, but the money moves in cedis and that is what gets reconciled. */}
            {isUsd && billedGhs !== null && (
              <div className="mt-1 text-xs text-muted-foreground">{formatCedis(billedGhs)} billed</div>
            )}
          </div>
          <div>
            <div className="eyebrow">{isUsd ? "Settled" : "Paid"}</div>
            <div className="mt-2 font-display text-xl font-semibold tracking-tight text-success">
              {formatMoney(invoice.paid, invoice.currency)}
            </div>
            {isUsd && invoice.receivedGhs > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                {formatCedis(invoice.receivedGhs)} received
              </div>
            )}
          </div>
          <div>
            <div className="eyebrow">Balance</div>
            <div className={`mt-2 font-display text-xl font-semibold tracking-tight ${settled ? "text-success" : "text-warning"}`}>
              {formatMoney(owed, invoice.currency)}
            </div>
            {owed > 0 && isUsd && (
              <div className="mt-1 text-xs text-muted-foreground">
                {formatCedis(outstandingCedis(invoice))} to pay
              </div>
            )}
            {overpaid > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                {formatMoney(overpaid, invoice.currency)} overpaid
                {isUsd && cedisFor(invoice, overpaid) !== null
                  ? ` · ${formatCedis(cedisFor(invoice, overpaid) as number)}`
                  : ""}
              </div>
            )}
          </div>
        </div>

        {!isDraft && (
          <dl className="mt-6 grid gap-x-6 gap-y-2 border-t border-border pt-5 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Document ID</dt>
              <dd className="font-mono text-xs">{invoice.documentId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Verification serial</dt>
              <dd className="font-mono text-xs">{invoice.serial}</dd>
            </div>
            {invoice.receiptDocumentId && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Receipt ID</dt>
                  <dd className="font-mono text-xs">{invoice.receiptDocumentId}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Receipt serial</dt>
                  <dd className="font-mono text-xs">{invoice.receiptSerial}</dd>
                </div>
              </>
            )}
            {isUsd && invoice.fxRateLocked && (
              <>
                <div className="flex justify-between gap-4 sm:col-span-2">
                  <dt className="text-muted-foreground">Locked rate</dt>
                  <dd>
                    ₵{formatRate(invoice.fxRateLocked)} / $1
                    {invoice.fxMarginPercent !== null &&
                      ` · ${invoice.fxMarginPercent}% over mid-market`}
                  </dd>
                </div>
                {/* Only while something is actually owed. A settled invoice has no cedi figure
                    left to quote, and the raw balance goes negative on any overpayment. */}
                {owed > 0 && (
                  <div className="flex justify-between gap-4 sm:col-span-2">
                    <dt className="text-muted-foreground">Client pays</dt>
                    <dd className={invoice.fxExpired ? "text-danger" : undefined}>
                      {formatCedis(outstandingCedis(invoice))}
                      {invoice.fxValidUntil &&
                        (invoice.fxExpired
                          ? ` · expired ${new Date(invoice.fxValidUntil).toLocaleDateString()}`
                          : ` · until ${new Date(invoice.fxValidUntil).toLocaleDateString()}`)}
                    </dd>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between gap-4 sm:col-span-2">
              <dt className="text-muted-foreground">Client pay page</dt>
              <dd>
                <a href={`/i/${invoice.publicSlug}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                  /i/{invoice.publicSlug}
                </a>
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Lines</h2>
        <Table>
          <THead>
            <TR>
              <TH>Description</TH>
              <TH className="text-right">Qty</TH>
              <TH className="text-right">Unit price</TH>
              <TH className="text-right">Amount</TH>
            </TR>
          </THead>
          <TBody>
            {invoice.items.map((item) => (
              <TR key={item.id}>
                <TD>
                  {item.description}
                  {/* What came off this line, in the words the PDF prints. */}
                  {item.discountAmount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {item.discountType === "percent"
                        ? `Less ${item.discountValue}%`
                        : "Discounted"}{" "}
                      ({formatMoney(item.discountAmount, invoice.currency)} off)
                    </div>
                  )}
                </TD>
                <TD className="text-right text-muted-foreground">{item.quantity}</TD>
                <TD className="text-right text-muted-foreground">{formatMoney(item.unitPrice, invoice.currency)}</TD>
                <TD className="text-right font-medium">
                  {formatMoney(item.amount, invoice.currency)}
                  {item.discountAmount > 0 && (
                    <div className="text-xs font-normal text-muted-foreground">
                      was {formatMoney(item.gross, invoice.currency)}
                    </div>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>

        {/* The ladder exactly as the client reads it on the PDF. Only worth printing when
            something was actually taken off. */}
        {saved > 0 && (
          <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between gap-8">
              <dt className="text-muted-foreground">List price</dt>
              <dd className="tabular-nums">{formatMoney(invoice.grossSubtotal, invoice.currency)}</dd>
            </div>
            {invoice.itemDiscountTotal > 0 && (
              <div className="flex justify-between gap-8">
                <dt className="text-muted-foreground">Discounts on lines</dt>
                <dd className="tabular-nums">
                  - {formatMoney(invoice.itemDiscountTotal, invoice.currency)}
                </dd>
              </div>
            )}
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between gap-8">
                <dt className="text-muted-foreground">
                  {invoice.discountLabel?.trim() || "Discount"}
                  {invoice.discountType === "percent" && ` (${invoice.discountValue}%)`}
                </dt>
                <dd className="tabular-nums">
                  - {formatMoney(invoice.discountAmount, invoice.currency)}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-8 border-t border-border pt-1.5 font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(invoice.total, invoice.currency)}</dd>
            </div>
          </dl>
        )}
      </section>

      {invoice.payments.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Payments</h2>
          <Table>
            <THead>
              <TR>
                <TH>Method</TH>
                <TH>Reference</TH>
                <TH>Date</TH>
                <TH>Status</TH>
                <TH className="text-right">Received</TH>
                {isUsd && <TH className="text-right">Settled</TH>}
              </TR>
            </THead>
            <TBody>
              {invoice.payments.map((p) => (
                <TR key={p.id}>
                  <TD className="capitalize">{p.method?.replace(/[_-]+/g, " ") ?? "Payment"}</TD>
                  <TD className="font-mono text-xs text-muted-foreground">
                    {p.paystackReference ?? "—"}
                  </TD>
                  <TD className="text-muted-foreground">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                  </TD>
                  <TD>
                    <Badge variant={p.status === "success" ? "success" : p.status === "failed" ? "danger" : "default"}>
                      {p.status}
                    </Badge>
                  </TD>
                  {/* `amount` is always the cedis that moved, whatever the invoice is priced in. */}
                  <TD className="text-right font-medium">{formatCedis(p.amount)}</TD>
                  {isUsd && (
                    <TD className="text-right font-medium">
                      {p.amountUsd != null ? formatMoney(p.amountUsd, "USD") : "—"}
                      {p.fxRate ? (
                        <div className="text-xs font-normal text-muted-foreground">
                          at ₵{formatRate(p.fxRate)}
                        </div>
                      ) : null}
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        </section>
      )}

      {sending && (
        <SendModal
          invoice={invoice}
          contacts={contacts}
          variant={sending}
          onClose={() => setSending(null)}
          onSent={(who) => {
            setSending(null);
            toast(who ? `Sent to ${who}.` : "Sent.", "success");
            router.refresh();
          }}
        />
      )}

      {paying && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setPaying(false)}
          onDone={() => {
            setPaying(false);
            toast("Payment recorded.", "success");
            router.refresh();
          }}
        />
      )}

      <Modal
        open={confirmVoid}
        onClose={() => !pending && setConfirmVoid(false)}
        title="Void this invoice?"
        description="It stops counting as money owed, its verification page will read “void”, and any charges it bills go back to outstanding. This cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmVoid(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => {
                setConfirmVoid(false);
                run(() => voidInvoice(invoice.id, invoice.clientId), "Invoice voided.");
              }}
            >
              {pending ? <Spinner /> : null}
              Void invoice
            </Button>
          </>
        }
      />

      <Modal
        open={confirmDelete}
        onClose={() => !pending && setConfirmDelete(false)}
        title="Delete this draft?"
        description="Nothing has been sent, so it disappears without a trace. Any charges it claimed go back to outstanding."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => {
                setConfirmDelete(false);
                startTransition(async () => {
                  const res = await deleteInvoice(invoice.id, invoice.clientId);
                  if (res.error) toast(res.error, "danger");
                  else {
                    toast("Draft deleted.", "success");
                    router.push("/admin/invoices");
                  }
                });
              }}
            >
              {pending ? <Spinner /> : null}
              Delete draft
            </Button>
          </>
        }
      />
    </div>
  );
}

function SendModal({
  invoice,
  contacts,
  variant,
  onClose,
  onSent,
}: {
  invoice: Invoice;
  contacts: Contact[];
  variant: "invoice" | "receipt";
  onClose: () => void;
  onSent: (sentTo?: string) => void;
}) {
  const isReceipt = variant === "receipt";

  return (
    <DocumentSendModal
      heading={isReceipt ? "Send receipt" : "Send invoice"}
      description="Goes out over WhatsApp and email as a PDF attachment, and is filed in the client's document history."
      contacts={contacts}
      preview={{
        href: `/i/${invoice.publicSlug}/${variant}`,
        label: `Preview the ${variant} PDF`,
      }}
      // A receipt proves money moved; the invoice says what for. They belong in one email.
      pair={
        isReceipt && invoice.reference
          ? { label: `Attach invoice ${invoice.reference}`, href: `/i/${invoice.publicSlug}/invoice` }
          : null
      }
      send={(values) => sendInvoice(invoice.id, { ...values, variant })}
      onClose={onClose}
      onSent={onSent}
    />
  );
}

function PaymentModal({
  invoice,
  onClose,
  onDone,
}: {
  invoice: Invoice;
  onClose: () => void;
  onDone: () => void;
}) {
  const isUsd = invoice.currency === "USD";
  // On a dollar invoice the operator enters the cedis that arrived; the rate turns that into the
  // dollars it settles. Defaulted to the invoice's own rate so the common case needs no thought,
  // but editable — the bank's actual rate on the day is what really applied.
  const defaultRate = invoice.fxRateLocked ?? 0;

  const [rate, setRate] = React.useState(isUsd ? String(defaultRate || "") : "");
  const [amount, setAmount] = React.useState(
    String(isUsd ? Math.round(invoice.balance * (defaultRate || 0) * 100) / 100 : invoice.balance),
  );
  const [method, setMethod] = React.useState(METHODS[0]);
  const [paidAt, setPaidAt] = React.useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const rateValue = Number(rate);
  const settlesUsd =
    isUsd && rateValue > 0 ? Math.round((Number(amount) / rateValue) * 100) / 100 : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter the amount received.");
    if (isUsd && (!Number.isFinite(rateValue) || rateValue <= 0)) {
      return setError("Enter the exchange rate this payment was made at.");
    }

    startTransition(async () => {
      const res = await recordInvoicePayment(invoice.id, invoice.clientId, {
        amount: value,
        method,
        paidAt: paidAt || null,
        reference: reference.trim() || null,
        fxRate: isUsd ? rateValue : null,
      });
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Record a payment"
      description="For money that reached us outside the online checkout. Clearing the balance settles the invoice and mints its receipt."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cedis received (₵)" htmlFor="amount" required>
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          {isUsd && (
            <Field label="Rate applied (₵ per $1)" htmlFor="fxRate" required>
              <Input
                id="fxRate"
                type="number"
                min={0}
                step="0.0001"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </Field>
          )}
          <Field label="How it arrived" htmlFor="method">
            <Select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date received" htmlFor="paidAt">
            <Input id="paidAt" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </Field>
          <Field label="Their reference" htmlFor="reference">
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Bank slip or MoMo transaction id"
            />
          </Field>
        </div>

        {/* Say plainly what this settles before it is written — on a dollar invoice the number
            the operator typed is not the number that moves the balance. */}
        {settlesUsd !== null && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            Settles <span className="font-semibold">{formatMoney(settlesUsd, "USD")}</span> of the{" "}
            {formatMoney(invoice.balance, "USD")} outstanding
            {settlesUsd >= invoice.balance ? ". This clears the invoice." : "."}
          </p>
        )}

        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

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
