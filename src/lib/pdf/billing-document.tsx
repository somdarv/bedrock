import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";
import { LOGO_ASPECT, brand, company } from "./brand";

/**
 * The SaharaBase billing document — the one layout every invoice and receipt we issue is drawn
 * in, whatever raised it: a work package (package-document.tsx) or a standalone invoice
 * (invoice-document.tsx). Both build a BillingModel and hand it here, so the two can never
 * drift into looking like documents from different companies.
 *
 * The layout clients already know from Stripe: document title + a meta block, issuer and bill-to
 * columns, one headline amount, an itemised table, and a right-aligned totals ladder. Dressed in
 * the house style (logo letterhead, Sora display + General Sans text, monochrome ink/paper).
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
  memo: { fontSize: 9, color: brand.muted, marginTop: 12, lineHeight: 1.6 },

  // Pay button. A filled box rather than a text link: on a document read on a phone it has to
  // look pressable, and the whole box is the annotation's hit area.
  payRow: { flexDirection: "row", marginTop: 14 },
  payButton: {
    backgroundColor: brand.ink,
    color: brand.paper,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.2,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 4,
    textDecoration: "none",
  },
  payNote: { fontSize: 8, color: brand.faint, marginTop: 6 },

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
  // Exchange note on a dollar-denominated document. Bordered and full width rather than tucked
  // under the totals: a client who misses it has no idea what to actually send.
  fxNote: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: brand.line,
    backgroundColor: brand.panel,
    borderRadius: 3,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontSize: 8,
    color: brand.body,
    lineHeight: 1.5,
  },

  // secondary sections (schedule / payment history)
  section: { marginTop: 32 },
  sectionHead: { fontFamily: "Sora", fontSize: 11, fontWeight: 600, color: brand.ink, marginBottom: 8 },
  cellWide: { flex: 1, fontSize: 9.5, color: brand.ink, paddingRight: 14 },
  cellMid: { width: 128, fontSize: 9.5, color: brand.muted, paddingRight: 14 },
  thMid: { width: 128 },

  // Scan-to-verify stamp. Kept deliberately compact: it sits in flow at the end of the
  // document, and a taller block would push itself onto a page of its own on longer invoices.
  verify: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: brand.line,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  verifyHead: { fontSize: 9, fontWeight: 600, color: brand.ink, marginBottom: 3 },
  verifyMeta: { fontSize: 8, color: brand.muted, lineHeight: 1.5 },
  verifyLead: { fontSize: 8, color: brand.muted, lineHeight: 1.5, maxWidth: 360, marginBottom: 5 },
  stamp: { alignItems: "center" },
  qrBox: { width: 50, height: 50, borderWidth: 1, borderColor: brand.line, padding: 3 },
  qrImg: { width: 42, height: 42 },
  scan: { marginTop: 3, fontSize: 7, fontWeight: 600, color: brand.muted, textTransform: "uppercase", letterSpacing: 0.8 },

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
export function amount(n: number) {
  return nf.format(n);
}

/**
 * Figure with the currency spelled out, for the headline and the settled row.
 *
 * The code is always spelled out rather than shown as a symbol: General Sans carries no cedi
 * glyph (U+20B5), so a ₵ comes out as a blank box — and on a document that may quote two
 * currencies, "GHS"/"USD" removes any doubt about which one a number is in.
 */
export function money(n: number, code = "GHS") {
  return `${code} ${nf.format(n)}`;
}

