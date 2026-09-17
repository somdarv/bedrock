"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Deliverable, DeliverableFolder, FileSelection, WorkPackage } from "@/lib/api/types";
import { useToast } from "@/components/ui/toast";
import {
  createFolder,
  deleteItems,
  freeUpStorage,
  moveItems,
  renameFile,
  renameFolder,
} from "@/lib/files/actions";
import {
  childFolders,
  filesIn,
  folderStats,
  formatBytes,
  pathTo,
  plural,
  totalBytes,
  withDescendants,
} from "@/lib/files/tree";
import { useUploads, type UploadRequest } from "@/lib/files/use-uploads";
import { cn } from "@/lib/utils";
import {
  Dialog,
  FieldPill,
  IconButton,
  Menu,
  Pill,
  useFinePointer,
  useStoredState,
  type MenuAnchor,
  type MenuItem,
} from "./drive-ui";
import { FileCard, FileRow, FolderCard, FolderRow, type ItemHandlers, type ItemKind } from "./file-items";
import { FileViewer, type ViewerSource } from "./file-viewer";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
  FolderPlusIcon,
  GridIcon,
  ListIcon,
  LockIcon,
  MoreIcon,
  MoveIcon,
  OpenIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from "./icons";
import { MoveDialog } from "./move-dialog";
import { UploadTray } from "./upload-tray";

/**
 * A work package's files, arranged the way Google Drive arranges them: folders first, then
 * files, a path you can click back along, and a selection you act on together.
 *
 * `admin` is the operator's view: upload (files or whole folders, by button or by dropping),
 * new folder, rename, move (menu or drag), delete, download as ZIP. `client` is the portal:
 * browse, preview, and download what is unlocked, a file or a folder at a time.
 *
 * On a desktop a click selects and a double-click opens, as in Drive. On a phone a tap opens,
 * and the tick box starts a selection.
 */

type Crumb = { label: string; href: string };

export type FileBrowserProps =
  | {
      mode: "admin";
      pkg: WorkPackage;
      layout: "page" | "embedded";
      /** Links shown before the package in the path, e.g. Files / Ama Boateng. */
      trail?: Crumb[];
      initialFolderId?: string | null;
    }
  | {
      mode: "client";
      pkg: WorkPackage;
      slug: string;
      apiBase: string;
      initialFolderId?: string | null;
    };

const SORTS = ["name", "newest", "size"] as const;
type Sort = (typeof SORTS)[number];
const VIEWS = ["grid", "list"] as const;
const DRAG_TYPE = "application/x-bedrock-files";

const key = (kind: ItemKind, id: string) => `${kind === "file" ? "f" : "d"}:${id}`;
const split = (k: string): [ItemKind, string] => [k[0] === "f" ? "file" : "folder", k.slice(2)];

function toSelection(keys: Iterable<string>): FileSelection {
  const out: FileSelection = { fileIds: [], folderIds: [] };
  for (const k of keys) {
    const [kind, id] = split(k);
    (kind === "file" ? out.fileIds : out.folderIds).push(id);
  }
  return out;
}

