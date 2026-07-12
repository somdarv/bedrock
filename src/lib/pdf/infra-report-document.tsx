import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AssetOverviewRow, AssetStatus, InfrastructureOverview } from "@/lib/api";
import { ASSET_TYPE_LABEL, assetSummary } from "@/lib/infrastructure/display";

/**
 * Infrastructure Status Report — the whole-estate, internal-review document: every monitored
 * asset across every client (plus Sahara's own infra) in one PDF, most-urgent items surfaced
 * first, then a full inventory grouped by owner. Generated on demand so we can eyeball the
 * state of everything before any client-facing notice or statement goes out.
 *
 * Rendered by @react-pdf/renderer in the invoice/statement house style (monochrome ink/paper).
 */

const ink = "#1c1917";
const muted = "#78716c";
const border = "#e7e5e4";
const danger = "#b91c1c";
const warnTone = "#b45309";
const okTone = "#4d7c0f";

const s = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 52, fontSize: 10, color: ink, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  brandSub: { fontSize: 8, color: muted, marginTop: 3, letterSpacing: 1.5, textTransform: "uppercase" },
  docType: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "right" },
  metaLabel: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 1 },
  metaValue: { fontSize: 10, marginTop: 2 },
  metaRight: { textAlign: "right", marginTop: 6 },

  // headline count strip
  counts: { flexDirection: "row", gap: 8, marginTop: 6, marginBottom: 8 },
  countBox: { flex: 1, borderWidth: 1, borderColor: border, borderRadius: 4, padding: 10, backgroundColor: "#fafaf9" },
  countNum: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  countLabel: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 },

  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 22, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
  groupTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 2 },
  groupSub: { fontSize: 8, color: muted, marginBottom: 4 },

  tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: ink, paddingBottom: 5, marginTop: 4 },
  th: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 1 },
  colItem: { flex: 1, paddingRight: 12 },
  colDetail: { width: 150, paddingRight: 12 },
  colStatus: { width: 70, textAlign: "right" },

  row: { borderBottomWidth: 1, borderBottomColor: border, paddingVertical: 7, flexDirection: "row", alignItems: "flex-start" },
  ident: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  identSub: { fontSize: 8, color: muted, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.8 },
  detail: { fontSize: 9, color: muted },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },
  note: { fontSize: 8, color: muted, marginTop: 3 },

  attnRow: { borderBottomWidth: 1, borderBottomColor: border, paddingVertical: 7 },
  attnTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  attnOwner: { fontSize: 8, color: muted, marginTop: 1 },

  empty: { fontSize: 10, color: muted, marginTop: 4 },
  footer: { position: "absolute", bottom: 36, left: 52, right: 52, borderTopWidth: 1, borderTopColor: border, paddingTop: 10, fontSize: 8, color: muted, flexDirection: "row", justifyContent: "space-between" },
});

const STATUS_TEXT: Record<AssetStatus, string> = {
  ok: "OK",
  warn: "ATTENTION",
  critical: "CRITICAL",
  down: "DOWN",
  unknown: "PENDING",
};

const STATUS_COLOR: Record<AssetStatus, string> = {
  ok: okTone,
  warn: warnTone,
  critical: danger,
  down: danger,
  unknown: muted,
};

function fmtDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const OWN = "SaharaBase — own infrastructure";

/** Group rows by owner (Sahara's own infra first, then clients alphabetically). */
function groupByOwner(rows: AssetOverviewRow[]): { owner: string; rows: AssetOverviewRow[] }[] {
  const map = new Map<string, AssetOverviewRow[]>();
  for (const r of rows) {
    const owner = r.clientName ?? OWN;
    const bucket = map.get(owner) ?? [];
    bucket.push(r);
    map.set(owner, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === OWN ? -1 : b === OWN ? 1 : a.localeCompare(b)))
    .map(([owner, rows]) => ({ owner, rows }));
}

function AssetRow({ a }: { a: AssetOverviewRow }) {
  return (
    <View style={s.row} wrap={false}>
      <View style={s.colItem}>
        <Text style={s.ident}>{a.identifier}</Text>
        <Text style={s.identSub}>{ASSET_TYPE_LABEL[a.type]}</Text>
        {a.recommendation ? <Text style={s.note}>{a.recommendation}</Text> : null}
      </View>
      <View style={s.colDetail}>
        <Text style={s.detail}>{assetSummary(a)}</Text>
      </View>
      <View style={s.colStatus}>
        <Text style={[s.statusText, { color: STATUS_COLOR[a.status] }]}>{STATUS_TEXT[a.status]}</Text>
      </View>
    </View>
  );
}

