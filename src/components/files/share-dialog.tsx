"use client";

import * as React from "react";
import type { FileShare, FileShareInput, ShareKind, WorkPackage } from "@/lib/api/types";
import { useToast } from "@/components/ui/toast";
import { shareItem, stopSharing, updateShare, type FilesResult } from "@/lib/files/actions";
import { copyText, daysFromNow, hasEnded, shareUrl, whenText } from "@/lib/files/share";
import { cn } from "@/lib/utils";
import { Dialog, Pill } from "./drive-ui";
import { CheckIcon, LinkIcon, ShareIcon } from "./icons";

/** What is being shared, worked out by the browser from what it already holds. */
export interface ShareTarget {
  kind: ShareKind;
  fileId: string | null;
  folderId: string | null;
  name: string;
  /** Files under it that the payment gate still holds back from the client. */
  locked: number;
}

const WHAT: Record<ShareKind, string> = {
  file: "this file",
  folder: "this folder and everything in it",
  project: "every file in this project",
};

/**
 * Share by link, as Drive does it: one link per file, folder or project, and anyone who has it can
 * open it without signing in. The first press makes the link. Copying it, sending it from a phone,
 * and the few settings a link has all sit in the same sheet.
 *
 * Settings change the moment they are touched; there is nothing to save.
 */
