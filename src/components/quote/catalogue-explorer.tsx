"use client";

import * as React from "react";
import { CATALOGUE, type CatalogueItem } from "@/lib/school-mis/catalogue";
import { MODULE_BY_ID } from "@/lib/school-mis/modules";
import { itemStatus, type ItemStatus } from "@/lib/school-mis/config";
import type { Configuration } from "@/lib/school-mis/pricing";

const STATUS_LABEL: Record<ItemStatus, string> = {
  included: "In your system",
  phase2: "Phase 2",
  available: "Not included",
};

function Mark({ status }: { status: ItemStatus }) {
  if (status === "included") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-1 h-3.5 w-3.5 shrink-0 text-foreground"
        aria-hidden
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "phase2") {
    return (
      <svg viewBox="0 0 24 24" className="mt-1 h-3.5 w-3.5 shrink-0 text-subtle" aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="3 3" />
      </svg>
    );
  }
  return (
    <span className="mt-[9px] h-1 w-3.5 shrink-0 rounded-full bg-border" aria-hidden />
  );
}

function ItemRow({ item, status }: { item: CatalogueItem; status: ItemStatus }) {
  const owner = item.module ? MODULE_BY_ID[item.module] : null;
  return (
    <li className="flex gap-3 py-1.5">
      <Mark status={status} />
      <span
        className={`text-sm leading-6 ${
          status === "included" ? "text-foreground" : "text-subtle"
        }`}
      >
        {item.label}
        {owner && (
          <span className="ml-2 whitespace-nowrap rounded border border-border px-1.5 py-0.5 align-middle text-[10px] uppercase tracking-wide text-subtle">
            {owner.name}
          </span>
        )}
      </span>
    </li>
  );
}

export function CatalogueExplorer({ config }: { config: Configuration }) {
  const [onlyIncluded, setOnlyIncluded] = React.useState(false);
  const [open, setOpen] = React.useState<string | null>(CATALOGUE[0].id);

  const totals = React.useMemo(() => {
    let included = 0;
    let phase2 = 0;
    let all = 0;
    for (const cat of CATALOGUE)
      for (const g of cat.groups)
        for (const item of g.items) {
          all++;
          const s = itemStatus(item, config);
          if (s === "included") included++;
          else if (s === "phase2") phase2++;
        }
    return { included, phase2, all };
  }, [config]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <span>
            <span className="font-semibold tabular-nums">{totals.included}</span>
            <span className="text-muted-foreground"> of {totals.all} included</span>
          </span>
          {totals.phase2 > 0 && (
            <span className="text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{totals.phase2}</span>{" "}
              waiting in Phase 2
            </span>
          )}
        </div>
        <button
          onClick={() => setOnlyIncluded((v) => !v)}
          className="text-xs font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground"
        >
          {onlyIncluded ? "Show everything" : "Show only what is included"}
        </button>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {CATALOGUE.map((cat) => {
          const isOpen = open === cat.id;
          const items = cat.groups.flatMap((g) => g.items);
          const included = items.filter((i) => itemStatus(i, config) === "included").length;

          return (
            <div key={cat.id}>
              <button
                onClick={() => setOpen(isOpen ? null : cat.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="font-display text-sm font-semibold">{cat.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {cat.blurb}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs tabular-nums text-subtle">
                    {included}/{items.length}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 text-subtle transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border bg-background px-5 py-4">
                  {cat.groups.map((group, gi) => {
                    const visible = group.items.filter(
                      (i) => !onlyIncluded || itemStatus(i, config) === "included",
                    );
                    if (visible.length === 0) return null;
                    return (
                      <div key={gi} className={gi > 0 ? "mt-5" : ""}>
                        {group.name && <div className="eyebrow mb-2">{group.name}</div>}
                        <ul>
                          {visible.map((item) => (
                            <ItemRow
                              key={item.id}
                              item={item}
                              status={itemStatus(item, config)}
                            />
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-subtle">
        {(["included", "phase2", "available"] as ItemStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-2">
            <Mark status={s} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  );
}
