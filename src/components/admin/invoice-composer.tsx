"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import {
  discountOn,
  type Client,
  type DiscountType,
  type InfraChargeRow,
  type Invoice,
  type InvoiceInput,
} from "@/lib/api";
import { createInvoice, updateInvoice } from "@/lib/invoices/actions";
import { formatMoney } from "@/lib/utils";

/** "" is no discount. The two real types match the API's `discount_type` exactly. */
type DraftDiscount = "" | DiscountType;

interface DraftLine {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountType: DraftDiscount;
  discountValue: string;
}

const blankLine = (): DraftLine => ({
  key: crypto.randomUUID(),
  description: "",
  quantity: "1",
  unitPrice: "",
  discountType: "",
  discountValue: "",
});

/** What one draft line costs at list price, before its own discount. */
function draftGross(l: DraftLine) {
  return (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
}

/** What the line's own discount takes off. Priced with the same helper the API uses. */
function draftDiscount(l: DraftLine) {
  return discountOn(draftGross(l), l.discountType || null, Number(l.discountValue) || 0);
}

/**
 * Lines that look like a hand-added bank or card fee.
 *
 * The settlement rate on a dollar invoice already contains that cost, so adding it again as a
 * line charges it twice: a 12% line on top of an 11.5% rate bills roughly 24% over mid-market,
 * not 12%. This has happened in practice, which is why the composer says something.
 */
const FEE_LINE = /\b(bank|visa|mastercard|card|forex|fx|exchange|processing|transaction|transfer|charge|charges|fee|fees)\b/i;

function feeLikeLines(lines: DraftLine[]): string[] {
  return lines
    .map((l) => l.description.trim())
    .filter((d) => d.length > 0 && FEE_LINE.test(d));
}

function linesFrom(invoice: Invoice, chargeDescriptions: Set<string>): DraftLine[] {
  // Charge-backed lines are rebuilt from the ticked charges on save, so they are not offered
  // as free-text rows here — editing them would silently diverge from the charge behind them.
  const own = invoice.items.filter((item) => !chargeDescriptions.has(item.description));
  if (own.length === 0) return [blankLine()];
  return own.map((item) => ({
    key: item.id,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    discountType: (item.discountType ?? "") as DraftDiscount,
    discountValue: item.discountValue ? String(item.discountValue) : "",
  }));
}

/**
 * Compose or edit a draft invoice: pick the client, tick any outstanding infrastructure charges
 * to bill, and add free-text lines for anything else.
 *
 * Ticking a charge is what links it to the invoice, so that settling the invoice later closes the
 * charge and the Receivables infrastructure bucket stops counting it twice.
 */
export function InvoiceComposer({
  clients,
  charges,
  initialClientId = null,
  invoice,
}: {
  clients: Client[];
  charges: InfraChargeRow[];
  initialClientId?: string | null;
  /** Present when editing an existing draft. */
  invoice?: Invoice;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  const billedDescriptions = React.useMemo(
    () => new Set(charges.filter((c) => c.invoiceId === invoice?.id).map((c) => c.description)),
    [charges, invoice?.id],
  );

  const [clientId, setClientId] = React.useState(
    invoice?.clientId ?? initialClientId ?? clients[0]?.id ?? "",
  );
  const [currency, setCurrency] = React.useState<"GHS" | "USD">(invoice?.currency ?? "GHS");
  const [title, setTitle] = React.useState(invoice?.title ?? "");
  const [memo, setMemo] = React.useState(invoice?.memo ?? "");
  const [issueDate, setIssueDate] = React.useState(invoice?.issueDate ?? "");
  const [dueDate, setDueDate] = React.useState(invoice?.dueDate ?? "");
  const [lines, setLines] = React.useState<DraftLine[]>(
    invoice ? linesFrom(invoice, billedDescriptions) : [blankLine()],
  );
  const [checked, setChecked] = React.useState<Set<string>>(
    () => new Set(charges.filter((c) => c.invoiceId === invoice?.id).map((c) => c.id)),
  );
  // The invoice-wide discount, taken off the subtotal on top of anything the lines carry.
  const [discountType, setDiscountType] = React.useState<DraftDiscount>(
    (invoice?.discountType ?? "") as DraftDiscount,
  );
  const [discountValue, setDiscountValue] = React.useState(
    invoice?.discountValue ? String(invoice.discountValue) : "",
  );
  const [discountLabel, setDiscountLabel] = React.useState(invoice?.discountLabel ?? "");
  const [error, setError] = React.useState<string | null>(null);

  // Only this client's charges are billable on this invoice: ones no other invoice has claimed,
  // and only ones in the same currency — a cedi charge appended to a dollar invoice would read
  // as dollars, which is a thirteenfold overcharge rather than a rounding difference.
  const available = charges.filter(
    (c) =>
      c.clientId === clientId &&
      (!c.invoiceId || c.invoiceId === invoice?.id) &&
      (c.currency ?? "GHS") === currency,
  );
  const otherCurrencyCount = charges.filter(
    (c) =>
      c.clientId === clientId &&
      (!c.invoiceId || c.invoiceId === invoice?.id) &&
      (c.currency ?? "GHS") !== currency,
  ).length;

  // The same ladder the PDF prints, computed live: list price, less what the lines discount,
  // less the invoice-wide discount. Charge lines carry no discount of their own (they are a
  // supplier's price passed through at cost) but do sit inside the subtotal.
  const chargeTotal = available
    .filter((c) => checked.has(c.id))
    .reduce((sum, c) => sum + c.amount, 0);
  const grossSubtotal = lines.reduce((sum, l) => sum + draftGross(l), 0) + chargeTotal;
  const itemDiscountTotal = lines.reduce((sum, l) => sum + draftDiscount(l), 0);
  const subtotal = grossSubtotal - itemDiscountTotal;
  const invoiceDiscount = discountOn(subtotal, discountType || null, Number(discountValue) || 0);
  const total = subtotal - invoiceDiscount;
  const savings = itemDiscountTotal + invoiceDiscount;
  // A percentage over 100 is refused by the API rather than clamped, so say so before the save.
  const percentTooHigh =
    (discountType === "percent" && Number(discountValue) > 100) ||
    lines.some((l) => l.discountType === "percent" && Number(l.discountValue) > 100);

  // Only a warning on dollar invoices: on a cedi invoice there is no settlement rate to
  // double up with, so a "bank charges" line may be perfectly legitimate.
  const feeLines = currency === "USD" ? feeLikeLines(lines) : [];

  function setLine(key: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function toggleCharge(id: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);

    if (!clientId) return setError("Choose a client.");
    if (!title.trim()) return setError("Give the invoice a title.");

    if (percentTooHigh) return setError("A percentage discount cannot be more than 100%.");

    const items = lines
      .filter((l) => l.description.trim())
      .map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity) || 1,
        unitPrice: Number(l.unitPrice) || 0,
        // A type with no value is not a discount: send nothing rather than a zero-percent row.
        discountType: l.discountType && Number(l.discountValue) > 0 ? l.discountType : null,
        discountValue: Number(l.discountValue) || 0,
      }));

    if (items.length === 0 && checked.size === 0) {
      return setError("Add at least one line, or tick a charge to bill.");
    }

    const input: InvoiceInput = {
      title: title.trim(),
      memo: memo.trim() || null,
      currency,
      issueDate: issueDate || null,
      dueDate: dueDate || null,
      items,
      discountType: discountType && Number(discountValue) > 0 ? discountType : null,
      discountValue: Number(discountValue) || 0,
      discountLabel: discountLabel.trim() || null,
      // Only charges still visible in the current currency — switching currency unticks the rest.
      chargeIds: [...checked].filter((id) => available.some((c) => c.id === id)),
    };

    startTransition(async () => {
      const res = invoice
        ? await updateInvoice(invoice.id, clientId, input)
        : await createInvoice(clientId, input);

      if (res.error) {
        setError(res.error);
        return;
      }
      toast(invoice ? "Draft saved." : "Draft invoice created.", "success");
      router.push(`/admin/invoices/${invoice?.id ?? res.invoiceId}`);
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client" htmlFor="clientId" required>
            <Select
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={Boolean(invoice)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Invoice title" htmlFor="title" required>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Infrastructure renewal 2026/27"
            />
          </Field>
          <Field label="Price in" htmlFor="currency">
            <Select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "GHS" | "USD")}
            >
              <option value="GHS">Ghana cedis (₵)</option>
              <option value="USD">US dollars ($)</option>
            </Select>
          </Field>
          <Field label="Issue date" htmlFor="issueDate">
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </Field>
          <Field label="Payment due" htmlFor="dueDate">
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {(available.length > 0 || otherCurrencyCount > 0) && (
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold">
            Outstanding infrastructure charges in {currency === "USD" ? "dollars" : "cedis"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tick what this invoice bills. Paying it closes these charges, so they stop showing as
            outstanding on Receivables.
          </p>
          {otherCurrencyCount > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {otherCurrencyCount} more {otherCurrencyCount === 1 ? "charge is" : "charges are"}{" "}
              recorded in {currency === "USD" ? "cedis" : "dollars"} and cannot go on this invoice.
              Bill {otherCurrencyCount === 1 ? "it" : "them"} separately.
            </p>
          )}
          <ul className="mt-4 space-y-2">
            {available.map((charge) => (
              <li key={charge.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={checked.has(charge.id)}
                    onChange={() => toggleCharge(charge.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="flex-1">{charge.description}</span>
                  {charge.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      due {new Date(charge.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span className="font-medium">{formatMoney(charge.amount, currency)}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Other lines</h2>
          <Button size="sm" variant="outline" onClick={() => setLines((l) => [...l, blankLine()])}>
            Add line
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {lines.map((line) => (
            <div key={line.key} className="flex flex-wrap items-end gap-3">
              <div className="min-w-55 flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Description</label>
                <Input
                  value={line.description}
                  onChange={(e) => setLine(line.key, { description: e.target.value })}
                  placeholder="e.g. Domain renewal (example.com)"
                />
              </div>
              <div className="w-20">
                <label className="mb-1 block text-xs text-muted-foreground">Qty</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.quantity}
                  onChange={(e) => setLine(line.key, { quantity: e.target.value })}
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Unit price ({currency === "USD" ? "$" : "₵"})
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) => setLine(line.key, { unitPrice: e.target.value })}
                />
              </div>
              {/* This line's own discount. The price above stays at list, so the client sees
                  what the work costs and what they are being charged for it. */}
              <div className="w-28">
                <label className="mb-1 block text-xs text-muted-foreground">Discount</label>
                <Select
                  value={line.discountType}
                  onChange={(e) =>
                    setLine(line.key, { discountType: e.target.value as DraftDiscount })
                  }
                >
                  <option value="">None</option>
                  <option value="percent">Percent</option>
                  <option value="amount">Amount</option>
                </Select>
              </div>
              {line.discountType && (
                <div className="w-24">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {line.discountType === "percent" ? "Off (%)" : `Off (${currency === "USD" ? "$" : "₵"})`}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={line.discountType === "percent" ? 100 : undefined}
                    step="0.01"
                    value={line.discountValue}
                    onChange={(e) => setLine(line.key, { discountValue: e.target.value })}
                  />
                </div>
              )}
              <div className="w-28 text-right text-sm">
                <div className="mb-1 text-xs text-muted-foreground">Amount</div>
                <div className="h-10 leading-10">
                  {formatMoney(draftGross(line) - draftDiscount(line), currency)}
                </div>
                {draftDiscount(line) > 0 && (
                  <div className="-mt-2 text-xs text-muted-foreground">
                    was {formatMoney(draftGross(line), currency)}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setLines((l) => (l.length === 1 ? [blankLine()] : l.filter((x) => x.key !== line.key)))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* The invoice-wide discount. Separate from the lines because it answers a different
          question: not "this thing is cheaper for you" but "this job is cheaper for you". */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold">Discount on the total</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Taken off the subtotal, on top of anything the lines above already discount. The client
          sees the full price and this reduction as separate rows.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-36">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="discountType">
              Type
            </label>
            <Select
              id="discountType"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DraftDiscount)}
            >
              <option value="">No discount</option>
              <option value="percent">Percent</option>
              <option value="amount">Fixed amount</option>
            </Select>
          </div>
          {discountType && (
            <>
              <div className="w-28">
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor="discountValue">
                  {discountType === "percent" ? "Off (%)" : `Off (${currency === "USD" ? "$" : "₵"})`}
                </label>
                <Input
                  id="discountValue"
                  type="number"
                  min={0}
                  max={discountType === "percent" ? 100 : undefined}
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
              <div className="min-w-55 flex-1">
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor="discountLabel">
                  Reason (printed on the invoice)
                </label>
                <Input
                  id="discountLabel"
                  value={discountLabel}
                  onChange={(e) => setDiscountLabel(e.target.value)}
                  placeholder="e.g. Launch offer, Partner rate, Goodwill"
                />
              </div>
            </>
          )}
        </div>
        {discountType && !discountLabel.trim() && (
          <p className="mt-3 text-xs text-muted-foreground">
            Without a reason this prints as a plain &ldquo;Discount&rdquo;. Naming it is worth
            doing: a reduction with a reason reads as a favour, one without reads as a price that
            was never real.
          </p>
        )}
      </section>

      {/* The double-charge guard. The settlement rate already contains the bank and card cost,
          so a fee line on a dollar invoice bills it a second time. Warn, do not block: there may
          be a legitimate line that happens to match. */}
      {feeLines.length > 0 && (
        <section className="rounded-xl border border-warning/40 bg-warning-soft p-5">
          <h2 className="text-sm font-semibold text-warning">
            Check this is not being charged twice
          </h2>
          <p className="mt-2 text-sm text-warning">
            {feeLines.length === 1 ? "This line looks" : "These lines look"} like a bank or card
            charge: <span className="font-medium">{feeLines.join(", ")}</span>. On a dollar invoice
            the settlement rate already includes those costs, so adding them as a line charges them
            again. A 12% line on top of an 11.5% rate bills roughly 24%, not 12%.
          </p>
          <p className="mt-2 text-sm text-warning">
            If this line is something else, carry on and save.
          </p>
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface p-6">
        <Field label="Note to the client" htmlFor="memo">
          <textarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            placeholder="Printed under the amount on the invoice. Payment instructions, context, a thank you."
            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus-visible:border-ring focus-visible:outline-none"
          />
        </Field>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-6">
        <div>
          <div className="eyebrow">Invoice total</div>
          <div className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {formatMoney(total, currency)}
          </div>
          {/* The ladder exactly as the client will read it, so nothing about the discount is a
              surprise at the point the PDF is generated. */}
          {savings > 0 && (
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between gap-8">
                <dt className="text-muted-foreground">Before discount</dt>
                <dd className="tabular-nums">{formatMoney(grossSubtotal, currency)}</dd>
              </div>
              {itemDiscountTotal > 0 && (
                <div className="flex justify-between gap-8">
                  <dt className="text-muted-foreground">Discounts on lines</dt>
                  <dd className="tabular-nums">- {formatMoney(itemDiscountTotal, currency)}</dd>
                </div>
              )}
              {invoiceDiscount > 0 && (
                <div className="flex justify-between gap-8">
                  <dt className="text-muted-foreground">
                    {discountLabel.trim() || "Discount"}
                    {discountType === "percent" && ` (${Number(discountValue) || 0}%)`}
                  </dt>
                  <dd className="tabular-nums">- {formatMoney(invoiceDiscount, currency)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-8 border-t border-border pt-1 font-medium">
                <dt>Client saves</dt>
                <dd className="tabular-nums">{formatMoney(savings, currency)}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Spinner /> : null}
            {invoice ? "Save draft" : "Create draft"}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
