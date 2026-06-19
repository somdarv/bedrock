# ADR 0002 — Termii as the single messaging vendor

**Status:** Accepted · **Date:** 2026-06-19

## Decision

Use **Termii** as the single vendor for all client messaging: WhatsApp templates, SMS, and OTP.
Integrate it behind a `MessagingProvider` interface in the Laravel repo.

## Why

- Africa-focused with strong Ghana coverage; WhatsApp + SMS + OTP in one API means one
  integration instead of two (vs 360dialog, which is WhatsApp-only and would need a separate SMS
  vendor).
- WhatsApp goes through the official Cloud API with pre-approved templates — never unofficial
  libraries.

## Consequences

- Accept the Meta Business verification delay to ship WhatsApp + email from v1.
- The `MessagingProvider` abstraction keeps Twilio/360dialog swappable by config later.
- Every send is recorded in `NotificationLog` for audit — see [ARCHITECTURE §8](../ARCHITECTURE.md).
