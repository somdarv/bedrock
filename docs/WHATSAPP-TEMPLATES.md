# WhatsApp message templates — copy to paste into WhatsApp Manager

Exact content for every Bedrock template. Author these in **WhatsApp Manager → Message Templates**.
The **template name** and the **body parameter order** must match `bedrock-api/config/notifications.php`
exactly — Bedrock fills `{{1}}, {{2}}, …` in the order listed.

## How Bedrock sends

- **Body parameters** — the ordered `{{n}}` text values (from each event's `vars`).
- **URL button** — most templates carry a **dynamic URL button** so the client taps through to their
  portal. Author it as a **Call-to-action → Visit website → Dynamic** button with base URL
  **`https://hub.saharabasetech.com/p/{{1}}`**. Bedrock supplies the package **slug** as the `{{1}}`
  suffix. (The raw link is therefore *not* in the WhatsApp body — the button is the link. Email,
  which has no buttons, still includes the link in its text.)
- **Media header (document)** — templates *can* carry a PDF header (e.g. the invoice). **Not wired
  yet**: Bedrock has no server-side PDF generation, so there's no file to attach. See
  “Document attachments” at the bottom. Don't add a document header to these templates until that
  lands, or approval will expect a sample file Bedrock can't yet provide.

- **Language:** `en`. **Category:** UTILITY (except `otp_code` = AUTHENTICATION).
- Where a template has a button, add it in Meta exactly as described or the send will fail
  (Bedrock sends a button component the template must declare).

---

## Templates (create these now)

### 1. `client_welcome` — UTILITY · no button
**Body params:** `{{1}}` clientName

> Hi {{1}}, welcome to SaharaBase! 🎉 Here's how we work: every job runs as a tracked *work
> package*. We'll send you a secure link to follow progress and review previews, and your final
> files unlock once payment is complete. Invoices, updates and receipts all come right here on
> WhatsApp. We look forward to working with you.

### 2. `invoice_sent` — UTILITY · **URL button** (`…/p/{{1}}`)
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` amountDue

> Hi {{1}}, your invoice for *{{2}}* is ready. Amount due: *{{3}}*. Tap below to view the details
> and track progress.

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

### 5. `payment_complete` — UTILITY · **URL button**
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle

> Hi {{1}}, thank you — the balance on *{{2}}* is fully cleared and your original files are now
> unlocked. Tap below to download.

**Button:** `https://hub.saharabasetech.com/p/{{1}}` · label e.g. “Download files”

### 6. `package_delivered` — UTILITY · **URL button**
**Body params:** `{{1}}` clientName · `{{2}}` packageTitle

> Hi {{1}}, *{{2}}* is complete and delivered. Everything stays available in your portal — thank you
> for working with SaharaBase!

**Button:** `https://hub.saharabasetech.com/p/{{1}}` · label e.g. “Open portal”

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

### 9. `otp_code` — AUTHENTICATION
In WhatsApp Manager choose **Authentication**, enable the **“Copy code”** button; the body is
generated. **Param:** `{{1}}` = the 6-digit code (expires in 10 minutes).

---

## Document attachments (invoice / receipt / proposal PDFs) — not wired yet

You asked to attach the actual PDFs. The messaging side is **ready** (a template can carry a
document header, and `WhatsAppCloudProvider` will attach one via a signed URL), but there is
**no PDF file to attach yet**: Bedrock's documents are React pages with client-side print-to-PDF,
not server-generated files. Attaching them requires **server-side PDF generation** first (the
deferred item in HANDOFF §8). Once that exists:

1. It produces a PDF (ideally by rendering the existing `/d/{id}` document page) and stores it
   (R2), exposing a short-lived **signed URL**.
2. Add a `'header' => ['type' => 'document', 'source' => 'invoice']` to the relevant event in
   `config/notifications.php` and wire `SendClientNotification::resolveHeaderDocument()` to return
   that signed URL + filename.
3. Re-author those templates in Meta **with a document header**, and the email Mailable attaches the
   same file.

⚠️ Never attach the actual **deliverable** files — that bypasses the payment gate. Attach documents
(invoices/receipts/proposals), not deliverables.

---

## Approval tips

- Lead the body with text; the link lives in the **button**, not the body.
- Keep UTILITY copy informational (no ALL-CAPS, minimal emoji) so Meta doesn't re-categorise it.
- Template name + language + button/header shape must match the code. Change a parameter's position →
  update `config/notifications.php` (or tell me and I will).
