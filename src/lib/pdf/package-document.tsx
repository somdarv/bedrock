import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { balance, effectiveTotal, type Milestone, type Payment, type WorkPackage } from "@/lib/api";
import { publicBaseUrl } from "@/lib/utils";
import { LOGO_ASPECT, brand, company } from "./brand";

/**
 * Invoice / receipt PDF for a work package, in the billing-document layout clients already know
 * from Stripe: document title + a meta block, issuer and bill-to columns, one headline amount,
 * an itemised table, and a right-aligned totals ladder. Dressed in the SaharaBase house style
 * (logo letterhead, Sora display + General Sans text, monochrome ink/paper).
 *
 * Rendered by @react-pdf/renderer (pure Node — no headless browser). Fonts must be registered
 * (registerBrandFonts) before this renders — done in render.tsx.
 *
 * Money is printed as a plain figure, with "GHS" spelled out on the headline and the settled
 * row: General Sans carries no cedi glyph (U+20B5), so a ₵ would come out as a blank box.
 */

const LOGO_W = 104;

const s = StyleSheet.create({
  // No lineHeight here: a page-level lineHeight makes react-pdf drop absolutely positioned
  // `fixed` children (the footer renders as nothing). Set it on the wrapping text instead.
  page: {
    paddingTop: 46,
    paddingBottom: 62,
    paddingHorizontal: 48,
    fontSize: 9.5,
    color: brand.body,
    fontFamily: "GeneralSans",
  },

  // masthead — document type left, wordmark right
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  docType: { fontFamily: "Sora", fontSize: 26, fontWeight: 700, color: brand.ink, letterSpacing: -0.4 },
  logo: { width: LOGO_W, height: LOGO_W / LOGO_ASPECT },

  // meta block — label/value rows under the title
  meta: { marginTop: 14 },
  metaRow: { flexDirection: "row", paddingVertical: 1.5 },
  metaLabel: { width: 104, fontSize: 9, color: brand.muted },
  metaValue: { fontSize: 9, color: brand.ink, fontWeight: 500 },

  // issuer / bill-to columns
  parties: { flexDirection: "row", gap: 28, marginTop: 26 },
  party: { flex: 1 },
  partyHead: { fontSize: 9, fontWeight: 600, color: brand.ink, marginBottom: 4 },
  partyLine: { fontSize: 9, color: brand.muted, lineHeight: 1.45 },

  // headline amount
  headline: { fontFamily: "Sora", fontSize: 17, fontWeight: 600, color: brand.ink, marginTop: 28, letterSpacing: -0.2 },
  headlineSub: { fontSize: 9.5, color: brand.muted, marginTop: 5 },
  payLink: { fontSize: 9.5, color: brand.ink, fontWeight: 500, textDecoration: "underline", marginTop: 12 },
  memo: { fontSize: 9, color: brand.muted, marginTop: 12, lineHeight: 1.6 },

  // items table
  table: { marginTop: 30 },
  thead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: brand.ink, paddingBottom: 5 },
  th: { fontSize: 8, color: brand.muted, textTransform: "uppercase", letterSpacing: 0.7 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: brand.hair, paddingVertical: 8 },
  cellDesc: { flex: 1, paddingRight: 14 },
  desc: { fontSize: 9.5, color: brand.ink, lineHeight: 1.45 },
  descSub: { fontSize: 8.5, color: brand.muted, marginTop: 2, lineHeight: 1.45 },
  cellQty: { width: 40, textAlign: "right", fontSize: 9.5, color: brand.body },
  cellUnit: { width: 88, textAlign: "right", fontSize: 9.5, color: brand.body },
  cellAmt: { width: 96, textAlign: "right", fontSize: 9.5, color: brand.ink },
  // Header variants carry width/alignment only — a font size here would override s.th.
  thQty: { width: 40, textAlign: "right" },
  thUnit: { width: 88, textAlign: "right" },
  thAmt: { width: 96, textAlign: "right" },

  // totals ladder — right half, hairline above each row
  totals: { marginTop: 14, marginLeft: "auto", width: 268 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: brand.hair, paddingVertical: 5 },
  totalLabel: { fontSize: 9.5, color: brand.muted },
  totalValue: { fontSize: 9.5, color: brand.body },
  settledRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: brand.ink, paddingTop: 7, marginTop: 1 },
  settledLabel: { fontSize: 10, fontWeight: 600, color: brand.ink },
  settledValue: { fontFamily: "Sora", fontSize: 11, fontWeight: 600, color: brand.ink },
  currencyNote: { marginTop: 10, marginLeft: "auto", fontSize: 8, color: brand.faint },

  // secondary sections (schedule / payment history)
  section: { marginTop: 32 },
  sectionHead: { fontFamily: "Sora", fontSize: 11, fontWeight: 600, color: brand.ink, marginBottom: 8 },
  cellWide: { flex: 1, fontSize: 9.5, color: brand.ink, paddingRight: 14 },
  cellMid: { width: 128, fontSize: 9.5, color: brand.muted, paddingRight: 14 },
  thMid: { width: 128 },

  footer: {
    position: "absolute",
    bottom: 34,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: brand.line,
    paddingTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: brand.faint,
  },
});

