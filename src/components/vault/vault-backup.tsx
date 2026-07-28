"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { buildExport, downloadExport, readExport, VaultImportError } from "@/lib/vault/export";
import { checkPassphrase } from "@/lib/vault/crypto";
import type { VaultItem, VaultSecret } from "@/lib/vault/types";

/**
 * Offline backup. The vault cannot be recovered from the server, so an encrypted file the
 * administrator keeps themselves is the only real safety net. Its passphrase is separate from
 * the master one so the backup survives a passphrase change.
 */
export function VaultBackup({
  items,
  onImport,
}: {
  items: VaultItem[];
  onImport: (secrets: VaultSecret[]) => Promise<{ added: number; failed: number }>;
}) {
  const { toast } = useToast();

  const [exportPass, setExportPass] = React.useState("");
  const [exportConfirm, setExportConfirm] = React.useState("");
  const [exporting, setExporting] = React.useState(false);

  const [file, setFile] = React.useState<File | null>(null);
  const [importPass, setImportPass] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const strength = checkPassphrase(exportPass);
  const canExport =
    items.length > 0 && strength.score >= 2 && exportPass === exportConfirm && !exporting;

  async function runExport() {
    if (!canExport) return;
    setExporting(true);
    try {
      // Strip the record identity: a backup restores credentials, not database rows.
      const secrets = items.map(({ id, createdAt, updatedAt, ...secret }) => {
        void id;
        void createdAt;
        void updatedAt;
        return secret;
      });
      downloadExport(await buildExport(secrets, exportPass));
      setExportPass("");
      setExportConfirm("");
      toast("Backup downloaded. Keep it somewhere offline.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not build the backup.", "danger");
    }
    setExporting(false);
  }

  async function runImport() {
    if (!file || !importPass || importing) return;

    setImporting(true);
    setImportError(null);
    try {
      const secrets = await readExport(await file.text(), importPass);
      const { added, failed } = await onImport(secrets);

      setFile(null);
      setImportPass("");
      if (fileInput.current) fileInput.current.value = "";

      toast(
        failed > 0
          ? `Restored ${added} of ${added + failed} entries. ${failed} failed to save.`
          : `Restored ${added} ${added === 1 ? "entry" : "entries"}.`,
        failed > 0 ? "danger" : "success",
      );
    } catch (e) {
      setImportError(
        e instanceof VaultImportError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not read that file.",
      );
    }
    setImporting(false);
  }

  return (
    <>
      <section className="border-border border-t pt-6">
        <h3 className="text-sm font-medium">Encrypted backup</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Downloads all {items.length} {items.length === 1 ? "entry" : "entries"} as one encrypted
          file. Choose a passphrase for the file itself, separate from your master one so the backup
          still opens after you change that. The file never leaves your machine.
        </p>

        <div className="mt-3 space-y-3">
          <Field label="Backup passphrase" htmlFor="vb-pass" hint={strength.hint ?? undefined}>
            <Input
              id="vb-pass"
              type="password"
              autoComplete="new-password"
              value={exportPass}
              onChange={(e) => setExportPass(e.target.value)}
            />
          </Field>
          <Field
            label="Confirm"
            htmlFor="vb-confirm"
            error={
              exportConfirm.length > 0 && exportConfirm !== exportPass
                ? "These do not match."
                : undefined
            }
          >
            <Input
              id="vb-confirm"
              type="password"
              autoComplete="new-password"
              value={exportConfirm}
              onChange={(e) => setExportConfirm(e.target.value)}
            />
          </Field>

          <Button type="button" variant="outline" disabled={!canExport} onClick={runExport}>
            {exporting ? (
              <>
                <Spinner /> Encrypting
              </>
            ) : (
              "Download backup"
            )}
          </Button>
        </div>
      </section>

      <section className="border-border border-t pt-6">
        <h3 className="text-sm font-medium">Restore from backup</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Adds the entries from a backup file to this vault. Existing entries are left alone, so
          restoring a file you already restored will produce duplicates.
        </p>

        <div className="mt-3 space-y-3">
          <Field label="Backup file" htmlFor="vb-file">
            <input
              id="vb-file"
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setImportError(null);
              }}
              className="text-muted-foreground file:border-input file:bg-surface file:text-foreground hover:file:bg-muted block w-full text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:text-sm"
            />
          </Field>

          <Field label="Its passphrase" htmlFor="vb-import-pass" error={importError ?? undefined}>
            <Input
              id="vb-import-pass"
              type="password"
              autoComplete="off"
              value={importPass}
              onChange={(e) => setImportPass(e.target.value)}
            />
          </Field>

          <Button
            type="button"
            variant="outline"
            disabled={!file || !importPass || importing}
            onClick={runImport}
          >
            {importing ? (
              <>
                <Spinner /> Restoring
              </>
            ) : (
              "Restore entries"
            )}
          </Button>
        </div>
      </section>
    </>
  );
}
