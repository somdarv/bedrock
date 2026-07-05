# Bedrock — Session Handoff

> Living context for continuing work across sessions. **Last updated: 2026-07-05.**
> Read this first, then [ARCHITECTURE.md](./ARCHITECTURE.md), [DOCUMENT-CODES.md](./DOCUMENT-CODES.md), [ROADMAP.md](./ROADMAP.md).

---

## 1. What Bedrock is

Client management + **gated-delivery** payment system for **SaharaBase Technologies** (Accra, Ghana).
Nothing of value reaches a client until the money rule for that stage is met. Every job is a
**Work Package**. Two gates: **start** (deposit → work begins) and **download** (balance = 0 →
originals unlock). Also hosts a **document engine** (invoices/proposals/fee schedules with QR
verification) served from the tools portal **hub.saharabasetech.com**.

## 2. Repos, machine & deployment

| Path | What |
|------|------|
| `c:\Users\iamjn\Desktop\WEBZ\bedrock\bedrock` | **Frontend** — Next.js 15 (App Router, TS, Tailwind v4) |
| `c:\Users\iamjn\Desktop\WEBZ\bedrock-api` | **Backend** — Laravel 13, PostgreSQL |
| `c:\Users\iamjn\Desktop\WEBZ\SAHARA\base` | Marketing site — the **design source** (monochrome ink/paper, Sora + General Sans). Not the focus. |

Local toolchain: **PHP 8.4** (GD **with FreeType**, no Imagick), **Composer 2.9**, **PostgreSQL 18**
on `:5432` (db `bedrock`, user `postgres`), **Node/npm**. Credentials live in the git-ignored
`.env` files — never commit them.

**DEPLOYED & LIVE:** `hub.saharabasetech.com` (frontend) + its API, on the VPS, auto-deployed via
**GitHub Actions** (frontend `425be9b`, backend `857457f`) mirroring the marketing site's
SSH-forced-command + PM2 pattern. Reverse proxy is **nginx**. Prod admin login shown as
`admin@sbt.live`. **Note:** the machine here **cannot reach github.com/Composer** (network
restricted) — that shaped some choices (see §8).

## 3. How to run locally

```bash
# Backend (from bedrock-api)
php artisan serve --port=8001

# Frontend (from bedrock\bedrock)
npm run dev           # → http://localhost:3000 (falls back to 3001/3002 if busy)
```

- **Admin login (dev):** `admin@saharabase.test` / `password`.
- Frontend env in `.env.local`; backend env in `.env`.

