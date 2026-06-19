# Bedrock — Frontend Build Plan (admin-first)

The build order for **this Next.js repo**, starting from the business end — the **admin** — before
the public client portal. The admin is what lets you actually run jobs; the portal is worthless
until there are packages to show.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design these phases implement.

## Dependency stance

The frontend builds against the **documented API contract** (ARCHITECTURE §3–§4), not a finished
backend. Each phase ships against a thin **mock/fixture API layer** in `lib/api` behind the same
typed interface as the real client, swapped for live Laravel endpoints as they land — so frontend
progress is **never blocked** on the separate backend repo. Every phase ends in something runnable
and demoable.

---

## Phase 0 — Scaffold & foundations ✅ done

- Next.js App Router + TypeScript; Tailwind; ESLint/Prettier; env config.
- Route-group skeleton: `(public)` and `(admin)`; base layouts.
- **API client layer** (`lib/api`): typed fetch wrapper, shared DTO types mirroring the contract,
  and the swappable mock/fixture backend.
- **Design-system primitives** with SaharaBase branding: buttons, inputs, form fields, table,
  modal/drawer, toast, status badge, empty/loading states.

**Exit:** app boots, lint/CI green, a styled placeholder page in each route group.

---

## Phase 1 — Admin auth & shell ✅ done

- Login page → Sanctum token stored in an httpOnly cookie; logout.
- Protected `(admin)` layout that guards every admin route server-side; redirect unauthenticated.
- Admin shell: sidebar/nav, header, session display.

**Exit:** can log in, land on an empty dashboard, stay authenticated across reloads, log out.

---

## Phase 2 — Clients ✅ done

- Client list (search), create/edit form (name, WhatsApp, email, phone), client detail showing
  their packages.

**Exit:** full CRUD of clients against the API layer.

---

## Phase 3 — Work Packages core (the spine) ✅ done

- Create a package under a client; package list + detail view; status badge.
- **Line items CRUD** with live subtotal.
- **Dual-mode pricing UI:** toggle `itemized` vs `fixed`; in fixed mode capture `total_override`
  and visually de-emphasize line-item prices; show resolved **effectiveTotal** + balance live.
- Estimated delivery date; **generate + copy the public UUID link**.

**Exit:** a package can be fully built and priced both ways; effectiveTotal/balance correct.

---

## Phase 4 — Lifecycle & activity ✅ done

- Status transition controls (Draft → Sent → … → Closed) with the allowed-transition rules.
- "Send invoice / link" action (triggers backend Termii/email); toggle **line items done** to
  drive the progress bar.
- **Activity-log timeline** on the package detail.

**Exit:** a package can be driven through its whole lifecycle from the admin.

---

## Phase 5 — Deliverables (admin upload) ✅ done

- Upload originals (image / PDF / video) to the package; show per-file **processing status** and
  generated **preview** thumbnails; show **locked** state.

**Exit:** originals upload, previews appear once the backend pipeline returns, lock state visible.

---

## Phase 6 — Payments & gates visibility

- Payments panel per package (deposit + final): amounts, references, status, paid-at; live
  **balance** and **gate state** (start/download) read from the API.
- Receipt / payment-complete surfacing.

**Exit:** admin can see exactly where money and gates stand for any package.

---

## Phase 7 — Notifications visibility (light)

- Notification log per package (event, channel, status); manual resend action.

**Exit:** admin can audit/resend client comms.

---

## After the admin: the public client portal

Once Phases 0–7 land, the public client portal follows as its own block:

- Package view by UUID (`/p/[slug]`).
- Watermarked preview gallery.
- Paystack-inline pay button.
- OTP lookup page.
- Post-payment signed-download buttons.

Sequenced after the admin per the build priority; detailed when we reach it.
