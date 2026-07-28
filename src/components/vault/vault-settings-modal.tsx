"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { checkPassphrase, rewrapVaultKey } from "@/lib/vault/crypto";
import { destroyVaultAction, updateVaultKeyAction } from "@/lib/vault/actions";
import { AUTO_LOCK_CHOICES, writeAutoLockPreference } from "@/lib/vault/use-auto-lock";
import { VaultBackup } from "./vault-backup";
import type { VaultItem, VaultSecret } from "@/lib/vault/types";

/**
 * Vault settings: auto-lock timing, passphrase change, and the reset. Reachable only while
 * unlocked, which is what makes the passphrase change safe: rewrapping needs the data key, so
 * holding it is the proof that the old passphrase was known.
 */
export function VaultSettingsModal({
  open,
  onClose,
  dataKey,
  items,
  autoLockMinutes,
  onAutoLockChange,
  onImport,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  dataKey: CryptoKey;
  items: VaultItem[];
  autoLockMinutes: number;
  onAutoLockChange: (minutes: number) => void;
  onImport: (secrets: VaultSecret[]) => Promise<{ added: number; failed: number }>;
  onReset: () => void;
}) {
  const entryCount = items.length;
  const { toast } = useToast();
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [resetting, setResetting] = React.useState(false);
  const [accountPassword, setAccountPassword] = React.useState("");
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [resetBusy, setResetBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) return;
    setNext("");
    setConfirm("");
    setError(null);
    setResetting(false);
    setAccountPassword("");
    setResetError(null);
  }, [open]);

  const strength = checkPassphrase(next);
  const canChange = strength.score >= 2 && next === confirm && next.length > 0 && !busy;

  async function changePassphrase(e: React.FormEvent) {
    e.preventDefault();
    if (!canChange) return;

    setBusy(true);
    setError(null);
    try {
      const input = await rewrapVaultKey(dataKey, next);
      const result = await updateVaultKeyAction(input);
      if (!result.ok) {
        setError(result.error ?? "Could not change the passphrase.");
        setBusy(false);
        return;
      }
      setNext("");
      setConfirm("");
      setBusy(false);
      toast("Passphrase changed. Use the new one next time you unlock.", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the passphrase.");
      setBusy(false);
    }
  }

  async function resetVault() {
    if (!accountPassword || resetBusy) return;

    setResetBusy(true);
    setResetError(null);
    const result = await destroyVaultAction(accountPassword);
    if (!result.ok) {
      setResetError(result.error ?? "Could not reset the vault.");
      setResetBusy(false);
      return;
    }
    onReset();
  }

  return (
    <Modal open={open} onClose={onClose} title="Vault settings" className="max-w-lg">
      <div className="space-y-7">
        <section>
          <h3 className="text-sm font-medium">Auto-lock</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            The vault relocks after this much time with no activity. It also locks whenever you
            leave the page, because the key is only ever held in memory.
          </p>
          <Select
            className="mt-3"
            value={autoLockMinutes}
            onChange={(e) => {
              const minutes = Number(e.target.value);
              writeAutoLockPreference(minutes);
              onAutoLockChange(minutes);
            }}
          >
            {AUTO_LOCK_CHOICES.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "Never (not recommended)" : `After ${m} minute${m === 1 ? "" : "s"}`}
              </option>
            ))}
          </Select>
        </section>

        <section className="border-border border-t pt-6">
          <h3 className="text-sm font-medium">Change master passphrase</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Your {entryCount} {entryCount === 1 ? "entry stays" : "entries stay"} exactly as they
            are. Only the key protecting them is rewrapped, so this is quick and safe.
          </p>

          <form onSubmit={changePassphrase} className="mt-3 space-y-3">
            <Field label="New passphrase" htmlFor="vs-new" hint={strength.hint ?? undefined}>
              <Input
                id="vs-new"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </Field>
            <Field
              label="Confirm"
              htmlFor="vs-confirm"
              error={confirm.length > 0 && confirm !== next ? "These do not match." : undefined}
            >
              <Input
                id="vs-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>

            {error && <p className="text-danger text-sm">{error}</p>}

            <Button type="submit" variant="outline" disabled={!canChange}>
              {busy ? (
                <>
                  <Spinner /> Rewrapping
                </>
              ) : (
                "Change passphrase"
              )}
            </Button>
          </form>
        </section>

        <VaultBackup items={items} onImport={onImport} />

        <section className="border-border border-t pt-6">
          <h3 className="text-danger text-sm font-medium">Reset the vault</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Deletes the key and all {entryCount} {entryCount === 1 ? "entry" : "entries"}{" "}
            permanently. This is the only way past a forgotten passphrase, and it destroys the data
            rather than recovering it.
          </p>

          {!resetting ? (
            <Button
              type="button"
              variant="outline"
              className="border-danger/40 text-danger hover:bg-danger-soft mt-3"
              onClick={() => setResetting(true)}
            >
              Reset vault
            </Button>
          ) : (
            <div className="border-danger/30 bg-danger-soft mt-3 space-y-3 rounded-lg border p-4">
              <Field
                label="Confirm with your account password"
                htmlFor="vs-account"
                error={resetError ?? undefined}
              >
                <Input
                  id="vs-account"
                  type="password"
                  autoComplete="current-password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="danger"
                  disabled={!accountPassword || resetBusy}
                  onClick={resetVault}
                >
                  {resetBusy ? (
                    <>
                      <Spinner /> Deleting
                    </>
                  ) : (
                    "Delete everything"
                  )}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setResetting(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
