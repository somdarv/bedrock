"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/states";
import { checkPassphrase, createVaultKey, unlockVault, VaultUnlockError } from "@/lib/vault/crypto";
import { createVaultKeyAction } from "@/lib/vault/actions";
import type { VaultKeyRecord } from "@/lib/api";
import { cn } from "@/lib/utils";

const LockIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-6 w-6", className)}
    aria-hidden
  >
    <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </svg>
);

function GateShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center">
      <div className="border-border bg-surface rounded-xl border p-8">
        <div className="bg-muted text-foreground flex h-11 w-11 items-center justify-center rounded-full">
          <LockIcon />
        </div>
        <h1 className="font-display tracking-tightest mt-5 text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- unlock */

export function VaultUnlock({
  keyRecord,
  onUnlocked,
}: {
  keyRecord: VaultKeyRecord;
  onUnlocked: (dataKey: CryptoKey) => void;
}) {
  const [passphrase, setPassphrase] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passphrase || busy) return;

    setBusy(true);
    setError(null);
    try {
      const dataKey = await unlockVault(passphrase, keyRecord);
      setPassphrase("");
      onUnlocked(dataKey);
    } catch (err) {
      setError(
        err instanceof VaultUnlockError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not open the vault.",
      );
      setBusy(false);
    }
  }

  return (
    <GateShell
      title="Vault locked"
      description="Enter your master passphrase. It is checked here in your browser, never sent to the server."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Master passphrase" htmlFor="vault-passphrase" error={error ?? undefined}>
          <Input
            id="vault-passphrase"
            type="password"
            autoFocus
            autoComplete="off"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Your passphrase"
          />
        </Field>

        <Button type="submit" className="w-full" disabled={!passphrase || busy}>
          {busy ? (
            <>
              <Spinner /> Opening
            </>
          ) : (
            "Unlock"
          )}
        </Button>
        {busy && (
          <p className="text-muted-foreground text-center text-xs">
            Deriving the key takes a moment by design. That slowness is what makes the passphrase
            expensive to guess.
          </p>
        )}
      </form>
    </GateShell>
  );
}

/* ---------------------------------------------------------------------- setup */

export function VaultSetup({
  onReady,
}: {
  onReady: (keyRecord: VaultKeyRecord, dataKey: CryptoKey) => void;
}) {
  const [passphrase, setPassphrase] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const strength = checkPassphrase(passphrase);
  const mismatch = confirm.length > 0 && confirm !== passphrase;
  const ready =
    strength.score >= 2 && passphrase === confirm && confirm.length > 0 && acknowledged && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;

    setBusy(true);
    setError(null);
    try {
      const { input, dataKey } = await createVaultKey(passphrase);
      const result = await createVaultKeyAction(input);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Could not set up the vault.");
        setBusy(false);
        return;
      }
      setPassphrase("");
      setConfirm("");
      onReady(result.data, dataKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set up the vault.");
      setBusy(false);
    }
  }

  return (
    <GateShell
      title="Set up your vault"
      description="Choose a master passphrase. It encrypts everything you store here, in your browser, before anything reaches the server."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Master passphrase"
          htmlFor="vault-new"
          hint={strength.hint ?? undefined}
          error={strength.score === 1 ? (strength.hint ?? undefined) : undefined}
        >
          <Input
            id="vault-new"
            type="password"
            autoFocus
            autoComplete="new-password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Four unrelated words works well"
          />
          {passphrase.length > 0 && <StrengthMeter score={strength.score} label={strength.label} />}
        </Field>

        <Field
          label="Confirm passphrase"
          htmlFor="vault-confirm"
          error={mismatch ? "The two passphrases do not match." : undefined}
        >
          <Input
            id="vault-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        <label className="border-warning/30 bg-warning-soft flex cursor-pointer gap-3 rounded-lg border p-3.5">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-current"
          />
          <span className="text-warning text-xs leading-relaxed">
            I understand there is no recovery. If I forget this passphrase, nobody can reset it and
            everything in the vault is gone for good. Write it down somewhere safe, offline.
          </span>
        </label>

        {error && <p className="text-danger text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={!ready}>
          {busy ? (
            <>
              <Spinner /> Creating
            </>
          ) : (
            "Create vault"
          )}
        </Button>
      </form>
    </GateShell>
  );
}

function StrengthMeter({ score, label }: { score: number; label: string }) {
  const tone =
    score <= 1 ? "bg-danger" : score === 2 ? "bg-warning" : score === 3 ? "bg-info" : "bg-success";

  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex h-1 flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn("flex-1 rounded-full transition-colors", i <= score ? tone : "bg-muted")}
          />
        ))}
      </div>
      <span className="text-muted-foreground w-20 shrink-0 text-right text-xs">{label}</span>
    </div>
  );
}
