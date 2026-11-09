"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { acceptedWhen, phoneWords } from "@/lib/documents/acceptance";
import { acceptContract } from "@/lib/documents/contract-actions";
import type { DocumentAcceptance, DocumentRecord } from "@/lib/documents/registry";
import { DocumentProvider } from "./document-context";
import { Note, Panel } from "./doc-ui";
import { BODY, INK, SM, XS } from "./plan-ui";

/**
 * A contract as a page you sign. It reads like any other document, and one person types their name
 * and phone number at the end and accepts it for their company. The owner asked for this on
 * 2026-11-05, in the manner of the CediBites staff letters, so these carry over from there:
 *
 *  - Nothing is drawn to sign on. No underlines. It is accepted on screen.
 *  - Until accepted, it ends at our sign-off. Accepted, it closes with the name, the phone number
 *    and the time, on screen and in the PDF. Our stamp stays in the footer throughout.
 *  - Download stays at the top of the screen from the moment it opens, accepted or not.
 */

type Signing = {
  token: string;
  filename: string;
  acceptance: DocumentAcceptance | null;
  setAcceptance(acceptance: DocumentAcceptance): void;
};

/** Present only on the signing link. The /d and /doc views show who signed and offer no form. */
const SigningContext = React.createContext<Signing | null>(null);

function saveCopy(filename: string) {
  const previous = document.title;
  document.title = filename;
  window.print();
  setTimeout(() => (document.title = previous), 500);
}

const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[length:var(--doc-t-sm)] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]";
const BUTTON_MAIN = cn(
  BUTTON,
  "bg-[var(--doc-fill-ink)] text-white hover:bg-[#3a3732] disabled:cursor-not-allowed disabled:bg-[#aba69c]",
);
const BUTTON_QUIET = cn(
  BUTTON,
  "bg-[var(--doc-fill-strong)] text-[var(--doc-ink)] hover:bg-[#dbd6cb]",
);

export function ContractFrame({
  token,
  record,
  filename,
  children,
}: {
  token: string;
  record: DocumentRecord;
  filename: string;
  children: React.ReactNode;
}) {
  const [acceptance, setAcceptance] = React.useState(record.acceptance ?? null);
  const signing = React.useMemo(
    () => ({ token, filename, acceptance, setAcceptance }),
    [token, filename, acceptance],
  );

  const stamp =
    record.prepared && record.serial && record.preparedAt
      ? { documentId: record.id, serial: record.serial, preparedAt: record.preparedAt }
      : null;

  return (
    <SigningContext.Provider value={signing}>
      <DocumentProvider documentId={record.id} initialPrepared={stamp}>
        <div className="doc-page">
          <SigningBar />
          <div className="doc-sheet">{children}</div>
        </div>
      </DocumentProvider>
    </SigningContext.Provider>
  );
}

/** Stays at the top while they read, so accepting and downloading are never a long scroll away. */
function SigningBar() {
  const { acceptance, filename } = React.useContext(SigningContext)!;

  return (
    <div
      className={cn(
        "no-print sticky top-2 z-20 mx-auto mb-5 flex max-w-[8.27in] items-center gap-3 rounded-full bg-[var(--doc-paper)] py-1.5 pr-1.5 shadow-[0_1px_2px_rgba(24,22,18,0.08),0_10px_28px_-16px_rgba(24,22,18,0.35)]",
        acceptance ? "pl-5" : "pl-1.5 sm:pl-5",
      )}
    >
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-[length:var(--doc-t-sm)] font-medium text-[var(--doc-ink)]",
          !acceptance && "hidden sm:block",
        )}
      >
        {acceptance ? `Accepted by ${acceptance.name}` : "Read it, then accept it at the end."}
      </p>
      <div className={cn("flex gap-1.5", acceptance ? "shrink-0" : "w-full sm:w-auto sm:shrink-0")}>
        {!acceptance && (
          <a href="#accept" className={cn(BUTTON_MAIN, "flex-1 sm:flex-none")}>
            Accept and sign
          </a>
        )}
        <button
          type="button"
          onClick={() => saveCopy(filename)}
          className={cn(BUTTON_QUIET, !acceptance && "flex-1 sm:flex-none")}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}

