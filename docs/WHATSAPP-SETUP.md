# WhatsApp Cloud API — setup checklist

How to connect Bedrock to WhatsApp using **Meta's own developer portal** (no third-party BSP).
Decision & rationale: [ADR-0003](./decisions/0003-whatsapp-cloud-api-direct.md). This is the
**operator's** task; the backend code is already built and runs inertly (`MESSAGING_PROVIDER=log`)
until these values are filled in.

## What Bedrock needs from Meta (the env values)

The backend reads `config('services.whatsapp')` from these `.env` keys (see `bedrock-api/.env.example`):

| Key | Where it comes from |
|-----|---------------------|
| `MESSAGING_PROVIDER` | `log` while testing → `whatsapp_cloud` to go live |
| `WHATSAPP_PHONE_NUMBER_ID` | Step 4 — the registered number's **Phone Number ID** |
| `WHATSAPP_WABA_ID` | Step 2 — the WhatsApp Business Account ID |
| `WHATSAPP_TOKEN` | Step 5 — the **permanent** system-user token |
| `WHATSAPP_APP_SECRET` | App → Settings → Basic → **App Secret** (verifies webhook signatures) |
| `WHATSAPP_VERIFY_TOKEN` | **You invent this** — any random string; paste the same value in the portal webhook box |
| `FRONTEND_URL` | The portal host, e.g. `https://hub.saharabasetech.com` (builds `/p/{slug}` links) |

## Steps (in the Meta developer portal)

1. **Business verification** — Meta Business Settings → Security Center → verify **SaharaBase
   Technologies** (tax ID / incorporation docs). Takes **2–10 business days**; needed before real
   sending volume. Start this first — it's the long pole.
2. **Create the app** — developers.facebook.com → Create App → **Business** type → add the
   **WhatsApp** product. This provisions a **WhatsApp Business Account (WABA)** + a free test number.
   On the "Customize use case" screen, choose **Integrate with API** (not "Become a Partner").
3. **Register your business phone number** — do it via the API (the *Register your WhatsApp phone
   number* step in the portal); it can't be done purely in the UI.
   ⚠️ **The number must NOT be active on the regular WhatsApp or WhatsApp Business app.** If it is,
   delete it from that app first, or use a fresh SIM/number. This is the most common failure.
4. Note the **Phone Number ID** shown for the registered number → `WHATSAPP_PHONE_NUMBER_ID`.
   Add a **payment method** to the WABA (required for business-initiated messages).
5. **Permanent token** — Business Settings → **System Users** → create one → assign the app with
   `whatsapp_business_messaging` + `whatsapp_business_management` → **Generate token** → copy it to
   `WHATSAPP_TOKEN`. (The 24-hour dev token on the dashboard is for testing only.)
6. **Message templates** — WhatsApp Manager → author + submit them. **Exact copy + parameter order
   for every template is in [WHATSAPP-TEMPLATES.md](./WHATSAPP-TEMPLATES.md)** (ready to paste).
   Currently wired: `client_welcome_individual`, `client_welcome_contact`, `invoice_sent`,
   `deposit_received`, `files_ready`, `payment_complete`, `package_delivered` (all UTILITY) and
   `otp_code` (AUTHENTICATION). Names must
   match `bedrock-api/config/notifications.php` exactly. Approval is usually minutes-to-hours. You
   can add as many templates as you need (Meta allows up to ~250 per account).
7. **Webhook (do this LAST, after the API is deployed).** Sending works without it — the webhook
   only powers delivery receipts + inbound replies. When ready:
   - Callback URL: **`https://api.saharabasetech.com/api/webhooks/whatsapp`**
   - Verify token: the value you put in `WHATSAPP_VERIFY_TOKEN`
   - Click **Verify and save** (Meta does a GET handshake against the URL).
   - **Publish the app** — unpublished apps only receive *test* webhooks from the dashboard.
   - Subscribe to the `messages` field (covers inbound + message status).

## Going live

1. Fill all keys in the production `bedrock-api/.env`, set `MESSAGING_PROVIDER=whatsapp_cloud`.
2. Run a `notifications` queue worker (or Horizon) in prod so sends don't block requests:
   `php artisan queue:work --queue=notifications`.
3. Smoke test: send a package invoice to your own WhatsApp; confirm it arrives and (once the webhook
   is live + app published) the `notification_logs` row flips to `delivered`.

Until `MESSAGING_PROVIDER=whatsapp_cloud`, the app uses `LogOnlyProvider` — every "send" is written
to the Laravel log and recorded in `notification_logs`, but nothing reaches Meta. Safe for dev.
