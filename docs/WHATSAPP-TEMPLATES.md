# WhatsApp message templates — copy to paste into WhatsApp Manager

Exact content for every Bedrock template. Author these in **WhatsApp Manager → Message Templates**.
The **template name** and the **body parameter order** must match `bedrock-api/config/notifications.php`
exactly — Bedrock fills `{{1}}, {{2}}, …` in the order listed.

## How Bedrock sends

- **Body parameters** — the ordered `{{n}}` text values (from each event's `vars`).
- **URL button** — most templates carry a **dynamic URL button** so the client taps through to their
  portal. Author it as a **Call-to-action → Visit website → Dynamic** button, and enter the base URL
  as **`https://hub.saharabasetech.com/p/`** — **WITHOUT** a `{{1}}`. Meta appends the `{{1}}`
  variable itself, so the button previews as `https://hub.saharabasetech.com/p/{{1}}`. Bedrock then
  supplies the package **slug** as that `{{1}}` value (approval sample: any package slug, e.g.
  `2b40a7b1-3e1d-4b1b-a8c3-c58a110cfa32`).
  > ⚠️ **Do not type a literal `{{1}}` into the base URL.** If you do, the slug is appended *after*
  > it and the link renders as `/p/{{1}}<slug>`, which is not a valid slug and 404s. (The portal now
  > defensively strips such a prefix, but fix the template so the link is clean.)
  >
  > (The raw link is *not* in the WhatsApp body — the button is the link. Email, which has no
  > buttons, still includes the link in its text.)
- **Media header (document)** — `invoice_sent` carries the **invoice PDF** as its header (generated
  by the frontend `/p/{slug}/invoice` route). It is approved in Meta **with a document header**, so
  every send must include one: a header-less send is rejected with `(#132012) … expected DOCUMENT,
  received UNKNOWN`. Gated by `PDF_ATTACHMENTS_ENABLED`; with the gate off the WhatsApp leg is
  skipped rather than sent doomed. `payment_complete` is approved with an **image** header and
  carries the receipt PDF only as an email attachment. See “Document attachments” at the bottom.

  > The live header format per template is authoritative in Meta, not here. Check it with
  > `GET /{waba_id}/message_templates` and read each `HEADER` component's `format`.

- **Language:** `en`. **Category:** UTILITY for the transactional ones; the two **welcomes are
  MARKETING** (a welcome isn't tied to a transaction — Meta classifies it as marketing); `otp_code`
  = AUTHENTICATION.
- Where a template has a button, add it in Meta exactly as described or the send will fail
  (Bedrock sends a button component the template must declare).

---

## Templates (create these now)

### 1a. `client_welcome_individual` — MARKETING · no button · optional image header
Sent to an **individual** client (one person). **Body params:** `{{1}}` clientName.
(A static "Welcome" image header is optional — it's fixed in the template, so no param needed.)

> Hi {{1}}, you have been registered as a client at SaharaBase Technologies. Here's how we work: for
> each project, we'll send you a private link. There you can follow progress, preview your work, and
> pay. Once payment is complete, your final files unlock for download. You can also check on your
> projects anytime — just enter your phone number at hub.saharabasetech.com/track. We'll send
> invoices, updates and receipts right here. We're glad to be working with you!

*Sample:* `{{1}}` = `Ama Boateng`

### 1b. `client_welcome_contact` — MARKETING · no button
Sent to **each contact** of an **organisation**, naming their role + the organisation.
**Body params:** `{{1}}` contactName · `{{2}}` roleLabel · `{{3}}` orgName

> Hi {{1}}, you've been added as the {{2}} for {{3}} at SaharaBase Technologies. You'll get updates,
> invoices and receipts for their projects here. Here's how we work: for each project we send a
> private link where you can follow progress, preview the work, and pay. Once payment is complete,
> the final files unlock for download. You can also check on their projects anytime — just enter
> this phone number at hub.saharabasetech.com/track. Glad to have you on board!

*Sample:* `{{1}}` = `Richard`, `{{2}}` = `primary contact`, `{{3}}` = `Acme Ltd`
*(`roleLabel` is “primary contact” or “secondary contact”.)*

### 1c. `account_welcome_individual` — MARKETING · no button · optional image header
Ongoing-account **individual** — sets the deferred-billing terms. **Body params:** `{{1}}` clientName

> Hi {{1}}, you've been set up with an ongoing account at SaharaBase Technologies. Here's how it
> works: we'll take on your projects and add them to your account, and you settle the balance on the
> terms we agree — not project by project. We'll send a regular statement showing all your projects,
> what's been paid, and your balance. You can also check your account anytime at
> hub.saharabasetech.com/track. Glad to be working with you!

### 1d. `account_welcome_contact` — MARKETING · no button
Ongoing-account **organisation** — sent to each contact. **Body params:** `{{1}}` contactName ·
`{{2}}` roleLabel · `{{3}}` orgName

> Hi {{1}}, you've been added as the {{2}} for {{3}}, which has an ongoing account with SaharaBase
> Technologies. Here's how it works: we take on the organisation's projects and add them to the
> account, settled on agreed terms rather than per project. You'll get regular statements showing
> all projects, payments and the balance. Check the account anytime at hub.saharabasetech.com/track.
> Glad to have you on board!

### 2. `invoice_sent` — UTILITY · **URL button** (`…/p/{{1}}`) · **document header (PDF)**
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` amountDue

> Hi {{1}}, your invoice for *{{2}}* is ready. Amount due: *{{3}}*. Tap below to view the details
> and track progress.

**Header:** Media → Document (the invoice PDF; upload any PDF as the approval sample).
**Button:** Visit website · Dynamic · `https://hub.saharabasetech.com/p/{{1}}` · label e.g. “View invoice”

### 3. `deposit_received` — UTILITY · **URL button**
**Body params:** `{{1}}` clientName · `{{2}}` amountPaid · `{{3}}` packageTitle

> Hi {{1}}, we've received your payment of *{{2}}* for *{{3}}*. Work has now started — we'll let
> you know as soon as there's something to review. Thank you!

**Button:** `https://hub.saharabasetech.com/p/{{1}}` · label e.g. “Track progress”

### 4. `files_ready` — UTILITY · **URL button**
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle

> Hi {{1}}, the deliverables for *{{2}}* are ready for your review. Tap below to see the previews.

**Button:** `https://hub.saharabasetech.com/p/{{1}}` · label e.g. “View previews”

### 5. `payment_complete` — UTILITY · **URL button** · **image header**
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle

> Hi {{1}}, thank you — the balance on *{{2}}* is fully cleared and your original files are now
> unlocked. Tap below to download.

**Header:** Media → Image (the “payment complete” brand card). The receipt PDF is not a header
here — it reaches the client through the button (`{slug}/receipt`) and the email attachment.
**Button:** `https://hub.saharabasetech.com/p/{{1}}` · label e.g. “Download files”

### 6. `package_delivered` — UTILITY · **static URL button (→ /track)**
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle

> Hi {{1}}, *{{2}}* is complete and delivered. You can view this and all your projects anytime —
> thank you for working with SaharaBase!

**Button:** Visit website · **Static** · `https://hub.saharabasetech.com/track` · label e.g.
“Track your projects”. (Static, not dynamic — Bedrock sends no button parameter for this one.)

### 7. `payment_reminder` — UTILITY · **URL button**
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` amountDue

> Hi {{1}}, a friendly reminder that *{{2}}* has an outstanding balance of *{{3}}*. Tap below to
> review and pay securely.

**Button:** `https://hub.saharabasetech.com/p/{{1}}` · label e.g. “Review & pay”

### 8. `account_statement` — UTILITY · **URL button**
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` workSummary · `{{4}}` amountDue

> Hi {{1}}, here's where *{{2}}* stands:
> {{3}}
> Outstanding balance: *{{4}}*. Tap below for full details and payment.

**Button:** `https://hub.saharabasetech.com/p/{{1}}` · label e.g. “View statement”

### 8b. `ongoing_account_statement` — UTILITY · **static URL button (→ /track)**
The rolled-up statement for **ongoing accounts** (all projects in one message). Client-level, so
the button is a **static** `/track` link. **Body params:** `{{1}}` clientName · `{{2}}` accountSummary
(one line, e.g. “Brand pack — GHS 1,000.00 due; Logo — paid.”) · `{{3}}` totalOutstanding

> Hi {{1}}, here is your SaharaBase account statement: {{2}} Total outstanding across all projects:
> *{{3}}*. Tap below to see the full breakdown or settle your balance.

**Button:** Visit website · **Static** · `https://hub.saharabasetech.com/track` · label e.g.
“View my account”.

### 9. `otp_code` — AUTHENTICATION
In WhatsApp Manager choose **Authentication**, enable the **“Copy code”** button; the body is
generated. **Param:** `{{1}}` = the 6-digit code (expires in 10 minutes).

---

## Document attachments (invoice / receipt PDFs) — built ✅

Invoice + receipt PDFs are generated **server-side with `@react-pdf/renderer`** (pure Node, no
headless browser) from the package data, served on the fly from public routes:

- `GET /p/{slug}/invoice` → invoice PDF · `GET /p/{slug}/receipt` → receipt PDF
- Meta fetches the invoice as `invoice_sent`'s **document header**; the email Mailable fetches +
  attaches the same file; the portal + admin show **download** links.

**To turn it on** (after the frontend is deployed so the routes are publicly reachable by Meta):
1. Set `PDF_ATTACHMENTS_ENABLED=true` in `bedrock-api/.env`, then `config:clear` and restart the
   `sahara-hub-notify` worker — a running worker caches config from boot.
2. `invoice_sent` must exist in Meta **with a document header** (above).

Config lives in `config/notifications.php` (`'header' => ['type'=>'document','source'=>'invoice']`);
the URL is built in `SendClientNotification::resolvePdf()`.

### Proposals / fee schedules — still to do
Those are **document-engine** pages (React DOM at `/d/{id}`), which `@react-pdf/renderer` can't
render. Attaching them needs a **headless-Chrome** render of `/d/{id}` (Puppeteer/Browsershot) — the
remaining piece, which would also resolve the HANDOFF §8 document-export pagination. Not built yet.

⚠️ Never attach the actual **deliverable** files — that bypasses the payment gate. Attach documents
(invoices/receipts/proposals), not deliverables.

---

## Approval tips

- Lead the body with text; the link lives in the **button**, not the body.
- Keep UTILITY copy informational (no ALL-CAPS, minimal emoji) so Meta doesn't re-categorise it.
- Template name + language + button/header shape must match the code. Change a parameter's position →
  update `config/notifications.php` (or tell me and I will).
