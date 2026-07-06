# WhatsApp message templates — copy to paste into WhatsApp Manager

Exact content for every Bedrock template. Author these in **WhatsApp Manager → Message Templates**
(or Meta Business Suite). The **template name** and the **body parameter order** must match
`bedrock-api/config/notifications.php` exactly — Bedrock fills `{{1}}, {{2}}, …` in the order listed.

## How Bedrock sends

Bedrock sends **body parameters only** (no dynamic header/button params). So any link a client
should tap lives **in the body** as a parameter — it renders as tappable text. (If you'd rather have
a proper "View" button with a dynamic URL, that's a small code addition — ask and I'll wire button
components into `WhatsAppCloudProvider`.)

- **Language:** `en` (matches `WHATSAPP_TEMPLATE_LANG` / `notifications.default_lang`).
- **Category:** as noted per template. Keep transactional ones **UTILITY** (cheapest, no opt-in
  friction). Meta may re-categorise on review.
- Parameter samples below are just for Meta's preview; real values come from the client/package.

---

## Built & wired (create these now)

### 1. `client_welcome` — UTILITY
Fires when a new client is created.
**Params:** `{{1}}` = clientName

> Hi {{1}}, welcome to SaharaBase! 🎉 Here's how we work: every job runs as a tracked *work
> package*. We'll send you a secure link to follow progress and review watermarked previews, and
> your final files unlock once payment is complete. Invoices, updates and receipts all come right
> here on WhatsApp. We look forward to working with you.

*Sample:* `{{1}}` = `Ama Boateng`

### 2. `invoice_sent` — UTILITY
Fires on "Send invoice / link".
**Params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` amountDue · `{{4}}` portalLink

> Hi {{1}}, your invoice for *{{2}}* is ready. Amount due: *{{3}}*. View the details and track
> progress here: {{4}}

*Sample:* `Ama Boateng` · `Brand identity pack` · `GHS 4,500.00` · `https://hub.saharabasetech.com/p/abc-123`

### 3. `deposit_received` — UTILITY
Fires when a deposit is recorded and work starts (balance still outstanding).
**Params:** `{{1}}` clientName · `{{2}}` amountPaid · `{{3}}` packageTitle

> Hi {{1}}, we've received your payment of *{{2}}* for *{{3}}*. Work has now started — we'll let
> you know as soon as there's something to review. Thank you!

*Sample:* `Ama Boateng` · `GHS 1,800.00` · `Brand identity pack`

### 4. `files_ready` — UTILITY
Fires when a package moves to **Review**.
**Params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` portalLink

> Hi {{1}}, the deliverables for *{{2}}* are ready for your review. See the previews here: {{3}}

*Sample:* `Ama Boateng` · `Brand identity pack` · `https://hub.saharabasetech.com/p/abc-123`

### 5. `payment_complete` — UTILITY
Fires when the balance reaches zero (the receipt / download unlock).
**Params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` portalLink

> Hi {{1}}, thank you — the balance on *{{2}}* is fully cleared and your original files are now
> unlocked for download here: {{3}}

*Sample:* `Ama Boateng` · `Brand identity pack` · `https://hub.saharabasetech.com/p/abc-123`

### 6. `package_delivered` — UTILITY
Fires when a package is marked **Delivered**.
**Params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` portalLink

> Hi {{1}}, *{{2}}* is complete and delivered. Everything stays available in your portal: {{3}}.
> Thank you for working with SaharaBase!

*Sample:* `Ama Boateng` · `Brand identity pack` · `https://hub.saharabasetech.com/p/abc-123`

### 7. `otp_code` — AUTHENTICATION
Fires on portal phone-lookup. Authentication templates have a fixed shape — in WhatsApp Manager
choose **Authentication**, enable the **"Copy code" button**, and the body is generated for you.
**Params:** `{{1}}` = the 6-digit code

> {{1}} is your SaharaBase verification code. It expires in 10 minutes. Do not share it.

*Sample:* `{{1}}` = `483920`

---

## Long-running accounts (also built & wired)

These power the **account statements & reminders**: sent **automatically every month** (the
`statements:send` scheduled command, for any package with an outstanding balance) **and** on demand
from the admin package page (the **Send statement** / **Send reminder** buttons).

### 8. `payment_reminder` — UTILITY
A short nudge for an outstanding balance.
**Params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` amountDue · `{{4}}` portalLink

> Hi {{1}}, a friendly reminder that *{{2}}* has an outstanding balance of *{{3}}*. You can review
> and pay securely here: {{4}}

### 9. `account_statement` — UTILITY
A periodic progress + balance statement for ongoing accounts.
**Params:** `{{1}}` clientName · `{{2}}` packageTitle · `{{3}}` workSummary · `{{4}}` amountDue · `{{5}}` portalLink

> Hi {{1}}, here's where *{{2}}* stands:
> {{3}}
> Outstanding balance: *{{4}}*. Full details and payment here: {{5}}

*`workSummary` sample:* `Completed: logo suite, business cards. In progress: social kit.`

---

## Approval tips

- Don't put the link as the **very first** thing in the body — lead with text, then the URL.
- Avoid ALL-CAPS words and excessive emoji; keep UTILITY messages informational.
- If Meta re-categorises a "welcome" as MARKETING, that's fine — it still sends; it just costs the
  marketing rate and clients can opt out. Keep the copy process-focused to stay UTILITY.
- After approval, the template name + language must match the code. If you change a parameter's
  position, update `config/notifications.php` to match (or tell me and I will).
