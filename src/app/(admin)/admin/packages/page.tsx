import { PackagesView } from "@/components/admin/packages-view";
import { api } from "@/lib/api";

export const metadata = { title: "Work Packages" };

export default async function PackagesPage() {
  const [packages, clients] = await Promise.all([api.packages.list(), api.clients.list()]);
  return <PackagesView packages={packages} clients={clients} />;
}
