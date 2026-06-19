# Bedrock

**Client management & gated-delivery payment system** for SaharaBase Technologies (Accra, Ghana).

Bedrock makes payment and delivery the same gated flow: nothing of value reaches the client until
the money rule for that stage is satisfied, and everything about a job lives in one client-facing
record — the **Work Package**. It exists to kill two recurring freelancing failures: clients not
paying, and disorganized delivery.

## This repo

This is the **Next.js frontend**. It hosts two areas:

- **Public client portal** — a unique UUID link per package: scope, price, watermarked previews,
  a pay button, and downloads once unlocked. No login on the primary path.
- **Custom admin** (`/admin`) — hand-built (no Filament): manage clients, packages, line items,
  pricing, status; upload deliverables; advance progress.

The **backend is a separate Laravel repo** (`bedrock-api`): API-only — queues, the Paystack
webhook, Termii notifications, and the media pipeline.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system architecture and the **source of truth**
  for the API contract and data model (both repos build against it).
- [docs/ROADMAP.md](docs/ROADMAP.md) — the phased, **admin-first** frontend build plan.
- [docs/decisions/](docs/decisions/) — short ADRs for the locked architectural forks.

## Stack at a glance

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router, TypeScript) — this repo |
| Backend | Laravel (API-only) — separate repo |
| Database | PostgreSQL |
| Payments | Paystack (webhook = truth; Hubtel-swappable) |
| Messaging | Termii (WhatsApp + SMS + OTP) |
| Object storage | Cloudflare R2 (signed time-limited URLs) |
| Media | Intervention Image · Imagick/Ghostscript · FFmpeg |

## Status

Pre-implementation. Architecture is locked; frontend build begins at
[ROADMAP.md](docs/ROADMAP.md) Phase 0.
