"use client";

import * as React from "react";
import type { Deliverable, DeliverableFolder } from "@/lib/api/types";
import { baseName, formatBytes, plural, shortDate } from "@/lib/files/tree";
import { cn } from "@/lib/utils";
import { CheckIcon, FileGlyph, FolderFilledIcon, LockIcon, MoreIcon, PlayIcon } from "./icons";
import type { MenuAnchor } from "./drive-ui";

/**
 * Tiles and rows. The item a person has picked turns to ink, the one dark panel in the
 * document language, so a selection reads from across the room and never as a thin outline.
 */

export type ItemKind = "file" | "folder";

export interface ItemHandlers {
  /** A click or tap on the item body. `open` is a double-click, Enter, or a tap on a phone. */
  onPress(kind: ItemKind, id: string, e: React.MouseEvent | React.KeyboardEvent, open: boolean): void;
  onToggle(kind: ItemKind, id: string, e: React.MouseEvent): void;
  /** A finger held on an item: start a selection with it, as Drive does on a phone. */
  onLongPress(kind: ItemKind, id: string): void;
  onMenu(kind: ItemKind, id: string, anchor: MenuAnchor): void;
  onRename(kind: ItemKind, id: string, name: string | null): void;
  onDragStart(kind: ItemKind, id: string, e: React.DragEvent): void;
  /** Folders only: something is being dragged over, or dropped on, this folder. */
  onDragOverFolder(id: string, e: React.DragEvent): void;
  onDropFolder(id: string, e: React.DragEvent): void;
  onDragLeaveFolder(id: string): void;
}

interface Common {
  selected: boolean;
  renaming: boolean;
  selectable: boolean;
  editable: boolean;
  /** Always show the tick box: touch screens, or once anything is selected. */
  showCheck: boolean;
  handlers: ItemHandlers;
}

/* ------------------------------------------------------------------ pieces */

function Check({
  checked,
  visible,
  onToggle,
  label,
  className,
}: {
  checked: boolean;
  visible: boolean;
  onToggle: (e: React.MouseEvent) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Select ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(e);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={cn(
        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity duration-150",
        "focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--doc-ink)]",
        // Hidden boxes take no taps: Tailwind's hover only exists on devices that can hover, so on
        // a phone the box stays out of the way until a selection has begun.
        visible || checked
          ? "opacity-100"
          : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full transition-colors duration-150",
          // The ring is what makes it legible on a pale thumbnail; the drop shadow alone was not.
          checked
            ? "bg-[#12110f] text-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.92),0_1px_3px_rgba(18,17,15,0.35)]"
            : "bg-white shadow-[0_0_0_1.5px_rgba(18,17,15,0.42),0_1px_2px_rgba(18,17,15,0.18)]",
        )}
      >
        {checked && <CheckIcon className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

function MenuButton({ label, onOpen, className }: { label: string; onOpen: (a: MenuAnchor) => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`Actions for ${label}`}
      aria-haspopup="menu"
      onClick={(e) => {
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        onOpen({ x: r.right, y: r.bottom + 4, alignRight: true });
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={cn(
        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--doc-ink-soft)] transition-colors duration-150",
        "hover:bg-[var(--doc-fill-strong)] hover:text-[var(--doc-ink)] focus-visible:outline-2 focus-visible:outline-[var(--doc-ink)]",
        className,
      )}
    >
      <MoreIcon />
    </button>
  );
}

export function RenameField({
  initial,
  isFile,
  onDone,
  className,
}: {
  initial: string;
  isFile: boolean;
  onDone: (name: string | null) => void;
  className?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const done = React.useRef(false);

  React.useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    // Select the name without its extension, as Drive and Finder do.
    input.setSelectionRange(0, isFile ? baseName(initial).length : initial.length);
  }, [initial, isFile]);

  const finish = (value: string | null) => {
    if (done.current) return;
    done.current = true;
    const trimmed = value?.trim();
    onDone(trimmed && trimmed !== initial ? trimmed : null);
  };

  return (
    <input
      ref={ref}
      defaultValue={initial}
      aria-label="New name"
      maxLength={isFile ? 255 : 120}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") finish(e.currentTarget.value);
        if (e.key === "Escape") finish(null);
      }}
      onBlur={(e) => finish(e.currentTarget.value)}
      className={cn(
        // Fixed colours, not tokens: a selected (inverted) tile must still show a light field.
        "relative z-10 h-9 w-full min-w-0 rounded-[0.625rem] bg-white px-2.5 text-base text-[#12110f] outline-none sm:text-sm",
        "shadow-[0_0_0_2px_#12110f]",
        className,
      )}
    />
  );
}

