# Bedrock — System Architecture (v1)

> **Status:** Source of truth for v1. Architecture decisions follow from the
> [product brief](../README.md); this document turns the brief into concrete, buildable
> decisions. The separate Laravel backend repo references this document for the API contract and
> data model.

**Project:** Client management & gated-delivery payment system
**Company:** SaharaBase Technologies (Accra, Ghana)
**Repo codename:** `bedrock` (this repo = the Next.js frontend)

---

## 0. Locked decisions

These are settled. Everything below builds on them.

| Decision | Choice | Why |
|----------|--------|-----|
| App split | **Next.js frontend ↔ Laravel JSON API** | Clean separation; richer custom client UX now, API reusable later. |
| Admin UI | **Custom, hand-built in Next.js** (no Filament) | Full control of the business-end UX; one frontend codebase. |
| Repos | **This repo = Next.js frontend; separate repo = Laravel API** | Independent deploys; backend is API-only. |
| Database | **PostgreSQL** | Strong relational integrity for money/state. |
| Messaging | **WhatsApp Cloud API (Meta direct, no BSP)** + email; SMS = future stub | Lower cost, full control; official Cloud API. See [ADR-0003](./decisions/0003-whatsapp-cloud-api-direct.md). |
| Deliverables | **Images + PDF + video** | Full media engine (Intervention Image, Imagick/Ghostscript, FFmpeg). |
| Payments | **Paystack** (webhook = truth) | Ghana Starter Business; swappable to Hubtel via config. |
| Object storage | **Cloudflare R2** | No egress fees; signed time-limited URLs for originals. |

---

## 1. System overview & topology

Two repositories, one system:

- **`bedrock`** (this repo) — **Next.js** frontend. Hosts two areas:
  - **Public client portal** — package view by UUID, watermarked previews, Paystack inline pay
    button, download buttons (once unlocked), OTP lookup page. No login on the primary path.
  - **Custom admin** (`/admin/*`) — authenticated. Create/manage clients, packages, line items,
    pricing, status; upload deliverables; toggle line items done.
- **`bedrock-api`** (separate repo) — **Laravel**, API-only. JSON API, Sanctum auth, Horizon
  queues, Paystack webhook, WhatsApp Cloud API integration, media pipeline. **No Filament, no Blade admin.**

```
                         Cloudflare (DNS + CDN + R2)
                                    │
   ┌───────────────┐         ┌──────┴───────┐         ┌──────────────┐
   │  Client / Admin│  HTTPS  │   Next.js     │  HTTPS  │  Laravel API  │
   │   (browser)    ├────────►│  (this repo)  ├────────►│ (separate repo)│
   └───────────────┘         └──────────────┘         └──────┬───────┘
                                                              │
        Paystack ──webhook (verified, server-side)──────────►│
                                                              │
                                   Redis queues / Horizon ◄───┤──► WhatsApp Cloud API (Meta)
                                                              │──► Email (Mailable)
                                                              └──► R2 (originals + previews)
```

---

## 2. Frontend architecture (this repo)

- **Framework:** Next.js **App Router**, TypeScript.
- **Route groups:**
  - `(public)` — the client portal (`/p/[slug]`, OTP lookup).
  - `(admin)` — the authenticated admin (`/admin/*`) behind a layout that enforces auth.
- **API client layer (`lib/api`):** a typed fetch wrapper to the Laravel API, with shared
  TypeScript DTOs mirroring the API contract (single source). A **swappable mock/fixture backend**
  sits behind the same interface so the frontend is never blocked on the backend repo.
- **Auth:**
  - *Admin* — login form → Laravel **Sanctum** token; stored in an **httpOnly cookie**; admin
    routes guarded server-side (layout/middleware); API calls carry the token.
  - *Client portal* — public UUID reads need **no auth**; the OTP-lookup path obtains a
    short-lived **scoped token** to list a client's packages.
- **Payments UI:** Paystack inline JS, initialized with an `access_code` minted by Laravel. The
  post-payment redirect is **UX only** — it never unlocks anything.
- **Rendering:** server components for reads where possible; client components for the pay button,
  uploads, and live progress.

---

## 3. Backend architecture (separate Laravel repo — documented here for the contract)

Laravel, API-only: Eloquent models, REST/JSON API, Sanctum, Horizon-managed Redis queues, the
Paystack webhook controller, WhatsApp Cloud API integration, and the media-pipeline jobs. **No
Filament, no Blade admin.**

This document defines the **shared API contract** (endpoints, payloads, auth) so both repos build
against one source of truth. Representative endpoints (final shapes pinned during backend build):

