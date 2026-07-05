"use client";

import * as React from "react";
import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
  /**
   * When true, apply view-only deterrents: block the context menu, image drag, and text
   * selection so the preview can't be trivially saved. This is deterrence, not true DRM —
   * a determined viewer can always screenshot; the visible watermark is the real protection.
   */
  protect?: boolean;
}

/** Full-screen image viewer. Click the backdrop or press Esc to close. */
export function PreviewLightbox({ src, alt, open, onClose, protect = false }: Props) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      onContextMenu={protect ? (e) => e.preventDefault() : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div
        className={protect ? "relative max-h-[88vh] max-w-[92vw] select-none" : "relative max-h-[88vh] max-w-[92vw]"}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={1200}
          unoptimized
          draggable={!protect}
          onDragStart={protect ? (e) => e.preventDefault() : undefined}
          className="h-auto max-h-[88vh] w-auto rounded-lg object-contain"
          style={protect ? { WebkitUserSelect: "none", userSelect: "none" } : undefined}
        />
      </div>
    </div>
  );
}
