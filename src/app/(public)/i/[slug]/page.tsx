import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { InvoicePayButton } from "@/components/portal/invoice-pay-button";
import { api, ApiError } from "@/lib/api";
import { formatCedis, formatMoney, formatRate } from "@/lib/utils";

export const metadata = { title: "Your invoice" };

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * The invoice slug is a UUID. Tolerate a junk prefix on the incoming path — e.g. a WhatsApp
 * button that renders "/i/{{1}}<uuid>" from a mis-authored dynamic-URL template — by pulling
 * the embedded UUID out. A clean slug passes straight through.
 */
function extractSlug(raw: string): string {
  const match = raw.match(UUID_RE);
  return match ? match[0] : raw;
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * The public face of a standalone invoice — where the Pay button printed on the PDF lands.
 *
 * Read by the unguessable slug, like the work-package portal, so there is no login for the
 * client to get past. Nothing here confirms a payment: the page re-reads its state from the
 * API, and that state only moves once Paystack's webhook has been verified server-side.
 */
export default async function InvoicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = extractSlug(rawSlug);

  const invoice = await api.invoices.getBySlug(slug).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });

  const isUsd = invoice.currency === "USD";
  // The cedi figure was locked when the invoice was issued, so this page restates the number on
  // the PDF rather than quoting a fresh one. A page disagreeing with the document in their hand
  // would be worse than no page at all.
  const payable = invoice.quote?.amountGhs ?? null;
  const rateExpired = invoice.quote?.expired ?? false;
  const settled = invoice.balance <= 0;
  const voided = invoice.status === "void";
  const dueDate = fmtDate(invoice.dueDate);
  const overdue = !settled && !voided && invoice.dueDate ? new Date(invoice.dueDate) < new Date() : false;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <div className="eyebrow">Invoice {invoice.reference ?? ""}</div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
          {invoice.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge variant={voided ? "danger" : settled ? "success" : overdue ? "danger" : "warning"}>
            {voided ? "Cancelled" : settled ? "Paid" : overdue ? "Overdue" : "Due"}
          </Badge>
          {invoice.clientName && (
            <span className="text-sm text-muted-foreground">Billed to {invoice.clientName}</span>
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
          </div>
          <div>
            <div className="eyebrow">Paid</div>
            <div className="mt-2 font-display text-xl font-semibold tracking-tight text-success">
              {formatMoney(invoice.paid, invoice.currency)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Balance</div>
            <div
              className={`mt-2 font-display text-xl font-semibold tracking-tight ${settled ? "text-success" : "text-warning"}`}
            >
              {formatMoney(invoice.balance, invoice.currency)}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          {voided ? (
            <p className="text-sm text-muted-foreground">
              This invoice has been cancelled. Please contact us if you were expecting to pay it.
            </p>
          ) : settled ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Paid in full. Thank you.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(invoice.balance, invoice.currency)} due{" "}
                  {dueDate ? (overdue ? `since ${dueDate}` : `by ${dueDate}`) : "on receipt"}
                  {isUsd && payable !== null ? `, payable today as ${formatCedis(payable)}` : ""}.
                </p>
                {isUsd && invoice.quote && !rateExpired && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    At the settlement rate of ₵{formatRate(invoice.quote.rate)} to the dollar.
                    {invoice.quote.validUntil &&
                      ` This amount holds until ${fmtDate(invoice.quote.validUntil)}.`}
                  </p>
                )}
                {isUsd && rateExpired && (
                  <p className="mt-1 text-xs text-warning">
                    This amount was valid until {fmtDate(invoice.quote?.validUntil ?? null)}. Please
                    contact us and we will send you an up to date invoice.
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Pay by card, MTN MoMo, Telecel Cash, AirtelTigo Money or bank transfer.
                </p>
              </div>
              {(!isUsd || payable !== null) && !rateExpired && (
                <InvoicePayButton
                  slug={slug}
                  label={`Pay ${formatCedis(isUsd ? (payable as number) : invoice.balance)}`}
                />
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
          <a
            href={`/i/${slug}/invoice`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M9 15l3 3 3-3" />
            </svg>
            Download invoice
          </a>
          {invoice.receiptReference && (
            <a
              href={`/i/${slug}/receipt`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 15l3 3 3-3" />
              </svg>
              Download receipt
            </a>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold tracking-tight">What this covers</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoice.memo && <p className="mt-4 text-sm text-muted-foreground">{invoice.memo}</p>}
      </section>

      {/* Answers the question a client asks the moment they compare our figure to Google's:
          "the rate says 11.60, so how is this 13?" Being asked that is a bad position; saying it
          first is not. The mid-market figure itself is never quoted back — it would turn the
          margin into the thing being negotiated, and it is stale by the time anyone reads it. */}
      {isUsd && invoice.quote && (
        <section className="rounded-xl border border-border bg-muted/30 p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            About the rate
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Your hosting, domain and certificates are bought in US dollars, so this invoice is
              priced in dollars and converted for you at{" "}
              <span className="font-medium text-foreground">
                ₵{formatRate(invoice.quote.rate)} to the dollar
              </span>
              .
            </p>
            <p>
              <span className="font-medium text-foreground">
                That is higher than the rate you will find online, and here is why.
              </span>{" "}
              The figure quoted by Google or XE is the interbank mid-market rate: the price banks
              trade dollars with each other at, in very large amounts. No card, bank or forex
              bureau converts money at it. If you paid a dollar bill with your own Ghanaian card
              today, your bank would apply a gap of its own in exactly the same way.
            </p>
            <p>
              <span className="font-medium text-foreground">
                The cedi figure above is the whole amount.
              </span>{" "}
              It is fixed{invoice.quote?.validUntil ? ` until ${fmtDate(invoice.quote.validUntil)}` : ""},
              so you can send exactly that by mobile money, bank transfer or card and it will
              settle the invoice in full. After that date, ask us for an updated invoice and we
              will send a fresh one.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
