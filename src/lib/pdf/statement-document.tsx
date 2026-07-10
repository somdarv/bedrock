import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AssetStatus, ClientAsset } from "@/lib/api";
import { ASSET_TYPE_LABEL, diskLabel } from "@/lib/infrastructure/display";

/**
 * Infrastructure Status Statement — a per-client "here's where your setup stands" document,
 * rendered by @react-pdf/renderer to match the invoice/receipt house style (monochrome ink/paper).
 * Built from the client's monitored assets + their auto-generated recommendations.
 */

const ink = "#1c1917";
const muted = "#78716c";
const border = "#e7e5e4";

const s = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 52, fontSize: 10, color: ink, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  brandSub: { fontSize: 8, color: muted, marginTop: 3, letterSpacing: 1.5, textTransform: "uppercase" },
  docType: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "right" },
  metaLabel: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 1 },
  metaValue: { fontSize: 10, marginTop: 2 },
  metaRight: { textAlign: "right", marginTop: 6 },
  clientRow: { marginTop: 4, marginBottom: 6 },
  clientName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 3 },
  summary: { marginTop: 14, padding: 12, borderWidth: 1, borderColor: border, borderRadius: 4, backgroundColor: "#fafaf9" },
  summaryText: { fontSize: 11 },
  tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: ink, paddingBottom: 5, marginTop: 24 },
  th: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 1 },
  colItem: { flex: 1, paddingRight: 12 },
  colStatus: { width: 90, textAlign: "right" },
  row: { borderBottomWidth: 1, borderBottomColor: border, paddingVertical: 8 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  ident: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  identSub: { fontSize: 8, color: muted, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.8 },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },
  detail: { fontSize: 8, color: muted, marginTop: 1, textAlign: "right" },
  note: { fontSize: 9, color: muted, marginTop: 5 },
  empty: { marginTop: 24, fontSize: 10, color: muted },
  footer: { position: "absolute", bottom: 36, left: 52, right: 52, borderTopWidth: 1, borderTopColor: border, paddingTop: 10, fontSize: 8, color: muted, flexDirection: "row", justifyContent: "space-between" },
});

const STATUS_TEXT: Record<AssetStatus, string> = {
  ok: "OK",
  warn: "ATTENTION",
  critical: "CRITICAL",
  down: "DOWN",
  unknown: "PENDING",
};

function fmtDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** The right-aligned "detail" for an asset: expiry countdown, storage, or site state. */
function detailFor(a: ClientAsset): string {
  if (a.type === "hosting") {
    return diskLabel(a.metrics) ?? "—";
  }
  if (a.expiryDate) {
    const when = fmtDate(a.expiryDate);
    const d = a.daysUntilExpiry;
    if (d === null) return when;
    if (d < 0) return `Expired ${when}`;
    return `Expires ${when} · ${d}d`;
  }
  if (a.type === "site") {
    return a.status === "down" ? (a.lastError ?? "Not responding") : "Online";
  }
  return "—";
}

function summaryLine(assets: ClientAsset[]): string {
  if (assets.length === 0) return "No infrastructure is being tracked for this account yet.";
  const need = assets.filter((a) => ["critical", "down", "warn"].includes(a.status)).length;
  const healthy = assets.filter((a) => a.status === "ok").length;
  const parts: string[] = [];
  if (need > 0) parts.push(`${need} item${need > 1 ? "s" : ""} need${need > 1 ? "" : "s"} attention`);
  if (healthy > 0) parts.push(`${healthy} healthy`);
  const pending = assets.length - need - healthy;
  if (pending > 0) parts.push(`${pending} pending a first check`);
  return parts.length
    ? parts.join(" · ") + "."
    : "All tracked items are up to date.";
}

export function StatementDocument({
  clientName,
  assets,
}: {
  clientName: string;
  assets: ClientAsset[];
}) {
  return (
    <Document title={`Status statement — ${clientName}`}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.brand}>SaharaBase</Text>
            <Text style={s.brandSub}>Technologies · Accra, Ghana</Text>
          </View>
          <View>
            <Text style={s.docType}>STATUS STATEMENT</Text>
            <View style={s.metaRight}>
              <Text style={s.metaLabel}>Issued</Text>
              <Text style={s.metaValue}>{fmtDate()}</Text>
            </View>
          </View>
        </View>

        <View style={s.clientRow}>
          <Text style={s.metaLabel}>Prepared for</Text>
          <Text style={s.clientName}>{clientName}</Text>
        </View>

        <View style={s.summary}>
          <Text style={s.summaryText}>{summaryLine(assets)}</Text>
        </View>

        {assets.length === 0 ? (
          <Text style={s.empty}>
            Once your domains, hosting and sites are added, they&apos;ll be listed here with their
            status and upcoming renewals.
          </Text>
        ) : (
          <>
            <View style={s.tableHead}>
              <Text style={[s.th, s.colItem]}>Item</Text>
              <Text style={[s.th, s.colStatus]}>Status</Text>
            </View>

            {assets.map((a) => (
              <View style={s.row} key={a.id} wrap={false}>
                <View style={s.rowTop}>
                  <View style={s.colItem}>
                    <Text style={s.ident}>{a.identifier}</Text>
                    <Text style={s.identSub}>{ASSET_TYPE_LABEL[a.type]}</Text>
                  </View>
                  <View style={s.colStatus}>
                    <Text style={s.statusText}>{STATUS_TEXT[a.status]}</Text>
                    <Text style={s.detail}>{detailFor(a)}</Text>
                  </View>
                </View>
                {a.recommendation ? <Text style={s.note}>{a.recommendation}</Text> : null}
              </View>
            ))}
          </>
        )}

        <View style={s.footer} fixed>
          <Text>SaharaBase Technologies</Text>
          <Text>We monitor these for you and will alert you ahead of any renewal.</Text>
        </View>
      </Page>
    </Document>
  );
}
