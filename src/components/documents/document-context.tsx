"use client";

import * as React from "react";
import { prepareDocument, type PreparedDocument } from "@/lib/documents/api";

interface DocumentState {
  documentId: string;
  status: "idle" | "preparing" | "ready";
  prepared: PreparedDocument | null;
  prepare: () => Promise<void>;
}

const Ctx = React.createContext<DocumentState | null>(null);

export function DocumentProvider({
  documentId,
  initialPrepared = null,
  children,
}: {
  documentId: string;
  /** If the document was already issued, start in the ready state with its stamp. */
  initialPrepared?: PreparedDocument | null;
  children: React.ReactNode;
}) {
  const [status, setStatus] = React.useState<DocumentState["status"]>(
    initialPrepared ? "ready" : "idle",
  );
  const [prepared, setPrepared] = React.useState<PreparedDocument | null>(initialPrepared);

  const prepare = React.useCallback(async () => {
    setStatus("preparing");
    try {
      const result = await prepareDocument(documentId);
      setPrepared(result);
      setStatus("ready");
    } catch {
      setStatus("idle");
    }
  }, [documentId]);

  const value = React.useMemo(
    () => ({ documentId, status, prepared, prepare }),
    [documentId, status, prepared, prepare],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDocumentState(): DocumentState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useDocumentState must be used within a DocumentProvider");
  return ctx;
}
