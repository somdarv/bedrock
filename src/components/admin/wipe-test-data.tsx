"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { wipeTestData } from "@/lib/settings/actions";

/**
 * TEST-PHASE tool: wipe all test data (clients, packages, payments, messages) so the app is a
 * clean slate. Keeps the admin account. Requires typing WIPE to confirm.
 */
export function WipeTestData() {
  const { toast } = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = React.useState("");
  const [pending, start] = React.useTransition();

  function wipe() {
    start(async () => {
      const res = await wipeTestData();
      if (res.error) toast(res.error, "danger");
      else {
        toast(res.message ?? "Test data cleared.", "success");
        setConfirm("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-danger/40 bg-danger/5 p-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-danger">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Delete <strong>all</strong> clients, work packages, payments, deliverable records and sent
          messages — for clearing test data during the trial phase. Your admin account, reminder
          schedule and documents are kept. This cannot be undone.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type WIPE to confirm"
          className="max-w-52"
          aria-label="Type WIPE to confirm"
        />
        <Button variant="danger" onClick={wipe} disabled={pending || confirm !== "WIPE"}>
          {pending ? "Wiping…" : "Wipe test data"}
        </Button>
      </div>
    </div>
  );
}