| Area | Method & path | Auth | Purpose |
|------|---------------|------|---------|
| Admin auth | `POST /api/admin/login`, `POST /api/admin/logout` | public / Sanctum | Issue/revoke admin token. |
| Clients | `GET/POST /api/admin/clients`, `GET/PUT /api/admin/clients/{id}` | Sanctum | Client CRUD. |
| Packages | `GET/POST /api/admin/packages`, `GET/PUT /api/admin/packages/{id}` | Sanctum | Package CRUD, status, pricing mode. |
| Line items | `POST/PUT/DELETE /api/admin/packages/{id}/items` | Sanctum | Line-item CRUD. |
| Deliverables | `POST /api/admin/packages/{id}/deliverables` | Sanctum | Upload originals; returns processing status. |
| Send | `POST /api/admin/packages/{id}/send` | Sanctum | Generate invoice/link, fire WhatsApp/email. |
| Public package | `GET /api/p/{slug}` | public | Portal read by UUID. |
| Pay init | `POST /api/p/{slug}/pay` | public | Mint Paystack `access_code`/reference. |
| Webhook | `POST /api/webhooks/paystack` | signature | Payment truth (server-side verify). |
| OTP lookup | `POST /api/lookup/request`, `POST /api/lookup/verify` | public | Issue/verify OTP → scoped token. |
| Download | `GET /api/p/{slug}/deliverables/{id}/download` | gate | Mint signed R2 URL if unlocked. |

---

## 4. Data model

PostgreSQL via Eloquent. Locked before any code.

- **Client** — `name`, `whatsapp`, `email`, `phone`. hasMany WorkPackages.
- **WorkPackage** — belongsTo Client.
  - `status` enum: `Draft → Sent → AwaitingDeposit → InProgress → Review → AwaitingFinalPayment
    → Delivered → Closed`.
  - `public_slug` — UUID, indexed, unguessable (the trackable link).
  - `estimated_delivery_date`.
  - `pricing_mode` enum (`itemized` | `fixed`) + `total_override` (nullable) — see §5.
  - timestamps.
- **LineItem** — belongsTo WorkPackage. `description`, `quantity`, `unit_price`.
- **Payment** — belongsTo WorkPackage. `amount`, `paystack_reference` (unique), `status`,
  `paid_at`, `method`/`channel`. Many per package (deposit + final).
- **Deliverable** — belongsTo WorkPackage. `type` (`image`/`pdf`/`video`), `original_path`,
  `preview_path`, `locked` (boolean), `processing_status`.
- **User** — admin/worker roles (single admin in v1; `role` column present for later handoff).
- **ActivityLog / StatusEvent** — polymorphic; every state change → client timeline + audit trail.
- **OtpCode** — `phone`, `code_hash`, `expires_at`, `consumed_at`.
- **NotificationLog** — `channel`, `event`/`template`, `recipient`, `status`, provider response.

---

## 5. Money model & the two gates (the spine)

### Pricing — dual mode (admin chooses per package)

Itemized pricing sometimes works against the business, so the total can also be set directly.

- **`itemized`** (default) — effective total = `sum(line_items.quantity * unit_price)`. Line-item
  changes flow automatically to total, balance, and invoice.
- **`fixed`** — admin writes a single `total_override`; that is the effective total. Line items
  still exist as scope/record but **do not** drive the price. The client portal shows a **lump-sum
  total** rather than the itemized breakdown.
- A single **`effectiveTotal()`** accessor resolves by `pricing_mode`, so everything downstream
  (balance, gates, invoice, receipts) reads **one number** regardless of mode. Switching modes is
  allowed pre-payment; guarded and logged once a payment exists.

### Payment rule by job size

- **≤ GHS 500** → 100% upfront (not worth chasing).
- **> GHS 500** → 40% deposit to start / 60% on final delivery.

Resolved when the package is **Sent**; derived logic, never hand-typed amounts.

### Balance & the two gates

`Balance = effectiveTotal − sum(successful payments)`. **Gates are derived state**, not stored
flags:

- **Start gate** — opens when the deposit (or full small-job payment) is confirmed → status →
  **In Progress**.
- **Download gate** — opens when `Balance == 0` → `Deliverable.locked` flips to `false`
  (a denormalized cache of the rule), download buttons appear, receipt sent.

### Hard rule — payment truth only via webhook

The browser redirect is **UX only** and unlocks nothing.

```
Laravel inits Paystack txn ──► returns access_code/reference
   client pays via Paystack inline (Next.js)
      Paystack ──► POST /api/webhooks/paystack
         verify x-paystack-signature (HMAC-SHA512, secret key)
            call Paystack /transaction/verify (server-side)
               record Payment ──► recompute balance ──► run gate logic
```

The webhook is **idempotent**, keyed on `paystack_reference` — a replayed or duplicate event
never double-credits.

---

## 6. Delivery & media engine (images + PDF + video)

Lives in the Laravel repo. Admin uploads an original via the Next.js admin → Laravel stores it in
the **R2 private bucket** (`originals/` prefix) → a queued job is dispatched **by type** onto a
dedicated **`media` queue** (video gets its own Horizon worker — heaviest CPU):

- **image** → Intervention Image: downscale + apply the **SaharaBase monochrome watermark**.
- **pdf** → Imagick/Ghostscript: rasterize pages + watermark.
- **video** → FFmpeg: low-res transcode + `drawtext`/overlay watermark.

Previews are written to R2 (`previews/` prefix) and served via CDN.

