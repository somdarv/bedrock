"use server";

import {
  api,
  ApiError,
  type VaultEntryInput,
  type VaultEntryRecord,
  type VaultKeyInput,
  type VaultKeyRecord,
} from "@/lib/api";

/**
 * Server actions for the vault. These are a pipe and nothing more: ciphertext arrives from the
 * browser, gets forwarded to the API under the session's bearer token, and the stored record
 * comes back. No action here takes a passphrase or a plaintext secret, and none should ever be
 * added. Anything that needs the data key belongs in the browser. See docs/VAULT.md.
 */

export interface VaultActionState<T = undefined> {
  ok?: boolean;
  error?: string;
  data?: T;
}

const fail = (e: unknown, fallback: string): VaultActionState<never> => ({
  error: e instanceof ApiError ? e.message : fallback,
});

export async function createVaultKeyAction(
  input: VaultKeyInput,
): Promise<VaultActionState<VaultKeyRecord>> {
  try {
    return { ok: true, data: await api.vault.createKey(input) };
  } catch (e) {
    return fail(e, "Could not set up the vault.");
  }
}

export async function updateVaultKeyAction(
  input: VaultKeyInput,
): Promise<VaultActionState<VaultKeyRecord>> {
  try {
    return { ok: true, data: await api.vault.updateKey(input) };
  } catch (e) {
    return fail(e, "Could not change the passphrase.");
  }
}

export async function createVaultEntryAction(
  input: VaultEntryInput,
): Promise<VaultActionState<VaultEntryRecord>> {
  try {
    return { ok: true, data: await api.vault.createEntry(input) };
  } catch (e) {
    return fail(e, "Could not save the entry.");
  }
}

export async function updateVaultEntryAction(
  id: string,
  input: VaultEntryInput,
): Promise<VaultActionState<VaultEntryRecord>> {
  try {
    return { ok: true, data: await api.vault.updateEntry(id, input) };
  } catch (e) {
    return fail(e, "Could not save the entry.");
  }
}

export async function deleteVaultEntryAction(id: string): Promise<VaultActionState> {
  try {
    await api.vault.removeEntry(id);
    return { ok: true };
  } catch (e) {
    return fail(e, "Could not delete the entry.");
  }
}

/** Destroys the key and every entry. Confirmed with the account password, checked by the API. */
export async function destroyVaultAction(password: string): Promise<VaultActionState> {
  try {
    await api.vault.destroy(password);
    return { ok: true };
  } catch (e) {
    return fail(e, "Could not reset the vault.");
  }
}
