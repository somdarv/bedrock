"use client";

import type { Contact } from "@/lib/api";

/**
 * Choose which of a client's contacts receive a document. Organisations often have a primary and
 * one or more secondary contacts, and we usually want to reach all of them at once (a secondary
 * may see it days before the primary does). Everyone ticked gets their own WhatsApp + email.
 */
export function RecipientPicker({
  contacts,
  selected,
  onChange,
}: {
  contacts: Contact[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string, on: boolean) {
    onChange(on ? [...selected, id] : selected.filter((x) => x !== id));
  }

  if (contacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This client has no contacts yet. Add one on the client first.
      </p>
    );
  }

  return (
    <div className="space-y-1 rounded-md border border-border bg-background p-2">
      {contacts.map((c) => (
        <label
          key={c.id}
          className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
        >
          <input
            type="checkbox"
            checked={selected.includes(c.id)}
            onChange={(e) => toggle(c.id, e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="font-medium">{c.name}</span>
          {c.isPrimary && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              primary
            </span>
          )}
          <span className="ml-auto truncate text-xs text-muted-foreground">
            {c.whatsapp || c.email || c.phone}
          </span>
        </label>
      ))}
    </div>
  );
}
