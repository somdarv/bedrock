"use client";

import * as React from "react";
import QRCode from "qrcode";
import { VERIFY_BASE_URL } from "@/lib/documents/registry";
import { useDocumentState } from "./document-context";

/**
 * The authenticity stamp printed on every document: a QR code resolving to the
 * public verification portal (hub.saharabasetech.com/verify/{id}). It only renders
 * once the document has been prepared, so an unissued draft shows a placeholder.
 *
 * The QR is SVG so it stays razor-sharp when the sheet is printed to PDF.
 */
export function VerifyStamp({ documentId }: { documentId: string }) {
  const { status } = useDocumentState();
  const ready = status === "ready";
  const [svg, setSvg] = React.useState<string>("");

  const verifyUrl = `${VERIFY_BASE_URL}/verify/${documentId}`;

  React.useEffect(() => {
    if (!ready) return;
    let alive = true;
    QRCode.toString(verifyUrl, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "H",
      color: { dark: "#12110f", light: "#ffffff" },
    })
      .then((out) => alive && setSvg(out))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready, verifyUrl]);

  return (
    // The stamp is a filled tile, not an outlined one: the QR needs a white quiet zone
    // to scan, so the padding around it comes from the fill sitting behind it.
    <div className="flex shrink-0 flex-col items-center gap-2.5 rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] p-4">
      <div className="flex h-[88px] w-[88px] items-center justify-center rounded-md bg-white p-1.5 [&>svg]:h-full [&>svg]:w-full">
        {ready && svg ? (
          <span className="h-full w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <span className="px-2 text-center text-[9px] leading-tight text-[var(--doc-ink-soft)]">
            QR on prepare
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold tracking-[0.05em] text-[var(--doc-ink-soft)] uppercase">
        Scan to verify
      </p>
    </div>
  );
}
