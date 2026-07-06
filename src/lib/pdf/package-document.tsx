import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { balance, effectiveTotal, type WorkPackage } from "@/lib/api";
import { formatCedis } from "@/lib/utils";

/**
 * Invoice / receipt PDF for a work package, rendered by @react-pdf/renderer (pure Node —
 * no headless browser). Monochrome ink/paper to match the SaharaBase house style. Built
 * from package data only (no client PII — it's delivered straight to the client).
 */

const ink = "#1c1917";
const muted = "#78716c";
const border = "#e7e5e4";

const s = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 52, fontSize: 10, color: ink, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  brandSub: { fontSize: 8, color: muted, marginTop: 3, letterSpacing: 1.5, textTransform: "uppercase" },
  docType: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  metaLabel: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 1 },
  metaValue: { fontSize: 10, marginTop: 2 },
  metaRight: { textAlign: "right", marginTop: 6 },
  section: { marginTop: 8 },
  projectTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: ink, paddingBottom: 5, marginTop: 22 },
  th: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 1 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: border, paddingVertical: 7 },
  cellDesc: { flex: 1, paddingRight: 12 },
  cellAmt: { width: 110, textAlign: "right" },
  totals: { marginTop: 16, marginLeft: "auto", width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { color: muted },
  grandRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: ink },
  grandLabel: { fontFamily: "Helvetica-Bold" },
  grandValue: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  payHead: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 1, marginTop: 26, marginBottom: 6 },
  footer: { position: "absolute", bottom: 36, left: 52, right: 52, borderTopWidth: 1, borderTopColor: border, paddingTop: 10, fontSize: 8, color: muted, flexDirection: "row", justifyContent: "space-between" },
});

function shortRef(slug: string) {
  return slug.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function fmtDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function PackageDocument({ pkg, variant }: { pkg: WorkPackage; variant: "invoice" | "receipt" }) {
  const isReceipt = variant === "receipt";
  const isFixed = pkg.pricingMode === "fixed";
  const total = effectiveTotal(pkg);
  const paid = pkg.payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0);
  const due = Math.max(0, balance(pkg));
  const settledPayments = pkg.payments.filter((p) => p.status === "success");

  return (
    <Document title={`${isReceipt ? "Receipt" : "Invoice"} ${shortRef(pkg.publicSlug)}`}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.brand}>SaharaBase</Text>
            <Text style={s.brandSub}>Technologies · Accra, Ghana</Text>
          </View>
          <View>
            <Text style={s.docType}>{isReceipt ? "RECEIPT" : "INVOICE"}</Text>
            <View style={s.metaRight}>
              <Text style={s.metaLabel}>Reference</Text>
              <Text style={s.metaValue}>{shortRef(pkg.publicSlug)}</Text>
            </View>
            <View style={s.metaRight}>
              <Text style={s.metaLabel}>{isReceipt ? "Issued" : "Date"}</Text>
              <Text style={s.metaValue}>{fmtDate(isReceipt ? null : pkg.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.metaLabel}>Project</Text>
          <Text style={[s.projectTitle, { marginTop: 3 }]}>{pkg.title}</Text>
          {pkg.estimatedDeliveryDate ? (
            <Text style={{ color: muted, marginTop: 2 }}>
              Estimated delivery {fmtDate(pkg.estimatedDeliveryDate)}
            </Text>
          ) : null}
        </View>

        <View style={s.tableHead}>
          <Text style={[s.th, s.cellDesc]}>{isFixed ? "Scope" : "Description"}</Text>
          {!isFixed ? <Text style={[s.th, s.cellAmt]}>Amount</Text> : null}
        </View>

        {pkg.lineItems.length === 0 ? (
          <View style={s.row}>
            <Text style={s.cellDesc}>—</Text>
            {!isFixed ? <Text style={s.cellAmt}>—</Text> : null}
          </View>
        ) : (
          pkg.lineItems.map((li) => (
            <View style={s.row} key={li.id}>
              <Text style={s.cellDesc}>
                {li.description}
                {!isFixed && li.quantity > 1 ? `  ×${li.quantity}` : ""}
              </Text>
              {!isFixed ? <Text style={s.cellAmt}>{formatCedis(li.quantity * li.unitPrice)}</Text> : null}
            </View>
          ))
        )}

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Project total</Text>
            <Text>{formatCedis(total)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Paid</Text>
            <Text>{formatCedis(paid)}</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>{isReceipt && due <= 0 ? "Paid in full" : "Balance due"}</Text>
            <Text style={s.grandValue}>{formatCedis(due)}</Text>
          </View>
        </View>

        {isReceipt && settledPayments.length > 0 ? (
          <View wrap={false}>
            <Text style={s.payHead}>Payments received</Text>
            {settledPayments.map((p) => (
              <View style={s.row} key={p.id}>
                <Text style={s.cellDesc}>
                  {fmtDate(p.paidAt)}
                  {p.method ? `  ·  ${p.method}` : ""}
                </Text>
                <Text style={s.cellAmt}>{formatCedis(p.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text>SaharaBase Technologies</Text>
          <Text>{isReceipt ? "Thank you for your payment." : "Payable to SaharaBase Technologies."}</Text>
        </View>
      </Page>
    </Document>
  );
}
