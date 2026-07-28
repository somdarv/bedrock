"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import { PasswordGenerator } from "./password-generator";
import { isValidTotpSecret, normaliseTotpInput } from "@/lib/vault/totp";
import { ratePassword } from "@/lib/vault/generator";
import {
  CATEGORY_LABELS,
  emptySecret,
  todayIso,
  VAULT_CATEGORIES,
  type VaultItem,
  type VaultSecret,
} from "@/lib/vault/types";
import { cn } from "@/lib/utils";

/**
 * Add or edit one credential. The form holds plaintext in component state only: the parent
 * encrypts on save and this component is unmounted straight after, so nothing lingers.
 */
export function VaultEntryModal({
  open,
  entry,
  onClose,
  onSave,
}: {
  open: boolean;
  /** null means a new entry. */
  entry: VaultItem | null;
  onClose: () => void;
  onSave: (secret: VaultSecret, id: string | null) => Promise<string | null>;
}) {
  const [form, setForm] = React.useState<VaultSecret>(emptySecret);
  const [codesText, setCodesText] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset to the entry under edit each time the modal opens, so a cancelled edit leaves nothing.
  React.useEffect(() => {
    if (!open) return;
    const base = entry ? { ...(entry as VaultSecret) } : emptySecret();
    setForm(base);
    setCodesText(base.backupCodes.join("\n"));
    setShowPassword(false);
    setGenerating(false);
    setError(null);
    setBusy(false);
  }, [open, entry]);

  const set = <K extends keyof VaultSecret>(field: K, value: VaultSecret[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Editing the password is the moment the "last changed" date is actually known, so stamp it
  // here rather than making the user remember to set it.
  const onPasswordChange = (value: string) => {
    setForm((f) => ({
      ...f,
      password: value,
      lastChangedAt: entry && value !== entry.password ? todayIso() : f.lastChangedAt,
    }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim() || busy) return;

    setBusy(true);
    setError(null);

    const backupCodes = codesText
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter(Boolean);

    const secret: VaultSecret = {
      ...form,
      label: form.label.trim(),
      url: form.url.trim(),
      username: form.username.trim(),
      // Accepts a bare seed or a whole otpauth:// URI, whichever the issuer handed over.
      totpSecret: normaliseTotpInput(form.totpSecret),
      backupCodes,
      // Drop used marks for codes that are no longer in the list, so replacing the whole set
      // after regenerating them starts clean rather than carrying stale marks forward.
      usedBackupCodes: (form.usedBackupCodes ?? []).filter((c) => backupCodes.includes(c)),
    };

    const failure = await onSave(secret, entry?.id ?? null);
    if (failure) {
      setError(failure);
      setBusy(false);
      return;
    }
    onClose();
  }

  const codeCount = codesText.split(/[\n,]/).filter((c) => c.trim()).length;
  // Validate the normalised form, so pasting an otpauth:// link does not read as an error.
  const totpOk = form.totpSecret ? isValidTotpSecret(normaliseTotpInput(form.totpSecret)) : false;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? "Edit entry" : "New entry"}
      description="Encrypted in this browser before it is saved."
      className="max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="vault-entry-form" disabled={!form.label.trim() || busy}>
            {busy ? (
              <>
                <Spinner /> Saving
              </>
            ) : (
              "Save entry"
            )}
          </Button>
        </>
      }
    >
      <form id="vault-entry-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="ve-label" required>
            <Input
              id="ve-label"
              autoFocus
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Namecheap"
            />
          </Field>

          <Field label="Category" htmlFor="ve-category">
            <Select
              id="ve-category"
              value={form.category}
              onChange={(e) => set("category", e.target.value as VaultSecret["category"])}
            >
              {VAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Site or URL" htmlFor="ve-url">
          <Input
            id="ve-url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://ap.www.namecheap.com"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username" htmlFor="ve-username">
            <Input
              id="ve-username"
              autoComplete="off"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
            />
          </Field>

          <Field label="Password" htmlFor="ve-password">
            <div className="relative">
              <Input
                id="ve-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pr-16 font-mono"
                value={form.password}
                onChange={(e) => onPasswordChange(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-xs"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <button
                type="button"
                onClick={() => setGenerating((g) => !g)}
                className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
              >
                {generating ? "Hide generator" : "Generate one"}
              </button>
              {form.password && <PasswordVerdict password={form.password} />}
            </div>
          </Field>
        </div>

        {generating && (
          <PasswordGenerator
            onApply={(password) => {
              onPasswordChange(password);
              setGenerating(false);
              setShowPassword(true);
            }}
          />
        )}

        <Field
          label="Password last changed"
          htmlFor="ve-changed"
          hint="Stamped automatically when you edit the password above."
        >
          <Input
            id="ve-changed"
            type="date"
            value={form.lastChangedAt}
            onChange={(e) => set("lastChangedAt", e.target.value)}
          />
        </Field>

        <div className="border-border rounded-lg border p-4">
          <div className="text-sm font-medium">Two-factor</div>
          <p className="text-muted-foreground mt-1 text-xs">
            The seed printed under the QR code when you turn on 2FA, plus the recovery codes issued
            at the same time. Keeping the codes here is the point: they are what gets you back in
            when the phone is gone.
          </p>

          <div className="mt-4 space-y-4">
            <Field
              label="TOTP secret"
              htmlFor="ve-totp"
              hint={
                !form.totpSecret
                  ? "Paste the base32 seed or the whole otpauth:// link."
                  : totpOk
                    ? "Valid. The vault will generate codes from this."
                    : undefined
              }
              error={form.totpSecret && !totpOk ? "This does not decode as base32." : undefined}
            >
              <Input
                id="ve-totp"
                autoComplete="off"
                className="font-mono"
                value={form.totpSecret}
                onChange={(e) => set("totpSecret", e.target.value)}
                placeholder="JBSWY3DPEHPK3PXP"
              />
            </Field>

            <Field
              label="Backup codes"
              htmlFor="ve-codes"
              hint={
                codeCount > 0 ? `${codeCount} code${codeCount === 1 ? "" : "s"}` : "One per line."
              }
            >
              <Textarea
                id="ve-codes"
                rows={4}
                className="font-mono"
                value={codesText}
                onChange={(e) => setCodesText(e.target.value)}
                placeholder={"a1b2-c3d4\ne5f6-g7h8"}
              />
            </Field>
          </div>
        </div>

        <Field label="Notes" htmlFor="ve-notes">
          <Textarea
            id="ve-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Security questions, account number, anything else worth keeping."
          />
        </Field>

        {error && <p className="text-danger text-sm">{error}</p>}
      </form>
    </Modal>
  );
}

/** Inline verdict on the typed password. Advisory: nothing here blocks saving. */
function PasswordVerdict({ password }: { password: string }) {
  const { bits, verdict } = ratePassword(password);
  const tone =
    verdict === "strong" ? "text-success" : verdict === "fair" ? "text-warning" : "text-danger";
  const label = verdict === "strong" ? "Strong" : verdict === "fair" ? "Fair" : "Weak";

  return (
    <span className={cn("text-xs tabular-nums", tone)}>
      {label}, ~{bits} bits
    </span>
  );
}