> **Note:** video previews are **not** "tiny" the way image previews are — they are served from
> R2/CDN, not inlined.

**Originals never unlock except via signed, time-limited R2 URLs**, minted by Laravel **only after**
the download gate confirms `Balance == 0`.

---

## 7. Client access

- **Primary path** — UUID `public_slug` link, no login. Next.js fetches the public package view by
  slug. Unguessable; no enumerable IDs.
- **Secondary path** — phone + **OTP lookup** for returning clients. Laravel issues the OTP via a
  WhatsApp Authentication template, verifies it, and returns a short-lived **scoped token** (a
  stateless encrypted `PortalToken` — Client ids are ULIDs and don't fit Sanctum's BIGINT tokenable
  column) listing that client's packages.

---

## 8. Notifications

**WhatsApp Cloud API (Meta direct)** behind a `MessagingProvider` interface, in Laravel. Queued
jobs (`SendClientNotification` on the `notifications` queue) fire on each key event:

- Invoice sent
- Deposit received
- Work started
- Files ready for review
- Payment complete / receipt

**Email mirrors** each event via a Laravel Mailable (`ClientEventMail`). WhatsApp uses
**pre-approved templates** on the official Cloud API (`graph.facebook.com`), sent directly — never
unofficial libraries, never a BSP. Delivery receipts + inbound replies arrive on the
`/api/webhooks/whatsapp` webhook (`X-Hub-Signature-256` verified). Every send is recorded in
**NotificationLog**. SMS is a future stub (`SmsProvider`/`NullSmsProvider`).

---

## 9. Provider abstractions (swap = config, not rewrite)

In the Laravel repo, so vendors swap without a rewrite:

- `PaymentGateway` interface → `PaystackGateway` now, `HubtelGateway` later.
- `MessagingProvider` interface → `WhatsAppCloudProvider` now (`LogOnlyProvider` in dev; a BSP
  swappable later). `SmsProvider` → `NullSmsProvider` stub until an SMS vendor is added.
- `ObjectStorage` via Laravel's S3 filesystem driver → R2 now.

---

## 10. Security & integrity

- Webhook signature verification + server-side verify + idempotency (§5).
- UUID slugs are unguessable; no enumerable IDs in public URLs.
- Signed, time-limited R2 URLs for originals; **gate check before minting**.
- Sanctum tokens for admin (httpOnly cookie in Next.js); OTP-scoped tokens for client lookup.
- CORS locked to the Next.js origin(s).
- All money and status mutations logged to **ActivityLog** for dispute audit.

---

## 11. Deployment

- **Frontend (this repo):** Next.js on the VPS via Node/PM2 behind nginx (default), or Vercel
  (alternative). Cloudflare DNS/CDN in front.
- **Backend (separate repo):** VPS (recommend **Hetzner**) — nginx, PHP-FPM, **PostgreSQL**,
  **Redis** (queue + cache), Horizon, plus **FFmpeg + Imagick + Ghostscript** for the media
  engine. R2 via Cloudflare. CI via GitHub Actions per repo.

---

## 12. End-to-end flow

1. Client sends a brief on WhatsApp.
2. Admin (Next.js `/admin`) creates a Client + WorkPackage, adds line items.
3. System computes `effectiveTotal` and applies the payment rule (full upfront ≤ GHS 500, else
   40% deposit).
4. System generates the invoice + unique UUID tracking link.
5. Link sent via WhatsApp + email.
6. Client opens the portal, sees scope + price + a "Pay deposit" button (Paystack inline).
7. **Paystack webhook** confirms payment server-side → **start gate** opens (status → In Progress).
8. Admin does the work, uploads deliverables, toggles line items done (progress bar moves).
9. Client sees watermarked previews.
10. Client pays the balance → webhook fires → **download gate** opens → `locked` flips to false →
    download buttons appear → receipt sent automatically.

---

## 13. v1 scope boundary

**In:** Work Package lifecycle, dual-mode line-item/fixed pricing, two-gate payment via Paystack
webhooks, watermarked-preview + locked-original delivery (image/PDF/video), UUID client links,
phone+OTP lookup, WhatsApp + email notifications (Meta Cloud API direct), custom admin, activity log.

**Out (later):** team/worker accounts beyond a single admin, Hubtel payment fallback, any
analytics/reporting dashboard, recurring or subscription billing. The §9 interfaces leave the door
open for these without a rewrite.

---

## 14. Open considerations (not blockers)

- Frontend hosting: same-VPS via PM2 (default) vs Vercel.
- Paystack ceiling: Ghana Starter Business viable to ~GHS 17k before a registered upgrade is
  required (Ghana Card + TIN + matching payout account).
- Video media cost: FFmpeg jobs are the heaviest part of the system; consider a separate worker
  and capped concurrency.
- Shared types: keep frontend DTOs in sync with the API contract — consider generating types from
  an OpenAPI spec the backend publishes.

---

See [ROADMAP.md](./ROADMAP.md) for the phased, admin-first frontend build plan.
