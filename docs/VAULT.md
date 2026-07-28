# Vault (credential store)

Living build doc. Update the progress log at the bottom whenever work lands.

The Vault is the primary administrator's own credential store inside the hub
(`hub.saharabasetech.com/admin/vault`): site logins, passwords, TOTP seeds and 2FA backup
codes, with a "last changed" date per entry. It is personal infrastructure, not a client
feature, and nothing about it is ever exposed to the client portal.

## 1. Threat model

The hub runs on a Hostinger VPS that SaharaBase **shares with another team** who hold root
(see the deployment reference). Anyone with root on that box can read the Postgres database
and every `.env` file on it. A conventional Laravel `encrypted` cast, as used for
`hosting_servers.secret`, puts the key in `APP_KEY` on that same box, so the box owner can
decrypt at will. That is acceptable for a read-only cPanel token. It is not acceptable for
the administrator's personal password set.

So the vault is built **zero knowledge**: the server stores ciphertext it cannot read.

In scope:

- Full database dump, by anyone (co-tenant with root, a backup leak, a Postgres compromise).
- Read access to the server filesystem, including `.env` and application code at rest.
- A stolen or hijacked admin session cookie (`bedrock_token`).

Out of scope, stated plainly so nobody assumes otherwise:

- **Active code injection into the served frontend.** An attacker who can modify the JS the
  browser runs (server compromise plus a deploy, or a successful XSS) can capture the
  passphrase as it is typed. No browser-side crypto design defeats this. It is the standard
  limit of every web vault, Bitwarden's included.
- **A compromised admin workstation** (keylogger, malicious extension).
- **Forgotten passphrase.** There is no recovery. No reset link, no admin override, no
  support path. This is the direct cost of the server not holding the key.

## 2. Cryptographic design

Envelope encryption, entirely in the browser, using WebCrypto only (no dependencies).

```
master passphrase (never transmitted, never stored)
   |
   |  PBKDF2-SHA256, 600,000 iterations, 16-byte random salt
   v
wrapping key (AES-GCM 256)
   |
   |  unwraps
   v
data key (AES-GCM 256, random at setup, never leaves the browser unwrapped)
   |
   |  encrypts each entry independently, fresh 12-byte IV per write
   v
entry ciphertext  ->  server stores base64(ciphertext) + base64(iv)
```

Decisions and why:

- **Envelope, not direct derivation.** Entries are encrypted with the data key, and only the
  data key is wrapped by the passphrase. Changing the passphrase rewraps one small blob
  instead of re-encrypting every entry, and it never requires the server to be trusted with
  a bulk re-encryption pass.
- **PBKDF2-SHA256 at 600k iterations**, the OWASP figure for this primitive. Argon2id is the
  better KDF but is not in WebCrypto and would mean shipping WASM. The parameters
  (`kdf`, `iterations`, `salt`) are stored per vault alongside the wrapped key, so moving to
  Argon2id later is a migration of one row plus a rewrap on next unlock, not a redesign.
- **No separate passphrase verifier.** AES-GCM is authenticated: a wrong passphrase produces
  a wrapping key whose unwrap fails the auth tag. Unwrapping the data key *is* the check.
  Storing a verifier blob would only hand an offline attacker a cheaper oracle.
- **The whole entry payload is encrypted, including the label and URL.** The server holds no
  plaintext metadata at all. Its columns are `id`, `user_id`, `ciphertext`, `iv` and
  timestamps. A database dump reveals how many credentials exist and when they were touched,
  and nothing else. Search and sort run client-side over the decrypted set, which is correct
  at this scale (tens to low hundreds of entries) and leaks nothing to the server.

The encrypted payload shape (`VaultSecret` in `src/lib/vault/types.ts`):

```jsonc
{
  "label": "Namecheap",
  "url": "https://ap.www.namecheap.com",
  "username": "richardsomdajnr@gmail.com",
  "password": "…",
  "totpSecret": "JBSWY3DPEHPK3PXP",   // base32, optional
  "backupCodes": ["…", "…"],           // optional
  "usedBackupCodes": ["…"],            // optional, ticked off as they are spent
  "passkeys": [                        // optional, a record of enrolment, not the passkey
    {
      "id": "pk_a1b2c3d4",
      "authenticator": "iPhone 15",
      "kind": "synced",                // synced | device-bound | security-key
      "username": "me@example.com",
      "addedAt": "2026-07-20",
      "notes": "iCloud Keychain"
    }
  ],
  "notes": "…",
  "category": "hosting",
  "lastChangedAt": "2026-07-28"        // user-owned, set on password change
}
```

