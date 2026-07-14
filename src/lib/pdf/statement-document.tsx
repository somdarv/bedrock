import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AssetStatus, ClientAsset, ClientType } from "@/lib/api";
import { formatBytes } from "@/lib/infrastructure/display";
import { LOGO_ASPECT, brand, company } from "./brand";

/**
 * Infrastructure Status Statement — a per-client, plain-language "here's how your website setup is
 * doing" document in the SaharaBase house style (proposal design language: logo letterhead, Sora
 * display + General Sans text, monochrome ink/paper, an eyebrow-led layout, and a scan-to-verify
 * stamp). Written for non-technical owners: every figure is explained in ordinary words, and the
 * terms (domain, certificate, hosting, health) are defined up front.
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

const LOGO_W = 128;

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 11.5,
    lineHeight: 1.5,
    color: brand.body,
    fontFamily: "GeneralSans",
  },

  // header — refined letterhead
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: LOGO_W, height: LOGO_W / LOGO_ASPECT },
  contactLine: { fontSize: 9, color: brand.muted, marginTop: 8 },
  headerRight: { alignItems: "flex-end" },
  docType: { fontFamily: "Sora", fontSize: 14, fontWeight: 600, color: brand.ink, letterSpacing: 0.3, textTransform: "uppercase" },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 5 },
  metaLabel: { fontSize: 8.5, color: brand.muted, textTransform: "uppercase", letterSpacing: 0.8, width: 58, textAlign: "right" },
  metaValue: { fontSize: 9.5, color: brand.body, fontWeight: 500 },
  rule: { borderTopWidth: 1, borderTopColor: brand.ink, marginTop: 14 },

  eyebrow: { fontFamily: "Sora", fontSize: 9, fontWeight: 600, color: brand.ink, textTransform: "uppercase", letterSpacing: 1.6 },

  // prepared for + intro
  preparedFor: { marginTop: 24 },
  clientName: { fontFamily: "Sora", fontSize: 21, fontWeight: 600, color: brand.ink, marginTop: 3 },
  clientSub: { fontSize: 10.5, color: brand.muted, marginTop: 2 },
  intro: { fontSize: 12, lineHeight: 1.6, color: brand.body, marginTop: 16 },

  // definitions panel — no box; hairline-separated rows
  defs: { marginTop: 22 },
  defsHead: { marginBottom: 4 },
  defRow: { flexDirection: "row", gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: brand.hair },
  defTerm: { fontFamily: "Sora", fontSize: 10.5, fontWeight: 600, color: brand.ink, width: 116 },
  defText: { flex: 1, fontSize: 10.5, lineHeight: 1.5, color: brand.muted },

  // items
  section: { marginTop: 28 },
  sectionHead: { marginBottom: 2 },
  item: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: brand.line },
  itemHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  itemName: { fontFamily: "Sora", fontSize: 13.5, fontWeight: 600, color: brand.ink },
  itemTech: { fontSize: 9, color: brand.faint, marginTop: 2 },
  facetRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  facetLabel: { fontSize: 10, color: brand.muted, width: 108, fontWeight: 500 },
  facetValue: { flex: 1, fontSize: 11, lineHeight: 1.5, color: brand.body },
  itemRec: { fontSize: 10.5, color: brand.muted, marginTop: 8, lineHeight: 1.5, fontFamily: "GeneralSans" },

  // status pill — no letter-spacing (its trailing space made the right padding look larger);
  // lineHeight 1 + a hair more top than bottom padding vertically centres the all-caps label.
  pill: { borderRadius: 4, paddingTop: 3.5, paddingBottom: 3, paddingHorizontal: 9, alignSelf: "flex-start" },
  pillText: { fontSize: 9, fontWeight: 600, textTransform: "uppercase", lineHeight: 1 },

  // closing / sign-off
  closing: { marginTop: 26, fontSize: 11.5, lineHeight: 1.6, color: brand.body },
  signoff: { marginTop: 22, borderTopWidth: 1, borderTopColor: brand.line, paddingTop: 14 },
  signName: { fontFamily: "Sora", fontSize: 13, fontWeight: 600, color: brand.ink },
  signLine: { fontSize: 10.5, color: brand.muted, marginTop: 2 },

  empty: { marginTop: 18, fontSize: 11.5, color: brand.muted, lineHeight: 1.6 },

  // verification footer
  verify: { marginTop: 26, borderTopWidth: 1, borderTopColor: brand.line, paddingTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 16 },
  verifyMeta: { fontSize: 8.5, color: brand.muted, lineHeight: 1.6 },
  verifyMetaStrong: { fontSize: 9.5, color: brand.body, fontWeight: 500 },
  stamp: { alignItems: "center" },
  qrBox: { width: 72, height: 72, borderWidth: 1, borderColor: brand.line, padding: 4, alignItems: "center", justifyContent: "center" },
  qrImg: { width: 64, height: 64 },
  qrPlaceholder: { fontSize: 7, color: brand.faint, textAlign: "center" },
  scan: { marginTop: 5, fontSize: 8, fontWeight: 600, color: brand.muted, textTransform: "uppercase", letterSpacing: 1 },

  specimen: { position: "absolute", top: 300, left: 96, fontFamily: "Sora", fontSize: 88, fontWeight: 700, color: "#0a0a0a", opacity: 0.04, transform: "rotate(-32deg)" },
});

const STATUS: Record<AssetStatus, { label: string; color: string; bg: string }> = {
  ok: { label: "Healthy", color: brand.ok, bg: "#eef5e3" },
  warn: { label: "Attention", color: brand.warn, bg: "#fbf0df" },
  critical: { label: "Critical", color: brand.danger, bg: "#f9e6e6" },
  down: { label: "Down", color: brand.danger, bg: "#f9e6e6" },
  unknown: { label: "Pending", color: brand.muted, bg: brand.hair },
};

/** The four plain-language definitions clients read before their status. */
const DEFINITIONS: { term: string; text: string }[] = [
  { term: "Domain", text: "Your web address (what people type to reach you). It has to be renewed from time to time, or your site and email go offline." },
  { term: "Security certificate", text: "The padlock shown in the browser. It keeps every visitor's connection to your site private and trusted." },
  { term: "Hosting & storage", text: "The space on our servers where your files and email live. It has a set size, and filling it up can cause problems." },
  { term: "Website health", text: "Whether a site is online right now and reachable to the people trying to visit it." },
];

function fmtDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtLongDate(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function periodOf(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

type Facet = { label: string; value: string };

/** Plain-language line for a domain's registration. */
function domainFacet(a: ClientAsset): Facet {
  const d = a.daysUntilExpiry;
  const renews = a.expiryDate ? ` It renews around ${fmtDate(a.expiryDate)}.` : "";
  let value: string;
  if (d === null) value = "Registered. We're confirming its next renewal date.";
  else if (d < 0) value = `Expired ${-d} days ago, so it needs renewing now to bring your site and email back online.`;
  else if (d <= 30) value = `Needs renewing within ${d} days to keep your site and email online.${renews}`;
  else value = `Registered and good for another ${d} days.${renews}`;
  return { label: "Domain", value };
}

/** Plain-language line for the SSL certificate, from a website's metrics or a standalone ssl asset. */
function certFacet(days: number | null): Facet {
  let value: string;
  if (days === null) value = "In place. We're confirming its next renewal.";
  else if (days < 0) value = `Has lapsed, so visitors may see a security warning. We're renewing it.`;
  else if (days <= 21) value = `Renews in ${days} days. We take care of this for you, so there's nothing to do.`;
  else value = `Valid and protecting your visitors for another ${days} days.`;
  return { label: "Security certificate", value };
}

/** Plain-language line for site reachability. */
function healthFacet(up: number | null | undefined, lastError: string | null): Facet {
  const value =
    up === 0
      ? `Your site isn't responding right now${lastError ? ` (${lastError})` : ""}. We're looking into it.`
      : up === 1
        ? "Online and reachable to your visitors."
        : "We'll confirm this on the next check.";
  return { label: "Website health", value };
}

/** Plain-language storage line for a hosting account. */
function storageFacet(a: ClientAsset): Facet {
  const used = formatBytes(a.metrics?.diskUsed);
  const limit = formatBytes(a.metrics?.diskLimit);
  let value: string;
  if (!used) value = "We're reading your current storage use.";
  else if (limit && a.metrics?.diskUsed && a.metrics?.diskLimit) {
    const pct = Math.round((a.metrics.diskUsed / a.metrics.diskLimit) * 100);
    value =
      pct >= 85
        ? `Using ${used} of your ${limit} (${pct}% full), so it's worth clearing space or upgrading soon.`
        : `Using ${used} of your ${limit} (${pct}% full), with plenty of room.`;
  } else value = `Using ${used}.`;
  return { label: "Where your files live", value };
}

/** The friendly title + optional technical sub-line + plain-language facets for one asset. */
function present(a: ClientAsset): { title: string; tech?: string; facets: Facet[] } {
  switch (a.type) {
    case "domain": {
      const m = a.metrics ?? {};
      const facets = [domainFacet(a)];
      if (m.sslDays != null || m.sslStatus) facets.push(certFacet(m.sslDays ?? null));
      if (m.siteUp != null || m.siteStatus) facets.push(healthFacet(m.siteUp, a.lastError));
      return { title: a.identifier, facets };
    }
    case "hosting":
      return {
        title: a.label?.trim() || "Website hosting & email",
        tech: `Account: ${a.identifier}`,
        facets: [storageFacet(a)],
      };
    case "ssl":
      return { title: a.label?.trim() || a.identifier, facets: [certFacet(a.daysUntilExpiry)] };
    case "site":
      return { title: a.identifier, facets: [healthFacet(a.status === "down" ? 0 : 1, a.lastError)] };
    default:
      return { title: a.identifier, facets: [] };
  }
}

/** How we address the account holder: "your organisation (Name)" or "your account (Name)". */
function ownerPhrase(clientName: string, clientType: ClientType): string {
  const noun = clientType === "individual" ? "your account" : "your organisation";
  return `${noun} (${clientName})`;
}

/** Default dated intro when the operator hasn't written their own. */
function defaultIntro(
  clientName: string,
  clientType: ClientType,
  assets: ClientAsset[],
  issuedIso?: string,
): string {
  const asOf = fmtLongDate(issuedIso);
  // Multiple online assets (websites/sites) → plural framing so it never reads as a single site.
  const multi = assets.filter((a) => a.type === "domain" || a.type === "site").length > 1;
  const addresses = multi
    ? "the web addresses people use to find you"
    : "the web address people use to find you";
  const running = multi ? "whether your sites are up and running" : "whether your site is up and running";
  const need = assets.filter((a) => ["critical", "down", "warn"].includes(a.status)).length;
  const tail =
    assets.length === 0
      ? "We'll list each part here as soon as it's set up."
      : need === 0
        ? "Everything is in good shape right now, and the detail is below."
        : need === 1
          ? "Most things are in good shape. One item needs attention soon, and it's flagged below."
          : `Most things are in good shape. ${need} items need attention soon, and they're flagged below.`;
  return (
    `As of ${asOf}, here's a straightforward look at everything that keeps ${ownerPhrase(clientName, clientType)} ` +
    `online: ${addresses}, the security that protects your visitors, the space where your files are stored, ` +
    `and ${running}. ${tail}`
  );
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
  clientType = "organisation",
  assets,
  summary,
  closingNote,
  logo,
  meta,
}: {
  clientName: string;
  /** Drives how the account holder is addressed ("your organisation" vs "your account"). */
  clientType?: ClientType;
  assets: ClientAsset[];
  summary?: string;
  closingNote?: string;
  /** SaharaBase wordmark as a data URI (from brand.logoDataUri()). */
  logo: string;
  meta: StatementMeta;
}) {
  const issued = fmtDate(meta.issuedDate);
  const preparedBy = meta.preparedBy ?? { name: "Richard Somda", phone: company.phone };
  const introText = summary?.trim() || defaultIntro(clientName, clientType, assets, meta.issuedDate);

  return (
    <Document title={`Infrastructure statement: ${clientName}`}>
      <Page size="A4" style={s.page}>
        {meta.specimen ? <Text style={s.specimen} fixed>SPECIMEN</Text> : null}

        {/* Refined letterhead — logo + contact left, document meta right, thin rule under */}
        <View style={s.header}>
          <View>
            {/* react-pdf Image (PDF canvas, not HTML) — no alt attribute exists */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logo} style={s.logo} />
            <Text style={s.contactLine}>{company.addressLine}</Text>
            <Text style={s.contactLine}>
              {company.phone} · {company.website}
            </Text>
          </View>
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
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Period</Text>
              <Text style={s.metaValue}>{periodOf(meta.issuedDate)}</Text>
            </View>
          </View>
        </View>
        <View style={s.rule} />

        {/* Prepared for + dated plain-language intro (no box) */}
        <View style={s.preparedFor}>
          <Text style={s.eyebrow}>Prepared for</Text>
          <Text style={s.clientName}>{clientName}</Text>
        </View>
        <Text style={s.intro}>{introText}</Text>

        {/* What you're looking at — plain definitions up front */}
        <View style={s.defs}>
          <View style={s.defsHead}>
            <Text style={s.eyebrow}>What you&apos;re looking at</Text>
          </View>
          {DEFINITIONS.map((d) => (
            <View style={s.defRow} key={d.term}>
              <Text style={s.defTerm}>{d.term}</Text>
              <Text style={s.defText}>{d.text}</Text>
            </View>
          ))}
        </View>

        {/* Items — each part, in plain language */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.eyebrow}>How each part is doing</Text>
          </View>

          {assets.length === 0 ? (
            <Text style={s.empty}>
              As soon as your domain, hosting and site are set up, each one will be listed here with a
              plain-language note on how it&apos;s doing and anything coming up.
            </Text>
          ) : (
            assets.map((a) => {
              const p = present(a);
              return (
                <View style={s.item} key={a.id} wrap={false}>
                  <View style={s.itemHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{p.title}</Text>
                      {p.tech ? <Text style={s.itemTech}>{p.tech}</Text> : null}
                    </View>
                    <StatusPill status={a.status} />
                  </View>
                  {p.facets.map((f) => (
                    <View style={s.facetRow} key={f.label}>
                      <Text style={s.facetLabel}>{f.label}</Text>
                      <Text style={s.facetValue}>{f.value}</Text>
                    </View>
                  ))}
                  {a.recommendation ? <Text style={s.itemRec}>{a.recommendation}</Text> : null}
                </View>
              );
            })
          )}
        </View>

        {closingNote?.trim() ? <Text style={s.closing}>{closingNote.trim()}</Text> : null}

        {/* Genuine sign-off — no label, reads as authored */}
        <View style={s.signoff} wrap={false}>
          <Text style={s.closing}>
            If anything here is unclear, or you&apos;d like us to take care of something before it comes
            due, just reply and we&apos;re glad to help.
          </Text>
          <Text style={[s.signName, { marginTop: 14 }]}>{preparedBy.name}</Text>
          <Text style={s.signLine}>{company.name}</Text>
          {preparedBy.phone ? <Text style={s.signLine}>{preparedBy.phone}</Text> : null}
        </View>

        {/* Verification footer */}
        <View style={s.verify} wrap={false}>
          <View>
            <Text style={s.verifyMetaStrong}>{company.name}</Text>
            <Text style={s.verifyMeta}>Reference: {meta.reference}</Text>
            <Text style={s.verifyMeta}>Generated on system: SAH-HUB-INFRA-2026</Text>
            <Text style={s.verifyMeta}>Issued: {issued}</Text>
            {meta.serial ? (
              <Text style={s.verifyMeta}>Verification serial: {meta.serial}</Text>
            ) : (
              <Text style={s.verifyMeta}>Verification serial: pending issue</Text>
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
