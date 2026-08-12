# Receivables & the Milestones model

> Design note for the "where is my money stuck" work. Read alongside [ARCHITECTURE.md](./ARCHITECTURE.md).
> **Status:** read-only dashboard shipped; milestones model in progress. **Date:** 2026-07-16.

## The problem

Two gaps in the money model:

1. **Accepted proposals that haven't paid are invisible as money.** The lifecycle knows a package is
   `awaiting_deposit`, but not *how much* the first payment should be. So "pending initial deposits =
   GHS 15,000" is uncomputable — `balance()` only knows total minus paid.
2. **The gated-download model doesn't fit web work.** Graphic design gates the deliverable behind a
   paywall (low-res preview, locked originals). A website is live and visible; you cannot hide it. The
   leverage for web is **deployment and handover**, not download.

## The one primitive that solves both: milestones

Each package carries an ordered **payment schedule** — a list of milestones, each with an amount and a
paid/unpaid state. This single addition powers both asks:

- **The money pipeline** is just unpaid milestones, grouped by stage. Milestone #1 (the deposit) unpaid
  across all accepted proposals *is* "pending initial deposits", with the exact figure.
- **Web projects get a step-1..N progression** for free — milestones are the steps, and each unlocks the
  next phase (deploy to production, connect the client's domain, hand over credentials).

### Delivery mode

`work_packages.delivery_mode`:

- `gated_files` (default; graphic design) — today's behaviour. Download gate = balance 0 unlocks originals.
  Its schedule is usually just two milestones (deposit + final).
- `milestones` (web / systems) — the gate is **handover**: work is visible on staging; paying a milestone
  unlocks the next phase; the final milestone transfers ownership (admin credentials, hosting, repo). No
  file paywall.

Graphic design keeps working unchanged; `milestones` mode is additive.

## Data model

```
work_packages
  + delivery_mode  string  default 'gated_files'   -- gated_files | milestones

milestones
  id                ulid pk
  work_package_id   ulid fk -> work_packages (cascade)
  position          int                              -- order in the schedule
  label             string                           -- "Deposit", "Design sign-off", "Launch", ...
  amount            decimal(12,2)
  kind              string                           -- deposit | progress | final
  status            string default 'pending'         -- pending | paid
  paid_at           timestamp nullable
  timestamps

payments
  + milestone_id    ulid fk -> milestones nullable (nullOnDelete)  -- which milestone this settled
```

**Money stays derived.** `effectiveTotal()` and `balance()` are unchanged (total minus successful
payments). Milestones are the *plan*; payments are the *actuals*. A milestone is marked `paid` when a
payment is allocated to it. Milestone amounts should sum to the effective total, but that is a soft
guide, not enforced (partial/ad-hoc payments still work).

**Infrastructure is deliberately NOT a milestone kind.** Per the decision, hosting/domain fees bill
separately (their own charge tied to a `ClientAsset`, so they can recur yearly independent of the
project). That is a later phase; see [INFRASTRUCTURE-MODULE.md](../../bedrock-api/docs/INFRASTRUCTURE-MODULE.md).

## Gate logic (milestones mode)

- **Start gate:** paying the `deposit` milestone flips `awaiting_deposit -> in_progress` (same trigger as
  today, now driven by the milestone rather than a bare deposit payment).
- **Phase gates:** paying a `progress` milestone is the operator's cue to unlock the next phase
  (deploy / connect domain). Enforcement is operator-driven for now; the record is the milestone.
- **Handover gate:** the `final` milestone unpaid means ownership is still held. For `gated_files` packages
  the existing balance-0 download unlock is retained.

## Phases

1. **Read-only dashboard** — shipped. `/admin/receivables`, buckets over existing statuses, full contract
   value for awaiting-deposit (no exact split yet).
2. **Milestones backend** — schema + `Milestone` model + CRUD + payment allocation + `delivery_mode`.
   *(in progress)*
3. **Dashboard upgrade** — buckets read unpaid milestones: exact deposit bucket, per-stage breakdown.
4. **Package UI** — manage the schedule on the package page; set `delivery_mode`; pay a milestone.
5. **Separate infrastructure billing** — charges on `ClientAsset`, its own dashboard bucket. *(shipped)*
6. **Standalone invoices** — shipped. Charges were a ledger with no document; an operator could see
   GHS 600 owed for hosting but had no way to *ask* for it outside a work package. See
   [INVOICES.md](./INVOICES.md).
7. **Retainers** — designed, not built. Recurring service revenue: a third source of billable
   obligations alongside packages and assets, feeding the same charge and invoice layers. See
   [RETAINERS.md](./RETAINERS.md).

## Decisions (from the operator)

- Deposit is **per-proposal** (an explicit `deposit` milestone amount), not a house %.
- Infrastructure bills **separately** from project work.
- Ship the **read-only** view first (done), then this model.
