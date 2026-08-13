"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { RecipientPicker } from "@/components/admin/recipient-picker";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import type { Contact } from "@/lib/api";

export interface DocumentSendValues {
  contactIds: string[];
  replyToName: string;
  replyToMethod: string;
  replyToValue: string;
  /** Only meaningful when the dialog was given a `pair`; true when it is still ticked. */
  includeInvoice: boolean;
}

/**
 * The one dialog for putting a generated document in front of a client: who it goes to, who
 * replies come back to, and a link to read the exact PDF before it leaves. Shared by standalone
 * invoices and work-package receipts so a document cannot be sent two different ways.
 *
 * `pair` is the second document riding along on the email (a receipt's invoice). It is ticked by
 * default: the pair is what makes the record complete, and unticking is the deliberate act.
 */
export function DocumentSendModal({
  heading,
  description,
  contacts,
  preview,
  pair = null,
  send,
  onClose,
  onSent,
}: {
  heading: string;
  description: string;
  contacts: Contact[];
  preview: { href: string; label: string };
  pair?: { href: string; label: string } | null;
  send: (values: DocumentSendValues) => Promise<{ error?: string; sentTo?: string }>;
  onClose: () => void;
  onSent: (sentTo?: string) => void;
}) {
  // Default to every contact so primary + secondary are reached at once; operator can untick.
  const [recipientIds, setRecipientIds] = React.useState<string[]>(() => contacts.map((c) => c.id));
  const [replyName, setReplyName] = React.useState("");
  const [replyMethod, setReplyMethod] = React.useState("whatsapp");
  const [replyValue, setReplyValue] = React.useState("");
  const [includeInvoice, setIncludeInvoice] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (recipientIds.length === 0) return setError("Pick at least one contact to send to.");
    if (!replyName.trim()) return setError("Add a contact name for replies.");
    if (!replyValue.trim()) return setError("Add the contact's number or email.");

    startTransition(async () => {
      const res = await send({
        contactIds: recipientIds,
        replyToName: replyName,
        replyToMethod: replyMethod,
        replyToValue: replyValue,
        includeInvoice,
      });
      if (res.error) setError(res.error);
      else onSent(res.sentTo);
    });
  }

  return (
    <Modal open onClose={onClose} title={heading} description={description}>
      <form onSubmit={submit} className="space-y-4">
        <RecipientPicker contacts={contacts} selected={recipientIds} onChange={setRecipientIds} />

        {pair && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-background p-3 text-sm">
            <input
              type="checkbox"
              checked={includeInvoice}
              onChange={(e) => setIncludeInvoice(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            <span>
              <span className="font-medium">{pair.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Attached to the email only. WhatsApp carries the receipt on its own.{" "}
                <a
                  href={pair.href}
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-4 hover:no-underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Preview it
                </a>
              </span>
            </span>
          </label>
        )}

        <Field label="Replies go to (name)" htmlFor="replyName" required>
          <Input
            id="replyName"
            value={replyName}
            onChange={(e) => setReplyName(e.target.value)}
            placeholder="e.g. Richard"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reply by" htmlFor="replyMethod">
            <Select id="replyMethod" value={replyMethod} onChange={(e) => setReplyMethod(e.target.value)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
            </Select>
          </Field>
          <Field label="Number or email" htmlFor="replyValue" required>
            <Input
              id="replyValue"
              value={replyValue}
              onChange={(e) => setReplyValue(e.target.value)}
              placeholder={replyMethod === "email" ? "name@example.com" : "+233 24 000 0000"}
            />
          </Field>
        </div>

        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {/* The same route the PDF is rendered from, so this is the document itself and not a
              likeness of it. Read it before it reaches the client, not after. */}
          <a
            href={preview.href}
            target="_blank"
            rel="noopener"
            className="text-sm underline underline-offset-4 hover:no-underline"
          >
            {preview.label}
          </a>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : null}
              Send
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
