import Image from "next/image";
import type { ReactNode } from "react";
import type { DocumentRecord } from "@/lib/documents/registry";

/**
 * A hub document set as a plain Word letter, in the manner of the CediBites staff letters (owner,
 * 2026-11-08): our logo, the reference and the date, the office details over a rule, then the
 * words in Calibri 11. No fills, no cards. The spacing is in `.letter` in globals.css.
 */

const OFFICE = [
  "Head Office: 17 Alhaji Sulley Road, Abelemkpe, Accra, Ghana",
  "Tel: 059 212 3054 | 050 988 6584 | Email: hello@saharabasetech.com",
  "Website: www.saharabasetech.com",
];

export function LetterHead({ record }: { record: DocumentRecord }) {
  return (
    <header>
      <Image
        src="/brand/logo-black.png"
        alt="Saharabase Technologies"
        width={497}
        height={107}
        priority
        className="mx-auto mt-5 block h-auto w-[60mm] max-w-[70%]"
      />
      <div className="letter-ref">
        <strong>{record.reference}</strong>
        <span>{record.issueDate}</span>
      </div>
      {OFFICE.map((line) => (
        <p key={line} className="letter-line text-center">
          {line}
        </p>
      ))}
      <hr className="letter-rule" />
    </header>
  );
}

/** The "To:" block, one line to a row. */
export function LetterTo({ lines }: { lines: string[] }) {
  return (
    <>
      <p>
        <strong>To:</strong>
      </p>
      {lines.map((line) => (
        <p key={line} className="letter-line">
          {line}
        </p>
      ))}
    </>
  );
}

export function LetterTitle({ children }: { children: ReactNode }) {
  return <h2 className="letter-title">{children}</h2>;
}

/** A numbered part. The print styles keep the heading on the same page as what follows it. */
export function LetterPart({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="letter-heading">
        {n}. {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Numbered clauses, 3.1, 3.2 and so on, set in with the number inline as Word sets them. Numbered
 * so either side can point at one line in a message.
 */
export function LetterClauses({ part, items }: { part: number; items: ReactNode[] }) {
  return (
    <ol className="list-none">
      {items.map((item, i) => (
        <li key={i} className="letter-clause">
          {part}.{i + 1} {item}
        </li>
      ))}
    </ol>
  );
}

/** Lettered lines under a clause, (a), (b), (c). */
export function LetterSubs({ items }: { items: string[] }) {
  return (
    <ol className="list-none">
      {items.map((item, i) => (
        <li key={item} className="letter-sub">
          ({String.fromCharCode(97 + i)}) {item}
        </li>
      ))}
    </ol>
  );
}

export function LetterTable({
  left,
  right,
  rows,
  leftWidth = "56%",
  strongFirst,
}: {
  left: string;
  right: string;
  rows: [string, string][];
  leftWidth?: string;
  strongFirst?: boolean;
}) {
  return (
    <table className="letter-table">
      <thead>
        <tr>
          <th style={{ width: leftWidth }}>{left}</th>
          <th>{right}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b]) => (
          <tr key={a}>
            <td>{strongFirst ? <strong>{a}</strong> : a}</td>
            <td>{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
