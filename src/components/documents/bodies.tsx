import type { DocumentRecord } from "@/lib/documents/registry";
import { DropynFeeSchedule } from "./dropyn-fee-schedule";
import { GreaterHeightsProposal } from "./greater-heights-proposal";

/**
 * Maps a Document ID to the locally-authored body that renders it. Authoring a new
 * document = add its body component here + a registry entry. Everything else (frame,
 * print, QR, verify) is shared.
 */
const BODIES: Record<string, (record: DocumentRecord) => React.ReactNode> = {
  "SAH-BD-20260630-BIL-DYN-52": (record) => <DropynFeeSchedule record={record} />,
  "SAH-BD-20260706-PRO-GHIS-53": (record) => <GreaterHeightsProposal record={record} />,
};

export function hasDocumentBody(id: string): boolean {
  return id in BODIES;
}

export function renderDocumentBody(record: DocumentRecord): React.ReactNode {
  const body = BODIES[record.id];
  return body ? body(record) : null;
}
