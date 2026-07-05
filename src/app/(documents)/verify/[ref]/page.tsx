import { BrandLogo } from "@/components/brand-mark";
import { verifyDocument } from "@/lib/documents/api";

export const metadata = { title: "Document verification" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border py-3 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

const STATUS_COPY: Record<string, { title: string; note: string; ok: boolean }> = {
  valid: { title: "Authentic document", note: "This document was issued by SaharaBase Technologies.", ok: true },
  draft: { title: "Draft — not issued", note: "This reference exists but has not been formally issued.", ok: false },
  expired: { title: "Expired document", note: "This document was genuine but is no longer current.", ok: false },
  void: { title: "Voided document", note: "This document has been voided by SaharaBase Technologies.", ok: false },
};

export default async function VerifyPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref: raw } = await params;
  const ref = decodeURIComponent(raw);
  const record = await verifyDocument(ref);
  const state = record ? STATUS_COPY[record.status] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <BrandLogo className="h-6" />
          <span className="eyebrow">Verify</span>
        </div>

        {record && state ? (
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white ${state.ok ? "bg-success" : "bg-subtle"}`}
              >
                {state.ok ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a1 1 0 0 0 .9 1.5h18.6a1 1 0 0 0 .9-1.5L13.7 3.9a1 1 0 0 0-1.7 0Z" />
                  </svg>
                )}
              </span>
              <div>
                <p className="font-display text-base font-semibold tracking-tight text-foreground">{state.title}</p>
                <p className="text-xs text-muted-foreground">{state.note}</p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
              <Row label="Document ID" value={record.id} />
              <Row label="Type" value={record.type} />
              <Row label="Issued To" value={record.client} />
              <Row label="Project" value={record.project ?? "—"} />
              <Row label="Issue Date" value={record.issueDate} />
              {record.validUntil && <Row label="Valid Until" value={record.validUntil} />}
              <Row label="Status" value={record.status.toUpperCase()} />
            </div>

            <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
              Verified against the SaharaBase document registry. For any questions about this document, contact
              us at contact@saharabasetech.com.
            </p>
          </div>
        ) : (
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <div>
                <p className="font-display text-base font-semibold tracking-tight text-foreground">Document not found</p>
                <p className="text-xs text-muted-foreground">We could not verify this document reference.</p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
              <Row label="Reference checked" value={ref || "—"} />
              <Row label="Status" value="UNRECOGNIZED" />
            </div>

            <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
              If you believe this is an error, contact SaharaBase Technologies at contact@saharabasetech.com to
              confirm the document reference.
            </p>
          </div>
        )}

        <div className="border-t border-border px-6 py-3 text-[10px] text-subtle">www.saharabasetech.com</div>
      </div>
    </div>
  );
}
