/**
 * Browser-side vault cryptography. WebCrypto only, no dependencies.
 *
 * Envelope encryption: the master passphrase derives a wrapping key, the wrapping key opens a
 * random data key, and the data key encrypts each entry. The passphrase and the unwrapped data
 * key exist only in this module's callers, in memory, for the length of an unlocked session.
 * Neither is ever sent to the server, written to storage, or put in a URL.
 *
 * Read docs/VAULT.md before changing anything here. In particular: there is no recovery path,
 * so a change that alters how the wrapping key is derived without a migration locks the
 * administrator out of their own data permanently.
 */

import type { VaultKeyInput, VaultKeyRecord } from "@/lib/api/types";
import type { VaultSecret } from "./types";

/** OWASP's figure for PBKDF2-SHA256. Stored per vault, so it can be raised later. */
export const PBKDF2_ITERATIONS = 600_000;

const SALT_BYTES = 16;
const IV_BYTES = 12;

/** Thrown when an AES-GCM auth tag fails, which in practice means a wrong passphrase. */
export class VaultUnlockError extends Error {
  constructor(message = "That passphrase did not open the vault.") {
    super(message);
    this.name = "VaultUnlockError";
  }
}

function subtle(): SubtleCrypto {
  // Guards the browser-only assumption with a message that names the real cause: WebCrypto is
  // exposed on secure origins only, so plain http on a LAN address silently has no crypto.
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error(
      "The vault needs WebCrypto, which browsers expose only over https or on localhost.",
    );
  }
  return window.crypto.subtle;
}

/* ------------------------------------------------------------------ encoding */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  // Chunked so a large payload cannot blow the argument limit on String.fromCharCode.
  for (let i = 0; i < view.length; i += 0x8000) {
    binary += String.fromCharCode(...view.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomBytes(length: number): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(length));
}

/* ------------------------------------------------------------------- key work */

/** Derive the wrapping key from the passphrase. Never exportable: it must not be serialisable. */
async function deriveWrappingKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await subtle().importKey("raw", encoder.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);

  return subtle().deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Create a brand new vault: generate a random data key and wrap it under the passphrase.
 * Returns the key record to persist plus the live data key for the now-unlocked session.
 */
export async function createVaultKey(
  passphrase: string,
): Promise<{ input: VaultKeyInput; dataKey: CryptoKey }> {
  const salt = randomBytes(SALT_BYTES);
  const wrapIv = randomBytes(IV_BYTES);

  const wrappingKey = await deriveWrappingKey(passphrase, salt, PBKDF2_ITERATIONS);

  // Raw bytes first, so the data key itself can be re-imported as non-extractable below. The
  // extractable copy is needed only to produce the wrapped blob and is not kept.
  const rawDataKey = randomBytes(32);
  const wrapped = await subtle().encrypt(
    { name: "AES-GCM", iv: wrapIv as BufferSource },
    wrappingKey,
    rawDataKey as BufferSource,
  );

  const dataKey = await importDataKey(rawDataKey);
  rawDataKey.fill(0);

  return {
    input: {
      kdf: "pbkdf2-sha256",
      iterations: PBKDF2_ITERATIONS,
      salt: toBase64(salt),
      wrappedKey: toBase64(wrapped),
      wrapIv: toBase64(wrapIv),
    },
    dataKey,
  };
}

/**
 * Open the vault. A wrong passphrase fails the AES-GCM auth tag, which is the whole
 * verification story: no separate verifier blob exists, on purpose.
 */
export async function unlockVault(passphrase: string, record: VaultKeyRecord): Promise<CryptoKey> {
  const wrappingKey = await deriveWrappingKey(
    passphrase,
    fromBase64(record.salt),
    record.iterations,
  );

  let raw: ArrayBuffer;
  try {
    raw = await subtle().decrypt(
      { name: "AES-GCM", iv: fromBase64(record.wrapIv) as BufferSource },
      wrappingKey,
      fromBase64(record.wrappedKey) as BufferSource,
    );
  } catch {
    throw new VaultUnlockError();
  }

  const bytes = new Uint8Array(raw);
  const dataKey = await importDataKey(bytes);
  bytes.fill(0);
  return dataKey;
}

/**
 * Rewrap the existing data key under a new passphrase. Entries are untouched, which is the
 * point of the envelope: a passphrase change is one small write, not a bulk re-encryption.
 * Requires an unlocked vault, so holding the data key is itself the proof of the old passphrase.
 */
export async function rewrapVaultKey(
  dataKey: CryptoKey,
  newPassphrase: string,
): Promise<VaultKeyInput> {
  const salt = randomBytes(SALT_BYTES);
  const wrapIv = randomBytes(IV_BYTES);
  const wrappingKey = await deriveWrappingKey(newPassphrase, salt, PBKDF2_ITERATIONS);

  // Only re-exportable data keys can be rewrapped, hence `importDataKey` marks them extractable.
  const raw = await subtle().exportKey("raw", dataKey);
  const wrapped = await subtle().encrypt(
    { name: "AES-GCM", iv: wrapIv as BufferSource },
    wrappingKey,
    raw,
  );
  new Uint8Array(raw).fill(0);

  return {
    kdf: "pbkdf2-sha256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    wrappedKey: toBase64(wrapped),
    wrapIv: toBase64(wrapIv),
  };
}

/**
 * Extractable because a passphrase change has to re-export and rewrap it. That is a real
 * trade-off: extractable means script running on the page could read the key while unlocked.
 * It buys nothing to make it non-extractable, though, since that same script could simply read
 * the decrypted entries instead. Active script injection is out of scope (docs/VAULT.md §1).
 */
function importDataKey(raw: Uint8Array): Promise<CryptoKey> {
  return subtle().importKey("raw", raw as BufferSource, { name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/* --------------------------------------------------------------- entry crypto */

/** Encrypt one entry under a fresh IV. Reusing an IV with AES-GCM is catastrophic, so never. */
export async function encryptSecret(
  dataKey: CryptoKey,
  secret: VaultSecret,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = randomBytes(IV_BYTES);
  const encrypted = await subtle().encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    dataKey,
    encoder.encode(JSON.stringify(secret)) as BufferSource,
  );

  return { ciphertext: toBase64(encrypted), iv: toBase64(iv) };
}

export async function decryptSecret(
  dataKey: CryptoKey,
  ciphertext: string,
  iv: string,
): Promise<VaultSecret> {
  const plain = await subtle().decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) as BufferSource },
    dataKey,
    fromBase64(ciphertext) as BufferSource,
  );

  return JSON.parse(decoder.decode(plain)) as VaultSecret;
}

/* ------------------------------------------------------------------ passphrase */

export interface PassphraseCheck {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string | null;
}

/**
 * Rough strength feedback for the master passphrase only. Length dominates because this is the
 * one secret standing between an offline attacker and everything, and it has to be memorable
 * (it cannot be stored in the vault it protects). Four random words beat a short mangled word.
 */
export function checkPassphrase(value: string): PassphraseCheck {
  const length = value.length;
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(value)).length;

  if (length === 0) return { score: 0, label: "", hint: null };
  if (length < 12) {
    return { score: 1, label: "Too short", hint: "Use at least 12 characters." };
  }

  let score = 2;
  if (length >= 16 || words >= 3) score = 3;
  if ((length >= 20 && classes >= 2) || words >= 4) score = 4;

  const labels = ["", "Too short", "Workable", "Strong", "Very strong"] as const;
  const hint = score < 4 ? "Longer is what matters. Four unrelated words is a good target." : null;

  return { score: score as PassphraseCheck["score"], label: labels[score], hint };
}
