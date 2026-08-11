import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { InvoicePayButton } from "@/components/portal/invoice-pay-button";
import { api, ApiError } from "@/lib/api";
import { formatCedis } from "@/lib/utils";

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
            <div
              className={`mt-2 font-display text-xl font-semibold tracking-tight ${settled ? "text-success" : "text-warning"}`}
            >
              {formatCedis(invoice.balance)}
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
              Paid in full — thank you.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {formatCedis(invoice.balance)} due{" "}
                  {dueDate ? (overdue ? `since ${dueDate}` : `by ${dueDate}`) : "on receipt"}.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pay by card, MTN MoMo, Telecel Cash, AirtelTigo Money or bank transfer.
                </p>
              </div>
              <InvoicePayButton slug={slug} label={`Pay ${formatCedis(invoice.balance)}`} />
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
                  <td className="px-4 py-3 text-right font-medium">{formatCedis(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoice.memo && <p className="mt-4 text-sm text-muted-foreground">{invoice.memo}</p>}
      </section>
    </div>
  );
}
