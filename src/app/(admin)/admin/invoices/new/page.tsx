import { BackButton } from "@/components/ui/back-button";
import { InvoiceComposer } from "@/components/admin/invoice-composer";
import { api } from "@/lib/api";

export const metadata = { title: "New invoice" };

/**
 * Compose a standalone invoice. Every client's outstanding infrastructure charges are loaded up
 * front so billing a renewal is a matter of ticking it rather than re-typing what the charge
 * already records — and so paying the invoice can close the charge behind it.
 */
export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const clients = await api.clients.list();

  const charges = await api.infrastructure
    .chargesOutstanding()
    .then((res) => res.items)
    .catch(() => []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton href="/admin/invoices" label="Invoices" />
      <header>
        <div className="eyebrow">Billing</div>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tightest">New invoice</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This creates a draft. Nothing is sent and no reference is minted until you issue it.
        </p>
      </header>

      <InvoiceComposer clients={clients} charges={charges} initialClientId={clientId ?? null} />
    </div>
  );
}
