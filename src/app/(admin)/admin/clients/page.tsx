import { ClientsView } from "@/components/admin/clients-view";
import { api } from "@/lib/api";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const clients = await api.clients.list();
  return <ClientsView clients={clients} />;
}