Fields added after the first release are optional. The payload is JSON inside the ciphertext, so
an older entry simply decrypts without them, and no migration is needed or possible (the server
cannot read the entries to migrate them).

## 3. Data model (bedrock-api)

`vault_keys`, one row per user:

| column       | notes                                        |
| ------------ | -------------------------------------------- |
| `user_id`    | unique, cascade on delete                    |
| `kdf`        | `pbkdf2-sha256`                              |
| `iterations` | 600000                                       |
| `salt`       | base64, 16 bytes                             |
| `wrapped_key`| base64, the data key under the wrapping key  |
| `wrap_iv`    | base64, 12 bytes                             |

`vault_entries`:

| column       | notes                                        |
| ------------ | -------------------------------------------- |
| `user_id`    | owner, cascade on delete                     |
| `ciphertext` | base64 AES-GCM output                        |
| `iv`         | base64, 12 bytes, unique per write           |

Every query is scoped to `$request->user()`. Entries are never listed across users, and the
API has no endpoint that returns another user's rows.

## 4. Access gate

Two independent locks:

1. **Session.** `/admin/vault` sits under the existing `requireSession()` guard, so a valid
   admin login is required to reach the page at all.
2. **Passphrase.** The data key exists only in React state in memory. It is never written to
   `localStorage`, `sessionStorage`, a cookie, or the URL, so a page reload, a new tab or a
   browser restart all land on the locked screen.

Auto-lock, all of which simply drop the in-memory key:

- 5 minutes of no keyboard or pointer activity on the page (configurable in the UI).
- Manual "Lock" button.
- Navigating away or closing the tab, which is inherent to holding the key in memory.

Copied secrets are cleared from the clipboard after 30 seconds, best effort: the browser may
refuse the write if the tab has lost focus, which is a browser policy we cannot override.

## 5. Phases

- **Phase 1 (done).** Migrations, models, `VaultController` and routes. Browser crypto
  module. Setup, unlock and auto-lock. Entry list with client-side search, create, edit,
  delete. Password reveal and copy. TOTP seed and backup codes stored, revealed and copied.
  Passphrase change (rewrap).
- **Phase 2 (done).** Live rotating TOTP codes generated in-browser (HMAC-SHA1 over the base32
  seed), verified against the RFC 6238 test vectors, so the vault replaces the authenticator app
  for these accounts. Seeds accept a bare base32 string or a whole `otpauth://` URI. Backup code
  check-off as they get consumed.
- **Phase 3 (done).** Password generator, strength and reuse audit, staleness flags driven by
  `lastChangedAt`, encrypted export and import for offline backup.
- **Later.** Browser extension or autofill is explicitly not planned: it would need the data key
  available outside a deliberate unlock, which is the property the whole design rests on.

### On passkeys

Entries can record the passkeys enrolled on an account: where each one lives, whether it is
synced or bound to that one device, which account identifier it is registered against, and when
it was added.

**These are records, not passkeys.** A passkey's private key is generated inside its
authenticator and, for the device-bound kinds, cannot be extracted at all. Even where a provider
can export one, this page could not use it: the WebAuthn API is origin-bound, so
`hub.saharabasetech.com` may only exercise passkeys belonging to `hub.saharabasetech.com`, never
one belonging to Namecheap. Signing in elsewhere with a stored passkey requires a browser
extension or an OS credential provider, which is out of scope for the same reason autofill is
(§5): both need the data key available outside a deliberate unlock.

So the value here is not authentication, it is the failure mode passkeys quietly introduce. A
device-bound passkey on an account that has dropped its password is one lost laptop away from a
permanent lockout, and nothing about the account looks wrong until that day. The `passkey-risk`
audit rule watches exactly that: passkeys enrolled, none of them synced, and no unused backup
codes left. A synced passkey clears the flag, because a replacement device restores it, and so do
unused backup codes, because they are a way back in.

### On TOTP seeds living beside the password

