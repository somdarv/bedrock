"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/states";
import type { Client, ClientInput, ClientType } from "@/lib/api";
import { createClient, updateClient } from "@/lib/clients/actions";
import { cn } from "@/lib/utils";

interface ContactDraft {
  name: string;
  whatsapp: string;
  phone: string;
  email: string;
}

const emptyContact = (): ContactDraft => ({ name: "", whatsapp: "", phone: "", email: "" });

interface Props {
  open: boolean;
  onClose: () => void;
  client?: Client;
  onDone: (message: string) => void;
}

export function ClientFormModal({ open, onClose, client, onDone }: Props) {
  const isEdit = Boolean(client);

  const [type, setType] = React.useState<ClientType>(client?.type ?? "individual");
  const [name, setName] = React.useState(client?.name ?? "");
  const [contacts, setContacts] = React.useState<ContactDraft[]>(
    client
      ? client.contacts.map((c) => ({
          name: c.name,
          whatsapp: c.whatsapp,
          phone: c.phone ?? "",
          email: c.email ?? "",
        }))
      : [emptyContact()],
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const isOrg = type === "organisation";

  function patchContact(i: number, patch: Partial<ContactDraft>) {
    setContacts((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: ClientInput = {
      type,
      name: name.trim(),
      contacts: contacts.map((c, i) => ({
        // For an individual the person is the contact, so their name is the client name.
        name: isOrg ? c.name.trim() : name.trim(),
        whatsapp: c.whatsapp.trim(),
        phone: c.phone.trim() || null,
        email: c.email.trim() || null,
        isPrimary: i === 0,
      })),
    };

    if (!input.name) return setError(isOrg ? "Organisation name is required." : "Name is required.");
    if (input.contacts.some((c) => !c.whatsapp)) return setError("Every contact needs a WhatsApp number.");
    if (isOrg && input.contacts.some((c) => !c.name)) return setError("Every contact needs a name.");

    startTransition(async () => {
      const res = client ? await updateClient(client.id, input) : await createClient(input);
      if (res.error) setError(res.error);
      else onDone(isEdit ? "Client updated." : "Client created.");
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit client" : "New client"}>
      <form onSubmit={submit} className="space-y-4">
        {/* Type toggle */}
        <div>
          <div className="mb-1.5 text-sm font-medium">Client type</div>
          <div className="inline-flex rounded-md border border-input p-0.5">
            {(["individual", "organisation"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Field label={isOrg ? "Organisation name" : "Full name"} htmlFor="name" required>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isOrg ? "e.g. Dropyn Trading LLC" : "e.g. Ama Boateng"}
            required
          />
        </Field>

        {isOrg ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">Contacts</div>
            {contacts.map((c, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">{i === 0 ? "Primary contact" : `Contact ${i + 1}`}</span>
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setContacts((cs) => cs.filter((_, idx) => idx !== i))}
                      className="text-xs text-muted-foreground hover:text-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Field label="Contact name" htmlFor={`c-name-${i}`} required>
                  <Input id={`c-name-${i}`} value={c.name} onChange={(e) => patchContact(i, { name: e.target.value })} placeholder="e.g. Kwaku Owusu" required />
                </Field>
                <ContactNumbers i={i} c={c} patch={patchContact} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setContacts((cs) => [...cs, emptyContact()])}>
              + Add another contact
            </Button>
          </div>
        ) : (
          <ContactNumbers i={0} c={contacts[0]} patch={patchContact} />
        )}

        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner /> : null}
            {isEdit ? "Save changes" : "Create client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ContactNumbers({
  i,
  c,
  patch,
}: {
  i: number;
  c: ContactDraft;
  patch: (i: number, patch: Partial<ContactDraft>) => void;
}) {
  return (
    <>
      <Field label="WhatsApp" htmlFor={`c-wa-${i}`} required hint="Used for notifications and OTP lookup.">
        <Input id={`c-wa-${i}`} value={c.whatsapp} onChange={(e) => patch(i, { whatsapp: e.target.value })} placeholder="+233 24 000 0000" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone" htmlFor={`c-ph-${i}`}>
          <Input id={`c-ph-${i}`} value={c.phone} onChange={(e) => patch(i, { phone: e.target.value })} placeholder="+233 20 000 0000" />
        </Field>
        <Field label="Email" htmlFor={`c-em-${i}`}>
          <Input id={`c-em-${i}`} type="email" value={c.email} onChange={(e) => patch(i, { email: e.target.value })} placeholder="name@example.com" />
        </Field>
      </div>
    </>
  );
}
