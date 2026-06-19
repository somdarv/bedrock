"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/states";
import type { Client } from "@/lib/api";
import {
  createClient,
  updateClient,
  type ClientFormState,
} from "@/lib/clients/actions";

const initial: ClientFormState = {};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Provided in edit mode; omitted for create. */
  client?: Client;
  onDone: (message: string) => void;
}

export function ClientFormModal({ open, onClose, client, onDone }: Props) {
  const isEdit = Boolean(client);
  const action = React.useMemo(
    () => (client ? updateClient.bind(null, client.id) : createClient),
    [client],
  );
  const [state, formAction, pending] = React.useActionState(action, initial);

  React.useEffect(() => {
    if (state.ok) onDone(isEdit ? "Client updated." : "Client created.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit client" : "New client"}
      description="Clients can have many work packages."
    >
      <form action={formAction} className="space-y-4">
        <Field label="Name" htmlFor="name" required error={state.fieldErrors?.name}>
          <Input id="name" name="name" defaultValue={client?.name} required />
        </Field>
        <Field
          label="WhatsApp"
          htmlFor="whatsapp"
          required
          hint="Used for notifications and OTP lookup."
          error={state.fieldErrors?.whatsapp}
        >
          <Input
            id="whatsapp"
            name="whatsapp"
            placeholder="+233…"
            defaultValue={client?.whatsapp}
            required
          />
        </Field>
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
        </Field>

        {state.error && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

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
