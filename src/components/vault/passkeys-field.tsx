"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  newPasskey,
  PASSKEY_KIND_LABELS,
  PASSKEY_KINDS,
  type PasskeyKind,
  type PasskeyRecord,
} from "@/lib/vault/types";

/**
 * Editor for the passkeys enrolled on an account.
 *
 * Records where each one lives, not the passkey itself: the private key never leaves its
 * authenticator, and a web page cannot use another site's passkey anyway. The field that earns
 * its place is `kind`, because a device-bound passkey with no backup codes is a lockout waiting
 * for a dropped phone, and that is what the health audit watches for.
 */
export function PasskeysField({
  value,
  onChange,
}: {
  value: PasskeyRecord[];
  onChange: (next: PasskeyRecord[]) => void;
}) {
  const update = (id: string, patch: Partial<PasskeyRecord>) =>
    onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="border-border rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Passkeys</div>
          <p className="text-muted-foreground mt-1 text-xs">
            Which devices can sign in to this account without a password. The vault records where
            each passkey lives, it does not hold the passkey: those stay locked inside the device
            that made them.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => onChange([...value, newPasskey()])}
        >
          Add
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-subtle mt-3 text-xs italic">None recorded.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {value.map((passkey) => (
            <li key={passkey.id} className="border-border bg-muted/30 rounded-md border p-3">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <label className="block">
                  <span className="sr-only">Authenticator</span>
                  <Input
                    value={passkey.authenticator}
                    onChange={(e) => update(passkey.id, { authenticator: e.target.value })}
                    placeholder="iPhone 15, YubiKey 5C, Windows Hello"
                    aria-label="Where the passkey lives"
                  />
                </label>

                <label className="block">
                  <span className="sr-only">Kind</span>
                  <Select
                    value={passkey.kind}
                    onChange={(e) => update(passkey.id, { kind: e.target.value as PasskeyKind })}
                    aria-label="Passkey kind"
                  >
                    {PASSKEY_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {PASSKEY_KIND_LABELS[k]}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="block">
                  <span className="sr-only">Account it is registered to</span>
                  <Input
                    value={passkey.username}
                    onChange={(e) => update(passkey.id, { username: e.target.value })}
                    placeholder="Account, if not the one above"
                    aria-label="Account the passkey is registered to"
                  />
                </label>

                <label className="block">
                  <span className="sr-only">Date enrolled</span>
                  <Input
                    type="date"
                    value={passkey.addedAt}
                    onChange={(e) => update(passkey.id, { addedAt: e.target.value })}
                    aria-label="Date enrolled"
                  />
                </label>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <Input
                  value={passkey.notes}
                  onChange={(e) => update(passkey.id, { notes: e.target.value })}
                  placeholder="Notes"
                  aria-label="Passkey notes"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-danger shrink-0"
                  onClick={() => onChange(value.filter((p) => p.id !== passkey.id))}
                >
                  Remove
                </Button>
              </div>

              {passkey.kind !== "synced" && (
                <p className="text-warning mt-2 text-xs">
                  This one cannot be recovered if the device is lost. Keep backup codes for this
                  account.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
