"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { addClientContact } from "@/lib/clients/actions";

/**
 * "Add contact" on the client page — appends a single (secondary) contact and sends only that
 * contact their own welcome. Existing contacts are left untouched, so no one is re-messaged.
 * Separate from the full client edit form, which replaces the whole contact list.
 */
export function AddContactButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Add contact
      </Button>
      {open && <AddContactModal clientId={clientId} onClose={() => setOpen(false)} />}
    </>
  );
}

function AddContactModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter the contact's name.");
    if (!whatsapp.trim()) return setError("Enter a WhatsApp number for the welcome message.");

    startTransition(async () => {
      const res = await addClientContact(clientId, {
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      if (res.error) {
        setError(res.error);
      } else {
        toast(`${res.name ?? "Contact"} added and welcomed.`, "success");
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a contact"
      description="Adds another contact to this client. They get their own welcome message; the existing contacts aren't messaged again."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" htmlFor="ac-name" required>
          <Input
            id="ac-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ama Mensah"
            required
          />
        </Field>
        <Field label="WhatsApp" htmlFor="ac-whatsapp" required hint="Where the welcome is sent.">
          <Input
            id="ac-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+233 24 000 0000"
            required
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="ac-phone" hint="Optional.">
            <Input
              id="ac-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 24 000 0000"
            />
          </Field>
          <Field label="Email" htmlFor="ac-email" hint="Optional.">
            <Input
              id="ac-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </Field>
        </div>

        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner /> : null}
            Add &amp; welcome
          </Button>
        </div>
      </form>
    </Modal>
  );
}