export function FileBrowser(props: FileBrowserProps) {
  const { pkg, mode } = props;
  const admin = mode === "admin";
  const embedded = props.mode === "admin" && props.layout === "embedded";
  const router = useRouter();
  const { toast } = useToast();
  const fine = useFinePointer();

  /* ------------------------------------------------------------ data */

  const [data, setData] = React.useState({ folders: pkg.folders ?? [], files: pkg.deliverables });
  React.useEffect(() => {
    setData({ folders: pkg.folders ?? [], files: pkg.deliverables });
  }, [pkg]);
  const dataRef = React.useRef(data);
  dataRef.current = data;
  const { folders, files } = data;

  const apply = React.useCallback((next: WorkPackage) => {
    setData({ folders: next.folders ?? [], files: next.deliverables });
  }, []);

  // Previews are made after upload; look again until they are all in.
  const processing = files.some((f) => f.processingStatus === "processing");
  React.useEffect(() => {
    if (!processing) return;
    const t = setTimeout(() => router.refresh(), 4000);
    return () => clearTimeout(t);
  }, [processing, files, router]);

  /* ------------------------------------------------------ navigation */

  const [folderId, setFolderId] = React.useState<string | null>(props.initialFolderId ?? null);
  const current = folderId ? folders.find((f) => f.id === folderId) ?? null : null;
  // A folder deleted from under us sends the view back to the root.
  React.useEffect(() => {
    if (folderId && !folders.some((f) => f.id === folderId)) setFolderId(null);
  }, [folderId, folders]);

  const go = React.useCallback((id: string | null) => {
    setFolderId(id);
    setSelected(new Set());
    setQuery("");
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("folder", id);
    else url.searchParams.delete("folder");
    window.history.pushState(window.history.state, "", url);
  }, []);

  React.useEffect(() => {
    const onPop = () => setFolderId(new URL(window.location.href).searchParams.get("folder"));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* --------------------------------------------------- view settings */

  const [view, setView] = useStoredState("bedrock:files-view", "grid", VIEWS);
  const [sort, setSort] = useStoredState<Sort>("bedrock:files-sort", "name", SORTS);
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();

  const path = React.useMemo(() => pathTo(folders, folderId), [folders, folderId]);

  const shownFolders = React.useMemo(() => {
    const list = q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : childFolders(folders, folderId);
    return [...list].sort((a, b) =>
      sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
  }, [folders, folderId, q, sort]);

  const shownFiles = React.useMemo(() => {
    const list = q ? files.filter((f) => f.filename.toLowerCase().includes(q)) : filesIn(files, folderId);
    return [...list].sort((a, b) =>
      sort === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : sort === "size"
          ? (b.size ?? 0) - (a.size ?? 0)
          : a.filename.localeCompare(b.filename, undefined, { numeric: true }),
    );
  }, [files, folderId, q, sort]);

  const stats = React.useMemo(() => {
    const map = new Map<string, { files: number; bytes: number; locked: number }>();
    for (const f of shownFolders) map.set(f.id, folderStats(folders, files, f.id));
    return map;
  }, [shownFolders, folders, files]);

  const scope = React.useMemo(() => {
    if (!folderId) return files;
    const inside = withDescendants(folders, [folderId]);
    return files.filter((f) => f.folderId && inside.has(f.folderId));
  }, [files, folders, folderId]);
  const lockedCount = scope.filter((f) => f.locked && !f.archived).length;
  const openCount = scope.filter((f) => !f.locked && !f.archived).length;

  /* ------------------------------------------------------- selection */

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const anchor = React.useRef<string | null>(null);
  const order = React.useMemo(
    () => [...shownFolders.map((f) => key("folder", f.id)), ...shownFiles.map((f) => key("file", f.id))],
    [shownFolders, shownFiles],
  );
  // Drop anything that is no longer on screen.
  React.useEffect(() => {
    setSelected((s) => {
      const visible = new Set(order);
      const next = new Set([...s].filter((k) => visible.has(k)));
      return next.size === s.size ? s : next;
    });
  }, [order]);

  /* ---------------------------------------------------- transient ui */

  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [menu, setMenu] = React.useState<{ key: string; anchor: MenuAnchor } | null>(null);
  const [pageMenu, setPageMenu] = React.useState<MenuAnchor | null>(null);
  const [uploadMenu, setUploadMenu] = React.useState<MenuAnchor | null>(null);
  const [moving, setMoving] = React.useState<string[] | null>(null);
  const [deleting, setDeleting] = React.useState<string[] | null>(null);
  const [purging, setPurging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [viewer, setViewer] = React.useState<number | null>(null);
  const [dropFolder, setDropFolder] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const dragDepth = React.useRef(0);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const folderInput = React.useRef<HTMLInputElement>(null);

  /* --------------------------------------------------------- uploads */

  const refreshSoon = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploads = useUploads(pkg.id, (next) => {
    apply(next);
    // The activity log and nav badges live outside this component; refresh once things settle.
    if (refreshSoon.current) clearTimeout(refreshSoon.current);
    refreshSoon.current = setTimeout(() => router.refresh(), 1500);
  });

  const rootLabel = admin ? pkg.title : "All files";
  const nameOf = (id: string | null) =>
    id ? dataRef.current.folders.find((f) => f.id === id)?.name ?? "folder" : rootLabel;

  /** Queue files, making any folders their paths need first (a dropped or chosen folder). */
  const queue = React.useCallback(
    async (entries: { file: File; dirs: string[] }[], into: string | null) => {
      if (!admin || entries.length === 0) return;
      const ids = new Map<string, string | null>([["", into]]);
      let known = dataRef.current.folders;
      const paths = [...new Set(entries.flatMap((e) => e.dirs.map((_, i) => e.dirs.slice(0, i + 1).join("/"))))].sort(
        (a, b) => a.split("/").length - b.split("/").length,
      );
      for (const p of paths) {
        const parts = p.split("/");
        const name = parts[parts.length - 1];
        const parent = ids.get(parts.slice(0, -1).join("/")) ?? null;
        const existing = known.find((f) => f.parentId === parent && f.name === name);
        if (existing) {
          ids.set(p, existing.id);
          continue;
        }
        const res = await createFolder(pkg.id, name, parent);
        if (!res.ok || !res.pkg.createdFolderId) {
          toast(res.ok ? "Could not create a folder for the upload." : res.error, "danger");
          return;
        }
        apply(res.pkg);
        known = res.pkg.folders;
        ids.set(p, res.pkg.createdFolderId);
      }
      const requests: UploadRequest[] = entries.map((e) => {
        const target = ids.get(e.dirs.join("/")) ?? into;
        return { file: e.file, folderId: target, destination: target ? (known.find((f) => f.id === target)?.name ?? "folder") : rootLabel };
      });
      uploads.add(requests);
    },
    [admin, pkg.id, apply, toast, uploads, rootLabel],
  );

  const onPicked = (list: FileList | null, withDirs: boolean) => {
    if (!list) return;
    const entries = [...list].map((file) => {
      const rel = withDirs ? (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "" : "";
      const parts = rel.split("/").filter(Boolean);
      return { file, dirs: parts.slice(0, -1) };
    });
    void queue(entries, folderId);
  };

  /* --------------------------------------------------------- actions */

  const openItem = React.useCallback(
    (kind: ItemKind, id: string) => {
      if (kind === "folder") go(id);
      else {
        const i = shownFiles.findIndex((f) => f.id === id);
        if (i >= 0) setViewer(i);
      }
    },
    [go, shownFiles],
  );

  const downloadHref = React.useCallback(
    (f: Deliverable): string | null => {
      if (f.archived) return null;
      if (props.mode === "admin") return `/api/admin/deliverables/${pkg.id}/${f.id}?download=1`;
      return f.locked ? null : `${props.apiBase}/api/p/${props.slug}/deliverables/${f.id}/download`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pkg.id, props.mode],
  );

  const startDownload = React.useCallback(
    (keys: string[]) => {
      const sel = toSelection(keys);
      if (sel.folderIds.length === 0 && sel.fileIds.length === 1) {
        const f = dataRef.current.files.find((x) => x.id === sel.fileIds[0]);
        const href = f && downloadHref(f);
        if (href) window.location.assign(href);
        else toast(f?.locked ? "That file unlocks when the balance is paid." : "That file is no longer stored.");
        return;
      }
      if (props.mode === "client") {
        const folder = sel.folderIds[0];
        window.location.assign(`/p/${props.slug}/zip${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`);
        return;
      }
      // A form post hands the download to the browser's own manager, with its progress bar.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/api/admin/packages/${pkg.id}/files/zip`;
      for (const [name, ids] of [["fileIds", sel.fileIds], ["folderIds", sel.folderIds]] as const) {
        for (const id of ids) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = id;
          form.appendChild(input);
        }
      }
      document.body.appendChild(form);
      form.submit();
      form.remove();
      toast("Your download is starting. Large folders take a moment.");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pkg.id, props.mode, downloadHref, toast],
  );

  const downloadAll = () => {
    if (props.mode === "client") startDownload(folderId ? [key("folder", folderId)] : []);
    else if (folderId) startDownload([key("folder", folderId)]);
    else window.location.assign(`/api/admin/packages/${pkg.id}/files/zip`);
  };

  const rename = React.useCallback(
    async (kind: ItemKind, id: string, name: string | null) => {
      setRenaming(null);
      if (!name) return;
      const before = dataRef.current;
      setData({
        folders: kind === "folder" ? before.folders.map((f) => (f.id === id ? { ...f, name } : f)) : before.folders,
        files: kind === "file" ? before.files.map((f) => (f.id === id ? { ...f, filename: name } : f)) : before.files,
      });
      const res = kind === "folder" ? await renameFolder(pkg.id, id, name) : await renameFile(pkg.id, id, name);
      if (res.ok) apply(res.pkg);
      else {
        setData(before);
        toast(res.error, "danger");
      }
    },
    [pkg.id, apply, toast],
  );

  const move = React.useCallback(
    async (keys: string[], to: string | null) => {
      const sel = toSelection(keys);
      const before = dataRef.current;
      setData({
        folders: before.folders.map((f) => (sel.folderIds.includes(f.id) ? { ...f, parentId: to } : f)),
        files: before.files.map((f) => (sel.fileIds.includes(f.id) ? { ...f, folderId: to } : f)),
      });
      setSelected(new Set());
      const res = await moveItems(pkg.id, sel, to);
      if (res.ok) {
        apply(res.pkg);
        toast(`Moved ${plural(keys.length, "item")} to ${nameOf(to)}.`, "success");
      } else {
        setData(before);
        toast(res.error, "danger");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pkg.id, apply, toast],
  );

  const remove = async (keys: string[]) => {
    const sel = toSelection(keys);
    const before = dataRef.current;
    const gone = withDescendants(before.folders, sel.folderIds);
    setBusy(true);
    setData({
      folders: before.folders.filter((f) => !gone.has(f.id)),
      files: before.files.filter((f) => !sel.fileIds.includes(f.id) && !(f.folderId && gone.has(f.folderId))),
    });
    setDeleting(null);
    setSelected(new Set());
    const res = await deleteItems(pkg.id, sel);
    setBusy(false);
    if (res.ok) {
      apply(res.pkg);
      toast(`Deleted ${plural(keys.length, "item")}.`, "success");
      router.refresh();
    } else {
      setData(before);
      toast(res.error, "danger");
    }
  };

  const newFolder = async () => {
    setBusy(true);
    const res = await createFolder(pkg.id, "Untitled folder", folderId);
    setBusy(false);
    if (!res.ok) return toast(res.error, "danger");
    apply(res.pkg);
    if (res.pkg.createdFolderId) {
      setQuery("");
      setRenaming(key("folder", res.pkg.createdFolderId));
    }
  };

  const purge = async () => {
    setBusy(true);
    const res = await freeUpStorage(pkg.id);
    setBusy(false);
    setPurging(false);
    if (!res.ok) return toast(res.error, "danger");
    apply(res.pkg);
    toast("Originals removed from storage. Previews stay.", "success");
    router.refresh();
  };

  /* -------------------------------------------------- item handlers */

  const selectedRef = React.useRef(selected);
  selectedRef.current = selected;
  const orderRef = React.useRef(order);
  orderRef.current = order;
  const fineRef = React.useRef(fine);
  fineRef.current = fine;

  const handlers: ItemHandlers = React.useMemo(
    () => ({
      onPress(kind, id, e, open) {
        const k = key(kind, id);
        if (open || !admin) return openItem(kind, id);
        const sel = selectedRef.current;
        if (!fineRef.current) {
          if (sel.size === 0) return openItem(kind, id);
          const next = new Set(sel);
          if (next.has(k)) next.delete(k);
          else next.add(k);
          return setSelected(next);
        }
        const mouse = e as React.MouseEvent;
        if (mouse.shiftKey && anchor.current) {
          const list = orderRef.current;
          const a = list.indexOf(anchor.current);
          const b = list.indexOf(k);
          if (a >= 0 && b >= 0) {
            const [from, to] = a < b ? [a, b] : [b, a];
            return setSelected(new Set([...sel, ...list.slice(from, to + 1)]));
          }
        }
        anchor.current = k;
        if (mouse.metaKey || mouse.ctrlKey) {
          const next = new Set(sel);
          if (next.has(k)) next.delete(k);
          else next.add(k);
          return setSelected(next);
        }
        setSelected(new Set([k]));
      },
      onLongPress(kind, id) {
        if (!admin) return;
        const k = key(kind, id);
        anchor.current = k;
        setSelected((s) => new Set([...s, k]));
        navigator.vibrate?.(10);
      },
      onToggle(kind, id) {
        const k = key(kind, id);
        anchor.current = k;
        setSelected((s) => {
          const next = new Set(s);
          if (next.has(k)) next.delete(k);
          else next.add(k);
          return next;
        });
      },
      onMenu(kind, id, a) {
        const k = key(kind, id);
        // Right-clicking outside the selection acts on that item alone, as in Drive. A finger
        // opening the menu is not choosing anything, so leave the selection as it is.
        if (admin && fineRef.current && !selectedRef.current.has(k)) setSelected(new Set([k]));
        setMenu({ key: k, anchor: a });
      },
      onRename: (kind, id, name) => void rename(kind, id, name),
      onDragStart(kind, id, e) {
        const k = key(kind, id);
        const keys = selectedRef.current.has(k) ? [...selectedRef.current] : [k];
        e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(keys));
        e.dataTransfer.effectAllowed = "move";
      },
      onDragOverFolder(id, e) {
        if (!admin) return;
        const types = e.dataTransfer.types;
        if (!types.includes(DRAG_TYPE) && !types.includes("Files")) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = types.includes("Files") ? "copy" : "move";
        setDropFolder(id);
      },
      onDragLeaveFolder(id) {
        setDropFolder((d) => (d === id ? null : d));
      },
      onDropFolder(id, e) {
        if (!admin) return;
        e.preventDefault();
        e.stopPropagation();
        setDropFolder(null);
        setDragging(false);
        dragDepth.current = 0;
        void handleDrop(e.dataTransfer, id);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin, openItem, rename],
  );

  async function handleDrop(dt: DataTransfer, into: string | null) {
    const internal = dt.getData(DRAG_TYPE);
    if (internal) {
      const keys = (JSON.parse(internal) as string[]).filter((k) => k !== key("folder", into ?? ""));
      const sel = toSelection(keys);
      if (into && sel.folderIds.some((m) => pathTo(dataRef.current.folders, into).some((f) => f.id === m))) {
        return toast("A folder cannot go inside itself.", "danger");
      }
      if (keys.length > 0) void move(keys, into);
      return;
    }
    const entries = await readDrop(dt);
    if (entries.length === 0) return;
    await queue(entries, into);
  }

  /* ------------------------------------------------------- keyboard */

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!admin) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, [role=dialog], [role=menu]")) return;
    const keys = [...selected];
    if ((e.key === "Delete" || e.key === "Backspace") && keys.length > 0) {
      e.preventDefault();
      setDeleting(keys);
    } else if (e.key === "F2" && keys.length === 1) {
      e.preventDefault();
      setRenaming(keys[0]);
    } else if (e.key === "Escape" && keys.length > 0) {
      setSelected(new Set());
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setSelected(new Set(order));
    }
  };

  /* ------------------------------------------------------------ menus */

  const menuItems = (k: string): MenuItem[] => {
    const [kind, id] = split(k);
    const group = admin && selected.has(k) && selected.size > 1 ? [...selected] : [k];
    const many = group.length > 1;
    const file = kind === "file" ? files.find((f) => f.id === id) : undefined;
    const inside = kind === "folder" ? stats.get(id) : undefined;
    // A client can only take a folder that holds something unlocked.
    const canDownload =
      many ||
      (file
        ? downloadHref(file) !== null
        : inside
          ? (admin ? inside.files : inside.files - inside.locked) > 0
          : false);

    const items: MenuItem[] = [];
    if (!many) {
      items.push({
        label: kind === "folder" ? "Open" : "Preview",
        icon: <OpenIcon />,
        onSelect: () => openItem(kind, id),
      });
    }
    items.push({
      label: many ? `Download ${group.length} items` : kind === "folder" ? "Download as ZIP" : "Download",
      icon: <DownloadIcon />,
      disabled: !canDownload,
      onSelect: () => startDownload(group),
    });
    if (!admin) return items;
    if (!many) {
      items.push({ label: "Rename", icon: <PencilIcon />, hint: "F2", onSelect: () => setRenaming(k) });
    }
    if (!fine && !selected.has(k)) {
      // A phone has no shift-click; this, or a long press, starts picking several.
      items.push({
        label: "Select",
        icon: <CheckIcon />,
        onSelect: () => setSelected((s) => new Set([...s, k])),
      });
    }
    items.push({ label: "Move to", icon: <MoveIcon />, onSelect: () => setMoving(group) });
    items.push({
      label: many ? `Delete ${group.length} items` : "Delete",
      icon: <TrashIcon />,
      hint: "Del",
      danger: true,
      onSelect: () => setDeleting(group),
    });
    return items;
  };

  const menuTitle = (k: string) => {
    const [kind, id] = split(k);
    if (admin && selected.has(k) && selected.size > 1) return `${selected.size} items`;
    return kind === "file"
      ? files.find((f) => f.id === id)?.filename ?? "File"
      : folders.find((f) => f.id === id)?.name ?? "Folder";
  };

  /* ------------------------------------------------------------ viewer */

  const viewerSource = React.useCallback(
    (f: Deliverable): ViewerSource => {
      const download = downloadHref(f);
      if (props.mode === "admin") {
        if (f.archived) {
          return { src: f.hasPreview ? f.previewUrl : null, as: f.hasPreview ? "image" : null, downloadHref: null };
        }
        const original = `/api/admin/deliverables/${pkg.id}/${f.id}`;
        return {
          src: f.type === "file" ? null : original,
          as: f.type === "file" ? null : f.type,
          downloadHref: download,
        };
      }
      return {
        src: f.hasPreview ? f.previewUrl : null,
        as: f.hasPreview ? "image" : null,
        downloadHref: download,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pkg.id, props.mode, downloadHref],
  );

  /* ------------------------------------------------------------ render */

  const selection = [...selected];
  const showCheck = selection.length > 0;
  const heading = current?.name ?? (admin ? (embedded ? "Files" : pkg.title) : "Your files");
  const empty = shownFolders.length === 0 && shownFiles.length === 0;
  const storedOriginals = files.some((f) => !f.archived);
  const common = { selectable: admin, editable: admin && fine, showCheck, handlers };
  const trail: Crumb[] = props.mode === "admin" ? props.trail ?? [] : [];

  const crumbs: { label: string; id: string | null }[] = [
    { label: rootLabel, id: null },
    ...path.slice(0, -1).map((f) => ({ label: f.name, id: f.id })),
  ];

  return (
    <section
      aria-label="Files"
      onKeyDown={onKeyDown}
      onDragEnter={(e) => {
        if (!admin || !e.dataTransfer.types.includes("Files")) return;
        dragDepth.current++;
        setDragging(true);
      }}
      onDragLeave={() => {
        if (!admin) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDragOver={(e) => {
        if (admin && (e.dataTransfer.types.includes("Files") || e.dataTransfer.types.includes(DRAG_TYPE))) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        if (!admin) return;
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        void handleDrop(e.dataTransfer, folderId);
      }}
      className={cn(
        "drive relative rounded-[var(--doc-r-panel)] bg-[var(--doc-paper)] text-[var(--doc-ink-body)]",
        embedded ? "p-4 sm:p-6" : "p-4 sm:p-7 lg:p-8",
      )}
    >
      {/* ----- Heading ----- */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {(trail.length > 0 || folderId || q) && (
            <nav aria-label="Folder path" className="-ml-1.5 mb-1.5 flex flex-wrap items-center gap-y-0.5 text-sm">
              {trail.map((c) => (
                <React.Fragment key={c.href}>
                  <Link href={c.href} className="rounded-full px-1.5 py-0.5 text-[var(--doc-ink-soft)] hover:bg-[var(--doc-fill)] hover:text-[var(--doc-ink)]">
                    {c.label}
                  </Link>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-[var(--doc-ink-soft)]" />
                </React.Fragment>
              ))}
              {(folderId || q) &&
                (q ? [{ label: rootLabel, id: null }] : crumbs).map((c) => (
                  <React.Fragment key={c.id ?? "root"}>
                    <CrumbButton
                      label={c.label}
                      active={dropFolder === `crumb:${c.id ?? "root"}`}
                      onOpen={() => go(c.id)}
                      onDragOver={(e) => {
                        if (!admin || !e.dataTransfer.types.includes(DRAG_TYPE)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDropFolder(`crumb:${c.id ?? "root"}`);
                      }}
                      onDragLeave={() => setDropFolder(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDropFolder(null);
                        void handleDrop(e.dataTransfer, c.id);
                      }}
                    />
                    <ChevronRightIcon className="h-3.5 w-3.5 text-[var(--doc-ink-soft)]" />
                  </React.Fragment>
                ))}
            </nav>
          )}
          <div className="flex items-center gap-1.5">
            {folderId && !q && (
              <IconButton label="Back" size="sm" className="-ml-2 lg:hidden" onClick={() => go(current?.parentId ?? null)}>
                <ChevronLeftIcon />
              </IconButton>
            )}
            <h2
              className={cn(
                "min-w-0 truncate font-display font-semibold tracking-[-0.025em] text-[var(--doc-ink)]",
                embedded || !admin ? "text-[1.5rem] leading-tight" : "text-[1.75rem] leading-tight sm:text-[var(--doc-t-h2)]",
              )}
            >
              {q ? `Results for “${query.trim()}”` : heading}
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--doc-ink-soft)] tabular-nums">
            {scope.length === 0 ? (
              "Nothing here yet"
            ) : (
              <>
                {plural(scope.length, "file")} · {formatBytes(totalBytes(scope))}
                {admin && lockedCount > 0 && ` · ${lockedCount} locked until paid`}
              </>
            )}
          </p>
        </div>

        {admin ? (
          <div className="flex flex-wrap items-center gap-2">
            {embedded && (
              <Link
                href={`/admin/packages/${pkg.id}/files${folderId ? `?folder=${folderId}` : ""}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-[var(--doc-ink-body)] hover:bg-[var(--doc-fill)] sm:h-10"
              >
                Full view <ArrowUpRightIcon className="h-4 w-4" />
              </Link>
            )}
            <Pill tone="fill" onClick={newFolder} disabled={busy}>
              <FolderPlusIcon className="h-4 w-4" />
              New folder
            </Pill>
            <Pill
              tone="ink"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setUploadMenu({ x: r.right, y: r.bottom + 6, alignRight: true });
              }}
              aria-haspopup="menu"
            >
              <UploadIcon className="h-4 w-4" />
              Upload
            </Pill>
            <IconButton
              label="More actions"
              tone="fill"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setPageMenu({ x: r.right, y: r.bottom + 6, alignRight: true });
              }}
            >
              <MoreIcon />
            </IconButton>
          </div>
        ) : openCount > 0 ? (
          <Pill tone="ink" onClick={downloadAll}>
            <DownloadIcon className="h-4 w-4" />
            {folderId ? "Download this folder" : "Download all"}
          </Pill>
        ) : null}
      </header>

      {!admin && lockedCount > 0 && (
        <div className="mt-5 flex items-start gap-3 rounded-[var(--doc-r-inset)] bg-[var(--doc-fill)] px-5 py-4">
          <LockIcon className="mt-0.5 text-[var(--doc-ink)]" />
          <p className="text-sm leading-relaxed text-[var(--doc-ink-body)]">
            <strong className="font-semibold text-[var(--doc-ink)]">
              {lockedCount === scope.length ? "These files" : `${plural(lockedCount, "file")}`} unlock when the balance is paid.
            </strong>{" "}
            You can look at the previews now.
          </p>
        </div>
      )}

      {/* ----- Toolbar, or the selection bar in its place ----- */}
      <div
        className="sticky z-20 -mx-2 mt-5 bg-[var(--doc-paper)] px-2 py-2"
        // Sticks flush under the admin header, whose scroller has top padding; 0 on the portal.
        style={{ top: "var(--drive-sticky-top, 0px)" }}
      >
        {admin && selection.length > 0 ? (
          <div className="doc-invert drive-fade flex min-h-12 items-center gap-1 rounded-full bg-[var(--doc-fill-ink)] py-1 pr-1.5 pl-2 text-white max-sm:fixed max-sm:inset-x-2 max-sm:bottom-[calc(0.5rem+env(safe-area-inset-bottom))] max-sm:z-50 max-sm:shadow-[0_12px_32px_-8px_rgba(18,17,15,0.45)]">
            <IconButton label="Clear selection" size="sm" className="text-white hover:bg-white/10" onClick={() => setSelected(new Set())}>
              <CloseIcon className="h-4 w-4" />
            </IconButton>
            <p className="mr-auto pl-1 text-sm font-medium tabular-nums" aria-live="polite">
              {selection.length} selected
            </p>
            <BarAction label="Download" onClick={() => startDownload(selection)}>
              <DownloadIcon className="h-4 w-4" />
            </BarAction>
            <BarAction label="Move" onClick={() => setMoving(selection)}>
              <MoveIcon className="h-4 w-4" />
            </BarAction>
            {selection.length === 1 && (
              <BarAction label="Rename" onClick={() => setRenaming(selection[0])}>
                <PencilIcon className="h-4 w-4" />
              </BarAction>
            )}
            <BarAction label="Delete" onClick={() => setDeleting(selection)}>
              <TrashIcon className="h-4 w-4" />
            </BarAction>
          </div>
        ) : null}
        <div className={cn("flex items-center gap-2", admin && selection.length > 0 && "max-sm:flex sm:hidden")}>
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--doc-ink-soft)]" />
            <FieldPill
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={admin ? "Search this project" : "Search your files"}
              aria-label="Search files"
              className="pl-10"
            />
          </div>
          <label className="relative hidden sm:block">
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 appearance-none rounded-full bg-[var(--doc-fill)] pr-9 pl-4 text-sm font-medium text-[var(--doc-ink)] outline-none hover:bg-[var(--doc-fill-strong)] focus-visible:shadow-[0_0_0_2px_var(--doc-ink)]"
            >
              <option value="name">Name</option>
              <option value="newest">Newest first</option>
              <option value="size">Largest first</option>
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--doc-ink-soft)]" aria-hidden>
              <path d="m6 9.5 6 6 6-6" />
            </svg>
          </label>
          <div className="flex shrink-0 items-center rounded-full bg-[var(--doc-fill)] p-1" role="group" aria-label="View">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                aria-label={v === "grid" ? "Grid view" : "List view"}
                title={v === "grid" ? "Grid view" : "List view"}
                onClick={() => setView(v)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 sm:h-8 sm:w-8",
                  view === v
                    ? "bg-[var(--doc-paper)] text-[var(--doc-ink)] shadow-[0_1px_3px_rgba(18,17,15,0.14)]"
                    : "text-[var(--doc-ink-soft)] hover:text-[var(--doc-ink)]",
                )}
              >
                {v === "grid" ? <GridIcon className="h-4 w-4" /> : <ListIcon className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ----- Contents ----- */}
      <div
        className="relative mt-3 min-h-40"
        onClick={(e) => {
          if (admin && fine && e.target === e.currentTarget) setSelected(new Set());
        }}
      >
        {empty ? (
          <EmptyState
            admin={admin}
            searching={Boolean(q)}
            query={query.trim()}
            place={current?.name ?? null}
            onUpload={() => fileInput.current?.click()}
          />
        ) : view === "grid" ? (
          <div className="space-y-6" onClick={(e) => admin && fine && e.target === e.currentTarget && setSelected(new Set())}>
            {shownFolders.length > 0 && (
              <div>
                <GroupLabel>Folders</GroupLabel>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {shownFolders.map((f) => (
                    <FolderCard
                      key={f.id}
                      folder={f}
                      stats={stats.get(f.id) ?? { files: 0, bytes: 0 }}
                      selected={selected.has(key("folder", f.id))}
                      renaming={renaming === key("folder", f.id)}
                      dropTarget={dropFolder === f.id}
                      {...common}
                    />
                  ))}
                </div>
              </div>
            )}
            {shownFiles.length > 0 && (
              <div>
                <GroupLabel>Files</GroupLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] sm:gap-3">
                  {shownFiles.map((f) => (
                    <FileCard
                      key={f.id}
                      file={f}
                      owner={admin}
                      selected={selected.has(key("file", f.id))}
                      renaming={renaming === key("file", f.id)}
                      {...common}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div role="table" aria-label="Files" className="drive-list overflow-hidden rounded-[var(--doc-r-inset)]">
            <div role="row" className="drive-grid-row drive-head min-h-10 bg-[var(--doc-fill-strong)] text-xs font-semibold text-[var(--doc-ink)]">
              <span />
              <span role="columnheader">Name</span>
              <span role="columnheader" className="hidden md:block">Size</span>
              <span role="columnheader" className="hidden lg:block">Added</span>
              <span role="columnheader" className="hidden md:block">Status</span>
              <span />
            </div>
            {shownFolders.map((f) => (
              <FolderRow
                key={f.id}
                folder={f}
                stats={stats.get(f.id) ?? { files: 0, bytes: 0 }}
                selected={selected.has(key("folder", f.id))}
                renaming={renaming === key("folder", f.id)}
                dropTarget={dropFolder === f.id}
                {...common}
              />
            ))}
            {shownFiles.map((f) => (
              <FileRow
                key={f.id}
                file={f}
                owner={admin}
                selected={selected.has(key("file", f.id))}
                renaming={renaming === key("file", f.id)}
                {...common}
              />
            ))}
          </div>
        )}

        {dragging && (
          <div className="drive-fade pointer-events-none absolute -inset-2 z-30 flex items-center justify-center rounded-[var(--doc-r-inset)] bg-[rgba(231,228,221,0.94)]">
            <div className="text-center">
              <UploadIcon className="mx-auto h-8 w-8 text-[var(--doc-ink)]" />
              <p className="mt-2 font-display text-lg font-semibold text-[var(--doc-ink)]">
                Drop to upload into {dropFolder && !dropFolder.startsWith("crumb:") ? nameOf(dropFolder) : nameOf(folderId)}
              </p>
              <p className="text-sm text-[var(--doc-ink-soft)]">Files and whole folders, up to 2 GB each</p>
            </div>
          </div>
        )}
      </div>

      {/* ----- Hidden pickers ----- */}
      {admin && (
        <>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              onPicked(e.target.files, false);
              e.target.value = "";
            }}
          />
          <input
            ref={folderInput}
            type="file"
            hidden
            multiple
            // Non-standard but supported by every current browser: pick a whole folder.
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            onChange={(e) => {
              onPicked(e.target.files, true);
              e.target.value = "";
            }}
          />
        </>
      )}

      {/* ----- Overlays ----- */}
      <Menu
        anchor={menu?.anchor ?? null}
        title={menu ? menuTitle(menu.key) : ""}
        items={menu ? menuItems(menu.key) : []}
        onClose={() => setMenu(null)}
      />
      <Menu
        anchor={uploadMenu}
        title="Upload"
        onClose={() => setUploadMenu(null)}
        items={[
          { label: "Upload files", icon: <UploadIcon />, onSelect: () => fileInput.current?.click() },
          { label: "Upload a folder", icon: <FolderPlusIcon />, onSelect: () => folderInput.current?.click() },
        ]}
      />
      <Menu
        anchor={pageMenu}
        title={pkg.title}
        onClose={() => setPageMenu(null)}
        items={[
          {
            label: folderId ? "Download this folder" : "Download everything",
            icon: <DownloadIcon />,
            disabled: scope.every((f) => f.archived),
            onSelect: downloadAll,
          },
          {
            label: "Free up storage",
            icon: <TrashIcon />,
            danger: true,
            disabled: !storedOriginals,
            onSelect: () => setPurging(true),
          },
        ]}
      />

      <MoveDialog
        open={moving !== null}
        title={moving && moving.length === 1 ? `Move “${menuTitle(moving[0])}”` : `Move ${moving?.length ?? 0} items`}
        rootLabel={rootLabel}
        folders={folders}
        moving={moving ? toSelection(moving).folderIds : []}
        start={folderId}
        onClose={() => setMoving(null)}
        onMove={(to) => {
          const keys = moving ?? [];
          setMoving(null);
          void move(keys, to);
        }}
      />

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={deleting && deleting.length === 1 ? `Delete “${menuTitle(deleting[0])}”?` : `Delete ${deleting?.length ?? 0} items?`}
        footer={
          <>
            <Pill tone="ghost" onClick={() => setDeleting(null)}>
              Keep them
            </Pill>
            <Pill tone="danger" disabled={busy} onClick={() => deleting && remove(deleting)} data-autofocus>
              Delete
            </Pill>
          </>
        }
      >
        <p className="text-[15px] leading-relaxed">
          {deleteSummary(deleting ?? [], folders, files)} The client loses access too. This cannot be undone.
        </p>
      </Dialog>

      <Dialog
        open={purging}
        onClose={() => setPurging(false)}
        title="Free up storage?"
        footer={
          <>
            <Pill tone="ghost" onClick={() => setPurging(false)}>
              Cancel
            </Pill>
            <Pill tone="danger" disabled={busy} onClick={purge}>
              Delete originals
            </Pill>
          </>
        }
      >
        <p className="text-[15px] leading-relaxed">
          Every original in {pkg.title} is removed from storage ({formatBytes(totalBytes(files.filter((f) => !f.archived)))}).
          Previews and the file list stay. The client can no longer download. Do this once the work is delivered and paid for.
        </p>
      </Dialog>

      <FileViewer
        files={shownFiles}
        index={viewer}
        onIndex={setViewer}
        onClose={() => setViewer(null)}
        source={viewerSource}
        protect={!admin}
      />

      {admin && (
        <UploadTray
          items={uploads.items}
          active={uploads.active}
          onCancel={uploads.cancel}
          onRetry={uploads.retry}
          onClear={uploads.clear}
          onCancelAll={uploads.cancelAll}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------ fragments */

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 px-1 text-[13px] font-semibold text-[var(--doc-ink-soft)]">{children}</h3>;
}

function BarAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
    >
      {children}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function CrumbButton({
  label,
  active,
  onOpen,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  label: string;
  active: boolean;
  onOpen: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "max-w-[14rem] truncate rounded-full px-1.5 py-0.5 text-[var(--doc-ink-soft)] transition-colors hover:bg-[var(--doc-fill)] hover:text-[var(--doc-ink)]",
        active && "bg-[var(--doc-fill-strong)] text-[var(--doc-ink)]",
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({
  admin,
  searching,
  query,
  place,
  onUpload,
}: {
  admin: boolean;
  searching: boolean;
  query: string;
  place: string | null;
  onUpload: () => void;
}) {
  const [title, body] = searching
    ? [`Nothing called “${query}”`, "Search looks through every folder in this project."]
    : admin
      ? place
        ? [`${place} is empty`, "Drop files or a whole folder here, or upload from your computer."]
        : ["No files yet", "Drop the finished work here, or upload it from your computer. The client sees it on their project page."]
      : place
        ? [`${place} is empty`, "Files added here will show up for you straight away."]
        : ["No files yet", "Your finished work will appear here as soon as it is ready."];

  return (
    <div className="flex flex-col items-center rounded-[var(--doc-r-inset)] bg-[var(--doc-fill-quiet)] px-6 py-14 text-center sm:py-20">
      <p className="font-display text-xl font-semibold tracking-[-0.02em] text-[var(--doc-ink)]">{title}</p>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--doc-ink-soft)]">{body}</p>
      {admin && !searching && (
        <Pill tone="ink" className="mt-6" onClick={onUpload}>
          <UploadIcon className="h-4 w-4" />
          Upload files
        </Pill>
      )}
    </div>
  );
}

function deleteSummary(keys: string[], folders: DeliverableFolder[], files: Deliverable[]) {
  const sel = toSelection(keys);
  const inside = withDescendants(folders, sel.folderIds);
  const count =
    sel.fileIds.length + files.filter((f) => f.folderId && inside.has(f.folderId) && !sel.fileIds.includes(f.id)).length;
  const bytes = totalBytes(
    files.filter((f) => sel.fileIds.includes(f.id) || (f.folderId && inside.has(f.folderId))),
  );
  if (sel.folderIds.length === 0) {
    return `${plural(count, "file")} (${formatBytes(bytes)}) will be removed from storage.`;
  }
  return `${plural(sel.folderIds.length, "folder")} and ${plural(count, "file")} inside (${formatBytes(bytes)}) will be removed from storage.`;
}

/* ------------------------------------------------------- drop reading */

type Entry = { file: File; dirs: string[] };

/** Files from a drop, walking into any folders so their structure comes along. */
async function readDrop(dt: DataTransfer): Promise<Entry[]> {
  const items = [...dt.items].filter((i) => i.kind === "file");
  const roots = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
  if (roots.length === 0) return [...dt.files].map((file) => ({ file, dirs: [] }));

  const out: Entry[] = [];
  const walk = async (entry: FileSystemEntry, dirs: string[]): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      out.push({ file, dirs });
      return;
    }
    if (!entry.isDirectory) return;
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries hands back at most ~100 at a time; keep asking until it returns none.
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
      if (batch.length === 0) break;
      for (const child of batch) await walk(child, [...dirs, entry.name]);
    }
  };
  for (const root of roots) await walk(root, []);
  return out;
}
