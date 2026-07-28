"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { VaultSetup, VaultUnlock } from "./vault-gate";
import { VaultEntryModal } from "./vault-entry-modal";
import { VaultSettingsModal } from "./vault-settings-modal";
import { VaultHealth } from "./vault-health";
import { TotpCode } from "./totp-code";
import { PlainValue, SecretValue } from "./secret-value";
import {
  createVaultEntryAction,
  deleteVaultEntryAction,
  updateVaultEntryAction,
} from "@/lib/vault/actions";
import { decryptSecret, encryptSecret } from "@/lib/vault/crypto";
import { readAutoLockPreference, useAutoLock } from "@/lib/vault/use-auto-lock";
import {
  CATEGORY_LABELS,
  displayHost,
  emptySecret,
  isRecoverable,
  monthsSince,
  PASSKEY_KIND_LABELS,
  type PasskeyRecord,
  type VaultItem,
  type VaultSecret,
} from "@/lib/vault/types";
import { STALE_MONTHS } from "@/lib/vault/audit";
import type { VaultEntryRecord, VaultKeyRecord, VaultState } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * The vault screen. Owns the lock state and the decrypted set for one unlocked session.
 *
 * The data key is held in React state and nowhere else: no storage, no cookie, no ref that
 * outlives the component. Locking is therefore just dropping it, and a reload always lands on
 * the locked screen. See docs/VAULT.md.
 */
