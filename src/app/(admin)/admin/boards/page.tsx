import Link from "next/link";
import { CopyLink } from "@/components/admin/copy-link";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api } from "@/lib/api";
import { when } from "@/lib/boards/view";

export const metadata = { title: "Boards" };

/**
 * Boards: drawings put in front of a client by private link, with pins and talk
 * (docs/BOARDS.md). A board is made and filled on the API server with `boards:create` and
 * `boards:push`.
 */
export default async function BoardsPage() {
  const boards = await api.boards.list().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tightest md:text-4xl">Boards</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Drawings a client comments on from a private link. Their comments wait here for a reply.
        </p>
      </header>

      {boards.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-6 text-sm text-muted-foreground">
          No boards yet. Make one on the API server with{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">php artisan boards:create &quot;Laptop layouts&quot; --for=Isaac</code>.
        </p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Board</TH>
              <TH>Open comments</TH>
              <TH>Last word</TH>
              <TH>Link</TH>
            </TR>
          </THead>
          <TBody>
            {boards.map((b) => (
              <TR key={b.id}>
                <TD>
                  <Link href={`/admin/boards/${b.id}`} className="font-medium underline-offset-4 hover:underline">
                    {b.title}
                  </Link>
                  <div className="text-xs text-subtle">
                    {b.forName ? `For ${b.forName}, ` : ""}
                    {b.framesCount} {b.framesCount === 1 ? "drawing" : "drawings"}
                  </div>
                </TD>
                <TD className="tabular-nums">
                  {b.pinsOpen}
                  {b.pinsDone ? <span className="text-subtle"> and {b.pinsDone} done</span> : null}
                </TD>
                <TD className="text-muted-foreground">
                  {b.lastCommentAt ? (
                    <>
                      <span className={b.lastCommentSide === "client" ? "font-medium text-foreground" : undefined}>
                        {b.lastCommentAuthor}
                      </span>
                      , {when(b.lastCommentAt)}
                    </>
                  ) : (
                    "None"
                  )}
                </TD>
                <TD className="max-w-[22rem]">
                  {b.closedAt ? <span className="text-sm text-muted-foreground">Off</span> : <CopyLink path={`/board/${b.token}`} />}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