export function InfraReportDocument({ overview }: { overview: InfrastructureOverview }) {
  const all = overview.all;
  const critical = all.filter((a) => a.status === "critical" || a.status === "down").length;
  const warn = all.filter((a) => a.status === "warn").length;
  const ok = all.filter((a) => a.status === "ok").length;
  const pending = all.filter((a) => a.status === "unknown").length;
  const groups = groupByOwner(all);

  return (
    <Document title="Infrastructure status report — SaharaBase">
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.brand}>SaharaBase</Text>
            <Text style={s.brandSub}>Technologies · Accra, Ghana</Text>
          </View>
          <View>
            <Text style={s.docType}>INFRASTRUCTURE STATUS</Text>
            <View style={s.metaRight}>
              <Text style={s.metaLabel}>Generated</Text>
              <Text style={s.metaValue}>{fmtDate()}</Text>
              <Text style={[s.metaValue, { color: muted, fontSize: 9 }]}>
                {all.length} item{all.length === 1 ? "" : "s"} · {groups.length} owner
                {groups.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.counts}>
          <View style={s.countBox}>
            <Text style={[s.countNum, { color: critical ? danger : ink }]}>{critical}</Text>
            <Text style={s.countLabel}>Critical / Down</Text>
          </View>
          <View style={s.countBox}>
            <Text style={[s.countNum, { color: warn ? warnTone : ink }]}>{warn}</Text>
            <Text style={s.countLabel}>Attention</Text>
          </View>
          <View style={s.countBox}>
            <Text style={[s.countNum, { color: okTone }]}>{ok}</Text>
            <Text style={s.countLabel}>Healthy</Text>
          </View>
          <View style={s.countBox}>
            <Text style={s.countNum}>{pending}</Text>
            <Text style={s.countLabel}>Pending check</Text>
          </View>
        </View>

        {all.length === 0 ? (
          <Text style={s.empty}>
            Nothing is being tracked yet. Add clients&apos; domains, hosting and sites to populate
            this report.
          </Text>
        ) : (
          <>
            {/* Needs attention — the urgent subset, most severe first */}
            <Text style={s.sectionTitle}>Needs attention</Text>
            {overview.attention.length === 0 ? (
              <Text style={s.empty}>Everything monitored is healthy — nothing needs attention.</Text>
            ) : (
              <>
                <View style={s.tableHead}>
                  <Text style={[s.th, s.colItem]}>Item</Text>
                  <Text style={[s.th, s.colDetail]}>Detail</Text>
                  <Text style={[s.th, s.colStatus]}>Status</Text>
                </View>
                {overview.attention.map((a) => (
                  <View style={s.attnRow} key={a.id} wrap={false}>
                    <View style={s.attnTop}>
                      <View style={s.colItem}>
                        <Text style={s.ident}>{a.identifier}</Text>
                        <Text style={s.attnOwner}>
                          {ASSET_TYPE_LABEL[a.type]} · {a.clientName ?? OWN}
                        </Text>
                      </View>
                      <View style={s.colDetail}>
                        <Text style={s.detail}>{a.lastError ?? assetSummary(a)}</Text>
                      </View>
                      <View style={s.colStatus}>
                        <Text style={[s.statusText, { color: STATUS_COLOR[a.status] }]}>
                          {STATUS_TEXT[a.status]}
                        </Text>
                      </View>
                    </View>
                    {a.recommendation ? <Text style={s.note}>{a.recommendation}</Text> : null}
                  </View>
                ))}
              </>
            )}

            {/* Full inventory grouped by owner */}
            <Text style={s.sectionTitle}>Full inventory</Text>
            {groups.map((g) => (
              <View key={g.owner} wrap={false}>
                <Text style={s.groupTitle}>{g.owner}</Text>
                <Text style={s.groupSub}>
                  {g.rows.length} item{g.rows.length === 1 ? "" : "s"}
                </Text>
                <View style={s.tableHead}>
                  <Text style={[s.th, s.colItem]}>Item</Text>
                  <Text style={[s.th, s.colDetail]}>Detail</Text>
                  <Text style={[s.th, s.colStatus]}>Status</Text>
                </View>
                {g.rows.map((a) => (
                  <AssetRow a={a} key={a.id} />
                ))}
              </View>
            ))}
          </>
        )}

        <View style={s.footer} fixed>
          <Text>SaharaBase Technologies · Internal infrastructure review</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
