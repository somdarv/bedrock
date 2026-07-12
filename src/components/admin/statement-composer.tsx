"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import type { ClientAsset, Contact } from "@/lib/api";
import { ASSET_TYPE_LABEL, STATUS_VARIANT, assetSummary } from "@/lib/infrastructure/display";
import { finalizeStatement } from "@/lib/infrastructure/statement-actions";

/**
 * The Infrastructure Status Statement composer. Every live asset arrives with its auto-generated
 * recommendation pre-filled; the operator toggles what to include, edits the wording + summary,
 * then previews the exact PDF. Preview POSTs the curated selection to the statement route and
 * opens the returned PDF — no data is persisted or sent from here.
 */

interface ItemState {
  include: boolean;
  recommendation: string;
}

export function StatementComposer({
  clientId,
  assets,
  contacts,
  defaultTitle,
}: {
  clientId: string;
  assets: ClientAsset[];
  contacts: Contact[];
  defaultTitle: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const primary = contacts.find((c) => c.isPrimary) ?? contacts[0];

  const [previewing, setPreviewing] = React.useState(false);
  const [sending, startSend] = React.useTransition();
  const [summary, setSummary] = React.useState("");
  const [closingNote, setClosingNote] = React.useState("");
  const [items, setItems] = React.useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      assets.map((a) => [a.id, { include: true, recommendation: a.recommendation ?? "" }]),
    ),
  );

  // Send fields (contact + reply-to), confirmed here before dispatch.
  const [title, setTitle] = React.useState(defaultTitle);
  const [contactId, setContactId] = React.useState(primary?.id ?? "");
  const [replyName, setReplyName] = React.useState("");
  const [replyMethod, setReplyMethod] = React.useState("whatsapp");
  const [replyValue, setReplyValue] = React.useState("");

  const includedCount = assets.filter((a) => items[a.id]?.include).length;

  function setItem(id: string, patch: Partial<ItemState>) {
    setItems((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  /** The curated payload shared by preview and send. */
  function buildCurated() {
    return {
      summary: summary.trim() || undefined,
      closingNote: closingNote.trim() || undefined,
      items: assets
        .filter((a) => items[a.id]?.include)
        .map((a) => ({ assetId: a.id, recommendation: items[a.id].recommendation })),
    };
  }

  async function preview() {
    if (includedCount === 0) {
      toast("Include at least one item to preview.", "danger");
      return;
    }
    setPreviewing(true);
    try {
      const res = await fetch(`/admin/clients/${clientId}/statement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCurated()),
      });
      if (!res.ok) throw new Error(`Preview failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // Give the new tab time to read the blob before we revoke it.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not build the preview.", "danger");
    } finally {
      setPreviewing(false);
    }
  }

  function prepareAndSend() {
    if (includedCount === 0) {
      toast("Include at least one item first.", "danger");
      return;
    }
    if (!title.trim() || !replyName.trim() || !replyValue.trim()) {
      toast("Add a title and the reply-to contact before sending.", "danger");
      return;
    }
    if (!confirm(`Prepare and send this statement to ${primaryLabel()}?`)) return;

    startSend(async () => {
      const res = await finalizeStatement(clientId, {
        ...buildCurated(),
        title,
        contactId: contactId || undefined,
        replyToName: replyName,
        replyToMethod: replyMethod,
        replyToValue: replyValue,
      });
      if (res.error) {
        toast(res.error, "danger");
      } else {
        toast(res.sentTo ? `Statement sent to ${res.sentTo}.` : "Statement prepared & sent.", "success");
        router.push(`/admin/clients/${clientId}`);
      }
    });
  }

  function primaryLabel() {
    const c = contacts.find((x) => x.id === contactId);
    return c?.name ?? "the client";
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-lg border bg-surface p-6 text-sm text-muted-foreground">
        This client has no monitored infrastructure yet. Add their domains, hosting or sites on the
        Infrastructure page first, then come back to compose a statement.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Intro / summary */}
      <section className="space-y-4 rounded-lg border bg-surface p-5">
        <Field
          label="Summary line"
          hint="The opening line of the statement. Leave blank to use the auto summary (e.g. “1 item needs attention · 3 healthy”)."
        >
          <Input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Auto summary from the items below"
          />
        </Field>
      </section>

      {/* Items */}
      <section className="space-y-3 rounded-lg border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">What to include</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Live from monitoring. Untick anything you don&apos;t want on this statement; edit the
              recommendation the client will read.
            </p>
          </div>
          <Badge variant={includedCount ? "success" : "default"}>{includedCount} included</Badge>
        </div>

        <ul className="space-y-3">
          {assets.map((a) => {
            const state = items[a.id];
            const on = state?.include ?? false;
            return (
              <li
                key={a.id}
                className={`rounded-md border p-4 transition-colors ${
                  on ? "bg-background" : "bg-muted/40 opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setItem(a.id, { include: e.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="sr-only">Include {a.identifier}</span>
                  </label>
                  <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                  <span className="font-medium">{a.identifier}</span>
                  <span className="text-xs uppercase tracking-wide text-subtle">
                    {ASSET_TYPE_LABEL[a.type]}
                  </span>
                  <span className="text-sm text-muted-foreground sm:ml-auto">{assetSummary(a)}</span>
                </div>

                {on && (
                  <div className="mt-3">
                    <Textarea
                      value={state.recommendation}
                      onChange={(e) => setItem(a.id, { recommendation: e.target.value })}
                      placeholder="What the client should do about this item (leave blank for none)."
                      rows={2}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Closing note */}
      <section className="space-y-4 rounded-lg border bg-surface p-5">
        <Field
          label="Closing note"
          hint="Optional. A short paragraph under the table — a personal sign-off or a reminder."
        >
          <Textarea
            value={closingNote}
            onChange={(e) => setClosingNote(e.target.value)}
            placeholder="e.g. We handle all renewals for you — just reply and we'll take care of it."
            rows={3}
          />
        </Field>
      </section>

      {/* Prepare & send */}
      <section className="space-y-4 rounded-lg border bg-surface p-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Prepare &amp; send</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saves the document to this client&apos;s history and sends it over WhatsApp + email.
            Preview first — sending can&apos;t be undone.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" required hint="Shown to the client, e.g. “Infrastructure status — Jul 2026”.">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          {contacts.length > 1 && (
            <Field label="Send to">
              <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isPrimary ? " (primary)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-sm font-medium">Reply-to contact</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shown in the message so the client knows how to reach you back.
          </p>
          <div className="mt-3 space-y-3">
            <Field label="Contact name" required>
              <Input value={replyName} onChange={(e) => setReplyName(e.target.value)} placeholder="e.g. Richard" />
            </Field>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Field label="How">
                <Select value={replyMethod} onChange={(e) => setReplyMethod(e.target.value)}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                </Select>
              </Field>
              <Field label={replyMethod === "email" ? "Email" : "Number"} required>
                <Input
                  type={replyMethod === "email" ? "email" : "text"}
                  value={replyValue}
                  onChange={(e) => setReplyValue(e.target.value)}
                  placeholder={replyMethod === "email" ? "name@example.com" : "+233 24 000 0000"}
                />
              </Field>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" onClick={preview} disabled={previewing || sending}>
          {previewing ? "Building preview…" : "Preview PDF ↗"}
        </Button>
        <Button onClick={prepareAndSend} disabled={sending || previewing}>
          {sending ? <Spinner /> : null}
          {sending ? "Sending…" : "Prepare & send"}
        </Button>
      </div>
    </div>
  );
}
