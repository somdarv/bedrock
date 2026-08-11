import { notFound, redirect } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { InvoiceComposer } from "@/components/admin/invoice-composer";
import { api, ApiError } from "@/lib/api";

export const metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await api.invoices.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });

  // Issuing freezes the lines: the client is holding a numbered document by then.
  if (invoice.status !== "draft") redirect(`/admin/invoices/${id}`);

  const [clients, charges] = await Promise.all([
    api.clients.list(),
    api.infrastructure
      .chargesOutstanding()
      .then((res) => res.items)
      .catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton href={`/admin/invoices/${id}`} label="Invoice" />
      <header>
        <div className="eyebrow">Billing</div>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tightest">Edit draft</h1>
      </header>

      <InvoiceComposer clients={clients} charges={charges} invoice={invoice} />
    </div>
  );
}