Key frontend env (`.env.local`):
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_API_LIVE=auth,clients,packages     # per-domain live switch
NEXT_PUBLIC_DOCS_SOURCE=live                    # documents live
NEXT_PUBLIC_VERIFY_BASE_URL=https://hub.saharabasetech.com   # QR target
NEXT_PUBLIC_APP_URL=                            # set to prod domain for public /p links
```

Key backend env (`.env`): `DB_CONNECTION=pgsql` (db `bedrock`), `DELIVERABLES_DISK=r2`,
`R2_*` set (bucket `bedrock-deliverables`), plus the media block (see §5).

## 4. What's LIVE vs pending

**Live & verified end-to-end:**
- **Auth** — Sanctum tokens; token in an httpOnly cookie (`bedrock_token`); `http.ts` forwards it
  server-side as `Authorization: Bearer`.
- **Clients** — organisation **or** individual, with a **contacts** table. CRUD live. (Fixed this
  session: the "New client" form no longer keeps stale values between creates.)
- **Work Packages** — CRUD, line items, dual pricing, payments, the **two gates**, status lifecycle
  (guarded → 409), activity log, deliverables. **New this session:** create a package straight from
  the client detail page (client pre-pinned); in **fixed** mode line items are scope-only (no
  qty/price in the add form or admin table).
- **Payments** — record payment runs the gate logic. **New:** method is a **select** (Mobile money,
  Bank transfer, Cash, Cheque, Paystack-online) with shared labels reused in the table.
- **Documents + verification** — registry served from the API; `/verify/{ref}` lookup; open in a
  new tab. Records live in the DB; author locally + seed (see §6).
- **R2 storage** — originals stored private; downloads **gated** (locked until balance 0) via
  signed, time-limited URLs; "free up storage" purges originals → download 410.
- **Media pipeline (images)** — **real** watermarked JPEG previews (downscale + tiled diagonal
  SAHARABASE watermark) via **PHP-GD + FreeType**. Served ungated at
  `GET /api/deliverables/{id}/preview`. Admin previews the **clean original** via a Next proxy
  (`/api/admin/deliverables/[packageId]/[deliverableId]`) that forwards the Sanctum token
  server-side. Backfill with `php artisan media:regenerate`.

**Still mock / not built — the road to full potential (priority order in §9):**
- **Paystack** — Pay button is a placeholder; payments entered **manually**. Real flow (init
  access_code → inline JS → webhook HMAC verify → record → gates) NOT built. ← **biggest next**
- **Termii** — "Send invoice" only flips draft→sent + logs; no real WhatsApp/SMS/email/OTP send.
  (User has a new WhatsApp number to configure.)
- **Media pipeline (PDF/video)** — drivers exist but **capability-gated**: they fall back to a
  branded placeholder until the server has **Ghostscript + FFmpeg** (`MEDIA_GHOSTSCRIPT` /
  `MEDIA_FFMPEG`). Images already real.
- **Public portal** — `/p/[slug]` view live (scope, price, watermarked previews in a view-only
  lightbox, gated download). OTP lookup (`/lookup`) and the Paystack pay button not wired.
- **Document PDF export** — pagination of the browser print→PDF is **unresolved** (see §8).

## 5. Media pipeline — how it works (this session's big add)

- Upload → original stored on R2 → `GenerateDeliverablePreview` job. **Sync in dev**
  (`MEDIA_SYNC=true`, generated inside the request), **queued** on the `media` queue in prod.
- Drivers in `app/Services/Media/`: `ImagePreviewDriver` (GD, real), `PdfPreviewDriver`
  (Ghostscript, capability-gated), `VideoPreviewDriver` (FFmpeg, capability-gated), `Watermarker`
  (TTF via FreeType, falls back to GD bitmap font), `MediaPipeline` (orchestrator),
  `PlaceholderPreview` (branded SVG fallback).
- `config/media.php` (env-driven): `MEDIA_SYNC`, `MEDIA_PUBLIC_URL` (must be the **browser-reachable
  API URL** — dev `http://127.0.0.1:8001`), `MEDIA_FONT_PATH` (dev `C:/Windows/Fonts/arialbd.ttf`;
  Linux e.g. DejaVu Sans Bold), `MEDIA_WATERMARK_TEXT`/`_OPACITY` (default 0.18),
  `MEDIA_MAX_DIMENSION`, `MEDIA_JPEG_QUALITY`, `MEDIA_GHOSTSCRIPT`, `MEDIA_FFMPEG`.
- `preview_path` column holds the generated preview; `Deliverable::previewUrl()` builds the serve
  URL with a `?v=updated_at` cache-buster.
- **Prod TODO:** set `MEDIA_PUBLIC_URL` to the prod API origin, `MEDIA_FONT_PATH` to a server TTF,
  install Ghostscript+FFmpeg to light up PDF/video, and set `MEDIA_SYNC=false` + run a `media`
  queue worker (Horizon) so large jobs don't block uploads.

## 6. Documents — getting them onto a live site

A document has **two halves that share one Document ID**:
1. **Body** = a bespoke React component in `components/documents/`, mapped by ID in `bodies.tsx`
   (`BODIES`). This is code — deploys with the frontend.
2. **Record** = a row in the `documents` table (drives the listing, `/d/[id]`, `/verify`).

The frontend list reads the **DB** (`NEXT_PUBLIC_DOCS_SOURCE=live` → `GET /api/documents`). A fresh
prod DB is empty, so **run `php artisan db:seed --class=DocumentSeeder`** on the API server (only
that class — a bare `db:seed` also seeds demo clients/packages). `DocumentSeeder` uses
`updateOrCreate`, so it's the idempotent canonical published list — safe to re-run on every deploy.
Adding a proposal = author the body component + `BODIES` entry + a `DocumentSeeder` row (same ID),
redeploy, seed. `POST /api/documents` exists (mints IDs for a future authoring UI) but isn't wired
to a form yet.

## 7. Architecture notes that matter

- **Per-domain API switch** — `lib/api/index.ts` composes `httpApi` (live) + `mockApi` per domain
  via `NEXT_PUBLIC_API_LIVE`. Clients↔packages must flip together. Documents use a separate switch
  (`NEXT_PUBLIC_DOCS_SOURCE`).
- **JSON shapes** — clients/packages endpoints return **bare** arrays/objects (`toApi()`);
  **documents** return the `{data: ...}` envelope (its `api.ts` unwraps it). Keep both.
