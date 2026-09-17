# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**The operator** is SaharaBase Technologies in Accra: a very small studio running client work
itself. One admin account does everything, often between other jobs, on a laptop.

**The clients** are Ghanaian schools, clinics, restaurants and small businesses. They receive a
link, usually open it on a phone, and are rarely logged into anything. A client's own head
teacher or accounts person may be the one looking.

## Product Purpose

Bedrock runs client work and the money attached to it. Nothing of value reaches a client until
the money rule for that stage is met: a deposit starts the work, a cleared balance releases the
files. It also issues the studio's documents (proposals, invoices, receipts, fee schedules) with
QR verification, tracks infrastructure the studio hosts for clients, and holds the finished work
as a repository the client can open at any time.

## Positioning

Gated delivery is the mechanism: previews are free, originals are not, and the gate is enforced
by the API rather than by politeness. A neighbouring project-management tool cannot copy that
without taking on the payment side.

## Operating Context

- Work is organised as **work packages**, each belonging to a client, with line items, payments,
  milestones, a status lifecycle, an activity log, and a file repository.
- Billing is either **gated** (deposit to start, balance to unlock files) or **deferred** (an
  ongoing account: work runs ungated and is invoiced afterwards, so its files are never locked).
- Money is in Ghana cedis; some infrastructure is priced in US dollars and paid in cedis at the
  day's rate. Payments arrive by mobile money, bank transfer, cash, cheque or card (Paystack).
- Clients are reached over WhatsApp first, with email as a mirror. Documents go out as PDFs.
- Files live in Cloudflare R2. Previews are generated for images, PDFs and videos; originals are
  served as short-lived signed URLs.

## Capabilities and Constraints

- The hub is a Next.js app that talks to a Laravel API; the browser never holds an API token, so
  every call to the API is made server-side.
- The API and the hub share one small VPS with a business-critical app owned by another team.
  Nothing may restart nginx or PHP-FPM, and bandwidth through the box is worth saving.
- nginx accepts request bodies up to 210 MB, so a single upload cannot carry a large file.
- A file may be up to 2 GB. Any file type is accepted; images, PDFs and videos get previews.
- Clients do not upload; they browse and download.
- The R2 token is object-scoped and cannot change bucket settings, so anything needing a bucket
  rule (browser-direct uploads) is an operator step in the Cloudflare dashboard.

## Brand Commitments

- Name and voice: **SaharaBase Technologies**. Copy is plain, direct and specific, the way a
  Ghanaian head teacher speaks. No em dashes, no SaaS filler, no manufactured contrast.
- Faces: **Sora** for display, **General Sans** for body. Monochrome ink on paper.
- The issued documents set the visual language for anything client-facing: structure comes from
  fills, never from lines; large radii; light tints; type one step larger than the app. The file
  repository was built inside that language (see `docs/FILES.md`).

## Evidence on Hand

Real client work, documents and infrastructure records live in the app itself. Demo clients exist
in the local database. Nothing about customer numbers, revenue or case studies has been
established, and none may be invented.

## Product Principles

1. The money rule decides what a client can take. It is enforced in the API, never in the UI.
2. Deferred accounts are never punished: ungated work stays open while it is invoiced.
3. Storage is a cost. A deleted file stops costing us money; an abandoned upload is cleaned up.
4. Clients are on phones, on Ghanaian networks. Nothing may assume a desktop or a fast line.
5. The studio is one person. Screens must be scannable, and destructive actions recoverable or
   clearly named.

## Accessibility & Inclusion

Keyboard and screen-reader paths are expected to work throughout the admin. Touch targets are at
least 44px on phones, where most client traffic is.
