# Bedrock — Document Codes, References & URLs (v1)

> **Status:** Source of truth for how every Bedrock document is numbered, referenced,
> and verified. Both `bedrock` (frontend) and `bedrock-api` (Laravel) build against
> this. The document tools portal is hosted at **hub.saharabasetech.com**.

A document is any invoice, proposal, quote, receipt, fee schedule, or contract issued
by SaharaBase. Every document carries two kinds of identity: a **stable** identity
(which document this is) and a **per-generation** identity (which issued copy this is).

---

## 1. Document ID — stable, canonical

The primary key. Identifies *which document*. Never changes once created.

```
SAH-{UNIT}-{YYYYMMDD}-{TYPE}-{CLIENT}-{SEQ}
```

| Segment | Meaning | Rule |
|---------|---------|------|
| `SAH` | Company prefix | Fixed. Always `SAH` (SaharaBase). |
| `{UNIT}` | Issuing business unit | `BD` (Business Development, default), `ADM` (Admin/Ops), `FIN` (Finance). |
| `{YYYYMMDD}` | Issue date | The document's issue date, no separators. |
| `{TYPE}` | Document type code | See [§5 Type codes](#5-type-codes). |
| `{CLIENT}` | Short client code | Uppercase `A–Z0–9`, ≤ 6 chars. See [§6](#6-client-codes). |
| `{SEQ}` | Running sequence | Per issuing unit, zero-padded to ≥ 2 digits. |

**Example:** `SAH-BD-20260630-BIL-DYN-52`
→ SaharaBase · Business Development · 30 Jun 2026 · Fee Schedule (BIL) · Dropyn (DYN) · #52.

---

## 2. Short reference — human-facing

The tail of the Document ID. This is what prints in the letterhead (`Ref:`), because
the full ID is too long for the header.

```
{TYPE}-{CLIENT}-{SEQ}
```

**Example:** `BIL-DYN-52`

---

## 3. Verify URL — the long line + the QR target

The public verification link. Printed as the long machine line at the **top** of the
document, and encoded in the **QR code** in the footer. Contains the full Document ID.

```
https://hub.saharabasetech.com/verify/{DOCUMENT-ID}
```

**Example:** `https://hub.saharabasetech.com/verify/SAH-BD-20260630-BIL-DYN-52`

Scanning the QR or opening the URL confirms the document against the registry and
shows: type, client, project, issue date, validity, and status.

---

## 4. Verification serial — dynamic, per generation

Identifies *which issued copy* this is. **Minted fresh every time the document is
prepared/downloaded** — it is NOT stable. Recorded together with the timestamp.

```
G-XXXX-XXXX          (uppercase hex, 4 + 4)
```

**Example:** `G-1CBA-C796`

> **Document ID vs. Verification serial (the two "codes"):**
> - The **Document ID** (long, in the top URL + footer) says *which document* — stable.
> - The **Verification serial** (short, in the footer) says *which generation run* — changes
>   every time you prepare/download. Paired with the timestamp, it proves when this exact
>   copy was produced by the system.

---

## 5. Type codes

The `{TYPE}` segment reflects the **document kind**, which is independent of the nav
**category** it is grouped under.

| Code | Document type | Nav category |
|------|---------------|--------------|
| `INV` | Invoice | Invoices |¹
| `PRO` | Proposal | Proposals |
| `QUO` | Quote | Quotes |
| `RCP` | Receipt | Receipts |
| `BIL` | Fee Schedule / Billing | Proposals |
| `CON` | Contract | Proposals |

¹ **Two kinds of invoice/receipt exist, and only one is numbered this way.**

- **Standalone invoices** (billing raised directly against a client — infrastructure renewals and
  the like) are registry documents: issuing one mints an ID under the `FIN` unit, e.g.
  `SAH-FIN-20260811-INV-GIGCOT-07`, and writes a `documents` row. See [INVOICES.md](./INVOICES.md).
- **Work-package invoices/receipts** are rendered on the fly from a package and have no registry
  row. Their reference encodes the package instead — `SAH-INV-{first 8 hex of the package slug}` —
  and `VerifyController` answers it from live package data. That derivation is mirrored in
  `lib/documents/package-refs.ts`; change one and you must change the other.

---

## 6. Client codes

Derived from the client's name: a memorable token, uppercased, `A–Z0–9`, ≤ 6 chars.

| Client | Code |
|--------|------|
| Dropyn Trading LLC | `DYN` |
| Northfield Limited | `NORTHF` |
| Greater Heights International School | `GHIS` |
| Zenith School | `ZEN` |
| Dei Gratia Medical Services | `DEIG` |
| Shammah Preparatory School | `SHM` |
| Stellar Edge School | `STE` |

Assigned once per client and reused across their documents.

---

## 7. System tag & timestamp

- **Generated on System** — the issuing system tag: `SAH-HUB-DOC-{YYYY}` (e.g.
  `SAH-HUB-DOC-2026`), the hub tools portal.
- **Timestamp** — ISO-8601 UTC, minted at prepare time. e.g. `2026-07-05T00:26:14+00:00`.

---

## 8. Status lifecycle

| Status | Meaning |
|--------|---------|
| `draft` | Created, not yet prepared/issued. |
| `valid` | Prepared and issued; verifies as authentic. |
| `expired` | Past its `validUntil` date. |
| `void` | Revoked by SaharaBase. |

---

## 9. Where each identifier appears on the document

| Location | Value |
|----------|-------|
| Top machine line | Verify URL (`hub.saharabasetech.com/verify/{ID}`) |
| Letterhead (right) | Short `Ref:` |
| Footer (left) | Approved by · Employee ID · **Document ID** · Generated on System · Timestamp · **Verification serial** |
| Footer (right) | QR code (encodes Verify URL) · "Scan to verify" |

---

## 10. Ownership

`bedrock-api` **generates** the Document ID, short reference, verification serial, and
timestamp (see `DocumentReferenceService` and `POST /api/documents`, `.../prepare`).
`bedrock` **renders** them. This document is the contract between the two.
