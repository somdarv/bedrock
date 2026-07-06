# ADR 0003 — WhatsApp Cloud API, direct from Meta (no BSP)

**Status:** Accepted · **Date:** 2026-07-06 · **Supersedes:** [ADR-0002](./0002-termii-messaging.md)

## Decision

Send all client WhatsApp messaging **directly through Meta's official WhatsApp Cloud API**
(`graph.facebook.com`), onboarded via Meta's own developer portal — **not** through a Business
Solution Provider (Termii or otherwise). Everything sits behind the `MessagingProvider` interface
already envisaged in [ARCHITECTURE §9](../ARCHITECTURE.md).

## Why

- **Cost & control.** The Cloud API itself is free (you pay Meta per message, utility templates
  being the cheap tier); cutting the BSP removes its per-message markup and gives us direct control
  of templates, numbers, and webhooks.
- **The abstraction already anticipated it.** ADR-0002 mandated the *official* Cloud API "never
  unofficial libraries" — going direct is the purest expression of that, and swapping the provider
  is a binding change, not a rewrite.

## Consequences

- **SMS is dropped to a stub.** Meta Cloud API is WhatsApp-only. SMS (a fallback channel) would
  need a separate vendor, so it's deferred: `SmsProvider` + `NullSmsProvider` exist so a
  Hubtel/Termii-SMS implementation can drop in later without touching callers.
- **OTP moves to WhatsApp.** The `/lookup` OTP is sent via a WhatsApp **Authentication** template
  instead of SMS.
- **Business verification is on the critical path.** Meta business verification (2–10 business
  days) gates production sending volume — same delay ADR-0002 flagged, unavoidable either way.
- **We operate our own webhook** (`/api/webhooks/whatsapp`) for delivery receipts + inbound
  messages, authenticated by `X-Hub-Signature-256`. A BSP would have hidden this.
- Every send is still recorded in **`NotificationLog`** for audit.

## Implementation

Config `services.whatsapp` (provider switch `log` | `whatsapp_cloud`); `WhatsAppCloudProvider` +
`LogOnlyProvider` (dev); `SendClientNotification` queued job with an email mirror; the webhook
controller; WhatsApp-OTP `/lookup`. Portal setup steps for the operator live in
[WHATSAPP-SETUP.md](../WHATSAPP-SETUP.md).
