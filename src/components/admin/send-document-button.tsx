"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import type { Contact } from "@/lib/api";
import { RecipientPicker } from "@/components/admin/recipient-picker";
import { sendClientDocument } from "@/lib/clients/actions";

const TYPE_OPTIONS = ["proposal", "fee schedule", "quote", "contract", "invoice", "document"];

/**
 * "Send document" for a client — upload a proposal / fee schedule / quote from the machine and
 * send it to a contact over WhatsApp (document attachment) + email. Dropped into the client page.
 */
export function SendDocumentButton({ clientId, contacts }: { clientId: string; contacts: Contact[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Send document
      </Button>
      {open && (
        <SendDocumentModal clientId={clientId} contacts={contacts} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function SendDocumentModal({
  clientId,
  contacts,
  onClose,
}: {
  clientId: string;
  contacts: Contact[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Default to every contact so primary + secondary are reached at once; operator can untick.
  const [recipientIds, setRecipientIds] = React.useState<string[]>(() => contacts.map((c) => c.id));
  const [type, setType] = React.useState("proposal");
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [replyName, setReplyName] = React.useState("");
  const [replyMethod, setReplyMethod] = React.useState("whatsapp");
  const [replyValue, setReplyValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const valuePlaceholder =
    replyMethod === "email" ? "name@example.com" : "+233 24 000 0000";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Choose a file to send.");
    if (!title.trim()) return setError("Give the document a title.");
    if (recipientIds.length === 0) return setError("Pick at least one contact to send to.");
    if (!replyName.trim()) return setError("Add a contact name for replies.");
    if (!replyValue.trim()) return setError("Add the contact's number or email.");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    fd.append("title", title.trim());
    recipientIds.forEach((id) => fd.append("contactIds[]", id));
    fd.append("replyToName", replyName.trim());
    fd.append("replyToMethod", replyMethod);
    fd.append("replyToValue", replyValue.trim());

    startTransition(async () => {
      const res = await sendClientDocument(clientId, fd);
      if (res.error) {
        setError(res.error);
      } else {
        toast(res.sentTo ? `Document sent to ${res.sentTo}.` : "Document sent.", "success");
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Send a document"
      description="Upload a proposal, fee schedule or quote from your computer. It's sent to the client on WhatsApp and email."
    >
      <form onSubmit={submit} className="space-y-4">
        {contacts.length > 1 && (
          <Field label="Send to" hint="Everyone ticked receives it at once over WhatsApp + email.">
            <RecipientPicker contacts={contacts} selected={recipientIds} onChange={setRecipientIds} />
          </Field>
        )}

        <Field label="Document type" htmlFor="sd-type">
          <Select id="sd-type" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Title"
          htmlFor="sd-title"
          required
          hint="Shown to the client, e.g. “Website Redesign — Phase 1”."
        >
          <Input
            id="sd-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website Redesign — Phase 1"
            required
          />
        </Field>

        <Field label="File" htmlFor="sd-file" required hint="PDF recommended. Max 50 MB.">
          <input
            id="sd-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
        </Field>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-sm font-medium">Reply-to contact</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shown in the message so the client knows how to reach you back.
          </p>
          <div className="mt-3 space-y-3">
            <Field label="Contact name" htmlFor="sd-reply-name" required>
              <Input
                id="sd-reply-name"
                value={replyName}
                onChange={(e) => setReplyName(e.target.value)}
                placeholder="e.g. Richard"
                required
              />
            </Field>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Field label="How" htmlFor="sd-reply-method">
                <Select
                  id="sd-reply-method"
                  value={replyMethod}
                  onChange={(e) => setReplyMethod(e.target.value)}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                </Select>
              </Field>
              <Field label={replyMethod === "email" ? "Email" : "Number"} htmlFor="sd-reply-value" required>
                <Input
                  id="sd-reply-value"
                  type={replyMethod === "email" ? "email" : "text"}
                  value={replyValue}
                  onChange={(e) => setReplyValue(e.target.value)}
                  placeholder={valuePlaceholder}
                  required
                />
              </Field>
            </div>
          </div>
        </div>

        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner /> : null}
            Send
          </Button>
        </div>
      </form>
    </Modal>
  );
}
