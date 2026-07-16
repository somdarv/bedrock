"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/states";
import type { LineItem } from "@/lib/api";
import { addLineItem, updateLineItem, type LineItemFormState } from "@/lib/packages/actions";
import { formatCedis } from "@/lib/utils";

const initial: LineItemFormState = {};

interface Props {
  open: boolean;
  onClose: () => void;
  packageId: string;
  item?: LineItem;
  /** Fixed-pricing package: line items are scope only, so no qty/price. */
  fixed?: boolean;
  onDone: (message: string) => void;
}

export function LineItemModal({ open, onClose, packageId, item, fixed = false, onDone }: Props) {
  const isEdit = Boolean(item);
  const action = React.useMemo(
    () =>
      item
        ? updateLineItem.bind(null, packageId, item.id)
        : addLineItem.bind(null, packageId),
    [packageId, item],
  );
  const [state, formAction, pending] = React.useActionState(action, initial);

  const [quantity, setQuantity] = React.useState(item?.quantity ?? 1);
  const [unitPrice, setUnitPrice] = React.useState(item?.unitPrice ?? 0);

  React.useEffect(() => {
    if (state.ok) onDone(isEdit ? "Line item updated." : "Line item added.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  const lineTotal = (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit line item" : "Add line item"}>
      <form action={formAction} className="space-y-4">
        <Field
          label={fixed ? "Scope item" : "Description"}
          htmlFor="description"
          required
          error={state.fieldErrors?.description}
          hint={fixed ? "Shown to the client as scope. The fixed total is unaffected." : undefined}
        >
          <Input
            id="description"
            name="description"
            placeholder={fixed ? "e.g. Logo design" : "e.g. Logo design"}
            defaultValue={item?.description}
            required
          />
        </Field>

        {fixed ? (
          // Scope-only: keep a valid qty/price so the record stays consistent, hidden from the admin.
          <>
            <input type="hidden" name="quantity" value={1} />
            <input type="hidden" name="unitPrice" value={0} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity" htmlFor="quantity" required error={state.fieldErrors?.quantity}>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </Field>
              <Field label="Unit price (₵)" htmlFor="unitPrice" required error={state.fieldErrors?.unitPrice}>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  required
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Line total</span>
              <span className="font-semibold">{formatCedis(lineTotal)}</span>
            </div>
          </>
        )}

        {state.error && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner /> : null}
            {isEdit ? "Save" : "Add"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
