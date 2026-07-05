"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState, Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { PreviewLightbox } from "@/components/media/preview-lightbox";
import type { Deliverable, WorkPackage } from "@/lib/api";
import { deleteDeliverable, purgeDeliverables, uploadDeliverable } from "@/lib/packages/actions";

const ACCEPT = "image/*,application/pdf,video/*";

export function DeliverablesSection({ pkg }: { pkg: WorkPackage }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = React.useTransition();
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [pendingRemove, startRemove] = React.useTransition();
  const [purging, startPurge] = React.useTransition();
  const [confirmPurge, setConfirmPurge] = React.useState(false);
  const [previewing, setPreviewing] = React.useState<Deliverable | null>(null);

  const anyProcessing = pkg.deliverables.some((d) => d.processingStatus === "processing");
  const hasStoredOriginals = pkg.deliverables.some((d) => !d.archived);

  // Poll while the mock/backend pipeline finishes generating previews.
  React.useEffect(() => {
    if (!anyProcessing) return;
    const t = setTimeout(() => router.refresh(), 3500);
    return () => clearTimeout(t);
  }, [anyProcessing, router]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startUpload(async () => {
      const res = await uploadDeliverable(pkg.id, fd);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Upload received — generating preview…", "success");
        router.refresh();
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function purge() {
    startPurge(async () => {
      const res = await purgeDeliverables(pkg.id);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Originals removed from storage.", "success");
        router.refresh();
      }
      setConfirmPurge(false);
    });
  }

  function remove(d: Deliverable) {
    setRemovingId(d.id);
    startRemove(async () => {
      const res = await deleteDeliverable(pkg.id, d.id);
      if (res.error) toast(res.error, "danger");
      else {
        toast("Deliverable removed.", "success");
        router.refresh();
      }
      setRemovingId(null);
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Deliverables</h2>
        <div className="flex items-center gap-2">
          {hasStoredOriginals && pkg.deliverables.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setConfirmPurge(true)} disabled={purging}>
              Free up storage
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={onFile}
            disabled={uploading}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Spinner /> : null}
            Upload original
          </Button>
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Originals are watermarked into previews automatically. Clean files stay locked until the
        balance reaches GHS&nbsp;0.
      </p>

      {pkg.deliverables.length === 0 ? (
        <EmptyState
          title="No deliverables yet"
          description="Upload an image, PDF, or video. A watermarked preview is generated for the client."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pkg.deliverables.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-lg border bg-surface">
              <div className="relative flex h-40 items-center justify-center bg-muted">
                {d.processingStatus === "ready" && d.previewUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreviewing(d)}
                    className="group absolute inset-0 cursor-pointer"
                    aria-label={`Preview ${d.filename}`}
                  >
                    <Image
                      src={d.previewUrl}
                      alt={`${d.filename} preview`}
                      fill
                      unoptimized
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-xs font-medium uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:bg-ink/30 group-hover:opacity-100">
                      Preview
                    </span>
                  </button>
                ) : d.processingStatus === "failed" ? (
                  <span className="text-sm text-danger">Processing failed</span>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner /> Processing…
                  </span>
                )}
                <div className="absolute right-2 top-2">
                  <Badge variant={d.archived ? "default" : d.locked ? "warning" : "success"}>
                    {d.archived ? "Archived" : d.locked ? "Locked" : "Unlocked"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{d.filename}</div>
                  <Badge className="mt-1">{d.type.toUpperCase()}</Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(d)}
                  disabled={pendingRemove && removingId === d.id}
                >
                  {pendingRemove && removingId === d.id ? <Spinner /> : "Remove"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin gets a clean, full-size look at the preview (no client-side deterrents). */}
      <PreviewLightbox
        open={Boolean(previewing?.previewUrl)}
        src={previewing?.previewUrl ?? ""}
        alt={previewing?.filename ?? "Preview"}
        onClose={() => setPreviewing(null)}
      />

      <Modal
        open={confirmPurge}
        onClose={() => !purging && setConfirmPurge(false)}
        title="Free up storage?"
        description="Deletes the original files from storage to save space. Previews stay, but the client can no longer download. Do this after the work is delivered and paid for."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmPurge(false)} disabled={purging}>
              Cancel
            </Button>
            <Button variant="danger" onClick={purge} disabled={purging}>
              {purging ? <Spinner /> : null}
              Delete originals
            </Button>
          </>
        }
      />
    </div>
  );
}
