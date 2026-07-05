# Bedrock — Session Handoff

> Living context for continuing work across sessions. Last updated: 2026-07-05.
> Read this first, then [ARCHITECTURE.md](./ARCHITECTURE.md), [DOCUMENT-CODES.md](./DOCUMENT-CODES.md), [ROADMAP.md](./ROADMAP.md).

---

## 1. What Bedrock is

Client management + **gated-delivery** payment system for **SaharaBase Technologies** (Accra, Ghana).
Nothing of value reaches a client until the money rule for that stage is met. Every job is a
**Work Package**. Two gates: **start** (deposit → work begins) and **download** (balance = 0 →
originals unlock). Also hosts a **document engine** (invoices/proposals/fee schedules with QR
verification) served from the tools portal **hub.saharabasetech.com**.

## 2. Repos & machine

| Path | What |
|------|------|
| `c:\Users\iamjn\Desktop\WEBZ\bedrock\bedrock` | **Frontend** — Next.js 15 (App Router, TS, Tailwind v4) |
| `c:\Users\iamjn\Desktop\WEBZ\bedrock-api` | **Backend** — Laravel 13, PostgreSQL |
| `c:\Users\iamjn\Desktop\WEBZ\SAHARA\base` | Marketing site — the **design source** (monochrome ink/paper, Sora + General Sans). Not the focus. |
| `bedrock\bedrock\_extracted` | Reference: original document prototypes (invoice/proposal/dropyn/verify). Not imported. |

Toolchain: **PHP 8.4**, **Composer 2.9**, **PostgreSQL 18** on `:5432` (db `bedrock`, user `postgres`).
All credentials live in `bedrock-api\.env` (git-ignored) — never commit them.

## 3. How to run

```bash
# Backend (from bedrock-api)
php artisan serve --port=8001

# Frontend (from bedrock\bedrock)
npm run dev           # → http://localhost:3000 (falls back to 3001/3002 if busy)
```

- **Admin login:** `admin@saharabase.test` / `password` (dev seed).
- Frontend env in `bedrock\bedrock\.env.local`; backend env in `bedrock-api\.env`.

