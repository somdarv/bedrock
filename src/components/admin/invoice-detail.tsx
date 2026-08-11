"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { RecipientPicker } from "@/components/admin/recipient-picker";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type { Contact, Invoice } from "@/lib/api";
import {
  deleteInvoice,
  issueInvoice,
  recordInvoicePayment,
  sendInvoice,
  voidInvoice,
} from "@/lib/invoices/actions";
import { invoiceStatusMeta } from "@/lib/invoices/display";
import { formatCedis } from "@/lib/utils";

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
          <div className="eyebrow">Invoice {invoice.reference ?? "— draft"}</div>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tightest">
            {invoice.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {clientName && <span className="text-sm text-muted-foreground">{clientName}</span>}
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
              <Button variant="outline" size="sm" asChild>
                <a href={`/i/${invoice.publicSlug}/invoice`} target="_blank" rel="noopener">
                  Download PDF
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSending("invoice")}>
                Send invoice
              </Button>
              {!settled && (
                <Button size="sm" onClick={() => setPaying(true)}>
                  Record payment
                </Button>
              )}
              {invoice.receiptReference && (
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
              {formatCedis(invoice.total)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Paid</div>
            <div className="mt-2 font-display text-xl font-semibold tracking-tight text-success">
              {formatCedis(invoice.paid)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Balance</div>
            <div className={`mt-2 font-display text-xl font-semibold tracking-tight ${settled ? "text-success" : "text-warning"}`}>
              {formatCedis(invoice.balance)}
            </div>
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
                <TD>{item.description}</TD>
                <TD className="text-right text-muted-foreground">{item.quantity}</TD>
                <TD className="text-right text-muted-foreground">{formatCedis(item.unitPrice)}</TD>
                <TD className="text-right font-medium">{formatCedis(item.amount)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
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
                <TH className="text-right">Amount</TH>
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
                  <TD className="text-right font-medium">{formatCedis(p.amount)}</TD>
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
  // Default to every contact so primary + secondary are reached at once; operator can untick.
  const [recipientIds, setRecipientIds] = React.useState<string[]>(() => contacts.map((c) => c.id));
  const [replyName, setReplyName] = React.useState("");
  const [replyMethod, setReplyMethod] = React.useState("whatsapp");
  const [replyValue, setReplyValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (recipientIds.length === 0) return setError("Pick at least one contact to send to.");
    if (!replyName.trim()) return setError("Add a contact name for replies.");
    if (!replyValue.trim()) return setError("Add the contact's number or email.");

    startTransition(async () => {
      const res = await sendInvoice(invoice.id, {
        contactIds: recipientIds,
        replyToName: replyName,
        replyToMethod: replyMethod,
        replyToValue: replyValue,
        variant,
      });
      if (res.error) setError(res.error);
      else onSent(res.sentTo);
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={variant === "receipt" ? "Send receipt" : "Send invoice"}
      description={`Goes out over WhatsApp and email as a PDF attachment, and is filed in the client's document history.`}
    >
      <form onSubmit={submit} className="space-y-4">
        <RecipientPicker contacts={contacts} selected={recipientIds} onChange={setRecipientIds} />

        <Field label="Replies go to (name)" htmlFor="replyName" required>
          <Input
            id="replyName"
            value={replyName}
            onChange={(e) => setReplyName(e.target.value)}
            placeholder="e.g. Richard"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reply by" htmlFor="replyMethod">
            <Select id="replyMethod" value={replyMethod} onChange={(e) => setReplyMethod(e.target.value)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
            </Select>
          </Field>
          <Field label="Number or email" htmlFor="replyValue" required>
            <Input
              id="replyValue"
              value={replyValue}
              onChange={(e) => setReplyValue(e.target.value)}
              placeholder={replyMethod === "email" ? "name@example.com" : "+233 24 000 0000"}
            />
          </Field>
        </div>

        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner /> : null}
            Send
          </Button>
        </div>
      </form>
    </Modal>
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
  const [amount, setAmount] = React.useState(String(invoice.balance));
  const [method, setMethod] = React.useState(METHODS[0]);
  const [paidAt, setPaidAt] = React.useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter the amount received.");

    startTransition(async () => {
      const res = await recordInvoicePayment(invoice.id, invoice.clientId, {
        amount: value,
        method,
        paidAt: paidAt || null,
        reference: reference.trim() || null,
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
          <Field label="Amount received (₵)" htmlFor="amount" required>
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
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
