"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BoardInbox as Inbox } from "@/lib/api";
import { markInboxRead } from "@/lib/boards/actions";
import { plainText } from "@/lib/boards/marks";
import { when } from "@/lib/boards/view";
import { useToast } from "@/components/ui/toast";

/**
 * What clients said and drew on boards since you last marked it read (docs/BOARDS.md, "The
 * inbox"). Each comment opens its board on that comment. This is the owner's place; an
 * assistant reading `boards:inbox` keeps its own.
 */
export function BoardInbox({ inbox }: { inbox: Inbox }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const count = inbox.comments.length + inbox.drawings.length;

  const markRead = async () => {
    setBusy(true);
    const r = await markInboxRead(inbox.newest);
    setBusy(false);
    if (!r.ok) toast(r.error, "danger");
    else router.refresh();
  };

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-semibold">
          New from clients{count ? <span className="ml-2 tabular-nums text-muted-foreground">{count}</span> : null}
        </h2>
        {count ? (
          <button
            type="button"
            disabled={busy}
            onClick={markRead}
            className="h-9 rounded-md border border-input px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Mark these read
          </button>
        ) : null}
      </div>

      {count === 0 ? (
        <p className="px-4 py-5 text-sm text-muted-foreground">
          Nothing new{inbox.seenUntil ? ` since ${when(inbox.seenUntil)}` : ""}.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {inbox.comments.map((c, i) => (
            <li key={`c${i}`}>
              <Link
                href={`/admin/boards/${c.board.id}?pin=${c.pin.id}`}
                className="block px-4 py-3 hover:bg-muted"
              >
                <p className="text-sm">
                  <span className="font-semibold">{c.author}</span>
                  <span className="text-muted-foreground">
                    {c.pin.firstComment ? " commented" : " replied"} on {c.where.frameTitle ?? "the canvas"}
                    {c.where.anchor?.kind === "element" && c.where.anchor.label ? `, "${c.where.anchor.label.slice(0, 40)}"` : ""}
                    {c.where.anchor?.kind === "area" ? ", an area" : ""}
                  </span>
                  <span className="text-subtle"> · {when(c.createdAt)}</span>
                </p>
                <p className="mt-1 line-clamp-2 text-[15px] leading-snug">{c.body}</p>
                <p className="mt-1 text-xs text-subtle">
                  {c.board.title}
                  {c.board.client ? ` · ${c.board.client}` : ""} · comment {c.pin.number}
                </p>
              </Link>
            </li>
          ))}
          {inbox.drawings.length ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              {inbox.drawings.length} {inbox.drawings.length === 1 ? "drawing" : "drawings"}:{" "}
              {inbox.drawings
                .slice(0, 6)
                .map((d) => `${d.author}, a ${d.kind}${d.text ? ` "${plainText(d.text).slice(0, 30)}"` : ""} on ${d.board.title}`)
                .join("; ")}
              {inbox.drawings.length > 6 ? "; and more" : ""}
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
