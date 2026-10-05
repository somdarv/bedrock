"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SharedLink } from "@/lib/api/types";
import { useToast } from "@/components/ui/toast";
import { stopSharing } from "@/lib/files/actions";
import { projectFilesHref } from "@/lib/files/overview";
import { copyText, hasEnded, shareUrl, whenText } from "@/lib/files/share";
import { IconButton } from "./drive-ui";
import { CloseIcon, FileGlyph, FolderFilledIcon, LinkIcon } from "./icons";

/**
 * Every share link that still exists, across all projects. A link nobody remembers making is
 * still open to whoever has it, so they are all here in one place to copy again or turn off.
 */
export function SharedLinks({
  links,
  fileFolders,
}: {
  links: SharedLink[];
  /** Which folder each file sits in, so a file's row opens the folder it is in. */
  fileFolders: Map<string, string | null>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [gone, setGone] = React.useState<Set<string>>(new Set());
  const shown = links.filter((l) => !gone.has(l.id));
  if (shown.length === 0) return null;

  const turnOff = async (link: SharedLink) => {
    setGone((g) => new Set(g).add(link.id));
    const res = await stopSharing(link.packageId, link.id);
    if (!res.ok) {
      setGone((g) => {
        const next = new Set(g);
        next.delete(link.id);
        return next;
      });
      return toast(res.error, "danger");
    }
    toast(`The link to “${link.name}” is off.`, "success");
    router.refresh();
  };

  const copy = (link: SharedLink) =>
    copyText(shareUrl(link.token))
      .then(() => toast(`Link to “${link.name}” copied.`, "success"))
      .catch(() => toast("Could not copy the link.", "danger"));

  return (
    <div className="mt-8">
      <h2 className="mb-2 px-1 text-[13px] font-semibold text-[var(--doc-ink-soft)]">Shared by link</h2>
      <ul className="overflow-hidden rounded-[var(--doc-r-inset)]">
        {shown.map((link) => {
          const ended = hasEnded(link.expiresAt);
          const folder = link.kind === "file" ? fileFolders.get(link.fileId!) ?? null : link.folderId;
          const status = [
            ended ? `Ended ${whenText(link.expiresAt!)}` : link.expiresAt ? `Ends ${whenText(link.expiresAt)}` : null,
            link.allowDownload ? null : "No downloads",
            link.lastOpenedAt ? `Opened ${whenText(link.lastOpenedAt)}` : "Not opened yet",
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li key={link.id} className="flex min-h-16 items-center gap-1 pr-2 odd:bg-[var(--doc-fill-quiet)]">
              <Link
                href={projectFilesHref(link.packageId, folder)}
                className="flex min-w-0 flex-1 items-center gap-3 self-stretch py-2 pl-3 transition-colors hover:bg-[var(--doc-fill)] sm:pl-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.7rem] bg-[var(--doc-paper)]">
                  {link.kind === "file" ? (
                    <FileGlyph filename={link.name} type="file" size="sm" />
                  ) : (
                    <FolderFilledIcon className="text-[var(--doc-ink)]" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[var(--doc-ink)] sm:text-sm">
                    {link.kind === "project" ? `Every file in ${link.name}` : link.name}
                  </span>
                  <span className="block truncate text-xs text-[var(--doc-ink-soft)]">
                    {[link.clientName, link.kind === "project" ? null : link.packageTitle].filter(Boolean).join(" / ")}
                    <span className="md:hidden"> · {status}</span>
                  </span>
                </span>
                <span className="hidden shrink-0 text-right text-[13px] text-[var(--doc-ink-soft)] md:block">{status}</span>
              </Link>
              <IconButton label={`Copy the link to ${link.name}`} size="sm" onClick={() => void copy(link)}>
                <LinkIcon className="h-4 w-4" />
              </IconButton>
              <IconButton label={`Turn off the link to ${link.name}`} size="sm" onClick={() => void turnOff(link)}>
                <CloseIcon className="h-4 w-4" />
              </IconButton>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
