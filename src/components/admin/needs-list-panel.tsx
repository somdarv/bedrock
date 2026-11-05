"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyLink } from "@/components/admin/copy-link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { WorkPackage } from "@/lib/api";
import { makeNeedsList } from "@/lib/briefs/actions";
import { NEEDS_LIST_FORMS } from "@/lib/briefs/forms";

/**
 * The project's needs list, our side: make it, hand over its link, and see how far the client
 * has got. Its parts live on the plan below as items waiting on them, so this panel only counts.
 */
export function NeedsListPanel({ pkg, clientName }: { pkg: WorkPackage; clientName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState(NEEDS_LIST_FORMS[0]?.key ?? "");
  const [pending, start] = React.useTransition();
  const brief = pkg.brief;

  const make = (formKey: string, done: string) =>
    start(async () => {
      const result = await makeNeedsList(pkg.id, formKey, clientName);
      if (result.ok) {
        toast(done, "success");
        router.refresh();
      } else {
        toast(result.error, "danger");
      }
    });

  if (!brief) {
    if (NEEDS_LIST_FORMS.length === 0) return null;
    return (
      <section className="rounded-lg border bg-surface p-5">
        <h2 className="text-lg font-semibold tracking-tight">Needs list</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A page where the client fills in what we need from them, a part at a time. Each part goes on
          the plan below, waiting on them. Files they send land under From you.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Select value={form} onChange={(e) => setForm(e.target.value)} className="w-auto" aria-label="Which list">
            {NEEDS_LIST_FORMS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </Select>
          <Button onClick={() => make(form, "Needs list made. Its parts are on the plan.")} disabled={pending || !form}>
            {pending ? "Making it" : "Make the needs list"}
          </Button>
        </div>
      </section>
    );
  }

  const label = NEEDS_LIST_FORMS.find((f) => f.key === brief.form)?.label ?? brief.form;

  return (
    <section className="rounded-lg border bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Needs list</h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          {brief.partsSent} of {brief.partsTotal} parts sent · {brief.partsReceived} received
        </p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{label}. The link below is the client&rsquo;s.</p>
      <div className="mt-4 max-w-xl">
        <CopyLink path={`/b/${brief.token}`} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={`/b/${brief.token}`} target="_blank" rel="noreferrer">
            Open it as they see it
          </a>
        </Button>
        {brief.id && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/briefs/${brief.id}`}>Read the answers</Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => make(brief.form, "The plan has every part of the list.")}
          title="Adds parts that are new in the list to the plan. Nothing already there changes."
        >
          {pending ? "Updating" : "Update the plan"}
        </Button>
      </div>
    </section>
  );
}
