# _extracted — internal tools & legacy code (NOT part of the marketing site)

This folder was carved out of `base/` so the repository holds **only the public
marketing website**. Nothing in here is imported by or needed for the marketing
site — it is safe to delete or move to another repository.

It is git-ignored (see `.gitignore`), so it will **not** be pushed with `base`.

## What's in here

`app/` mirrors the original Next.js `app/` structure, so you can drop these
folders straight into another Next.js project's `app/` directory:

- **Internal document tools** — `invoice/`, `contract/`, `quote/`, `proposal/`,
  `eduproposal/`, `promu/` (PDF generators using `html2pdf.js`)
- **Billing / client apps** — `abena/`, `dropyn/`, `accounts/`, `verify/`
- **Misc** — `qrcode-generator/`, `api/` (the nodemailer callback route)
- **Old marketing site (v1)** — `page.js` (old homepage), `contact/`,
  `expertise/`, and all of `components/` (Hero, Navigation, Footer, ClientBrief,
  Expertise, ButtonPrimary, ContactMain, CallBack, InvoiceTable, NavAdmin, …)

Root-level leftovers:
- `root-page.js` — a stray hardcoded contract PDF page that sat at the repo root
- `server.js` — the old custom HTTP server (not needed; use `next start`)

## Before these will run again (in their new home)

They have unmet dependencies that were never installed in `base`:
- `nodemailer` (api/callback)
- `@/components/ui/*` shadcn components (qrcode-generator, accounts)
- `html2pdf.js` runs at import time and breaks SSR — those pages need
  `next/dynamic` with `{ ssr: false }` or a client-only guard.

## To move them to another repo (e.g. Bedrock)

1. Copy `_extracted/app/<folder>` into the target project's `app/`.
2. `npm install nodemailer html2pdf.js` and add the shadcn `ui` components.
3. Re-add the `@/*` path alias in that project's `jsconfig.json`.
