"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/states";
import type { Client, PricingMode, WorkPackage } from "@/lib/api";
import {
  createPackage,
  updatePackage,
  type PackageFormState,
} from "@/lib/packages/actions";

const initial: PackageFormState = {};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Required in create mode to pick a client (omit when creating for a fixed client). */
  clients?: Client[];
  /** Create mode for one specific client — skips the picker and pins this client. */
  lockedClient?: { id: string; name: string };
  /** Provided in edit mode. */
  pkg?: WorkPackage;
  onDone: (message: string, packageId?: string) => void;
}

export function PackageFormModal({ open, onClose, clients, lockedClient, pkg, onDone }: Props) {
  const isEdit = Boolean(pkg);
  const action = React.useMemo(
    () => (pkg ? updatePackage.bind(null, pkg.id) : createPackage),
    [pkg],
  );
  const [state, formAction, pending] = React.useActionState(action, initial);
  const [pricingMode, setPricingMode] = React.useState<PricingMode>(pkg?.pricingMode ?? "itemized");

  React.useEffect(() => {
    if (state.ok) {
      onDone(isEdit ? "Package updated." : "Package created.", state.packageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit package" : "New work package"}
    >
      <form action={formAction} className="space-y-4">
        {!isEdit &&
          (lockedClient ? (
            <>
              <input type="hidden" name="clientId" value={lockedClient.id} />
              <Field label="Client" htmlFor="clientName">
                <Input id="clientName" value={lockedClient.name} readOnly disabled />
              </Field>
            </>
          ) : (
            <Field label="Client" htmlFor="clientId" required error={state.fieldErrors?.clientId}>
              <Select id="clientId" name="clientId" defaultValue="">
                <option value="" disabled>
                  Select a client…
                </option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          ))}

        <Field label="Title" htmlFor="title" required error={state.fieldErrors?.title}>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Brand identity pack"
            defaultValue={pkg?.title}
            required
          />
        </Field>

        <Field
          label="Pricing mode"
          htmlFor="pricingMode"
          hint={
            pricingMode === "itemized"
              ? "Total is the sum of line items."
              : "You set a single fixed total; line items stay as scope only."
          }
          error={state.fieldErrors?.pricingMode}
        >
          <Select
            id="pricingMode"
            name="pricingMode"
            value={pricingMode}
            onChange={(e) => setPricingMode(e.target.value as PricingMode)}
          >
            <option value="itemized">Itemized — sum of line items</option>
            <option value="fixed">Fixed — single total</option>
          </Select>
        </Field>

        {pricingMode === "fixed" && (
          <Field
            label="Fixed total (GHS)"
            htmlFor="totalOverride"
            required
            error={state.fieldErrors?.totalOverride}
          >
            <Input
              id="totalOverride"
              name="totalOverride"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 2500.00"
              defaultValue={pkg?.totalOverride ?? ""}
            />
          </Field>
        )}

        <Field label="Estimated delivery" htmlFor="estimatedDeliveryDate">
          <Input
            id="estimatedDeliveryDate"
            name="estimatedDeliveryDate"
            type="date"
            defaultValue={pkg?.estimatedDeliveryDate ?? ""}
          />
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
            {isEdit ? "Save changes" : "Create package"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
