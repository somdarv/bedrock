"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/states";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type { SavingsState, SetAside } from "@/lib/api";
import {
  markAllSetAsidesMoved,
  markSetAsideMoved,
  markSetAsidePending,
} from "@/lib/savings/actions";
import { formatCedis } from "@/lib/utils";

/**
 * The ledger itself. Every row is one payment's slice; the only action is recording whether the
 * cedis were actually moved, because that is the single fact the app cannot observe.
 */
export function SavingsLedger({ state }: { state: SavingsState }) {
  const router = useRouter();
  const { toast } = useToast();
  // Which row is mid-request, so only that row's button spins.
  const [busy, setBusy] = React.useState<string | null>(null);

  const pending = state.entries.filter((e) => e.status === "pending");

  async function run(id: string, work: () => Promise<{ error?: string }>, done: string) {
    setBusy(id);
    const res = await work();
    setBusy(null);
    if (res.error) toast(res.error, "danger");
    else {
      toast(done, "success");
      router.refresh();
    }
  }

  if (state.entries.length === 0) {
    return (
      <EmptyState
        title="Nothing set aside yet"
        description={
          state.ratePercent > 0
            ? "The next payment that lands will accrue its slice here automatically."
            : "Set a rate in Settings and payments will start accruing here."
        }
      />
    );
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Ledger</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One entry per payment received. Tick each one off once the money is actually in the
            savings account.
          </p>
        </div>
        {pending.length > 0 && (
          <Button
            size="sm"
            disabled={busy !== null}
            onClick={() =>
              run(
                "all",
                markAllSetAsidesMoved,
                `${formatCedis(pending.reduce((n, e) => n + e.amount, 0))} marked as moved.`,
              )
            }
          >
            {busy === "all" ? <Spinner /> : null}
            Mark all {pending.length} moved
          </Button>
        )}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Source</TH>
            <TH>Client</TH>
            <TH className="text-right">Received</TH>
            <TH className="text-right">Set aside</TH>
            <TH>When</TH>
            <TH>Status</TH>
            <TH className="text-right">Action</TH>
          </TR>
        </THead>
        <TBody>
          {state.entries.map((entry) => (
            <Row
              key={entry.id}
              entry={entry}
              busy={busy === entry.id}
              disabled={busy !== null}
              onMove={() =>
                run(
                  entry.id,
                  () => markSetAsideMoved(entry.id),
                  `${formatCedis(entry.amount)} marked as moved.`,
                )
              }
              onUndo={() =>
                run(entry.id, () => markSetAsidePending(entry.id), "Moved back to outstanding.")
              }
            />
          ))}
        </TBody>
      </Table>
    </section>
  );
}

function Row({
  entry,
  busy,
  disabled,
  onMove,
  onUndo,
}: {
  entry: SetAside;
  busy: boolean;
  disabled: boolean;
  onMove: () => void;
  onUndo: () => void;
}) {
  const moved = entry.status === "moved";

  return (
    <TR>
      <TD className="font-medium">{entry.source}</TD>
      <TD className="text-muted-foreground">
        {entry.clientId ? (
          <Link href={`/admin/clients/${entry.clientId}`} className="hover:text-foreground">
            {entry.clientName ?? "Client"}
          </Link>
        ) : (
          (entry.clientName ?? "—")
        )}
      </TD>
      <TD className="text-right text-muted-foreground">{formatCedis(entry.receivedAmount)}</TD>
      <TD className="text-right font-semibold">
        {formatCedis(entry.amount)}
        {/* The rate this row accrued at, which is not necessarily today's. */}
        <span className="ml-1.5 text-xs font-normal text-subtle">{entry.ratePercent}%</span>
      </TD>
      <TD className="text-muted-foreground">
        {entry.receivedAt ? new Date(entry.receivedAt).toLocaleDateString() : "—"}
      </TD>
      <TD>
        <Badge variant={moved ? "success" : "warning"}>{moved ? "Moved" : "To move"}</Badge>
      </TD>
      <TD className="text-right">
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={moved ? onUndo : onMove}
        >
          {busy ? <Spinner /> : null}
          {moved ? "Undo" : "Mark moved"}
        </Button>
      </TD>
    </TR>
  );
}
