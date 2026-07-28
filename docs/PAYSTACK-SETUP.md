# Paystack — setup checklist

How to switch Bedrock's online payment collection on. Design & rationale:
[ARCHITECTURE.md §5](./ARCHITECTURE.md). The code is already built and runs inertly until the
keys below are filled in: with no `PAYSTACK_SECRET_KEY` the `LogOnlyGateway` **refuses** to open a
checkout rather than faking a success, so a misconfigured deploy cannot give work away.

## What Bedrock needs from Paystack (the env values)

The backend reads `config('services.paystack')` from these `.env` keys (see `bedrock-api/.env.example`):

| Key | Where it comes from |
|-----|---------------------|
| `PAYSTACK_SECRET_KEY` | Dashboard → Settings → API Keys & Webhooks → **Secret Key** (`sk_test_…` / `sk_live_…`) |
| `PAYSTACK_PUBLIC_KEY` | Same screen → **Public Key** (`pk_test_…` / `pk_live_…`) |
| `PAYSTACK_CURRENCY` | `GHS` |
| `PAYSTACK_BASE_URL` | Leave at `https://api.paystack.co` |
| `FRONTEND_URL` | The portal host, e.g. `https://hub.saharabasetech.com` (builds the post-payment return link) |

Test and live are two separate key pairs. **Moving between test and live is a key swap and
nothing else** — no code change, no config flag.

The secret key is what signs webhooks, so it never leaves the server. It belongs only in the
hand-managed `.env` on the VPS, never in either repo.

## Steps

1. **Copy the test keys** into `bedrock-api/.env` on the server (`sk_test_…` / `pk_test_…`).
2. **Register the webhook URL.** Dashboard → Settings → API Keys & Webhooks. Paste into the
   **Test Webhook URL** box (and later the Live one):

   ```
   https://api.saharabasetech.com/api/webhooks/paystack
   ```

   The Callback URL boxes can stay empty — Bedrock sets a per-transaction callback pointing at
   the client's own portal page, which is better than one global return URL.
3. **Apply the config.** `.env` is hand-managed on the server, so after editing it:

   ```bash
   php artisan config:clear
   ```

   Queue workers cache config at boot, so also `pm2 reload sahara-hub-queue --update-env` and
   `pm2 reload sahara-hub-notify --update-env`. Never reload php-fpm or nginx (shared with the
   neighbour apps).
4. **Take a real test payment.** Open any package portal (`/p/{slug}`), press Pay, and use a
   [Paystack test card or test mobile-money number](https://paystack.com/docs/payments/test-payments/).
   Then check: the payment shows as **success** on the package, the status moved to **In progress**,
   and the client got the WhatsApp/email receipt.
5. **Go live** by swapping in `sk_live_…` / `pk_live_…`, filling the **Live Webhook URL** box with
   the same path, and repeating step 3.

## Gotchas

- **Webhooks need a publicly reachable URL.** Local Laravel on `:8001` is not, so test against the
  deployed API with *test* keys rather than trying to test the webhook on localhost. (A tunnel
  works too, but then the dashboard's test webhook URL has to be repointed each session.)
- **IP whitelist.** If the dashboard's IP Whitelist is ever enabled, the API server's public IP
  must be listed, or Paystack will refuse our outbound calls. Leave it empty unless you need it.
- **The client needs an email on file.** Paystack requires one to open a transaction. Portal
  payment returns a clear 422 when the client has no contact email.
- **The redirect proves nothing.** Anyone can type the return URL. Nothing unlocks until the
  webhook arrives and the charge re-verifies server-side. This is deliberate — do not "optimise"
  it by trusting the redirect.
- **Amounts are in pesewas on the wire.** `PaystackGateway::toMinor()` / `toMajor()` are the only
  places that convert. Don't do it inline anywhere else.

## How it hangs together

```
portal Pay button
  → POST /api/p/{slug}/pay          mints a reference, writes a PENDING payment row
  → Paystack hosted checkout        client pays by card / MoMo / bank transfer
  → POST /api/webhooks/paystack     signature (HMAC-SHA512) checked against the secret key
      → GET /transaction/verify     independent server-side confirmation
      → payment marked success, milestone settled
      → PaymentGates::applyAfterPayment()   start gate + download gate + receipt
```

The pending row written at step 1 is what makes the webhook trustworthy: it records *what was
being paid for* (package, milestone, kind) in our own database, so the webhook never has to
believe anything echoed back over the wire. Abandoned checkouts leave a pending row, which is
harmless — `balance()` counts only successes.

Idempotency is the unique index on `payments.paystack_reference` plus an early return when a
payment is already `success`, so Paystack's retries never double-credit.