function Thumb({ file, variant }: { file: Deliverable; variant: "tile" | "row" }) {
  const [broken, setBroken] = React.useState(false);
  const picture = file.hasPreview && file.previewUrl && !broken;
  return (
    <>
      {picture ? (
        // A plain img: previews are already small JPEGs from the API, so the image optimiser
        // would only add a hop. Lazy, so a long folder loads what is on screen first.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.previewUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <FileGlyph filename={file.filename} type={file.type} size={variant === "tile" ? "md" : "sm"} />
      )}
      {picture && file.type === "video" && (
        <span className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#131211]/75 text-white">
          <PlayIcon className="h-3 w-3" />
        </span>
      )}
    </>
  );
}

function fileMeta(file: Deliverable) {
  if (file.processingStatus === "processing") return "Preparing preview";
  return [formatBytes(file.size), shortDate(file.createdAt)].filter(Boolean).join(" · ");
}

function StateChip({ file, owner }: { file: Deliverable; owner: boolean }) {
  if (file.archived) {
    return <Chip>Archived</Chip>;
  }
  if (file.processingStatus === "failed") {
    return <Chip>No preview</Chip>;
  }
  if (file.locked) {
    return (
      <Chip>
        <LockIcon className="h-3 w-3" />
        {owner ? "Locked" : "Unlocks when paid"}
      </Chip>
    );
  }
  return null;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fffffff0] px-2 py-0.5 text-[11px] font-medium text-[#12110f] shadow-[0_1px_2px_rgba(18,17,15,0.12)]">
      {children}
    </span>
  );
}

const surface = (selected: boolean, dropTarget = false) =>
  cn(
    "group relative transition-colors duration-150 ease-out",
    // `drive-selected` is a tint plus an inset rule (globals.css). An inset one cannot be clipped
    // by the list's rounded, overflowing container the way an outer ring is.
    selected ? "drive-selected" : dropTarget ? "drive-drop" : "",
  );

