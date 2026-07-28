"use client";

/**
 * Encrypted export and import.
 *
 * The vault has no recovery path by design, so an offline backup is the only thing standing
 * between a lost database and a lost password set. That backup must not be a plaintext file
 * sitting in Downloads, so it is encrypted under its own passphrase, chosen at export time and
 * independent of the master passphrase. A backup that outlives a passphrase change is worth
 * more than one tied to it.
 *
 * The file is a single AES-GCM blob: no envelope, because unlike the vault itself there is
 * nothing to rewrap later. See docs/VAULT.md.
 */

import { fromBase64, PBKDF2_ITERATIONS, toBase64 } from "./crypto";
import type { VaultSecret } from "./types";

export const EXPORT_FORMAT = "bedrock-vault-export";
const EXPORT_VERSION = 1;

export interface VaultExportFile {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  count: number;
  kdf: "pbkdf2-sha256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function subtle(): SubtleCrypto {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("The vault needs WebCrypto, which browsers expose only over https.");
  }
  return window.crypto.subtle;
}

async function deriveFileKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await subtle().importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return subtle().deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt the decrypted set into a portable file under its own passphrase. */
export async function buildExport(
  secrets: VaultSecret[],
  passphrase: string,
): Promise<VaultExportFile> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveFileKey(passphrase, salt, PBKDF2_ITERATIONS);

  const ciphertext = await subtle().encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    new TextEncoder().encode(JSON.stringify(secrets)) as BufferSource,
  );

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    // Deliberately the only readable field beyond the crypto parameters: enough to tell two
    // backups apart without the file itself revealing what is in the vault.
    count: secrets.length,
    kdf: "pbkdf2-sha256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  };
}

export class VaultImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultImportError";
  }
}

/** Decrypt a previously exported file. A wrong passphrase fails the AES-GCM auth tag. */
export async function readExport(raw: string, passphrase: string): Promise<VaultSecret[]> {
  let file: VaultExportFile;
  try {
    file = JSON.parse(raw) as VaultExportFile;
  } catch {
    throw new VaultImportError("That file is not valid JSON.");
  }

  if (file.format !== EXPORT_FORMAT) {
    throw new VaultImportError("That is not a vault export file.");
  }
  if (file.version > EXPORT_VERSION) {
    throw new VaultImportError("That file came from a newer version of the vault.");
  }

  const key = await deriveFileKey(passphrase, fromBase64(file.salt), file.iterations);

  let plain: ArrayBuffer;
  try {
    plain = await subtle().decrypt(
      { name: "AES-GCM", iv: fromBase64(file.iv) as BufferSource },
      key,
      fromBase64(file.ciphertext) as BufferSource,
    );
  } catch {
    throw new VaultImportError("That passphrase did not open the file.");
  }

  const parsed = JSON.parse(new TextDecoder().decode(plain)) as unknown;
  if (!Array.isArray(parsed)) {
    throw new VaultImportError("That file does not contain a list of entries.");
  }

  return parsed as VaultSecret[];
}

/** Hand the file to the browser's downloader. Never touches the network. */
export function downloadExport(file: VaultExportFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `vault-backup-${file.exportedAt.slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
}