Storing both factors in one vault means one unlocked vault yields both, so this is convenience
rather than two independent factors in the sense 2FA intends. It is worth being honest about
that rather than implying otherwise. It is still a clear gain over a seed in a text file, and the
backup codes are the part that actually matters: they are what gets you back in when the phone
is gone, and they are the thing most likely to be lost otherwise.

## 5a. Backup files

Export produces a single AES-GCM blob under a passphrase chosen at export time, separate from
the master passphrase so a backup keeps working after the master one changes. Only the entry
count, timestamp and KDF parameters are readable in the file. Import adds entries and never
overwrites, so restoring a file twice produces duplicates rather than silently merging.

Given there is no recovery path, an export kept offline is the only real safety net against a
lost database, and it is worth taking one after any significant change.

## 6. Where the code lives

Frontend (`bedrock`):

- `src/lib/vault/crypto.ts` — all WebCrypto. Nothing else in the app touches key material.
- `src/lib/vault/types.ts` — the plaintext shapes, browser only.
- `src/lib/vault/actions.ts` — server actions, a ciphertext pipe and nothing more.
- `src/lib/vault/use-auto-lock.ts` — idle relock and the clipboard auto-wipe.
- `src/lib/vault/totp.ts` — base32, RFC 6238 code generation, `otpauth://` parsing.
- `src/lib/vault/generator.ts` — password generation (rejection sampling) and entropy rating.
- `src/lib/vault/audit.ts` — the health checks: reuse, weak, stale, depleted backup codes.
- `src/lib/vault/export.ts` — the encrypted backup file format.
- `src/components/vault/` — gate (setup and unlock), list and detail view, entry form, settings,
  TOTP display, generator, health panel, backup panel.
- `src/app/(admin)/admin/vault/page.tsx` — the route.
- `scripts/vault-check.mjs` and `scripts/totp-check.mjs`, run by `npm run check:vault`.

`check:vault` compiles the real vault modules with the project's TypeScript and exercises them
under Node: envelope round-trips, rewrap, cross-key rejection, backup round-trips and refusals,
generator guarantees, audit rules, and the RFC 6238 vectors. It needs no test framework, and it
exists because this is the code where a silent regression costs data rather than a red build.

Backend (`bedrock-api`):

- `app/Http/Controllers/Admin/VaultController.php`, `app/Models/VaultKey.php`,
  `app/Models/VaultEntry.php`, `database/migrations/2026_07_28_000100_create_vault_tables.php`.
- `tests/Feature/VaultTest.php` covers the two things the server actually owns: cross-user
  isolation, and never silently replacing the key.

The wire DTOs sit in `src/lib/api/types.ts` with the rest of the API contract, separate from
the plaintext types, so the boundary between "what the server sees" and "what the browser sees"
is visible in the imports.

## 7. Progress log

- **2026-07-28.** Phase 1 built. Zero-knowledge design chosen over a server-side key
  specifically because of the shared-VPS root exposure described in section 1.
- **2026-07-28.** Fixed during build: the setup guard read `$user->vaultKey`, whose relation
  caches on the model instance, so a stale answer could let a second setup through into a raw
  unique-constraint 500. Guards now query fresh, and the constraint violation is caught and
  returned as the same 409, which also closes the concurrent-setup race properly.
- **2026-07-28.** Phases 2 and 3 built. `check:vault` added and it immediately earned its keep:
  the backup-code warning fired on any set of two or fewer codes, including an untouched one, so
  a fresh two-code set from an issuer looked like an emergency. Changed to flag depletion (none
  left, or at least one used and two or fewer remaining) rather than scarcity, because a warning
  that is always on is a warning nobody reads.
- **2026-07-28.** Phases 1 to 3 deployed to production.
- **2026-07-28.** Passkey records added to entries, plus the `passkey-risk` audit rule. Kept
  deliberately as an inventory: see "On passkeys" above for why a web page cannot be a passkey
  provider for other sites. The next thing worth building here is passkey *unlock* for the vault
  itself, via the WebAuthn PRF extension, which is same-origin and so genuinely possible: the PRF
  output becomes a second wrapping of the existing data key, sitting alongside the passphrase one,
  giving Touch ID or Windows Hello as an unlock path with no loss of zero knowledge.
