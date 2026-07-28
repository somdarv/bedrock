import { VaultView } from "@/components/vault/vault-view";
import { api } from "@/lib/api";

/**
 * The operator's credential vault. This server component fetches the wrapped key and the
 * encrypted entries, which is all the backend has: it cannot decrypt any of it and neither can
 * this render pass. Everything readable happens in the browser after the passphrase is entered.
 * See docs/VAULT.md.
 */
export const metadata = { title: "Vault" };

export default async function VaultPage() {
  const state = await api.vault.get();

  return <VaultView initial={state} />;
}