export function ShareDialog({
  packageId,
  target,
  share,
  onClose,
  onChange,
}: {
  packageId: string;
  target: ShareTarget | null;
  share: FileShare | null;
  onClose: () => void;
  onChange: (pkg: WorkPackage) => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  // What was just touched, shown at once. The server's answer replaces it. Each change sends only
  // its own setting, so a second one made before the first returns cannot undo it.
  const [draft, setDraft] = React.useState<FileShareInput>({});
  const [canSend, setCanSend] = React.useState(false);

  React.useEffect(() => setDraft({}), [share]);
  React.useEffect(() => setCopied(false), [share?.token, target?.name]);
  // Phones hand a link to WhatsApp and the rest through their share sheet. Most desktops cannot.
  React.useEffect(() => {
    setCanSend(typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const run = async (call: () => Promise<FilesResult>, done?: string) => {
    setBusy(true);
    const res = await call();
    setBusy(false);
    if (!res.ok) {
      toast(res.error, "danger");
      return false;
    }
    onChange(res.pkg);
    if (done) toast(done, "success");
    return true;
  };

  const change = async (input: FileShareInput) => {
    if (!share) return;
    setDraft((d) => ({ ...d, ...input }));
    if (!(await run(() => updateShare(packageId, share.id, input)))) setDraft({});
  };

  const url = share ? shareUrl(share.token) : "";
  const allowDownload = draft.allowDownload ?? share?.allowDownload ?? true;
  const includeLocked = draft.includeLocked ?? share?.includeLocked ?? false;
  const expiresAt = draft.expiresAt !== undefined ? draft.expiresAt : share?.expiresAt ?? null;
  const ended = hasEnded(expiresAt);

  const copy = async () => {
    try {
      await copyText(url);
      setCopied(true);
    } catch {
      toast("Could not copy. Select the link and copy it by hand.", "danger");
    }
  };

  const send = async () => {
    try {
      await navigator.share({ title: target?.name, url });
    } catch {
      // The sheet was closed without sending. Nothing to say.
    }
  };

  return (
    <Dialog
      open={target !== null}
      onClose={onClose}
      title={target ? `Share “${target.name}”` : ""}
      footer={
        share ? (
          <>
            <Pill
              tone="ghost"
              className="text-danger hover:text-danger sm:mr-auto"
              disabled={busy}
              onClick={() => void run(() => stopSharing(packageId, share.id), "Link turned off.")}
            >
              Turn off link
            </Pill>
            <Pill tone="ink" onClick={onClose}>
              Done
            </Pill>
          </>
        ) : undefined
      }
    >
      {target && !share && (
        <div className="pb-5">
          <p className="text-[15px] leading-relaxed">
            Anyone with the link can open {WHAT[target.kind]}. They do not need to sign in.
          </p>
          <Pill
            tone="ink"
            className="mt-5 w-full sm:w-auto"
            disabled={busy}
            data-autofocus
            onClick={() =>
              void run(() => shareItem(packageId, { fileId: target.fileId, folderId: target.folderId }))
            }
          >
            <LinkIcon className="h-4 w-4" />
            Create link
          </Pill>
        </div>
      )}

      {target && share && (
        <div className="pb-2">
          <div className="flex items-center gap-1 rounded-full bg-[var(--doc-fill)] py-1 pr-1 pl-4">
            <input
              readOnly
              value={url}
              aria-label="Link"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent text-base text-[var(--doc-ink)] outline-none sm:text-sm"
            />
            <Pill tone="ink" size="sm" onClick={copy} data-autofocus>
              {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </Pill>
          </div>
          {canSend && (
            <Pill tone="fill" className="mt-2 w-full" onClick={send}>
              <ShareIcon className="h-4 w-4" />
              Send the link
            </Pill>
          )}
          <p className="mt-3 px-1 text-[13px] leading-relaxed text-[var(--doc-ink-soft)]">
            {ended
              ? "This link has ended. Pick a new end date to open it again."
              : `Anyone with the link can open ${WHAT[target.kind]}.`}
          </p>

          <div className="mt-6 space-y-4">
            <Toggle label="Allow downloads" checked={allowDownload} onChange={(v) => void change({ allowDownload: v })} />
            {(target.locked > 0 || includeLocked) && (
              <Toggle
                label={
                  target.locked === 0
                    ? "Also hand over locked files"
                    : target.locked === 1
                      ? "Also hand over the locked file"
                      : `Also hand over the ${target.locked} locked files`
                }
                note="They stay locked for the client until the balance is paid."
                checked={includeLocked}
                disabled={!allowDownload}
                onChange={(v) => void change({ includeLocked: v })}
              />
            )}
            <EndsChoice expiresAt={expiresAt} onChange={(iso) => void change({ expiresAt: iso })} />
          </div>

          <p className="mt-6 px-1 text-[13px] text-[var(--doc-ink-soft)]">
            {share.lastOpenedAt ? `Last opened ${whenText(share.lastOpenedAt)}` : "Nobody has opened it yet"}
          </p>
        </div>
      )}
    </Dialog>
  );
}

function Toggle({
  label,
  note,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  note?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className={cn("min-w-0", disabled && "opacity-45")}>
        <span className="block text-[15px] font-medium text-[var(--doc-ink)] sm:text-sm">{label}</span>
        {note && <span className="mt-0.5 block text-[13px] leading-snug text-[var(--doc-ink-soft)]">{note}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-150 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)] disabled:opacity-45",
          checked ? "bg-[var(--doc-fill-ink)]" : "bg-[var(--doc-fill-strong)]",
        )}
      >
        <span
          className={cn(
            "absolute left-1 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(18,17,15,0.25)]",
            "transition-transform duration-150 ease-out motion-reduce:transition-none",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

/** When the link stops working. Picking a length counts from now. */
function EndsChoice({
  expiresAt,
  disabled,
  onChange,
}: {
  expiresAt: string | null;
  disabled?: boolean;
  onChange: (iso: string | null) => void;
}) {
  const id = React.useId();
  const ended = hasEnded(expiresAt);
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-[15px] font-medium text-[var(--doc-ink)] sm:text-sm">
        Link ends
      </label>
      <span className="relative">
        <select
          id={id}
          value={expiresAt ? "set" : "never"}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "never") onChange(null);
            else if (v !== "set") onChange(daysFromNow(Number(v)));
          }}
          className="h-10 max-w-[13rem] appearance-none truncate rounded-full bg-[var(--doc-fill)] pr-9 pl-4 text-sm font-medium text-[var(--doc-ink)] outline-none hover:bg-[var(--doc-fill-strong)] focus-visible:shadow-[0_0_0_2px_var(--doc-ink)] disabled:opacity-45"
        >
          <option value="never">Never</option>
          {expiresAt && (
            <option value="set">{ended ? `Ended ${whenText(expiresAt)}` : whenText(expiresAt).replace(/^today/, "Today")}</option>
          )}
          <option value="1">In 1 day</option>
          <option value="7">In 7 days</option>
          <option value="30">In 30 days</option>
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--doc-ink-soft)]"
          aria-hidden
        >
          <path d="m6 9.5 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