/** The invisible button that makes the whole item clickable, under the tick box and menu. */
function HitArea({
  label,
  kind,
  id,
  handlers,
  draggable,
}: {
  label: string;
  kind: ItemKind;
  id: string;
  handlers: ItemHandlers;
  draggable: boolean;
}) {
  const hold = React.useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const held = React.useRef(false);
  const lastPointer = React.useRef<string>("mouse");

  const release = () => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  };
  const longPress = () => {
    release();
    held.current = true;
    handlers.onLongPress(kind, id);
  };

  return (
    <button
      type="button"
      aria-label={label}
      draggable={draggable}
      onDragStart={(e) => {
        const card = e.currentTarget.parentElement;
        if (card) e.dataTransfer.setDragImage(card, 24, 24);
        handlers.onDragStart(kind, id, e);
      }}
      onPointerDown={(e) => {
        lastPointer.current = e.pointerType;
        held.current = false;
        if (e.pointerType !== "touch") return;
        release();
        hold.current = { timer: setTimeout(longPress, 480), x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        // A scroll is not a hold.
        const h = hold.current;
        if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 10) release();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onClick={(e) => {
        if (held.current) {
          held.current = false;
          return;
        }
        handlers.onPress(kind, id, e, false);
      }}
      onDoubleClick={(e) => handlers.onPress(kind, id, e, true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handlers.onPress(kind, id, e, true);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        // Android turns a long press into a context menu; treat it as the hold it was.
        if (lastPointer.current === "touch") {
          if (!held.current) longPress();
          return;
        }
        handlers.onMenu(kind, id, { x: e.clientX, y: e.clientY });
      }}
      className="absolute inset-0 z-0 rounded-[inherit] [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--doc-ink)]"
    />
  );
}

/* ------------------------------------------------------------------ folders */

export const FolderCard = React.memo(function FolderCard({
  folder,
  stats,
  dropTarget,
  ...c
}: Common & { folder: DeliverableFolder; stats: { files: number; bytes: number }; dropTarget: boolean }) {
  const h = c.handlers;
  return (
    <div
      onDragOver={(e) => h.onDragOverFolder(folder.id, e)}
      onDragLeave={() => h.onDragLeaveFolder(folder.id)}
      onDrop={(e) => h.onDropFolder(folder.id, e)}
      className={cn(
        surface(c.selected, dropTarget),
        "flex min-h-[4.5rem] items-center gap-1 rounded-[var(--doc-r-inset)] py-2.5 pr-1 pl-2",
        !c.selected && !dropTarget && "bg-[var(--doc-fill)] hover:bg-[var(--doc-fill-strong)]",
      )}
    >
      <HitArea label={`Folder ${folder.name}`} kind="folder" id={folder.id} handlers={h} draggable={c.editable} />
      {c.selectable ? (
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <FolderFilledIcon
            className={cn(
              "absolute text-[var(--doc-ink)] transition-opacity duration-150",
              (c.showCheck || c.selected) ? "opacity-0" : "group-hover:opacity-0",
            )}
          />
          <Check
            checked={c.selected}
            visible={c.showCheck}
            label={folder.name}
            onToggle={(e) => h.onToggle("folder", folder.id, e)}
          />
        </span>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
          <FolderFilledIcon className="text-[var(--doc-ink)]" />
        </span>
      )}
      <div className="pointer-events-none min-w-0 flex-1 pr-1">
        {c.renaming ? (
          <div className="pointer-events-auto">
            <RenameField initial={folder.name} isFile={false} onDone={(n) => h.onRename("folder", folder.id, n)} />
          </div>
        ) : (
          <p className="line-clamp-2 text-[15px] leading-snug font-semibold text-[var(--doc-ink)]">
            {folder.name}
          </p>
        )}
        {!c.renaming && (
          <p className="mt-0.5 text-xs whitespace-nowrap text-[var(--doc-ink-soft)]">
            {stats.files === 0 ? "Empty" : `${plural(stats.files, "file")} · ${formatBytes(stats.bytes)}`}
          </p>
        )}
      </div>
      <MenuButton label={folder.name} onOpen={(a) => h.onMenu("folder", folder.id, a)} />
    </div>
  );
});

export const FolderRow = React.memo(function FolderRow({
  folder,
  stats,
  dropTarget,
  ...c
}: Common & { folder: DeliverableFolder; stats: { files: number; bytes: number }; dropTarget: boolean }) {
  const h = c.handlers;
  return (
    <div
      role="row"
      onDragOver={(e) => h.onDragOverFolder(folder.id, e)}
      onDragLeave={() => h.onDragLeaveFolder(folder.id)}
      onDrop={(e) => h.onDropFolder(folder.id, e)}
      className={cn(surface(c.selected, dropTarget), "drive-row drive-grid-row")}
    >
      <HitArea label={`Folder ${folder.name}`} kind="folder" id={folder.id} handlers={h} draggable={c.editable} />
      <RowLead selectable={c.selectable} checked={c.selected} showCheck={c.showCheck} label={folder.name} onToggle={(e) => h.onToggle("folder", folder.id, e)}>
        <FolderFilledIcon className="text-[var(--doc-ink)]" />
      </RowLead>
      <div className="pointer-events-none min-w-0">
        {c.renaming ? (
          <div className="pointer-events-auto">
            <RenameField initial={folder.name} isFile={false} onDone={(n) => h.onRename("folder", folder.id, n)} />
          </div>
        ) : (
          <p className="truncate text-[15px] font-semibold text-[var(--doc-ink)] sm:text-sm">{folder.name}</p>
        )}
        <p className="truncate text-xs text-[var(--doc-ink-soft)] md:hidden">
          {stats.files === 0 ? "Empty" : `${plural(stats.files, "file")} · ${formatBytes(stats.bytes)}`}
        </p>
      </div>
      <Cell className="hidden md:block">{stats.files === 0 ? "" : formatBytes(stats.bytes)}</Cell>
      <Cell className="hidden lg:block">{shortDate(folder.updatedAt)}</Cell>
      <Cell className="hidden md:block">{stats.files === 0 ? "Empty" : plural(stats.files, "file")}</Cell>
      <MenuButton label={folder.name} onOpen={(a) => h.onMenu("folder", folder.id, a)} />
    </div>
  );
});

/* -------------------------------------------------------------------- files */

export const FileCard = React.memo(function FileCard({
  file,
  owner,
  ...c
}: Common & { file: Deliverable; owner: boolean }) {
  const h = c.handlers;
  return (
    <div
      className={cn(
        surface(c.selected),
        "drive-item flex flex-col rounded-[var(--doc-r-inset)] p-1.5",
        !c.selected && "bg-[var(--doc-fill-quiet)] hover:bg-[var(--doc-fill)]",
      )}
    >
      <HitArea label={`${file.filename}, ${fileMeta(file)}`} kind="file" id={file.id} handlers={h} draggable={c.editable} />
      <div className="pointer-events-none relative aspect-[4/3] overflow-hidden rounded-[0.8rem] bg-[var(--doc-paper)]">
        <Thumb file={file} variant="tile" />
        <span className="absolute bottom-2 left-2 flex gap-1">
          <StateChip file={file} owner={owner} />
        </span>
      </div>
      {c.selectable && (
        <Check
          className="absolute top-2.5 left-2.5"
          checked={c.selected}
          visible={c.showCheck}
          label={file.filename}
          onToggle={(e) => h.onToggle("file", file.id, e)}
        />
      )}
      <div className="flex items-center gap-1 pt-1.5 pl-2">
        <div className="pointer-events-none min-w-0 flex-1 py-1">
          {c.renaming ? (
            <div className="pointer-events-auto">
              <RenameField initial={file.filename} isFile onDone={(n) => h.onRename("file", file.id, n)} />
            </div>
          ) : (
            <p className="truncate text-sm leading-snug font-medium text-[var(--doc-ink)]" title={file.filename}>
              {file.filename}
            </p>
          )}
          {!c.renaming && <p className="truncate text-xs text-[var(--doc-ink-soft)] tabular-nums">{fileMeta(file)}</p>}
        </div>
        <MenuButton label={file.filename} onOpen={(a) => h.onMenu("file", file.id, a)} className="-mr-0.5" />
      </div>
    </div>
  );
});

export const FileRow = React.memo(function FileRow({
  file,
  owner,
  ...c
}: Common & { file: Deliverable; owner: boolean }) {
  const h = c.handlers;
  return (
    <div role="row" className={cn(surface(c.selected), "drive-row drive-grid-row")}>
      <HitArea label={`${file.filename}, ${fileMeta(file)}`} kind="file" id={file.id} handlers={h} draggable={c.editable} />
      <RowLead selectable={c.selectable} checked={c.selected} showCheck={c.showCheck} label={file.filename} onToggle={(e) => h.onToggle("file", file.id, e)}>
        <span className="relative block h-10 w-10 overflow-hidden rounded-[0.625rem] bg-[var(--doc-fill-strong)]">
          <Thumb file={file} variant="row" />
        </span>
      </RowLead>
      <div className="pointer-events-none min-w-0">
        {c.renaming ? (
          <div className="pointer-events-auto">
            <RenameField initial={file.filename} isFile onDone={(n) => h.onRename("file", file.id, n)} />
          </div>
        ) : (
          <p className="truncate text-[15px] font-medium text-[var(--doc-ink)] sm:text-sm" title={file.filename}>
            {file.filename}
          </p>
        )}
        <p className="truncate text-xs text-[var(--doc-ink-soft)] tabular-nums md:hidden">{fileMeta(file)}</p>
      </div>
      <Cell className="hidden tabular-nums md:block">{formatBytes(file.size)}</Cell>
      <Cell className="hidden tabular-nums lg:block">{shortDate(file.createdAt)}</Cell>
      <div className="pointer-events-none hidden md:block">
        {file.processingStatus === "processing" ? (
          <Cell>Preparing preview</Cell>
        ) : (
          <StateChip file={file} owner={owner} />
        )}
      </div>
      <MenuButton label={file.filename} onOpen={(a) => h.onMenu("file", file.id, a)} />
    </div>
  );
});

function RowLead({
  selectable,
  checked,
  showCheck,
  label,
  onToggle,
  children,
}: {
  selectable: boolean;
  checked: boolean;
  showCheck: boolean;
  label: string;
  onToggle: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  if (!selectable) {
    return <span className="pointer-events-none flex h-10 w-10 items-center justify-center">{children}</span>;
  }
  return (
    <span className="relative flex h-10 w-10 items-center justify-center">
      <span
        className={cn(
          "pointer-events-none flex items-center justify-center transition-opacity duration-150",
          showCheck || checked ? "opacity-0" : "group-hover:opacity-0",
        )}
      >
        {children}
      </span>
      <Check className="absolute" checked={checked} visible={showCheck} label={label} onToggle={onToggle} />
    </span>
  );
}

function Cell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("pointer-events-none truncate text-[13px] text-[var(--doc-ink-soft)]", className)}>{children}</span>;
}
