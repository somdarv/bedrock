# ADR 0001 — Next.js frontend + separate Laravel API, custom admin

**Status:** Accepted · **Date:** 2026-06-19

## Decision

Split the system into two repos: this **Next.js** frontend and a separate **Laravel** API-only
backend. The frontend hosts both the public client portal and a **custom, hand-built admin**
(`/admin`). **Filament is not used.**

## Why

- A custom Next.js admin gives full control of the business-end UX, in one frontend codebase
  shared with the client portal (components, types, design system).
- An API-only Laravel backend keeps payment/state logic, queues, webhooks, and the media pipeline
  server-side and reusable, with independent deploys.
- The brief flagged the Next.js-vs-monolith question as the key open fork; the custom split was
  chosen over a Laravel + Filament monolith.

## Consequences

- Two repos, two deploys, a CORS/auth surface between them.
- The frontend builds against a documented API contract with a mock layer so it is not blocked on
  the backend — see [ARCHITECTURE §2–§3](../ARCHITECTURE.md).
- Admin auth uses Sanctum tokens in an httpOnly cookie; the client portal stays public via UUID.