export function fmtDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtLongDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export interface BillingParty {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface BillingLine {
  id: string;
  description: string;
  /** Muted second line under the description (e.g. the items rolled into a fixed price). */
  sub?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  amount: number;
}

/** A row in the secondary table: the payment schedule on an invoice, the history on a receipt. */
export interface BillingSubRow {
  id: string;
  label: string;
  /** Muted second line under the label (e.g. the receipt number for a payment). */
  sub?: string | null;
  middle: string;
  amount: number;
}

export interface BillingModel {
  variant: "invoice" | "receipt";
  /** Printed document number, e.g. "SB-8F1C-2A90" or "INV-GIGCOT-07". */
  number: string;
  /** What the figures below are denominated in. "GHS" unless the invoice is priced in dollars. */
  currency?: string;
  /**
   * The exchange note printed under the totals on a dollar-denominated document: what the
   * dollar total came to in cedis, at what rate, on what date, and that the rate is confirmed
   * when they pay. Without it a client holding a USD invoice has no idea what to send.
   */
  fxNote?: string | null;
  /** Label/value rows printed under the title. */
  meta: { label: string; value: string }[];
  billTo?: BillingParty | null;
  headline: string;
  headlineSub?: string | null;
  memo: string;
  /** Where the Pay button points. Omitted on a settled or unpayable document. */
  payUrl?: string | null;
  /** Show the qty/unit-price columns. A single fixed price reads better without them. */
  itemised: boolean;
  lines: BillingLine[];
  total: number;
  paid: number;
  due: number;
  /** Secondary table: schedule (invoice) or payment history (receipt). */
  subTable?: { heading: string; columns: [string, string, string]; rows: BillingSubRow[] } | null;
  /** Printed in the verify stamp as the issue date. */
  issuedDate?: string | null;
  verify: { reference: string; serial: string; qr: string };
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

export function BillingDocument({ model, logo }: { model: BillingModel; logo: string }) {
  const isReceipt = model.variant === "receipt";
  const { number, verify } = model;
  const code = model.currency ?? "GHS";

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
          {model.meta.map((row) => (
            <MetaRow key={row.label} label={row.label} value={row.value} />
          ))}
        </View>

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.partyHead}>{company.name}</Text>
            <Text style={s.partyLine}>{company.addressLine}</Text>
            <Text style={s.partyLine}>Ghana</Text>
            <Text style={s.partyLine}>{company.phone}</Text>
            <Text style={s.partyLine}>{company.website}</Text>
          </View>
          {model.billTo ? (
            <View style={s.party}>
              <Text style={s.partyHead}>Bill to</Text>
              <Text style={s.partyLine}>{model.billTo.name}</Text>
              {model.billTo.contactName && model.billTo.contactName !== model.billTo.name ? (
                <Text style={s.partyLine}>{model.billTo.contactName}</Text>
              ) : null}
              {model.billTo.email ? <Text style={s.partyLine}>{model.billTo.email}</Text> : null}
              {model.billTo.phone ? <Text style={s.partyLine}>{model.billTo.phone}</Text> : null}
            </View>
          ) : (
            <View style={s.party} />
          )}
        </View>

        <Text style={s.headline}>{model.headline}</Text>
        {model.headlineSub ? <Text style={s.headlineSub}>{model.headlineSub}</Text> : null}

        {/* The Pay button. The PDF travels by WhatsApp and email, so this is often the only
            route back to us the reader has in front of them — it opens the invoice's own page,
            which starts the Paystack checkout. */}
        {model.payUrl ? (
          <>
            <View style={s.payRow}>
              <Link src={model.payUrl} style={s.payButton}>
                Pay now
              </Link>
            </View>
            <Text style={s.payNote}>
              Card or mobile money · secure checkout · {model.payUrl.replace(/^https?:\/\//, "")}
            </Text>
          </>
        ) : null}

        <Text style={s.memo}>{model.memo}</Text>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, s.cellDesc]}>Description</Text>
            {model.itemised ? (
              <>
                <Text style={[s.th, s.thQty]}>Qty</Text>
                <Text style={[s.th, s.thUnit]}>Unit price</Text>
              </>
            ) : null}
            <Text style={[s.th, s.thAmt]}>Amount</Text>
          </View>

          {model.lines.map((line) => (
            <View style={s.row} key={line.id} wrap={false}>
              <View style={s.cellDesc}>
                <Text style={s.desc}>{line.description}</Text>
                {line.sub ? <Text style={s.descSub}>{line.sub}</Text> : null}
              </View>
              {model.itemised ? (
                <>
                  <Text style={s.cellQty}>{line.quantity ?? 1}</Text>
                  <Text style={s.cellUnit}>{amount(line.unitPrice ?? line.amount)}</Text>
                </>
              ) : null}
              <Text style={s.cellAmt}>{amount(line.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals} wrap={false}>
          <TotalRow label="Subtotal" value={amount(model.total)} />
          <TotalRow label="Total" value={amount(model.total)} />
          {isReceipt ? (
            <>
              {model.due > 0 ? <TotalRow label="Balance remaining" value={amount(model.due)} /> : null}
              <View style={s.settledRow}>
                <Text style={s.settledLabel}>Amount paid</Text>
                <Text style={s.settledValue}>{money(model.paid, code)}</Text>
              </View>
            </>
          ) : (
            <>
              {model.paid > 0 ? <TotalRow label="Amount paid" value={amount(model.paid)} /> : null}
              <View style={s.settledRow}>
                <Text style={s.settledLabel}>Amount due</Text>
                <Text style={s.settledValue}>{money(model.due, code)}</Text>
              </View>
            </>
          )}
        </View>
        {/* The exchange note names the currency itself, so the standalone note would only repeat
            it — and a line saved here is what keeps a short invoice on one page. */}
        {model.fxNote ? null : (
          <Text style={s.currencyNote}>
            {code === "USD"
              ? "All amounts in US dollars (USD)."
              : "All amounts in Ghana cedis (GHS)."}
          </Text>
        )}

        {/* What the dollar total comes to in cedis, and the honest caveat that the figure moves.
            The document is a snapshot; the invoice's own page is the live record. */}
        {model.fxNote ? <Text style={s.fxNote}>{model.fxNote}</Text> : null}

        {/* A short schedule/history moves to the next page whole rather than leaving a widow
            row behind its heading; a long one is allowed to wrap so it can't overflow a page. */}
        {model.subTable && model.subTable.rows.length > 0 ? (
          <View style={s.section} wrap={model.subTable.rows.length > 10}>
            <Text style={s.sectionHead}>{model.subTable.heading}</Text>
            <View style={s.thead}>
              <Text style={[s.th, s.cellDesc]}>{model.subTable.columns[0]}</Text>
              <Text style={[s.th, s.thMid]}>{model.subTable.columns[1]}</Text>
              <Text style={[s.th, s.thAmt]}>{model.subTable.columns[2]}</Text>
            </View>
            {model.subTable.rows.map((row) => (
              <View style={s.row} key={row.id} wrap={false}>
                {row.sub ? (
                  <View style={s.cellDesc}>
                    <Text style={s.desc}>{row.label}</Text>
                    <Text style={s.descSub}>{row.sub}</Text>
                  </View>
                ) : (
                  <Text style={s.cellWide}>{row.label}</Text>
                )}
                <Text style={s.cellMid}>{row.middle}</Text>
                <Text style={s.cellAmt}>{amount(row.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Scan-to-verify stamp — the QR resolves to a page built from live data, so a re-keyed
            or forged copy of this document contradicts what the reader sees there. */}
        <View style={s.verify} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={s.verifyHead}>Verify this {isReceipt ? "receipt" : "invoice"}</Text>
            <Text style={s.verifyLead}>
              Scan the code, or enter the reference at{" "}
              {VERIFY_BASE_URL.replace(/^https?:\/\//, "")}/verify, to confirm this document came
              from us and still matches our records.
            </Text>
            <Text style={s.verifyMeta}>
              Reference {verify.reference} · Serial {verify.serial}
            </Text>
            <Text style={s.verifyMeta}>
              Issued {fmtDate(model.issuedDate)} · Generated on system SAH-HUB-BILL-2026
            </Text>
          </View>
          <View style={s.stamp}>
            <View style={s.qrBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={verify.qr} style={s.qrImg} />
            </View>
            <Text style={s.scan}>Scan to verify</Text>
          </View>
        </View>

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
