import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { InvoiceDetail } from "@/components/admin/invoice-detail";
import { api, ApiError } from "@/lib/api";

export const metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await api.invoices.get(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });

  const client = await api.clients.get(invoice.clientId).catch(() => null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton href="/admin/invoices" label="Invoices" />
      <InvoiceDetail invoice={invoice} contacts={client?.contacts ?? []} clientName={client?.name ?? invoice.clientName} />
    </div>
  );
}
