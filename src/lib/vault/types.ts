/**
 * The plaintext side of the vault. These shapes exist only in the browser, inside an unlocked
 * session: the wire shapes the server actually stores (all opaque ciphertext) live in
 * `@/lib/api/types`. See docs/VAULT.md.
 */

/** The decrypted payload of one entry. Everything here sits inside the ciphertext. */
export interface VaultSecret {
  label: string;
  url: string;
  username: string;
  password: string;
  /** Base32 TOTP seed, as printed under the QR code during 2FA setup. */
  totpSecret: string;
  /** One-time recovery codes issued when 2FA was enabled. */
  backupCodes: string[];
  /**
   * Codes already spent. Optional so entries written before check-off existed still decrypt:
   * the payload is JSON inside the ciphertext, so an absent field is simply an older entry.
   */
  usedBackupCodes?: string[];
  /** Passkeys enrolled on this account. Optional, so entries written before this field decrypt. */
  passkeys?: PasskeyRecord[];
  notes: string;
  category: VaultCategory;
  /** ISO date (yyyy-mm-dd) the password was last rotated. Owned by the user, not the server. */
  lastChangedAt: string;
}

/**
 * A passkey enrolled on an account.
 *
 * This is a record of one, not the passkey itself. A passkey's private key lives inside the
 * authenticator that made it (Touch ID, Windows Hello, a security key) and, for the device-bound
 * kinds, cannot be exported at all. Even where it can be, a web page is not able to use it: the
 * WebAuthn API is origin-bound, so this site can only exercise passkeys belonging to this site,
 * never one belonging to Namecheap. Signing in elsewhere with a stored passkey needs a browser
 * extension or an OS credential provider, which is out of scope (see docs/VAULT.md §5).
 *
 * What this is for is the problem passkeys actually create: knowing where each one lives, and
 * whether there is any way back in when that device is gone.
 */
export interface PasskeyRecord {
  /** Local row id so editing stays stable. Not the WebAuthn credential ID. */
  id: string;
  /** Where it lives, in your words: "iPhone 15", "YubiKey 5C", "Windows Hello on the ThinkPad". */
  authenticator: string;
  kind: PasskeyKind;
  /** The account identifier it is registered against, when that differs from the entry username. */
  username: string;
  /** ISO date (yyyy-mm-dd) it was enrolled. */
  addedAt: string;
  notes: string;
}

export const PASSKEY_KINDS = ["synced", "device-bound", "security-key"] as const;

export type PasskeyKind = (typeof PASSKEY_KINDS)[number];

export const PASSKEY_KIND_LABELS: Record<PasskeyKind, string> = {
  synced: "Synced to an account",
  "device-bound": "This device only",
  "security-key": "Hardware security key",
};

/**
 * Whether losing the authenticator loses the passkey. A synced passkey rides iCloud Keychain,
 * Google Password Manager or similar, so a replacement device restores it. The other two do not
 * leave the hardware, so the hardware is the single point of failure.
 */
export function isRecoverable(passkey: PasskeyRecord): boolean {
  return passkey.kind === "synced";
}

export function newPasskey(): PasskeyRecord {
  return {
    // Only needs to be unique within one entry, so this is enough and keeps the payload small.
    id: `pk_${Math.random().toString(36).slice(2, 10)}`,
    authenticator: "",
    kind: "synced",
    username: "",
    addedAt: todayIso(),
    notes: "",
  };
}

export const VAULT_CATEGORIES = [
  "hosting",
  "domains",
  "email",
  "banking",
  "social",
  "developer",
  "client",
  "other",
] as const;

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<VaultCategory, string> = {
  hosting: "Hosting",
  domains: "Domains",
  email: "Email",
  banking: "Banking",
  social: "Social",
  developer: "Developer",
  client: "Client",
  other: "Other",
};

/** An entry after decryption, carrying its record identity alongside the plaintext. */
export interface VaultItem extends VaultSecret {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function emptySecret(): VaultSecret {
  return {
    label: "",
    url: "",
    username: "",
    password: "",
    totpSecret: "",
    backupCodes: [],
    usedBackupCodes: [],
    passkeys: [],
    notes: "",
    category: "other",
    lastChangedAt: todayIso(),
  };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole months since a date, used to flag credentials that have gone stale. */
export function monthsSince(iso: string): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const now = new Date();
  const months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
  return months < 0 ? 0 : months;
}

/** Strip the scheme and any path so a long URL reads as a hostname in the list. */
export function displayHost(url: string): string {
  if (!url) return "";
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
