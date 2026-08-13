import {
  balance,
  discountOn,
  discountRate,
  effectiveTotal,
  lineGross,
  lineNet,
  packageDiscount,
  subtotal as packageSubtotal,
  savings as packageSavings,
  type Milestone,
  type Payment,
  type WorkPackage,
} from "@/lib/api";
import { publicBaseUrl } from "@/lib/utils";
import {
  BillingDocument,
  discountRowLabel,
  fmtDate,
  fmtLongDate,
  money,
  type BillingLine,
  type BillingModel,
  type BillingSubRow,
} from "./billing-document";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";

/**
 * Invoice / receipt for a work package. All the drawing lives in billing-document.tsx — this
 * file's only job is to say what a work package means in billing terms, so a package invoice and
 * a standalone invoice (invoice-document.tsx) come out as the same document.
 */

/** Receipt number derived from the settling payment's gateway reference (or its id). */
function receiptNo(p: Payment) {
  const raw = (p.paystackReference ?? p.id).replace(/[^a-z0-9]/gi, "").toUpperCase();
  const twelve = raw.slice(-12).padStart(12, "0");
  return `${twelve.slice(0, 4)}-${twelve.slice(4, 8)}-${twelve.slice(8)}`;
}

/** How a payment reached us, in words the client recognises ("mobile_money" → "Mobile money"). */
function methodLabel(p: Payment) {
  const method = p.method?.trim().replace(/[_-]+/g, " ");
  if (method) return method.charAt(0).toUpperCase() + method.slice(1);
  return p.paystackReference ? "Card / mobile money" : "Payment";
}

function milestoneState(m: Milestone) {
  if (m.status !== "paid") return "Due";
  return m.paidAt ? `Paid ${fmtDate(m.paidAt)}` : "Paid";
}

export function packageBillingModel({
  pkg,
  variant,
  verify,
}: {
  pkg: WorkPackage;
  variant: "invoice" | "receipt";
  verify: { reference: string; number: string; serial: string; qr: string };
}): BillingModel {
  const isReceipt = variant === "receipt";
  const isFixed = pkg.pricingMode === "fixed";
  const total = effectiveTotal(pkg);
  // The lines net of anything discounted on them, which is what the Amount column adds up to.
  // The package-wide discount is taken off it in the ladder, not folded into the lines.
  const subtotal = packageSubtotal(pkg);
  const discountOff = packageDiscount(pkg);
  const settledPayments = pkg.payments.filter((p) => p.status === "success");
  const paid = settledPayments.reduce((sum, p) => sum + p.amount, 0);
  const due = Math.max(0, balance(pkg));
  const lastPayment = settledPayments[settledPayments.length - 1];
  const milestones = [...pkg.milestones].sort((a, b) => a.position - b.position);
  const nextStep = milestones.find((m) => m.status === "pending") ?? null;

  // NEXT_PUBLIC_APP_URL is not set everywhere; the verify origin is the same host and always is.
  const base = publicBaseUrl() || VERIFY_BASE_URL;
  const portalUrl = base ? `${base}/p/${pkg.publicSlug}` : null;

  const meta: BillingModel["meta"] = [];
  if (isReceipt && lastPayment) meta.push({ label: "Receipt number", value: receiptNo(lastPayment) });
  meta.push({ label: "Invoice number", value: verify.number });
  if (isReceipt) {
    if (lastPayment) meta.push({ label: "Date paid", value: fmtDate(lastPayment.paidAt) });
  } else {
    meta.push({ label: "Date of issue", value: fmtDate(pkg.createdAt) });
  }
  meta.push({ label: "Project", value: pkg.title });
  if (pkg.estimatedDeliveryDate) {
    meta.push({ label: "Estimated delivery", value: fmtDate(pkg.estimatedDeliveryDate) });
  }

  // A fixed price prints as one line without qty/unit columns; anything itemised keeps them.
  // Every branch prints the SUBTOTAL, never the discounted total: the ladder below is what
  // takes the package discount off, and a line already net of it would deduct it twice.
  let lines: BillingLine[];
  if (isFixed) {
    lines = [
      {
        id: pkg.id,
        description: pkg.title,
        sub: pkg.lineItems.length > 0 ? pkg.lineItems.map((li) => li.description).join(" · ") : null,
        amount: subtotal,
      },
    ];
  } else if (pkg.lineItems.length === 0) {
    lines = [{ id: pkg.id, description: pkg.title, quantity: 1, unitPrice: subtotal, amount: subtotal }];
  } else {
    lines = pkg.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      discountAmount: discountOn(lineGross(li), li.discountType, li.discountValue),
      discountRate: discountRate(li.discountType, li.discountValue),
      amount: lineNet(li),
    }));
  }

  let subTable: BillingModel["subTable"] = null;
  if (!isReceipt && milestones.length > 0) {
    subTable = {
      heading: "Payment schedule",
      columns: ["Step", "Status", "Amount"],
      rows: milestones.map<BillingSubRow>((m) => ({
        id: m.id,
        label: m.label,
        middle: milestoneState(m),
        amount: m.amount,
      })),
    };
  } else if (isReceipt && settledPayments.length > 0) {
    subTable = {
      heading: "Payment history",
      columns: ["Payment method", "Date", "Amount paid"],
      rows: settledPayments.map<BillingSubRow>((p) => ({
        id: p.id,
        label: methodLabel(p),
        sub: `Receipt ${receiptNo(p)}`,
        middle: fmtDate(p.paidAt),
        amount: p.amount,
      })),
    };
  }

  return {
    variant,
    number: verify.number,
    meta,
    billTo: pkg.billTo ?? null,
    headline: isReceipt
      ? settledPayments.length === 0
        ? "No payments recorded yet"
        : `${money(paid)} paid on ${fmtLongDate(lastPayment.paidAt)}`
      : due <= 0
        ? `${money(total)} paid in full`
        : `${money(due)} due on receipt`,
    headlineSub:
      !isReceipt && nextStep && due > 0 ? `Next step: ${nextStep.label} · ${money(nextStep.amount)}` : null,
    memo: isReceipt
      ? "Thank you. This receipt confirms the payments listed below. Your project page stays up to date with progress and anything still outstanding."
      : due > 0
        ? "Pay by card or mobile money from your project page, where you can also follow progress and see each payment as it clears."
        : "This invoice is settled in full. Your project page keeps the record of every payment received.",
    payUrl: !isReceipt && due > 0 ? portalUrl : null,
    itemised: !isFixed,
    lines,
    subtotal,
    discount:
      discountOff > 0
        ? {
            label: discountRowLabel(pkg.discountLabel, pkg.discountType, pkg.discountValue),
            amount: discountOff,
          }
        : null,
    savings: packageSavings(pkg),
    total,
    paid,
    due,
    subTable,
    issuedDate: isReceipt ? lastPayment?.paidAt : pkg.createdAt,
    verify: { reference: verify.reference, serial: verify.serial, qr: verify.qr },
  };
}

export function PackageDocument({
  pkg,
  variant,
  logo,
  verify,
}: {
  pkg: WorkPackage;
  variant: "invoice" | "receipt";
  /** SaharaBase wordmark as a data URI (from brand.logoDataUri()). */
  logo: string;
  /** Verification identity + QR (from packageDocumentRefs, built in render.tsx). */
  verify: { reference: string; number: string; serial: string; qr: string };
}) {
  return <BillingDocument model={packageBillingModel({ pkg, variant, verify })} logo={logo} />;
}
