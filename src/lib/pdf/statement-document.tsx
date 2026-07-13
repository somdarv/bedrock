import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AssetStatus, ClientAsset } from "@/lib/api";
import { ASSET_TYPE_LABEL, assetSummary } from "@/lib/infrastructure/display";
import { LOGO_ASPECT, brand } from "./brand";

/**
 * Infrastructure Status Statement — a per-client "here's where your setup stands" document in the
 * SaharaBase document house style (the proposal design language: logo wordmark, Sora display +
 * General Sans text, monochrome ink/paper, an eyebrow-led layout, a Prepared-for / Prepared-by
 * frame, and a scan-to-verify stamp). Built from the client's monitored assets + recommendations.
 *
 * Fonts must be registered (registerBrandFonts) before this renders — done in render.tsx.
 */

export interface StatementMeta {
  /** Public verification reference the QR resolves to (…/verify/{reference}). */
  reference: string;
  /** Verification serial minted at issue; omitted on an unissued preview. */
  serial?: string;
  /** QR code as a PNG data URI; omitted → a "QR on issue" placeholder is shown. */
  verifyQr?: string;
  issuedDate?: string;
  preparedBy?: { name: string; phone?: string };
  /** Marks a preview so it can't be mistaken for an issued document. */
  specimen?: boolean;
}

const LOGO_W = 132;
const ACCENT = brand.ink;

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 11,
    lineHeight: 1.5,
    color: brand.body,
    fontFamily: "GeneralSans",
  },

  // header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  logo: { width: LOGO_W, height: LOGO_W / LOGO_ASPECT },
  headerRight: { alignItems: "flex-end" },
  docType: { fontFamily: "Sora", fontSize: 15, fontWeight: 600, color: brand.ink, letterSpacing: 0.3 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  metaLabel: { fontSize: 9, color: brand.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  metaValue: { fontSize: 9, color: brand.body, fontWeight: 500 },

  eyebrow: { fontFamily: "Sora", fontSize: 9, fontWeight: 600, color: brand.ink, textTransform: "uppercase", letterSpacing: 1.6 },

  // prepared for + summary
  clientName: { fontFamily: "Sora", fontSize: 22, fontWeight: 600, color: brand.ink, marginTop: 6 },
  clientSub: { fontSize: 11, color: brand.muted, marginTop: 2 },
  summaryCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: brand.line,
    borderTopWidth: 2,
    borderTopColor: ACCENT,
    borderRadius: 4,
    backgroundColor: brand.panel,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  summaryText: { fontSize: 12.5, lineHeight: 1.55, color: brand.body },

  // section
  section: { marginTop: 28 },
  sectionHead: { fontFamily: "Sora", fontSize: 15, fontWeight: 600, color: brand.ink, marginTop: 6 },
  sectionIntro: { fontSize: 11, color: brand.muted, marginTop: 4 },

  // asset item
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: brand.hair },
  itemHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  itemName: { fontFamily: "Sora", fontSize: 13, fontWeight: 600, color: brand.ink },
  itemType: { fontSize: 8.5, color: brand.faint, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
  itemDetail: { fontSize: 11, color: brand.body, marginTop: 6 },
  itemRec: { fontSize: 11, color: brand.muted, marginTop: 4, lineHeight: 1.5 },

  // status pill
  pill: { borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8 },
  pillText: { fontSize: 8.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 },

  // closing note
  closing: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: brand.line,
    borderRadius: 4,
    backgroundColor: brand.panel,
    padding: 16,
  },
  closingText: { fontSize: 11.5, lineHeight: 1.6, color: brand.body },

  // prepared by
  preparedCard: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: brand.line,
    borderTopWidth: 2,
    borderTopColor: ACCENT,
    borderRadius: 4,
    padding: 16,
  },
  preparedName: { fontFamily: "Sora", fontSize: 13, fontWeight: 600, color: brand.ink, marginTop: 6 },
  preparedLine: { fontSize: 11, color: brand.body, marginTop: 2 },
  preparedCompany: { fontSize: 10.5, color: brand.muted, marginTop: 2 },

  empty: { marginTop: 20, fontSize: 11, color: brand.muted, lineHeight: 1.6 },

  // verification footer
  verify: { marginTop: 28, borderTopWidth: 1, borderTopColor: brand.line, paddingTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 16 },
  verifyMeta: { fontSize: 9, color: brand.muted, lineHeight: 1.6 },
  verifyMetaStrong: { fontSize: 9.5, color: brand.body },
  stamp: { alignItems: "center" },
  qrBox: { width: 74, height: 74, borderWidth: 1, borderColor: brand.line, padding: 4, alignItems: "center", justifyContent: "center" },
  qrImg: { width: 66, height: 66 },
  qrPlaceholder: { fontSize: 7, color: brand.faint, textAlign: "center" },
  scan: { marginTop: 5, fontSize: 8, fontWeight: 600, color: brand.muted, textTransform: "uppercase", letterSpacing: 1 },

  specimen: { position: "absolute", top: 300, left: 90, fontFamily: "Sora", fontSize: 90, fontWeight: 700, color: "#0a0a0a", opacity: 0.05, transform: "rotate(-32deg)" },
});

const STATUS: Record<AssetStatus, { label: string; color: string; bg: string }> = {
  ok: { label: "Healthy", color: brand.ok, bg: "#eef5e3" },
  warn: { label: "Attention", color: brand.warn, bg: "#fbf0df" },
  critical: { label: "Critical", color: brand.danger, bg: "#f9e6e6" },
  down: { label: "Down", color: brand.danger, bg: "#f9e6e6" },
  unknown: { label: "Pending", color: brand.muted, bg: brand.hair },
};

function fmtDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function detailText(a: ClientAsset): string {
  if (a.type === "site") {
    return a.status === "down" ? (a.lastError ?? "Not responding") : "Online";
  }
  return assetSummary(a);
}

function autoSummary(assets: ClientAsset[]): string {
  if (assets.length === 0) return "No infrastructure is being tracked for this account yet.";
  const need = assets.filter((a) => ["critical", "down", "warn"].includes(a.status)).length;
  const healthy = assets.filter((a) => a.status === "ok").length;
  const parts: string[] = [];
  if (need > 0) parts.push(`${need} item${need > 1 ? "s" : ""} need${need > 1 ? "" : "s"} attention`);
  if (healthy > 0) parts.push(`${healthy} healthy`);
  const pending = assets.length - need - healthy;
  if (pending > 0) parts.push(`${pending} pending a first check`);
  return parts.length ? parts.join(" · ") + "." : "All tracked items are up to date.";
}

function StatusPill({ status }: { status: AssetStatus }) {
  const st = STATUS[status];
  return (
    <View style={[s.pill, { backgroundColor: st.bg }]}>
      <Text style={[s.pillText, { color: st.color }]}>{st.label}</Text>
    </View>
  );
}

export function StatementDocument({
  clientName,
  assets,
  summary,
  closingNote,
  logo,
  meta,
}: {
  clientName: string;
  assets: ClientAsset[];
  summary?: string;
  closingNote?: string;
  /** SaharaBase wordmark as a data URI (from brand.logoDataUri()). */
  logo: string;
  meta: StatementMeta;
}) {
  const issued = fmtDate(meta.issuedDate);
  const preparedBy = meta.preparedBy ?? { name: "Richard Somda", phone: "059 212 3054 · 050 988 6584" };

  return (
    <Document title={`Infrastructure statement — ${clientName}`}>
      <Page size="A4" style={s.page}>
        {meta.specimen ? <Text style={s.specimen} fixed>SPECIMEN</Text> : null}

        {/* Header — logo + document meta (no letterhead) */}
        <View style={s.header}>
          {/* react-pdf Image (PDF canvas, not HTML) — no alt attribute exists */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logo} style={s.logo} />
          <View style={s.headerRight}>
            <Text style={s.docType}>Infrastructure Statement</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Reference</Text>
              <Text style={s.metaValue}>{meta.reference}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Issued</Text>
              <Text style={s.metaValue}>{issued}</Text>
            </View>
          </View>
        </View>

        {/* Prepared for + summary */}
        <Text style={s.eyebrow}>Prepared for</Text>
        <Text style={s.clientName}>{clientName}</Text>
        <View style={s.summaryCard}>
          <Text style={s.summaryText}>{summary?.trim() || autoSummary(assets)}</Text>
        </View>

        {/* Items */}
        <View style={s.section}>
          <Text style={s.eyebrow}>Your infrastructure</Text>
          <Text style={s.sectionIntro}>
            The domains, hosting and sites we monitor for you, and what each needs.
          </Text>

          {assets.length === 0 ? (
            <Text style={s.empty}>
              Once your domains, hosting and sites are added, they&apos;ll be listed here with their
              status and upcoming renewals.
            </Text>
          ) : (
            assets.map((a) => (
              <View style={s.item} key={a.id} wrap={false}>
                <View style={s.itemHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{a.identifier}</Text>
                    <Text style={s.itemType}>{ASSET_TYPE_LABEL[a.type]}</Text>
                  </View>
                  <StatusPill status={a.status} />
                </View>
                <Text style={s.itemDetail}>{detailText(a)}</Text>
                {a.recommendation ? <Text style={s.itemRec}>{a.recommendation}</Text> : null}
              </View>
            ))
          )}
        </View>

        {closingNote?.trim() ? (
          <View style={s.closing} wrap={false}>
            <Text style={s.closingText}>{closingNote.trim()}</Text>
          </View>
        ) : null}

        {/* Prepared by */}
        <View style={s.preparedCard} wrap={false}>
          <Text style={s.eyebrow}>Prepared by</Text>
          <Text style={s.preparedName}>{preparedBy.name}</Text>
          {preparedBy.phone ? <Text style={s.preparedLine}>{preparedBy.phone}</Text> : null}
          <Text style={s.preparedCompany}>SaharaBase Technologies · Accra, Ghana</Text>
        </View>

        {/* Verification footer */}
        <View style={s.verify} wrap={false}>
          <View>
            <Text style={s.verifyMetaStrong}>SaharaBase Technologies</Text>
            <Text style={s.verifyMeta}>Reference: {meta.reference}</Text>
            <Text style={s.verifyMeta}>Generated on system: SAH-HUB-INFRA-2026</Text>
            <Text style={s.verifyMeta}>Issued: {issued}</Text>
            {meta.serial ? (
              <Text style={s.verifyMeta}>Verification serial: {meta.serial}</Text>
            ) : (
              <Text style={s.verifyMeta}>Verification serial: — pending issue —</Text>
            )}
          </View>
          <View style={s.stamp}>
            <View style={s.qrBox}>
              {meta.verifyQr ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={meta.verifyQr} style={s.qrImg} />
              ) : (
                <Text style={s.qrPlaceholder}>QR on issue</Text>
              )}
            </View>
            <Text style={s.scan}>Scan to verify</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