- **IDs** — clients/packages use **ULIDs**; documents use the human Document ID.
- **Money is derived** — `WorkPackage::effectiveTotal()`/`balance()` mirror the frontend accessors.
  Never store balance.
- **Admin file access** is server-side only (browser can't carry the httpOnly cookie cross-origin);
  hence the Next **proxy routes** for admin original preview / downloads.

## 8. Open issues / gotchas (don't repeat these)

- **Document PDF export pagination is UNRESOLVED.** "Download PDF" is browser print→PDF against the
  `.doc-sheet` (`document-frame.tsx`, print CSS in `globals.css`). The original CSS marked every
  section `avoid-break`, so on A4 a block that doesn't fit is pushed whole to the next page →
  large blank gaps (the on-screen sheet flows continuously and looks fine; only the PDF paginates).
  Commits `80ed6ea` + `809f89e` reduced this (long sections flow; only small units stay atomic) but
  **it was never visually verified** — this machine has **no PDF rasterizer** (no poppler/Imagick/
  Ghostscript) and headless-Chrome PDF viewing didn't work, so verification was blind. **Next
  session:** either finish tuning `avoid-break` with a real rasterization check (Windows'
  `Windows.Data.Pdf` WinRT API can render PDF→PNG without installs), or move to **server-side PDF
  generation** for pixel control. Deferred by the user for now.
- **Network:** github.com/Composer are unreachable here → the media pipeline deliberately uses
  **raw PHP-GD** (no Intervention Image). Don't try `composer require` for media work in this env.
- **Windows font paths:** use forward slashes (`C:/Windows/Fonts/arialbd.ttf`) in `.env`.
- Unauthenticated hit to the raw Laravel deliverable endpoint returns **500 not 401** (Laravel's
  missing-`login`-route quirk). Harmless (no file leaks) but worth tidying.
- **Never `rm -rf .next` while `npm run dev` runs** (corrupts it). Don't run `next build` while the
  dev server is up. `migrate:fresh` wipes to seeds — warn first. Uploads need
  `serverActions.bodySizeLimit=50mb` (set). Stop only your **own** dev servers (find PID by port).

## 9. Road to fullest potential (priority order)

1. **Paystack (real payments)** — `POST /api/p/{slug}/pay` mints an access_code; inline JS on the
   portal; `POST /api/webhooks/paystack` verifies `x-paystack-signature` (HMAC-SHA512) + calls
   `/transaction/verify`, records the payment (**idempotent on reference**), runs the gates. Makes
   the Pay button real and gates fire without manual entry. `method` value `paystack` is reserved
   for these. See ARCHITECTURE §5.
2. **Termii notifications** — real WhatsApp + SMS + OTP send on invoice/receipt/status events +
   a notifications log with resend. Configure the new WhatsApp number. Powers OTP lookup too.
3. **Media pipeline PDF/video** — install Ghostscript + FFmpeg on the server, set the env paths,
   flip `MEDIA_SYNC=false` + run a `media` queue worker/Horizon.
4. **Document PDF export** — resolve pagination (§8), ideally server-side rendering; then an
   in-admin **document authoring UI** (wire `POST /api/documents` + a body-component workflow)
   instead of code+seed.
5. **Public portal polish** — OTP lookup (`/lookup`), receipt/payment-complete view, Paystack pay
   button (depends on #1).
6. **Prod hardening** — queue worker/Horizon as a service, DB backups, error monitoring, CORS
   locked to the hub origin, rate limiting on public/OTP endpoints, the 500→401 fix, and set the
   prod media/env values from §5. Later: multi-user/worker roles (schema already has `role`).

## 10. This session's changelog

**Frontend** (`bedrock\bedrock`): `9940beb` documents/portal/R2/admin · `9fccc07` packages-in-client
-view, form-prefill fix, scope-only fixed pricing, protected preview lightbox · `6c329d3` admin
clean-original preview proxy · `920937a` handoff · `425be9b` GitHub Actions deploy · `80ed6ea`/
`809f89e` PDF pagination (partial, unverified — §8).

**Backend** (`bedrock-api`): `eae70ef` initial Laravel API · `13f64fa` admin inline original-preview
endpoint · `74a8fb9` media pipeline (real image previews) · `d40d841` watermark opacity 0.18 ·
`857457f` GitHub Actions deploy.

## 11. Current running state at handoff

Local dev servers **were started this session** for testing (**Next :3000**, **Laravel :8001**) and
may still be running — stop them if not needed (find PID by port). DB is at seed state. Working tree
is **clean** in both repos. Prod is live on `hub.saharabasetech.com`.
