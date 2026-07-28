"use client";

/**
 * Vault health. Runs entirely over the decrypted set in memory, which is the only place it can
 * run: the server holds no plaintext to analyse. See docs/VAULT.md.
 */

import { ratePassword } from "./generator";
import { isRecoverable, monthsSince, type VaultItem } from "./types";

/** A password unchanged this long gets flagged. Twelve months is a calm, defensible default. */
export const STALE_MONTHS = 12;

export type IssueKind = "reused" | "weak" | "stale" | "codes-low" | "passkey-risk";

export interface VaultIssue {
  kind: IssueKind;
  item: VaultItem;
  detail: string;
}

export interface VaultHealth {
  issues: VaultIssue[];
  counts: Record<IssueKind, number>;
  /** Entries with no problems found. */
  healthy: number;
}

const EMPTY_COUNTS: Record<IssueKind, number> = {
  reused: 0,
  weak: 0,
  stale: 0,
  "codes-low": 0,
  "passkey-risk": 0,
};

export function auditVault(items: VaultItem[]): VaultHealth {
  const issues: VaultIssue[] = [];

  // Reuse is the highest-value finding: one breached site then opens every account sharing
  // that password, which is exactly the failure a vault exists to end.
  const byPassword = new Map<string, VaultItem[]>();
  for (const item of items) {
    if (!item.password) continue;
    const group = byPassword.get(item.password);
    if (group) group.push(item);
    else byPassword.set(item.password, [item]);
  }

  for (const group of byPassword.values()) {
    if (group.length < 2) continue;
    for (const item of group) {
      const others = group.filter((o) => o.id !== item.id).map((o) => o.label);
      issues.push({
        kind: "reused",
        item,
        detail: `Same password as ${others.join(", ")}.`,
      });
    }
  }

  for (const item of items) {
    if (item.password) {
      const { verdict, bits } = ratePassword(item.password);
      if (verdict === "weak") {
        issues.push({ kind: "weak", item, detail: `Around ${bits} bits of entropy.` });
      }
    }

    const age = monthsSince(item.lastChangedAt);
    if (age !== null && age >= STALE_MONTHS) {
      issues.push({ kind: "stale", item, detail: `Last changed ${age} months ago.` });
    }

    // Running out of unused recovery codes is a slow-motion lockout, so it is worth warning
    // about while there is still time to regenerate them.
    //
    // Depletion, not scarcity: an untouched set is fine however small it is, because that is
    // simply how many the issuer handed out. Flagging those would be a standing false positive,
    // and a warning that is always on is a warning nobody reads.
    if (item.backupCodes.length > 0) {
      const used = item.usedBackupCodes?.length ?? 0;
      const left = item.backupCodes.length - used;

      if (left <= 0) {
        issues.push({
          kind: "codes-low",
          item,
          detail: "Every backup code is used. Generate a new set.",
        });
      } else if (used > 0 && left <= 2) {
        issues.push({
          kind: "codes-low",
          item,
          detail: `Only ${left} backup code${left === 1 ? "" : "s"} left.`,
        });
      }
    }

    // The lockout passkeys quietly introduce: a device-bound passkey does not leave the hardware,
    // so if the hardware goes and nothing else gets you in, the account is gone. A synced passkey
    // is fine (a replacement device restores it), and so are unused backup codes.
    const passkeys = item.passkeys ?? [];
    if (passkeys.length > 0 && !passkeys.some(isRecoverable)) {
      const codesLeft = item.backupCodes.length - (item.usedBackupCodes?.length ?? 0);
      if (codesLeft <= 0) {
        const where = passkeys.map((p) => p.authenticator).join(", ");
        issues.push({
          kind: "passkey-risk",
          item,
          detail: item.password
            ? `Passkeys are tied to ${where} with no backup codes left. If the account stops accepting the password, losing that device locks you out.`
            : `Passkeys are tied to ${where}, with no password and no backup codes. Losing that device locks you out for good.`,
        });
      }
    }
  }

  const counts = { ...EMPTY_COUNTS };
  for (const issue of issues) counts[issue.kind] += 1;

  const flagged = new Set(issues.map((i) => i.item.id));

  return { issues, counts, healthy: items.length - flagged.size };
}

export const ISSUE_LABELS: Record<IssueKind, string> = {
  reused: "Reused",
  weak: "Weak",
  stale: "Stale",
  "codes-low": "Backup codes low",
  "passkey-risk": "Lockout risk",
};