const nf = new Intl.NumberFormat("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Plain figure, for table cells and the totals ladder. */
function amount(n: number) {
  return nf.format(n);
}

/** Figure with the currency spelled out, for the headline and the settled row. */
function money(n: number) {
  return `GHS ${nf.format(n)}`;
}

function fmtDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtLongDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Invoice number derived from the package's public slug — stable, and readable aloud. */
function invoiceNo(slug: string) {
  const hex = slug.replace(/-/g, "").slice(0, 8).toUpperCase().padEnd(8, "0");
  return `SB-${hex.slice(0, 4)}-${hex.slice(4)}`;
}

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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.totalRow}>
      <Text style={s.totalLabel}>{label}</Text>
      <Text style={s.totalValue}>{value}</Text>
    </View>
  );
}

export function PackageDocument({
  pkg,
  variant,
  logo,
}: {
  pkg: WorkPackage;
  variant: "invoice" | "receipt";
  /** SaharaBase wordmark as a data URI (from brand.logoDataUri()). */
  logo: string;
}) {
  const isReceipt = variant === "receipt";
  const isFixed = pkg.pricingMode === "fixed";
  const total = effectiveTotal(pkg);
  const settledPayments = pkg.payments.filter((p) => p.status === "success");
  const paid = settledPayments.reduce((sum, p) => sum + p.amount, 0);
  const due = Math.max(0, balance(pkg));
  const lastPayment = settledPayments[settledPayments.length - 1];
  const milestones = [...pkg.milestones].sort((a, b) => a.position - b.position);
  const nextStep = milestones.find((m) => m.status === "pending") ?? null;

  const number = invoiceNo(pkg.publicSlug);
  const base = publicBaseUrl();
  const portalUrl = base ? `${base}/p/${pkg.publicSlug}` : null;
  const billTo = pkg.billTo;

  const headline = isReceipt
    ? settledPayments.length === 0
      ? "No payments recorded yet"
      : `${money(paid)} paid on ${fmtLongDate(lastPayment.paidAt)}`
    : due <= 0
      ? `${money(total)} paid in full`
      : `${money(due)} due on receipt`;

  return (
    <Document title={`${isReceipt ? "Receipt" : "Invoice"} ${number}`}>
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <Text style={s.docType}>{isReceipt ? "Receipt" : "Invoice"}</Text>
          {/* react-pdf Image (PDF canvas, not HTML) — no alt attribute exists */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logo} style={s.logo} />
        </View>

        <View style={s.meta}>
          {isReceipt && lastPayment ? <MetaRow label="Receipt number" value={receiptNo(lastPayment)} /> : null}
          <MetaRow label="Invoice number" value={number} />
          {isReceipt ? (
            lastPayment ? (
              <MetaRow label="Date paid" value={fmtDate(lastPayment.paidAt)} />
            ) : null
          ) : (
            <>
              <MetaRow label="Date of issue" value={fmtDate(pkg.createdAt)} />
              <MetaRow label="Date due" value={due > 0 ? "On receipt" : "Settled"} />
            </>
          )}
          <MetaRow label="Project" value={pkg.title} />
          {pkg.estimatedDeliveryDate ? (
            <MetaRow label="Estimated delivery" value={fmtDate(pkg.estimatedDeliveryDate)} />
          ) : null}
        </View>

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.partyHead}>{company.name}</Text>
            <Text style={s.partyLine}>{company.addressLine}</Text>
            <Text style={s.partyLine}>Ghana</Text>
            <Text style={s.partyLine}>{company.phone}</Text>
            <Text style={s.partyLine}>{company.website}</Text>
          </View>
          {billTo ? (
            <View style={s.party}>
              <Text style={s.partyHead}>Bill to</Text>
              <Text style={s.partyLine}>{billTo.name}</Text>
              {billTo.contactName && billTo.contactName !== billTo.name ? (
                <Text style={s.partyLine}>{billTo.contactName}</Text>
              ) : null}
              {billTo.email ? <Text style={s.partyLine}>{billTo.email}</Text> : null}
              {billTo.phone ? <Text style={s.partyLine}>{billTo.phone}</Text> : null}
            </View>
          ) : (
            <View style={s.party} />
          )}
        </View>

        <Text style={s.headline}>{headline}</Text>
        {!isReceipt && nextStep && due > 0 ? (
          <Text style={s.headlineSub}>
            Next step: {nextStep.label} · {money(nextStep.amount)}
          </Text>
        ) : null}

        {!isReceipt && due > 0 && portalUrl ? (
          <Link src={portalUrl} style={s.payLink}>
            Pay online
          </Link>
        ) : null}

        <Text style={s.memo}>
          {isReceipt
            ? "Thank you. This receipt confirms the payments listed below. Your project page stays up to date with progress and anything still outstanding."
            : due > 0
              ? "Pay by card or mobile money from your project page, where you can also follow progress and see each payment as it clears."
              : "This invoice is settled in full. Your project page keeps the record of every payment received."}
        </Text>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, s.cellDesc]}>Description</Text>
            {!isFixed ? (
              <>
                <Text style={[s.th, s.thQty]}>Qty</Text>
                <Text style={[s.th, s.thUnit]}>Unit price</Text>
              </>
            ) : null}
            <Text style={[s.th, s.thAmt]}>Amount</Text>
          </View>

          {isFixed ? (
            <View style={s.row} wrap={false}>
              <View style={s.cellDesc}>
                <Text style={s.desc}>{pkg.title}</Text>
                {pkg.lineItems.length > 0 ? (
                  <Text style={s.descSub}>{pkg.lineItems.map((li) => li.description).join(" · ")}</Text>
                ) : null}
              </View>
              <Text style={s.cellAmt}>{amount(total)}</Text>
            </View>
          ) : pkg.lineItems.length === 0 ? (
            <View style={s.row}>
              <View style={s.cellDesc}>
                <Text style={s.desc}>{pkg.title}</Text>
              </View>
              <Text style={s.cellQty}>1</Text>
              <Text style={s.cellUnit}>{amount(total)}</Text>
              <Text style={s.cellAmt}>{amount(total)}</Text>
            </View>
          ) : (
            pkg.lineItems.map((li) => (
              <View style={s.row} key={li.id} wrap={false}>
                <View style={s.cellDesc}>
                  <Text style={s.desc}>{li.description}</Text>
                </View>
                <Text style={s.cellQty}>{li.quantity}</Text>
                <Text style={s.cellUnit}>{amount(li.unitPrice)}</Text>
                <Text style={s.cellAmt}>{amount(li.quantity * li.unitPrice)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={s.totals} wrap={false}>
          <TotalRow label="Subtotal" value={amount(total)} />
          <TotalRow label="Total" value={amount(total)} />
          {isReceipt ? (
            <>
              {due > 0 ? <TotalRow label="Balance remaining" value={amount(due)} /> : null}
              <View style={s.settledRow}>
                <Text style={s.settledLabel}>Amount paid</Text>
                <Text style={s.settledValue}>{money(paid)}</Text>
              </View>
            </>
          ) : (
            <>
              {paid > 0 ? <TotalRow label="Amount paid" value={amount(paid)} /> : null}
              <View style={s.settledRow}>
                <Text style={s.settledLabel}>Amount due</Text>
                <Text style={s.settledValue}>{money(due)}</Text>
              </View>
            </>
          )}
        </View>
        <Text style={s.currencyNote}>All amounts in Ghana cedis (GHS).</Text>

        {/* A short schedule/history moves to the next page whole rather than leaving a widow
            row behind its heading; a long one is allowed to wrap so it can't overflow a page. */}
        {!isReceipt && milestones.length > 0 ? (
          <View style={s.section} wrap={milestones.length > 10}>
            <Text style={s.sectionHead}>Payment schedule</Text>
            <View style={s.thead}>
              <Text style={[s.th, s.cellDesc]}>Step</Text>
              <Text style={[s.th, s.thMid]}>Status</Text>
              <Text style={[s.th, s.thAmt]}>Amount</Text>
            </View>
            {milestones.map((m) => (
              <View style={s.row} key={m.id} wrap={false}>
                <Text style={s.cellWide}>{m.label}</Text>
                <Text style={s.cellMid}>{milestoneState(m)}</Text>
                <Text style={s.cellAmt}>{amount(m.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {isReceipt && settledPayments.length > 0 ? (
          <View style={s.section} wrap={settledPayments.length > 10}>
            <Text style={s.sectionHead}>Payment history</Text>
            <View style={s.thead}>
              <Text style={[s.th, s.cellDesc]}>Payment method</Text>
              <Text style={[s.th, s.thMid]}>Date</Text>
              <Text style={[s.th, s.thAmt]}>Amount paid</Text>
            </View>
            {settledPayments.map((p) => (
              <View style={s.row} key={p.id} wrap={false}>
                <View style={s.cellDesc}>
                  <Text style={s.desc}>{methodLabel(p)}</Text>
                  <Text style={s.descSub}>Receipt {receiptNo(p)}</Text>
                </View>
                <Text style={s.cellMid}>{fmtDate(p.paidAt)}</Text>
                <Text style={s.cellAmt}>{amount(p.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text>
            {company.name} · {isReceipt ? `Receipt for ${number}` : number}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