/**
 * The end of the contract: our sign-off, then the acceptance once there is one. On the signing link
 * it also holds the form and the way to save a copy. Those two never print.
 */
export function ContractSignatures({
  record,
  party,
  signer,
}: {
  record: DocumentRecord;
  /** The company the signer accepts for. */
  party: string;
  /** Who signs for us. */
  signer: { name: string; title: string };
}) {
  const signing = React.useContext(SigningContext);
  const acceptance = signing ? signing.acceptance : (record.acceptance ?? null);

  return (
    <div id="accept" className="scroll-mt-24">
      <div className="letter-close avoid-break">
        <p className="letter-line">Yours faithfully,</p>
        <p className="letter-line letter-signer">
          <strong>{signer.name}</strong>
        </p>
        <p className="letter-line">{signer.title}</p>
        <p className="letter-line">For Saharabase Technologies</p>
      </div>
      {acceptance && (
        <div className="letter-accepted avoid-break">
          <p>
            <strong>Acceptance:</strong> I have read, understood and accept the terms above for{" "}
            {party}.
          </p>
          <p className="letter-line">
            Signed online by: <strong>{acceptance.name}</strong>
          </p>
          {acceptance.phone && (
            <p className="letter-line">Phone: {phoneWords(acceptance.phone)}</p>
          )}
          <p className="letter-line">Date: {acceptedWhen(acceptance.at)}</p>
        </div>
      )}
      {signing && !acceptance && <AcceptForm party={party} />}
      {signing && acceptance && <AcceptedNote />}
    </div>
  );
}

const FIELD =
  "block min-h-12 w-full rounded-[var(--doc-r-inset)] bg-[var(--doc-paper)] px-4 py-2.5 text-[length:var(--doc-t-body)] text-[var(--doc-ink)] focus:outline-2 focus:outline-[var(--doc-ink)]";

/** Keeps what is typed to itself, so a letter of the name never redraws the contract above it. */
function AcceptForm({ party }: { party: string }) {
  const { token, setAcceptance } = React.useContext(SigningContext)!;
  const [agreed, setAgreed] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const ready = agreed && name.trim().length >= 3 && phone.replace(/\D/g, "").length >= 9;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const result = await acceptContract(token, { name, phone, agreed });
    setBusy(false);
    if (result.ok) {
      setAcceptance(result.acceptance);
      document.getElementById("accept")?.scrollIntoView({ block: "start" });
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={submit} className="no-print mt-8">
      <Panel>
        <h4 className={cn("font-bold", SM, INK)}>Accept and sign</h4>
        <label className={cn("mt-4 flex cursor-pointer items-start gap-3", SM, BODY)}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#131211]"
          />
          <span>
            I have read this contract. I accept it for {party}, and I am allowed to sign for them.
          </span>
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={cn("mb-1.5 block font-semibold", XS, INK)}>Your full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={120}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={cn("mb-1.5 block font-semibold", XS, INK)}>Your phone number</span>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              maxLength={30}
              className={FIELD}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className={cn("mt-3 font-semibold text-[#94492a]", SM)}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!ready || busy}
          className={cn(BUTTON_MAIN, "mt-4 w-full sm:w-auto sm:px-8")}
        >
          {busy ? "Signing" : "Accept and sign"}
        </button>
        <Note className="mt-3">
          We record your name, phone number, the time and your internet address.
        </Note>
      </Panel>
    </form>
  );
}

function AcceptedNote() {
  const { filename } = React.useContext(SigningContext)!;

  return (
    <div className="no-print mt-8">
      <Panel>
        <p className={cn("font-bold", SM, INK)}>Accepted. Thank you.</p>
        <p className={cn("mt-1", SM, BODY)}>We will now send your link: What we need from you.</p>
        <button
          type="button"
          onClick={() => saveCopy(filename)}
          className={cn(BUTTON_MAIN, "mt-4 w-full sm:w-auto sm:px-8")}
        >
          Download your copy
        </button>
        <Note className="mt-3">On a phone, you may see a print screen. Choose Save as PDF.</Note>
      </Panel>
    </div>
  );
}
