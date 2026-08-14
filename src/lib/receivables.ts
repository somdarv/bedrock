import { unbilled, type InfraChargeRow, type Invoice, type WorkPackage } from "@/lib/api";
import { outstandingCedis } from "@/lib/invoices/display";

/**
 * The one definition of "outstanding" in the admin.
 *
 * Money reaches us down three routes and the dashboard used to see only the first, so its
 * headline figure disagreed with both Receivables and Invoices. They all read this module now:
 * one function, one answer, wherever it is shown.
 *
 *   jobs     — work packages, accepted or live, not yet billed on an invoice
 *   accounts — ongoing account fees (hosting, domains) owed but not yet put on a document
 *   invoices — invoices issued against a client and not yet settled
 *
 * The routes are disjoint by construction: an invoice raised for a package removes that money
 * from `unbilled()`, and a charge billed on one drops out of the pending-charge list. Nothing
 * is counted twice, which is the whole reason these three can be added together at all.
 */

/**
 * Accepted and live work: money the client is committed to, whatever stage it is stuck at.
 * Proposals (`sent`) are deliberately absent — until one is accepted it is pipeline, and calling
 * it outstanding would report money nobody has promised us yet.
 */
export const COMMITTED_STATUSES: WorkPackage["status"][] = [
  "awaiting_deposit",
  "in_progress",
  "review",
  "awaiting_final_payment",
];

/** Sent, awaiting a decision. Potential — never part of an outstanding figure. */
export const PIPELINE_STATUSES: WorkPackage["status"][] = ["sent"];

/** Jobs gated on money rather than on work: what an operator can actually chase today. */
export const CHASEABLE_STATUSES: WorkPackage["status"][] = [
  "awaiting_deposit",
  "awaiting_final_payment",
];

/**
 * An account fee restated in cedis. Hosting and domains are bought in dollars, so a charge can
 * be denominated in USD — dropping that figure straight into a cedi sum understates it by
 * roughly thirteen times.
 *
 * Null when a dollar charge has no rate to convert at: better to say the total excludes it than
 * to quietly add a dollar figure wearing a ₵ sign.
 */
export function chargeCedis(
  charge: Pick<InfraChargeRow, "amount" | "currency">,
  rate: number | null,
): number | null {
  // Older rows predate the currency column; they are cedis.
  if ((charge.currency ?? "GHS") !== "USD") return charge.amount;
  return rate ? Math.round(charge.amount * rate * 100) / 100 : null;
}

export interface OutstandingTotals {
  /** Committed work not yet on an invoice. */
  jobs: number;
  /** Pending ongoing-account fees, in cedis. */
  accounts: number;
  /** Issued invoice balances, in cedis. */
  invoices: number;
  /** Everything owed, in cedis. */
  total: number;
  /** Dollar fees with no rate to convert at, so left out of `total`. Usually zero. */
  unconvertedUsd: number;
}

export function outstandingTotals(input: {
  packages: WorkPackage[];
  charges: InfraChargeRow[];
  invoices: Invoice[];
  /** Today's billing rate (FxState.effectiveRate) — what a dollar fee would be billed at. */
  fxRate: number | null;
}): OutstandingTotals {
  const jobs = input.packages
    .filter((p) => COMMITTED_STATUSES.includes(p.status))
    .reduce((sum, p) => sum + unbilled(p), 0);

  let accounts = 0;
  let unconvertedUsd = 0;
  for (const charge of input.charges) {
    const cedis = chargeCedis(charge, input.fxRate);
    if (cedis === null) unconvertedUsd += charge.amount;
    else accounts += cedis;
  }

  const invoices = input.invoices.reduce((sum, i) => sum + outstandingCedis(i), 0);

  return {
    jobs: round2(jobs),
    accounts: round2(accounts),
    invoices: round2(invoices),
    total: round2(jobs + accounts + invoices),
    unconvertedUsd: round2(unconvertedUsd),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