export function VaultView({ initial }: { initial: VaultState }) {
  const { toast } = useToast();

  const [keyRecord, setKeyRecord] = React.useState<VaultKeyRecord | null>(initial.key);
  const [records, setRecords] = React.useState<VaultEntryRecord[]>(initial.entries);

  const [dataKey, setDataKey] = React.useState<CryptoKey | null>(null);
  const [items, setItems] = React.useState<VaultItem[]>([]);
  const [undecryptable, setUndecryptable] = React.useState(0);

  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<VaultItem | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = React.useState(5);

  React.useEffect(() => setAutoLockMinutes(readAutoLockPreference()), []);

  const lock = React.useCallback(() => {
    setDataKey(null);
    setItems([]);
    setUndecryptable(0);
    setSelectedId(null);
    setQuery("");
    setModalOpen(false);
    setSettingsOpen(false);
  }, []);

  useAutoLock(dataKey !== null, autoLockMinutes, lock);

  /** Decrypt the whole set on unlock. One bad row must not take the rest of the vault down. */
  const openAll = React.useCallback(async (key: CryptoKey, source: VaultEntryRecord[]) => {
    const decrypted: VaultItem[] = [];
    let failed = 0;

    for (const record of source) {
      try {
        const secret = await decryptSecret(key, record.ciphertext, record.iv);
        decrypted.push({
          ...secret,
          id: record.id,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        });
      } catch {
        failed += 1;
      }
    }

    setItems(decrypted);
    setUndecryptable(failed);
    setDataKey(key);
  }, []);

  async function onUnlocked(key: CryptoKey) {
    await openAll(key, records);
  }

  function onSetupComplete(record: VaultKeyRecord, key: CryptoKey) {
    setKeyRecord(record);
    setDataKey(key);
    setItems([]);
  }

  /**
   * Encrypt, persist, and fold the result back into local state. Returns an error message, or
   * null on success. Silent by design: the callers decide what is worth a toast, because
   * ticking off a backup code should not announce itself the way saving a form does.
   */
  const persist = React.useCallback(
    async (secret: VaultSecret, id: string | null): Promise<string | null> => {
      if (!dataKey) return "The vault is locked.";

      try {
        const payload = await encryptSecret(dataKey, secret);
        const result = id
          ? await updateVaultEntryAction(id, payload)
          : await createVaultEntryAction(payload);

        if (!result.ok || !result.data) return result.error ?? "Could not save the entry.";

        const record = result.data;
        const item: VaultItem = {
          ...secret,
          id: record.id,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };

        setRecords((prev) =>
          id ? prev.map((r) => (r.id === id ? record : r)) : [record, ...prev],
        );
        setItems((prev) => (id ? prev.map((i) => (i.id === id ? item : i)) : [item, ...prev]));
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "Could not save the entry.";
      }
    },
    [dataKey],
  );

  async function saveEntry(secret: VaultSecret, id: string | null): Promise<string | null> {
    const failure = await persist(secret, id);
    if (failure) return failure;

    toast(id ? "Entry updated." : "Entry saved.", "success");
    if (!id) setSelectedId(null);
    return null;
  }

  /** Tick a backup code off (or back on) once it has been spent at the issuer. */
  async function toggleBackupCode(item: VaultItem, code: string) {
    const used = item.usedBackupCodes ?? [];
    const next = used.includes(code) ? used.filter((c) => c !== code) : [...used, code];

    const failure = await persist({ ...item, usedBackupCodes: next }, item.id);
    if (failure) toast(failure, "danger");
  }

  /**
   * Restore entries from a decrypted backup file. Saved one at a time so a single bad row is
   * reported rather than sinking the whole restore.
   */
  async function importSecrets(secrets: VaultSecret[]) {
    let added = 0;
    let failed = 0;

    for (const secret of secrets) {
      const failure = await persist({ ...emptySecret(), ...secret }, null);
      if (failure) failed += 1;
      else added += 1;
    }

    return { added, failed };
  }

  async function removeEntry(item: VaultItem) {
    if (!window.confirm(`Delete "${item.label}"? This cannot be undone.`)) return;

    const result = await deleteVaultEntryAction(item.id);
    if (!result.ok) {
      toast(result.error ?? "Could not delete the entry.", "danger");
      return;
    }
    setRecords((prev) => prev.filter((r) => r.id !== item.id));
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setSelectedId(null);
    toast("Entry deleted.", "success");
  }

  function afterReset() {
    setKeyRecord(null);
    setRecords([]);
    lock();
    toast("Vault reset. Set a new passphrase to start again.", "success");
  }

  /* --------------------------------------------------------------- gate states */

  if (!keyRecord) return <VaultSetup onReady={onSetupComplete} />;
  if (!dataKey) return <VaultUnlock keyRecord={keyRecord} onUnlocked={onUnlocked} />;

  /* ------------------------------------------------------------------ unlocked */

  // Search runs over the decrypted set in memory. The server cannot do this for us, and that
  // is the trade we accepted: it holds no plaintext to search.
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? items.filter((i) =>
        [i.label, i.url, i.username, i.notes, CATEGORY_LABELS[i.category]]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : items;

  const sorted = [...filtered].sort((a, b) => a.label.localeCompare(b.label));
  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="font-display tracking-tightest mt-3 text-3xl font-semibold md:text-4xl">
            Vault
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed">
            {items.length} {items.length === 1 ? "credential" : "credentials"}, encrypted in this
            browser. The server stores them without ever being able to read them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          <Button variant="outline" onClick={lock}>
            Lock
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            New entry
          </Button>
        </div>
      </header>

      {undecryptable > 0 && (
        <div className="border-warning/30 bg-warning-soft text-warning rounded-lg border px-4 py-3 text-sm">
          {undecryptable} {undecryptable === 1 ? "entry" : "entries"} could not be decrypted. They
          were most likely written under a different key.
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Nothing stored yet"
          description="Add your first credential. Site, username, password, and the 2FA seed and backup codes if the account has them."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              New entry
            </Button>
          }
        />
      ) : (
        <>
          <VaultHealth items={items} onSelect={setSelectedId} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* List */}
            <div className="space-y-3">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, site, username or note"
                aria-label="Search the vault"
              />

              {sorted.length === 0 ? (
                <p className="border-border text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">
                  Nothing matches “{query}”.
                </p>
              ) : (
                <ul className="divide-border border-border bg-surface divide-y overflow-hidden rounded-xl border">
                  {sorted.map((item) => {
                    const age = monthsSince(item.lastChangedAt);
                    const stale = age !== null && age >= STALE_MONTHS;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={cn(
                            "hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                            selectedId === item.id && "bg-muted",
                          )}
                        >
                          <span className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold uppercase">
                            {item.label.slice(0, 2)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{item.label}</span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {item.username ||
                                displayHost(item.url) ||
                                CATEGORY_LABELS[item.category]}
                            </span>
                          </span>
                          {(item.passkeys?.length ?? 0) > 0 && (
                            <Badge variant="info">Passkey</Badge>
                          )}
                          {item.totpSecret && <Badge variant="info">2FA</Badge>}
                          {stale && <Badge variant="warning">{age}m</Badge>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Detail */}
            <div>
              {selected ? (
                <VaultDetail
                  item={selected}
                  onEdit={() => {
                    setEditing(selected);
                    setModalOpen(true);
                  }}
                  onDelete={() => removeEntry(selected)}
                  onToggleCode={(code) => toggleBackupCode(selected, code)}
                />
              ) : (
                <div className="border-border text-muted-foreground flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm">
                  Pick an entry to see its details.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <VaultEntryModal
        open={modalOpen}
        entry={editing}
        onClose={() => setModalOpen(false)}
        onSave={saveEntry}
      />

      <VaultSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        dataKey={dataKey}
        items={items}
        autoLockMinutes={autoLockMinutes}
        onAutoLockChange={setAutoLockMinutes}
        onImport={importSecrets}
        onReset={afterReset}
      />
    </div>
  );
}

/* ------------------------------------------------------------------- detail */

function VaultDetail({
  item,
  onEdit,
  onDelete,
  onToggleCode,
}: {
  item: VaultItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleCode: (code: string) => void;
}) {
  const age = monthsSince(item.lastChangedAt);
  const href = item.url ? (item.url.includes("://") ? item.url : `https://${item.url}`) : undefined;

  return (
    <div className="border-border bg-surface rounded-xl border p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display truncate text-xl font-semibold tracking-tight">
            {item.label}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge>{CATEGORY_LABELS[item.category]}</Badge>
            {(item.passkeys?.length ?? 0) > 0 && (
              <Badge variant="info">
                {item.passkeys?.length} passkey{item.passkeys?.length === 1 ? "" : "s"}
              </Badge>
            )}
            {item.totpSecret && <Badge variant="info">2FA</Badge>}
            {age !== null && (
              <Badge variant={age >= STALE_MONTHS ? "warning" : "default"}>
                {age === 0 ? "Changed this month" : `Changed ${age}m ago`}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <PlainValue label="Site" value={displayHost(item.url)} href={href} empty="No URL" />
        <PlainValue label="Username" value={item.username} mono />
        <SecretValue label="Password" value={item.password} />
        <SecretValue label="TOTP secret" value={item.totpSecret} empty="No 2FA on this account" />
      </div>

      {item.totpSecret && (
        <div className="mt-5">
          <TotpCode secret={item.totpSecret} />
        </div>
      )}

      {(item.passkeys?.length ?? 0) > 0 && (
        <div className="border-border mt-5 rounded-lg border p-4">
          <Passkeys passkeys={item.passkeys ?? []} />
        </div>
      )}

      {item.backupCodes.length > 0 && (
        <div className="border-border mt-5 rounded-lg border p-4">
          <BackupCodes
            codes={item.backupCodes}
            used={item.usedBackupCodes ?? []}
            onToggle={onToggleCode}
          />
        </div>
      )}

      {item.notes && (
        <div className="mt-5">
          <div className="text-muted-foreground text-xs">Notes</div>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{item.notes}</p>
        </div>
      )}
    </div>
  );
}

/**
 * The passkeys enrolled on this account, and whether any of them survives losing its device.
 *
 * Nothing here is secret, so none of it hides behind a reveal: a passkey's private key never
 * leaves its authenticator, which is exactly why this is a record rather than a copy.
 */
function Passkeys({ passkeys }: { passkeys: PasskeyRecord[] }) {
  const recoverable = passkeys.filter(isRecoverable).length;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">
          Passkeys
          <span className="text-muted-foreground ml-2 text-xs font-normal">
            {passkeys.length} enrolled
          </span>
        </span>
        {recoverable === 0 && <Badge variant="warning">Device bound</Badge>}
      </div>

      <ul className="mt-3 space-y-2">
        {passkeys.map((passkey) => (
          <li
            key={passkey.id}
            className="bg-muted/40 flex items-start justify-between gap-3 rounded-md px-3 py-2"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm">{passkey.authenticator}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {PASSKEY_KIND_LABELS[passkey.kind]}
                {passkey.username && ` · ${passkey.username}`}
                {passkey.addedAt && ` · added ${passkey.addedAt}`}
              </span>
              {passkey.notes && (
                <span className="text-muted-foreground mt-0.5 block text-xs">{passkey.notes}</span>
              )}
            </span>
            {!isRecoverable(passkey) && (
              <span className="text-warning shrink-0 text-xs" title="Lost with its device">
                Not recoverable
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground mt-2 text-xs">
        Recorded here, not stored: passkeys stay inside the device that created them, and this page
        cannot sign in with one.
      </p>
    </>
  );
}

/**
 * Backup codes, hidden behind one deliberate click because they are as good as the password.
 *
 * Each is single use at the issuer, so the vault tracks which have been spent. Without that the
 * list slowly becomes a guessing game, and the failure it is meant to prevent (no way in when
 * the phone is gone) is exactly when guessing is worst.
 */
function BackupCodes({
  codes,
  used,
  onToggle,
}: {
  codes: string[];
  used: string[];
  onToggle: (code: string) => void;
}) {
  const [shown, setShown] = React.useState(false);
  const remaining = codes.length - used.length;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">
          Backup codes
          <span
            className={cn(
              "ml-2 text-xs font-normal",
              remaining <= 2 ? "text-warning" : "text-muted-foreground",
            )}
          >
            {remaining} of {codes.length} left
          </span>
        </span>
        <Button size="sm" variant="ghost" onClick={() => setShown((s) => !s)}>
          {shown ? "Hide" : "Reveal"}
        </Button>
      </div>

      {shown && (
        <>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {codes.map((code, i) => {
              const spent = used.includes(code);
              return (
                <li key={`${code}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onToggle(code)}
                    title={spent ? "Mark as unused" : "Mark as used"}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-mono text-xs tracking-wide transition-colors",
                      spent ? "bg-muted/50 text-subtle line-through" : "bg-muted hover:bg-muted/70",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                        spent ? "border-subtle bg-subtle/20" : "border-input",
                      )}
                      aria-hidden
                    >
                      {spent && (
                        <svg
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-2.5 w-2.5"
                        >
                          <path d="m2 6 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{code}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">
            Click a code once you have spent it. Each one works only a single time.
          </p>
        </>
      )}
    </>
  );
}
