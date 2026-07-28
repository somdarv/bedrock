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
  notes: string;
  category: VaultCategory;
  /** ISO date (yyyy-mm-dd) the password was last rotated. Owned by the user, not the server. */
  lastChangedAt: string;
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