Key frontend env (`.env.local`):
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_API_LIVE=auth,clients,packages     # per-domain live switch
NEXT_PUBLIC_DOCS_SOURCE=live                    # documents live
NEXT_PUBLIC_VERIFY_BASE_URL=https://hub.saharabasetech.com   # QR target
NEXT_PUBLIC_APP_URL=                            # set to prod domain for public /p links
```

Backend env highlights (`.env`): `DB_CONNECTION=pgsql` (db `bedrock`), `DELIVERABLES_DISK=r2`,
`R2_*` set (bucket `bedrock-deliverables`).

## 4. What's LIVE (real backend + Postgres) vs pending

**Live & verified end-to-end:**
- **Auth** — Sanctum tokens (login/me/logout). Frontend keeps the token in an httpOnly cookie
  (`bedrock_token`); `http.ts` reads it server-side and forwards it as `Authorization: Bearer`.
- **Clients** — organisation **or** individual, with a **contacts** table (primary + extra
  contacts). CRUD live.
- **Work Packages** — CRUD, line items, dual pricing (itemized/fixed, fixed total preserved
  across switches), payments, the **two gates**, status lifecycle (guarded transitions → 409),
  activity log, deliverables.
- **Documents + verification** — registry served from the API; `/verify/{ref}` + `/verify` lookup.
- **R2 storage** — deliverable originals stored in Cloudflare R2; downloads are **gated**
  (locked until balance 0) and served via **signed, time-limited R2 URLs**. "Free up storage"
  action deletes originals (keeps previews), marks `archived`, download → 410.

**Still mock / not built (the next work):**
- **Paystack** — the Pay button is a placeholder. Payments are entered **manually** by admin
  (`recordPayment`), which runs the gate logic. Real flow (init access_code → inline JS →
  webhook HMAC verify → record → gates) is NOT built. ← **most likely next**
- **Termii** — "Send invoice" only flips status draft→sent + logs; it does **not** actually send
  WhatsApp/SMS/email.
- **Media pipeline** — deliverable previews are placeholder SVG data-URIs, not real watermarked
  previews (Intervention Image / Ghostscript / FFmpeg per ARCHITECTURE §6).
- **Public portal** — `/p/[slug]` view exists (scope, price, previews, gated download). OTP
  lookup and Paystack pay button are not wired.
- **Admin file download** — only the **public portal** download is wired (browser can't carry the
  bearer token to the API cross-origin). Admin verifies via the portal link.

## 5. Architecture notes that matter

- **Per-domain API switch** — `lib/api/index.ts` composes the api from `httpApi` (live) and
  `mockApi` per domain, driven by `NEXT_PUBLIC_API_LIVE`. Interrelated domains (clients↔packages)
  must flip together. `documents` uses a **separate** switch (`NEXT_PUBLIC_DOCS_SOURCE`).
- **JSON shapes** — clients/packages endpoints return **bare** arrays/objects (models expose
  `toApi()`), because the frontend `http.ts` doesn't unwrap. **Documents** endpoints return the
  Laravel `{data: ...}` envelope (the documents `api.ts` unwraps it). Two conventions, each
  matching its consumer — keep them.
- **IDs** — clients/packages/etc. use **ULIDs** (string). Documents use the human Document ID.
- **Money is derived** — `WorkPackage::effectiveTotal()` / `balance()` on the backend mirror the
  frontend accessors in `lib/api/types.ts`. Never store balance.
- **Document codes** — full spec in [DOCUMENT-CODES.md](./DOCUMENT-CODES.md). Generated by
  `DocumentReferenceService`.

## 6. Key files

**Frontend** (`bedrock\bedrock\src`)
- `lib/api/{index,contract,http,mock,types}.ts` — the BedrockApi contract + live/mock.
- `lib/documents/{registry,api,prepare}.ts` — documents data layer.
- `lib/{clients,packages}/actions.ts` — server actions.
- `components/admin/*` — `admin-sidebar`, `package-detail`, `deliverables-section`,
  `client-form-modal`, `clients-view`.
- `components/documents/*` — `document-frame`, `document-footer`, `verify-stamp`,
  `dropyn-fee-schedule`, `bodies`.
- `app/(admin)/admin/*`, `app/(public)/p/[slug]`, `app/(documents)/{d/[id],verify/[ref],verify}`.
- `app/globals.css` — ink/paper tokens, print CSS (`.doc-page`/`.doc-sheet`), cursor rules.

**Backend** (`bedrock-api`)
- `app/Http/Controllers/Admin/{AuthController,ClientController,PackageController}.php`
- `app/Http/Controllers/{DocumentController,VerifyController}.php`
- `app/Models/{User,Client,Contact,WorkPackage,LineItem,Payment,Deliverable,ActivityEntry,Document}.php`
- `app/Services/DocumentReferenceService.php`
- `routes/api.php`, `database/migrations/*`, `database/seeders/*`, `config/filesystems.php` (r2 disk)

## 7. Design system

Monochrome **ink** (#0a0a0a) on **paper** (#f4f4f2). **Sora** for display/headings/numbers,
**General Sans** for body (both self-hosted via `next/font`). Editorial: tracked-uppercase
"eyebrow" labels, hairline borders, generous space. Currency renders **`GHS 1,234.56`** (no ₵).
All clickables are `cursor-pointer` (Tailwind v4 dropped the default). Collapsible sidebar with
expandable groups; a group opens via `openGroups[label] ?? anyActive` (no client-effect
dependence — renders open in SSR on its route).

## 8. Gotchas / lessons (don't repeat these)

- **Never `rm -rf .next` while a dev server is running** — it corrupts it (`_document.js` ENOENT).
  If a deleted route leaves stale `.next/types`, remove just that subdir or tolerate the tsc noise.
- **`composer require pkg:^x`** (colon, no space). A space makes composer treat the version as a
  second package and the install silently fails.
- **`migrate:fresh` wipes data** — only dev seeds (Ama, Kojo individuals; Brand identity pack;
  Dropyn document). Warn before running.
- **Uploads** need `serverActions.bodySizeLimit` (set to `50mb` in `next.config.ts`) — the default
  1MB rejects real files as "Failed to fetch".
- On Windows, `grep -i` can **abort** on some rendered HTML; verify page content with a small
  `php` string search instead.
- Stop **only your own** dev server (find the PID by port via `netstat`), never blindly.
- Server-side fetches (server components/actions) reach the API fine; **browser→API** cross-origin
  with the httpOnly cookie does not — that's why admin file download isn't wired.

## 9. Suggested next steps (priority order)

1. **Paystack** — `POST /api/p/{slug}/pay` mints an access_code; inline JS on the portal;
   `POST /api/webhooks/paystack` verifies the `x-paystack-signature` (HMAC-SHA512) + calls
   `/transaction/verify`, then records the payment (idempotent on reference) and runs the gates.
   This makes the Pay button real and the gates fire without manual entry.
2. **Termii** — real send on "Send invoice" (WhatsApp + SMS + OTP) + a notifications log.
3. **Media pipeline** — real watermarked previews (image/PDF/video) on a queue.
4. **Public portal polish** — OTP lookup (`/lookup`), receipt view.

## 10. Current running state at handoff

Both servers were left running: **Next :3000**, **Laravel :8001** (on R2). DB is at seed state
(any test clients/packages created during testing may have been wiped by a `migrate:fresh`).
